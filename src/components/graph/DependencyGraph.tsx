import { memo, useCallback, useEffect, useMemo } from 'react'

import GraphCanvas from './GraphCanvas'
import GraphLegend from './GraphLegend'
import NodeDetailPanel from './NodeDetailPanel'
import { Icon } from '../common'
import LoadingSpinner from '../common/LoadingSpinner'
import { useDependencyGraph } from '../../hooks/useDependencyGraph'

import type { GraphNode } from '../../types/graph'

interface DependencyGraphProps {
  /** ファイルをエディタで開くハンドラ */
  onOpenFile: (path: string, name: string) => void
  /** ダークモードフラグ */
  darkMode: boolean
}

/**
 * 依存関係グラフビューア
 *
 * CLAUDE.md、スキル、サブエージェント間の参照関係を
 * フォースレイアウトグラフで可視化するメインコンポーネント
 *
 * レイアウト:
 * - ヘッダー: タイトルとリフレッシュボタン
 * - メイン: 左側にグラフキャンバス、右側に詳細パネル
 * - フッター: 凡例
 */
const DependencyGraph = memo<DependencyGraphProps>(({ onOpenFile, darkMode }) => {
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
  } = useDependencyGraph()

  // コンポーネントマウント時にグラフを読み込む
  useEffect(() => {
    void loadGraph()
  }, [loadGraph])

  // 選択中のノードの詳細情報を取得
  const nodeDetail = useMemo(() => {
    if (!selectedNode) return null
    return getNodeDetail(selectedNode)
  }, [selectedNode, getNodeDetail])

  /**
   * ノード選択ハンドラ
   * GraphCanvasからのシングルクリックで呼ばれる
   */
  const handleNodeSelect = useCallback((node: GraphNode | null) => {
    selectNode(node)
  }, [selectNode])

  /**
   * ノードダブルクリックハンドラ
   * エディタでファイルを開く
   */
  const handleNodeDoubleClick = useCallback((node: GraphNode) => {
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
          <svg
            className="size-16"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
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
          <svg
            className="size-5 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            依存関係グラフ
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

      {/* メインコンテンツ: グラフ + 詳細パネル */}
      <div className="flex flex-1 min-h-0">
        {/* グラフキャンバス（左側） */}
        <div className="flex-1 min-w-0">
          <GraphCanvas
            nodes={nodes}
            edges={edges}
            selectedNode={selectedNode}
            onSelectNode={handleNodeSelect}
            onDoubleClickNode={handleNodeDoubleClick}
            darkMode={darkMode}
          />
        </div>

        {/* 詳細パネル（右側） */}
        <div className="w-64 flex-shrink-0">
          <NodeDetailPanel
            nodeDetail={nodeDetail}
            onNodeClick={handleNodeSelect}
            onOpenFile={(path, name) => onOpenFile(path, name)}
            darkMode={darkMode}
          />
        </div>
      </div>

      {/* 凡例（フッター） */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
        <GraphLegend darkMode={darkMode} />
      </div>
    </div>
  )
})

DependencyGraph.displayName = 'DependencyGraph'

export default DependencyGraph
