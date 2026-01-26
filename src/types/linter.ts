/**
 * ベストプラクティスリンター関連の型定義
 *
 * スキル/エージェント定義のベストプラクティスをチェックする機能の型を定義
 */

/**
 * リントルールの識別子
 */
export type LintRuleId = string & { readonly __brand: 'LintRuleId' }

/**
 * リントルールの重大度
 */
export type LintSeverity = 'error' | 'warning' | 'info' | 'hint'

/**
 * リントルールのカテゴリ
 */
export type LintCategory =
  | 'structure'      // 構造に関するルール
  | 'naming'         // 命名規則に関するルール
  | 'documentation'  // ドキュメントに関するルール
  | 'performance'    // パフォーマンスに関するルール
  | 'security'       // セキュリティに関するルール
  | 'best-practice'  // 一般的なベストプラクティス
  | 'deprecated'     // 非推奨機能の使用

/**
 * リントルールの定義
 */
export interface LintRule {
  /** ルールの一意識別子 */
  id: LintRuleId
  /** ルール名 */
  name: string
  /** ルールの説明 */
  description: string
  /** 重大度 */
  severity: LintSeverity
  /** カテゴリ */
  category: LintCategory
  /** 有効/無効 */
  enabled: boolean
  /** 適用対象のファイルパターン（globパターン） */
  filePatterns: string[]
  /** ドキュメントURL（オプション） */
  documentationUrl?: string
  /** 自動修正が可能かどうか */
  fixable: boolean
  /** ルールのタグ（フィルタリング用） */
  tags: string[]
}

/**
 * リント結果の個別アイテム
 */
export interface LintResult {
  /** 対応するルールのID */
  ruleId: LintRuleId
  /** 重大度 */
  severity: LintSeverity
  /** メッセージ */
  message: string
  /** ファイルパス */
  filePath: string
  /** 開始行（1始まり） */
  line: number
  /** 開始列（1始まり） */
  column: number
  /** 終了行（オプション） */
  endLine?: number
  /** 終了列（オプション） */
  endColumn?: number
  /** 問題のあるコード部分 */
  source?: string
  /** 修正提案（オプション） */
  fix?: LintFix
  /** 追加の提案（オプション） */
  suggestions?: LintSuggestion[]
}

/**
 * リントの自動修正
 */
export interface LintFix {
  /** 修正の説明 */
  description: string
  /** 置換範囲 */
  range: LintRange
  /** 置換後のテキスト */
  text: string
}

/**
 * リントの提案（手動適用）
 */
export interface LintSuggestion {
  /** 提案の説明 */
  description: string
  /** 修正内容 */
  fix: LintFix
}

/**
 * テキスト範囲
 */
export interface LintRange {
  /** 開始オフセット */
  start: number
  /** 終了オフセット */
  end: number
}

/**
 * ファイルごとのリント結果
 */
export interface FileLintResults {
  /** ファイルパス */
  filePath: string
  /** ファイル名 */
  fileName: string
  /** リント結果の一覧 */
  results: LintResult[]
  /** エラー数 */
  errorCount: number
  /** 警告数 */
  warningCount: number
  /** 情報数 */
  infoCount: number
  /** ヒント数 */
  hintCount: number
  /** 修正可能な問題数 */
  fixableCount: number
}

/**
 * 全体のリントサマリー
 */
export interface LintSummary {
  /** 対象ファイル数 */
  totalFiles: number
  /** 問題のあるファイル数 */
  filesWithProblems: number
  /** 総エラー数 */
  totalErrors: number
  /** 総警告数 */
  totalWarnings: number
  /** 総情報数 */
  totalInfos: number
  /** 総ヒント数 */
  totalHints: number
  /** 修正可能な問題数 */
  totalFixable: number
  /** 実行時間（ミリ秒） */
  executionTimeMs: number
}

/**
 * リンター設定
 */
export interface LinterConfig {
  /** 有効なルールのIDリスト */
  enabledRules: LintRuleId[]
  /** 無効なルールのIDリスト */
  disabledRules: LintRuleId[]
  /** 重大度の上書き */
  severityOverrides: Record<string, LintSeverity>
  /** 除外するファイルパターン */
  excludePatterns: string[]
  /** 修正を自動適用するかどうか */
  autoFix: boolean
  /** 保存時にリントを実行するかどうか */
  lintOnSave: boolean
  /** 入力時にリントを実行するかどうか */
  lintOnType: boolean
  /** 入力時リントの遅延（ミリ秒） */
  lintOnTypeDelay: number
}

/**
 * リンター状態
 */
export interface LinterState {
  /** リント実行中かどうか */
  isRunning: boolean
  /** 最後のリント結果 */
  lastResults: FileLintResults[]
  /** 最後のサマリー */
  lastSummary: LintSummary | null
  /** 最後のリント実行日時 */
  lastRunAt: string | null
  /** エラーメッセージ */
  error: string | null
  /** 設定 */
  config: LinterConfig
}

/**
 * リンターアクション型
 */
export type LinterAction =
  | { type: 'START_LINT' }
  | { type: 'LINT_COMPLETE'; payload: { results: FileLintResults[]; summary: LintSummary } }
  | { type: 'LINT_ERROR'; payload: string }
  | { type: 'APPLY_FIX'; payload: { filePath: string; fix: LintFix } }
  | { type: 'APPLY_ALL_FIXES'; payload: string }
  | { type: 'TOGGLE_RULE'; payload: LintRuleId }
  | { type: 'UPDATE_CONFIG'; payload: Partial<LinterConfig> }
  | { type: 'CLEAR_RESULTS' }

/**
 * 組み込みルールセット
 */
export interface BuiltInRuleSet {
  /** ルールセットのID */
  id: string
  /** ルールセット名 */
  name: string
  /** 説明 */
  description: string
  /** 含まれるルールID */
  ruleIds: LintRuleId[]
}

/**
 * リントルールIDを生成するヘルパー関数
 */
export function createLintRuleId(category: LintCategory, name: string): LintRuleId {
  return `${category}/${name}` as LintRuleId
}

/**
 * リント結果をカウント
 */
export function countLintResults(results: LintResult[]): {
  errors: number
  warnings: number
  infos: number
  hints: number
} {
  return results.reduce(
    (acc, result) => {
      switch (result.severity) {
        case 'error':
          acc.errors++
          break
        case 'warning':
          acc.warnings++
          break
        case 'info':
          acc.infos++
          break
        case 'hint':
          acc.hints++
          break
      }
      return acc
    },
    { errors: 0, warnings: 0, infos: 0, hints: 0 }
  )
}

/**
 * 重大度でフィルタリング
 */
export function filterBySeverity(
  results: LintResult[],
  severities: LintSeverity[]
): LintResult[] {
  return results.filter(result => severities.includes(result.severity))
}
