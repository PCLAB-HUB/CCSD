import { FC, useState, useEffect, useCallback } from 'react'
import type { CustomTemplate, SaveTemplateInput } from '../../types'
import {
  getCustomTemplates,
  saveCustomTemplate,
  deleteCustomTemplate,
} from '../../hooks/tauri'
import Modal from '../common/Modal'
import TemplateEditor from './TemplateEditor'

interface TemplateManagerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
  onTemplatesUpdated?: () => void
}

/** カテゴリラベル */
const categoryLabels: Record<string, string> = {
  agent: 'エージェント',
  skill: 'スキル',
  command: 'コマンド',
}

/** アイコンコンポーネント */
const IconComponent: FC<{ icon: string; className?: string }> = ({ icon, className = 'w-5 h-5' }) => {
  switch (icon) {
    case 'robot':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      )
    case 'code':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      )
    case 'server':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      )
    case 'lightning':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    case 'refresh':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )
    case 'git':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    case 'test':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    default:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
  }
}

const TemplateManager: FC<TemplateManagerProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
  onTemplatesUpdated,
}) => {
  const [templates, setTemplates] = useState<CustomTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<CustomTemplate | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<CustomTemplate | null>(null)

  // テンプレート一覧を取得
  const loadTemplates = useCallback(async () => {
    setLoading(true)
    const result = await getCustomTemplates()
    setTemplates(result)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadTemplates()
    }
  }, [isOpen, loadTemplates])

  // テンプレートを保存
  const handleSave = useCallback(
    async (input: SaveTemplateInput): Promise<boolean> => {
      const result = await saveCustomTemplate(input)
      if (result) {
        onSuccess?.(editingTemplate ? 'テンプレートを更新しました' : 'テンプレートを作成しました')
        loadTemplates()
        onTemplatesUpdated?.()
        return true
      } else {
        onError?.('テンプレートの保存に失敗しました')
        return false
      }
    },
    [editingTemplate, loadTemplates, onSuccess, onError, onTemplatesUpdated]
  )

  // テンプレートを削除
  const handleDelete = useCallback(
    async (template: CustomTemplate) => {
      setDeleting(template.id)
      const success = await deleteCustomTemplate(template.id)
      setDeleting(null)
      setConfirmDelete(null)

      if (success) {
        onSuccess?.(`「${template.name}」を削除しました`)
        loadTemplates()
        onTemplatesUpdated?.()
      } else {
        onError?.('テンプレートの削除に失敗しました')
      }
    },
    [loadTemplates, onSuccess, onError, onTemplatesUpdated]
  )

  // 新規作成
  const handleCreate = useCallback(() => {
    setEditingTemplate(null)
    setEditorOpen(true)
  }, [])

  // 編集
  const handleEdit = useCallback((template: CustomTemplate) => {
    setEditingTemplate(template)
    setEditorOpen(true)
  }, [])

  // 日時フォーマット
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="カスタムテンプレート管理"
        subtitle="作成したテンプレートを管理します"
        size="lg"
      >
        <div className="p-6">
          {/* ヘッダーアクション */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {templates.length} 件のカスタムテンプレート
            </div>
            <button
              onClick={handleCreate}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新規テンプレート
            </button>
          </div>

          {/* テンプレート一覧 */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                カスタムテンプレートがありません
              </p>
              <button
                onClick={handleCreate}
                className="text-blue-500 hover:text-blue-600 text-sm font-medium"
              >
                最初のテンプレートを作成
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg">
                    <IconComponent icon={template.icon} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {template.name}
                      </h4>
                      <span className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded">
                        {categoryLabels[template.category] || template.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {template.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 dark:text-gray-500">
                      <span>作成: {formatDate(template.createdAt)}</span>
                      {template.updatedAt && (
                        <span>更新: {formatDate(template.updatedAt)}</span>
                      )}
                      <span>{template.fields.length} フィールド</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(template)}
                      className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-md transition-colors"
                      title="編集"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setConfirmDelete(template)}
                      disabled={deleting === template.id}
                      className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-md transition-colors disabled:opacity-50"
                      title="削除"
                    >
                      {deleting === template.id ? (
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* テンプレートエディタ */}
      <TemplateEditor
        isOpen={editorOpen}
        onClose={() => {
          setEditorOpen(false)
          setEditingTemplate(null)
        }}
        onSave={handleSave}
        editingTemplate={editingTemplate}
      />

      {/* 削除確認ダイアログ */}
      {confirmDelete && (
        <Modal
          isOpen={true}
          onClose={() => setConfirmDelete(null)}
          title="テンプレートを削除"
          size="sm"
          zIndex={70}
          footer={
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleting !== null}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {deleting === confirmDelete.id ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    削除中...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    削除
                  </>
                )}
              </button>
            </div>
          }
        >
          <div className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              「<span className="font-medium text-gray-900 dark:text-white">{confirmDelete.name}</span>」を削除しますか？
            </p>
            <p className="text-sm text-red-500 mt-2">
              この操作は取り消せません。
            </p>
          </div>
        </Modal>
      )}
    </>
  )
}

export default TemplateManager
