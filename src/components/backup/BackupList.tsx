import { FC, useState, useEffect, useCallback } from 'react'
import { FileNode, getBackups, restoreBackup, isTauri } from '../../hooks/useTauri'

interface BackupListProps {
  isOpen: boolean
  onClose: () => void
  onRestoreComplete: (success: boolean, message: string) => void
  onCompare?: (backupPath: string, originalPath: string, backupName: string) => void
}

interface BackupItem {
  node: FileNode
  date: Date
  displayDate: string
  isOld: boolean // 30日以上古いかどうか
}

/**
 * バックアップファイル名から日時を抽出
 * 例: settings.json.backup.2024-01-25T10-30-00 -> Date
 */
function parseDateFromBackupName(name: string): Date | null {
  // .backup.YYYY-MM-DDTHH-MM-SS 形式を探す
  const match = name.match(/\.backup\.(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})$/)
  if (match) {
    // ハイフンをコロンに戻して ISO形式に変換
    const isoString = match[1].replace(/T(\d{2})-(\d{2})-(\d{2})/, 'T$1:$2:$3')
    const date = new Date(isoString)
    if (!isNaN(date.getTime())) {
      return date
    }
  }
  return null
}

/**
 * バックアップファイルから元のファイルパスを推測
 * 例: /path/to/settings.json.backup.2024-01-25T10-30-00 -> /path/to/settings.json
 */
function getOriginalPath(backupPath: string): string {
  return backupPath.replace(/\.backup\.\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/, '')
}

/**
 * 日付を日本語形式でフォーマット
 */
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${year}年${month}月${day}日 ${hours}:${minutes}`
}

/**
 * 30日以上前かどうかを判定
 */
function isOlderThan30Days(date: Date): boolean {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  return date < thirtyDaysAgo
}

/**
 * FileNode配列をフラット化してバックアップアイテムに変換
 */
function flattenBackups(nodes: FileNode[]): BackupItem[] {
  const items: BackupItem[] = []

  function traverse(nodeList: FileNode[]) {
    for (const node of nodeList) {
      if (node.file_type === 'file') {
        const date = parseDateFromBackupName(node.name)
        if (date) {
          items.push({
            node,
            date,
            displayDate: formatDate(date),
            isOld: isOlderThan30Days(date),
          })
        }
      }
      if (node.children) {
        traverse(node.children)
      }
    }
  }

  traverse(nodes)
  // 日付の新しい順にソート
  items.sort((a, b) => b.date.getTime() - a.date.getTime())
  return items
}

const BackupList: FC<BackupListProps> = ({ isOpen, onClose, onRestoreComplete, onCompare }) => {
  const [backups, setBackups] = useState<BackupItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmRestore, setConfirmRestore] = useState<BackupItem | null>(null)
  const [restoring, setRestoring] = useState(false)

  const loadBackups = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      if (isTauri()) {
        const nodes = await getBackups()
        const items = flattenBackups(nodes)
        setBackups(items)

        // 30日以上古いバックアップがある場合に警告
        const oldBackups = items.filter(item => item.isOld)
        if (oldBackups.length > 0) {
          // TODO: Rustバックエンドに自動削除機能を追加する場合はここで呼び出す
          // await invoke('cleanup_old_backups', { days: 30 })
          console.log(`${oldBackups.length}件の古いバックアップがあります（30日以上前）`)
        }
      } else {
        // デモモード
        const demoBackups: BackupItem[] = [
          {
            node: {
              name: 'settings.json.backup.2024-01-25T10-30-00',
              path: '~/.claude/backups/settings.json.backup.2024-01-25T10-30-00',
              file_type: 'file',
            },
            date: new Date('2024-01-25T10:30:00'),
            displayDate: '2024年1月25日 10:30',
            isOld: false,
          },
          {
            node: {
              name: 'CLAUDE.md.backup.2024-01-24T15-45-00',
              path: '~/.claude/backups/CLAUDE.md.backup.2024-01-24T15-45-00',
              file_type: 'file',
            },
            date: new Date('2024-01-24T15:45:00'),
            displayDate: '2024年1月24日 15:45',
            isOld: false,
          },
        ]
        setBackups(demoBackups)
      }
    } catch {
      setError('バックアップ一覧の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadBackups()
    }
  }, [isOpen, loadBackups])

  const handleRestore = async (item: BackupItem) => {
    setRestoring(true)
    const targetPath = getOriginalPath(item.node.path)

    try {
      if (isTauri()) {
        const success = await restoreBackup(item.node.path, targetPath)
        if (success) {
          onRestoreComplete(true, `${item.node.name} を復元しました`)
          onClose()
        } else {
          onRestoreComplete(false, '復元に失敗しました')
        }
      } else {
        // デモモード
        onRestoreComplete(false, 'Tauriアプリとして起動してください')
      }
    } catch {
      onRestoreComplete(false, '復元中にエラーが発生しました')
    } finally {
      setRestoring(false)
      setConfirmRestore(null)
    }
  }

  const getFileNameFromBackup = (backupName: string): string => {
    // バックアップ名から元のファイル名を取得
    return backupName.replace(/\.backup\.\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/, '')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* モーダル */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col m-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            バックアップ一覧
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="閉じる"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="w-8 h-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="ml-3 text-gray-500 dark:text-gray-400">読み込み中...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={loadBackups}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                再試行
              </button>
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">バックアップがありません</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                ファイルを保存するとバックアップが自動作成されます
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* 30日以上古いバックアップの警告 */}
              {backups.some(b => b.isOld) && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    30日以上前のバックアップがあります。古いバックアップは自動削除の対象です。
                  </p>
                  {/* TODO: Rustバックエンドに cleanup_old_backups コマンドを追加後、削除ボタンを有効化
                  <button className="mt-2 text-sm text-yellow-600 dark:text-yellow-400 underline hover:no-underline">
                    古いバックアップを削除
                  </button>
                  */}
                </div>
              )}

              {backups.map((item) => (
                <div
                  key={item.node.path}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                    item.isOld
                      ? 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 opacity-75'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {getFileNameFromBackup(item.node.name)}
                      </span>
                      {item.isOld && (
                        <span className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded">
                          古い
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {item.displayDate}
                    </div>
                    <div className="mt-1 text-xs text-gray-400 dark:text-gray-500 truncate">
                      {item.node.path}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    {onCompare && (
                      <button
                        onClick={() => {
                          const originalPath = getOriginalPath(item.node.path)
                          onCompare(item.node.path, originalPath, item.node.name)
                        }}
                        className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="現在のファイルと比較"
                      >
                        比較
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmRestore(item)}
                      className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                      復元
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {backups.length > 0 && `${backups.length}件のバックアップ`}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>

      {/* 復元確認ダイアログ */}
      {confirmRestore && (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setConfirmRestore(null)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 m-4 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              復元の確認
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              以下のバックアップを復元しますか？
            </p>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-3 mb-4">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {getFileNameFromBackup(confirmRestore.node.name)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {confirmRestore.displayDate}
              </p>
            </div>
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-4">
              現在のファイルは上書きされます。この操作は取り消せません。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmRestore(null)}
                disabled={restoring}
                className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={() => handleRestore(confirmRestore)}
                disabled={restoring}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {restoring ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    復元中...
                  </>
                ) : (
                  '復元する'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BackupList
