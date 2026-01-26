import { memo, useCallback, type FC } from 'react'
import { Icon } from '../common'

interface PinButtonProps {
  /** ピン留め状態 */
  isPinned: boolean
  /** ピン留めトグル時のコールバック */
  onToggle: () => void
  /** ボタンサイズ */
  size?: 'sm' | 'md'
  /** 追加のクラス名 */
  className?: string
}

/**
 * ピン留め/解除ボタン
 * ファイルツリーで使用し、お気に入りへの追加/削除を行う
 */
const PinButton: FC<PinButtonProps> = memo(({
  isPinned,
  onToggle,
  size = 'sm',
  className = '',
}) => {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation() // ファイル選択イベントを防止
      onToggle()
    },
    [onToggle]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        e.stopPropagation()
        onToggle()
      }
    },
    [onToggle]
  )

  const sizeClasses = size === 'sm' ? 'size-4' : 'size-5'
  const buttonSize = size === 'sm' ? 'p-0.5' : 'p-1'

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        ${buttonSize}
        rounded
        transition-all duration-150
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
        dark:focus:ring-offset-gray-800
        ${isPinned
          ? 'text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300'
          : 'text-gray-400 hover:text-yellow-500 dark:text-gray-500 dark:hover:text-yellow-400 opacity-0 group-hover:opacity-100'
        }
        ${className}
      `}
      title={isPinned ? 'お気に入りから削除' : 'お気に入りに追加'}
      aria-label={isPinned ? 'お気に入りから削除' : 'お気に入りに追加'}
      aria-pressed={isPinned}
    >
      <Icon
        name={isPinned ? 'starFilled' : 'star'}
        className={sizeClasses}
      />
    </button>
  )
})

PinButton.displayName = 'PinButton'

export default PinButton
