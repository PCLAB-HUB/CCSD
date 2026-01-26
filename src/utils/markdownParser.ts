import matter from 'gray-matter'

export interface ParsedMarkdown {
  frontmatter: Record<string, unknown> | null
  content: string
  hasFrontmatter: boolean
  parseError?: string
}

/**
 * Markdownテキストからフロントマター（YAMLヘッダー）とコンテンツを分離
 */
export function parseMarkdown(markdown: string): ParsedMarkdown {
  try {
    const parsed = matter(markdown)

    const hasFrontmatter = Object.keys(parsed.data).length > 0

    return {
      frontmatter: hasFrontmatter ? parsed.data : null,
      content: parsed.content,
      hasFrontmatter,
    }
  } catch (error) {
    // パースに失敗した場合は元のコンテンツをそのまま返す
    // デバッグ用にエラー情報を保持
    const parseError = error instanceof Error ? error.message : 'Unknown parse error'

    return {
      frontmatter: null,
      content: markdown,
      hasFrontmatter: false,
      parseError,
    }
  }
}

/**
 * ファイル名がMarkdownかどうかを判定
 */
export function isMarkdownFile(filename: string): boolean {
  return filename.toLowerCase().endsWith('.md')
}

/**
 * フロントマターの値をフォーマット
 */
export function formatFrontmatterValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '-'
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.join(', ')
    }
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}
