import { FC, memo } from 'react'
import type { ErrorCounts } from './ProblemsPanel'
import type { SchemaValidationResult } from '../../utils/schemaValidators'

interface StatusBarProps {
  language: string
  hasChanges: boolean
  showPreview: boolean
  errorCounts: ErrorCounts
  schemaValidation: SchemaValidationResult | null
  hasUnsavedChanges?: boolean
  onPreviewChanges?: () => void
}

const StatusBar: FC<StatusBarProps> = memo(({
  language,
  hasChanges,
  showPreview,
  errorCounts,
  schemaValidation,
  hasUnsavedChanges,
  onPreviewChanges,
}) => {
  const totalErrors = errorCounts.error + errorCounts.warning + errorCounts.info
  const shouldShowValidationStatus = language === 'json' ||
    language === 'yaml' ||
    schemaValidation?.schemaType !== 'unknown'

  return (
    <div className="flex items-center justify-between px-4 py-1 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
      <div className="flex items-center gap-4">
        <span>{language.toUpperCase()}</span>
        <span>UTF-8</span>
        {showPreview && (
          <span className="text-blue-500 dark:text-blue-400">Preview ON</span>
        )}
        {/* Validation Status */}
        {totalErrors > 0 ? (
          <span className="flex items-center gap-2">
            {errorCounts.error > 0 && (
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                エラー: {errorCounts.error}
              </span>
            )}
            {errorCounts.warning > 0 && (
              <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                警告: {errorCounts.warning}
              </span>
            )}
            {errorCounts.info > 0 && (
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                情報: {errorCounts.info}
              </span>
            )}
          </span>
        ) : (
          shouldShowValidationStatus && (
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              検証OK
            </span>
          )
        )}
      </div>
      <div className="flex items-center gap-3">
        {/* Preview Changes Button */}
        {hasUnsavedChanges && onPreviewChanges && (
          <button
            onClick={onPreviewChanges}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
            title="変更内容を差分表示"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            差分を表示
          </button>
        )}
        <span>
          {hasChanges ? '変更あり' : '保存済み'}
        </span>
      </div>
    </div>
  )
})

StatusBar.displayName = 'StatusBar'

export default StatusBar
