import { useCallback, useState } from 'react'

interface UseImportOptions {
  /** 成功メッセージを表示するコールバック */
  onSuccess: (message: string) => void
  /** ファイルツリーを再読み込みするコールバック */
  onReloadFileTree: () => Promise<void>
}

/**
 * インポート機能を管理するカスタムフック
 * - インポートダイアログの開閉
 * - インポート完了時の処理
 */
export function useImport({ onSuccess, onReloadFileTree }: UseImportOptions) {
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  /**
   * インポートダイアログを開く
   */
  const openImportDialog = useCallback(() => {
    setImportDialogOpen(true)
  }, [])

  /**
   * インポートダイアログを閉じる
   */
  const closeImportDialog = useCallback(() => {
    setImportDialogOpen(false)
  }, [])

  /**
   * インポート完了時のハンドラ
   */
  const handleImportComplete = useCallback(async () => {
    await onReloadFileTree()
    onSuccess('インポートが完了しました')
  }, [onReloadFileTree, onSuccess])

  return {
    // 状態
    importDialogOpen,
    // 操作
    openImportDialog,
    closeImportDialog,
    handleImportComplete,
  }
}
