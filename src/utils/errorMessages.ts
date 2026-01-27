/**
 * エラーメッセージの日本語メッセージ定義
 */

import type { ValidationSeverity, ValidationError } from '../types'

export type { ValidationSeverity, ValidationError }

// ============================================================
// ファイル操作エラー
// ============================================================

// ファイル操作エラーパターンと日本語メッセージのマッピング
const fileErrorPatterns: Array<{ pattern: RegExp; message: string }> = [
  { pattern: /no such file or directory/i, message: 'ファイルまたはディレクトリが見つかりません' },
  { pattern: /permission denied/i, message: 'アクセス権限がありません' },
  { pattern: /file not found/i, message: 'ファイルが見つかりません' },
  { pattern: /directory not found/i, message: 'ディレクトリが見つかりません' },
  { pattern: /already exists/i, message: 'ファイルが既に存在します' },
  { pattern: /is a directory/i, message: '指定されたパスはディレクトリです' },
  { pattern: /not a directory/i, message: '指定されたパスはディレクトリではありません' },
  { pattern: /disk full|no space left/i, message: 'ディスクの空き容量がありません' },
  { pattern: /read-only file system/i, message: '読み取り専用のファイルシステムです' },
  { pattern: /too many open files/i, message: '開いているファイルが多すぎます' },
  { pattern: /file name too long/i, message: 'ファイル名が長すぎます' },
  { pattern: /invalid argument/i, message: '無効な引数です' },
  { pattern: /operation not permitted/i, message: '操作が許可されていません' },
  { pattern: /resource busy/i, message: 'リソースが使用中です' },
  { pattern: /io error/i, message: '入出力エラーが発生しました' },
  { pattern: /interrupted/i, message: '操作が中断されました' },
  { pattern: /would block/i, message: '操作がブロックされました' },
  { pattern: /timed out/i, message: '操作がタイムアウトしました' },
  { pattern: /connection refused/i, message: '接続が拒否されました' },
  { pattern: /not running in tauri/i, message: 'Tauri環境で実行されていません' },
]

/**
 * ファイル操作エラーメッセージを日本語に変換
 * @param originalMessage - 元のエラーメッセージ
 * @returns 日本語のエラーメッセージ
 */
export function translateFileError(originalMessage: string): string {
  for (const { pattern, message } of fileErrorPatterns) {
    if (pattern.test(originalMessage)) {
      return message
    }
  }
  return `ファイル操作エラー: ${originalMessage}`
}

/**
 * Tauriコマンドエラーを操作別に日本語メッセージに変換
 * @param command - Tauriコマンド名
 * @param error - エラーオブジェクト
 * @returns 日本語のエラーメッセージ
 */
export function translateTauriCommandError(command: string, error: unknown): string {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const translatedError = translateFileError(errorMessage)

  // コマンド別のコンテキストを追加
  const commandContextMap: Record<string, string> = {
    'get_file_tree': 'ファイルツリーの取得に失敗しました',
    'read_file': 'ファイルの読み込みに失敗しました',
    'write_file': 'ファイルの書き込みに失敗しました',
    'create_file': 'ファイルの作成に失敗しました',
    'search_files': 'ファイルの検索に失敗しました',
    'search_and_replace_in_file': '検索・置換に失敗しました',
  }

  const context = commandContextMap[command] || `コマンド「${command}」の実行に失敗しました`
  return `${context}: ${translatedError}`
}

// YAMLエラーパターンと日本語メッセージのマッピング
const yamlErrorPatterns: Array<{ pattern: RegExp; message: string }> = [
  { pattern: /bad indentation/i, message: 'インデントが正しくありません' },
  { pattern: /duplicate key/i, message: 'キーが重複しています' },
  { pattern: /unexpected end of the stream/i, message: '予期しないファイル終端です' },
  { pattern: /expected.*but found/i, message: '予期しないトークンが見つかりました' },
  { pattern: /can not read a block mapping entry/i, message: 'マッピングエントリを読み取れません' },
  { pattern: /tab character.*not allowed/i, message: 'タブ文字は使用できません（スペースを使用してください）' },
  { pattern: /incomplete explicit mapping pair/i, message: 'マッピングが不完全です' },
  { pattern: /invalid block scalar/i, message: '無効なブロックスカラーです' },
  { pattern: /did not find expected key/i, message: 'キーが見つかりません' },
  { pattern: /did not find expected/i, message: '構文エラー: 期待されるトークンが見つかりません' },
  { pattern: /unknown tag/i, message: '不明なタグです' },
  { pattern: /nested mappings are not allowed/i, message: 'ネストされたマッピングは許可されていません' },
  { pattern: /mapping values are not allowed/i, message: 'この位置にマッピング値は使用できません' },
  { pattern: /unacceptable kind of block scalar/i, message: '無効なブロックスカラーの種類です' },
  { pattern: /anchor.*is not defined/i, message: 'アンカーが定義されていません' },
]

// JSONエラーパターンと日本語メッセージのマッピング
const jsonErrorPatterns: Array<{ pattern: RegExp; message: string }> = [
  { pattern: /unexpected token/i, message: '予期しないトークンです' },
  { pattern: /unexpected end of json/i, message: 'JSONが途中で終了しています' },
  { pattern: /expected.*after/i, message: '構文エラー: 期待されるトークンがありません' },
  { pattern: /unexpected string/i, message: '予期しない文字列です' },
  { pattern: /expected.*at/i, message: '構文エラーです' },
  { pattern: /bad control character/i, message: '無効な制御文字です' },
  { pattern: /bad string char/i, message: '無効な文字が文字列に含まれています' },
  { pattern: /bad unicode escape/i, message: '無効なUnicodeエスケープです' },
]

/**
 * YAMLエラーメッセージを日本語に変換
 */
export function translateYamlError(originalMessage: string): string {
  for (const { pattern, message } of yamlErrorPatterns) {
    if (pattern.test(originalMessage)) {
      return message
    }
  }
  return `YAML構文エラー: ${originalMessage}`
}

/**
 * JSONエラーメッセージを日本語に変換
 */
export function translateJsonError(originalMessage: string): string {
  for (const { pattern, message } of jsonErrorPatterns) {
    if (pattern.test(originalMessage)) {
      return message
    }
  }
  return `JSON構文エラー: ${originalMessage}`
}

/**
 * 警告レベルに応じた色を返す
 */
export function getSeverityColor(severity: ValidationSeverity): string {
  switch (severity) {
    case 'error':
      return 'text-red-600 dark:text-red-400'
    case 'warning':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'info':
      return 'text-blue-600 dark:text-blue-400'
  }
}

/**
 * 警告レベルに応じたアイコンを返す
 */
export function getSeverityIcon(severity: ValidationSeverity): string {
  switch (severity) {
    case 'error':
      return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
    case 'warning':
      return 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    case 'info':
      return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  }
}

// ============================================================
// エラーログユーティリティ
// ============================================================

/**
 * エラーをコンソールに出力する共通関数
 * 本番環境でのデバッグを容易にするため、コンテキスト情報を付加
 *
 * @param context - エラーが発生した場所や操作の説明（日本語）
 * @param error - キャッチしたエラーオブジェクト
 * @param additionalInfo - 追加の診断情報（オプション）
 */
export function logError(
  context: string,
  error: unknown,
  additionalInfo?: Record<string, unknown>
): void {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined

  console.error(`[${context}]`, {
    message: errorMessage,
    stack: errorStack,
    ...additionalInfo,
  })
}

/**
 * 警告をコンソールに出力する共通関数
 *
 * @param context - 警告が発生した場所や操作の説明（日本語）
 * @param message - 警告メッセージ
 * @param additionalInfo - 追加の診断情報（オプション）
 */
export function logWarning(
  context: string,
  message: string,
  additionalInfo?: Record<string, unknown>
): void {
  console.warn(`[${context}] ${message}`, additionalInfo ?? '')
}

/**
 * エラーからユーザー向けメッセージを抽出する
 *
 * @param error - キャッチしたエラーオブジェクト
 * @param defaultMessage - エラーが不明な場合のデフォルトメッセージ
 * @returns ユーザー向けのエラーメッセージ
 */
export function getErrorMessage(
  error: unknown,
  defaultMessage = '予期しないエラーが発生しました'
): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return defaultMessage
}
