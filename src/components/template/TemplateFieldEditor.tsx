import { FC, memo, useCallback } from 'react'
import type { TemplateField } from '../../types'
import { Icon } from '../common'

interface TemplateFieldEditorProps {
  fields: TemplateField[]
  onFieldsChange: (fields: TemplateField[]) => void
}

/** 空のフィールド */
const createEmptyField = (): TemplateField => ({
  name: '',
  label: '',
  placeholder: '',
  required: false,
  defaultValue: '',
})

/**
 * 単一フィールドの編集コンポーネント
 */
interface FieldItemProps {
  field: TemplateField
  index: number
  canRemove: boolean
  onChange: (index: number, key: keyof TemplateField, value: string | boolean) => void
  onRemove: (index: number) => void
}

const FieldItem: FC<FieldItemProps> = memo(({
  field,
  index,
  canRemove,
  onChange,
  onRemove,
}) => {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          フィールド {index + 1}
        </span>
        {canRemove && (
          <button
            onClick={() => onRemove(index)}
            className="text-red-500 hover:text-red-600 transition-colors"
            title="フィールドを削除"
            aria-label={`フィールド ${index + 1} を削除`}
          >
            <Icon name="trash" className="size-5" />
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
            onChange={(e) => onChange(index, 'name', e.target.value)}
            placeholder="例: agent_name"
            className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            表示ラベル
          </label>
          <input
            type="text"
            value={field.label}
            onChange={(e) => onChange(index, 'label', e.target.value)}
            placeholder="例: エージェント名"
            className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            プレースホルダー
          </label>
          <input
            type="text"
            value={field.placeholder}
            onChange={(e) => onChange(index, 'placeholder', e.target.value)}
            placeholder="例: my-agent"
            className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            デフォルト値
          </label>
          <input
            type="text"
            value={field.defaultValue || ''}
            onChange={(e) => onChange(index, 'defaultValue', e.target.value)}
            placeholder="（オプション）"
            className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>
      </div>

      <div className="mt-3">
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => onChange(index, 'required', e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500"
          />
          必須フィールド
        </label>
      </div>
    </div>
  )
})

FieldItem.displayName = 'FieldItem'

/**
 * テンプレートフィールドエディタ
 * 複数のフィールドを編集するためのコンポーネント
 */
const TemplateFieldEditor: FC<TemplateFieldEditorProps> = memo(({
  fields,
  onFieldsChange,
}) => {
  // フィールドの追加
  const addField = useCallback(() => {
    onFieldsChange([...fields, createEmptyField()])
  }, [fields, onFieldsChange])

  // フィールドの削除
  const removeField = useCallback((index: number) => {
    onFieldsChange(fields.filter((_, i) => i !== index))
  }, [fields, onFieldsChange])

  // フィールドの更新
  const updateField = useCallback(
    (index: number, key: keyof TemplateField, value: string | boolean) => {
      onFieldsChange(
        fields.map((field, i) =>
          i === index ? { ...field, [key]: value } : field
        )
      )
    },
    [fields, onFieldsChange]
  )

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        テンプレート使用時に入力を求めるフィールドを定義します。
        テンプレート本文で {'{{field_name}}'} として参照できます。
      </p>

      {fields.map((field, index) => (
        <FieldItem
          key={index}
          field={field}
          index={index}
          canRemove={fields.length > 1}
          onChange={updateField}
          onRemove={removeField}
        />
      ))}

      <button
        onClick={addField}
        className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
      >
        <Icon name="plus" className="size-5" />
        フィールドを追加
      </button>
    </div>
  )
})

TemplateFieldEditor.displayName = 'TemplateFieldEditor'

export default TemplateFieldEditor
export { createEmptyField }
