/**
 * ターミナル関連の型定義
 * @module types/terminal
 *
 * 内蔵ターミナル機能のための型を定義
 */

// ============================================================
// 基本型
// ============================================================

/**
 * ターミナルの状態
 *
 * - idle: コマンド実行待機中
 * - running: コマンド実行中
 * - error: エラー状態
 */
export type TerminalStatus = 'idle' | 'running' | 'error'

/**
 * ターミナル設定
 *
 * PTY（疑似端末）の初期化に使用
 */
export interface TerminalConfig {
  /** 表示行数 */
  rows: number
  /** 表示列数 */
  cols: number
  /** 作業ディレクトリ（オプション） */
  cwd?: string
}

// ============================================================
// クイックコマンド関連
// ============================================================

/**
 * クイックコマンドのID（ブランド型）
 */
export type QuickCommandId = string & { readonly __brand: 'QuickCommandId' }

/**
 * クイックコマンド
 *
 * ワンクリックで実行できる定型コマンド
 */
export interface QuickCommand {
  /** コマンドの一意識別子 */
  id: string
  /** 表示ラベル */
  label: string
  /** 実行するコマンド */
  command: string
  /** アイコン（オプション、絵文字やシンボル） */
  icon?: string
  /** ビルトインコマンドかどうか */
  isBuiltIn: boolean
}

/**
 * クイックコマンドの作成入力
 */
export interface CreateQuickCommandInput {
  /** 表示ラベル */
  label: string
  /** 実行するコマンド */
  command: string
  /** アイコン（オプション） */
  icon?: string
}

// ============================================================
// コマンド履歴関連
// ============================================================

/**
 * コマンド履歴アイテム
 */
export interface CommandHistoryItem {
  /** 履歴の一意識別子 */
  id: string
  /** 実行されたコマンド */
  command: string
  /** 実行日時（Unixタイムスタンプ） */
  timestamp: number
}

/**
 * コマンド履歴の状態
 */
export interface CommandHistoryState {
  /** 履歴アイテムの配列 */
  items: CommandHistoryItem[]
  /** 現在選択中のインデックス（-1は未選択） */
  currentIndex: number
}

// ============================================================
// ターミナルパネル関連
// ============================================================

/**
 * ターミナルパネルのタブ種類
 */
export type TerminalTabType = 'terminal' | 'output'

/**
 * ターミナルパネルの状態
 *
 * パネルの表示状態とサイズを管理
 */
export interface TerminalPanelState {
  /** パネルが開いているかどうか */
  isOpen: boolean
  /** パネルの高さ（ピクセル） */
  height: number
  /** アクティブなタブ */
  activeTab: TerminalTabType
}

/**
 * ターミナル出力アイテム
 */
export interface TerminalOutputItem {
  /** 出力の一意識別子 */
  id: string
  /** 出力種別 */
  type: 'stdout' | 'stderr' | 'system'
  /** 出力内容 */
  content: string
  /** 出力日時（Unixタイムスタンプ） */
  timestamp: number
}

// ============================================================
// フック関連の型
// ============================================================

/**
 * useTerminalフックの状態
 */
export interface TerminalState {
  /** ターミナルの状態 */
  status: TerminalStatus
  /** 出力バッファ */
  output: TerminalOutputItem[]
  /** コマンド履歴 */
  history: CommandHistoryState
  /** クイックコマンド一覧 */
  quickCommands: QuickCommand[]
  /** パネルの状態 */
  panel: TerminalPanelState
}

/**
 * useTerminalフックのアクション
 */
export interface TerminalActions {
  /** コマンドを実行 */
  executeCommand: (command: string) => Promise<void>
  /** 実行中のコマンドをキャンセル */
  cancelCommand: () => void
  /** 出力をクリア */
  clearOutput: () => void
  /** クイックコマンドを追加 */
  addQuickCommand: (input: CreateQuickCommandInput) => void
  /** クイックコマンドを削除 */
  removeQuickCommand: (id: string) => void
  /** パネルを開閉 */
  togglePanel: () => void
  /** パネルの高さを変更 */
  setPanelHeight: (height: number) => void
  /** アクティブタブを変更 */
  setActiveTab: (tab: TerminalTabType) => void
  /** コマンド履歴をナビゲート */
  navigateHistory: (direction: 'up' | 'down') => string | null
}

/**
 * useTerminalフックの戻り値
 */
export interface UseTerminalReturn extends TerminalState, TerminalActions {
  /** 現在の作業ディレクトリ */
  currentDirectory: string | null
  /** ターミナルがアイドル状態かどうか */
  isIdle: boolean
  /** コマンド実行中かどうか */
  isRunning: boolean
}

// ============================================================
// 定数
// ============================================================

/**
 * デフォルトのクイックコマンド
 */
export const DEFAULT_QUICK_COMMANDS: QuickCommand[] = [
  {
    id: 'claude',
    label: 'Claude',
    command: 'claude',
    icon: '▶',
    isBuiltIn: true,
  },
  {
    id: 'resume',
    label: 'Resume',
    command: 'claude --resume',
    icon: '↩',
    isBuiltIn: true,
  },
]

/**
 * デフォルトのターミナル設定
 */
export const DEFAULT_TERMINAL_CONFIG: TerminalConfig = {
  rows: 24,
  cols: 80,
}

/**
 * デフォルトのパネル高さ（ピクセル）
 */
export const DEFAULT_PANEL_HEIGHT = 300

/**
 * パネル高さの最小値（ピクセル）
 */
export const MIN_PANEL_HEIGHT = 150

/**
 * パネル高さの最大値（ピクセル）
 */
export const MAX_PANEL_HEIGHT = 600

/**
 * コマンド履歴の最大保持件数
 */
export const MAX_COMMAND_HISTORY = 100

/**
 * localStorage / sessionStorage キー
 */
export const TERMINAL_STORAGE_KEYS = {
  /** パネルの高さ */
  PANEL_HEIGHT: 'terminal-panel-height',
  /** カスタムクイックコマンド */
  CUSTOM_COMMANDS: 'terminal-custom-commands',
  /** コマンド履歴 */
  COMMAND_HISTORY: 'terminal-command-history',
  /** パネルの開閉状態 */
  PANEL_OPEN: 'terminal-panel-open',
  /** アクティブタブ */
  ACTIVE_TAB: 'terminal-active-tab',
} as const

/**
 * ストレージキーの型
 */
export type TerminalStorageKey = (typeof TERMINAL_STORAGE_KEYS)[keyof typeof TERMINAL_STORAGE_KEYS]

// ============================================================
// ユーティリティ関数
// ============================================================

/**
 * クイックコマンドIDを生成
 * @param label - コマンドのラベル
 * @returns 一意のID
 */
export function createQuickCommandId(label: string): string {
  const timestamp = Date.now()
  const normalized = label.toLowerCase().replace(/\s+/g, '-')
  return `custom-${normalized}-${timestamp}`
}

/**
 * コマンド履歴アイテムIDを生成
 * @returns 一意のID
 */
export function createCommandHistoryId(): string {
  return `history-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * 出力アイテムIDを生成
 * @returns 一意のID
 */
export function createOutputItemId(): string {
  return `output-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * デフォルトのパネル状態を取得
 * @returns デフォルトのTerminalPanelState
 */
export function createDefaultPanelState(): TerminalPanelState {
  return {
    isOpen: false,
    height: DEFAULT_PANEL_HEIGHT,
    activeTab: 'terminal',
  }
}

/**
 * デフォルトの履歴状態を取得
 * @returns デフォルトのCommandHistoryState
 */
export function createDefaultHistoryState(): CommandHistoryState {
  return {
    items: [],
    currentIndex: -1,
  }
}

/**
 * パネル高さを有効範囲内に制限
 * @param height - 設定したい高さ
 * @returns 制限後の高さ
 */
export function clampPanelHeight(height: number): number {
  return Math.min(Math.max(height, MIN_PANEL_HEIGHT), MAX_PANEL_HEIGHT)
}

/**
 * コマンド履歴を最大件数に制限
 * @param items - 履歴アイテムの配列
 * @returns 制限後の配列
 */
export function limitCommandHistory(items: CommandHistoryItem[]): CommandHistoryItem[] {
  if (items.length <= MAX_COMMAND_HISTORY) {
    return items
  }
  // 古いものから削除（新しいものを残す）
  return items.slice(-MAX_COMMAND_HISTORY)
}

/**
 * クイックコマンドがビルトインかどうかを判定
 * @param command - クイックコマンド
 * @returns ビルトインの場合true
 */
export function isBuiltInCommand(command: QuickCommand): boolean {
  return command.isBuiltIn
}

/**
 * カスタムコマンドのみをフィルタリング
 * @param commands - クイックコマンドの配列
 * @returns カスタムコマンドのみの配列
 */
export function getCustomCommands(commands: QuickCommand[]): QuickCommand[] {
  return commands.filter(cmd => !cmd.isBuiltIn)
}
