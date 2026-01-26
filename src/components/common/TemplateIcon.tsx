import { FC, memo } from 'react'
import Icon, { type IconName } from './Icon'

export type TemplateIconName =
  | 'robot'
  | 'code'
  | 'server'
  | 'lightning'
  | 'refresh'
  | 'git'
  | 'test'
  | 'document'

interface TemplateIconProps {
  icon: TemplateIconName | string
  className?: string
}

/** TemplateIconNameからIconNameへのマッピング */
const iconNameMap: Record<TemplateIconName, IconName> = {
  robot: 'robot',
  code: 'code',
  server: 'server',
  lightning: 'lightning',
  refresh: 'refresh',
  git: 'git',
  test: 'test',
  document: 'fileText',
}

/**
 * テンプレート用アイコンコンポーネント
 * TemplateManager, TemplateSelector で共通利用
 * Icon コンポーネントを内部で使用し、重複を排除
 */
const TemplateIcon: FC<TemplateIconProps> = memo(({ icon, className = 'size-5' }) => {
  const iconName = iconNameMap[icon as TemplateIconName] || 'fileText'
  return <Icon name={iconName} className={className} />
})

TemplateIcon.displayName = 'TemplateIcon'

export default TemplateIcon
