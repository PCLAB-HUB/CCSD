import { FC, memo } from 'react'
import type { ErrorCounts } from './ProblemsPanel'
import type { SchemaValidationResult } from '../../utils/schemaValidators'
import { Icon } from '../common'

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
      <div className="flex items-center gap-3">
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
                <Icon name="warning" className="size-3.5" />
                エラー: {errorCounts.error}
              </span>
            )}
            {errorCounts.warning > 0 && (
              <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                <Icon name="infoCircle" className="size-3.5" />
                警告: {errorCounts.warning}
              </span>
            )}
            {errorCounts.info > 0 && (
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <Icon name="info" className="size-3.5" />
                情報: {errorCounts.info}
              </span>
            )}
          </span>
        ) : (
          shouldShowValidationStatus && (
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <Icon name="check" className="size-3.5" />
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
            <Icon name="diff" className="size-3.5" />
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
