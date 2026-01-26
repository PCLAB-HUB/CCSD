/**
 * @fileoverview お気に入り関連のTauri API
 * @module hooks/tauri/favorites
 *
 * お気に入りデータは ~/.claude/dashboard-favorites.json に永続化される
 */

import { invoke } from "@tauri-apps/api/core";
import type { FavoritesData, FavoritesDataRust } from "../../types/favorites";
import { isTauri } from "./utils";

/** お気に入りファイルのパス */
const FAVORITES_PATH = "~/.claude/dashboard-favorites.json";

/** 初期お気に入りデータ */
const INITIAL_FAVORITES_DATA: FavoritesData = {
  version: 1,
  items: [],
};

// ============================================================
// ヘルパー関数
// ============================================================

/**
 * Rust側のsnake_caseデータをcamelCaseに変換
 */
function convertFromRust(data: FavoritesDataRust): FavoritesData {
  return {
    version: data.version,
    items: data.items.map((item) => ({
      path: item.path,
      name: item.name,
      order: item.order,
      addedAt: item.added_at,
    })),
  };
}

/**
 * camelCaseデータをRust側のsnake_caseに変換
 */
function convertToRust(data: FavoritesData): FavoritesDataRust {
  return {
    version: data.version,
    items: data.items.map((item) => ({
      path: item.path,
      name: item.name,
      order: item.order,
      added_at: item.addedAt,
    })),
  };
}

// ============================================================
// お気に入りファイル操作
// ============================================================

/**
 * お気に入りデータを読み込む
 * @returns お気に入りデータ（エラー時または未存在時は初期データ）
 */
export async function loadFavorites(): Promise<FavoritesData> {
  if (!isTauri()) {
    return INITIAL_FAVORITES_DATA;
  }

  try {
    const result = await invoke<{ content: string } | null>("read_file", {
      path: FAVORITES_PATH,
    });

    if (!result || !result.content) {
      return INITIAL_FAVORITES_DATA;
    }

    const parsed = JSON.parse(result.content) as FavoritesDataRust;
    return convertFromRust(parsed);
  } catch {
    // ファイルが存在しない、またはパースエラーの場合
    return INITIAL_FAVORITES_DATA;
  }
}

/**
 * お気に入りデータを保存する
 * @param data - 保存するお気に入りデータ
 * @returns 成功時true、失敗時false
 */
export async function saveFavorites(data: FavoritesData): Promise<boolean> {
  if (!isTauri()) {
    return false;
  }

  try {
    const rustData = convertToRust(data);
    const content = JSON.stringify(rustData, null, 2);

    // create_fileを使用（ファイルが存在しない場合でも作成される）
    await invoke("create_file", {
      path: FAVORITES_PATH,
      content,
    });

    return true;
  } catch (error) {
    console.error("Failed to save favorites:", error);
    return false;
  }
}
