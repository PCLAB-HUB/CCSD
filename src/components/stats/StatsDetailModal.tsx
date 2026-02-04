import { memo, useCallback, useMemo, useState, type FC } from 'react'

import { Icon, Modal } from '../common'
import { StatsDetailListItem } from './StatsDetailListItem'

import type { StatIconVariant } from './StatCard'
import type { StatsDetail, StatsDetailItem, StatsDetailType, STATS_TYPE_INFO } from '../../types/stats'

interface StatsDetailModalProps {
  /** モーダルの開閉状態 */
  isOpen: boolean
  /** 閉じるコールバック */
  onClose: () => void
  /** 表示する統計タイプ */
  detailType: StatsDetailType | null
  /** 詳細データ */
  detail: StatsDetail | null
  /** 読み込み中状態 */
  loading: boolean
  /** エラーメッセージ */
  error: string | null
  /** アイテムクリック時のコールバック（ファイルを開く等） */
  onItemClick?: (item: StatsDetailItem) => void
  /** 統計タイプ情報（オプション、デフォルト値あり） */
  statsTypeInfo?: typeof STATS_TYPE_INFO
}

/**
 * 統計タイプに対応するアイコンを返すヘルパー
 */
const StatDetailIcon = memo<{ variant: StatIconVariant }>(({ variant }) => {
  switch (variant) {
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

StatDetailIcon.displayName = 'StatDetailIcon'

/**
 * デフォルトの統計タイプ情報
 */
const DEFAULT_STATS_TYPE_INFO: Record<StatsDetailType, { label: string; icon: StatIconVariant; description: string }> = {
  skills: {
    label: 'スキル一覧',
    icon: 'skills',
    description: 'インストールされているスキル一覧',
  },
  subAgents: {
    label: 'サブエージェント一覧',
    icon: 'agents',
    description: 'カテゴリ別のサブエージェント一覧',
  },
  categories: {
    label: 'カテゴリ一覧',
    icon: 'categories',
    description: 'エージェントのカテゴリ一覧',
  },
  mcpServers: {
    label: 'MCPサーバー一覧',
    icon: 'servers',
    description: '設定されているMCPサーバー一覧',
  },
  plugins: {
    label: 'プラグイン一覧',
    icon: 'plugins',
    description: 'インストールされているプラグイン一覧',
  },
  backups: {
    label: 'バックアップ一覧',
    icon: 'backups',
    description: '保存されているバックアップ一覧',
  },
  totalFiles: {
    label: 'ファイル一覧',
    icon: 'files',
    description: '管理対象のファイル一覧',
  },
}

/**
 * StatsDetailModal - 統計詳細を表示するモーダルコンポーネント
 *
 * アクセシビリティ機能:
 * - role="dialog" と aria-modal="true"
 * - aria-labelledby でタイトルと関連付け
 * - フォーカストラップ（Modalコンポーネントで実装）
 * - ESCキーで閉じる
 * - オーバーレイクリックで閉じる
 */
export const StatsDetailModal: FC<StatsDetailModalProps> = memo(({
  isOpen,
  onClose,
  detailType,
  detail,
  loading,
  error,
  onItemClick,
}) => {
  // 検索フィルター状態
  const [searchQuery, setSearchQuery] = useState('')

  // 検索クエリが変わった時にリセット
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }, [])

  // モーダルを閉じる時に検索をリセット
  const handleClose = useCallback(() => {
    setSearchQuery('')
    onClose()
  }, [onClose])

  // 統計タイプ情報の取得
  const typeInfo = useMemo(() => {
    if (!detailType) return null
    return DEFAULT_STATS_TYPE_INFO[detailType]
  }, [detailType])

  // フィルタリングされたアイテム
  const filteredItems = useMemo(() => {
    if (!detail?.items) return []
    if (!searchQuery.trim()) return detail.items

    const query = searchQuery.toLowerCase()
    return detail.items.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.path?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query)
    )
  }, [detail?.items, searchQuery])

  // アイテムクリックハンドラ
  const handleItemClick = useCallback((item: StatsDetailItem) => {
    if (onItemClick) {
      onItemClick(item)
    }
  }, [onItemClick])

  // ヘッダーアイコン
  const headerIcon = useMemo(() => {
    if (!typeInfo) return null
    return (
      <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
        <StatDetailIcon variant={typeInfo.icon} />
      </div>
    )
  }, [typeInfo])

  // フッター
  const footer = useMemo(() => (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {loading ? (
          '読み込み中...'
        ) : error ? (
          ''
        ) : detail ? (
          searchQuery ? (
            `${filteredItems.length}件中${filteredItems.length}件を表示（${detail.totalCount}件中）`
          ) : (
            `${detail.totalCount}件を表示`
          )
        ) : (
          ''
        )}
      </span>
      <button
        onClick={handleClose}
        className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        閉じる
      </button>
    </div>
  ), [loading, error, detail, searchQuery, filteredItems.length, handleClose])

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={typeInfo?.label ?? '詳細'}
      subtitle={typeInfo?.description}
      icon={headerIcon}
      size="md"
      footer={footer}
      contentClassName="p-0"
    >
      <div className="flex flex-col h-full max-h-[60vh]">
        {/* 検索バー */}
        {!loading && !error && detail && detail.items.length > 0 && (
          <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="relative">
              <Icon
                name="search"
                className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="検索..."
                className="
                  w-full pl-10 pr-4 py-2
                  text-sm
                  bg-white dark:bg-gray-700
                  border border-gray-300 dark:border-gray-600
                  rounded-md
                  text-gray-900 dark:text-gray-100
                  placeholder-gray-500 dark:placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                "
                aria-label="アイテムを検索"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  aria-label="検索をクリア"
                >
                  <Icon name="close" className="size-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            // ローディング状態
            <div
              className="flex flex-col items-center justify-center py-12"
              role="status"
              aria-label="データを読み込み中"
            >
              <Icon name="spinner" className="size-8 animate-spin text-blue-500" />
              <span className="mt-3 text-gray-500 dark:text-gray-400">読み込み中...</span>
            </div>
          ) : error ? (
            // エラー状態
            <div className="flex flex-col items-center justify-center py-12">
              <Icon name="error" className="size-16 text-red-400 dark:text-red-500 mb-4" />
              <p className="text-red-500 dark:text-red-400 text-center">{error}</p>
            </div>
          ) : !detail || detail.items.length === 0 ? (
            // 空状態
            <div className="flex flex-col items-center justify-center py-12">
              <Icon name="archive" className="size-16 text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {typeInfo?.label ?? 'アイテム'}がありません
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            // 検索結果なし
            <div className="flex flex-col items-center justify-center py-12">
              <Icon name="search" className="size-16 text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                「{searchQuery}」に一致するアイテムがありません
              </p>
            </div>
          ) : (
            // アイテムリスト
            <div className="space-y-3" role="list" aria-label={`${typeInfo?.label ?? 'アイテム'}のリスト`}>
              {filteredItems.map((item) => (
                <StatsDetailListItem
                  key={item.id}
                  item={item}
                  onClick={onItemClick ? () => handleItemClick(item) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
})

StatsDetailModal.displayName = 'StatsDetailModal'
