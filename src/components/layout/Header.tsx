import { FC, useState, useRef, useEffect } from 'react'
import { FileContent } from '../../hooks/useTauri'
import ExportMenu from '../export/ExportMenu'

export interface SearchHighlight {
  query: string
  currentIndex: number
  totalCount: number
}

interface HeaderProps {
  darkMode: boolean
  onToggleDarkMode: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  searchResults: FileContent[]
  onSearchResultClick: (path: string, name: string) => void
  readOnly: boolean
  onToggleReadOnly: () => void
  hasUnsavedChanges: boolean
  onSave: () => void
  saving: boolean
  message: { type: 'success' | 'error'; text: string } | null
  onOpenBackups: () => void
  onCreateNew: () => void
  onOpenImport?: () => void
  searchHighlight?: SearchHighlight | null
  onSearchNavigate?: (direction: 'next' | 'prev') => void
  onClearHighlight?: () => void
  selectedFilePath?: string
  selectedFileName?: string
  isMarkdownFile?: boolean
  showPreview?: boolean
  onTogglePreview?: () => void
  scrollSync?: boolean
  onToggleScrollSync?: () => void
}

const Header: FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  searchQuery,
  onSearchChange,
  searchResults,
  onSearchResultClick,
  readOnly,
  onToggleReadOnly,
  hasUnsavedChanges,
  onSave,
  saving,
  message,
  onOpenBackups,
  onCreateNew,
  onOpenImport,
  searchHighlight,
  onSearchNavigate,
  onClearHighlight,
  selectedFilePath,
  selectedFileName,
  isMarkdownFile = false,
  showPreview = false,
  onTogglePreview,
  scrollSync = false,
  onToggleScrollSync,
}) => {
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setShowResults(searchResults.length > 0)
  }, [searchResults])

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold">Claude Code Settings</h1>
        {hasUnsavedChanges && (
          <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">
            未保存
          </span>
        )}
        {message && (
          <span
            className={`text-xs px-2 py-1 rounded ${
              message.type === 'success'
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
            }`}
          >
            {message.text}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* 検索バー */}
        <div className="relative" ref={searchRef}>
          <input
            type="text"
            placeholder="検索... (Cmd+F)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            className="w-64 px-3 py-1.5 pl-8 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          {/* 検索結果ドロップダウン */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-96 overflow-y-auto z-50">
              {searchResults.map((result) => (
                <button
                  key={result.path}
                  onClick={() => {
                    onSearchResultClick(result.path, result.name)
                    setShowResults(false)
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <div className="text-sm font-medium truncate">{result.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {result.path}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 検索結果ナビゲーション（ハイライト時のみ表示） */}
        {searchHighlight && searchHighlight.totalCount > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-md">
            <span className="text-sm text-yellow-800 dark:text-yellow-200 min-w-[60px] text-center">
              {searchHighlight.currentIndex + 1} / {searchHighlight.totalCount}
            </span>
            <button
              onClick={() => onSearchNavigate?.('prev')}
              className="p-1 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded transition-colors"
              title="前の検索結果 (Shift+F3)"
            >
              <svg className="w-4 h-4 text-yellow-700 dark:text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={() => onSearchNavigate?.('next')}
              className="p-1 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded transition-colors"
              title="次の検索結果 (F3)"
            >
              <svg className="w-4 h-4 text-yellow-700 dark:text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={onClearHighlight}
              className="p-1 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded transition-colors ml-1"
              title="ハイライトをクリア"
            >
              <svg className="w-4 h-4 text-yellow-700 dark:text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* 新規作成ボタン */}
        <button
          onClick={onCreateNew}
          className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center gap-2"
          title="テンプレートから新規作成"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新規作成
        </button>

        {/* バックアップボタン */}
        <button
          onClick={onOpenBackups}
          className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
          title="バックアップ一覧"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          バックアップ
        </button>

        {/* Markdownプレビュートグル */}
        {isMarkdownFile && (
          <div className="flex items-center gap-1 border-l border-gray-300 dark:border-gray-600 pl-4">
            <button
              onClick={onTogglePreview}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-2 ${
                showPreview
                  ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
              }`}
              title={showPreview ? 'プレビューを非表示' : 'プレビューを表示'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              {showPreview ? 'Preview' : 'Preview'}
            </button>
            {showPreview && (
              <button
                onClick={onToggleScrollSync}
                className={`p-1.5 rounded-md transition-colors ${
                  scrollSync
                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
                title={scrollSync ? 'スクロール同期を解除' : 'スクロール同期'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* インポートボタン */}
        <button
          onClick={onOpenImport}
          className="px-3 py-1.5 text-sm bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors flex items-center gap-2"
          title="設定をインポート"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          インポート
        </button>

        {/* エクスポートメニュー */}
        <ExportMenu
          selectedFilePath={selectedFilePath}
          selectedFileName={selectedFileName}
        />

        {/* 保存ボタン */}
        <button
          onClick={onSave}
          disabled={!hasUnsavedChanges || readOnly || saving}
          className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {saving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              保存中...
            </>
          ) : (
            '保存'
          )}
        </button>

        {/* 読み取り専用トグル */}
        <button
          onClick={onToggleReadOnly}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            readOnly
              ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
          }`}
          title={readOnly ? '編集モードに切り替え' : '読み取り専用モードに切り替え'}
        >
          {readOnly ? '読取専用' : '編集可能'}
        </button>

        {/* ダークモードトグル */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title={darkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
        >
          {darkMode ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          )}
        </button>
      </div>
    </header>
  )
}

export default Header
