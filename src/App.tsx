import { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import MainArea from './components/layout/MainArea'
import { FileNode, FileContent, getFileTree, readFile, writeFile, searchFiles, isTauri } from './hooks/useTauri'

export interface SelectedFile {
  path: string
  name: string
  content: string
  originalContent: string
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

  const handleFileSelect = useCallback(async (path: string, name: string) => {
    if (isTauri()) {
      const fileContent = await readFile(path)
      if (fileContent) {
        setSelectedFile({
          path: fileContent.path,
          name: fileContent.name,
          content: fileContent.content,
          originalContent: fileContent.content,
        })
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

  const handleSave = useCallback(async () => {
    if (!selectedFile || readOnly) return

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

  const hasUnsavedChanges = selectedFile
    ? selectedFile.content !== selectedFile.originalContent
    : false

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchResults={searchResults}
        onSearchResultClick={handleFileSelect}
        readOnly={readOnly}
        onToggleReadOnly={() => setReadOnly(!readOnly)}
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={handleSave}
        saving={saving}
        message={message}
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
        />
      </div>
    </div>
  )
}

export default App
