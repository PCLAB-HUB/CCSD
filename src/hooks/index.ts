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

// 差分表示
export { useDiff } from './useDiff'

// テンプレート機能
export { useTemplate } from './useTemplate'

// バックアップ機能
export { useBackup } from './useBackup'

// キーボードショートカット
export { useKeyboardShortcuts } from './useKeyboardShortcuts'

// Markdownプレビュー
export { useMarkdownPreview } from './useMarkdownPreview'

// インポート機能
export { useImport } from './useImport'

// Monaco Editor関連
export { useMonacoEditor } from './useMonacoEditor'

// 検索ハイライト
export { useSearchHighlight } from './useSearchHighlight'

// 型のre-export（types/から一元管理）
export type {
  Message,
  SelectedFile,
  SearchHighlight,
} from '../types'
