import { FC, useState, useRef, useEffect } from 'react'
import { save } from '@tauri-apps/plugin-dialog'
import { exportFile, exportAllZip, getExportFileCount, isTauri } from '../../hooks/useTauri'

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
      const timer = setTimeout(() => setMessage(null), 3000)
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
        className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 disabled:opacity-50"
        title="エクスポート"
      >
        {exporting ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            エクスポート中...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            エクスポート
          </>
        )}
      </button>

      {/* 進捗表示 */}
      {progress && (
        <div className="absolute top-full left-0 right-0 mt-1 px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-md whitespace-nowrap z-50">
          処理中: {progress.current} / {progress.total} ファイル
        </div>
      )}

      {/* メッセージ表示 */}
      {message && (
        <div
          className={`absolute top-full left-0 right-0 mt-1 px-3 py-2 text-xs rounded-md whitespace-nowrap z-50 ${
            message.type === 'success'
              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
              : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* ドロップダウンメニュー */}
      {isOpen && !exporting && (
        <div className="absolute top-full right-0 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
          {/* 単一ファイルエクスポート */}
          <button
            onClick={handleExportFile}
            disabled={!selectedFilePath}
            className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-100 dark:border-gray-700 flex items-center gap-3"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <div>
              <div className="font-medium">ファイルをエクスポート</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {selectedFileName || '選択中のファイルがありません'}
              </div>
            </div>
          </button>

          {/* 全設定ZIPエクスポート */}
          <button
            onClick={handleExportAllZip}
            className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
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
