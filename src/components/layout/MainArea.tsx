import { FC, useMemo, memo, lazy, Suspense } from 'react'
import Editor from '@monaco-editor/react'
import type { SelectedFile, SearchHighlight, ValidationError } from '../../types'
import { countBySeverity, getSchemaTypeName, type SchemaFileType } from '../../utils/schemaValidators'
import { useMonacoEditor } from '../../hooks/useMonacoEditor'
import { useSearchHighlight } from '../../hooks/useSearchHighlight'
import { isMarkdownFile } from '../../utils/markdownParser'
import ProblemsPanel from './ProblemsPanel'
import StatusBar from './StatusBar'

// MarkdownPreviewを遅延読み込み - Markdownファイルを開くまで不要
const MarkdownPreview = lazy(() => import('../preview/MarkdownPreview'))

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
      <svg
        className="size-16 mx-auto mb-4 opacity-50"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
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
      <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
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
      {/* ファイルタブ */}
      <FileTab
        selectedFile={selectedFile}
        schemaType={schemaValidation?.schemaType}
      />

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

      {/* 問題パネル */}
      <ProblemsPanel
        errors={allErrors}
        errorCounts={errorCounts}
        onGoToLine={goToLine}
      />

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
