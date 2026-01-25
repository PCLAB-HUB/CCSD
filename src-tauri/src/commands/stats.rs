//! 統計データ収集コマンド
//!
//! ~/.claude/ ディレクトリ内の各種統計情報を収集して返します。

use crate::error::AppResult;
use crate::utils::get_claude_dir;
use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::time::SystemTime;
use walkdir::WalkDir;

/// ダッシュボードに表示する統計データ
#[derive(Debug, Serialize, Deserialize)]
pub struct Stats {
    /// サブエージェント数（agents/categories/*/*.md）
    pub sub_agent_count: u32,
    /// カテゴリ数（agents/categories/ 内のディレクトリ数）
    pub category_count: u32,
    /// スキル数（skills/ 内の SKILL.md ファイル数）
    pub skill_count: u32,
    /// MCPサーバー数（settings.json の mcpServers キー数）
    pub mcp_server_count: u32,
    /// プラグイン数（settings.json の enabledPlugins 配列長）
    pub plugin_count: u32,
    /// バックアップ数（backups/ 内のファイル数）
    pub backup_count: u32,
    /// 総ファイル数（~/.claude/ 配下の全ファイル）
    pub total_file_count: u32,
    /// 最終更新日時（最も新しいファイルの更新日時）
    pub last_updated: Option<String>,
}

/// agents/categories/ 内の .md ファイル数をカウント
fn count_sub_agents(claude_dir: &Path) -> u32 {
    let categories_dir = claude_dir.join("agents").join("categories");
    if !categories_dir.exists() {
        return 0;
    }

    WalkDir::new(&categories_dir)
        .min_depth(2) // categories/*/
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| {
            e.path().is_file()
                && e.path()
                    .extension()
                    .map(|ext| ext == "md")
                    .unwrap_or(false)
        })
        .count() as u32
}

/// agents/categories/ 内のディレクトリ数をカウント
fn count_categories(claude_dir: &Path) -> u32 {
    let categories_dir = claude_dir.join("agents").join("categories");
    if !categories_dir.exists() {
        return 0;
    }

    fs::read_dir(&categories_dir)
        .map(|entries| {
            entries
                .filter_map(|e| e.ok())
                .filter(|e| e.path().is_dir())
                .count() as u32
        })
        .unwrap_or(0)
}

/// skills/ 内の SKILL.md ファイル数をカウント
fn count_skills(claude_dir: &Path) -> u32 {
    let skills_dir = claude_dir.join("skills");
    if !skills_dir.exists() {
        return 0;
    }

    WalkDir::new(&skills_dir)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| {
            e.path().is_file()
                && e.path()
                    .file_name()
                    .map(|n| n == "SKILL.md")
                    .unwrap_or(false)
        })
        .count() as u32
}

/// settings.json から mcpServers のキー数を取得
fn count_mcp_servers(claude_dir: &Path) -> u32 {
    let settings_path = claude_dir.join("settings.json");
    if !settings_path.exists() {
        return 0;
    }

    fs::read_to_string(&settings_path)
        .ok()
        .and_then(|content| serde_json::from_str::<serde_json::Value>(&content).ok())
        .and_then(|json| json.get("mcpServers").cloned())
        .and_then(|servers| servers.as_object().map(|obj| obj.len() as u32))
        .unwrap_or(0)
}

/// settings.json から enabledPlugins の配列長を取得
fn count_plugins(claude_dir: &Path) -> u32 {
    let settings_path = claude_dir.join("settings.json");
    if !settings_path.exists() {
        return 0;
    }

    fs::read_to_string(&settings_path)
        .ok()
        .and_then(|content| serde_json::from_str::<serde_json::Value>(&content).ok())
        .and_then(|json| json.get("enabledPlugins").cloned())
        .and_then(|plugins| plugins.as_array().map(|arr| arr.len() as u32))
        .unwrap_or(0)
}

/// backups/ 内のファイル数をカウント
fn count_backups(claude_dir: &Path) -> u32 {
    let backups_dir = claude_dir.join("backups");
    if !backups_dir.exists() {
        return 0;
    }

    WalkDir::new(&backups_dir)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.path().is_file())
        .count() as u32
}

/// ~/.claude/ 配下の全ファイル数をカウントし、最新の更新日時も取得
fn count_total_files_and_last_updated(claude_dir: &Path) -> (u32, Option<SystemTime>) {
    let mut count: u32 = 0;
    let mut latest_time: Option<SystemTime> = None;

    for entry in WalkDir::new(claude_dir)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.path().is_file())
    {
        count += 1;

        if let Ok(metadata) = entry.metadata() {
            if let Ok(modified) = metadata.modified() {
                latest_time = Some(match latest_time {
                    Some(current) if modified > current => modified,
                    Some(current) => current,
                    None => modified,
                });
            }
        }
    }

    (count, latest_time)
}

/// SystemTime を ISO8601 形式の文字列に変換
fn format_system_time(time: SystemTime) -> String {
    let datetime: DateTime<Local> = time.into();
    datetime.format("%Y-%m-%dT%H:%M:%S%:z").to_string()
}

/// 統計データを取得
///
/// ~/.claude/ ディレクトリ内の以下の統計を収集して返します:
/// - サブエージェント数
/// - カテゴリ数
/// - スキル数
/// - MCPサーバー数
/// - プラグイン数
/// - バックアップ数
/// - 総ファイル数
/// - 最終更新日時
#[tauri::command]
pub fn get_stats() -> AppResult<Stats> {
    let claude_dir = get_claude_dir().map_err(|e| e.to_string())?;

    if !claude_dir.exists() {
        return Err("~/.claude directory not found".to_string());
    }

    let sub_agent_count = count_sub_agents(&claude_dir);
    let category_count = count_categories(&claude_dir);
    let skill_count = count_skills(&claude_dir);
    let mcp_server_count = count_mcp_servers(&claude_dir);
    let plugin_count = count_plugins(&claude_dir);
    let backup_count = count_backups(&claude_dir);
    let (total_file_count, last_updated_time) = count_total_files_and_last_updated(&claude_dir);

    let last_updated = last_updated_time.map(format_system_time);

    Ok(Stats {
        sub_agent_count,
        category_count,
        skill_count,
        mcp_server_count,
        plugin_count,
        backup_count,
        total_file_count,
        last_updated,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_system_time() {
        let time = SystemTime::now();
        let formatted = format_system_time(time);
        // ISO8601形式になっているかチェック
        assert!(formatted.contains('T'));
        assert!(formatted.len() >= 19); // "YYYY-MM-DDTHH:MM:SS"
    }
}
