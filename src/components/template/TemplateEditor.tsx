import { FC, useState, useEffect, useMemo, useCallback } from 'react'
import type { TemplateField, CustomTemplate, SaveTemplateInput } from '../../types'
import { Modal, Tabs, Icon, LoadingSpinner } from '../common'
import type { Tab } from '../common'
import TemplateFieldEditor, { createEmptyField } from './TemplateFieldEditor'

interface TemplateEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (input: SaveTemplateInput) => Promise<boolean>
  editingTemplate?: CustomTemplate | null
}

/** テンプレートカテゴリの選択肢 */
const categoryOptions = [
  { value: 'agent', label: 'エージェント' },
  { value: 'skill', label: 'スキル' },
  { value: 'command', label: 'コマンド' },
]

/** アイコンの選択肢 */
const iconOptions = [
  { value: 'robot', label: 'ロボット' },
  { value: 'code', label: 'コード' },
  { value: 'server', label: 'サーバー' },
  { value: 'lightning', label: '稲妻' },
  { value: 'refresh', label: '更新' },
  { value: 'git', label: 'Git' },
  { value: 'test', label: 'テスト' },
  { value: 'document', label: 'ドキュメント' },
]

type EditorTab = 'basic' | 'fields' | 'content' | 'preview'

const editorTabs: Tab[] = [
  { key: 'basic', label: '基本情報' },
  { key: 'fields', label: 'フィールド' },
  { key: 'content', label: 'テンプレート本文' },
  { key: 'preview', label: 'プレビュー' },
]

const defaultTemplateContent = `---
name: {{name}}
description: {{description}}
---

# {{name}}

{{description}}

## 使用方法

\`\`\`
@{{name}} タスクの説明
\`\`\`
`

const TemplateEditor: FC<TemplateEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTemplate,
}) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('agent')
  const [icon, setIcon] = useState('robot')
  const [content, setContent] = useState('')
  const [defaultFileName, setDefaultFileName] = useState('{{name}}.md')
  const [fields, setFields] = useState<TemplateField[]>([createEmptyField()])
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<EditorTab>('basic')

  // 編集モード時に初期値を設定
  useEffect(() => {
    if (editingTemplate) {
      setName(editingTemplate.name)
      setDescription(editingTemplate.description)
      setCategory(editingTemplate.category)
      setIcon(editingTemplate.icon)
      setContent(editingTemplate.content)
      setDefaultFileName(editingTemplate.defaultFileName)
      setFields(
        editingTemplate.fields.length > 0
          ? editingTemplate.fields
          : [createEmptyField()]
      )
    } else {
      // 新規作成時はリセット
      setName('')
      setDescription('')
      setCategory('agent')
      setIcon('robot')
      setContent(defaultTemplateContent)
      setDefaultFileName('{{name}}.md')
      setFields([createEmptyField()])
    }
    setActiveTab('basic')
  }, [editingTemplate, isOpen])

  // プレビュー生成
  const previewContent = useMemo(() => {
    let result = content
    // フィールドのデフォルト値でプレースホルダーを置換
    fields.forEach((field) => {
      if (field.name) {
        const regex = new RegExp(`\\{\\{${field.name}\\}\\}`, 'g')
        const value = field.defaultValue || `[${field.label || field.name}]`
        result = result.replace(regex, value)
      }
    })
    return result
  }, [content, fields])

  // バリデーション
  const isValid = useMemo(() => {
    if (!name.trim()) return false
    if (!description.trim()) return false
    if (!content.trim()) return false
    if (!defaultFileName.trim()) return false
    // 空でないフィールドがあれば、name と label は必須
    const validFields = fields.filter((f) => f.name.trim() || f.label.trim())
    return validFields.every((f) => f.name.trim() && f.label.trim())
  }, [name, description, content, defaultFileName, fields])

  // 保存処理
  const handleSave = useCallback(async () => {
    if (!isValid) return

    setSaving(true)
    try {
      // 空のフィールドを除外
      const validFields = fields.filter((f) => f.name.trim() && f.label.trim())

      const input: SaveTemplateInput = {
        name: name.trim(),
        description: description.trim(),
        category,
        icon,
        content,
        fields: validFields.map((f) => ({
          name: f.name.trim(),
          label: f.label.trim(),
          placeholder: f.placeholder.trim(),
          required: f.required,
          defaultValue: f.defaultValue?.trim() || undefined,
        })),
        defaultFileName: defaultFileName.trim(),
      }

      const success = await onSave(input)
      if (success) {
        onClose()
      }
    } finally {
      setSaving(false)
    }
  }, [isValid, fields, name, description, category, icon, content, defaultFileName, onSave, onClose])

  const footer = (
    <div className="flex items-center justify-end gap-3">
      <button
        onClick={onClose}
        disabled={saving}
        className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
      >
        キャンセル
      </button>
      <button
        onClick={handleSave}
        disabled={!isValid || saving}
        className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
      >
        {saving ? (
          <>
            <LoadingSpinner size="sm" />
            保存中...
          </>
        ) : (
          <>
            <Icon name="check" className="size-4" />
            {editingTemplate ? '更新' : '作成'}
          </>
        )}
      </button>
    </div>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTemplate ? 'テンプレートを編集' : '新規テンプレート作成'}
      subtitle="カスタムテンプレートを作成して再利用できます"
      size="xl"
      footer={footer}
      zIndex={60}
    >
      {/* タブナビゲーション */}
      <Tabs
        tabs={editorTabs}
        activeTab={activeTab}
        onTabChange={(key) => setActiveTab(key as EditorTab)}
        className="px-6"
      />

      <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
        {/* 基本情報タブ */}
        {activeTab === 'basic' && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                テンプレート名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: マイカスタムエージェント"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                説明 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="このテンプレートの用途を説明してください"
                rows={2}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  カテゴリ
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  アイコン
                </label>
                <select
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {iconOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                デフォルトファイル名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={defaultFileName}
                onChange={(e) => setDefaultFileName(e.target.value)}
                placeholder="例: {{name}}.md"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                フィールド名を {'{{field_name}}'} の形式で使用できます
              </p>
            </div>
          </div>
        )}

        {/* フィールドタブ */}
        {activeTab === 'fields' && (
          <TemplateFieldEditor
            fields={fields}
            onFieldsChange={setFields}
          />
        )}

        {/* テンプレート本文タブ */}
        {activeTab === 'content' && (
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              テンプレートの本文を入力してください。
              フィールド名を {'{{field_name}}'} の形式で埋め込むことができます。
            </p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="テンプレートの内容を入力..."
              rows={20}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>
        )}

        {/* プレビュータブ */}
        {activeTab === 'preview' && (
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              フィールドのデフォルト値を適用したプレビューです。
            </p>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
              <pre className="text-sm font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {previewContent}
              </pre>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default TemplateEditor
