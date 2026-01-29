import { memo } from 'react'

import { Icon } from '../common'

import type { NodeDetail, GraphNode, NodeType } from '../../types/graph'
import { NODE_TYPE_LABELS } from '../../types/graph'

interface NodeDetailPanelProps {
  nodeDetail: NodeDetail | null
  onNodeClick: (node: GraphNode) => void
  onOpenFile: (path: string, name: string) => void
  darkMode: boolean
}

/** ノードタイプに応じたバッジスタイル */
const getNodeTypeBadgeStyle = (type: NodeType, darkMode: boolean): string => {
  const baseStyle = 'px-2 py-0.5 text-xs font-medium rounded-full'

  switch (type) {
    case 'claude-md':
      return `${baseStyle} ${darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'}`
    case 'skill':
      return `${baseStyle} ${darkMode ? 'bg-emerald-900/50 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`
    case 'subagent':
      return `${baseStyle} ${darkMode ? 'bg-violet-900/50 text-violet-300' : 'bg-violet-100 text-violet-700'}`
    case 'unknown':
      return `${baseStyle} ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`
  }
}

/**
 * ノード詳細パネル
 *
 * 選択されたノードの詳細情報を表示するパネル
 * - ノード名、タイプ、パス
 * - 説明（frontmatterから）
 * - 参照先・参照元一覧
 * - 未解決の参照
 * - ファイルを開くボタン
 */
const NodeDetailPanel = memo<NodeDetailPanelProps>(({
  nodeDetail,
  onNodeClick,
  onOpenFile,
  darkMode,
}) => {
  // ノードが選択されていない場合
  if (!nodeDetail) {
    return (
      <div
        className={`
          w-[280px] flex-shrink-0 flex flex-col items-center justify-center
          border-l p-4
          ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}
        `}
      >
        <Icon
          name="infoCircle"
          className={`w-12 h-12 mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}
        />
        <p className={`text-sm text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          ノードを選択してください
        </p>
      </div>
    )
  }

  const { node, referencesTo, referencedBy, unknownRefs } = nodeDetail

  return (
    <div
      className={`
        w-[280px] flex-shrink-0 flex flex-col
        border-l overflow-hidden
        ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}
      `}
    >
      {/* スクロール可能なコンテンツ領域 */}
      <div className="flex-1 overflow-y-auto">
        {/* ノード基本情報 */}
        <div
          className={`
            p-4 border-b
            ${darkMode ? 'border-gray-700' : 'border-gray-200'}
          `}
        >
          {/* ノード名とエラーインジケーター */}
          <div className="flex items-start gap-2 mb-2">
            <h3
              className={`
                font-semibold text-base break-all flex-1
                ${darkMode ? 'text-gray-100' : 'text-gray-900'}
              `}
            >
              {node.label}
            </h3>
            {node.hasError && (
              <Icon
                name="warning"
                className="w-5 h-5 flex-shrink-0 text-red-500"
              />
            )}
          </div>

          {/* タイプバッジ */}
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              タイプ:
            </span>
            <span className={getNodeTypeBadgeStyle(node.type, darkMode)}>
              {NODE_TYPE_LABELS[node.type]}
            </span>
          </div>

          {/* パス */}
          <div className="mb-2">
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              パス:
            </span>
            <p
              className={`
                text-xs mt-1 font-mono break-all
                ${darkMode ? 'text-gray-300' : 'text-gray-600'}
              `}
            >
              {node.path}
            </p>
          </div>
        </div>

        {/* 説明（存在する場合） */}
        {node.description && (
          <div
            className={`
              p-4 border-b
              ${darkMode ? 'border-gray-700' : 'border-gray-200'}
            `}
          >
            <h4
              className={`
                text-xs font-medium mb-2
                ${darkMode ? 'text-gray-400' : 'text-gray-500'}
              `}
            >
              説明
            </h4>
            <p
              className={`
                text-sm leading-relaxed
                ${darkMode ? 'text-gray-300' : 'text-gray-700'}
              `}
            >
              {node.description}
            </p>
          </div>
        )}

        {/* 参照先 */}
        <div
          className={`
            p-4 border-b
            ${darkMode ? 'border-gray-700' : 'border-gray-200'}
          `}
        >
          <h4
            className={`
              text-xs font-medium mb-2
              ${darkMode ? 'text-gray-400' : 'text-gray-500'}
            `}
          >
            参照先 ({referencesTo.length})
          </h4>
          {referencesTo.length > 0 ? (
            <ul className="space-y-1.5">
              {referencesTo.map((refNode) => (
                <li key={refNode.id}>
                  <button
                    type="button"
                    onClick={() => onNodeClick(refNode)}
                    className={`
                      text-sm text-left w-full px-2 py-1 rounded
                      transition-colors flex items-center gap-2
                      ${darkMode
                        ? 'text-blue-400 hover:bg-gray-800 hover:text-blue-300'
                        : 'text-blue-600 hover:bg-gray-100 hover:text-blue-700'
                      }
                    `}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: refNode.color || '#6b7280' }}
                    />
                    <span className="truncate">{refNode.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              なし
            </p>
          )}
        </div>

        {/* 参照元 */}
        <div
          className={`
            p-4 border-b
            ${darkMode ? 'border-gray-700' : 'border-gray-200'}
          `}
        >
          <h4
            className={`
              text-xs font-medium mb-2
              ${darkMode ? 'text-gray-400' : 'text-gray-500'}
            `}
          >
            参照元 ({referencedBy.length})
          </h4>
          {referencedBy.length > 0 ? (
            <ul className="space-y-1.5">
              {referencedBy.map((refNode) => (
                <li key={refNode.id}>
                  <button
                    type="button"
                    onClick={() => onNodeClick(refNode)}
                    className={`
                      text-sm text-left w-full px-2 py-1 rounded
                      transition-colors flex items-center gap-2
                      ${darkMode
                        ? 'text-blue-400 hover:bg-gray-800 hover:text-blue-300'
                        : 'text-blue-600 hover:bg-gray-100 hover:text-blue-700'
                      }
                    `}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: refNode.color || '#6b7280' }}
                    />
                    <span className="truncate">{refNode.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              なし
            </p>
          )}
        </div>

        {/* 未解決の参照（存在する場合） */}
        {unknownRefs.length > 0 && (
          <div
            className={`
              p-4 border-b
              ${darkMode ? 'border-gray-700' : 'border-gray-200'}
            `}
          >
            <h4
              className={`
                text-xs font-medium mb-2
                ${darkMode ? 'text-gray-400' : 'text-gray-500'}
              `}
            >
              未解決の参照 ({unknownRefs.length})
            </h4>
            <ul className="space-y-1">
              {unknownRefs.map((ref, index) => (
                <li
                  key={`${ref}-${index}`}
                  className={`
                    text-sm flex items-center gap-2
                    ${darkMode ? 'text-purple-400' : 'text-purple-600'}
                  `}
                >
                  <Icon name="warning" className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{ref}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ファイルを開くボタン（固定フッター） */}
      <div
        className={`
          p-4 border-t
          ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}
        `}
      >
        <button
          type="button"
          onClick={() => onOpenFile(node.path, node.label)}
          className={`
            w-full px-4 py-2 text-sm font-medium rounded-md
            transition-colors flex items-center justify-center gap-2
            ${darkMode
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
            }
          `}
        >
          <Icon name="externalLink" className="w-4 h-4" />
          ファイルを開く
        </button>
      </div>
    </div>
  )
})

NodeDetailPanel.displayName = 'NodeDetailPanel'

export default NodeDetailPanel
