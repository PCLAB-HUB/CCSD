import { memo, useCallback, useEffect, useRef, useState } from 'react'

import { Icon } from '../common'
import TabItem, { type EditorTab } from './TabItem'

interface TabBarProps {
  tabs: EditorTab[]
  onSelectTab: (id: string) => void
  onCloseTab: (id: string) => void
  onReorderTabs: (fromId: string, toId: string) => void
  onNewTab?: () => void
  className?: string
}

/**
 * タブバーコンポーネント
 * - タブ一覧の表示
 * - 新規タブボタン
 * - ドラッグ&ドロップによるタブ並べ替え
 * - タブが多い場合のスクロール対応
 */
const TabBar = memo<TabBarProps>(({
  tabs,
  onSelectTab,
  onCloseTab,
  onReorderTabs,
  onNewTab,
  className = '',
}) => {
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // スクロール状態の更新
  const updateScrollState = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const { scrollLeft, scrollWidth, clientWidth } = container
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1)
  }, [])

  // スクロール状態の監視
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    updateScrollState()

    const resizeObserver = new ResizeObserver(updateScrollState)
    resizeObserver.observe(container)

    container.addEventListener('scroll', updateScrollState)

    return () => {
      resizeObserver.disconnect()
      container.removeEventListener('scroll', updateScrollState)
    }
  }, [updateScrollState, tabs.length])

  // スクロール処理
  const scroll = useCallback((direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (!container) return

    const scrollAmount = 150
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }, [])

  // ドラッグ&ドロップ処理
  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDraggedTabId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (draggedTabId && draggedTabId !== targetId) {
      onReorderTabs(draggedTabId, targetId)
    }
    setDraggedTabId(null)
  }, [draggedTabId, onReorderTabs])

  const handleDragEnd = useCallback(() => {
    setDraggedTabId(null)
  }, [])

  // キーボードナビゲーション
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const activeTabIndex = tabs.findIndex(tab => tab.isActive)
    if (activeTabIndex === -1) return

    let newIndex = activeTabIndex

    if (e.key === 'ArrowRight') {
      e.preventDefault()
      newIndex = Math.min(activeTabIndex + 1, tabs.length - 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      newIndex = Math.max(activeTabIndex - 1, 0)
    } else if (e.key === 'Home') {
      e.preventDefault()
      newIndex = 0
    } else if (e.key === 'End') {
      e.preventDefault()
      newIndex = tabs.length - 1
    } else {
      return
    }

    if (newIndex !== activeTabIndex) {
      onSelectTab(tabs[newIndex].id)
    }
  }, [tabs, onSelectTab])

  if (tabs.length === 0) {
    return (
      <div className={`flex items-center h-9 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 ${className}`}>
        {onNewTab && (
          <button
            type="button"
            aria-label="新規タブを作成"
            className="flex items-center justify-center size-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onClick={onNewTab}
          >
            <Icon name="plus" className="size-4" />
          </button>
        )}
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
          タブがありません
        </span>
      </div>
    )
  }

  return (
    <div
      className={`flex items-center h-9 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 ${className}`}
      role="tablist"
      aria-label="開いているファイル"
      onKeyDown={handleKeyDown}
    >
      {/* 左スクロールボタン */}
      {canScrollLeft && (
        <button
          type="button"
          aria-label="左にスクロール"
          className="flex-shrink-0 flex items-center justify-center size-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          onClick={() => scroll('left')}
        >
          <Icon name="chevronLeft" className="size-4" />
        </button>
      )}

      {/* タブコンテナ */}
      <div
        ref={scrollContainerRef}
        className="flex-1 flex items-stretch overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tabs.map((tab) => (
          <TabItem
            key={tab.id}
            tab={tab}
            onSelect={onSelectTab}
            onClose={onCloseTab}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            isDragging={draggedTabId === tab.id}
          />
        ))}
      </div>

      {/* 右スクロールボタン */}
      {canScrollRight && (
        <button
          type="button"
          aria-label="右にスクロール"
          className="flex-shrink-0 flex items-center justify-center size-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          onClick={() => scroll('right')}
        >
          <Icon name="chevronRight" className="size-4" />
        </button>
      )}

      {/* 新規タブボタン */}
      {onNewTab && (
        <button
          type="button"
          aria-label="新規タブを作成"
          className="flex-shrink-0 flex items-center justify-center size-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors ml-1 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          onClick={onNewTab}
        >
          <Icon name="plus" className="size-4" />
        </button>
      )}
    </div>
  )
})

TabBar.displayName = 'TabBar'

export default TabBar
