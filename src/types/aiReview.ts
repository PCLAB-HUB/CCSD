/**
 * 設定AIレビュー関連の型定義
 *
 * Claudeによる設定ファイルの改善提案機能の型を定義
 */

// ============================================================
// 基本型（現行版との後方互換性を維持）
// ============================================================

/**
 * 提案の重要度
 */
export type SuggestionSeverity = 'critical' | 'warning' | 'info' | 'tip'

/**
 * 提案のカテゴリ
 */
export type SuggestionCategory =
  | 'completeness'    // 設定の完成度
  | 'security'        // セキュリティ上の懸念
  | 'performance'     // パフォーマンス改善
  | 'readability'     // 可読性向上
  | 'best-practice'   // Claude Code固有のベストプラクティス

/**
 * 個別の改善提案（現行版）
 */
export interface ReviewSuggestion {
  /** 提案ID（一意識別子） */
  id: string
  /** カテゴリ */
  category: SuggestionCategory
  /** 重要度 */
  severity: SuggestionSeverity
  /** 提案タイトル */
  title: string
  /** 詳細な説明 */
  description: string
  /** 該当する行番号（あれば） */
  lineNumber?: number
  /** 修正前のコード例（あれば） */
  before?: string
  /** 修正後のコード例（あれば） */
  after?: string
}

/**
 * 総合スコア
 */
export interface ReviewScore {
  /** 総合スコア（0-100） */
  overall: number
  /** 完成度スコア（0-100） */
  completeness: number
  /** セキュリティスコア（0-100） */
  security: number
  /** 可読性スコア（0-100） */
  readability: number
  /** ベストプラクティス準拠度（0-100） */
  bestPractice: number
}

/**
 * AIレビュー結果（現行版）
 */
export interface AIReviewResult {
  /** レビュー実行日時 */
  timestamp: string
  /** レビュー対象ファイル名 */
  fileName: string
  /** レビュー対象ファイルパス */
  filePath: string
  /** 総合スコア */
  score: ReviewScore
  /** 総合サマリー */
  summary: string
  /** 改善提案一覧 */
  suggestions: ReviewSuggestion[]
  /** 良い点 */
  positives: string[]
}

/**
 * AIレビューの状態
 */
export type AIReviewStatus = 'idle' | 'loading' | 'success' | 'error'

/**
 * AIレビューエラー（現行版）
 */
export interface AIReviewError {
  /** エラーコード */
  code: 'api_key_missing' | 'api_error' | 'parse_error' | 'network_error' | 'unknown'
  /** エラーメッセージ */
  message: string
  /** 詳細情報（あれば） */
  details?: string
}

/**
 * APIキー入力のための状態
 */
export interface APIKeyModalState {
  /** モーダルが開いているか */
  isOpen: boolean
  /** 入力中のAPIキー */
  inputValue: string
  /** 検証中か */
  isValidating: boolean
  /** エラーメッセージ */
  error?: string
}

/**
 * カテゴリ表示用のメタデータ
 */
export const CATEGORY_META: Record<SuggestionCategory, { label: string; icon: string; color: string }> = {
  completeness: { label: '完成度', icon: 'check-circle', color: 'blue' },
  security: { label: 'セキュリティ', icon: 'shield', color: 'red' },
  performance: { label: 'パフォーマンス', icon: 'zap', color: 'yellow' },
  readability: { label: '可読性', icon: 'book', color: 'green' },
  'best-practice': { label: 'ベストプラクティス', icon: 'star', color: 'purple' },
}

/**
 * 重要度表示用のメタデータ
 */
export const SEVERITY_META: Record<SuggestionSeverity, { label: string; color: string; priority: number }> = {
  critical: { label: '重要', color: 'red', priority: 1 },
  warning: { label: '警告', color: 'orange', priority: 2 },
  info: { label: '情報', color: 'blue', priority: 3 },
  tip: { label: 'ヒント', color: 'green', priority: 4 },
}

// ============================================================
// 拡張型（新機能用）
// ============================================================

/**
 * レビューリクエストの識別子
 */
export type ReviewRequestId = string & { readonly __brand: 'ReviewRequestId' }

/**
 * レビューの種類
 */
export type ReviewType =
  | 'comprehensive'  // 包括的レビュー
  | 'quick'          // クイックレビュー
  | 'focused'        // 特定領域のレビュー

/**
 * レビュー対象の領域
 */
export type ReviewFocus =
  | 'completeness'    // 完成度
  | 'security'        // セキュリティ
  | 'performance'     // パフォーマンス
  | 'readability'     // 可読性
  | 'best-practice'   // ベストプラクティス
  | 'all'             // すべて

/**
 * 個別の改善提案（拡張版）
 *
 * 適用/却下状態、根拠、影響範囲などの追加情報を含む
 */
export interface ReviewSuggestionExtended {
  /** 提案ID（一意識別子） */
  id: string
  /** カテゴリ */
  category: SuggestionCategory
  /** 重要度 */
  severity: SuggestionSeverity
  /** 提案タイトル */
  title: string
  /** 詳細な説明 */
  description: string
  /** 提案の根拠 */
  rationale: string
  /** 該当する行番号（あれば） */
  lineNumber?: number
  /** 該当する行範囲（あれば） */
  lineRange?: {
    start: number
    end: number
  }
  /** 修正前のコード例（あれば） */
  before?: string
  /** 修正後のコード例（あれば） */
  after?: string
  /** 影響範囲の説明 */
  impact?: string
  /** 適用済みかどうか */
  isApplied: boolean
  /** 却下済みかどうか */
  isDismissed: boolean
}

/**
 * AIレビュー結果（拡張版）
 */
export interface AIReviewResultExtended {
  /** リクエストID */
  requestId: ReviewRequestId
  /** レビュー実行日時（ISO 8601形式） */
  timestamp: string
  /** レビュー対象ファイル名 */
  fileName: string
  /** レビュー対象ファイルパス */
  filePath: string
  /** 総合スコア */
  score: ReviewScore
  /** 総合サマリー */
  summary: string
  /** 改善提案一覧 */
  suggestions: ReviewSuggestionExtended[]
  /** 良い点 */
  positives: string[]
  /** レビューにかかった時間（ミリ秒） */
  durationMs: number
}

// ============================================================
// 拡張版の状態管理
// ============================================================

/**
 * AIレビュー状態（拡張版）
 */
export interface AIReviewStateExtended {
  /** レビュー状態 */
  status: AIReviewStatus
  /** 進行状況（0-100） */
  progress: number
  /** 進行状況のメッセージ */
  progressMessage: string
  /** 現在のレビューリクエスト */
  currentRequest: ReviewRequest | null
  /** 最後のレビュー結果 */
  lastResult: AIReviewResultExtended | null
  /** レビュー履歴 */
  history: ReviewHistoryItem[]
  /** エラー情報 */
  error: AIReviewErrorExtended | null
  /** 設定 */
  settings: AIReviewSettings
}

/**
 * レビューリクエスト
 */
export interface ReviewRequest {
  /** リクエストID */
  id: ReviewRequestId
  /** レビュー対象のファイルパス */
  filePath: string
  /** ファイル名 */
  fileName: string
  /** ファイルの内容 */
  content: string
  /** レビューの種類 */
  type: ReviewType
  /** フォーカス領域 */
  focus: ReviewFocus[]
  /** リクエスト日時（ISO 8601形式） */
  requestedAt: string
  /** 追加のコンテキスト（オプション） */
  additionalContext?: string
}

/**
 * レビュー履歴アイテム
 */
export interface ReviewHistoryItem {
  /** リクエストID */
  requestId: ReviewRequestId
  /** ファイルパス */
  filePath: string
  /** ファイル名 */
  fileName: string
  /** レビュー日時 */
  reviewedAt: string
  /** 全体スコア */
  overallScore: number
  /** 提案数 */
  suggestionCount: number
  /** 適用済み提案数 */
  appliedCount: number
}

// ============================================================
// 拡張版エラー
// ============================================================

/**
 * AIレビューエラーコード（拡張版）
 */
export type AIReviewErrorCode =
  | 'api_key_missing'
  | 'api_key_invalid'
  | 'api_error'
  | 'rate_limit'
  | 'parse_error'
  | 'network_error'
  | 'timeout'
  | 'unknown'

/**
 * AIレビューエラー（拡張版）
 */
export interface AIReviewErrorExtended {
  /** エラーコード */
  code: AIReviewErrorCode
  /** エラーメッセージ */
  message: string
  /** 詳細情報（あれば） */
  details?: string
}

// ============================================================
// 設定
// ============================================================

/**
 * AIレビュー設定
 */
export interface AIReviewSettings {
  /** APIキーが設定されているか */
  apiKeyConfigured: boolean
  /** 使用するモデル */
  model: AIReviewModel
  /** デフォルトのレビュータイプ */
  defaultReviewType: ReviewType
  /** デフォルトのフォーカス領域 */
  defaultFocus: ReviewFocus[]
  /** 自動レビューを有効にするか */
  autoReview: boolean
  /** 自動レビューのトリガー */
  autoReviewTrigger: 'save' | 'change' | 'none'
  /** レビュー結果の保持数 */
  historyLimit: number
  /** 提案の最大数 */
  maxSuggestions: number
  /** レビュー言語 */
  language: 'ja' | 'en'
}

/**
 * 使用可能なAIモデル
 */
export type AIReviewModel =
  | 'claude-sonnet-4-20250514'
  | 'claude-3-5-haiku-20241022'
  | 'claude-opus-4-20250514'

// ============================================================
// 拡張版の入力/操作型
// ============================================================

/**
 * レビューリクエスト入力
 */
export interface CreateReviewRequestInput {
  /** ファイルパス */
  filePath: string
  /** ファイル名 */
  fileName: string
  /** ファイルの内容 */
  content: string
  /** レビューの種類 */
  type?: ReviewType
  /** フォーカス領域 */
  focus?: ReviewFocus[]
  /** 追加のコンテキスト */
  additionalContext?: string
}

/**
 * 提案適用の結果
 */
export interface ApplySuggestionResult {
  /** 成功したかどうか */
  success: boolean
  /** 適用後の内容 */
  newContent?: string
  /** エラーメッセージ（失敗時） */
  error?: string
}

// ============================================================
// アクション型（Reducer用）
// ============================================================

/**
 * AIレビューアクション型
 */
export type AIReviewAction =
  | { type: 'START_REVIEW'; payload: ReviewRequest }
  | { type: 'UPDATE_PROGRESS'; payload: { progress: number; message: string } }
  | { type: 'REVIEW_COMPLETE'; payload: AIReviewResultExtended }
  | { type: 'REVIEW_ERROR'; payload: AIReviewErrorExtended }
  | { type: 'APPLY_SUGGESTION'; payload: { resultId: ReviewRequestId; suggestionId: string } }
  | { type: 'DISMISS_SUGGESTION'; payload: { resultId: ReviewRequestId; suggestionId: string } }
  | { type: 'APPLY_ALL_SUGGESTIONS'; payload: ReviewRequestId }
  | { type: 'CLEAR_RESULT' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AIReviewSettings> }
  | { type: 'LOAD_HISTORY'; payload: ReviewHistoryItem[] }
  | { type: 'CLEAR_HISTORY' }

// ============================================================
// 拡張版フック戻り値型
// ============================================================

/**
 * AIレビュー操作のインターフェース（拡張版）
 */
export interface AIReviewActionsExtended {
  /** レビューを開始 */
  startReview: (input: CreateReviewRequestInput) => Promise<void>
  /** レビューをキャンセル */
  cancelReview: () => void
  /** 提案を適用 */
  applySuggestion: (suggestionId: string) => Promise<ApplySuggestionResult>
  /** 提案を却下 */
  dismissSuggestion: (suggestionId: string) => void
  /** すべての提案を適用 */
  applyAllSuggestions: () => Promise<ApplySuggestionResult[]>
  /** 結果をクリア */
  clearResult: () => void
  /** 設定を更新 */
  updateSettings: (settings: Partial<AIReviewSettings>) => void
  /** APIキーを設定 */
  setApiKey: (apiKey: string) => Promise<boolean>
  /** 履歴をクリア */
  clearHistory: () => void
}

/**
 * useAIReviewExtendedの戻り値
 */
export interface UseAIReviewExtendedReturn extends AIReviewStateExtended, AIReviewActionsExtended {
  /** レビュー中かどうか */
  isReviewing: boolean
  /** 未適用の提案数 */
  pendingSuggestionCount: number
  /** 高優先度の提案 */
  highPrioritySuggestions: ReviewSuggestionExtended[]
}

// ============================================================
// ヘルパー関数
// ============================================================

/**
 * レビューリクエストIDを生成するヘルパー関数
 */
export function createReviewRequestId(): ReviewRequestId {
  return `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` as ReviewRequestId
}

/**
 * スコアに基づいてグレードを取得
 */
export function getScoreGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

/**
 * スコアに基づいて色を取得
 */
export function getScoreColor(score: number): string {
  if (score >= 90) return 'green'
  if (score >= 80) return 'blue'
  if (score >= 70) return 'yellow'
  if (score >= 60) return 'orange'
  return 'red'
}

/**
 * 優先度でソート
 */
export function sortBySeverity(suggestions: ReviewSuggestion[]): ReviewSuggestion[] {
  return [...suggestions].sort(
    (a, b) => SEVERITY_META[a.severity].priority - SEVERITY_META[b.severity].priority
  )
}

/**
 * 未適用の提案をフィルタ（拡張版）
 */
export function getUnappliedSuggestions(suggestions: ReviewSuggestionExtended[]): ReviewSuggestionExtended[] {
  return suggestions.filter(s => !s.isApplied && !s.isDismissed)
}

/**
 * カテゴリでグループ化
 */
export function groupByCategory(
  suggestions: ReviewSuggestion[]
): Map<SuggestionCategory, ReviewSuggestion[]> {
  const grouped = new Map<SuggestionCategory, ReviewSuggestion[]>()

  for (const suggestion of suggestions) {
    const existing = grouped.get(suggestion.category) ?? []
    grouped.set(suggestion.category, [...existing, suggestion])
  }

  return grouped
}

/**
 * デフォルト設定
 */
export const DEFAULT_AI_REVIEW_SETTINGS: AIReviewSettings = {
  apiKeyConfigured: false,
  model: 'claude-sonnet-4-20250514',
  defaultReviewType: 'comprehensive',
  defaultFocus: ['all'],
  autoReview: false,
  autoReviewTrigger: 'none',
  historyLimit: 50,
  maxSuggestions: 20,
  language: 'ja',
}
