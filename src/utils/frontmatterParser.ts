/**
 * YAMLフロントマターパーサー
 * Markdown形式の設定ファイルからフロントマターを抽出・解析
 */

import type { FrontmatterData } from './linterRules'

// ============================================================================
// 型定義
// ============================================================================

export interface ParsedFrontmatter {
  data: FrontmatterData | null
  startLine: number
  endLine: number
  error?: string
}

// ============================================================================
// パーサー関数
// ============================================================================

/**
 * YAMLフロントマターを抽出してパース
 */
export function parseFrontmatter(content: string): ParsedFrontmatter {
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
 * 基本的なキー: 値形式と配列をサポート
 */
export function parseYamlContent(yaml: string): FrontmatterData {
  const parsedData: FrontmatterData = {}
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
        currentKey = fieldKey
      } else {
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
