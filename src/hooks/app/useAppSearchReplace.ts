import { useState, useEffect, useCallback } from 'react'
import {
  useSearchReplace,
  type SearchMatch,
  type SearchReplaceOptions,
} from '../useSearchReplace'

/**
 * 検索＆置換機能の統合フック戻り値の型
 */
export interface UseAppSearchReplaceReturn {
  // パネル状態
  isSearchReplacePanelOpen: boolean
  openSearchReplacePanel: () => void
  closeSearchReplacePanel: () => void

  // 検索＆置換状態
  searchQuery: string
  replaceText: string
  matches: SearchMatch[]
  currentMatchIndex: number
  options: SearchReplaceOptions
  isReplacing: boolean

  // 検索＆置換アクション
  setSearchQuery: (query: string) => void
  setReplaceText: (text: string) => void
  setOptions: (options: Partial<SearchReplaceOptions>) => void
  findNext: () => void
  findPrev: () => void

  // 置換アクション（自動保存付き）
  handleReplaceCurrent: () => Promise<void>
  handleReplaceAll: () => Promise<void>
}

interface UseAppSearchReplaceOptions {
  /** ファイルコンテンツ */
  content: string
  /** コンテンツ変更コールバック */
  onContentChange: (newContent: string) => void
  /** ファイル保存コールバック */
  onSave: () => Promise<boolean>
  /** 成功メッセージ表示コールバック */
  onSuccess: (message: string) => void
  /** エラーメッセージ表示コールバック */
  onError: (message: string) => void
  /** ハイライト設定コールバック */
  setHighlight: (query: string) => void
  /** ハイライトクリアコールバック */
  clearHighlight: () => void
  /** ハイライトカウント更新コールバック */
  updateHighlightCount: (count: number) => void
}

/**
 * App.tsx用の検索＆置換統合フック
 *
 * useSearchReplaceを拡張し、以下の機能を統合:
 * - パネルの開閉状態管理
 * - 置換後の自動保存
 * - エディタハイライトとの同期
 * - キーボードショートカット連携用状態
 */
export function useAppSearchReplace({
  content,
  onContentChange,
  onSave,
  onSuccess,
  onError,
  setHighlight,
  clearHighlight,
  updateHighlightCount,
}: UseAppSearchReplaceOptions): UseAppSearchReplaceReturn {
  // パネル表示状態
  const [isSearchReplacePanelOpen, setIsSearchReplacePanelOpen] = useState(false)

  // 基本の検索＆置換機能
  const {
    searchQuery,
    replaceText,
    matches,
    currentMatchIndex,
    options,
    isReplacing,
    setSearchQuery,
    setReplaceText,
    setOptions,
    findNext,
    findPrev,
    replaceCurrent,
    replaceAll,
    // reset は将来の拡張用に保持
  } = useSearchReplace(content, onContentChange)

  /**
   * パネルを開く
   */
  const openSearchReplacePanel = useCallback(() => {
    setIsSearchReplacePanelOpen(true)
  }, [])

  /**
   * パネルを閉じる
   */
  const closeSearchReplacePanel = useCallback(() => {
    setIsSearchReplacePanelOpen(false)
  }, [])

  /**
   * 置換実行後にファイルを自動保存（単一置換）
   */
  const handleReplaceCurrent = useCallback(async () => {
    const result = replaceCurrent()
    if (result.success && result.count > 0) {
      const saved = await onSave()
      if (saved) {
        onSuccess('置換して保存しました')
      } else {
        onError('置換は完了しましたが、保存に失敗しました')
      }
    }
  }, [replaceCurrent, onSave, onSuccess, onError])

  /**
   * 全置換実行後にファイルを自動保存
   */
  const handleReplaceAll = useCallback(async () => {
    const result = replaceAll()
    if (result.success && result.count > 0) {
      const saved = await onSave()
      if (saved) {
        onSuccess(`${result.count}件を置換して保存しました`)
      } else {
        onError('置換は完了しましたが、保存に失敗しました')
      }
    }
  }, [replaceAll, onSave, onSuccess, onError])

  // ========================================
  // エディタハイライトとの同期
  // ========================================

  // 検索＆置換パネルの検索状態をsearchHighlightに同期
  useEffect(() => {
    if (isSearchReplacePanelOpen && searchQuery) {
      setHighlight(searchQuery)
    } else if (!isSearchReplacePanelOpen) {
      clearHighlight()
    }
  }, [isSearchReplacePanelOpen, searchQuery, setHighlight, clearHighlight])

  // マッチ数をハイライトに同期
  useEffect(() => {
    if (isSearchReplacePanelOpen && matches.length > 0) {
      updateHighlightCount(matches.length)
    }
  }, [isSearchReplacePanelOpen, matches.length, currentMatchIndex, updateHighlightCount])

  return {
    // パネル状態
    isSearchReplacePanelOpen,
    openSearchReplacePanel,
    closeSearchReplacePanel,

    // 検索＆置換状態
    searchQuery,
    replaceText,
    matches,
    currentMatchIndex,
    options,
    isReplacing,

    // 検索＆置換アクション
    setSearchQuery,
    setReplaceText,
    setOptions,
    findNext,
    findPrev,

    // 置換アクション（自動保存付き）
    handleReplaceCurrent,
    handleReplaceAll,
  }
}
