//! 共通型定義
//!
//! アプリケーション全体で使用するデータ構造を定義します。

use serde::{Deserialize, Serialize};

/// ファイルツリーのノード
///
/// ファイルまたはディレクトリを表現します。
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileNode {
    /// ファイル/ディレクトリ名
    pub name: String,
    /// 絶対パス
    pub path: String,
    /// 種別: "file" または "directory"
    pub file_type: String,
    /// 子ノード（ディレクトリの場合のみ）
    pub children: Option<Vec<FileNode>>,
}

impl FileNode {
    /// 新しいファイルノードを作成
    pub fn new_file(name: String, path: String) -> Self {
        Self {
            name,
            path,
            file_type: "file".to_string(),
            children: None,
        }
    }

    /// 新しいディレクトリノードを作成
    pub fn new_directory(name: String, path: String, children: Vec<FileNode>) -> Self {
        Self {
            name,
            path,
            file_type: "directory".to_string(),
            children: if children.is_empty() { None } else { Some(children) },
        }
    }
}

/// ファイルの内容と名前
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileContent {
    /// ファイルパス
    pub path: String,
    /// ファイル内容
    pub content: String,
    /// ファイル名
    pub name: String,
}

/// バックアップクリーンアップ結果
#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct CleanupResult {
    /// 削除したファイル数
    pub deleted_count: u32,
    /// 削除したバイト数
    pub deleted_size_bytes: u64,
    /// エラーメッセージ一覧
    pub errors: Vec<String>,
}

/// エクスポート進捗情報
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ExportProgress {
    /// 総ファイル数
    pub total_files: u32,
    /// 処理済みファイル数
    pub processed_files: u32,
    /// 現在処理中のファイル
    pub current_file: String,
}

/// インポート結果
#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct ImportResult {
    /// 成功したかどうか
    pub success: bool,
    /// インポートしたファイル一覧
    pub imported_files: Vec<String>,
    /// スキップしたファイル一覧
    pub skipped_files: Vec<String>,
    /// エラーメッセージ一覧
    pub errors: Vec<String>,
    /// バックアップを作成したかどうか
    pub backup_created: bool,
}

/// ファイル存在チェック結果
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileExistsInfo {
    /// ファイルが存在するかどうか
    pub exists: bool,
    /// 絶対パス
    pub path: String,
    /// 相対パス
    pub relative_path: String,
}

/// ZIPファイル内のファイル情報
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ZipFileInfo {
    /// ファイル名
    pub name: String,
    /// ファイルサイズ
    pub size: u64,
    /// ディレクトリかどうか
    pub is_directory: bool,
}

/// 検索置換結果
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ReplaceResult {
    /// 成功したかどうか
    pub success: bool,
    /// 置換した回数
    pub replaced_count: usize,
    /// 置換後の内容
    pub new_content: String,
    /// エラーメッセージ（エラー時のみ）
    pub error: Option<String>,
}

impl ReplaceResult {
    /// 成功結果を作成
    pub fn success(replaced_count: usize, new_content: String) -> Self {
        Self {
            success: true,
            replaced_count,
            new_content,
            error: None,
        }
    }

    /// エラー結果を作成
    pub fn error(message: impl Into<String>) -> Self {
        Self {
            success: false,
            replaced_count: 0,
            new_content: String::new(),
            error: Some(message.into()),
        }
    }
}
