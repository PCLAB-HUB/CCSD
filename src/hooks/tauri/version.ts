/**
 * @fileoverview Claude Codeバージョン取得関連のTauri API
 * @module hooks/tauri/version
 */

import { invoke } from '@tauri-apps/api/core'

import { isTauri } from './utils'

// ============================================================
// 型定義
// ============================================================

/**
 * バージョン取得の結果を表す型
 */
export interface VersionResult {
  /** 取得が成功したかどうか */
  success: boolean
  /** バージョン文字列（成功時） */
  version: string | null
  /** エラーメッセージ（失敗時） */
  error: string | null
}

// ============================================================
// エラーメッセージ
// ============================================================

/**
 * バージョン取得エラーを日本語に変換
 * @param error - エラーオブジェクト
 * @returns 日本語のエラーメッセージ
 */
function translateVersionError(error: unknown): string {
  const errorMessage = error instanceof Error ? error.message : String(error)

  // Claude Codeがインストールされていない場合のパターン
  if (
    /not found|command not found|no such file/i.test(errorMessage) ||
    /claude.*not.*installed/i.test(errorMessage)
  ) {
    return 'Claude Codeがインストールされていません'
  }

  // その他のエラー
  return 'バージョン情報の取得に失敗しました'
}

// ============================================================
// バージョン取得
// ============================================================

/**
 * Claude Codeのバージョンを取得する
 * @returns バージョン文字列（エラー時はnull）
 */
export async function getClaudeVersion(): Promise<string | null> {
  if (!isTauri()) {
    return null
  }

  try {
    return await invoke<string>('get_claude_version')
  } catch (error) {
    console.error('Failed to get Claude version:', error)
    return null
  }
}

/**
 * Claude Codeのバージョンを取得する（詳細なエラー情報付き）
 * @returns バージョン取得結果
 */
export async function getClaudeVersionWithResult(): Promise<VersionResult> {
  if (!isTauri()) {
    return {
      success: false,
      version: null,
      error: 'Tauri環境で実行されていません',
    }
  }

  try {
    const version = await invoke<string>('get_claude_version')
    return {
      success: true,
      version,
      error: null,
    }
  } catch (error) {
    const message = translateVersionError(error)
    return {
      success: false,
      version: null,
      error: message,
    }
  }
}
