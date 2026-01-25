/**
 * プレビューウィンドウ専用のアプリケーションエントリーポイント
 *
 * 別ウィンドウで開かれるMarkdownプレビュー専用の軽量アプリケーション
 */
import { useEffect } from 'react'
import PreviewWindow from './components/preview/PreviewWindow'
import './styles/globals.css'

function PreviewApp() {
  // デバッグ: PreviewAppのマウント確認
  useEffect(() => {
    console.log('[PreviewApp] ========== PREVIEW APP MOUNTED ==========')
    console.log('[PreviewApp] window.location:', window.location.href)
    console.log('[PreviewApp] document.title:', document.title)

    // bodyにクラスを追加（デバッグ用）
    document.body.classList.add('preview-window')

    return () => {
      console.log('[PreviewApp] ========== PREVIEW APP UNMOUNTED ==========')
    }
  }, [])

  return <PreviewWindow />
}

export default PreviewApp
