/**
 * エディタ関連の型定義
 */

/** 選択中のファイル */
export interface SelectedFile {
  path: string
  name: string
  content: string
  originalContent: string
}

/** 検索ハイライト情報 */
export interface SearchHighlight {
  query: string
  currentIndex: number
  totalCount: number
}

/** メッセージの種類 */
export type MessageType = 'success' | 'error'

/** 通知メッセージ */
export interface Message {
  type: MessageType
  text: string
}
