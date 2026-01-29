/**
 * 依存グラフ関連の型定義
 *
 * CLAUDE.md、スキル、サブエージェント間の参照関係を
 * グラフとして可視化するための型を定義
 */

// ============================================================
// 基本型
// ============================================================

/**
 * ノードのタイプ
 *
 * - claude-md: CLAUDE.mdファイル
 * - skill: スキルファイル
 * - subagent: サブエージェントファイル
 * - unknown: 参照先が見つからないファイル
 */
export type NodeType = 'claude-md' | 'skill' | 'subagent' | 'unknown'

/**
 * エッジのタイプ
 *
 * - direct: 明示的な参照（スキル呼び出し、サブエージェント起動）
 * - mention: テキスト内での言及
 * - broken: 参照先が見つからない壊れた参照
 */
export type EdgeType = 'direct' | 'mention' | 'broken'

// ============================================================
// グラフ構成要素
// ============================================================

/**
 * グラフのノード
 *
 * ファイルを表現するノード。パスを一意識別子として使用
 */
export interface GraphNode {
  /** 一意の識別子（ファイルパス） */
  id: string
  /** 表示名 */
  label: string
  /** ノードのタイプ */
  type: NodeType
  /** ファイルパス */
  path: string
  /** 説明（frontmatterから取得、オプション） */
  description?: string
  /** ノードの表示色（オプション） */
  color?: string
  /** ファイル読み込みエラーがあるか */
  hasError?: boolean
}

/**
 * グラフのエッジ
 *
 * ノード間の参照関係を表現
 */
export interface GraphEdge {
  /** 一意の識別子 */
  id: string
  /** 参照元ノードのID */
  source: string
  /** 参照先ノードのID */
  target: string
  /** エッジのタイプ */
  type: EdgeType
  /** エッジのラベル（オプション） */
  label?: string
}

// ============================================================
// 状態管理
// ============================================================

/**
 * グラフの状態
 *
 * グラフコンポーネントで管理する状態
 */
export interface GraphState {
  /** ノード一覧 */
  nodes: GraphNode[]
  /** エッジ一覧 */
  edges: GraphEdge[]
  /** 選択中のノード */
  selectedNode: GraphNode | null
  /** 読み込み中フラグ */
  isLoading: boolean
  /** エラーメッセージ */
  error: string | null
}

// ============================================================
// 参照解析
// ============================================================

/**
 * 参照パターンのマッチ結果
 *
 * ファイル内で検出された参照を表現
 */
export interface ReferenceMatch {
  /** 参照のタイプ */
  type: 'skill' | 'subagent' | 'unknown'
  /** 参照名（ファイル名など） */
  name: string
  /** 元のマッチ文字列 */
  raw: string
}

// ============================================================
// ノード詳細
// ============================================================

/**
 * ノードの詳細情報
 *
 * 詳細パネルで表示する情報
 */
export interface NodeDetail {
  /** 対象ノード */
  node: GraphNode
  /** このノードが参照しているノード一覧 */
  referencesTo: GraphNode[]
  /** このノードを参照しているノード一覧 */
  referencedBy: GraphNode[]
  /** 解決できなかった参照一覧 */
  unknownRefs: string[]
}

// ============================================================
// スタイル定義
// ============================================================

/**
 * エッジのスタイル
 */
export interface EdgeStyle {
  /** 線の色 */
  stroke: string
  /** ダッシュ配列（点線/破線用、オプション） */
  dashArray?: string
}

// ============================================================
// ツリー表示用の型
// ============================================================

/**
 * ツリーノード（階層表示用）
 *
 * GraphNodeを拡張し、ツリー構造に必要な情報を追加
 */
export interface TreeNode extends GraphNode {
  /** 子ノード一覧 */
  children: TreeNode[]
  /** 展開状態 */
  isExpanded: boolean
  /** 循環参照フラグ（このノードが祖先に存在する場合true） */
  isCyclic: boolean
  /** ツリーの深さ（ルート=0） */
  depth: number
}

/**
 * ツリーの状態
 */
export interface TreeState {
  /** ルートノード一覧（CLAUDE.mdまたは参照されていないノード） */
  roots: TreeNode[]
  /** 展開中のノードIDセット */
  expandedIds: Set<string>
  /** 選択中のノード */
  selectedNode: TreeNode | null
}

// ============================================================
// Re-exports for backwards compatibility
// ============================================================

// Constants
export { NODE_COLORS, NODE_TYPE_LABELS, EDGE_STYLES } from '../constants/graph'

// Helper functions
export {
  getNodeColor,
  getEdgeStyle,
  createGraphNodeId,
  createGraphEdgeId,
  isNodeType,
  isBrokenEdge,
  getBrokenEdges,
  getRelatedEdges,
  getInDegree,
  getOutDegree,
  createDefaultGraphState,
  createTreeNode,
  createDefaultTreeState,
} from '../utils/graphHelpers'
