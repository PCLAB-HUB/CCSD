/**
 * 検索・置換機能の型定義
 */

// ============================================================================
// 基本型
// ============================================================================

/** 検索・置換モード */
export type SearchReplaceMode = 'search' | 'replace'

/** 検索・置換オプション */
export interface SearchReplaceOptions {
  /** 大文字・小文字を区別 */
  caseSensitive: boolean
  /** 単語単位で検索 */
  wholeWord: boolean
  /** 正規表現を使用 */
  useRegex: boolean
}

/** デフォルトの検索オプション */
export const DEFAULT_SEARCH_OPTIONS: SearchReplaceOptions = {
  caseSensitive: false,
  wholeWord: false,
  useRegex: false,
}

// ============================================================================
// 検索結果
// ============================================================================

/** 検索マッチ情報 */
export interface SearchMatch {
  /** マッチのインデックス（0始まり） */
  index: number
  /** 開始行（1始まり） */
  startLine: number
  /** 開始列（0始まり） */
  startCol: number
  /** 終了行（1始まり） */
  endLine: number
  /** 終了列（0始まり） */
  endCol: number
  /** マッチしたテキスト */
  matchText: string
  /** マッチ周辺のコンテキスト */
  context: SearchMatchContext
}

/** マッチ周辺のコンテキスト情報 */
export interface SearchMatchContext {
  /** マッチの前のテキスト */
  before: string
  /** マッチの後のテキスト */
  after: string
  /** マッチを含む行全体 */
  line: string
}

// ============================================================================
// 置換結果
// ============================================================================

/** 置換結果 */
export interface ReplaceResult {
  /** 置換成功かどうか */
  success: boolean
  /** 置換された件数 */
  replacedCount: number
  /** 置換後のテキスト */
  newContent: string
  /** エラーメッセージ（失敗時） */
  error?: string
}

/** 単一置換の結果 */
export interface SingleReplaceResult {
  /** 置換成功かどうか */
  success: boolean
  /** 置換後のテキスト */
  newContent: string
  /** 次のマッチインデックス */
  nextIndex: number
  /** エラーメッセージ */
  error?: string
}

// ============================================================================
// 状態管理
// ============================================================================

/** 検索・置換の状態 */
export interface SearchReplaceState {
  /** 検索クエリ */
  query: string
  /** 置換テキスト */
  replaceText: string
  /** 検索オプション */
  options: SearchReplaceOptions
  /** 検索結果のマッチリスト */
  matches: SearchMatch[]
  /** 現在選択中のマッチインデックス */
  currentIndex: number
  /** 置換処理中かどうか */
  isReplacing: boolean
  /** 検索パネルが開いているかどうか */
  isOpen: boolean
  /** 現在のモード */
  mode: SearchReplaceMode
}

/** デフォルトの状態 */
export const DEFAULT_SEARCH_REPLACE_STATE: SearchReplaceState = {
  query: '',
  replaceText: '',
  options: DEFAULT_SEARCH_OPTIONS,
  matches: [],
  currentIndex: -1,
  isReplacing: false,
  isOpen: false,
  mode: 'search',
}

// ============================================================================
// アクション
// ============================================================================

/** 検索・置換アクションのインターフェース */
export interface SearchReplaceActions {
  /** 検索パネルを開く */
  open: (mode?: SearchReplaceMode) => void
  /** 検索パネルを閉じる */
  close: () => void
  /** モードを切り替える */
  setMode: (mode: SearchReplaceMode) => void
  /** 検索クエリを設定 */
  setQuery: (query: string) => void
  /** 置換テキストを設定 */
  setReplaceText: (text: string) => void
  /** オプションを更新 */
  setOptions: (options: Partial<SearchReplaceOptions>) => void
  /** 検索を実行 */
  search: (content: string) => SearchMatch[]
  /** 次のマッチへ移動 */
  findNext: () => void
  /** 前のマッチへ移動 */
  findPrevious: () => void
  /** 特定のマッチへ移動 */
  goToMatch: (index: number) => void
  /** 現在のマッチを置換 */
  replaceCurrent: (content: string) => SingleReplaceResult
  /** 全て置換 */
  replaceAll: (content: string) => ReplaceResult
  /** 検索をクリア */
  clear: () => void
}

// ============================================================================
// フックの戻り値
// ============================================================================

/** useSearchReplace フックの戻り値 */
export interface UseSearchReplaceReturn {
  /** 現在の状態 */
  state: SearchReplaceState
  /** アクション */
  actions: SearchReplaceActions
  /** 現在のマッチ */
  currentMatch: SearchMatch | null
  /** マッチ総数 */
  totalMatches: number
  /** 検索が有効かどうか */
  hasQuery: boolean
  /** マッチがあるかどうか */
  hasMatches: boolean
}

// ============================================================================
// ユーティリティ関数
// ============================================================================

/**
 * 検索オプションから正規表現フラグを生成
 */
export function getRegexFlags(options: SearchReplaceOptions): string {
  return options.caseSensitive ? 'g' : 'gi'
}

/**
 * クエリをエスケープ（正規表現モードでない場合）
 */
export function escapeRegex(query: string): string {
  return query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 検索用の正規表現を構築
 */
export function buildSearchRegex(
  query: string,
  options: SearchReplaceOptions
): RegExp | null {
  if (!query) return null

  try {
    let pattern = options.useRegex ? query : escapeRegex(query)

    if (options.wholeWord) {
      pattern = `\\b${pattern}\\b`
    }

    return new RegExp(pattern, getRegexFlags(options))
  } catch {
    return null
  }
}

/**
 * マッチ情報からハイライト範囲を計算
 */
export function getHighlightRange(match: SearchMatch): {
  start: { line: number; col: number }
  end: { line: number; col: number }
} {
  return {
    start: { line: match.startLine, col: match.startCol },
    end: { line: match.endLine, col: match.endCol },
  }
}

/**
 * マッチが有効な範囲内にあるか確認
 */
export function isValidMatchIndex(
  index: number,
  matches: SearchMatch[]
): boolean {
  return index >= 0 && index < matches.length
}
