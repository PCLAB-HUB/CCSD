/**
 * @fileoverview ターミナルコマンド履歴管理フック
 * @module hooks/useTerminalHistory
 *
 * 機能:
 * - コマンド履歴の追加・削除・クリア
 * - localStorageへの永続化
 * - 履歴ナビゲーション（上下キー操作）
 * - 直近100件を保持
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { CommandHistoryItem, CommandHistoryState } from '../types/terminal'
import {
  TERMINAL_STORAGE_KEYS,
  createCommandHistoryId,
  createDefaultHistoryState,
  limitCommandHistory,
} from '../types/terminal'

// ============================================================
// 型定義
// ============================================================

/**
 * useTerminalHistoryの戻り値
 */
export interface UseTerminalHistoryReturn {
  /** 履歴アイテムの配列 */
  items: CommandHistoryItem[]
  /** 現在選択中のインデックス */
  currentIndex: number
  /** 履歴の件数 */
  count: number
  /** 履歴が空かどうか */
  isEmpty: boolean
  /** コマンドを履歴に追加する */
  addCommand: (command: string) => void
  /** 履歴から削除する */
  removeCommand: (id: string) => void
  /** 履歴をクリアする */
  clearHistory: () => void
  /** 履歴をナビゲートする（上キー） */
  navigateUp: () => string | null
  /** 履歴をナビゲートする（下キー） */
  navigateDown: () => string | null
  /** ナビゲーションインデックスをリセットする */
  resetNavigation: () => void
  /** 指定インデックスのコマンドを取得する */
  getCommand: (index: number) => string | null
}

// ============================================================
// ストレージ操作
// ============================================================

/**
 * localStorageから履歴を読み込む
 */
function loadHistoryFromStorage(): CommandHistoryItem[] {
  try {
    const stored = localStorage.getItem(TERMINAL_STORAGE_KEYS.COMMAND_HISTORY)
    if (!stored) return []

    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []

    // 形式を検証
    return parsed.filter(
      (item): item is CommandHistoryItem =>
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.command === 'string' &&
        typeof item.timestamp === 'number'
    )
  } catch (error) {
    console.error('Failed to load command history from storage:', error)
    return []
  }
}

/**
 * localStorageに履歴を保存する
 */
function saveHistoryToStorage(items: CommandHistoryItem[]): void {
  try {
    localStorage.setItem(
      TERMINAL_STORAGE_KEYS.COMMAND_HISTORY,
      JSON.stringify(items)
    )
  } catch (error) {
    console.error('Failed to save command history to storage:', error)
  }
}

// ============================================================
// フック実装
// ============================================================

/**
 * ターミナルコマンド履歴管理フック
 *
 * @returns 履歴操作関数と状態
 *
 * @example
 * ```tsx
 * const {
 *   items,
 *   addCommand,
 *   navigateUp,
 *   navigateDown,
 *   resetNavigation,
 * } = useTerminalHistory()
 *
 * // コマンド実行時に履歴に追加
 * addCommand('npm install')
 *
 * // 上キー押下時
 * const prevCommand = navigateUp()
 * if (prevCommand) {
 *   setInputValue(prevCommand)
 * }
 *
 * // 下キー押下時
 * const nextCommand = navigateDown()
 * setInputValue(nextCommand ?? '')
 *
 * // 新しいコマンド入力開始時
 * resetNavigation()
 * ```
 */
export function useTerminalHistory(): UseTerminalHistoryReturn {
  const [state, setState] = useState<CommandHistoryState>(() => ({
    items: loadHistoryFromStorage(),
    currentIndex: -1,
  }))

  // マウント状態を追跡
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  /**
   * コマンドを履歴に追加する
   */
  const addCommand = useCallback((command: string) => {
    // 空白のみのコマンドは追加しない
    const trimmed = command.trim()
    if (!trimmed) return

    setState((prev) => {
      // 直前と同じコマンドは追加しない
      if (prev.items.length > 0 && prev.items[0].command === trimmed) {
        return prev
      }

      const newItem: CommandHistoryItem = {
        id: createCommandHistoryId(),
        command: trimmed,
        timestamp: Date.now(),
      }

      // 新しいアイテムを先頭に追加
      const newItems = limitCommandHistory([newItem, ...prev.items])

      // ストレージに保存
      saveHistoryToStorage(newItems)

      return {
        items: newItems,
        currentIndex: -1, // ナビゲーションをリセット
      }
    })
  }, [])

  /**
   * 履歴から削除する
   */
  const removeCommand = useCallback((id: string) => {
    setState((prev) => {
      const newItems = prev.items.filter((item) => item.id !== id)

      // ストレージに保存
      saveHistoryToStorage(newItems)

      return {
        items: newItems,
        currentIndex: -1,
      }
    })
  }, [])

  /**
   * 履歴をクリアする
   */
  const clearHistory = useCallback(() => {
    setState(createDefaultHistoryState())
    saveHistoryToStorage([])
  }, [])

  /**
   * 履歴を上方向（過去）にナビゲートする
   */
  const navigateUp = useCallback((): string | null => {
    let result: string | null = null

    setState((prev) => {
      if (prev.items.length === 0) {
        return prev
      }

      // 次のインデックスを計算
      const nextIndex =
        prev.currentIndex < prev.items.length - 1
          ? prev.currentIndex + 1
          : prev.currentIndex

      result = prev.items[nextIndex]?.command ?? null

      return {
        ...prev,
        currentIndex: nextIndex,
      }
    })

    return result
  }, [])

  /**
   * 履歴を下方向（最新）にナビゲートする
   */
  const navigateDown = useCallback((): string | null => {
    let result: string | null = null

    setState((prev) => {
      if (prev.items.length === 0 || prev.currentIndex < 0) {
        return prev
      }

      // 次のインデックスを計算
      const nextIndex = prev.currentIndex - 1

      if (nextIndex < 0) {
        // 最新より先に行った場合は空文字を返す
        result = null
        return {
          ...prev,
          currentIndex: -1,
        }
      }

      result = prev.items[nextIndex]?.command ?? null

      return {
        ...prev,
        currentIndex: nextIndex,
      }
    })

    return result
  }, [])

  /**
   * ナビゲーションインデックスをリセットする
   */
  const resetNavigation = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentIndex: -1,
    }))
  }, [])

  /**
   * 指定インデックスのコマンドを取得する
   */
  const getCommand = useCallback(
    (index: number): string | null => {
      if (index < 0 || index >= state.items.length) {
        return null
      }
      return state.items[index]?.command ?? null
    },
    [state.items]
  )

  // 派生データ
  const count = useMemo(() => state.items.length, [state.items])
  const isEmpty = useMemo(() => state.items.length === 0, [state.items])

  return {
    items: state.items,
    currentIndex: state.currentIndex,
    count,
    isEmpty,
    addCommand,
    removeCommand,
    clearHistory,
    navigateUp,
    navigateDown,
    resetNavigation,
    getCommand,
  }
}

export default useTerminalHistory
