/**
 * @fileoverview Tauri API統合エクスポート（後方互換性用）
 * @module hooks/useTauri
 * @deprecated このファイルは後方互換性のために維持されています。
 *             新しいコードでは '@/hooks/tauri' から直接インポートしてください。
 *
 * @example
 * // 推奨: 新しいインポートパス
 * import { getFileTree, readFile, isTauri } from '@/hooks/tauri'
 *
 * // 非推奨: 旧インポートパス（引き続き動作します）
 * import { getFileTree, readFile, isTauri } from '@/hooks/useTauri'
 */

// 全てのエクスポートを再エクスポート
export * from './tauri'
