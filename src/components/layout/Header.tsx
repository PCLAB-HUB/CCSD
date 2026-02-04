import { memo } from 'react'

import SearchBar from '../search/SearchBar'
import SearchNavigation from '../search/SearchNavigation'
import ClaudeVersionBadge from './ClaudeVersionBadge'
import StatusBadges from './StatusBadges'
import ToolbarButtons from './ToolbarButtons'

import type { FileContent, SearchHighlight } from '../../types'

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
  // プレビューウィンドウ
  onOpenPreviewWindow?: () => void
  isPreviewWindowOpen?: boolean
  isPreviewWindowLoading?: boolean
  // 検索＆置換
  onOpenSearchReplace?: () => void
  // 依存関係グラフ
  showDependencyGraph?: boolean
  onToggleDependencyGraph?: () => void
  // Claude Codeバージョン
  claudeVersion?: string | null
  claudeVersionLoading?: boolean
  claudeVersionError?: string | null
}

const Header = memo<HeaderProps>(({
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
  onOpenPreviewWindow,
  isPreviewWindowOpen = false,
  isPreviewWindowLoading = false,
  onOpenSearchReplace,
  showDependencyGraph = false,
  onToggleDependencyGraph,
  claudeVersion,
  claudeVersionLoading = false,
  claudeVersionError,
}) => {
  return (
    <header className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 min-w-0">
      <div className="flex items-center gap-4 flex-shrink-0">
        <h1 className="text-lg font-semibold flex items-center gap-2 whitespace-nowrap">
          CCSD
          {/* Claude Code Invader Icon */}
          <svg
            className="size-6 text-orange-500"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            {/* Classic Space Invader style icon */}
            <rect x="4" y="4" width="2" height="2" />
            <rect x="18" y="4" width="2" height="2" />
            <rect x="6" y="6" width="2" height="2" />
            <rect x="16" y="6" width="2" height="2" />
            <rect x="4" y="8" width="16" height="2" />
            <rect x="2" y="10" width="4" height="2" />
            <rect x="8" y="10" width="8" height="2" />
            <rect x="18" y="10" width="4" height="2" />
            <rect x="2" y="12" width="2" height="2" />
            <rect x="6" y="12" width="12" height="2" />
            <rect x="20" y="12" width="2" height="2" />
            <rect x="2" y="14" width="2" height="2" />
            <rect x="6" y="14" width="2" height="2" />
            <rect x="16" y="14" width="2" height="2" />
            <rect x="20" y="14" width="2" height="2" />
            <rect x="8" y="14" width="3" height="2" />
            <rect x="13" y="14" width="3" height="2" />
            <rect x="4" y="16" width="4" height="2" />
            <rect x="16" y="16" width="4" height="2" />
          </svg>
        </h1>
        <StatusBadges
          hasUnsavedChanges={hasUnsavedChanges}
          message={message}
        />
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <ClaudeVersionBadge
          version={claudeVersion ?? null}
          loading={claudeVersionLoading}
          error={claudeVersionError ?? null}
        />

        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          searchResults={searchResults}
          onSearchResultClick={onSearchResultClick}
        />

        {searchHighlight && searchHighlight.totalCount > 0 && onSearchNavigate && onClearHighlight && (
          <SearchNavigation
            searchHighlight={searchHighlight}
            onNavigate={onSearchNavigate}
            onClear={onClearHighlight}
          />
        )}

        <ToolbarButtons
          onCreateNew={onCreateNew}
          onOpenBackups={onOpenBackups}
          onOpenImport={onOpenImport}
          onOpenSearchReplace={onOpenSearchReplace}
          isMarkdownFile={isMarkdownFile}
          showPreview={showPreview}
          onTogglePreview={onTogglePreview}
          scrollSync={scrollSync}
          onToggleScrollSync={onToggleScrollSync}
          onOpenPreviewWindow={onOpenPreviewWindow}
          isPreviewWindowOpen={isPreviewWindowOpen}
          isPreviewWindowLoading={isPreviewWindowLoading}
          selectedFilePath={selectedFilePath}
          selectedFileName={selectedFileName}
          hasUnsavedChanges={hasUnsavedChanges}
          onSave={onSave}
          saving={saving}
          readOnly={readOnly}
          onToggleReadOnly={onToggleReadOnly}
          darkMode={darkMode}
          onToggleDarkMode={onToggleDarkMode}
          showDependencyGraph={showDependencyGraph}
          onToggleDependencyGraph={onToggleDependencyGraph}
        />
      </div>
    </header>
  )
})

Header.displayName = 'Header'

export default Header
