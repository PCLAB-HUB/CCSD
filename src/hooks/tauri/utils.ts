/**
 * @fileoverview Tauri API共通ユーティリティ
 * @module hooks/tauri/utils
 */

import { invoke } from '@tauri-apps/api/core'
import type { ImportResult } from '../../types'

// ============================================================
// Tauri環境判定
// ============================================================

/**
 * Tauri環境かどうかを判定する
 * Tauri v2では __TAURI_INTERNALS__ も使用される
 * @returns Tauri環境の場合true
 */
export function isTauri(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  return '__TAURI__' in window || '__TAURI_INTERNALS__' in window
}

// ============================================================
// 共通エラーハンドリング
// ============================================================

/**
 * Tauriエラーを表すカスタムエラークラス
 */
export class TauriError extends Error {
  /** 元のエラー */
  readonly cause: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'TauriError'
    this.cause = cause
  }
}

/**
 * Tauriコマンドを安全に実行するラッパー関数
 * エラー時にデフォルト値を返す
 * @param command - Tauriコマンド名
 * @param args - コマンド引数
 * @param defaultValue - エラー時のデフォルト値
 * @param logError - エラーをコンソールに出力するかどうか
 * @returns コマンドの結果またはデフォルト値
 */
export async function invokeWithDefault<T>(
  command: string,
  args: Record<string, unknown> | undefined,
  defaultValue: T,
  logError: boolean = false
): Promise<T> {
  try {
    return await invoke<T>(command, args)
  } catch (error) {
    if (logError) {
      console.error(`Tauri command '${command}' failed:`, error)
    }
    return defaultValue
  }
}

/**
 * Tauriコマンドを実行し、成功/失敗をbooleanで返すラッパー関数
 * @param command - Tauriコマンド名
 * @param args - コマンド引数
 * @param logError - エラーをコンソールに出力するかどうか
 * @returns 成功時true、失敗時false
 */
export async function invokeWithBoolean(
  command: string,
  args: Record<string, unknown> | undefined,
  logError: boolean = false
): Promise<boolean> {
  try {
    await invoke(command, args)
    return true
  } catch (error) {
    if (logError) {
      console.error(`Tauri command '${command}' failed:`, error)
    }
    return false
  }
}

/**
 * Tauriコマンドを実行し、エラー時にTauriErrorをスローするラッパー関数
 * @param command - Tauriコマンド名
 * @param args - コマンド引数
 * @throws {TauriError} コマンド実行に失敗した場合
 * @returns コマンドの結果
 */
export async function invokeOrThrow<T>(
  command: string,
  args?: Record<string, unknown>
): Promise<T> {
  try {
    return await invoke<T>(command, args)
  } catch (error) {
    throw new TauriError(`Tauri command '${command}' failed`, error)
  }
}

/**
 * デフォルトのImportResult（エラー時に使用）
 * @param errors - エラーメッセージの配列
 */
export function createErrorImportResult(errors: string[]): ImportResult {
  return {
    success: false,
    imported_files: [],
    skipped_files: [],
    errors,
    backup_created: false,
  }
}
