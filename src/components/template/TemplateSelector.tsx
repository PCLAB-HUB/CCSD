import { FC, useState, useEffect, useCallback } from 'react'
import { templates } from '../../data/templates'
import type { Template, CustomTemplate, UnifiedTemplate } from '../../types'
import { getCustomTemplates } from '../../hooks/tauri'
import Modal from '../common/Modal'

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

const TemplateSelector: FC<TemplateSelectorProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  onOpenManager,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('builtin')
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([])
  const [loadingCustom, setLoadingCustom] = useState(false)

  const categories: Template['category'][] = ['agent', 'skill', 'command']

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

  // カテゴリ別にカスタムテンプレートをグループ化
  const customTemplatesByCategory = customTemplates.reduce(
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

  const headerAction = onOpenManager ? (
    <button
      onClick={() => {
        onClose()
        onOpenManager()
      }}
      className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1.5"
      title="カスタムテンプレートを管理"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
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
      <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
        <button
          onClick={() => setActiveTab('builtin')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'builtin'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          組み込みテンプレート
          <span className="ml-2 px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded">
            {templates.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'custom'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          カスタムテンプレート
          <span className="ml-2 px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded">
            {customTemplates.length}
          </span>
        </button>
      </div>

      {/* コンテンツ */}
      <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
        {activeTab === 'builtin' ? (
          // 組み込みテンプレート
          <>
            {categories.map((category) => {
              const categoryTemplates = templates.filter((t) => t.category === category)
              if (categoryTemplates.length === 0) return null

              return (
                <div key={category} className="mb-8 last:mb-0">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {categoryLabels[category]}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {categoryDescriptions[category]}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categoryTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => onSelectTemplate(template)}
                        className="flex items-start gap-4 p-4 text-left bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-all group focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-colors">
                          <IconComponent icon={template.icon} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            {template.name}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {template.description}
                          </p>
                        </div>
                        <svg
                          className="flex-shrink-0 w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </>
        ) : (
          // カスタムテンプレート
          <>
            {loadingCustom ? (
              <div className="flex items-center justify-center py-12">
                <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : customTemplates.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
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
                {categories.map((category) => {
                  const categoryTemplates = customTemplatesByCategory[category]
                  if (!categoryTemplates || categoryTemplates.length === 0) return null

                  return (
                    <div key={category} className="mb-8 last:mb-0">
                      <div className="mb-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {categoryLabels[category]}
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {categoryTemplates.map((template) => (
                          <button
                            key={template.id}
                            onClick={() => onSelectTemplate(template)}
                            className="flex items-start gap-4 p-4 text-left bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-400 transition-all group focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-lg group-hover:bg-green-500 group-hover:text-white transition-colors">
                              <IconComponent icon={template.icon} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400">
                                  {template.name}
                                </h4>
                                <span className="px-1.5 py-0.5 text-[10px] bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded">
                                  カスタム
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                {template.description}
                              </p>
                            </div>
                            <svg
                              className="flex-shrink-0 w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}

                {/* カテゴリに属さないテンプレート */}
                {Object.keys(customTemplatesByCategory).some(
                  (cat) => !categories.includes(cat as Template['category'])
                ) && (
                  <div className="mb-8 last:mb-0">
                    <div className="mb-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        その他
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {customTemplates
                        .filter((t) => !categories.includes(t.category as Template['category']))
                        .map((template) => (
                          <button
                            key={template.id}
                            onClick={() => onSelectTemplate(template)}
                            className="flex items-start gap-4 p-4 text-left bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-400 transition-all group focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-lg group-hover:bg-green-500 group-hover:text-white transition-colors">
                              <IconComponent icon={template.icon} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400">
                                  {template.name}
                                </h4>
                                <span className="px-1.5 py-0.5 text-[10px] bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded">
                                  カスタム
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                {template.description}
                              </p>
                            </div>
                            <svg
                              className="flex-shrink-0 w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
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
