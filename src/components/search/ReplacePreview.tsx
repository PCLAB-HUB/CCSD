import { FC } from 'react'

interface ReplacePreviewProps {
  /** The text being replaced */
  originalText: string
  /** The replacement text */
  newText: string
  /** Surrounding context (text before and after the match) */
  context?: { before: string; after: string }
  /** Whether the preview is visible */
  isVisible: boolean
}

/**
 * ReplacePreview Component
 *
 * Shows a preview of what will be replaced before the user confirms.
 * Displays original text with strikethrough and red background,
 * new text with green background, and optional surrounding context in muted colors.
 *
 * Example output:
 * ...config value is ~~"old-value"~~ "new-value" in the file...
 */
const ReplacePreview: FC<ReplacePreviewProps> = ({
  originalText,
  newText,
  context,
  isVisible,
}) => {
  if (!isVisible) {
    return null
  }

  return (
    <div
      className="inline-flex items-baseline flex-wrap gap-0.5 px-2 py-1 text-sm font-mono bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
      role="region"
      aria-label="置換プレビュー"
    >
      {/* Context before */}
      {context?.before && (
        <span
          className="text-gray-400 dark:text-gray-500 truncate max-w-32"
          aria-label="前のコンテキスト"
        >
          ...{context.before}
        </span>
      )}

      {/* Original text with strikethrough and red background */}
      <span
        className="inline-flex items-baseline px-1 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded line-through decoration-red-500 dark:decoration-red-400 decoration-2"
        aria-label={`置換前: ${originalText}`}
      >
        {originalText}
      </span>

      {/* New text with green background */}
      <span
        className="inline-flex items-baseline px-1 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded"
        aria-label={`置換後: ${newText}`}
      >
        {newText}
      </span>

      {/* Context after */}
      {context?.after && (
        <span
          className="text-gray-400 dark:text-gray-500 truncate max-w-32"
          aria-label="後のコンテキスト"
        >
          {context.after}...
        </span>
      )}
    </div>
  )
}

export default ReplacePreview
