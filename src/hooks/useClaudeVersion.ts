/**
 * @fileoverview Claude Codeバージョン取得カスタムフック
 * @module hooks/useClaudeVersion
 */

import { useCallback, useEffect, useState } from 'react'

import { getClaudeVersionWithResult } from './tauri/version'

/**
 * useClaudeVersionの戻り値の型
 */
export interface UseClaudeVersionResult {
  /** バージョン文字列（未取得またはエラー時はnull） */
  version: string | null
  /** ローディング状態 */
  loading: boolean
  /** エラーメッセージ（エラーがない場合はnull） */
  error: string | null
  /** バージョンを再取得する関数 */
  refetch: () => Promise<void>
}

/**
 * Claude Codeのバージョンを取得するカスタムフック
 *
 * マウント時に自動的にバージョンを取得します。
 * 非Tauri環境では version が null になります。
 *
 * @returns バージョン情報と状態
 *
 * @example
 * ```tsx
 * const { version, loading, error, refetch } = useClaudeVersion()
 *
 * if (loading) return <span>読み込み中...</span>
 * if (error) return <span>エラー: {error}</span>
 * if (version) return <span>Claude Code v{version}</span>
 * return <span>バージョン不明</span>
 * ```
 */
export function useClaudeVersion(): UseClaudeVersionResult {
  const [version, setVersion] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * バージョンを取得する
   */
  const fetchVersion = useCallback(async () => {
    setLoading(true)
    setError(null)

    const result = await getClaudeVersionWithResult()

    if (result.success) {
      setVersion(result.version)
      setError(null)
    } else {
      setVersion(null)
      setError(result.error)
    }

    setLoading(false)
  }, [])

  // マウント時に自動取得
  useEffect(() => {
    fetchVersion()
  }, [fetchVersion])

  return {
    version,
    loading,
    error,
    refetch: fetchVersion,
  }
}
