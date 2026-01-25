/**
 * プレビューウィンドウ専用のアプリケーションエントリーポイント
 *
 * 別ウィンドウで開かれるMarkdownプレビュー専用の軽量アプリケーション
 */
import PreviewWindow from './components/preview/PreviewWindow'
import './styles/globals.css'

function PreviewApp() {
  return <PreviewWindow />
}

export default PreviewApp
