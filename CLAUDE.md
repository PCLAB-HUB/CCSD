# Claude Setting Dashboard

## プロジェクト概要
Claude Codeの設定ファイル（CLAUDE.md、スキル、サブエージェント等）を一括管理するデスクトップアプリ。
Tauri v2 + React 19 + TypeScript + TailwindCSS v4 + Monaco Editor

## アーキテクチャ

```
src/                    # フロントエンド (React)
├── App.tsx             # ルートコンポーネント、状態管理の統合
├── components/
│   ├── layout/         # Header, MainArea, Sidebar, StatusBar, ClaudeVersionBadge
│   ├── editor/         # Monaco Editor関連
│   ├── graph/          # 依存関係グラフ可視化
│   ├── github/         # GitHubリポジトリパネル
│   ├── search/         # 検索＆置換パネル
│   ├── tabs/           # タブエディタUI
│   ├── terminal/       # ターミナル統合（実装中）
│   ├── tree/           # ファイルツリー
│   └── ...
├── hooks/              # カスタムフック (~30個)
│   ├── tauri/          # Tauri API層
│   ├── useFileManager.ts
│   ├── useTerminal.ts      # PTY接続管理
│   ├── useTerminalPanel.ts # パネル状態管理
│   ├── useQuickCommands.ts # クイックコマンド管理
│   ├── useTerminalHistory.ts # コマンド履歴
│   └── ...
├── types/              # 型定義
│   ├── terminal.ts     # ターミナル関連型
│   └── ...
└── utils/              # ユーティリティ

src-tauri/              # バックエンド (Rust)
├── src/
│   ├── lib.rs          # エントリーポイント
│   ├── commands/       # Tauriコマンド
│   │   ├── files.rs    # ファイル操作
│   │   ├── backup.rs   # バックアップ
│   │   ├── favorites.rs # お気に入り
│   │   ├── version.rs  # Claude Codeバージョン取得
│   │   ├── terminal.rs # PTY管理（portable-pty）
│   │   └── ...
│   ├── types.rs        # 型定義
│   └── error.rs        # エラー型
└── tauri.conf.json
```

## 実装済み機能

### 基本機能
- ファイルツリー表示・編集・保存
- タブエディタ（複数ファイル同時編集）
- 検索＆置換（正規表現対応、プレビュー、Undo）
- Markdownプレビュー
- バックアップ・復元
- お気に入り（ピン留め）
- インポート/エクスポート（ZIP対応）
- リンター・AIレビュー
- ダークモード

### 依存関係グラフ機能
- **依存関係ツリー表示**: 階層構造で参照関係を可視化
- **ツリーフィルタ機能**: 種類別表示/非表示、検索フィルター
- **統計詳細表示**: 統計項目クリックで詳細リスト表示
- **詳細パネルリサイズ**: ドラッグで幅変更（200-500px）、localStorageで永続化

### スキル/エージェント情報表示
- **メタデータ表示**: 発動条件、連携スキル/エージェント、使用例
- **英語→日本語簡易翻訳**: パターンマッチによる自動翻訳
- **「ウェブで翻訳」ボタン**: 翻訳しきれない英文をGoogle翻訳で確認

### Claude Code情報表示
- **バージョン表示**: Headerの検索バー左にClaude Codeバージョンをバッジ表示
- **GitHub人気リポジトリ**: Header直下に折りたたみパネル

## 重要な設計パターン

### 状態管理
App.tsxで統合フックを使用（リファクタリング後）:
- useFileManager: ファイル選択・保存
- useTabEditor: タブ管理
- useAppSearchReplace: 検索＆置換統合（hooks/app/）
- useAppAIReview: AIレビュー統合（hooks/app/）
- useAppKeyboardShortcuts: キーボードショートカット統合（hooks/app/）

### Tauri API層
`src/hooks/tauri/`でRustコマンドをラップ:
- エラーハンドリング統一（utils/errorMessages.ts）
- 日本語エラーメッセージ

### 定数管理
`src/constants/`で一元管理:
- timing.ts: タイムアウト、デバウンス
- storage.ts: localStorageキー
- api.ts: APIエンドポイント、モデル名
- ui.ts: レイアウト、スコア範囲

## 開発コマンド
```bash
npm run tauri dev    # 開発サーバー起動
npm run tauri build  # 本番ビルド
cargo check --manifest-path src-tauri/Cargo.toml  # Rustチェック
npx tsc --noEmit     # TypeScriptチェック
```

## 現在の作業状態
**最終更新: 2026-02-04**

### 今回セッションで実装した機能（未完了）
**ターミナル統合機能** - Claude Codeを内部で起動するための機能

#### 実装済みファイル:
- `src-tauri/src/commands/terminal.rs` - Rust PTY管理（portable-pty）
- `src/types/terminal.ts` - TypeScript型定義
- `src/hooks/useTerminal.ts` - PTY接続・入出力管理
- `src/hooks/useTerminalPanel.ts` - パネル状態管理
- `src/hooks/useQuickCommands.ts` - クイックコマンド管理
- `src/hooks/useTerminalHistory.ts` - コマンド履歴管理
- `src/components/terminal/` - UIコンポーネント群
  - TerminalPanel.tsx（forwardRef対応済み）
  - TerminalView.tsx（xterm.js）
  - QuickCommands.tsx
  - TerminalTabs.tsx
  - TerminalToolbar.tsx

#### 設計ドキュメント:
- `docs/plans/2026-02-04-terminal-integration-design.md`

### 今回のセッションで修正した問題
**Claudeボタンを押してもClaude Codeが起動しない問題**

#### 根本原因:
タイミング問題 - `spawn_terminal`呼び出し中にRustからイベントが発火されるが、
セッションIDがまだフロントエンドに設定されていないため、イベントが無視されていた。

#### 修正内容:
1. **セッションIDのタイミング問題を修正** (`useTerminal.ts`)
   - `pendingSessionIdRef`と`isSpawningRef`を追加
   - `isAllowedSession`関数で起動中のセッションからのイベントを許可
   - 最初のイベント受信時にpendingSessionIdRefを自動設定

2. **パネル自動オープン** (`App.tsx`)
   - `handleExecuteTerminalCommand`でコマンド実行前にパネルを開く
   - TerminalViewがマウントされるまで待機してからspawn

3. **デバッグログの追加**
   - フロー追跡用のconsole.logを各ポイントに追加

### 直近コミット
```
67aacaf fix: ターミナルセッションIDのタイミング問題を修正
ca3a86d fix: TerminalPanelにforwardRefを追加しref接続を修正
aff70cf fix: ターミナルのセッションID管理を修正
1d9fbe2 fix: ターミナルパネルのレイアウトを右寄せに変更
1108a61 feat: ターミナル統合機能を追加
```

### 動作確認手順
1. アプリを起動 (`npm run tauri dev`)
2. 画面下部の「ターミナル」をクリックしてパネルを開く
3. 「Claude」ボタンをクリック
4. ブラウザの開発者ツールでコンソールログを確認:
   - `[App] handleExecuteTerminalCommand called`
   - `[useTerminal] Starting spawn`
   - `[useTerminal] spawn_terminal returned`
   - `[useTerminal] isAllowedSession check` (allowed状態になること)
   - `[App] onOutput received`

### 開発環境の状態
- 開発サーバー: ポート1420で動作中
- Git: mainブランチ、複数コミットpush待ち

## 既知の問題・TODO
- **ターミナル統合機能** - 修正済み、テスト待ち
- プレビュー専用ウィンドウ（延期中）
- カスタムテンプレート追加（延期中）
