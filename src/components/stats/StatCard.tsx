import { memo, useId } from 'react'

/**
 * 統計カードのアイコンタイプ
 * 色だけでなくパターン/形状で区別するためのバリアント
 */
export type StatIconVariant = 'files' | 'lines' | 'size' | 'warnings' | 'errors' | 'custom'

interface StatCardProps {
  /** 統計項目のラベル（例：「総ファイル数」） */
  label: string
  /** 統計値（例：「42」） */
  value: string | number
  /** 統計値の単位（例：「個」「行」「KB」） */
  unit?: string
  /** アイコンのバリアント（形状で区別） */
  iconVariant?: StatIconVariant
  /** カスタムアイコン（iconVariant='custom'の場合使用） */
  customIcon?: React.ReactNode
  /** 追加のクラス名 */
  className?: string
  /** クリック時のコールバック（詳細表示用） */
  onClick?: () => void
  /** 展開状態（折りたたみ機能がある場合） */
  isExpanded?: boolean
  /** 関連するセクションのID（aria-controls用） */
  controlsId?: string
}

/**
 * アイコンを形状とパターンで区別するコンポーネント
 * WCAG 1.4.1: 色だけに依存しない情報伝達
 */
const StatIcon = memo<{ variant: StatIconVariant }>(({ variant }) => {
  switch (variant) {
    case 'files':
      return (
        <svg
          className="w-5 h-5 text-blue-600 dark:text-blue-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      )
    case 'lines':
      return (
        <svg
          className="w-5 h-5 text-green-600 dark:text-green-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="10" x2="16" y2="10" />
          <line x1="4" y1="14" x2="18" y2="14" />
          <line x1="4" y1="18" x2="12" y2="18" />
        </svg>
      )
    case 'size':
      return (
        <svg
          className="w-5 h-5 text-purple-600 dark:text-purple-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      )
    case 'warnings':
      return (
        <svg
          className="w-5 h-5 text-yellow-600 dark:text-yellow-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <circle cx="12" cy="17" r="0.5" fill="currentColor" />
        </svg>
      )
    case 'errors':
      return (
        <svg
          className="w-5 h-5 text-red-600 dark:text-red-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      )
    default:
      return null
  }
})

StatIcon.displayName = 'StatIcon'

/**
 * StatCard - 個別の統計カードコンポーネント
 *
 * アクセシビリティ機能:
 * - tabIndex={0} でキーボードフォーカス可能
 * - focus:ring-2 で視覚的フィードバック
 * - aria-expanded/aria-controls で折りたたみ状態を伝達
 * - 色だけでなく形状でアイコンを区別
 * - WCAG AA準拠のコントラスト比
 */
export const StatCard = memo<StatCardProps>(({
  label,
  value,
  unit,
  iconVariant = 'files',
  customIcon,
  className = '',
  onClick,
  isExpanded,
  controlsId,
}) => {
  const labelId = useId()
  const valueId = useId()

  const hasClickHandler = !!onClick
  const hasExpandState = typeof isExpanded === 'boolean'

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick()
    }
  }

  const interactiveClasses = hasClickHandler
    ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750'
    : ''

  return (
    <div
      role={hasClickHandler ? 'button' : undefined}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-expanded={hasExpandState ? isExpanded : undefined}
      aria-controls={controlsId}
      aria-labelledby={labelId}
      aria-describedby={valueId}
      className={[
        'group',
        'flex items-center gap-3 p-3',
        'bg-white dark:bg-gray-800',
        'border border-gray-200 dark:border-gray-700',
        'rounded-lg',
        'transition-all duration-200',
        interactiveClasses,
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'dark:focus:ring-offset-gray-900',
        className,
      ].filter(Boolean).join(' ')}
    >
      <div
        className="flex-shrink-0 p-2 rounded-lg bg-gray-100 dark:bg-gray-700"
        aria-hidden="true"
      >
        {customIcon ?? <StatIcon variant={iconVariant} />}
      </div>

      <div className="flex-1 min-w-0">
        <dt
          id={labelId}
          className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide truncate"
        >
          {label}
        </dt>
        <dd
          id={valueId}
          className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100 tabular-nums"
        >
          {value}
          {unit && (
            <span className="ml-1 text-sm font-normal text-gray-500 dark:text-gray-400">
              {unit}
            </span>
          )}
        </dd>
      </div>

      {hasExpandState && (
        <div
          className="flex-shrink-0 transition-transform duration-200"
          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          aria-hidden="true"
        >
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      )}
    </div>
  )
})

StatCard.displayName = 'StatCard'
