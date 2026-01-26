import { memo, useCallback, useRef } from 'react'
import { Icon } from '../common'

export interface EditorTab {
  id: string
  fileName: string
  filePath: string
  isDirty: boolean
  isActive: boolean
}

interface TabItemProps {
  tab: EditorTab
  onSelect: (id: string) => void
  onClose: (id: string) => void
  onDragStart: (e: React.DragEvent, id: string) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, targetId: string) => void
  onDragEnd: () => void
  isDragging: boolean
}

/**
 * 個別タブコンポーネント
 * - ファイル名表示
 * - 閉じるボタン（未保存時は●表示）
 * - ドラッグ&ドロップ対応
 * - アクティブ状態のハイライト
 */
const TabItem = memo<TabItemProps>(({
  tab,
  onSelect,
  onClose,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
}) => {
  const tabRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    onSelect(tab.id)
  }, [onSelect, tab.id])

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onClose(tab.id)
  }, [onClose, tab.id])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(tab.id)
    } else if (e.key === 'Delete' || (e.key === 'w' && (e.ctrlKey || e.metaKey))) {
      e.preventDefault()
      onClose(tab.id)
    }
  }, [onSelect, onClose, tab.id])

  const handleDragStart = useCallback((e: React.DragEvent) => {
    onDragStart(e, tab.id)
  }, [onDragStart, tab.id])

  const handleDrop = useCallback((e: React.DragEvent) => {
    onDrop(e, tab.id)
  }, [onDrop, tab.id])

  // ファイル拡張子に基づいてアイコンを決定
  const getFileIcon = () => {
    if (tab.fileName.endsWith('.json')) {
      return <Icon name="file" className="size-3.5 text-yellow-400 flex-shrink-0" />
    }
    if (tab.fileName.endsWith('.md')) {
      return <Icon name="fileText" className="size-3.5 text-blue-400 flex-shrink-0" />
    }
    return <Icon name="file" className="size-3.5 text-gray-400 flex-shrink-0" />
  }

  return (
    <div
      ref={tabRef}
      role="tab"
      aria-selected={tab.isActive}
      aria-label={`${tab.fileName}${tab.isDirty ? '（未保存）' : ''}`}
      tabIndex={tab.isActive ? 0 : -1}
      draggable
      className={`
        group flex items-center gap-1.5 px-3 py-1.5 min-w-[100px] max-w-[180px]
        border-r border-gray-200 dark:border-gray-700
        cursor-pointer select-none transition-colors
        focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500
        ${tab.isActive
          ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
        }
        ${isDragging ? 'opacity-50' : ''}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onDragStart={handleDragStart}
      onDragOver={onDragOver}
      onDrop={handleDrop}
      onDragEnd={onDragEnd}
    >
      {getFileIcon()}

      <span className="text-xs truncate flex-1" title={tab.filePath}>
        {tab.fileName}
      </span>

      {/* 閉じるボタン / 未保存マーク */}
      <button
        type="button"
        aria-label={tab.isDirty ? `${tab.fileName}を保存せずに閉じる` : `${tab.fileName}を閉じる`}
        className={`
          flex-shrink-0 size-4 rounded flex items-center justify-center
          transition-colors
          ${tab.isDirty
            ? 'text-orange-500 dark:text-orange-400'
            : 'text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100'
          }
          hover:bg-gray-200 dark:hover:bg-gray-700
          focus:outline-none focus:ring-1 focus:ring-blue-500
        `}
        onClick={handleClose}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {tab.isDirty ? (
          <span className="text-xs font-bold" aria-hidden="true">●</span>
        ) : (
          <Icon name="close" className="size-3" />
        )}
      </button>
    </div>
  )
})

TabItem.displayName = 'TabItem'

export default TabItem
