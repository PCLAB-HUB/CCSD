import { FC, useState, useEffect, useMemo, useCallback } from 'react'
import type { TemplateField, CustomTemplate, SaveTemplateInput } from '../../types'
import Modal from '../common/Modal'

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

/** 空のフィールド */
const createEmptyField = (): TemplateField => ({
  name: '',
  label: '',
  placeholder: '',
  required: false,
  defaultValue: '',
})

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
  const [activeTab, setActiveTab] = useState<'basic' | 'fields' | 'content' | 'preview'>('basic')

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
      setContent(`---
name: {{name}}
description: {{description}}
---

# {{name}}

{{description}}

## 使用方法

\`\`\`
@{{name}} タスクの説明
\`\`\`
`)
      setDefaultFileName('{{name}}.md')
      setFields([createEmptyField()])
    }
    setActiveTab('basic')
  }, [editingTemplate, isOpen])

  // フィールドの追加
  const addField = useCallback(() => {
    setFields((prev) => [...prev, createEmptyField()])
  }, [])

  // フィールドの削除
  const removeField = useCallback((index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index))
  }, [])

  // フィールドの更新
  const updateField = useCallback(
    (index: number, key: keyof TemplateField, value: string | boolean) => {
      setFields((prev) =>
        prev.map((field, i) =>
          i === index ? { ...field, [key]: value } : field
        )
      )
    },
    []
  )

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
  const handleSave = async () => {
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
  }

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
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            保存中...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
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
      <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
        {[
          { key: 'basic', label: '基本情報' },
          { key: 'fields', label: 'フィールド' },
          { key: 'content', label: 'テンプレート本文' },
          { key: 'preview', label: 'プレビュー' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

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
                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                フィールド名を {'{{field_name}}'} の形式で使用できます
              </p>
            </div>
          </div>
        )}

        {/* フィールドタブ */}
        {activeTab === 'fields' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              テンプレート使用時に入力を求めるフィールドを定義します。
              テンプレート本文で {'{{field_name}}'} として参照できます。
            </p>

            {fields.map((field, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    フィールド {index + 1}
                  </span>
                  {fields.length > 1 && (
                    <button
                      onClick={() => removeField(index)}
                      className="text-red-500 hover:text-red-600 transition-colors"
                      title="フィールドを削除"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      フィールド名（変数名）
                    </label>
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) => updateField(index, 'name', e.target.value)}
                      placeholder="例: agent_name"
                      className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      表示ラベル
                    </label>
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateField(index, 'label', e.target.value)}
                      placeholder="例: エージェント名"
                      className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      プレースホルダー
                    </label>
                    <input
                      type="text"
                      value={field.placeholder}
                      onChange={(e) => updateField(index, 'placeholder', e.target.value)}
                      placeholder="例: my-agent"
                      className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      デフォルト値
                    </label>
                    <input
                      type="text"
                      value={field.defaultValue || ''}
                      onChange={(e) => updateField(index, 'defaultValue', e.target.value)}
                      placeholder="（オプション）"
                      className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateField(index, 'required', e.target.checked)}
                      className="rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                    />
                    必須フィールド
                  </label>
                </div>
              </div>
            ))}

            <button
              onClick={addField}
              className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              フィールドを追加
            </button>
          </div>
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
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono resize-none"
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
