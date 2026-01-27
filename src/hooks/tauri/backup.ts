/**
 * @fileoverview バックアップ操作関連のTauri API
 * @module hooks/tauri/backup
 */

import { invokeWithBoolean, invokeWithDefault } from './utils'

import type { FileContent, FileNode } from '../../types'

// ============================================================
// バックアップ取得
// ============================================================

/**
 * バックアップ一覧を取得する
 * @returns バックアップファイルノードの配列（エラー時は空配列）
 */
export async function getBackups(): Promise<FileNode[]> {
  return invokeWithDefault<FileNode[]>('get_backups', undefined, [])
}

/**
 * バックアップファイルの内容を取得する
 * @param backupPath - バックアップファイルのパス
 * @returns バックアップの内容（エラー時はnull）
 */
export async function getBackupContent(backupPath: string): Promise<string | null> {
  const result = await invokeWithDefault<FileContent | null>('read_file', { path: backupPath }, null)
  return result?.content ?? null
}

// ============================================================
// バックアップ復元
// ============================================================

/**
 * バックアップからファイルを復元する
 * @param backupPath - バックアップファイルのパス
 * @param targetPath - 復元先のパス
 * @returns 成功時true、失敗時false
 */
export async function restoreBackup(backupPath: string, targetPath: string): Promise<boolean> {
  return invokeWithBoolean('restore_backup', { backupPath, targetPath })
}
