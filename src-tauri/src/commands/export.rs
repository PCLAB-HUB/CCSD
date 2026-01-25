//! エクスポート操作コマンド
//!
//! ファイルのエクスポート機能を提供します。
//! 単一ファイルのエクスポートとZIPによる一括エクスポートに対応。

use crate::error::AppResult;
use crate::utils::{
    get_claude_dir, is_allowed_extension, is_excluded_path, validate_path_security,
    ALLOWED_EXTENSIONS, EXCLUDED_DIRS,
};
use log::info;
use std::fs::File;
use std::io::{Read, Write};
use std::path::PathBuf;
use std::{fs, io};
use walkdir::WalkDir;
use zip::write::SimpleFileOptions;
use zip::ZipWriter;

/// 単一ファイルをエクスポート
///
/// # Arguments
///
/// * `source_path` - エクスポート元のパス（~/.claude/配下）
/// * `dest_path` - エクスポート先のパス
///
/// # Security
///
/// ソースファイルは~/.claude/配下のみ許可されます。
#[tauri::command]
pub fn export_file(source_path: String, dest_path: String) -> AppResult<()> {
    let source_buf = PathBuf::from(&source_path);
    let dest_buf = PathBuf::from(&dest_path);
    let claude_dir = get_claude_dir().map_err(|e| e.to_string())?;

    // セキュリティチェック
    validate_path_security(&source_buf, &claude_dir).map_err(|e| e.to_string())?;

    if !source_buf.exists() {
        return Err("Source file does not exist".to_string());
    }

    // 親ディレクトリが存在しない場合は作成
    if let Some(parent) = dest_buf.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create destination directory: {e}"))?;
        }
    }

    fs::copy(&source_buf, &dest_buf).map_err(|e| format!("Failed to export file: {e}"))?;

    info!("Exported file: {source_path} -> {dest_path}");
    Ok(())
}

/// ~/.claude/ 全体をZIPでエクスポート
///
/// # Arguments
///
/// * `dest_path` - ZIPファイルの出力先パス
///
/// # Returns
///
/// エクスポートしたファイル数
#[tauri::command]
pub fn export_all_zip(dest_path: String) -> AppResult<u32> {
    let claude_dir = get_claude_dir().map_err(|e| e.to_string())?;
    let dest_buf = PathBuf::from(&dest_path);

    if !claude_dir.exists() {
        return Err("~/.claude directory not found".to_string());
    }

    // 親ディレクトリが存在しない場合は作成
    if let Some(parent) = dest_buf.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create destination directory: {e}"))?;
        }
    }

    // ZIPファイルを作成
    let zip_file = File::create(&dest_buf).map_err(|e| format!("Failed to create ZIP file: {e}"))?;
    let mut zip = ZipWriter::new(zip_file);

    let options = SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .unix_permissions(0o644);

    let file_count = write_directory_to_zip(&mut zip, &claude_dir, &claude_dir, options)?;

    zip.finish()
        .map_err(|e| format!("Failed to finalize ZIP file: {e}"))?;

    info!("Exported {file_count} files to ZIP: {dest_path}");
    Ok(file_count)
}

/// ディレクトリの内容をZIPに書き込む
fn write_directory_to_zip<W: Write + io::Seek>(
    zip: &mut ZipWriter<W>,
    dir: &PathBuf,
    base_dir: &PathBuf,
    options: SimpleFileOptions,
) -> AppResult<u32> {
    let mut file_count: u32 = 0;

    for entry in WalkDir::new(dir).into_iter().filter_map(|e| e.ok()) {
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

        // 相対パスを計算
        let relative_path = path
            .strip_prefix(base_dir)
            .map_err(|e| format!("Failed to calculate relative path: {e}"))?;

        let relative_str = relative_path.to_string_lossy();

        if path.is_file() {
            // 許可された拡張子のファイルのみエクスポート
            if !is_allowed_extension(path) {
                continue;
            }

            // ファイルをZIPに追加
            zip.start_file(relative_str.to_string(), options)
                .map_err(|e| format!("Failed to add file to ZIP: {e}"))?;

            let mut file =
                File::open(path).map_err(|e| format!("Failed to open file {path_str}: {e}"))?;
            let mut buffer = Vec::new();
            file.read_to_end(&mut buffer)
                .map_err(|e| format!("Failed to read file {path_str}: {e}"))?;

            zip.write_all(&buffer)
                .map_err(|e| format!("Failed to write file to ZIP: {e}"))?;

            file_count += 1;
        } else if path.is_dir() && !relative_str.is_empty() {
            // ディレクトリをZIPに追加
            let dir_name = format!("{relative_str}/");
            zip.add_directory(dir_name, options)
                .map_err(|e| format!("Failed to add directory to ZIP: {e}"))?;
        }
    }

    Ok(file_count)
}

/// エクスポート対象のファイル数を取得
///
/// # Returns
///
/// エクスポート対象となるファイルの数
#[tauri::command]
pub fn get_export_file_count() -> AppResult<u32> {
    let claude_dir = get_claude_dir().map_err(|e| e.to_string())?;
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

        // 許可された拡張子のファイルのみカウント
        let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
        if ALLOWED_EXTENSIONS.contains(&ext) {
            count += 1;
        }
    }

    Ok(count)
}
