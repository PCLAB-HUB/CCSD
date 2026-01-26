/**
 * AIレビュー機能を提供するカスタムフック
 *
 * - Claude APIを使用して設定ファイルをレビュー
 * - APIキー管理（環境変数またはユーザー入力）
 * - レビュー結果のパースと構造化
 * - ローディング状態とエラーハンドリング
 */

import { useState, useCallback, useMemo } from 'react'
import type {
  AIReviewResult,
  AIReviewStatus,
  AIReviewError,
  APIKeyModalState,
  ReviewSuggestion,
  ReviewScore,
} from '../types/aiReview'
import { REVIEW_SYSTEM_PROMPT, createReviewUserPrompt } from '../utils/aiReviewPrompt'

/** APIキー保存用のローカルストレージキー */
const API_KEY_STORAGE_KEY = 'claude-dashboard-api-key'

/** デフォルトのAPIエンドポイント */
const API_ENDPOINT = 'https://api.anthropic.com/v1/messages'

/** 使用するモデル */
const MODEL = 'claude-sonnet-4-20250514'

/** 最大トークン数 */
const MAX_TOKENS = 4096

/**
 * APIキーを取得する
 * 優先順位: 環境変数 > ローカルストレージ
 */
function getStoredAPIKey(): string | null {
  // 環境変数から取得を試みる（Vite環境）
  const envKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (envKey) {
    return envKey
  }

  // ローカルストレージから取得
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY)
  } catch {
    return null
  }
}

/**
 * APIキーをローカルストレージに保存
 */
function saveAPIKey(apiKey: string): void {
  try {
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey)
  } catch {
    console.warn('APIキーの保存に失敗しました')
  }
}

/**
 * APIキーをローカルストレージから削除
 */
function clearAPIKey(): void {
  try {
    localStorage.removeItem(API_KEY_STORAGE_KEY)
  } catch {
    console.warn('APIキーの削除に失敗しました')
  }
}

/**
 * 一意のIDを生成
 */
function generateId(): string {
  return `suggestion-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * APIレスポンスをパースしてレビュー結果を取得
 */
function parseReviewResponse(
  responseText: string,
  fileName: string,
  filePath: string
): AIReviewResult {
  // JSONブロックを抽出
  const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/)
  const jsonStr = jsonMatch ? jsonMatch[1] : responseText

  try {
    const parsed = JSON.parse(jsonStr)

    // スコアの検証とデフォルト値設定
    const score: ReviewScore = {
      overall: validateScore(parsed.score?.overall, 50),
      completeness: validateScore(parsed.score?.completeness, 50),
      security: validateScore(parsed.score?.security, 50),
      readability: validateScore(parsed.score?.readability, 50),
      bestPractice: validateScore(parsed.score?.bestPractice, 50),
    }

    // 提案の検証と整形
    const suggestions: ReviewSuggestion[] = (parsed.suggestions || [])
      .map((s: Partial<ReviewSuggestion>) => ({
        id: generateId(),
        category: validateCategory(s.category),
        severity: validateSeverity(s.severity),
        title: s.title || '提案',
        description: s.description || '',
        lineNumber: typeof s.lineNumber === 'number' ? s.lineNumber : undefined,
        before: s.before,
        after: s.after,
      }))
      .sort((a: ReviewSuggestion, b: ReviewSuggestion) => {
        const severityOrder = { critical: 0, warning: 1, info: 2, tip: 3 }
        return severityOrder[a.severity] - severityOrder[b.severity]
      })

    // 良い点の検証
    const positives: string[] = Array.isArray(parsed.positives)
      ? parsed.positives.filter((p: unknown) => typeof p === 'string')
      : []

    return {
      timestamp: new Date().toISOString(),
      fileName,
      filePath,
      score,
      summary: typeof parsed.summary === 'string' ? parsed.summary : 'レビューが完了しました。',
      suggestions,
      positives,
    }
  } catch {
    throw new Error('レビュー結果のパースに失敗しました')
  }
}

/**
 * スコアを検証（0-100の範囲に収める）
 */
function validateScore(value: unknown, defaultValue: number): number {
  if (typeof value !== 'number') return defaultValue
  return Math.max(0, Math.min(100, Math.round(value)))
}

/**
 * カテゴリを検証
 */
function validateCategory(value: unknown): ReviewSuggestion['category'] {
  const validCategories = ['completeness', 'security', 'performance', 'readability', 'best-practice']
  if (typeof value === 'string' && validCategories.includes(value)) {
    return value as ReviewSuggestion['category']
  }
  return 'best-practice'
}

/**
 * 重要度を検証
 */
function validateSeverity(value: unknown): ReviewSuggestion['severity'] {
  const validSeverities = ['critical', 'warning', 'info', 'tip']
  if (typeof value === 'string' && validSeverities.includes(value)) {
    return value as ReviewSuggestion['severity']
  }
  return 'info'
}

/**
 * Claude APIを呼び出してレビューを実行
 */
async function callClaudeAPI(
  apiKey: string,
  fileName: string,
  content: string
): Promise<string> {
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: REVIEW_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: createReviewUserPrompt(fileName, content),
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const errorMessage = (errorData as { error?: { message?: string } }).error?.message || response.statusText

    if (response.status === 401) {
      throw new Error('APIキーが無効です。正しいAPIキーを入力してください。')
    }
    if (response.status === 429) {
      throw new Error('APIレート制限に達しました。しばらく待ってから再試行してください。')
    }
    if (response.status >= 500) {
      throw new Error('APIサーバーエラーが発生しました。しばらく待ってから再試行してください。')
    }

    throw new Error(`API呼び出しに失敗しました: ${errorMessage}`)
  }

  const data = await response.json()

  // レスポンス形式の検証
  if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
    throw new Error('APIレスポンスの形式が不正です')
  }

  const textContent = data.content.find((c: { type: string }) => c.type === 'text')
  if (!textContent || typeof textContent.text !== 'string') {
    throw new Error('APIレスポンスにテキストが含まれていません')
  }

  return textContent.text
}

/**
 * useAIReviewフックの戻り値の型
 */
export interface UseAIReviewReturn {
  /** レビュー状態 */
  status: AIReviewStatus
  /** レビュー結果（成功時） */
  result: AIReviewResult | null
  /** エラー情報（エラー時） */
  error: AIReviewError | null
  /** APIキーモーダルの状態 */
  apiKeyModal: APIKeyModalState
  /** APIキーが設定されているか */
  hasAPIKey: boolean
  /** レビューを実行 */
  runReview: (fileName: string, filePath: string, content: string) => Promise<void>
  /** レビューをリセット */
  resetReview: () => void
  /** APIキーモーダルを開く */
  openAPIKeyModal: () => void
  /** APIキーモーダルを閉じる */
  closeAPIKeyModal: () => void
  /** APIキーを設定 */
  setAPIKey: (apiKey: string) => Promise<boolean>
  /** APIキーをクリア */
  clearAPIKey: () => void
  /** APIキー入力値を更新 */
  updateAPIKeyInput: (value: string) => void
}

/**
 * AIレビュー機能を提供するカスタムフック
 */
export function useAIReview(): UseAIReviewReturn {
  // レビュー状態
  const [status, setStatus] = useState<AIReviewStatus>('idle')
  const [result, setResult] = useState<AIReviewResult | null>(null)
  const [error, setError] = useState<AIReviewError | null>(null)

  // APIキーモーダル状態
  const [apiKeyModal, setApiKeyModal] = useState<APIKeyModalState>({
    isOpen: false,
    inputValue: '',
    isValidating: false,
  })

  // APIキーの有無を確認
  const hasAPIKey = useMemo(() => {
    return getStoredAPIKey() !== null
  }, [apiKeyModal.isOpen]) // モーダルが閉じた時に再評価

  /**
   * レビューを実行
   */
  const runReview = useCallback(async (
    fileName: string,
    filePath: string,
    content: string
  ): Promise<void> => {
    const apiKey = getStoredAPIKey()

    // APIキーがない場合はモーダルを表示
    if (!apiKey) {
      setApiKeyModal(prev => ({ ...prev, isOpen: true, error: undefined }))
      setError({
        code: 'api_key_missing',
        message: 'APIキーが設定されていません。APIキーを入力してください。',
      })
      return
    }

    setStatus('loading')
    setError(null)
    setResult(null)

    try {
      // API呼び出し
      const responseText = await callClaudeAPI(apiKey, fileName, content)

      // レスポンスのパース
      const reviewResult = parseReviewResponse(responseText, fileName, filePath)

      setResult(reviewResult)
      setStatus('success')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました'

      // エラータイプの判定
      let errorCode: AIReviewError['code'] = 'unknown'
      if (errorMessage.includes('APIキーが無効')) {
        errorCode = 'api_key_missing'
        // 無効なAPIキーをクリア
        clearAPIKey()
      } else if (errorMessage.includes('パースに失敗')) {
        errorCode = 'parse_error'
      } else if (errorMessage.includes('API')) {
        errorCode = 'api_error'
      } else if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        errorCode = 'network_error'
      }

      setError({
        code: errorCode,
        message: errorMessage,
      })
      setStatus('error')
    }
  }, [])

  /**
   * レビューをリセット
   */
  const resetReview = useCallback(() => {
    setStatus('idle')
    setResult(null)
    setError(null)
  }, [])

  /**
   * APIキーモーダルを開く
   */
  const openAPIKeyModal = useCallback(() => {
    setApiKeyModal({
      isOpen: true,
      inputValue: '',
      isValidating: false,
      error: undefined,
    })
  }, [])

  /**
   * APIキーモーダルを閉じる
   */
  const closeAPIKeyModal = useCallback(() => {
    setApiKeyModal(prev => ({
      ...prev,
      isOpen: false,
      isValidating: false,
      error: undefined,
    }))
  }, [])

  /**
   * APIキーを設定（簡易的な検証付き）
   */
  const setAPIKeyHandler = useCallback(async (apiKey: string): Promise<boolean> => {
    const trimmedKey = apiKey.trim()

    // 基本的な形式チェック
    if (!trimmedKey) {
      setApiKeyModal(prev => ({
        ...prev,
        error: 'APIキーを入力してください',
        isValidating: false,
      }))
      return false
    }

    if (!trimmedKey.startsWith('sk-ant-')) {
      setApiKeyModal(prev => ({
        ...prev,
        error: 'APIキーの形式が正しくありません（sk-ant-で始まる必要があります）',
        isValidating: false,
      }))
      return false
    }

    setApiKeyModal(prev => ({ ...prev, isValidating: true, error: undefined }))

    try {
      // 簡易的なAPI検証（小さなリクエストを送信）
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': trimmedKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }],
        }),
      })

      if (response.status === 401) {
        setApiKeyModal(prev => ({
          ...prev,
          error: 'APIキーが無効です',
          isValidating: false,
        }))
        return false
      }

      // 401以外はAPIキーは有効とみなす
      saveAPIKey(trimmedKey)
      setApiKeyModal(prev => ({
        ...prev,
        isOpen: false,
        inputValue: '',
        isValidating: false,
        error: undefined,
      }))
      setError(null)
      return true
    } catch {
      // ネットワークエラーの場合は一旦保存を許可
      saveAPIKey(trimmedKey)
      setApiKeyModal(prev => ({
        ...prev,
        isOpen: false,
        inputValue: '',
        isValidating: false,
        error: undefined,
      }))
      return true
    }
  }, [])

  /**
   * APIキーをクリア
   */
  const clearAPIKeyHandler = useCallback(() => {
    clearAPIKey()
    setApiKeyModal(prev => ({ ...prev, inputValue: '' }))
  }, [])

  /**
   * APIキー入力値を更新
   */
  const updateAPIKeyInput = useCallback((value: string) => {
    setApiKeyModal(prev => ({ ...prev, inputValue: value, error: undefined }))
  }, [])

  return {
    status,
    result,
    error,
    apiKeyModal,
    hasAPIKey,
    runReview,
    resetReview,
    openAPIKeyModal,
    closeAPIKeyModal,
    setAPIKey: setAPIKeyHandler,
    clearAPIKey: clearAPIKeyHandler,
    updateAPIKeyInput,
  }
}
