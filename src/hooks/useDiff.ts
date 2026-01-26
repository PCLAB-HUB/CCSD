import { useState, useCallback } from 'react'
import type { DiffData } from '../components/diff/DiffModal'
import type { SelectedFile } from '../types'
import { readFile, getBackupContent, isTauri } from './useTauri'

interface UseDiffOptions {
  /** エラーメッセージを表示するコールバック */
  onError: (message: string) => void
  /** 成功メッセージを表示するコールバック */
  onSuccess: (message: string) => void
}

/**
 * 差分表示を管理するカスタムフック
 * - バックアップとの差分比較
 * - 編集中の変更プレビュー
 */
export function useDiff({ onError, onSuccess }: UseDiffOptions) {
  const [diffModalOpen, setDiffModalOpen] = useState(false)
  const [diffData, setDiffData] = useState<DiffData | null>(null)

  /**
   * バックアップと現在のファイルの差分を表示
   * @param backupPath バックアップファイルのパス
   * @param originalPath 元ファイルのパス
   * @param backupName バックアップの表示名
   */
  const compareWithBackup = useCallback(async (
    backupPath: string,
    originalPath: string,
    backupName: string
  ) => {
    if (!isTauri()) {
      onError('Tauriアプリとして起動してください')
      return
    }

    const [backupContent, currentFile] = await Promise.all([
      getBackupContent(backupPath),
      readFile(originalPath),
    ])

    if (backupContent === null || currentFile === null) {
      onError('ファイルの読み込みに失敗しました')
      return
    }

    setDiffData({
      original: backupContent,
      modified: currentFile.content,
      originalLabel: `バックアップ (${backupName})`,
      modifiedLabel: '現在のファイル',
      filename: currentFile.name,
    })
    setDiffModalOpen(true)
  }, [onError])

  /**
   * 保存前の変更内容をプレビュー
   * @param selectedFile 現在選択中のファイル
   */
  const previewChanges = useCallback((selectedFile: SelectedFile | null) => {
    if (!selectedFile) return

    if (selectedFile.content === selectedFile.originalContent) {
      onSuccess('変更はありません')
      return
    }

    setDiffData({
      original: selectedFile.originalContent,
      modified: selectedFile.content,
      originalLabel: '保存済みの内容',
      modifiedLabel: '編集中の内容',
      filename: selectedFile.name,
    })
    setDiffModalOpen(true)
  }, [onSuccess])

  /**
   * 差分モーダルを閉じる
   */
  const closeDiffModal = useCallback(() => {
    setDiffModalOpen(false)
    setDiffData(null)
  }, [])

  return {
    // 状態
    diffModalOpen,
    diffData,
    // 操作
    compareWithBackup,
    previewChanges,
    closeDiffModal,
  }
}
