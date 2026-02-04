//! ターミナルPTY管理コマンド
//!
//! `portable-pty` クレートを使用してPTYを管理し、
//! フロントエンドと双方向通信を行います。

use crate::error::AppResult;
use log::{error, info, warn};
use once_cell::sync::Lazy;
use portable_pty::{native_pty_system, CommandBuilder, MasterPty, PtySize};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::{Arc, Mutex};
use std::thread;
use tauri::{AppHandle, Emitter};

/// ターミナルセッション情報
struct TerminalSession {
    /// PTYマスター
    #[allow(dead_code)]
    master: Box<dyn MasterPty + Send>,
    /// PTYライター（書き込み用）
    writer: Box<dyn Write + Send>,
    /// セッションが終了したかどうか
    closed: bool,
}

/// グローバルなターミナルセッション管理
///
/// キー: セッションID、値: `TerminalSession`
static TERMINAL_SESSIONS: Lazy<Arc<Mutex<HashMap<String, TerminalSession>>>> =
    Lazy::new(|| Arc::new(Mutex::new(HashMap::new())));

/// セッションIDカウンター
static SESSION_COUNTER: Lazy<Arc<Mutex<u64>>> = Lazy::new(|| Arc::new(Mutex::new(0)));

/// 新しいセッションIDを生成
fn generate_session_id() -> String {
    let mut counter = SESSION_COUNTER.lock().unwrap();
    *counter += 1;
    format!("terminal-{}", *counter)
}

/// ターミナルを起動
///
/// 新しいPTYセッションを作成し、シェルを起動します。
/// 出力は `terminal:output` イベントでフロントエンドに送信されます。
///
/// # Arguments
///
/// * `app_handle` - Tauriアプリハンドル（イベント送信用）
/// * `rows` - ターミナルの行数
/// * `cols` - ターミナルの列数
/// * `working_dir` - 作業ディレクトリ（オプション）
///
/// # Returns
///
/// 成功時: セッションID文字列
/// 失敗時: エラーメッセージ
///
/// # Errors
///
/// 以下の場合にエラーを返します:
/// - PTYの作成に失敗した場合
/// - シェルの起動に失敗した場合
/// - PTYリーダー/ライターの取得に失敗した場合
///
/// # Panics
///
/// 内部のMutexがポイズンされている場合にパニックします（通常は発生しません）。
#[tauri::command]
#[allow(clippy::needless_pass_by_value)]
pub fn spawn_terminal(
    app_handle: AppHandle,
    rows: u16,
    cols: u16,
    working_dir: Option<String>,
) -> AppResult<String> {
    info!(
        "Spawning terminal: rows={rows}, cols={cols}, working_dir={working_dir:?}"
    );

    // PTYシステムを取得
    let pty_system = native_pty_system();

    // PTYペアを作成
    let pair = pty_system
        .openpty(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| format!("PTYの作成に失敗しました: {e}"))?;

    // シェルコマンドを構築
    let mut cmd = CommandBuilder::new("/bin/zsh");
    cmd.arg("-l"); // ログインシェル

    // 作業ディレクトリを設定
    if let Some(ref dir) = working_dir {
        cmd.cwd(dir);
    } else if let Some(home) = dirs::home_dir() {
        cmd.cwd(home);
    }

    // 環境変数を設定
    cmd.env("TERM", "xterm-256color");
    cmd.env("COLORTERM", "truecolor");
    cmd.env("LANG", "ja_JP.UTF-8");

    // 子プロセスを起動
    let mut child = pair
        .slave
        .spawn_command(cmd)
        .map_err(|e| format!("シェルの起動に失敗しました: {e}"))?;

    // セッションIDを生成
    let session_id = generate_session_id();

    // PTY出力を読み取るリーダーを取得
    let mut reader = pair
        .master
        .try_clone_reader()
        .map_err(|e| format!("PTYリーダーの作成に失敗しました: {e}"))?;

    // PTY入力を書き込むライターを取得
    let writer = pair
        .master
        .take_writer()
        .map_err(|e| format!("PTYライターの取得に失敗しました: {e}"))?;

    // セッションを登録
    {
        let mut sessions = TERMINAL_SESSIONS.lock().unwrap();
        sessions.insert(
            session_id.clone(),
            TerminalSession {
                master: pair.master,
                writer,
                closed: false,
            },
        );
    }

    // 出力読み取りスレッドを起動
    let session_id_clone = session_id.clone();
    let app_handle_clone = app_handle.clone();
    thread::spawn(move || {
        let mut buffer = [0u8; 4096];
        loop {
            match reader.read(&mut buffer) {
                Ok(0) => {
                    // EOF - プロセス終了
                    info!("Terminal session {session_id_clone} EOF");
                    let _ = app_handle_clone.emit(
                        "terminal:exit",
                        serde_json::json!({
                            "session_id": session_id_clone,
                            "code": 0
                        }),
                    );
                    break;
                }
                Ok(n) => {
                    // 出力をフロントエンドに送信
                    let output = String::from_utf8_lossy(&buffer[..n]).to_string();
                    let _ = app_handle_clone.emit(
                        "terminal:output",
                        serde_json::json!({
                            "session_id": session_id_clone,
                            "data": output
                        }),
                    );
                }
                Err(e) => {
                    // エラー
                    error!("Terminal session {session_id_clone} read error: {e}");
                    let _ = app_handle_clone.emit(
                        "terminal:error",
                        serde_json::json!({
                            "session_id": session_id_clone,
                            "error": e.to_string()
                        }),
                    );
                    break;
                }
            }

            // セッションが閉じられたかチェック
            let sessions = TERMINAL_SESSIONS.lock().unwrap();
            if let Some(session) = sessions.get(&session_id_clone) {
                if session.closed {
                    break;
                }
            } else {
                break;
            }
        }

        // セッションをクリーンアップ
        let mut sessions = TERMINAL_SESSIONS.lock().unwrap();
        sessions.remove(&session_id_clone);
        info!("Terminal session {session_id_clone} cleaned up");
    });

    // 子プロセスの終了を監視するスレッド
    let session_id_for_wait = session_id.clone();
    thread::spawn(move || {
        match child.wait() {
            Ok(status) => {
                info!(
                    "Terminal session {session_id_for_wait} child exited with: {status:?}"
                );
                let _ = app_handle.emit(
                    "terminal:exit",
                    serde_json::json!({
                        "session_id": session_id_for_wait,
                        "code": status.exit_code()
                    }),
                );
            }
            Err(e) => {
                error!("Terminal session {session_id_for_wait} wait error: {e}");
            }
        }
    });

    info!("Terminal session {session_id} spawned successfully");
    Ok(session_id)
}

/// ターミナルに入力を送信
///
/// 指定されたセッションのPTYに入力データを書き込みます。
///
/// # Arguments
///
/// * `session_id` - ターミナルセッションID
/// * `data` - 送信する入力データ
///
/// # Returns
///
/// 成功時: `()`
/// 失敗時: エラーメッセージ
///
/// # Errors
///
/// 以下の場合にエラーを返します:
/// - セッションが存在しない場合
/// - セッションが既に閉じられている場合
/// - PTYへの書き込みに失敗した場合
///
/// # Panics
///
/// 内部のMutexがポイズンされている場合にパニックします（通常は発生しません）。
#[tauri::command]
#[allow(clippy::needless_pass_by_value)]
pub fn write_terminal(session_id: String, data: String) -> AppResult<()> {
    let mut sessions = TERMINAL_SESSIONS.lock().unwrap();

    let session = sessions
        .get_mut(&session_id)
        .ok_or_else(|| format!("セッション {session_id} が見つかりません"))?;

    if session.closed {
        return Err(format!("セッション {session_id} は既に閉じられています"));
    }

    // PTYに書き込み
    session
        .writer
        .write_all(data.as_bytes())
        .map_err(|e| format!("ターミナルへの書き込みに失敗しました: {e}"))?;

    session
        .writer
        .flush()
        .map_err(|e| format!("ターミナルへのフラッシュに失敗しました: {e}"))?;

    Ok(())
}

/// ターミナルサイズを変更
///
/// 指定されたセッションのPTYサイズを変更します。
///
/// # Arguments
///
/// * `session_id` - ターミナルセッションID
/// * `rows` - 新しい行数
/// * `cols` - 新しい列数
///
/// # Returns
///
/// 成功時: `()`
/// 失敗時: エラーメッセージ
///
/// # Errors
///
/// 以下の場合にエラーを返します:
/// - セッションが存在しない場合
/// - セッションが既に閉じられている場合
/// - サイズ変更に失敗した場合
///
/// # Panics
///
/// 内部のMutexがポイズンされている場合にパニックします（通常は発生しません）。
#[tauri::command]
#[allow(clippy::needless_pass_by_value)]
pub fn resize_terminal(session_id: String, rows: u16, cols: u16) -> AppResult<()> {
    info!("Resizing terminal {session_id}: rows={rows}, cols={cols}");

    let mut sessions = TERMINAL_SESSIONS.lock().unwrap();

    let session = sessions
        .get_mut(&session_id)
        .ok_or_else(|| format!("セッション {session_id} が見つかりません"))?;

    if session.closed {
        return Err(format!("セッション {session_id} は既に閉じられています"));
    }

    session
        .master
        .resize(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| format!("ターミナルサイズの変更に失敗しました: {e}"))?;

    Ok(())
}

/// ターミナルを終了
///
/// 指定されたセッションを終了し、リソースを解放します。
///
/// # Arguments
///
/// * `session_id` - ターミナルセッションID
///
/// # Returns
///
/// 成功時: `()`
/// 失敗時: エラーメッセージ
///
/// # Errors
///
/// この関数は常に成功を返します（セッションが存在しない場合も成功）。
///
/// # Panics
///
/// 内部のMutexがポイズンされている場合にパニックします（通常は発生しません）。
#[tauri::command]
#[allow(clippy::needless_pass_by_value)]
pub fn close_terminal(session_id: String) -> AppResult<()> {
    info!("Closing terminal session: {session_id}");

    let mut sessions = TERMINAL_SESSIONS.lock().unwrap();

    if let Some(session) = sessions.get_mut(&session_id) {
        session.closed = true;
        info!("Terminal session {session_id} marked as closed");
        Ok(())
    } else {
        warn!("Terminal session {session_id} not found (may already be closed)");
        Ok(())
    }
}

/// アクティブなターミナルセッション数を取得
///
/// デバッグ・診断用のコマンドです。
///
/// # Returns
///
/// アクティブなセッション数
///
/// # Panics
///
/// 内部のMutexがポイズンされている場合にパニックします（通常は発生しません）。
#[tauri::command]
pub fn get_terminal_session_count() -> usize {
    let sessions = TERMINAL_SESSIONS.lock().unwrap();
    sessions.len()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_session_id() {
        let id1 = generate_session_id();
        let id2 = generate_session_id();
        assert!(id1.starts_with("terminal-"));
        assert!(id2.starts_with("terminal-"));
        assert_ne!(id1, id2);
    }
}
