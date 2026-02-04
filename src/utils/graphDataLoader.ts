/**
 * グラフデータローダーユーティリティ
 *
 * 依存グラフの構築に必要なデータ読み込みロジックを提供
 * useDependencyGraph.ts から抽出したヘルパー関数群
 *
 * @module utils/graphDataLoader
 */

import { getFileTree, readFile } from '../hooks/tauri/files'
import {
  matchesKnownFile,
  getFileTypeFromPath,
  extractDescription,
  extractSkillMetadata,
} from './referenceParser'
import {
  getNodeColor,
  createGraphNodeId,
  createGraphEdgeId,
} from './graphHelpers'

import type {
  GraphNode,
  GraphEdge,
  NodeType,
  EdgeType,
  ReferenceMatch,
} from '../types/graph'
import type { FileNode } from '../types'

// ============================================================
// 型定義
// ============================================================

/**
 * ファイル情報（読み込み後）
 */
export interface LoadedFile {
  path: string
  name: string
  content: string
  type: NodeType
  hasError: boolean
}

// ============================================================
// デモデータ（非Tauri環境用）
// ============================================================

/**
 * デモ用ノードデータ
 *
 * 非Tauri環境でグラフを表示するためのサンプルノード
 */
export const DEMO_NODES: GraphNode[] = [
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

/**
 * デモ用エッジデータ
 *
 * 非Tauri環境でグラフを表示するためのサンプルエッジ
 */
export const DEMO_EDGES: GraphEdge[] = [
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
 *
 * Rustバックエンドが~/.claude/配下のファイルのみを返すため、
 * すべてのディレクトリを再帰的に探索してMarkdownファイルを収集する
 *
 * @param tree - ファイルツリー
 * @returns 対象ファイルのパス一覧
 */
export function extractTargetFiles(tree: FileNode[]): string[] {
  const files: string[] = []

  function traverse(nodes: FileNode[]): void {
    for (const node of nodes) {
      if (node.file_type === 'directory' && node.children) {
        // .claude配下のファイルツリーなので、すべてのディレクトリを探索
        traverse(node.children)
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
 *
 * ファイルパスからコンテンツを読み込み、ファイルタイプを判定して
 * LoadedFile形式に変換する。読み込みエラーが発生した場合は
 * hasErrorフラグをtrueにして空のコンテンツを返す
 *
 * @param path - ファイルパス
 * @returns LoadedFile
 */
export async function loadFile(path: string): Promise<LoadedFile> {
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
 *
 * 読み込み済みファイル情報からグラフノードを生成する
 * エラーがあるファイルはグレー色で表示
 * スキル/サブエージェントファイルの場合はメタデータも抽出
 *
 * @param file - 読み込み済みファイル
 * @returns GraphNode
 */
export function createNodeFromFile(file: LoadedFile): GraphNode {
  // extractDescriptionはnullを返す可能性があるため、undefinedに変換
  const description = file.hasError ? undefined : (extractDescription(file.content) ?? undefined)

  // スキル/サブエージェントの場合はメタデータを抽出
  const shouldExtractMetadata = !file.hasError && (file.type === 'skill' || file.type === 'subagent')
  const metadata = shouldExtractMetadata ? extractSkillMetadata(file.content) : undefined

  return {
    id: createGraphNodeId(file.path),
    label: file.name,
    type: file.type,
    path: file.path,
    description,
    color: file.hasError ? '#9ca3af' : getNodeColor(file.type), // gray-400 for error
    hasError: file.hasError,
    metadata,
  }
}

/**
 * 参照からエッジを作成
 *
 * 参照情報を解析し、既知のファイルパスと照合してエッジを生成する
 * 参照先が見つからない場合はbrokenタイプのエッジを生成
 *
 * @param sourceId - 参照元ノードID
 * @param reference - 参照情報
 * @param knownPathsArray - 既知のファイルパスの配列
 * @returns GraphEdge と 参照先が見つかったかどうか
 */
export function createEdgeFromReference(
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
// Re-export for convenience
// ============================================================

export { getFileTree }
export { parseReferences } from './referenceParser'
export { getNodeColor, createGraphNodeId } from './graphHelpers'
