/**
 * お気に入り/ピン留め関連の型定義
 *
 * ファイルをサイドバー上部に固定表示する機能の型を定義
 */

// ============================================================
// 基本型
// ============================================================

/**
 * お気に入りの識別子
 */
export type FavoriteId = string & { readonly __brand: 'FavoriteId' }

/**
 * お気に入りアイテムの種類
 */
export type FavoriteType = 'file' | 'directory'

/**
 * お気に入りカラー
 */
export type FavoriteColor =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'gray'

/**
 * お気に入りグループの識別子
 */
export type FavoriteGroupId = string & { readonly __brand: 'FavoriteGroupId' }

// ============================================================
// お気に入りアイテム
// ============================================================

/**
 * お気に入りアイテム
 */
export interface FavoriteItem {
  /** 一意の識別子 */
  id: FavoriteId
  /** ファイル/ディレクトリのパス */
  path: string
  /** 表示名 */
  name: string
  /** アイテムの種類 */
  type: FavoriteType
  /** カスタムアイコン（オプション） */
  icon?: string
  /** カスタムラベル（オプション、表示名を上書き） */
  customLabel?: string
  /** 追加日時（ISO 8601形式） */
  addedAt: string
  /** 最終アクセス日時（ISO 8601形式） */
  lastAccessedAt: string
  /** 表示順序 */
  order: number
  /** カラーラベル（オプション） */
  color?: FavoriteColor
  /** グループ（オプション） */
  groupId?: FavoriteGroupId
}

/**
 * お気に入りグループ
 *
 * お気に入りを論理的にグループ化する
 */
export interface FavoriteGroup {
  /** グループの一意識別子 */
  id: FavoriteGroupId
  /** グループ名 */
  name: string
  /** アイコン（オプション） */
  icon?: string
  /** 折りたたみ状態 */
  isCollapsed: boolean
  /** 表示順序 */
  order: number
  /** グループのカラー（オプション） */
  color?: FavoriteColor
}

// ============================================================
// 状態管理
// ============================================================

/**
 * お気に入り管理の状態
 */
export interface FavoriteState {
  /** お気に入りアイテムの一覧 */
  items: FavoriteItem[]
  /** お気に入りグループの一覧 */
  groups: FavoriteGroup[]
  /** ドラッグ中のアイテムID */
  draggingItemId: FavoriteId | null
  /** 読み込み中かどうか */
  isLoading: boolean
  /** エラーメッセージ */
  error: string | null
}

// ============================================================
// 入力/操作型
// ============================================================

/**
 * お気に入り追加の入力
 */
export interface AddFavoriteInput {
  /** ファイル/ディレクトリのパス */
  path: string
  /** 表示名 */
  name: string
  /** アイテムの種類 */
  type: FavoriteType
  /** カスタムラベル（オプション） */
  customLabel?: string
  /** カラーラベル（オプション） */
  color?: FavoriteColor
  /** グループID（オプション） */
  groupId?: FavoriteGroupId
}

/**
 * お気に入り更新の入力
 */
export interface UpdateFavoriteInput {
  /** カスタムラベル（オプション） */
  customLabel?: string
  /** カラーラベル（オプション） */
  color?: FavoriteColor
  /** カスタムアイコン（オプション） */
  icon?: string
  /** グループID（オプション） */
  groupId?: FavoriteGroupId | null
}

/**
 * お気に入りの並び替え入力
 */
export interface ReorderFavoriteInput {
  /** 移動するアイテムのID */
  itemId: FavoriteId
  /** 移動先のインデックス */
  newIndex: number
  /** 移動先のグループID（オプション） */
  newGroupId?: FavoriteGroupId | null
}

/**
 * グループ作成の入力
 */
export interface CreateFavoriteGroupInput {
  /** グループ名 */
  name: string
  /** アイコン（オプション） */
  icon?: string
  /** カラー（オプション） */
  color?: FavoriteColor
}

// ============================================================
// 永続化
// ============================================================

/**
 * お気に入りの永続化データ
 *
 * localStorageやファイルに保存する際のフォーマット
 */
export interface FavoritesPersistData {
  /** バージョン（マイグレーション用） */
  version: number
  /** お気に入りアイテム */
  items: FavoriteItem[]
  /** お気に入りグループ */
  groups: FavoriteGroup[]
  /** 最終更新日時 */
  updatedAt: string
}

/**
 * お気に入りデータ（永続化用）- 後方互換性のため維持
 */
export interface FavoritesData {
  /** バージョン（将来のマイグレーション用） */
  version: number
  /** お気に入りアイテムの配列 */
  items: FavoriteItem[]
}

/**
 * Rust側からのお気に入りデータ（snake_case）
 */
export interface FavoritesDataRust {
  version: number
  items: Array<{
    id: string
    path: string
    name: string
    type: 'file' | 'directory'
    icon?: string
    custom_label?: string
    added_at: string
    last_accessed_at: string
    order: number
    color?: string
    group_id?: string
  }>
  groups: Array<{
    id: string
    name: string
    icon?: string
    is_collapsed: boolean
    order: number
    color?: string
  }>
  updated_at: string
}

// ============================================================
// アクション型（Reducer用）
// ============================================================

/**
 * お気に入り操作のアクション型
 */
export type FavoriteAction =
  | { type: 'ADD_FAVORITE'; payload: AddFavoriteInput }
  | { type: 'REMOVE_FAVORITE'; payload: FavoriteId }
  | { type: 'UPDATE_FAVORITE'; payload: { id: FavoriteId; input: UpdateFavoriteInput } }
  | { type: 'REORDER_FAVORITES'; payload: ReorderFavoriteInput }
  | { type: 'CREATE_GROUP'; payload: CreateFavoriteGroupInput }
  | { type: 'DELETE_GROUP'; payload: FavoriteGroupId }
  | { type: 'UPDATE_GROUP'; payload: { id: FavoriteGroupId; name?: string; icon?: string; color?: FavoriteColor } }
  | { type: 'TOGGLE_GROUP_COLLAPSE'; payload: FavoriteGroupId }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOAD_FAVORITES'; payload: { items: FavoriteItem[]; groups: FavoriteGroup[] } }
  | { type: 'SET_DRAGGING'; payload: FavoriteId | null }
  | { type: 'ACCESS_FAVORITE'; payload: FavoriteId }

// ============================================================
// フック戻り値型
// ============================================================

/**
 * お気に入り操作のインターフェース
 */
export interface FavoriteActions {
  /** お気に入りに追加 */
  addFavorite: (path: string, name: string, type?: FavoriteType) => void
  /** お気に入りから削除（パス指定） */
  removeFavorite: (path: string) => void
  /** お気に入りから削除（ID指定） */
  removeFavoriteById: (id: FavoriteId) => void
  /** 並び替え */
  reorderFavorites: (startIndex: number, endIndex: number) => void
  /** お気に入りを更新 */
  updateFavorite: (id: FavoriteId, input: UpdateFavoriteInput) => void
  /** グループを作成 */
  createGroup: (input: CreateFavoriteGroupInput) => void
  /** グループを削除 */
  deleteGroup: (groupId: FavoriteGroupId) => void
  /** グループの折りたたみを切り替え */
  toggleGroupCollapse: (groupId: FavoriteGroupId) => void
  /** お気に入りか判定 */
  isFavorite: (path: string) => boolean
  /** アクセス日時を更新 */
  accessFavorite: (path: string) => void
}

/**
 * useFavoritesの戻り値
 */
export interface UseFavoritesReturn extends FavoriteState, FavoriteActions {
  /** グループ別にソートされたお気に入り */
  favoritesByGroup: Map<FavoriteGroupId | null, FavoriteItem[]>
  /** 最近アクセスしたお気に入り */
  recentFavorites: FavoriteItem[]
}

// ============================================================
// ヘルパー関数
// ============================================================

/**
 * パスからお気に入りIDを生成するヘルパー関数
 */
export function createFavoriteId(path: string): FavoriteId {
  return `fav-${path}` as FavoriteId
}

/**
 * お気に入りグループIDを生成するヘルパー関数
 */
export function createFavoriteGroupId(name: string): FavoriteGroupId {
  return `group-${Date.now()}-${name}` as FavoriteGroupId
}

/**
 * アイテムがお気に入りに含まれているか判定
 */
export function isFavoriteItem(items: FavoriteItem[], path: string): boolean {
  return items.some(item => item.path === path)
}

/**
 * グループ別にお気に入りを分類
 */
export function groupFavorites(
  items: FavoriteItem[]
): Map<FavoriteGroupId | null, FavoriteItem[]> {
  const grouped = new Map<FavoriteGroupId | null, FavoriteItem[]>()

  for (const item of items) {
    const groupId = item.groupId ?? null
    const existing = grouped.get(groupId) ?? []
    grouped.set(groupId, [...existing, item])
  }

  // 各グループ内をorder順にソート
  for (const [key, value] of grouped) {
    grouped.set(key, value.sort((a, b) => a.order - b.order))
  }

  return grouped
}

/**
 * Rust形式からTypeScript形式に変換
 */
export function convertFromRust(data: FavoritesDataRust): FavoritesPersistData {
  return {
    version: data.version,
    items: data.items.map(item => ({
      id: item.id as FavoriteId,
      path: item.path,
      name: item.name,
      type: item.type,
      icon: item.icon,
      customLabel: item.custom_label,
      addedAt: item.added_at,
      lastAccessedAt: item.last_accessed_at,
      order: item.order,
      color: item.color as FavoriteColor | undefined,
      groupId: item.group_id as FavoriteGroupId | undefined,
    })),
    groups: data.groups.map(group => ({
      id: group.id as FavoriteGroupId,
      name: group.name,
      icon: group.icon,
      isCollapsed: group.is_collapsed,
      order: group.order,
      color: group.color as FavoriteColor | undefined,
    })),
    updatedAt: data.updated_at,
  }
}
