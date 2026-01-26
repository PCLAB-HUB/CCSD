//! ファイル操作コマンド
//!
//! ファイルツリーの取得、ファイルの読み書き、検索などの機能を提供します。

use crate::error::AppResult;
use crate::types::{FileContent, FileNode, ReplaceResult};
use crate::utils::{
    get_claude_dir, is_allowed_extension, is_excluded_path, validate_path_security,
    ALLOWED_EXTENSIONS, EXCLUDED_DIRS,
};
use log::info;
use regex::{Regex, RegexBuilder};
use std::cmp::Ordering;
use std::fs;
use std::path::PathBuf;
use walkdir::WalkDir;

/// ファイルツリーを再帰的に構築
///
/// # Arguments
///
/// * `path` - 構築を開始するパス
/// * `max_depth` - 最大深度
/// * `current_depth` - 現在の深度
///
/// # Returns
///
/// ファイルノード。除外対象や深度超過の場合は`None`
fn build_file_tree(path: &PathBuf, max_depth: usize, current_depth: usize) -> Option<FileNode> {
    if current_depth > max_depth {
        return None;
    }

    let name = path.file_name()?.to_str()?.to_string();

    // 除外するディレクトリ
    if EXCLUDED_DIRS.contains(&name.as_str()) {
        return None;
    }

    if path.is_dir() {
        let mut children: Vec<FileNode> = Vec::new();

        if let Ok(entries) = fs::read_dir(path) {
            let mut entries: Vec<_> = entries.filter_map(|e| e.ok()).collect();
            entries.sort_by(|a, b| {
                let a_is_dir = a.path().is_dir();
                let b_is_dir = b.path().is_dir();
                match (a_is_dir, b_is_dir) {
                    (true, false) => Ordering::Less,
                    (false, true) => Ordering::Greater,
                    _ => a.file_name().cmp(&b.file_name()),
                }
            });

            for entry in entries {
                if let Some(child) = build_file_tree(&entry.path(), max_depth, current_depth + 1) {
                    children.push(child);
                }
            }
        }

        Some(FileNode::new_directory(
            name,
            path.to_string_lossy().to_string(),
            children,
        ))
    } else {
        // .md, .json, .jsonl ファイルのみ
        if is_allowed_extension(path) {
            Some(FileNode::new_file(
                name,
                path.to_string_lossy().to_string(),
            ))
        } else {
            None
        }
    }
}

/// ファイルツリーを取得
///
/// ~/.claude/ ディレクトリ配下のファイル構造を返します。
/// 除外ディレクトリ（cache, backupsなど）は含まれません。
#[tauri::command]
pub fn get_file_tree() -> AppResult<Vec<FileNode>> {
    let claude_dir = get_claude_dir().map_err(|e| e.to_string())?;

    if !claude_dir.exists() {
        return Err("~/.claude directory not found".to_string());
    }

    let mut nodes: Vec<FileNode> = Vec::new();

    // トップレベルのファイルとディレクトリを取得
    let entries = fs::read_dir(&claude_dir)
        .map_err(|e| format!("Failed to read ~/.claude directory: {e}"))?;

    let mut entries: Vec<_> = entries.filter_map(|e| e.ok()).collect();
    entries.sort_by(|a, b| {
        let a_is_dir = a.path().is_dir();
        let b_is_dir = b.path().is_dir();
        match (a_is_dir, b_is_dir) {
            (true, false) => Ordering::Greater,
            (false, true) => Ordering::Less,
            _ => a.file_name().cmp(&b.file_name()),
        }
    });

    for entry in entries {
        if let Some(node) = build_file_tree(&entry.path(), 10, 0) {
            nodes.push(node);
        }
    }

    Ok(nodes)
}

/// ファイルを読み込む
///
/// # Arguments
///
/// * `path` - 読み込むファイルのパス
///
/// # Returns
///
/// ファイルの内容とメタデータ
///
/// # Security
///
/// ~/.claude/ 配下のファイルのみアクセス可能です。
#[tauri::command]
pub fn read_file(path: String) -> AppResult<FileContent> {
    let path_buf = PathBuf::from(&path);
    let claude_dir = get_claude_dir().map_err(|e| e.to_string())?;

    // セキュリティチェック
    validate_path_security(&path_buf, &claude_dir).map_err(|e| e.to_string())?;

    let content =
        fs::read_to_string(&path_buf).map_err(|e| format!("Failed to read file: {e}"))?;

    let name = path_buf
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();

    Ok(FileContent { path, content, name })
}

/// ファイルを書き込む
///
/// # Arguments
///
/// * `path` - 書き込むファイルのパス（~/.claude/で始まる形式も可）
/// * `content` - 書き込む内容
///
/// # Security
///
/// ~/.claude/ 配下のファイルのみアクセス可能です。
/// 書き込み前に自動的にバックアップが作成されます。
#[tauri::command]
pub fn write_file(path: String, content: String) -> AppResult<()> {
    let claude_dir = get_claude_dir().map_err(|e| e.to_string())?;

    // パスを正規化（~/.claude/ プレフィックスをサポート）
    let path_buf = if path.starts_with("~/.claude/") {
        match path.strip_prefix("~/.claude/") {
            Some(suffix) => claude_dir.join(suffix),
            None => return Err("パスの正規化に失敗しました: ~/.claude/ プレフィックスの処理エラー".to_string()),
        }
    } else if path.starts_with(&claude_dir.to_string_lossy().to_string()) {
        PathBuf::from(&path)
    } else {
        PathBuf::from(&path)
    };

    // セキュリティチェック
    validate_path_security(&path_buf, &claude_dir).map_err(|e| e.to_string())?;

    // バックアップを作成（元のパスではなく正規化されたパスを使用）
    let normalized_path = path_buf.to_string_lossy().to_string();
    crate::commands::backup::create_backup(&normalized_path)?;

    fs::write(&path_buf, content).map_err(|e| format!("Failed to write file: {e}"))
}

/// 新規ファイルを作成
///
/// # Arguments
///
/// * `path` - 作成するファイルのパス（~/.claude/で始まる形式も可）
/// * `content` - 初期内容
///
/// # Errors
///
/// - ファイルが既に存在する場合
/// - ~/.claude/ 配下でないパスの場合
#[tauri::command]
pub fn create_file(path: String, content: String) -> AppResult<()> {
    let claude_dir = get_claude_dir().map_err(|e| e.to_string())?;

    // パスを正規化
    let path_buf = if path.starts_with("~/.claude/") {
        match path.strip_prefix("~/.claude/") {
            Some(suffix) => claude_dir.join(suffix),
            None => return Err("パスの正規化に失敗しました: ~/.claude/ プレフィックスの処理エラー".to_string()),
        }
    } else if path.starts_with(&claude_dir.to_string_lossy().to_string()) {
        PathBuf::from(&path)
    } else {
        return Err("アクセス拒否: ~/.claude/ 配下のファイルのみ許可されています".to_string());
    };

    // セキュリティチェック
    validate_path_security(&path_buf, &claude_dir).map_err(|e| e.to_string())?;

    // ファイルが既に存在する場合はエラー
    if path_buf.exists() {
        return Err("File already exists. Use write_file to update existing files.".to_string());
    }

    // 親ディレクトリを作成
    if let Some(parent) = path_buf.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory: {e}"))?;
            info!("Created directory: {}", parent.display());
        }
    }

    // ファイルを作成
    fs::write(&path_buf, content).map_err(|e| format!("Failed to create file: {e}"))?;

    info!("Created new file: {}", path_buf.display());
    Ok(())
}

/// ファイルを検索
///
/// ファイル名と内容の両方で検索を行います。
///
/// # Arguments
///
/// * `query` - 検索クエリ（大文字小文字を区別しない）
///
/// # Returns
///
/// マッチしたファイルの一覧（内容は最初の500文字まで）
#[tauri::command]
pub fn search_files(query: String) -> AppResult<Vec<FileContent>> {
    let claude_dir = get_claude_dir().map_err(|e| e.to_string())?;
    let query_lower = query.to_lowercase();
    let mut results: Vec<FileContent> = Vec::new();

    for entry in WalkDir::new(&claude_dir)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.path().is_file())
    {
        let path = entry.path();

        // 許可された拡張子のファイルのみ検索
        let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
        if !ALLOWED_EXTENSIONS.contains(&ext) {
            continue;
        }

        // 除外ディレクトリ
        let path_str = path.to_string_lossy();
        if is_excluded_path(&path_str) {
            continue;
        }

        // ファイル名で検索
        let name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");

        if name.to_lowercase().contains(&query_lower) {
            if let Ok(content) = fs::read_to_string(path) {
                results.push(FileContent {
                    path: path.to_string_lossy().to_string(),
                    content: content.chars().take(500).collect(),
                    name: name.to_string(),
                });
            }
            continue;
        }

        // ファイル内容で検索
        if let Ok(content) = fs::read_to_string(path) {
            if content.to_lowercase().contains(&query_lower) {
                results.push(FileContent {
                    path: path.to_string_lossy().to_string(),
                    content: content.chars().take(500).collect(),
                    name: name.to_string(),
                });
            }
        }
    }

    Ok(results)
}

/// ファイル内で検索置換を実行
///
/// # Arguments
///
/// * `path` - 対象ファイルのパス
/// * `search` - 検索文字列（またはパターン）
/// * `replace` - 置換文字列
/// * `case_sensitive` - 大文字小文字を区別するか
/// * `whole_word` - 単語全体にマッチさせるか
/// * `use_regex` - 正規表現を使用するか
/// * `replace_all` - 全ての出現を置換するか（falseの場合は最初の1つのみ）
///
/// # Returns
///
/// 置換結果（成功/失敗、置換回数、新しい内容）
///
/// # Security
///
/// ~/.claude/ 配下のファイルのみアクセス可能です。
/// 置換前に自動的にバックアップが作成されます。
#[tauri::command]
pub fn search_and_replace_in_file(
    path: String,
    search: String,
    replace: String,
    case_sensitive: bool,
    whole_word: bool,
    use_regex: bool,
    replace_all: bool,
) -> AppResult<ReplaceResult> {
    let claude_dir = get_claude_dir().map_err(|e| e.to_string())?;

    // パスを正規化
    let path_buf = if path.starts_with("~/.claude/") {
        match path.strip_prefix("~/.claude/") {
            Some(suffix) => claude_dir.join(suffix),
            None => return Ok(ReplaceResult::error("パスの正規化に失敗しました: ~/.claude/ プレフィックスの処理エラー")),
        }
    } else if path.starts_with(&claude_dir.to_string_lossy().to_string()) {
        PathBuf::from(&path)
    } else {
        PathBuf::from(&path)
    };

    // セキュリティチェック
    if let Err(e) = validate_path_security(&path_buf, &claude_dir) {
        return Ok(ReplaceResult::error(e.to_string()));
    }

    // ファイルが存在するか確認
    if !path_buf.exists() {
        return Ok(ReplaceResult::error("File not found"));
    }

    // ファイル内容を読み込む
    let content = match fs::read_to_string(&path_buf) {
        Ok(c) => c,
        Err(e) => return Ok(ReplaceResult::error(format!("Failed to read file: {e}"))),
    };

    // 検索パターンを構築
    let pattern = build_search_pattern(&search, case_sensitive, whole_word, use_regex);
    let regex = match pattern {
        Ok(r) => r,
        Err(e) => return Ok(ReplaceResult::error(format!("Invalid search pattern: {e}"))),
    };

    // マッチ数をカウント
    let match_count = regex.find_iter(&content).count();

    if match_count == 0 {
        return Ok(ReplaceResult::success(0, content));
    }

    // 置換を実行
    let (new_content, replaced_count) = if replace_all {
        let new_content = regex.replace_all(&content, replace.as_str()).to_string();
        (new_content, match_count)
    } else {
        let new_content = regex.replace(&content, replace.as_str()).to_string();
        (new_content, 1)
    };

    // 内容が変更された場合のみバックアップと書き込み
    if new_content != content {
        // バックアップを作成
        let normalized_path = path_buf.to_string_lossy().to_string();
        if let Err(e) = crate::commands::backup::create_backup(&normalized_path) {
            return Ok(ReplaceResult::error(format!("Failed to create backup: {e}")));
        }

        // ファイルに書き込み
        if let Err(e) = fs::write(&path_buf, &new_content) {
            return Ok(ReplaceResult::error(format!("Failed to write file: {e}")));
        }

        info!(
            "Replaced {} occurrence(s) in file: {}",
            replaced_count,
            path_buf.display()
        );
    }

    Ok(ReplaceResult::success(replaced_count, new_content))
}

/// 検索パターンを構築
///
/// オプションに応じて正規表現パターンを構築します。
fn build_search_pattern(
    search: &str,
    case_sensitive: bool,
    whole_word: bool,
    use_regex: bool,
) -> Result<Regex, regex::Error> {
    let pattern = if use_regex {
        // 正規表現モード：そのまま使用
        if whole_word {
            format!(r"\b(?:{})\b", search)
        } else {
            search.to_string()
        }
    } else {
        // リテラルモード：特殊文字をエスケープ
        let escaped = regex::escape(search);
        if whole_word {
            format!(r"\b{}\b", escaped)
        } else {
            escaped
        }
    };

    RegexBuilder::new(&pattern)
        .case_insensitive(!case_sensitive)
        .build()
}
