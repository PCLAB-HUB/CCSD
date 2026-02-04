import { useEffect, useRef, useState, type FC } from 'react'
import { save } from '@tauri-apps/plugin-dialog'

import { MESSAGE_AUTO_CLEAR_DELAY } from '../../constants'
import { exportAllZip, exportFile, getExportFileCount, isTauri } from '../../hooks/useTauri'
import { Icon } from '../common'

interface ExportMenuProps {
  /** 現在選択中のファイルパス */
  selectedFilePath?: string
  /** 現在選択中のファイル名 */
  selectedFileName?: string
}

const ExportMenu: FC<ExportMenuProps> = ({ selectedFilePath, selectedFileName }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // メニュー外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // メッセージの自動消去
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), MESSAGE_AUTO_CLEAR_DELAY)
      return () => clearTimeout(timer)
    }
  }, [message])

  // 単一ファイルをエクスポート
  const handleExportFile = async () => {
    if (!selectedFilePath || !selectedFileName || !isTauri()) return

    try {
      setExporting(true)
      setIsOpen(false)

      // 保存ダイアログを表示
      const destPath = await save({
        defaultPath: selectedFileName,
        filters: [
          { name: 'All Files', extensions: ['*'] },
          { name: 'Markdown', extensions: ['md'] },
          { name: 'JSON', extensions: ['json', 'jsonl'] },
        ],
      })

      if (!destPath) {
        setExporting(false)
        return
      }

      const success = await exportFile(selectedFilePath, destPath)
      if (success) {
        setMessage({ type: 'success', text: 'ファイルをエクスポートしました' })
      } else {
        setMessage({ type: 'error', text: 'エクスポートに失敗しました' })
      }
    } catch (error) {
      console.error('Export error:', error)
      setMessage({ type: 'error', text: 'エクスポート中にエラーが発生しました' })
    } finally {
      setExporting(false)
    }
  }

  // 全設定をZIPでエクスポート
  const handleExportAllZip = async () => {
    if (!isTauri()) return

    try {
      setExporting(true)
      setIsOpen(false)

      // ファイル数を取得して進捗表示の準備
      const totalFiles = await getExportFileCount()
      setProgress({ current: 0, total: totalFiles })

      // 保存ダイアログを表示
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const defaultFileName = `claude-settings-${timestamp}.zip`

      const destPath = await save({
        defaultPath: defaultFileName,
        filters: [{ name: 'ZIP Archive', extensions: ['zip'] }],
      })

      if (!destPath) {
        setExporting(false)
        setProgress(null)
        return
      }

      const exportedCount = await exportAllZip(destPath)
      setProgress({ current: exportedCount, total: totalFiles })

      setMessage({
        type: 'success',
        text: `${exportedCount}件のファイルをZIPエクスポートしました`,
      })
    } catch (error) {
      console.error('Export ZIP error:', error)
      setMessage({ type: 'error', text: 'ZIPエクスポートに失敗しました' })
    } finally {
      setExporting(false)
      setProgress(null)
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* エクスポートボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={exporting}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls="export-menu"
        aria-label={exporting ? 'エクスポート中' : 'エクスポートメニューを開く'}
        className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 disabled:opacity-50 whitespace-nowrap flex-shrink-0"
        title="エクスポート"
      >
        {exporting ? (
          <>
            <Icon name="spinner" className="size-4 animate-spin" />
            エクスポート中...
          </>
        ) : (
          <>
            <Icon name="upload" className="size-4" />
            エクスポート
          </>
        )}
      </button>

      {/* 進捗表示 */}
      {progress && (
        <div className="absolute top-full left-0 right-0 mt-1 px-3 py-2 message-badge-info whitespace-nowrap z-50">
          処理中: {progress.current} / {progress.total} ファイル
        </div>
      )}

      {/* メッセージ表示 */}
      {message && (
        <div
          className={`absolute top-full left-0 right-0 mt-1 px-3 py-2 whitespace-nowrap z-50 ${
            message.type === 'success' ? 'message-badge-success' : 'message-badge-error'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* ドロップダウンメニュー */}
      {isOpen && !exporting && (
        <div
          id="export-menu"
          role="menu"
          aria-label="エクスポートオプション"
          className="absolute top-full right-0 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50"
        >
          {/* 単一ファイルエクスポート */}
          <button
            role="menuitem"
            onClick={handleExportFile}
            disabled={!selectedFilePath}
            aria-label={selectedFilePath ? `${selectedFileName}をエクスポート` : 'ファイルが選択されていません'}
            className="w-full px-4 py-2.5 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-100 dark:border-gray-700 flex items-center gap-3 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
          >
            <Icon name="fileText" className="size-4 text-gray-500 dark:text-gray-400" />
            <div>
              <div className="font-medium">ファイルをエクスポート</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {selectedFileName || '選択中のファイルがありません'}
              </div>
            </div>
          </button>

          {/* 全設定ZIPエクスポート */}
          <button
            role="menuitem"
            onClick={handleExportAllZip}
            aria-label="全設定をZIPファイルでエクスポート"
            className="w-full px-4 py-2.5 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
          >
            <Icon name="archive" className="size-4 text-gray-500 dark:text-gray-400" />
            <div>
              <div className="font-medium">全設定をZIPエクスポート</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                ~/.claude/ 配下の全設定ファイル
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}

export default ExportMenu
