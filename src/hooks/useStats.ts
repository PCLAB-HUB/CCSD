/**
 * @fileoverview 統計データ取得フック
 * @module hooks/useStats
 *
 * ~/.claude/ 配下の統計データを取得・集計するカスタムフック
 * Tauriバックエンドの `get_stats` コマンドを使用してデータを取得
 */

import { useCallback, useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'

import type { Stats } from '../types/stats'

/**
 * 統計データの状態を表すインターフェース
 */
interface UseStatsState {
  /** 統計データ（未取得の場合はnull） */
  stats: Stats | null
  /** データ読み込み中フラグ */
  loading: boolean
  /** エラーメッセージ（エラーがない場合はnull） */
  error: string | null
}

/**
 * useStatsフックの戻り値
 */
interface UseStatsReturn extends UseStatsState {
  /** 統計データを再取得する関数 */
  refetch: () => Promise<void>
}

/**
 * 統計データを取得・管理するカスタムフック
 *
 * 取得するデータ:
 * - サブエージェント数（agents/categories/ 配下のファイル数）
 * - カテゴリ数（agents/categories/ 配下のディレクトリ数）
 * - スキル数（skills/ 配下）
 * - MCPサーバー数（settings.json の mcpServers から）
 * - プラグイン数（plugins/ または設定から）
 * - バックアップ数（backups/ 配下）
 * - 総ファイル数
 * - 最終更新日時
 *
 * @returns 統計データ、読み込み状態、エラー、再取得関数
 *
 * @example
 * ```tsx
 * function StatsPanel() {
 *   const { stats, loading, error, refetch } = useStats()
 *
 *   if (loading) return <Spinner />
 *   if (error) return <ErrorMessage>{error}</ErrorMessage>
 *   if (!stats) return null
 *
 *   return (
 *     <div>
 *       <p>サブエージェント: {stats.subAgentCount}</p>
 *       <p>スキル: {stats.skillCount}</p>
 *       <button onClick={refetch}>更新</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useStats(): UseStatsReturn {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * 統計データを取得する
   * Tauriの `get_stats` コマンドを呼び出してデータを取得
   */
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await invoke<Stats>('get_stats')
      setStats(data)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '統計データの取得に失敗しました'
      setError(errorMessage)
      console.error('Failed to fetch stats:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // コンポーネントマウント時に統計データを取得
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  }
}
