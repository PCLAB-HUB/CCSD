/**
 * @fileoverview Tauri API統合エクスポート
 * @module hooks/tauri
 *
 * このモジュールは以下の機能を提供します:
 * - utils: 共通ユーティリティ（isTauri判定、エラーハンドリング）
 * - files: ファイル操作（読み書き、検索）
 * - backup: バックアップ操作（取得、復元）
 * - export: エクスポート操作（単一ファイル、ZIP）
 * - import: インポート操作（単一ファイル、ZIP）
 * - template: カスタムテンプレート操作（CRUD）
 *
 * 型定義は @/types から取得してください。
 */

// 型定義のre-export（後方互換性のため）
export type {
  FileNode,
  FileContent,
  BackupInfo,
  ImportResult,
  FileExistsInfo,
  ZipFileInfo,
  CustomTemplate,
  SaveTemplateInput,
} from '../../types'

// ユーティリティ
export { isTauri, TauriError } from './utils'

// ファイル操作
export {
  getFileTree,
  readFile,
  writeFile,
  createFile,
  searchFiles,
  searchAndReplaceInFile,
} from './files'

// 検索・置換の型
export type { ReplaceResult, SearchReplaceOptions } from './files'

// バックアップ操作
export {
  getBackups,
  getBackupContent,
  restoreBackup,
} from './backup'

// エクスポート操作
export {
  exportFile,
  exportAllZip,
  getExportFileCount,
} from './export'

// インポート操作
export {
  checkFileExists,
  checkFilesExist,
  importFile,
  previewZip,
  importZip,
} from './import'

// テンプレート操作
export {
  saveCustomTemplate,
  getCustomTemplates,
  getCustomTemplate,
  deleteCustomTemplate,
} from './template'

// お気に入り操作
export { loadFavorites, saveFavorites } from './favorites'
