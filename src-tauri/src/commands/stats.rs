//! 統計データ収集コマンド
//!
//! ~/.claude/ ディレクトリ内の各種統計情報を収集して返します。

use crate::error::AppResult;
use crate::utils::get_claude_dir;
use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::time::SystemTime;
use walkdir::WalkDir;

/// ダッシュボードに表示する統計データ
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
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

/// 統計詳細の個別アイテム
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StatsDetailItem {
    /// 一意の識別子
    pub id: String,
    /// 表示名
    pub name: String,
    /// ファイルパス（該当する場合）
    pub path: Option<String>,
    /// 説明文（該当する場合）
    pub description: Option<String>,
    /// カテゴリ名（該当する場合）
    pub category: Option<String>,
    /// 追加のメタデータ
    pub metadata: Option<HashMap<String, String>>,
}

/// 統計詳細のレスポンス
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StatsDetail {
    /// 詳細の種類
    pub detail_type: String,
    /// 詳細アイテム一覧
    pub items: Vec<StatsDetailItem>,
    /// 総件数
    pub total_count: u32,
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

/// ~/.claude/ 配下の .mcp.json ファイル内のMCPサーバー定義数をカウント
/// 各 .mcp.json ファイルはオブジェクト形式でサーバーを定義している
fn count_mcp_servers(claude_dir: &Path) -> u32 {
    let mut total_servers: u32 = 0;

    // .mcp.json ファイルを再帰的に検索
    for entry in WalkDir::new(claude_dir)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| {
            e.path().is_file()
                && e.path()
                    .file_name()
                    .map(|n| n == ".mcp.json" || n == "mcp.json")
                    .unwrap_or(false)
        })
    {
        if let Ok(content) = fs::read_to_string(entry.path()) {
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                // 各 .mcp.json ファイルのトップレベルキー数をカウント
                // 例: {"context7": {...}, "another-server": {...}} -> 2
                if let Some(obj) = json.as_object() {
                    total_servers += obj.len() as u32;
                }
            }
        }
    }

    total_servers
}

/// インストール済みプラグイン数をカウント
/// plugins/installed_plugins.json 内の plugins オブジェクトのキー数をカウント
fn count_plugins(claude_dir: &Path) -> u32 {
    let installed_path = claude_dir
        .join("plugins")
        .join("installed_plugins.json");

    if !installed_path.exists() {
        return 0;
    }

    fs::read_to_string(&installed_path)
        .ok()
        .and_then(|content| serde_json::from_str::<serde_json::Value>(&content).ok())
        .and_then(|json| json.get("plugins").cloned())
        .and_then(|plugins| plugins.as_object().map(|obj| obj.len() as u32))
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

/// SKILL.md ファイルから frontmatter の description を抽出
fn extract_skill_description(content: &str) -> Option<String> {
    // YAML frontmatter を解析（---で囲まれた部分）
    if !content.starts_with("---") {
        return None;
    }

    let parts: Vec<&str> = content.splitn(3, "---").collect();
    if parts.len() < 3 {
        return None;
    }

    let frontmatter = parts[1];
    for line in frontmatter.lines() {
        let line = line.trim();
        if line.starts_with("description:") {
            let desc = line.strip_prefix("description:")?.trim();
            // クォートを除去
            let desc = desc.trim_matches('"').trim_matches('\'');
            return Some(desc.to_string());
        }
    }
    None
}

/// skills/ 内の SKILL.md ファイル一覧を取得
fn get_skills_detail(claude_dir: &Path) -> Vec<StatsDetailItem> {
    let skills_dir = claude_dir.join("skills");
    if !skills_dir.exists() {
        return Vec::new();
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
        .map(|entry| {
            let path = entry.path();
            let path_str = path.to_string_lossy().to_string();

            // スキル名（親ディレクトリ名またはファイルパスから推測）
            let name = path
                .parent()
                .and_then(|p| p.file_name())
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_else(|| "unknown".to_string());

            // description を frontmatter から抽出
            let description = fs::read_to_string(path)
                .ok()
                .and_then(|content| extract_skill_description(&content));

            StatsDetailItem {
                id: path_str.clone(),
                name,
                path: Some(path_str),
                description,
                category: None,
                metadata: None,
            }
        })
        .collect()
}

/// agents/categories/ 内のサブエージェント一覧を取得
fn get_sub_agents_detail(claude_dir: &Path) -> Vec<StatsDetailItem> {
    let categories_dir = claude_dir.join("agents").join("categories");
    if !categories_dir.exists() {
        return Vec::new();
    }

    WalkDir::new(&categories_dir)
        .min_depth(2)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| {
            e.path().is_file()
                && e.path()
                    .extension()
                    .map(|ext| ext == "md")
                    .unwrap_or(false)
        })
        .map(|entry| {
            let path = entry.path();
            let path_str = path.to_string_lossy().to_string();

            // ファイル名から .md を除去
            let name = path
                .file_stem()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_else(|| "unknown".to_string());

            // 親ディレクトリ名（カテゴリ）
            let category = path
                .parent()
                .and_then(|p| p.file_name())
                .map(|n| n.to_string_lossy().to_string());

            StatsDetailItem {
                id: path_str.clone(),
                name,
                path: Some(path_str),
                description: None,
                category,
                metadata: None,
            }
        })
        .collect()
}

/// agents/categories/ 内のカテゴリ一覧を取得
fn get_categories_detail(claude_dir: &Path) -> Vec<StatsDetailItem> {
    let categories_dir = claude_dir.join("agents").join("categories");
    if !categories_dir.exists() {
        return Vec::new();
    }

    fs::read_dir(&categories_dir)
        .map(|entries| {
            entries
                .filter_map(|e| e.ok())
                .filter(|e| e.path().is_dir())
                .map(|entry| {
                    let path = entry.path();
                    let name = path
                        .file_name()
                        .map(|n| n.to_string_lossy().to_string())
                        .unwrap_or_else(|| "unknown".to_string());

                    // このカテゴリ内のエージェント数をカウント
                    let agent_count = fs::read_dir(&path)
                        .map(|entries| {
                            entries
                                .filter_map(|e| e.ok())
                                .filter(|e| {
                                    e.path().is_file()
                                        && e.path()
                                            .extension()
                                            .map(|ext| ext == "md")
                                            .unwrap_or(false)
                                })
                                .count()
                        })
                        .unwrap_or(0);

                    let mut metadata = HashMap::new();
                    metadata.insert("agentCount".to_string(), agent_count.to_string());

                    StatsDetailItem {
                        id: name.clone(),
                        name: name.clone(),
                        path: Some(path.to_string_lossy().to_string()),
                        description: None,
                        category: None,
                        metadata: Some(metadata),
                    }
                })
                .collect()
        })
        .unwrap_or_default()
}

/// .mcp.json 内のMCPサーバー一覧を取得
/// セキュリティのため、サーバー名のみを返す
fn get_mcp_servers_detail(claude_dir: &Path) -> Vec<StatsDetailItem> {
    let mut items = Vec::new();

    for entry in WalkDir::new(claude_dir)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| {
            e.path().is_file()
                && e.path()
                    .file_name()
                    .map(|n| n == ".mcp.json" || n == "mcp.json")
                    .unwrap_or(false)
        })
    {
        let file_path = entry.path().to_string_lossy().to_string();
        if let Ok(content) = fs::read_to_string(entry.path()) {
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                if let Some(obj) = json.as_object() {
                    for key in obj.keys() {
                        items.push(StatsDetailItem {
                            id: format!("{}:{}", file_path, key),
                            name: key.clone(),
                            path: Some(file_path.clone()),
                            description: None,
                            category: None,
                            metadata: None,
                        });
                    }
                }
            }
        }
    }

    items
}

/// installed_plugins.json 内のプラグイン一覧を取得
fn get_plugins_detail(claude_dir: &Path) -> Vec<StatsDetailItem> {
    let installed_path = claude_dir
        .join("plugins")
        .join("installed_plugins.json");

    if !installed_path.exists() {
        return Vec::new();
    }

    let content = match fs::read_to_string(&installed_path) {
        Ok(c) => c,
        Err(_) => return Vec::new(),
    };

    let json: serde_json::Value = match serde_json::from_str(&content) {
        Ok(j) => j,
        Err(_) => return Vec::new(),
    };

    let plugins = match json.get("plugins").and_then(|p| p.as_object()) {
        Some(p) => p,
        None => return Vec::new(),
    };

    plugins
        .iter()
        .map(|(name, value)| {
            let mut metadata = HashMap::new();

            // バージョン情報を取得
            if let Some(version) = value.get("version").and_then(|v| v.as_str()) {
                metadata.insert("version".to_string(), version.to_string());
            }

            // 有効/無効状態を取得
            if let Some(enabled) = value.get("enabled").and_then(|v| v.as_bool()) {
                metadata.insert("enabled".to_string(), enabled.to_string());
            }

            StatsDetailItem {
                id: name.clone(),
                name: name.clone(),
                path: Some(installed_path.to_string_lossy().to_string()),
                description: value.get("description").and_then(|d| d.as_str()).map(String::from),
                category: None,
                metadata: if metadata.is_empty() { None } else { Some(metadata) },
            }
        })
        .collect()
}

/// backups/ 内のファイル一覧を取得
fn get_backups_detail(claude_dir: &Path) -> Vec<StatsDetailItem> {
    let backups_dir = claude_dir.join("backups");
    if !backups_dir.exists() {
        return Vec::new();
    }

    WalkDir::new(&backups_dir)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.path().is_file())
        .map(|entry| {
            let path = entry.path();
            let path_str = path.to_string_lossy().to_string();
            let name = path
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_else(|| "unknown".to_string());

            let mut metadata = HashMap::new();

            // ファイルサイズを取得
            if let Ok(meta) = entry.metadata() {
                metadata.insert("size".to_string(), meta.len().to_string());

                // 更新日時を取得
                if let Ok(modified) = meta.modified() {
                    metadata.insert("date".to_string(), format_system_time(modified));
                }
            }

            StatsDetailItem {
                id: path_str.clone(),
                name,
                path: Some(path_str),
                description: None,
                category: None,
                metadata: if metadata.is_empty() { None } else { Some(metadata) },
            }
        })
        .collect()
}

/// ~/.claude/ 配下の全ファイル一覧を取得（上限100件）
const TOTAL_FILES_LIMIT: usize = 100;

fn get_total_files_detail(claude_dir: &Path) -> (Vec<StatsDetailItem>, u32) {
    let mut items = Vec::new();
    let mut total_count: u32 = 0;

    for entry in WalkDir::new(claude_dir)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.path().is_file())
    {
        total_count += 1;

        if items.len() < TOTAL_FILES_LIMIT {
            let path = entry.path();
            let path_str = path.to_string_lossy().to_string();
            let name = path
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_else(|| "unknown".to_string());

            let mut metadata = HashMap::new();

            if let Ok(meta) = entry.metadata() {
                metadata.insert("size".to_string(), meta.len().to_string());
            }

            items.push(StatsDetailItem {
                id: path_str.clone(),
                name,
                path: Some(path_str),
                description: None,
                category: None,
                metadata: if metadata.is_empty() { None } else { Some(metadata) },
            });
        }
    }

    (items, total_count)
}

/// 統計詳細を取得
///
/// 指定された種類の統計詳細を返します:
/// - `skills` - スキル一覧
/// - `subAgents` - サブエージェント一覧
/// - `categories` - カテゴリ一覧
/// - `mcpServers` - MCPサーバー一覧
/// - `plugins` - プラグイン一覧
/// - `backups` - バックアップ一覧
/// - `totalFiles` - 全ファイル一覧（上限100件）
#[tauri::command]
pub fn get_stats_detail(detail_type: String) -> AppResult<StatsDetail> {
    let claude_dir = get_claude_dir().map_err(|e| e.to_string())?;

    if !claude_dir.exists() {
        return Err("~/.claude directory not found".to_string());
    }

    let (items, total_count) = match detail_type.as_str() {
        "skills" => {
            let items = get_skills_detail(&claude_dir);
            let count = items.len() as u32;
            (items, count)
        }
        "subAgents" => {
            let items = get_sub_agents_detail(&claude_dir);
            let count = items.len() as u32;
            (items, count)
        }
        "categories" => {
            let items = get_categories_detail(&claude_dir);
            let count = items.len() as u32;
            (items, count)
        }
        "mcpServers" => {
            let items = get_mcp_servers_detail(&claude_dir);
            let count = items.len() as u32;
            (items, count)
        }
        "plugins" => {
            let items = get_plugins_detail(&claude_dir);
            let count = items.len() as u32;
            (items, count)
        }
        "backups" => {
            let items = get_backups_detail(&claude_dir);
            let count = items.len() as u32;
            (items, count)
        }
        "totalFiles" => get_total_files_detail(&claude_dir),
        _ => return Err(format!("Unknown detail type: {}", detail_type)),
    };

    Ok(StatsDetail {
        detail_type,
        items,
        total_count,
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

    #[test]
    fn test_extract_skill_description_with_valid_frontmatter() {
        let content = r#"---
name: test-skill
description: "This is a test skill"
---
# Test Skill
Content here"#;
        let desc = extract_skill_description(content);
        assert_eq!(desc, Some("This is a test skill".to_string()));
    }

    #[test]
    fn test_extract_skill_description_with_single_quotes() {
        let content = r#"---
description: 'Single quoted description'
---
Content"#;
        let desc = extract_skill_description(content);
        assert_eq!(desc, Some("Single quoted description".to_string()));
    }

    #[test]
    fn test_extract_skill_description_without_frontmatter() {
        let content = "# No frontmatter\nJust content";
        let desc = extract_skill_description(content);
        assert_eq!(desc, None);
    }

    #[test]
    fn test_extract_skill_description_without_description() {
        let content = r#"---
name: no-description-skill
---
Content"#;
        let desc = extract_skill_description(content);
        assert_eq!(desc, None);
    }

    #[test]
    fn test_stats_detail_item_creation() {
        let item = StatsDetailItem {
            id: "test-id".to_string(),
            name: "Test Item".to_string(),
            path: Some("/path/to/file".to_string()),
            description: Some("A description".to_string()),
            category: Some("test-category".to_string()),
            metadata: None,
        };
        assert_eq!(item.id, "test-id");
        assert_eq!(item.name, "Test Item");
        assert!(item.path.is_some());
        assert!(item.description.is_some());
        assert!(item.category.is_some());
        assert!(item.metadata.is_none());
    }

    #[test]
    fn test_stats_detail_creation() {
        let detail = StatsDetail {
            detail_type: "skills".to_string(),
            items: vec![],
            total_count: 0,
        };
        assert_eq!(detail.detail_type, "skills");
        assert!(detail.items.is_empty());
        assert_eq!(detail.total_count, 0);
    }

    #[test]
    fn test_total_files_limit() {
        // 定数が正しく設定されているか確認
        assert_eq!(TOTAL_FILES_LIMIT, 100);
    }
}
