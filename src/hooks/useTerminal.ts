/**
 * @fileoverview ターミナルPTY接続・入出力管理フック
 * @module hooks/useTerminal
 *
 * 機能:
 * - PTY（疑似端末）の起動・終了
 * - 入出力データの送受信
 * - ターミナルサイズ変更
 * - Tauriイベントのリスニング
 * - xterm.jsとの連携
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import type { UnlistenFn } from '@tauri-apps/api/event'

import { isTauri } from './tauri/utils'
import type {
  TerminalConfig,
  TerminalStatus,
  TerminalOutputItem,
} from '../types/terminal'
import { createOutputItemId } from '../types/terminal'

// ============================================================
// 型定義
// ============================================================

/**
 * ターミナル出力イベントのペイロード
 */
interface TerminalOutputPayload {
  /** セッションID */
  session_id: string
  /** 出力データ */
  data: string
}

/**
 * ターミナル終了イベントのペイロード
 */
interface TerminalExitPayload {
  /** セッションID */
  session_id: string
  /** 終了コード */
  code: number
}

/**
 * ターミナルエラーイベントのペイロード
 */
interface TerminalErrorPayload {
  /** セッションID */
  session_id: string
  /** エラーメッセージ */
  error: string
}

/**
 * useTerminalの戻り値
 */
export interface UseTerminalReturn {
  /** ターミナルの状態 */
  status: TerminalStatus
  /** 出力バッファ */
  output: TerminalOutputItem[]
  /** 最後のエラーメッセージ */
  lastError: string | null
  /** ターミナルを起動する */
  spawnTerminal: (config?: Partial<TerminalConfig>) => Promise<boolean>
  /** ターミナルに入力を送信する */
  writeToTerminal: (data: string) => Promise<boolean>
  /** ターミナルのサイズを変更する */
  resizeTerminal: (rows: number, cols: number) => Promise<boolean>
  /** ターミナルを終了する */
  closeTerminal: () => Promise<boolean>
  /** 出力バッファをクリアする */
  clearOutput: () => void
  /** xterm.js onDataコールバック用のハンドラ */
  handleXtermData: (data: string) => void
  /** ターミナルがアクティブかどうか */
  isActive: boolean
  /** 現在のセッションID */
  sessionId: string | null
}

// ============================================================
// デフォルト設定
// ============================================================

const DEFAULT_CONFIG: TerminalConfig = {
  rows: 24,
  cols: 80,
}

// ============================================================
// フック実装
// ============================================================

/**
 * ターミナルPTY接続・入出力管理フック
 */
export function useTerminal(options?: {
  /** 出力受信時のコールバック */
  onOutput?: (data: string) => void
  /** エラー発生時のコールバック */
  onError?: (message: string) => void
  /** ターミナル終了時のコールバック */
  onExit?: (code: number) => void
}): UseTerminalReturn {
  const { onOutput, onError, onExit } = options ?? {}

  const [status, setStatus] = useState<TerminalStatus>('idle')
  const [output, setOutput] = useState<TerminalOutputItem[]>([])
  const [lastError, setLastError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

  // マウント状態を追跡
  const isMountedRef = useRef(true)
  // イベントリスナーのクリーンアップ関数
  const unlistenFunctionsRef = useRef<UnlistenFn[]>([])
  // ターミナルがアクティブかどうか
  const isActiveRef = useRef(false)
  // 現在のセッションID
  const sessionIdRef = useRef<string | null>(null)

  // クリーンアップ
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      // イベントリスナーをクリーンアップ
      unlistenFunctionsRef.current.forEach((unlisten) => unlisten())
      unlistenFunctionsRef.current = []
    }
  }, [])

  /**
   * 出力アイテムを追加する
   */
  const addOutput = useCallback(
    (type: TerminalOutputItem['type'], content: string) => {
      if (!isMountedRef.current) return

      const item: TerminalOutputItem = {
        id: createOutputItemId(),
        type,
        content,
        timestamp: Date.now(),
      }
      setOutput((prev) => [...prev, item])
    },
    []
  )

  /**
   * イベントリスナーを設定する
   */
  const setupEventListeners = useCallback(async () => {
    if (!isTauri()) return

    try {
      // 出力イベント
      const unlistenOutput = await listen<TerminalOutputPayload>(
        'terminal:output',
        (event) => {
          if (!isMountedRef.current) return
          // 自分のセッションの出力のみ処理
          if (event.payload.session_id !== sessionIdRef.current) return

          const { data } = event.payload
          addOutput('stdout', data)
          onOutput?.(data)
        }
      )
      unlistenFunctionsRef.current.push(unlistenOutput)

      // 終了イベント
      const unlistenExit = await listen<TerminalExitPayload>(
        'terminal:exit',
        (event) => {
          if (!isMountedRef.current) return
          if (event.payload.session_id !== sessionIdRef.current) return

          const { code } = event.payload
          isActiveRef.current = false
          sessionIdRef.current = null
          setStatus('idle')
          setSessionId(null)
          addOutput('system', `\r\n[プロセス終了: コード ${code}]`)
          onExit?.(code)
        }
      )
      unlistenFunctionsRef.current.push(unlistenExit)

      // エラーイベント
      const unlistenError = await listen<TerminalErrorPayload>(
        'terminal:error',
        (event) => {
          if (!isMountedRef.current) return
          if (event.payload.session_id !== sessionIdRef.current) return

          const { error } = event.payload
          setStatus('error')
          setLastError(error)
          addOutput('stderr', `\r\n[エラー: ${error}]`)
          onError?.(error)
        }
      )
      unlistenFunctionsRef.current.push(unlistenError)
    } catch (error) {
      console.error('Failed to setup terminal event listeners:', error)
    }
  }, [addOutput, onOutput, onExit, onError])

  /**
   * イベントリスナーをクリーンアップする
   */
  const cleanupEventListeners = useCallback(() => {
    unlistenFunctionsRef.current.forEach((unlisten) => unlisten())
    unlistenFunctionsRef.current = []
  }, [])

  /**
   * ターミナルを起動する
   */
  const spawnTerminal = useCallback(
    async (config?: Partial<TerminalConfig>): Promise<boolean> => {
      if (!isTauri()) {
        setLastError('Tauri環境で実行されていません')
        return false
      }

      if (isActiveRef.current) {
        setLastError('ターミナルは既に起動しています')
        return false
      }

      const mergedConfig: TerminalConfig = {
        ...DEFAULT_CONFIG,
        ...config,
      }

      try {
        // イベントリスナーを先に設定
        await setupEventListeners()

        // ターミナルを起動（セッションIDが返される）
        const newSessionId = await invoke<string>('spawn_terminal', {
          rows: mergedConfig.rows,
          cols: mergedConfig.cols,
          workingDir: mergedConfig.cwd,
        })

        if (isMountedRef.current) {
          sessionIdRef.current = newSessionId
          setSessionId(newSessionId)
          isActiveRef.current = true
          setStatus('running')
          setLastError(null)
          addOutput('system', '[ターミナルを起動しました]\r\n')
        }

        return true
      } catch (error) {
        console.error('Failed to spawn terminal:', error)
        cleanupEventListeners()

        if (isMountedRef.current) {
          const message =
            error instanceof Error
              ? error.message
              : 'ターミナルの起動に失敗しました'
          setStatus('error')
          setLastError(message)
        }

        return false
      }
    },
    [setupEventListeners, cleanupEventListeners, addOutput]
  )

  /**
   * ターミナルに入力を送信する
   */
  const writeToTerminal = useCallback(async (data: string): Promise<boolean> => {
    if (!isTauri()) return false
    if (!isActiveRef.current || !sessionIdRef.current) {
      console.warn('Terminal is not active')
      return false
    }

    try {
      await invoke('write_terminal', {
        sessionId: sessionIdRef.current,
        data
      })
      return true
    } catch (error) {
      console.error('Failed to write to terminal:', error)
      return false
    }
  }, [])

  /**
   * ターミナルのサイズを変更する
   */
  const resizeTerminal = useCallback(
    async (rows: number, cols: number): Promise<boolean> => {
      if (!isTauri()) return false
      if (!isActiveRef.current || !sessionIdRef.current) return false

      try {
        await invoke('resize_terminal', {
          sessionId: sessionIdRef.current,
          rows,
          cols
        })
        return true
      } catch (error) {
        console.error('Failed to resize terminal:', error)
        return false
      }
    },
    []
  )

  /**
   * ターミナルを終了する
   */
  const closeTerminal = useCallback(async (): Promise<boolean> => {
    if (!isTauri()) return false
    if (!isActiveRef.current || !sessionIdRef.current) return true // 既に終了している

    try {
      await invoke('close_terminal', { sessionId: sessionIdRef.current })
      cleanupEventListeners()

      if (isMountedRef.current) {
        isActiveRef.current = false
        sessionIdRef.current = null
        setSessionId(null)
        setStatus('idle')
        addOutput('system', '\r\n[ターミナルを終了しました]')
      }

      return true
    } catch (error) {
      console.error('Failed to close terminal:', error)
      return false
    }
  }, [cleanupEventListeners, addOutput])

  /**
   * 出力バッファをクリアする
   */
  const clearOutput = useCallback(() => {
    if (isMountedRef.current) {
      setOutput([])
    }
  }, [])

  /**
   * xterm.js onDataコールバック用のハンドラ
   */
  const handleXtermData = useCallback(
    (data: string) => {
      void writeToTerminal(data)
    },
    [writeToTerminal]
  )

  // コンポーネントのアンマウント時にターミナルを終了
  useEffect(() => {
    return () => {
      if (isActiveRef.current && sessionIdRef.current) {
        void invoke('close_terminal', { sessionId: sessionIdRef.current }).catch(() => {
          // アンマウント時のエラーは無視
        })
      }
    }
  }, [])

  return {
    status,
    output,
    lastError,
    spawnTerminal,
    writeToTerminal,
    resizeTerminal,
    closeTerminal,
    clearOutput,
    handleXtermData,
    isActive: isActiveRef.current,
    sessionId,
  }
}

export default useTerminal
