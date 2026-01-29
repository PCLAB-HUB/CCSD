/**
 * 依存グラフ用ヘルパー関数
 *
 * types/graph.tsから分離したユーティリティ関数群
 */

import type {
  NodeType,
  EdgeType,
  GraphNode,
  GraphEdge,
  GraphState,
  TreeNode,
  TreeState,
  EdgeStyle,
} from '../types/graph'
import { NODE_COLORS, EDGE_STYLES } from '../constants/graph'

// ============================================================
// スタイル取得関数
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

// ============================================================
// ID生成関数
// ============================================================

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

// ============================================================
// 型ガード・判定関数
// ============================================================

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

// ============================================================
// エッジ操作関数
// ============================================================

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

// ============================================================
// 次数計算関数
// ============================================================

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

// ============================================================
// 状態生成関数
// ============================================================

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

// ============================================================
// ツリー用ヘルパー関数
// ============================================================

/**
 * GraphNodeからTreeNodeを作成（子ノードなし、展開なし）
 *
 * @param node - 元のGraphNode
 * @param depth - ツリーの深さ（ルート=0）
 * @param isCyclic - 循環参照フラグ（デフォルト: false）
 * @returns 新しいTreeNode
 */
export function createTreeNode(
  node: GraphNode,
  depth: number,
  isCyclic: boolean = false
): TreeNode {
  return {
    ...node,
    children: [],
    isExpanded: false,
    isCyclic,
    depth,
  }
}

/**
 * デフォルトのツリー状態を生成
 *
 * @returns 初期状態のTreeState
 */
export function createDefaultTreeState(): TreeState {
  return {
    roots: [],
    expandedIds: new Set<string>(),
    selectedNode: null,
  }
}
