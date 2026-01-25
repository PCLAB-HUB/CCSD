import { memo } from 'react'
import type { FileContent, SearchHighlight } from '../../types'
import SearchBar from '../search/SearchBar'
import SearchNavigation from '../search/SearchNavigation'
import StatusBadges from './StatusBadges'
import ToolbarButtons from './ToolbarButtons'

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
}) => {
  return (
    <header className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold">Claude Code Settings</h1>
        <StatusBadges
          hasUnsavedChanges={hasUnsavedChanges}
          message={message}
        />
      </div>

      <div className="flex items-center gap-4">
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
          isMarkdownFile={isMarkdownFile}
          showPreview={showPreview}
          onTogglePreview={onTogglePreview}
          scrollSync={scrollSync}
          onToggleScrollSync={onToggleScrollSync}
          selectedFilePath={selectedFilePath}
          selectedFileName={selectedFileName}
          hasUnsavedChanges={hasUnsavedChanges}
          onSave={onSave}
          saving={saving}
          readOnly={readOnly}
          onToggleReadOnly={onToggleReadOnly}
          darkMode={darkMode}
          onToggleDarkMode={onToggleDarkMode}
        />
      </div>
    </header>
  )
})

Header.displayName = 'Header'

export default Header
