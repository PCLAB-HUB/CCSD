import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import MainArea from './components/layout/MainArea'
import { StatsPanel } from './components/stats'

// 遅延読み込み - モーダルコンポーネントは初期表示に不要
const DiffModal = lazy(() => import('./components/diff/DiffModal'))
const BackupList = lazy(() => import('./components/backup/BackupList'))
const TemplateSelector = lazy(() => import('./components/template/TemplateSelector'))
const CreateFromTemplateDialog = lazy(() => import('./components/template/CreateFromTemplateDialog'))
const TemplateManager = lazy(() => import('./components/template/TemplateManager'))
const ImportDialog = lazy(() => import('./components/import/ImportDialog'))
const AIReviewPanel = lazy(() => import('./components/aiReview/AIReviewPanel'))

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
  useStats,
  useFavorites,
  useTabEditor,
  useLinter,
  useAIReview,
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
 * - useFavorites: お気に入り機能
 * - useTabEditor: タブエディタ機能
 * - useLinter: ベストプラクティスリンター機能
 * - useAIReview: AIレビュー機能
 */
/** localStorage key for stats panel collapsed state */
const STATS_COLLAPSED_KEY = 'claude-settings-stats-collapsed'

function App() {
  // ========================================
  // カスタムフックの初期化
  // ========================================

  // 統計パネルの折りたたみ状態（localStorageから初期値を読み込み）
  const [isStatsCollapsed, setIsStatsCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STATS_COLLAPSED_KEY)
      return saved ? JSON.parse(saved) : false
    } catch {
      return false
    }
  })

  // AIレビューパネルの表示状態
  const [isAIReviewPanelOpen, setIsAIReviewPanelOpen] = useState(false)

  // 折りたたみ状態が変更されたらlocalStorageに保存
  useEffect(() => {
    try {
      localStorage.setItem(STATS_COLLAPSED_KEY, JSON.stringify(isStatsCollapsed))
    } catch {
      // localStorage書き込みエラーは無視
    }
  }, [isStatsCollapsed])

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
    // 将来の拡張用に保持（現在は未使用）
    // activeTab,
    // hasUnsavedTabs,
    // openTab,
    // updateTabContent,
    // markTabAsSaved,
    // closeAllTabs,
    // closeSavedTabs,
    // closeOtherTabs,
    // isTabUnsaved,
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
    // 将来の拡張用に保持（現在は未使用）
    // rules: linterRules,
    // hasIssues: linterHasIssues,
    // hasErrors: linterHasErrors,
    // runLint,
    // toggleCategory: toggleLinterCategory,
    // clearResult: clearLinterResult,
  } = useLinter()

  // AIレビュー機能
  const {
    status: aiReviewStatus,
    result: aiReviewResult,
    error: aiReviewError,
    runReview: runAIReview,
    // 将来の拡張用に保持（現在は未使用）
    // apiKeyModal,
    // hasAPIKey,
    // resetReview: resetAIReview,
    // openAPIKeyModal,
    // closeAPIKeyModal,
    // setAPIKey,
    // clearAPIKey: clearAIAPIKey,
    // updateAPIKeyInput,
  } = useAIReview()

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

  /**
   * AIレビュー実行ハンドラ
   * 将来の拡張用（ヘッダーまたはツールバーにボタンを追加予定）
   */
  const _handleRunAIReview = useCallback(() => {
    if (selectedFile) {
      setIsAIReviewPanelOpen(true)
      runAIReview(selectedFile.name, selectedFile.path, selectedFile.content)
    }
  }, [selectedFile, runAIReview])

  // _handleRunAIReviewは将来の拡張で使用予定
  void _handleRunAIReview

  /**
   * AIレビューパネルを閉じる
   */
  const handleCloseAIReviewPanel = useCallback(() => {
    setIsAIReviewPanelOpen(false)
  }, [])

  /**
   * AIレビュー再試行ハンドラ
   */
  const handleRetryAIReview = useCallback(() => {
    if (selectedFile) {
      runAIReview(selectedFile.name, selectedFile.path, selectedFile.content)
    }
  }, [selectedFile, runAIReview])

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

  // AIレビュー結果をAIReviewPanelの形式に変換
  const aiReviewPanelResult = useMemo(() => {
    if (!aiReviewResult) return null
    return {
      summary: aiReviewResult.summary,
      suggestions: aiReviewResult.suggestions.map(s => ({
        id: s.id,
        severity: s.severity === 'critical' ? 'error' as const :
                  s.severity === 'warning' ? 'warning' as const : 'info' as const,
        title: s.title,
        description: s.description,
        line: s.lineNumber,
        before: s.before,
        after: s.after,
      })),
      overallScore: aiReviewResult.score.overall,
      reviewedAt: new Date(aiReviewResult.timestamp),
    }
  }, [aiReviewResult])

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

      {/* 統計パネル: ヘッダー直下に配置 */}
      {stats && (
        <StatsPanel
          stats={stats}
          isCollapsed={isStatsCollapsed}
          onToggleCollapse={() => setIsStatsCollapsed(!isStatsCollapsed)}
        />
      )}

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
          favorites={favorites}
          onFavoriteSelect={handleFileSelect}
          onFavoriteRemove={(path) => { void removeFavorite(path) }}
          onFavoritesReorder={(startIndex, endIndex) => { void reorderFavorites(startIndex, endIndex) }}
          isFavorite={isFavorite}
          onToggleFavorite={(path, name) => { void toggleFavorite(path, name) }}
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
          tabs={tabs}
          activeTabId={activeTabId ?? undefined}
          onSelectTab={setActiveTab}
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

        {/* AI Review Panel Modal */}
        {isAIReviewPanelOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-2xl h-[80vh] bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden">
              <AIReviewPanel
                status={aiReviewStatus === 'loading' ? 'loading' :
                        aiReviewStatus === 'success' ? 'success' :
                        aiReviewStatus === 'error' ? 'error' : 'idle'}
                result={aiReviewPanelResult}
                error={aiReviewError?.message || null}
                darkMode={darkMode}
                onClose={handleCloseAIReviewPanel}
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
