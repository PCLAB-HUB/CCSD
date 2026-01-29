import { memo } from 'react'
import {
  getEdgeStyle,
  NodeType,
  EdgeType,
  NODE_COLORS,
  NODE_TYPE_LABELS,
} from '../../types/graph'

interface GraphLegendProps {
  darkMode: boolean
}

/** ノードタイプの凡例定義 */
const NODE_LEGEND_ITEMS: { type: NodeType; label: string }[] = [
  { type: 'claude-md', label: NODE_TYPE_LABELS['claude-md'] },
  { type: 'skill', label: NODE_TYPE_LABELS.skill },
  { type: 'subagent', label: NODE_TYPE_LABELS.subagent },
  { type: 'unknown', label: NODE_TYPE_LABELS.unknown },
]

/** エラーノードの色 */
const ERROR_NODE_COLOR = '#6B7280'

/** エッジタイプの凡例定義 */
const EDGE_LEGEND_ITEMS: { type: EdgeType; label: string }[] = [
  { type: 'direct', label: '直接参照' },
  { type: 'mention', label: '言及' },
  { type: 'broken', label: '壊れた参照' },
]

/**
 * グラフの凡例コンポーネント
 *
 * ノードとエッジの色の意味を表示する
 */
const GraphLegend = memo<GraphLegendProps>(({ darkMode }) => {
  const textColor = darkMode ? 'text-gray-300' : 'text-gray-700'
  const bgColor = darkMode ? 'bg-gray-800/80' : 'bg-white/80'
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200'
  const dividerColor = darkMode ? 'border-gray-600' : 'border-gray-300'

  return (
    <div
      className={`flex items-center gap-4 px-3 py-2 rounded-lg ${bgColor} ${borderColor} border backdrop-blur-sm`}
    >
      {/* ノードの凡例 */}
      <div className="flex items-center gap-3">
        {NODE_LEGEND_ITEMS.map(({ type, label }) => (
          <div key={type} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: NODE_COLORS[type] }}
            />
            <span className={`text-xs ${textColor}`}>{label}</span>
          </div>
        ))}
        {/* エラーノード */}
        <div className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: ERROR_NODE_COLOR }}
          />
          <span className={`text-xs ${textColor}`}>エラー</span>
        </div>
      </div>

      {/* 区切り線 */}
      <div className={`h-4 border-l ${dividerColor}`} />

      {/* エッジの凡例 */}
      <div className="flex items-center gap-3">
        {EDGE_LEGEND_ITEMS.map(({ type, label }) => {
          const style = getEdgeStyle(type)
          return (
            <div key={type} className="flex items-center gap-1.5">
              <svg width="20" height="8" className="flex-shrink-0">
                <line
                  x1="0"
                  y1="4"
                  x2="20"
                  y2="4"
                  stroke={style.stroke}
                  strokeWidth="2"
                  strokeDasharray={style.dashArray}
                />
              </svg>
              <span className={`text-xs ${textColor}`}>{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
})

GraphLegend.displayName = 'GraphLegend'

export default GraphLegend
