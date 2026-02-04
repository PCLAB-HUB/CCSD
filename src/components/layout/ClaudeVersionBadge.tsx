import { memo, type FC } from 'react'

import Icon from '../common/Icon'

interface ClaudeVersionBadgeProps {
  /** Claude Codeのバージョン (例: "2.1.31") */
  version: string | null
  /** 読み込み中かどうか */
  loading: boolean
  /** エラーメッセージ */
  error: string | null
}

/**
 * Claude Codeバージョン表示バッジ
 *
 * - バージョン情報を小さなバッジとして表示
 * - ローディング中はスケルトン表示
 * - エラー時は非表示またはエラーアイコン
 * - ダークモード対応
 */
const ClaudeVersionBadge: FC<ClaudeVersionBadgeProps> = memo(({
  version,
  loading,
  error,
}) => {
  // ローディング中: スケルトン表示
  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 animate-pulse">
        <div className="size-3.5 rounded bg-gray-300 dark:bg-gray-600" />
        <div className="h-3 w-20 rounded bg-gray-300 dark:bg-gray-600" />
      </div>
    )
  }

  // エラー時: エラーアイコン表示
  if (error) {
    return (
      <div
        className="flex items-center gap-1 px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
        title={error}
      >
        <Icon name="warning" className="size-3.5" />
        <span className="text-xs">取得エラー</span>
      </div>
    )
  }

  // バージョンがない場合: 非表示
  if (!version) {
    return null
  }

  // 正常表示
  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 whitespace-nowrap flex-shrink-0"
      title={`Claude Code バージョン ${version}`}
    >
      <Icon name="terminal" className="size-3.5" />
      <span className="text-xs font-medium">
        Claude Code ver {version}
      </span>
    </div>
  )
})

ClaudeVersionBadge.displayName = 'ClaudeVersionBadge'

export default ClaudeVersionBadge
