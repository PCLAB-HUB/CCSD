/**
 * プレビューウィンドウ専用のアプリケーションエントリーポイント
 *
 * 別ウィンドウで開かれるMarkdownプレビュー専用の軽量アプリケーション
 */
import { useEffect } from 'react'

import PreviewWindow from './components/preview/PreviewWindow'

import './styles/globals.css'

function PreviewApp() {
  // bodyにクラスを追加
  useEffect(() => {
    document.body.classList.add('preview-window')
  }, [])

  return <PreviewWindow />
}

export default PreviewApp
