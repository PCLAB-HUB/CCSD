import { memo, useCallback, useId, useMemo } from 'react'
import { StatCard, type StatIconVariant } from './StatCard'
import { StatsMetaInfo } from './StatsMetaInfo'
import { Icon } from '../common'
import type { Stats } from '../../types/stats'

/**
 * 統計データの型定義（配列形式で渡す場合用）
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
  /** 統計データ（Stats型またはStatItem配列） */
  stats: Stats | StatItem[]
  /** パネルの折りたたみ状態（外部制御） */
  isCollapsed?: boolean
  /** 折りたたみ状態変更時のコールバック */
  onToggleCollapse?: () => void
  /** 最終更新日時（stats配列使用時） */
  lastUpdated?: Date | string | null
  /** 設定バージョン */
  configVersion?: string
  /** ファイルツリーのID（スキップリンク用） */
  fileTreeId?: string
  /** 読み込み中状態 */
  loading?: boolean
  /** 追加のクラス名 */
  className?: string
}

/**
 * Stats型からStatItem配列に変換するヘルパー関数
 * 各項目にユニークなアイコンを割り当て
 */
function convertStatsToItems(stats: Stats): StatItem[] {
  return [
    {
      key: 'subAgents',
      label: 'サブエージェント',
      value: stats.subAgentCount,
      unit: '個',
      iconVariant: 'agents' as StatIconVariant,  // ロボットアイコン（青）
    },
    {
      key: 'categories',
      label: 'カテゴリ',
      value: stats.categoryCount,
      unit: '個',
      iconVariant: 'categories' as StatIconVariant,  // グリッドアイコン（緑）
    },
    {
      key: 'skills',
      label: 'スキル',
      value: stats.skillCount,
      unit: '個',
      iconVariant: 'skills' as StatIconVariant,  // 稲妻アイコン（黄）
    },
    {
      key: 'mcpServers',
      label: 'MCPサーバー',
      value: stats.mcpServerCount,
      unit: '個',
      iconVariant: 'servers' as StatIconVariant,  // サーバーアイコン（紫）
    },
    {
      key: 'plugins',
      label: 'プラグイン',
      value: stats.pluginCount,
      unit: '個',
      iconVariant: 'plugins' as StatIconVariant,  // パズルアイコン（ピンク）
    },
    {
      key: 'backups',
      label: 'バックアップ',
      value: stats.backupCount,
      unit: '個',
      iconVariant: 'backups' as StatIconVariant,  // クラウドアイコン（シアン）
    },
    {
      key: 'totalFiles',
      label: '総ファイル数',
      value: stats.totalFileCount,
      unit: '個',
      iconVariant: 'files' as StatIconVariant,  // ファイルスタックアイコン（オレンジ）
    },
  ]
}

/**
 * Stats型かStatItem配列かを判定する型ガード
 */
function isStatsType(stats: Stats | StatItem[]): stats is Stats {
  return 'subAgentCount' in stats
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
  isCollapsed = false,
  onToggleCollapse,
  lastUpdated: propLastUpdated,
  configVersion,
  fileTreeId = 'file-tree',
  loading = false,
  className = '',
}) => {
  // Stats型の場合は変換、配列の場合はそのまま使用
  const { statItems, lastUpdated } = useMemo(() => {
    if (isStatsType(stats)) {
      return {
        statItems: convertStatsToItems(stats),
        lastUpdated: stats.lastUpdated ?? propLastUpdated,
      }
    }
    return {
      statItems: stats,
      lastUpdated: propLastUpdated,
    }
  }, [stats, propLastUpdated])

  // 折りたたみ機能が有効かどうか
  const collapsible = !!onToggleCollapse
  const isExpanded = !isCollapsed

  // ユニークIDを生成
  const panelId = useId()
  const contentId = `${panelId}-content`
  const headerId = `${panelId}-header`

  // キーボード操作ハンドラ
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (collapsible && onToggleCollapse && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onToggleCollapse()
    }
  }, [collapsible, onToggleCollapse])

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
        onClick={collapsible ? onToggleCollapse : undefined}
        onKeyDown={collapsible ? handleKeyDown : undefined}
        aria-expanded={collapsible ? isExpanded : undefined}
        aria-controls={collapsible ? contentId : undefined}
        className={`
          flex items-center justify-between
          px-3 py-2
          bg-gray-100 dark:bg-gray-800
          border-b border-gray-200 dark:border-gray-700
          ${collapsible ? 'cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700' : ''}
          ${collapsible ? 'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500' : ''}
        `}
      >
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Icon name="diff" className="size-4" />
          統計情報
        </h2>

        {/* 折りたたみインジケーター */}
        {collapsible && (
          <div
            className="transition-transform duration-200"
            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            aria-hidden="true"
          >
            <Icon name="chevronDown" className="size-4 text-gray-500 dark:text-gray-400" />
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
              <Icon name="spinner" className="size-6 animate-spin text-gray-400" />
              <span className="sr-only">統計情報を読み込み中...</span>
            </div>
          ) : (
            <>
              {/* 統計カードグリッド - 定義リスト構造 */}
              <dl className="grid grid-cols-2 gap-2">
                {statItems.map((stat) => (
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
