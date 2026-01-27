/**
 * プレビューウィンドウ機能を管理するカスタムフック
 *
 * 別ウィンドウでのMarkdownプレビュー機能を提供します:
 * - プレビューウィンドウの開閉
 * - コンテンツの同期
 * - ダークモードの同期
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { emitTo, listen, type EventTarget, type UnlistenFn } from '@tauri-apps/api/event'

import { PREVIEW_WINDOW_CHECK_INTERVAL, PREVIEW_WINDOW_FALLBACK_TIMEOUT } from '../constants'

const PREVIEW_WINDOW_LABEL = 'preview'

// Tauri v2: WebviewWindowターゲットを明示的に指定
const PREVIEW_TARGET: EventTarget = {
  kind: 'WebviewWindow',
  label: PREVIEW_WINDOW_LABEL,
}

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
  const isPreviewReadyRef = useRef(false)
  const checkIntervalRef = useRef<number | null>(null)
  const contentRef = useRef({ content, fileName, darkMode })
  const pendingContentRef = useRef<{ content: string; fileName: string; darkMode: boolean } | null>(null)

  // 最新のコンテンツ情報を保持
  useEffect(() => {
    contentRef.current = { content, fileName, darkMode }
  }, [content, fileName, darkMode])

  /**
   * プレビューウィンドウからの準備完了通知をリッスン
   */
  useEffect(() => {
    let unlisten: UnlistenFn | undefined

    const setupListener = async () => {
      try {
        unlisten = await listen('preview-ready', async () => {
          isPreviewReadyRef.current = true

          // 保留中のコンテンツがあれば送信
          if (pendingContentRef.current) {
            try {
              await emitTo(PREVIEW_TARGET, 'preview-content-update', pendingContentRef.current)
            } catch {
              // プレビューウィンドウが閉じている可能性があるため、送信エラーは無視
            }
            pendingContentRef.current = null
          }
        })
      } catch {
        // Tauri環境外での実行時はイベントリスナー設定が失敗するため無視
      }
    }

    setupListener()

    return () => {
      if (unlisten) {
        unlisten()
      }
    }
  }, [])

  /**
   * プレビューウィンドウを開く
   */
  const openPreviewWindow = useCallback(async () => {
    try {
      setIsLoading(true)
      isPreviewReadyRef.current = false

      // コンテンツを保留（プレビューウィンドウの準備完了を待つ）
      if (content) {
        pendingContentRef.current = { content, fileName, darkMode }
      }

      await invoke('open_preview_window')
      setIsWindowOpen(true)

      // フォールバック: タイムアウト後にまだ準備完了していなければ強制送信
      setTimeout(async () => {
        if (pendingContentRef.current) {
          try {
            await emitTo(PREVIEW_TARGET, 'preview-content-update', pendingContentRef.current)
          } catch {
            // プレビューウィンドウが準備できていない可能性があるため無視
          }
          pendingContentRef.current = null
        }
      }, PREVIEW_WINDOW_FALLBACK_TIMEOUT)
    } catch {
      // Tauri環境外での実行時はウィンドウ作成が失敗するため無視
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
    } catch {
      // ウィンドウが既に閉じている、またはTauri環境外での実行時は無視
    }
  }, [])

  /**
   * コンテンツをプレビューウィンドウに送信
   */
  const sendContent = useCallback(async (newContent: string, newFileName: string) => {
    if (!isWindowOpen) return

    try {
      // Tauri v2: EventTargetを使用してプレビューウィンドウに直接送信
      await emitTo(PREVIEW_TARGET, 'preview-content-update', {
        content: newContent,
        fileName: newFileName,
        darkMode,
      })
    } catch {
      // プレビューウィンドウが閉じている可能性があるため無視
    }
  }, [isWindowOpen, darkMode])

  /**
   * ダークモードをプレビューウィンドウに同期
   */
  const syncDarkMode = useCallback(async (newDarkMode: boolean) => {
    if (!isWindowOpen) return

    try {
      // Tauri v2: EventTargetを使用してプレビューウィンドウに直接送信
      await emitTo(PREVIEW_TARGET, 'preview-darkmode-update', newDarkMode)
    } catch {
      // プレビューウィンドウが閉じている可能性があるため無視
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
        // Tauri環境外での実行時、またはウィンドウがない場合は無視
      }
    }

    // 初回チェック
    checkWindowStatus()

    // 定期チェック（ウィンドウが開いている場合のみ）
    if (isWindowOpen) {
      checkIntervalRef.current = window.setInterval(checkWindowStatus, PREVIEW_WINDOW_CHECK_INTERVAL)
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
