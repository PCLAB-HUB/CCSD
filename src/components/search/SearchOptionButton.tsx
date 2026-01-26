import { FC, useState, useRef, useEffect, useCallback } from 'react'
import Icon, { type IconName } from '../common/Icon'

interface SearchOptionButtonProps {
  icon: IconName
  label: string
  isActive: boolean
  onClick: () => void
  shortcut?: string
}

const SearchOptionButton: FC<SearchOptionButtonProps> = ({
  icon,
  label,
  isActive,
  onClick,
  shortcut,
}) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleMouseEnter = useCallback(() => {
    tooltipTimeoutRef.current = setTimeout(() => {
      setShowTooltip(true)
    }, 500)
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current)
      tooltipTimeoutRef.current = null
    }
    setShowTooltip(false)
  }, [])

  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current)
      }
    }
  }, [])

  const tooltipText = shortcut ? `${label} (${shortcut})` : label

  return (
    <div className="relative inline-flex">
      <button
        ref={buttonRef}
        type="button"
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        aria-pressed={isActive}
        aria-label={tooltipText}
        className={`
          p-1.5 rounded transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
          dark:focus:ring-offset-gray-800
          ${
            isActive
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
          }
        `}
      >
        <Icon name={icon} className="w-4 h-4" />
      </button>

      {showTooltip && (
        <div
          role="tooltip"
          className={`
            absolute z-50 px-2 py-1 text-xs font-medium whitespace-nowrap
            bg-gray-900 text-white rounded shadow-lg
            dark:bg-gray-700 dark:text-gray-100
            left-1/2 -translate-x-1/2 bottom-full mb-1.5
            pointer-events-none
          `}
        >
          {tooltipText}
          <div
            className={`
              absolute left-1/2 -translate-x-1/2 top-full
              border-4 border-transparent border-t-gray-900
              dark:border-t-gray-700
            `}
          />
        </div>
      )}
    </div>
  )
}

export default SearchOptionButton
