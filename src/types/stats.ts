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

// ============================================
// 統計詳細表示用の型定義
// ============================================

/**
 * 統計詳細の個別アイテム
 *
 * 統計パネルの各項目をクリックした時に表示される詳細リストの1項目
 */
export interface StatsDetailItem {
  /** 一意の識別子 */
  id: string
  /** 表示名 */
  name: string
  /** ファイルパス（オプション） */
  path?: string
  /** 説明文（オプション） */
  description?: string
  /** カテゴリ名（サブエージェント用） */
  category?: string
  /** 追加メタデータ（バージョン、サイズ、日時等） */
  metadata?: Record<string, string>
}

/**
 * 統計詳細の種類
 *
 * バックエンドAPIのdetail_typeパラメータに対応
 */
export type StatsDetailType =
  | 'skills'
  | 'subAgents'
  | 'categories'
  | 'mcpServers'
  | 'plugins'
  | 'backups'
  | 'totalFiles'

/**
 * 統計詳細のレスポンス型
 *
 * バックエンドから返される統計詳細データ
 */
export interface StatsDetail {
  /** 詳細の種類 */
  detailType: StatsDetailType
  /** アイテム一覧 */
  items: StatsDetailItem[]
  /** 総件数 */
  totalCount: number
}

/**
 * 統計タイプごとの表示情報
 *
 * UI表示用のラベル、アイコン、説明文を定義
 */
export interface StatsTypeInfo {
  /** 表示ラベル */
  label: string
  /** アイコン名（StatIconVariantと対応） */
  icon: string
  /** 説明文 */
  description: string
}

/**
 * 統計タイプと表示情報のマッピング
 *
 * 各統計タイプに対応する日本語ラベルとアイコン情報
 */
export const STATS_TYPE_INFO: Record<StatsDetailType, StatsTypeInfo> = {
  skills: {
    label: 'スキル',
    icon: 'skills',
    description: 'インストールされているスキル一覧',
  },
  subAgents: {
    label: 'サブエージェント',
    icon: 'agents',
    description: 'カテゴリ別のサブエージェント一覧',
  },
  categories: {
    label: 'カテゴリ',
    icon: 'categories',
    description: 'エージェントのカテゴリ一覧',
  },
  mcpServers: {
    label: 'MCPサーバー',
    icon: 'servers',
    description: '設定されているMCPサーバー一覧',
  },
  plugins: {
    label: 'プラグイン',
    icon: 'plugins',
    description: 'インストールされているプラグイン一覧',
  },
  backups: {
    label: 'バックアップ',
    icon: 'backups',
    description: '保存されているバックアップ一覧',
  },
  totalFiles: {
    label: '総ファイル数',
    icon: 'files',
    description: '管理対象のファイル一覧',
  },
}