/**
 * 日付フォーマットユーティリティ関数
 * プロジェクト全体で統一された日付表示を提供
 */

export interface DateFormatOptions {
  /** 年を表示するか */
  showYear?: boolean
  /** 時刻を表示するか */
  showTime?: boolean
  /** 秒を表示するか */
  showSeconds?: boolean
}

/**
 * 日付を日本語形式でフォーマット
 * @param date - Date オブジェクトまたは ISO 文字列
 * @param options - フォーマットオプション
 * @returns フォーマットされた日付文字列
 */
export function formatDate(
  date: Date | string | null | undefined,
  options: DateFormatOptions = {}
): string {
  if (!date) return ''

  const {
    showYear = true,
    showTime = true,
    showSeconds = false,
  } = options

  try {
    const d = typeof date === 'string' ? new Date(date) : date

    if (isNaN(d.getTime())) {
      return typeof date === 'string' ? date : ''
    }

    const formatOptions: Intl.DateTimeFormatOptions = {
      month: '2-digit',
      day: '2-digit',
    }

    if (showYear) {
      formatOptions.year = 'numeric'
    }

    if (showTime) {
      formatOptions.hour = '2-digit'
      formatOptions.minute = '2-digit'
      if (showSeconds) {
        formatOptions.second = '2-digit'
      }
    }

    return d.toLocaleString('ja-JP', formatOptions)
  } catch {
    return typeof date === 'string' ? date : ''
  }
}

/**
 * 日付を短い形式でフォーマット（年月日のみ）
 */
export function formatDateShort(date: Date | string | null | undefined): string {
  return formatDate(date, { showTime: false })
}

/**
 * 日付をISO形式で取得（time要素のdatetime属性用）
 */
export function getISOString(date: Date | string | null | undefined): string {
  if (!date) return ''

  try {
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return ''
    return d.toISOString()
  } catch {
    return ''
  }
}

/**
 * 相対的な時間表示（例: 3分前、2時間前）
 */
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return ''

  try {
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return ''

    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffSec < 60) return 'たった今'
    if (diffMin < 60) return `${diffMin}分前`
    if (diffHour < 24) return `${diffHour}時間前`
    if (diffDay < 7) return `${diffDay}日前`

    return formatDate(d, { showTime: false })
  } catch {
    return ''
  }
}
