import { invoke } from '@tauri-apps/api/core'

export interface FileNode {
  name: string
  path: string
  file_type: 'file' | 'directory'
  children?: FileNode[]
}

export interface FileContent {
  path: string
  content: string
  name: string
}

export async function getFileTree(): Promise<FileNode[]> {
  try {
    return await invoke<FileNode[]>('get_file_tree')
  } catch {
    return []
  }
}

export async function readFile(path: string): Promise<FileContent | null> {
  try {
    return await invoke<FileContent>('read_file', { path })
  } catch {
    return null
  }
}

export async function writeFile(path: string, content: string): Promise<boolean> {
  try {
    await invoke('write_file', { path, content })
    return true
  } catch {
    return false
  }
}

/**
 * 新規ファイルを作成（必要に応じてディレクトリも作成）
 * @param path 作成するファイルのパス (~/.claude/ 配下)
 * @param content ファイルの内容
 */
export async function createFile(path: string, content: string): Promise<boolean> {
  try {
    await invoke('create_file', { path, content })
    return true
  } catch (error) {
    console.error('Failed to create file:', error)
    return false
  }
}

export async function searchFiles(query: string): Promise<FileContent[]> {
  try {
    return await invoke<FileContent[]>('search_files', { query })
  } catch {
    return []
  }
}

export async function getBackups(): Promise<FileNode[]> {
  try {
    return await invoke<FileNode[]>('get_backups')
  } catch {
    return []
  }
}

export async function restoreBackup(backupPath: string, targetPath: string): Promise<boolean> {
  try {
    await invoke('restore_backup', { backupPath, targetPath })
    return true
  } catch {
    return false
  }
}

export interface BackupInfo {
  path: string
  name: string
  originalPath: string
  timestamp: string
  content: string
}

export async function getBackupContent(backupPath: string): Promise<string | null> {
  try {
    const result = await invoke<FileContent>('read_file', { path: backupPath })
    return result.content
  } catch {
    return null
  }
}

// エクスポート関連

/**
 * 単一ファイルをエクスポート
 * @param sourcePath エクスポート元のパス (~/.claude/ 配下)
 * @param destPath エクスポート先のパス
 */
export async function exportFile(sourcePath: string, destPath: string): Promise<boolean> {
  try {
    await invoke('export_file', { sourcePath, destPath })
    return true
  } catch (error) {
    console.error('Failed to export file:', error)
    return false
  }
}

/**
 * ~/.claude/ 全体をZIPでエクスポート
 * @param destPath エクスポート先のZIPファイルパス
 * @returns エクスポートされたファイル数
 */
export async function exportAllZip(destPath: string): Promise<number> {
  try {
    return await invoke<number>('export_all_zip', { destPath })
  } catch (error) {
    console.error('Failed to export ZIP:', error)
    throw error
  }
}

/**
 * エクスポート対象のファイル数を取得
 */
export async function getExportFileCount(): Promise<number> {
  try {
    return await invoke<number>('get_export_file_count')
  } catch (error) {
    console.error('Failed to get export file count:', error)
    return 0
  }
}

// ====== インポート関連 ======

export interface ImportResult {
  success: boolean
  imported_files: string[]
  skipped_files: string[]
  errors: string[]
  backup_created: boolean
}

export interface FileExistsInfo {
  exists: boolean
  path: string
  relative_path: string
}

export interface ZipFileInfo {
  name: string
  size: number
  is_directory: boolean
}

/**
 * ファイルが存在するかチェック
 * @param relativePath ~/.claude/ からの相対パス
 */
export async function checkFileExists(relativePath: string): Promise<FileExistsInfo | null> {
  try {
    return await invoke<FileExistsInfo>('check_file_exists', { relativePath })
  } catch (error) {
    console.error('Failed to check file exists:', error)
    return null
  }
}

/**
 * 複数ファイルの存在チェック
 * @param relativePaths ~/.claude/ からの相対パスの配列
 */
export async function checkFilesExist(relativePaths: string[]): Promise<FileExistsInfo[]> {
  try {
    return await invoke<FileExistsInfo[]>('check_files_exist', { relativePaths })
  } catch (error) {
    console.error('Failed to check files exist:', error)
    return []
  }
}

/**
 * 単一ファイルのインポート
 * @param sourcePath インポート元のファイルパス（外部）
 * @param relativeDest ~/.claude/ からの相対パス
 * @param shouldBackup 既存ファイルのバックアップを作成するか
 */
export async function importFile(
  sourcePath: string,
  relativeDest: string,
  shouldBackup: boolean = true
): Promise<ImportResult> {
  try {
    return await invoke<ImportResult>('import_file', { sourcePath, relativeDest, shouldBackup })
  } catch (error) {
    console.error('Failed to import file:', error)
    return {
      success: false,
      imported_files: [],
      skipped_files: [],
      errors: [String(error)],
      backup_created: false,
    }
  }
}

/**
 * ZIPファイルの内容をプレビュー
 * @param zipPath ZIPファイルのパス
 */
export async function previewZip(zipPath: string): Promise<ZipFileInfo[]> {
  try {
    return await invoke<ZipFileInfo[]>('preview_zip', { zipPath })
  } catch (error) {
    console.error('Failed to preview ZIP:', error)
    return []
  }
}

/**
 * ZIPファイルのインポート（全設定復元）
 * @param zipPath ZIPファイルのパス
 * @param createBackups 既存ファイルのバックアップを作成するか
 */
export async function importZip(
  zipPath: string,
  createBackups: boolean = true
): Promise<ImportResult> {
  try {
    return await invoke<ImportResult>('import_zip', { zipPath, createBackups })
  } catch (error) {
    console.error('Failed to import ZIP:', error)
    return {
      success: false,
      imported_files: [],
      skipped_files: [],
      errors: [String(error)],
      backup_created: false,
    }
  }
}

// Tauri環境かどうかを判定
// Tauri v2では __TAURI_INTERNALS__ も使用される
export function isTauri(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  return '__TAURI__' in window || '__TAURI_INTERNALS__' in window
}
