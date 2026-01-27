import type { FC } from 'react'
import { DiffEditor } from '@monaco-editor/react'

import { Icon } from '../common'

export type DiffViewMode = 'side-by-side' | 'inline'

interface DiffViewerProps {
  original: string
  modified: string
  originalLabel?: string
  modifiedLabel?: string
  language?: string
  darkMode: boolean
  viewMode: DiffViewMode
  height?: string
}

const DiffViewer: FC<DiffViewerProps> = ({
  original,
  modified,
  originalLabel = 'Original',
  modifiedLabel = 'Modified',
  language = 'plaintext',
  darkMode,
  viewMode,
  height = '100%',
}) => {
  return (
    <div className="flex h-full flex-col">
      {/* ラベル表示 */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        {viewMode === 'side-by-side' ? (
          <>
            <div className="flex-1 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border-r border-gray-200 dark:border-gray-700">
              <span className="inline-flex items-center gap-2">
                <Icon name="minus" className="size-4" />
                {originalLabel}
              </span>
            </div>
            <div className="flex-1 px-4 py-2 text-sm font-medium text-green-600 dark:text-green-400">
              <span className="inline-flex items-center gap-2">
                <Icon name="plus" className="size-4" />
                {modifiedLabel}
              </span>
            </div>
          </>
        ) : (
          <div className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400">
            <span className="inline-flex items-center gap-4">
              <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                <Icon name="minus" className="size-4" />
                {originalLabel}
              </span>
              <span className="text-gray-400">vs</span>
              <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                <Icon name="plus" className="size-4" />
                {modifiedLabel}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Diff Editor */}
      <div className="flex-1">
        <DiffEditor
          height={height}
          original={original}
          modified={modified}
          language={language}
          theme={darkMode ? 'vs-dark' : 'light'}
          options={{
            readOnly: true,
            renderSideBySide: viewMode === 'side-by-side',
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            renderIndicators: true,
            originalEditable: false,
            diffWordWrap: 'on',
          }}
        />
      </div>

      {/* 差分サマリー */}
      <DiffSummary original={original} modified={modified} />
    </div>
  )
}

interface DiffSummaryProps {
  original: string
  modified: string
}

const DiffSummary: FC<DiffSummaryProps> = ({ original, modified }) => {
  const originalLines = original.split('\n')
  const modifiedLines = modified.split('\n')

  // 簡易的な差分カウント（行ベース）
  const added = modifiedLines.filter(line => !originalLines.includes(line)).length
  const removed = originalLines.filter(line => !modifiedLines.includes(line)).length

  return (
    <div
      className="flex items-center gap-4 px-4 py-2 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs"
      role="status"
      aria-label={`差分サマリー: ${added}行追加、${removed}行削除、${originalLines.length}行から${modifiedLines.length}行に変更`}
    >
      <span className="text-gray-500 dark:text-gray-400">差分サマリー:</span>
      <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
        <Icon name="plus" className="size-3" aria-hidden="true" />
        <span>{added} 行追加</span>
      </span>
      <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
        <Icon name="minus" className="size-3" aria-hidden="true" />
        <span>{removed} 行削除</span>
      </span>
      <span className="text-gray-500 dark:text-gray-400 ml-auto">
        {originalLines.length} 行 → {modifiedLines.length} 行
      </span>
    </div>
  )
}

export default DiffViewer
