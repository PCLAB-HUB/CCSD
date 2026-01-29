/**
 * グラフ関連の定数を一元管理
 *
 * 依存関係グラフの可視化に使用される色、スタイル、アイコン等の定数を
 * このファイルで一括管理し、コンポーネント間の一貫性を保つ
 */

import type { NodeType, EdgeType, EdgeStyle } from '../types/graph'
import type { IconName } from '../components/common/Icon'

// ============================================================
// ノード色定義
// ============================================================

/**
 * ノードタイプごとの色定義
 *
 * デザインドキュメントに準拠:
 * - CLAUDE.md: 青 (blue-500)
 * - スキル: 緑 (emerald-500)
 * - サブエージェント: オレンジ (orange-500)
 * - 不明: グレー (gray-500)
 */
export const NODE_COLORS: Record<NodeType, string> = {
  'claude-md': '#3b82f6', // blue-500
  skill: '#10b981', // emerald-500
  subagent: '#F97316', // orange-500
  unknown: '#6b7280', // gray-500
} as const

// ============================================================
// ノードラベル定義
// ============================================================

/**
 * ノードタイプの日本語ラベル
 *
 * UIで表示する際の人間が読めるラベル
 */
export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  'claude-md': 'CLAUDE.md',
  skill: 'スキル',
  subagent: 'サブエージェント',
  unknown: '不明',
} as const

// ============================================================
// エッジスタイル定義
// ============================================================

/**
 * エッジタイプごとのスタイル定義
 *
 * - direct: 実線（明示的な参照）
 * - mention: 点線（テキスト内での言及）
 * - broken: 赤い破線（壊れた参照）
 */
export const EDGE_STYLES: Record<EdgeType, EdgeStyle> = {
  direct: {
    stroke: '#64748b', // slate-500
  },
  mention: {
    stroke: '#94a3b8', // slate-400
    dashArray: '4 2',
  },
  broken: {
    stroke: '#ef4444', // red-500
    dashArray: '2 2',
  },
} as const

// ============================================================
// ノードアイコン定義
// ============================================================

/**
 * ノードタイプごとのアイコンマッピング
 *
 * TreeNodeコンポーネントで各ノードタイプを視覚的に区別するために使用
 */
export const NODE_TYPE_ICONS: Record<NodeType, IconName> = {
  'claude-md': 'document',
  skill: 'code',
  subagent: 'robot',
  unknown: 'info',
} as const

// ============================================================
// レイアウト定数
// ============================================================

/**
 * ツリービューのインデント幅（px）
 *
 * 各階層レベルごとのインデント量を定義
 */
export const INDENT_SIZE = 16

// ============================================================
// バッジスタイル定義
// ============================================================

/**
 * ノードタイプバッジのスタイル定義
 *
 * NodeDetailPanelでノードタイプを表示するバッジのスタイル
 * ライトモードとダークモードの両方に対応
 */
export const NODE_TYPE_BADGE_STYLES = {
  light: {
    'claude-md': 'bg-blue-100 text-blue-700',
    skill: 'bg-emerald-100 text-emerald-700',
    subagent: 'bg-violet-100 text-violet-700',
    unknown: 'bg-gray-200 text-gray-600',
  },
  dark: {
    'claude-md': 'bg-blue-900/50 text-blue-300',
    skill: 'bg-emerald-900/50 text-emerald-300',
    subagent: 'bg-violet-900/50 text-violet-300',
    unknown: 'bg-gray-700 text-gray-300',
  },
} as const satisfies Record<'light' | 'dark', Record<NodeType, string>>

/**
 * バッジの基本スタイル（共通部分）
 *
 * NODE_TYPE_BADGE_STYLESと組み合わせて使用
 */
export const BADGE_BASE_STYLE = 'px-2 py-0.5 text-xs font-medium rounded-full'
