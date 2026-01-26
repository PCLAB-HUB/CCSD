/**
 * プレビュー専用ウィンドウコンポーネント
 *
 * 別ウィンドウで表示されるMarkdownプレビュー専用のコンポーネント。
 * メインウィンドウからTauriイベント経由でコンテンツを受信し、
 * リアルタイムでプレビューを更新します。
 */
import { FC, useState, useEffect, useCallback } from 'react'
import { listen, emit, UnlistenFn } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import MarkdownPreview from './MarkdownPreview'
import { Icon } from '../common'

interface PreviewContent {
  content: string
  fileName: string
  darkMode: boolean
}

// システムのダークモード設定を検出
const getSystemDarkMode = (): boolean => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  return false
}

const PreviewWindow: FC = () => {
  const [content, setContent] = useState<string>('')
  const [fileName, setFileName] = useState<string>('')
  // システムのダークモード設定を初期値として使用
  const [darkMode, setDarkMode] = useState<boolean>(getSystemDarkMode)
  const [isConnected, setIsConnected] = useState<boolean>(false)

  // デバッグ: コンポーネントのマウント確認
  useEffect(() => {
    console.log('[PreviewWindow] ========== PREVIEW WINDOW MOUNTED ==========')
    console.log('[PreviewWindow] URL Debug:', {
      href: window.location.href,
      pathname: window.location.pathname,
      origin: window.location.origin,
      protocol: window.location.protocol,
    })
    console.log('[PreviewWindow] Document title:', document.title)
    console.log('[PreviewWindow] Initial darkMode:', darkMode)
    console.log('[PreviewWindow] System prefers dark:', getSystemDarkMode())
    return () => {
      console.log('[PreviewWindow] Component unmounted')
    }
  }, [])

  // コンテンツ更新イベントのリスナー
  useEffect(() => {
    let unlisten: UnlistenFn | undefined
    let isMounted = true

    const setupListener = async () => {
      try {
        console.log('[PreviewWindow] Setting up content listener...')
        unlisten = await listen<PreviewContent>('preview-content-update', (event) => {
          console.log('[PreviewWindow] Received content update:', {
            fileName: event.payload.fileName,
            contentLength: event.payload.content?.length,
            darkMode: event.payload.darkMode
          })
          setContent(event.payload.content)
          setFileName(event.payload.fileName)
          setDarkMode(event.payload.darkMode)
          setIsConnected(true)
        })
        console.log('[PreviewWindow] Content listener setup complete')

        // リスナー設定完了後、メインウィンドウに準備完了を通知
        if (isMounted) {
          console.log('[PreviewWindow] Emitting preview-ready event...')
          await emit('preview-ready', { ready: true })
          console.log('[PreviewWindow] preview-ready event emitted successfully')
        }
      } catch (error) {
        console.error('[PreviewWindow] Failed to setup preview listener:', error)
      }
    }

    setupListener()

    return () => {
      isMounted = false
      if (unlisten) {
        console.log('[PreviewWindow] Cleaning up content listener')
        unlisten()
      }
    }
  }, [])

  // ダークモード更新イベントのリスナー
  useEffect(() => {
    let unlisten: UnlistenFn | undefined

    const setupListener = async () => {
      try {
        unlisten = await listen<boolean>('preview-darkmode-update', (event) => {
          setDarkMode(event.payload)
        })
      } catch (error) {
        console.error('Failed to setup darkmode listener:', error)
      }
    }

    setupListener()

    return () => {
      if (unlisten) {
        unlisten()
      }
    }
  }, [])

  // ウィンドウタイトルの更新
  useEffect(() => {
    const updateTitle = async () => {
      try {
        const window = getCurrentWindow()
        const title = fileName ? `Preview - ${fileName}` : 'Markdown Preview'
        await window.setTitle(title)
      } catch (error) {
        console.error('Failed to update window title:', error)
      }
    }

    updateTitle()
  }, [fileName])

  // ダークモードトグル（ローカル）
  const handleToggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev)
  }, [])

  return (
    <div className={`h-screen flex flex-col ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* ツールバー */}
      <div className={`flex items-center justify-between px-4 py-2 border-b ${
        darkMode
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            {fileName || 'No file selected'}
          </span>
          {isConnected && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
              <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
              Connected
            </span>
          )}
        </div>
        <button
          onClick={handleToggleDarkMode}
          className={`p-2 rounded-md transition-colors ${
            darkMode
              ? 'hover:bg-gray-700 text-gray-300'
              : 'hover:bg-gray-100 text-gray-600'
          }`}
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={darkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
          aria-pressed={darkMode}
        >
          {darkMode ? (
            <Icon name="sun" className="size-5" />
          ) : (
            <Icon name="moon" className="size-5" />
          )}
        </button>
      </div>

      {/* プレビューエリア */}
      <div className="flex-1 overflow-hidden">
        {content ? (
          <MarkdownPreview
            content={content}
            darkMode={darkMode}
          />
        ) : (
          <div className={`h-full flex items-center justify-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <div className="text-center">
              <Icon name="fileText" className="mx-auto mb-4 size-16 opacity-50" />
              <p className="text-lg font-medium">Waiting for content...</p>
              <p className="text-sm mt-2 opacity-75">
                Select a Markdown file in the main window to preview
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PreviewWindow
