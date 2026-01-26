import { useState, useCallback, useMemo, useRef, useEffect } from 'react'

/**
 * 検索マッチの情報
 */
export interface SearchMatch {
  /** マッチの開始位置 */
  start: number
  /** マッチの終了位置 */
  end: number
  /** マッチした文字列 */
  text: string
  /** マッチが存在する行番号（0始まり） */
  line: number
  /** 行内での開始位置 */
  column: number
  /** プレビュー用のコンテキスト（前後のテキストを含む） */
  context: string
}

/**
 * 検索・置換のオプション
 */
export interface SearchReplaceOptions {
  /** 大文字・小文字を区別する */
  caseSensitive: boolean
  /** 単語全体でマッチ */
  wholeWord: boolean
  /** 正規表現を使用 */
  useRegex: boolean
}

/**
 * 置換結果
 */
export interface ReplaceResult {
  /** 置換成功フラグ */
  success: boolean
  /** 置換された件数 */
  count: number
  /** 置換前のコンテンツ（Undo用） */
  originalContent: string
  /** 置換後のコンテンツ */
  newContent: string
}

/**
 * 置換プレビュー情報
 */
export interface ReplacePreview {
  /** 置換後の文字列 */
  replacement: string
  /** 置換後のコンテキスト */
  context: string
}

/**
 * Undoヒストリーのエントリ
 */
interface UndoEntry {
  /** 操作前のコンテンツ */
  content: string
  /** 操作の説明 */
  description: string
  /** タイムスタンプ */
  timestamp: number
}

const DEFAULT_OPTIONS: SearchReplaceOptions = {
  caseSensitive: false,
  wholeWord: false,
  useRegex: false,
}

const CONTEXT_CHARS = 30 // プレビューに表示する前後の文字数

/**
 * 検索・置換機能を管理するカスタムフック
 *
 * 機能:
 * - ファイル内コンテンツの検索
 * - 単一マッチの置換
 * - 全マッチの一括置換
 * - 大文字小文字区別、単語全体マッチ、正規表現オプション
 * - マッチ間のナビゲーション
 * - 置換プレビュー
 * - Undoサポート
 */
export function useSearchReplace(
  content: string,
  onContentChange: (newContent: string) => void
): {
  // State
  searchQuery: string
  replaceText: string
  matches: SearchMatch[]
  currentMatchIndex: number
  options: SearchReplaceOptions
  isReplacing: boolean
  error: string | null

  // Actions
  setSearchQuery: (query: string) => void
  setReplaceText: (text: string) => void
  setOptions: (options: Partial<SearchReplaceOptions>) => void
  findNext: () => void
  findPrev: () => void
  replaceCurrent: () => ReplaceResult
  replaceAll: () => ReplaceResult
  undo: () => void
  reset: () => void
  clearError: () => void

  // Additional utilities
  getPreview: (matchIndex?: number) => ReplacePreview | null
  canUndo: boolean
  undoHistory: { description: string; timestamp: number }[]
} {
  // 検索クエリ
  const [searchQuery, setSearchQuery] = useState('')
  // 置換テキスト
  const [replaceText, setReplaceText] = useState('')
  // 検索オプション
  const [options, setOptionsState] = useState<SearchReplaceOptions>(DEFAULT_OPTIONS)
  // 現在のマッチインデックス
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  // 置換中フラグ
  const [isReplacing, setIsReplacing] = useState(false)
  // Undoヒストリー
  const [undoHistory, setUndoHistory] = useState<UndoEntry[]>([])
  // エラー状態
  const [error, setError] = useState<string | null>(null)

  // 最新のcontent参照（useCallbackで使用）
  const contentRef = useRef(content)
  useEffect(() => {
    contentRef.current = content
  }, [content])

  /**
   * 正規表現パターンを検証し、エラーメッセージを返す
   */
  const validateRegexPattern = useCallback(
    (query: string): string | null => {
      if (!query) return null
      if (!options.useRegex) return null

      try {
        let pattern = query
        if (options.wholeWord) {
          pattern = `\\b${pattern}\\b`
        }
        const flags = options.caseSensitive ? 'g' : 'gi'
        new RegExp(pattern, flags)
        return null
      } catch (e) {
        if (e instanceof SyntaxError) {
          return `無効な正規表現パターン: ${e.message}`
        }
        return '正規表現の解析中にエラーが発生しました'
      }
    },
    [options.caseSensitive, options.wholeWord, options.useRegex]
  )

  /**
   * 検索パターンを生成
   */
  const buildPattern = useCallback(
    (query: string): RegExp | null => {
      if (!query) return null

      try {
        let pattern: string

        if (options.useRegex) {
          pattern = query
        } else {
          // 特殊文字をエスケープ
          pattern = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        }

        if (options.wholeWord) {
          pattern = `\\b${pattern}\\b`
        }

        const flags = options.caseSensitive ? 'g' : 'gi'
        return new RegExp(pattern, flags)
      } catch {
        // 無効な正規表現の場合はnullを返す
        return null
      }
    },
    [options.caseSensitive, options.wholeWord, options.useRegex]
  )

  /**
   * 正規表現エラーの検出と設定
   */
  useEffect(() => {
    const regexError = validateRegexPattern(searchQuery)
    setError(regexError)
  }, [searchQuery, validateRegexPattern])

  /**
   * マッチのコンテキスト文字列を取得
   */
  const getContext = useCallback((text: string, start: number, end: number): string => {
    const contextStart = Math.max(0, start - CONTEXT_CHARS)
    const contextEnd = Math.min(text.length, end + CONTEXT_CHARS)

    const prefix = contextStart > 0 ? '...' : ''
    const suffix = contextEnd < text.length ? '...' : ''

    return prefix + text.slice(contextStart, contextEnd) + suffix
  }, [])

  /**
   * 位置から行番号とカラム番号を計算
   */
  const getLineAndColumn = useCallback(
    (text: string, position: number): { line: number; column: number } => {
      const lines = text.slice(0, position).split('\n')
      return {
        line: lines.length - 1,
        column: lines[lines.length - 1].length,
      }
    },
    []
  )

  /**
   * マッチを検索
   */
  const matches = useMemo((): SearchMatch[] => {
    const pattern = buildPattern(searchQuery)
    if (!pattern || !content) return []

    const results: SearchMatch[] = []
    let match: RegExpExecArray | null

    // gフラグ付きRegExpでループ
    while ((match = pattern.exec(content)) !== null) {
      const { line, column } = getLineAndColumn(content, match.index)
      results.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
        line,
        column,
        context: getContext(content, match.index, match.index + match[0].length),
      })

      // 空マッチの無限ループを防ぐ
      if (match[0].length === 0) {
        pattern.lastIndex++
      }
    }

    return results
  }, [content, searchQuery, buildPattern, getLineAndColumn, getContext])

  /**
   * マッチインデックスを有効範囲に調整
   */
  useEffect(() => {
    if (matches.length === 0) {
      setCurrentMatchIndex(0)
    } else if (currentMatchIndex >= matches.length) {
      setCurrentMatchIndex(matches.length - 1)
    }
  }, [matches.length, currentMatchIndex])

  /**
   * オプションを更新
   */
  const setOptions = useCallback((newOptions: Partial<SearchReplaceOptions>) => {
    setOptionsState(prev => ({ ...prev, ...newOptions }))
    setCurrentMatchIndex(0) // オプション変更時はインデックスをリセット
  }, [])

  /**
   * 次のマッチに移動
   */
  const findNext = useCallback(() => {
    if (matches.length === 0) return
    setCurrentMatchIndex(prev => (prev + 1) % matches.length)
  }, [matches.length])

  /**
   * 前のマッチに移動
   */
  const findPrev = useCallback(() => {
    if (matches.length === 0) return
    setCurrentMatchIndex(prev => (prev - 1 + matches.length) % matches.length)
  }, [matches.length])

  /**
   * Undoヒストリーにエントリを追加
   */
  const pushUndo = useCallback((originalContent: string, description: string) => {
    setUndoHistory(prev => [
      ...prev,
      {
        content: originalContent,
        description,
        timestamp: Date.now(),
      },
    ])
  }, [])

  /**
   * 置換テキストを生成（正規表現のキャプチャグループをサポート）
   */
  const buildReplacement = useCallback(
    (_matchText: string, matchIndex: number): string => {
      if (!options.useRegex) {
        return replaceText
      }

      // 正規表現モードの場合、$1, $2 などのキャプチャグループ参照を置換
      const pattern = buildPattern(searchQuery)
      if (!pattern) return replaceText

      // 新しいパターンでマッチを再実行してキャプチャグループを取得
      pattern.lastIndex = 0
      const matches: RegExpExecArray[] = []
      let m: RegExpExecArray | null
      while ((m = pattern.exec(content)) !== null) {
        matches.push(m)
        if (m[0].length === 0) pattern.lastIndex++
      }

      const targetMatch = matches[matchIndex]
      if (!targetMatch) return replaceText

      // $& は全体マッチ、$1, $2, ... はキャプチャグループ
      let result = replaceText
      result = result.replace(/\$&/g, targetMatch[0])
      for (let i = 1; i < targetMatch.length; i++) {
        result = result.replace(new RegExp(`\\$${i}`, 'g'), targetMatch[i] || '')
      }

      return result
    },
    [options.useRegex, replaceText, buildPattern, searchQuery, content]
  )

  /**
   * 現在のマッチを置換
   */
  const replaceCurrent = useCallback((): ReplaceResult => {
    // 空の検索文字列でエラー
    if (!searchQuery) {
      setError('検索文字列を入力してください')
      return {
        success: false,
        count: 0,
        originalContent: contentRef.current,
        newContent: contentRef.current,
      }
    }

    // 正規表現エラーがある場合
    if (error) {
      return {
        success: false,
        count: 0,
        originalContent: contentRef.current,
        newContent: contentRef.current,
      }
    }

    if (matches.length === 0 || currentMatchIndex >= matches.length) {
      return {
        success: false,
        count: 0,
        originalContent: contentRef.current,
        newContent: contentRef.current,
      }
    }

    setIsReplacing(true)
    try {
      const match = matches[currentMatchIndex]
      const replacement = buildReplacement(match.text, currentMatchIndex)
      const originalContent = contentRef.current

      const newContent =
        originalContent.slice(0, match.start) + replacement + originalContent.slice(match.end)

      pushUndo(originalContent, `置換: "${match.text}" -> "${replacement}"`)
      onContentChange(newContent)

      // 次のマッチがあれば移動、なければインデックスを調整
      if (matches.length > 1) {
        setCurrentMatchIndex(prev => Math.min(prev, matches.length - 2))
      }

      return {
        success: true,
        count: 1,
        originalContent,
        newContent,
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '予期しないエラーが発生しました'
      setError(`置換中にエラーが発生しました: ${errorMessage}`)
      return {
        success: false,
        count: 0,
        originalContent: contentRef.current,
        newContent: contentRef.current,
      }
    } finally {
      setIsReplacing(false)
    }
  }, [matches, currentMatchIndex, buildReplacement, onContentChange, pushUndo, searchQuery, error])

  /**
   * 全てのマッチを置換
   */
  const replaceAll = useCallback((): ReplaceResult => {
    // 空の検索文字列でエラー
    if (!searchQuery) {
      setError('検索文字列を入力してください')
      return {
        success: false,
        count: 0,
        originalContent: content,
        newContent: content,
      }
    }

    // 正規表現エラーがある場合
    if (error) {
      return {
        success: false,
        count: 0,
        originalContent: content,
        newContent: content,
      }
    }

    if (matches.length === 0) {
      return {
        success: false,
        count: 0,
        originalContent: content,
        newContent: content,
      }
    }

    setIsReplacing(true)
    try {
      const originalContent = content

      // 後ろから置換して位置がずれないようにする
      let newContent = originalContent
      const sortedMatches = [...matches].sort((a, b) => b.start - a.start)

      for (let i = 0; i < sortedMatches.length; i++) {
        const match = sortedMatches[i]
        // 元のmatchesでのインデックスを見つけて正しい置換テキストを生成
        const originalIndex = matches.findIndex(m => m.start === match.start)
        const replacement = buildReplacement(match.text, originalIndex)
        newContent = newContent.slice(0, match.start) + replacement + newContent.slice(match.end)
      }

      pushUndo(originalContent, `全置換: ${matches.length}件`)
      onContentChange(newContent)
      setCurrentMatchIndex(0)

      return {
        success: true,
        count: matches.length,
        originalContent,
        newContent,
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '予期しないエラーが発生しました'
      setError(`全置換中にエラーが発生しました: ${errorMessage}`)
      return {
        success: false,
        count: 0,
        originalContent: content,
        newContent: content,
      }
    } finally {
      setIsReplacing(false)
    }
  }, [matches, content, buildReplacement, onContentChange, pushUndo, searchQuery, error])

  /**
   * 最後の操作をUndo
   */
  const undo = useCallback(() => {
    if (undoHistory.length === 0) return

    const lastEntry = undoHistory[undoHistory.length - 1]
    setUndoHistory(prev => prev.slice(0, -1))
    onContentChange(lastEntry.content)
  }, [undoHistory, onContentChange])

  /**
   * 全ての状態をリセット
   */
  const reset = useCallback(() => {
    setSearchQuery('')
    setReplaceText('')
    setOptionsState(DEFAULT_OPTIONS)
    setCurrentMatchIndex(0)
    setIsReplacing(false)
    setUndoHistory([])
    setError(null)
  }, [])

  /**
   * エラーをクリア
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * 置換プレビューを取得
   */
  const getPreview = useCallback(
    (matchIndex?: number): ReplacePreview | null => {
      const idx = matchIndex ?? currentMatchIndex
      if (matches.length === 0 || idx >= matches.length) return null

      const match = matches[idx]
      const replacement = buildReplacement(match.text, idx)

      // プレビューコンテキストを生成
      const contextStart = Math.max(0, match.start - CONTEXT_CHARS)
      const contextEnd = Math.min(content.length, match.end + CONTEXT_CHARS)

      const prefix = contextStart > 0 ? '...' : ''
      const suffix = contextEnd < content.length ? '...' : ''

      const beforeMatch = content.slice(contextStart, match.start)
      const afterMatch = content.slice(match.end, contextEnd)

      return {
        replacement,
        context: prefix + beforeMatch + replacement + afterMatch + suffix,
      }
    },
    [matches, currentMatchIndex, content, buildReplacement]
  )

  /**
   * Undoが可能かどうか
   */
  const canUndo = undoHistory.length > 0

  /**
   * Undoヒストリーの概要（コンテンツは除外）
   */
  const undoHistorySummary = useMemo(
    () =>
      undoHistory.map(entry => ({
        description: entry.description,
        timestamp: entry.timestamp,
      })),
    [undoHistory]
  )

  return {
    // State
    searchQuery,
    replaceText,
    matches,
    currentMatchIndex,
    options,
    isReplacing,
    error,

    // Actions
    setSearchQuery,
    setReplaceText,
    setOptions,
    findNext,
    findPrev,
    replaceCurrent,
    replaceAll,
    undo,
    reset,
    clearError,

    // Additional utilities
    getPreview,
    canUndo,
    undoHistory: undoHistorySummary,
  }
}
