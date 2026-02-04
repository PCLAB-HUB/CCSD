import { memo, useState, useCallback, type FC } from 'react'

import Icon from '../common/Icon'

import type { QuickCommand, CommandHistoryItem } from '../../types/terminal'

interface QuickCommandsProps {
  /** クイックコマンド一覧 */
  commands: QuickCommand[]
  /** コマンド履歴 */
  history: CommandHistoryItem[]
  /** 現在編集中のファイルパス */
  currentFilePath?: string | null
  /** コマンド実行時のコールバック */
  onExecute: (command: string) => void
  /** コマンド追加時のコールバック */
  onAddCommand?: () => void
  /** コマンド編集時のコールバック */
  onEditCommand?: (command: QuickCommand) => void
  /** コマンド削除時のコールバック */
  onRemoveCommand?: (id: string) => void
  /** 追加のクラス名 */
  className?: string
}

/**
 * クイックコマンドバー
 *
 * - ボタン: [Claude] [Resume] [カスタム...] [+ 追加]
 * - 履歴ドロップダウン
 * - 編集中ファイルをコマンドに挿入するボタン
 */
const QuickCommands: FC<QuickCommandsProps> = memo(({
  commands,
  history,
  currentFilePath,
  onExecute,
  onAddCommand,
  onEditCommand,
  onRemoveCommand,
  className = '',
}) => {
  const [showHistory, setShowHistory] = useState(false)

  // コマンドを実行
  const handleExecuteCommand = useCallback((command: string) => {
    onExecute(command)
  }, [onExecute])

  // 履歴からコマンドを実行
  const handleHistorySelect = useCallback((command: string) => {
    setShowHistory(false)
    onExecute(command)
  }, [onExecute])

  // ファイルパスを挿入してコマンドを実行
  const handleInsertFilePath = useCallback(() => {
    if (currentFilePath) {
      // claudeコマンドにファイルパスを追加
      onExecute(`claude "${currentFilePath}"`)
    }
  }, [currentFilePath, onExecute])

  // 履歴ドロップダウンをトグル
  const toggleHistory = useCallback(() => {
    setShowHistory(prev => !prev)
  }, [])

  // 履歴を閉じる
  const closeHistory = useCallback(() => {
    setShowHistory(false)
  }, [])

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* クイックコマンドボタン */}
      <div className="flex items-center gap-1">
        {commands.map((cmd) => (
          <div key={cmd.id} className="relative group">
            <button
              type="button"
              onClick={() => handleExecuteCommand(cmd.command)}
              className="px-2.5 py-1 text-xs font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              title={cmd.command}
            >
              {cmd.icon && <span className="mr-1">{cmd.icon}</span>}
              {cmd.label}
            </button>

            {/* カスタムコマンドの編集・削除ボタン */}
            {!cmd.isBuiltIn && (onEditCommand || onRemoveCommand) && (
              <div className="absolute -top-1 -right-1 hidden group-hover:flex items-center gap-0.5">
                {onEditCommand && (
                  <button
                    type="button"
                    onClick={() => onEditCommand(cmd)}
                    className="p-0.5 bg-blue-500 hover:bg-blue-600 rounded text-white"
                    aria-label={`${cmd.label}を編集`}
                  >
                    <Icon name="edit" className="size-2.5" />
                  </button>
                )}
                {onRemoveCommand && (
                  <button
                    type="button"
                    onClick={() => onRemoveCommand(cmd.id)}
                    className="p-0.5 bg-red-500 hover:bg-red-600 rounded text-white"
                    aria-label={`${cmd.label}を削除`}
                  >
                    <Icon name="close" className="size-2.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {/* コマンド追加ボタン */}
        {onAddCommand && (
          <button
            type="button"
            onClick={onAddCommand}
            className="px-2 py-1 text-xs text-gray-400 hover:text-white bg-gray-700/50 hover:bg-gray-600 dark:bg-gray-600/50 dark:hover:bg-gray-500 rounded border border-dashed border-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="カスタムコマンドを追加"
          >
            <Icon name="plus" className="size-3 inline-block mr-0.5" />
            追加
          </button>
        )}
      </div>

      {/* 区切り線 */}
      <div className="h-4 w-px bg-gray-600" />

      {/* 履歴ドロップダウン */}
      <div className="relative">
        <button
          type="button"
          onClick={toggleHistory}
          className={`flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded ${
            showHistory ? 'bg-gray-600 text-white' : ''
          }`}
          aria-expanded={showHistory}
          aria-haspopup="listbox"
          aria-label="コマンド履歴"
          disabled={history.length === 0}
        >
          <Icon name="clock" className="size-3.5" />
          履歴
          <Icon
            name={showHistory ? 'chevronUp' : 'chevronDown'}
            className="size-3"
          />
        </button>

        {/* 履歴ドロップダウンメニュー */}
        {showHistory && history.length > 0 && (
          <>
            {/* オーバーレイ */}
            <div
              className="fixed inset-0 z-10"
              onClick={closeHistory}
              aria-hidden="true"
            />

            {/* メニュー */}
            <div
              role="listbox"
              className="absolute bottom-full left-0 mb-1 w-64 max-h-48 overflow-y-auto bg-gray-800 dark:bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-20"
            >
              {history.slice(0, 20).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  onClick={() => handleHistorySelect(item.command)}
                  className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-gray-700 dark:hover:bg-gray-600 truncate focus:outline-none focus:bg-gray-700"
                  title={item.command}
                >
                  <span className="font-mono">{item.command}</span>
                  <span className="block text-gray-500 text-[10px] mt-0.5">
                    {new Date(item.timestamp).toLocaleString('ja-JP')}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ファイルパス挿入ボタン */}
      {currentFilePath && (
        <>
          <div className="h-4 w-px bg-gray-600" />
          <button
            type="button"
            onClick={handleInsertFilePath}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            title={`現在のファイル: ${currentFilePath}`}
          >
            <Icon name="fileText" className="size-3.5" />
            <span className="max-w-[120px] truncate">
              {currentFilePath.split('/').pop()}
            </span>
          </button>
        </>
      )}
    </div>
  )
})

QuickCommands.displayName = 'QuickCommands'

export default QuickCommands
