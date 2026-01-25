import { FC, useRef, useEffect, useCallback, useState, useMemo } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'
import type { SelectedFile, SearchHighlight } from '../../App'
import * as monaco from 'monaco-editor'
import {
  validateContent,
  toMonacoSeverity,
  type ValidationError,
} from '../../utils/validators'
import {
  validateSchema,
  countBySeverity,
  getSchemaTypeName,
  type SchemaValidationResult,
  type SchemaFileType,
} from '../../utils/schemaValidators'
import { getSeverityColor, getSeverityIcon } from '../../utils/errorMessages'
import MarkdownPreview from '../preview/MarkdownPreview'
import { isMarkdownFile } from '../../utils/markdownParser'

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

/** 重大度に応じたスタイル設定 */
const severityStyles = {
  error: {
    badge: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
    row: 'hover:bg-red-50 dark:hover:bg-red-900/30',
    icon: 'text-red-500 dark:text-red-400',
  },
  warning: {
    badge: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
    row: 'hover:bg-yellow-50 dark:hover:bg-yellow-900/30',
    icon: 'text-yellow-500 dark:text-yellow-400',
  },
  info: {
    badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    row: 'hover:bg-blue-50 dark:hover:bg-blue-900/30',
    icon: 'text-blue-500 dark:text-blue-400',
  },
}

const MainArea: FC<MainAreaProps> = ({
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
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<typeof monaco | null>(null)
  const decorationsRef = useRef<string[]>([])
  const matchesRef = useRef<monaco.editor.FindMatch[]>([])
  const [editorScrollTop, setEditorScrollTop] = useState(0)
  const [editorScrollHeight, setEditorScrollHeight] = useState(1)
  const [showProblemsPanel, setShowProblemsPanel] = useState(true)
  const [schemaValidation, setSchemaValidation] = useState<SchemaValidationResult | null>(null)

  // Markdownファイルかどうかを判定
  const isMarkdown = selectedFile ? isMarkdownFile(selectedFile.name) : false
  const shouldShowPreview = showPreview && isMarkdown

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

  // Monaco Editorのマーカーを更新
  const updateMarkers = useCallback((
    editor: monaco.editor.IStandaloneCodeEditor,
    monacoInstance: typeof monaco,
    errors: ValidationError[]
  ) => {
    const model = editor.getModel()
    if (!model) return

    const markers: monaco.editor.IMarkerData[] = errors.map((error) => ({
      severity: toMonacoSeverity(error.severity),
      message: error.message,
      startLineNumber: error.line,
      startColumn: error.column,
      endLineNumber: error.line,
      endColumn: error.column + 1,
      source: error.source,
    }))

    monacoInstance.editor.setModelMarkers(model, 'syntax-validator', markers)
  }, [])

  // スキーマ検証を実行
  const runSchemaValidation = useCallback(() => {
    if (!selectedFile) {
      setSchemaValidation(null)
      return
    }

    const result = validateSchema(selectedFile.content, selectedFile.path)
    setSchemaValidation(result)
  }, [selectedFile])

  // ファイル変更時にスキーマ検証実行
  useEffect(() => {
    runSchemaValidation()
  }, [runSchemaValidation])

  // 全エラーでマーカー更新
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return
    updateMarkers(editorRef.current, monacoRef.current, allErrors)
  }, [allErrors, updateMarkers])

  // エディタマウント時の処理
  const handleEditorMount: OnMount = useCallback((editor, monacoInstance) => {
    editorRef.current = editor
    monacoRef.current = monacoInstance

    // Cmd+F / Ctrl+F でエディタ内検索を有効化
    editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyF, () => {
      editor.getAction('actions.find')?.run()
    })

    // F3 / Shift+F3 で次/前の検索結果
    editor.addCommand(monacoInstance.KeyCode.F3, () => {
      onSearchNavigate('next')
    })
    editor.addCommand(monacoInstance.KeyMod.Shift | monacoInstance.KeyCode.F3, () => {
      onSearchNavigate('prev')
    })

    // スクロール同期のためのリスナー
    editor.onDidScrollChange((e) => {
      setEditorScrollTop(e.scrollTop)
      setEditorScrollHeight(e.scrollHeight)
    })

    // 初回バリデーション実行
    if (selectedFile && onValidationChange) {
      const result = validateContent(selectedFile.content, selectedFile.name)
      onValidationChange(result.errors)
    }
  }, [onSearchNavigate, selectedFile, onValidationChange])

  // コンテンツ変更時にバリデーション実行
  useEffect(() => {
    if (!selectedFile || !onValidationChange) return

    const result = validateContent(selectedFile.content, selectedFile.name)
    onValidationChange(result.errors)
  }, [selectedFile?.content, selectedFile?.name, onValidationChange])

  // 検索ハイライトの更新
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    const model = editor.getModel()
    if (!model) return

    // 既存のデコレーションをクリア
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [])
    matchesRef.current = []

    if (!searchHighlight?.query) {
      onSearchCountUpdate(0)
      return
    }

    // 検索マッチを取得
    const matches = model.findMatches(
      searchHighlight.query,
      true, // searchOnlyEditableRange
      false, // isRegex
      false, // matchCase
      null, // wordSeparators
      true // captureMatches
    )

    matchesRef.current = matches
    onSearchCountUpdate(matches.length)

    if (matches.length === 0) return

    // デコレーションを作成（ハイライト表示）
    const decorations: monaco.editor.IModelDeltaDecoration[] = matches.map((match, index) => ({
      range: match.range,
      options: {
        className: index === searchHighlight.currentIndex
          ? 'search-highlight-current'
          : 'search-highlight',
        overviewRuler: {
          color: index === searchHighlight.currentIndex ? '#ff9900' : '#ffff00',
          position: monaco.editor.OverviewRulerLane.Center,
        },
      },
    }))

    decorationsRef.current = editor.deltaDecorations([], decorations)

    // 現在のマッチにスクロール
    if (matches[searchHighlight.currentIndex]) {
      const currentMatch = matches[searchHighlight.currentIndex]
      editor.setSelection(currentMatch.range)
      editor.revealRangeInCenter(currentMatch.range)
    }
  }, [searchHighlight?.query, searchHighlight?.currentIndex, searchHighlight?.totalCount, onSearchCountUpdate])

  // 行へジャンプ
  const goToLine = useCallback((line: number, column: number = 1) => {
    if (editorRef.current) {
      editorRef.current.revealLineInCenter(line)
      editorRef.current.setPosition({ lineNumber: line, column })
      editorRef.current.focus()
    }
  }, [])

  if (!selectedFile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <svg
            className="w-16 h-16 mx-auto mb-4 opacity-50"
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
    )
  }

  const getLanguage = (filename: string): string => {
    if (filename.endsWith('.json')) return 'json'
    if (filename.endsWith('.md')) return 'markdown'
    if (filename.endsWith('.yaml') || filename.endsWith('.yml')) return 'yaml'
    return 'plaintext'
  }

  // スキーマタイプのバッジ表示
  const schemaTypeBadge = (schemaType: SchemaFileType) => {
    if (schemaType === 'unknown') return null
    const name = getSchemaTypeName(schemaType)
    return (
      <span className="px-2 py-0.5 text-xs rounded bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
        {name}スキーマ
      </span>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
      {/* ファイルタブ */}
      <div className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{selectedFile.name}</span>
          {selectedFile.content !== selectedFile.originalContent && (
            <span className="w-2 h-2 bg-yellow-500 rounded-full" title="未保存の変更" />
          )}
          {schemaValidation && schemaTypeBadge(schemaValidation.schemaType)}
        </div>
        <div className="ml-auto text-xs text-gray-500 dark:text-gray-400">
          {selectedFile.path}
        </div>
      </div>

      {/* 読み取り専用バナー */}
      {readOnly && (
        <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      )}

      {/* エディタとプレビューのコンテナ */}
      <div className="flex-1 flex overflow-hidden">
        {/* Monaco Editor */}
        <div className={`${shouldShowPreview ? 'w-1/2 border-r border-gray-200 dark:border-gray-700' : 'flex-1'}`}>
          <Editor
            height="100%"
            language={getLanguage(selectedFile.name)}
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

        {/* Markdown プレビュー */}
        {shouldShowPreview && (
          <div className="w-1/2 overflow-hidden">
            <MarkdownPreview
              content={selectedFile.content}
              darkMode={darkMode}
              scrollSync={scrollSync}
              editorScrollTop={editorScrollTop}
              editorScrollHeight={editorScrollHeight}
            />
          </div>
        )}
      </div>

      {/* 問題パネル */}
      {allErrors.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          {/* パネルヘッダー */}
          <div
            className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 cursor-pointer select-none"
            onClick={() => setShowProblemsPanel(!showProblemsPanel)}
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">問題</span>
              <div className="flex items-center gap-2">
                {errorCounts.error > 0 && (
                  <span className={`px-2 py-0.5 text-xs rounded-full ${severityStyles.error.badge}`}>
                    {errorCounts.error}
                  </span>
                )}
                {errorCounts.warning > 0 && (
                  <span className={`px-2 py-0.5 text-xs rounded-full ${severityStyles.warning.badge}`}>
                    {errorCounts.warning}
                  </span>
                )}
                {errorCounts.info > 0 && (
                  <span className={`px-2 py-0.5 text-xs rounded-full ${severityStyles.info.badge}`}>
                    {errorCounts.info}
                  </span>
                )}
              </div>
            </div>
            <svg
              className={`w-4 h-4 transition-transform ${showProblemsPanel ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* 問題リスト */}
          {showProblemsPanel && (
            <div className="max-h-48 overflow-y-auto bg-white dark:bg-gray-900">
              {allErrors.map((error, index) => {
                const styles = severityStyles[error.severity]
                return (
                  <div
                    key={index}
                    className={`flex items-start gap-3 px-4 py-2 border-b border-gray-100 dark:border-gray-800 last:border-b-0 cursor-pointer ${styles.row}`}
                    onClick={() => goToLine(error.line, error.column)}
                  >
                    <div className={`flex-shrink-0 mt-0.5 ${styles.icon}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={getSeverityIcon(error.severity)}
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${getSeverityColor(error.severity)}`}>
                        {error.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        行 {error.line}, 列 {error.column}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ステータスバー */}
      <div className="flex items-center justify-between px-4 py-1 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-4">
          <span>{getLanguage(selectedFile.name).toUpperCase()}</span>
          <span>UTF-8</span>
          {shouldShowPreview && (
            <span className="text-blue-500 dark:text-blue-400">Preview ON</span>
          )}
          {/* バリデーションステータス */}
          {allErrors.length > 0 ? (
            <span className="flex items-center gap-2">
              {errorCounts.error > 0 && (
                <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  エラー: {errorCounts.error}
                </span>
              )}
              {errorCounts.warning > 0 && (
                <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  警告: {errorCounts.warning}
                </span>
              )}
              {errorCounts.info > 0 && (
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  情報: {errorCounts.info}
                </span>
              )}
            </span>
          ) : (
            (getLanguage(selectedFile.name) === 'json' ||
             getLanguage(selectedFile.name) === 'yaml' ||
             schemaValidation?.schemaType !== 'unknown') && (
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                検証OK
              </span>
            )
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* 変更プレビューボタン */}
          {hasUnsavedChanges && onPreviewChanges && (
            <button
              onClick={onPreviewChanges}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              title="変更内容を差分表示"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              差分を表示
            </button>
          )}
          <span>
            {selectedFile.content !== selectedFile.originalContent ? '変更あり' : '保存済み'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default MainArea
