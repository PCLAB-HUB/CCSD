import { FC, memo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Icon from '../common/Icon'

/** 改善提案の重要度 */
export type SuggestionSeverity = 'info' | 'warning' | 'error'

/** 改善提案の型定義 */
export interface Suggestion {
  id: string
  title: string
  description: string
  severity: SuggestionSeverity
  /** 変更前のコード/テキスト */
  before?: string
  /** 変更後のコード/テキスト */
  after?: string
  /** 行番号（オプション） */
  lineNumber?: number
}

interface ReviewSuggestionProps {
  suggestion: Suggestion
  darkMode: boolean
  onApply?: (suggestion: Suggestion) => void
  onDismiss?: (suggestionId: string) => void
  isApplying?: boolean
}

/** 重要度に応じた色の設定 */
const severityStyles: Record<SuggestionSeverity, {
  border: string
  bg: string
  icon: string
  badge: string
}> = {
  info: {
    border: 'border-blue-400 dark:border-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: 'text-blue-500 dark:text-blue-400',
    badge: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
  },
  warning: {
    border: 'border-yellow-400 dark:border-yellow-500',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    icon: 'text-yellow-500 dark:text-yellow-400',
    badge: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
  },
  error: {
    border: 'border-red-400 dark:border-red-500',
    bg: 'bg-red-50 dark:bg-red-900/20',
    icon: 'text-red-500 dark:text-red-400',
    badge: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
  },
}

const severityLabels: Record<SuggestionSeverity, string> = {
  info: '情報',
  warning: '警告',
  error: '重要',
}

const severityIcons: Record<SuggestionSeverity, 'info' | 'warning' | 'error'> = {
  info: 'info',
  warning: 'warning',
  error: 'error',
}

/**
 * 個別の改善提案を表示するカードコンポーネント
 */
const ReviewSuggestion: FC<ReviewSuggestionProps> = memo(({
  suggestion,
  darkMode,
  onApply,
  onDismiss,
  isApplying = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const styles = severityStyles[suggestion.severity]
  const hasDiff = suggestion.before || suggestion.after

  return (
    <div
      className={`
        rounded-lg border-l-4 overflow-hidden
        ${styles.border} ${styles.bg}
        ${darkMode ? 'bg-opacity-50' : ''}
      `}
    >
      {/* ヘッダー */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* アイコン */}
            <div className={`flex-shrink-0 mt-0.5 ${styles.icon}`}>
              <Icon name={severityIcons[suggestion.severity]} className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              {/* タイトルとバッジ */}
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className={`
                  font-medium text-sm
                  ${darkMode ? 'text-gray-100' : 'text-gray-900'}
                `}>
                  {suggestion.title}
                </h4>
                <span className={`
                  px-2 py-0.5 text-xs font-medium rounded-full
                  ${styles.badge}
                `}>
                  {severityLabels[suggestion.severity]}
                </span>
                {suggestion.lineNumber && (
                  <span className={`
                    px-2 py-0.5 text-xs rounded
                    ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}
                  `}>
                    行 {suggestion.lineNumber}
                  </span>
                )}
              </div>

              {/* 説明 */}
              <div className={`
                mt-2 text-sm prose prose-sm max-w-none
                ${darkMode ? 'prose-invert text-gray-300' : 'text-gray-600'}
              `}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {suggestion.description}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>

        {/* 差分表示トグル */}
        {hasDiff && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`
              mt-3 flex items-center gap-1 text-xs font-medium
              ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}
              transition-colors
            `}
          >
            <Icon
              name={isExpanded ? 'chevronDown' : 'chevronRight'}
              className="w-4 h-4"
            />
            {isExpanded ? '差分を非表示' : '差分を表示'}
          </button>
        )}

        {/* 差分表示 */}
        {isExpanded && hasDiff && (
          <div className={`
            mt-3 rounded-md overflow-hidden text-sm font-mono
            ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}
          `}>
            {suggestion.before && (
              <div className={`
                p-3 border-b
                ${darkMode ? 'bg-red-900/30 border-gray-700' : 'bg-red-50 border-gray-200'}
              `}>
                <div className={`
                  text-xs font-sans mb-1
                  ${darkMode ? 'text-red-400' : 'text-red-600'}
                `}>
                  変更前:
                </div>
                <pre className={`
                  whitespace-pre-wrap break-words
                  ${darkMode ? 'text-red-300' : 'text-red-700'}
                `}>
                  {suggestion.before}
                </pre>
              </div>
            )}
            {suggestion.after && (
              <div className={`
                p-3
                ${darkMode ? 'bg-green-900/30' : 'bg-green-50'}
              `}>
                <div className={`
                  text-xs font-sans mb-1
                  ${darkMode ? 'text-green-400' : 'text-green-600'}
                `}>
                  変更後:
                </div>
                <pre className={`
                  whitespace-pre-wrap break-words
                  ${darkMode ? 'text-green-300' : 'text-green-700'}
                `}>
                  {suggestion.after}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* アクションボタン */}
        <div className="mt-4 flex items-center gap-2">
          {onApply && suggestion.after && (
            <button
              onClick={() => onApply(suggestion)}
              disabled={isApplying}
              className={`
                px-3 py-1.5 text-sm font-medium rounded-md
                transition-colors flex items-center gap-1.5
                ${isApplying
                  ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600 text-white'
                }
              `}
            >
              {isApplying ? (
                <>
                  <Icon name="spinner" className="w-4 h-4 animate-spin" />
                  適用中...
                </>
              ) : (
                <>
                  <Icon name="check" className="w-4 h-4" />
                  適用
                </>
              )}
            </button>
          )}
          {onDismiss && (
            <button
              onClick={() => onDismiss(suggestion.id)}
              className={`
                px-3 py-1.5 text-sm font-medium rounded-md
                transition-colors
                ${darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }
              `}
            >
              無視
            </button>
          )}
        </div>
      </div>
    </div>
  )
})

ReviewSuggestion.displayName = 'ReviewSuggestion'

export default ReviewSuggestion
