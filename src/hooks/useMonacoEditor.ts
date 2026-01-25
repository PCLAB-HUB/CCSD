import { useRef, useCallback, useEffect, useState } from 'react'
import type { OnMount } from '@monaco-editor/react'
import type * as monaco from 'monaco-editor'
import { validateContent, toMonacoSeverity } from '../utils/validators'
import type { SelectedFile, ValidationError } from '../types'
import {
  validateSchema,
  type SchemaValidationResult,
} from '../utils/schemaValidators'

export interface UseMonacoEditorProps {
  selectedFile: SelectedFile | null
  onSearchNavigate: (direction: 'next' | 'prev') => void
  onValidationChange?: (errors: ValidationError[]) => void
  allErrors: ValidationError[]
}

export interface UseMonacoEditorReturn {
  editorRef: React.MutableRefObject<monaco.editor.IStandaloneCodeEditor | null>
  monacoRef: React.MutableRefObject<typeof monaco | null>
  editorScrollTop: number
  editorScrollHeight: number
  schemaValidation: SchemaValidationResult | null
  handleEditorMount: OnMount
  goToLine: (line: number, column?: number) => void
}

export function useMonacoEditor({
  selectedFile,
  onSearchNavigate,
  onValidationChange,
  allErrors,
}: UseMonacoEditorProps): UseMonacoEditorReturn {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<typeof monaco | null>(null)
  const [editorScrollTop, setEditorScrollTop] = useState(0)
  const [editorScrollHeight, setEditorScrollHeight] = useState(1)
  const [schemaValidation, setSchemaValidation] = useState<SchemaValidationResult | null>(null)

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

  // 行へジャンプ
  const goToLine = useCallback((line: number, column: number = 1) => {
    if (editorRef.current) {
      editorRef.current.revealLineInCenter(line)
      editorRef.current.setPosition({ lineNumber: line, column })
      editorRef.current.focus()
    }
  }, [])

  return {
    editorRef,
    monacoRef,
    editorScrollTop,
    editorScrollHeight,
    schemaValidation,
    handleEditorMount,
    goToLine,
  }
}
