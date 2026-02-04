/**
 * GitHub API関連の型定義
 * @module types/github
 */

// ============================================================
// リポジトリ関連の型
// ============================================================

/**
 * GitHubリポジトリのオーナー情報
 */
export interface GitHubOwner {
  /** ユーザー名 */
  login: string
  /** アバター画像URL */
  avatar_url: string
}

/**
 * GitHubリポジトリ情報
 */
export interface GitHubRepository {
  /** リポジトリID */
  id: number
  /** リポジトリ名 */
  name: string
  /** フルネーム（owner/name形式） */
  full_name: string
  /** リポジトリURL */
  html_url: string
  /** 説明文（nullの場合あり） */
  description: string | null
  /** スター数 */
  stargazers_count: number
  /** 主要言語（nullの場合あり） */
  language: string | null
  /** オーナー情報 */
  owner: GitHubOwner
}

/**
 * GitHub Search APIのレスポンス
 */
export interface GitHubSearchResponse {
  /** 検索結果の総件数 */
  total_count: number
  /** 検索結果が不完全かどうか */
  incomplete_results: boolean
  /** リポジトリの配列 */
  items: GitHubRepository[]
}

// ============================================================
// フック関連の型
// ============================================================

/**
 * useGitHubReposフックの状態
 */
export interface GitHubReposState {
  /** リポジトリ配列 */
  repos: GitHubRepository[]
  /** ローディング状態 */
  loading: boolean
  /** エラーメッセージ（nullの場合エラーなし） */
  error: string | null
  /** 最終取得日時（ISO文字列） */
  lastFetchedAt: string | null
}

/**
 * useGitHubReposフックの戻り値
 */
export interface UseGitHubReposReturn extends GitHubReposState {
  /** 手動で再取得する関数 */
  refetch: () => Promise<void>
  /** キャッシュをクリアして再取得 */
  clearCacheAndRefetch: () => Promise<void>
}

// ============================================================
// キャッシュ関連の型
// ============================================================

/**
 * sessionStorageに保存するキャッシュデータ
 */
export interface GitHubCacheData {
  /** キャッシュされたリポジトリ */
  repos: GitHubRepository[]
  /** キャッシュ作成日時（Unixタイムスタンプ） */
  cachedAt: number
}

// ============================================================
// エラー関連の型
// ============================================================

/**
 * GitHub APIエラーの種類
 */
export type GitHubErrorType =
  | 'network'      // ネットワークエラー
  | 'rate_limit'   // レート制限
  | 'api_error'    // APIエラー（4xx, 5xx）
  | 'parse_error'  // レスポンスパースエラー
  | 'unknown'      // 不明なエラー

/**
 * GitHub APIエラー情報
 */
export interface GitHubError {
  /** エラーの種類 */
  type: GitHubErrorType
  /** エラーメッセージ */
  message: string
  /** HTTPステータスコード（該当する場合） */
  statusCode?: number
}

// ============================================================
// 定数
// ============================================================

/** キャッシュの有効期間（ミリ秒）: 30分 */
export const GITHUB_CACHE_DURATION_MS = 30 * 60 * 1000

/** GitHub Search APIのエンドポイント */
export const GITHUB_SEARCH_API_URL = 'https://api.github.com/search/repositories'

/** デフォルトの検索クエリ */
export const GITHUB_DEFAULT_SEARCH_QUERY = 'claude+code'

/** 取得件数 */
export const GITHUB_RESULTS_PER_PAGE = 10

// ============================================================
// ユーティリティ関数
// ============================================================

/**
 * キャッシュが有効かどうかを判定
 * @param cachedAt - キャッシュ作成日時（Unixタイムスタンプ）
 * @returns キャッシュが有効期間内であればtrue
 */
export function isCacheValid(cachedAt: number): boolean {
  const now = Date.now()
  return now - cachedAt < GITHUB_CACHE_DURATION_MS
}

/**
 * GitHubエラーを日本語メッセージに変換
 * @param error - エラー情報
 * @returns 日本語のエラーメッセージ
 */
export function translateGitHubError(error: GitHubError): string {
  switch (error.type) {
    case 'network':
      return 'ネットワークに接続できません。インターネット接続を確認してください。'
    case 'rate_limit':
      return 'GitHub APIのレート制限に達しました。しばらく待ってから再試行してください。'
    case 'api_error':
      return `GitHub APIエラーが発生しました（コード: ${error.statusCode ?? '不明'}）`
    case 'parse_error':
      return 'レスポンスの解析に失敗しました。'
    case 'unknown':
    default:
      return `エラーが発生しました: ${error.message}`
  }
}

/**
 * スター数をフォーマット（1000以上は1.2kのような形式）
 * @param count - スター数
 * @returns フォーマットされた文字列
 */
export function formatStarCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`
  }
  return count.toString()
}
