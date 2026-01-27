/**
 * AIレビュー機能を提供するカスタムフック
 *
 * - Claude APIを使用して設定ファイルをレビュー
 * - APIキー管理（環境変数またはユーザー入力）
 * - レビュー結果のパースと構造化
 * - ローディング状態とエラーハンドリング
 * - 型安全なAPIレスポンス検証
 */

import { useCallback, useMemo, useState } from 'react'

import {
  AI_REVIEW_MAX_TOKENS,
  ANTHROPIC_API_ENDPOINT,
  ANTHROPIC_API_VERSION,
  API_KEY_PREFIX,
  API_KEY_VALIDATION_MAX_TOKENS,
  DEFAULT_CLAUDE_MODEL,
  DEFAULT_SCORE,
  SCORE_MAX,
  SCORE_MIN,
  STORAGE_KEY_API_KEY,
} from '../constants'
import { createReviewUserPrompt, REVIEW_SYSTEM_PROMPT } from '../utils/aiReviewPrompt'
import { logError, logWarning } from '../utils/errorMessages'

import type {
  AIReviewError,
  AIReviewResult,
  AIReviewStatus,
  APIKeyModalState,
  ReviewScore,
  ReviewSuggestion,
} from '../types/aiReview'

// ============================================================
// APIレスポンス型定義
// ============================================================

/**
 * Claude APIのコンテンツブロック型
 */
interface ClaudeContentBlock {
  type: string
  text?: string
}

/**
 * Claude APIのレスポンス型
 */
interface ClaudeAPIResponse {
  content?: ClaudeContentBlock[]
  error?: {
    message?: string
    type?: string
  }
}

/**
 * Claude APIのエラーレスポンス型
 */
interface ClaudeAPIErrorResponse {
  error?: {
    message?: string
    type?: string
  }
}

// ============================================================
// 型ガード関数
// ============================================================

/**
 * ClaudeAPIResponseの型ガード
 */
function isClaudeAPIResponse(data: unknown): data is ClaudeAPIResponse {
  if (typeof data !== 'object' || data === null) {
    return false
  }
  const obj = data as Record<string, unknown>
  // contentが存在する場合は配列であることを確認
  if ('content' in obj) {
    if (!Array.isArray(obj.content)) {
      return false
    }
    // 各コンテンツブロックの型を確認
    return obj.content.every((item: unknown) => {
      if (typeof item !== 'object' || item === null) {
        return false
      }
      const block = item as Record<string, unknown>
      return typeof block.type === 'string'
    })
  }
  return true
}

/**
 * ClaudeAPIErrorResponseの型ガード
 */
function isClaudeAPIErrorResponse(data: unknown): data is ClaudeAPIErrorResponse {
  if (typeof data !== 'object' || data === null) {
    return false
  }
  const obj = data as Record<string, unknown>
  if ('error' in obj && obj.error !== null) {
    if (typeof obj.error !== 'object') {
      return false
    }
    const error = obj.error as Record<string, unknown>
    // messageが存在する場合は文字列であることを確認
    if ('message' in error && typeof error.message !== 'string') {
      return false
    }
    return true
  }
  return true
}


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
    return localStorage.getItem(STORAGE_KEY_API_KEY)
  } catch {
    return null
  }
}

/**
 * APIキーをローカルストレージに保存
 */
function saveAPIKey(apiKey: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_API_KEY, apiKey)
  } catch (error) {
    logWarning('APIキー保存', 'APIキーの保存に失敗しました', { error })
  }
}

/**
 * APIキーをローカルストレージから削除
 */
function clearAPIKey(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_API_KEY)
  } catch (error) {
    logWarning('APIキー削除', 'APIキーの削除に失敗しました', { error })
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
      overall: validateScore(parsed.score?.overall, DEFAULT_SCORE),
      completeness: validateScore(parsed.score?.completeness, DEFAULT_SCORE),
      security: validateScore(parsed.score?.security, DEFAULT_SCORE),
      readability: validateScore(parsed.score?.readability, DEFAULT_SCORE),
      bestPractice: validateScore(parsed.score?.bestPractice, DEFAULT_SCORE),
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
  } catch (error) {
    logError('レビュー結果パース', error, { responseText, fileName, filePath })
    throw new Error('レビュー結果のパースに失敗しました')
  }
}

/**
 * スコアを検証（SCORE_MIN-SCORE_MAXの範囲に収める）
 */
function validateScore(value: unknown, defaultValue: number): number {
  if (typeof value !== 'number') return defaultValue
  return Math.max(SCORE_MIN, Math.min(SCORE_MAX, Math.round(value)))
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
 *
 * @throws {Error} APIキー無効、レート制限、サーバーエラー、ネットワークエラー時
 */
async function callClaudeAPI(
  apiKey: string,
  fileName: string,
  content: string
): Promise<string> {
  let response: Response

  try {
    response = await fetch(ANTHROPIC_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_API_VERSION,
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: DEFAULT_CLAUDE_MODEL,
        max_tokens: AI_REVIEW_MAX_TOKENS,
        system: REVIEW_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: createReviewUserPrompt(fileName, content),
          },
        ],
      }),
    })
  } catch (fetchError) {
    // ネットワークエラーの場合
    const errorMessage = fetchError instanceof Error
      ? fetchError.message
      : 'ネットワークエラーが発生しました'
    throw new Error(`network: ${errorMessage}`)
  }

  if (!response.ok) {
    // エラーレスポンスの型安全なパース
    let errorMessage = response.statusText
    try {
      const errorData: unknown = await response.json()
      if (isClaudeAPIErrorResponse(errorData) && errorData.error?.message) {
        errorMessage = errorData.error.message
      }
    } catch {
      // JSONパースに失敗した場合はstatusTextを使用
    }

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

  // 成功レスポンスの型安全なパース
  let data: unknown
  try {
    data = await response.json()
  } catch {
    throw new Error('APIレスポンスのJSONパースに失敗しました')
  }

  // 型ガードによるレスポンス検証
  if (!isClaudeAPIResponse(data)) {
    throw new Error('APIレスポンスの形式が不正です: 予期しないデータ構造')
  }

  // レスポンス形式の検証
  if (!data.content || data.content.length === 0) {
    throw new Error('APIレスポンスの形式が不正です: contentが空です')
  }

  const textContent = data.content.find((c) => c.type === 'text')
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
   * エラーメッセージからエラーコードを判定
   */
  const determineErrorCode = useCallback((errorMessage: string): AIReviewError['code'] => {
    // APIキー関連
    if (errorMessage.includes('APIキーが無効')) {
      return 'api_key_missing'
    }
    // パースエラー
    if (errorMessage.includes('パースに失敗') || errorMessage.includes('JSONパース')) {
      return 'parse_error'
    }
    // ネットワークエラー（network:プレフィックス付きまたはキーワード検出）
    if (errorMessage.startsWith('network:') || errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'network_error'
    }
    // APIエラー（レート制限、サーバーエラー等）
    if (errorMessage.includes('API') || errorMessage.includes('レスポンス')) {
      return 'api_error'
    }
    return 'unknown'
  }, [])

  /**
   * レビューを実行
   *
   * エラーは内部でキャッチし、状態として管理されます。
   * 呼び出し側でtry-catchする必要はありません。
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

    // 入力バリデーション
    if (!fileName || !content) {
      setError({
        code: 'unknown',
        message: 'ファイル名またはコンテンツが空です。',
      })
      setStatus('error')
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
      // エラーメッセージの抽出
      let errorMessage: string
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'string') {
        errorMessage = err
      } else {
        errorMessage = '不明なエラーが発生しました'
      }

      // エラーコードの判定
      const errorCode = determineErrorCode(errorMessage)

      // APIキー無効の場合はクリア
      if (errorCode === 'api_key_missing') {
        clearAPIKey()
      }

      // ネットワークエラーの場合はプレフィックスを除去
      const displayMessage = errorMessage.startsWith('network:')
        ? errorMessage.replace('network: ', '')
        : errorMessage

      setError({
        code: errorCode,
        message: displayMessage,
        details: err instanceof Error && err.stack ? err.stack : undefined,
      })
      setStatus('error')
    }
  }, [determineErrorCode])

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

    if (!trimmedKey.startsWith(API_KEY_PREFIX)) {
      setApiKeyModal(prev => ({
        ...prev,
        error: `APIキーの形式が正しくありません（${API_KEY_PREFIX}で始まる必要があります）`,
        isValidating: false,
      }))
      return false
    }

    setApiKeyModal(prev => ({ ...prev, isValidating: true, error: undefined }))

    try {
      // 簡易的なAPI検証（小さなリクエストを送信）
      const response = await fetch(ANTHROPIC_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': trimmedKey,
          'anthropic-version': ANTHROPIC_API_VERSION,
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: DEFAULT_CLAUDE_MODEL,
          max_tokens: API_KEY_VALIDATION_MAX_TOKENS,
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
