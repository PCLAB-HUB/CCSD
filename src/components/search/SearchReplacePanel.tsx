import { FC, memo, useState, useRef, useEffect, useCallback, useMemo } from 'react'
import Icon from '../common/Icon'
import ReplacePreview from './ReplacePreview'

/**
 * 検索マッチの情報
 */
export interface SearchMatch {
  /** マッチの開始位置 */
  start: number
  /** マッチの終了位置 */
  end: number
  /** マッチしたテキスト */
  text: string
  /** マッチが存在する行番号（1始まり） */
  line: number
  /** 行内での列位置 */
  column: number
}

/**
 * 検索・置換オプション
 */
export interface SearchReplaceOptions {
  /** 大文字小文字を区別するかどうか */
  caseSensitive: boolean
  /** 単語単位で検索するかどうか */
  wholeWord: boolean
  /** 正規表現を使用するかどうか */
  useRegex: boolean
}

interface SearchReplacePanelProps {
  /** パネルが開いているかどうか */
  isOpen: boolean
  /** パネルを閉じるコールバック */
  onClose: () => void
  /** 検索クエリ */
  searchQuery: string
  /** 置換テキスト */
  replaceText: string
  /** マッチした結果の配列 */
  matches: SearchMatch[]
  /** 現在のマッチインデックス */
  currentMatchIndex: number
  /** 検索オプション */
  options: SearchReplaceOptions
  /** 置換処理中かどうか */
  isReplacing: boolean
  /** 検索クエリ変更コールバック */
  onSearchChange: (query: string) => void
  /** 置換テキスト変更コールバック */
  onReplaceTextChange: (text: string) => void
  /** オプション変更コールバック */
  onOptionsChange: (options: Partial<SearchReplaceOptions>) => void
  /** 次を検索 */
  onFindNext: () => void
  /** 前を検索 */
  onFindPrev: () => void
  /** 現在のマッチを置換 */
  onReplaceCurrent: () => void
  /** 全て置換 */
  onReplaceAll: () => void
}

/**
 * 検索オプションボタンコンポーネント
 */
interface OptionButtonProps {
  label: string
  title: string
  isActive: boolean
  onClick: () => void
}

const OptionButton: FC<OptionButtonProps> = memo(({ label, title, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    aria-pressed={isActive}
    className={`
      px-2 py-1 text-xs font-mono rounded transition-colors
      focus:outline-none focus:ring-2 focus:ring-blue-500
      ${
        isActive
          ? 'bg-blue-500 text-white dark:bg-blue-600'
          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
      }
    `}
  >
    {label}
  </button>
))

OptionButton.displayName = 'OptionButton'

/**
 * 検索・置換パネル
 *
 * VSCodeライクな検索・置換UIを提供するパネルコンポーネント。
 * 折りたたみ可能なデザインで、検索のみモードと検索+置換モードを切り替えられる。
 */
const SearchReplacePanel: FC<SearchReplacePanelProps> = ({
  isOpen,
  onClose,
  searchQuery,
  replaceText,
  matches,
  currentMatchIndex,
  options,
  isReplacing,
  onSearchChange,
  onReplaceTextChange,
  onOptionsChange,
  onFindNext,
  onFindPrev,
  onReplaceCurrent,
  onReplaceAll,
}) => {
  // 置換パネルの展開状態
  const [isExpanded, setIsExpanded] = useState(false)

  // プレビュー表示の展開状態
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false)

  // 検索入力への参照
  const searchInputRef = useRef<HTMLInputElement>(null)

  // パネルが開いた時に検索入力にフォーカス
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
      searchInputRef.current.select()
    }
  }, [isOpen])

  // キーボードショートカットハンドラー
  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        if (e.shiftKey) {
          onFindPrev()
        } else {
          onFindNext()
        }
      } else if (e.key === 'Escape') {
        onClose()
      }
    },
    [onFindNext, onFindPrev, onClose]
  )

  const handleReplaceKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        if (e.shiftKey) {
          onReplaceAll()
        } else {
          onReplaceCurrent()
        }
      } else if (e.key === 'Escape') {
        onClose()
      }
    },
    [onReplaceCurrent, onReplaceAll, onClose]
  )

  // マッチカウント表示
  const matchCountText =
    matches.length > 0
      ? `${currentMatchIndex + 1} / ${matches.length}`
      : searchQuery.length > 0
        ? '0件'
        : ''

  // 現在のマッチのコンテキストを取得
  const currentMatchContext = useMemo(() => {
    if (matches.length === 0 || currentMatchIndex < 0) {
      return undefined
    }
    const match = matches[currentMatchIndex]
    if (!match) return undefined

    // コンテキスト用の前後テキストを生成（マッチの位置情報から推定）
    // 実際のエディタコンテンツがないため、行・列情報からコンテキストを表示
    return {
      before: `L${match.line}:${match.column} `,
      after: '',
    }
  }, [matches, currentMatchIndex])

  // プレビュー表示の条件: 置換モード展開中 && 置換テキストが入力されている && マッチがある
  const showPreviewSection = isExpanded && replaceText.length > 0 && matches.length > 0

  // パネルが閉じている場合は何も表示しない
  if (!isOpen) {
    return null
  }

  return (
    <div
      className="flex flex-col bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm"
      role="search"
      aria-label="検索・置換パネル"
    >
      <div className="flex items-start gap-2 p-2">
        {/* 展開/折りたたみボタン */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 mt-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-expanded={isExpanded}
          aria-controls="replace-section"
          title={isExpanded ? '置換を非表示' : '置換を表示'}
        >
          <Icon
            name={isExpanded ? 'chevronDown' : 'chevronRight'}
            className="size-4 text-gray-500 dark:text-gray-400"
          />
        </button>

        {/* 検索・置換フォーム */}
        <div className="flex-1 flex flex-col gap-2">
          {/* 検索行 */}
          <div className="flex items-center gap-2">
            {/* 検索入力 */}
            <div className="relative flex-1 max-w-md">
              <Icon
                name="search"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-gray-400"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="検索..."
                aria-label="検索文字列"
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* マッチカウント */}
            {matchCountText && (
              <span
                className="text-sm text-gray-500 dark:text-gray-400 min-w-[60px] text-center"
                aria-live="polite"
                aria-atomic="true"
              >
                {matchCountText}
              </span>
            )}

            {/* ナビゲーションボタン */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onFindPrev}
                disabled={matches.length === 0}
                className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="前を検索 (Shift+Enter)"
                aria-label="前を検索"
              >
                <Icon name="chevronUp" className="size-4 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                type="button"
                onClick={onFindNext}
                disabled={matches.length === 0}
                className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="次を検索 (Enter)"
                aria-label="次を検索"
              >
                <Icon name="chevronDown" className="size-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            {/* 検索オプション */}
            <div className="flex items-center gap-1 pl-2 border-l border-gray-200 dark:border-gray-600">
              <OptionButton
                label="Aa"
                title="大文字小文字を区別"
                isActive={options.caseSensitive}
                onClick={() => onOptionsChange({ caseSensitive: !options.caseSensitive })}
              />
              <OptionButton
                label="Ab|"
                title="単語単位で検索"
                isActive={options.wholeWord}
                onClick={() => onOptionsChange({ wholeWord: !options.wholeWord })}
              />
              <OptionButton
                label=".*"
                title="正規表現を使用"
                isActive={options.useRegex}
                onClick={() => onOptionsChange({ useRegex: !options.useRegex })}
              />
            </div>

            {/* 閉じるボタン */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="閉じる (ESC)"
              aria-label="検索パネルを閉じる"
            >
              <Icon name="close" className="size-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* 置換行（展開時のみ表示） */}
          {isExpanded && (
            <div id="replace-section" className="flex items-center gap-2">
              {/* 置換入力 */}
              <div className="relative flex-1 max-w-md">
                <Icon
                  name="sync"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-gray-400"
                />
                <input
                  type="text"
                  value={replaceText}
                  onChange={(e) => onReplaceTextChange(e.target.value)}
                  onKeyDown={handleReplaceKeyDown}
                  placeholder="置換..."
                  aria-label="置換文字列"
                  className="w-full pl-8 pr-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* スペーサー（マッチカウントの幅分） */}
              <div className="min-w-[60px]" />

              {/* 置換ボタン */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onReplaceCurrent}
                  disabled={matches.length === 0 || isReplacing}
                  className="px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                  title="現在のマッチを置換 (Enter)"
                >
                  {isReplacing ? (
                    <Icon name="spinner" className="size-4 animate-spin" />
                  ) : (
                    '置換'
                  )}
                </button>
                <button
                  type="button"
                  onClick={onReplaceAll}
                  disabled={matches.length === 0 || isReplacing}
                  className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                  title="全て置換 (Shift+Enter)"
                >
                  {isReplacing ? (
                    <Icon name="spinner" className="size-4 animate-spin" />
                  ) : (
                    '全て置換'
                  )}
                </button>
              </div>

              {/* オプションボタンの幅分のスペーサー */}
              <div className="flex items-center gap-1 pl-2 border-l border-transparent">
                <div className="w-[26px]" />
                <div className="w-[26px]" />
                <div className="w-[26px]" />
              </div>

              {/* 閉じるボタンの幅分のスペーサー */}
              <div className="w-[32px]" />
            </div>
          )}

          {/* プレビューセクション（置換テキスト入力時のみ表示） */}
          {showPreviewSection && (
            <div className="flex flex-col gap-1.5 pt-1 border-t border-gray-200 dark:border-gray-700">
              {/* プレビューヘッダー（トグル付き） */}
              <button
                type="button"
                onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                aria-expanded={isPreviewExpanded}
                aria-controls="preview-content"
              >
                <Icon
                  name={isPreviewExpanded ? 'chevronDown' : 'chevronRight'}
                  className="size-3"
                />
                <span>プレビュー</span>
                <span className="text-gray-400 dark:text-gray-500">
                  ({matches.length}件)
                </span>
              </button>

              {/* プレビュー内容（展開時のみ表示） */}
              {isPreviewExpanded && (
                <div
                  id="preview-content"
                  className="ml-4 space-y-1.5 max-h-32 overflow-y-auto"
                >
                  {/* 現在のマッチのプレビュー */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                      現在:
                    </span>
                    <ReplacePreview
                      originalText={matches[currentMatchIndex]?.text || searchQuery}
                      newText={replaceText}
                      context={currentMatchContext}
                      isVisible={true}
                    />
                  </div>

                  {/* 複数マッチがある場合、他のマッチも表示（最大3件） */}
                  {matches.length > 1 && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {matches.slice(0, 3).map((match, index) => (
                        index !== currentMatchIndex && (
                          <div key={`${match.line}-${match.column}`} className="flex items-center gap-2 mt-1 opacity-60">
                            <span className="shrink-0">
                              L{match.line}:
                            </span>
                            <span className="truncate max-w-xs">
                              <span className="line-through text-red-400 dark:text-red-500">{match.text}</span>
                              {' '}
                              <span className="text-green-500 dark:text-green-400">{replaceText}</span>
                            </span>
                          </div>
                        )
                      ))}
                      {matches.length > 3 && (
                        <div className="mt-1 text-gray-400 dark:text-gray-500">
                          ...他 {matches.length - 3}件
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(SearchReplacePanel)
