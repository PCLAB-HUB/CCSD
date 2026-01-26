import { FC, useState, useCallback } from 'react'
import { open } from '@tauri-apps/plugin-dialog'
import {
  checkFileExists,
  checkFilesExist,
  importFile,
  importZip,
  previewZip,
  isTauri,
} from '../../hooks/useTauri'
import type { ImportResult, FileExistsInfo, ZipFileInfo } from '../../types'
import Modal from '../common/Modal'
import { Icon } from '../common'
import OverwriteConfirmDialog from './OverwriteConfirmDialog'

interface ImportDialogProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete: () => void
}

type ImportStep = 'select' | 'preview' | 'confirm' | 'importing' | 'result'

const ImportDialog: FC<ImportDialogProps> = ({ isOpen, onClose, onImportComplete }) => {
  const [step, setStep] = useState<ImportStep>('select')
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [importType, setImportType] = useState<'file' | 'zip'>('file')
  const [zipContents, setZipContents] = useState<ZipFileInfo[]>([])
  const [existingFiles, setExistingFiles] = useState<FileExistsInfo[]>([])
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [destinationPath, setDestinationPath] = useState<string>('')

  const resetState = useCallback(() => {
    setStep('select')
    setSelectedFile(null)
    setImportType('file')
    setZipContents([])
    setExistingFiles([])
    setShowOverwriteDialog(false)
    setImportResult(null)
    setIsLoading(false)
    setError(null)
    setDestinationPath('')
  }, [])

  const handleClose = useCallback(() => {
    resetState()
    onClose()
  }, [resetState, onClose])

  const handleSelectFile = useCallback(async () => {
    if (!isTauri()) {
      setError('Tauriアプリとして起動してください')
      return
    }

    try {
      const result = await open({
        multiple: false,
        filters: [
          {
            name: 'Claude Settings',
            extensions: ['md', 'json', 'jsonl', 'zip'],
          },
        ],
      })

      if (result) {
        const filePath = result as string
        setSelectedFile(filePath)
        setError(null)

        const isZip = filePath.toLowerCase().endsWith('.zip')
        setImportType(isZip ? 'zip' : 'file')

        if (isZip) {
          setIsLoading(true)
          const contents = await previewZip(filePath)
          setZipContents(contents)
          setStep('preview')

          // 既存ファイルのチェック
          const fileNames = contents
            .filter((f) => !f.is_directory)
            .map((f) => f.name)
          if (fileNames.length > 0) {
            const existsInfo = await checkFilesExist(fileNames)
            const existing = existsInfo.filter((f) => f.exists)
            setExistingFiles(existing)
          }
          setIsLoading(false)
        } else {
          // 単一ファイルの場合、宛先パスを設定
          const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'unknown'
          setDestinationPath(fileName)
          setStep('preview')

          // 既存ファイルのチェック
          const existsInfo = await checkFileExists(fileName)
          if (existsInfo && existsInfo.exists) {
            setExistingFiles([existsInfo])
          }
        }
      }
    } catch (err) {
      setError(`ファイル選択エラー: ${err}`)
    }
  }, [])

  const handleImport = useCallback(
    async (createBackup: boolean) => {
      if (!selectedFile) return

      setShowOverwriteDialog(false)
      setStep('importing')
      setIsLoading(true)
      setError(null)

      try {
        let result: ImportResult

        if (importType === 'zip') {
          result = await importZip(selectedFile, createBackup)
        } else {
          result = await importFile(selectedFile, destinationPath, createBackup)
        }

        setImportResult(result)
        setStep('result')

        if (result.success) {
          onImportComplete()
        }
      } catch (err) {
        setError(`インポートエラー: ${err}`)
        setStep('preview')
      } finally {
        setIsLoading(false)
      }
    },
    [selectedFile, importType, destinationPath, onImportComplete]
  )

  const handleStartImport = useCallback(() => {
    if (existingFiles.length > 0) {
      setShowOverwriteDialog(true)
    } else {
      handleImport(false)
    }
  }, [existingFiles.length, handleImport])

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const importIcon = <Icon name="upload" className="size-5 text-blue-500" />

  const footer = step !== 'importing' ? (
    <div className="flex justify-end gap-3">
      {step === 'select' && (
        <button
          onClick={handleClose}
          className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
        >
          キャンセル
        </button>
      )}

      {step === 'preview' && (
        <>
          <button
            onClick={() => {
              setStep('select')
              setSelectedFile(null)
              setZipContents([])
              setExistingFiles([])
            }}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
          >
            戻る
          </button>
          <button
            onClick={handleStartImport}
            disabled={isLoading || (importType === 'file' && !destinationPath.trim())}
            className="px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            インポート実行
          </button>
        </>
      )}

      {step === 'result' && (
        <button
          onClick={handleClose}
          className="px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        >
          閉じる
        </button>
      )}
    </div>
  ) : undefined

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="設定のインポート"
        icon={importIcon}
        size="md"
        showCloseButton={step !== 'importing'}
        closeOnBackdrop={step !== 'importing'}
        closeOnEscape={step !== 'importing'}
        footer={footer}
        contentClassName="px-6 py-4"
      >
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md" role="alert">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Step: Select File */}
        {step === 'select' && (
          <div className="text-center py-8">
            <div className="mb-6">
              <Icon name="cloud" className="size-16 mx-auto text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">ファイルを選択</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              .md, .json, .jsonl ファイルまたは .zip ファイルを選択してください
            </p>
            <button
              onClick={handleSelectFile}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              ファイルを選択
            </button>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
              ZIPファイルの場合、エクスポートした設定を一括でインポートできます
            </p>
          </div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && (
          <div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                選択されたファイル:
              </p>
              <p className="font-mono text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 rounded mt-1 truncate">
                {selectedFile}
              </p>
            </div>

            {importType === 'file' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  インポート先 (~/.claude/ 配下)
                </label>
                <input
                  type="text"
                  value={destinationPath}
                  onChange={(e) => setDestinationPath(e.target.value)}
                  placeholder="例: CLAUDE.md, projects/myproject/CLAUDE.md"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  サブディレクトリも指定できます（自動作成されます）
                </p>
              </div>
            )}

            {importType === 'zip' && zipContents.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                  ZIPの内容 ({zipContents.filter((f) => !f.is_directory).length} ファイル)
                </p>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3 max-h-60 overflow-y-auto">
                  <ul className="space-y-1">
                    {zipContents.map((file, index) => (
                      <li
                        key={index}
                        className="text-sm flex items-center justify-between gap-2"
                      >
                        <span className="flex items-center gap-2 truncate text-gray-700 dark:text-gray-300">
                          {file.is_directory ? (
                            <Icon name="folder" className="size-4 text-yellow-500 flex-shrink-0" />
                          ) : (
                            <Icon name="fileText" className="size-4 text-blue-500 flex-shrink-0" />
                          )}
                          <span className="truncate">{file.name}</span>
                        </span>
                        {!file.is_directory && (
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {formatFileSize(file.size)}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {existingFiles.length > 0 && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md" role="alert">
                <p className="text-sm text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                  <Icon name="warning" className="size-4" />
                  {existingFiles.length} 個のファイルが上書きされます
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step: Importing */}
        {step === 'importing' && (
          <div className="text-center py-8" role="status" aria-live="polite">
            <div className="mb-4">
              <Icon name="spinner" className="size-12 mx-auto text-blue-500 animate-spin" />
            </div>
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">インポート中...</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              しばらくお待ちください
            </p>
          </div>
        )}

        {/* Step: Result */}
        {step === 'result' && importResult && (
          <div>
            <div
              className={`mb-4 p-4 rounded-lg ${
                importResult.success
                  ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
              }`}
              role="alert"
            >
              <p
                className={`font-medium flex items-center gap-2 ${
                  importResult.success
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-red-700 dark:text-red-400'
                }`}
              >
                {importResult.success ? (
                  <>
                    <Icon name="checkCircle" className="size-5" />
                    インポート完了
                  </>
                ) : (
                  <>
                    <Icon name="error" className="size-5" />
                    インポート失敗
                  </>
                )}
              </p>
            </div>

            <div className="space-y-4">
              {importResult.imported_files.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                    インポート成功 ({importResult.imported_files.length} ファイル)
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 max-h-32 overflow-y-auto">
                    {importResult.imported_files.map((file, i) => (
                      <li key={i} className="truncate">
                        {file}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {importResult.skipped_files.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-1">
                    スキップ ({importResult.skipped_files.length} ファイル)
                  </p>
                  <ul className="text-sm text-gray-500 space-y-1 max-h-32 overflow-y-auto">
                    {importResult.skipped_files.map((file, i) => (
                      <li key={i} className="truncate">
                        {file}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {importResult.errors.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">
                    エラー ({importResult.errors.length} 件)
                  </p>
                  <ul className="text-sm text-red-500 space-y-1 max-h-32 overflow-y-auto">
                    {importResult.errors.map((err, i) => (
                      <li key={i} className="truncate">
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {importResult.backup_created && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  * 元のファイルは ~/.claude/backups/ にバックアップされました
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Overwrite Confirmation Dialog */}
      <OverwriteConfirmDialog
        isOpen={showOverwriteDialog}
        onClose={() => setShowOverwriteDialog(false)}
        onConfirm={handleImport}
        existingFiles={existingFiles}
        importType={importType}
      />
    </>
  )
}

export default ImportDialog
