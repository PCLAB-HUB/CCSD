import { memo, useCallback, type FC, type MouseEvent } from 'react'
import Icon, { type IconName } from '../common/Icon'
import { type TreeNode as TreeNodeType, type NodeType, NODE_COLORS } from '../../types/graph'

// ============================================================
// 型定義
// ============================================================

interface TreeNodeProps {
  /** ツリーノード */
  node: TreeNodeType
  /** 選択中のノードID */
  selectedId: string | null
  /** 展開/折りたたみトグル */
  onToggle: (nodeId: string) => void
  /** ノード選択 */
  onSelect: (node: TreeNodeType) => void
  /** ダブルクリックでファイルを開く */
  onDoubleClick: (node: TreeNodeType) => void
  /** ダークモード */
  darkMode: boolean
}

// ============================================================
// 定数
// ============================================================

/** ノードタイプごとのアイコンマッピング */
const NODE_TYPE_ICONS: Record<NodeType, IconName> = {
  'claude-md': 'document',
  skill: 'code',
  subagent: 'robot',
  unknown: 'info',
} as const

/** インデント幅（px） */
const INDENT_SIZE = 16

// ============================================================
// コンポーネント
// ============================================================

/**
 * ツリーノードコンポーネント
 *
 * 個別のツリーノードを表示し、再帰的に子ノードを描画する
 */
const TreeNodeComponent: FC<TreeNodeProps> = ({
  node,
  selectedId,
  onToggle,
  onSelect,
  onDoubleClick,
  darkMode,
}) => {
  const hasChildren = node.children.length > 0
  const isSelected = node.id === selectedId

  // 展開/折りたたみトグルハンドラー
  const handleToggle = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation()
      if (hasChildren && !node.isCyclic) {
        onToggle(node.id)
      }
    },
    [hasChildren, node.id, node.isCyclic, onToggle]
  )

  // 選択ハンドラー
  const handleSelect = useCallback(() => {
    onSelect(node)
  }, [node, onSelect])

  // ダブルクリックハンドラー
  const handleDoubleClick = useCallback(() => {
    onDoubleClick(node)
  }, [node, onDoubleClick])

  // アイコンの色を取得
  const iconColor = NODE_COLORS[node.type]

  // 背景色のスタイル
  const bgStyle = isSelected
    ? darkMode
      ? 'bg-blue-900/50'
      : 'bg-blue-100'
    : darkMode
      ? 'hover:bg-gray-700/50'
      : 'hover:bg-gray-100'

  return (
    <div className="select-none">
      {/* ノード行 */}
      <div
        className={`flex items-center py-1 px-2 cursor-pointer rounded transition-colors ${bgStyle}`}
        style={{ paddingLeft: `${node.depth * INDENT_SIZE + 8}px` }}
        onClick={handleSelect}
        onDoubleClick={handleDoubleClick}
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={hasChildren ? node.isExpanded : undefined}
      >
        {/* 展開/折りたたみアイコン */}
        <span
          className={`w-4 h-4 flex items-center justify-center mr-1 ${
            hasChildren && !node.isCyclic ? 'cursor-pointer' : 'opacity-0'
          }`}
          onClick={handleToggle}
        >
          {hasChildren && !node.isCyclic && (
            <span
              className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
            >
              {node.isExpanded ? '\u25BC' : '\u25B6'}
            </span>
          )}
        </span>

        {/* タイプアイコン */}
        <span className="mr-2 flex-shrink-0" style={{ color: iconColor }}>
          <Icon name={NODE_TYPE_ICONS[node.type]} className="w-4 h-4" />
        </span>

        {/* ラベル */}
        <span
          className={`truncate text-sm ${
            darkMode ? 'text-gray-200' : 'text-gray-800'
          } ${node.hasError ? 'line-through opacity-50' : ''}`}
        >
          {node.label}
        </span>

        {/* 循環参照マーカー */}
        {node.isCyclic && (
          <span className="ml-2 text-xs text-red-500 flex-shrink-0">
            {'\u2192'} 循環
          </span>
        )}
      </div>

      {/* 子ノード（展開時のみ、循環参照でない場合） */}
      {node.isExpanded && !node.isCyclic && hasChildren && (
        <div role="group">
          {node.children.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              selectedId={selectedId}
              onToggle={onToggle}
              onSelect={onSelect}
              onDoubleClick={onDoubleClick}
              darkMode={darkMode}
            />
          ))}
        </div>
      )}
    </div>
  )
}

TreeNodeComponent.displayName = 'TreeNode'

export default memo(TreeNodeComponent)
