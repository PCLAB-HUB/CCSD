import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App'
import PreviewApp from './PreviewApp'

import './styles/globals.css'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found. Ensure index.html contains an element with id="root".')
}

// URLパスに基づいてコンポーネントを選択
const pathname = window.location.pathname
const href = window.location.href

// プレビューウィンドウの判定ロジック（より包括的に）
const isPreviewWindow = (() => {
  // 1. HTMLタイトルでの判定（最も信頼性が高い）
  if (document.title === 'Markdown Preview') {
    return true
  }

  // 2. パス名での判定
  if (pathname === '/preview' || pathname === '/preview.html') {
    return true
  }

  // 3. パス名の末尾での判定
  if (pathname.endsWith('/preview.html') || pathname.endsWith('/preview')) {
    return true
  }

  // 4. URL全体での判定（Tauriプロトコル対応）
  if (href.includes('preview.html') || href.includes('/preview')) {
    return true
  }

  return false
})()

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    {isPreviewWindow ? <PreviewApp /> : <App />}
  </React.StrictMode>,
)
