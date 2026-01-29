/**
 * 依存グラフの状態管理フック
 *
 * CLAUDE.md、スキル、サブエージェント間の参照関係を解析し、
 * グラフとして可視化するためのデータを提供する
 *
 * @module hooks/useDependencyGraph
 */

import { useCallback, useMemo, useState } from 'react'

import { getFileTree, readFile } from './tauri/files'
import { isTauri } from './tauri/utils'
import { logError } from '../utils/errorMessages'
import {
  parseReferences,
  matchesKnownFile,
  getFileTypeFromPath,
  extractDescription,
} from '../utils/referenceParser'

import type {
  GraphNode,
  GraphEdge,
  NodeDetail,
  NodeType,
  EdgeType,
  ReferenceMatch,
  TreeNode,
} from '../types/graph'
import { getNodeColor, createGraphNodeId, createGraphEdgeId } from '../types/graph'
import type { FileNode } from '../types'

// ============================================================
// 型定義
// ============================================================

/**
 * ファイル情報（読み込み後）
 */
interface LoadedFile {
  path: string
  name: string
  content: string
  type: NodeType
  hasError: boolean
}

/**
 * useDependencyGraph の戻り値の型
 */
export interface UseDependencyGraphReturn {
  // 状態
  /** グラフのノード一覧 */
  nodes: GraphNode[]
  /** グラフのエッジ一覧 */
  edges: GraphEdge[]
  /** 選択中のノード */
  selectedNode: GraphNode | null
  /** 読み込み中フラグ */
  isLoading: boolean
  /** エラーメッセージ */
  error: string | null
  /** ツリー構造のルートノード一覧 */
  treeRoots: TreeNode[]
  /** 展開中のノードIDセット */
  expandedIds: Set<string>

  // アクション
  /** グラフを読み込む */
  loadGraph: () => Promise<void>
  /** ノードを選択する */
  selectNode: (node: GraphNode | null) => void
  /** ノードの詳細を取得する */
  getNodeDetail: (node: GraphNode) => NodeDetail
  /** グラフを再読み込みする */
  refresh: () => Promise<void>
  /** ツリー構造を構築する */
  buildTree: () => TreeNode[]
  /** ノードの展開/折りたたみをトグル */
  toggleExpand: (nodeId: string) => void
}

// ============================================================
// デモデータ（非Tauri環境用）
// ============================================================

const DEMO_NODES: GraphNode[] = [
  {
    id: '~/.claude/CLAUDE.md',
    label: 'CLAUDE.md',
    type: 'claude-md',
    path: '~/.claude/CLAUDE.md',
    description: 'グローバル設定ファイル',
    color: getNodeColor('claude-md'),
  },
  {
    id: '~/.claude/skills/refactor.md',
    label: 'refactor.md',
    type: 'skill',
    path: '~/.claude/skills/refactor.md',
    description: 'リファクタリングスキル',
    color: getNodeColor('skill'),
  },
  {
    id: '~/.claude/agents/code-review.md',
    label: 'code-review.md',
    type: 'subagent',
    path: '~/.claude/agents/code-review.md',
    description: 'コードレビューエージェント',
    color: getNodeColor('subagent'),
  },
]

const DEMO_EDGES: GraphEdge[] = [
  {
    id: createGraphEdgeId('~/.claude/CLAUDE.md', '~/.claude/skills/refactor.md'),
    source: '~/.claude/CLAUDE.md',
    target: '~/.claude/skills/refactor.md',
    type: 'direct',
  },
  {
    id: createGraphEdgeId('~/.claude/CLAUDE.md', '~/.claude/agents/code-review.md'),
    source: '~/.claude/CLAUDE.md',
    target: '~/.claude/agents/code-review.md',
    type: 'direct',
  },
]

// ============================================================
// ヘルパー関数
// ============================================================

/**
 * ファイルツリーから対象ファイル（.md）を抽出
 * @param tree - ファイルツリー
 * @returns 対象ファイルのパス一覧
 */
function extractTargetFiles(tree: FileNode[]): string[] {
  const files: string[] = []

  function traverse(nodes: FileNode[]): void {
    for (const node of nodes) {
      if (node.file_type === 'directory' && node.children) {
        // 対象ディレクトリのみ探索
        const dirName = node.name.toLowerCase()
        if (
          dirName === 'skills' ||
          dirName === 'agents' ||
          dirName === 'commands' ||
          node.path.includes('/.claude/')
        ) {
          traverse(node.children)
        }
      } else if (node.file_type === 'file' && node.name.endsWith('.md')) {
        files.push(node.path)
      }
    }
  }

  traverse(tree)
  return files
}

/**
 * ファイルを読み込んでLoadedFileに変換
 * @param path - ファイルパス
 * @returns LoadedFile
 */
async function loadFile(path: string): Promise<LoadedFile> {
  const name = path.split('/').pop() ?? path
  const type = getFileTypeFromPath(path)

  try {
    const fileContent = await readFile(path)
    if (fileContent) {
      return {
        path,
        name,
        content: fileContent.content,
        type,
        hasError: false,
      }
    }
    return {
      path,
      name,
      content: '',
      type,
      hasError: true,
    }
  } catch {
    return {
      path,
      name,
      content: '',
      type,
      hasError: true,
    }
  }
}

/**
 * LoadedFileからGraphNodeを作成
 * @param file - 読み込み済みファイル
 * @returns GraphNode
 */
function createNodeFromFile(file: LoadedFile): GraphNode {
  // extractDescriptionはnullを返す可能性があるため、undefinedに変換
  const description = file.hasError ? undefined : (extractDescription(file.content) ?? undefined)

  return {
    id: createGraphNodeId(file.path),
    label: file.name,
    type: file.type,
    path: file.path,
    description,
    color: file.hasError ? '#9ca3af' : getNodeColor(file.type), // gray-400 for error
    hasError: file.hasError,
  }
}

/**
 * 参照からエッジを作成
 * @param sourceId - 参照元ノードID
 * @param reference - 参照情報
 * @param knownPathsArray - 既知のファイルパスの配列
 * @returns GraphEdge と 参照先が見つかったかどうか
 */
function createEdgeFromReference(
  sourceId: string,
  reference: ReferenceMatch,
  knownPathsArray: string[]
): { edge: GraphEdge; targetPath: string | null } {
  // 参照先を解決
  const targetPath = matchesKnownFile(reference.name, knownPathsArray)

  if (targetPath) {
    // 参照先が見つかった場合
    const edgeType: EdgeType = reference.type === 'unknown' ? 'mention' : 'direct'
    return {
      edge: {
        id: createGraphEdgeId(sourceId, targetPath),
        source: sourceId,
        target: targetPath,
        type: edgeType,
        label: reference.raw,
      },
      targetPath,
    }
  }

  // 参照先が見つからない場合（broken reference）
  const unknownTargetId = `unknown:${reference.name}`
  return {
    edge: {
      id: createGraphEdgeId(sourceId, unknownTargetId),
      source: sourceId,
      target: unknownTargetId,
      type: 'broken',
      label: reference.raw,
    },
    targetPath: null,
  }
}

// ============================================================
// メインフック
// ============================================================

/**
 * 依存グラフの状態管理フック
 *
 * 使用例:
 * ```tsx
 * const { nodes, edges, loadGraph, selectNode, selectedNode } = useDependencyGraph()
 *
 * useEffect(() => {
 *   loadGraph()
 * }, [loadGraph])
 *
 * return (
 *   <GraphCanvas
 *     nodes={nodes}
 *     edges={edges}
 *     onNodeClick={selectNode}
 *   />
 * )
 * ```
 */
export function useDependencyGraph(): UseDependencyGraphReturn {
  // 状態
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [edges, setEdges] = useState<GraphEdge[]>([])
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  /**
   * グラフを読み込む
   *
   * 1. ファイルツリーを取得
   * 2. 対象ファイルをフィルタリング
   * 3. 各ファイルの内容を読み込み
   * 4. 参照を解析してノード・エッジを構築
   */
  const loadGraph = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // 非Tauri環境ではデモデータを表示
      if (!isTauri()) {
        setNodes(DEMO_NODES)
        setEdges(DEMO_EDGES)
        return
      }

      // ファイルツリーを取得
      const fileTree = await getFileTree()
      if (fileTree.length === 0) {
        setError('ファイルが見つかりませんでした')
        setNodes([])
        setEdges([])
        return
      }

      // 対象ファイルを抽出
      const targetPaths = extractTargetFiles(fileTree)
      if (targetPaths.length === 0) {
        setError('対象となるMarkdownファイルが見つかりませんでした')
        setNodes([])
        setEdges([])
        return
      }

      // ファイルを並列読み込み
      const loadedFiles = await Promise.all(targetPaths.map(loadFile))

      // ノードを構築
      const nodeMap = new Map<string, GraphNode>()
      for (const file of loadedFiles) {
        const node = createNodeFromFile(file)
        nodeMap.set(node.id, node)
      }

      // エッジを構築
      const edgeMap = new Map<string, GraphEdge>()
      const unknownNodes = new Map<string, GraphNode>()

      for (const file of loadedFiles) {
        if (file.hasError) continue

        const references = parseReferences(file.content)
        const sourceId = createGraphNodeId(file.path)

        for (const ref of references) {
          const { edge, targetPath } = createEdgeFromReference(sourceId, ref, targetPaths)

          // 自己参照をスキップ
          if (edge.source === edge.target) continue

          // 重複エッジをスキップ
          if (edgeMap.has(edge.id)) continue

          edgeMap.set(edge.id, edge)

          // 参照先が見つからない場合、unknownノードを作成
          if (!targetPath && !unknownNodes.has(edge.target)) {
            unknownNodes.set(edge.target, {
              id: edge.target,
              label: ref.name,
              type: 'unknown',
              path: edge.target,
              color: getNodeColor('unknown'),
            })
          }
        }
      }

      // unknownノードを追加
      for (const [id, node] of unknownNodes) {
        nodeMap.set(id, node)
      }

      // 状態を更新
      setNodes(Array.from(nodeMap.values()))
      setEdges(Array.from(edgeMap.values()))
    } catch (err) {
      logError('依存グラフ読み込み', err)
      setError('依存グラフの読み込みに失敗しました')
      setNodes([])
      setEdges([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * ノードを選択する
   * @param node - 選択するノード（nullで選択解除）
   */
  const selectNode = useCallback((node: GraphNode | null) => {
    setSelectedNode(node)
  }, [])

  /**
   * ノードの詳細情報を取得する
   *
   * @param node - 対象ノード
   * @returns ノードの詳細情報
   */
  const getNodeDetail = useCallback(
    (node: GraphNode): NodeDetail => {
      // このノードが参照しているノード
      const referencesTo = edges
        .filter((edge) => edge.source === node.id)
        .map((edge) => nodes.find((n) => n.id === edge.target))
        .filter((n): n is GraphNode => n !== undefined)

      // このノードを参照しているノード
      const referencedBy = edges
        .filter((edge) => edge.target === node.id)
        .map((edge) => nodes.find((n) => n.id === edge.source))
        .filter((n): n is GraphNode => n !== undefined)

      // 解決できなかった参照（broken edges）
      const unknownRefs = edges
        .filter((edge) => edge.source === node.id && edge.type === 'broken')
        .map((edge) => edge.target.replace('unknown:', ''))

      return {
        node,
        referencesTo,
        referencedBy,
        unknownRefs,
      }
    },
    [nodes, edges]
  )

  /**
   * グラフを再読み込みする
   * loadGraphのエイリアス
   */
  const refresh = useCallback(async () => {
    await loadGraph()
  }, [loadGraph])

  /**
   * ノードとエッジからツリー構造を構築
   *
   * - CLAUDE.mdをルートとして優先
   * - CLAUDE.mdがない場合は、参照されていないノードをルートに
   * - 循環参照は isCyclic: true として展開しない
   */
  const buildTree = useCallback((): TreeNode[] => {
    if (nodes.length === 0) {
      return []
    }

    // source→targetの隣接リストを作成
    const adjacencyList = new Map<string, string[]>()
    for (const edge of edges) {
      const targets = adjacencyList.get(edge.source) ?? []
      targets.push(edge.target)
      adjacencyList.set(edge.source, targets)
    }

    // 参照されているノードIDのセット（ルート候補から除外用）
    const referencedNodeIds = new Set<string>(edges.map((edge) => edge.target))

    // ルートノードの特定
    // 1. CLAUDE.mdタイプのノードを優先
    // 2. CLAUDE.mdがなければ、参照されていないノードをルートに
    const claudeMdNodes = nodes.filter((node) => node.type === 'claude-md')
    const unreferencedNodes = nodes.filter((node) => !referencedNodeIds.has(node.id))

    let rootNodes: GraphNode[]
    if (claudeMdNodes.length > 0) {
      rootNodes = claudeMdNodes
    } else if (unreferencedNodes.length > 0) {
      rootNodes = unreferencedNodes
    } else {
      // すべてのノードが参照されている場合（循環のみ）、最初のノードをルートに
      rootNodes = [nodes[0]]
    }

    // ノードIDからGraphNodeへのマップ
    const nodeMap = new Map<string, GraphNode>()
    for (const node of nodes) {
      nodeMap.set(node.id, node)
    }

    /**
     * 再帰的にツリーノードを構築
     * @param node - 現在のノード
     * @param visited - 訪問済みノードのセット（循環検出用）
     * @param depth - 現在の深さ
     * @returns TreeNode
     */
    function buildTreeNode(
      node: GraphNode,
      visited: Set<string>,
      depth: number
    ): TreeNode {
      const isExpanded = expandedIds.has(node.id)
      const isCyclic = visited.has(node.id)

      // 循環参照の場合は子を展開しない
      if (isCyclic) {
        return {
          ...node,
          children: [],
          isExpanded: false,
          isCyclic: true,
          depth,
        }
      }

      // 訪問済みに追加
      const newVisited = new Set(visited)
      newVisited.add(node.id)

      // 子ノードを取得
      const childIds = adjacencyList.get(node.id) ?? []
      const children: TreeNode[] = childIds
        .map((childId) => {
          const childNode = nodeMap.get(childId)
          if (!childNode) return null
          return buildTreeNode(childNode, newVisited, depth + 1)
        })
        .filter((child): child is TreeNode => child !== null)

      return {
        ...node,
        children,
        isExpanded,
        isCyclic: false,
        depth,
      }
    }

    // ルートノードからツリーを構築
    const roots: TreeNode[] = rootNodes.map((rootNode) =>
      buildTreeNode(rootNode, new Set(), 0)
    )

    return roots
  }, [nodes, edges, expandedIds])

  /**
   * ノードの展開/折りたたみをトグル
   * @param nodeId - 対象ノードのID
   */
  const toggleExpand = useCallback((nodeId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }, [])

  // 派生データのメモ化
  const memoizedNodes = useMemo(() => nodes, [nodes])
  const memoizedEdges = useMemo(() => edges, [edges])

  // ツリー構造の自動構築（nodes, edges, expandedIdsが変更されたら再構築）
  const memoizedTreeRoots = useMemo(() => {
    if (nodes.length === 0) {
      return []
    }
    return buildTree()
  }, [nodes, edges, expandedIds, buildTree])

  return {
    // 状態
    nodes: memoizedNodes,
    edges: memoizedEdges,
    selectedNode,
    isLoading,
    error,
    treeRoots: memoizedTreeRoots,
    expandedIds,

    // アクション
    loadGraph,
    selectNode,
    getNodeDetail,
    refresh,
    buildTree,
    toggleExpand,
  }
}

export default useDependencyGraph
