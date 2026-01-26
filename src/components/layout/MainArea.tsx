import { FC, useMemo, memo, lazy, Suspense, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import type { SelectedFile, SearchHighlight, ValidationError, Tab } from '../../types'
import { countBySeverity, getSchemaTypeName, type SchemaFileType } from '../../utils/schemaValidators'
import { useMonacoEditor } from '../../hooks/useMonacoEditor'
import { useSearchHighlight } from '../../hooks/useSearchHighlight'
import { isMarkdownFile } from '../../utils/markdownParser'
import { Icon } from '../common'
import { TabBar } from '../tabs'
import type { EditorTab } from '../tabs/TabItem'
import { LinterPanel } from '../linter'
import type { LintMessageData } from '../linter/LintMessage'
import ProblemsPanel from './ProblemsPanel'
import StatusBar from './StatusBar'
import SearchReplacePanel from '../search/SearchReplacePanel'
import type { SearchMatch, SearchReplaceOptions } from '../../hooks/useSearchReplace'

// MarkdownPreviewを遅延読み込み - Markdownファイルを開くまで不要
const MarkdownPreview = lazy(() => import('../preview/MarkdownPreview'))

/** リンター結果の型 */
interface LinterResult {
  messages: LintMessageData[]
  enabled: boolean
}

interface MainAreaProps {
  selectedFile: SelectedFile | null
  onContentChange: (content: string) => void
  readOnly: boolean
  darkMode: boolean
  searchHighlight: SearchHighlight | null
  onSearchCountUpdate: (count: number) => void
  onSearchNavigate: (direction: 'next' | 'prev') => void
  validationErrors?: ValidationError[]
  onValidationChange?: (errors: ValidationError[]) => void
  showPreview?: boolean
  scrollSync?: boolean
  onPreviewChanges?: () => void
  hasUnsavedChanges?: boolean
  onCompareWithBackup?: (backupPath: string, originalPath: string, backupName: string) => void
  // タブ関連のプロパティ
  tabs?: Tab[]
  activeTabId?: string
  onSelectTab?: (tabId: string) => void
  onCloseTab?: (tabId: string) => void
  onReorderTabs?: (fromIndex: number, toIndex: number) => void
  // リンター関連のプロパティ
  linterEnabled?: boolean
  linterResult?: LinterResult
  onToggleLinter?: (enabled: boolean) => void
  // 検索＆置換関連のプロパティ
  isSearchReplacePanelOpen?: boolean
  onCloseSearchReplace?: () => void
  replaceSearchQuery?: string
  replaceText?: string
  replaceMatches?: SearchMatch[]
  replaceCurrentIndex?: number
  replaceOptions?: SearchReplaceOptions
  isReplacing?: boolean
  onReplaceSearchChange?: (query: string) => void
  onReplaceTextChange?: (text: string) => void
  onReplaceOptionsChange?: (options: Partial<SearchReplaceOptions>) => void
  onReplaceFindNext?: () => void
  onReplaceFindPrev?: () => void
  onReplaceCurrent?: () => void
  onReplaceAll?: () => void
}

/** ファイル名から言語を判定 */
const getLanguage = (filename: string): string => {
  if (filename.endsWith('.json')) return 'json'
  if (filename.endsWith('.md')) return 'markdown'
  if (filename.endsWith('.yaml') || filename.endsWith('.yml')) return 'yaml'
  return 'plaintext'
}

/** スキーマタイプのバッジコンポーネント */
const SchemaTypeBadge: FC<{ schemaType: SchemaFileType }> = memo(({ schemaType }) => {
  if (schemaType === 'unknown') return null
  const name = getSchemaTypeName(schemaType)
  return (
    <span className="px-2 py-0.5 text-xs rounded bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
      {name}スキーマ
    </span>
  )
})

SchemaTypeBadge.displayName = 'SchemaTypeBadge'

/** ファイル未選択時の表示 */
const EmptyState: FC = memo(() => (
  <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900">
    <div className="text-center text-gray-500 dark:text-gray-400">
      <Icon name="fileText" className="size-16 mx-auto mb-4 opacity-50" />
      <p className="text-lg">ファイルを選択してください</p>
      <p className="text-sm mt-1">左のサイドバーからファイルをクリックして編集</p>
    </div>
  </div>
))

EmptyState.displayName = 'EmptyState'

/** ファイルタブコンポーネント */
interface FileTabProps {
  selectedFile: SelectedFile
  schemaType: SchemaFileType | undefined
}

const FileTab: FC<FileTabProps> = memo(({ selectedFile, schemaType }) => {
  const hasUnsavedChanges = selectedFile.content !== selectedFile.originalContent
  return (
    <div className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{selectedFile.name}</span>
        {hasUnsavedChanges && (
          <span
            className="size-2 bg-yellow-500 rounded-full"
            title="未保存の変更"
            aria-label="未保存の変更があります"
            role="status"
          >
            <span className="sr-only">未保存の変更があります</span>
          </span>
        )}
        {schemaType && <SchemaTypeBadge schemaType={schemaType} />}
      </div>
      <div className="ml-auto text-xs text-gray-500 dark:text-gray-400">
        {selectedFile.path}
      </div>
    </div>
  )
})

FileTab.displayName = 'FileTab'

/** 読み取り専用バナーコンポーネント */
const ReadOnlyBanner: FC = memo(() => (
  <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
    <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
      <Icon name="lock" className="size-4" />
      読み取り専用モード - 編集するにはヘッダーの「読取専用」をクリックしてください
    </div>
  </div>
))

ReadOnlyBanner.displayName = 'ReadOnlyBanner'

/** ローディングスピナー */
const LoadingSpinner: FC = memo(() => (
  <div className="h-full flex items-center justify-center bg-white dark:bg-gray-900">
    <div className="size-6 animate-spin border-2 border-blue-500 border-t-transparent rounded-full" />
  </div>
))

LoadingSpinner.displayName = 'LoadingSpinner'

const MainArea: FC<MainAreaProps> = memo(({
  selectedFile,
  onContentChange,
  readOnly,
  darkMode,
  searchHighlight,
  onSearchCountUpdate,
  onSearchNavigate,
  validationErrors = [],
  onValidationChange,
  showPreview = false,
  scrollSync = false,
  onPreviewChanges,
  hasUnsavedChanges,
  // タブ関連
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onReorderTabs,
  // リンター関連
  linterEnabled = false,
  linterResult,
  onToggleLinter,
  // 検索＆置換関連
  isSearchReplacePanelOpen = false,
  onCloseSearchReplace,
  replaceSearchQuery = '',
  replaceText = '',
  replaceMatches = [],
  replaceCurrentIndex = 0,
  replaceOptions = { caseSensitive: false, wholeWord: false, useRegex: false },
  isReplacing = false,
  onReplaceSearchChange,
  onReplaceTextChange,
  onReplaceOptionsChange,
  onReplaceFindNext,
  onReplaceFindPrev,
  onReplaceCurrent,
  onReplaceAll,
}) => {
  // Markdownファイルかどうかを判定
  const isMarkdown = selectedFile ? isMarkdownFile(selectedFile.name) : false
  const shouldShowPreview = showPreview && isMarkdown

  // 全エラーを計算（構文検証のみ - スキーマ検証はフック内で処理）
  const syntaxErrors = useMemo(() => [...validationErrors], [validationErrors])

  // Monaco Editorカスタムフック
  const {
    editorRef,
    schemaValidation,
    editorScrollTop,
    editorScrollHeight,
    handleEditorMount,
    goToLine,
  } = useMonacoEditor({
    selectedFile,
    onSearchNavigate,
    onValidationChange,
    allErrors: syntaxErrors,
  })

  // 検索ハイライトカスタムフック
  useSearchHighlight({
    editorRef,
    searchHighlight,
    onSearchCountUpdate,
  })

  // Tab[] を EditorTab[] に変換
  const editorTabs = useMemo<EditorTab[]>(() => {
    if (!tabs) return []
    return tabs.map((tab) => ({
      id: tab.id,
      fileName: tab.name,
      filePath: tab.path,
      isDirty: tab.content !== tab.originalContent,
      isActive: tab.id === activeTabId,
    }))
  }, [tabs, activeTabId])

  // タブバーが使用可能かどうか
  const hasTabBar = tabs && tabs.length > 0 && onSelectTab && onCloseTab && onReorderTabs

  // タブの並び替えハンドラ（fromId, toId形式をfromIndex, toIndex形式に変換）
  const handleReorderTabs = useCallback((fromId: string, toId: string) => {
    if (!tabs || !onReorderTabs) return
    const fromIndex = tabs.findIndex(tab => tab.id === fromId)
    const toIndex = tabs.findIndex(tab => tab.id === toId)
    if (fromIndex !== -1 && toIndex !== -1) {
      onReorderTabs(fromIndex, toIndex)
    }
  }, [tabs, onReorderTabs])

  // リンター結果のメッセージ
  const linterMessages = useMemo(() => {
    return linterResult?.messages ?? []
  }, [linterResult])

  // リンターのトグルハンドラ
  const handleToggleLinter = useCallback((enabled: boolean) => {
    onToggleLinter?.(enabled)
  }, [onToggleLinter])

  // リンターパネルの行ジャンプハンドラ
  const handleLinterGoToLine = useCallback((line: number, column: number) => {
    goToLine(line, column)
  }, [goToLine])

  // 全エラーを統合（構文検証 + スキーマ検証）
  const allErrors = useMemo(() => {
    const errors = [...validationErrors]
    if (schemaValidation) {
      errors.push(...schemaValidation.errors)
    }
    return errors
  }, [validationErrors, schemaValidation])

  // 重大度ごとのカウント
  const errorCounts = useMemo(() => countBySeverity(allErrors), [allErrors])

  // ファイルが選択されていない場合
  if (!selectedFile) {
    return <EmptyState />
  }

  const language = getLanguage(selectedFile.name)

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
      {/* タブバー（タブが渡された場合）または既存のFileTab */}
      {hasTabBar ? (
        <TabBar
          tabs={editorTabs}
          onSelectTab={onSelectTab}
          onCloseTab={onCloseTab}
          onReorderTabs={handleReorderTabs}
        />
      ) : (
        <FileTab
          selectedFile={selectedFile}
          schemaType={schemaValidation?.schemaType}
        />
      )}

      {/* 検索＆置換パネル */}
      {onCloseSearchReplace && onReplaceSearchChange && onReplaceTextChange &&
       onReplaceOptionsChange && onReplaceFindNext && onReplaceFindPrev &&
       onReplaceCurrent && onReplaceAll && (
        <SearchReplacePanel
          isOpen={isSearchReplacePanelOpen}
          onClose={onCloseSearchReplace}
          searchQuery={replaceSearchQuery}
          replaceText={replaceText}
          matches={replaceMatches.map(m => ({
            start: m.start,
            end: m.end,
            text: m.text,
            line: m.line + 1, // 1-indexed for display
            column: m.column,
          }))}
          currentMatchIndex={replaceCurrentIndex}
          options={replaceOptions}
          isReplacing={isReplacing}
          onSearchChange={onReplaceSearchChange}
          onReplaceTextChange={onReplaceTextChange}
          onOptionsChange={onReplaceOptionsChange}
          onFindNext={onReplaceFindNext}
          onFindPrev={onReplaceFindPrev}
          onReplaceCurrent={onReplaceCurrent}
          onReplaceAll={onReplaceAll}
        />
      )}

      {/* 読み取り専用バナー */}
      {readOnly && <ReadOnlyBanner />}

      {/* エディタとプレビューのコンテナ */}
      <div className="flex-1 flex overflow-hidden">
        {/* Monaco Editor */}
        <div className={`${shouldShowPreview ? 'w-1/2 border-r border-gray-200 dark:border-gray-700' : 'flex-1'}`}>
          <Editor
            height="100%"
            language={language}
            value={selectedFile.content}
            onChange={(value) => onContentChange(value || '')}
            theme={darkMode ? 'vs-dark' : 'light'}
            onMount={handleEditorMount}
            options={{
              readOnly,
              minimap: { enabled: !shouldShowPreview },
              fontSize: 14,
              lineNumbers: 'on',
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              renderWhitespace: 'selection',
            }}
          />
        </div>

        {/* Markdown プレビュー - 遅延読み込み */}
        {shouldShowPreview && (
          <div className="w-1/2 overflow-hidden">
            <Suspense fallback={<LoadingSpinner />}>
              <MarkdownPreview
                content={selectedFile.content}
                darkMode={darkMode}
                scrollSync={scrollSync}
                editorScrollTop={editorScrollTop}
                editorScrollHeight={editorScrollHeight}
              />
            </Suspense>
          </div>
        )}
      </div>

      {/* 問題パネル（構文エラー + スキーマ検証）*/}
      <ProblemsPanel
        errors={allErrors}
        errorCounts={errorCounts}
        onGoToLine={goToLine}
      />

      {/* リンターパネル（リンター結果がある場合のみ表示） */}
      {onToggleLinter && (
        <LinterPanel
          messages={linterMessages}
          enabled={linterEnabled}
          onToggleEnabled={handleToggleLinter}
          onGoToLine={handleLinterGoToLine}
          title="ベストプラクティスチェック"
          defaultExpanded={false}
          maxHeight="max-h-48"
        />
      )}

      {/* ステータスバー */}
      <StatusBar
        language={language}
        hasChanges={selectedFile.content !== selectedFile.originalContent}
        showPreview={shouldShowPreview}
        errorCounts={errorCounts}
        schemaValidation={schemaValidation}
        hasUnsavedChanges={hasUnsavedChanges}
        onPreviewChanges={onPreviewChanges}
      />
    </div>
  )
})

MainArea.displayName = 'MainArea'

export default MainArea
