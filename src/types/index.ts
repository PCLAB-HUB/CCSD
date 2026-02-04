/**
 * 型定義のエントリポイント
 *
 * 全ての型定義をここからre-exportして、インポートを簡潔にする
 */

// ファイル関連
export type {
  FileType,
  FileNode,
  FileContent,
  BackupInfo,
  ImportResult,
  FileExistsInfo,
  ZipFileInfo,
} from './files'

// エディタ関連
export type { SelectedFile, SearchHighlight, MessageType, Message } from './editor'

// バリデーション関連
export type {
  ValidationSeverity,
  ValidationSource,
  ValidationError,
  ValidationResult,
} from './validation'

// テンプレート関連
export type {
  TemplateCategory,
  TemplateField,
  Template,
  CustomTemplate,
  SaveTemplateInput,
  UnifiedTemplate,
} from './templates'
export { isCustomTemplate } from './templates'

// 統計関連
export type {
  Stats,
  StatCardData,
  StatsPanelState,
  StatsDetailItem,
  StatsDetailType,
  StatsDetail,
  StatsTypeInfo,
} from './stats'
export { STATS_TYPE_INFO } from './stats'

// タブエディタ関連（現行版 + 拡張版）
export type {
  // 現行版
  Tab,
  TabPersistData,
  TabEditorState,
  TabEditorActions,
  UseTabEditorReturn,
  // 拡張版
  TabId,
  TabStatus,
  TabExtended,
  TabStateExtended,
  CreateTabInput,
  UpdateTabInput,
  ReorderTabsInput,
  TabPersistDataExtended,
  TabAction,
  TabContextMenuItem,
  TabBarSettings,
  TabEditorActionsExtended,
  UseTabEditorExtendedReturn,
} from './tabs'
export {
  createTabId,
  isTabModified,
  getUnsavedTabs,
  sortTabsByPinned,
  isTabModifiedSimple,
} from './tabs'

// お気に入り関連（現行版 + 拡張版）
export type {
  // 現行版
  FavoriteItem,
  FavoritesData,
  FavoritesDataRust,
  FavoriteActions,
  // 拡張版
  FavoriteId,
  FavoriteType,
  FavoriteColor,
  FavoriteGroupId,
  FavoriteItemExtended,
  FavoriteGroup,
  FavoriteStateExtended,
  AddFavoriteInput,
  UpdateFavoriteInput,
  ReorderFavoriteInput,
  CreateFavoriteGroupInput,
  FavoritesPersistData,
  FavoritesDataExtendedRust,
  FavoriteAction,
  FavoriteActionsExtended,
  UseFavoritesExtendedReturn,
} from './favorites'
export {
  createFavoriteId,
  createFavoriteGroupId,
  isFavoriteItem,
  groupFavorites,
  convertFromRustExtended,
} from './favorites'

// リンター関連
export type {
  LintRuleId,
  LintSeverity,
  LintCategory,
  LintRule,
  LintResult,
  LintFix,
  LintSuggestion,
  LintRange,
  FileLintResults,
  LintSummary,
  LinterConfig,
  LinterState,
  LinterAction,
  BuiltInRuleSet,
} from './linter'
export {
  createLintRuleId,
  countLintResults,
  filterBySeverity,
} from './linter'

// AIレビュー関連（現行版 + 拡張版）
export type {
  // 現行版
  SuggestionSeverity,
  SuggestionCategory,
  ReviewSuggestion,
  ReviewScore,
  AIReviewResult,
  AIReviewStatus,
  AIReviewError,
  APIKeyModalState,
  // 拡張版
  ReviewRequestId,
  ReviewType,
  ReviewFocus,
  ReviewSuggestionExtended,
  AIReviewResultExtended,
  AIReviewStateExtended,
  ReviewRequest,
  ReviewHistoryItem,
  AIReviewErrorCode,
  AIReviewErrorExtended,
  AIReviewSettings,
  AIReviewModel,
  CreateReviewRequestInput,
  ApplySuggestionResult,
  AIReviewAction,
  AIReviewActionsExtended,
  UseAIReviewExtendedReturn,
} from './aiReview'
export {
  CATEGORY_META,
  SEVERITY_META,
  createReviewRequestId,
  getScoreGrade,
  getScoreColor,
  sortBySeverity,
  getUnappliedSuggestions,
  groupByCategory,
  DEFAULT_AI_REVIEW_SETTINGS,
} from './aiReview'

// 検索・置換関連
export type {
  SearchReplaceMode,
  SearchReplaceOptions,
  SearchMatch,
  SearchMatchDisplay,
  SearchMatchExtended,
  SearchMatchContext,
  ReplaceResult,
  ReplacePreview,
  SingleReplaceResult,
  SearchReplaceState,
  SearchReplaceActions,
  UseSearchReplaceReturn,
} from './searchReplace'
export {
  DEFAULT_SEARCH_OPTIONS,
  DEFAULT_SEARCH_REPLACE_STATE,
  getRegexFlags,
  escapeRegex,
  buildSearchRegex,
  getHighlightRange,
  isValidMatchIndex,
} from './searchReplace'

// グラフ関連（依存関係可視化）
export type {
  NodeType,
  EdgeType,
  GraphNode,
  GraphEdge,
  GraphState,
  ReferenceMatch,
  NodeDetail,
  EdgeStyle,
} from './graph'
export {
  NODE_COLORS,
  EDGE_STYLES,
  getNodeColor,
  getEdgeStyle,
  createGraphNodeId,
  createGraphEdgeId,
  isNodeType,
  isBrokenEdge,
  getBrokenEdges,
  getRelatedEdges,
  getInDegree,
  getOutDegree,
  createDefaultGraphState,
} from './graph'

// ツリーフィルタ関連
export type {
  FilterType,
  FilterState,
  FilterConfig,
  FilterConfigMap,
  TreeFilterActions,
  UseTreeFilterReturn,
} from './treeFilter'
export {
  FILTER_TYPES,
  isFilterType,
  DEFAULT_FILTER_STATE,
  isDefaultFilterState,
  getActiveFilterCount,
  resetFilterState,
} from './treeFilter'

// GitHub API関連
export type {
  GitHubOwner,
  GitHubRepository,
  GitHubSearchResponse,
  GitHubReposState,
  UseGitHubReposReturn,
  GitHubCacheData,
  GitHubErrorType,
  GitHubError,
} from './github'
export {
  GITHUB_CACHE_DURATION_MS,
  GITHUB_SEARCH_API_URL,
  GITHUB_DEFAULT_SEARCH_QUERY,
  GITHUB_RESULTS_PER_PAGE,
  isCacheValid,
  translateGitHubError,
  formatStarCount,
  LANGUAGE_COLORS,
  getLanguageColor,
} from './github'

// ターミナル関連
export type {
  TerminalStatus,
  TerminalConfig,
  QuickCommandId,
  QuickCommand,
  CreateQuickCommandInput,
  CommandHistoryItem,
  CommandHistoryState,
  TerminalTabType,
  TerminalPanelState,
  TerminalOutputItem,
  TerminalState,
  TerminalActions,
  UseTerminalReturn,
  TerminalStorageKey,
} from './terminal'
export {
  DEFAULT_QUICK_COMMANDS,
  DEFAULT_TERMINAL_CONFIG,
  DEFAULT_PANEL_HEIGHT,
  MIN_PANEL_HEIGHT,
  MAX_PANEL_HEIGHT,
  MAX_COMMAND_HISTORY,
  TERMINAL_STORAGE_KEYS,
  createQuickCommandId,
  createCommandHistoryId,
  createOutputItemId,
  createDefaultPanelState,
  createDefaultHistoryState,
  clampPanelHeight,
  limitCommandHistory,
  isBuiltInCommand,
  getCustomCommands,
} from './terminal'
