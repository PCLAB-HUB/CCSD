import { useState, useCallback } from 'react'

interface UseBackupOptions {
  /** 成功メッセージを表示するコールバック */
  onSuccess: (message: string) => void
  /** エラーメッセージを表示するコールバック */
  onError: (message: string) => void
  /** ファイルツリーを再読み込みするコールバック */
  onReloadFileTree: () => Promise<void>
  /** ファイルを再選択するコールバック */
  onReselectFile: (path: string, name: string) => Promise<boolean>
}

/**
 * バックアップ機能を管理するカスタムフック
 * - バックアップリストの開閉
 * - 復元完了時の処理
 */
export function useBackup({
  onSuccess,
  onError,
  onReloadFileTree,
  onReselectFile,
}: UseBackupOptions) {
  const [backupListOpen, setBackupListOpen] = useState(false)

  /**
   * バックアップリストを開く
   */
  const openBackupList = useCallback(() => {
    setBackupListOpen(true)
  }, [])

  /**
   * バックアップリストを閉じる
   */
  const closeBackupList = useCallback(() => {
    setBackupListOpen(false)
  }, [])

  /**
   * バックアップ復元完了時のハンドラ
   * @param success 復元が成功したかどうか
   * @param message 表示するメッセージ
   * @param selectedFilePath 現在選択中のファイルのパス（再読み込み用）
   * @param selectedFileName 現在選択中のファイル名（再読み込み用）
   */
  const handleRestoreComplete = useCallback(async (
    success: boolean,
    message: string,
    selectedFilePath?: string,
    selectedFileName?: string
  ) => {
    if (success) {
      onSuccess(message)
      // ファイルツリーを再読み込み
      await onReloadFileTree()
      // 現在選択中のファイルがあれば再読み込み
      if (selectedFilePath && selectedFileName) {
        await onReselectFile(selectedFilePath, selectedFileName)
      }
    } else {
      onError(message)
    }
  }, [onSuccess, onError, onReloadFileTree, onReselectFile])

  return {
    // 状態
    backupListOpen,
    // 操作
    openBackupList,
    closeBackupList,
    handleRestoreComplete,
  }
}
