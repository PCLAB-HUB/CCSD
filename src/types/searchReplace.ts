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

/**
 * 検索マッチ情報（統一版）
 *
 * コンテンツ内での位置（start/end）と行/列情報の両方を保持。
 * - start/end: 文字列内のオフセット位置
 * - line/column: エディタ表示用の行/列位置（0始まり）
 */
export interface SearchMatch {
  /** マッチの開始位置（文字列オフセット） */
  start: number
  /** マッチの終了位置（文字列オフセット） */
  end: number
  /** マッチしたテキスト */
  text: string
  /** マッチが存在する行番号（0始まり） */
  line: number
  /** 行内での開始位置（0始まり） */
  column: number
  /** プレビュー用のコンテキスト（前後のテキストを含む） */
  context: string
}

/**
 * UI表示用の検索マッチ情報
 * SearchReplacePanelなどのUIコンポーネントで使用。
 * 行番号は1始まりに変換される。
 */
export interface SearchMatchDisplay {
  /** マッチの開始位置 */
  start: number
  /** マッチの終了位置 */
  end: number
  /** マッチしたテキスト */
  text: string
  /** マッチが存在する行番号（1始まり、表示用） */
  line: number
  /** 行内での列位置 */
  column: number
}

/**
 * 詳細なマッチ情報（拡張版）
 * 将来の複数ファイル検索などで使用予定
 */
export interface SearchMatchExtended extends SearchMatch {
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
  /** マッチしたテキスト（別名） */
  matchText: string
  /** マッチ周辺のコンテキスト */
  contextInfo: SearchMatchContext
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

/**
 * 置換結果（統一版）
 *
 * useSearchReplaceフックと各コンポーネントで共通して使用。
 */
export interface ReplaceResult {
  /** 置換成功かどうか */
  success: boolean
  /** 置換された件数 */
  count: number
  /** 置換前のコンテンツ（Undo用） */
  originalContent: string
  /** 置換後のコンテンツ */
  newContent: string
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

/**
 * 置換プレビュー情報
 */
export interface ReplacePreview {
  /** 置換後の文字列 */
  replacement: string
  /** 置換後のコンテキスト */
  context: string
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
 *
 * SearchMatch型（line/columnベース）からMonaco Editor用の範囲を計算。
 * 注: Monaco Editorは1始まりの行番号を使用するため、+1する。
 */
export function getHighlightRange(match: SearchMatch): {
  start: { line: number; col: number }
  end: { line: number; col: number }
} {
  // SearchMatchのlineは0始まり、Monaco Editorは1始まり
  const startLine = match.line + 1
  const startCol = match.column
  // 終了位置を計算（マッチテキストが複数行にまたがる場合を考慮）
  const matchLines = match.text.split('\n')
  const endLine = startLine + matchLines.length - 1
  const endCol =
    matchLines.length === 1
      ? startCol + match.text.length
      : matchLines[matchLines.length - 1].length

  return {
    start: { line: startLine, col: startCol },
    end: { line: endLine, col: endCol },
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
