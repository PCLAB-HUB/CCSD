import { FC, memo, useCallback } from 'react'
import type { ValidationSeverity } from '../../types'
import { getSeverityIcon } from '../../utils/errorMessages'

/** リントメッセージの重大度スタイル */
export const lintSeverityStyles: Record<ValidationSeverity, {
  badge: string
  row: string
  icon: string
  border: string
}> = {
  error: {
    badge: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
    row: 'hover:bg-red-50 dark:hover:bg-red-900/30 border-l-red-500',
    icon: 'text-red-500 dark:text-red-400',
    border: 'border-l-4',
  },
  warning: {
    badge: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
    row: 'hover:bg-yellow-50 dark:hover:bg-yellow-900/30 border-l-yellow-500',
    icon: 'text-yellow-500 dark:text-yellow-400',
    border: 'border-l-4',
  },
  info: {
    badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    row: 'hover:bg-blue-50 dark:hover:bg-blue-900/30 border-l-blue-500',
    icon: 'text-blue-500 dark:text-blue-400',
    border: 'border-l-4',
  },
}

/** リントメッセージのルール情報 */
export interface LintRule {
  id: string
  name: string
  description?: string
  documentationUrl?: string
}

/** リントメッセージのデータ */
export interface LintMessageData {
  id: string
  message: string
  line: number
  column: number
  endLine?: number
  endColumn?: number
  severity: ValidationSeverity
  source: string
  rule?: LintRule
  fix?: {
    description: string
    replacement: string
  }
}

interface LintMessageProps {
  data: LintMessageData
  onGoToLine: (line: number, column: number) => void
  onApplyFix?: (data: LintMessageData) => void
  showRule?: boolean
  showSource?: boolean
  compact?: boolean
}

/**
 * 個別のリントメッセージを表示するコンポーネント
 * クリックで該当行にジャンプ、修正候補がある場合は適用可能
 */
const LintMessage: FC<LintMessageProps> = memo(({
  data,
  onGoToLine,
  onApplyFix,
  showRule = true,
  showSource = true,
  compact = false,
}) => {
  const styles = lintSeverityStyles[data.severity]
  const severityLabel = data.severity === 'error' ? 'エラー' : data.severity === 'warning' ? '警告' : '情報'

  const handleClick = useCallback(() => {
    onGoToLine(data.line, data.column)
  }, [onGoToLine, data.line, data.column])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onGoToLine(data.line, data.column)
    }
  }, [onGoToLine, data.line, data.column])

  const handleApplyFix = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (onApplyFix && data.fix) {
      onApplyFix(data)
    }
  }, [onApplyFix, data])

  const handleApplyFixKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.stopPropagation()
      if (onApplyFix && data.fix) {
        onApplyFix(data)
      }
    }
  }, [onApplyFix, data])

  const locationText = data.endLine && data.endLine !== data.line
    ? `${data.line}:${data.column} - ${data.endLine}:${data.endColumn || 1}`
    : `${data.line}:${data.column}`

  return (
    <div
      role="listitem"
      tabIndex={0}
      aria-label={`${severityLabel}: ${data.message}。行 ${data.line}, 列 ${data.column}`}
      className={`
        flex items-start gap-2 px-3 py-2
        border-b border-gray-100 dark:border-gray-800 last:border-b-0
        cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
        ${styles.border} ${styles.row}
        transition-colors duration-150
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {/* 重大度アイコン */}
      <div className={`flex-shrink-0 mt-0.5 ${styles.icon}`} aria-hidden="true">
        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={getSeverityIcon(data.severity)}
          />
        </svg>
      </div>

      {/* メッセージ内容 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium ${styles.icon}`}>
            <span className="sr-only">{severityLabel}: </span>
            {data.message}
          </p>

          {/* 修正ボタン */}
          {data.fix && onApplyFix && (
            <button
              type="button"
              onClick={handleApplyFix}
              onKeyDown={handleApplyFixKeyDown}
              className="flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded
                bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300
                hover:bg-green-200 dark:hover:bg-green-900/70
                focus:outline-none focus:ring-2 focus:ring-green-500
                transition-colors"
              title={data.fix.description}
            >
              修正
            </button>
          )}
        </div>

        {/* メタ情報 */}
        <div className={`flex items-center gap-2 mt-1 ${compact ? 'text-xs' : 'text-xs'}`}>
          {/* 位置情報 */}
          <span className="text-gray-500 dark:text-gray-400 font-mono">
            {locationText}
          </span>

          {/* ソース */}
          {showSource && data.source && (
            <>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span className="text-gray-500 dark:text-gray-400">
                {data.source}
              </span>
            </>
          )}

          {/* ルール */}
          {showRule && data.rule && (
            <>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              {data.rule.documentationUrl ? (
                <a
                  href={data.rule.documentationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 dark:text-blue-400 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                  title={data.rule.description || data.rule.name}
                >
                  {data.rule.id}
                </a>
              ) : (
                <span
                  className="text-gray-500 dark:text-gray-400"
                  title={data.rule.description || data.rule.name}
                >
                  {data.rule.id}
                </span>
              )}
            </>
          )}
        </div>

        {/* 修正候補の説明（展開時） */}
        {!compact && data.fix && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic">
            修正候補: {data.fix.description}
          </p>
        )}
      </div>
    </div>
  )
})

LintMessage.displayName = 'LintMessage'

export default LintMessage
