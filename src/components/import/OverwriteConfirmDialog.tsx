import { FC } from 'react'
import type { FileExistsInfo } from '../../types'
import Modal from '../common/Modal'
import { Icon } from '../common'

interface OverwriteConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (createBackup: boolean) => void
  existingFiles: FileExistsInfo[]
  importType: 'file' | 'zip'
}

const OverwriteConfirmDialog: FC<OverwriteConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  existingFiles,
  importType,
}) => {
  const warningIcon = <Icon name="warning" className="size-5 text-yellow-500" />

  const footer = (
    <div className="flex justify-end gap-3">
      <button
        onClick={onClose}
        className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
      >
        キャンセル
      </button>
      <button
        onClick={() => onConfirm(true)}
        className="px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      >
        バックアップして上書き
      </button>
      <button
        onClick={() => onConfirm(false)}
        className="px-4 py-2 text-sm text-white bg-yellow-500 hover:bg-yellow-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      >
        上書きのみ
      </button>
    </div>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="上書き確認"
      icon={warningIcon}
      size="sm"
      zIndex={60}
      footer={footer}
      contentClassName="px-6 py-4"
    >
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {importType === 'file'
          ? '以下のファイルは既に存在します。上書きしますか？'
          : '以下のファイルが既に存在し、上書きされます。続行しますか？'}
      </p>

      <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3 max-h-48 overflow-y-auto">
        <ul className="space-y-1" role="list">
          {existingFiles.map((file) => (
            <li
              key={file.path}
              className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"
            >
              <Icon name="fileText" className="size-4 text-yellow-500 flex-shrink-0" />
              <span className="truncate">{file.relative_path}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
        バックアップを作成すると、元のファイルは ~/.claude/backups/ に保存されます。
      </p>
    </Modal>
  )
}

export default OverwriteConfirmDialog
