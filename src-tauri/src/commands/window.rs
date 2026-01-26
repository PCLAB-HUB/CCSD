//! ウィンドウ管理コマンド
//!
//! 新規ウィンドウの作成やウィンドウ間通信を扱うコマンド群です。

use log::info;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

/// プレビューウィンドウを開く
///
/// Markdownプレビュー専用の新規ウィンドウを作成します。
/// 既に同じラベルのウィンドウが存在する場合はフォーカスを当てます。
#[tauri::command]
pub async fn open_preview_window(app: AppHandle) -> Result<(), String> {
    let window_label = "preview";

    info!("[window] open_preview_window called");

    // 既存のウィンドウがあればフォーカス
    if let Some(window) = app.get_webview_window(window_label) {
        info!("[window] Preview window already exists, focusing");
        window.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    // 新規ウィンドウを作成
    // 開発モードでは明示的にdevサーバーのURLを指定
    // 本番モードではWebviewUrl::Appを使用
    let preview_url = if cfg!(debug_assertions) {
        // 開発環境: Vite dev serverの直接URLを使用
        // これによりパス解決の問題を回避
        let url = "http://localhost:1420/preview.html"
            .parse()
            .map_err(|e| format!("プレビューURLのパースに失敗しました: {}", e))?;
        WebviewUrl::External(url)
    } else {
        // 本番環境: Tauriアプリ内のパスを使用
        WebviewUrl::App("/preview.html".into())
    };
    info!("[window] Creating preview window with URL: {:?} (debug={})", preview_url, cfg!(debug_assertions));

    let window = WebviewWindowBuilder::new(&app, window_label, preview_url)
        .title("Markdown Preview")
        .inner_size(800.0, 600.0)
        .min_inner_size(400.0, 300.0)
        .resizable(true)
        .center()
        .build()
        .map_err(|e| {
            let err_msg = format!("Failed to create preview window: {}", e);
            log::error!("[window] {}", err_msg);
            err_msg
        })?;

    info!("[window] Preview window created successfully: {:?}", window.label());

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
