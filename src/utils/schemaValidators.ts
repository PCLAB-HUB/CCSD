/**
 * スキーマ検証ロジック
 * YAMLフロントマターをパースしてagents/skillsスキーマを検証
 */

import type { ValidationError, ValidationSeverity } from '../types'

/** エージェントスキーマ */
export interface AgentSchema {
  name: string
  description: string
  tools?: string[]
}

/** スキルスキーマ */
export interface SkillSchema {
  name: string
  description: string
}

/** ファイルタイプ */
export type SchemaFileType = 'agent' | 'skill' | 'unknown'

/** スキーマ検証結果 */
export interface SchemaValidationResult {
  isValid: boolean
  errors: ValidationError[]
  frontmatter: Record<string, unknown> | null
  schemaType: SchemaFileType
}

/** フロントマターの抽出結果 */
interface FrontmatterExtraction {
  data: Record<string, unknown> | null
  startLine: number
  endLine: number
  error?: string
}

/**
 * ファイルパスからスキーマタイプを判定
 */
export function detectSchemaType(filePath: string): SchemaFileType {
  const normalizedPath = filePath.replace(/\\/g, '/')

  if (normalizedPath.includes('/.claude/agents/') || normalizedPath.includes('~/.claude/agents/')) {
    return 'agent'
  }
  if (normalizedPath.includes('/.claude/skills/') || normalizedPath.includes('~/.claude/skills/')) {
    return 'skill'
  }

  return 'unknown'
}

/**
 * YAMLフロントマターを抽出してパース
 */
function extractFrontmatter(content: string): FrontmatterExtraction {
  const lines = content.split('\n')

  // フロントマター開始を検出
  if (lines.length === 0 || lines[0].trim() !== '---') {
    return { data: null, startLine: 0, endLine: 0 }
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
      startLine: 0,
      endLine: lines.length - 1,
      error: 'フロントマターが閉じられていません',
    }
  }

  // YAMLをパース（シンプルな実装）
  const yamlContent = lines.slice(1, endLineIndex).join('\n')
  try {
    const data = parseSimpleYaml(yamlContent)
    return { data, startLine: 0, endLine: endLineIndex }
  } catch (e) {
    return {
      data: null,
      startLine: 0,
      endLine: endLineIndex,
      error: e instanceof Error ? e.message : 'YAMLパースエラー',
    }
  }
}

/**
 * シンプルなYAMLパーサー
 * 外部依存なしで基本的なYAML構文をパース
 */
function parseSimpleYaml(yaml: string): Record<string, unknown> {
  const parsedData: Record<string, unknown> = {}
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
      const arrayValue = arrayMatch[1].trim()
      // 引用符を除去
      arrayItems.push(arrayValue.replace(/^["']|["']$/g, ''))
      continue
    }

    // 配列が終了した場合
    if (inArray && currentKey && !line.match(/^\s+-/)) {
      parsedData[currentKey] = arrayItems
      inArray = false
      arrayItems = []
    }

    // キー: 値 の検出
    const kvMatch = line.match(/^(\w+):\s*(.*)$/)
    if (kvMatch) {
      const fieldKey = kvMatch[1]
      const fieldValue = kvMatch[2].trim()

      if (fieldValue === '') {
        // 次の行で配列やネストが始まる可能性
        currentKey = fieldKey
      } else {
        // 引用符を除去して値を設定
        parsedData[fieldKey] = fieldValue.replace(/^["']|["']$/g, '')
        currentKey = fieldKey
      }
    }
  }

  // 最後の配列を保存
  if (inArray && currentKey) {
    parsedData[currentKey] = arrayItems
  }

  return parsedData
}

/**
 * フロントマター内のフィールド位置を検索
 * 注意: fieldNameは信頼できる値（内部定義のフィールド名）のみを渡すこと
 */
function findFieldLine(
  content: string,
  fieldName: string,
  startLine: number,
  endLine: number
): number {
  const lines = content.split('\n')
  // フィールド名をエスケープして正規表現インジェクションを防止
  const escapedFieldName = fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  for (let i = startLine; i <= endLine && i < lines.length; i++) {
    const line = lines[i]
    const fieldMatch = line.match(new RegExp(`^(${escapedFieldName}):`))
    if (fieldMatch) {
      return i + 1 // 1始まり
    }
  }

  // フィールドが見つからない場合は開始位置
  return startLine + 1
}

/**
 * 必須文字列フィールドを検証する共通関数
 */
function validateRequiredStringField(
  data: Record<string, unknown>,
  fieldName: string,
  content: string,
  startLine: number,
  endLine: number
): ValidationError | null {
  const value = data[fieldName]

  if (!value || typeof value !== 'string' || value.trim() === '') {
    const line = value !== undefined
      ? findFieldLine(content, fieldName, startLine, endLine)
      : startLine + 2

    return {
      message: `${fieldName}フィールドは必須です`,
      line,
      column: 1,
      severity: 'error',
      source: 'yaml',
    }
  }

  return null
}

/**
 * エージェントスキーマを検証
 */
function validateAgentSchema(
  data: Record<string, unknown>,
  content: string,
  startLine: number,
  endLine: number
): ValidationError[] {
  const errors: ValidationError[] = []

  // 必須フィールド: name, description
  const requiredFields = ['name', 'description'] as const
  for (const fieldName of requiredFields) {
    const error = validateRequiredStringField(data, fieldName, content, startLine, endLine)
    if (error) {
      errors.push(error)
    }
  }

  // 任意フィールド: tools（配列形式チェック）
  if (data.tools !== undefined) {
    const line = findFieldLine(content, 'tools', startLine, endLine)

    if (!Array.isArray(data.tools)) {
      errors.push({
        message: 'toolsフィールドは配列形式である必要があります',
        line,
        column: 1,
        severity: 'error',
        source: 'yaml',
      })
    } else {
      // 配列の中身が文字列かチェック
      const hasInvalidItems = data.tools.some(item => typeof item !== 'string')
      if (hasInvalidItems) {
        errors.push({
          message: 'toolsフィールドの要素はすべて文字列である必要があります',
          line,
          column: 1,
          severity: 'warning',
          source: 'yaml',
        })
      }

      // 空の配列に対する情報
      if (data.tools.length === 0) {
        errors.push({
          message: 'toolsフィールドが空です。使用可能なツールを指定することを推奨します',
          line,
          column: 1,
          severity: 'info',
          source: 'yaml',
        })
      }
    }
  } else {
    // toolsフィールドがない場合の推奨
    errors.push({
      message: 'toolsフィールドを追加して、エージェントが使用可能なツールを明示することを推奨します',
      line: endLine + 1,
      column: 1,
      severity: 'info',
      source: 'yaml',
    })
  }

  return errors
}

/**
 * スキルスキーマを検証
 */
function validateSkillSchema(
  data: Record<string, unknown>,
  content: string,
  startLine: number,
  endLine: number
): ValidationError[] {
  const errors: ValidationError[] = []

  // 必須フィールド: name, description
  const requiredFields = ['name', 'description'] as const
  for (const fieldName of requiredFields) {
    const error = validateRequiredStringField(data, fieldName, content, startLine, endLine)
    if (error) {
      errors.push(error)
    }
  }

  return errors
}

/**
 * ファイルコンテンツを検証
 */
export function validateSchema(
  content: string,
  filePath: string
): SchemaValidationResult {
  const schemaType = detectSchemaType(filePath)

  // スキーマタイプが不明な場合は検証しない
  if (schemaType === 'unknown') {
    return {
      isValid: true,
      errors: [],
      frontmatter: null,
      schemaType,
    }
  }

  // フロントマターを抽出
  const extraction = extractFrontmatter(content)

  // パースエラーがあった場合
  if (extraction.error) {
    return {
      isValid: false,
      errors: [{
        message: extraction.error,
        line: extraction.startLine + 1,
        column: 1,
        severity: 'error',
        source: 'yaml',
      }],
      frontmatter: null,
      schemaType,
    }
  }

  // フロントマターがない場合
  if (!extraction.data) {
    // Markdownファイルでフロントマターがない場合はエラー
    if (filePath.endsWith('.md')) {
      return {
        isValid: false,
        errors: [{
          message: 'YAMLフロントマターが見つかりません。ファイル先頭に---で囲んだメタデータを追加してください',
          line: 1,
          column: 1,
          severity: 'error',
          source: 'yaml',
        }],
        frontmatter: null,
        schemaType,
      }
    }
    return {
      isValid: true,
      errors: [],
      frontmatter: null,
      schemaType,
    }
  }

  // スキーマタイプに応じて検証
  let errors: ValidationError[]
  if (schemaType === 'agent') {
    errors = validateAgentSchema(
      extraction.data,
      content,
      extraction.startLine,
      extraction.endLine
    )
  } else {
    errors = validateSkillSchema(
      extraction.data,
      content,
      extraction.startLine,
      extraction.endLine
    )
  }

  // エラーがあるかどうかで有効性を判定
  const hasErrors = errors.some(e => e.severity === 'error')

  return {
    isValid: !hasErrors,
    errors,
    frontmatter: extraction.data,
    schemaType,
  }
}

/**
 * 重大度ごとのエラー数をカウント
 * 1回のループで全カウントを計算（パフォーマンス最適化）
 */
export function countBySeverity(
  errors: ValidationError[]
): Record<ValidationSeverity, number> {
  const counts: Record<ValidationSeverity, number> = {
    error: 0,
    warning: 0,
    info: 0,
  }

  for (const e of errors) {
    counts[e.severity]++
  }

  return counts
}

/**
 * 検証結果のサマリーを生成
 */
export function getValidationSummary(result: SchemaValidationResult): string {
  if (result.errors.length === 0) {
    return '検証OK'
  }

  const counts = countBySeverity(result.errors)
  const parts: string[] = []

  if (counts.error > 0) {
    parts.push(`エラー: ${counts.error}`)
  }
  if (counts.warning > 0) {
    parts.push(`警告: ${counts.warning}`)
  }
  if (counts.info > 0) {
    parts.push(`情報: ${counts.info}`)
  }

  return parts.join(' / ')
}

/**
 * スキーマタイプの日本語名を取得
 */
export function getSchemaTypeName(schemaType: SchemaFileType): string {
  switch (schemaType) {
    case 'agent':
      return 'エージェント'
    case 'skill':
      return 'スキル'
    default:
      return ''
  }
}
