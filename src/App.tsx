import { useCallback, useMemo, lazy, Suspense } from 'react'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import MainArea from './components/layout/MainArea'

// 遅延読み込み - モーダルコンポーネントは初期表示に不要
const DiffModal = lazy(() => import('./components/diff/DiffModal'))
const BackupList = lazy(() => import('./components/backup/BackupList'))
const TemplateSelector = lazy(() => import('./components/template/TemplateSelector'))
const CreateFromTemplateDialog = lazy(() => import('./components/template/CreateFromTemplateDialog'))
const TemplateManager = lazy(() => import('./components/template/TemplateManager'))
const ImportDialog = lazy(() => import('./components/import/ImportDialog'))

import { isMarkdownFile } from './utils/markdownParser'

// カスタムフックのインポート
import {
  useUIState,
  useFileManager,
  useSearch,
  useDiff,
  useTemplate,
  useBackup,
  useKeyboardShortcuts,
  useMarkdownPreview,
  usePreviewWindow,
  useImport,
} from './hooks'

/**
 * アプリケーションのルートコンポーネント
 *
 * 各機能はカスタムフックに分離され、このコンポーネントは
 * フックの結合とUIコンポーネントのレンダリングに専念する
 *
 * フック構成:
 * - useUIState: ダークモード、メッセージ、サイドバー幅、読み取り専用モード
 * - useFileManager: ファイルツリー、選択、編集、保存
 * - useSearch: 検索とハイライト
 * - useDiff: 差分表示
 * - useTemplate: テンプレート機能（カスタムテンプレート管理を含む）
 * - useBackup: バックアップ機能
 * - useKeyboardShortcuts: キーボードショートカット
 * - useMarkdownPreview: Markdownプレビュー
 * - useImport: インポート機能
 */
function App() {
  // ========================================
  // カスタムフックの初期化
  // ========================================

  // UI状態管理（ダークモード、メッセージ、サイドバー幅、読み取り専用）
  const {
    darkMode,
    message,
    sidebarWidth,
    readOnly,
    toggleDarkMode,
    showSuccess,
    showError,
    setSidebarWidth,
    toggleReadOnly,
  } = useUIState()

  // ファイル管理（ツリー、選択、編集、保存）
  const {
    fileTree,
    selectedFile,
    loading,
    saving,
    fileTreeError,
    validationErrors,
    hasUnsavedChanges,
    loadFileTree,
    selectFile,
    updateContent,
    updateValidationErrors,
    saveFile,
    createFromTemplate,
  } = useFileManager({
    readOnly,
    onSuccess: showSuccess,
    onError: showError,
  })

  // 検索機能
  const {
    searchQuery,
    searchResults,
    searchHighlight,
    setSearchQuery,
    setHighlight,
    clearHighlight,
    navigateHighlight,
    updateHighlightCount,
    resetSearch,
  } = useSearch()

  // 差分表示
  const {
    diffModalOpen,
    diffData,
    compareWithBackup,
    previewChanges,
    closeDiffModal,
  } = useDiff({
    onError: showError,
    onSuccess: showSuccess,
  })

  // テンプレート機能（カスタムテンプレート管理を含む）
  const {
    templateSelectorOpen,
    createDialogOpen,
    selectedTemplate,
    templateManagerOpen,
    openTemplateSelector,
    closeTemplateSelector,
    selectTemplate,
    backToTemplateSelector,
    closeCreateDialog,
    openTemplateManager,
    closeTemplateManager,
  } = useTemplate()

  // バックアップ機能
  const {
    backupListOpen,
    openBackupList,
    closeBackupList,
    handleRestoreComplete: onRestoreComplete,
  } = useBackup({
    onSuccess: showSuccess,
    onError: showError,
    onReloadFileTree: loadFileTree,
    onReselectFile: selectFile,
  })

  // Markdownプレビュー
  const {
    showPreview,
    scrollSync,
    togglePreview,
    toggleScrollSync,
  } = useMarkdownPreview()

  // プレビューウィンドウ
  const {
    isWindowOpen: isPreviewWindowOpen,
    isLoading: isPreviewWindowLoading,
    openPreviewWindow,
  } = usePreviewWindow({
    content: selectedFile?.content,
    fileName: selectedFile?.name,
    darkMode,
  })

  // インポート機能
  const {
    importDialogOpen,
    openImportDialog,
    closeImportDialog,
    handleImportComplete,
  } = useImport({
    onSuccess: showSuccess,
    onReloadFileTree: loadFileTree,
  })

  // キーボードショートカット（Cmd+S / Ctrl+S で保存）
  useKeyboardShortcuts({ onSave: saveFile })

  // ========================================
  // イベントハンドラ
  // ========================================

  /**
   * ファイル選択ハンドラ
   * 検索結果からの選択時はハイライトを設定
   */
  const handleFileSelect = useCallback(async (
    path: string,
    name: string,
    highlightQuery?: string
  ) => {
    const success = await selectFile(path, name)
    if (success) {
      if (highlightQuery) {
        setHighlight(highlightQuery)
      } else {
        clearHighlight()
      }
    }
    resetSearch()
  }, [selectFile, setHighlight, clearHighlight, resetSearch])

  /**
   * 検索結果クリック時のハンドラ
   */
  const handleSearchResultClick = useCallback((path: string, name: string) => {
    handleFileSelect(path, name, searchQuery)
  }, [handleFileSelect, searchQuery])

  /**
   * バックアップ復元完了時のハンドラ
   */
  const handleRestoreComplete = useCallback((success: boolean, restoreMessage: string) => {
    onRestoreComplete(
      success,
      restoreMessage,
      selectedFile?.path,
      selectedFile?.name
    )
  }, [onRestoreComplete, selectedFile?.path, selectedFile?.name])

  /**
   * テンプレートからファイル作成
   */
  const handleCreateFromTemplate = useCallback(async (
    fileName: string,
    content: string,
    directory: string
  ) => {
    const success = await createFromTemplate(fileName, content, directory)
    if (success) {
      closeCreateDialog()
    }
  }, [createFromTemplate, closeCreateDialog])

  /**
   * 変更プレビューハンドラ
   */
  const handlePreviewChanges = useCallback(() => {
    previewChanges(selectedFile)
  }, [previewChanges, selectedFile])

  // ========================================
  // 派生状態
  // ========================================

  // 現在のファイルがMarkdownかどうか
  const currentFileIsMarkdown = selectedFile ? isMarkdownFile(selectedFile.name) : false

  // モーダル用のローディングフォールバック
  const modalFallback = useMemo(() => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    </div>
  ), [])

  // ========================================
  // レンダリング
  // ========================================

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* ヘッダー: 検索、保存、設定など */}
      <Header
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchResults={searchResults}
        onSearchResultClick={handleSearchResultClick}
        readOnly={readOnly}
        onToggleReadOnly={toggleReadOnly}
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={saveFile}
        saving={saving}
        message={message}
        searchHighlight={searchHighlight}
        onSearchNavigate={navigateHighlight}
        onClearHighlight={clearHighlight}
        onOpenBackups={openBackupList}
        onCreateNew={openTemplateSelector}
        onOpenImport={openImportDialog}
        selectedFilePath={selectedFile?.path}
        selectedFileName={selectedFile?.name}
        isMarkdownFile={currentFileIsMarkdown}
        showPreview={showPreview}
        onTogglePreview={togglePreview}
        scrollSync={scrollSync}
        onToggleScrollSync={toggleScrollSync}
        onOpenPreviewWindow={openPreviewWindow}
        isPreviewWindowOpen={isPreviewWindowOpen}
        isPreviewWindowLoading={isPreviewWindowLoading}
      />

      {/* メインコンテンツ: サイドバー + エディタ */}
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
          onContentChange={updateContent}
          readOnly={readOnly}
          darkMode={darkMode}
          searchHighlight={searchHighlight}
          onSearchCountUpdate={updateHighlightCount}
          onSearchNavigate={navigateHighlight}
          validationErrors={validationErrors}
          onValidationChange={updateValidationErrors}
          showPreview={showPreview}
          scrollSync={scrollSync}
          onPreviewChanges={handlePreviewChanges}
          hasUnsavedChanges={hasUnsavedChanges}
          onCompareWithBackup={compareWithBackup}
        />
      </div>

      {/* 遅延読み込みモーダル - Suspenseでラップ */}
      <Suspense fallback={modalFallback}>
        {/* Diff Modal */}
        {diffModalOpen && (
          <DiffModal
            isOpen={diffModalOpen}
            onClose={closeDiffModal}
            diffData={diffData}
            darkMode={darkMode}
          />
        )}

        {/* Backup List Modal */}
        {backupListOpen && (
          <BackupList
            isOpen={backupListOpen}
            onClose={closeBackupList}
            onRestoreComplete={handleRestoreComplete}
            onCompare={compareWithBackup}
          />
        )}

        {/* Template Selector */}
        {templateSelectorOpen && (
          <TemplateSelector
            isOpen={templateSelectorOpen}
            onClose={closeTemplateSelector}
            onSelectTemplate={selectTemplate}
            onOpenManager={openTemplateManager}
          />
        )}

        {/* Create From Template Dialog */}
        {createDialogOpen && (
          <CreateFromTemplateDialog
            isOpen={createDialogOpen}
            template={selectedTemplate}
            onClose={closeCreateDialog}
            onBack={backToTemplateSelector}
            onCreate={handleCreateFromTemplate}
          />
        )}

        {/* Template Manager */}
        {templateManagerOpen && (
          <TemplateManager
            isOpen={templateManagerOpen}
            onClose={closeTemplateManager}
            onSuccess={showSuccess}
            onError={showError}
          />
        )}

        {/* Import Dialog */}
        {importDialogOpen && (
          <ImportDialog
            isOpen={importDialogOpen}
            onClose={closeImportDialog}
            onImportComplete={handleImportComplete}
          />
        )}
      </Suspense>
    </div>
  )
}

export default App
