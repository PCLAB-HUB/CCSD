import { memo, useCallback, useEffect, useMemo, useState, useRef } from 'react'

import DependencyTree from './DependencyTree'
import NodeDetailPanel from './NodeDetailPanel'
import { Icon } from '../common'
import LoadingSpinner from '../common/LoadingSpinner'
import { useDependencyGraph } from '../../hooks/useDependencyGraph'

import type { GraphNode, TreeNode } from '../../types/graph'

/** 詳細パネル幅のlocalStorageキー */
const DETAIL_PANEL_WIDTH_KEY = 'graph-detail-panel-width'
/** デフォルト幅 */
const DEFAULT_PANEL_WIDTH = 280
/** 最小幅 */
const MIN_PANEL_WIDTH = 200
/** 最大幅 */
const MAX_PANEL_WIDTH = 500

interface DependencyGraphProps {
  /** ファイルをエディタで開くハンドラ */
  onOpenFile: (path: string, name: string) => void
  /** ダークモードフラグ */
  darkMode: boolean
  /** 初期選択するファイルパス */
  initialSelectedPath?: string
}

/**
 * 依存関係グラフビューア
 *
 * CLAUDE.md、スキル、サブエージェント間の参照関係を
 * 階層ツリー形式で可視化するメインコンポーネント
 *
 * レイアウト:
 * - ヘッダー: タイトルとリフレッシュボタン
 * - メイン: 左側にツリー、右側に詳細パネル
 */
const DependencyGraph = memo<DependencyGraphProps>(({ onOpenFile, darkMode, initialSelectedPath }) => {
  const {
    nodes,
    edges,
    selectedNode,
    isLoading,
    error,
    selectNode,
    refresh,
    loadGraph,
    getNodeDetail,
    treeRoots,
    toggleExpand,
  } = useDependencyGraph()

  // 詳細パネルの幅（localStorageから復元）
  const [detailPanelWidth, setDetailPanelWidth] = useState(() => {
    const saved = localStorage.getItem(DETAIL_PANEL_WIDTH_KEY)
    return saved ? Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, parseInt(saved, 10))) : DEFAULT_PANEL_WIDTH
  })
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // 幅変更時にlocalStorageに保存
  const handleWidthChange = useCallback((newWidth: number) => {
    const clampedWidth = Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, newWidth))
    setDetailPanelWidth(clampedWidth)
    localStorage.setItem(DETAIL_PANEL_WIDTH_KEY, String(clampedWidth))
  }, [])

  // リサイズ開始
  const handleResizeStart = useCallback(() => {
    setIsResizing(true)
  }, [])

  // リサイズ処理
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return
      const containerRect = containerRef.current.getBoundingClientRect()
      // コンテナの右端からのマウス位置で幅を計算
      const newWidth = containerRect.right - e.clientX
      handleWidthChange(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      // リサイズ中はカーソルを固定
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, handleWidthChange])

  // コンポーネントマウント時にグラフを読み込む
  useEffect(() => {
    void loadGraph()
  }, [loadGraph])

  // グラフ読み込み完了後、initialSelectedPathに一致するノードを選択
  useEffect(() => {
    if (!isLoading && nodes.length > 0 && initialSelectedPath) {
      const node = nodes.find(n => n.path === initialSelectedPath)
      if (node) {
        selectNode(node)
      }
    }
  }, [isLoading, nodes, initialSelectedPath, selectNode])

  // 選択中のノードの詳細情報を取得
  const nodeDetail = useMemo(() => {
    if (!selectedNode) return null
    return getNodeDetail(selectedNode)
  }, [selectedNode, getNodeDetail])

  /**
   * ノード選択ハンドラ
   * TreeNodeからのシングルクリックで呼ばれる
   */
  const handleNodeSelect = useCallback((node: GraphNode | TreeNode | null) => {
    selectNode(node)
  }, [selectNode])

  /**
   * ノードダブルクリックハンドラ
   * エディタでファイルを開く
   */
  const handleNodeDoubleClick = useCallback((node: GraphNode | TreeNode) => {
    // ファイル名をパスから抽出
    const fileName = node.path.split('/').pop() || node.label
    onOpenFile(node.path, fileName)
  }, [onOpenFile])

  // ローディング状態
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-gray-900">
        <LoadingSpinner size="lg" label="グラフを読み込み中" />
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          依存関係を解析しています...
        </p>
      </div>
    )
  }

  // エラー状態
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-gray-900 p-8">
        <div className="text-red-500 dark:text-red-400 mb-4">
          <Icon name="error" className="size-12" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          グラフの読み込みに失敗しました
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center max-w-md">
          {error}
        </p>
        <button
          type="button"
          onClick={refresh}
          className="px-4 py-2 text-sm font-medium rounded-md
            bg-blue-500 text-white
            hover:bg-blue-600 active:bg-blue-700
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            dark:focus:ring-offset-gray-900
            transition-colors"
        >
          再読み込み
        </button>
      </div>
    )
  }

  // 空の状態（ノードがない）
  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-gray-900 p-8">
        <div className="text-gray-400 dark:text-gray-500 mb-4">
          <Icon name="link" className="size-16" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          依存関係がありません
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md">
          スキル、サブエージェント、CLAUDE.mdファイルが見つかりませんでした。
          ファイルツリーに設定ファイルを追加してください。
        </p>
        <button
          type="button"
          onClick={refresh}
          className="mt-4 px-4 py-2 text-sm text-blue-500 hover:text-blue-600
            dark:text-blue-400 dark:hover:text-blue-300
            focus:outline-none focus:underline transition-colors"
        >
          再読み込み
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <Icon name="link" className="size-5 text-blue-500" />
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            依存関係ツリー
          </h2>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({nodes.length}ノード, {edges.length}エッジ)
          </span>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="p-1.5 rounded-md text-gray-500 hover:text-gray-700
            dark:text-gray-400 dark:hover:text-gray-200
            hover:bg-gray-200 dark:hover:bg-gray-700
            focus:outline-none focus:ring-2 focus:ring-blue-500
            transition-colors"
          title="グラフを再読み込み"
          aria-label="グラフを再読み込み"
        >
          <Icon name="refresh" className="size-4" />
        </button>
      </div>

      {/* メインコンテンツ: ツリー + 詳細パネル */}
      <div ref={containerRef} className="flex flex-1 min-h-0 overflow-hidden">
        {/* ツリー（左側） */}
        <div className="flex-1 min-w-0 h-full overflow-hidden">
          <DependencyTree
            roots={treeRoots}
            selectedId={selectedNode?.id ?? null}
            onToggle={toggleExpand}
            onSelect={handleNodeSelect}
            onDoubleClick={handleNodeDoubleClick}
            darkMode={darkMode}
          />
        </div>

        {/* リサイザー */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="詳細パネルの幅を調整"
          aria-valuenow={detailPanelWidth}
          aria-valuemin={MIN_PANEL_WIDTH}
          aria-valuemax={MAX_PANEL_WIDTH}
          tabIndex={0}
          className="resizer"
          onMouseDown={handleResizeStart}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') {
              e.preventDefault()
              handleWidthChange(detailPanelWidth + 10)
            } else if (e.key === 'ArrowRight') {
              e.preventDefault()
              handleWidthChange(detailPanelWidth - 10)
            }
          }}
        />

        {/* 詳細パネル（右側） */}
        <NodeDetailPanel
          nodeDetail={nodeDetail}
          onNodeClick={handleNodeSelect}
          onOpenFile={onOpenFile}
          darkMode={darkMode}
          width={detailPanelWidth}
        />
      </div>
    </div>
  )
})

DependencyGraph.displayName = 'DependencyGraph'

export default DependencyGraph
