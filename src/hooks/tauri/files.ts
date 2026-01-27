/**
 * @fileoverview ファイル操作関連のTauri API
 * @module hooks/tauri/files
 */

import { invoke } from '@tauri-apps/api/core'

import { translateTauriCommandError } from '../../utils/errorMessages'
import { isTauri } from './utils'

import type { FileContent, FileNode } from '../../types'

// ============================================================
// 型定義
// ============================================================

/**
 * ファイル操作の結果を表す型
 */
export interface FileOperationResult<T> {
  /** 操作が成功したかどうか */
  success: boolean
  /** 操作の結果データ（成功時） */
  data: T | null
  /** エラーメッセージ（失敗時） */
  error: string | null
}

/**
 * 成功結果を生成するヘルパー
 */
function createSuccessResult<T>(data: T): FileOperationResult<T> {
  return { success: true, data, error: null }
}

/**
 * エラー結果を生成するヘルパー
 */
function createErrorResult<T>(error: string): FileOperationResult<T> {
  return { success: false, data: null, error }
}

// ============================================================
// ファイルツリー操作
// ============================================================

/**
 * ~/.claude/ 配下のファイルツリーを取得する
 * @returns ファイルノードの配列（エラー時は空配列）
 */
export async function getFileTree(): Promise<FileNode[]> {
  if (!isTauri()) {
    return []
  }

  try {
    return await invoke<FileNode[]>('get_file_tree')
  } catch (error) {
    translateTauriCommandError('get_file_tree', error)
    return []
  }
}

/**
 * ~/.claude/ 配下のファイルツリーを取得する（詳細なエラー情報付き）
 * @returns ファイル操作結果
 */
export async function getFileTreeWithResult(): Promise<FileOperationResult<FileNode[]>> {
  if (!isTauri()) {
    return createErrorResult('Tauri環境で実行されていません')
  }

  try {
    const data = await invoke<FileNode[]>('get_file_tree')
    return createSuccessResult(data)
  } catch (error) {
    const message = translateTauriCommandError('get_file_tree', error)
    return createErrorResult(message)
  }
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
  if (!isTauri()) {
    return null
  }

  try {
    return await invoke<FileContent>('read_file', { path })
  } catch (error) {
    translateTauriCommandError('read_file', error)
    return null
  }
}

/**
 * 指定パスのファイルを読み込む（詳細なエラー情報付き）
 * @param path - 読み込むファイルのパス
 * @returns ファイル操作結果
 */
export async function readFileWithResult(path: string): Promise<FileOperationResult<FileContent>> {
  if (!isTauri()) {
    return createErrorResult('Tauri環境で実行されていません')
  }

  try {
    const data = await invoke<FileContent>('read_file', { path })
    return createSuccessResult(data)
  } catch (error) {
    const message = translateTauriCommandError('read_file', error)
    return createErrorResult(message)
  }
}

/**
 * 指定パスにファイルを書き込む
 * @param path - 書き込み先のファイルパス
 * @param content - 書き込む内容
 * @returns 成功時true、失敗時false
 */
export async function writeFile(path: string, content: string): Promise<boolean> {
  if (!isTauri()) {
    return false
  }

  try {
    await invoke('write_file', { path, content })
    return true
  } catch (error) {
    translateTauriCommandError('write_file', error)
    return false
  }
}

/**
 * void型の操作結果を生成するヘルパー
 */
function createVoidSuccessResult(): FileOperationResult<void> {
  return { success: true, data: undefined, error: null }
}

/**
 * 指定パスにファイルを書き込む（詳細なエラー情報付き）
 * @param path - 書き込み先のファイルパス
 * @param content - 書き込む内容
 * @returns ファイル操作結果
 */
export async function writeFileWithResult(path: string, content: string): Promise<FileOperationResult<void>> {
  if (!isTauri()) {
    return createErrorResult('Tauri環境で実行されていません')
  }

  try {
    await invoke('write_file', { path, content })
    return createVoidSuccessResult()
  } catch (error) {
    const message = translateTauriCommandError('write_file', error)
    return createErrorResult(message)
  }
}

/**
 * 新規ファイルを作成する（必要に応じてディレクトリも作成）
 * @param path - 作成するファイルのパス (~/.claude/ 配下)
 * @param content - ファイルの内容
 * @returns 成功時true、失敗時false
 */
export async function createFile(path: string, content: string): Promise<boolean> {
  if (!isTauri()) {
    return false
  }

  try {
    await invoke('create_file', { path, content })
    return true
  } catch (error) {
    translateTauriCommandError('create_file', error)
    return false
  }
}

/**
 * 新規ファイルを作成する（詳細なエラー情報付き）
 * @param path - 作成するファイルのパス (~/.claude/ 配下)
 * @param content - ファイルの内容
 * @returns ファイル操作結果
 */
export async function createFileWithResult(path: string, content: string): Promise<FileOperationResult<void>> {
  if (!isTauri()) {
    return createErrorResult('Tauri環境で実行されていません')
  }

  try {
    await invoke('create_file', { path, content })
    return createVoidSuccessResult()
  } catch (error) {
    const message = translateTauriCommandError('create_file', error)
    return createErrorResult(message)
  }
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
  if (!isTauri()) {
    return []
  }

  try {
    return await invoke<FileContent[]>('search_files', { query })
  } catch (error) {
    translateTauriCommandError('search_files', error)
    return []
  }
}

/**
 * ファイル内容を検索する（詳細なエラー情報付き）
 * @param query - 検索クエリ
 * @returns ファイル操作結果
 */
export async function searchFilesWithResult(query: string): Promise<FileOperationResult<FileContent[]>> {
  if (!isTauri()) {
    return createErrorResult('Tauri環境で実行されていません')
  }

  try {
    const data = await invoke<FileContent[]>('search_files', { query })
    return createSuccessResult(data)
  } catch (error) {
    const message = translateTauriCommandError('search_files', error)
    return createErrorResult(message)
  }
}

// ============================================================
// 検索・置換
// ============================================================

/**
 * 検索・置換の結果を表す型
 */
export interface ReplaceResult {
  /** 置換が成功したかどうか */
  success: boolean
  /** 置換された箇所の数 */
  replaced_count: number
  /** 置換後の新しい内容 */
  new_content: string
  /** エラーメッセージ（エラーがない場合はnull） */
  error: string | null
}

/**
 * 検索・置換のオプション
 */
export interface SearchReplaceOptions {
  /** 大文字小文字を区別するかどうか */
  caseSensitive: boolean
  /** 単語単位で検索するかどうか */
  wholeWord: boolean
  /** 正規表現を使用するかどうか */
  useRegex: boolean
  /** 全ての一致を置換するかどうか（falseの場合は最初の一致のみ） */
  replaceAll: boolean
}

/**
 * デフォルトのエラー結果を生成する
 * @param error - エラーメッセージ
 * @returns ReplaceResult
 */
function createErrorReplaceResult(error: string): ReplaceResult {
  return {
    success: false,
    replaced_count: 0,
    new_content: '',
    error,
  }
}

/**
 * 検索・置換エラーを日本語に変換
 * @param error - エラーオブジェクト
 * @returns 日本語のエラーメッセージ
 */
function translateSearchReplaceError(error: unknown): string {
  const errorMessage = error instanceof Error ? error.message : String(error)

  // 正規表現エラーのパターン
  if (/invalid regex|regex error|regex syntax/i.test(errorMessage)) {
    return '正規表現の構文が無効です'
  }
  if (/empty pattern|empty search/i.test(errorMessage)) {
    return '検索文字列が空です'
  }
  if (/no match/i.test(errorMessage)) {
    return '一致する文字列が見つかりません'
  }

  return translateTauriCommandError('search_and_replace_in_file', error)
}

/**
 * ファイル内の文字列を検索して置換する
 * @param path - 対象ファイルのパス
 * @param search - 検索する文字列またはパターン
 * @param replace - 置換後の文字列
 * @param options - 検索・置換のオプション
 * @returns 置換結果（エラー時はerrorフィールドにメッセージが含まれる）
 */
export async function searchAndReplaceInFile(
  path: string,
  search: string,
  replace: string,
  options: SearchReplaceOptions
): Promise<ReplaceResult> {
  if (!isTauri()) {
    return createErrorReplaceResult('Tauri環境で実行されていません')
  }

  // 入力検証
  if (!search) {
    return createErrorReplaceResult('検索文字列を入力してください')
  }

  if (!path) {
    return createErrorReplaceResult('ファイルパスが指定されていません')
  }

  try {
    const result = await invoke<ReplaceResult>('search_and_replace_in_file', {
      path,
      search,
      replace,
      caseSensitive: options.caseSensitive,
      wholeWord: options.wholeWord,
      useRegex: options.useRegex,
      replaceAll: options.replaceAll,
    })

    // Rustから返されたエラーも日本語化
    if (!result.success && result.error) {
      return {
        ...result,
        error: translateSearchReplaceError(result.error),
      }
    }

    return result
  } catch (error) {
    const message = translateSearchReplaceError(error)
    return createErrorReplaceResult(message)
  }
}
