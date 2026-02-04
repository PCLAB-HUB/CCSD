import { memo, useState, type FC } from 'react'

import Icon from '../common/Icon'

import type { GitHubRepository } from '../../types'
import { formatStarCount, getLanguageColor } from '../../types'

interface GitHubReposPanelProps {
  /** リポジトリ一覧 */
  repos: GitHubRepository[]
  /** 読み込み中かどうか */
  loading: boolean
  /** エラーメッセージ */
  error: string | null
  /** ダークモードかどうか */
  darkMode: boolean
  /** 再取得ハンドラー（オプション） */
  onRefetch?: () => void
}

/**
 * リポジトリアイテム
 */
const RepoItem: FC<{ repo: GitHubRepository }> = memo(({ repo }) => {
  const languageColor = getLanguageColor(repo.language)

  return (
    <a
      href={repo.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* リポジトリ名 */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate">
              {repo.full_name}
            </span>
            <Icon name="externalLink" className="size-3 text-gray-400 shrink-0" />
          </div>

          {/* 説明文 */}
          {repo.description && (
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
              {repo.description}
            </p>
          )}

          {/* メタ情報 */}
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            {/* 言語 */}
            {repo.language && (
              <span className="flex items-center gap-1">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: languageColor }}
                />
                {repo.language}
              </span>
            )}

            {/* スター数 */}
            <span className="flex items-center gap-1">
              <Icon name="star" className="size-3" />
              {formatStarCount(repo.stargazers_count)}
            </span>
          </div>
        </div>
      </div>
    </a>
  )
})

RepoItem.displayName = 'RepoItem'

/**
 * GitHub人気リポジトリ表示パネル
 *
 * - 折りたたみ可能なパネル
 * - デフォルト: 閉じた状態
 * - トグルボタン: GitHubアイコン + 「人気リポジトリ」
 * - 展開時: リポジトリリスト表示
 * - ダークモード対応
 */
const GitHubReposPanel: FC<GitHubReposPanelProps> = memo(({
  repos,
  loading,
  error,
  darkMode: _darkMode,
  onRefetch,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* トグルヘッダー */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        aria-expanded={isExpanded}
        aria-controls="github-repos-content"
      >
        <div className="flex items-center gap-2">
          <Icon name="github" className="size-4 text-gray-700 dark:text-gray-300" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            人気リポジトリ
          </span>
          {repos.length > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded">
              {repos.length}件
            </span>
          )}
        </div>
        <Icon
          name={isExpanded ? 'chevronUp' : 'chevronDown'}
          className="size-4 text-gray-500 dark:text-gray-400"
        />
      </button>

      {/* 展開コンテンツ */}
      <div
        id="github-repos-content"
        className={`transition-all duration-200 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          {/* ローディング状態 */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Icon name="spinner" className="size-6 animate-spin text-blue-500" />
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                読み込み中...
              </span>
            </div>
          )}

          {/* エラー状態 */}
          {error && !loading && (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
                <Icon name="warning" className="size-5" />
                <span className="text-sm font-medium">エラーが発生しました</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                {error}
              </p>
              {onRefetch && (
                <button
                  type="button"
                  onClick={onRefetch}
                  className="px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                >
                  再試行
                </button>
              )}
            </div>
          )}

          {/* リポジトリリスト */}
          {!loading && !error && repos.length > 0 && (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {repos.map((repo) => (
                <RepoItem key={repo.id} repo={repo} />
              ))}
            </div>
          )}

          {/* 空状態 */}
          {!loading && !error && repos.length === 0 && (
            <div className="flex flex-col items-center py-6 text-center">
              <Icon name="github" className="size-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                リポジトリが見つかりません
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

GitHubReposPanel.displayName = 'GitHubReposPanel'

export default GitHubReposPanel
