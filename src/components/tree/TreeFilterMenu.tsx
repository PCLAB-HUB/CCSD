import { memo, useCallback, useEffect, useRef, type FC } from 'react'

import { Icon } from '../common'

/** フィルターオプションの型定義 */
export type FilterType =
  | 'all'
  | 'markdown'
  | 'json'
  | 'skill'
  | 'agent'
  | 'directory'

/** フィルターオプションの定義 */
interface FilterOption {
  type: FilterType
  label: string
  icon: 'file' | 'fileText' | 'folder' | 'lightning' | 'robot' | 'folderFilled'
  iconColor: string
}

const FILTER_OPTIONS: FilterOption[] = [
  { type: 'all', label: 'すべて表示', icon: 'file', iconColor: 'text-gray-400' },
  { type: 'markdown', label: 'Markdown (.md)', icon: 'fileText', iconColor: 'text-blue-400' },
  { type: 'json', label: 'JSON (.json)', icon: 'file', iconColor: 'text-yellow-400' },
  { type: 'skill', label: 'スキルファイル', icon: 'lightning', iconColor: 'text-purple-400' },
  { type: 'agent', label: 'エージェント定義', icon: 'robot', iconColor: 'text-green-400' },
  { type: 'directory', label: 'ディレクトリのみ', icon: 'folderFilled', iconColor: 'text-yellow-500' },
]

interface TreeFilterMenuProps {
  /** メニューを閉じるコールバック */
  onClose: () => void
  /** 現在有効なフィルター */
  activeFilters: FilterType[]
  /** フィルターのトグルコールバック */
  onToggleFilter: (type: FilterType) => void
  /** すべてのフィルターをクリアするコールバック */
  onClearFilters: () => void
  /** テキスト検索フィルター */
  searchFilter: string
  /** テキスト検索フィルターの変更コールバック */
  onSearchFilterChange: (query: string) => void
  /** 隠しファイルの表示状態 */
  showHiddenFiles: boolean
  /** 隠しファイル表示のトグルコールバック */
  onToggleHiddenFiles: () => void
}

/**
 * ツリーフィルターメニューコンポーネント
 *
 * ファイルツリーのフィルタリングオプションを提供するドロップダウンメニュー
 */
const TreeFilterMenu: FC<TreeFilterMenuProps> = memo(({
  onClose,
  activeFilters,
  onToggleFilter,
  onClearFilters,
  searchFilter,
  onSearchFilterChange,
  showHiddenFiles,
  onToggleHiddenFiles,
}) => {
  const menuRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // クリック外で閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    // 次のイベントループで登録（開いた瞬間のクリックを無視）
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  // ESCキーで閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // メニューが開いたら検索入力にフォーカス
  useEffect(() => {
    const timer = setTimeout(() => {
      searchInputRef.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // フィルター選択ハンドラー
  const handleFilterClick = useCallback((type: FilterType) => {
    if (type === 'all') {
      onClearFilters()
    } else {
      onToggleFilter(type)
    }
  }, [onToggleFilter, onClearFilters])

  // 検索入力ハンドラー
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchFilterChange(e.target.value)
  }, [onSearchFilterChange])

  // クリアボタンハンドラー
  const handleClear = useCallback(() => {
    onClearFilters()
    onSearchFilterChange('')
  }, [onClearFilters, onSearchFilterChange])

  // フィルターがアクティブかチェック
  const isFilterActive = (type: FilterType): boolean => {
    if (type === 'all') {
      return activeFilters.length === 0
    }
    return activeFilters.includes(type)
  }

  // アクティブなフィルター数を取得
  const activeFilterCount = activeFilters.length + (searchFilter ? 1 : 0) + (showHiddenFiles ? 1 : 0)

  return (
    <div
      ref={menuRef}
      className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-dropdown-enter"
      role="menu"
      aria-label="ファイルフィルターメニュー"
    >
      {/* 検索入力 */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400"
          />
          <input
            ref={searchInputRef}
            type="text"
            value={searchFilter}
            onChange={handleSearchChange}
            placeholder="ファイル名で検索..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            aria-label="ファイル名で検索"
          />
          {searchFilter && (
            <button
              onClick={() => onSearchFilterChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="検索をクリア"
            >
              <Icon name="close" className="size-3 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* フィルターオプション */}
      <div className="py-1">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.type}
            onClick={() => handleFilterClick(option.type)}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              isFilterActive(option.type) ? 'bg-blue-50 dark:bg-blue-900/30' : ''
            }`}
            role="menuitemcheckbox"
            aria-checked={isFilterActive(option.type)}
          >
            <span className="flex items-center justify-center w-5">
              {isFilterActive(option.type) ? (
                <Icon name="check" className="size-4 text-blue-500" />
              ) : (
                <span className="size-4" />
              )}
            </span>
            <Icon name={option.icon} className={`size-4 ${option.iconColor}`} />
            <span className="text-gray-700 dark:text-gray-300">{option.label}</span>
          </button>
        ))}
      </div>

      {/* セパレーター */}
      <div className="border-t border-gray-200 dark:border-gray-700" />

      {/* 隠しファイル表示オプション */}
      <div className="py-1">
        <button
          onClick={onToggleHiddenFiles}
          className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
            showHiddenFiles ? 'bg-blue-50 dark:bg-blue-900/30' : ''
          }`}
          role="menuitemcheckbox"
          aria-checked={showHiddenFiles}
        >
          <span className="flex items-center justify-center w-5">
            {showHiddenFiles ? (
              <Icon name="check" className="size-4 text-blue-500" />
            ) : (
              <span className="size-4" />
            )}
          </span>
          <Icon name="eye" className="size-4 text-gray-400" />
          <span className="text-gray-700 dark:text-gray-300">隠しファイルを表示</span>
        </button>
      </div>

      {/* クリアボタン */}
      {activeFilterCount > 0 && (
        <>
          <div className="border-t border-gray-200 dark:border-gray-700" />
          <div className="p-2">
            <button
              onClick={handleClear}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
              aria-label="すべてのフィルターをクリア"
            >
              <Icon name="trash" className="size-4" />
              <span>すべてクリア ({activeFilterCount})</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
})

TreeFilterMenu.displayName = 'TreeFilterMenu'

export default TreeFilterMenu
