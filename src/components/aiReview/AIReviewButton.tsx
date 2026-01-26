import { FC, memo } from 'react'
import Icon from '../common/Icon'

interface AIReviewButtonProps {
  onClick: () => void
  isLoading?: boolean
  disabled?: boolean
  hasResults?: boolean
  suggestionCount?: number
}

/**
 * AIレビュー実行ボタン（ツールバー用）
 */
const AIReviewButton: FC<AIReviewButtonProps> = memo(({
  onClick,
  isLoading = false,
  disabled = false,
  hasResults = false,
  suggestionCount = 0,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        px-3 py-1.5 text-sm rounded-md transition-colors
        flex items-center gap-2 relative
        ${isLoading
          ? 'bg-purple-400 dark:bg-purple-600 cursor-wait'
          : hasResults
            ? 'bg-purple-500 hover:bg-purple-600 text-white'
            : 'bg-purple-500 hover:bg-purple-600 text-white'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      title="AIによる設定ファイルのレビューを実行"
    >
      {isLoading ? (
        <>
          <Icon name="spinner" className="w-4 h-4 animate-spin" />
          <span>レビュー中...</span>
        </>
      ) : (
        <>
          <Icon name="robot" className="w-4 h-4" />
          <span>AIレビュー</span>
          {hasResults && suggestionCount > 0 && (
            <span className="
              absolute -top-1.5 -right-1.5
              min-w-[1.25rem] h-5 px-1
              flex items-center justify-center
              text-xs font-bold
              bg-red-500 text-white rounded-full
            ">
              {suggestionCount > 99 ? '99+' : suggestionCount}
            </span>
          )}
        </>
      )}
    </button>
  )
})

AIReviewButton.displayName = 'AIReviewButton'

export default AIReviewButton
