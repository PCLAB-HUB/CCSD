import { memo, type FC } from 'react'

import Icon from '../common/Icon'

interface TerminalToolbarProps {
  /** 新規ターミナル作成時のコールバック */
  onNew?: () => void
  /** 分割時のコールバック（将来用） */
  onSplit?: () => void
  /** クリア時のコールバック */
  onClear: () => void
  /** 閉じる時のコールバック */
  onClose: () => void
  /** 分割ボタンを表示するか */
  showSplit?: boolean
  /** 追加のクラス名 */
  className?: string
}

/**
 * ツールバーボタンの共通スタイル
 */
const buttonBaseClass =
  'p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-600 dark:hover:bg-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500'

/**
 * ターミナルツールバー
 *
 * - 新規ターミナル（+）
 * - 分割（オプション）
 * - クリア
 * - 閉じる（x）
 */
const TerminalToolbar: FC<TerminalToolbarProps> = memo(({
  onNew,
  onSplit,
  onClear,
  onClose,
  showSplit = false,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* 新規ターミナル */}
      {onNew && (
        <button
          type="button"
          onClick={onNew}
          className={buttonBaseClass}
          aria-label="新規ターミナル"
          title="新規ターミナル"
        >
          <Icon name="plus" className="size-4" />
        </button>
      )}

      {/* 分割（将来用） */}
      {showSplit && onSplit && (
        <button
          type="button"
          onClick={onSplit}
          className={buttonBaseClass}
          aria-label="ターミナルを分割"
          title="ターミナルを分割"
        >
          <Icon name="sideBySide" className="size-4" />
        </button>
      )}

      {/* クリア */}
      <button
        type="button"
        onClick={onClear}
        className={buttonBaseClass}
        aria-label="ターミナルをクリア"
        title="ターミナルをクリア"
      >
        <Icon name="trash" className="size-4" />
      </button>

      {/* 閉じる */}
      <button
        type="button"
        onClick={onClose}
        className={buttonBaseClass}
        aria-label="ターミナルを閉じる"
        title="ターミナルを閉じる"
      >
        <Icon name="close" className="size-4" />
      </button>
    </div>
  )
})

TerminalToolbar.displayName = 'TerminalToolbar'

export default TerminalToolbar
