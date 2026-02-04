/**
 * @fileoverview GitHub APIからClaude Code関連リポジトリを取得するカスタムフック
 * @module hooks/useGitHubRepos
 */

import { useState, useEffect, useCallback, useRef } from 'react'

import { STORAGE_KEY_GITHUB_REPOS } from '../constants/storage'
import type {
  GitHubRepository,
  GitHubSearchResponse,
  GitHubCacheData,
  GitHubError,
  UseGitHubReposReturn,
} from '../types/github'
import {
  GITHUB_SEARCH_API_URL,
  GITHUB_DEFAULT_SEARCH_QUERY,
  GITHUB_RESULTS_PER_PAGE,
  isCacheValid,
  translateGitHubError,
} from '../types/github'

// ============================================================
// 内部ヘルパー関数
// ============================================================

/**
 * sessionStorageからキャッシュを取得
 * @returns キャッシュデータまたはnull
 */
function getCache(): GitHubCacheData | null {
  try {
    const cached = sessionStorage.getItem(STORAGE_KEY_GITHUB_REPOS)
    if (!cached) return null

    const data = JSON.parse(cached) as GitHubCacheData
    if (!data.repos || !data.cachedAt) return null

    return data
  } catch {
    return null
  }
}

/**
 * sessionStorageにキャッシュを保存
 * @param repos - リポジトリ配列
 */
function setCache(repos: GitHubRepository[]): void {
  try {
    const data: GitHubCacheData = {
      repos,
      cachedAt: Date.now(),
    }
    sessionStorage.setItem(STORAGE_KEY_GITHUB_REPOS, JSON.stringify(data))
  } catch {
    // sessionStorageが利用できない場合は無視
  }
}

/**
 * キャッシュをクリア
 */
function clearCache(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY_GITHUB_REPOS)
  } catch {
    // sessionStorageが利用できない場合は無視
  }
}

/**
 * GitHub Search APIを呼び出す
 * @returns リポジトリ配列
 * @throws GitHubError
 */
async function fetchGitHubRepos(): Promise<GitHubRepository[]> {
  const url = new URL(GITHUB_SEARCH_API_URL)
  url.searchParams.set('q', GITHUB_DEFAULT_SEARCH_QUERY)
  url.searchParams.set('sort', 'stars')
  url.searchParams.set('order', 'desc')
  url.searchParams.set('per_page', String(GITHUB_RESULTS_PER_PAGE))

  let response: Response

  try {
    response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    })
  } catch (err) {
    const error: GitHubError = {
      type: 'network',
      message: err instanceof Error ? err.message : 'Network error',
    }
    throw error
  }

  // レート制限チェック
  if (response.status === 403) {
    const remaining = response.headers.get('X-RateLimit-Remaining')
    if (remaining === '0') {
      const error: GitHubError = {
        type: 'rate_limit',
        message: 'Rate limit exceeded',
        statusCode: 403,
      }
      throw error
    }
  }

  // APIエラーチェック
  if (!response.ok) {
    const error: GitHubError = {
      type: 'api_error',
      message: `HTTP ${response.status}`,
      statusCode: response.status,
    }
    throw error
  }

  // レスポンスパース
  let data: GitHubSearchResponse
  try {
    data = (await response.json()) as GitHubSearchResponse
  } catch {
    const error: GitHubError = {
      type: 'parse_error',
      message: 'Failed to parse response',
    }
    throw error
  }

  return data.items
}

// ============================================================
// カスタムフック
// ============================================================

/**
 * GitHub APIからClaude Code関連リポジトリを取得するフック
 *
 * @description
 * - 初回マウント時に自動でフェッチ
 * - sessionStorageでキャッシュ（30分有効）
 * - レート制限対策済み
 *
 * @example
 * ```tsx
 * const { repos, loading, error, refetch } = useGitHubRepos()
 *
 * if (loading) return <Spinner />
 * if (error) return <ErrorMessage message={error} />
 *
 * return (
 *   <ul>
 *     {repos.map(repo => (
 *       <li key={repo.id}>{repo.full_name}</li>
 *     ))}
 *   </ul>
 * )
 * ```
 */
export function useGitHubRepos(): UseGitHubReposReturn {
  const [repos, setRepos] = useState<GitHubRepository[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null)

  // 重複フェッチ防止
  const isFetching = useRef(false)

  /**
   * データを取得（キャッシュチェック付き）
   */
  const fetchData = useCallback(async (skipCache = false) => {
    // 重複実行防止
    if (isFetching.current) return
    isFetching.current = true

    setLoading(true)
    setError(null)

    try {
      // キャッシュをチェック
      if (!skipCache) {
        const cached = getCache()
        if (cached && isCacheValid(cached.cachedAt)) {
          setRepos(cached.repos)
          setLastFetchedAt(new Date(cached.cachedAt).toISOString())
          setLoading(false)
          isFetching.current = false
          return
        }
      }

      // APIから取得
      const fetchedRepos = await fetchGitHubRepos()
      setRepos(fetchedRepos)
      setCache(fetchedRepos)
      setLastFetchedAt(new Date().toISOString())
    } catch (err) {
      const gitHubError = err as GitHubError
      const message = translateGitHubError(gitHubError)
      setError(message)

      // エラー時はキャッシュがあれば使用
      const cached = getCache()
      if (cached) {
        setRepos(cached.repos)
        setLastFetchedAt(new Date(cached.cachedAt).toISOString())
      }
    } finally {
      setLoading(false)
      isFetching.current = false
    }
  }, [])

  /**
   * 手動で再取得
   */
  const refetch = useCallback(async () => {
    await fetchData(false)
  }, [fetchData])

  /**
   * キャッシュをクリアして再取得
   */
  const clearCacheAndRefetch = useCallback(async () => {
    clearCache()
    await fetchData(true)
  }, [fetchData])

  // 初回マウント時にフェッチ
  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    repos,
    loading,
    error,
    lastFetchedAt,
    refetch,
    clearCacheAndRefetch,
  }
}
