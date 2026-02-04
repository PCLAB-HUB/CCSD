/**
 * @fileoverview クイックコマンド管理フック
 * @module hooks/useQuickCommands
 *
 * 機能:
 * - デフォルトコマンド（claude, claude --resume）
 * - カスタムコマンドの追加・削除・編集
 * - localStorageへの永続化
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { QuickCommand, CreateQuickCommandInput } from '../types/terminal'
import {
  TERMINAL_STORAGE_KEYS,
  DEFAULT_QUICK_COMMANDS,
  createQuickCommandId,
  isBuiltInCommand,
} from '../types/terminal'

// ============================================================
// 型定義
// ============================================================

/**
 * useQuickCommandsの戻り値
 */
export interface UseQuickCommandsReturn {
  /** 全てのクイックコマンド（ビルトイン + カスタム） */
  commands: QuickCommand[]
  /** ビルトインコマンドのみ */
  builtInCommands: QuickCommand[]
  /** カスタムコマンドのみ */
  customCommands: QuickCommand[]
  /** コマンド数 */
  count: number
  /** カスタムコマンドを追加する */
  addCommand: (input: CreateQuickCommandInput) => QuickCommand
  /** カスタムコマンドを削除する */
  removeCommand: (id: string) => boolean
  /** カスタムコマンドを更新する */
  updateCommand: (
    id: string,
    updates: Partial<CreateQuickCommandInput>
  ) => boolean
  /** コマンドを取得する */
  getCommand: (id: string) => QuickCommand | undefined
  /** コマンドが存在するか確認する */
  hasCommand: (id: string) => boolean
  /** カスタムコマンドをリセットする */
  resetCustomCommands: () => void
}

// ============================================================
// ストレージ操作
// ============================================================

/**
 * localStorageからカスタムコマンドを読み込む
 */
function loadCustomCommandsFromStorage(): QuickCommand[] {
  try {
    const stored = localStorage.getItem(TERMINAL_STORAGE_KEYS.CUSTOM_COMMANDS)
    if (!stored) return []

    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []

    // 形式を検証
    return parsed.filter(
      (item): item is QuickCommand =>
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.label === 'string' &&
        typeof item.command === 'string' &&
        item.isBuiltIn === false
    )
  } catch (error) {
    console.error('Failed to load custom commands from storage:', error)
    return []
  }
}

/**
 * localStorageにカスタムコマンドを保存する
 */
function saveCustomCommandsToStorage(commands: QuickCommand[]): void {
  try {
    // カスタムコマンドのみ保存
    const customOnly = commands.filter((cmd) => !cmd.isBuiltIn)
    localStorage.setItem(
      TERMINAL_STORAGE_KEYS.CUSTOM_COMMANDS,
      JSON.stringify(customOnly)
    )
  } catch (error) {
    console.error('Failed to save custom commands to storage:', error)
  }
}

// ============================================================
// フック実装
// ============================================================

/**
 * クイックコマンド管理フック
 *
 * デフォルトのClaude関連コマンドとカスタムコマンドを管理します。
 * カスタムコマンドはlocalStorageに永続化されます。
 *
 * @returns クイックコマンド操作関数と状態
 *
 * @example
 * ```tsx
 * const {
 *   commands,
 *   addCommand,
 *   removeCommand,
 * } = useQuickCommands()
 *
 * // カスタムコマンドを追加
 * const newCmd = addCommand({
 *   label: 'ビルド',
 *   command: 'npm run build',
 *   icon: '🔨',
 * })
 *
 * // コマンド一覧を表示
 * commands.map(cmd => (
 *   <button key={cmd.id} onClick={() => executeCommand(cmd.command)}>
 *     {cmd.icon} {cmd.label}
 *   </button>
 * ))
 *
 * // カスタムコマンドを削除
 * removeCommand(newCmd.id)
 * ```
 */
export function useQuickCommands(): UseQuickCommandsReturn {
  const [customCommands, setCustomCommands] = useState<QuickCommand[]>(() =>
    loadCustomCommandsFromStorage()
  )

  // マウント状態を追跡
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  /**
   * 全てのコマンド（ビルトイン + カスタム）
   */
  const commands = useMemo<QuickCommand[]>(
    () => [...DEFAULT_QUICK_COMMANDS, ...customCommands],
    [customCommands]
  )

  /**
   * カスタムコマンドを追加する
   */
  const addCommand = useCallback(
    (input: CreateQuickCommandInput): QuickCommand => {
      const newCommand: QuickCommand = {
        id: createQuickCommandId(input.label),
        label: input.label,
        command: input.command,
        icon: input.icon,
        isBuiltIn: false,
      }

      setCustomCommands((prev) => {
        const updated = [...prev, newCommand]
        saveCustomCommandsToStorage(updated)
        return updated
      })

      return newCommand
    },
    []
  )

  /**
   * カスタムコマンドを削除する
   */
  const removeCommand = useCallback((id: string): boolean => {
    let removed = false

    setCustomCommands((prev) => {
      const target = prev.find((cmd) => cmd.id === id)

      // ビルトインは削除不可
      if (!target || target.isBuiltIn) {
        return prev
      }

      const updated = prev.filter((cmd) => cmd.id !== id)
      removed = updated.length !== prev.length

      if (removed) {
        saveCustomCommandsToStorage(updated)
      }

      return updated
    })

    return removed
  }, [])

  /**
   * カスタムコマンドを更新する
   */
  const updateCommand = useCallback(
    (id: string, updates: Partial<CreateQuickCommandInput>): boolean => {
      let updated = false

      setCustomCommands((prev) => {
        const index = prev.findIndex((cmd) => cmd.id === id)

        // 存在しない、またはビルトインは更新不可
        if (index === -1 || prev[index].isBuiltIn) {
          return prev
        }

        const newCommands = [...prev]
        newCommands[index] = {
          ...newCommands[index],
          ...updates,
        }

        updated = true
        saveCustomCommandsToStorage(newCommands)

        return newCommands
      })

      return updated
    },
    []
  )

  /**
   * コマンドを取得する
   */
  const getCommand = useCallback(
    (id: string): QuickCommand | undefined => {
      return commands.find((cmd) => cmd.id === id)
    },
    [commands]
  )

  /**
   * コマンドが存在するか確認する
   */
  const hasCommand = useCallback(
    (id: string): boolean => {
      return commands.some((cmd) => cmd.id === id)
    },
    [commands]
  )

  /**
   * カスタムコマンドをリセットする
   */
  const resetCustomCommands = useCallback(() => {
    setCustomCommands([])
    saveCustomCommandsToStorage([])
  }, [])

  // 派生データ
  const count = useMemo(() => commands.length, [commands])
  const builtInCommands = useMemo(
    () => commands.filter(isBuiltInCommand),
    [commands]
  )

  return {
    commands,
    builtInCommands,
    customCommands,
    count,
    addCommand,
    removeCommand,
    updateCommand,
    getCommand,
    hasCommand,
    resetCustomCommands,
  }
}

export default useQuickCommands
