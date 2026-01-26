/**
 * @fileoverview お気に入り機能の型定義
 * @module types/favorites
 */

/**
 * お気に入りアイテム
 */
export interface FavoriteItem {
  /** ファイルパス（一意識別子として使用） */
  path: string;
  /** ファイル名 */
  name: string;
  /** 表示順序 */
  order: number;
  /** 追加日時（ISO 8601形式） */
  addedAt: string;
}

/**
 * お気に入りデータ（永続化用）
 */
export interface FavoritesData {
  /** バージョン（将来のマイグレーション用） */
  version: number;
  /** お気に入りアイテムの配列 */
  items: FavoriteItem[];
}

/**
 * Rust側からのお気に入りデータ（snake_case）
 */
export interface FavoritesDataRust {
  version: number;
  items: Array<{
    path: string;
    name: string;
    order: number;
    added_at: string;
  }>;
}

/**
 * お気に入り操作のインターフェース
 */
export interface FavoriteActions {
  /** お気に入りに追加 */
  addFavorite: (path: string, name: string) => void;
  /** お気に入りから削除（パス指定） */
  removeFavorite: (path: string) => void;
  /** 並び替え */
  reorderFavorites: (startIndex: number, endIndex: number) => void;
  /** お気に入りか判定 */
  isFavorite: (path: string) => boolean;
}
