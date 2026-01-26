import { FC, memo } from 'react'
import TemplateIcon from './TemplateIcon'
import Icon from './Icon'

export type TemplateCardVariant = 'builtin' | 'custom'

interface TemplateCardProps {
  /** テンプレート名 */
  name: string
  /** テンプレートの説明 */
  description: string
  /** アイコン名 */
  icon: string
  /** カスタムテンプレートかどうか */
  variant?: TemplateCardVariant
  /** クリック時のコールバック */
  onClick: () => void
  /** 追加のクラス名 */
  className?: string
}

/**
 * テンプレートカードコンポーネント
 * TemplateSelector, TemplateManagerで共通利用
 */
const TemplateCard: FC<TemplateCardProps> = memo(({
  name,
  description,
  icon,
  variant = 'builtin',
  onClick,
  className = '',
}) => {
  const isCustom = variant === 'custom'
  const colorClass = isCustom ? 'green' : 'blue'

  return (
    <button
      onClick={onClick}
      className={`flex items-start gap-4 p-4 text-left bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-${colorClass}-500 dark:hover:border-${colorClass}-400 transition-all group focus:outline-none focus:ring-2 focus:ring-${colorClass}-500 ${className}`}
    >
      <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center bg-${colorClass}-100 dark:bg-${colorClass}-900/50 text-${colorClass}-600 dark:text-${colorClass}-400 rounded-lg group-hover:bg-${colorClass}-500 group-hover:text-white transition-colors`}>
        <TemplateIcon icon={icon} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className={`text-sm font-medium text-gray-900 dark:text-white group-hover:text-${colorClass}-600 dark:group-hover:text-${colorClass}-400`}>
            {name}
          </h4>
          {isCustom && (
            <span className={`px-1.5 py-0.5 text-[10px] bg-${colorClass}-100 dark:bg-${colorClass}-900/50 text-${colorClass}-600 dark:text-${colorClass}-400 rounded`}>
              カスタム
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
          {description}
        </p>
      </div>
      <Icon
        name="chevronRight"
        className={`flex-shrink-0 w-5 h-5 text-gray-400 group-hover:text-${colorClass}-500 transition-colors`}
      />
    </button>
  )
})

TemplateCard.displayName = 'TemplateCard'

export default TemplateCard
