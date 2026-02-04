# ターミナル統合機能 設計書

## 概要
Claude Code専用のターミナルをアプリ内に統合し、スキル/エージェント開発をサポートする。

## レイアウト
- 下部パネル、中央揃え（左右に余白）
- VS Code/Cursorスタイル
- 折りたたみ可能、リサイズ可能
- 最大幅: 900px（調整可能）

## 機能要件

### 基本機能
- xterm.jsによる本格的なターミナルエミュレーション
- ANSIカラー完全対応
- 入力補完、カーソル移動対応

### クイックコマンド
- `claude` - 新規セッション開始
- `claude --resume` - 前回セッション再開
- 編集中スキルをテスト実行
- カスタムコマンド登録
- コマンド履歴（直近20件）

### ファイル連携
- 編集中のスキル/エージェントファイルをClaude Codeに渡す
- ファイルパスをコマンドに挿入

## 技術構成

### Rust側
```
src-tauri/src/commands/terminal.rs
- portable-pty クレートでPTY管理
- Tauriイベントで双方向通信
  - terminal:output (PTY → Frontend)
  - terminal:input (Frontend → PTY)
  - terminal:resize (Frontend → PTY)
```

### フロントエンド
```
src/components/terminal/
├── TerminalPanel.tsx       # パネル全体
├── TerminalTabs.tsx        # タブ切り替え
├── TerminalView.tsx        # xterm.js本体
├── TerminalToolbar.tsx     # ツールバー
├── QuickCommands.tsx       # クイックコマンド
└── CommandHistory.tsx      # 履歴ドロップダウン

src/hooks/
├── useTerminal.ts          # PTY接続管理
├── useTerminalHistory.ts   # 履歴管理
└── useQuickCommands.ts     # カスタムコマンド管理

src/types/terminal.ts       # 型定義
```

### 依存関係
- Rust: portable-pty
- npm: xterm, xterm-addon-fit, xterm-addon-web-links

## 実装順序
1. 依存関係インストール
2. Rust側PTY実装 + 型定義（並列）
3. フック実装 + UIコンポーネント（並列）
4. App.tsx統合
5. 動作確認
