/**
 * AIレビュー機能の型定義
 */

/** レビュー提案の重要度 */
export type SuggestionSeverity = 'critical' | 'warning' | 'info' | 'tip'

/** レビュー提案のカテゴリ */
export type SuggestionCategory =
  | 'completeness'    // 設定の完成度
  | 'security'        // セキュリティ上の懸念
  | 'performance'     // パフォーマンス改善
  | 'readability'     // 可読性向上
  | 'best-practice'   // Claude Code固有のベストプラクティス

/** 個別の改善提案 */
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

/** 総合スコア */
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

/** AIレビュー結果 */
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

/** AIレビューの状態 */
export type AIReviewStatus = 'idle' | 'loading' | 'success' | 'error'

/** AIレビューエラー */
export interface AIReviewError {
  /** エラーコード */
  code: 'api_key_missing' | 'api_error' | 'parse_error' | 'network_error' | 'unknown'
  /** エラーメッセージ */
  message: string
  /** 詳細情報（あれば） */
  details?: string
}

/** APIキー入力のための状態 */
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

/** カテゴリ表示用のメタデータ */
export const CATEGORY_META: Record<SuggestionCategory, { label: string; icon: string; color: string }> = {
  completeness: { label: '完成度', icon: 'check-circle', color: 'blue' },
  security: { label: 'セキュリティ', icon: 'shield', color: 'red' },
  performance: { label: 'パフォーマンス', icon: 'zap', color: 'yellow' },
  readability: { label: '可読性', icon: 'book', color: 'green' },
  'best-practice': { label: 'ベストプラクティス', icon: 'star', color: 'purple' },
}

/** 重要度表示用のメタデータ */
export const SEVERITY_META: Record<SuggestionSeverity, { label: string; color: string; priority: number }> = {
  critical: { label: '重要', color: 'red', priority: 1 },
  warning: { label: '警告', color: 'orange', priority: 2 },
  info: { label: '情報', color: 'blue', priority: 3 },
  tip: { label: 'ヒント', color: 'green', priority: 4 },
}
