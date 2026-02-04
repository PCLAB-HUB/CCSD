/**
 * @fileoverview ターミナルパネル状態管理フック
 * @module hooks/useTerminalPanel
 *
 * 機能:
 * - パネルの開閉状態
 * - パネルの高さ（ドラッグリサイズ対応）
 * - アクティブタブ管理
 * - localStorageへの永続化
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import type { TerminalPanelState, TerminalTabType } from '../types/terminal'
import {
  TERMINAL_STORAGE_KEYS,
  DEFAULT_PANEL_HEIGHT,
  MIN_PANEL_HEIGHT,
  MAX_PANEL_HEIGHT,
  clampPanelHeight,
  createDefaultPanelState,
} from '../types/terminal'

// ============================================================
// 型定義
// ============================================================

/**
 * useTerminalPanelの戻り値
 */
export interface UseTerminalPanelReturn {
  /** パネルが開いているかどうか */
  isOpen: boolean
  /** パネルの高さ（ピクセル） */
  height: number
  /** アクティブなタブ */
  activeTab: TerminalTabType
  /** パネルの最小高さ */
  minHeight: number
  /** パネルの最大高さ */
  maxHeight: number
  /** パネルを開く */
  open: () => void
  /** パネルを閉じる */
  close: () => void
  /** パネルの開閉をトグルする */
  toggle: () => void
  /** パネルの高さを設定する */
  setHeight: (height: number) => void
  /** アクティブタブを設定する */
  setActiveTab: (tab: TerminalTabType) => void
  /** ドラッグリサイズ中のハンドラ */
  handleDragResize: (deltaY: number) => void
  /** 状態をリセットする */
  reset: () => void
}

// ============================================================
// ストレージ操作
// ============================================================

/**
 * localStorageからパネル高さを読み込む
 */
function loadHeightFromStorage(): number {
  try {
    const stored = localStorage.getItem(TERMINAL_STORAGE_KEYS.PANEL_HEIGHT)
    if (!stored) return DEFAULT_PANEL_HEIGHT

    const parsed = parseInt(stored, 10)
    if (isNaN(parsed)) return DEFAULT_PANEL_HEIGHT

    return clampPanelHeight(parsed)
  } catch (error) {
    console.error('Failed to load panel height from storage:', error)
    return DEFAULT_PANEL_HEIGHT
  }
}

/**
 * localStorageにパネル高さを保存する
 */
function saveHeightToStorage(height: number): void {
  try {
    localStorage.setItem(
      TERMINAL_STORAGE_KEYS.PANEL_HEIGHT,
      String(clampPanelHeight(height))
    )
  } catch (error) {
    console.error('Failed to save panel height to storage:', error)
  }
}

/**
 * localStorageからパネル開閉状態を読み込む
 */
function loadOpenStateFromStorage(): boolean {
  try {
    const stored = localStorage.getItem(TERMINAL_STORAGE_KEYS.PANEL_OPEN)
    if (!stored) return false
    return stored === 'true'
  } catch (error) {
    console.error('Failed to load panel open state from storage:', error)
    return false
  }
}

/**
 * localStorageにパネル開閉状態を保存する
 */
function saveOpenStateToStorage(isOpen: boolean): void {
  try {
    localStorage.setItem(TERMINAL_STORAGE_KEYS.PANEL_OPEN, String(isOpen))
  } catch (error) {
    console.error('Failed to save panel open state to storage:', error)
  }
}

/**
 * localStorageからアクティブタブを読み込む
 */
function loadActiveTabFromStorage(): TerminalTabType {
  try {
    const stored = localStorage.getItem(TERMINAL_STORAGE_KEYS.ACTIVE_TAB)
    if (stored === 'terminal' || stored === 'output') {
      return stored
    }
    return 'terminal'
  } catch (error) {
    console.error('Failed to load active tab from storage:', error)
    return 'terminal'
  }
}

/**
 * localStorageにアクティブタブを保存する
 */
function saveActiveTabToStorage(tab: TerminalTabType): void {
  try {
    localStorage.setItem(TERMINAL_STORAGE_KEYS.ACTIVE_TAB, tab)
  } catch (error) {
    console.error('Failed to save active tab to storage:', error)
  }
}

// ============================================================
// フック実装
// ============================================================

/**
 * ターミナルパネル状態管理フック
 *
 * パネルの開閉、高さ、アクティブタブを管理します。
 * 設定はlocalStorageに永続化されます。
 *
 * @returns パネル操作関数と状態
 *
 * @example
 * ```tsx
 * const {
 *   isOpen,
 *   height,
 *   activeTab,
 *   toggle,
 *   setHeight,
 *   setActiveTab,
 *   handleDragResize,
 * } = useTerminalPanel()
 *
 * return (
 *   <div>
 *     <button onClick={toggle}>
 *       {isOpen ? 'ターミナルを閉じる' : 'ターミナルを開く'}
 *     </button>
 *
 *     {isOpen && (
 *       <TerminalPanel
 *         height={height}
 *         activeTab={activeTab}
 *         onTabChange={setActiveTab}
 *         onDragResize={handleDragResize}
 *       />
 *     )}
 *   </div>
 * )
 * ```
 */
export function useTerminalPanel(): UseTerminalPanelReturn {
  const [state, setState] = useState<TerminalPanelState>(() => ({
    isOpen: loadOpenStateFromStorage(),
    height: loadHeightFromStorage(),
    activeTab: loadActiveTabFromStorage(),
  }))

  // マウント状態を追跡
  const isMountedRef = useRef(true)
  // リサイズ中の高さを追跡（デバウンス用）
  const resizeHeightRef = useRef(state.height)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  /**
   * パネルを開く
   */
  const open = useCallback(() => {
    setState((prev) => {
      if (prev.isOpen) return prev
      saveOpenStateToStorage(true)
      return { ...prev, isOpen: true }
    })
  }, [])

  /**
   * パネルを閉じる
   */
  const close = useCallback(() => {
    setState((prev) => {
      if (!prev.isOpen) return prev
      saveOpenStateToStorage(false)
      return { ...prev, isOpen: false }
    })
  }, [])

  /**
   * パネルの開閉をトグルする
   */
  const toggle = useCallback(() => {
    setState((prev) => {
      const newIsOpen = !prev.isOpen
      saveOpenStateToStorage(newIsOpen)
      return { ...prev, isOpen: newIsOpen }
    })
  }, [])

  /**
   * パネルの高さを設定する
   */
  const setHeight = useCallback((height: number) => {
    const clampedHeight = clampPanelHeight(height)
    resizeHeightRef.current = clampedHeight

    setState((prev) => {
      if (prev.height === clampedHeight) return prev
      saveHeightToStorage(clampedHeight)
      return { ...prev, height: clampedHeight }
    })
  }, [])

  /**
   * アクティブタブを設定する
   */
  const setActiveTab = useCallback((tab: TerminalTabType) => {
    setState((prev) => {
      if (prev.activeTab === tab) return prev
      saveActiveTabToStorage(tab)
      return { ...prev, activeTab: tab }
    })
  }, [])

  /**
   * ドラッグリサイズ中のハンドラ
   *
   * リサイズハンドルを上にドラッグ（deltaY < 0）するとパネルが大きくなり、
   * 下にドラッグ（deltaY > 0）するとパネルが小さくなります。
   */
  const handleDragResize = useCallback(
    (deltaY: number) => {
      // deltaYが負（上方向）の場合はパネルを大きくする
      const newHeight = resizeHeightRef.current - deltaY
      setHeight(newHeight)
    },
    [setHeight]
  )

  /**
   * 状態をリセットする
   */
  const reset = useCallback(() => {
    const defaultState = createDefaultPanelState()
    setState(defaultState)
    saveHeightToStorage(defaultState.height)
    saveOpenStateToStorage(defaultState.isOpen)
    saveActiveTabToStorage(defaultState.activeTab)
  }, [])

  return {
    isOpen: state.isOpen,
    height: state.height,
    activeTab: state.activeTab,
    minHeight: MIN_PANEL_HEIGHT,
    maxHeight: MAX_PANEL_HEIGHT,
    open,
    close,
    toggle,
    setHeight,
    setActiveTab,
    handleDragResize,
    reset,
  }
}

export default useTerminalPanel
