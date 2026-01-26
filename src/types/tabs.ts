/**
 * タブエディタ関連の型定義
 */

/** タブの状態 */
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

/** タブの永続化用データ（localStorageに保存） */
export interface TabPersistData {
  /** タブ一覧 */
  tabs: Omit<Tab, 'order'>[]
  /** アクティブタブのID */
  activeTabId: string | null
  /** 保存日時 */
  savedAt: string
}

/** タブエディタの状態 */
export interface TabEditorState {
  /** 全タブ */
  tabs: Tab[]
  /** アクティブタブのID */
  activeTabId: string | null
}

/** タブエディタの操作 */
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

/** useTabEditorの戻り値 */
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
