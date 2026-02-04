import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  useAppAIReview,
  useAppKeyboardShortcuts,
  useAppSearchReplace,
  useBackup,
  useDiff,
  useFavorites,
  useFileManager,
  useImport,
  useLinter,
  useMarkdownPreview,
  usePreviewWindow,
  useSearch,
  useStats,
  useTabEditor,
  useTemplate,
  useUIState,
} from './hooks'
import { useClaudeVersion } from './hooks/useClaudeVersion'
import { useGitHubRepos } from './hooks/useGitHubRepos'
import { useTreeFilter } from './hooks/useTreeFilter'
import { isMarkdownFile } from './utils/markdownParser'
import { STORAGE_KEY_STATS_COLLAPSED } from './constants'

import GitHubReposPanel from './components/github/GitHubReposPanel'
import Header from './components/layout/Header'
import MainArea from './components/layout/MainArea'
import Sidebar from './components/layout/Sidebar'
import { StatsPanel } from './components/stats'

// 遅延読み込み - モーダルコンポーネントは初期表示に不要
const AIReviewPanel = lazy(() => import('./components/aiReview/AIReviewPanel'))
const BackupList = lazy(() => import('./components/backup/BackupList'))
const CreateFromTemplateDialog = lazy(() => import('./components/template/CreateFromTemplateDialog'))
const DiffModal = lazy(() => import('./components/diff/DiffModal'))
const ImportDialog = lazy(() => import('./components/import/ImportDialog'))
const TemplateManager = lazy(() => import('./components/template/TemplateManager'))
const TemplateSelector = lazy(() => import('./components/template/TemplateSelector'))

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
 * - useTemplate: テンプレート機能
 * - useBackup: バックアップ機能
 * - useMarkdownPreview: Markdownプレビュー
 * - useImport: インポート機能
 * - useFavorites: お気に入り機能
 * - useTabEditor: タブエディタ機能
 * - useLinter: ベストプラクティスリンター機能
 * - useAppSearchReplace: 検索＆置換統合フック
 * - useAppAIReview: AIレビュー統合フック
 * - useAppKeyboardShortcuts: 統合キーボードショートカット
 */
function App() {
  // ========================================
  // カスタムフックの初期化
  // ========================================

  // 統計パネルの折りたたみ状態（localStorageから初期値を読み込み）
  const [isStatsCollapsed, setIsStatsCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STATS_COLLAPSED)
      return saved ? JSON.parse(saved) : false
    } catch {
      return false
    }
  })

  // 折りたたみ状態が変更されたらlocalStorageに保存
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STATS_COLLAPSED, JSON.stringify(isStatsCollapsed))
    } catch {
      // localStorage書き込みエラーは無視
    }
  }, [isStatsCollapsed])

  // 依存関係グラフの表示状態
  const [showDependencyGraph, setShowDependencyGraph] = useState(false)

  // UI状態管理
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

  // Claude Codeバージョン
  const {
    version: claudeVersion,
    loading: claudeVersionLoading,
    error: claudeVersionError,
  } = useClaudeVersion()

  // GitHubリポジトリ
  const {
    repos: githubRepos,
    loading: githubLoading,
    error: githubError,
    refetch: refetchGithubRepos,
  } = useGitHubRepos()

  // ファイル管理
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

  // テンプレート機能
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

  // 統計データ
  const { stats } = useStats()

  // お気に入り機能
  const {
    favorites,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    reorderFavorites,
  } = useFavorites({
    onSuccess: showSuccess,
    onError: showError,
  })

  // タブエディタ機能
  const {
    tabs,
    activeTabId,
    closeTab,
    setActiveTab,
    reorderTabs,
    openTab,
    updateTabContent,
    markTabAsSaved,
  } = useTabEditor({
    onUnsavedWarning: (unsavedTabs) => {
      const fileNames = unsavedTabs.map(t => t.name).join(', ')
      return window.confirm(`未保存の変更があります: ${fileNames}\n変更を破棄してもよろしいですか？`)
    },
  })

  // リンター機能
  const {
    config: linterConfig,
    lastResult: linterResult,
    updateConfig: updateLinterConfig,
  } = useLinter()

  // ツリーフィルター機能
  const {
    activeFilters,
    showHiddenFiles,
    searchFilter,
    isMenuOpen: isFilterMenuOpen,
    toggleFilter,
    clearFilters,
    setSearchFilter,
    toggleHiddenFiles,
    toggleMenu: toggleFilterMenu,
    closeMenu: closeFilterMenu,
    filterNodes,
    activeFilterCount,
  } = useTreeFilter()

  // ========================================
  // 派生状態（フィルタリング）
  // ========================================

  // fileTreeをフィルタリングしてSidebarに渡す
  const filteredFileTree = useMemo(
    () => filterNodes(fileTree),
    [fileTree, filterNodes]
  )

  // ========================================
  // イベントハンドラ
  // ========================================

  /**
   * ファイル選択ハンドラ
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

  // selectedFileが変更されたらタブを開く
  const prevSelectedFileRef = useRef<{ path: string; name: string } | null>(null)
  useEffect(() => {
    if (selectedFile) {
      const prev = prevSelectedFileRef.current
      if (!prev || prev.path !== selectedFile.path || prev.name !== selectedFile.name) {
        openTab(selectedFile.path, selectedFile.name, selectedFile.content)
        prevSelectedFileRef.current = { path: selectedFile.path, name: selectedFile.name }
      }
    } else {
      prevSelectedFileRef.current = null
    }
  }, [selectedFile, openTab])

  // ファイル保存後にタブを保存済み状態にマーク
  useEffect(() => {
    if (selectedFile && selectedFile.content === selectedFile.originalContent) {
      markTabAsSaved(selectedFile.path)
    }
  }, [selectedFile, markTabAsSaved])

  /**
   * コンテンツ変更ハンドラ
   */
  const handleContentChange = useCallback((newContent: string) => {
    updateContent(newContent)
    if (selectedFile) {
      updateTabContent(selectedFile.path, newContent)
    }
  }, [updateContent, updateTabContent, selectedFile])

  // ========================================
  // 検索＆置換統合フック
  // ========================================
  const {
    isSearchReplacePanelOpen,
    openSearchReplacePanel,
    closeSearchReplacePanel,
    searchQuery: replaceSearchQuery,
    replaceText,
    matches: replaceMatches,
    currentMatchIndex: replaceCurrentIndex,
    options: replaceOptions,
    isReplacing,
    setSearchQuery: setReplaceSearchQuery,
    setReplaceText,
    setOptions: setReplaceOptions,
    findNext: replaceFindNext,
    findPrev: replaceFindPrev,
    handleReplaceCurrent,
    handleReplaceAll,
  } = useAppSearchReplace({
    content: selectedFile?.content ?? '',
    onContentChange: handleContentChange,
    onSave: saveFile,
    onSuccess: showSuccess,
    onError: showError,
    setHighlight,
    clearHighlight,
    updateHighlightCount,
  })

  // ========================================
  // AIレビュー統合フック
  // ========================================
  const {
    isAIReviewPanelOpen,
    closeAIReviewPanel,
    status: aiReviewStatus,
    result: aiReviewResult,
    error: aiReviewError,
    retryReview: handleRetryAIReview,
  } = useAppAIReview({
    selectedFile,
  })

  // ========================================
  // 統合キーボードショートカット
  // ========================================
  useAppKeyboardShortcuts({
    onSave: saveFile,
    isSearchReplacePanelOpen,
    onOpenSearchReplace: openSearchReplacePanel,
    replaceMatchCount: replaceMatches.length,
    onReplaceAll: handleReplaceAll,
    replaceOptions,
    onSetReplaceOptions: setReplaceOptions,
  })

  // ========================================
  // その他のイベントハンドラ
  // ========================================

  const handleSelectTab = useCallback(async (tabId: string) => {
    setActiveTab(tabId)
    if (selectedFile?.path !== tabId) {
      const tab = tabs.find(t => t.id === tabId)
      if (tab) {
        await selectFile(tab.path, tab.name)
      }
    }
  }, [setActiveTab, selectedFile?.path, tabs, selectFile])

  const handleSearchResultClick = useCallback((path: string, name: string) => {
    handleFileSelect(path, name, searchQuery)
  }, [handleFileSelect, searchQuery])

  const handleRestoreComplete = useCallback((success: boolean, restoreMessage: string) => {
    onRestoreComplete(success, restoreMessage, selectedFile?.path, selectedFile?.name)
  }, [onRestoreComplete, selectedFile?.path, selectedFile?.name])

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

  const handlePreviewChanges = useCallback(() => {
    previewChanges(selectedFile)
  }, [previewChanges, selectedFile])

  /**
   * 依存関係グラフからファイルを開く
   */
  const handleOpenFileFromGraph = useCallback(async (path: string, name: string) => {
    // グラフを閉じてファイルを選択
    setShowDependencyGraph(false)
    await handleFileSelect(path, name)
  }, [handleFileSelect])

  /**
   * 依存関係グラフの表示切り替え
   */
  const toggleDependencyGraph = useCallback(() => {
    setShowDependencyGraph(prev => !prev)
  }, [])

  // ========================================
  // 派生状態
  // ========================================

  const currentFileIsMarkdown = selectedFile ? isMarkdownFile(selectedFile.name) : false

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
        onOpenSearchReplace={openSearchReplacePanel}
        showDependencyGraph={showDependencyGraph}
        onToggleDependencyGraph={toggleDependencyGraph}
        claudeVersion={claudeVersion}
        claudeVersionLoading={claudeVersionLoading}
        claudeVersionError={claudeVersionError}
      />

      {/* GitHub人気リポジトリパネル */}
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <GitHubReposPanel
          repos={githubRepos}
          loading={githubLoading}
          error={githubError}
          darkMode={darkMode}
          onRefetch={refetchGithubRepos}
        />
      </div>

      {stats && (
        <StatsPanel
          stats={stats}
          isCollapsed={isStatsCollapsed}
          onToggleCollapse={() => setIsStatsCollapsed(!isStatsCollapsed)}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          width={sidebarWidth}
          onWidthChange={setSidebarWidth}
          fileTree={filteredFileTree}
          onFileSelect={handleFileSelect}
          selectedPath={selectedFile?.path}
          loading={loading}
          error={fileTreeError}
          onRetry={loadFileTree}
          favorites={favorites}
          onFavoriteSelect={handleFileSelect}
          onFavoriteRemove={(path) => { void removeFavorite(path) }}
          onFavoritesReorder={(startIndex, endIndex) => { void reorderFavorites(startIndex, endIndex) }}
          isFavorite={isFavorite}
          onToggleFavorite={(path, name) => { void toggleFavorite(path, name) }}
          activeFilters={activeFilters}
          showHiddenFiles={showHiddenFiles}
          searchFilter={searchFilter}
          isFilterMenuOpen={isFilterMenuOpen}
          activeFilterCount={activeFilterCount}
          onToggleFilter={toggleFilter}
          onClearFilters={clearFilters}
          onSearchFilterChange={setSearchFilter}
          onToggleHiddenFiles={toggleHiddenFiles}
          onToggleFilterMenu={toggleFilterMenu}
          onCloseFilterMenu={closeFilterMenu}
        />
        <MainArea
          selectedFile={selectedFile}
          onContentChange={handleContentChange}
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
          tabs={tabs}
          activeTabId={activeTabId ?? undefined}
          onSelectTab={handleSelectTab}
          onCloseTab={closeTab}
          onReorderTabs={reorderTabs}
          linterEnabled={linterConfig.enabledCategories.length > 0}
          linterResult={linterResult ? {
            messages: linterResult.issues.map((issue, index) => ({
              id: `lint-${index}`,
              severity: issue.severity,
              message: issue.message,
              line: issue.line,
              column: issue.column,
              source: issue.ruleId,
              fix: issue.suggestion ? {
                description: issue.suggestion,
                replacement: '',
              } : undefined,
            })),
            enabled: linterConfig.enabledCategories.length > 0,
          } : undefined}
          onToggleLinter={(enabled) => {
            if (enabled) {
              updateLinterConfig({ enabledCategories: ['skill', 'agent', 'common'] })
            } else {
              updateLinterConfig({ enabledCategories: [] })
            }
          }}
          isSearchReplacePanelOpen={isSearchReplacePanelOpen}
          onCloseSearchReplace={closeSearchReplacePanel}
          replaceSearchQuery={replaceSearchQuery}
          replaceText={replaceText}
          replaceMatches={replaceMatches}
          replaceCurrentIndex={replaceCurrentIndex}
          replaceOptions={replaceOptions}
          isReplacing={isReplacing}
          onReplaceSearchChange={setReplaceSearchQuery}
          onReplaceTextChange={setReplaceText}
          onReplaceOptionsChange={setReplaceOptions}
          onReplaceFindNext={replaceFindNext}
          onReplaceFindPrev={replaceFindPrev}
          onReplaceCurrent={handleReplaceCurrent}
          onReplaceAll={handleReplaceAll}
          showDependencyGraph={showDependencyGraph}
          onOpenFileFromGraph={handleOpenFileFromGraph}
        />
      </div>

      <Suspense fallback={modalFallback}>
        {diffModalOpen && (
          <DiffModal
            isOpen={diffModalOpen}
            onClose={closeDiffModal}
            diffData={diffData}
            darkMode={darkMode}
          />
        )}

        {backupListOpen && (
          <BackupList
            isOpen={backupListOpen}
            onClose={closeBackupList}
            onRestoreComplete={handleRestoreComplete}
            onCompare={compareWithBackup}
          />
        )}

        {templateSelectorOpen && (
          <TemplateSelector
            isOpen={templateSelectorOpen}
            onClose={closeTemplateSelector}
            onSelectTemplate={selectTemplate}
            onOpenManager={openTemplateManager}
          />
        )}

        {createDialogOpen && (
          <CreateFromTemplateDialog
            isOpen={createDialogOpen}
            template={selectedTemplate}
            onClose={closeCreateDialog}
            onBack={backToTemplateSelector}
            onCreate={handleCreateFromTemplate}
          />
        )}

        {templateManagerOpen && (
          <TemplateManager
            isOpen={templateManagerOpen}
            onClose={closeTemplateManager}
            onSuccess={showSuccess}
            onError={showError}
          />
        )}

        {importDialogOpen && (
          <ImportDialog
            isOpen={importDialogOpen}
            onClose={closeImportDialog}
            onImportComplete={handleImportComplete}
          />
        )}

        {isAIReviewPanelOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-2xl h-[80vh] bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden">
              <AIReviewPanel
                status={aiReviewStatus}
                result={aiReviewResult}
                error={aiReviewError}
                darkMode={darkMode}
                onClose={closeAIReviewPanel}
                onRetry={handleRetryAIReview}
              />
            </div>
          </div>
        )}
      </Suspense>
    </div>
  )
}

export default App
