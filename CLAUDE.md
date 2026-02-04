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
- ファイルツリー表示・編集・保存
- タブエディタ（複数ファイル同時編集）
- 検索＆置換（正規表現対応、プレビュー、Undo）
- Markdownプレビュー
- バックアップ・復元
- お気に入り（ピン留め）
- インポート/エクスポート（ZIP対応）
- リンター・AIレビュー
- ダークモード
- **依存関係ツリー表示**（階層構造で参照関係を可視化）
- **ツリーフィルタ機能**（種類別表示/非表示、検索フィルター）
- **統計詳細表示**（統計項目クリックで詳細リスト表示）
- **スキルメタデータ表示**（発動条件、連携スキル/エージェント、使用例）
- **詳細パネルリサイズ**（ドラッグで幅変更、設定永続化）
- **英語→日本語簡易翻訳**（発動条件等のパターンマッチ翻訳）

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

### 今回のセッションで完了した作業
1. **詳細パネルのリサイズ機能**
   - NodeDetailPanelをドラッグでリサイズ可能に
   - 最小200px〜最大500px、localStorageで永続化
   - キーボード操作（矢印キー）対応

2. **発動条件の日本語翻訳**
   - `translationPatterns.ts`: パターンマッチによる簡易翻訳辞書
   - 動詞・名詞・フレーズのパターンを網羅
   - 発動条件とキーポイントに自動適用

### 直近コミット
- feat: 使用タイミングの表示を日本語に翻訳 (6e5bcab)
- feat: 詳細パネルのリサイズ機能を追加 (8e33b98)
- docs: セッション終了時のCLAUDE.md更新 (4346f9e)

### 次のタスク候補
- **Git自動化コマンドの実装**（計画作成済み、保留中）
- 複数ファイル一括置換
- カスタムテンプレート追加機能
- 関係性フローチャート表示（graphviz形式の可視化）
- 翻訳パターンの追加・改善（必要に応じて）

## 既知の問題・TODO
- プレビュー専用ウィンドウ（延期中）
- カスタムテンプレート追加（延期中）
