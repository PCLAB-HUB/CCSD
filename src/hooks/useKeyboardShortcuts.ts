import { useEffect } from 'react'

interface UseKeyboardShortcutsOptions {
  /** Cmd+S / Ctrl+S で保存を実行するコールバック */
  onSave: () => void
  /** Cmd+H / Ctrl+H で検索・置換パネルを開くコールバック */
  onOpenSearchReplace?: () => void
  /** Cmd+Shift+H で全て置換を実行するコールバック */
  onReplaceAll?: () => void
  /** Alt+C で大文字小文字区別をトグルするコールバック */
  onToggleCaseSensitive?: () => void
  /** Alt+W で単語単位検索をトグルするコールバック */
  onToggleWholeWord?: () => void
  /** Alt+R で正規表現をトグルするコールバック */
  onToggleRegex?: () => void
}

/**
 * キーボードショートカットを管理するカスタムフック
 * - Cmd+S / Ctrl+S: ファイル保存
 * - Cmd+H / Ctrl+H: 検索・置換パネルを開く
 * - Cmd+Shift+H: 全て置換
 * - Alt+C: 大文字小文字区別のトグル
 * - Alt+W: 単語単位検索のトグル
 * - Alt+R: 正規表現のトグル
 */
export function useKeyboardShortcuts({
  onSave,
  onOpenSearchReplace,
  onReplaceAll,
  onToggleCaseSensitive,
  onToggleWholeWord,
  onToggleRegex,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+S (Mac) または Ctrl+S (Windows/Linux) で保存
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        onSave()
      }

      // Cmd+H (Mac) または Ctrl+H (Windows/Linux) で検索・置換パネルを開く
      if ((e.metaKey || e.ctrlKey) && e.key === 'h' && !e.shiftKey) {
        e.preventDefault()
        onOpenSearchReplace?.()
      }

      // Cmd+Shift+H (Mac) または Ctrl+Shift+H (Windows/Linux) で全て置換
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'H') {
        e.preventDefault()
        onReplaceAll?.()
      }

      // Alt+C で大文字小文字区別をトグル
      if (e.altKey && e.key === 'c' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        onToggleCaseSensitive?.()
      }

      // Alt+W で単語単位検索をトグル
      if (e.altKey && e.key === 'w' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        onToggleWholeWord?.()
      }

      // Alt+R で正規表現をトグル
      if (e.altKey && e.key === 'r' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        onToggleRegex?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    onSave,
    onOpenSearchReplace,
    onReplaceAll,
    onToggleCaseSensitive,
    onToggleWholeWord,
    onToggleRegex,
  ])
}
