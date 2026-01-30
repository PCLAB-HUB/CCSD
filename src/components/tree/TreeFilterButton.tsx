import { memo, type FC } from 'react'

import { Icon } from '../common'

interface TreeFilterButtonProps {
  /** アクティブなフィルターの数 */
  activeFilterCount: number
  /** フィルターメニューが開いているかどうか */
  isMenuOpen: boolean
  /** メニューの開閉をトグルする関数 */
  onToggleMenu: () => void
  /** 追加のCSSクラス */
  className?: string
}

/**
 * ファイルツリーのフィルターメニューを開閉するトグルボタン
 * アクティブなフィルター数をバッジで表示
 */
const TreeFilterButton: FC<TreeFilterButtonProps> = memo(({
  activeFilterCount,
  isMenuOpen,
  onToggleMenu,
  className = '',
}) => {
  const hasActiveFilters = activeFilterCount > 0

  return (
    <button
      type="button"
      onClick={onToggleMenu}
      className={`
        relative
        inline-flex items-center justify-center
        w-7 h-7
        rounded
        transition-colors duration-150
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
        dark:focus:ring-offset-gray-800
        ${isMenuOpen
          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
          : hasActiveFilters
            ? 'bg-blue-50 text-blue-500 hover:bg-blue-100 dark:bg-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-900'
            : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
        }
        ${className}
      `}
      aria-label={`フィルター${hasActiveFilters ? `（${activeFilterCount}件のフィルターが有効）` : ''}`}
      aria-expanded={isMenuOpen}
      aria-haspopup="menu"
      title={hasActiveFilters ? `${activeFilterCount}件のフィルターが有効` : 'フィルター'}
    >
      <Icon name="filter" className="w-4 h-4" />

      {/* アクティブフィルター数バッジ */}
      {hasActiveFilters && (
        <span
          className="
            absolute -top-1 -right-1
            min-w-[16px] h-4
            px-1
            flex items-center justify-center
            text-[10px] font-medium leading-none
            text-white
            bg-blue-500
            rounded-full
            dark:bg-blue-600
          "
          aria-hidden="true"
        >
          {activeFilterCount > 9 ? '9+' : activeFilterCount}
        </span>
      )}
    </button>
  )
})

TreeFilterButton.displayName = 'TreeFilterButton'

export default TreeFilterButton
