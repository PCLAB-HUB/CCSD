//! カスタムテンプレート操作コマンド
//!
//! ユーザーが作成したカスタムテンプレートのCRUD操作を提供します。
//! テンプレートは ~/.claude/templates/ にJSONファイルとして保存されます。

use crate::error::AppResult;
use crate::utils::get_claude_dir;
use log::info;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

/// テンプレートフィールド定義
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TemplateField {
    /// フィールド名（変数名）
    pub name: String,
    /// 表示ラベル
    pub label: String,
    /// プレースホルダーテキスト
    pub placeholder: String,
    /// 必須フィールドかどうか
    pub required: bool,
    /// デフォルト値
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_value: Option<String>,
}

/// カスタムテンプレート
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CustomTemplate {
    /// テンプレートID（ファイル名ベース）
    pub id: String,
    /// テンプレート名
    pub name: String,
    /// 説明
    pub description: String,
    /// カテゴリ（agent, skill, command）
    pub category: String,
    /// アイコン名
    pub icon: String,
    /// テンプレート本文
    pub content: String,
    /// フィールド定義
    pub fields: Vec<TemplateField>,
    /// デフォルトファイル名パターン
    pub default_file_name: String,
    /// カスタムテンプレートフラグ
    pub is_custom: bool,
    /// 作成日時
    pub created_at: String,
    /// 更新日時
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<String>,
}

/// テンプレート保存用の入力データ
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SaveTemplateInput {
    /// テンプレート名
    pub name: String,
    /// 説明
    pub description: String,
    /// カテゴリ
    pub category: String,
    /// アイコン名
    pub icon: String,
    /// テンプレート本文
    pub content: String,
    /// フィールド定義
    pub fields: Vec<TemplateField>,
    /// デフォルトファイル名パターン
    pub default_file_name: String,
}

/// テンプレートディレクトリのパスを取得
fn get_templates_dir() -> Result<PathBuf, String> {
    let claude_dir = get_claude_dir().map_err(|e| e.to_string())?;
    Ok(claude_dir.join("templates"))
}

/// テンプレート名からIDを生成（ファイル名セーフな形式）
fn generate_template_id(name: &str) -> String {
    let sanitized: String = name
        .to_lowercase()
        .chars()
        .map(|c| if c.is_alphanumeric() || c == '-' || c == '_' { c } else { '-' })
        .collect();

    // 連続するハイフンを1つにまとめる
    let mut result = String::new();
    let mut prev_hyphen = false;
    for c in sanitized.chars() {
        if c == '-' {
            if !prev_hyphen && !result.is_empty() {
                result.push(c);
            }
            prev_hyphen = true;
        } else {
            result.push(c);
            prev_hyphen = false;
        }
    }

    // 末尾のハイフンを除去
    result.trim_end_matches('-').to_string()
}

/// カスタムテンプレートを保存
///
/// # Arguments
///
/// * `input` - 保存するテンプレートデータ
///
/// # Returns
///
/// 保存したテンプレート（IDと日時が設定済み）
#[tauri::command]
pub fn save_custom_template(input: SaveTemplateInput) -> AppResult<CustomTemplate> {
    let templates_dir = get_templates_dir()?;

    // ディレクトリが存在しない場合は作成
    if !templates_dir.exists() {
        fs::create_dir_all(&templates_dir)
            .map_err(|e| format!("Failed to create templates directory: {e}"))?;
        info!("Created templates directory: {}", templates_dir.display());
    }

    let id = generate_template_id(&input.name);
    let now = chrono::Local::now().format("%Y-%m-%dT%H:%M:%S%.3f%z").to_string();

    // 既存テンプレートがあるか確認
    let file_path = templates_dir.join(format!("{id}.json"));
    let (created_at, updated_at) = if file_path.exists() {
        // 既存テンプレートの作成日時を維持
        if let Ok(content) = fs::read_to_string(&file_path) {
            if let Ok(existing) = serde_json::from_str::<CustomTemplate>(&content) {
                (existing.created_at, Some(now.clone()))
            } else {
                (now.clone(), None)
            }
        } else {
            (now.clone(), None)
        }
    } else {
        (now.clone(), None)
    };

    let template = CustomTemplate {
        id: id.clone(),
        name: input.name,
        description: input.description,
        category: input.category,
        icon: input.icon,
        content: input.content,
        fields: input.fields,
        default_file_name: input.default_file_name,
        is_custom: true,
        created_at,
        updated_at,
    };

    // JSONとして保存
    let json = serde_json::to_string_pretty(&template)
        .map_err(|e| format!("Failed to serialize template: {e}"))?;

    fs::write(&file_path, json)
        .map_err(|e| format!("Failed to save template: {e}"))?;

    info!("Saved custom template: {} ({})", template.name, id);

    Ok(template)
}

/// カスタムテンプレート一覧を取得
///
/// ~/.claude/templates/ 配下のすべてのJSONファイルを読み込みます。
#[tauri::command]
pub fn get_custom_templates() -> AppResult<Vec<CustomTemplate>> {
    let templates_dir = get_templates_dir()?;

    if !templates_dir.exists() {
        return Ok(Vec::new());
    }

    let mut templates: Vec<CustomTemplate> = Vec::new();

    let entries = fs::read_dir(&templates_dir)
        .map_err(|e| format!("Failed to read templates directory: {e}"))?;

    for entry in entries.filter_map(|e| e.ok()) {
        let path = entry.path();

        // JSONファイルのみ処理
        if path.extension().and_then(|e| e.to_str()) != Some("json") {
            continue;
        }

        match fs::read_to_string(&path) {
            Ok(content) => {
                match serde_json::from_str::<CustomTemplate>(&content) {
                    Ok(template) => templates.push(template),
                    Err(e) => {
                        info!("Failed to parse template {}: {}", path.display(), e);
                    }
                }
            }
            Err(e) => {
                info!("Failed to read template {}: {}", path.display(), e);
            }
        }
    }

    // 作成日時の降順でソート（新しいものが先）
    templates.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    Ok(templates)
}

/// カスタムテンプレートを削除
///
/// # Arguments
///
/// * `id` - 削除するテンプレートのID
#[tauri::command]
pub fn delete_custom_template(id: String) -> AppResult<()> {
    let templates_dir = get_templates_dir()?;
    let file_path = templates_dir.join(format!("{id}.json"));

    if !file_path.exists() {
        return Err(format!("Template not found: {id}"));
    }

    fs::remove_file(&file_path)
        .map_err(|e| format!("Failed to delete template: {e}"))?;

    info!("Deleted custom template: {}", id);

    Ok(())
}

/// 特定のカスタムテンプレートを取得
///
/// # Arguments
///
/// * `id` - 取得するテンプレートのID
#[tauri::command]
pub fn get_custom_template(id: String) -> AppResult<CustomTemplate> {
    let templates_dir = get_templates_dir()?;
    let file_path = templates_dir.join(format!("{id}.json"));

    if !file_path.exists() {
        return Err(format!("Template not found: {id}"));
    }

    let content = fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read template: {e}"))?;

    serde_json::from_str::<CustomTemplate>(&content)
        .map_err(|e| format!("Failed to parse template: {e}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_template_id() {
        assert_eq!(generate_template_id("My Custom Agent"), "my-custom-agent");
        assert_eq!(generate_template_id("Test  Template!!"), "test-template");
        assert_eq!(generate_template_id("simple"), "simple");
        assert_eq!(generate_template_id("Already-Valid_Name"), "already-valid_name");
    }
}
