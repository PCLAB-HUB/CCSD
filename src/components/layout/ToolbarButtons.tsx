import { FC, memo } from 'react'
import Icon from '../common/Icon'
import ExportMenu from '../export/ExportMenu'

interface ToolbarButtonsProps {
  // 新規作成・バックアップ
  onCreateNew: () => void
  onOpenBackups: () => void
  onOpenImport?: () => void

  // Markdownプレビュー
  isMarkdownFile: boolean
  showPreview: boolean
  onTogglePreview?: () => void
  scrollSync: boolean
  onToggleScrollSync?: () => void

  // プレビューウィンドウ
  onOpenPreviewWindow?: () => void
  isPreviewWindowOpen?: boolean
  isPreviewWindowLoading?: boolean

  // エクスポート
  selectedFilePath?: string
  selectedFileName?: string

  // 保存
  hasUnsavedChanges: boolean
  onSave: () => void
  saving: boolean
  readOnly: boolean

  // 読み取りモード
  onToggleReadOnly: () => void

  // ダークモード
  darkMode: boolean
  onToggleDarkMode: () => void
}

/** ボタンスタイルの定義 */
const buttonStyles = {
  primary: 'px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-2',
  green: 'bg-green-500 text-white hover:bg-green-600',
  gray: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600',
  indigo: 'bg-indigo-500 text-white hover:bg-indigo-600',
  blue: 'bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed',
  purple: {
    active: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200',
    inactive: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200',
  },
  red: {
    active: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200',
    inactive: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200',
  },
  icon: 'p-1.5 rounded-md transition-colors',
  iconHover: 'p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
} as const

const ToolbarButtons: FC<ToolbarButtonsProps> = memo(({
  onCreateNew,
  onOpenBackups,
  onOpenImport,
  isMarkdownFile,
  showPreview,
  onTogglePreview,
  scrollSync,
  onToggleScrollSync,
  onOpenPreviewWindow,
  isPreviewWindowOpen = false,
  isPreviewWindowLoading = false,
  selectedFilePath,
  selectedFileName,
  hasUnsavedChanges,
  onSave,
  saving,
  readOnly,
  onToggleReadOnly,
  darkMode,
  onToggleDarkMode,
}) => {
  return (
    <>
      {/* 新規作成ボタン */}
      <button
        onClick={onCreateNew}
        className={`${buttonStyles.primary} ${buttonStyles.green}`}
        title="テンプレートから新規作成"
      >
        <Icon name="plus" />
        新規作成
      </button>

      {/* バックアップボタン */}
      <button
        onClick={onOpenBackups}
        className={`${buttonStyles.primary} ${buttonStyles.gray}`}
        title="バックアップ一覧"
      >
        <Icon name="archive" />
        バックアップ
      </button>

      {/* Markdownプレビュートグル */}
      {isMarkdownFile && (
        <div className="flex items-center gap-1 border-l border-gray-300 dark:border-gray-600 pl-4">
          <button
            onClick={onTogglePreview}
            className={`${buttonStyles.primary} ${
              showPreview ? buttonStyles.purple.active : buttonStyles.purple.inactive
            }`}
            title={showPreview ? 'プレビューを非表示' : 'プレビューを表示'}
          >
            <Icon name="eye" />
            Preview
          </button>
          {showPreview && (
            <button
              onClick={onToggleScrollSync}
              className={`${buttonStyles.icon} ${
                scrollSync
                  ? buttonStyles.purple.active
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
              title={scrollSync ? 'スクロール同期を解除' : 'スクロール同期'}
            >
              <Icon name="sync" />
            </button>
          )}
          {/* 別ウィンドウで開くボタン */}
          <button
            onClick={onOpenPreviewWindow}
            disabled={isPreviewWindowLoading}
            className={`${buttonStyles.icon} ${
              isPreviewWindowOpen
                ? buttonStyles.purple.active
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
            title={isPreviewWindowOpen ? 'プレビューウィンドウが開いています' : '別ウィンドウでプレビュー'}
          >
            {isPreviewWindowLoading ? (
              <Icon name="spinner" className="size-4 animate-spin" />
            ) : (
              <Icon name="externalLink" />
            )}
          </button>
        </div>
      )}

      {/* インポートボタン */}
      <button
        onClick={onOpenImport}
        className={`${buttonStyles.primary} ${buttonStyles.indigo}`}
        title="設定をインポート"
      >
        <Icon name="upload" />
        インポート
      </button>

      {/* エクスポートメニュー */}
      <ExportMenu
        selectedFilePath={selectedFilePath}
        selectedFileName={selectedFileName}
      />

      {/* 保存ボタン */}
      <button
        onClick={onSave}
        disabled={!hasUnsavedChanges || readOnly || saving}
        aria-label={saving ? '保存中' : hasUnsavedChanges ? '変更を保存' : '保存する変更がありません'}
        aria-busy={saving}
        className={`${buttonStyles.primary} ${buttonStyles.blue}`}
      >
        {saving ? (
          <>
            <Icon name="spinner" className="size-4 animate-spin" />
            保存中...
          </>
        ) : (
          '保存'
        )}
      </button>

      {/* 読み取り専用トグル */}
      <button
        onClick={onToggleReadOnly}
        className={`${buttonStyles.primary} ${
          readOnly ? buttonStyles.red.active : buttonStyles.red.inactive
        }`}
        title={readOnly ? '編集モードに切り替え' : '読み取り専用モードに切り替え'}
      >
        {readOnly ? '読取専用' : '編集可能'}
      </button>

      {/* ダークモードトグル */}
      <button
        onClick={onToggleDarkMode}
        className={buttonStyles.iconHover}
        title={darkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
        aria-label={darkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
        aria-pressed={darkMode}
      >
        <Icon name={darkMode ? 'sun' : 'moon'} className="size-5" />
      </button>
    </>
  )
})

ToolbarButtons.displayName = 'ToolbarButtons'

export default ToolbarButtons
