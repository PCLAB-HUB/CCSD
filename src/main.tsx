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
// ビルド後は /preview.html、開発時は /preview となる
const isPreviewWindow = window.location.pathname === '/preview' ||
                        window.location.pathname === '/preview.html' ||
                        window.location.pathname.endsWith('/preview.html')

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    {isPreviewWindow ? <PreviewApp /> : <App />}
  </React.StrictMode>,
)
