/**
 * App.tsx用の統合カスタムフック
 *
 * これらのフックはApp.tsxの複雑なロジックを分離し、
 * 各機能の責務を明確にするために使用される
 */

// 検索＆置換統合フック
export { useAppSearchReplace } from './useAppSearchReplace'
export type { UseAppSearchReplaceReturn } from './useAppSearchReplace'

// AIレビュー統合フック
export { useAppAIReview } from './useAppAIReview'
export type {
  UseAppAIReviewReturn,
  AIReviewPanelResult,
  AIReviewPanelSuggestion,
} from './useAppAIReview'

// 統合キーボードショートカットフック
export { useAppKeyboardShortcuts } from './useAppKeyboardShortcuts'
