import { FC, useState, useEffect, useCallback } from 'react'
import type { CustomTemplate, SaveTemplateInput } from '../../types'
import {
  getCustomTemplates,
  saveCustomTemplate,
  deleteCustomTemplate,
} from '../../hooks/tauri'
import { Modal, LoadingSpinner, EmptyState, Icon } from '../common'
import TemplateIcon from '../common/TemplateIcon'
import { formatDate } from '../../utils/formatDate'
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
              <Icon name="plus" className="size-4" />
              新規テンプレート
            </button>
          </div>

          {/* テンプレート一覧 */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" label="テンプレートを読み込み中" />
            </div>
          ) : templates.length === 0 ? (
            <EmptyState
              title="カスタムテンプレートがありません"
              action={{ label: '最初のテンプレートを作成', onClick: handleCreate }}
            />
          ) : (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex-shrink-0 size-10 flex items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                    <TemplateIcon icon={template.icon} />
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
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500">
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
                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-md transition-colors"
                      title="編集"
                    >
                      <Icon name="edit" className="size-5" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(template)}
                      disabled={deleting === template.id}
                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-md transition-colors disabled:opacity-50"
                      title="削除"
                    >
                      {deleting === template.id ? (
                        <Icon name="spinner" className="size-5 animate-spin" />
                      ) : (
                        <Icon name="trash" className="size-5" />
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
                    <Icon name="spinner" className="size-4 animate-spin" />
                    削除中...
                  </>
                ) : (
                  <>
                    <Icon name="trash" className="size-4" />
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
            <p className="text-sm text-red-500 dark:text-red-400 mt-2">
              この操作は取り消せません。
            </p>
          </div>
        </Modal>
      )}
    </>
  )
}

export default TemplateManager
