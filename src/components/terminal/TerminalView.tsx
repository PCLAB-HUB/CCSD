import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'

/**
 * ターミナルテーマ設定（ダークテーマ）
 */
const TERMINAL_THEME = {
  background: '#1e1e1e',
  foreground: '#d4d4d4',
  cursor: '#d4d4d4',
  cursorAccent: '#1e1e1e',
  selectionBackground: '#264f78',
  selectionForeground: '#ffffff',
  black: '#1e1e1e',
  red: '#f44747',
  green: '#6a9955',
  yellow: '#dcdcaa',
  blue: '#569cd6',
  magenta: '#c586c0',
  cyan: '#4ec9b0',
  white: '#d4d4d4',
  brightBlack: '#808080',
  brightRed: '#f44747',
  brightGreen: '#6a9955',
  brightYellow: '#dcdcaa',
  brightBlue: '#569cd6',
  brightMagenta: '#c586c0',
  brightCyan: '#4ec9b0',
  brightWhite: '#ffffff',
}

/**
 * ターミナルインスタンスを外部から操作するためのハンドル
 */
export interface TerminalViewHandle {
  /** ターミナルインスタンス */
  terminal: Terminal | null
  /** リサイズを実行 */
  fit: () => void
  /** フォーカスを設定 */
  focus: () => void
  /** テキストを書き込み */
  write: (data: string) => void
  /** 出力をクリア */
  clear: () => void
}

interface TerminalViewProps {
  /** ターミナルからのデータ入力時のコールバック */
  onData?: (data: string) => void
  /** ターミナルサイズ変更時のコールバック */
  onResize?: (cols: number, rows: number) => void
  /** フォントサイズ */
  fontSize?: number
  /** フォントファミリー */
  fontFamily?: string
  /** 追加のクラス名 */
  className?: string
}

/**
 * xterm.jsベースのターミナルビュー
 *
 * - @xterm/xtermを使用
 * - @xterm/addon-fitで自動リサイズ
 * - @xterm/addon-web-linksでリンクをクリック可能に
 * - ダークテーマ（背景: #1e1e1e）
 * - refでTerminalViewHandleを公開
 */
const TerminalView = forwardRef<TerminalViewHandle, TerminalViewProps>(
  (
    {
      onData,
      onResize,
      fontSize = 14,
      fontFamily = 'Menlo, Monaco, "Courier New", monospace',
      className = '',
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const terminalRef = useRef<Terminal | null>(null)
    const fitAddonRef = useRef<FitAddon | null>(null)

    // コールバックをrefで保持（再作成を防ぐため）
    const onDataRef = useRef(onData)
    const onResizeRef = useRef(onResize)

    // コールバックが変わったらrefを更新
    useEffect(() => {
      onDataRef.current = onData
    }, [onData])

    useEffect(() => {
      onResizeRef.current = onResize
    }, [onResize])

    // ターミナルインスタンスの初期化（fontSize/fontFamilyが変わったときのみ再作成）
    useEffect(() => {
      if (!containerRef.current) return

      console.log('[TerminalView] Creating terminal instance...')

      // ターミナルを作成
      const terminal = new Terminal({
        theme: TERMINAL_THEME,
        fontSize,
        fontFamily,
        cursorBlink: true,
        cursorStyle: 'block',
        scrollback: 10000,
        convertEol: true,
        allowProposedApi: true,
      })

      // アドオンを追加
      const fitAddon = new FitAddon()
      const webLinksAddon = new WebLinksAddon()

      terminal.loadAddon(fitAddon)
      terminal.loadAddon(webLinksAddon)

      // DOMにアタッチ
      terminal.open(containerRef.current)
      console.log('[TerminalView] Terminal opened, container:', {
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
      })

      // 初回フィット
      setTimeout(() => {
        try {
          fitAddon.fit()
          console.log('[TerminalView] Initial fit done, terminal size:', {
            cols: terminal.cols,
            rows: terminal.rows,
          })
        } catch (e) {
          console.error('[TerminalView] Initial fit failed:', e)
        }
      }, 100)

      // 参照を保存
      terminalRef.current = terminal
      fitAddonRef.current = fitAddon

      // データ入力イベント（refを通じてコールバックにアクセス）
      const dataDisposable = terminal.onData((data) => {
        onDataRef.current?.(data)
      })

      // リサイズイベント（refを通じてコールバックにアクセス）
      const resizeDisposable = terminal.onResize(({ cols, rows }) => {
        onResizeRef.current?.(cols, rows)
      })

      // クリーンアップ
      return () => {
        console.log('[TerminalView] Disposing terminal instance...')
        dataDisposable.dispose()
        resizeDisposable.dispose()
        terminal.dispose()
        terminalRef.current = null
        fitAddonRef.current = null
      }
    }, [fontSize, fontFamily]) // onData, onResizeを依存配列から削除

    // コンテナサイズ変更時のリサイズ対応
    useEffect(() => {
      if (!containerRef.current || !fitAddonRef.current) return

      const resizeObserver = new ResizeObserver(() => {
        if (fitAddonRef.current) {
          try {
            fitAddonRef.current.fit()
          } catch {
            // リサイズ中の一時的なエラーを無視
          }
        }
      })

      resizeObserver.observe(containerRef.current)

      return () => {
        resizeObserver.disconnect()
      }
    }, [])

    // 外部からアクセス可能なハンドルを公開
    useImperativeHandle(
      ref,
      () => ({
        terminal: terminalRef.current,
        fit: () => {
          if (fitAddonRef.current) {
            try {
              fitAddonRef.current.fit()
            } catch {
              // エラーを無視
            }
          }
        },
        focus: () => {
          terminalRef.current?.focus()
        },
        write: (data: string) => {
          console.log('[TerminalView] write called:', {
            dataLength: data.length,
            hasTerminal: !!terminalRef.current,
          })
          if (terminalRef.current) {
            terminalRef.current.write(data)
            console.log('[TerminalView] write to xterm.js done')
          } else {
            console.warn('[TerminalView] terminalRef.current is null!')
          }
        },
        clear: () => {
          terminalRef.current?.clear()
        },
      }),
      []
    )

    return (
      <div
        ref={containerRef}
        className={`w-full h-full overflow-hidden ${className}`}
        style={{ backgroundColor: TERMINAL_THEME.background }}
      />
    )
  }
)

TerminalView.displayName = 'TerminalView'

export default memo(TerminalView)
