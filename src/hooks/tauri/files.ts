/**
 * @fileoverview ファイル操作関連のTauri API
 * @module hooks/tauri/files
 */

import type { FileNode, FileContent } from '../../types'
import { invokeWithDefault, invokeWithBoolean } from './utils'

// ============================================================
// ファイルツリー操作
// ============================================================

/**
 * ~/.claude/ 配下のファイルツリーを取得する
 * @returns ファイルノードの配列（エラー時は空配列）
 */
export async function getFileTree(): Promise<FileNode[]> {
  return invokeWithDefault<FileNode[]>('get_file_tree', undefined, [])
}

// ============================================================
// ファイル読み書き
// ============================================================

/**
 * 指定パスのファイルを読み込む
 * @param path - 読み込むファイルのパス
 * @returns ファイルコンテンツ（エラー時はnull）
 */
export async function readFile(path: string): Promise<FileContent | null> {
  return invokeWithDefault<FileContent | null>('read_file', { path }, null)
}

/**
 * 指定パスにファイルを書き込む
 * @param path - 書き込み先のファイルパス
 * @param content - 書き込む内容
 * @returns 成功時true、失敗時false
 */
export async function writeFile(path: string, content: string): Promise<boolean> {
  return invokeWithBoolean('write_file', { path, content })
}

/**
 * 新規ファイルを作成する（必要に応じてディレクトリも作成）
 * @param path - 作成するファイルのパス (~/.claude/ 配下)
 * @param content - ファイルの内容
 * @returns 成功時true、失敗時false
 */
export async function createFile(path: string, content: string): Promise<boolean> {
  return invokeWithBoolean('create_file', { path, content }, true)
}

// ============================================================
// ファイル検索
// ============================================================

/**
 * ファイル内容を検索する
 * @param query - 検索クエリ
 * @returns マッチしたファイルコンテンツの配列（エラー時は空配列）
 */
export async function searchFiles(query: string): Promise<FileContent[]> {
  return invokeWithDefault<FileContent[]>('search_files', { query }, [])
}
