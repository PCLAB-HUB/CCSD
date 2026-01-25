/**
 * テンプレート関連の型定義
 */

/** テンプレートカテゴリ */
export type TemplateCategory = 'agent' | 'skill' | 'command'

/** テンプレートフィールド */
export interface TemplateField {
  name: string
  label: string
  placeholder: string
  required: boolean
  defaultValue?: string
}

/** テンプレート（組み込み） */
export interface Template {
  id: string
  name: string
  description: string
  category: TemplateCategory
  icon: string
  fields: TemplateField[]
  content: string
  defaultFileName: string
}

/** カスタムテンプレート（ユーザー作成） */
export interface CustomTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: string
  content: string
  fields: TemplateField[]
  defaultFileName: string
  isCustom: true
  createdAt: string
  updatedAt?: string
}

/** カスタムテンプレート保存用入力 */
export interface SaveTemplateInput {
  name: string
  description: string
  category: string
  icon: string
  content: string
  fields: TemplateField[]
  defaultFileName: string
}

/** 統合テンプレート型（組み込み + カスタム） */
export type UnifiedTemplate = Template | CustomTemplate

/** カスタムテンプレートかどうかを判定 */
export function isCustomTemplate(template: UnifiedTemplate): template is CustomTemplate {
  return 'isCustom' in template && template.isCustom === true
}
