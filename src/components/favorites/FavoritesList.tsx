import { memo, useState, useCallback, type FC } from 'react'
import type { FavoriteItem as FavoriteItemType } from '../../types/favorites'
import FavoriteItem from './FavoriteItem'
import { Icon } from '../common'

interface FavoritesListProps {
  /** お気に入りアイテム一覧 */
  favorites: FavoriteItemType[]
  /** 現在選択中のパス */
  selectedPath?: string
  /** アイテムクリック時のコールバック */
  onItemClick: (path: string, name: string) => void
  /** アイテム削除時のコールバック */
  onItemRemove: (path: string) => void
  /** 並び替え時のコールバック */
  onReorder: (startIndex: number, endIndex: number) => void
  /** 折りたたみ可能かどうか */
  collapsible?: boolean
  /** 初期の展開状態 */
  defaultExpanded?: boolean
}

/**
 * お気に入り一覧コンポーネント
 * サイドバー上部に表示され、ドラッグで並べ替え可能
 */
const FavoritesList: FC<FavoritesListProps> = memo(({
  favorites,
  selectedPath,
  onItemClick,
  onItemRemove,
  onReorder,
  collapsible = true,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [dragStartIndex, setDragStartIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleToggle = useCallback(() => {
    if (collapsible) {
      setIsExpanded((prev) => !prev)
    }
  }, [collapsible])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (collapsible && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        setIsExpanded((prev) => !prev)
      }
    },
    [collapsible]
  )

  const handleDragStart = useCallback((index: number) => {
    setDragStartIndex(index)
  }, [])

  const handleDragOver = useCallback((index: number) => {
    setDragOverIndex(index)
  }, [])

  const handleDrop = useCallback(() => {
    if (dragStartIndex !== null && dragOverIndex !== null && dragStartIndex !== dragOverIndex) {
      onReorder(dragStartIndex, dragOverIndex)
    }
    setDragStartIndex(null)
    setDragOverIndex(null)
  }, [dragStartIndex, dragOverIndex, onReorder])

  const handleDragEnd = useCallback(() => {
    setDragStartIndex(null)
    setDragOverIndex(null)
  }, [])

  return (
    <div
      className="mb-2"
      onDragEnd={handleDragEnd}
    >
      {/* ヘッダー */}
      <div
        role={collapsible ? 'button' : undefined}
        tabIndex={collapsible ? 0 : undefined}
        className={`
          flex items-center gap-1.5
          px-2 py-1.5
          text-xs font-semibold uppercase tracking-wider
          text-gray-500 dark:text-gray-400
          ${collapsible ? 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-300' : ''}
          select-none
          transition-colors duration-150
        `}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
        aria-controls="favorites-list"
      >
        {collapsible && (
          <span className="flex-shrink-0" aria-hidden="true">
            {isExpanded ? (
              <Icon name="chevronDown" className="size-3" />
            ) : (
              <Icon name="chevronRight" className="size-3" />
            )}
          </span>
        )}
        <span className="flex-shrink-0 text-yellow-500 dark:text-yellow-400" aria-hidden="true">
          <Icon name="starFilled" className="size-3.5" />
        </span>
        <span>お気に入り</span>
        {favorites.length > 0 && (
          <span className="ml-auto text-gray-400 dark:text-gray-500 font-normal">
            {favorites.length}
          </span>
        )}
      </div>

      {/* アイテム一覧 */}
      {isExpanded && (
        <div
          id="favorites-list"
          role="list"
          aria-label="お気に入り一覧"
          className="px-1"
        >
          {favorites.length === 0 ? (
            <div className="py-4 px-2 text-center text-sm text-gray-400 dark:text-gray-500">
              <p>お気に入りなし</p>
              <p className="text-xs mt-1">
                ファイルのピンアイコンをクリックして追加
              </p>
            </div>
          ) : (
            favorites.map((item, index) => (
              <FavoriteItem
                key={item.path}
                item={item}
                index={index}
                isSelected={item.path === selectedPath}
                onClick={onItemClick}
                onRemove={onItemRemove}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                dragOverIndex={dragOverIndex}
              />
            ))
          )}
        </div>
      )}

      {/* 区切り線 */}
      {isExpanded && favorites.length > 0 && (
        <div className="mx-2 mt-2 border-t border-gray-200 dark:border-gray-700" />
      )}
    </div>
  )
})

FavoritesList.displayName = 'FavoritesList'

export default FavoritesList
