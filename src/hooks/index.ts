/**
 * カスタムフックのエクスポート
 * 各フックは単一責任の原則に従い、特定の機能のみを管理する
 */

// Tauri API関連
export * from './useTauri'

// UI状態管理
export { useUIState } from './useUIState'

// ファイル管理
export { useFileManager } from './useFileManager'

// 検索機能
export { useSearch } from './useSearch'

// 検索・置換機能
export { useSearchReplace } from './useSearchReplace'
export type {
  ReplacePreview,
  ReplaceResult,
  SearchMatch,
  SearchReplaceOptions,
} from './useSearchReplace'

// 差分表示
export { useDiff } from './useDiff'

// 依存関係グラフ
export { useDependencyGraph } from './useDependencyGraph'

// ツリーフィルター
export { useTreeFilter } from './useTreeFilter'
export type { UseTreeFilterReturn } from './useTreeFilter'

// テンプレート機能
export { useTemplate } from './useTemplate'

// バックアップ機能
export { useBackup } from './useBackup'

// キーボードショートカット
export { useKeyboardShortcuts } from './useKeyboardShortcuts'

// Markdownプレビュー
export { useMarkdownPreview } from './useMarkdownPreview'

// プレビューウィンドウ
export { usePreviewWindow } from './usePreviewWindow'

// インポート機能
export { useImport } from './useImport'

// Monaco Editor関連
export { useMonacoEditor } from './useMonacoEditor'

// 検索ハイライト
export { useSearchHighlight } from './useSearchHighlight'

// 統計データ
export { useStats } from './useStats'

// お気に入り機能
export { useFavorites } from './useFavorites'

// タブエディタ
export { useTabEditor } from './useTabEditor'

// ベストプラクティスリンター
export { useLinter, lint } from './useLinter'
export type {
  LinterRule,
  LinterIssue,
  LinterResult,
  LinterConfig,
} from './useLinter'

// AIレビュー機能
export { useAIReview } from './useAIReview'
export type { UseAIReviewReturn } from './useAIReview'

// App.tsx用の統合フック
export {
  useAppSearchReplace,
  useAppAIReview,
  useAppKeyboardShortcuts,
} from './app'
export type {
  UseAppSearchReplaceReturn,
  UseAppAIReviewReturn,
  AIReviewPanelResult,
  AIReviewPanelSuggestion,
} from './app'

// 型のre-export（types/から一元管理）
export type {
  Message,
  SelectedFile,
  SearchHighlight,
} from '../types'
