/**
 * @fileoverview カスタムテンプレート関連のTauri API
 * @module hooks/tauri/template
 */

import type { CustomTemplate, SaveTemplateInput } from '../../types'
import { invokeWithDefault, invokeWithBoolean } from './utils'

// ============================================================
// カスタムテンプレート操作
// ============================================================

/**
 * カスタムテンプレートを保存する
 * @param input - 保存するテンプレートデータ
 * @returns 保存したテンプレート（エラー時はnull）
 */
export async function saveCustomTemplate(
  input: SaveTemplateInput
): Promise<CustomTemplate | null> {
  // Rust側はsnake_caseを期待するため変換
  const rustInput = {
    name: input.name,
    description: input.description,
    category: input.category,
    icon: input.icon,
    content: input.content,
    fields: input.fields.map((f) => ({
      name: f.name,
      label: f.label,
      placeholder: f.placeholder,
      required: f.required,
      default_value: f.defaultValue,
    })),
    default_file_name: input.defaultFileName,
  }

  const result = await invokeWithDefault<{
    id: string
    name: string
    description: string
    category: string
    icon: string
    content: string
    fields: Array<{
      name: string
      label: string
      placeholder: string
      required: boolean
      default_value?: string
    }>
    default_file_name: string
    is_custom: boolean
    created_at: string
    updated_at?: string
  } | null>('save_custom_template', { input: rustInput }, null, true)

  if (!result) return null

  // Rust側のsnake_caseをcamelCaseに変換
  return {
    id: result.id,
    name: result.name,
    description: result.description,
    category: result.category,
    icon: result.icon,
    content: result.content,
    fields: result.fields.map((f) => ({
      name: f.name,
      label: f.label,
      placeholder: f.placeholder,
      required: f.required,
      defaultValue: f.default_value,
    })),
    defaultFileName: result.default_file_name,
    isCustom: true,
    createdAt: result.created_at,
    updatedAt: result.updated_at,
  }
}

/**
 * カスタムテンプレート一覧を取得する
 * @returns カスタムテンプレートの配列（エラー時は空配列）
 */
export async function getCustomTemplates(): Promise<CustomTemplate[]> {
  const results = await invokeWithDefault<
    Array<{
      id: string
      name: string
      description: string
      category: string
      icon: string
      content: string
      fields: Array<{
        name: string
        label: string
        placeholder: string
        required: boolean
        default_value?: string
      }>
      default_file_name: string
      is_custom: boolean
      created_at: string
      updated_at?: string
    }>
  >('get_custom_templates', undefined, [])

  // snake_caseからcamelCaseに変換
  return results.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
    icon: t.icon,
    content: t.content,
    fields: t.fields.map((f) => ({
      name: f.name,
      label: f.label,
      placeholder: f.placeholder,
      required: f.required,
      defaultValue: f.default_value,
    })),
    defaultFileName: t.default_file_name,
    isCustom: true as const,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }))
}

/**
 * カスタムテンプレートを削除する
 * @param id - 削除するテンプレートのID
 * @returns 成功時true、失敗時false
 */
export async function deleteCustomTemplate(id: string): Promise<boolean> {
  return invokeWithBoolean('delete_custom_template', { id }, true)
}

/**
 * 特定のカスタムテンプレートを取得する
 * @param id - 取得するテンプレートのID
 * @returns テンプレート（エラー時はnull）
 */
export async function getCustomTemplate(id: string): Promise<CustomTemplate | null> {
  const result = await invokeWithDefault<{
    id: string
    name: string
    description: string
    category: string
    icon: string
    content: string
    fields: Array<{
      name: string
      label: string
      placeholder: string
      required: boolean
      default_value?: string
    }>
    default_file_name: string
    is_custom: boolean
    created_at: string
    updated_at?: string
  } | null>('get_custom_template', { id }, null, true)

  if (!result) return null

  return {
    id: result.id,
    name: result.name,
    description: result.description,
    category: result.category,
    icon: result.icon,
    content: result.content,
    fields: result.fields.map((f) => ({
      name: f.name,
      label: f.label,
      placeholder: f.placeholder,
      required: f.required,
      defaultValue: f.default_value,
    })),
    defaultFileName: result.default_file_name,
    isCustom: true,
    createdAt: result.created_at,
    updatedAt: result.updated_at,
  }
}
