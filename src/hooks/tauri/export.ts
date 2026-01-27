/**
 * @fileoverview エクスポート操作関連のTauri API
 * @module hooks/tauri/export
 */

import { invokeOrThrow, invokeWithBoolean, invokeWithDefault } from './utils'

// ============================================================
// ファイルエクスポート
// ============================================================

/**
 * 単一ファイルをエクスポートする
 * @param sourcePath - エクスポート元のパス (~/.claude/ 配下)
 * @param destPath - エクスポート先のパス
 * @returns 成功時true、失敗時false
 */
export async function exportFile(sourcePath: string, destPath: string): Promise<boolean> {
  return invokeWithBoolean('export_file', { sourcePath, destPath }, true)
}

// ============================================================
// ZIPエクスポート
// ============================================================

/**
 * ~/.claude/ 全体をZIPでエクスポートする
 * @param destPath - エクスポート先のZIPファイルパス
 * @returns エクスポートされたファイル数
 * @throws {TauriError} エクスポートに失敗した場合
 */
export async function exportAllZip(destPath: string): Promise<number> {
  return invokeOrThrow<number>('export_all_zip', { destPath })
}

/**
 * エクスポート対象のファイル数を取得する
 * @returns エクスポート対象のファイル数（エラー時は0）
 */
export async function getExportFileCount(): Promise<number> {
  return invokeWithDefault<number>('get_export_file_count', undefined, 0, true)
}
