import { FC, memo, ReactNode } from 'react'

export type StatsIconVariant = 'blue' | 'green' | 'yellow' | 'red' | 'purple'

interface StatsCardProps {
  /** 統計値（数値または文字列） */
  value: number | string
  /** ラベル */
  label: string
  /** アイコン（ReactNode） */
  icon?: ReactNode
  /** アイコンのカラーバリアント */
  iconVariant?: StatsIconVariant
  /** クリックハンドラ（オプション） */
  onClick?: () => void
  /** 追加のクラス名 */
  className?: string
}

/**
 * 統計カードコンポーネント
 *
 * ソリッドカラーベースで、ホバー時にサブトルなシャドウとボーダー変化を適用
 *
 * @example
 * <StatsCard
 *   value={42}
 *   label="ファイル数"
 *   icon={<FileIcon />}
 *   iconVariant="blue"
 * />
 *
 * カウントアップアニメーション（将来拡張用）:
 * - react-countup: npm install react-countup
 * - 使用例:
 *   import CountUp from 'react-countup'
 *   <CountUp end={value} duration={0.5} preserveValue />
 * - または framer-motion の animate prop を使用
 */
const StatsCard: FC<StatsCardProps> = memo(({
  value,
  label,
  icon,
  iconVariant = 'blue',
  onClick,
  className = '',
}) => {
  const isClickable = !!onClick

  const cardClasses = [
    'stats-card',
    'stats-card-glow',
    isClickable ? 'cursor-pointer' : '',
    className,
  ].filter(Boolean).join(' ')

  const iconClasses = `stats-icon stats-icon-${iconVariant}`

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick?.()
    }
  }

  return (
    <div
      className={cardClasses}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'button' : undefined}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="stats-value">
            {value}
          </div>
          <div className="stats-label">
            {label}
          </div>
        </div>
        {icon && (
          <div className={iconClasses}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
})

StatsCard.displayName = 'StatsCard'

export default StatsCard
