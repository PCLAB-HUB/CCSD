use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::PathBuf;
use std::time::{Duration, SystemTime};
use walkdir::WalkDir;
use chrono::Local;
use log::{info, warn};
use zip::write::SimpleFileOptions;
use zip::{ZipArchive, ZipWriter};

#[derive(Debug, Serialize, Deserialize)]
pub struct FileNode {
    name: String,
    path: String,
    file_type: String, // "file" or "directory"
    children: Option<Vec<FileNode>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileContent {
    path: String,
    content: String,
    name: String,
}

/// 除外するディレクトリ一覧（一元管理）
const EXCLUDED_DIRS: &[&str] = &[
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

fn get_claude_dir() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Could not find home directory")?;
    Ok(home.join(".claude"))
}

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
                    (true, false) => std::cmp::Ordering::Less,
                    (false, true) => std::cmp::Ordering::Greater,
                    _ => a.file_name().cmp(&b.file_name()),
                }
            });

            for entry in entries {
                if let Some(child) = build_file_tree(&entry.path(), max_depth, current_depth + 1) {
                    children.push(child);
                }
            }
        }

        Some(FileNode {
            name,
            path: path.to_string_lossy().to_string(),
            file_type: "directory".to_string(),
            children: if children.is_empty() { None } else { Some(children) },
        })
    } else {
        // .md または .json ファイルのみ
        let ext = path.extension()?.to_str()?;
        if ext == "md" || ext == "json" || ext == "jsonl" {
            Some(FileNode {
                name,
                path: path.to_string_lossy().to_string(),
                file_type: "file".to_string(),
                children: None,
            })
        } else {
            None
        }
    }
}

#[tauri::command]
fn get_file_tree() -> Result<Vec<FileNode>, String> {
    let claude_dir = get_claude_dir()?;

    if !claude_dir.exists() {
        return Err("~/.claude directory not found".to_string());
    }

    let mut nodes: Vec<FileNode> = Vec::new();

    // トップレベルのファイルとディレクトリを取得
    let entries = fs::read_dir(&claude_dir)
        .map_err(|e| format!("Failed to read ~/.claude directory: {}", e))?;

    let mut entries: Vec<_> = entries.filter_map(|e| e.ok()).collect();
    entries.sort_by(|a, b| {
        let a_is_dir = a.path().is_dir();
        let b_is_dir = b.path().is_dir();
        match (a_is_dir, b_is_dir) {
            (true, false) => std::cmp::Ordering::Greater,
            (false, true) => std::cmp::Ordering::Less,
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

#[tauri::command]
fn read_file(path: String) -> Result<FileContent, String> {
    let path_buf = PathBuf::from(&path);

    // セキュリティチェック: ~/.claude/ 配下のみ許可
    let claude_dir = get_claude_dir()?;
    if !path_buf.starts_with(&claude_dir) {
        return Err("Access denied: only files in ~/.claude/ are allowed".to_string());
    }

    let content = fs::read_to_string(&path_buf)
        .map_err(|e| format!("Failed to read file: {}", e))?;

    let name = path_buf
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();

    Ok(FileContent { path, content, name })
}

#[tauri::command]
fn write_file(path: String, content: String) -> Result<(), String> {
    let path_buf = PathBuf::from(&path);

    // セキュリティチェック: ~/.claude/ 配下のみ許可
    let claude_dir = get_claude_dir()?;
    if !path_buf.starts_with(&claude_dir) {
        return Err("Access denied: only files in ~/.claude/ are allowed".to_string());
    }

    // バックアップを作成
    create_backup(&path)?;

    fs::write(&path_buf, content)
        .map_err(|e| format!("Failed to write file: {}", e))
}

#[tauri::command]
fn create_backup(path: &str) -> Result<String, String> {
    let path_buf = PathBuf::from(path);
    let claude_dir = get_claude_dir()?;

    if !path_buf.exists() {
        return Ok("File does not exist, no backup needed".to_string());
    }

    let backup_dir = claude_dir.join("backups");
    if !backup_dir.exists() {
        fs::create_dir_all(&backup_dir)
            .map_err(|e| format!("Failed to create backup directory: {}", e))?;
    }

    let file_name = path_buf.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown");

    let timestamp = Local::now().format("%Y%m%d_%H%M%S");
    let backup_name = format!("{}_{}", file_name, timestamp);
    let backup_path = backup_dir.join(&backup_name);

    fs::copy(&path_buf, &backup_path)
        .map_err(|e| format!("Failed to create backup: {}", e))?;

    Ok(backup_path.to_string_lossy().to_string())
}

#[tauri::command]
fn get_backups() -> Result<Vec<FileNode>, String> {
    let claude_dir = get_claude_dir()?;
    let backup_dir = claude_dir.join("backups");

    if !backup_dir.exists() {
        return Ok(Vec::new());
    }

    let mut backups: Vec<FileNode> = Vec::new();

    if let Ok(entries) = fs::read_dir(&backup_dir) {
        for entry in entries.filter_map(|e| e.ok()) {
            let path = entry.path();
            if path.is_file() {
                let name = path.file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("unknown")
                    .to_string();

                backups.push(FileNode {
                    name,
                    path: path.to_string_lossy().to_string(),
                    file_type: "file".to_string(),
                    children: None,
                });
            }
        }
    }

    // 新しい順にソート
    backups.sort_by(|a, b| b.name.cmp(&a.name));

    Ok(backups)
}

#[tauri::command]
fn restore_backup(backup_path: String, target_path: String) -> Result<(), String> {
    let backup_buf = PathBuf::from(&backup_path);
    let target_buf = PathBuf::from(&target_path);
    let claude_dir = get_claude_dir()?;

    // セキュリティチェック
    if !backup_buf.starts_with(claude_dir.join("backups")) {
        return Err("Invalid backup path".to_string());
    }
    if !target_buf.starts_with(&claude_dir) {
        return Err("Invalid target path".to_string());
    }

    // 現在のファイルをバックアップ
    create_backup(&target_path)?;

    fs::copy(&backup_buf, &target_buf)
        .map_err(|e| format!("Failed to restore backup: {}", e))?;

    Ok(())
}

/// バックアップクリーンアップ結果
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CleanupResult {
    pub deleted_count: u32,
    pub deleted_size_bytes: u64,
    pub errors: Vec<String>,
}

/// 指定日数以上古いバックアップを削除する
#[tauri::command]
fn cleanup_old_backups(days: u32) -> Result<CleanupResult, String> {
    let claude_dir = get_claude_dir()?;
    let backup_dir = claude_dir.join("backups");

    let mut result = CleanupResult {
        deleted_count: 0,
        deleted_size_bytes: 0,
        errors: Vec::new(),
    };

    if !backup_dir.exists() {
        info!("Backup directory does not exist, nothing to clean up");
        return Ok(result);
    }

    let threshold = SystemTime::now()
        .checked_sub(Duration::from_secs(u64::from(days) * 24 * 60 * 60))
        .ok_or("Failed to calculate threshold time")?;

    let entries = fs::read_dir(&backup_dir)
        .map_err(|e| format!("Failed to read backup directory: {}", e))?;

    for entry in entries.filter_map(|e| e.ok()) {
        let path = entry.path();

        if !path.is_file() {
            continue;
        }

        // ファイルの更新日時を取得
        let metadata = match fs::metadata(&path) {
            Ok(m) => m,
            Err(e) => {
                result.errors.push(format!(
                    "Failed to get metadata for {}: {}",
                    path.display(),
                    e
                ));
                continue;
            }
        };

        let modified = match metadata.modified() {
            Ok(t) => t,
            Err(e) => {
                result.errors.push(format!(
                    "Failed to get modification time for {}: {}",
                    path.display(),
                    e
                ));
                continue;
            }
        };

        // 古いファイルを削除
        if modified < threshold {
            let file_size = metadata.len();
            let file_name = path.file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("unknown");

            match fs::remove_file(&path) {
                Ok(()) => {
                    result.deleted_count += 1;
                    result.deleted_size_bytes += file_size;
                    info!(
                        "Deleted old backup: {} ({} bytes)",
                        file_name,
                        file_size
                    );
                }
                Err(e) => {
                    result.errors.push(format!(
                        "Failed to delete {}: {}",
                        path.display(),
                        e
                    ));
                    warn!("Failed to delete old backup {}: {}", file_name, e);
                }
            }
        }
    }

    info!(
        "Backup cleanup completed: {} files deleted, {} bytes freed, {} errors",
        result.deleted_count,
        result.deleted_size_bytes,
        result.errors.len()
    );

    Ok(result)
}

/// アプリ起動時にバックアップをクリーンアップする（内部関数）
fn perform_startup_cleanup() {
    let default_days = 30;

    match cleanup_old_backups_internal(default_days) {
        Ok(result) => {
            if result.deleted_count > 0 {
                info!(
                    "Startup cleanup: deleted {} old backups ({} bytes)",
                    result.deleted_count,
                    result.deleted_size_bytes
                );
            }
        }
        Err(e) => {
            warn!("Startup cleanup failed: {}", e);
        }
    }
}

/// 内部用クリーンアップ関数（Tauriコマンドから独立）
fn cleanup_old_backups_internal(days: u32) -> Result<CleanupResult, String> {
    let claude_dir = get_claude_dir()?;
    let backup_dir = claude_dir.join("backups");

    let mut result = CleanupResult {
        deleted_count: 0,
        deleted_size_bytes: 0,
        errors: Vec::new(),
    };

    if !backup_dir.exists() {
        return Ok(result);
    }

    let threshold = SystemTime::now()
        .checked_sub(Duration::from_secs(u64::from(days) * 24 * 60 * 60))
        .ok_or("Failed to calculate threshold time")?;

    let entries = fs::read_dir(&backup_dir)
        .map_err(|e| format!("Failed to read backup directory: {}", e))?;

    for entry in entries.filter_map(|e| e.ok()) {
        let path = entry.path();

        if !path.is_file() {
            continue;
        }

        let metadata = match fs::metadata(&path) {
            Ok(m) => m,
            Err(_) => continue,
        };

        let modified = match metadata.modified() {
            Ok(t) => t,
            Err(_) => continue,
        };

        if modified < threshold {
            let file_size = metadata.len();
            if fs::remove_file(&path).is_ok() {
                result.deleted_count += 1;
                result.deleted_size_bytes += file_size;
            }
        }
    }

    Ok(result)
}

/// パスに除外ディレクトリが含まれているかチェック
fn is_excluded_path(path_str: &str) -> bool {
    EXCLUDED_DIRS.iter().any(|dir| {
        path_str.contains(&format!("/{}/", dir))
    })
}

#[tauri::command]
fn search_files(query: String) -> Result<Vec<FileContent>, String> {
    let claude_dir = get_claude_dir()?;
    let query_lower = query.to_lowercase();
    let mut results: Vec<FileContent> = Vec::new();

    for entry in WalkDir::new(&claude_dir)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.path().is_file())
    {
        let path = entry.path();

        // .md, .json, .jsonl ファイルのみ検索
        let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
        if ext != "md" && ext != "json" && ext != "jsonl" {
            continue;
        }

        // 除外するディレクトリ
        let path_str = path.to_string_lossy();
        if is_excluded_path(&path_str) {
            continue;
        }

        // ファイル名で検索
        let name = path.file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("");

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

/// 単一ファイルをエクスポート
#[tauri::command]
fn export_file(source_path: String, dest_path: String) -> Result<(), String> {
    let source_buf = PathBuf::from(&source_path);
    let dest_buf = PathBuf::from(&dest_path);
    let claude_dir = get_claude_dir()?;

    // セキュリティチェック: ~/.claude/ 配下のファイルのみ許可
    if !source_buf.starts_with(&claude_dir) {
        return Err("Access denied: only files in ~/.claude/ are allowed".to_string());
    }

    if !source_buf.exists() {
        return Err("Source file does not exist".to_string());
    }

    // 親ディレクトリが存在しない場合は作成
    if let Some(parent) = dest_buf.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create destination directory: {}", e))?;
        }
    }

    fs::copy(&source_buf, &dest_buf)
        .map_err(|e| format!("Failed to export file: {}", e))?;

    info!("Exported file: {} -> {}", source_path, dest_path);
    Ok(())
}

/// エクスポート進捗情報
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ExportProgress {
    pub total_files: u32,
    pub processed_files: u32,
    pub current_file: String,
}

/// ~/.claude/ 全体をZIPでエクスポート
#[tauri::command]
fn export_all_zip(dest_path: String) -> Result<u32, String> {
    let claude_dir = get_claude_dir()?;
    let dest_buf = PathBuf::from(&dest_path);

    if !claude_dir.exists() {
        return Err("~/.claude directory not found".to_string());
    }

    // 親ディレクトリが存在しない場合は作成
    if let Some(parent) = dest_buf.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create destination directory: {}", e))?;
        }
    }

    // ZIPファイルを作成
    let zip_file = File::create(&dest_buf)
        .map_err(|e| format!("Failed to create ZIP file: {}", e))?;
    let mut zip = ZipWriter::new(zip_file);

    let options = SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .unix_permissions(0o644);

    let mut file_count: u32 = 0;

    // WalkDirで全ファイルを走査
    for entry in WalkDir::new(&claude_dir)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        let path_str = path.to_string_lossy();

        // 除外ディレクトリをスキップ
        if is_excluded_path(&path_str) {
            continue;
        }

        // ディレクトリ名自体が除外対象かチェック
        if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
            if EXCLUDED_DIRS.contains(&name) && path.is_dir() {
                continue;
            }
        }

        // ~/.claude/ からの相対パスを計算
        let relative_path = path.strip_prefix(&claude_dir)
            .map_err(|e| format!("Failed to calculate relative path: {}", e))?;

        let relative_str = relative_path.to_string_lossy();

        if path.is_file() {
            // .md, .json, .jsonl ファイルのみエクスポート
            let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
            if ext != "md" && ext != "json" && ext != "jsonl" {
                continue;
            }

            // ファイルをZIPに追加
            zip.start_file(relative_str.to_string(), options)
                .map_err(|e| format!("Failed to add file to ZIP: {}", e))?;

            let mut file = File::open(path)
                .map_err(|e| format!("Failed to open file {}: {}", path_str, e))?;
            let mut buffer = Vec::new();
            file.read_to_end(&mut buffer)
                .map_err(|e| format!("Failed to read file {}: {}", path_str, e))?;

            zip.write_all(&buffer)
                .map_err(|e| format!("Failed to write file to ZIP: {}", e))?;

            file_count += 1;
        } else if path.is_dir() && !relative_str.is_empty() {
            // ディレクトリをZIPに追加
            let dir_name = format!("{}/", relative_str);
            zip.add_directory(dir_name, options)
                .map_err(|e| format!("Failed to add directory to ZIP: {}", e))?;
        }
    }

    zip.finish()
        .map_err(|e| format!("Failed to finalize ZIP file: {}", e))?;

    info!("Exported {} files to ZIP: {}", file_count, dest_path);
    Ok(file_count)
}

/// エクスポート対象のファイル数を取得
#[tauri::command]
fn get_export_file_count() -> Result<u32, String> {
    let claude_dir = get_claude_dir()?;
    let mut count: u32 = 0;

    for entry in WalkDir::new(&claude_dir)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.path().is_file())
    {
        let path = entry.path();
        let path_str = path.to_string_lossy();

        // 除外ディレクトリをスキップ
        if is_excluded_path(&path_str) {
            continue;
        }

        // .md, .json, .jsonl ファイルのみカウント
        let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
        if ext == "md" || ext == "json" || ext == "jsonl" {
            count += 1;
        }
    }

    Ok(count)
}

// ====== インポート関連 ======

/// インポート結果
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ImportResult {
    pub success: bool,
    pub imported_files: Vec<String>,
    pub skipped_files: Vec<String>,
    pub errors: Vec<String>,
    pub backup_created: bool,
}

/// ファイル存在チェック結果
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileExistsInfo {
    pub exists: bool,
    pub path: String,
    pub relative_path: String,
}

/// ZIPファイル内のファイル情報
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ZipFileInfo {
    pub name: String,
    pub size: u64,
    pub is_directory: bool,
}

/// ファイルが存在するかチェック
#[tauri::command]
fn check_file_exists(relative_path: String) -> Result<FileExistsInfo, String> {
    let claude_dir = get_claude_dir()?;
    let target_path = claude_dir.join(&relative_path);

    Ok(FileExistsInfo {
        exists: target_path.exists(),
        path: target_path.to_string_lossy().to_string(),
        relative_path,
    })
}

/// 複数ファイルの存在チェック
#[tauri::command]
fn check_files_exist(relative_paths: Vec<String>) -> Result<Vec<FileExistsInfo>, String> {
    let claude_dir = get_claude_dir()?;

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

/// 内部用バックアップ作成関数
fn create_backup_internal(path: &str) -> Result<String, String> {
    let path_buf = PathBuf::from(path);
    let claude_dir = get_claude_dir()?;

    if !path_buf.exists() {
        return Ok("File does not exist, no backup needed".to_string());
    }

    let backup_dir = claude_dir.join("backups");
    if !backup_dir.exists() {
        fs::create_dir_all(&backup_dir)
            .map_err(|e| format!("Failed to create backup directory: {}", e))?;
    }

    let file_name = path_buf.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown");

    let timestamp = Local::now().format("%Y%m%d_%H%M%S");
    let backup_name = format!("{}_{}", file_name, timestamp);
    let backup_path = backup_dir.join(&backup_name);

    fs::copy(&path_buf, &backup_path)
        .map_err(|e| format!("Failed to create backup: {}", e))?;

    Ok(backup_path.to_string_lossy().to_string())
}

/// 単一ファイルのインポート
#[tauri::command]
fn import_file(source_path: String, relative_dest: String, should_backup: bool) -> Result<ImportResult, String> {
    let claude_dir = get_claude_dir()?;
    let source = PathBuf::from(&source_path);
    let dest = claude_dir.join(&relative_dest);

    let mut result = ImportResult {
        success: false,
        imported_files: Vec::new(),
        skipped_files: Vec::new(),
        errors: Vec::new(),
        backup_created: false,
    };

    // ソースファイルの存在チェック
    if !source.exists() {
        result.errors.push(format!("Source file not found: {}", source_path));
        return Ok(result);
    }

    // セキュリティチェック: destが.claude配下であることを確認
    if !dest.starts_with(&claude_dir) {
        result.errors.push("Destination must be within ~/.claude directory".to_string());
        return Ok(result);
    }

    // 拡張子チェック（.md, .json, .jsonlのみ許可）
    let ext = source.extension()
        .and_then(|e| e.to_str())
        .unwrap_or("");
    if ext != "md" && ext != "json" && ext != "jsonl" {
        result.errors.push(format!("Invalid file type: {}. Only .md, .json, .jsonl are allowed", ext));
        return Ok(result);
    }

    // 親ディレクトリの作成
    if let Some(parent) = dest.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create parent directory: {}", e))?;
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
                warn!("Failed to create backup: {}", e);
                result.errors.push(format!("Backup failed: {}", e));
            }
        }
    }

    // ファイルコピー
    match fs::copy(&source, &dest) {
        Ok(_) => {
            result.success = true;
            result.imported_files.push(relative_dest);
            info!("Imported file: {} -> {}", source_path, dest.display());
        }
        Err(e) => {
            result.errors.push(format!("Failed to copy file: {}", e));
        }
    }

    Ok(result)
}

/// ZIPファイルの内容をプレビュー
#[tauri::command]
fn preview_zip(zip_path: String) -> Result<Vec<ZipFileInfo>, String> {
    let file = File::open(&zip_path)
        .map_err(|e| format!("Failed to open ZIP file: {}", e))?;

    let mut archive = ZipArchive::new(file)
        .map_err(|e| format!("Failed to read ZIP file: {}", e))?;

    let mut files: Vec<ZipFileInfo> = Vec::new();

    for i in 0..archive.len() {
        let file = archive.by_index(i)
            .map_err(|e| format!("Failed to read ZIP entry: {}", e))?;

        let name = file.name().to_string();

        // 除外ディレクトリをスキップ
        if EXCLUDED_DIRS.iter().any(|dir| {
            name.contains(&format!("{}/", dir)) ||
            name.contains(&format!("{}\\", dir)) ||
            name.starts_with(&format!("{}/", dir)) ||
            name.starts_with(&format!("{}\\", dir))
        }) {
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
            if ext != "md" && ext != "json" && ext != "jsonl" {
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
#[tauri::command]
fn import_zip(zip_path: String, create_backups: bool) -> Result<ImportResult, String> {
    let claude_dir = get_claude_dir()?;

    let mut result = ImportResult {
        success: false,
        imported_files: Vec::new(),
        skipped_files: Vec::new(),
        errors: Vec::new(),
        backup_created: false,
    };

    let file = File::open(&zip_path)
        .map_err(|e| format!("Failed to open ZIP file: {}", e))?;

    let mut archive = ZipArchive::new(file)
        .map_err(|e| format!("Failed to read ZIP file: {}", e))?;

    for i in 0..archive.len() {
        let mut file = archive.by_index(i)
            .map_err(|e| format!("Failed to read ZIP entry: {}", e))?;

        let name = file.name().to_string();

        // 除外ディレクトリをスキップ
        if EXCLUDED_DIRS.iter().any(|dir| {
            name.contains(&format!("{}/", dir)) ||
            name.contains(&format!("{}\\", dir)) ||
            name.starts_with(&format!("{}/", dir)) ||
            name.starts_with(&format!("{}\\", dir))
        }) {
            result.skipped_files.push(format!("{} (excluded directory)", name));
            continue;
        }

        let dest_path = claude_dir.join(&name);

        // セキュリティチェック（path traversal防止）
        if !dest_path.starts_with(&claude_dir) {
            result.skipped_files.push(format!("{} (path traversal attempt)", name));
            continue;
        }

        // ディレクトリの場合
        if file.is_dir() {
            if !dest_path.exists() {
                if let Err(e) = fs::create_dir_all(&dest_path) {
                    result.errors.push(format!("Failed to create directory {}: {}", name, e));
                }
            }
            continue;
        }

        // ファイルの拡張子チェック
        let ext = dest_path.extension()
            .and_then(|e| e.to_str())
            .unwrap_or("");
        if ext != "md" && ext != "json" && ext != "jsonl" {
            result.skipped_files.push(format!("{} (invalid extension)", name));
            continue;
        }

        // 親ディレクトリの作成
        if let Some(parent) = dest_path.parent() {
            if !parent.exists() {
                if let Err(e) = fs::create_dir_all(parent) {
                    result.errors.push(format!("Failed to create parent directory: {}", e));
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
                    warn!("Failed to create backup for {}: {}", name, e);
                }
            }
        }

        // ファイルの展開
        let mut contents = Vec::new();
        if let Err(e) = file.read_to_end(&mut contents) {
            result.errors.push(format!("Failed to read {} from ZIP: {}", name, e));
            continue;
        }

        let mut dest_file = match File::create(&dest_path) {
            Ok(f) => f,
            Err(e) => {
                result.errors.push(format!("Failed to create {}: {}", name, e));
                continue;
            }
        };

        if let Err(e) = dest_file.write_all(&contents) {
            result.errors.push(format!("Failed to write {}: {}", name, e));
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            get_file_tree,
            read_file,
            write_file,
            create_backup,
            get_backups,
            restore_backup,
            search_files,
            cleanup_old_backups,
            export_file,
            export_all_zip,
            get_export_file_count,
            check_file_exists,
            check_files_exist,
            import_file,
            preview_zip,
            import_zip,
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // アプリ起動時に古いバックアップを自動クリーンアップ
            perform_startup_cleanup();

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
