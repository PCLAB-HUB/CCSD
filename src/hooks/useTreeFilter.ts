/**
 * @fileoverview ツリーフィルター機能の状態管理フック
 * @module hooks/useTreeFilter
 *
 * 機能:
 * - フィルター状態の管理（種類別表示/非表示）
 * - localStorageへの永続化
 * - フィルター適用ロジック
 * - 隠しファイル表示切り替え
 * - テキスト検索フィルター
 */

import { useCallback, useEffect, useMemo, useState } from 'react'

import type { FileNode } from '../types/files'
import type {
  FilterType,
  FilterState,
  FilterConfigMap,
} from '../types/treeFilter'
import {
  DEFAULT_FILTER_STATE,
  getActiveFilterCount,
  isFilterType,
} from '../types/treeFilter'

// ============================================================
// 定数
// ============================================================

/** localStorage保存キー */
const STORAGE_KEY = 'claude-dashboard-tree-filter'

/** フィルター設定の定義 */
const FILTER_CONFIGS: FilterConfigMap = {
  all: {
    type: 'all',
    label: 'すべて',
    icon: 'folder',
    description: 'すべてのファイルを表示',
    matchFn: () => true,
  },
  markdown: {
    type: 'markdown',
    label: 'Markdown',
    icon: 'file-text',
    description: '.mdファイルのみ表示',
    matchFn: (node: FileNode) =>
      node.file_type === 'directory' || node.name.endsWith('.md'),
  },
  json: {
    type: 'json',
    label: 'JSON',
    icon: 'file-code',
    description: '.jsonファイルのみ表示',
    matchFn: (node: FileNode) =>
      node.file_type === 'directory' || node.name.endsWith('.json'),
  },
  skill: {
    type: 'skill',
    label: 'スキル',
    icon: 'zap',
    description: 'skills/配下のファイル',
    matchFn: (node: FileNode) =>
      node.file_type === 'directory' || node.path.includes('/skills/'),
  },
  agent: {
    type: 'agent',
    label: 'エージェント',
    icon: 'bot',
    description: 'エージェント定義ファイル',
    matchFn: (node: FileNode) =>
      node.file_type === 'directory' ||
      node.path.includes('/agents/') ||
      node.name.toLowerCase().includes('agent'),
  },
  directory: {
    type: 'directory',
    label: 'ディレクトリ',
    icon: 'folder-tree',
    description: 'ディレクトリのみ表示',
    matchFn: (node: FileNode) => node.file_type === 'directory',
  },
}

// ============================================================
// 型定義
// ============================================================

/** useTreeFilterフックの戻り値型 */
export interface UseTreeFilterReturn {
  // 状態
  /** アクティブなフィルター */
  activeFilters: FilterType[]
  /** 隠しファイル表示フラグ */
  showHiddenFiles: boolean
  /** テキスト検索フィルター */
  searchFilter: string
  /** メニュー表示フラグ */
  isMenuOpen: boolean

  // 操作
  /** フィルターをトグル */
  toggleFilter: (type: FilterType) => void
  /** フィルターを設定 */
  setFilters: (filters: FilterType[]) => void
  /** フィルターをクリア */
  clearFilters: () => void
  /** 隠しファイル表示をトグル */
  toggleHiddenFiles: () => void
  /** テキストフィルターを設定 */
  setSearchFilter: (query: string) => void
  /** メニュー表示をトグル */
  toggleMenu: () => void
  /** メニューを閉じる */
  closeMenu: () => void

  // ユーティリティ
  /** ノードにフィルターを適用 */
  filterNodes: (nodes: FileNode[]) => FileNode[]
  /** アクティブなフィルター数 */
  activeFilterCount: number
  /** フィルター設定マップ */
  configs: FilterConfigMap
  /** フィルターが適用されているか */
  isFiltering: boolean
}

// ============================================================
// ヘルパー関数
// ============================================================

/**
 * localStorageから状態を読み込む
 */
function loadFromStorage(): Partial<FilterState> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return {}

    const parsed = JSON.parse(stored) as unknown
    if (typeof parsed !== 'object' || parsed === null) return {}

    const result: Partial<FilterState> = {}
    const obj = parsed as Record<string, unknown>

    // activeFiltersのバリデーション
    if (Array.isArray(obj.activeFilters)) {
      const validFilters = obj.activeFilters.filter(isFilterType)
      if (validFilters.length > 0) {
        result.activeFilters = validFilters
      }
    }

    // showHiddenFilesのバリデーション
    if (typeof obj.showHiddenFiles === 'boolean') {
      result.showHiddenFiles = obj.showHiddenFiles
    }

    return result
  } catch {
    return {}
  }
}

/**
 * localStorageに状態を保存
 */
function saveToStorage(state: Pick<FilterState, 'activeFilters' | 'showHiddenFiles'>): void {
  try {
    const data = {
      activeFilters: state.activeFilters,
      showHiddenFiles: state.showHiddenFiles,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // localStorage書き込み失敗は無視
  }
}

/**
 * 隠しファイルかどうかを判定
 */
function isHiddenFile(node: FileNode): boolean {
  return node.name.startsWith('.')
}

/**
 * テキスト検索にマッチするかどうかを判定
 */
function matchesSearchFilter(node: FileNode, query: string): boolean {
  if (!query) return true
  const lowerQuery = query.toLowerCase()
  return (
    node.name.toLowerCase().includes(lowerQuery) ||
    node.path.toLowerCase().includes(lowerQuery)
  )
}

// ============================================================
// フック本体
// ============================================================

/**
 * ツリーフィルター機能を管理するカスタムフック
 */
export function useTreeFilter(): UseTreeFilterReturn {
  // ============================================================
  // 状態
  // ============================================================

  const [activeFilters, setActiveFilters] = useState<FilterType[]>(() => {
    const stored = loadFromStorage()
    return stored.activeFilters ?? DEFAULT_FILTER_STATE.activeFilters
  })

  const [showHiddenFiles, setShowHiddenFiles] = useState<boolean>(() => {
    const stored = loadFromStorage()
    return stored.showHiddenFiles ?? DEFAULT_FILTER_STATE.showHiddenFiles
  })

  const [searchFilter, setSearchFilterState] = useState<string>(
    DEFAULT_FILTER_STATE.searchFilter
  )

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false)

  // ============================================================
  // 永続化
  // ============================================================

  useEffect(() => {
    saveToStorage({ activeFilters, showHiddenFiles })
  }, [activeFilters, showHiddenFiles])

  // ============================================================
  // 操作関数
  // ============================================================

  /**
   * フィルターをトグル
   */
  const toggleFilter = useCallback((type: FilterType) => {
    setActiveFilters((current) => {
      // 'all'を選択した場合は他を全てクリア
      if (type === 'all') {
        return ['all']
      }

      // 現在'all'が選択されている場合は置き換え
      if (current.includes('all')) {
        return [type]
      }

      // 既に選択されている場合は解除
      if (current.includes(type)) {
        const newFilters = current.filter((f) => f !== type)
        // 全て解除された場合は'all'に戻す
        return newFilters.length === 0 ? ['all'] : newFilters
      }

      // 新しいフィルターを追加
      return [...current, type]
    })
  }, [])

  /**
   * フィルターを設定
   */
  const setFilters = useCallback((filters: FilterType[]) => {
    if (filters.length === 0) {
      setActiveFilters(['all'])
    } else {
      setActiveFilters(filters)
    }
  }, [])

  /**
   * フィルターをクリア
   */
  const clearFilters = useCallback(() => {
    setActiveFilters(['all'])
    setSearchFilterState('')
  }, [])

  /**
   * 隠しファイル表示をトグル
   */
  const toggleHiddenFiles = useCallback(() => {
    setShowHiddenFiles((current) => !current)
  }, [])

  /**
   * テキストフィルターを設定
   */
  const setSearchFilter = useCallback((query: string) => {
    setSearchFilterState(query)
  }, [])

  /**
   * メニュー表示をトグル
   */
  const toggleMenu = useCallback(() => {
    setIsMenuOpen((current) => !current)
  }, [])

  /**
   * メニューを閉じる
   */
  const closeMenu = useCallback(() => {
    setIsMenuOpen(false)
  }, [])

  // ============================================================
  // フィルタリングロジック
  // ============================================================

  /**
   * ノードがフィルター条件にマッチするか判定
   */
  const matchesFilter = useCallback(
    (node: FileNode): boolean => {
      // 隠しファイルチェック
      if (!showHiddenFiles && isHiddenFile(node)) {
        return false
      }

      // テキスト検索フィルター
      if (!matchesSearchFilter(node, searchFilter)) {
        return false
      }

      // 'all'が含まれている場合は全て表示
      if (activeFilters.includes('all')) {
        return true
      }

      // いずれかのフィルターにマッチすればtrue
      return activeFilters.some((filterType) => {
        const config = FILTER_CONFIGS[filterType]
        return config.matchFn(node)
      })
    },
    [activeFilters, showHiddenFiles, searchFilter]
  )

  /**
   * ノードツリーにフィルターを適用
   * ディレクトリは子要素がマッチすれば含める
   */
  const filterNodes = useCallback(
    (nodes: FileNode[]): FileNode[] => {
      const filterRecursive = (nodeList: FileNode[]): FileNode[] => {
        return nodeList
          .map((node) => {
            // ディレクトリの場合は再帰的に処理
            if (node.file_type === 'directory' && node.children) {
              const filteredChildren = filterRecursive(node.children)
              // 子要素がある場合、または自身がマッチする場合は含める
              if (filteredChildren.length > 0 || matchesFilter(node)) {
                return {
                  ...node,
                  children: filteredChildren,
                }
              }
              return null
            }

            // ファイルの場合はマッチするかどうかで判定
            return matchesFilter(node) ? node : null
          })
          .filter((node): node is FileNode => node !== null)
      }

      return filterRecursive(nodes)
    },
    [matchesFilter]
  )

  // ============================================================
  // 派生データ
  // ============================================================

  /** アクティブなフィルター数 */
  const activeFilterCount = useMemo(() => {
    return getActiveFilterCount({
      activeFilters,
      showHiddenFiles,
      searchFilter,
    })
  }, [activeFilters, showHiddenFiles, searchFilter])

  /** フィルターが適用されているか */
  const isFiltering = useMemo(() => {
    return (
      !activeFilters.includes('all') ||
      searchFilter !== '' ||
      showHiddenFiles !== DEFAULT_FILTER_STATE.showHiddenFiles
    )
  }, [activeFilters, searchFilter, showHiddenFiles])

  // ============================================================
  // 戻り値
  // ============================================================

  return {
    // 状態
    activeFilters,
    showHiddenFiles,
    searchFilter,
    isMenuOpen,

    // 操作
    toggleFilter,
    setFilters,
    clearFilters,
    toggleHiddenFiles,
    setSearchFilter,
    toggleMenu,
    closeMenu,

    // ユーティリティ
    filterNodes,
    activeFilterCount,
    configs: FILTER_CONFIGS,
    isFiltering,
  }
}

export default useTreeFilter
