import { useCallback, useEffect, useState } from 'react'

import { SEARCH_DEBOUNCE_DELAY, SEARCH_MIN_QUERY_LENGTH } from '../constants'
import { isTauri, searchFiles } from './useTauri'

import type { FileContent, SearchHighlight } from '../types'

/**
 * 検索機能を管理するカスタムフック
 * - ファイル検索（デバウンス付き）
 * - 検索結果のハイライト管理
 * - 検索結果間のナビゲーション
 */
export function useSearch() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<FileContent[]>([])
  const [searchHighlight, setSearchHighlight] = useState<SearchHighlight | null>(null)

  // 検索処理（デバウンス付き）
  useEffect(() => {
    async function performSearch() {
      if (!searchQuery.trim()) {
        setSearchResults([])
        return
      }

      // Tauri環境で最小文字数以上の場合のみ検索実行
      if (isTauri() && searchQuery.length >= SEARCH_MIN_QUERY_LENGTH) {
        const results = await searchFiles(searchQuery)
        setSearchResults(results)
      }
    }

    const debounceTimer = setTimeout(performSearch, SEARCH_DEBOUNCE_DELAY)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  /**
   * 検索ハイライトを設定
   * ファイルを検索結果から開いた際に呼び出す
   */
  const setHighlight = useCallback((query: string) => {
    setSearchHighlight({
      query,
      currentIndex: 0,
      totalCount: 0,
    })
  }, [])

  /**
   * 検索ハイライトをクリア
   */
  const clearHighlight = useCallback(() => {
    setSearchHighlight(null)
  }, [])

  /**
   * 検索結果間を移動（次/前）
   */
  const navigateHighlight = useCallback((direction: 'next' | 'prev') => {
    if (!searchHighlight || searchHighlight.totalCount === 0) return

    setSearchHighlight(prev => {
      if (!prev) return null

      let newIndex: number
      if (direction === 'next') {
        newIndex = (prev.currentIndex + 1) % prev.totalCount
      } else {
        newIndex = prev.currentIndex - 1 < 0 ? prev.totalCount - 1 : prev.currentIndex - 1
      }

      return { ...prev, currentIndex: newIndex }
    })
  }, [searchHighlight])

  /**
   * 検索結果の総数を更新
   * エディタコンポーネントから呼び出される
   */
  const updateHighlightCount = useCallback((count: number) => {
    setSearchHighlight(prev => {
      if (!prev) return null
      return { ...prev, totalCount: count }
    })
  }, [])

  /**
   * 検索をリセット（クエリと結果をクリア）
   */
  const resetSearch = useCallback(() => {
    setSearchQuery('')
    setSearchResults([])
  }, [])

  return {
    // 状態
    searchQuery,
    searchResults,
    searchHighlight,
    // 更新関数
    setSearchQuery,
    setHighlight,
    clearHighlight,
    navigateHighlight,
    updateHighlightCount,
    resetSearch,
  }
}
