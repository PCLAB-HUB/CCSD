/**
 * グラフキャンバスコンポーネント
 *
 * react-force-graph-2dを使用して依存関係グラフを描画する。
 * ノードはファイルタイプに応じた色で表示され、
 * エッジは参照タイプに応じたスタイルで描画される。
 */
import { memo, useCallback, useMemo, useRef } from 'react'
import ForceGraph2D, {
  type ForceGraphMethods,
  type NodeObject,
  type LinkObject,
} from 'react-force-graph-2d'
import type { GraphNode, GraphEdge, EdgeType } from '../../types/graph'
import { getNodeColor, getEdgeStyle } from '../../types/graph'

// ============================================================
// 型定義
// ============================================================

interface GraphCanvasProps {
  /** グラフのノード一覧 */
  nodes: GraphNode[]
  /** グラフのエッジ一覧 */
  edges: GraphEdge[]
  /** 選択中のノード */
  selectedNode: GraphNode | null
  /** ノード選択時のコールバック */
  onSelectNode: (node: GraphNode | null) => void
  /** ノードダブルクリック時のコールバック */
  onDoubleClickNode: (node: GraphNode) => void
  /** ダークモードフラグ */
  darkMode: boolean
}

/** react-force-graph-2d用のノード型 */
interface ForceGraphNode extends NodeObject {
  id: string
  label: string
  type: GraphNode['type']
  path: string
  description?: string
  color?: string
  hasError?: boolean
}

/** react-force-graph-2d用のリンク型 */
interface ForceGraphLink extends LinkObject {
  id: string
  source: string | ForceGraphNode
  target: string | ForceGraphNode
  type: EdgeType
  label?: string
}

/** グラフデータ型 */
interface GraphData {
  nodes: ForceGraphNode[]
  links: ForceGraphLink[]
}

/** ダブルクリック検出用の状態 */
interface ClickState {
  nodeId: string | null
  timestamp: number
}

// ============================================================
// 定数
// ============================================================

/** ノードの基本半径 */
const NODE_RADIUS = 8

/** 選択ノードのボーダー幅 */
const SELECTED_BORDER_WIDTH = 3

/** ラベルのフォントサイズ */
const LABEL_FONT_SIZE = 10

/** バッジのサイズ */
const BADGE_SIZE = 8

/** 矢印の長さ */
const ARROW_LENGTH = 6

/** シミュレーション冷却ティック数 */
const COOLDOWN_TICKS = 100

/** D3アルファ減衰率 */
const D3_ALPHA_DECAY = 0.02

/** ダッシュパターン（破線用） */
const DASH_PATTERN: [number, number] = [5, 5]

/** ダブルクリック判定の時間閾値（ミリ秒） */
const DOUBLE_CLICK_THRESHOLD = 300

// ============================================================
// ヘルパー関数
// ============================================================

/**
 * ForceGraphNodeをGraphNodeに変換
 */
function toGraphNode(node: ForceGraphNode): GraphNode {
  return {
    id: node.id,
    label: node.label,
    type: node.type,
    path: node.path,
    description: node.description,
    color: node.color,
    hasError: node.hasError,
  }
}

// ============================================================
// コンポーネント
// ============================================================

/**
 * グラフキャンバスコンポーネント
 *
 * Force-directedレイアウトでグラフを描画する。
 * ノードはドラッグ可能で、ズーム・パンにも対応。
 */
const GraphCanvas = memo<GraphCanvasProps>(({
  nodes,
  edges,
  selectedNode,
  onSelectNode,
  onDoubleClickNode,
  darkMode,
}) => {
  const graphRef = useRef<ForceGraphMethods<ForceGraphNode, ForceGraphLink> | undefined>(undefined)

  // ダブルクリック検出用
  const lastClickRef = useRef<ClickState>({ nodeId: null, timestamp: 0 })

  // グラフデータをreact-force-graph-2d形式に変換
  const graphData = useMemo<GraphData>(() => {
    const forceNodes: ForceGraphNode[] = nodes.map(node => ({
      id: node.id,
      label: node.label,
      type: node.type,
      path: node.path,
      description: node.description,
      color: node.color,
      hasError: node.hasError,
    }))

    const forceLinks: ForceGraphLink[] = edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      label: edge.label,
    }))

    return { nodes: forceNodes, links: forceLinks }
  }, [nodes, edges])

  // 背景色
  const backgroundColor = darkMode ? '#1f2937' : '#f9fafb' // gray-800 / gray-50

  // テキスト色
  const textColor = darkMode ? '#e5e7eb' : '#374151' // gray-200 / gray-700

  // 選択ノードのボーダー色
  const selectedBorderColor = darkMode ? '#60a5fa' : '#3b82f6' // blue-400 / blue-500

  // エラーノードの塗りつぶし色
  const errorFillColor = '#9ca3af' // gray-400

  // ノードのカスタム描画
  const nodeCanvasObject = useCallback((
    node: ForceGraphNode,
    ctx: CanvasRenderingContext2D,
    globalScale: number
  ) => {
    const x = node.x ?? 0
    const y = node.y ?? 0
    const isSelected = selectedNode?.id === node.id
    const nodeColor = node.hasError ? errorFillColor : getNodeColor(node.type)

    // ノードサイズをスケールに応じて調整
    const radius = NODE_RADIUS
    const fontSize = LABEL_FONT_SIZE / globalScale

    // 選択ノードのボーダーを描画
    if (isSelected) {
      ctx.beginPath()
      ctx.arc(x, y, radius + SELECTED_BORDER_WIDTH, 0, 2 * Math.PI, false)
      ctx.fillStyle = selectedBorderColor
      ctx.fill()
    }

    // ノードの円を描画
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, 2 * Math.PI, false)
    ctx.fillStyle = nodeColor
    ctx.fill()

    // unknownタイプのノードには「?」バッジを表示
    if (node.type === 'unknown') {
      ctx.font = `bold ${BADGE_SIZE}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#ffffff'
      ctx.fillText('?', x, y)
    }

    // ラベルを描画
    ctx.font = `${fontSize}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillStyle = textColor
    ctx.fillText(node.label, x, y + radius + 2)
  }, [selectedNode, textColor, selectedBorderColor])

  // リンクの色を取得
  const linkColor = useCallback((link: ForceGraphLink): string => {
    const edgeStyle = getEdgeStyle(link.type)
    return edgeStyle.stroke
  }, [])

  // リンクのダッシュパターンを取得
  const linkLineDash = useCallback((link: ForceGraphLink): number[] | null => {
    // direct参照は実線
    if (link.type === 'direct') {
      return null
    }
    // mention, brokenは破線
    return DASH_PATTERN
  }, [])

  // ノードクリックハンドラ（ダブルクリック検出を含む）
  const handleNodeClick = useCallback((node: ForceGraphNode) => {
    const now = Date.now()
    const lastClick = lastClickRef.current

    // ダブルクリック判定
    if (
      lastClick.nodeId === node.id &&
      now - lastClick.timestamp < DOUBLE_CLICK_THRESHOLD
    ) {
      // ダブルクリック
      onDoubleClickNode(toGraphNode(node))
      // クリック状態をリセット
      lastClickRef.current = { nodeId: null, timestamp: 0 }
    } else {
      // シングルクリック
      onSelectNode(toGraphNode(node))
      // クリック状態を更新
      lastClickRef.current = { nodeId: node.id, timestamp: now }
    }
  }, [onSelectNode, onDoubleClickNode])

  // 背景クリックハンドラ（選択解除）
  const handleBackgroundClick = useCallback(() => {
    onSelectNode(null)
    // クリック状態をリセット
    lastClickRef.current = { nodeId: null, timestamp: 0 }
  }, [onSelectNode])

  return (
    <div
      className="w-full h-full relative"
      style={{ backgroundColor }}
    >
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeCanvasObject={nodeCanvasObject}
        nodePointerAreaPaint={(node, color, ctx) => {
          // ポインタ領域を円形に設定
          const x = node.x ?? 0
          const y = node.y ?? 0
          ctx.beginPath()
          ctx.arc(x, y, NODE_RADIUS + 2, 0, 2 * Math.PI, false)
          ctx.fillStyle = color
          ctx.fill()
        }}
        linkColor={linkColor}
        linkLineDash={linkLineDash}
        linkDirectionalArrowLength={ARROW_LENGTH}
        linkDirectionalArrowRelPos={1}
        onNodeClick={handleNodeClick}
        onNodeDragEnd={(node) => {
          // ドラッグ終了時にノードを固定
          node.fx = node.x
          node.fy = node.y
        }}
        onBackgroundClick={handleBackgroundClick}
        cooldownTicks={COOLDOWN_TICKS}
        d3AlphaDecay={D3_ALPHA_DECAY}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        backgroundColor={backgroundColor}
      />
    </div>
  )
})

GraphCanvas.displayName = 'GraphCanvas'

export default GraphCanvas
