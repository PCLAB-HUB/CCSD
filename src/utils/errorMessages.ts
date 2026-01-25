/**
 * 構文エラーの日本語メッセージ定義
 */

export type ValidationSeverity = 'error' | 'warning' | 'info'

export interface ValidationError {
  message: string
  line: number
  column: number
  severity: ValidationSeverity
  source: 'yaml' | 'json'
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
