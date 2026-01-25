import { memo, useState, useCallback, useId } from 'react'
import { StatCard, type StatIconVariant } from './StatCard'
import { StatsMetaInfo } from './StatsMetaInfo'

/**
 * 統計データの型定義
 */
export interface StatItem {
  /** 統計項目のキー（一意） */
  key: string
  /** 表示ラベル */
  label: string
  /** 統計値 */
  value: string | number
  /** 単位 */
  unit?: string
  /** アイコンバリアント */
  iconVariant?: StatIconVariant
  /** クリック時の詳細表示用コールバック */
  onClick?: () => void
}

interface StatsPanelProps {
  /** 統計データの配列 */
  stats: StatItem[]
  /** 最終更新日時 */
  lastUpdated?: Date | string | null
  /** 設定バージョン */
  configVersion?: string
  /** パネルの折りたたみ可否 */
  collapsible?: boolean
  /** 初期の展開状態 */
  defaultExpanded?: boolean
  /** ファイルツリーのID（スキップリンク用） */
  fileTreeId?: string
  /** 読み込み中状態 */
  loading?: boolean
  /** 追加のクラス名 */
  className?: string
}

/**
 * StatsPanel - 統計情報を表示するパネルコンポーネント
 *
 * アクセシビリティ機能:
 * 1. セマンティックHTML: <section aria-label> でランドマーク化
 * 2. スキップリンク: 統計セクションをスキップしてファイルツリーへ
 * 3. フォーカス管理: Tab キーで各統計カードにフォーカス可能
 * 4. 色に依存しない情報伝達: アイコンの形状で区別
 * 5. コントラスト比: WCAG AA準拠（4.5:1以上）
 * 6. aria属性: expanded, controls, role
 */
export const StatsPanel = memo<StatsPanelProps>(({
  stats,
  lastUpdated,
  configVersion,
  collapsible = false,
  defaultExpanded = true,
  fileTreeId = 'file-tree',
  loading = false,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  // ユニークIDを生成
  const panelId = useId()
  const contentId = `${panelId}-content`
  const headerId = `${panelId}-header`

  // 折りたたみトグル
  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev)
  }, [])

  // キーボード操作ハンドラ
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (collapsible && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      toggleExpanded()
    }
  }, [collapsible, toggleExpanded])

  return (
    <section
      aria-label="設定統計"
      aria-labelledby={headerId}
      className={`relative ${className}`}
    >
      {/* スキップリンク - フォーカス時のみ表示 */}
      <a
        href={`#${fileTreeId}`}
        className="
          sr-only focus:not-sr-only
          focus:absolute focus:top-0 focus:left-0 focus:z-50
          focus:px-4 focus:py-2
          focus:bg-blue-600 focus:text-white
          focus:rounded focus:shadow-lg
          focus:outline-none focus:ring-2 focus:ring-blue-400
        "
      >
        統計をスキップ
      </a>

      {/* ヘッダー */}
      <div
        id={headerId}
        role={collapsible ? 'button' : undefined}
        tabIndex={collapsible ? 0 : undefined}
        onClick={collapsible ? toggleExpanded : undefined}
        onKeyDown={collapsible ? handleKeyDown : undefined}
        aria-expanded={collapsible ? isExpanded : undefined}
        aria-controls={collapsible ? contentId : undefined}
        className={`
          flex items-center justify-between
          px-3 py-2
          bg-gray-100 dark:bg-gray-800
          border-b border-gray-200 dark:border-gray-700
          ${collapsible ? 'cursor-pointer hover:bg-gray-150 dark:hover:bg-gray-750' : ''}
          ${collapsible ? 'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500' : ''}
        `}
      >
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          {/* 統計アイコン */}
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          統計情報
        </h2>

        {/* 折りたたみインジケーター */}
        {collapsible && (
          <div
            className="transition-transform duration-200"
            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            aria-hidden="true"
          >
            <svg
              className="w-4 h-4 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        )}
      </div>

      {/* コンテンツ領域 */}
      <div
        id={contentId}
        role="region"
        aria-hidden={collapsible && !isExpanded}
        className={`
          transition-all duration-300 ease-in-out
          ${collapsible && !isExpanded ? 'max-h-0 overflow-hidden opacity-0' : 'max-h-[500px] opacity-100'}
        `}
      >
        <div className="p-3 space-y-3">
          {/* ローディング状態 */}
          {loading ? (
            <div
              className="flex items-center justify-center py-8"
              role="status"
              aria-label="統計情報を読み込み中"
            >
              <svg
                className="w-6 h-6 animate-spin text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span className="sr-only">統計情報を読み込み中...</span>
            </div>
          ) : (
            <>
              {/* 統計カードグリッド - 定義リスト構造 */}
              <dl className="grid grid-cols-2 gap-2">
                {stats.map((stat) => (
                  <StatCard
                    key={stat.key}
                    label={stat.label}
                    value={stat.value}
                    unit={stat.unit}
                    iconVariant={stat.iconVariant}
                    onClick={stat.onClick}
                  />
                ))}
              </dl>

              {/* メタ情報 */}
              <StatsMetaInfo
                lastUpdated={lastUpdated}
                configVersion={configVersion}
                className="pt-2 border-t border-gray-200 dark:border-gray-700"
              />
            </>
          )}
        </div>
      </div>
    </section>
  )
})

StatsPanel.displayName = 'StatsPanel'
