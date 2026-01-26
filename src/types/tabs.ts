/**
 * タブエディタ関連の型定義
 *
 * 複数ファイルの同時編集を実現するタブ機能の型を定義
 */

// ============================================================
// 基本型（現行版との後方互換性を維持）
// ============================================================

/**
 * 個別のタブ（現行版）
 *
 * 現在のuseTabEditorで使用されているシンプルな型
 */
export interface Tab {
  /** 一意の識別子（ファイルパスを使用） */
  id: string
  /** ファイルパス */
  path: string
  /** ファイル名 */
  name: string
  /** ファイル内容 */
  content: string
  /** 元のファイル内容（保存済み状態） */
  originalContent: string
  /** タブを開いた順序 */
  order: number
}

/**
 * タブの永続化用データ（localStorageに保存）- 現行版
 */
export interface TabPersistData {
  /** タブ一覧 */
  tabs: Omit<Tab, 'order'>[]
  /** アクティブタブのID */
  activeTabId: string | null
  /** 保存日時 */
  savedAt: string
}

/**
 * タブエディタの状態（現行版）
 */
export interface TabEditorState {
  /** 全タブ */
  tabs: Tab[]
  /** アクティブタブのID */
  activeTabId: string | null
}

/**
 * タブエディタの操作（現行版）
 */
export interface TabEditorActions {
  /** ファイルを開く（タブを追加） */
  openTab: (path: string, name: string, content: string) => void
  /** タブを閉じる */
  closeTab: (tabId: string) => boolean
  /** アクティブタブを切り替え */
  setActiveTab: (tabId: string) => void
  /** タブを並べ替え */
  reorderTabs: (fromIndex: number, toIndex: number) => void
  /** タブの内容を更新 */
  updateTabContent: (tabId: string, content: string) => void
  /** タブを保存済み状態にマーク */
  markTabAsSaved: (tabId: string) => void
  /** 全タブを閉じる */
  closeAllTabs: () => boolean
  /** 保存済みタブのみ閉じる */
  closeSavedTabs: () => void
  /** 他のタブを閉じる */
  closeOtherTabs: (tabId: string) => boolean
}

/**
 * useTabEditorの戻り値（現行版）
 */
export interface UseTabEditorReturn extends TabEditorState, TabEditorActions {
  /** アクティブタブのデータ */
  activeTab: Tab | null
  /** 未保存のタブがあるか */
  hasUnsavedTabs: boolean
  /** 未保存のタブ一覧 */
  unsavedTabs: Tab[]
  /** 特定のタブが未保存か判定 */
  isTabUnsaved: (tabId: string) => boolean
}

// ============================================================
// 拡張型（新機能用）
// ============================================================

/**
 * タブの識別子（拡張版）
 *
 * ファイルパスをブランド型でラップして型安全性を確保
 */
export type TabId = string & { readonly __brand: 'TabId' }

/**
 * タブの状態
 */
export type TabStatus = 'clean' | 'modified' | 'error'

/**
 * 個別のタブ（拡張版）
 *
 * ピン留め、状態管理などの拡張機能を含む
 */
export interface TabExtended {
  /** タブの一意識別子（ファイルパスから生成） */
  id: TabId
  /** ファイルパス */
  path: string
  /** ファイル名 */
  name: string
  /** ファイルの現在の内容 */
  content: string
  /** ファイルの元の内容（未保存変更の検出用） */
  originalContent: string
  /** タブの状態 */
  status: TabStatus
  /** タブを開いた日時（ISO 8601形式） */
  openedAt: string
  /** 最終アクセス日時（ISO 8601形式） */
  lastAccessedAt: string
  /** ピン留めされているかどうか */
  isPinned: boolean
  /** 表示順序 */
  order: number
}

/**
 * タブ管理の状態（拡張版）
 */
export interface TabStateExtended {
  /** 開いているタブの一覧 */
  tabs: TabExtended[]
  /** アクティブなタブのID */
  activeTabId: TabId | null
  /** 最大タブ数（0は無制限） */
  maxTabs: number
  /** タブの表示順序（IDの配列） */
  tabOrder: TabId[]
}

// ============================================================
// 拡張版の入力/操作型
// ============================================================

/**
 * タブの作成入力
 */
export interface CreateTabInput {
  /** ファイルパス */
  path: string
  /** ファイル名 */
  name: string
  /** ファイルの内容 */
  content: string
  /** ピン留めするかどうか（オプション） */
  isPinned?: boolean
}

/**
 * タブの更新入力
 */
export interface UpdateTabInput {
  /** 更新する内容（オプション） */
  content?: string
  /** タブの状態（オプション） */
  status?: TabStatus
  /** ピン留め状態（オプション） */
  isPinned?: boolean
}

/**
 * タブの並び替え入力
 */
export interface ReorderTabsInput {
  /** 移動元のインデックス */
  fromIndex: number
  /** 移動先のインデックス */
  toIndex: number
}

// ============================================================
// 拡張版の永続化
// ============================================================

/**
 * タブの永続化用データ（拡張版）
 */
export interface TabPersistDataExtended {
  /** バージョン（マイグレーション用） */
  version: number
  /** タブ一覧（内容は除く） */
  tabs: Array<Omit<TabExtended, 'content' | 'originalContent'>>
  /** アクティブタブのID */
  activeTabId: TabId | null
  /** 保存日時（ISO 8601形式） */
  savedAt: string
}

// ============================================================
// アクション型（Reducer用）
// ============================================================

/**
 * タブ操作のアクション型
 *
 * Reducerパターンで状態管理する際に使用
 */
export type TabAction =
  | { type: 'OPEN_TAB'; payload: CreateTabInput }
  | { type: 'CLOSE_TAB'; payload: TabId }
  | { type: 'CLOSE_OTHER_TABS'; payload: TabId }
  | { type: 'CLOSE_ALL_TABS' }
  | { type: 'CLOSE_SAVED_TABS' }
  | { type: 'CLOSE_TABS_TO_RIGHT'; payload: TabId }
  | { type: 'ACTIVATE_TAB'; payload: TabId }
  | { type: 'UPDATE_TAB'; payload: { id: TabId; input: UpdateTabInput } }
  | { type: 'REORDER_TABS'; payload: ReorderTabsInput }
  | { type: 'PIN_TAB'; payload: TabId }
  | { type: 'UNPIN_TAB'; payload: TabId }
  | { type: 'MARK_TAB_SAVED'; payload: TabId }
  | { type: 'RESTORE_TABS'; payload: TabPersistDataExtended }

// ============================================================
// UI関連
// ============================================================

/**
 * タブのコンテキストメニューアイテム
 */
export interface TabContextMenuItem {
  /** アイテムのID */
  id: string
  /** 表示ラベル */
  label: string
  /** アイコン名（オプション） */
  icon?: string
  /** 無効化されているかどうか */
  disabled?: boolean
  /** 区切り線かどうか */
  isSeparator?: boolean
  /** キーボードショートカット（オプション） */
  shortcut?: string
  /** クリック時のアクション */
  action?: () => void
}

/**
 * タブバーの設定
 */
export interface TabBarSettings {
  /** タブの最小幅（ピクセル） */
  minTabWidth: number
  /** タブの最大幅（ピクセル） */
  maxTabWidth: number
  /** タブの高さ（ピクセル） */
  tabHeight: number
  /** 閉じるボタンを常に表示するか */
  showCloseButtonAlways: boolean
  /** ダブルクリックでピン留めするか */
  doubleClickToPin: boolean
  /** スクロールホイールでタブ切り替えするか */
  scrollWheelSwitchTab: boolean
  /** 変更マーカーを表示するか */
  showModifiedIndicator: boolean
}

// ============================================================
// 拡張版フック戻り値型
// ============================================================

/**
 * タブエディタの操作インターフェース（拡張版）
 */
export interface TabEditorActionsExtended {
  /** ファイルを開く（タブを追加） */
  openTab: (path: string, name: string, content: string) => void
  /** タブを閉じる */
  closeTab: (tabId: TabId) => boolean
  /** アクティブタブを切り替え */
  setActiveTab: (tabId: TabId) => void
  /** タブを並べ替え */
  reorderTabs: (fromIndex: number, toIndex: number) => void
  /** タブの内容を更新 */
  updateTabContent: (tabId: TabId, content: string) => void
  /** タブを保存済み状態にマーク */
  markTabAsSaved: (tabId: TabId) => void
  /** 全タブを閉じる */
  closeAllTabs: () => boolean
  /** 保存済みタブのみ閉じる */
  closeSavedTabs: () => void
  /** 他のタブを閉じる */
  closeOtherTabs: (tabId: TabId) => boolean
  /** タブをピン留め */
  pinTab: (tabId: TabId) => void
  /** タブのピン留めを解除 */
  unpinTab: (tabId: TabId) => void
}

/**
 * useTabEditorExtendedの戻り値
 */
export interface UseTabEditorExtendedReturn extends TabStateExtended, TabEditorActionsExtended {
  /** アクティブタブのデータ */
  activeTab: TabExtended | null
  /** 未保存のタブがあるか */
  hasUnsavedTabs: boolean
  /** 未保存のタブ一覧 */
  unsavedTabs: TabExtended[]
  /** 特定のタブが未保存か判定 */
  isTabUnsaved: (tabId: TabId) => boolean
  /** 特定のパスがタブで開かれているか判定 */
  isPathOpen: (path: string) => boolean
  /** パスからタブIDを取得 */
  getTabIdByPath: (path: string) => TabId | null
}

// ============================================================
// ヘルパー関数
// ============================================================

/**
 * ファイルパスからタブIDを生成するヘルパー関数
 */
export function createTabId(path: string): TabId {
  return path as TabId
}

/**
 * タブが変更されているかどうかを判定（拡張版）
 */
export function isTabModified(tab: TabExtended): boolean {
  return tab.content !== tab.originalContent
}

/**
 * タブリストから未保存のタブを取得（拡張版）
 */
export function getUnsavedTabs(tabs: TabExtended[]): TabExtended[] {
  return tabs.filter(tab => isTabModified(tab))
}

/**
 * タブリストをピン留め優先でソート
 */
export function sortTabsByPinned(tabs: TabExtended[]): TabExtended[] {
  return [...tabs].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return a.order - b.order
  })
}

/**
 * 現行版タブが変更されているか判定
 */
export function isTabModifiedSimple(tab: Tab): boolean {
  return tab.content !== tab.originalContent
}
