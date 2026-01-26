import { useState, useEffect, useCallback } from 'react'
import { getFileTree, readFile, writeFile, createFile, isTauri } from './useTauri'
import { validateContent } from '../utils/validators'
import type { FileNode, SelectedFile, ValidationError } from '../types'

/**
 * デモモード用のファイルツリー
 * Tauri環境外（ブラウザ開発時）に表示するサンプルデータ
 */
const DEMO_FILE_TREE: FileNode[] = [
  {
    name: 'CLAUDE.md',
    path: '~/.claude/CLAUDE.md',
    file_type: 'file',
  },
  {
    name: 'settings.json',
    path: '~/.claude/settings.json',
    file_type: 'file',
  },
  {
    name: 'projects',
    path: '~/.claude/projects',
    file_type: 'directory',
    children: [
      {
        name: 'example-project',
        path: '~/.claude/projects/example-project',
        file_type: 'directory',
        children: [
          {
            name: 'CLAUDE.md',
            path: '~/.claude/projects/example-project/CLAUDE.md',
            file_type: 'file',
          },
        ],
      },
    ],
  },
]

interface UseFileManagerOptions {
  /** 読み取り専用モード */
  readOnly: boolean
  /** 成功メッセージを表示するコールバック */
  onSuccess: (message: string) => void
  /** エラーメッセージを表示するコールバック */
  onError: (message: string) => void
}

/**
 * ファイル管理を行うカスタムフック
 * - ファイルツリーの読み込み
 * - ファイルの選択、編集、保存
 * - バリデーションエラーの管理
 * - 未保存変更の検出
 */
export function useFileManager({ readOnly, onSuccess, onError }: UseFileManagerOptions) {
  const [fileTree, setFileTree] = useState<FileNode[]>([])
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fileTreeError, setFileTreeError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])

  /**
   * ファイルツリーを読み込む
   * Tauri環境では実ファイルを、それ以外ではデモデータを表示
   */
  const loadFileTree = useCallback(async () => {
    setLoading(true)
    setFileTreeError(null)

    try {
      if (isTauri()) {
        const tree = await getFileTree()
        if (tree.length === 0) {
          setFileTreeError('ファイルが見つかりませんでした')
        }
        setFileTree(tree)
      } else {
        // 非Tauri環境（ブラウザ開発時）のデモデータ
        setFileTree(DEMO_FILE_TREE)
        onSuccess('デモモードで起動中（Tauriアプリとして起動すると実ファイルを編集できます）')
      }
    } catch {
      setFileTreeError('ファイルツリーの読み込みに失敗しました')
      setFileTree([])
    } finally {
      setLoading(false)
    }
  }, [onSuccess])

  // 初回レンダリング時にファイルツリーを読み込む
  useEffect(() => {
    loadFileTree()
  }, [loadFileTree])

  /**
   * ファイルを選択して内容を読み込む
   * @param path ファイルパス
   * @param name ファイル名
   * @returns 選択に成功したかどうか
   */
  const selectFile = useCallback(async (path: string, name: string): Promise<boolean> => {
    if (isTauri()) {
      const fileContent = await readFile(path)
      if (fileContent) {
        setSelectedFile({
          path: fileContent.path,
          name: fileContent.name,
          content: fileContent.content,
          originalContent: fileContent.content,
        })
        return true
      }
      return false
    } else {
      // デモモード
      const content = `# ${name}\n\nファイル: ${path}\n\n編集するにはTauriアプリとして起動してください。`
      setSelectedFile({
        path,
        name,
        content,
        originalContent: content,
      })
      return true
    }
  }, [])

  /**
   * 選択中のファイルの内容を更新
   */
  const updateContent = useCallback((newContent: string) => {
    if (selectedFile && !readOnly) {
      setSelectedFile({
        ...selectedFile,
        content: newContent,
      })
    }
  }, [selectedFile, readOnly])

  /**
   * バリデーションエラーを更新
   */
  const updateValidationErrors = useCallback((errors: ValidationError[]) => {
    setValidationErrors(errors)
  }, [])

  /**
   * 選択中のファイルを保存
   * @returns 保存に成功したかどうか
   */
  const saveFile = useCallback(async (): Promise<boolean> => {
    if (!selectedFile || readOnly) return false

    // 保存前に構文チェックを実行
    const result = validateContent(selectedFile.content, selectedFile.name)
    const hasErrors = result.errors.some(e => e.severity === 'error')

    if (hasErrors) {
      onError('構文エラーがあるため保存できません。エラーを修正してください。')
      return false
    }

    setSaving(true)

    try {
      if (isTauri()) {
        const success = await writeFile(selectedFile.path, selectedFile.content)
        if (success) {
          setSelectedFile({
            ...selectedFile,
            originalContent: selectedFile.content,
          })
          onSuccess('保存しました（バックアップ作成済み）')
          return true
        } else {
          onError('保存に失敗しました')
          return false
        }
      } else {
        onError('Tauriアプリとして起動してください')
        return false
      }
    } finally {
      setSaving(false)
    }
  }, [selectedFile, readOnly, onSuccess, onError])

  /**
   * テンプレートからファイルを作成
   */
  const createFromTemplate = useCallback(async (
    fileName: string,
    content: string,
    directory: string
  ): Promise<boolean> => {
    if (isTauri()) {
      const dirPath = directory === 'root' ? '' : `${directory}/`
      const fullPath = `~/.claude/${dirPath}${fileName}`

      const success = await createFile(fullPath, content)
      if (success) {
        onSuccess(`${fileName} を作成しました`)
        await loadFileTree()
        await selectFile(fullPath, fileName)
        return true
      } else {
        onError('ファイルの作成に失敗しました')
        return false
      }
    } else {
      // デモモード - ファイルを仮想的に開く
      setSelectedFile({
        path: `~/.claude/${directory === 'root' ? '' : directory + '/'}${fileName}`,
        name: fileName,
        content: content,
        originalContent: content,
      })
      onSuccess(`デモモード: ${fileName} を作成しました（保存されません）`)
      return true
    }
  }, [loadFileTree, selectFile, onSuccess, onError])

  // 未保存の変更があるかどうか
  const hasUnsavedChanges = selectedFile
    ? selectedFile.content !== selectedFile.originalContent
    : false

  return {
    // 状態
    fileTree,
    selectedFile,
    loading,
    saving,
    fileTreeError,
    validationErrors,
    hasUnsavedChanges,
    // 操作
    loadFileTree,
    selectFile,
    updateContent,
    updateValidationErrors,
    saveFile,
    createFromTemplate,
  }
}
