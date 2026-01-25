import { FC } from 'react'
import { FileExistsInfo } from '../../hooks/useTauri'

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
  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            上書き確認
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 flex-1 overflow-y-auto">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {importType === 'file'
              ? '以下のファイルは既に存在します。上書きしますか？'
              : '以下のファイルが既に存在し、上書きされます。続行しますか？'}
          </p>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3 max-h-48 overflow-y-auto">
            <ul className="space-y-1">
              {existingFiles.map((file) => (
                <li
                  key={file.path}
                  className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4 text-yellow-500 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="truncate">{file.relative_path}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
            バックアップを作成すると、元のファイルは ~/.claude/backups/ に保存されます。
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={() => onConfirm(true)}
            className="px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
          >
            バックアップして上書き
          </button>
          <button
            onClick={() => onConfirm(false)}
            className="px-4 py-2 text-sm text-white bg-yellow-500 hover:bg-yellow-600 rounded-md transition-colors"
          >
            上書きのみ
          </button>
        </div>
      </div>
    </div>
  )
}

export default OverwriteConfirmDialog
