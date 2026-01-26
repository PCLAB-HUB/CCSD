import type { Template, TemplateField } from '../types'

export type { Template, TemplateField }

export const templates: Template[] = [
  {
    id: 'agent-basic',
    name: 'エージェント（基本）',
    description: '基本的なエージェントテンプレート。タスク実行に必要な最小限のツールを含みます。',
    category: 'agent',
    icon: 'robot',
    fields: [
      { name: 'agent_name', label: 'エージェント名', placeholder: 'my-agent', required: true },
      { name: 'description', label: '説明', placeholder: 'このエージェントの役割を説明', required: true },
    ],
    content: `---
name: {{agent_name}}
description: {{description}}
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# {{agent_name}}

{{description}}

## 役割

このエージェントは以下のタスクを担当します:

- タスク1
- タスク2
- タスク3

## 使用方法

\`\`\`
@{{agent_name}} タスクの説明
\`\`\`

## 注意事項

- 注意事項1
- 注意事項2
`,
    defaultFileName: '{{agent_name}}.md',
  },
  {
    id: 'agent-frontend',
    name: 'エージェント（フロントエンド）',
    description: 'フロントエンド開発に特化したエージェント。React/Vue/Angularの開発をサポート。',
    category: 'agent',
    icon: 'code',
    fields: [
      { name: 'agent_name', label: 'エージェント名', placeholder: 'frontend-developer', required: true },
      { name: 'description', label: '説明', placeholder: 'フロントエンド開発エージェント', required: true },
      { name: 'framework', label: 'フレームワーク', placeholder: 'React / Vue / Angular', required: false, defaultValue: 'React' },
    ],
    content: `---
name: {{agent_name}}
description: {{description}}
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# {{agent_name}}

{{description}}

## 専門領域

- {{framework}}コンポーネント開発
- TypeScript/JavaScript
- CSS/TailwindCSS
- 状態管理
- テスト作成

## コーディング規約

- コンポーネントは関数コンポーネントで作成
- TypeScriptの厳密モードを使用
- ファイル名はPascalCase
- スタイルはTailwindCSSを優先

## 使用方法

\`\`\`
@{{agent_name}} ダッシュボードコンポーネントを作成して
\`\`\`
`,
    defaultFileName: '{{agent_name}}.md',
  },
  {
    id: 'agent-backend',
    name: 'エージェント（バックエンド）',
    description: 'バックエンド開発に特化したエージェント。API設計とデータベース操作をサポート。',
    category: 'agent',
    icon: 'server',
    fields: [
      { name: 'agent_name', label: 'エージェント名', placeholder: 'backend-developer', required: true },
      { name: 'description', label: '説明', placeholder: 'バックエンド開発エージェント', required: true },
      { name: 'language', label: '言語', placeholder: 'Python / Node.js / Go', required: false, defaultValue: 'Node.js' },
    ],
    content: `---
name: {{agent_name}}
description: {{description}}
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# {{agent_name}}

{{description}}

## 専門領域

- {{language}}開発
- REST API設計
- データベース操作
- 認証・認可
- セキュリティ

## コーディング規約

- エラーハンドリングを徹底
- ログ出力を適切に実装
- 入力値のバリデーション必須
- 環境変数で機密情報を管理

## 使用方法

\`\`\`
@{{agent_name}} ユーザー認証APIを実装して
\`\`\`
`,
    defaultFileName: '{{agent_name}}.md',
  },
  {
    id: 'skill-basic',
    name: 'スキル（基本）',
    description: '基本的なスキルテンプレート。カスタムコマンドの作成に使用。',
    category: 'skill',
    icon: 'lightning',
    fields: [
      { name: 'skill_name', label: 'スキル名', placeholder: 'my-skill', required: true },
      { name: 'description', label: '説明', placeholder: 'このスキルの機能を説明', required: true },
      { name: 'trigger', label: 'トリガー', placeholder: '/my-skill', required: false, defaultValue: '/{{skill_name}}' },
    ],
    content: `---
name: {{skill_name}}
description: {{description}}
trigger: {{trigger}}
---

# {{skill_name}}

{{description}}

## 実行条件

このスキルは以下の条件で実行されます:

- トリガー: \`{{trigger}}\`
- 必要な権限: なし

## 処理内容

1. ステップ1の説明
2. ステップ2の説明
3. ステップ3の説明

## 使用例

\`\`\`
{{trigger}}
\`\`\`

## 出力形式

処理結果の出力形式を記述
`,
    defaultFileName: '{{skill_name}}.md',
  },
  {
    id: 'skill-refactor',
    name: 'スキル（リファクタリング）',
    description: 'コードリファクタリング用のスキル。コード品質の向上を自動化。',
    category: 'skill',
    icon: 'refresh',
    fields: [
      { name: 'skill_name', label: 'スキル名', placeholder: 'auto-refactor', required: true },
      { name: 'description', label: '説明', placeholder: 'コードを自動的にリファクタリング', required: true },
    ],
    content: `---
name: {{skill_name}}
description: {{description}}
trigger: /refactor
---

# {{skill_name}}

{{description}}

## 実行条件

- トリガー: \`/refactor\`
- 対象: 現在開いているファイル、または指定されたディレクトリ

## リファクタリング内容

1. 未使用のimportを削除
2. 変数名を意味のある名前に変更
3. 重複コードの抽出
4. 長い関数の分割
5. マジックナンバーの定数化

## 安全対策

- 変更前にバックアップを作成
- 10ファイル以上の変更は確認を求める
- テストが存在する場合は実行して確認

## 使用例

\`\`\`
/refactor
/refactor src/components
/refactor --dry-run
\`\`\`
`,
    defaultFileName: '{{skill_name}}.md',
  },
  {
    id: 'command-git',
    name: 'コマンド（Git操作）',
    description: 'Git操作を簡略化するカスタムコマンド。',
    category: 'command',
    icon: 'git',
    fields: [
      { name: 'command_name', label: 'コマンド名', placeholder: 'quick-commit', required: true },
      { name: 'description', label: '説明', placeholder: 'ステージされた変更を素早くコミット', required: true },
    ],
    content: `---
name: {{command_name}}
description: {{description}}
trigger: /{{command_name}}
---

# {{command_name}}

{{description}}

## 使用方法

\`\`\`
/{{command_name}} コミットメッセージ
\`\`\`

## 処理フロー

1. 変更状態を確認 (\`git status\`)
2. 差分を表示 (\`git diff --staged\`)
3. コミットメッセージを生成または使用
4. コミットを実行
5. 結果を表示

## オプション

- \`--amend\`: 直前のコミットを修正
- \`--push\`: コミット後にプッシュ
- \`--no-verify\`: pre-commitフックをスキップ（非推奨）

## 例

\`\`\`
/{{command_name}} 機能Aを実装
/{{command_name}} --push バグ修正
\`\`\`
`,
    defaultFileName: '{{command_name}}.md',
  },
  {
    id: 'command-test',
    name: 'コマンド（テスト実行）',
    description: 'テストの実行と結果分析を行うカスタムコマンド。',
    category: 'command',
    icon: 'test',
    fields: [
      { name: 'command_name', label: 'コマンド名', placeholder: 'test-run', required: true },
      { name: 'description', label: '説明', placeholder: 'テストを実行して結果を分析', required: true },
      { name: 'test_framework', label: 'テストフレームワーク', placeholder: 'Jest / Vitest / pytest', required: false, defaultValue: 'Vitest' },
    ],
    content: `---
name: {{command_name}}
description: {{description}}
trigger: /{{command_name}}
---

# {{command_name}}

{{description}}

## 使用方法

\`\`\`
/{{command_name}}
/{{command_name}} src/components
/{{command_name}} --coverage
\`\`\`

## 処理フロー

1. テストフレームワーク（{{test_framework}}）を検出
2. テストを実行
3. 結果を解析
4. 失敗したテストの原因を分析
5. 修正提案を生成

## オプション

- \`--coverage\`: カバレッジレポートを生成
- \`--watch\`: ウォッチモードで実行
- \`--filter <pattern>\`: 特定のテストのみ実行

## 出力

- テスト結果サマリー
- 失敗したテストの詳細
- 修正提案（失敗時）
- カバレッジ情報（オプション）
`,
    defaultFileName: '{{command_name}}.md',
  },
]

export function getTemplatesByCategory(category: Template['category']): Template[] {
  return templates.filter(t => t.category === category)
}

export function getTemplateById(id: string): Template | undefined {
  return templates.find(t => t.id === id)
}

export function applyTemplate(template: Template, values: Record<string, string>): string {
  let content = template.content
  for (const [key, value] of Object.entries(values)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    content = content.replace(regex, value)
  }
  return content
}

export function getFileName(template: Template, values: Record<string, string>): string {
  let fileName = template.defaultFileName
  for (const [key, value] of Object.entries(values)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    fileName = fileName.replace(regex, value)
  }
  return fileName
}
