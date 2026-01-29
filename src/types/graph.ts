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
// 定数
// ============================================================

/**
 * ノードタイプごとの色定義
 *
 * デザインドキュメントに準拠:
 * - CLAUDE.md: 青 (blue-500)
 * - スキル: 緑 (emerald-500)
 * - サブエージェント: オレンジ (orange-500)
 * - 不明: グレー (gray-500)
 */
export const NODE_COLORS: Record<NodeType, string> = {
  'claude-md': '#3b82f6', // blue-500
  skill: '#10b981', // emerald-500
  subagent: '#F97316', // orange-500
  unknown: '#6b7280', // gray-500
} as const

/** ノードタイプの日本語ラベル */
export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  'claude-md': 'CLAUDE.md',
  skill: 'スキル',
  subagent: 'サブエージェント',
  unknown: '不明',
} as const

/** エッジタイプごとのスタイル定義 */
export const EDGE_STYLES: Record<EdgeType, EdgeStyle> = {
  direct: {
    stroke: '#64748b', // slate-500
  },
  mention: {
    stroke: '#94a3b8', // slate-400
    dashArray: '4 2',
  },
  broken: {
    stroke: '#ef4444', // red-500
    dashArray: '2 2',
  },
} as const

// ============================================================
// ヘルパー関数
// ============================================================

/**
 * ノードタイプに応じた色を取得
 *
 * @param type - ノードのタイプ
 * @returns 色コード（hex形式）
 */
export function getNodeColor(type: NodeType): string {
  return NODE_COLORS[type]
}

/**
 * エッジタイプに応じたスタイルを取得
 *
 * @param type - エッジのタイプ
 * @returns エッジのスタイル
 */
export function getEdgeStyle(type: EdgeType): EdgeStyle {
  return EDGE_STYLES[type]
}

/**
 * グラフノードのIDを生成
 *
 * ファイルパスをそのままIDとして使用
 *
 * @param path - ファイルパス
 * @returns ノードID
 */
export function createGraphNodeId(path: string): string {
  return path
}

/**
 * グラフエッジのIDを生成
 *
 * source-target形式でIDを生成
 *
 * @param source - 参照元ノードID
 * @param target - 参照先ノードID
 * @returns エッジID
 */
export function createGraphEdgeId(source: string, target: string): string {
  return `${source}->${target}`
}

/**
 * ノードが特定のタイプかどうかを判定する型ガード
 *
 * @param node - 判定対象のノード
 * @param type - 期待するノードタイプ
 * @returns ノードが指定されたタイプの場合true
 */
export function isNodeType<T extends NodeType>(
  node: GraphNode,
  type: T
): node is GraphNode & { type: T } {
  return node.type === type
}

/**
 * エッジが壊れた参照かどうかを判定
 *
 * @param edge - 判定対象のエッジ
 * @returns 壊れた参照の場合true
 */
export function isBrokenEdge(edge: GraphEdge): boolean {
  return edge.type === 'broken'
}

/**
 * グラフ内の壊れた参照をすべて取得
 *
 * @param edges - エッジ一覧
 * @returns 壊れた参照のエッジ一覧
 */
export function getBrokenEdges(edges: GraphEdge[]): GraphEdge[] {
  return edges.filter(isBrokenEdge)
}

/**
 * 特定のノードに関連するエッジを取得
 *
 * @param nodeId - ノードID
 * @param edges - エッジ一覧
 * @returns 関連するエッジ一覧（参照元・参照先両方）
 */
export function getRelatedEdges(nodeId: string, edges: GraphEdge[]): GraphEdge[] {
  return edges.filter(edge => edge.source === nodeId || edge.target === nodeId)
}

/**
 * ノードの入次数を計算（このノードを参照しているエッジ数）
 *
 * @param nodeId - ノードID
 * @param edges - エッジ一覧
 * @returns 入次数
 */
export function getInDegree(nodeId: string, edges: GraphEdge[]): number {
  return edges.filter(edge => edge.target === nodeId).length
}

/**
 * ノードの出次数を計算（このノードが参照しているエッジ数）
 *
 * @param nodeId - ノードID
 * @param edges - エッジ一覧
 * @returns 出次数
 */
export function getOutDegree(nodeId: string, edges: GraphEdge[]): number {
  return edges.filter(edge => edge.source === nodeId).length
}

/**
 * デフォルトのグラフ状態を生成
 *
 * @returns 初期状態のGraphState
 */
export function createDefaultGraphState(): GraphState {
  return {
    nodes: [],
    edges: [],
    selectedNode: null,
    isLoading: false,
    error: null,
  }
}
