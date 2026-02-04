import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

import Icon from '../common/Icon'
import TerminalTabs from './TerminalTabs'
import TerminalToolbar from './TerminalToolbar'
import TerminalView, { type TerminalViewHandle } from './TerminalView'
import QuickCommands from './QuickCommands'

import type {
  TerminalTabType,
  QuickCommand,
  CommandHistoryItem,
  TerminalStatus,
} from '../../types/terminal'
import {
  DEFAULT_PANEL_HEIGHT,
  MIN_PANEL_HEIGHT,
  MAX_PANEL_HEIGHT,
  clampPanelHeight,
  TERMINAL_STORAGE_KEYS,
} from '../../types/terminal'

interface TerminalPanelProps {
  /** パネルが開いているかどうか */
  isOpen: boolean
  /** パネル開閉時のコールバック */
  onToggle: () => void
  /** アクティブなタブ */
  activeTab: TerminalTabType
  /** タブ変更時のコールバック */
  onTabChange: (tab: TerminalTabType) => void
  /** パネルの高さ */
  height: number
  /** 高さ変更時のコールバック */
  onHeightChange: (height: number) => void
  /** ターミナルの状態 */
  status: TerminalStatus
  /** クイックコマンド一覧 */
  quickCommands: QuickCommand[]
  /** コマンド履歴 */
  commandHistory: CommandHistoryItem[]
  /** 現在編集中のファイルパス */
  currentFilePath?: string | null
  /** コマンド実行時のコールバック */
  onExecuteCommand: (command: string) => void
  /** クイックコマンド追加時のコールバック */
  onAddQuickCommand?: () => void
  /** クイックコマンド編集時のコールバック */
  onEditQuickCommand?: (command: QuickCommand) => void
  /** クイックコマンド削除時のコールバック */
  onRemoveQuickCommand?: (id: string) => void
  /** ターミナルクリア時のコールバック */
  onClear: () => void
  /** ターミナルからのデータ入力時のコールバック */
  onTerminalData?: (data: string) => void
  /** ターミナルサイズ変更時のコールバック */
  onTerminalResize?: (cols: number, rows: number) => void
  /** 追加のクラス名 */
  className?: string
}

/**
 * TerminalPanelのハンドル（外部から操作可能）
 */
export interface TerminalPanelHandle {
  /** ターミナルにテキストを書き込む */
  write: (data: string) => void
  /** ターミナルをクリア */
  clear: () => void
  /** ターミナルにフォーカス */
  focus: () => void
  /** ターミナルをリサイズ */
  fit: () => void
}

/**
 * ターミナルパネル
 *
 * - 下部に配置
 * - 折りたたみ可能（クリックで開閉）
 * - 上辺ドラッグでリサイズ可能
 * - タブバー + コンテンツ領域
 */
const TerminalPanel = memo(forwardRef<TerminalPanelHandle, TerminalPanelProps>(({
  isOpen,
  onToggle,
  activeTab,
  onTabChange,
  height,
  onHeightChange,
  status,
  quickCommands,
  commandHistory,
  currentFilePath,
  onExecuteCommand,
  onAddQuickCommand,
  onEditQuickCommand,
  onRemoveQuickCommand,
  onClear,
  onTerminalData,
  onTerminalResize,
  className = '',
}, ref) => {
  const terminalRef = useRef<TerminalViewHandle>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartY = useRef(0)
  const dragStartHeight = useRef(height)

  // 外部からアクセス可能なハンドルを公開
  useImperativeHandle(ref, () => ({
    write: (data: string) => {
      terminalRef.current?.write(data)
    },
    clear: () => {
      terminalRef.current?.clear()
    },
    focus: () => {
      terminalRef.current?.focus()
    },
    fit: () => {
      terminalRef.current?.fit()
    },
  }), [])

  // ローカルストレージから高さを復元
  useEffect(() => {
    const savedHeight = localStorage.getItem(TERMINAL_STORAGE_KEYS.PANEL_HEIGHT)
    if (savedHeight) {
      const parsed = parseInt(savedHeight, 10)
      if (!isNaN(parsed)) {
        onHeightChange(clampPanelHeight(parsed))
      }
    }
  }, [onHeightChange])

  // 高さをローカルストレージに保存
  useEffect(() => {
    localStorage.setItem(TERMINAL_STORAGE_KEYS.PANEL_HEIGHT, String(height))
  }, [height])

  // リサイズ開始
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragStartY.current = e.clientY
    dragStartHeight.current = height
  }, [height])

  // リサイズ中
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = dragStartY.current - e.clientY
      const newHeight = clampPanelHeight(dragStartHeight.current + deltaY)
      onHeightChange(newHeight)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, onHeightChange])

  // パネルが開いたときにターミナルにフォーカス
  useEffect(() => {
    if (isOpen && activeTab === 'terminal') {
      setTimeout(() => {
        terminalRef.current?.focus()
        terminalRef.current?.fit()
      }, 100)
    }
  }, [isOpen, activeTab])

  // ターミナルクリア
  const handleClear = useCallback(() => {
    terminalRef.current?.clear()
    onClear()
  }, [onClear])

  // 状態インジケーターの色
  const getStatusColor = () => {
    switch (status) {
      case 'running':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div
      ref={panelRef}
      className={`flex flex-col bg-gray-800 dark:bg-gray-900 border-t border-gray-700 ${className}`}
      style={{ height: isOpen ? height : 'auto' }}
    >
      {/* リサイズハンドル */}
      {isOpen && (
        <div
          className={`h-1 cursor-ns-resize bg-gray-700 hover:bg-blue-500 transition-colors ${
            isDragging ? 'bg-blue-500' : ''
          }`}
          onMouseDown={handleResizeStart}
          role="separator"
          aria-orientation="horizontal"
          aria-label="パネルサイズを調整"
        />
      )}

      {/* ヘッダー部分（クリックで開閉） */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-750 dark:bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          {/* 開閉トグル */}
          <button
            type="button"
            onClick={onToggle}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
            aria-expanded={isOpen}
            aria-controls="terminal-panel-content"
          >
            <Icon name="terminal" className="size-4" />
            <span className="text-sm font-medium">ターミナル</span>
            {/* 状態インジケーター */}
            <span
              className={`size-2 rounded-full ${getStatusColor()}`}
              title={status === 'running' ? '実行中' : status === 'error' ? 'エラー' : 'アイドル'}
            />
            <Icon
              name={isOpen ? 'chevronDown' : 'chevronUp'}
              className="size-3.5"
            />
          </button>

          {/* タブ（開いている時のみ） */}
          {isOpen && (
            <TerminalTabs
              activeTab={activeTab}
              onTabChange={onTabChange}
            />
          )}
        </div>

        {/* ツールバー（開いている時のみ） */}
        {isOpen && (
          <TerminalToolbar
            onClear={handleClear}
            onClose={onToggle}
          />
        )}
      </div>

      {/* コンテンツ領域 */}
      {isOpen && (
        <div
          id="terminal-panel-content"
          className="flex-1 flex flex-col overflow-hidden"
          role="tabpanel"
          aria-labelledby={`terminal-tab-${activeTab}`}
        >
          {/* クイックコマンドバー */}
          <div className="px-3 py-1.5 bg-gray-750 dark:bg-gray-800 border-b border-gray-700">
            <QuickCommands
              commands={quickCommands}
              history={commandHistory}
              currentFilePath={currentFilePath}
              onExecute={onExecuteCommand}
              onAddCommand={onAddQuickCommand}
              onEditCommand={onEditQuickCommand}
              onRemoveCommand={onRemoveQuickCommand}
            />
          </div>

          {/* ターミナル本体 / 出力 */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'terminal' ? (
              <TerminalView
                ref={terminalRef}
                onData={onTerminalData}
                onResize={onTerminalResize}
                className="p-1"
              />
            ) : (
              <div className="h-full p-3 overflow-y-auto bg-gray-900 text-gray-300 text-sm font-mono">
                <p className="text-gray-500">出力タブ（将来実装予定）</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}))

TerminalPanel.displayName = 'TerminalPanel'

export default TerminalPanel

// デフォルト値もエクスポート
export { DEFAULT_PANEL_HEIGHT, MIN_PANEL_HEIGHT, MAX_PANEL_HEIGHT }
