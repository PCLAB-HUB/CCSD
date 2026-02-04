/**
 * カスタムコマンド追加ダイアログ
 * @module components/terminal/AddCommandDialog
 */

import { memo, useCallback, useState, useRef, useEffect, type FC } from 'react'

import Modal from '../common/Modal'
import Icon from '../common/Icon'

import type { CreateQuickCommandInput } from '../../types/terminal'

interface AddCommandDialogProps {
  /** ダイアログが開いているかどうか */
  isOpen: boolean
  /** ダイアログを閉じる */
  onClose: () => void
  /** コマンド追加時のコールバック */
  onAdd: (input: CreateQuickCommandInput) => void
}

/**
 * カスタムコマンド追加ダイアログ
 *
 * ラベル、コマンド、アイコンを入力してカスタムコマンドを追加
 */
const AddCommandDialog: FC<AddCommandDialogProps> = memo(({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [label, setLabel] = useState('')
  const [command, setCommand] = useState('')
  const [icon, setIcon] = useState('')
  const [error, setError] = useState<string | null>(null)

  const labelInputRef = useRef<HTMLInputElement>(null)

  // ダイアログが開いたらラベル入力にフォーカス
  useEffect(() => {
    if (isOpen) {
      // 少し遅延させてモーダルのフォーカス処理と競合しないようにする
      const timer = setTimeout(() => {
        labelInputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // フォームリセット
  const resetForm = useCallback(() => {
    setLabel('')
    setCommand('')
    setIcon('')
    setError(null)
  }, [])

  // ダイアログを閉じる時にフォームをリセット
  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [onClose, resetForm])

  // フォーム送信
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()

    // バリデーション
    const trimmedLabel = label.trim()
    const trimmedCommand = command.trim()

    if (!trimmedLabel) {
      setError('ラベルを入力してください')
      labelInputRef.current?.focus()
      return
    }

    if (!trimmedCommand) {
      setError('コマンドを入力してください')
      return
    }

    // 追加処理
    onAdd({
      label: trimmedLabel,
      command: trimmedCommand,
      icon: icon.trim() || undefined,
    })

    handleClose()
  }, [label, command, icon, onAdd, handleClose])

  // Enterキーで送信
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleSubmit(e)
    }
  }, [handleSubmit])

  const footer = (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={handleClose}
        className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        キャンセル
      </button>
      <button
        type="submit"
        form="add-command-form"
        className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!label.trim() || !command.trim()}
      >
        追加
      </button>
    </div>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="カスタムコマンドを追加"
      size="sm"
      icon={<Icon name="plus" className="size-5 text-blue-500" />}
      footer={footer}
      zIndex={60}
    >
      <form
        id="add-command-form"
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
        className="p-6 space-y-4"
      >
        {/* エラーメッセージ */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
            <Icon name="close" className="size-4" />
            {error}
          </div>
        )}

        {/* ラベル */}
        <div>
          <label
            htmlFor="command-label"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            ラベル <span className="text-red-500">*</span>
          </label>
          <input
            ref={labelInputRef}
            id="command-label"
            type="text"
            value={label}
            onChange={(e) => {
              setLabel(e.target.value)
              setError(null)
            }}
            placeholder="例: ビルド"
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoComplete="off"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            ボタンに表示される名前
          </p>
        </div>

        {/* コマンド */}
        <div>
          <label
            htmlFor="command-text"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            コマンド <span className="text-red-500">*</span>
          </label>
          <input
            id="command-text"
            type="text"
            value={command}
            onChange={(e) => {
              setCommand(e.target.value)
              setError(null)
            }}
            placeholder="例: npm run build"
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoComplete="off"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            ターミナルで実行するコマンド
          </p>
        </div>

        {/* アイコン（オプション） */}
        <div>
          <label
            htmlFor="command-icon"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            アイコン <span className="text-gray-400">(オプション)</span>
          </label>
          <input
            id="command-icon"
            type="text"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="例: 🔨 または ▶"
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={2}
            autoComplete="off"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            絵文字やシンボル（1-2文字）
          </p>
        </div>

        {/* ショートカットヒント */}
        <p className="text-xs text-gray-400 dark:text-gray-500 text-right">
          ⌘+Enter で追加
        </p>
      </form>
    </Modal>
  )
})

AddCommandDialog.displayName = 'AddCommandDialog'

export default AddCommandDialog
