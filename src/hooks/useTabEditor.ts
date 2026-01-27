import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Tab, TabPersistData, UseTabEditorReturn } from '../types/tabs'
import { STORAGE_KEY_TABS } from '../constants'

/**
 * localStorageからタブ状態を復元
 */
function loadPersistedTabs(): { tabs: Tab[]; activeTabId: string | null } {
  if (typeof window === 'undefined') {
    return { tabs: [], activeTabId: null }
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY_TABS)
    if (!stored) {
      return { tabs: [], activeTabId: null }
    }

    const data: TabPersistData = JSON.parse(stored)

    // 永続化データからTabに変換（orderを付与）
    const tabs: Tab[] = data.tabs.map((tab, index) => ({
      ...tab,
      order: index,
    }))

    return {
      tabs,
      activeTabId: data.activeTabId,
    }
  } catch {
    // パースエラー時は空の状態を返す
    console.warn('Failed to parse persisted tabs data')
    return { tabs: [], activeTabId: null }
  }
}

/**
 * タブ状態をlocalStorageに保存
 */
function persistTabs(tabs: Tab[], activeTabId: string | null): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const data: TabPersistData = {
      tabs: tabs
        .sort((a, b) => a.order - b.order)
        .map(({ id, path, name, content, originalContent }) => ({
          id,
          path,
          name,
          content,
          originalContent,
        })),
      activeTabId,
      savedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY_TABS, JSON.stringify(data))
  } catch {
    console.warn('Failed to persist tabs data')
  }
}

export interface UseTabEditorOptions {
  /** 未保存タブがある状態で閉じようとした時のコールバック */
  onUnsavedWarning?: (unsavedTabs: Tab[]) => boolean
}

/**
 * タブエディタの状態管理フック
 *
 * 機能:
 * - タブの追加（ファイルを開く）
 * - タブの削除（閉じる）
 * - アクティブタブの切り替え
 * - タブの並べ替え
 * - 各タブのファイル内容・編集状態の管理
 * - 未保存タブがある場合の警告
 * - タブ状態のlocalStorage永続化（セッション復元）
 */
export function useTabEditor(options: UseTabEditorOptions = {}): UseTabEditorReturn {
  const { onUnsavedWarning } = options

  // 初期状態をlocalStorageから復元（一度だけ呼び出す）
  const [{ tabs: initialTabs, activeTabId: initialActiveTabId }] = useState(loadPersistedTabs)
  const [tabs, setTabs] = useState<Tab[]>(initialTabs)
  const [activeTabId, setActiveTabIdState] = useState<string | null>(initialActiveTabId)

  // タブ状態が変更されたらlocalStorageに永続化
  useEffect(() => {
    persistTabs(tabs, activeTabId)
  }, [tabs, activeTabId])

  // ブラウザを閉じる前に未保存警告を表示
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const unsaved = tabs.filter(tab => tab.content !== tab.originalContent)
      if (unsaved.length > 0) {
        e.preventDefault()
        // 標準の確認ダイアログを表示
        return ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [tabs])

  /**
   * アクティブタブを取得
   */
  const activeTab = useMemo(() => {
    if (!activeTabId) return null
    return tabs.find(tab => tab.id === activeTabId) ?? null
  }, [tabs, activeTabId])

  /**
   * 未保存のタブ一覧
   */
  const unsavedTabs = useMemo(() => {
    return tabs.filter(tab => tab.content !== tab.originalContent)
  }, [tabs])

  /**
   * 未保存のタブがあるか
   */
  const hasUnsavedTabs = unsavedTabs.length > 0

  /**
   * 特定のタブが未保存か判定
   */
  const isTabUnsaved = useCallback((tabId: string): boolean => {
    const tab = tabs.find(t => t.id === tabId)
    if (!tab) return false
    return tab.content !== tab.originalContent
  }, [tabs])

  /**
   * ファイルを開く（タブを追加）
   * 既に開いている場合はそのタブをアクティブにする
   */
  const openTab = useCallback((path: string, name: string, content: string) => {
    setTabs(prevTabs => {
      // 既存のタブを検索（パスで一致）
      const existingTab = prevTabs.find(tab => tab.path === path)

      if (existingTab) {
        // 既に開いている場合はアクティブにするだけ
        setActiveTabIdState(existingTab.id)
        return prevTabs
      }

      // 新しいタブを作成
      const maxOrder = prevTabs.length > 0
        ? Math.max(...prevTabs.map(t => t.order))
        : -1

      const newTab: Tab = {
        id: path, // パスをIDとして使用
        path,
        name,
        content,
        originalContent: content,
        order: maxOrder + 1,
      }

      setActiveTabIdState(newTab.id)
      return [...prevTabs, newTab]
    })
  }, [])

  /**
   * タブを閉じる
   * @returns 閉じることができたかどうか（未保存警告でキャンセルされた場合はfalse）
   */
  const closeTab = useCallback((tabId: string): boolean => {
    const tab = tabs.find(t => t.id === tabId)
    if (!tab) return true

    // 未保存の場合は警告
    if (tab.content !== tab.originalContent) {
      if (onUnsavedWarning && !onUnsavedWarning([tab])) {
        return false
      }
    }

    setTabs(prevTabs => {
      const newTabs = prevTabs.filter(t => t.id !== tabId)

      // 閉じたタブがアクティブだった場合、別のタブをアクティブにする
      if (activeTabId === tabId) {
        const closedIndex = prevTabs.findIndex(t => t.id === tabId)
        const sortedTabs = newTabs.sort((a, b) => a.order - b.order)

        if (sortedTabs.length > 0) {
          // 右側のタブを優先、なければ左側のタブをアクティブに
          const newActiveIndex = Math.min(closedIndex, sortedTabs.length - 1)
          setActiveTabIdState(sortedTabs[newActiveIndex].id)
        } else {
          setActiveTabIdState(null)
        }
      }

      return newTabs
    })

    return true
  }, [tabs, activeTabId, onUnsavedWarning])

  /**
   * アクティブタブを切り替え
   */
  const setActiveTab = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId)
    if (tab) {
      setActiveTabIdState(tabId)
    }
  }, [tabs])

  /**
   * タブを並べ替え
   */
  const reorderTabs = useCallback((fromIndex: number, toIndex: number) => {
    setTabs(prevTabs => {
      const sortedTabs = [...prevTabs].sort((a, b) => a.order - b.order)

      if (fromIndex < 0 || fromIndex >= sortedTabs.length) return prevTabs
      if (toIndex < 0 || toIndex >= sortedTabs.length) return prevTabs
      if (fromIndex === toIndex) return prevTabs

      // 配列内での移動
      const [movedTab] = sortedTabs.splice(fromIndex, 1)
      sortedTabs.splice(toIndex, 0, movedTab)

      // orderを再割り当て
      return sortedTabs.map((tab, index) => ({
        ...tab,
        order: index,
      }))
    })
  }, [])

  /**
   * タブの内容を更新
   */
  const updateTabContent = useCallback((tabId: string, content: string) => {
    setTabs(prevTabs =>
      prevTabs.map(tab =>
        tab.id === tabId
          ? { ...tab, content }
          : tab
      )
    )
  }, [])

  /**
   * タブを保存済み状態にマーク
   */
  const markTabAsSaved = useCallback((tabId: string) => {
    setTabs(prevTabs =>
      prevTabs.map(tab =>
        tab.id === tabId
          ? { ...tab, originalContent: tab.content }
          : tab
      )
    )
  }, [])

  /**
   * 全タブを閉じる
   * @returns 全て閉じることができたかどうか
   */
  const closeAllTabs = useCallback((): boolean => {
    if (unsavedTabs.length > 0) {
      if (onUnsavedWarning && !onUnsavedWarning(unsavedTabs)) {
        return false
      }
    }

    setTabs([])
    setActiveTabIdState(null)
    return true
  }, [unsavedTabs, onUnsavedWarning])

  /**
   * 保存済みタブのみ閉じる
   */
  const closeSavedTabs = useCallback(() => {
    setTabs(prevTabs => {
      const remainingTabs = prevTabs.filter(tab => tab.content !== tab.originalContent)

      // アクティブタブが閉じられた場合
      if (activeTabId && !remainingTabs.find(t => t.id === activeTabId)) {
        if (remainingTabs.length > 0) {
          const sortedTabs = remainingTabs.sort((a, b) => a.order - b.order)
          setActiveTabIdState(sortedTabs[0].id)
        } else {
          setActiveTabIdState(null)
        }
      }

      return remainingTabs
    })
  }, [activeTabId])

  /**
   * 他のタブを閉じる（指定タブ以外）
   * @returns 全て閉じることができたかどうか
   */
  const closeOtherTabs = useCallback((tabId: string): boolean => {
    const otherUnsavedTabs = tabs.filter(
      tab => tab.id !== tabId && tab.content !== tab.originalContent
    )

    if (otherUnsavedTabs.length > 0) {
      if (onUnsavedWarning && !onUnsavedWarning(otherUnsavedTabs)) {
        return false
      }
    }

    setTabs(prevTabs => prevTabs.filter(tab => tab.id === tabId))
    setActiveTabIdState(tabId)
    return true
  }, [tabs, onUnsavedWarning])

  // ソート済みのタブ配列を返す
  const sortedTabs = useMemo(() => {
    return [...tabs].sort((a, b) => a.order - b.order)
  }, [tabs])

  return {
    // 状態
    tabs: sortedTabs,
    activeTabId,
    activeTab,
    hasUnsavedTabs,
    unsavedTabs,
    // 操作
    openTab,
    closeTab,
    setActiveTab,
    reorderTabs,
    updateTabContent,
    markTabAsSaved,
    closeAllTabs,
    closeSavedTabs,
    closeOtherTabs,
    isTabUnsaved,
  }
}
