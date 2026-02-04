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
  // 起動中のセッションID（spawn_terminal呼び出し中に使用）
  const pendingSessionIdRef = useRef<string | null>(null)
  // スポーン中フラグ（イベント受信のタイミング問題を解決）
  const isSpawningRef = useRef(false)

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
   * セッションIDが許可されたものかチェックする
   *
   * @param eventSessionId イベントのセッションID
   * @returns 許可されていればtrue
   */
  const isAllowedSession = useCallback((eventSessionId: string): boolean => {
    console.log('[useTerminal] isAllowedSession check:', {
      eventSessionId,
      currentSessionId: sessionIdRef.current,
      pendingSessionId: pendingSessionIdRef.current,
      isSpawning: isSpawningRef.current,
    })

    // アクティブなセッションと一致
    if (sessionIdRef.current === eventSessionId) {
      console.log('[useTerminal] Allowed: matches current session')
      return true
    }
    // 起動中のセッションと一致
    if (pendingSessionIdRef.current === eventSessionId) {
      console.log('[useTerminal] Allowed: matches pending session')
      return true
    }
    // スポーン中で、まだセッションIDが設定されていない場合は受け入れる
    // （最初のイベントでpendingSessionIdRefを設定）
    if (isSpawningRef.current && !sessionIdRef.current && !pendingSessionIdRef.current) {
      console.log('[useTerminal] Allowed: first event during spawn, setting pending session')
      pendingSessionIdRef.current = eventSessionId
      return true
    }
    console.log('[useTerminal] Rejected: no matching session')
    return false
  }, [])

  /**
   * イベントリスナーを設定する
   *
   * 注意: セッションIDのフィルタリングでは、以下のケースを考慮:
   * 1. sessionIdRef.current - 確立されたセッション
   * 2. pendingSessionIdRef.current - 起動中のセッション
   * 3. isSpawningRef.current - スポーン処理中（最初のイベントを受け入れる）
   */
  const setupEventListeners = useCallback(async () => {
    if (!isTauri()) return

    try {
      // 出力イベント
      const unlistenOutput = await listen<TerminalOutputPayload>(
        'terminal:output',
        (event) => {
          if (!isMountedRef.current) return

          const eventSessionId = event.payload.session_id
          if (!isAllowedSession(eventSessionId)) return

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

          const eventSessionId = event.payload.session_id
          if (!isAllowedSession(eventSessionId)) return

          const { code } = event.payload
          isActiveRef.current = false
          isSpawningRef.current = false
          sessionIdRef.current = null
          pendingSessionIdRef.current = null
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

          const eventSessionId = event.payload.session_id
          if (!isAllowedSession(eventSessionId)) return

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
  }, [addOutput, onOutput, onExit, onError, isAllowedSession])

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

      if (isActiveRef.current || isSpawningRef.current) {
        setLastError('ターミナルは既に起動しています')
        return false
      }

      const mergedConfig: TerminalConfig = {
        ...DEFAULT_CONFIG,
        ...config,
      }

      try {
        // スポーン中フラグを立てる（イベント受信を許可するため）
        isSpawningRef.current = true
        pendingSessionIdRef.current = null
        console.log('[useTerminal] Starting spawn, isSpawning=true')

        // イベントリスナーを先に設定
        await setupEventListeners()
        console.log('[useTerminal] Event listeners set up')

        // ターミナルを起動（セッションIDが返される）
        // この間にRustからイベントが発火され、isAllowedSessionがpendingSessionIdRefを設定する
        console.log('[useTerminal] Calling spawn_terminal...')
        const newSessionId = await invoke<string>('spawn_terminal', {
          rows: mergedConfig.rows,
          cols: mergedConfig.cols,
          workingDir: mergedConfig.cwd,
        })
        console.log('[useTerminal] spawn_terminal returned:', newSessionId)

        if (isMountedRef.current) {
          // pendingからactiveに昇格
          sessionIdRef.current = newSessionId
          pendingSessionIdRef.current = null
          isSpawningRef.current = false
          setSessionId(newSessionId)
          isActiveRef.current = true
          setStatus('running')
          setLastError(null)
          addOutput('system', '[ターミナルを起動しました]\r\n')
        }

        return true
      } catch (error) {
        console.error('Failed to spawn terminal:', error)
        isSpawningRef.current = false
        pendingSessionIdRef.current = null
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
    console.log('[useTerminal] writeToTerminal called:', {
      dataLength: data.length,
      data: data.substring(0, 50),
      currentSessionId: sessionIdRef.current,
      pendingSessionId: pendingSessionIdRef.current,
      isActive: isActiveRef.current,
      isSpawning: isSpawningRef.current,
    })

    if (!isTauri()) {
      console.warn('[useTerminal] Not in Tauri environment')
      return false
    }

    // アクティブなセッションまたはペンディングセッションのIDを取得
    const targetSessionId = sessionIdRef.current ?? pendingSessionIdRef.current

    if (!targetSessionId) {
      console.warn('[useTerminal] Terminal is not active (no session ID)')
      return false
    }

    if (!isActiveRef.current && !isSpawningRef.current) {
      console.warn('[useTerminal] Terminal is not active (flags false)')
      return false
    }

    try {
      console.log('[useTerminal] Invoking write_terminal with sessionId:', targetSessionId)
      await invoke('write_terminal', {
        sessionId: targetSessionId,
        data
      })
      console.log('[useTerminal] write_terminal success')
      return true
    } catch (error) {
      console.error('[useTerminal] Failed to write to terminal:', error)
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
    if (!isActiveRef.current && !isSpawningRef.current) return true // 既に終了している

    const targetSessionId = sessionIdRef.current ?? pendingSessionIdRef.current

    try {
      if (targetSessionId) {
        await invoke('close_terminal', { sessionId: targetSessionId })
      }
      cleanupEventListeners()

      if (isMountedRef.current) {
        isActiveRef.current = false
        isSpawningRef.current = false
        sessionIdRef.current = null
        pendingSessionIdRef.current = null
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
      const targetSessionId = sessionIdRef.current ?? pendingSessionIdRef.current
      if ((isActiveRef.current || isSpawningRef.current) && targetSessionId) {
        void invoke('close_terminal', { sessionId: targetSessionId }).catch(() => {
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
