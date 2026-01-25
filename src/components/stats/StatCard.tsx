import { FC, ReactNode, KeyboardEvent, memo } from 'react'

export interface StatCardProps {
  /** カード名（ラベル） */
  label: string
  /** 統計値 */
  value: number
  /** サブ情報（例: "10 カテゴリ"） */
  subInfo?: string
  /** オプショナルアイコン */
  icon?: ReactNode
  /** クリックハンドラ（将来のナビゲーション用） */
  onClick?: () => void
  /** 追加のクラス名 */
  className?: string
}

/**
 * 統計カードコンポーネント
 *
 * 個別の統計値を表示するカード。
 * アクセシビリティに配慮した dl/dt/dd 構造を使用。
 * ソリッドカラーベースで、ホバー時にサブトルなシャドウとボーダー変化を適用。
 *
 * @example
 * ```tsx
 * <StatCard
 *   label="サブエージェント"
 *   value={137}
 *   subInfo="10 カテゴリ"
 *   icon={<AgentIcon />}
 *   onClick={() => navigate('/agents')}
 * />
 * ```
 *
 * カウントアップアニメーション（将来拡張用）:
 * - react-countup: npm install react-countup
 * - 使用例:
 *   import CountUp from 'react-countup'
 *   <CountUp end={value} duration={0.5} preserveValue />
 * - または framer-motion の animate prop を使用
 */
const StatCard: FC<StatCardProps> = memo(({
  label,
  value,
  subInfo,
  icon,
  onClick,
  className = '',
}) => {
  const isClickable = !!onClick

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick()
    }
  }

  // stats-card クラスを使用してglobals.cssのスタイルを適用
  // ホバー時: shadow-md, border-blue-400/500, scale(1.01)
  // フォーカス時: ring-2 ring-blue-500 ring-offset-2
  const cardClasses = [
    'stats-card',
    'stats-card-glow',
    isClickable ? 'cursor-pointer' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      aria-label={`${label}: ${value.toLocaleString()}${subInfo ? `, ${subInfo}` : ''}`}
      className={cardClasses}
    >
      <dl className="flex flex-col gap-1">
        {/* ラベル（上部） */}
        <dt className="stats-label flex items-center gap-2">
          {icon && (
            <span className="flex-shrink-0" aria-hidden="true">
              {icon}
            </span>
          )}
          <span>{label}</span>
        </dt>

        {/* 数値（大きく） */}
        <dd className="stats-value">
          {value.toLocaleString()}
        </dd>

        {/* サブ情報（小さく、オプション） */}
        {subInfo && (
          <dd className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {subInfo}
          </dd>
        )}
      </dl>
    </div>
  )
})

export { StatCard }
export default StatCard
