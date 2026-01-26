import { FC, memo, ReactNode } from 'react'

interface EmptyStateProps {
  /** タイトルテキスト */
  title: string
  /** 説明テキスト */
  description?: string
  /** アイコン（ReactNode）*/
  icon?: ReactNode
  /** アクションボタン */
  action?: {
    label: string
    onClick: () => void
  }
  /** 追加のクラス名 */
  className?: string
}

/**
 * 共通の空状態表示コンポーネント
 * リストが空の時やデータがない時に使用
 */
const EmptyState: FC<EmptyStateProps> = memo(({
  title,
  description,
  icon,
  action,
  className = '',
}) => {
  const defaultIcon = (
    <svg
      className="size-12 text-gray-400 dark:text-gray-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  )

  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="mx-auto mb-4">
        {icon || defaultIcon}
      </div>
      <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">
        {title}
      </p>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded"
        >
          {action.label}
        </button>
      )}
    </div>
  )
})

EmptyState.displayName = 'EmptyState'

export default EmptyState
