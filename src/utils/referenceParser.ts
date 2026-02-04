/**
 * 参照パーサーユーティリティ
 *
 * Claude Code設定ファイル（CLAUDE.md、スキル、サブエージェント）間の
 * 依存関係を検出するためのパーサー
 */

import type { ReferenceMatch, NodeType, SkillMetadata, TriggerInfo, ExampleInfo } from '../types/graph'

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
 * frontmatterがない場合は、タイトルや最初の段落から抽出を試みる
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
  if (frontmatterMatch) {
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
  }

  // frontmatterがない場合：タイトル（# で始まる行）を抽出
  const titleMatch = content.match(/^#\s+(.+)$/m)
  if (titleMatch) {
    return titleMatch[1].trim()
  }

  return null
}

/**
 * ファイルコンテンツからタイトルを抽出（frontmatterのnameまたは#タイトル）
 *
 * @param content - ファイルコンテンツ
 * @returns タイトル文字列、または見つからなければnull
 */
export function extractTitle(content: string): string | null {
  // フロントマターからnameを抽出
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/)
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1]
    const nameMatch = frontmatter.match(/^name:\s*["']?([^"'\n]+)["']?\s*$/m)
    if (nameMatch) {
      return nameMatch[1].trim()
    }
  }

  // # タイトル行を抽出
  const titleMatch = content.match(/^#\s+(.+)$/m)
  if (titleMatch) {
    return titleMatch[1].trim()
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

// ============================================================================
// スキルメタデータ解析
// ============================================================================

/**
 * フロントマターからスキル名を抽出
 *
 * @param content - ファイルコンテンツ
 * @returns スキル名、または見つからなければnull
 */
export function extractSkillName(content: string): string | null {
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/)
  if (!frontmatterMatch) return null

  const frontmatter = frontmatterMatch[1]
  const nameMatch = frontmatter.match(/^name:\s*["']?([^"'\n]+)["']?\s*$/m)
  return nameMatch ? nameMatch[1].trim() : null
}

/**
 * descriptionから発動条件を抽出
 *
 * "Use when...", "Use this agent when..." パターンを解析して発動条件を構造化
 * frontmatterがない場合は、タイトルや本文から使用目的を抽出
 *
 * @param content - ファイルコンテンツ
 * @returns 発動条件の配列
 */
export function extractTriggers(content: string): TriggerInfo[] {
  const triggers: TriggerInfo[] = []
  const description = extractDescription(content)
  const title = extractTitle(content)

  // descriptionがある場合
  if (description) {
    // "Use this agent when..." パターン（エージェント向け）
    const useAgentMatch = description.match(/use this (?:agent|tool)\s+when\s+(.+?)(?:\.|Examples:|$)/is)
    if (useAgentMatch) {
      const condition = useAgentMatch[1].trim()
      triggers.push({ condition })
    }

    // "Use when..." パターンを検出（"use this agent when"を除く）
    if (!useAgentMatch) {
      const useWhenMatch = description.match(/use when\s+(.+?)(?:\.|$)/i)
      if (useWhenMatch) {
        const condition = useWhenMatch[1].trim()
        // カンマや "or" で分割して複数の条件を抽出
        const conditions = condition.split(/,\s*(?:or\s+)?|(?:\s+or\s+)/i)
        for (const cond of conditions) {
          const trimmed = cond.trim()
          if (trimmed) {
            triggers.push({ condition: trimmed })
          }
        }
      }
    }

    // "You MUST use this before..." パターン
    const mustUseMatch = description.match(/you must use this (?:before|when)\s+(.+?)(?:\.|$)/i)
    if (mustUseMatch) {
      triggers.push({ condition: mustUseMatch[1].trim() })
    }

    // 説明文がそのまま使用条件を表している場合（短い説明文）
    if (triggers.length === 0 && description.length < 200) {
      // 動詞で始まる説明文は使用条件として扱う
      if (/^(simplif|refin|analyz|review|creat|generat|help|assist)/i.test(description)) {
        triggers.push({ condition: description })
      }
    }
  }

  // 本文中の "## When to Use" セクションから追加条件を抽出
  const whenToUseMatch = content.match(/##\s*When to Use\s*\n([\s\S]*?)(?=\n##|$)/i)
  if (whenToUseMatch) {
    const section = whenToUseMatch[1]
    // リスト項目を抽出
    const listItems = section.match(/^[-*]\s+(.+)$/gm)
    if (listItems) {
      for (const item of listItems.slice(0, 5)) { // 最大5つまで
        const text = item.replace(/^[-*]\s+/, '').trim()
        if (text && !triggers.some(t => t.condition === text)) {
          triggers.push({ condition: text })
        }
      }
    }
  }

  // "## あなたのタスク" や "## タスク" セクションから目的を抽出（日本語対応）
  const taskMatch = content.match(/##\s*(?:あなたの)?タスク\s*\n([\s\S]*?)(?=\n##|$)/i)
  if (taskMatch && triggers.length === 0) {
    const section = taskMatch[1]
    // 最初の文を抽出
    const firstSentence = section.match(/^([^。\n]+[。]?)/m)
    if (firstSentence) {
      triggers.push({ condition: firstSentence[1].trim() })
    }
  }

  // frontmatterがなく、タイトルがある場合はタイトルを使用目的として追加
  if (triggers.length === 0 && title && !content.match(/^---\s*\n/)) {
    triggers.push({ condition: title })
  }

  return triggers
}

/**
 * <example>タグから使用例を抽出（エージェント向け）
 *
 * @param content - ファイルコンテンツ
 * @returns 使用例の配列
 */
export function extractAgentExamples(content: string): ExampleInfo[] {
  const examples: ExampleInfo[] = []
  const description = extractDescription(content)

  if (!description) return examples

  // <example>タグから使用例を抽出
  const exampleMatches = description.matchAll(/<example>([\s\S]*?)<\/example>/gi)
  for (const match of exampleMatches) {
    const exampleContent = match[1]

    // user: と assistant: のやり取りを抽出
    const userMatch = exampleContent.match(/user:\s*["']?([^"'\n]+)["']?/i)
    const commentaryMatch = exampleContent.match(/<commentary>([^<]+)<\/commentary>/i)

    if (userMatch) {
      const userInput = userMatch[1].trim()
      const commentary = commentaryMatch ? commentaryMatch[1].trim() : ''

      examples.push({
        title: 'ユーザー入力例',
        content: `「${userInput}」${commentary ? `\n→ ${commentary}` : ''}`,
        type: 'text',
      })
    }
  }

  return examples.slice(0, 3) // 最大3つまで
}

/**
 * 連携するスキルを抽出
 *
 * 本文中の "superpowers:xxx" パターンと "Related skills:" セクションから抽出
 *
 * @param content - ファイルコンテンツ
 * @returns 連携スキル名の配列
 */
export function extractRelatedSkills(content: string): string[] {
  const skills = new Set<string>()

  // superpowers:xxx パターン
  const superpowersMatches = content.matchAll(/superpowers:([a-z][a-z0-9-]*)/gi)
  for (const match of superpowersMatches) {
    skills.add(match[1].toLowerCase())
  }

  // "Related skills:" セクション
  const relatedMatch = content.match(/\*\*Related skills:\*\*\s*\n([\s\S]*?)(?=\n\n|\n\*\*|$)/i)
  if (relatedMatch) {
    const listItems = relatedMatch[1].match(/[-*]\s+\*\*([^*]+)\*\*/g)
    if (listItems) {
      for (const item of listItems) {
        const nameMatch = item.match(/\*\*([^*]+)\*\*/)
        if (nameMatch) {
          const name = nameMatch[1].replace(/superpowers:/i, '').trim()
          skills.add(name.toLowerCase())
        }
      }
    }
  }

  return Array.from(skills)
}

/**
 * 連携するエージェントを抽出
 *
 * @param content - ファイルコンテンツ
 * @returns 連携エージェント名の配列
 */
export function extractRelatedAgents(content: string): string[] {
  const agents = new Set<string>()

  // subagent_type パターン
  const subagentMatches = content.matchAll(/subagent_type[=:]\s*["']?([A-Za-z][A-Za-z0-9-]*)["']?/gi)
  for (const match of subagentMatches) {
    agents.add(match[1].toLowerCase())
  }

  // Task tool with agent type
  const taskMatches = content.matchAll(/Task.*?(?:subagent_type|agent)[=:]\s*["']?([A-Za-z][A-Za-z0-9-]*)["']?/gi)
  for (const match of taskMatches) {
    agents.add(match[1].toLowerCase())
  }

  return Array.from(agents)
}

/**
 * 使用例を抽出
 *
 * コードブロック、Example セクション、Quick version セクション、<example>タグから抽出
 *
 * @param content - ファイルコンテンツ
 * @returns 使用例の配列
 */
export function extractExamples(content: string): ExampleInfo[] {
  const examples: ExampleInfo[] = []

  // <example>タグから使用例を抽出（エージェント向け）
  const agentExamples = extractAgentExamples(content)
  examples.push(...agentExamples)

  // "Example:" または "**Example:**" の後のコードブロック
  const exampleBlocks = content.matchAll(/(?:\*\*)?Example(?:\s*\([^)]+\))?:?\*?\*?\s*\n```\w*\n([\s\S]*?)```/gi)
  for (const match of exampleBlocks) {
    const code = match[1].trim()
    if (code) {
      examples.push({
        title: '使用例',
        content: code,
        type: 'code',
      })
    }
  }

  // "Quick version:" セクション
  const quickMatch = content.match(/\*\*Quick version:\*\*\s*\n([\s\S]*?)(?=\n\n##|\n\*\*|$)/i)
  if (quickMatch) {
    const quickContent = quickMatch[1].trim()
    if (quickContent) {
      examples.push({
        title: 'クイックガイド',
        content: quickContent,
        type: 'text',
      })
    }
  }

  return examples.slice(0, 3) // 最大3つまで
}

/**
 * フローチャート（graphviz形式）を抽出
 *
 * @param content - ファイルコンテンツ
 * @returns graphviz形式のフローチャート、または見つからなければnull
 */
export function extractFlowChart(content: string): string | null {
  // ```dot または digraph を含むコードブロック
  const dotMatch = content.match(/```(?:dot|graphviz)\s*\n([\s\S]*?)```/i)
  if (dotMatch) {
    return dotMatch[1].trim()
  }

  // digraph で始まるブロック（コードブロック外）
  const digraphMatch = content.match(/digraph\s+\w+\s*\{[\s\S]*?\}/i)
  if (digraphMatch) {
    return digraphMatch[0].trim()
  }

  return null
}

/**
 * キーポイント（重要な原則）を抽出
 *
 * "Key Principles", "Core principle", "Iron Law" などのセクションから抽出
 *
 * @param content - ファイルコンテンツ
 * @returns キーポイントの配列
 */
export function extractKeyPoints(content: string): string[] {
  const points: string[] = []

  // "## Key Principles" セクション
  const keyPrinciplesMatch = content.match(/##\s*Key Principles?\s*\n([\s\S]*?)(?=\n##|$)/i)
  if (keyPrinciplesMatch) {
    const listItems = keyPrinciplesMatch[1].match(/^[-*]\s+\*\*([^*]+)\*\*/gm)
    if (listItems) {
      for (const item of listItems.slice(0, 5)) {
        const textMatch = item.match(/\*\*([^*]+)\*\*/)
        if (textMatch) {
          points.push(textMatch[1].trim())
        }
      }
    }
  }

  // "Core principle:" パターン
  const coreMatch = content.match(/\*\*Core principle:\*\*\s*(.+)/i)
  if (coreMatch) {
    points.push(coreMatch[1].trim())
  }

  // "## The Iron Law" セクション
  const ironLawMatch = content.match(/##\s*The Iron Law\s*\n```\s*\n(.+)\n```/i)
  if (ironLawMatch) {
    points.push(ironLawMatch[1].trim())
  }

  return points
}

/**
 * ファイルコンテンツから完全なスキルメタデータを抽出
 *
 * @param content - ファイルコンテンツ
 * @returns スキルメタデータ
 */
export function extractSkillMetadata(content: string): SkillMetadata {
  return {
    name: extractSkillName(content) ?? undefined,
    triggers: extractTriggers(content),
    relatedSkills: extractRelatedSkills(content),
    relatedAgents: extractRelatedAgents(content),
    examples: extractExamples(content),
    flowChart: extractFlowChart(content) ?? undefined,
    keyPoints: extractKeyPoints(content),
  }
}
