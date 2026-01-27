//! ユーティリティ関数
//!
//! アプリケーション全体で使用する共通関数を提供します。

use crate::error::AppError;
use std::path::{Path, PathBuf};

/// 除外するディレクトリ一覧（一元管理）
pub const EXCLUDED_DIRS: &[&str] = &[
    "cache",
    "tasks",
    "todos",
    "debug",
    "shell-snapshots",
    "session-env",
    "statsig",
    "plugins",
    "backups",
];

/// 許可されるファイル拡張子
pub const ALLOWED_EXTENSIONS: &[&str] = &["md", "json", "jsonl"];

/// Claudeディレクトリのパスを取得
///
/// # Errors
///
/// ホームディレクトリが見つからない場合はエラーを返します。
pub fn get_claude_dir() -> Result<PathBuf, AppError> {
    let home = dirs::home_dir().ok_or(AppError::HomeNotFound)?;
    Ok(home.join(".claude"))
}

/// パスに除外ディレクトリが含まれているかチェック
///
/// # Arguments
///
/// * `path_str` - チェックするパス文字列
///
/// # Returns
///
/// 除外ディレクトリが含まれている場合は`true`
pub fn is_excluded_path(path_str: &str) -> bool {
    EXCLUDED_DIRS.iter().any(|dir| {
        path_str.contains(&format!("/{dir}/"))
    })
}

/// ファイル拡張子が許可されているかチェック
///
/// # Arguments
///
/// * `path` - チェックするパス
///
/// # Returns
///
/// 許可された拡張子の場合は`true`
pub fn is_allowed_extension(path: &std::path::Path) -> bool {
    path.extension()
        .and_then(|e| e.to_str())
        .map(|ext| ALLOWED_EXTENSIONS.contains(&ext))
        .unwrap_or(false)
}

/// パスがClaude配下かどうかをセキュリティチェック
///
/// # Arguments
///
/// * `path` - チェックするパス
/// * `claude_dir` - Claudeディレクトリのパス
///
/// # Errors
///
/// パスがClaude配下でない場合はエラーを返します。
pub fn validate_path_security(path: &Path, claude_dir: &Path) -> Result<(), AppError> {
    if !path.starts_with(claude_dir) {
        return Err(AppError::AccessDenied(
            "only files in ~/.claude/ are allowed".to_string(),
        ));
    }
    Ok(())
}

/// ファイル名からタイムスタンプ付きのバックアップ名を生成
///
/// # Arguments
///
/// * `file_name` - 元のファイル名
///
/// # Returns
///
/// タイムスタンプ付きのバックアップファイル名
pub fn generate_backup_name(file_name: &str) -> String {
    let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
    format!("{file_name}_{timestamp}")
}

/// ZIPエントリ名に除外ディレクトリが含まれているかチェック
///
/// # Arguments
///
/// * `name` - ZIPエントリ名
///
/// # Returns
///
/// 除外ディレクトリが含まれている場合は`true`
pub fn is_excluded_zip_entry(name: &str) -> bool {
    EXCLUDED_DIRS.iter().any(|dir| {
        name.contains(&format!("{dir}/"))
            || name.contains(&format!("{dir}\\"))
            || name.starts_with(&format!("{dir}/"))
            || name.starts_with(&format!("{dir}\\"))
    })
}

/// パス文字列を正規化
///
/// `~/.claude/` プレフィックスを実際のパスに変換し、
/// Claude配下のパスかどうかを検証します。
///
/// # Arguments
///
/// * `path` - 正規化するパス文字列
/// * `claude_dir` - Claudeディレクトリの絶対パス
///
/// # Returns
///
/// 正規化されたPathBuf。Claude配下でない場合はNone。
///
/// # Examples
///
/// ```ignore
/// let claude_dir = get_claude_dir()?;
/// let normalized = normalize_claude_path("~/.claude/CLAUDE.md", &claude_dir);
/// // => Some(PathBuf from "/Users/xxx/.claude/CLAUDE.md")
/// ```
pub fn normalize_claude_path(path: &str, claude_dir: &Path) -> Option<PathBuf> {
    let claude_dir_str = claude_dir.to_string_lossy().to_string();

    if path.starts_with("~/.claude/") {
        path.strip_prefix("~/.claude/")
            .map(|suffix| claude_dir.join(suffix))
    } else if path.starts_with(&claude_dir_str) {
        Some(PathBuf::from(path))
    } else {
        // Claude配下でない場合もPathBufとして返す（セキュリティチェックは別途行う）
        Some(PathBuf::from(path))
    }
}

/// パス文字列を正規化（create_file用: Claude配下のみ許可）
///
/// `~/.claude/` プレフィックスまたはClaude配下の絶対パスのみを受け付けます。
/// それ以外のパスはエラーとして拒否します。
///
/// # Arguments
///
/// * `path` - 正規化するパス文字列
/// * `claude_dir` - Claudeディレクトリの絶対パス
///
/// # Returns
///
/// 正規化されたPathBuf。Claude配下でない場合はNone。
pub fn normalize_claude_path_strict(path: &str, claude_dir: &Path) -> Option<PathBuf> {
    let claude_dir_str = claude_dir.to_string_lossy().to_string();

    if path.starts_with("~/.claude/") {
        path.strip_prefix("~/.claude/")
            .map(|suffix| claude_dir.join(suffix))
    } else if path.starts_with(&claude_dir_str) {
        Some(PathBuf::from(path))
    } else {
        // Claude配下でないパスは拒否
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_excluded_path() {
        assert!(is_excluded_path("/home/user/.claude/cache/data"));
        assert!(is_excluded_path("/home/user/.claude/backups/file.md"));
        assert!(!is_excluded_path("/home/user/.claude/settings.json"));
        assert!(!is_excluded_path("/home/user/.claude/projects/my-project"));
    }

    #[test]
    fn test_is_allowed_extension() {
        use std::path::Path;

        assert!(is_allowed_extension(Path::new("file.md")));
        assert!(is_allowed_extension(Path::new("config.json")));
        assert!(is_allowed_extension(Path::new("data.jsonl")));
        assert!(!is_allowed_extension(Path::new("script.js")));
        assert!(!is_allowed_extension(Path::new("binary.exe")));
    }

    #[test]
    fn test_is_excluded_zip_entry() {
        assert!(is_excluded_zip_entry("cache/data.json"));
        assert!(is_excluded_zip_entry("backups/file.md"));
        assert!(!is_excluded_zip_entry("settings.json"));
        assert!(!is_excluded_zip_entry("projects/config.json"));
    }
}
