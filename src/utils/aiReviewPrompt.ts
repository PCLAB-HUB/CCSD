/**
 * AIレビュー用のシステムプロンプトとユーティリティ
 */

import type { SuggestionCategory, SuggestionSeverity } from '../types/aiReview'

/**
 * Claude Code設定ファイルのベストプラクティス
 */
export const CLAUDE_CODE_BEST_PRACTICES = `
## Claude Code設定ファイルのベストプラクティス

### CLAUDE.md（プロジェクト設定）
1. **明確な構造**: セクションを適切に分け、見出しを使用する
2. **コンテキスト情報**: プロジェクトの概要、技術スタック、アーキテクチャを記載
3. **コーディング規約**: プロジェクト固有のルールを明記
4. **禁止事項**: Claudeにやってほしくないことを明確に記載
5. **参照ファイル**: 重要なファイルやディレクトリへの参照を含める
6. **適切な長さ**: 長すぎると処理に時間がかかる（推奨: 2000-5000文字）

### settings.json
1. **必須フィールド**: permissions, model設定を適切に設定
2. **セキュリティ**: 不要な権限は付与しない
3. **API設定**: 必要に応じてカスタムエンドポイントを設定

### よくある問題
- 曖昧な指示（「適切に」「必要に応じて」など）
- 矛盾する指示
- 過度に長いドキュメント
- 重要な情報の欠落
- セキュリティ上問題のある権限設定
`

/**
 * レビュー用システムプロンプト
 */
export const REVIEW_SYSTEM_PROMPT = `あなたはClaude Code設定ファイルの専門レビュアーです。
提供された設定ファイルを分析し、改善提案を行ってください。

${CLAUDE_CODE_BEST_PRACTICES}

## レビュー観点

### 1. 完成度 (completeness)
- 必要な情報が網羅されているか
- 構造が適切か
- 必須フィールドが設定されているか

### 2. セキュリティ (security)
- 機密情報が含まれていないか
- 過剰な権限が設定されていないか
- 安全でない設定がないか

### 3. パフォーマンス (performance)
- ファイルサイズは適切か
- 不要な情報が含まれていないか
- 処理効率に影響する設定がないか

### 4. 可読性 (readability)
- 構造が明確か
- 見出しや区切りが適切か
- 説明が分かりやすいか

### 5. ベストプラクティス (best-practice)
- Claude Code固有の推奨事項に従っているか
- 一般的なベストプラクティスに準拠しているか

## 出力形式

以下のJSON形式で回答してください：

\`\`\`json
{
  "score": {
    "overall": 0-100の整数,
    "completeness": 0-100の整数,
    "security": 0-100の整数,
    "readability": 0-100の整数,
    "bestPractice": 0-100の整数
  },
  "summary": "総合的な評価を2-3文で記載",
  "positives": ["良い点1", "良い点2", ...],
  "suggestions": [
    {
      "category": "completeness" | "security" | "performance" | "readability" | "best-practice",
      "severity": "critical" | "warning" | "info" | "tip",
      "title": "提案のタイトル",
      "description": "詳細な説明",
      "lineNumber": 該当行番号（optional）,
      "before": "修正前のコード例（optional）",
      "after": "修正後のコード例（optional）"
    }
  ]
}
\`\`\`

重要な注意事項:
- 日本語で回答してください
- suggestions配列は重要度順（critical > warning > info > tip）に並べてください
- 最低でも3つ、最大で10個の提案を含めてください
- 具体的で実行可能な提案を心がけてください
- ファイル形式（.md, .json等）に応じた適切な評価を行ってください`

/**
 * レビュー用ユーザープロンプトを生成
 */
export function createReviewUserPrompt(fileName: string, content: string): string {
  const fileType = getFileType(fileName)
  const contextInfo = getFileContextInfo(fileName)

  return `以下の${contextInfo}をレビューしてください。

ファイル名: ${fileName}
ファイル形式: ${fileType}

---
${content}
---

上記の設定ファイルを評価し、指定されたJSON形式で回答してください。`
}

/**
 * ファイル名からファイルタイプを判定
 */
function getFileType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'md':
      return 'Markdown'
    case 'json':
      return 'JSON'
    case 'yaml':
    case 'yml':
      return 'YAML'
    default:
      return 'テキスト'
  }
}

/**
 * ファイル名からコンテキスト情報を取得
 */
function getFileContextInfo(fileName: string): string {
  const lowerName = fileName.toLowerCase()

  if (lowerName === 'claude.md') {
    return 'Claude Code プロジェクト設定ファイル（CLAUDE.md）'
  }
  if (lowerName === 'settings.json') {
    return 'Claude Code 設定ファイル（settings.json）'
  }
  if (lowerName.endsWith('.md')) {
    return 'Claude Code Markdown設定ファイル'
  }
  if (lowerName.endsWith('.json')) {
    return 'Claude Code JSON設定ファイル'
  }

  return 'Claude Code設定ファイル'
}

/**
 * カテゴリの日本語ラベルを取得
 */
export function getCategoryLabel(category: SuggestionCategory): string {
  const labels: Record<SuggestionCategory, string> = {
    completeness: '完成度',
    security: 'セキュリティ',
    performance: 'パフォーマンス',
    readability: '可読性',
    'best-practice': 'ベストプラクティス',
  }
  return labels[category] || category
}

/**
 * 重要度の日本語ラベルを取得
 */
export function getSeverityLabel(severity: SuggestionSeverity): string {
  const labels: Record<SuggestionSeverity, string> = {
    critical: '重要',
    warning: '警告',
    info: '情報',
    tip: 'ヒント',
  }
  return labels[severity] || severity
}
