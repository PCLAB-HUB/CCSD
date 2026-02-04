import { useEffect, useRef, useState, type FC } from 'react'

import Icon from '../common/Icon'

import type { FileContent } from '../../types'

interface SearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  searchResults: FileContent[]
  onSearchResultClick: (path: string, name: string) => void
}

const SearchBar: FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  searchResults,
  onSearchResultClick,
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
    <div className="relative flex-shrink-0" ref={searchRef} role="search">
      <label htmlFor="search-input" className="sr-only">
        ファイル検索
      </label>
      <input
        id="search-input"
        type="text"
        placeholder="検索... (Cmd+F)"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onFocus={() => searchResults.length > 0 && setShowResults(true)}
        aria-label="ファイルを検索"
        aria-describedby="search-hint"
        aria-expanded={showResults && searchResults.length > 0}
        aria-controls="search-results"
        className="w-64 px-3 py-1.5 pl-8 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <span id="search-hint" className="sr-only">Cmd+Fでも検索できます</span>
      <Icon
        name="search"
        className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-gray-400"
      />

      {/* 検索結果ドロップダウン */}
      {showResults && searchResults.length > 0 && (
        <div
          id="search-results"
          role="listbox"
          aria-label="検索結果"
          className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-96 overflow-y-auto z-50"
        >
          {searchResults.map((result) => (
            <button
              key={result.path}
              role="option"
              aria-selected="false"
              onClick={() => {
                onSearchResultClick(result.path, result.name)
                setShowResults(false)
              }}
              className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
            >
              <div className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">{result.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {result.path}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default SearchBar
