import { FC, memo, useId } from 'react'

export interface Tab {
  key: string
  label: string
  badge?: number | string
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (key: string) => void
  className?: string
}

/**
 * 共通タブコンポーネント
 * アクセシビリティ対応（ARIA属性、キーボードナビゲーション）
 */
const Tabs: FC<TabsProps> = memo(({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}) => {
  const tabListId = useId()

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let newIndex = index

    if (e.key === 'ArrowRight') {
      e.preventDefault()
      newIndex = (index + 1) % tabs.length
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      newIndex = (index - 1 + tabs.length) % tabs.length
    } else if (e.key === 'Home') {
      e.preventDefault()
      newIndex = 0
    } else if (e.key === 'End') {
      e.preventDefault()
      newIndex = tabs.length - 1
    } else {
      return
    }

    onTabChange(tabs[newIndex].key)
  }

  return (
    <div
      role="tablist"
      aria-label="タブナビゲーション"
      className={`flex border-b border-gray-200 dark:border-gray-700 ${className}`}
    >
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.key
        return (
          <button
            key={tab.key}
            id={`${tabListId}-tab-${tab.key}`}
            role="tab"
            aria-selected={isActive}
            aria-controls={`${tabListId}-panel-${tab.key}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab.key)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${
              isActive
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded">
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
})

Tabs.displayName = 'Tabs'

export default Tabs
