import { FC } from 'react'
import type { SearchHighlight } from '../../types'
import Icon from '../common/Icon'

interface SearchNavigationProps {
  searchHighlight: SearchHighlight
  onNavigate: (direction: 'next' | 'prev') => void
  onClear: () => void
}

const SearchNavigation: FC<SearchNavigationProps> = ({
  searchHighlight,
  onNavigate,
  onClear,
}) => {
  if (searchHighlight.totalCount === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-md" role="navigation" aria-label="検索ナビゲーション">
      <span className="text-sm text-yellow-800 dark:text-yellow-200 min-w-[60px] text-center" aria-live="polite" aria-atomic="true">
        {searchHighlight.currentIndex + 1} / {searchHighlight.totalCount}
      </span>
      <button
        onClick={() => onNavigate('prev')}
        className="p-1.5 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500"
        title="前の検索結果 (Shift+F3)"
        aria-label="前の検索結果へ移動"
      >
        <Icon name="chevronUp" className="size-4 text-yellow-700 dark:text-yellow-300" />
      </button>
      <button
        onClick={() => onNavigate('next')}
        className="p-1.5 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500"
        title="次の検索結果 (F3)"
        aria-label="次の検索結果へ移動"
      >
        <Icon name="chevronDown" className="size-4 text-yellow-700 dark:text-yellow-300" />
      </button>
      <button
        onClick={onClear}
        className="p-1.5 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded transition-colors ml-1 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        title="ハイライトをクリア"
        aria-label="検索ハイライトをクリア"
      >
        <Icon name="close" className="size-4 text-yellow-700 dark:text-yellow-300" />
      </button>
    </div>
  )
}

export default SearchNavigation
