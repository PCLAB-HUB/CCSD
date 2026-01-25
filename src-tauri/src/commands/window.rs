//! ウィンドウ管理コマンド
//!
//! 新規ウィンドウの作成やウィンドウ間通信を扱うコマンド群です。

use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

/// プレビューウィンドウを開く
///
/// Markdownプレビュー専用の新規ウィンドウを作成します。
/// 既に同じラベルのウィンドウが存在する場合はフォーカスを当てます。
#[tauri::command]
pub async fn open_preview_window(app: AppHandle) -> Result<(), String> {
    let window_label = "preview";

    // 既存のウィンドウがあればフォーカス
    if let Some(window) = app.get_webview_window(window_label) {
        window.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    // 新規ウィンドウを作成
    // Viteマルチページビルドでは /preview.html が正しいパス
    WebviewWindowBuilder::new(&app, window_label, WebviewUrl::App("/preview.html".into()))
        .title("Markdown Preview")
        .inner_size(800.0, 600.0)
        .min_inner_size(400.0, 300.0)
        .resizable(true)
        .center()
        .build()
        .map_err(|e| e.to_string())?;

    Ok(())
}

/// プレビューウィンドウを閉じる
#[tauri::command]
pub async fn close_preview_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("preview") {
        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// プレビューウィンドウが開いているか確認
#[tauri::command]
pub fn is_preview_window_open(app: AppHandle) -> bool {
    app.get_webview_window("preview").is_some()
}
