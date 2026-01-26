# Claude Code Settings Dashboard

Claude Codeの設定ファイル（CLAUDE.md、スキル、エージェント、コマンド等）を一元管理できるダッシュボードアプリケーション。

## 特徴

- **統合ダッシュボード**: 左サイドバーにファイルツリー、右にMonaco Editorを配置
- **全文検索**: ファイル名と内容を横断検索
- **自動バックアップ**: 編集時に自動でバックアップを作成
- **構文検証**: YAML/JSON/Markdownの構文チェック
- **ダークモード**: システム設定に連動したテーマ切り替え
- **読み取り専用モード**: 誤編集防止

## 必要な環境

- Node.js 18以上
- Rust（Tauriビルド用）
- macOS / Windows / Linux

### Rustのインストール（未インストールの場合）

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

## セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動（フロントエンドのみ）
npm run dev

# Tauriアプリとして開発起動
npm run tauri:dev

# プロダクションビルド
npm run tauri:build
```

## 管理対象ファイル

| パス | 形式 | 用途 |
|------|------|------|
| `~/.claude/CLAUDE.md` | Markdown | グローバル設定・メモリ |
| `~/.claude/settings.json` | JSON | アプリケーション設定 |
| `~/.claude/skills/*/SKILL.md` | YAML+Markdown | スキル定義 |
| `~/.claude/commands/*.md` | Markdown | カスタムコマンド |
| `~/.claude/agents/categories/*/` | YAML+Markdown | エージェント定義 |
| `~/.claude/config/*.json` | JSON | 通知設定 |

## プロジェクト構造

```
ClaudeSettingDashBoard/
├── Docs/mtg/                    # PM会議資料
│   ├── PM会議議事録_20260125.md
│   └── 提案計画書.md
├── src/                         # Reactフロントエンド
│   ├── App.tsx
│   ├── components/
│   │   ├── layout/
│   │   ├── editor/
│   │   ├── tree/
│   │   └── search/
│   ├── hooks/
│   └── styles/
├── src-tauri/                   # Rustバックエンド
│   ├── src/
│   │   └── lib.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
└── README.md
```

## 技術スタック

- **フレームワーク**: Tauri v2
- **フロントエンド**: React 19 + TypeScript
- **スタイリング**: TailwindCSS v4
- **エディタ**: Monaco Editor
- **バックエンド**: Rust

## ライセンス

MIT
