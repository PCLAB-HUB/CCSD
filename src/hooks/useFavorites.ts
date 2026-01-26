/**
 * @fileoverview お気に入り機能の状態管理フック
 * @module hooks/useFavorites
 *
 * 機能:
 * - お気に入りの追加/削除
 * - お気に入り一覧の取得
 * - 並べ替え
 * - ファイルパスからお気に入り状態を判定
 * - Tauri経由でファイルに永続化（~/.claude/dashboard-favorites.json）
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { loadFavorites, saveFavorites } from "./tauri/favorites";
import { isTauri } from "./useTauri";
import type {
  FavoriteItem,
  FavoritesData,
  FavoriteActions,
} from "../types/favorites";

interface UseFavoritesOptions {
  /** 成功メッセージを表示するコールバック */
  onSuccess?: (message: string) => void;
  /** エラーメッセージを表示するコールバック */
  onError?: (message: string) => void;
}

interface UseFavoritesReturn {
  /** お気に入りアイテム一覧 */
  favorites: FavoriteItem[];
  /** 読み込み中フラグ */
  loading: boolean;
  /** 保存中フラグ */
  saving: boolean;
  /** お気に入り数 */
  favoriteCount: number;
  /** お気に入りが空かどうか */
  isEmpty: boolean;
  /** お気に入り判定（配列検索） */
  isFavorite: (path: string) => boolean;
  /** お気に入り判定（Set使用・高速） */
  isFavoriteFast: (path: string) => boolean;
  /** お気に入りに追加 */
  addFavorite: (path: string, name: string) => Promise<boolean>;
  /** お気に入りから削除 */
  removeFavorite: (path: string) => Promise<boolean>;
  /** お気に入りのトグル */
  toggleFavorite: (path: string, name: string) => Promise<boolean>;
  /** 並べ替え */
  reorderFavorites: (startIndex: number, endIndex: number) => Promise<boolean>;
  /** 全削除 */
  clearAllFavorites: () => Promise<boolean>;
  /** 再読み込み */
  reload: () => Promise<void>;
  /** FavoriteActions形式（後方互換用） */
  actions: FavoriteActions;
}

/**
 * お気に入り機能を管理するカスタムフック
 */
export function useFavorites({
  onSuccess,
  onError,
}: UseFavoritesOptions = {}): UseFavoritesReturn {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ============================================================
  // 初期化
  // ============================================================

  /**
   * お気に入りデータを読み込む
   */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadFavorites();
      // orderでソートして設定
      const sortedItems = [...data.items].sort((a, b) => a.order - b.order);
      setFavorites(sortedItems);
    } catch {
      onError?.("お気に入りの読み込みに失敗しました");
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // 初回マウント時に読み込み
  useEffect(() => {
    loadData();
  }, [loadData]);

  // ============================================================
  // 永続化ヘルパー
  // ============================================================

  /**
   * お気に入りデータを保存する
   */
  const saveData = useCallback(
    async (items: FavoriteItem[]): Promise<boolean> => {
      if (!isTauri()) {
        // デモモードでは成功扱い
        return true;
      }

      setSaving(true);
      try {
        const data: FavoritesData = {
          version: 1,
          items,
        };
        const success = await saveFavorites(data);
        if (!success) {
          onError?.("お気に入りの保存に失敗しました");
        }
        return success;
      } catch {
        onError?.("お気に入りの保存に失敗しました");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [onError],
  );

  // ============================================================
  // お気に入り操作
  // ============================================================

  /**
   * ファイルパスがお気に入りに登録されているか判定
   * @param path - ファイルパス
   * @returns お気に入りに登録されている場合true
   */
  const isFavorite = useCallback(
    (path: string): boolean => {
      return favorites.some((item) => item.path === path);
    },
    [favorites],
  );

  /**
   * お気に入りを追加する
   * @param path - ファイルパス
   * @param name - ファイル名
   * @returns 成功時true
   */
  const addFavorite = useCallback(
    async (path: string, name: string): Promise<boolean> => {
      // 既に登録済みの場合は何もしない
      if (isFavorite(path)) {
        return true;
      }

      // 新しいアイテムを作成（最後尾に追加）
      const maxOrder =
        favorites.length > 0 ? Math.max(...favorites.map((f) => f.order)) : -1;
      const newItem: FavoriteItem = {
        path,
        name,
        order: maxOrder + 1,
        addedAt: new Date().toISOString(),
      };

      const newFavorites = [...favorites, newItem];
      setFavorites(newFavorites);

      const success = await saveData(newFavorites);
      if (success) {
        onSuccess?.("お気に入りに追加しました");
      } else {
        // 保存失敗時はロールバック
        setFavorites(favorites);
      }
      return success;
    },
    [favorites, isFavorite, saveData, onSuccess],
  );

  /**
   * お気に入りを削除する
   * @param path - ファイルパス
   * @returns 成功時true
   */
  const removeFavorite = useCallback(
    async (path: string): Promise<boolean> => {
      const index = favorites.findIndex((item) => item.path === path);
      if (index === -1) {
        return true;
      }

      const newFavorites = favorites.filter((item) => item.path !== path);
      // orderを再計算
      const reorderedFavorites = newFavorites.map((item, idx) => ({
        ...item,
        order: idx,
      }));

      setFavorites(reorderedFavorites);

      const success = await saveData(reorderedFavorites);
      if (success) {
        onSuccess?.("お気に入りから削除しました");
      } else {
        // 保存失敗時はロールバック
        setFavorites(favorites);
      }
      return success;
    },
    [favorites, saveData, onSuccess],
  );

  /**
   * お気に入りのトグル（追加/削除を切り替え）
   * @param path - ファイルパス
   * @param name - ファイル名（追加時に必要）
   * @returns 成功時true
   */
  const toggleFavorite = useCallback(
    async (path: string, name: string): Promise<boolean> => {
      if (isFavorite(path)) {
        return removeFavorite(path);
      } else {
        return addFavorite(path, name);
      }
    },
    [isFavorite, addFavorite, removeFavorite],
  );

  /**
   * お気に入りを並べ替える
   * @param startIndex - 移動元のインデックス
   * @param endIndex - 移動先のインデックス
   * @returns 成功時true
   */
  const reorderFavorites = useCallback(
    async (startIndex: number, endIndex: number): Promise<boolean> => {
      if (
        startIndex < 0 ||
        startIndex >= favorites.length ||
        endIndex < 0 ||
        endIndex >= favorites.length ||
        startIndex === endIndex
      ) {
        return false;
      }

      // 配列を複製して並べ替え
      const newFavorites = [...favorites];
      const [movedItem] = newFavorites.splice(startIndex, 1);
      newFavorites.splice(endIndex, 0, movedItem);

      // orderを再計算
      const reorderedFavorites = newFavorites.map((item, idx) => ({
        ...item,
        order: idx,
      }));

      setFavorites(reorderedFavorites);

      const success = await saveData(reorderedFavorites);
      if (!success) {
        // 保存失敗時はロールバック
        setFavorites(favorites);
      }
      return success;
    },
    [favorites, saveData],
  );

  /**
   * 全てのお気に入りをクリアする
   * @returns 成功時true
   */
  const clearAllFavorites = useCallback(async (): Promise<boolean> => {
    const previousFavorites = favorites;
    setFavorites([]);

    const success = await saveData([]);
    if (success) {
      onSuccess?.("全てのお気に入りを削除しました");
    } else {
      // 保存失敗時はロールバック
      setFavorites(previousFavorites);
    }
    return success;
  }, [favorites, saveData, onSuccess]);

  // ============================================================
  // 派生データ
  // ============================================================

  /** お気に入りの数 */
  const favoriteCount = useMemo(() => favorites.length, [favorites]);

  /** お気に入りが空かどうか */
  const isEmpty = useMemo(() => favorites.length === 0, [favorites]);

  /** お気に入りパスのセット（高速な判定用） */
  const favoritePathSet = useMemo(
    () => new Set(favorites.map((f) => f.path)),
    [favorites],
  );

  /**
   * パスがお気に入りかどうかを高速に判定（メモ化されたセット使用）
   * @param path - ファイルパス
   * @returns お気に入りに登録されている場合true
   */
  const isFavoriteFast = useCallback(
    (path: string): boolean => {
      return favoritePathSet.has(path);
    },
    [favoritePathSet],
  );

  // ============================================================
  // 後方互換用のactionsオブジェクト
  // ============================================================

  const actions: FavoriteActions = useMemo(
    () => ({
      addFavorite: (path: string, name: string) => {
        void addFavorite(path, name);
      },
      removeFavorite: (path: string) => {
        void removeFavorite(path);
      },
      reorderFavorites: (startIndex: number, endIndex: number) => {
        void reorderFavorites(startIndex, endIndex);
      },
      isFavorite,
    }),
    [addFavorite, removeFavorite, reorderFavorites, isFavorite],
  );

  return {
    // 状態
    favorites,
    loading,
    saving,
    favoriteCount,
    isEmpty,

    // 判定
    isFavorite,
    isFavoriteFast,

    // 操作
    addFavorite,
    removeFavorite,
    toggleFavorite,
    reorderFavorites,
    clearAllFavorites,
    reload: loadData,

    // 後方互換用
    actions,
  };
}

export default useFavorites;
