import { FC, memo, useMemo, ComponentPropsWithoutRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import Icon from '../common/Icon'
import LoadingSpinner from '../common/LoadingSpinner'
import ReviewSuggestion, { Suggestion, SuggestionSeverity } from './ReviewSuggestion'

/** レビュー結果の状態 */
export type ReviewStatus = 'idle' | 'loading' | 'success' | 'error'

/** レビュー結果の型定義 */
export interface ReviewResult {
  summary: string
  suggestions: Suggestion[]
  overallScore?: number
  reviewedAt: Date
}

interface AIReviewPanelProps {
  status: ReviewStatus
  result: ReviewResult | null
  error: string | null
  darkMode: boolean
  onClose?: () => void
  onRetry?: () => void
  onApplySuggestion?: (suggestion: Suggestion) => void
  onDismissSuggestion?: (suggestionId: string) => void
  onApplyAll?: () => void
  applyingId?: string | null
}

/** スコアに応じた色の設定 */
const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-500 dark:text-green-400'
  if (score >= 60) return 'text-yellow-500 dark:text-yellow-400'
  return 'text-red-500 dark:text-red-400'
}

const getScoreBg = (score: number, darkMode: boolean): string => {
  if (score >= 80) return darkMode ? 'bg-green-900/30' : 'bg-green-50'
  if (score >= 60) return darkMode ? 'bg-yellow-900/30' : 'bg-yellow-50'
  return darkMode ? 'bg-red-900/30' : 'bg-red-50'
}

/**
 * AIレビュー結果表示パネル
 */
const AIReviewPanel: FC<AIReviewPanelProps> = memo(({
  status,
  result,
  error,
  darkMode,
  onClose,
  onRetry,
  onApplySuggestion,
  onDismissSuggestion,
  onApplyAll,
  applyingId,
}) => {
  // 重要度でグループ化された提案
  const groupedSuggestions = useMemo(() => {
    if (!result?.suggestions) return { error: [], warning: [], info: [] }

    return result.suggestions.reduce(
      (acc, suggestion) => {
        acc[suggestion.severity].push(suggestion)
        return acc
      },
      { error: [], warning: [], info: [] } as Record<SuggestionSeverity, Suggestion[]>
    )
  }, [result?.suggestions])

  // 適用可能な提案の数
  const applicableSuggestions = useMemo(() => {
    return result?.suggestions.filter((s) => s.after) ?? []
  }, [result?.suggestions])

  // ReactMarkdownのcomponentsをメモ化
  const markdownComponents = useMemo(() => ({
    code({ className, children, ...props }: ComponentPropsWithoutRef<'code'> & { className?: string }) {
      const match = /language-(\w+)/.exec(className || '')
      const isInline = !match && !className

      if (isInline) {
        return (
          <code
            className={`
              px-1.5 py-0.5 rounded text-sm font-mono
              ${darkMode
                ? 'bg-gray-700 text-pink-400'
                : 'bg-gray-100 text-pink-600'
              }
            `}
            {...props}
          >
            {children}
          </code>
        )
      }

      return (
        <SyntaxHighlighter
          style={darkMode ? oneDark : oneLight}
          language={match ? match[1] : 'text'}
          PreTag="div"
          customStyle={{
            margin: 0,
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
          }}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      )
    },
    a({ href, children }: ComponentPropsWithoutRef<'a'>) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`
            ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}
          `}
        >
          {children}
        </a>
      )
    },
    p({ children }: ComponentPropsWithoutRef<'p'>) {
      return (
        <p className="my-2 leading-relaxed">
          {children}
        </p>
      )
    },
    ul({ children }: ComponentPropsWithoutRef<'ul'>) {
      return (
        <ul className="list-disc pl-5 my-2 space-y-1">
          {children}
        </ul>
      )
    },
    ol({ children }: ComponentPropsWithoutRef<'ol'>) {
      return (
        <ol className="list-decimal pl-5 my-2 space-y-1">
          {children}
        </ol>
      )
    },
  }), [darkMode])

  return (
    <div
      className={`
        flex flex-col h-full overflow-hidden
        ${darkMode ? 'bg-gray-900' : 'bg-white'}
      `}
    >
      {/* ヘッダー */}
      <div
        className={`
          flex items-center justify-between px-4 py-3 border-b
          ${darkMode ? 'border-gray-700' : 'border-gray-200'}
        `}
      >
        <div className="flex items-center gap-2">
          <Icon name="robot" className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          <h2 className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            AIレビュー結果
          </h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`
              p-1 rounded-md transition-colors
              ${darkMode
                ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }
            `}
            title="閉じる"
          >
            <Icon name="close" className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* コンテンツ */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* ローディング状態 */}
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <LoadingSpinner size="lg" color="text-purple-500" label="AIがレビュー中" />
            <div className={`text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <p className="font-medium">設定ファイルをレビュー中...</p>
              <p className="text-sm mt-1 opacity-75">
                最適な設定と改善点を分析しています
              </p>
            </div>
          </div>
        )}

        {/* エラー状態 */}
        {status === 'error' && (
          <div
            className={`
              rounded-lg p-4 border
              ${darkMode
                ? 'bg-red-900/20 border-red-800 text-red-300'
                : 'bg-red-50 border-red-200 text-red-700'
              }
            `}
          >
            <div className="flex items-start gap-3">
              <Icon name="error" className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium">レビューに失敗しました</h3>
                <p className="mt-1 text-sm opacity-90">
                  {error || 'AIレビューの実行中にエラーが発生しました。'}
                </p>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className={`
                      mt-3 px-3 py-1.5 text-sm font-medium rounded-md
                      flex items-center gap-2 transition-colors
                      ${darkMode
                        ? 'bg-red-800 hover:bg-red-700 text-red-100'
                        : 'bg-red-100 hover:bg-red-200 text-red-700'
                      }
                    `}
                  >
                    <Icon name="refresh" className="w-4 h-4" />
                    再試行
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* アイドル状態 */}
        {status === 'idle' && !result && (
          <div className={`
            flex flex-col items-center justify-center h-full gap-3
            ${darkMode ? 'text-gray-400' : 'text-gray-500'}
          `}>
            <Icon name="robot" className="w-12 h-12 opacity-50" />
            <p className="text-center">
              AIレビューを実行すると、<br />
              設定ファイルの改善提案が表示されます
            </p>
          </div>
        )}

        {/* 成功状態: 結果表示 */}
        {(status === 'success' || (status === 'idle' && result)) && result && (
          <div className="space-y-6">
            {/* スコア表示 */}
            {result.overallScore !== undefined && (
              <div
                className={`
                  rounded-lg p-4 flex items-center gap-4
                  ${getScoreBg(result.overallScore, darkMode)}
                `}
              >
                <div
                  className={`
                    w-16 h-16 rounded-full flex items-center justify-center
                    border-4 font-bold text-2xl
                    ${getScoreColor(result.overallScore)}
                    ${darkMode ? 'border-gray-600' : 'border-gray-200'}
                    ${darkMode ? 'bg-gray-800' : 'bg-white'}
                  `}
                >
                  {result.overallScore}
                </div>
                <div>
                  <h3 className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    総合スコア
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {result.overallScore >= 80
                      ? '素晴らしい設定です!'
                      : result.overallScore >= 60
                        ? 'いくつかの改善点があります'
                        : '改善の余地が多くあります'}
                  </p>
                </div>
              </div>
            )}

            {/* サマリー */}
            <div>
              <h3 className={`
                font-medium mb-2
                ${darkMode ? 'text-gray-200' : 'text-gray-800'}
              `}>
                レビューサマリー
              </h3>
              <div
                className={`
                  prose prose-sm max-w-none
                  ${darkMode ? 'prose-invert' : ''}
                `}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {result.summary}
                </ReactMarkdown>
              </div>
            </div>

            {/* 一括適用ボタン */}
            {applicableSuggestions.length > 1 && onApplyAll && (
              <div
                className={`
                  rounded-lg p-3 flex items-center justify-between
                  ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}
                `}
              >
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {applicableSuggestions.length}件の提案を適用可能
                </span>
                <button
                  onClick={onApplyAll}
                  className="
                    px-3 py-1.5 text-sm font-medium rounded-md
                    bg-green-500 hover:bg-green-600 text-white
                    transition-colors flex items-center gap-1.5
                  "
                >
                  <Icon name="check" className="w-4 h-4" />
                  すべて適用
                </button>
              </div>
            )}

            {/* 改善提案一覧 */}
            {result.suggestions.length > 0 && (
              <div className="space-y-4">
                <h3 className={`
                  font-medium
                  ${darkMode ? 'text-gray-200' : 'text-gray-800'}
                `}>
                  改善提案 ({result.suggestions.length}件)
                </h3>

                {/* 重要な問題 */}
                {groupedSuggestions.error.length > 0 && (
                  <div className="space-y-3">
                    {groupedSuggestions.error.map((suggestion) => (
                      <ReviewSuggestion
                        key={suggestion.id}
                        suggestion={suggestion}
                        darkMode={darkMode}
                        onApply={onApplySuggestion}
                        onDismiss={onDismissSuggestion}
                        isApplying={applyingId === suggestion.id}
                      />
                    ))}
                  </div>
                )}

                {/* 警告 */}
                {groupedSuggestions.warning.length > 0 && (
                  <div className="space-y-3">
                    {groupedSuggestions.warning.map((suggestion) => (
                      <ReviewSuggestion
                        key={suggestion.id}
                        suggestion={suggestion}
                        darkMode={darkMode}
                        onApply={onApplySuggestion}
                        onDismiss={onDismissSuggestion}
                        isApplying={applyingId === suggestion.id}
                      />
                    ))}
                  </div>
                )}

                {/* 情報 */}
                {groupedSuggestions.info.length > 0 && (
                  <div className="space-y-3">
                    {groupedSuggestions.info.map((suggestion) => (
                      <ReviewSuggestion
                        key={suggestion.id}
                        suggestion={suggestion}
                        darkMode={darkMode}
                        onApply={onApplySuggestion}
                        onDismiss={onDismissSuggestion}
                        isApplying={applyingId === suggestion.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 提案なしの場合 */}
            {result.suggestions.length === 0 && (
              <div
                className={`
                  rounded-lg p-6 text-center
                  ${darkMode ? 'bg-green-900/20' : 'bg-green-50'}
                `}
              >
                <Icon
                  name="checkCircle"
                  className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-green-400' : 'text-green-500'}`}
                />
                <h3 className={`font-medium ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
                  問題は見つかりませんでした
                </h3>
                <p className={`text-sm mt-1 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                  現在の設定は適切に構成されています
                </p>
              </div>
            )}

            {/* レビュー日時 */}
            <div className={`
              text-xs text-center pt-2
              ${darkMode ? 'text-gray-500' : 'text-gray-400'}
            `}>
              レビュー日時: {result.reviewedAt.toLocaleString('ja-JP')}
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

AIReviewPanel.displayName = 'AIReviewPanel'

export default AIReviewPanel
