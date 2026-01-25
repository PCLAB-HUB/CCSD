/**
 * YAML/JSON構文検証ユーティリティ
 */

import * as yaml from 'js-yaml'
import {
  ValidationError,
  ValidationSeverity,
  translateYamlError,
  translateJsonError,
} from './errorMessages'

export type { ValidationError, ValidationSeverity }

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

/**
 * YAMLの構文を検証
 */
export function validateYaml(content: string): ValidationResult {
  const errors: ValidationError[] = []

  if (!content.trim()) {
    return { isValid: true, errors: [] }
  }

  try {
    yaml.load(content, {
      schema: yaml.DEFAULT_SCHEMA,
      onWarning: (warning) => {
        const { line, column } = extractYamlPosition(warning.message, content)
        errors.push({
          message: translateYamlError(warning.message),
          line,
          column,
          severity: 'warning',
          source: 'yaml',
        })
      },
    })

    return { isValid: errors.length === 0, errors }
  } catch (e) {
    if (e instanceof yaml.YAMLException) {
      const mark = e.mark
      errors.push({
        message: translateYamlError(e.reason || e.message),
        line: mark ? mark.line + 1 : 1,
        column: mark ? mark.column + 1 : 1,
        severity: 'error',
        source: 'yaml',
      })
    } else {
      errors.push({
        message: 'YAML解析中に予期しないエラーが発生しました',
        line: 1,
        column: 1,
        severity: 'error',
        source: 'yaml',
      })
    }

    return { isValid: false, errors }
  }
}

/**
 * YAMLの警告メッセージから位置情報を抽出
 */
function extractYamlPosition(
  message: string,
  _content: string
): { line: number; column: number } {
  // js-yamlの警告メッセージから位置を抽出する試み
  const lineMatch = message.match(/line (\d+)/i)
  const columnMatch = message.match(/column (\d+)/i)

  return {
    line: lineMatch ? parseInt(lineMatch[1], 10) : 1,
    column: columnMatch ? parseInt(columnMatch[1], 10) : 1,
  }
}

/**
 * JSONの構文を検証
 */
export function validateJson(content: string): ValidationResult {
  const errors: ValidationError[] = []

  if (!content.trim()) {
    return { isValid: true, errors: [] }
  }

  try {
    JSON.parse(content)
    return { isValid: true, errors: [] }
  } catch (e) {
    if (e instanceof SyntaxError) {
      const { line, column } = extractJsonPosition(e.message, content)
      errors.push({
        message: translateJsonError(e.message),
        line,
        column,
        severity: 'error',
        source: 'json',
      })
    } else {
      errors.push({
        message: 'JSON解析中に予期しないエラーが発生しました',
        line: 1,
        column: 1,
        severity: 'error',
        source: 'json',
      })
    }

    return { isValid: false, errors }
  }
}

/**
 * JSONエラーメッセージから位置情報を抽出
 */
function extractJsonPosition(
  message: string,
  content: string
): { line: number; column: number } {
  // "at position X" パターンから位置を抽出
  const posMatch = message.match(/position\s+(\d+)/i)
  if (posMatch) {
    const position = parseInt(posMatch[1], 10)
    return positionToLineColumn(content, position)
  }

  // "at line X column Y" パターン
  const lineColMatch = message.match(/line\s+(\d+)\s+column\s+(\d+)/i)
  if (lineColMatch) {
    return {
      line: parseInt(lineColMatch[1], 10),
      column: parseInt(lineColMatch[2], 10),
    }
  }

  // 位置が特定できない場合、末尾を指す
  const lines = content.split('\n')
  return { line: lines.length, column: 1 }
}

/**
 * 文字位置から行・列番号に変換
 */
function positionToLineColumn(
  content: string,
  position: number
): { line: number; column: number } {
  const lines = content.split('\n')
  let currentPos = 0

  for (let i = 0; i < lines.length; i++) {
    const lineLength = lines[i].length + 1 // +1 for newline character
    if (currentPos + lineLength > position) {
      return {
        line: i + 1,
        column: position - currentPos + 1,
      }
    }
    currentPos += lineLength
  }

  return { line: lines.length, column: 1 }
}

/**
 * ファイル名から適切なバリデーターを選択して検証
 */
export function validateContent(
  content: string,
  filename: string
): ValidationResult {
  const lowerFilename = filename.toLowerCase()

  if (lowerFilename.endsWith('.json')) {
    return validateJson(content)
  }

  if (lowerFilename.endsWith('.yaml') || lowerFilename.endsWith('.yml')) {
    return validateYaml(content)
  }

  // その他のファイルタイプは常に有効とみなす
  return { isValid: true, errors: [] }
}

/**
 * 構文検証とスキーマ検証を統合して実行
 */
export function validateContentWithSchema(
  content: string,
  filename: string,
  _filePath: string
): ValidationResult {
  // 動的インポートを避けるため、スキーマ検証はMainAreaで直接呼び出す
  // この関数は構文検証のみ行う
  return validateContent(content, filename)
}

/**
 * Monaco EditorのマーカーSeverityに変換
 * monaco.MarkerSeverity の値:
 * - Error = 8
 * - Warning = 4
 * - Info = 2
 * - Hint = 1
 */
export function toMonacoSeverity(severity: ValidationSeverity): number {
  switch (severity) {
    case 'error':
      return 8 // MarkerSeverity.Error
    case 'warning':
      return 4 // MarkerSeverity.Warning
    case 'info':
      return 2 // MarkerSeverity.Info
  }
}
