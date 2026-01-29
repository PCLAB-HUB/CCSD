/**
 * 参照パーサーユーティリティ
 *
 * Claude Code設定ファイル（CLAUDE.md、スキル、サブエージェント）間の
 * 依存関係を検出するためのパーサー
 */

import type { ReferenceMatch, NodeType } from '../types/graph'

// ============================================================================
// 定数・パターン定義
// ============================================================================

/**
 * 参照を検出するための正規表現パターン
 */
const PATTERNS = {
  // スキル呼び出しパターン（新形式）
  /** /skill-name 形式（スラッシュコマンド） */
  slashCommand: /(?:^|\s)\/([a-z][a-z0-9-]*)/gim,

  // スキル呼び出しパターン（既存）
  /** superpowers:skill-name 形式 */
  skillUse: /superpowers:([a-z][a-z0-9-]*)/gi,
  /** "superpowers:skill-name" または 'superpowers:skill-name' 形式 */
  skillInvoke: /["']superpowers:([a-z][a-z0-9-]*)["']/gi,
  /** Skill tool ... "name" 形式 */
  skillTool: /Skill\s+tool.*?["']([^"']+)["']/gi,

  // サブエージェント参照パターン（既存）
  /** subagent_type=name または subagent_type: name 形式 */
  subagentType: /subagent_type[=:]\s*["']?([A-Za-z][A-Za-z0-9-]*)["']?/gi,
  /** Task ... subagent_type ... "name" 形式 */
  taskAgent: /Task.*?subagent_type.*?["']([^"']+)["']/gi,

  // キャッチオール（未知の参照）
  /** use name 形式 */
  unknown: /use\s+([a-z][a-z0-9-:]+)/gi,
} as const

/** パターン名からReferenceMatchのtypeへのマッピング */
const PATTERN_TO_TYPE: Record<keyof typeof PATTERNS, ReferenceMatch['type']> = {
  slashCommand: 'skill',
  skillUse: 'skill',
  skillInvoke: 'skill',
  skillTool: 'skill',
  subagentType: 'subagent',
  taskAgent: 'subagent',
  unknown: 'unknown',
}

// ============================================================================
// メイン関数
// ============================================================================

/**
 * コンテンツから全ての参照を抽出
 *
 * @param content - 解析対象のファイルコンテンツ
 * @returns 検出された参照のリスト（重複除去済み）
 *
 * @example
 * ```ts
 * const content = `
 * Use superpowers:deploy-helper to deploy.
 * Task tool with subagent_type="backend-agent"
 * `
 * const refs = parseReferences(content)
 * // => [
 * //   { type: 'skill', name: 'deploy-helper', raw: 'superpowers:deploy-helper' },
 * //   { type: 'subagent', name: 'backend-agent', raw: 'subagent_type="backend-agent"' }
 * // ]
 * ```
 */
export function parseReferences(content: string): ReferenceMatch[] {
  const matches = new Map<string, ReferenceMatch>()

  // 各パターンでマッチを検出
  for (const [patternName, pattern] of Object.entries(PATTERNS)) {
    const type = PATTERN_TO_TYPE[patternName as keyof typeof PATTERNS]

    // グローバルフラグ付きの正規表現をリセット
    pattern.lastIndex = 0

    let match: RegExpExecArray | null
    while ((match = pattern.exec(content)) !== null) {
      const rawMatch = match[0]
      const capturedName = match[1]

      if (!capturedName) continue

      const normalizedName = normalizeRefName(capturedName)

      // 重複除去のためのキー（type + normalizedName）
      const key = `${type}:${normalizedName}`

      // 既に同じ参照が登録されていなければ追加
      if (!matches.has(key)) {
        matches.set(key, {
          type,
          name: normalizedName,
          raw: rawMatch,
        })
      }
    }
  }

  return Array.from(matches.values())
}

/**
 * 参照名を正規化
 *
 * - 小文字に変換
 * - 前後の空白を除去
 * - superpowers: プレフィックスを除去
 *
 * @param name - 正規化前の参照名
 * @returns 正規化後の参照名
 *
 * @example
 * ```ts
 * normalizeRefName('  Deploy-Helper  ') // => 'deploy-helper'
 * normalizeRefName('superpowers:my-skill') // => 'my-skill'
 * ```
 */
export function normalizeRefName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/^superpowers:/, '')
}

/**
 * 参照名が既知のファイルにマッチするかチェック
 *
 * ファイル名（拡張子なし）、またはパスの一部と参照名を比較
 *
 * @param refName - 正規化済みの参照名
 * @param knownFiles - 既知のファイルパス一覧
 * @returns マッチしたファイルパス、またはnull
 *
 * @example
 * ```ts
 * const files = ['/skills/deploy.md', '/agents/backend.md']
 * matchesKnownFile('deploy', files) // => '/skills/deploy.md'
 * matchesKnownFile('unknown', files) // => null
 * ```
 */
export function matchesKnownFile(refName: string, knownFiles: string[]): string | null {
  const normalized = normalizeRefName(refName)

  for (const filePath of knownFiles) {
    // ファイル名を抽出（拡張子なし）
    const fileName = extractFileName(filePath)
    const normalizedFileName = fileName.toLowerCase()

    // 完全一致
    if (normalizedFileName === normalized) {
      return filePath
    }

    // ハイフン/アンダースコアを無視した比較
    const normalizedWithoutSeparators = normalized.replace(/[-_]/g, '')
    const fileNameWithoutSeparators = normalizedFileName.replace(/[-_]/g, '')
    if (normalizedWithoutSeparators === fileNameWithoutSeparators) {
      return filePath
    }
  }

  return null
}

/**
 * ファイルコンテンツからフロントマターの説明を抽出
 *
 * YAMLフロントマター内のdescriptionフィールドを取得
 *
 * @param content - ファイルコンテンツ
 * @returns 説明文字列、または見つからなければnull
 *
 * @example
 * ```ts
 * const content = `---
 * name: My Skill
 * description: This skill helps with deployment
 * ---
 * # Content`
 * extractDescription(content) // => 'This skill helps with deployment'
 * ```
 */
export function extractDescription(content: string): string | null {
  // フロントマターを検出
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/)
  if (!frontmatterMatch) {
    return null
  }

  const frontmatter = frontmatterMatch[1]

  // descriptionフィールドを抽出
  const descriptionMatch = frontmatter.match(/^description:\s*["']?([^"'\n]+)["']?\s*$/m)
  if (descriptionMatch) {
    return descriptionMatch[1].trim()
  }

  // 複数行の説明（>や|で始まるYAML形式）
  const multilineMatch = frontmatter.match(/^description:\s*[>|]\s*\n((?:\s{2,}[^\n]+\n?)+)/m)
  if (multilineMatch) {
    return multilineMatch[1]
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join(' ')
      .trim()
  }

  return null
}

/**
 * ファイルパスからファイルタイプを判定
 *
 * ディレクトリ構造とファイル名から種類を推測
 *
 * @param path - ファイルパス
 * @returns ファイルタイプ
 *
 * @example
 * ```ts
 * getFileTypeFromPath('/project/CLAUDE.md') // => 'claude-md'
 * getFileTypeFromPath('/.claude/skills/deploy.md') // => 'skill'
 * getFileTypeFromPath('/.claude/commands/build.md') // => 'subagent'
 * ```
 */
export function getFileTypeFromPath(path: string): NodeType {
  const normalizedPath = path.toLowerCase()

  // CLAUDE.mdファイルの判定
  if (normalizedPath.endsWith('/claude.md') || normalizedPath === 'claude.md') {
    return 'claude-md'
  }

  // スキルディレクトリ内のファイル
  if (
    normalizedPath.includes('/skills/') ||
    normalizedPath.includes('/.claude/skills/') ||
    normalizedPath.includes('/skill/')
  ) {
    return 'skill'
  }

  // サブエージェント/コマンドディレクトリ内のファイル
  if (
    normalizedPath.includes('/commands/') ||
    normalizedPath.includes('/agents/') ||
    normalizedPath.includes('/.claude/commands/') ||
    normalizedPath.includes('/.claude/agents/') ||
    normalizedPath.includes('/subagents/')
  ) {
    return 'subagent'
  }

  return 'unknown'
}

// ============================================================================
// 内部ヘルパー関数
// ============================================================================

/**
 * ファイルパスからファイル名（拡張子なし）を抽出
 *
 * @param path - ファイルパス
 * @returns ファイル名（拡張子なし）
 */
function extractFileName(path: string): string {
  // パスの最後の要素を取得
  const parts = path.split('/')
  const fileName = parts[parts.length - 1] || ''

  // 拡張子を除去
  const dotIndex = fileName.lastIndexOf('.')
  if (dotIndex > 0) {
    return fileName.slice(0, dotIndex)
  }

  return fileName
}

// ============================================================================
// 追加のユーティリティ
// ============================================================================

/**
 * 参照リストを種類ごとにグループ化
 *
 * @param references - 参照リスト
 * @returns 種類ごとにグループ化された参照マップ
 */
export function groupReferencesByType(
  references: ReferenceMatch[]
): Map<ReferenceMatch['type'], ReferenceMatch[]> {
  const grouped = new Map<ReferenceMatch['type'], ReferenceMatch[]>()

  for (const ref of references) {
    const existing = grouped.get(ref.type) || []
    existing.push(ref)
    grouped.set(ref.type, existing)
  }

  return grouped
}

/**
 * 参照が有効（既知のファイルにマッチ）かどうかをチェック
 *
 * @param reference - チェック対象の参照
 * @param knownFiles - 既知のファイルパス一覧
 * @returns マッチ結果とファイルパス
 */
export function resolveReference(
  reference: ReferenceMatch,
  knownFiles: string[]
): { resolved: boolean; filePath: string | null } {
  const filePath = matchesKnownFile(reference.name, knownFiles)
  return {
    resolved: filePath !== null,
    filePath,
  }
}

/**
 * コンテンツ内の全ての参照を解決し、結果を返す
 *
 * @param content - ファイルコンテンツ
 * @param knownFiles - 既知のファイルパス一覧
 * @returns 解決済み参照と未解決参照のリスト
 */
export function parseAndResolveReferences(
  content: string,
  knownFiles: string[]
): {
  resolved: Array<ReferenceMatch & { filePath: string }>
  unresolved: ReferenceMatch[]
} {
  const references = parseReferences(content)
  const resolved: Array<ReferenceMatch & { filePath: string }> = []
  const unresolved: ReferenceMatch[] = []

  for (const ref of references) {
    const result = resolveReference(ref, knownFiles)
    if (result.resolved && result.filePath) {
      resolved.push({ ...ref, filePath: result.filePath })
    } else {
      unresolved.push(ref)
    }
  }

  return { resolved, unresolved }
}
