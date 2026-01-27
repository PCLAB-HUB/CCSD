import { useCallback, useState } from 'react'

import type { UnifiedTemplate } from '../types'

/**
 * テンプレート機能を管理するカスタムフック
 * - テンプレート選択ダイアログの開閉
 * - 作成ダイアログの開閉
 * - 選択中のテンプレート管理
 * - テンプレートマネージャーの開閉
 */
export function useTemplate() {
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<UnifiedTemplate | null>(null)
  const [templateManagerOpen, setTemplateManagerOpen] = useState(false)

  /**
   * テンプレート選択ダイアログを開く
   */
  const openTemplateSelector = useCallback(() => {
    setTemplateSelectorOpen(true)
  }, [])

  /**
   * テンプレート選択ダイアログを閉じる
   */
  const closeTemplateSelector = useCallback(() => {
    setTemplateSelectorOpen(false)
  }, [])

  /**
   * テンプレートを選択して作成ダイアログを開く
   */
  const selectTemplate = useCallback((template: UnifiedTemplate) => {
    setSelectedTemplate(template)
    setTemplateSelectorOpen(false)
    setCreateDialogOpen(true)
  }, [])

  /**
   * テンプレート選択画面に戻る
   */
  const backToTemplateSelector = useCallback(() => {
    setCreateDialogOpen(false)
    setSelectedTemplate(null)
    setTemplateSelectorOpen(true)
  }, [])

  /**
   * 作成ダイアログを閉じてリセット
   */
  const closeCreateDialog = useCallback(() => {
    setCreateDialogOpen(false)
    setSelectedTemplate(null)
  }, [])

  /**
   * テンプレートマネージャーを開く
   */
  const openTemplateManager = useCallback(() => {
    setTemplateManagerOpen(true)
  }, [])

  /**
   * テンプレートマネージャーを閉じる
   */
  const closeTemplateManager = useCallback(() => {
    setTemplateManagerOpen(false)
  }, [])

  /**
   * すべてのダイアログを閉じてリセット
   */
  const reset = useCallback(() => {
    setTemplateSelectorOpen(false)
    setCreateDialogOpen(false)
    setSelectedTemplate(null)
    setTemplateManagerOpen(false)
  }, [])

  return {
    // 状態
    templateSelectorOpen,
    createDialogOpen,
    selectedTemplate,
    templateManagerOpen,
    // 操作
    openTemplateSelector,
    closeTemplateSelector,
    selectTemplate,
    backToTemplateSelector,
    closeCreateDialog,
    openTemplateManager,
    closeTemplateManager,
    reset,
  }
}
