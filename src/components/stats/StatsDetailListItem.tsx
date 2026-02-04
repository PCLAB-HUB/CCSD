import { memo, useCallback, type FC } from 'react'

import type { StatsDetailItem } from '../../types/stats'

interface StatsDetailListItemProps {
  /** 表示するアイテム */
  item: StatsDetailItem
  /** クリック時のコールバック */
  onClick?: () => void
}

/**
 * StatsDetailListItem - 統計詳細リストの個別アイテムコンポーネント
 *
 * アクセシビリティ機能:
 * - キーボード操作対応（Enter/Space）
 * - フォーカス可視化（focus:ring）
 * - クリック可能な場合のカーソル変更
 * - WCAG AA準拠のコントラスト比
 */
export const StatsDetailListItem: FC<StatsDetailListItemProps> = memo(({
  item,
  onClick,
}) => {
  const isClickable = !!onClick

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick()
    }
  }, [onClick])

  const interactiveClasses = isClickable
    ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
    : ''

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      className={`
        p-4 rounded-lg border
        bg-white dark:bg-gray-800
        border-gray-200 dark:border-gray-700
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        dark:focus:ring-offset-gray-900
        ${interactiveClasses}
      `}
    >
      {/* アイテム名 */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {item.name}
        </span>
        {/* カテゴリバッジ（サブエージェント用） */}
        {item.category && (
          <span className="flex-shrink-0 text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded">
            {item.category}
          </span>
        )}
      </div>

      {/* パス表示 */}
      {item.path && (
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate font-mono">
          {item.path}
        </div>
      )}

      {/* 説明文 */}
      {item.description && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
          {item.description}
        </p>
      )}

      {/* メタデータ（バッジ形式） */}
      {item.metadata && Object.keys(item.metadata).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(item.metadata).map(([key, value]) => (
            <span
              key={key}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
            >
              <span className="text-gray-400 dark:text-gray-500">{key}:</span>
              <span>{value}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
})

StatsDetailListItem.displayName = 'StatsDetailListItem'
