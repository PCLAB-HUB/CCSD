# Claude Setting Dashboard

## プロジェクト概要
Claude Codeの設定ファイル（CLAUDE.md、スキル、サブエージェント等）を一括管理するデスクトップアプリ。
Tauri v2 + React 19 + TypeScript + TailwindCSS v4 + Monaco Editor

## アーキテクチャ

```
src/                    # フロントエンド (React)
├── App.tsx             # ルートコンポーネント、状態管理の統合
├── components/
│   ├── layout/         # Header, MainArea, Sidebar, StatusBar
│   ├── editor/         # Monaco Editor関連
│   ├── graph/          # 依存関係グラフ可視化
│   ├── search/         # 検索＆置換パネル
│   ├── tabs/           # タブエディタUI
│   ├── tree/           # ファイルツリー
│   └── ...
├── hooks/              # カスタムフック (~30個)
│   ├── tauri/          # Tauri API層
│   ├── useFileManager.ts
│   ├── useSearchReplace.ts
│   ├── useSearchHighlight.ts
│   └── ...
├── types/              # 型定義
└── utils/              # ユーティリティ

src-tauri/              # バックエンド (Rust)
├── src/
│   ├── lib.rs          # エントリーポイント
│   ├── commands/       # Tauriコマンド
│   │   ├── files.rs    # ファイル操作
│   │   ├── backup.rs   # バックアップ
│   │   ├── favorites.rs # お気に入り
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
  - 動詞・名詞・フレーズパターン辞書（`translationPatterns.ts`）
  - 発動条件・キーポイントに自動適用
- **「ウェブで翻訳」ボタン**: 翻訳しきれない英文をGoogle翻訳で確認
  - 英語が残っている場合のみ表示
  - tauri-plugin-openerでブラウザを起動

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

### 検索ハイライトの流れ
```
SearchReplacePanel → useSearchReplace → App.tsx同期 → searchHighlight
→ MainArea → useSearchHighlight → Monaco Editor decorations
```

## 開発コマンド
```bash
npm run tauri dev    # 開発サーバー起動
npm run tauri build  # 本番ビルド
cargo check --manifest-path src-tauri/Cargo.toml  # Rustチェック
npx tsc --noEmit     # TypeScriptチェック
```

## 現在の作業状態
**最終更新: 2026-02-04**

### 前回セッションで完了した作業
1. **「ウェブで翻訳」ボタン追加** (1642f4d)
   - パターン翻訳で完全に日本語化できなかった場合のみ表示
   - クリックでGoogle翻訳をブラウザで開く
   - tauri-plugin-openerを導入

2. **詳細パネルのリサイズ機能** (8e33b98)
   - NodeDetailPanelをドラッグでリサイズ可能
   - 最小200px〜最大500px、localStorageで永続化

3. **発動条件の日本語翻訳** (6e5bcab)
   - `translationPatterns.ts`: パターンマッチ翻訳辞書

4. **ドキュメント更新** (15e3c1e)
   - README.mdを現在の仕様に全面更新
   - CLAUDE.mdを更新

### 直近コミット
- docs: README.mdを現在の仕様に合わせて全面更新 (15e3c1e)
- docs: CLAUDE.md更新 (231f306)
- feat: 翻訳しきれない英文用の「ウェブで翻訳」ボタンを追加 (1642f4d)

### 次のタスク候補
- **Git自動化コマンドの実装**（計画作成済み、保留中）
- 複数ファイル一括置換
- カスタムテンプレート追加機能
- 関係性フローチャート表示（graphviz形式の可視化）
- 翻訳パターンの追加（必要に応じて）

### 開発環境の状態
- 開発サーバー: ポート1420で起動中の可能性あり
- Git: mainブランチ、リモートと同期済み

## 既知の問題・TODO
- プレビュー専用ウィンドウ（延期中）
- カスタムテンプレート追加（延期中）
