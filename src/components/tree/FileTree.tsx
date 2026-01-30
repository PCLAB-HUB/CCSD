import { memo, useCallback, useMemo, useState } from 'react'

import { Icon } from '../common'
import { PinButton } from '../favorites'

import type { FileNode } from '../../types'

// ============================================================
// 型定義
// ============================================================

/** フィルター関数の型 */
type FilterFunction = (node: FileNode) => boolean

interface FileTreeProps {
  nodes: FileNode[]
  onFileSelect: (path: string, name: string) => void
  selectedPath?: string
  level?: number
  isFavorite?: (path: string) => boolean
  onToggleFavorite?: (path: string, name: string) => void
  /** カスタムフィルター関数（trueを返すノードのみ表示） */
  filterFn?: FilterFunction
  /** 検索フィルター文字列（ファイル名にマッチする部分をハイライト） */
  searchFilter?: string
  /** 検索ハイライトを有効にするか */
  highlightSearch?: boolean
  /** マッチ数を表示するか（ルートレベルのみ有効） */
  showMatchCount?: boolean
}

// ============================================================
// ユーティリティ関数
// ============================================================

/**
 * フィルターを適用してツリーを再構築する
 * - filterFnにマッチするノードのみを残す
 * - 子がすべてフィルターで除外されたディレクトリは非表示
 */
function applyFilter(nodes: FileNode[], filterFn: FilterFunction): FileNode[] {
  const result: FileNode[] = []

  for (const node of nodes) {
    if (node.file_type === 'directory') {
      // ディレクトリの場合：子を先にフィルタリング
      const filteredChildren = node.children
        ? applyFilter(node.children, filterFn)
        : []

      // 子が残っている場合のみディレクトリを含める
      if (filteredChildren.length > 0) {
        result.push({
          ...node,
          children: filteredChildren,
        })
      } else if (filterFn(node)) {
        // ディレクトリ自体がフィルターにマッチする場合も含める
        result.push({
          ...node,
          children: [],
        })
      }
    } else {
      // ファイルの場合：フィルターにマッチするかチェック
      if (filterFn(node)) {
        result.push(node)
      }
    }
  }

  return result
}

/**
 * フィルター後のファイル数をカウント（ディレクトリは除外）
 */
function countFilteredFiles(nodes: FileNode[]): number {
  let count = 0

  for (const node of nodes) {
    if (node.file_type === 'file') {
      count++
    } else if (node.children) {
      count += countFilteredFiles(node.children)
    }
  }

  return count
}

/**
 * 検索文字列にマッチする部分をハイライト表示用にラップする
 */
function highlightMatches(
  text: string,
  searchFilter: string
): React.ReactNode {
  if (!searchFilter) {
    return text
  }

  // 大文字小文字を無視して検索
  const lowerText = text.toLowerCase()
  const lowerSearch = searchFilter.toLowerCase()
  const index = lowerText.indexOf(lowerSearch)

  if (index === -1) {
    return text
  }

  const before = text.slice(0, index)
  const match = text.slice(index, index + searchFilter.length)
  const after = text.slice(index + searchFilter.length)

  return (
    <>
      {before}
      <mark className="bg-yellow-300 dark:bg-yellow-600 text-inherit rounded px-0.5">
        {match}
      </mark>
      {after}
    </>
  )
}

const FileTree = memo<FileTreeProps>(({
  nodes,
  onFileSelect,
  selectedPath,
  level = 0,
  isFavorite,
  onToggleFavorite,
  filterFn,
  searchFilter,
  highlightSearch = true,
  showMatchCount = false,
}) => {
  // フィルターを適用
  const filteredNodes = useMemo(() => {
    if (!filterFn) {
      return nodes
    }
    return applyFilter(nodes, filterFn)
  }, [nodes, filterFn])

  // フィルター後のファイル数
  const matchCount = useMemo(() => {
    if (!showMatchCount || !filterFn) {
      return null
    }
    return countFilteredFiles(filteredNodes)
  }, [showMatchCount, filterFn, filteredNodes])

  // nodesが未定義または空の場合のハンドリング
  if (!filteredNodes || filteredNodes.length === 0) {
    if (level === 0) {
      // フィルター適用中は「マッチなし」メッセージを表示
      const isFiltering = !!filterFn || !!searchFilter
      return (
        <div className="select-none p-4 text-center text-gray-500 dark:text-gray-400">
          <p className="text-sm">
            {isFiltering ? 'フィルターにマッチするファイルがありません' : 'ファイルがありません'}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="select-none" role="tree" aria-label="ファイルツリー">
      {/* マッチ数の表示（ルートレベルかつフィルター適用中のみ） */}
      {level === 0 && matchCount !== null && (
        <div className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
          {matchCount}件のファイル
        </div>
      )}
      {filteredNodes.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          onFileSelect={onFileSelect}
          selectedPath={selectedPath}
          level={level}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
          searchFilter={highlightSearch ? searchFilter : undefined}
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
  /** 検索フィルター文字列（ハイライト用） */
  searchFilter?: string
}

const TreeNode = memo<TreeNodeProps>(({
  node,
  onFileSelect,
  selectedPath,
  level,
  isFavorite,
  onToggleFavorite,
  searchFilter,
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
        <span className="text-sm truncate flex-1">
          {searchFilter ? highlightMatches(node.name, searchFilter) : node.name}
        </span>
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
          searchFilter={searchFilter}
          highlightSearch={!!searchFilter}
        />
      )}
    </div>
  )
})

TreeNode.displayName = 'TreeNode'

export default FileTree
