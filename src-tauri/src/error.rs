//! カスタムエラー型の定義
//!
//! アプリケーション全体で使用するエラー型を定義します。
//! フロントエンドへのエラーメッセージの一貫性を保証します。

use serde::{Deserialize, Serialize};
use std::fmt;
use std::io;

/// アプリケーション全体で使用するエラー型
#[derive(Debug)]
pub enum AppError {
    /// ホームディレクトリが見つからない
    HomeNotFound,
    /// Claudeディレクトリが見つからない
    ClaudeDirNotFound,
    /// アクセス拒否（セキュリティ違反）
    AccessDenied(String),
    /// ファイルが見つからない
    FileNotFound(String),
    /// ファイルが既に存在する
    FileAlreadyExists(String),
    /// ファイル操作エラー
    IoError(String),
    /// ZIPファイル操作エラー
    ZipError(String),
    /// パス操作エラー
    PathError(String),
    /// 時間計算エラー
    TimeError(String),
    /// 無効なファイルタイプ
    InvalidFileType(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::HomeNotFound => write!(f, "Could not find home directory"),
            Self::ClaudeDirNotFound => write!(f, "~/.claude directory not found"),
            Self::AccessDenied(msg) => write!(f, "Access denied: {msg}"),
            Self::FileNotFound(path) => write!(f, "File not found: {path}"),
            Self::FileAlreadyExists(path) => {
                write!(f, "File already exists: {path}. Use write_file to update existing files.")
            }
            Self::IoError(msg) => write!(f, "{msg}"),
            Self::ZipError(msg) => write!(f, "{msg}"),
            Self::PathError(msg) => write!(f, "{msg}"),
            Self::TimeError(msg) => write!(f, "{msg}"),
            Self::InvalidFileType(ext) => {
                write!(f, "Invalid file type: {ext}. Only .md, .json, .jsonl are allowed")
            }
        }
    }
}

impl std::error::Error for AppError {}

impl From<io::Error> for AppError {
    fn from(err: io::Error) -> Self {
        Self::IoError(err.to_string())
    }
}

impl From<zip::result::ZipError> for AppError {
    fn from(err: zip::result::ZipError) -> Self {
        Self::ZipError(err.to_string())
    }
}

/// Tauriコマンド用のResult型エイリアス
pub type AppResult<T> = Result<T, String>;

/// `AppError`を`String`に変換するトレイト実装
impl From<AppError> for String {
    fn from(err: AppError) -> Self {
        err.to_string()
    }
}

/// Serialize/Deserialize可能なエラーレスポンス
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ErrorResponse {
    pub code: String,
    pub message: String,
}

impl From<AppError> for ErrorResponse {
    fn from(err: AppError) -> Self {
        let code = match &err {
            AppError::HomeNotFound => "HOME_NOT_FOUND",
            AppError::ClaudeDirNotFound => "CLAUDE_DIR_NOT_FOUND",
            AppError::AccessDenied(_) => "ACCESS_DENIED",
            AppError::FileNotFound(_) => "FILE_NOT_FOUND",
            AppError::FileAlreadyExists(_) => "FILE_ALREADY_EXISTS",
            AppError::IoError(_) => "IO_ERROR",
            AppError::ZipError(_) => "ZIP_ERROR",
            AppError::PathError(_) => "PATH_ERROR",
            AppError::TimeError(_) => "TIME_ERROR",
            AppError::InvalidFileType(_) => "INVALID_FILE_TYPE",
        };
        Self {
            code: code.to_string(),
            message: err.to_string(),
        }
    }
}
