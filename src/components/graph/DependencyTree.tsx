/**
 * 依存関係ツリーコンポーネント
 *
 * ツリー全体を表示するコンテナコンポーネント。
 * GraphCanvasの代わりに使用される階層的なツリービュー。
 */
import { memo, useCallback } from 'react'

import TreeNode from './TreeNode'
import { Icon } from '../common'

import type { TreeNode as TreeNodeType } from '../../types/graph'

// ============================================================
// 型定義
// ============================================================

interface DependencyTreeProps {
  /** ルートノード一覧 */
  roots: TreeNodeType[]
  /** 選択中のノードID */
  selectedId: string | null
  /** 展開/折りたたみトグル */
  onToggle: (nodeId: string) => void
  /** ノード選択 */
  onSelect: (node: TreeNodeType) => void
  /** ダブルクリックでファイルを開く */
  onDoubleClick: (node: TreeNodeType) => void
  /** ダークモード */
  darkMode: boolean
}

// ============================================================
// コンポーネント
// ============================================================

/**
 * 依存関係ツリーコンポーネント
 *
 * CLAUDE.md、スキル、サブエージェント間の参照関係を
 * 階層的なツリー形式で表示する。
 *
 * レイアウト:
 * - ツールバー: 「すべて展開」「すべて折りたたみ」ボタン
 * - ツリー本体: TreeNodeコンポーネントで再帰的に描画
 */
const DependencyTree = memo<DependencyTreeProps>(({
  roots,
  selectedId,
  onToggle,
  onSelect,
  onDoubleClick,
  darkMode,
}) => {
  /**
   * すべてのノードを展開する
   * ルートノードから再帰的に全ノードをトグル（展開状態にする）
   */
  const handleExpandAll = useCallback(() => {
    const expandNode = (node: TreeNodeType) => {
      if (!node.isExpanded && node.children.length > 0) {
        onToggle(node.id)
      }
      node.children.forEach(expandNode)
    }
    roots.forEach(expandNode)
  }, [roots, onToggle])

  /**
   * すべてのノードを折りたたむ
   * ルートノードから再帰的に全ノードをトグル（折りたたみ状態にする）
   */
  const handleCollapseAll = useCallback(() => {
    const collapseNode = (node: TreeNodeType) => {
      if (node.isExpanded) {
        onToggle(node.id)
      }
      node.children.forEach(collapseNode)
    }
    roots.forEach(collapseNode)
  }, [roots, onToggle])

  // 空の状態
  if (roots.length === 0) {
    return (
      <div
        className={`
          flex flex-col items-center justify-center h-full p-8
          ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}
        `}
      >
        <div className={`mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
          <Icon name="link" className="w-12 h-12" />
        </div>
        <p
          className={`
            text-sm text-center
            ${darkMode ? 'text-gray-400' : 'text-gray-500'}
          `}
        >
          ノードがありません
        </p>
      </div>
    )
  }

  return (
    <div
      className={`
        flex flex-col h-full
        ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}
      `}
    >
      {/* ツールバー */}
      <div
        className={`
          flex items-center gap-2 px-3 py-2
          border-b flex-shrink-0
          ${darkMode
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
          }
        `}
      >
        <button
          type="button"
          onClick={handleExpandAll}
          className={`
            px-3 py-1.5 text-xs font-medium rounded-md
            flex items-center gap-1.5
            transition-colors
            ${darkMode
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }
          `}
          title="すべて展開"
        >
          <Icon name="chevronDown" className="w-3.5 h-3.5" />
          すべて展開
        </button>
        <button
          type="button"
          onClick={handleCollapseAll}
          className={`
            px-3 py-1.5 text-xs font-medium rounded-md
            flex items-center gap-1.5
            transition-colors
            ${darkMode
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }
          `}
          title="すべて折りたたみ"
        >
          <Icon name="chevronRight" className="w-3.5 h-3.5" />
          すべて折りたたみ
        </button>
      </div>

      {/* ツリー本体 */}
      <div
        className={`
          flex-1 overflow-y-auto overflow-x-hidden
          py-2
          ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}
        `}
      >
        {roots.map((rootNode) => (
          <TreeNode
            key={rootNode.id}
            node={rootNode}
            selectedId={selectedId}
            onToggle={onToggle}
            onSelect={onSelect}
            onDoubleClick={onDoubleClick}
            darkMode={darkMode}
          />
        ))}
      </div>
    </div>
  )
})

DependencyTree.displayName = 'DependencyTree'

export default DependencyTree
