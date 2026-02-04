# Claude Code Settings Dashboard

Claude Codeの設定ファイル（CLAUDE.md、スキル、エージェント等）を一元管理できるデスクトップアプリケーション。

## 特徴

### エディタ機能
- **Monaco Editor統合**: VSCode同等の編集体験
- **タブエディタ**: 複数ファイルの同時編集
- **検索＆置換**: 正規表現対応、プレビュー、Undo機能
- **Markdownプレビュー**: リアルタイムプレビュー表示
- **構文検証**: YAML/JSON/Markdownの構文チェック

### ファイル管理
- **ファイルツリー**: 階層構造でファイルを表示・管理
- **お気に入り**: よく使うファイルをピン留め
- **バックアップ・復元**: 自動バックアップと履歴管理
- **インポート/エクスポート**: 単体ファイル・ZIP一括対応

### 依存関係グラフ
- **ツリービュー**: スキル・エージェント間の参照関係を階層表示
- **フィルタ機能**: 種類別の表示/非表示切り替え
- **統計表示**: ファイル数・参照数などの統計情報
- **詳細パネル**: 選択ノードの詳細情報（リサイズ可能）

### スキル/エージェント情報
- **メタデータ表示**: 発動条件、連携コンポーネント、使用例
- **日本語翻訳**: 英語の発動条件をパターンマッチで自動翻訳
- **ウェブ翻訳**: 翻訳しきれない英文はGoogle翻訳で確認可能

### Claude Code情報
- **バージョン表示**: インストールされているClaude Codeのバージョンをヘッダーに表示
- **人気リポジトリ**: GitHub上のClaude Code関連リポジトリ（スター数上位10件）を折りたたみパネルで表示
  - sessionStorageでキャッシュ（30分有効）
  - レート制限対策済み

### その他
- **ダークモード**: ライト/ダーク切り替え
- **AIレビュー**: Claude APIによるコードレビュー（オプション）

## スクリーンショット

（準備中）

## 必要な環境

- Node.js 18以上
- Rust 1.77以上（Tauriビルド用）
- macOS / Windows / Linux

### Rustのインストール（未インストールの場合）

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

## セットアップ

```bash
# リポジトリのクローン
git clone https://github.com/PCLAB-HUB/CCSD.git
cd CCSD

# 依存関係のインストール
npm install

# 開発サーバー起動
npm run tauri dev

# プロダクションビルド
npm run tauri build
```

## 管理対象ファイル

| パス | 形式 | 用途 |
|------|------|------|
| `~/.claude/CLAUDE.md` | Markdown | グローバル設定・メモリ |
| `~/.claude/settings.json` | JSON | アプリケーション設定 |
| `~/.claude/skills/*/` | YAML+Markdown | スキル定義 |
| `~/.claude/agents/` | YAML+Markdown | エージェント定義 |
| `<project>/CLAUDE.md` | Markdown | プロジェクト固有設定 |

## プロジェクト構造

```
ClaudeSettingDashBoard/
├── src/                         # フロントエンド (React)
│   ├── App.tsx                  # ルートコンポーネント
│   ├── components/
│   │   ├── layout/              # Header, MainArea, Sidebar, ClaudeVersionBadge
│   │   ├── editor/              # Monaco Editor関連
│   │   ├── graph/               # 依存関係グラフ
│   │   ├── github/              # GitHubリポジトリパネル
│   │   ├── search/              # 検索＆置換パネル
│   │   ├── tabs/                # タブエディタUI
│   │   └── tree/                # ファイルツリー
│   ├── hooks/                   # カスタムフック
│   │   ├── tauri/               # Tauri API層
│   │   └── app/                 # 統合フック
│   ├── types/                   # 型定義
│   ├── utils/                   # ユーティリティ
│   └── constants/               # 定数管理
├── src-tauri/                   # バックエンド (Rust)
│   ├── src/
│   │   ├── lib.rs               # エントリーポイント
│   │   ├── commands/            # Tauriコマンド（files, backup, version等）
│   │   ├── types.rs             # 型定義
│   │   └── error.rs             # エラー型
│   ├── capabilities/            # 権限設定
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
├── CLAUDE.md                    # プロジェクト設定
└── README.md
```

## 技術スタック

| カテゴリ | 技術 |
|----------|------|
| フレームワーク | Tauri v2 |
| フロントエンド | React 19 + TypeScript |
| スタイリング | TailwindCSS v4 |
| エディタ | Monaco Editor |
| バックエンド | Rust |
| プラグイン | tauri-plugin-fs, tauri-plugin-dialog, tauri-plugin-opener |

## 開発コマンド

```bash
# 開発サーバー起動
npm run tauri dev

# プロダクションビルド
npm run tauri build

# TypeScriptチェック
npx tsc --noEmit

# Rustチェック
cargo check --manifest-path src-tauri/Cargo.toml
```

## ライセンス

MIT
