import { useEffect } from 'react'
import type { SearchReplaceOptions } from '../useSearchReplace'

interface UseAppKeyboardShortcutsOptions {
  /** ファイル保存コールバック */
  onSave: () => void

  // 検索＆置換関連
  /** 検索＆置換パネルが開いているか */
  isSearchReplacePanelOpen: boolean
  /** 検索＆置換パネルを開くコールバック */
  onOpenSearchReplace: () => void
  /** マッチ数 */
  replaceMatchCount: number
  /** 全置換コールバック */
  onReplaceAll: () => void
  /** 検索＆置換オプション */
  replaceOptions: SearchReplaceOptions
  /** 検索＆置換オプション更新コールバック */
  onSetReplaceOptions: (options: Partial<SearchReplaceOptions>) => void
}

/**
 * App.tsx用の統合キーボードショートカットフック
 *
 * 以下のショートカットを管理:
 * - Cmd+S / Ctrl+S: ファイル保存
 * - Cmd+H / Ctrl+H: 検索＆置換パネルを開く
 * - Cmd+Shift+H: 全置換
 * - Alt+C: 大文字小文字区別のトグル
 * - Alt+W: 単語単位検索のトグル
 * - Alt+R: 正規表現のトグル
 */
export function useAppKeyboardShortcuts({
  onSave,
  isSearchReplacePanelOpen,
  onOpenSearchReplace,
  replaceMatchCount,
  onReplaceAll,
  replaceOptions,
  onSetReplaceOptions,
}: UseAppKeyboardShortcutsOptions): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+S (Mac) または Ctrl+S (Windows/Linux) で保存
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        onSave()
      }

      // Cmd+H (Mac) または Ctrl+H (Windows) で検索＆置換を開く
      if ((e.metaKey || e.ctrlKey) && e.key === 'h' && !e.shiftKey) {
        e.preventDefault()
        onOpenSearchReplace()
      }

      // Cmd+Shift+H で全て置換
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'H') {
        e.preventDefault()
        if (isSearchReplacePanelOpen && replaceMatchCount > 0) {
          void onReplaceAll()
        }
      }

      // Alt+C で大文字小文字区別をトグル
      if (e.altKey && e.key === 'c' && !e.metaKey && !e.ctrlKey) {
        if (isSearchReplacePanelOpen) {
          e.preventDefault()
          onSetReplaceOptions({ caseSensitive: !replaceOptions.caseSensitive })
        }
      }

      // Alt+W で単語単位検索をトグル
      if (e.altKey && e.key === 'w' && !e.metaKey && !e.ctrlKey) {
        if (isSearchReplacePanelOpen) {
          e.preventDefault()
          onSetReplaceOptions({ wholeWord: !replaceOptions.wholeWord })
        }
      }

      // Alt+R で正規表現をトグル
      if (e.altKey && e.key === 'r' && !e.metaKey && !e.ctrlKey) {
        if (isSearchReplacePanelOpen) {
          e.preventDefault()
          onSetReplaceOptions({ useRegex: !replaceOptions.useRegex })
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    onSave,
    isSearchReplacePanelOpen,
    onOpenSearchReplace,
    replaceMatchCount,
    onReplaceAll,
    replaceOptions,
    onSetReplaceOptions,
  ])
}
