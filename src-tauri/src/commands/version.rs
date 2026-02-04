//! Claude Codeバージョン取得コマンド
//!
//! `claude --version` コマンドを実行してバージョン情報を取得します。

use crate::error::AppResult;
use log::info;
use std::process::Command;

/// Claude Codeのバージョンを取得
///
/// シェルで `claude --version` を実行し、バージョン文字列を返します。
///
/// # Returns
///
/// 成功時: `"2.1.31 (Claude Code)"` のようなバージョン文字列
/// 失敗時: 日本語のエラーメッセージ
///
/// # Examples
///
/// ```ignore
/// let version = get_claude_version()?;
/// // "2.1.31 (Claude Code)"
/// ```
#[tauri::command]
pub fn get_claude_version() -> AppResult<String> {
    info!("Executing claude --version command");

    let output = Command::new("claude")
        .arg("--version")
        .output()
        .map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                "Claude Codeがインストールされていないか、PATHに含まれていません".to_string()
            } else {
                format!("コマンド実行エラー: {e}")
            }
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!(
            "claude --version の実行に失敗しました: {}",
            stderr.trim()
        ));
    }

    let version = String::from_utf8_lossy(&output.stdout)
        .trim()
        .to_string();

    if version.is_empty() {
        return Err("バージョン情報を取得できませんでした".to_string());
    }

    info!("Claude Code version: {}", version);
    Ok(version)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_claude_version_output_format() {
        // このテストはClaude Codeがインストールされている環境でのみ成功する
        // CI環境では skip される可能性がある
        if let Ok(version) = get_claude_version() {
            // バージョン文字列が空でないこと
            assert!(!version.is_empty());
            // 典型的なフォーマット: "X.Y.Z (Claude Code)" を含むことが多い
            // ただし厳密なフォーマットは変更される可能性があるため、緩いチェック
            println!("Detected Claude Code version: {}", version);
        }
    }
}
