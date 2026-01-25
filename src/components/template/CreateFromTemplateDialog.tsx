import { FC, useState, useEffect } from 'react'
import { applyTemplate, getFileName } from '../../data/templates'
import type { Template } from '../../types'

interface CreateFromTemplateDialogProps {
  isOpen: boolean
  template: Template | null
  onClose: () => void
  onBack: () => void
  onCreate: (fileName: string, content: string, directory: string) => void
}

const directoryOptions = [
  { value: 'agents', label: 'agents/', description: 'エージェント用ディレクトリ' },
  { value: 'skills', label: 'skills/', description: 'スキル用ディレクトリ' },
  { value: 'commands', label: 'commands/', description: 'コマンド用ディレクトリ' },
  { value: 'root', label: '.claude/', description: 'ルートディレクトリ' },
]

const CreateFromTemplateDialog: FC<CreateFromTemplateDialogProps> = ({
  isOpen,
  template,
  onClose,
  onBack,
  onCreate,
}) => {
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [directory, setDirectory] = useState<string>('root')
  const [customFileName, setCustomFileName] = useState<string>('')
  const [useCustomFileName, setUseCustomFileName] = useState(false)
  const [previewContent, setPreviewContent] = useState<string>('')

  // テンプレートが変更されたらフィールド値をリセット
  useEffect(() => {
    if (template) {
      const initialValues: Record<string, string> = {}
      template.fields.forEach(field => {
        initialValues[field.name] = field.defaultValue || ''
      })
      setFieldValues(initialValues)

      // カテゴリに応じてデフォルトディレクトリを設定
      switch (template.category) {
        case 'agent':
          setDirectory('agents')
          break
        case 'skill':
          setDirectory('skills')
          break
        case 'command':
          setDirectory('commands')
          break
        default:
          setDirectory('root')
      }
    }
  }, [template])

  // プレビューの更新
  useEffect(() => {
    if (template) {
      const content = applyTemplate(template, fieldValues)
      setPreviewContent(content)
    }
  }, [template, fieldValues])

  if (!isOpen || !template) return null

  const handleFieldChange = (fieldName: string, value: string) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldName]: value,
    }))
  }

  const generatedFileName = getFileName(template, fieldValues)
  const finalFileName = useCustomFileName && customFileName ? customFileName : generatedFileName

  const isValid = template.fields
    .filter(f => f.required)
    .every(f => fieldValues[f.name]?.trim())

  const handleCreate = () => {
    if (isValid) {
      onCreate(finalFileName, previewContent, directory)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              title="テンプレート選択に戻る"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{template.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{template.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Form */}
          <div className="w-1/2 p-6 overflow-y-auto border-r border-gray-200 dark:border-gray-700">
            <div className="space-y-5">
              {/* Fields */}
              {template.fields.map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type="text"
                    value={fieldValues[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              ))}

              {/* Directory */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  保存先ディレクトリ
                </label>
                <select
                  value={directory}
                  onChange={(e) => setDirectory(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {directoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} - {opt.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* File name */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    ファイル名
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={useCustomFileName}
                      onChange={(e) => setUseCustomFileName(e.target.checked)}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    カスタム名を使用
                  </label>
                </div>
                {useCustomFileName ? (
                  <input
                    type="text"
                    value={customFileName}
                    onChange={(e) => setCustomFileName(e.target.value)}
                    placeholder={generatedFileName}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-300">
                    {generatedFileName || '(フィールドを入力してください)'}
                  </div>
                )}
              </div>

              {/* Full path preview */}
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">作成されるファイル</div>
                <div className="text-sm font-mono text-gray-700 dark:text-gray-300">
                  ~/.claude/{directory === 'root' ? '' : directory + '/'}{finalFileName || '...'}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="w-1/2 flex flex-col">
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">プレビュー</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {previewContent}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleCreate}
            disabled={!isValid}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            作成
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateFromTemplateDialog
