import { FC, memo } from 'react'

interface StatusBadgesProps {
  hasUnsavedChanges: boolean
  message: { type: 'success' | 'error'; text: string } | null
}

const StatusBadges: FC<StatusBadgesProps> = memo(({ hasUnsavedChanges, message }) => {
  return (
    <>
      {hasUnsavedChanges && (
        <span className="message-badge-warning">
          未保存
        </span>
      )}
      {message && (
        <span
          className={message.type === 'success' ? 'message-badge-success' : 'message-badge-error'}
        >
          {message.text}
        </span>
      )}
    </>
  )
})

StatusBadges.displayName = 'StatusBadges'

export default StatusBadges
