import { memo, useCallback, useState, useRef, type FC } from 'react'
import type { FavoriteItem as FavoriteItemType } from '../../types/favorites'
import { Icon } from '../common'

interface FavoriteItemProps {
  /** お気に入りアイテム情報 */
  item: FavoriteItemType
  /** アイテムのインデックス */
  index: number
  /** 選択中かどうか */
  isSelected: boolean
  /** アイテムクリック時のコールバック */
  onClick: (path: string, name: string) => void
  /** 削除時のコールバック */
  onRemove: (path: string) => void
  /** ドラッグ開始時のコールバック */
  onDragStart: (index: number) => void
  /** ドラッグオーバー時のコールバック */
  onDragOver: (index: number) => void
  /** ドロップ時のコールバック */
  onDrop: () => void
  /** ドラッグ中のアイテムインデックス */
  dragOverIndex: number | null
}

/**
 * お気に入り個別アイテム
 * ドラッグで並べ替え可能、ホバーで削除ボタン表示
 */
const FavoriteItem: FC<FavoriteItemProps> = memo(({
  item,
  index,
  isSelected,
  onClick,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  dragOverIndex,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const itemRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    onClick(item.path, item.name)
  }, [onClick, item.path, item.name])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleClick()
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        onRemove(item.path)
      }
    },
    [handleClick, onRemove, item.path]
  )

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onRemove(item.path)
    },
    [onRemove, item.path]
  )

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', String(index))
      setIsDragging(true)
      onDragStart(index)
    },
    [index, onDragStart]
  )

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      onDragOver(index)
    },
    [index, onDragOver]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      onDrop()
    },
    [onDrop]
  )

  // ファイル拡張子に基づいてアイコンを決定
  const getFileIcon = () => {
    if (item.name.endsWith('.json')) {
      return <Icon name="file" className="size-4 text-yellow-400" />
    }
    if (item.name.endsWith('.md')) {
      return <Icon name="fileText" className="size-4 text-blue-400" />
    }
    return <Icon name="file" className="size-4 text-gray-400" />
  }

  const isDragTarget = dragOverIndex === index

  return (
    <div
      ref={itemRef}
      role="listitem"
      tabIndex={0}
      draggable
      className={`
        group
        flex items-center gap-2
        py-1.5 px-2
        cursor-pointer
        rounded
        transition-all duration-150
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
        ${isSelected
          ? 'bg-blue-100 dark:bg-blue-900/50'
          : 'hover:bg-gray-200 dark:hover:bg-gray-700/50'
        }
        ${isDragging ? 'opacity-50' : 'opacity-100'}
        ${isDragTarget
          ? 'border-t-2 border-blue-500 dark:border-blue-400'
          : 'border-t-2 border-transparent'
        }
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      aria-selected={isSelected}
      aria-label={`${item.name}、お気に入りアイテム`}
    >
      {/* ドラッグハンドル */}
      <span
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-400 dark:text-gray-500"
        aria-hidden="true"
      >
        <Icon name="grip" className="size-3" />
      </span>

      {/* お気に入りアイコン */}
      <span className="flex-shrink-0 text-yellow-500 dark:text-yellow-400" aria-hidden="true">
        <Icon name="starFilled" className="size-3.5" />
      </span>

      {/* ファイルアイコン */}
      <span className="flex-shrink-0" aria-hidden="true">
        {getFileIcon()}
      </span>

      {/* ファイル名 */}
      <span className="flex-1 text-sm truncate text-gray-700 dark:text-gray-200">
        {item.name}
      </span>

      {/* 削除ボタン（ホバー時表示） */}
      <button
        type="button"
        onClick={handleRemove}
        className="
          flex-shrink-0
          p-0.5
          rounded
          opacity-0 group-hover:opacity-100
          text-gray-400 hover:text-red-500
          dark:text-gray-500 dark:hover:text-red-400
          transition-opacity duration-150
          focus:outline-none focus:ring-2 focus:ring-red-500 focus:opacity-100
        "
        title="お気に入りから削除"
        aria-label={`${item.name}をお気に入りから削除`}
      >
        <Icon name="close" className="size-3.5" />
      </button>
    </div>
  )
})

FavoriteItem.displayName = 'FavoriteItem'

export default FavoriteItem
