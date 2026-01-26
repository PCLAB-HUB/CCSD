import { useState, useEffect, useRef, memo, useCallback } from 'react'
import FileTree from '../tree/FileTree'
import { Icon } from '../common'
import type { FileNode } from '../../types'

interface SidebarProps {
  width: number
  onWidthChange: (width: number) => void
  fileTree: FileNode[]
  onFileSelect: (path: string, name: string) => void
  selectedPath?: string
  loading: boolean
  error?: string | null
  onRetry?: () => void
}

const Sidebar = memo<SidebarProps>(({
  width,
  onWidthChange,
  fileTree,
  onFileSelect,
  selectedPath,
  loading,
  error,
  onRetry,
}) => {
  const [isResizing, setIsResizing] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  // リサイズのハンドラをuseCallbackでメモ化
  const handleMouseDown = useCallback(() => {
    setIsResizing(true)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const newWidth = e.clientX
      if (newWidth >= 200 && newWidth <= 500) {
        onWidthChange(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, onWidthChange])

  return (
    <>
      <div
        ref={sidebarRef}
        className="flex-shrink-0 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto"
        style={{ width }}
      >
        <div className="p-2">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-2">
            ~/.claude/
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8" role="status" aria-label="ファイルを読み込み中">
              <Icon name="spinner" className="size-6 animate-spin text-gray-400" />
              <span className="sr-only">ファイルを読み込み中...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
              <p className="text-red-500 dark:text-red-400">{error}</p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="mt-2 px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                >
                  再読み込み
                </button>
              )}
            </div>
          ) : fileTree.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
              <p>ファイルが見つかりません</p>
              <p className="text-xs mt-1">Tauriアプリとして起動してください</p>
            </div>
          ) : (
            <FileTree
              nodes={fileTree}
              onFileSelect={onFileSelect}
              selectedPath={selectedPath}
            />
          )}
        </div>
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="サイドバーの幅を調整"
        aria-valuenow={width}
        aria-valuemin={200}
        aria-valuemax={500}
        tabIndex={0}
        className="resizer"
        onMouseDown={handleMouseDown}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') {
            e.preventDefault()
            const newWidth = Math.max(200, width - 10)
            onWidthChange(newWidth)
          } else if (e.key === 'ArrowRight') {
            e.preventDefault()
            const newWidth = Math.min(500, width + 10)
            onWidthChange(newWidth)
          }
        }}
      />
    </>
  )
})

Sidebar.displayName = 'Sidebar'

export default Sidebar
