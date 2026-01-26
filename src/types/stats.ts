/**
 * 統計データの型定義
 *
 * ダッシュボードの統計パネルで使用する型を定義
 */

/**
 * メイン統計データ
 *
 * Claude設定ファイルから集計される各種カウント情報
 */
export interface Stats {
  // メイン統計
  /** サブエージェント数 */
  subAgentCount: number
  /** カテゴリ数 */
  categoryCount: number
  /** スキル数 */
  skillCount: number
  /** MCPサーバー数 */
  mcpServerCount: number
  /** プラグイン数 */
  pluginCount: number

  // システム情報
  /** バックアップ数 */
  backupCount: number
  /** 総ファイル数 */
  totalFileCount: number
  /** 最終更新日時（ISO 8601形式） */
  lastUpdated: string | null
}

/**
 * 統計カードのデータ
 *
 * 個別の統計項目を表示するカードコンポーネント用
 */
export interface StatCardData {
  /** 一意の識別子 */
  id: string
  /** 表示ラベル */
  label: string
  /** 数値 */
  value: number
  /** 補足情報（オプション） */
  subInfo?: string
  /** アイコン名（オプション） */
  icon?: string
}

/**
 * 統計パネルの状態
 *
 * UIの折りたたみ状態などを管理
 */
export interface StatsPanelState {
  /** パネルが折りたたまれているか */
  isCollapsed: boolean
}
