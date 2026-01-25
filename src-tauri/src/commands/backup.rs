//! バックアップ操作コマンド
//!
//! ファイルのバックアップ作成、一覧取得、復元、クリーンアップ機能を提供します。

use crate::error::AppResult;
use crate::types::{CleanupResult, FileNode};
use crate::utils::{generate_backup_name, get_claude_dir, validate_path_security};
use log::{info, warn};
use std::fs;
use std::path::PathBuf;
use std::time::{Duration, SystemTime};

/// バックアップを作成
///
/// # Arguments
///
/// * `path` - バックアップするファイルのパス
///
/// # Returns
///
/// 作成されたバックアップファイルのパス
#[tauri::command]
pub fn create_backup(path: &str) -> AppResult<String> {
    create_backup_internal(path)
}

/// 内部用バックアップ作成関数
///
/// Tauriコマンドと内部処理の両方から使用されます。
pub fn create_backup_internal(path: &str) -> AppResult<String> {
    let path_buf = PathBuf::from(path);
    let claude_dir = get_claude_dir().map_err(|e| e.to_string())?;

    if !path_buf.exists() {
        return Ok("File does not exist, no backup needed".to_string());
    }

    let backup_dir = claude_dir.join("backups");
    if !backup_dir.exists() {
        fs::create_dir_all(&backup_dir)
            .map_err(|e| format!("Failed to create backup directory: {e}"))?;
    }

    let file_name = path_buf
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown");

    let backup_name = generate_backup_name(file_name);
    let backup_path = backup_dir.join(&backup_name);

    fs::copy(&path_buf, &backup_path).map_err(|e| format!("Failed to create backup: {e}"))?;

    Ok(backup_path.to_string_lossy().to_string())
}

/// バックアップ一覧を取得
///
/// # Returns
///
/// バックアップファイルの一覧（新しい順）
#[tauri::command]
pub fn get_backups() -> AppResult<Vec<FileNode>> {
    let claude_dir = get_claude_dir().map_err(|e| e.to_string())?;
    let backup_dir = claude_dir.join("backups");

    if !backup_dir.exists() {
        return Ok(Vec::new());
    }

    let mut backups: Vec<FileNode> = Vec::new();

    if let Ok(entries) = fs::read_dir(&backup_dir) {
        for entry in entries.filter_map(|e| e.ok()) {
            let path = entry.path();
            if path.is_file() {
                let name = path
                    .file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("unknown")
                    .to_string();

                backups.push(FileNode::new_file(name, path.to_string_lossy().to_string()));
            }
        }
    }

    // 新しい順にソート
    backups.sort_by(|a, b| b.name.cmp(&a.name));

    Ok(backups)
}

/// バックアップを復元
///
/// # Arguments
///
/// * `backup_path` - 復元するバックアップファイルのパス
/// * `target_path` - 復元先のパス
///
/// # Security
///
/// バックアップはbackupsディレクトリから、復元先は~/.claude/配下のみ許可
#[tauri::command]
pub fn restore_backup(backup_path: String, target_path: String) -> AppResult<()> {
    let backup_buf = PathBuf::from(&backup_path);
    let target_buf = PathBuf::from(&target_path);
    let claude_dir = get_claude_dir().map_err(|e| e.to_string())?;

    // セキュリティチェック
    if !backup_buf.starts_with(claude_dir.join("backups")) {
        return Err("Invalid backup path".to_string());
    }
    validate_path_security(&target_buf, &claude_dir).map_err(|e| e.to_string())?;

    // 現在のファイルをバックアップ
    create_backup(&target_path)?;

    fs::copy(&backup_buf, &target_buf).map_err(|e| format!("Failed to restore backup: {e}"))?;

    Ok(())
}

/// 古いバックアップをクリーンアップ
///
/// 指定日数以上古いバックアップファイルを削除します。
///
/// # Arguments
///
/// * `days` - この日数より古いファイルを削除
///
/// # Returns
///
/// クリーンアップ結果（削除数、サイズ、エラー）
#[tauri::command]
pub fn cleanup_old_backups(days: u32) -> AppResult<CleanupResult> {
    cleanup_old_backups_internal(days, true)
}

/// 内部用クリーンアップ関数
///
/// # Arguments
///
/// * `days` - この日数より古いファイルを削除
/// * `verbose` - ログ出力を行うかどうか
pub fn cleanup_old_backups_internal(days: u32, verbose: bool) -> AppResult<CleanupResult> {
    let claude_dir = get_claude_dir().map_err(|e| e.to_string())?;
    let backup_dir = claude_dir.join("backups");

    let mut result = CleanupResult::default();

    if !backup_dir.exists() {
        if verbose {
            info!("Backup directory does not exist, nothing to clean up");
        }
        return Ok(result);
    }

    let threshold = SystemTime::now()
        .checked_sub(Duration::from_secs(u64::from(days) * 24 * 60 * 60))
        .ok_or("Failed to calculate threshold time")?;

    let entries = fs::read_dir(&backup_dir)
        .map_err(|e| format!("Failed to read backup directory: {e}"))?;

    for entry in entries.filter_map(|e| e.ok()) {
        let path = entry.path();

        if !path.is_file() {
            continue;
        }

        // ファイルの更新日時を取得
        let metadata = match fs::metadata(&path) {
            Ok(m) => m,
            Err(e) => {
                if verbose {
                    result
                        .errors
                        .push(format!("Failed to get metadata for {}: {e}", path.display()));
                }
                continue;
            }
        };

        let modified = match metadata.modified() {
            Ok(t) => t,
            Err(e) => {
                if verbose {
                    result.errors.push(format!(
                        "Failed to get modification time for {}: {e}",
                        path.display()
                    ));
                }
                continue;
            }
        };

        // 古いファイルを削除
        if modified < threshold {
            let file_size = metadata.len();
            let file_name = path.file_name().and_then(|n| n.to_str()).unwrap_or("unknown");

            match fs::remove_file(&path) {
                Ok(()) => {
                    result.deleted_count += 1;
                    result.deleted_size_bytes += file_size;
                    if verbose {
                        info!("Deleted old backup: {file_name} ({file_size} bytes)");
                    }
                }
                Err(e) => {
                    if verbose {
                        result
                            .errors
                            .push(format!("Failed to delete {}: {e}", path.display()));
                        warn!("Failed to delete old backup {file_name}: {e}");
                    }
                }
            }
        }
    }

    if verbose {
        info!(
            "Backup cleanup completed: {} files deleted, {} bytes freed, {} errors",
            result.deleted_count,
            result.deleted_size_bytes,
            result.errors.len()
        );
    }

    Ok(result)
}

/// アプリ起動時のバックアップクリーンアップ
///
/// デフォルトで30日以上古いバックアップを削除します。
pub fn perform_startup_cleanup() {
    const DEFAULT_DAYS: u32 = 30;

    match cleanup_old_backups_internal(DEFAULT_DAYS, false) {
        Ok(result) => {
            if result.deleted_count > 0 {
                info!(
                    "Startup cleanup: deleted {} old backups ({} bytes)",
                    result.deleted_count, result.deleted_size_bytes
                );
            }
        }
        Err(e) => {
            warn!("Startup cleanup failed: {e}");
        }
    }
}
