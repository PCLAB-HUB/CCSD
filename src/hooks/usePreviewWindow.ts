/**
 * プレビューウィンドウ機能を管理するカスタムフック
 *
 * 別ウィンドウでのMarkdownプレビュー機能を提供します:
 * - プレビューウィンドウの開閉
 * - コンテンツの同期
 * - ダークモードの同期
 */
import { useState, useCallback, useEffect, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { emitTo } from '@tauri-apps/api/event'

const PREVIEW_WINDOW_LABEL = 'preview'

interface UsePreviewWindowOptions {
  content?: string
  fileName?: string
  darkMode: boolean
}

export function usePreviewWindow({
  content = '',
  fileName = '',
  darkMode,
}: UsePreviewWindowOptions) {
  const [isWindowOpen, setIsWindowOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const checkIntervalRef = useRef<number | null>(null)

  /**
   * プレビューウィンドウを開く
   */
  const openPreviewWindow = useCallback(async () => {
    try {
      setIsLoading(true)
      await invoke('open_preview_window')
      setIsWindowOpen(true)

      // ウィンドウが開いた後、少し待ってからコンテンツを送信
      // emitToを使用してプレビューウィンドウに直接送信
      setTimeout(async () => {
        if (content) {
          await emitTo(PREVIEW_WINDOW_LABEL, 'preview-content-update', {
            content,
            fileName,
            darkMode,
          })
        }
      }, 500) // ウィンドウの初期化を待つため、少し長めに設定
    } catch (error) {
      console.error('Failed to open preview window:', error)
    } finally {
      setIsLoading(false)
    }
  }, [content, fileName, darkMode])

  /**
   * プレビューウィンドウを閉じる
   */
  const closePreviewWindow = useCallback(async () => {
    try {
      await invoke('close_preview_window')
      setIsWindowOpen(false)
    } catch (error) {
      console.error('Failed to close preview window:', error)
    }
  }, [])

  /**
   * コンテンツをプレビューウィンドウに送信
   */
  const sendContent = useCallback(async (newContent: string, newFileName: string) => {
    if (!isWindowOpen) return

    try {
      // emitToを使用してプレビューウィンドウに直接送信
      await emitTo(PREVIEW_WINDOW_LABEL, 'preview-content-update', {
        content: newContent,
        fileName: newFileName,
        darkMode,
      })
    } catch (error) {
      console.error('Failed to send content to preview window:', error)
    }
  }, [isWindowOpen, darkMode])

  /**
   * ダークモードをプレビューウィンドウに同期
   */
  const syncDarkMode = useCallback(async (newDarkMode: boolean) => {
    if (!isWindowOpen) return

    try {
      // emitToを使用してプレビューウィンドウに直接送信
      await emitTo(PREVIEW_WINDOW_LABEL, 'preview-darkmode-update', newDarkMode)
    } catch (error) {
      console.error('Failed to sync dark mode to preview window:', error)
    }
  }, [isWindowOpen])

  // コンテンツが変更されたら自動同期
  useEffect(() => {
    if (isWindowOpen && content) {
      sendContent(content, fileName)
    }
  }, [isWindowOpen, content, fileName, sendContent])

  // ダークモードが変更されたら自動同期
  useEffect(() => {
    if (isWindowOpen) {
      syncDarkMode(darkMode)
    }
  }, [isWindowOpen, darkMode, syncDarkMode])

  // ウィンドウの状態を定期的にチェック
  useEffect(() => {
    const checkWindowStatus = async () => {
      try {
        const isOpen = await invoke<boolean>('is_preview_window_open')
        setIsWindowOpen(isOpen)
      } catch {
        // エラーは無視（ウィンドウがない場合など）
      }
    }

    // 初回チェック
    checkWindowStatus()

    // 定期チェック（ウィンドウが開いている場合のみ）
    if (isWindowOpen) {
      checkIntervalRef.current = window.setInterval(checkWindowStatus, 2000)
    }

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
    }
  }, [isWindowOpen])

  return {
    // 状態
    isWindowOpen,
    isLoading,
    // 操作
    openPreviewWindow,
    closePreviewWindow,
    sendContent,
    syncDarkMode,
  }
}
