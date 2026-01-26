/**
 * ベストプラクティスリンターフック
 * Claude Code設定ファイルのリンティングを実行
 */

import { useState, useCallback, useMemo } from 'react'
import {
  type LinterRule,
  type LinterIssue,
  type LinterResult,
  type LinterContext,
  type FrontmatterData,
  type LinterRuleCategory,
  LINTER_RULES,
  SKILL_KNOWN_FIELDS,
  AGENT_KNOWN_FIELDS,
  findFieldLine,
  isSpecificDescription,
  isSpecificTrigger,
  createIssue,
  calculateLinterStats,
  sortIssuesBySeverity,
} from '../utils/linterRules'
import { detectSchemaType, type SchemaFileType } from '../utils/schemaValidators'

// ============================================================================
// フロントマターパーサー
// ============================================================================

interface ParsedFrontmatter {
  data: FrontmatterData | null
  startLine: number
  endLine: number
  error?: string
}

/**
 * YAMLフロントマターを抽出してパース
 */
function parseFrontmatter(content: string): ParsedFrontmatter {
  const lines = content.split('\n')

  // フロントマター開始を検出
  if (lines.length === 0 || lines[0].trim() !== '---') {
    return { data: null, startLine: 1, endLine: 1 }
  }

  // フロントマター終了を検出
  let endLineIndex = -1
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      endLineIndex = i
      break
    }
  }

  if (endLineIndex === -1) {
    return {
      data: null,
      startLine: 1,
      endLine: lines.length,
      error: 'フロントマターが閉じられていません（終了の---が見つかりません）',
    }
  }

  // YAMLをパース
  const yamlContent = lines.slice(1, endLineIndex).join('\n')
  try {
    const data = parseYamlContent(yamlContent)
    return { data, startLine: 1, endLine: endLineIndex + 1 }
  } catch (e) {
    return {
      data: null,
      startLine: 1,
      endLine: endLineIndex + 1,
      error: e instanceof Error ? e.message : 'YAMLパースエラー',
    }
  }
}

/**
 * シンプルなYAMLパーサー
 */
function parseYamlContent(yaml: string): FrontmatterData {
  const result: FrontmatterData = {}
  const lines = yaml.split('\n')
  let currentKey: string | null = null
  let arrayItems: string[] = []
  let inArray = false

  for (const line of lines) {
    // 空行やコメントをスキップ
    if (line.trim() === '' || line.trim().startsWith('#')) {
      continue
    }

    // 配列項目の検出
    const arrayMatch = line.match(/^\s+-\s+(.*)$/)
    if (arrayMatch && currentKey) {
      if (!inArray) {
        inArray = true
        arrayItems = []
      }
      const value = arrayMatch[1].trim()
      arrayItems.push(value.replace(/^["']|["']$/g, ''))
      continue
    }

    // 配列が終了した場合
    if (inArray && currentKey && !line.match(/^\s+-/)) {
      result[currentKey] = arrayItems
      inArray = false
      arrayItems = []
    }

    // キー: 値 の検出
    const kvMatch = line.match(/^(\w+):\s*(.*)$/)
    if (kvMatch) {
      const key = kvMatch[1]
      const value = kvMatch[2].trim()

      if (value === '') {
        currentKey = key
      } else {
        result[key] = value.replace(/^["']|["']$/g, '')
        currentKey = key
      }
    }
  }

  // 最後の配列を保存
  if (inArray && currentKey) {
    result[currentKey] = arrayItems
  }

  return result
}

// ============================================================================
// ルールチェッカー
// ============================================================================

/**
 * スキル定義のルールをチェック
 */
function checkSkillRules(ctx: LinterContext): LinterIssue[] {
  const issues: LinterIssue[] = []
  const { frontmatter, lines, frontmatterStartLine, frontmatterEndLine } = ctx

  if (!frontmatter) return issues

  // skill-name-required: nameフィールド必須
  if (!frontmatter.name || typeof frontmatter.name !== 'string' || frontmatter.name.trim() === '') {
    const pos = frontmatter.name !== undefined
      ? findFieldLine(lines, 'name', frontmatterStartLine, frontmatterEndLine)
      : { line: frontmatterStartLine + 1, column: 1 }

    issues.push(
      createIssue(
        'skill-name-required',
        'スキル定義にはnameフィールドが必須です',
        pos.line,
        pos.column,
        'error',
        'name: "スキル名" を追加してください'
      )
    )
  }

  // skill-description-required: descriptionフィールド必須
  if (
    !frontmatter.description ||
    typeof frontmatter.description !== 'string' ||
    frontmatter.description.trim() === ''
  ) {
    const pos = frontmatter.description !== undefined
      ? findFieldLine(lines, 'description', frontmatterStartLine, frontmatterEndLine)
      : { line: frontmatterStartLine + 1, column: 1 }

    issues.push(
      createIssue(
        'skill-description-required',
        'スキル定義にはdescriptionフィールドが必須です（空でないこと）',
        pos.line,
        pos.column,
        'error',
        'description: "スキルの説明" を追加してください'
      )
    )
  } else {
    // skill-description-min-length: 50文字以上推奨
    const description = frontmatter.description as string
    if (description.length < 50) {
      const pos = findFieldLine(lines, 'description', frontmatterStartLine, frontmatterEndLine)
      issues.push(
        createIssue(
          'skill-description-min-length',
          `descriptionは50文字以上を推奨します（現在: ${description.length}文字）`,
          pos.line,
          pos.column,
          'warning',
          'より詳細な説明を追加して、スキルの用途を明確にしてください'
        )
      )
    }
  }

  // skill-trigger-specific: triggerの具体性
  if (frontmatter.trigger !== undefined) {
    if (!isSpecificTrigger(frontmatter.trigger)) {
      const pos = findFieldLine(lines, 'trigger', frontmatterStartLine, frontmatterEndLine)
      issues.push(
        createIssue(
          'skill-trigger-specific',
          'triggerセクションは具体的な発動条件を記述してください',
          pos.line,
          pos.column,
          'info',
          '例: "ユーザーが /deploy コマンドを実行したとき" のように具体的に記述'
        )
      )
    }
  }

  // unused-field: 未使用フィールドの警告
  for (const key of Object.keys(frontmatter)) {
    if (!SKILL_KNOWN_FIELDS.has(key)) {
      const pos = findFieldLine(lines, key, frontmatterStartLine, frontmatterEndLine)
      issues.push(
        createIssue(
          'unused-field',
          `認識されないフィールド "${key}" が存在します`,
          pos.line,
          pos.column,
          'warning',
          `このフィールドはスキル定義で使用されません。削除するか、正しいフィールド名に修正してください`
        )
      )
    }
  }

  return issues
}

/**
 * エージェント定義のルールをチェック
 */
function checkAgentRules(ctx: LinterContext): LinterIssue[] {
  const issues: LinterIssue[] = []
  const { frontmatter, lines, frontmatterStartLine, frontmatterEndLine } = ctx

  if (!frontmatter) return issues

  // agent-name-required: nameフィールド必須
  if (!frontmatter.name || typeof frontmatter.name !== 'string' || frontmatter.name.trim() === '') {
    const pos = frontmatter.name !== undefined
      ? findFieldLine(lines, 'name', frontmatterStartLine, frontmatterEndLine)
      : { line: frontmatterStartLine + 1, column: 1 }

    issues.push(
      createIssue(
        'agent-name-required',
        'エージェント定義にはnameフィールドが必須です',
        pos.line,
        pos.column,
        'error',
        'name: "エージェント名" を追加してください'
      )
    )
  }

  // agent-tools-defined: tools配列の推奨
  if (frontmatter.tools === undefined) {
    issues.push(
      createIssue(
        'agent-tools-defined',
        'tools配列を定義して、エージェントが使用可能なツールを明示することを推奨します',
        frontmatterEndLine,
        1,
        'warning',
        '例: tools:\n  - Read\n  - Write\n  - Bash'
      )
    )
  } else if (Array.isArray(frontmatter.tools) && frontmatter.tools.length === 0) {
    const pos = findFieldLine(lines, 'tools', frontmatterStartLine, frontmatterEndLine)
    issues.push(
      createIssue(
        'agent-tools-defined',
        'tools配列が空です。使用可能なツールを指定してください',
        pos.line,
        pos.column,
        'warning',
        'エージェントが使用するツールを追加してください'
      )
    )
  }

  // agent-description-specific: descriptionの具体性
  if (frontmatter.description && typeof frontmatter.description === 'string') {
    if (!isSpecificDescription(frontmatter.description)) {
      const pos = findFieldLine(lines, 'description', frontmatterStartLine, frontmatterEndLine)
      issues.push(
        createIssue(
          'agent-description-specific',
          'エージェントのdescriptionはより具体的に記述してください',
          pos.line,
          pos.column,
          'warning',
          'エージェントの役割、専門分野、対応可能なタスクを詳細に記述してください'
        )
      )
    }
  } else if (!frontmatter.description) {
    issues.push(
      createIssue(
        'agent-description-specific',
        'エージェント定義にはdescriptionフィールドを追加することを推奨します',
        frontmatterStartLine + 1,
        1,
        'warning',
        'description: "エージェントの説明" を追加してください'
      )
    )
  }

  // unused-field: 未使用フィールドの警告
  for (const key of Object.keys(frontmatter)) {
    if (!AGENT_KNOWN_FIELDS.has(key)) {
      const pos = findFieldLine(lines, key, frontmatterStartLine, frontmatterEndLine)
      issues.push(
        createIssue(
          'unused-field',
          `認識されないフィールド "${key}" が存在します`,
          pos.line,
          pos.column,
          'warning',
          `このフィールドはエージェント定義で使用されません。削除するか、正しいフィールド名に修正してください`
        )
      )
    }
  }

  return issues
}

/**
 * 共通ルールをチェック
 */
function checkCommonRules(ctx: LinterContext, parseError?: string): LinterIssue[] {
  const issues: LinterIssue[] = []

  // frontmatter-syntax: フロントマター構文エラー
  if (parseError) {
    issues.push(
      createIssue(
        'frontmatter-syntax',
        `YAMLフロントマター構文エラー: ${parseError}`,
        ctx.frontmatterStartLine,
        1,
        'error'
      )
    )
  }

  // フロントマターが存在しない場合（.mdファイルのみ）
  if (!ctx.frontmatter && ctx.filePath.endsWith('.md') && !parseError) {
    const schemaType = detectSchemaType(ctx.filePath)
    if (schemaType !== 'unknown') {
      issues.push(
        createIssue(
          'frontmatter-syntax',
          'YAMLフロントマターが見つかりません。ファイル先頭に---で囲んだメタデータを追加してください',
          1,
          1,
          'error',
          '例:\n---\nname: "名前"\ndescription: "説明"\n---'
        )
      )
    }
  }

  return issues
}

/**
 * 推奨パターンをチェック
 */
function checkRecommendedPatterns(ctx: LinterContext, schemaType: SchemaFileType): LinterIssue[] {
  const issues: LinterIssue[] = []
  const { frontmatter, frontmatterEndLine } = ctx

  if (!frontmatter) return issues

  // バージョンフィールドの推奨
  if (!frontmatter.version) {
    issues.push(
      createIssue(
        'recommended-pattern',
        'versionフィールドを追加してバージョン管理を行うことを推奨します',
        frontmatterEndLine,
        1,
        'info',
        'version: "1.0.0" を追加してください'
      )
    )
  }

  // スキルのtriggerフィールド推奨
  if (schemaType === 'skill' && !frontmatter.trigger) {
    issues.push(
      createIssue(
        'recommended-pattern',
        'triggerフィールドを追加してスキルの発動条件を明示することを推奨します',
        frontmatterEndLine,
        1,
        'info',
        '例: trigger: "ユーザーが特定のコマンドを実行したとき"'
      )
    )
  }

  // エージェントのmodel指定推奨
  if (schemaType === 'agent' && !frontmatter.model) {
    issues.push(
      createIssue(
        'recommended-pattern',
        'modelフィールドを追加して使用するモデルを明示することを推奨します',
        frontmatterEndLine,
        1,
        'info',
        '例: model: "claude-3-opus"'
      )
    )
  }

  return issues
}

// ============================================================================
// メインリンター関数
// ============================================================================

/**
 * リンティングを実行
 */
export function lint(content: string, filePath: string): LinterResult {
  const schemaType = detectSchemaType(filePath)
  const lines = content.split('\n')
  const parsed = parseFrontmatter(content)

  const ctx: LinterContext = {
    content,
    filePath,
    frontmatter: parsed.data,
    frontmatterStartLine: parsed.startLine,
    frontmatterEndLine: parsed.endLine,
    lines,
  }

  let issues: LinterIssue[] = []

  // 共通ルールをチェック
  issues.push(...checkCommonRules(ctx, parsed.error))

  // パースエラーがない場合のみ、詳細なルールをチェック
  if (!parsed.error && parsed.data) {
    // スキーマタイプに応じたルールをチェック
    if (schemaType === 'skill') {
      issues.push(...checkSkillRules(ctx))
    } else if (schemaType === 'agent') {
      issues.push(...checkAgentRules(ctx))
    }

    // 推奨パターンをチェック
    if (schemaType !== 'unknown') {
      issues.push(...checkRecommendedPatterns(ctx, schemaType))
    }
  }

  // 有効なルールのみフィルタリング
  const enabledRuleIds = new Set(LINTER_RULES.filter((r) => r.enabled).map((r) => r.id))
  issues = issues.filter((issue) => enabledRuleIds.has(issue.ruleId))

  // 重大度でソート
  issues = sortIssuesBySeverity(issues)

  return {
    issues,
    ...calculateLinterStats(issues),
  }
}

// ============================================================================
// React Hook
// ============================================================================

/** リンター設定 */
export interface LinterConfig {
  /** 有効なルールカテゴリ */
  enabledCategories: LinterRuleCategory[]
  /** 重大度の上書き */
  severityOverrides: Partial<Record<string, 'error' | 'warning' | 'info'>>
}

const DEFAULT_CONFIG: LinterConfig = {
  enabledCategories: ['skill', 'agent', 'common'],
  severityOverrides: {},
}

/**
 * ベストプラクティスリンターを管理するカスタムフック
 */
export function useLinter(initialConfig: Partial<LinterConfig> = {}) {
  const [config, setConfig] = useState<LinterConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  })
  const [lastResult, setLastResult] = useState<LinterResult | null>(null)

  /**
   * リンティングを実行
   */
  const runLint = useCallback(
    (content: string, filePath: string): LinterResult => {
      const result = lint(content, filePath)
      setLastResult(result)
      return result
    },
    []
  )

  /**
   * リンター設定を更新
   */
  const updateConfig = useCallback((updates: Partial<LinterConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }))
  }, [])

  /**
   * 特定カテゴリの有効/無効を切り替え
   */
  const toggleCategory = useCallback((category: LinterRuleCategory) => {
    setConfig((prev) => {
      const enabled = prev.enabledCategories.includes(category)
      return {
        ...prev,
        enabledCategories: enabled
          ? prev.enabledCategories.filter((c) => c !== category)
          : [...prev.enabledCategories, category],
      }
    })
  }, [])

  /**
   * 結果をクリア
   */
  const clearResult = useCallback(() => {
    setLastResult(null)
  }, [])

  /**
   * 全ルール一覧（設定を反映）
   */
  const rules = useMemo((): LinterRule[] => {
    return LINTER_RULES.map((rule) => ({
      ...rule,
      enabled: config.enabledCategories.includes(rule.category),
    }))
  }, [config.enabledCategories])

  /**
   * 問題があるかどうか
   */
  const hasIssues = useMemo(() => {
    return lastResult !== null && lastResult.issues.length > 0
  }, [lastResult])

  /**
   * エラーがあるかどうか
   */
  const hasErrors = useMemo(() => {
    return lastResult !== null && lastResult.errorCount > 0
  }, [lastResult])

  return {
    // 状態
    config,
    lastResult,
    rules,
    hasIssues,
    hasErrors,
    // アクション
    runLint,
    updateConfig,
    toggleCategory,
    clearResult,
  }
}

// ============================================================================
// エクスポート
// ============================================================================

export type { LinterRule, LinterIssue, LinterResult, LinterContext, FrontmatterData }
export { LINTER_RULES, SKILL_KNOWN_FIELDS, AGENT_KNOWN_FIELDS }
