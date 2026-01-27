import { memo, useCallback, useEffect, useMemo, useRef, type ComponentPropsWithoutRef, type FC } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm'

import { parseMarkdown } from '../../utils/markdownParser'
import FrontmatterDisplay from './FrontmatterDisplay'

interface MarkdownPreviewProps {
  content: string
  darkMode: boolean
  scrollSync?: boolean
  editorScrollTop?: number
  editorScrollHeight?: number
  onScroll?: (scrollTop: number, scrollHeight: number) => void
}

const MarkdownPreview: FC<MarkdownPreviewProps> = memo(({
  content,
  darkMode,
  scrollSync = false,
  editorScrollTop = 0,
  editorScrollHeight = 1,
  onScroll,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  // Markdownをパース
  const { frontmatter, content: markdownContent, hasFrontmatter } = useMemo(
    () => parseMarkdown(content),
    [content]
  )

  // エディタのスクロールに同期
  useEffect(() => {
    if (!scrollSync || !containerRef.current) return

    const container = containerRef.current
    const scrollRatio = editorScrollTop / Math.max(editorScrollHeight - container.clientHeight, 1)
    const targetScrollTop = scrollRatio * (container.scrollHeight - container.clientHeight)

    container.scrollTop = targetScrollTop
  }, [scrollSync, editorScrollTop, editorScrollHeight])

  // プレビューのスクロールを通知
  const handleScroll = useCallback(() => {
    if (!scrollSync || !containerRef.current || !onScroll) return

    const container = containerRef.current
    onScroll(container.scrollTop, container.scrollHeight)
  }, [scrollSync, onScroll])

  // ReactMarkdownのcomponentsオブジェクトをメモ化
  const markdownComponents = useMemo(() => ({
    // コードブロック
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
    // リンク
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
    // テーブル
    table({ children }: ComponentPropsWithoutRef<'table'>) {
      return (
        <div className="overflow-x-auto my-4">
          <table className={`
            min-w-full border-collapse
            ${darkMode ? 'border-gray-700' : 'border-gray-200'}
          `}>
            {children}
          </table>
        </div>
      )
    },
    th({ children }: ComponentPropsWithoutRef<'th'>) {
      return (
        <th className={`
          px-4 py-2 text-left font-semibold border
          ${darkMode
            ? 'bg-gray-800 border-gray-700'
            : 'bg-gray-100 border-gray-200'
          }
        `}>
          {children}
        </th>
      )
    },
    td({ children }: ComponentPropsWithoutRef<'td'>) {
      return (
        <td className={`
          px-4 py-2 border
          ${darkMode ? 'border-gray-700' : 'border-gray-200'}
        `}>
          {children}
        </td>
      )
    },
    // 見出し
    h1({ children }: ComponentPropsWithoutRef<'h1'>) {
      return (
        <h1 className={`
          text-3xl font-bold mt-6 mb-4 pb-2 border-b
          ${darkMode ? 'border-gray-700' : 'border-gray-200'}
        `}>
          {children}
        </h1>
      )
    },
    h2({ children }: ComponentPropsWithoutRef<'h2'>) {
      return (
        <h2 className={`
          text-2xl font-bold mt-5 mb-3 pb-1 border-b
          ${darkMode ? 'border-gray-700' : 'border-gray-200'}
        `}>
          {children}
        </h2>
      )
    },
    h3({ children }: ComponentPropsWithoutRef<'h3'>) {
      return (
        <h3 className="text-xl font-bold mt-4 mb-2">
          {children}
        </h3>
      )
    },
    // リスト
    ul({ children }: ComponentPropsWithoutRef<'ul'>) {
      return (
        <ul className="list-disc pl-6 my-2 space-y-1">
          {children}
        </ul>
      )
    },
    ol({ children }: ComponentPropsWithoutRef<'ol'>) {
      return (
        <ol className="list-decimal pl-6 my-2 space-y-1">
          {children}
        </ol>
      )
    },
    // 引用
    blockquote({ children }: ComponentPropsWithoutRef<'blockquote'>) {
      return (
        <blockquote className={`
          pl-4 my-4 border-l-4 italic
          ${darkMode
            ? 'border-gray-600 text-gray-400'
            : 'border-gray-300 text-gray-600'
          }
        `}>
          {children}
        </blockquote>
      )
    },
    // 水平線
    hr() {
      return (
        <hr className={`
          my-6 border-0 h-px
          ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}
        `} />
      )
    },
    // 段落
    p({ children }: ComponentPropsWithoutRef<'p'>) {
      return (
        <p className="my-3 leading-relaxed">
          {children}
        </p>
      )
    },
    // チェックボックス (GFM)
    input({ type, checked }: ComponentPropsWithoutRef<'input'>) {
      if (type === 'checkbox') {
        return (
          <input
            type="checkbox"
            checked={checked}
            readOnly
            className={`
              mr-2 rounded
              ${darkMode ? 'accent-blue-500' : 'accent-blue-600'}
            `}
          />
        )
      }
      return null
    },
  }), [darkMode])

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`
        h-full overflow-y-auto p-6
        ${darkMode ? 'bg-gray-900' : 'bg-white'}
      `}
    >
      {/* フロントマター表示 */}
      {hasFrontmatter && frontmatter && (
        <FrontmatterDisplay frontmatter={frontmatter} darkMode={darkMode} />
      )}

      {/* Markdownコンテンツ */}
      <div
        className={`
          prose max-w-none
          ${darkMode ? 'prose-invert' : ''}
        `}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}
        >
          {markdownContent}
        </ReactMarkdown>
      </div>
    </div>
  )
})

MarkdownPreview.displayName = 'MarkdownPreview'

export default MarkdownPreview
