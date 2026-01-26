//! お気に入り操作コマンド
//!
//! ファイルのお気に入り登録、取得、削除、並べ替え機能を提供します。
//! お気に入りデータは ~/.claude/dashboard-favorites.json に保存されます。

use crate::error::AppResult;
use crate::utils::get_claude_dir;
use log::info;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

/// お気に入りアイテム
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FavoriteItem {
    /// ファイルの絶対パス
    pub path: String,
    /// 表示名（ファイル名）
    pub name: String,
    /// 登録日時（ISO 8601形式）
    pub added_at: String,
}

/// お気に入りデータ全体
#[derive(Debug, Serialize, Deserialize, Clone, Default)]
struct FavoritesData {
    /// お気に入りアイテム一覧（順序保持）
    favorites: Vec<FavoriteItem>,
}

/// お気に入りファイルのパスを取得
fn get_favorites_file_path() -> Result<PathBuf, String> {
    let claude_dir = get_claude_dir().map_err(|e| e.to_string())?;
    Ok(claude_dir.join("dashboard-favorites.json"))
}

/// お気に入りデータを読み込み
fn load_favorites() -> Result<FavoritesData, String> {
    let file_path = get_favorites_file_path()?;

    if !file_path.exists() {
        return Ok(FavoritesData::default());
    }

    let content = fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read favorites file: {e}"))?;

    serde_json::from_str::<FavoritesData>(&content)
        .map_err(|e| format!("Failed to parse favorites file: {e}"))
}

/// お気に入りデータを保存
fn save_favorites(data: &FavoritesData) -> Result<(), String> {
    let file_path = get_favorites_file_path()?;

    let json = serde_json::to_string_pretty(data)
        .map_err(|e| format!("Failed to serialize favorites: {e}"))?;

    fs::write(&file_path, json)
        .map_err(|e| format!("Failed to save favorites: {e}"))?;

    Ok(())
}

/// お気に入り一覧を取得
///
/// # Returns
///
/// お気に入りアイテムの一覧（登録順）
///
/// # Errors
///
/// - お気に入りファイルの読み込みに失敗した場合
/// - JSONパースに失敗した場合
#[tauri::command]
pub fn get_favorites() -> AppResult<Vec<FavoriteItem>> {
    let data = load_favorites()?;
    Ok(data.favorites)
}

/// お気に入りに追加
///
/// # Arguments
///
/// * `path` - 追加するファイルの絶対パス
/// * `name` - 表示名（ファイル名）
///
/// # Returns
///
/// 追加したお気に入りアイテム
///
/// # Errors
///
/// - 既に登録済みの場合
/// - お気に入りファイルの読み書きに失敗した場合
#[tauri::command]
#[allow(clippy::needless_pass_by_value)]
pub fn add_favorite(path: String, name: String) -> AppResult<FavoriteItem> {
    let mut data = load_favorites()?;

    // 既に登録済みかチェック
    if data.favorites.iter().any(|f| f.path == path) {
        return Err(format!("Already in favorites: {name}"));
    }

    let now = chrono::Local::now()
        .format("%Y-%m-%dT%H:%M:%S%.3f%z")
        .to_string();

    let item = FavoriteItem {
        path: path.clone(),
        name: name.clone(),
        added_at: now,
    };

    data.favorites.push(item.clone());
    save_favorites(&data)?;

    info!("Added to favorites: {name} ({path})");

    Ok(item)
}

/// お気に入りから削除
///
/// # Arguments
///
/// * `path` - 削除するファイルの絶対パス
///
/// # Errors
///
/// - 指定したパスがお気に入りに存在しない場合
/// - お気に入りファイルの読み書きに失敗した場合
#[tauri::command]
#[allow(clippy::needless_pass_by_value)]
pub fn remove_favorite(path: String) -> AppResult<()> {
    let mut data = load_favorites()?;

    let original_len = data.favorites.len();
    data.favorites.retain(|f| f.path != path);

    if data.favorites.len() == original_len {
        return Err(format!("Not found in favorites: {path}"));
    }

    save_favorites(&data)?;

    info!("Removed from favorites: {path}");

    Ok(())
}

/// お気に入りの並べ替え
///
/// # Arguments
///
/// * `paths` - 新しい順序でのパス一覧
///
/// # Returns
///
/// 並べ替え後のお気に入りアイテム一覧
///
/// # Note
///
/// 渡されたパス一覧に含まれないアイテムは末尾に追加されます。
///
/// # Errors
///
/// - お気に入りファイルの読み書きに失敗した場合
#[tauri::command]
#[allow(clippy::needless_pass_by_value)]
pub fn reorder_favorites(paths: Vec<String>) -> AppResult<Vec<FavoriteItem>> {
    let mut data = load_favorites()?;

    // 新しい順序でアイテムを再配置
    let mut reordered: Vec<FavoriteItem> = Vec::new();
    let mut remaining = data.favorites.clone();

    for path in &paths {
        if let Some(pos) = remaining.iter().position(|f| &f.path == path) {
            reordered.push(remaining.remove(pos));
        }
    }

    // 残りのアイテムを末尾に追加
    reordered.extend(remaining);

    data.favorites = reordered;
    save_favorites(&data)?;

    info!("Reordered favorites: {} items", data.favorites.len());

    Ok(data.favorites)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_favorites_data_default() {
        let data = FavoritesData::default();
        assert!(data.favorites.is_empty());
    }

    #[test]
    fn test_favorite_item_serialization() {
        let item = FavoriteItem {
            path: "/home/user/.claude/CLAUDE.md".to_string(),
            name: "CLAUDE.md".to_string(),
            added_at: "2024-01-01T12:00:00.000+0900".to_string(),
        };

        let json = serde_json::to_string(&item).unwrap();
        let parsed: FavoriteItem = serde_json::from_str(&json).unwrap();

        assert_eq!(parsed.path, item.path);
        assert_eq!(parsed.name, item.name);
        assert_eq!(parsed.added_at, item.added_at);
    }
}
