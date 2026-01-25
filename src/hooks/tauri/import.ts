/**
 * @fileoverview インポート操作関連のTauri API
 * @module hooks/tauri/import
 */

import { invoke } from '@tauri-apps/api/core'
import type { ImportResult, FileExistsInfo, ZipFileInfo } from '../../types'
import { invokeWithDefault, createErrorImportResult } from './utils'

// ============================================================
// ファイル存在チェック
// ============================================================

/**
 * ファイルが存在するかチェックする
 * @param relativePath - ~/.claude/ からの相対パス
 * @returns ファイル存在情報（エラー時はnull）
 */
export async function checkFileExists(relativePath: string): Promise<FileExistsInfo | null> {
  return invokeWithDefault<FileExistsInfo | null>('check_file_exists', { relativePath }, null, true)
}

/**
 * 複数ファイルの存在チェックを行う
 * @param relativePaths - ~/.claude/ からの相対パスの配列
 * @returns ファイル存在情報の配列（エラー時は空配列）
 */
export async function checkFilesExist(relativePaths: string[]): Promise<FileExistsInfo[]> {
  return invokeWithDefault<FileExistsInfo[]>('check_files_exist', { relativePaths }, [], true)
}

// ============================================================
// ファイルインポート
// ============================================================

/**
 * 単一ファイルをインポートする
 * @param sourcePath - インポート元のファイルパス（外部）
 * @param relativeDest - ~/.claude/ からの相対パス
 * @param shouldBackup - 既存ファイルのバックアップを作成するか（デフォルト: true）
 * @returns インポート結果
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
    return createErrorImportResult([String(error)])
  }
}

// ============================================================
// ZIPインポート
// ============================================================

/**
 * ZIPファイルの内容をプレビューする
 * @param zipPath - ZIPファイルのパス
 * @returns ZIPファイル内のエントリ情報の配列（エラー時は空配列）
 */
export async function previewZip(zipPath: string): Promise<ZipFileInfo[]> {
  return invokeWithDefault<ZipFileInfo[]>('preview_zip', { zipPath }, [], true)
}

/**
 * ZIPファイルをインポートする（全設定復元）
 * @param zipPath - ZIPファイルのパス
 * @param createBackups - 既存ファイルのバックアップを作成するか（デフォルト: true）
 * @returns インポート結果
 */
export async function importZip(
  zipPath: string,
  createBackups: boolean = true
): Promise<ImportResult> {
  try {
    return await invoke<ImportResult>('import_zip', { zipPath, createBackups })
  } catch (error) {
    console.error('Failed to import ZIP:', error)
    return createErrorImportResult([String(error)])
  }
}
