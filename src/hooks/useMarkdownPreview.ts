import { useCallback, useState } from 'react'

/**
 * Markdownプレビュー機能を管理するカスタムフック
 * - プレビュー表示の切り替え
 * - スクロール同期の切り替え
 */
export function useMarkdownPreview() {
  const [showPreview, setShowPreview] = useState(false)
  const [scrollSync, setScrollSync] = useState(true)

  /**
   * プレビュー表示を切り替え
   */
  const togglePreview = useCallback(() => {
    setShowPreview(prev => !prev)
  }, [])

  /**
   * スクロール同期を切り替え
   */
  const toggleScrollSync = useCallback(() => {
    setScrollSync(prev => !prev)
  }, [])

  return {
    // 状態
    showPreview,
    scrollSync,
    // 操作
    setShowPreview,
    togglePreview,
    setScrollSync,
    toggleScrollSync,
  }
}
