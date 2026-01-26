import { FC, useState, useEffect, useMemo } from 'react'
import type { UnifiedTemplate } from '../../types'
import { isCustomTemplate } from '../../types'
import Modal from '../common/Modal'
import Icon from '../common/Icon'

interface CreateFromTemplateDialogProps {
  isOpen: boolean
  template: UnifiedTemplate | null
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

/**
 * テンプレートにフィールド値を適用する汎用関数
 */
function applyTemplateContent(
  template: UnifiedTemplate,
  values: Record<string, string>
): string {
  let content = template.content
  for (const [key, value] of Object.entries(values)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    content = content.replace(regex, value)
  }
  return content
}

/**
 * テンプレートからファイル名を生成する汎用関数
 */
function getTemplateFileName(
  template: UnifiedTemplate,
  values: Record<string, string>
): string {
  // カスタムテンプレートの場合は defaultFileName プロパティを使用
  const fileNamePattern = isCustomTemplate(template)
    ? template.defaultFileName
    : template.defaultFileName

  let fileName = fileNamePattern
  for (const [key, value] of Object.entries(values)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    fileName = fileName.replace(regex, value)
  }
  return fileName
}

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

  // テンプレートが変更されたらフィールド値をリセット
  useEffect(() => {
    if (template) {
      const initialValues: Record<string, string> = {}
      template.fields.forEach((field) => {
        initialValues[field.name] = field.defaultValue || ''
      })
      setFieldValues(initialValues)

      // カテゴリに応じてデフォルトディレクトリを設定
      const category = template.category
      switch (category) {
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

      setCustomFileName('')
      setUseCustomFileName(false)
    }
  }, [template])

  // プレビューコンテンツの計算
  const previewContent = useMemo(() => {
    if (!template) return ''
    return applyTemplateContent(template, fieldValues)
  }, [template, fieldValues])

  // 生成されるファイル名
  const generatedFileName = useMemo(() => {
    if (!template) return ''
    return getTemplateFileName(template, fieldValues)
  }, [template, fieldValues])

  if (!template) return null

  const handleFieldChange = (fieldName: string, value: string) => {
    setFieldValues((prev) => ({
      ...prev,
      [fieldName]: value,
    }))
  }

  const finalFileName = useCustomFileName && customFileName ? customFileName : generatedFileName

  const isValid = template.fields
    .filter((f) => f.required)
    .every((f) => fieldValues[f.name]?.trim())

  const handleCreate = () => {
    if (isValid) {
      onCreate(finalFileName, previewContent, directory)
    }
  }

  const isCustom = isCustomTemplate(template)

  const backIcon = (
    <button
      onClick={onBack}
      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      title="テンプレート選択に戻る"
      aria-label="テンプレート選択に戻る"
    >
      <Icon name="chevronLeft" className="size-5 text-gray-500 dark:text-gray-400" />
    </button>
  )

  const footer = (
    <div className="flex items-center justify-end gap-3">
      <button
        onClick={onClose}
        className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
      >
        キャンセル
      </button>
      <button
        onClick={handleCreate}
        disabled={!isValid}
        className={`px-4 py-2 text-sm text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          isCustom
            ? 'bg-green-500 hover:bg-green-600 focus:ring-green-500'
            : 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500'
        }`}
      >
        <Icon name="plus" className="size-4" />
        作成
      </button>
    </div>
  )

  // タイトルにカスタムバッジを追加（カスタムテンプレートの場合）
  const titleWithBadge = isCustom ? `${template.name} [カスタム]` : template.name

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={titleWithBadge}
      subtitle={template.description}
      icon={backIcon}
      size="lg"
      footer={footer}
    >
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
                  {field.required && (
                    <span className="text-red-500 ml-1" aria-hidden="true">
                      *
                    </span>
                  )}
                  {field.required && <span className="sr-only">（必須）</span>}
                </label>
                <input
                  type="text"
                  value={fieldValues[field.name] || ''}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  aria-required={field.required}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
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
                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ファイル名</label>
                <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCustomFileName}
                    onChange={(e) => setUseCustomFileName(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
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
                ~/.claude/{directory === 'root' ? '' : directory + '/'}
                {finalFileName || '...'}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="w-1/2 flex flex-col">
          <div className="px-6 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">プレビュー</span>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {previewContent}
            </pre>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default CreateFromTemplateDialog
