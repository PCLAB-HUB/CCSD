import { FC, memo, useCallback, KeyboardEvent } from 'react'
import type { Stats } from '../../types/stats'
import StatCard from './StatCard'
import StatsMetaInfo from './StatsMetaInfo'

interface StatsPanelProps {
  /** 統計データ */
  stats: Stats
  /** 折りたたみ状態 */
  isCollapsed: boolean
  /** 折りたたみトグルハンドラ */
  onToggleCollapse: () => void
}

/**
 * 統計パネルコンポーネント
 *
 * ヘッダー下に表示される折りたたみ可能な統計概要パネル。
 * サブエージェント、スキル、MCPサーバー、プラグインの件数と
 * システム情報を表示する。
 *
 * @example
 * ```tsx
 * <StatsPanel
 *   stats={statsData}
 *   isCollapsed={isPanelCollapsed}
 *   onToggleCollapse={handleToggle}
 * />
 * ```
 */
const StatsPanel: FC<StatsPanelProps> = memo(({
  stats,
  isCollapsed,
  onToggleCollapse,
}) => {
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggleCollapse()
    }
  }, [onToggleCollapse])

  return (
    <section
      aria-label="設定統計"
      className="border-b border-gray-200 dark:border-gray-700"
    >
      {/* パネルヘッダー（折りたたみボタン） */}
      <button
        type="button"
        onClick={onToggleCollapse}
        onKeyDown={handleKeyDown}
        aria-expanded={!isCollapsed}
        aria-controls="stats-panel-content"
        className="
          w-full flex items-center justify-between px-4 py-2
          bg-gray-50 dark:bg-gray-800/50
          hover:bg-gray-100 dark:hover:bg-gray-800
          transition-colors cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500
        "
      >
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          設定概要
        </span>
        <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <span className="text-xs">
            {isCollapsed ? '展開' : '折畳'}
          </span>
          {/* ChevronDown / ChevronUp アイコン */}
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${
              isCollapsed ? '' : 'rotate-180'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </button>

      {/* パネルコンテンツ（折りたたみ対象） */}
      <div
        id="stats-panel-content"
        className={`
          transition-all duration-300 ease-in-out overflow-hidden
          ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'}
        `}
      >
        <div className="p-4 bg-white dark:bg-gray-900">
          {/* メイン統計カード（グリッドレイアウト） */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
            <StatCard
              label="サブエージェント"
              value={stats.subAgentCount}
              subInfo={stats.categoryCount > 0 ? `${stats.categoryCount} カテゴリ` : undefined}
            />
            <StatCard
              label="スキル"
              value={stats.skillCount}
            />
            <StatCard
              label="MCPサーバー"
              value={stats.mcpServerCount}
            />
            <StatCard
              label="プラグイン"
              value={stats.pluginCount}
            />
          </div>

          {/* システム情報 */}
          <StatsMetaInfo
            backupCount={stats.backupCount}
            totalFiles={stats.totalFileCount}
            lastUpdated={stats.lastUpdated}
          />
        </div>
      </div>
    </section>
  )
})

StatsPanel.displayName = 'StatsPanel'

export default StatsPanel
