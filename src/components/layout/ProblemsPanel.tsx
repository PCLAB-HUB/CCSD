import { FC, memo, useState, useCallback } from 'react'
import type { ValidationError, ValidationSeverity } from '../../types'
import { getSeverityColor, getSeverityIcon } from '../../utils/errorMessages'

/** 重大度に応じたスタイル設定 */
const severityStyles: Record<ValidationSeverity, {
  badge: string
  row: string
  icon: string
}> = {
  error: {
    badge: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
    row: 'hover:bg-red-50 dark:hover:bg-red-900/30',
    icon: 'text-red-500 dark:text-red-400',
  },
  warning: {
    badge: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
    row: 'hover:bg-yellow-50 dark:hover:bg-yellow-900/30',
    icon: 'text-yellow-500 dark:text-yellow-400',
  },
  info: {
    badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    row: 'hover:bg-blue-50 dark:hover:bg-blue-900/30',
    icon: 'text-blue-500 dark:text-blue-400',
  },
}

export interface ErrorCounts {
  error: number
  warning: number
  info: number
}

interface ProblemsPanelProps {
  errors: ValidationError[]
  errorCounts: ErrorCounts
  onGoToLine: (line: number, column: number) => void
}

const ProblemsPanel: FC<ProblemsPanelProps> = memo(({
  errors,
  errorCounts,
  onGoToLine,
}) => {
  const [showPanel, setShowPanel] = useState(true)

  const handleTogglePanel = useCallback(() => {
    setShowPanel(prev => !prev)
  }, [])

  const handleErrorClick = useCallback((line: number, column: number) => {
    onGoToLine(line, column)
  }, [onGoToLine])

  if (errors.length === 0) {
    return null
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700">
      {/* Panel Header */}
      <div
        className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 cursor-pointer select-none"
        onClick={handleTogglePanel}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">問題</span>
          <div className="flex items-center gap-2">
            {errorCounts.error > 0 && (
              <span className={`px-2 py-0.5 text-xs rounded-full ${severityStyles.error.badge}`}>
                {errorCounts.error}
              </span>
            )}
            {errorCounts.warning > 0 && (
              <span className={`px-2 py-0.5 text-xs rounded-full ${severityStyles.warning.badge}`}>
                {errorCounts.warning}
              </span>
            )}
            {errorCounts.info > 0 && (
              <span className={`px-2 py-0.5 text-xs rounded-full ${severityStyles.info.badge}`}>
                {errorCounts.info}
              </span>
            )}
          </div>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${showPanel ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Problems List */}
      {showPanel && (
        <div className="max-h-48 overflow-y-auto bg-white dark:bg-gray-900">
          {errors.map((error, index) => {
            const styles = severityStyles[error.severity]
            return (
              <div
                key={index}
                className={`flex items-start gap-3 px-4 py-2 border-b border-gray-100 dark:border-gray-800 last:border-b-0 cursor-pointer ${styles.row}`}
                onClick={() => handleErrorClick(error.line, error.column)}
              >
                <div className={`flex-shrink-0 mt-0.5 ${styles.icon}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={getSeverityIcon(error.severity)}
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${getSeverityColor(error.severity)}`}>
                    {error.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    行 {error.line}, 列 {error.column}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
})

ProblemsPanel.displayName = 'ProblemsPanel'

export { severityStyles }
export default ProblemsPanel
