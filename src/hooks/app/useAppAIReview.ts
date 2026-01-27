import { useState, useCallback, useMemo } from 'react'
import { useAIReview } from '../useAIReview'

/**
 * AIレビューパネル用のサジェスション型
 */
export interface AIReviewPanelSuggestion {
  id: string
  severity: 'error' | 'warning' | 'info'
  title: string
  description: string
  line?: number
  before?: string
  after?: string
}

/**
 * AIレビューパネル用の結果型
 */
export interface AIReviewPanelResult {
  summary: string
  suggestions: AIReviewPanelSuggestion[]
  overallScore: number
  reviewedAt: Date
}

/**
 * useAppAIReviewの戻り値の型
 */
export interface UseAppAIReviewReturn {
  // パネル状態
  isAIReviewPanelOpen: boolean
  openAIReviewPanel: () => void
  closeAIReviewPanel: () => void

  // AIレビュー状態
  status: 'idle' | 'loading' | 'success' | 'error'
  result: AIReviewPanelResult | null
  error: string | null

  // アクション
  runReview: () => void
  retryReview: () => void
}

interface UseAppAIReviewOptions {
  /** 選択中のファイル情報 */
  selectedFile: {
    name: string
    path: string
    content: string
  } | null
}

/**
 * App.tsx用のAIレビュー統合フック
 *
 * useAIReviewを拡張し、以下の機能を統合:
 * - パネルの開閉状態管理
 * - AIReviewPanel用の結果変換
 * - ファイル情報の管理
 */
export function useAppAIReview({
  selectedFile,
}: UseAppAIReviewOptions): UseAppAIReviewReturn {
  // パネル表示状態
  const [isAIReviewPanelOpen, setIsAIReviewPanelOpen] = useState(false)

  // 基本のAIレビュー機能
  const {
    status: aiReviewStatus,
    result: aiReviewResult,
    error: aiReviewError,
    runReview: baseRunReview,
  } = useAIReview()

  /**
   * パネルを開く
   */
  const openAIReviewPanel = useCallback(() => {
    setIsAIReviewPanelOpen(true)
  }, [])

  /**
   * パネルを閉じる
   */
  const closeAIReviewPanel = useCallback(() => {
    setIsAIReviewPanelOpen(false)
  }, [])

  /**
   * AIレビューを実行（パネルを開いてレビュー開始）
   */
  const runReview = useCallback(() => {
    if (selectedFile) {
      setIsAIReviewPanelOpen(true)
      baseRunReview(selectedFile.name, selectedFile.path, selectedFile.content)
    }
  }, [selectedFile, baseRunReview])

  /**
   * AIレビューを再試行
   */
  const retryReview = useCallback(() => {
    if (selectedFile) {
      baseRunReview(selectedFile.name, selectedFile.path, selectedFile.content)
    }
  }, [selectedFile, baseRunReview])

  /**
   * AIレビュー結果をパネル用の形式に変換
   */
  const panelResult = useMemo((): AIReviewPanelResult | null => {
    if (!aiReviewResult) return null

    return {
      summary: aiReviewResult.summary,
      suggestions: aiReviewResult.suggestions.map(s => ({
        id: s.id,
        severity: s.severity === 'critical' ? 'error' as const :
                  s.severity === 'warning' ? 'warning' as const : 'info' as const,
        title: s.title,
        description: s.description,
        line: s.lineNumber,
        before: s.before,
        after: s.after,
      })),
      overallScore: aiReviewResult.score.overall,
      reviewedAt: new Date(aiReviewResult.timestamp),
    }
  }, [aiReviewResult])

  /**
   * ステータスをパネル用の形式に変換
   */
  const status = useMemo((): 'idle' | 'loading' | 'success' | 'error' => {
    switch (aiReviewStatus) {
      case 'loading':
        return 'loading'
      case 'success':
        return 'success'
      case 'error':
        return 'error'
      default:
        return 'idle'
    }
  }, [aiReviewStatus])

  return {
    // パネル状態
    isAIReviewPanelOpen,
    openAIReviewPanel,
    closeAIReviewPanel,

    // AIレビュー状態
    status,
    result: panelResult,
    error: aiReviewError?.message || null,

    // アクション
    runReview,
    retryReview,
  }
}
