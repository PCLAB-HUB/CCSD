import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import PreviewApp from './PreviewApp'
import './styles/globals.css'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found. Ensure index.html contains an element with id="root".')
}

// デバッグ: 現在のURL情報をログ出力
console.log('[main.tsx] ========== MAIN.TSX LOADED ==========')
console.log('[main.tsx] URL Debug Info:', {
  href: window.location.href,
  pathname: window.location.pathname,
  origin: window.location.origin,
  protocol: window.location.protocol,
  host: window.location.host,
  search: window.location.search,
  hash: window.location.hash,
})
console.log('[main.tsx] document.title:', document.title)

// URLパスに基づいてコンポーネントを選択
// Tauriアプリでは様々な形式になる可能性がある:
// - tauri://localhost/preview.html
// - https://tauri.localhost/preview.html
// - file:///.../preview.html
// 開発時は http://localhost:1420/preview.html
const pathname = window.location.pathname
const href = window.location.href

// プレビューウィンドウの判定ロジック（より包括的に）
const isPreviewWindow = (() => {
  // 1. HTMLタイトルでの判定（最も信頼性が高い）
  if (document.title === 'Markdown Preview') {
    console.log('[main.tsx] Detected preview window by document.title')
    return true
  }

  // 2. パス名での判定
  if (pathname === '/preview' || pathname === '/preview.html') {
    console.log('[main.tsx] Detected preview window by exact pathname match')
    return true
  }

  // 3. パス名の末尾での判定
  if (pathname.endsWith('/preview.html') || pathname.endsWith('/preview')) {
    console.log('[main.tsx] Detected preview window by pathname suffix')
    return true
  }

  // 4. URL全体での判定（Tauriプロトコル対応）
  if (href.includes('preview.html') || href.includes('/preview')) {
    console.log('[main.tsx] Detected preview window by href content')
    return true
  }

  return false
})()

console.log('[main.tsx] isPreviewWindow:', isPreviewWindow)
console.log('[main.tsx] Rendering:', isPreviewWindow ? 'PreviewApp' : 'App')

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    {isPreviewWindow ? <PreviewApp /> : <App />}
  </React.StrictMode>,
)
