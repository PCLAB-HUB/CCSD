/**
 * @fileoverview お気に入り関連のTauri API
 * @module hooks/tauri/favorites
 *
 * お気に入りデータは ~/.claude/dashboard-favorites.json に永続化される
 *
 * データ形式:
 * - Rust側のコマンド（get_favorites, add_favorite等）を使用
 * - 独自のJSON読み書きも可能（互換性のため両方サポート）
 */

import { invoke } from '@tauri-apps/api/core'

import { isTauri } from './utils'

import type { FavoriteItem, FavoritesData } from '../../types/favorites'

/** お気に入りファイルのパス */
const FAVORITES_PATH = "~/.claude/dashboard-favorites.json";

/** 初期お気に入りデータ */
const INITIAL_FAVORITES_DATA: FavoritesData = {
  version: 1,
  items: [],
};

/**
 * Rust側から返されるFavoriteItem型
 */
interface RustFavoriteItem {
  path: string;
  name: string;
  added_at: string;
}

// ============================================================
// お気に入りファイル操作
// ============================================================

/**
 * お気に入りデータを読み込む
 * @returns お気に入りデータ（エラー時または未存在時は初期データ）
 *
 * 優先順位:
 * 1. Rust側のget_favoritesコマンドを試行
 * 2. 失敗時はread_fileでJSONを直接読み込み
 */
export async function loadFavorites(): Promise<FavoritesData> {
  if (!isTauri()) {
    return INITIAL_FAVORITES_DATA;
  }

  try {
    // まずRust側の専用コマンドを使用
    const items = await invoke<RustFavoriteItem[]>("get_favorites");

    // Rust側のデータをTypeScript形式に変換
    const convertedItems: FavoriteItem[] = items.map((item, index) => ({
      path: item.path,
      name: item.name,
      order: index, // 配列のインデックスをorderとして使用
      addedAt: item.added_at,
    }));

    return {
      version: 1,
      items: convertedItems,
    };
  } catch (rustError) {
    // Rustコマンドが失敗した場合、JSONファイルを直接読み込む（フォールバック）
    try {
      const result = await invoke<{ content: string } | null>("read_file", {
        path: FAVORITES_PATH,
      });

      if (!result || !result.content) {
        return INITIAL_FAVORITES_DATA;
      }

      const parsed = JSON.parse(result.content);

      // 様々なデータ形式に対応
      if (parsed.items && Array.isArray(parsed.items)) {
        // 新形式: { version, items }
        return {
          version: parsed.version || 1,
          items: parsed.items.map(
            (
              item: {
                path: string;
                name: string;
                order?: number;
                added_at?: string;
                addedAt?: string;
              },
              index: number
            ) => ({
              path: item.path,
              name: item.name,
              order: item.order ?? index,
              addedAt: item.added_at || item.addedAt || new Date().toISOString(),
            })
          ),
        };
      } else if (parsed.favorites && Array.isArray(parsed.favorites)) {
        // Rust形式: { favorites }
        return {
          version: 1,
          items: parsed.favorites.map(
            (
              item: { path: string; name: string; added_at?: string },
              index: number
            ) => ({
              path: item.path,
              name: item.name,
              order: index,
              addedAt: item.added_at || new Date().toISOString(),
            })
          ),
        };
      }

      return INITIAL_FAVORITES_DATA;
    } catch {
      // ファイルが存在しない、またはパースエラーの場合
      console.warn("Failed to load favorites:", rustError);
      return INITIAL_FAVORITES_DATA;
    }
  }
}

/**
 * お気に入りデータを保存する
 * @param data - 保存するお気に入りデータ
 * @returns 成功時true、失敗時false
 *
 * 両方の形式で保存:
 * 1. TypeScript形式のJSON（version + items）
 * 2. これにより他のコンポーネントとの互換性を維持
 */
export async function saveFavorites(data: FavoritesData): Promise<boolean> {
  if (!isTauri()) {
    return false;
  }

  try {
    // TypeScript形式でJSONを保存（version + items）
    // Rust側のコマンドと互換性を保つため、両方の形式を含める
    const saveData = {
      version: data.version,
      items: data.items.map((item) => ({
        path: item.path,
        name: item.name,
        order: item.order,
        added_at: item.addedAt,
      })),
      // Rust側との互換性のため favorites キーも追加
      favorites: data.items.map((item) => ({
        path: item.path,
        name: item.name,
        added_at: item.addedAt,
      })),
    };

    const content = JSON.stringify(saveData, null, 2);

    // write_fileを使用（既存ファイルを上書き）
    // create_fileは既存ファイルがあるとエラーになるため
    try {
      await invoke("write_file", {
        path: FAVORITES_PATH,
        content,
      });
    } catch {
      // write_fileが失敗した場合（ファイルが存在しない場合）、create_fileを試行
      await invoke("create_file", {
        path: FAVORITES_PATH,
        content,
      });
    }

    return true;
  } catch (error) {
    console.error("Failed to save favorites:", error);
    return false;
  }
}
