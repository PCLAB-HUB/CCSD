import { memo, useCallback, useState } from 'react'

import { Icon } from '../common'
import { PinButton } from '../favorites'

import type { FileNode } from '../../types'

interface FileTreeProps {
  nodes: FileNode[]
  onFileSelect: (path: string, name: string) => void
  selectedPath?: string
  level?: number
  isFavorite?: (path: string) => boolean
  onToggleFavorite?: (path: string, name: string) => void
}

const FileTree = memo<FileTreeProps>(({
  nodes,
  onFileSelect,
  selectedPath,
  level = 0,
  isFavorite,
  onToggleFavorite,
}) => {
  // nodesが未定義または空の場合のハンドリング
  if (!nodes || nodes.length === 0) {
    if (level === 0) {
      return (
        <div className="select-none p-4 text-center text-gray-500 dark:text-gray-400">
          <p className="text-sm">ファイルがありません</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="select-none" role="tree" aria-label="ファイルツリー">
      {nodes.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          onFileSelect={onFileSelect}
          selectedPath={selectedPath}
          level={level}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  )
})

FileTree.displayName = 'FileTree'

interface TreeNodeProps {
  node: FileNode
  onFileSelect: (path: string, name: string) => void
  selectedPath?: string
  level: number
  isFavorite?: (path: string) => boolean
  onToggleFavorite?: (path: string, name: string) => void
}

const TreeNode = memo<TreeNodeProps>(({
  node,
  onFileSelect,
  selectedPath,
  level,
  isFavorite,
  onToggleFavorite,
}) => {
  const [isExpanded, setIsExpanded] = useState(level < 2)
  const isSelected = node.path === selectedPath
  const paddingLeft = level * 16 + 8
  const isDirectory = node.file_type === 'directory'
  const isPinned = isFavorite ? isFavorite(node.path) : false

  // handleClickをuseCallbackでメモ化
  const handleClick = useCallback(() => {
    if (isDirectory) {
      setIsExpanded(prev => !prev)
    } else {
      onFileSelect(node.path, node.name)
    }
  }, [isDirectory, node.path, node.name, onFileSelect])

  // キーボード操作のサポート
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    } else if (isDirectory) {
      if (e.key === 'ArrowRight' && !isExpanded) {
        e.preventDefault()
        setIsExpanded(true)
      } else if (e.key === 'ArrowLeft' && isExpanded) {
        e.preventDefault()
        setIsExpanded(false)
      }
    }
  }, [handleClick, isDirectory, isExpanded])

  // お気に入りトグルハンドラー
  const handleToggleFavorite = useCallback(() => {
    if (onToggleFavorite) {
      onToggleFavorite(node.path, node.name)
    }
  }, [onToggleFavorite, node.path, node.name])

  const getChevronIcon = () => {
    if (node.file_type === 'directory') {
      return isExpanded ? (
        <Icon name="chevronDown" className="size-4 text-gray-400" />
      ) : (
        <Icon name="chevronRight" className="size-4 text-gray-400" />
      )
    }
    return null
  }

  const getFileIcon = () => {
    if (node.file_type === 'directory') {
      return <Icon name="folderFilled" className="size-4 text-yellow-500" />
    }

    // ファイル拡張子に基づいてアイコンを変更
    if (node.name.endsWith('.json')) {
      return <Icon name="file" className="size-4 text-yellow-400" />
    }

    if (node.name.endsWith('.md')) {
      return <Icon name="fileText" className="size-4 text-blue-400" />
    }

    return <Icon name="file" className="size-4 text-gray-400" />
  }

  return (
    <div>
      <div
        role={isDirectory ? 'treeitem' : 'treeitem'}
        aria-expanded={isDirectory ? isExpanded : undefined}
        aria-selected={isSelected}
        aria-label={isDirectory ? `${node.name} フォルダ${isExpanded ? '、展開中' : '、折りたたみ中'}` : `${node.name} ファイル`}
        tabIndex={0}
        className={`group flex items-center gap-1 py-1 px-2 cursor-pointer rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${
          isSelected ? 'bg-blue-100 dark:bg-blue-900' : ''
        }`}
        style={{ paddingLeft }}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <span className="w-4 flex-shrink-0" aria-hidden="true">{getChevronIcon()}</span>
        <span className="flex-shrink-0" aria-hidden="true">{getFileIcon()}</span>
        <span className="text-sm truncate flex-1">{node.name}</span>
        {!isDirectory && onToggleFavorite && (
          <PinButton
            isPinned={isPinned}
            onToggle={handleToggleFavorite}
            size="sm"
          />
        )}
      </div>
      {isDirectory && isExpanded && node.children && (
        <FileTree
          nodes={node.children}
          onFileSelect={onFileSelect}
          selectedPath={selectedPath}
          level={level + 1}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
        />
      )}
    </div>
  )
})

TreeNode.displayName = 'TreeNode'

export default FileTree
