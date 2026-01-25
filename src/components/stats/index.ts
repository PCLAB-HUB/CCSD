/**
 * Stats Components
 *
 * 統計情報を表示するためのコンポーネント群
 * アクセシビリティ対応（WCAG 2.1 AA準拠）
 *
 * - StatsPanel: 折りたたみ可能なパネルコンテナ（セマンティックHTML、スキップリンク対応）
 * - StatCard: 個別の統計値を表示するカード（dl/dt/dd構造、キーボードフォーカス対応）
 * - StatsMetaInfo: システム情報表示（time要素、機械可読日時）
 */
export { StatsPanel, type StatItem } from './StatsPanel'
export { StatCard, type StatIconVariant } from './StatCard'
export { StatsMetaInfo } from './StatsMetaInfo'
