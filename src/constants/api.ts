/**
 * API関連の定数
 * エンドポイント、モデル名、APIバージョンなど
 */

/** Anthropic APIエンドポイント */
export const ANTHROPIC_API_ENDPOINT = 'https://api.anthropic.com/v1/messages'

/** Anthropic APIバージョン */
export const ANTHROPIC_API_VERSION = '2023-06-01'

/** デフォルトで使用するClaudeモデル */
export const DEFAULT_CLAUDE_MODEL = 'claude-sonnet-4-20250514'

/** AIレビューの最大トークン数 */
export const AI_REVIEW_MAX_TOKENS = 4096

/** APIキー検証用の最大トークン数 */
export const API_KEY_VALIDATION_MAX_TOKENS = 10

/** APIキーのプレフィックス（バリデーション用） */
export const API_KEY_PREFIX = 'sk-ant-'
