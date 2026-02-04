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
**最終更新: 2026-02-05**

### ターミナル統合機能 ✅ 完了
Claude Codeを内部で起動するためのターミナル機能が完成。

#### 実装ファイル:
- `src-tauri/src/commands/terminal.rs` - Rust PTY管理（portable-pty）
- `src/hooks/useTerminal.ts` - PTY接続・入出力管理
- `src/hooks/useTerminalPanel.ts` - パネル状態管理
- `src/components/terminal/` - UIコンポーネント群（TerminalPanel, TerminalView等）

#### 解決した問題:
1. **セッションIDタイミング問題** - `pendingSessionIdRef`と`isSpawningRef`で解決
2. **ターミナル再作成問題** - useEffectの依存配列からコールバックを削除、refで保持
3. **カスタムコマンド追加不可** - Tauriでprompt()が動作しないため、Reactモーダルに変更（AddCommandDialog）
4. **Headerレイアウト崩れ** - whitespace-nowrap, flex-shrink-0でボタン折り返しを防止

### 直近コミット
```
f9dd75f fix: Headerメニュー項目のレイアウト崩れを修正
994a49a fix: カスタムコマンド追加ダイアログをReactベースに変更
```

### 開発環境の状態
- 開発サーバー: ポート1420で動作中
- Git: mainブランチ

### 次のタスク候補
- デバッグログの削除（本番用クリーンアップ）
- Git自動化コマンドの実装
- 複数ファイル一括置換

## 既知の問題・TODO
- プレビュー専用ウィンドウ（延期中）
- カスタムテンプレート追加（延期中）
