/**
 * ツリーフィルタ関連の型定義
 *
 * ファイルツリーの表示フィルタリング機能に使用する型を定義
 */

import type { FileNode } from './files'

// ============================================================
// フィルタータイプ
// ============================================================

/** フィルター対象の種類 */
export type FilterType =
  | 'all' // すべて表示
  | 'markdown' // .mdファイルのみ
  | 'json' // .jsonファイルのみ
  | 'skill' // スキルファイル（skills/配下）
  | 'agent' // エージェント定義
  | 'directory' // ディレクトリのみ

/** フィルタータイプの一覧（型ガード用） */
export const FILTER_TYPES: readonly FilterType[] = [
  'all',
  'markdown',
  'json',
  'skill',
  'agent',
  'directory',
] as const

/** FilterType型ガード */
export function isFilterType(value: unknown): value is FilterType {
  return typeof value === 'string' && FILTER_TYPES.includes(value as FilterType)
}

// ============================================================
// フィルター状態
// ============================================================

/** フィルター状態 */
export interface FilterState {
  /** アクティブなフィルター */
  activeFilters: FilterType[]
  /** 隠しファイル表示フラグ */
  showHiddenFiles: boolean
  /** テキストフィルター（ファイル名検索） */
  searchFilter: string
}

/** デフォルトのフィルター状態 */
export const DEFAULT_FILTER_STATE: FilterState = {
  activeFilters: ['all'],
  showHiddenFiles: false,
  searchFilter: '',
}

// ============================================================
// フィルター設定
// ============================================================

/** フィルター設定 */
export interface FilterConfig {
  /** フィルタータイプ */
  type: FilterType
  /** 表示ラベル */
  label: string
  /** アイコン名 */
  icon: string
  /** 説明 */
  description: string
  /** マッチ関数 */
  matchFn: (node: FileNode) => boolean
}

/** フィルター設定マップ型 */
export type FilterConfigMap = Record<FilterType, FilterConfig>

// ============================================================
// フィルター操作
// ============================================================

/** フィルター操作アクション */
export interface TreeFilterActions {
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
}

// ============================================================
// フック戻り値型
// ============================================================

/** useTreeFilterフックの戻り値型 */
export interface UseTreeFilterReturn extends TreeFilterActions {
  /** 現在のフィルター状態 */
  state: FilterState
  /** フィルター設定マップ */
  configs: FilterConfigMap
  /** ノードがフィルターにマッチするか判定 */
  matchesFilter: (node: FileNode) => boolean
  /** フィルター済みツリーを取得 */
  filterTree: (nodes: FileNode[]) => FileNode[]
  /** アクティブなフィルター数 */
  activeFilterCount: number
  /** フィルターが適用されているか */
  isFiltering: boolean
}

// ============================================================
// ユーティリティ関数
// ============================================================

/** フィルター状態が初期状態かどうか判定 */
export function isDefaultFilterState(state: FilterState): boolean {
  return (
    state.activeFilters.length === 1 &&
    state.activeFilters[0] === 'all' &&
    !state.showHiddenFiles &&
    state.searchFilter === ''
  )
}

/** アクティブなフィルター数を取得（'all'以外） */
export function getActiveFilterCount(state: FilterState): number {
  let count = 0

  // フィルタータイプのカウント（'all'以外）
  if (!state.activeFilters.includes('all')) {
    count += state.activeFilters.length
  }

  // テキスト検索フィルター
  if (state.searchFilter) {
    count += 1
  }

  // 隠しファイル表示（デフォルトがfalseなので、trueの場合はアクティブ）
  if (state.showHiddenFiles) {
    count += 1
  }

  return count
}

/** フィルター状態をリセット */
export function resetFilterState(): FilterState {
  return { ...DEFAULT_FILTER_STATE }
}
