/**
 * @fileoverview 統計詳細データ取得フック
 * @module hooks/useStatsDetail
 *
 * 統計パネルの各項目をクリックした時に詳細データを取得するカスタムフック
 * Tauriバックエンドの `get_stats_detail` コマンドを使用してデータを取得
 */

import { useCallback, useRef, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'

import type { StatsDetail, StatsDetailType } from '../types/stats'

/**
 * エラーメッセージの定義
 */
const ERROR_MESSAGES: Record<string, string> = {
  default: '詳細データの取得に失敗しました',
  network: 'ネットワークエラーが発生しました',
  timeout: 'タイムアウトしました',
  cancelled: 'リクエストがキャンセルされました',
}

/**
 * エラーメッセージを取得する
 * @param err エラーオブジェクト
 * @returns 日本語エラーメッセージ
 */
function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const message = err.message.toLowerCase()
    if (message.includes('network')) {
      return ERROR_MESSAGES.network
    }
    if (message.includes('timeout')) {
      return ERROR_MESSAGES.timeout
    }
    if (message.includes('cancel')) {
      return ERROR_MESSAGES.cancelled
    }
    // バックエンドからのエラーメッセージをそのまま使用
    return err.message
  }
  return ERROR_MESSAGES.default
}

/**
 * useStatsDetailフックの戻り値
 */
interface UseStatsDetailReturn {
  /** 詳細データ */
  detail: StatsDetail | null
  /** 読み込み中状態 */
  loading: boolean
  /** エラーメッセージ */
  error: string | null
  /** 詳細データを取得する関数 */
  fetchDetail: (type: StatsDetailType) => Promise<void>
  /** データをクリアする関数 */
  clearDetail: () => void
}

/**
 * 統計詳細データを取得・管理するカスタムフック
 *
 * 使用例:
 * - スキル一覧: fetchDetail('skills')
 * - サブエージェント一覧: fetchDetail('subAgents')
 * - MCPサーバー一覧: fetchDetail('mcpServers')
 *
 * @returns 詳細データ、読み込み状態、エラー、取得関数、クリア関数
 *
 * @example
 * ```tsx
 * function StatsDetailModal({ type, onClose }) {
 *   const { detail, loading, error, fetchDetail, clearDetail } = useStatsDetail()
 *
 *   useEffect(() => {
 *     fetchDetail(type)
 *     return () => clearDetail()
 *   }, [type])
 *
 *   if (loading) return <Spinner />
 *   if (error) return <ErrorMessage>{error}</ErrorMessage>
 *   if (!detail) return null
 *
 *   return (
 *     <ul>
 *       {detail.items.map(item => (
 *         <li key={item.id}>{item.name}</li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useStatsDetail(): UseStatsDetailReturn {
  const [detail, setDetail] = useState<StatsDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 連続呼び出し時の古いリクエストをキャンセルするためのカウンター
  const requestIdRef = useRef(0)

  /**
   * 詳細データを取得する
   * @param type 統計詳細の種類
   */
  const fetchDetail = useCallback(async (type: StatsDetailType) => {
    // 新しいリクエストIDを発行
    const currentRequestId = ++requestIdRef.current

    try {
      setLoading(true)
      setError(null)

      const data = await invoke<StatsDetail>('get_stats_detail', {
        detailType: type,
      })

      // 古いリクエストの結果は無視する
      if (currentRequestId !== requestIdRef.current) {
        return
      }

      setDetail(data)
    } catch (err) {
      // 古いリクエストのエラーは無視する
      if (currentRequestId !== requestIdRef.current) {
        return
      }

      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      console.error('Failed to fetch stats detail:', err)
    } finally {
      // 古いリクエストの場合はローディング状態を変更しない
      if (currentRequestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [])

  /**
   * データをクリアする
   * モーダルを閉じた時などに使用
   */
  const clearDetail = useCallback(() => {
    // リクエストIDをインクリメントして進行中のリクエストをキャンセル
    requestIdRef.current++
    setDetail(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    detail,
    loading,
    error,
    fetchDetail,
    clearDetail,
  }
}
