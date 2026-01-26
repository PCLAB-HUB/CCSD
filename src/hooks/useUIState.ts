import { useState, useEffect, useCallback } from 'react'
import type { Message } from '../types'

export type { Message }

/**
 * UI状態を管理するカスタムフック
 * - ダークモードの切り替えと永続化
 * - トーストメッセージの表示と自動クリア
 * - サイドバー幅の管理
 * - 読み取り専用モードの管理
 */
export function useUIState() {
  // ダークモードの初期値はシステム設定から取得
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  const [message, setMessage] = useState<Message | null>(null)
  const [sidebarWidth, setSidebarWidth] = useState(280)
  const [readOnly, setReadOnly] = useState(true)

  // ダークモードの適用（DOMクラスの切り替え）
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // メッセージの自動クリア（3秒後）
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  // ダークモードの切り替え
  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev)
  }, [])

  // 読み取り専用モードの切り替え
  const toggleReadOnly = useCallback(() => {
    setReadOnly(prev => !prev)
  }, [])

  // 成功メッセージを表示
  const showSuccess = useCallback((text: string) => {
    setMessage({ type: 'success', text })
  }, [])

  // エラーメッセージを表示
  const showError = useCallback((text: string) => {
    setMessage({ type: 'error', text })
  }, [])

  return {
    // 状態
    darkMode,
    message,
    sidebarWidth,
    readOnly,
    // 更新関数
    setDarkMode,
    toggleDarkMode,
    setMessage,
    showSuccess,
    showError,
    setSidebarWidth,
    setReadOnly,
    toggleReadOnly,
  }
}
