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

import type {
  GraphNode,
  GraphEdge,
  NodeDetail,
  NodeType,
  EdgeType,
  ReferenceMatch,
} from '../types/graph'
import {
  getNodeColor,
  createGraphNodeId,
  createGraphEdgeId,
} from '../types/graph'
import type { FileNode } from '../types'

// ============================================================
// 参照解析ユーティリティ（referenceParser.tsが作成されるまでの暫定実装）
// ============================================================

/**
 * 既知のファイルパターンにマッチするかどうかを判定
 * @param name - ファイル名
 * @param knownFiles - 既知のファイルパスのSet
 * @returns マッチしたパス、または null
 */
function matchesKnownFile(name: string, knownFiles: Set<string>): string | null {
  // 完全一致
  for (const path of knownFiles) {
    const fileName = path.split('/').pop() ?? ''
    const fileNameWithoutExt = fileName.replace(/\.md$/, '')

    if (fileName === name || fileNameWithoutExt === name) {
      return path
    }
  }
  return null
}

/**
 * 参照名を正規化（拡張子追加、パス正規化など）
 * @param name - 参照名
 * @returns 正規化された名前
 */
function normalizeRefName(name: string): string {
  // .mdがなければ追加
  if (!name.endsWith('.md')) {
    return `${name}.md`
  }
  return name
}

/**
 * ファイルパスからファイルタイプを推定
 * @param path - ファイルパス
 * @returns ノードタイプ
 */
function getFileTypeFromPath(path: string): NodeType {
  if (path.includes('/skills/') || path.includes('skills/')) {
    return 'skill'
  }
  if (
    path.includes('/agents/') ||
    path.includes('agents/') ||
    path.includes('/commands/') ||
    path.includes('commands/')
  ) {
    return 'subagent'
  }
  if (path.endsWith('CLAUDE.md')) {
    return 'claude-md'
  }
  return 'unknown'
}

/**
 * ファイル内容から説明文を抽出
 * frontmatterのdescriptionまたは最初の見出しを取得
 * @param content - ファイル内容
 * @returns 説明文
 */
function extractDescription(content: string): string | undefined {
  // frontmatterからdescriptionを抽出
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (frontmatterMatch) {
    const descMatch = frontmatterMatch[1].match(/description:\s*["']?([^"'\n]+)["']?/)
    if (descMatch) {
      return descMatch[1].trim()
    }
  }

  // 最初の見出しを取得
  const headingMatch = content.match(/^#\s+(.+)$/m)
  if (headingMatch) {
    return headingMatch[1].trim()
  }

  return undefined
}

/**
 * ファイル内容から参照を解析
 *
 * 検出するパターン:
 * - スキル呼び出し: /skill-name, @skill-name
 * - サブエージェント: agent:name, subagent:name
 * - ファイル参照: [text](path.md), `path.md`
 *
 * @param content - ファイル内容
 * @returns 検出された参照一覧
 */
function parseReferences(content: string): ReferenceMatch[] {
  const references: ReferenceMatch[] = []
  const seenRefs = new Set<string>()

  // パターン定義
  const patterns: Array<{
    regex: RegExp
    type: ReferenceMatch['type']
    nameExtractor: (match: RegExpMatchArray) => string
  }> = [
    // スキル呼び出しパターン: /skill-name
    {
      regex: /\/([a-z][a-z0-9-]*(?:\.md)?)\b/gi,
      type: 'skill',
      nameExtractor: (m) => m[1],
    },
    // @参照パターン: @skill-name
    {
      regex: /@([a-z][a-z0-9-_]*(?:\.md)?)\b/gi,
      type: 'skill',
      nameExtractor: (m) => m[1],
    },
    // エージェント参照: agent:name, subagent:name
    {
      regex: /(?:sub)?agent[:\s]+["']?([a-z][a-z0-9-_/]*(?:\.md)?)["']?/gi,
      type: 'subagent',
      nameExtractor: (m) => m[1],
    },
    // Markdown リンク: [text](path.md)
    {
      regex: /\[([^\]]+)\]\(([^)]+\.md)\)/gi,
      type: 'unknown',
      nameExtractor: (m) => m[2],
    },
    // コードブロック内のファイル参照: `skills/xxx.md`, `agents/xxx.md`
    {
      regex: /`((?:skills|agents|commands)\/[a-z][a-z0-9-_/]*\.md)`/gi,
      type: 'unknown',
      nameExtractor: (m) => m[1],
    },
    // Task tool 参照パターン
    {
      regex: /Task\s+tool[^"]*"([^"]+)"/gi,
      type: 'subagent',
      nameExtractor: (m) => m[1],
    },
  ]

  for (const { regex, type, nameExtractor } of patterns) {
    let match: RegExpExecArray | null
    // 新しいRegExpで毎回検索をリセット
    const re = new RegExp(regex.source, regex.flags)
    while ((match = re.exec(content)) !== null) {
      const name = nameExtractor(match)

      // 無効な名前をスキップ
      if (!name || name.length < 2) continue
      // URLや明らかなパスをスキップ
      if (name.startsWith('http') || name.startsWith('//')) continue

      // 重複を排除
      const key = `${type}:${name}`
      if (seenRefs.has(key)) continue
      seenRefs.add(key)

      references.push({
        type,
        name: normalizeRefName(name),
        raw: match[0],
      })
    }
  }

  return references
}

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

  // アクション
  /** グラフを読み込む */
  loadGraph: () => Promise<void>
  /** ノードを選択する */
  selectNode: (node: GraphNode | null) => void
  /** ノードの詳細を取得する */
  getNodeDetail: (node: GraphNode) => NodeDetail
  /** グラフを再読み込みする */
  refresh: () => Promise<void>
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
  const description = file.hasError ? undefined : extractDescription(file.content)

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
 * @param knownPaths - 既知のファイルパスのSet
 * @returns GraphEdge と 参照先が見つかったかどうか
 */
function createEdgeFromReference(
  sourceId: string,
  reference: ReferenceMatch,
  knownPaths: Set<string>
): { edge: GraphEdge; targetPath: string | null } {
  // 参照先を解決
  const targetPath = matchesKnownFile(reference.name, knownPaths)

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

      // 既知のパスをSetに格納（参照解決用）
      const knownPaths = new Set(targetPaths)

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
          const { edge, targetPath } = createEdgeFromReference(sourceId, ref, knownPaths)

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

  // 派生データのメモ化
  const memoizedNodes = useMemo(() => nodes, [nodes])
  const memoizedEdges = useMemo(() => edges, [edges])

  return {
    // 状態
    nodes: memoizedNodes,
    edges: memoizedEdges,
    selectedNode,
    isLoading,
    error,

    // アクション
    loadGraph,
    selectNode,
    getNodeDetail,
    refresh,
  }
}

export default useDependencyGraph
