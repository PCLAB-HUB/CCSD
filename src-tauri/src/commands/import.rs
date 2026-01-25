//! インポート操作コマンド
//!
//! ファイルのインポート機能を提供します。
//! 単一ファイルのインポートとZIPファイルからの一括インポートに対応。

use crate::commands::backup::create_backup_internal;
use crate::error::AppResult;
use crate::types::{FileExistsInfo, ImportResult, ZipFileInfo};
use crate::utils::{
    get_claude_dir, is_excluded_zip_entry, validate_path_security, ALLOWED_EXTENSIONS,
};
use log::{info, warn};
use std::fs::File;
use std::io::{Read, Write};
use std::path::PathBuf;
use std::fs;
use zip::ZipArchive;

/// ファイルが存在するかチェック
///
/// # Arguments
///
/// * `relative_path` - ~/.claude/からの相対パス
///
/// # Returns
///
/// ファイルの存在情報
#[tauri::command]
pub fn check_file_exists(relative_path: String) -> AppResult<FileExistsInfo> {
    let claude_dir = get_claude_dir().map_err(|e| e.to_string())?;
    let target_path = claude_dir.join(&relative_path);

    Ok(FileExistsInfo {
        exists: target_path.exists(),
        path: target_path.to_string_lossy().to_string(),
        relative_path,
    })
}

/// 複数ファイルの存在チェック
///
/// # Arguments
///
/// * `relative_paths` - ~/.claude/からの相対パスのリスト
///
/// # Returns
///
/// 各ファイルの存在情報リスト
#[tauri::command]
pub fn check_files_exist(relative_paths: Vec<String>) -> AppResult<Vec<FileExistsInfo>> {
    let claude_dir = get_claude_dir().map_err(|e| e.to_string())?;

    let results: Vec<FileExistsInfo> = relative_paths
        .into_iter()
        .map(|relative_path| {
            let target_path = claude_dir.join(&relative_path);
            FileExistsInfo {
                exists: target_path.exists(),
                path: target_path.to_string_lossy().to_string(),
                relative_path,
            }
        })
        .collect();

    Ok(results)
}

/// 単一ファイルのインポート
///
/// # Arguments
///
/// * `source_path` - インポート元のパス
/// * `relative_dest` - ~/.claude/からの相対的な保存先パス
/// * `should_backup` - 既存ファイルのバックアップを作成するか
///
/// # Returns
///
/// インポート結果
#[tauri::command]
pub fn import_file(
    source_path: String,
    relative_dest: String,
    should_backup: bool,
) -> AppResult<ImportResult> {
    let claude_dir = get_claude_dir().map_err(|e| e.to_string())?;
    let source = PathBuf::from(&source_path);
    let dest = claude_dir.join(&relative_dest);

    let mut result = ImportResult::default();

    // ソースファイルの存在チェック
    if !source.exists() {
        result
            .errors
            .push(format!("Source file not found: {source_path}"));
        return Ok(result);
    }

    // セキュリティチェック
    if let Err(e) = validate_path_security(&dest, &claude_dir) {
        result.errors.push(e.to_string());
        return Ok(result);
    }

    // 拡張子チェック
    let ext = source.extension().and_then(|e| e.to_str()).unwrap_or("");
    if !ALLOWED_EXTENSIONS.contains(&ext) {
        result.errors.push(format!(
            "Invalid file type: {ext}. Only .md, .json, .jsonl are allowed"
        ));
        return Ok(result);
    }

    // 親ディレクトリの作成
    if let Some(parent) = dest.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create parent directory: {e}"))?;
        }
    }

    // 既存ファイルのバックアップ
    if should_backup && dest.exists() {
        match create_backup_internal(&dest.to_string_lossy()) {
            Ok(_) => {
                result.backup_created = true;
                info!("Backup created for: {}", dest.display());
            }
            Err(e) => {
                warn!("Failed to create backup: {e}");
                result.errors.push(format!("Backup failed: {e}"));
            }
        }
    }

    // ファイルコピー
    match fs::copy(&source, &dest) {
        Ok(_) => {
            result.success = true;
            result.imported_files.push(relative_dest);
            info!("Imported file: {source_path} -> {}", dest.display());
        }
        Err(e) => {
            result.errors.push(format!("Failed to copy file: {e}"));
        }
    }

    Ok(result)
}

/// ZIPファイルの内容をプレビュー
///
/// # Arguments
///
/// * `zip_path` - ZIPファイルのパス
///
/// # Returns
///
/// ZIPファイル内のファイル情報リスト
#[tauri::command]
pub fn preview_zip(zip_path: String) -> AppResult<Vec<ZipFileInfo>> {
    let file = File::open(&zip_path).map_err(|e| format!("Failed to open ZIP file: {e}"))?;

    let mut archive =
        ZipArchive::new(file).map_err(|e| format!("Failed to read ZIP file: {e}"))?;

    let mut files: Vec<ZipFileInfo> = Vec::new();

    for i in 0..archive.len() {
        let file = archive
            .by_index(i)
            .map_err(|e| format!("Failed to read ZIP entry: {e}"))?;

        let name = file.name().to_string();

        // 除外ディレクトリをスキップ
        if is_excluded_zip_entry(&name) {
            continue;
        }

        let is_dir = file.is_dir();

        // ディレクトリまたは対象拡張子のファイルのみ
        if !is_dir {
            let ext = PathBuf::from(&name)
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("")
                .to_string();
            if !ALLOWED_EXTENSIONS.contains(&ext.as_str()) {
                continue;
            }
        }

        files.push(ZipFileInfo {
            name,
            size: file.size(),
            is_directory: is_dir,
        });
    }

    Ok(files)
}

/// ZIPファイルのインポート（全設定復元）
///
/// # Arguments
///
/// * `zip_path` - ZIPファイルのパス
/// * `create_backups` - 既存ファイルのバックアップを作成するか
///
/// # Returns
///
/// インポート結果
#[tauri::command]
pub fn import_zip(zip_path: String, create_backups: bool) -> AppResult<ImportResult> {
    let claude_dir = get_claude_dir().map_err(|e| e.to_string())?;

    let mut result = ImportResult::default();

    let file = File::open(&zip_path).map_err(|e| format!("Failed to open ZIP file: {e}"))?;

    let mut archive =
        ZipArchive::new(file).map_err(|e| format!("Failed to read ZIP file: {e}"))?;

    for i in 0..archive.len() {
        let mut file = archive
            .by_index(i)
            .map_err(|e| format!("Failed to read ZIP entry: {e}"))?;

        let name = file.name().to_string();

        // 除外ディレクトリをスキップ
        if is_excluded_zip_entry(&name) {
            result
                .skipped_files
                .push(format!("{name} (excluded directory)"));
            continue;
        }

        let dest_path = claude_dir.join(&name);

        // セキュリティチェック（path traversal防止）
        if !dest_path.starts_with(&claude_dir) {
            result
                .skipped_files
                .push(format!("{name} (path traversal attempt)"));
            continue;
        }

        // ディレクトリの場合
        if file.is_dir() {
            if !dest_path.exists() {
                if let Err(e) = fs::create_dir_all(&dest_path) {
                    result
                        .errors
                        .push(format!("Failed to create directory {name}: {e}"));
                }
            }
            continue;
        }

        // ファイルの拡張子チェック
        let ext = dest_path.extension().and_then(|e| e.to_str()).unwrap_or("");
        if !ALLOWED_EXTENSIONS.contains(&ext) {
            result
                .skipped_files
                .push(format!("{name} (invalid extension)"));
            continue;
        }

        // 親ディレクトリの作成
        if let Some(parent) = dest_path.parent() {
            if !parent.exists() {
                if let Err(e) = fs::create_dir_all(parent) {
                    result
                        .errors
                        .push(format!("Failed to create parent directory: {e}"));
                    continue;
                }
            }
        }

        // 既存ファイルのバックアップ
        if create_backups && dest_path.exists() {
            match create_backup_internal(&dest_path.to_string_lossy()) {
                Ok(_) => {
                    result.backup_created = true;
                }
                Err(e) => {
                    warn!("Failed to create backup for {name}: {e}");
                }
            }
        }

        // ファイルの展開
        let mut contents = Vec::new();
        if let Err(e) = file.read_to_end(&mut contents) {
            result
                .errors
                .push(format!("Failed to read {name} from ZIP: {e}"));
            continue;
        }

        let mut dest_file = match File::create(&dest_path) {
            Ok(f) => f,
            Err(e) => {
                result.errors.push(format!("Failed to create {name}: {e}"));
                continue;
            }
        };

        if let Err(e) = dest_file.write_all(&contents) {
            result.errors.push(format!("Failed to write {name}: {e}"));
            continue;
        }

        result.imported_files.push(name);
    }

    result.success = result.errors.is_empty() || !result.imported_files.is_empty();

    info!(
        "ZIP import completed: {} files imported, {} skipped, {} errors",
        result.imported_files.len(),
        result.skipped_files.len(),
        result.errors.len()
    );

    Ok(result)
}
