import { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import MainArea from './components/layout/MainArea'
import DiffModal, { DiffData } from './components/diff/DiffModal'
import BackupList from './components/backup/BackupList'
import TemplateSelector from './components/template/TemplateSelector'
import CreateFromTemplateDialog from './components/template/CreateFromTemplateDialog'
import { FileNode, FileContent, getFileTree, readFile, writeFile, searchFiles, isTauri, getBackupContent, createFile } from './hooks/useTauri'
import { Template } from './data/templates'
import { validateContent, type ValidationError } from './utils/validators'
import { isMarkdownFile } from './utils/markdownParser'

export interface SelectedFile {
  path: string
  name: string
  content: string
  originalContent: string
}

export interface SearchHighlight {
  query: string
  currentIndex: number
  totalCount: number
}

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })
  const [fileTree, setFileTree] = useState<FileNode[]>([])
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<FileContent[]>([])
  const [readOnly, setReadOnly] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(280)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [fileTreeError, setFileTreeError] = useState<string | null>(null)
  const [searchHighlight, setSearchHighlight] = useState<SearchHighlight | null>(null)
  const [diffModalOpen, setDiffModalOpen] = useState(false)
  const [diffData, setDiffData] = useState<DiffData | null>(null)
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [backupListOpen, setBackupListOpen] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [scrollSync, setScrollSync] = useState(true)

  // ダークモードの適用
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // ファイルツリーの読み込み
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
        const demoTree: FileNode[] = [
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
        setFileTree(demoTree)
        setMessage({ type: 'success', text: 'デモモードで起動中（Tauriアプリとして起動すると実ファイルを編集できます）' })
      }
    } catch {
      setFileTreeError('ファイルツリーの読み込みに失敗しました')
      setFileTree([])
    } finally {
      setLoading(false)
    }
  }, [])

  // 初回レンダリング時にファイルツリーを読み込む
  useEffect(() => {
    loadFileTree()
  }, [loadFileTree])

  // 検索処理
  useEffect(() => {
    async function performSearch() {
      if (!searchQuery.trim()) {
        setSearchResults([])
        return
      }

      if (isTauri() && searchQuery.length >= 2) {
        const results = await searchFiles(searchQuery)
        setSearchResults(results)
      }
    }

    const debounceTimer = setTimeout(performSearch, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  // メッセージの自動クリア
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const handleFileSelect = useCallback(async (path: string, name: string, highlightQuery?: string) => {
    if (isTauri()) {
      const fileContent = await readFile(path)
      if (fileContent) {
        setSelectedFile({
          path: fileContent.path,
          name: fileContent.name,
          content: fileContent.content,
          originalContent: fileContent.content,
        })
        // 検索結果からファイルを開いた場合、ハイライトを設定
        if (highlightQuery) {
          setSearchHighlight({
            query: highlightQuery,
            currentIndex: 0,
            totalCount: 0,
          })
        } else {
          setSearchHighlight(null)
        }
      }
    } else {
      // デモモード
      const content = `# ${name}\n\nファイル: ${path}\n\n編集するにはTauriアプリとして起動してください。`
      setSelectedFile({
        path,
        name,
        content,
        originalContent: content,
      })
      if (highlightQuery) {
        setSearchHighlight({
          query: highlightQuery,
          currentIndex: 0,
          totalCount: 0,
        })
      } else {
        setSearchHighlight(null)
      }
    }
    setSearchQuery('')
    setSearchResults([])
  }, [])

  const handleContentChange = useCallback((newContent: string) => {
    if (selectedFile && !readOnly) {
      setSelectedFile({
        ...selectedFile,
        content: newContent,
      })
    }
  }, [selectedFile, readOnly])

  // バリデーション結果の変更ハンドラ
  const handleValidationChange = useCallback((errors: ValidationError[]) => {
    setValidationErrors(errors)
  }, [])

  const handleSave = useCallback(async () => {
    if (!selectedFile || readOnly) return

    // 保存前に構文チェックを実行
    const result = validateContent(selectedFile.content, selectedFile.name)
    const hasErrors = result.errors.some(e => e.severity === 'error')

    if (hasErrors) {
      setMessage({ type: 'error', text: '構文エラーがあるため保存できません。エラーを修正してください。' })
      return
    }

    setSaving(true)
    if (isTauri()) {
      const success = await writeFile(selectedFile.path, selectedFile.content)
      if (success) {
        setSelectedFile({
          ...selectedFile,
          originalContent: selectedFile.content,
        })
        setMessage({ type: 'success', text: '保存しました（バックアップ作成済み）' })
      } else {
        setMessage({ type: 'error', text: '保存に失敗しました' })
      }
    } else {
      setMessage({ type: 'error', text: 'Tauriアプリとして起動してください' })
    }
    setSaving(false)
  }, [selectedFile, readOnly])

  // Cmd+S / Ctrl+S で保存
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave])

  const handleSearchNavigate = useCallback((direction: 'next' | 'prev') => {
    if (!searchHighlight || searchHighlight.totalCount === 0) return

    setSearchHighlight(prev => {
      if (!prev) return null
      let newIndex: number
      if (direction === 'next') {
        newIndex = (prev.currentIndex + 1) % prev.totalCount
      } else {
        newIndex = prev.currentIndex - 1 < 0 ? prev.totalCount - 1 : prev.currentIndex - 1
      }
      return { ...prev, currentIndex: newIndex }
    })
  }, [searchHighlight])

  const handleSearchCountUpdate = useCallback((count: number) => {
    setSearchHighlight(prev => {
      if (!prev) return null
      return { ...prev, totalCount: count }
    })
  }, [])

  const handleClearHighlight = useCallback(() => {
    setSearchHighlight(null)
  }, [])

  // バックアップと現在のファイルの差分を表示
  const handleCompareWithBackup = useCallback(async (backupPath: string, originalPath: string, backupName: string) => {
    if (!isTauri()) {
      setMessage({ type: 'error', text: 'Tauriアプリとして起動してください' })
      return
    }

    const [backupContent, currentFile] = await Promise.all([
      getBackupContent(backupPath),
      readFile(originalPath),
    ])

    if (backupContent === null || currentFile === null) {
      setMessage({ type: 'error', text: 'ファイルの読み込みに失敗しました' })
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
  }, [])

  // 保存前の変更内容をプレビュー
  const handlePreviewChanges = useCallback(() => {
    if (!selectedFile) return

    if (selectedFile.content === selectedFile.originalContent) {
      setMessage({ type: 'success', text: '変更はありません' })
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
  }, [selectedFile])

  const handleCloseDiffModal = useCallback(() => {
    setDiffModalOpen(false)
    setDiffData(null)
  }, [])

  // バックアップ復元完了時のハンドラ
  const handleRestoreComplete = useCallback((success: boolean, restoreMessage: string) => {
    setMessage({ type: success ? 'success' : 'error', text: restoreMessage })
    if (success) {
      // ファイルツリーを再読み込み
      loadFileTree()
      // 現在選択中のファイルがあれば再読み込み
      if (selectedFile) {
        handleFileSelect(selectedFile.path, selectedFile.name)
      }
    }
  }, [loadFileTree, selectedFile, handleFileSelect])

  // テンプレート機能
  const handleSelectTemplate = useCallback((template: Template) => {
    setSelectedTemplate(template)
    setTemplateSelectorOpen(false)
    setCreateDialogOpen(true)
  }, [])

  const handleBackToTemplateSelector = useCallback(() => {
    setCreateDialogOpen(false)
    setSelectedTemplate(null)
    setTemplateSelectorOpen(true)
  }, [])

  const handleCreateFromTemplate = useCallback(async (fileName: string, content: string, directory: string) => {
    if (isTauri()) {
      const dirPath = directory === 'root' ? '' : `${directory}/`
      const fullPath = `~/.claude/${dirPath}${fileName}`

      const success = await createFile(fullPath, content)
      if (success) {
        setMessage({ type: 'success', text: `${fileName} を作成しました` })
        // ファイルツリーを再読み込み
        await loadFileTree()
        // 作成したファイルを開く
        handleFileSelect(fullPath, fileName)
        setCreateDialogOpen(false)
        setSelectedTemplate(null)
      } else {
        setMessage({ type: 'error', text: 'ファイルの作成に失敗しました' })
      }
    } else {
      // デモモード - ファイルを仮想的に開く
      setSelectedFile({
        path: `~/.claude/${directory === 'root' ? '' : directory + '/'}${fileName}`,
        name: fileName,
        content: content,
        originalContent: content,
      })
      setMessage({ type: 'success', text: `デモモード: ${fileName} を作成しました（保存されません）` })
      setCreateDialogOpen(false)
      setSelectedTemplate(null)
    }
  }, [loadFileTree, handleFileSelect])

  const hasUnsavedChanges = selectedFile
    ? selectedFile.content !== selectedFile.originalContent
    : false

  // 現在のファイルがMarkdownかどうか
  const currentFileIsMarkdown = selectedFile ? isMarkdownFile(selectedFile.name) : false

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchResults={searchResults}
        onSearchResultClick={(path, name) => handleFileSelect(path, name, searchQuery)}
        readOnly={readOnly}
        onToggleReadOnly={() => setReadOnly(!readOnly)}
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={handleSave}
        saving={saving}
        message={message}
        searchHighlight={searchHighlight}
        onSearchNavigate={handleSearchNavigate}
        onClearHighlight={handleClearHighlight}
        onOpenBackups={() => setBackupListOpen(true)}
        onCreateNew={() => setTemplateSelectorOpen(true)}
        onOpenImport={() => {/* TODO: Import機能を実装 */}}
        selectedFilePath={selectedFile?.path}
        selectedFileName={selectedFile?.name}
        isMarkdownFile={currentFileIsMarkdown}
        showPreview={showPreview}
        onTogglePreview={() => setShowPreview(!showPreview)}
        scrollSync={scrollSync}
        onToggleScrollSync={() => setScrollSync(!scrollSync)}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          width={sidebarWidth}
          onWidthChange={setSidebarWidth}
          fileTree={fileTree}
          onFileSelect={handleFileSelect}
          selectedPath={selectedFile?.path}
          loading={loading}
          error={fileTreeError}
          onRetry={loadFileTree}
        />
        <MainArea
          selectedFile={selectedFile}
          onContentChange={handleContentChange}
          readOnly={readOnly}
          darkMode={darkMode}
          searchHighlight={searchHighlight}
          onSearchCountUpdate={handleSearchCountUpdate}
          onSearchNavigate={handleSearchNavigate}
          validationErrors={validationErrors}
          onValidationChange={handleValidationChange}
          showPreview={showPreview}
          scrollSync={scrollSync}
          onPreviewChanges={handlePreviewChanges}
          hasUnsavedChanges={hasUnsavedChanges}
          onCompareWithBackup={handleCompareWithBackup}
        />
      </div>

      {/* Diff Modal */}
      <DiffModal
        isOpen={diffModalOpen}
        onClose={handleCloseDiffModal}
        diffData={diffData}
        darkMode={darkMode}
      />

      {/* Backup List Modal */}
      <BackupList
        isOpen={backupListOpen}
        onClose={() => setBackupListOpen(false)}
        onRestoreComplete={handleRestoreComplete}
        onCompare={handleCompareWithBackup}
      />

      {/* Template Selector */}
      <TemplateSelector
        isOpen={templateSelectorOpen}
        onClose={() => setTemplateSelectorOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* Create From Template Dialog */}
      <CreateFromTemplateDialog
        isOpen={createDialogOpen}
        template={selectedTemplate}
        onClose={() => {
          setCreateDialogOpen(false)
          setSelectedTemplate(null)
        }}
        onBack={handleBackToTemplateSelector}
        onCreate={handleCreateFromTemplate}
      />
    </div>
  )
}

export default App
