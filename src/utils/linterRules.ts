/**
 * ベストプラクティスリンタールール定義
 * Claude Code設定ファイル（SKILL.md, エージェント定義）用
 */

import type { ValidationError, ValidationSeverity } from '../types'

// ============================================================================
// 型定義
// ============================================================================

/** リンタールールID */
export type LinterRuleId =
  // スキル定義ルール
  | 'skill-name-required'
  | 'skill-description-required'
  | 'skill-description-min-length'
  | 'skill-trigger-specific'
  // エージェント定義ルール
  | 'agent-name-required'
  | 'agent-tools-defined'
  | 'agent-description-specific'
  // 共通ルール
  | 'frontmatter-syntax'
  | 'unused-field'
  | 'recommended-pattern'

/** ルールカテゴリ */
export type LinterRuleCategory = 'skill' | 'agent' | 'common'

/** リンタールール定義 */
export interface LinterRule {
  /** ルールID */
  id: LinterRuleId
  /** ルール名 */
  name: string
  /** ルールの説明 */
  description: string
  /** カテゴリ */
  category: LinterRuleCategory
  /** デフォルトの重大度 */
  defaultSeverity: ValidationSeverity
  /** ルール有効/無効 */
  enabled: boolean
  /** 自動修正可能か */
  fixable: boolean
}

/** リンター問題 */
export interface LinterIssue extends ValidationError {
  /** ルールID */
  ruleId: LinterRuleId
  /** 修正提案 */
  suggestion?: string
  /** 自動修正用の置換テキスト */
  fix?: {
    range: { startLine: number; endLine: number; startColumn: number; endColumn: number }
    replacement: string
  }
}

/** リンター結果 */
export interface LinterResult {
  /** 問題リスト */
  issues: LinterIssue[]
  /** エラー数 */
  errorCount: number
  /** 警告数 */
  warningCount: number
  /** 情報数 */
  infoCount: number
  /** 検査したルール数 */
  rulesChecked: number
}

/** フロントマターデータ */
export interface FrontmatterData {
  name?: string
  description?: string
  tools?: string[]
  trigger?: string | string[]
  [key: string]: unknown
}

/** リンターコンテキスト */
export interface LinterContext {
  /** ファイルコンテンツ */
  content: string
  /** ファイルパス */
  filePath: string
  /** パース済みフロントマター */
  frontmatter: FrontmatterData | null
  /** フロントマター開始行（1始まり） */
  frontmatterStartLine: number
  /** フロントマター終了行（1始まり） */
  frontmatterEndLine: number
  /** ファイルの行配列 */
  lines: string[]
}

// ============================================================================
// ルール定義
// ============================================================================

/** 全リンタールール */
export const LINTER_RULES: LinterRule[] = [
  // スキル定義ルール
  {
    id: 'skill-name-required',
    name: 'スキル名必須',
    description: 'スキル定義にはnameフィールドが必須です',
    category: 'skill',
    defaultSeverity: 'error',
    enabled: true,
    fixable: false,
  },
  {
    id: 'skill-description-required',
    name: 'スキル説明必須',
    description: 'スキル定義にはdescriptionフィールドが必須です',
    category: 'skill',
    defaultSeverity: 'error',
    enabled: true,
    fixable: false,
  },
  {
    id: 'skill-description-min-length',
    name: 'スキル説明の長さ',
    description: 'スキルのdescriptionは50文字以上を推奨します',
    category: 'skill',
    defaultSeverity: 'warning',
    enabled: true,
    fixable: false,
  },
  {
    id: 'skill-trigger-specific',
    name: 'トリガーの具体性',
    description: 'triggerセクションは具体的な発動条件を記述してください',
    category: 'skill',
    defaultSeverity: 'info',
    enabled: true,
    fixable: false,
  },
  // エージェント定義ルール
  {
    id: 'agent-name-required',
    name: 'エージェント名必須',
    description: 'エージェント定義にはnameフィールドが必須です',
    category: 'agent',
    defaultSeverity: 'error',
    enabled: true,
    fixable: false,
  },
  {
    id: 'agent-tools-defined',
    name: 'ツール定義',
    description: 'エージェント定義にはtools配列を定義することを推奨します',
    category: 'agent',
    defaultSeverity: 'warning',
    enabled: true,
    fixable: false,
  },
  {
    id: 'agent-description-specific',
    name: 'エージェント説明の具体性',
    description: 'エージェントのdescriptionは具体的かつ詳細に記述してください',
    category: 'agent',
    defaultSeverity: 'warning',
    enabled: true,
    fixable: false,
  },
  // 共通ルール
  {
    id: 'frontmatter-syntax',
    name: 'フロントマター構文',
    description: 'YAMLフロントマターの構文が正しいことを確認します',
    category: 'common',
    defaultSeverity: 'error',
    enabled: true,
    fixable: false,
  },
  {
    id: 'unused-field',
    name: '未使用フィールド',
    description: '認識されないフィールドが存在します',
    category: 'common',
    defaultSeverity: 'warning',
    enabled: true,
    fixable: false,
  },
  {
    id: 'recommended-pattern',
    name: '推奨パターン',
    description: 'ベストプラクティスに従ったパターンを提案します',
    category: 'common',
    defaultSeverity: 'info',
    enabled: true,
    fixable: true,
  },
]

/** ルールをIDで取得 */
export function getRuleById(ruleId: LinterRuleId): LinterRule | undefined {
  return LINTER_RULES.find((rule) => rule.id === ruleId)
}

/** カテゴリでルールをフィルタリング */
export function getRulesByCategory(category: LinterRuleCategory): LinterRule[] {
  return LINTER_RULES.filter((rule) => rule.category === category)
}

// ============================================================================
// 既知フィールド定義
// ============================================================================

/** スキル定義の既知フィールド */
export const SKILL_KNOWN_FIELDS = new Set([
  'name',
  'description',
  'trigger',
  'version',
  'author',
  'tags',
  'enabled',
])

/** エージェント定義の既知フィールド */
export const AGENT_KNOWN_FIELDS = new Set([
  'name',
  'description',
  'tools',
  'model',
  'temperature',
  'version',
  'author',
  'tags',
  'enabled',
  'system_prompt',
])

// ============================================================================
// ユーティリティ関数
// ============================================================================

/**
 * フロントマター内のフィールド位置を検索
 */
export function findFieldLine(
  lines: string[],
  fieldName: string,
  startLine: number,
  endLine: number
): { line: number; column: number } {
  const escapedFieldName = fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const fieldRegex = new RegExp(`^(\\s*)(${escapedFieldName}):\\s*`)

  for (let i = startLine - 1; i < endLine && i < lines.length; i++) {
    const match = lines[i].match(fieldRegex)
    if (match) {
      return {
        line: i + 1,
        column: (match[1]?.length || 0) + 1,
      }
    }
  }

  return { line: startLine, column: 1 }
}

/**
 * 文字列が具体的かどうかを判定
 * 短すぎる、または一般的すぎる表現はfalseを返す
 */
export function isSpecificDescription(text: string): boolean {
  if (!text || text.length < 20) return false

  // 一般的すぎる表現のパターン
  const vaguePatterns = [
    /^(this|the|a|an)\s+(is|does|will|can)/i,
    /^(処理|実行|実行する|行う|する|します)$/,
    /^(description|説明|概要)$/i,
    /^(todo|fixme|wip)/i,
  ]

  return !vaguePatterns.some((pattern) => pattern.test(text.trim()))
}

/**
 * トリガー条件が具体的かどうかを判定
 */
export function isSpecificTrigger(trigger: string | string[] | undefined): boolean {
  if (!trigger) return false

  const triggerTexts = Array.isArray(trigger) ? trigger : [trigger]

  // 各トリガーが最低限の長さと具体性を持っているか
  return triggerTexts.every((t) => {
    if (typeof t !== 'string') return false
    if (t.length < 10) return false

    // 一般的すぎるトリガーのパターン
    const vaguePatterns = [/^always$/i, /^(any|all)$/i, /^.*$/]

    return !vaguePatterns.some((pattern) => pattern.test(t.trim()))
  })
}

/**
 * LinterIssueを作成するヘルパー
 */
export function createIssue(
  ruleId: LinterRuleId,
  message: string,
  line: number,
  column: number,
  severity?: ValidationSeverity,
  suggestion?: string
): LinterIssue {
  const rule = getRuleById(ruleId)
  return {
    ruleId,
    message,
    line,
    column,
    severity: severity ?? rule?.defaultSeverity ?? 'warning',
    source: 'schema',
    suggestion,
  }
}

/**
 * LinterResultの統計を計算
 */
export function calculateLinterStats(issues: LinterIssue[]): Omit<LinterResult, 'issues'> {
  let errorCount = 0
  let warningCount = 0
  let infoCount = 0

  for (const issue of issues) {
    switch (issue.severity) {
      case 'error':
        errorCount++
        break
      case 'warning':
        warningCount++
        break
      case 'info':
        infoCount++
        break
    }
  }

  return {
    errorCount,
    warningCount,
    infoCount,
    rulesChecked: LINTER_RULES.filter((r) => r.enabled).length,
  }
}

/**
 * 問題を重大度でソート（error > warning > info）
 */
export function sortIssuesBySeverity(issues: LinterIssue[]): LinterIssue[] {
  const severityOrder: Record<ValidationSeverity, number> = {
    error: 0,
    warning: 1,
    info: 2,
  }

  return [...issues].sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]
    if (severityDiff !== 0) return severityDiff
    return a.line - b.line
  })
}
