import { useState, type FC } from 'react'

import { Icon } from '../common'
import Modal from '../common/Modal'
import DiffViewer, { type DiffViewMode } from './DiffViewer'

export interface DiffData {
  original: string
  modified: string
  originalLabel: string
  modifiedLabel: string
  filename: string
}

interface DiffModalProps {
  isOpen: boolean
  onClose: () => void
  diffData: DiffData | null
  darkMode: boolean
}

const DiffModal: FC<DiffModalProps> = ({
  isOpen,
  onClose,
  diffData,
  darkMode,
}) => {
  const [viewMode, setViewMode] = useState<DiffViewMode>('side-by-side')

  if (!diffData) return null

  const getLanguage = (filename: string): string => {
    if (filename.endsWith('.json')) return 'json'
    if (filename.endsWith('.md')) return 'markdown'
    if (filename.endsWith('.yaml') || filename.endsWith('.yml')) return 'yaml'
    return 'plaintext'
  }

  const diffIcon = <Icon name="diff" className="size-5 text-blue-500" />

  // カスタムヘッダーが必要なため、titleを使わず独自にヘッダーを構築
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      showCloseButton={false}
      className="bg-white dark:bg-gray-900"
    >
      {/* カスタムヘッダー（表示モード切替を含む） */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          {diffIcon}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              差分表示
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {diffData.filename}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 表示モード切替 */}
          <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg p-1" role="group" aria-label="表示モード">
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'side-by-side'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              title="サイドバイサイド表示"
              aria-pressed={viewMode === 'side-by-side'}
            >
              <span className="inline-flex items-center gap-1.5">
                <Icon name="sideBySide" className="size-4" />
                並列
              </span>
            </button>
            <button
              onClick={() => setViewMode('inline')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'inline'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              title="インライン表示"
              aria-pressed={viewMode === 'inline'}
            >
              <span className="inline-flex items-center gap-1.5">
                <Icon name="inline" className="size-4" />
                インライン
              </span>
            </button>
          </div>

          {/* 閉じるボタン */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="閉じる (ESC)"
            aria-label="閉じる"
          >
            <Icon name="close" className="size-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Diff Viewer */}
      <div className="flex-1 overflow-hidden">
        <DiffViewer
          original={diffData.original}
          modified={diffData.modified}
          originalLabel={diffData.originalLabel}
          modifiedLabel={diffData.modifiedLabel}
          language={getLanguage(diffData.filename)}
          darkMode={darkMode}
          viewMode={viewMode}
        />
      </div>
    </Modal>
  )
}

export default DiffModal
