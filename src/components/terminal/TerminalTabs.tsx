import { memo, type FC } from 'react'

import type { TerminalTabType } from '../../types/terminal'

interface TerminalTabsProps {
  /** アクティブなタブ */
  activeTab: TerminalTabType
  /** タブ変更時のコールバック */
  onTabChange: (tab: TerminalTabType) => void
  /** 追加のクラス名 */
  className?: string
}

/**
 * タブ定義
 */
const TABS: Array<{ key: TerminalTabType; label: string }> = [
  { key: 'terminal', label: 'ターミナル' },
  { key: 'output', label: '出力' },
]

/**
 * ターミナルパネル用タブ切り替えUI
 *
 * - 「ターミナル」タブ
 * - 「出力」タブ（将来用）
 * - アクティブタブのスタイル
 * - キーボードナビゲーション対応
 */
const TerminalTabs: FC<TerminalTabsProps> = memo(({
  activeTab,
  onTabChange,
  className = '',
}) => {
  const handleKeyDown = (
    e: React.KeyboardEvent,
    index: number
  ) => {
    let newIndex = index

    if (e.key === 'ArrowRight') {
      e.preventDefault()
      newIndex = (index + 1) % TABS.length
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      newIndex = (index - 1 + TABS.length) % TABS.length
    } else if (e.key === 'Home') {
      e.preventDefault()
      newIndex = 0
    } else if (e.key === 'End') {
      e.preventDefault()
      newIndex = TABS.length - 1
    } else {
      return
    }

    onTabChange(TABS[newIndex].key)
  }

  return (
    <div
      role="tablist"
      aria-label="ターミナルタブ"
      className={`flex items-center ${className}`}
    >
      {TABS.map((tab, index) => {
        const isActive = activeTab === tab.key
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            aria-controls={`terminal-tabpanel-${tab.key}`}
            id={`terminal-tab-${tab.key}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab.key)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${
              isActive
                ? 'text-white bg-gray-700 dark:bg-gray-600'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 dark:hover:bg-gray-600/50'
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
})

TerminalTabs.displayName = 'TerminalTabs'

export default TerminalTabs
