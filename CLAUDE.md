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
- **依存関係グラフ可視化**（NEW）

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
**最終更新: 2026-01-30**

### 今回のセッションで完了した作業
**依存関係グラフ可視化機能（10体サブエージェント並列実装）**

1. **型定義**: `src/types/graph.ts` - GraphNode, GraphEdge, NodeDetail等
2. **参照パーサー**: `src/utils/referenceParser.ts` - スキル/サブエージェント参照の解析
3. **状態管理フック**: `src/hooks/useDependencyGraph.ts` - グラフデータの構築・管理
4. **UIコンポーネント**:
   - `DependencyGraph.tsx`: メインコンテナ
   - `GraphCanvas.tsx`: react-force-graph-2dによるグラフ描画
   - `NodeDetailPanel.tsx`: 選択ノードの詳細表示
   - `GraphLegend.tsx`: 凡例表示
5. **App.tsx統合**: ヘッダーボタンでグラフ表示切り替え

**機能詳細**:
- CLAUDE.md/スキル/サブエージェント間の参照関係をフォースレイアウトで可視化
- ノードタイプ別色分け（青:CLAUDE.md、緑:スキル、オレンジ:サブエージェント、紫:未分類）
- シングルクリックで詳細表示、ダブルクリックでファイルを開く
- 壊れた参照を赤破線で表示

### 直近コミット
- chore: react-force-graph-2d依存関係を追加
- feat: 依存関係グラフ機能をApp.tsxとMainAreaに統合
- feat: 依存グラフ状態管理フック(useDependencyGraph)を追加
- feat: 参照パーサーユーティリティを追加
- docs: 依存関係グラフビューア設計ドキュメント追加

### 次のタスク候補
- 複数ファイル一括置換
- カスタムテンプレート追加機能
- グラフフィルタ機能（種類別表示/非表示）

## 既知の問題・TODO
- プレビュー専用ウィンドウ（延期中）
- カスタムテンプレート追加（延期中）
