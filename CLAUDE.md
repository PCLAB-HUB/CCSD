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
**最終更新: 2026-01-27**

### 今回のセッションで完了した作業
**大規模リファクタリング（10体サブエージェント並列実行）**

1. **App.tsx分割**: 803行→601行（25%削減）
   - useAppSearchReplace, useAppAIReview, useAppKeyboardShortcuts作成
2. **useLinter.ts分割**: 605行→3ファイル（140+376+124行）
   - frontmatterParser.ts, linter.ts分離
3. **型定義統一**: SearchMatch型を1箇所に集約
4. **定数一元化**: src/constants/に4ファイル作成
5. **重複コード共通化**: Rustパス正規化をnormalize_claude_path()に統合
6. **エラーハンドリング統一**: logError()ユーティリティ追加
7. **useEffect修正**: eslint-disable削除、二重初期化解消
8. **console.log削除**: デバッグコード約50行削除

### 直近コミット（10件）
- App.tsxを新しい統合フックで簡略化
- インポート順序を整理
- リンターによるコードフォーマット整形
- console.log/デバッグコードを削除
- エラーハンドリングを統一
- SearchMatch/ReplaceResult型定義を統一
- ハードコードされた定数を一元管理
- 命名規則を改善
- 重複コードを共通化
- useEffect依存配列を修正

### 次のタスク候補
- パフォーマンス最適化（チャンクサイズ警告対応）
- 複数ファイル一括置換
- カスタムテンプレート追加機能

## 既知の問題・TODO
- ビルド時のチャンクサイズ警告（syntax-highlighter 622KB）
- プレビュー専用ウィンドウ（延期中）
- カスタムテンプレート追加（延期中）
