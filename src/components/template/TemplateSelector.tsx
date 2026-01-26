import { FC, useState, useEffect, useCallback, useMemo } from 'react'
import { templates } from '../../data/templates'
import type { Template, CustomTemplate, UnifiedTemplate } from '../../types'
import { getCustomTemplates } from '../../hooks/tauri'
import { Modal, Tabs, TemplateCard, TemplateIcon, Icon } from '../common'
import type { Tab } from '../common'

interface TemplateSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (template: UnifiedTemplate) => void
  onOpenManager?: () => void
}

type TabType = 'builtin' | 'custom'

const categoryLabels: Record<Template['category'], string> = {
  agent: 'エージェント',
  skill: 'スキル',
  command: 'コマンド',
}

const categoryDescriptions: Record<Template['category'], string> = {
  agent: '特定のタスクを実行する専門エージェントを作成',
  skill: '繰り返し使用する処理を自動化するスキルを作成',
  command: 'ショートカットコマンドを作成',
}

const categories: Template['category'][] = ['agent', 'skill', 'command']

/**
 * カテゴリセクションコンポーネント
 * 同じレイアウトを組み込み/カスタムテンプレートで共通化
 */
interface CategorySectionProps<T extends { id: string; name: string; description: string; icon: string }> {
  category: Template['category']
  templates: T[]
  variant: 'builtin' | 'custom'
  onSelect: (template: T) => void
  showDescription?: boolean
}

function CategorySection<T extends { id: string; name: string; description: string; icon: string }>({
  category,
  templates,
  variant,
  onSelect,
  showDescription = true,
}: CategorySectionProps<T>) {
  if (templates.length === 0) return null

  return (
    <div className="mb-8 last:mb-0">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {categoryLabels[category]}
        </h3>
        {showDescription && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {categoryDescriptions[category]}
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            name={template.name}
            description={template.description}
            icon={template.icon}
            variant={variant}
            onClick={() => onSelect(template)}
          />
        ))}
      </div>
    </div>
  )
}

const TemplateSelector: FC<TemplateSelectorProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  onOpenManager,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('builtin')
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([])
  const [loadingCustom, setLoadingCustom] = useState(false)

  // カスタムテンプレートを読み込む
  const loadCustomTemplates = useCallback(async () => {
    setLoadingCustom(true)
    const result = await getCustomTemplates()
    setCustomTemplates(result)
    setLoadingCustom(false)
  }, [])

  // モーダルが開いた時にカスタムテンプレートを読み込む
  useEffect(() => {
    if (isOpen) {
      loadCustomTemplates()
    }
  }, [isOpen, loadCustomTemplates])

  // タブ定義
  const tabs: Tab[] = useMemo(() => [
    { key: 'builtin', label: '組み込みテンプレート', badge: templates.length },
    { key: 'custom', label: 'カスタムテンプレート', badge: customTemplates.length },
  ], [customTemplates.length])

  // カテゴリ別にカスタムテンプレートをグループ化
  const customTemplatesByCategory = useMemo(() => {
    return customTemplates.reduce(
      (acc, template) => {
        const cat = template.category as Template['category']
        if (!acc[cat]) {
          acc[cat] = []
        }
        acc[cat].push(template)
        return acc
      },
      {} as Record<string, CustomTemplate[]>
    )
  }, [customTemplates])

  // カテゴリに属さないテンプレート
  const uncategorizedCustomTemplates = useMemo(() => {
    return customTemplates.filter(
      (t) => !categories.includes(t.category as Template['category'])
    )
  }, [customTemplates])

  const headerAction = onOpenManager ? (
    <button
      onClick={() => {
        onClose()
        onOpenManager()
      }}
      className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1.5"
      title="カスタムテンプレートを管理"
    >
      <Icon name="settings" className="size-4" />
      テンプレート管理
    </button>
  ) : undefined

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="新規作成"
      subtitle="テンプレートを選択して新しいファイルを作成"
      size="lg"
      icon={headerAction}
    >
      {/* タブ */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(key) => setActiveTab(key as TabType)}
        className="px-6"
      />

      {/* コンテンツ */}
      <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
        {activeTab === 'builtin' ? (
          // 組み込みテンプレート
          <>
            {categories.map((category) => (
              <CategorySection
                key={category}
                category={category}
                templates={templates.filter((t) => t.category === category)}
                variant="builtin"
                onSelect={onSelectTemplate}
              />
            ))}
          </>
        ) : (
          // カスタムテンプレート
          <>
            {loadingCustom ? (
              <div className="flex items-center justify-center py-12">
                <svg className="size-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : customTemplates.length === 0 ? (
              <div className="text-center py-12">
                <TemplateIcon icon="document" className="mx-auto mb-4 size-12 text-gray-400" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  カスタムテンプレートがありません
                </p>
                {onOpenManager && (
                  <button
                    onClick={() => {
                      onClose()
                      onOpenManager()
                    }}
                    className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                  >
                    テンプレートを作成
                  </button>
                )}
              </div>
            ) : (
              <>
                {categories.map((category) => (
                  <CategorySection
                    key={category}
                    category={category}
                    templates={customTemplatesByCategory[category] || []}
                    variant="custom"
                    onSelect={onSelectTemplate}
                    showDescription={false}
                  />
                ))}

                {/* カテゴリに属さないテンプレート */}
                {uncategorizedCustomTemplates.length > 0 && (
                  <div className="mb-8 last:mb-0">
                    <div className="mb-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        その他
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {uncategorizedCustomTemplates.map((template) => (
                        <TemplateCard
                          key={template.id}
                          name={template.name}
                          description={template.description}
                          icon={template.icon}
                          variant="custom"
                          onClick={() => onSelectTemplate(template)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}

export default TemplateSelector
