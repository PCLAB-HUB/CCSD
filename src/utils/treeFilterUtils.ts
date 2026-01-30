/**
 * ツリーフィルタユーティリティ関数
 *
 * ファイルツリーのフィルタリング処理を提供
 */

import type { FileNode } from '../types/files'
import type { FilterType, FilterConfig, FilterConfigMap } from '../types/treeFilter'

// ============================================================
// 定数
// ============================================================

/** 隠しファイルから除外するファイル名（これらは隠しファイルとして扱わない） */
const HIDDEN_FILE_EXCEPTIONS = ['CLAUDE.md'] as const

// ============================================================
// フィルター設定
// ============================================================

/**
 * フィルター設定の定数
 *
 * 各フィルタータイプの設定を定義
 */
export const FILTER_CONFIGS: FilterConfigMap = {
  all: {
    type: 'all',
    label: 'すべて',
    icon: 'files',
    description: 'すべてのファイルを表示',
    matchFn: () => true,
  },
  markdown: {
    type: 'markdown',
    label: 'Markdown',
    icon: 'fileText',
    description: '.mdファイルのみ',
    matchFn: (node: FileNode) =>
      node.file_type === 'file' && node.name.toLowerCase().endsWith('.md'),
  },
  json: {
    type: 'json',
    label: 'JSON',
    icon: 'braces',
    description: '.jsonファイルのみ',
    matchFn: (node: FileNode) =>
      node.file_type === 'file' && node.name.toLowerCase().endsWith('.json'),
  },
  skill: {
    type: 'skill',
    label: 'スキル',
    icon: 'zap',
    description: 'skills/配下のファイル',
    matchFn: (node: FileNode) => {
      // パスに /skills/ または skills/ が含まれるかチェック
      const normalizedPath = node.path.replace(/\\/g, '/')
      return normalizedPath.includes('/skills/') || normalizedPath.startsWith('skills/')
    },
  },
  agent: {
    type: 'agent',
    label: 'エージェント',
    icon: 'bot',
    description: 'エージェント定義ファイル',
    matchFn: (node: FileNode) => {
      // パスに /agents/ が含まれる、またはファイル名に agent が含まれる
      const normalizedPath = node.path.replace(/\\/g, '/').toLowerCase()
      const normalizedName = node.name.toLowerCase()
      return (
        normalizedPath.includes('/agents/') ||
        normalizedPath.startsWith('agents/') ||
        normalizedName.includes('agent')
      )
    },
  },
  directory: {
    type: 'directory',
    label: 'ディレクトリ',
    icon: 'folder',
    description: 'ディレクトリのみ',
    matchFn: (node: FileNode) => node.file_type === 'directory',
  },
}

// ============================================================
// ユーティリティ関数
// ============================================================

/**
 * 隠しファイルかどうかを判定
 *
 * ドットで始まるファイル/ディレクトリを隠しファイルとして扱う
 * ただし、HIDDEN_FILE_EXCEPTIONS に含まれるファイルは除外
 *
 * @param node - ファイルノード
 * @returns 隠しファイルの場合true
 */
export function isHiddenFile(node: FileNode): boolean {
  // 例外リストにあるファイルは隠しファイルとして扱わない
  if (HIDDEN_FILE_EXCEPTIONS.includes(node.name as (typeof HIDDEN_FILE_EXCEPTIONS)[number])) {
    return false
  }

  // 名前がドットで始まる場合は隠しファイル
  return node.name.startsWith('.')
}

/**
 * 単一ノードがフィルターにマッチするか判定
 *
 * @param node - ファイルノード
 * @param filterType - フィルタータイプ
 * @returns マッチする場合true
 */
export function matchesFilter(node: FileNode, filterType: FilterType): boolean {
  const config = FILTER_CONFIGS[filterType]
  return config.matchFn(node)
}

/**
 * ノードが複数のフィルターのいずれかにマッチするか判定
 *
 * @param node - ファイルノード
 * @param filterTypes - フィルタータイプの配列
 * @returns いずれかにマッチする場合true
 */
export function matchesAnyFilter(node: FileNode, filterTypes: FilterType[]): boolean {
  // 'all'が含まれていれば常にマッチ
  if (filterTypes.includes('all')) {
    return true
  }

  // いずれかのフィルターにマッチすればtrue
  return filterTypes.some((filterType) => matchesFilter(node, filterType))
}

/**
 * 検索フィルターにマッチするか判定（部分一致、大文字小文字無視）
 *
 * @param node - ファイルノード
 * @param searchFilter - 検索文字列
 * @returns マッチする場合true
 */
export function matchesSearchFilter(node: FileNode, searchFilter: string): boolean {
  if (!searchFilter) {
    return true
  }

  const normalizedName = node.name.toLowerCase()
  const normalizedSearch = searchFilter.toLowerCase()

  return normalizedName.includes(normalizedSearch)
}

/**
 * フィルター結果のノード数をカウント（再帰的）
 *
 * @param nodes - ファイルノードの配列
 * @returns ノードの総数（ディレクトリ含む）
 */
export function countFilteredNodes(nodes: FileNode[]): number {
  let count = 0

  for (const node of nodes) {
    count += 1

    if (node.children && node.children.length > 0) {
      count += countFilteredNodes(node.children)
    }
  }

  return count
}

/**
 * ファイルのみをカウント（ディレクトリ除外）
 *
 * @param nodes - ファイルノードの配列
 * @returns ファイルの総数
 */
export function countFilteredFiles(nodes: FileNode[]): number {
  let count = 0

  for (const node of nodes) {
    if (node.file_type === 'file') {
      count += 1
    }

    if (node.children && node.children.length > 0) {
      count += countFilteredFiles(node.children)
    }
  }

  return count
}

/**
 * ファイルツリーをフィルタリング
 *
 * 再帰的にフィルタリングを適用し、マッチするノードのみを残す
 * ディレクトリは子がある場合のみ残す
 *
 * @param nodes - ファイルノードの配列
 * @param activeFilters - アクティブなフィルタータイプの配列
 * @param options - オプション設定
 * @returns フィルタリング済みのノード配列
 */
export function filterFileTree(
  nodes: FileNode[],
  activeFilters: FilterType[],
  options?: {
    showHiddenFiles?: boolean
    searchFilter?: string
  }
): FileNode[] {
  const { showHiddenFiles = false, searchFilter = '' } = options ?? {}

  return nodes
    .map((node) => filterNode(node, activeFilters, showHiddenFiles, searchFilter))
    .filter((node): node is FileNode => node !== null)
}

/**
 * 単一ノードをフィルタリング（内部用）
 *
 * @param node - ファイルノード
 * @param activeFilters - アクティブなフィルタータイプの配列
 * @param showHiddenFiles - 隠しファイルを表示するか
 * @param searchFilter - 検索フィルター文字列
 * @returns フィルタリング済みのノード、または非表示の場合null
 */
function filterNode(
  node: FileNode,
  activeFilters: FilterType[],
  showHiddenFiles: boolean,
  searchFilter: string
): FileNode | null {
  // 隠しファイルチェック
  if (!showHiddenFiles && isHiddenFile(node)) {
    return null
  }

  // ディレクトリの場合は子を再帰的にフィルタリング
  if (node.file_type === 'directory') {
    const filteredChildren = node.children
      ? node.children
          .map((child) => filterNode(child, activeFilters, showHiddenFiles, searchFilter))
          .filter((child): child is FileNode => child !== null)
      : []

    // ディレクトリ自体がフィルターにマッチするか確認
    const directoryMatchesFilter = matchesAnyFilter(node, activeFilters)
    const directoryMatchesSearch = matchesSearchFilter(node, searchFilter)

    // ディレクトリフィルターが有効で、かつディレクトリがマッチする場合は子の有無に関わらず表示
    if (activeFilters.includes('directory') && directoryMatchesFilter && directoryMatchesSearch) {
      return {
        ...node,
        children: filteredChildren,
      }
    }

    // 子がある場合のみディレクトリを残す
    if (filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren,
      }
    }

    return null
  }

  // ファイルの場合はフィルター条件をチェック
  const matchesTypeFilter = matchesAnyFilter(node, activeFilters)
  const matchesSearch = matchesSearchFilter(node, searchFilter)

  if (matchesTypeFilter && matchesSearch) {
    return node
  }

  return null
}

/**
 * フィルター設定を配列として取得
 *
 * @returns フィルター設定の配列
 */
export function getFilterConfigList(): FilterConfig[] {
  return Object.values(FILTER_CONFIGS)
}

/**
 * 特定のフィルター設定を取得
 *
 * @param filterType - フィルタータイプ
 * @returns フィルター設定
 */
export function getFilterConfig(filterType: FilterType): FilterConfig {
  return FILTER_CONFIGS[filterType]
}
