import { FC, ReactNode, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  size?: ModalSize
  title?: string
  subtitle?: string
  showCloseButton?: boolean
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
  className?: string
  contentClassName?: string
  /** アイコン要素（タイトルの左に表示） */
  icon?: ReactNode
  /** フッター要素 */
  footer?: ReactNode
  /** z-indexを調整（ネストしたモーダル用） */
  zIndex?: number
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  full: 'max-w-[95vw] h-[90vh]',
}

/**
 * 共通モーダルコンポーネント
 * アクセシビリティ対応（ARIA属性、フォーカス管理、ESCキー対応）
 */
const Modal: FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  size = 'md',
  title,
  subtitle,
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  className = '',
  contentClassName = '',
  icon,
  footer,
  zIndex = 50,
}) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // ESCキーで閉じる
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose()
      }
    },
    [onClose, closeOnEscape]
  )

  // フォーカス管理
  useEffect(() => {
    if (isOpen) {
      // 開く前のフォーカス要素を保存
      previousActiveElement.current = document.activeElement as HTMLElement

      // モーダルにフォーカス
      const timer = setTimeout(() => {
        modalRef.current?.focus()
      }, 0)

      // スクロール無効化
      document.body.style.overflow = 'hidden'

      // ESCキーリスナー登録
      window.addEventListener('keydown', handleKeyDown)

      return () => {
        clearTimeout(timer)
        document.body.style.overflow = ''
        window.removeEventListener('keydown', handleKeyDown)

        // 閉じた時に元の要素にフォーカスを戻す
        previousActiveElement.current?.focus()
      }
    }
  }, [isOpen, handleKeyDown])

  // オーバーレイクリックで閉じる
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      onClose()
    }
  }

  // フォーカストラップ
  const handleTabKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !modalRef.current) return

    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault()
      lastElement.focus()
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault()
      firstElement.focus()
    }
  }

  if (!isOpen) return null

  const modalContent = (
    <div
      className={`fixed inset-0 flex items-center justify-center`}
      style={{ zIndex }}
      onClick={handleBackdropClick}
      role="presentation"
    >
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
        aria-hidden="true"
      />

      {/* モーダル本体 */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={subtitle ? 'modal-subtitle' : undefined}
        tabIndex={-1}
        onKeyDown={handleTabKey}
        className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col m-4 animate-modal-enter ${className}`}
      >
        {/* ヘッダー */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            {title && (
              <div className="flex items-center gap-3">
                {icon && <div className="flex-shrink-0">{icon}</div>}
                <div>
                  <h2
                    id="modal-title"
                    className="text-lg font-semibold text-gray-900 dark:text-gray-100"
                  >
                    {title}
                  </h2>
                  {subtitle && (
                    <p
                      id="modal-subtitle"
                      className="text-sm text-gray-500 dark:text-gray-400 mt-0.5"
                    >
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
            )}
            {!title && <div />}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="閉じる"
                title="閉じる (ESC)"
              >
                <Icon name="close" className="size-5 text-gray-500 dark:text-gray-400" />
              </button>
            )}
          </div>
        )}

        {/* コンテンツ */}
        <div className={`flex-1 overflow-y-auto ${contentClassName}`}>{children}</div>

        {/* フッター */}
        {footer && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  )

  // ポータルでbody直下にレンダリング
  return createPortal(modalContent, document.body)
}

export default Modal
