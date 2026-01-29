/**
 * 軽量版シンタックスハイライトコンポーネント
 *
 * PrismLightを使用し、必要な言語のみを登録することで
 * バンドルサイズを大幅に削減（622KB → ~50KB）
 */
import { memo, type FC } from 'react'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'

// 必要な言語のみを登録（Claude設定ファイルで使用される言語）
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript'
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json'
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml'
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown'
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash'
import rust from 'react-syntax-highlighter/dist/esm/languages/prism/rust'
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css'
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python'
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx'
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx'
import toml from 'react-syntax-highlighter/dist/esm/languages/prism/toml'

// 言語を登録
SyntaxHighlighter.registerLanguage('javascript', javascript)
SyntaxHighlighter.registerLanguage('js', javascript)
SyntaxHighlighter.registerLanguage('typescript', typescript)
SyntaxHighlighter.registerLanguage('ts', typescript)
SyntaxHighlighter.registerLanguage('json', json)
SyntaxHighlighter.registerLanguage('yaml', yaml)
SyntaxHighlighter.registerLanguage('yml', yaml)
SyntaxHighlighter.registerLanguage('markdown', markdown)
SyntaxHighlighter.registerLanguage('md', markdown)
SyntaxHighlighter.registerLanguage('bash', bash)
SyntaxHighlighter.registerLanguage('shell', bash)
SyntaxHighlighter.registerLanguage('sh', bash)
SyntaxHighlighter.registerLanguage('rust', rust)
SyntaxHighlighter.registerLanguage('rs', rust)
SyntaxHighlighter.registerLanguage('css', css)
SyntaxHighlighter.registerLanguage('python', python)
SyntaxHighlighter.registerLanguage('py', python)
SyntaxHighlighter.registerLanguage('tsx', tsx)
SyntaxHighlighter.registerLanguage('jsx', jsx)
SyntaxHighlighter.registerLanguage('toml', toml)

interface CodeBlockProps {
  language: string
  children: string
  darkMode: boolean
}

const CodeBlock: FC<CodeBlockProps> = memo(({ language, children, darkMode }) => {
  return (
    <SyntaxHighlighter
      style={darkMode ? oneDark : oneLight}
      language={language || 'text'}
      PreTag="div"
      customStyle={{
        margin: 0,
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
      }}
    >
      {children}
    </SyntaxHighlighter>
  )
})

CodeBlock.displayName = 'CodeBlock'

export default CodeBlock
