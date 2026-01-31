# Git自動化コマンド Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** モジュール式のGit自動化コマンド（/commit, /branch, /pr, /ship）を実装し、開発ワークフローを効率化する

**Architecture:** Skills（git-rules, pr-template）でルールを定義し、Commands（commit, branch, pr, ship）がそれらを参照して動作する二層構造。/shipは他のコマンドを内部で呼び出す統合コマンド。

**Tech Stack:** Claude Code Skills/Commands（Markdown）, Git, GitHub CLI (gh)

---

## Task 1: git-rules スキル作成

**Files:**
- Create: `.claude/skills/git-rules/SKILL.md`

**Step 1: スキルファイルを作成**

```markdown
---
description: Gitブランチ命名規則とConventional Commitsルール
globs:
---

# Git Rules

## ブランチ命名規則

### パターン
- `feature/<description>` - 新機能
- `fix/<description>` - バグ修正
- `refactor/<description>` - リファクタリング
- `hotfix/<description>` - 緊急修正
- `docs/<description>` - ドキュメント変更
- `test/<description>` - テスト追加・修正

### ルール
- descriptionは**英語**で簡潔に（ケバブケース）
- 例: `feature/add-tree-filter`, `fix/search-highlight-bug`

---

## Conventional Commits

### フォーマット
`<type>[optional scope]: <description>`

**コミットメッセージは日本語で記述**

### 利用可能なtype
| type | 説明 |
|------|------|
| `feat` | 新機能の追加 |
| `fix` | バグ修正 |
| `docs` | ドキュメントのみの変更 |
| `style` | コードの意味に影響しない変更（フォーマット等） |
| `refactor` | バグ修正や機能追加以外のコード変更 |
| `perf` | パフォーマンス向上 |
| `test` | テストの追加・修正 |
| `chore` | ビルドプロセスや補助ツールの変更 |

### 例
- `feat(editor): Monaco Editorに検索ハイライト機能を追加`
- `fix(tree): ファイルツリーのフィルタリングバグを修正`
- `refactor(hooks): useFileManagerを分割`
- `test(utils): treeFilterUtilsのテストを追加`

### コミット実行フォーマット
```bash
git commit -m "$(cat <<'EOF'
<type>[scope]: メッセージ

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```
```

**Step 2: ファイル作成を確認**

Run: `cat .claude/skills/git-rules/SKILL.md`
Expected: 上記の内容が表示される

**Step 3: Commit**

```bash
git add .claude/skills/git-rules/SKILL.md
git commit -m "feat(skills): git-rulesスキルを追加"
```

---

## Task 2: pr-template スキル作成

**Files:**
- Create: `.claude/skills/pr-template/SKILL.md`

**Step 1: スキルファイルを作成**

```markdown
---
description: PRテンプレート構造
globs:
---

# PR Template

## タイトル
- Conventional Commits形式（日本語）
- フォーマット: `<type>[scope]: <description>`
- タスク番号がある場合: `<type>[scope]: [TASK-XXXX] <description>`

### 例
- `feat(editor): 検索ハイライト機能を追加`
- `fix(tree): [TASK-123] フィルタリングバグを修正`

---

## 本文構造

```markdown
## Done
<!-- このPRで完了したこと -->
-

## Not To Do
<!-- このPRではやらないこと（関連するが対象外） -->
<!-- なければ「なし」 -->

## Other
<!-- 補足事項、確認内容、スクリーンショット等 -->
<!-- なければ省略可 -->

---
Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## 作成コマンド例

```bash
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Done
- 変更内容1
- 変更内容2

## Not To Do
なし

## Other
- 動作確認済み

---
Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```
```

**Step 2: ファイル作成を確認**

Run: `cat .claude/skills/pr-template/SKILL.md`
Expected: 上記の内容が表示される

**Step 3: Commit**

```bash
git add .claude/skills/pr-template/SKILL.md
git commit -m "feat(skills): pr-templateスキルを追加"
```

---

## Task 3: /commit コマンド作成

**Files:**
- Create: `.claude/commands/commit.md`

**Step 1: コマンドファイルを作成**

```markdown
---
description: スマートコミット - 変更内容を分析してConventional Commits形式でコミット
---

# /commit コマンド

## 引数
- `$ARGUMENTS`: オプション（--all, --amend, --quick）

## 前提スキル
最初に `.claude/skills/git-rules/SKILL.md` を読み、規則に従うこと。

## 手順

### 1. 変更内容の確認
```bash
git status
git diff --staged
```
- ステージング済みの変更があるか確認
- なければ `git diff` で未ステージの変更を表示

### 2. ステージング（必要な場合）
- `--all` オプション: `git add -A` で全変更をステージ
- それ以外: ユーザーに確認し、関連ファイルを `git add`
- `.env`等の秘密情報ファイルは除外

### 3. コミットメッセージ生成
- 変更内容を分析
- git-rules/SKILL.md のConventional Commits規則に従う
- type, scope, descriptionを決定

### 4. 確認と実行
- `--quick` オプション: 確認なしで即実行
- それ以外: 生成したメッセージを提示し、承認を得てから実行

### 5. コミット実行
```bash
git commit -m "$(cat <<'EOF'
<type>[scope]: メッセージ

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### 6. 結果表示
```bash
git log -1 --oneline
```

## オプション詳細
| オプション | 動作 |
|-----------|------|
| `--all` | 全変更をステージング |
| `--amend` | 直前のコミットを修正 |
| `--quick` | 承認ステップをスキップ |
```

**Step 2: ファイル作成を確認**

Run: `cat .claude/commands/commit.md`
Expected: 上記の内容が表示される

**Step 3: Commit**

```bash
git add .claude/commands/commit.md
git commit -m "feat(commands): /commitコマンドを追加"
```

---

## Task 4: /branch コマンド作成

**Files:**
- Create: `.claude/commands/branch.md`

**Step 1: コマンドファイルを作成**

```markdown
---
description: スマートブランチ作成 - 変更内容から適切なブランチ名を生成
---

# /branch コマンド

## 引数
- `$ARGUMENTS`: ブランチ名のヒント（任意）

## 前提スキル
最初に `.claude/skills/git-rules/SKILL.md` を読み、規則に従うこと。

## 手順

### 1. 現在の状態確認
```bash
git branch --show-current
git status
```

### 2. ブランチ名の決定
- `$ARGUMENTS` があれば、それをヒントに使用
- なければ、変更内容や会話のコンテキストから推測
- git-rules/SKILL.md のブランチ命名規則に従う

### 3. ブランチ名を提案
- 規則に従った名前を提示
- ユーザーの承認を得る

### 4. ブランチ作成
```bash
git checkout -b <branch-name>
```

### 5. 結果表示
```bash
git branch --show-current
```

## 例
- 入力: `/branch ツリーフィルター機能`
- 出力: `feature/add-tree-filter`
```

**Step 2: ファイル作成を確認**

Run: `cat .claude/commands/branch.md`
Expected: 上記の内容が表示される

**Step 3: Commit**

```bash
git add .claude/commands/branch.md
git commit -m "feat(commands): /branchコマンドを追加"
```

---

## Task 5: /pr コマンド作成

**Files:**
- Create: `.claude/commands/pr.md`

**Step 1: コマンドファイルを作成**

```markdown
---
description: スマートPR作成 - コミット履歴からPRタイトル・本文を自動生成
---

# /pr コマンド

## 引数
- `$ARGUMENTS`: タスク番号（任意、例: TASK-123）

## 前提スキル
最初に以下を読むこと:
- `.claude/skills/git-rules/SKILL.md`
- `.claude/skills/pr-template/SKILL.md`

## 手順

### 1. 現在の状態確認
```bash
git branch --show-current
git log origin/main..HEAD --oneline
git diff origin/main..HEAD --stat
```

### 2. リモートへのPush確認
```bash
git push -u origin $(git branch --show-current)
```

### 3. PRタイトル生成
- コミット履歴と変更内容を分析
- pr-template/SKILL.md の形式に従う
- `$ARGUMENTS` があればタスク番号を含める

### 4. PR本文生成
- Done: 完了した変更を箇条書き
- Not To Do: このPRでやらないこと（あれば）
- Other: 補足事項（あれば）

### 5. 確認と作成
- タイトル・本文を提示し、承認を得る
- `gh pr create` で作成

```bash
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Done
- 変更内容

## Not To Do
なし

## Other
- 補足

---
Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### 6. 結果表示
- 作成されたPRのURLを表示
```

**Step 2: ファイル作成を確認**

Run: `cat .claude/commands/pr.md`
Expected: 上記の内容が表示される

**Step 3: Commit**

```bash
git add .claude/commands/pr.md
git commit -m "feat(commands): /prコマンドを追加"
```

---

## Task 6: /ship コマンド作成（統合コマンド）

**Files:**
- Create: `.claude/commands/ship.md`

**Step 1: コマンドファイルを作成**

```markdown
---
description: ブランチ作成→コミット→Push→PR作成を一括実行
---

# /ship コマンド

## 引数
- `$ARGUMENTS`: タスク番号（任意、例: TASK-123）

## 前提スキル
最初に以下を読むこと:
- `.claude/skills/git-rules/SKILL.md`
- `.claude/skills/pr-template/SKILL.md`

## オプション
- `--quick`: 各ステップの承認をスキップ（小さな変更用）

## 手順

### 1. 変更内容の確認
```bash
git status
git diff
git diff --staged
```
- 変更がなければ終了

### 2. ブランチ作成（mainにいる場合）
- 現在mainブランチなら、/branchと同様の手順でブランチ作成
- 既に作業ブランチにいればスキップ

### 3. ステージングとコミット
- /commitと同様の手順
- 関連ファイルをステージング
- Conventional Commits形式でコミット

### 4. リモートへPush
```bash
git push -u origin $(git branch --show-current)
```

### 5. PR作成
- /prと同様の手順
- `$ARGUMENTS` のタスク番号をタイトルに含める
- `gh pr create` で作成

### 6. 結果サマリー
```
✅ ブランチ: feature/add-xxx
✅ コミット: feat(scope): メッセージ
✅ Push: origin/feature/add-xxx
✅ PR: https://github.com/xxx/xxx/pull/123
```

## 注意事項
- 各ステップで確認を取りながら進める（--quickでスキップ可）
- `.env`等の秘密情報ファイルは自動除外
- エラー時は該当ステップで停止し、状況を報告
```

**Step 2: ファイル作成を確認**

Run: `cat .claude/commands/ship.md`
Expected: 上記の内容が表示される

**Step 3: Commit**

```bash
git add .claude/commands/ship.md
git commit -m "feat(commands): /shipコマンドを追加"
```

---

## Task 7: 動作確認

**Step 1: ディレクトリ構造確認**

Run: `tree .claude/`
Expected:
```
.claude/
├── commands/
│   ├── branch.md
│   ├── commit.md
│   ├── pr.md
│   └── ship.md
└── skills/
    ├── git-rules/
    │   └── SKILL.md
    └── pr-template/
        └── SKILL.md
```

**Step 2: 各コマンドが認識されるか確認**
- Claude Codeで `/commit` と入力し、コマンドが認識されることを確認
- 同様に `/branch`, `/pr`, `/ship` を確認

**Step 3: 最終コミット**

```bash
git add -A
git commit -m "docs: Git自動化コマンドの実装計画を追加"
```

---

## 完了チェックリスト

- [ ] `.claude/skills/git-rules/SKILL.md` 作成
- [ ] `.claude/skills/pr-template/SKILL.md` 作成
- [ ] `.claude/commands/commit.md` 作成
- [ ] `.claude/commands/branch.md` 作成
- [ ] `.claude/commands/pr.md` 作成
- [ ] `.claude/commands/ship.md` 作成
- [ ] 動作確認完了
