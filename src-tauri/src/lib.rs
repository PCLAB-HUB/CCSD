//! Claude Setting Dashboard - Rustバックエンド
//!
//! Claude Code設定ファイルを一元管理するダッシュボードアプリケーションの
//! Tauriバックエンド実装です。
//!
//! # モジュール構成
//!
//! - `commands` - Tauriコマンド（フロントエンドから呼び出される関数）
//!   - `files` - ファイル操作（読み書き、検索、ツリー取得）
//!   - `backup` - バックアップ操作（作成、復元、クリーンアップ）
//!   - `export` - エクスポート操作（単体、ZIP一括）
//!   - `import` - インポート操作（単体、ZIP復元）
//!   - `template` - カスタムテンプレート操作（CRUD）
//!   - `favorites` - お気に入り操作（追加、削除、並べ替え）
//! - `error` - カスタムエラー型
//! - `types` - 共通データ型
//! - `utils` - ユーティリティ関数

pub mod commands;
pub mod error;
pub mod types;
pub mod utils;

use commands::backup::perform_startup_cleanup;
use commands::{
    // files
    create_file,
    get_file_tree,
    read_file,
    search_and_replace_in_file,
    search_files,
    write_file,
    // backup
    cleanup_old_backups,
    create_backup,
    get_backups,
    restore_backup,
    // export
    export_all_zip,
    export_file,
    get_export_file_count,
    // import
    check_file_exists,
    check_files_exist,
    import_file,
    import_zip,
    preview_zip,
    // template
    delete_custom_template,
    get_custom_template,
    get_custom_templates,
    save_custom_template,
    // favorites
    add_favorite,
    get_favorites,
    remove_favorite,
    reorder_favorites,
    // window
    close_preview_window,
    is_preview_window_open,
    open_preview_window,
    // stats
    get_stats,
    get_stats_detail,
};

/// アプリケーションのエントリーポイント
///
/// Tauriアプリケーションを初期化し、コマンドハンドラーを登録します。
/// 起動時に古いバックアップの自動クリーンアップも実行されます。
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            // ファイル操作
            get_file_tree,
            read_file,
            write_file,
            create_file,
            search_files,
            search_and_replace_in_file,
            // バックアップ操作
            create_backup,
            get_backups,
            restore_backup,
            cleanup_old_backups,
            // エクスポート操作
            export_file,
            export_all_zip,
            get_export_file_count,
            // インポート操作
            check_file_exists,
            check_files_exist,
            import_file,
            preview_zip,
            import_zip,
            // テンプレート操作
            save_custom_template,
            get_custom_templates,
            get_custom_template,
            delete_custom_template,
            // お気に入り操作
            get_favorites,
            add_favorite,
            remove_favorite,
            reorder_favorites,
            // ウィンドウ操作
            open_preview_window,
            close_preview_window,
            is_preview_window_open,
            // 統計
            get_stats,
            get_stats_detail,
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
