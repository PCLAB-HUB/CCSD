import { memo, useCallback, useMemo, useState, type FC } from 'react'

import { Icon } from '../common'
import LintMessage, { lintSeverityStyles, type LintMessageData } from './LintMessage'
import LinterToggle from './LinterToggle'

import type { ValidationSeverity } from '../../types'

/** フィルターオプション */
export type LintFilterOption = 'all' | ValidationSeverity

/** ソートオプション */
export type LintSortOption = 'severity' | 'line' | 'source'

/** エラーカウント */
export interface LintCounts {
  error: number
  warning: number
  info: number
  total: number
}

interface LinterPanelProps {
  /** リントメッセージの配列 */
  messages: LintMessageData[]
  /** リンターの有効/無効状態 */
  enabled: boolean
  /** リンター有効/無効の切り替えハンドラ */
  onToggleEnabled: (enabled: boolean) => void
  /** 行ジャンプハンドラ */
  onGoToLine: (line: number, column: number) => void
  /** 修正適用ハンドラ */
  onApplyFix?: (data: LintMessageData) => void
  /** 全ての修正を適用するハンドラ */
  onApplyAllFixes?: () => void
  /** パネルのタイトル */
  title?: string
  /** 初期展開状態 */
  defaultExpanded?: boolean
  /** 最大高さ */
  maxHeight?: string
  /** コンパクト表示 */
  compact?: boolean
}

/**
 * リンター結果パネル
 * フィルタリング、ソート、折りたたみ機能を持つ拡張版Problems Panel
 */
const LinterPanel: FC<LinterPanelProps> = memo(({
  messages,
  enabled,
  onToggleEnabled,
  onGoToLine,
  onApplyFix,
  onApplyAllFixes,
  title = 'リンター',
  defaultExpanded = true,
  maxHeight = 'max-h-64',
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [filter, setFilter] = useState<LintFilterOption>('all')
  const [sortBy, setSortBy] = useState<LintSortOption>('severity')
  const [showFilters, setShowFilters] = useState(false)

  // エラーカウントを計算
  const counts = useMemo<LintCounts>(() => {
    const result = { error: 0, warning: 0, info: 0, total: 0 }
    messages.forEach(msg => {
      result[msg.severity]++
      result.total++
    })
    return result
  }, [messages])

  // フィルター適用
  const filteredMessages = useMemo(() => {
    if (filter === 'all') return messages
    return messages.filter(msg => msg.severity === filter)
  }, [messages, filter])

  // ソート適用
  const sortedMessages = useMemo(() => {
    const sorted = [...filteredMessages]
    switch (sortBy) {
      case 'severity':
        const severityOrder: Record<ValidationSeverity, number> = { error: 0, warning: 1, info: 2 }
        sorted.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
        break
      case 'line':
        sorted.sort((a, b) => a.line - b.line || a.column - b.column)
        break
      case 'source':
        sorted.sort((a, b) => a.source.localeCompare(b.source))
        break
    }
    return sorted
  }, [filteredMessages, sortBy])

  // 修正可能なメッセージ数
  const fixableCount = useMemo(() => {
    return messages.filter(msg => msg.fix).length
  }, [messages])

  const handleToggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev)
  }, [])

  const handleToggleFilters = useCallback(() => {
    setShowFilters(prev => !prev)
  }, [])

  const handleFilterChange = useCallback((newFilter: LintFilterOption) => {
    setFilter(newFilter)
  }, [])

  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as LintSortOption)
  }, [])

  // パネルが空の場合（かつ有効な場合）
  if (enabled && messages.length === 0) {
    return (
      <div className="border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
              問題なし
            </span>
          </div>
          <LinterToggle
            enabled={enabled}
            onToggle={onToggleEnabled}
            label=""
            size="sm"
          />
        </div>
      </div>
    )
  }

  // リンターが無効な場合
  if (!enabled) {
    return (
      <div className="border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
              無効
            </span>
          </div>
          <LinterToggle
            enabled={enabled}
            onToggle={onToggleEnabled}
            label=""
            size="sm"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700">
      {/* パネルヘッダー */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800">
        {/* 左側: タイトルとカウント */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleExpand}
            className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-expanded={isExpanded}
            aria-controls="linter-messages"
          >
            <Icon
              name="chevronDown"
              className={`size-4 text-gray-600 dark:text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</span>
          </button>

          {/* カウントバッジ */}
          <div className="flex items-center gap-1.5">
            {counts.error > 0 && (
              <button
                type="button"
                onClick={() => handleFilterChange(filter === 'error' ? 'all' : 'error')}
                className={`px-2 py-0.5 text-xs rounded-full transition-all ${
                  filter === 'error'
                    ? 'ring-2 ring-red-500 ' + lintSeverityStyles.error.badge
                    : lintSeverityStyles.error.badge + ' opacity-80 hover:opacity-100'
                }`}
                title="エラーでフィルター"
              >
                {counts.error}
              </button>
            )}
            {counts.warning > 0 && (
              <button
                type="button"
                onClick={() => handleFilterChange(filter === 'warning' ? 'all' : 'warning')}
                className={`px-2 py-0.5 text-xs rounded-full transition-all ${
                  filter === 'warning'
                    ? 'ring-2 ring-yellow-500 ' + lintSeverityStyles.warning.badge
                    : lintSeverityStyles.warning.badge + ' opacity-80 hover:opacity-100'
                }`}
                title="警告でフィルター"
              >
                {counts.warning}
              </button>
            )}
            {counts.info > 0 && (
              <button
                type="button"
                onClick={() => handleFilterChange(filter === 'info' ? 'all' : 'info')}
                className={`px-2 py-0.5 text-xs rounded-full transition-all ${
                  filter === 'info'
                    ? 'ring-2 ring-blue-500 ' + lintSeverityStyles.info.badge
                    : lintSeverityStyles.info.badge + ' opacity-80 hover:opacity-100'
                }`}
                title="情報でフィルター"
              >
                {counts.info}
              </button>
            )}
            {filter !== 'all' && (
              <button
                type="button"
                onClick={() => handleFilterChange('all')}
                className="px-1.5 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                title="フィルターをクリア"
              >
                <Icon name="close" className="size-3" />
              </button>
            )}
          </div>
        </div>

        {/* 右側: コントロール */}
        <div className="flex items-center gap-2">
          {/* 全て修正ボタン */}
          {fixableCount > 0 && onApplyAllFixes && (
            <button
              type="button"
              onClick={onApplyAllFixes}
              className="px-2 py-1 text-xs font-medium rounded
                bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300
                hover:bg-green-200 dark:hover:bg-green-900/70
                focus:outline-none focus:ring-2 focus:ring-green-500
                transition-colors"
              title={`${fixableCount}件の修正を全て適用`}
            >
              全て修正 ({fixableCount})
            </button>
          )}

          {/* フィルター/ソートボタン */}
          <button
            type="button"
            onClick={handleToggleFilters}
            className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
              showFilters ? 'bg-gray-200 dark:bg-gray-700' : ''
            }`}
            title="フィルター/ソート設定"
            aria-expanded={showFilters}
          >
            <Icon name="settings" className="size-4 text-gray-600 dark:text-gray-400" />
          </button>

          {/* トグル */}
          <LinterToggle
            enabled={enabled}
            onToggle={onToggleEnabled}
            label=""
            size="sm"
          />
        </div>
      </div>

      {/* フィルター/ソートパネル */}
      {showFilters && isExpanded && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4">
          {/* ソート */}
          <div className="flex items-center gap-2">
            <label htmlFor="lint-sort" className="text-xs text-gray-600 dark:text-gray-400">
              並び替え:
            </label>
            <select
              id="lint-sort"
              value={sortBy}
              onChange={handleSortChange}
              className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600
                bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300
                focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="severity">重大度</option>
              <option value="line">行番号</option>
              <option value="source">ソース</option>
            </select>
          </div>

          {/* フィルター状態表示 */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {filter !== 'all' && (
              <span>
                フィルター: {filter === 'error' ? 'エラーのみ' : filter === 'warning' ? '警告のみ' : '情報のみ'}
                ({sortedMessages.length}/{counts.total}件)
              </span>
            )}
          </div>
        </div>
      )}

      {/* メッセージリスト */}
      {isExpanded && (
        <div
          id="linter-messages"
          role="list"
          aria-label="リント結果一覧"
          className={`${maxHeight} overflow-y-auto bg-white dark:bg-gray-900`}
        >
          {sortedMessages.length > 0 ? (
            sortedMessages.map((msg) => (
              <LintMessage
                key={msg.id}
                data={msg}
                onGoToLine={onGoToLine}
                onApplyFix={onApplyFix}
                compact={compact}
              />
            ))
          ) : (
            <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              フィルター条件に一致する問題はありません
            </div>
          )}
        </div>
      )}
    </div>
  )
})

LinterPanel.displayName = 'LinterPanel'

export default LinterPanel
