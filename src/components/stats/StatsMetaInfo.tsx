import { memo } from 'react'

interface StatsMetaInfoProps {
  /** 最終更新日時 */
  lastUpdated?: Date | string | null
  /** 設定ファイルのバージョン */
  configVersion?: string
  /** 追加のメタ情報 */
  additionalInfo?: { label: string; value: string }[]
  /** 追加のクラス名 */
  className?: string
}

/**
 * StatsMetaInfo - 統計のメタ情報表示コンポーネント
 *
 * アクセシビリティ機能:
 * - セマンティックな<dl>/<dt>/<dd>構造
 * - time要素で日時を機械可読に
 * - WCAG AA準拠のコントラスト
 */
export const StatsMetaInfo = memo<StatsMetaInfoProps>(({
  lastUpdated,
  configVersion,
  additionalInfo = [],
  className = '',
}) => {
  // 日時のフォーマット
  const formatDateTime = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // ISO形式の日時文字列（time要素のdatetime属性用）
  const getISOString = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toISOString()
  }

  const hasContent = lastUpdated || configVersion || additionalInfo.length > 0

  if (!hasContent) {
    return null
  }

  return (
    <dl
      className={`
        flex flex-wrap gap-x-6 gap-y-2
        text-xs text-gray-500 dark:text-gray-400
        ${className}
      `}
    >
      {/* 最終更新日時 */}
      {lastUpdated && (
        <div className="flex items-center gap-1.5">
          <dt className="flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>最終更新:</span>
          </dt>
          <dd>
            <time dateTime={getISOString(lastUpdated)}>
              {formatDateTime(lastUpdated)}
            </time>
          </dd>
        </div>
      )}

      {/* 設定バージョン */}
      {configVersion && (
        <div className="flex items-center gap-1.5">
          <dt className="flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            <span>バージョン:</span>
          </dt>
          <dd className="font-mono">{configVersion}</dd>
        </div>
      )}

      {/* 追加のメタ情報 */}
      {additionalInfo.map((info, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <dt>{info.label}:</dt>
          <dd>{info.value}</dd>
        </div>
      ))}
    </dl>
  )
})

StatsMetaInfo.displayName = 'StatsMetaInfo'
