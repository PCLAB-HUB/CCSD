/**
 * バリデーション関連の型定義
 */

/** バリデーション重大度 */
export type ValidationSeverity = 'error' | 'warning' | 'info'

/** バリデーションソース */
export type ValidationSource = 'yaml' | 'json' | 'schema'

/** バリデーションエラー */
export interface ValidationError {
  message: string
  line: number
  column: number
  severity: ValidationSeverity
  source: ValidationSource
}

/** バリデーション結果 */
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}
