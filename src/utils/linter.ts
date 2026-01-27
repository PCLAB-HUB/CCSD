/**
 * ベストプラクティスリンター
 * Claude Code設定ファイルのリンティングロジック
 */

import {
  type LinterIssue,
  type LinterResult,
  type LinterContext,
  LINTER_RULES,
  SKILL_KNOWN_FIELDS,
  AGENT_KNOWN_FIELDS,
  findFieldLine,
  isSpecificDescription,
  isSpecificTrigger,
  createIssue,
  calculateLinterStats,
  sortIssuesBySeverity,
} from './linterRules'
import { detectSchemaType, type SchemaFileType } from './schemaValidators'
import { parseFrontmatter } from './frontmatterParser'

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
    // この分岐に入る時点で frontmatter.description は string型と確認済み
    const description = frontmatter.description
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
