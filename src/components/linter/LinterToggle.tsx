import { FC, memo, useCallback } from 'react'
import { Icon } from '../common'

interface LinterToggleProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
  label?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

/**
 * リンターのON/OFFを切り替えるトグルスイッチ
 * アクセシビリティに配慮した実装
 */
const LinterToggle: FC<LinterToggleProps> = memo(({
  enabled,
  onToggle,
  label = 'リンター',
  disabled = false,
  size = 'md',
}) => {
  const handleToggle = useCallback(() => {
    if (!disabled) {
      onToggle(!enabled)
    }
  }, [disabled, enabled, onToggle])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault()
      onToggle(!enabled)
    }
  }, [disabled, enabled, onToggle])

  // サイズに応じたスタイル
  const sizeStyles = {
    sm: {
      toggle: 'w-8 h-4',
      circle: 'size-3',
      translate: 'translate-x-4',
      icon: 'size-3',
      text: 'text-xs',
      gap: 'gap-1.5',
    },
    md: {
      toggle: 'w-10 h-5',
      circle: 'size-4',
      translate: 'translate-x-5',
      icon: 'size-4',
      text: 'text-sm',
      gap: 'gap-2',
    },
    lg: {
      toggle: 'w-12 h-6',
      circle: 'size-5',
      translate: 'translate-x-6',
      icon: 'size-5',
      text: 'text-base',
      gap: 'gap-2.5',
    },
  }

  const styles = sizeStyles[size]

  return (
    <div className={`flex items-center ${styles.gap}`}>
      {/* アイコン */}
      <Icon
        name="check"
        className={`${styles.icon} ${enabled ? 'text-green-500' : 'text-gray-400 dark:text-gray-500'}`}
      />

      {/* ラベル */}
      <span
        className={`${styles.text} font-medium ${
          disabled
            ? 'text-gray-400 dark:text-gray-500'
            : 'text-gray-700 dark:text-gray-300'
        }`}
      >
        {label}
      </span>

      {/* トグルスイッチ */}
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={`${label}を${enabled ? '無効' : '有効'}にする`}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`
          relative inline-flex flex-shrink-0
          ${styles.toggle}
          rounded-full cursor-pointer
          transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          dark:focus:ring-offset-gray-900
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${enabled
            ? 'bg-green-500 dark:bg-green-600'
            : 'bg-gray-300 dark:bg-gray-600'
          }
        `}
      >
        <span className="sr-only">{label}を切り替え</span>
        <span
          aria-hidden="true"
          className={`
            pointer-events-none inline-block
            ${styles.circle}
            rounded-full bg-white shadow
            transform ring-0 transition duration-200 ease-in-out
            ${enabled ? styles.translate : 'translate-x-0.5'}
          `}
        />
      </button>

      {/* 状態テキスト */}
      <span
        className={`${styles.text} ${
          enabled
            ? 'text-green-600 dark:text-green-400'
            : 'text-gray-500 dark:text-gray-400'
        }`}
        aria-hidden="true"
      >
        {enabled ? 'ON' : 'OFF'}
      </span>
    </div>
  )
})

LinterToggle.displayName = 'LinterToggle'

export default LinterToggle
