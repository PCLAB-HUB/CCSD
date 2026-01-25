/**
 * ファイル関連の型定義
 */

/** ファイルタイプ */
export type FileType = 'file' | 'directory'

/** ファイルツリーのノード */
export interface FileNode {
  name: string
  path: string
  file_type: FileType
  children?: FileNode[]
}

/** ファイルの内容 */
export interface FileContent {
  path: string
  content: string
  name: string
}

/** バックアップ情報 */
export interface BackupInfo {
  path: string
  name: string
  originalPath: string
  timestamp: string
  content: string
}

// ============================================================
// インポート/エクスポート関連
// ============================================================

/** インポート結果 */
export interface ImportResult {
  /** インポート成功フラグ */
  success: boolean
  /** インポートされたファイルのパス一覧 */
  imported_files: string[]
  /** スキップされたファイルのパス一覧 */
  skipped_files: string[]
  /** エラーメッセージ一覧 */
  errors: string[]
  /** バックアップ作成フラグ */
  backup_created: boolean
}

/** ファイル存在確認の結果 */
export interface FileExistsInfo {
  /** ファイルが存在するかどうか */
  exists: boolean
  /** ファイルの絶対パス */
  path: string
  /** ~/.claude/ からの相対パス */
  relative_path: string
}

/** ZIPファイル内のエントリ情報 */
export interface ZipFileInfo {
  /** エントリ名 */
  name: string
  /** サイズ（バイト） */
  size: number
  /** ディレクトリかどうか */
  is_directory: boolean
}
