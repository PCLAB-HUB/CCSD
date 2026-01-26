import { memo, useId } from 'react'

/**
 * 統計カードのアイコンタイプ
 * 色だけでなくパターン/形状で区別するためのバリアント
 */
export type StatIconVariant =
  | 'agents'      // サブエージェント - ロボットアイコン
  | 'categories'  // カテゴリ - フォルダグリッドアイコン
  | 'skills'      // スキル - 稲妻アイコン
  | 'servers'     // MCPサーバー - サーバーアイコン
  | 'plugins'     // プラグイン - パズルピースアイコン
  | 'backups'     // バックアップ - クラウドアイコン
  | 'files'       // 総ファイル数 - ファイルスタックアイコン
  | 'custom'

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
    // サブエージェント - ロボット/人型アイコン（青）
    case 'agents':
      return (
        <svg
          className="size-5 text-blue-600 dark:text-blue-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <rect x="3" y="11" width="18" height="10" rx="2" />
          <circle cx="12" cy="5" r="3" />
          <path d="M8 15h.01M16 15h.01" />
          <path d="M9 18h6" />
        </svg>
      )
    // カテゴリ - フォルダグリッドアイコン（緑）
    case 'categories':
      return (
        <svg
          className="size-5 text-green-600 dark:text-green-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      )
    // スキル - 稲妻アイコン（黄）
    case 'skills':
      return (
        <svg
          className="size-5 text-yellow-600 dark:text-yellow-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      )
    // MCPサーバー - サーバーアイコン（紫）
    case 'servers':
      return (
        <svg
          className="size-5 text-purple-600 dark:text-purple-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <rect x="2" y="2" width="20" height="8" rx="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" />
          <circle cx="6" cy="6" r="1" fill="currentColor" />
          <circle cx="6" cy="18" r="1" fill="currentColor" />
          <line x1="10" y1="6" x2="18" y2="6" />
          <line x1="10" y1="18" x2="18" y2="18" />
        </svg>
      )
    // プラグイン - パズルピースアイコン（ピンク）
    case 'plugins':
      return (
        <svg
          className="size-5 text-pink-600 dark:text-pink-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.077.877.528 1.073 1.01a2.5 2.5 0 1 0 3.259-3.259c-.482-.196-.933-.558-1.01-1.073-.05-.336.062-.676.303-.917l1.525-1.525A2.402 2.402 0 0 1 12 1.998c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z" />
        </svg>
      )
    // バックアップ - クラウドアップロードアイコン（シアン）
    case 'backups':
      return (
        <svg
          className="size-5 text-cyan-600 dark:text-cyan-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
          <polyline points="12 12 12 16" />
          <polyline points="9 14 12 11 15 14" />
        </svg>
      )
    // 総ファイル数 - ファイルスタックアイコン（オレンジ）
    case 'files':
      return (
        <svg
          className="size-5 text-orange-600 dark:text-orange-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
          <path d="M14 2v4a2 2 0 0 0 2 2h4" />
          <path d="M10 9H8" />
          <path d="M16 13H8" />
          <path d="M16 17H8" />
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
    ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700'
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
            className="size-4 text-gray-400"
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
