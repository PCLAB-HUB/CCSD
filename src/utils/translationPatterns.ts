/**
 * 英語テキストの簡易日本語翻訳ユーティリティ
 *
 * パターンマッチングによる翻訳。完璧な翻訳ではなく、
 * 大まかな意味が伝わることを目的としています。
 *
 * @module utils/translationPatterns
 */

// ============================================================
// 動詞フレーズのパターン（文頭によく現れるもの）
// ============================================================

const VERB_PATTERNS: Array<[RegExp, string]> = [
  // 一般的な動作
  [/^query\b/i, '照会する'],
  [/^review\b/i, 'レビューする'],
  [/^analyze\b/i, '分析する'],
  [/^create\b/i, '作成する'],
  [/^generate\b/i, '生成する'],
  [/^build\b/i, '構築する'],
  [/^design\b/i, '設計する'],
  [/^implement\b/i, '実装する'],
  [/^optimize\b/i, '最適化する'],
  [/^debug\b/i, 'デバッグする'],
  [/^test\b/i, 'テストする'],
  [/^validate\b/i, '検証する'],
  [/^check\b/i, 'チェックする'],
  [/^verify\b/i, '確認する'],
  [/^fix\b/i, '修正する'],
  [/^update\b/i, '更新する'],
  [/^refactor\b/i, 'リファクタリングする'],
  [/^deploy\b/i, 'デプロイする'],
  [/^monitor\b/i, '監視する'],
  [/^configure\b/i, '設定する'],
  [/^manage\b/i, '管理する'],
  [/^handle\b/i, '処理する'],
  [/^process\b/i, '処理する'],
  [/^evaluate\b/i, '評価する'],
  [/^assess\b/i, '評価する'],
  [/^investigate\b/i, '調査する'],
  [/^research\b/i, '調査する'],
  [/^explore\b/i, '探索する'],
  [/^discover\b/i, '発見する'],
  [/^identify\b/i, '特定する'],
  [/^detect\b/i, '検出する'],
  [/^find\b/i, '見つける'],
  [/^search\b/i, '検索する'],
  [/^plan\b/i, '計画する'],
  [/^schedule\b/i, 'スケジュールする'],
  [/^coordinate\b/i, '調整する'],
  [/^collaborate\b/i, '協力する'],
  [/^communicate\b/i, '連携する'],
  [/^document\b/i, '文書化する'],
  [/^write\b/i, '書く'],
  [/^read\b/i, '読む'],
  [/^parse\b/i, '解析する'],
  [/^transform\b/i, '変換する'],
  [/^convert\b/i, '変換する'],
  [/^migrate\b/i, '移行する'],
  [/^integrate\b/i, '統合する'],
  [/^connect\b/i, '接続する'],
  [/^link\b/i, 'リンクする'],
  [/^sync\b/i, '同期する'],
  [/^backup\b/i, 'バックアップする'],
  [/^restore\b/i, '復元する'],
  [/^recover\b/i, '復旧する'],
  [/^maintain\b/i, 'メンテナンスする'],
  [/^support\b/i, 'サポートする'],
  [/^assist\b/i, '支援する'],
  [/^help\b/i, '手伝う'],
  [/^guide\b/i, 'ガイドする'],
  [/^advise\b/i, 'アドバイスする'],
  [/^recommend\b/i, '推奨する'],
  [/^suggest\b/i, '提案する'],
  [/^propose\b/i, '提案する'],
  [/^improve\b/i, '改善する'],
  [/^enhance\b/i, '強化する'],
  [/^extend\b/i, '拡張する'],
  [/^expand\b/i, '拡張する'],
  [/^scale\b/i, 'スケールする'],
  [/^simplify\b/i, '簡素化する'],
  [/^automate\b/i, '自動化する'],
  [/^standardize\b/i, '標準化する'],
  [/^normalize\b/i, '正規化する'],
  [/^clean\b/i, 'クリーンアップする'],
  [/^organize\b/i, '整理する'],
  [/^structure\b/i, '構造化する'],
  [/^model\b/i, 'モデル化する'],
  [/^measure\b/i, '測定する'],
  [/^track\b/i, '追跡する'],
  [/^log\b/i, 'ログを記録する'],
  [/^report\b/i, 'レポートする'],
  [/^visualize\b/i, '可視化する'],
  [/^render\b/i, 'レンダリングする'],
  [/^display\b/i, '表示する'],
  [/^show\b/i, '表示する'],
  [/^present\b/i, '提示する'],
  [/^demonstrate\b/i, 'デモンストレーションする'],
  [/^execute\b/i, '実行する'],
  [/^run\b/i, '実行する'],
  [/^perform\b/i, '実行する'],
  [/^complete\b/i, '完了する'],
  [/^finish\b/i, '終了する'],
  [/^start\b/i, '開始する'],
  [/^begin\b/i, '始める'],
  [/^launch\b/i, '起動する'],
  [/^initialize\b/i, '初期化する'],
  [/^setup\b/i, 'セットアップする'],
  [/^set up\b/i, 'セットアップする'],
  [/^install\b/i, 'インストールする'],
  [/^uninstall\b/i, 'アンインストールする'],
  [/^remove\b/i, '削除する'],
  [/^delete\b/i, '削除する'],
  [/^add\b/i, '追加する'],
  [/^insert\b/i, '挿入する'],
  [/^append\b/i, '追加する'],
  [/^modify\b/i, '変更する'],
  [/^change\b/i, '変更する'],
  [/^edit\b/i, '編集する'],
  [/^adjust\b/i, '調整する'],
  [/^tune\b/i, 'チューニングする'],
  [/^calibrate\b/i, '校正する'],
  [/^align\b/i, '整列する'],
]

// ============================================================
// 名詞・概念のパターン
// ============================================================

const NOUN_PATTERNS: Array<[RegExp, string]> = [
  // 技術用語
  [/\bcontext manager\b/gi, 'コンテキストマネージャー'],
  [/\bservice architecture\b/gi, 'サービスアーキテクチャ'],
  [/\bmicroservice/gi, 'マイクロサービス'],
  [/\bAPI\b/g, 'API'],
  [/\bpatterns?\b/gi, 'パターン'],
  [/\bconventions?\b/gi, '規約'],
  [/\bboundaries?\b/gi, '境界'],
  [/\bcommunication patterns?\b/gi, '通信パターン'],
  [/\bdata flows?\b/gi, 'データフロー'],
  [/\bscalability\b/gi, 'スケーラビリティ'],
  [/\brequirements?\b/gi, '要件'],
  [/\bfailure scenarios?\b/gi, '障害シナリオ'],
  [/\bbusiness domain\b/gi, 'ビジネスドメイン'],
  [/\bdomain models?\b/gi, 'ドメインモデル'],
  [/\brelationships?\b/gi, '関係性'],
  [/\bclient\b/gi, 'クライアント'],
  [/\buse cases?\b/gi, 'ユースケース'],
  [/\bworkflows?\b/gi, 'ワークフロー'],
  [/\bpipelines?\b/gi, 'パイプライン'],
  [/\bdeployments?\b/gi, 'デプロイメント'],
  [/\benvironments?\b/gi, '環境'],
  [/\bconfigurations?\b/gi, '設定'],
  [/\bsettings?\b/gi, '設定'],
  [/\bparameters?\b/gi, 'パラメーター'],
  [/\boptions?\b/gi, 'オプション'],
  [/\bfeatures?\b/gi, '機能'],
  [/\bfunctionality\b/gi, '機能性'],
  [/\bcapabilities?\b/gi, '能力'],
  [/\bcomponents?\b/gi, 'コンポーネント'],
  [/\bmodules?\b/gi, 'モジュール'],
  [/\bservices?\b/gi, 'サービス'],
  [/\bsystems?\b/gi, 'システム'],
  [/\bapplications?\b/gi, 'アプリケーション'],
  [/\bplatforms?\b/gi, 'プラットフォーム'],
  [/\bframeworks?\b/gi, 'フレームワーク'],
  [/\blibraries?\b/gi, 'ライブラリ'],
  [/\btools?\b/gi, 'ツール'],
  [/\binfrastructure\b/gi, 'インフラ'],
  [/\bdatabases?\b/gi, 'データベース'],
  [/\bservers?\b/gi, 'サーバー'],
  [/\bclients?\b/gi, 'クライアント'],
  [/\busers?\b/gi, 'ユーザー'],
  [/\bdevelopers?\b/gi, '開発者'],
  [/\bteams?\b/gi, 'チーム'],
  [/\bprojects?\b/gi, 'プロジェクト'],
  [/\btasks?\b/gi, 'タスク'],
  [/\bissues?\b/gi, '課題'],
  [/\bproblems?\b/gi, '問題'],
  [/\bbugs?\b/gi, 'バグ'],
  [/\berrors?\b/gi, 'エラー'],
  [/\bexceptions?\b/gi, '例外'],
  [/\bwarnings?\b/gi, '警告'],
  [/\blogs?\b/gi, 'ログ'],
  [/\bmetrics?\b/gi, 'メトリクス'],
  [/\bperformance\b/gi, 'パフォーマンス'],
  [/\bsecurity\b/gi, 'セキュリティ'],
  [/\bquality\b/gi, '品質'],
  [/\breliability\b/gi, '信頼性'],
  [/\bavailability\b/gi, '可用性'],
  [/\bmaintainability\b/gi, '保守性'],
  [/\btestability\b/gi, 'テスト容易性'],
  [/\busability\b/gi, 'ユーザビリティ'],
  [/\baccessibility\b/gi, 'アクセシビリティ'],
  [/\bcompatibility\b/gi, '互換性'],
  [/\binteroperability\b/gi, '相互運用性'],
  [/\bportability\b/gi, '移植性'],
  [/\breusability\b/gi, '再利用性'],
  [/\bflexibility\b/gi, '柔軟性'],
  [/\bextensibility\b/gi, '拡張性'],
  [/\bmodularity\b/gi, 'モジュール性'],
  [/\bcohesion\b/gi, '凝集度'],
  [/\bcoupling\b/gi, '結合度'],
  [/\babstraction\b/gi, '抽象化'],
  [/\bencapsulation\b/gi, 'カプセル化'],
  [/\binheritance\b/gi, '継承'],
  [/\bpolymorphism\b/gi, 'ポリモーフィズム'],
  [/\bexisting\b/gi, '既存の'],
  [/\bcurrent\b/gi, '現在の'],
  [/\bnew\b/gi, '新しい'],
]

// ============================================================
// フレーズパターン（よく使われる定型表現）
// ============================================================

const PHRASE_PATTERNS: Array<[RegExp, string]> = [
  // 「〜するとき」パターン
  [/\bwhen needed\b/gi, '必要なとき'],
  [/\bwhen required\b/gi, '必要なとき'],
  [/\bwhen necessary\b/gi, '必要なとき'],
  [/\bwhen starting\b/gi, '開始するとき'],
  [/\bwhen finishing\b/gi, '完了するとき'],
  [/\bwhen implementing\b/gi, '実装するとき'],
  [/\bwhen designing\b/gi, '設計するとき'],
  [/\bwhen debugging\b/gi, 'デバッグするとき'],
  [/\bwhen testing\b/gi, 'テストするとき'],
  [/\bwhen reviewing\b/gi, 'レビューするとき'],
  [/\bwhen deploying\b/gi, 'デプロイするとき'],
  [/\bwhen migrating\b/gi, '移行するとき'],
  [/\bwhen upgrading\b/gi, 'アップグレードするとき'],

  // 接続表現
  [/\band\b/gi, 'と'],
  [/\bor\b/gi, 'または'],
  [/\bfor\b/gi, 'のための'],
  [/\bwith\b/gi, 'と'],
  [/\bto\b/gi, 'へ'],
  [/\bfrom\b/gi, 'から'],
  [/\bof\b/gi, 'の'],
  [/\bin\b/gi, 'での'],
  [/\bon\b/gi, 'での'],
  [/\bat\b/gi, 'での'],
  [/\bby\b/gi, 'によって'],
  [/\babout\b/gi, 'について'],
  [/\bacross\b/gi, 'を跨いで'],
  [/\bbetween\b/gi, '間で'],
  [/\bamong\b/gi, '間で'],
]

// ============================================================
// 翻訳関数
// ============================================================

/**
 * 英語テキストを日本語に簡易翻訳
 *
 * パターンマッチングによる翻訳のため、完璧ではありません。
 * 主に技術的な文脈での使用タイミング説明を想定しています。
 *
 * @param text - 英語テキスト
 * @returns 翻訳されたテキスト（パターンに一致しない部分はそのまま）
 */
export function translateToJapanese(text: string): string {
  let result = text

  // フレーズパターンを先に適用（より長いパターンを優先）
  for (const [pattern, replacement] of PHRASE_PATTERNS) {
    result = result.replace(pattern, replacement)
  }

  // 名詞パターンを適用
  for (const [pattern, replacement] of NOUN_PATTERNS) {
    result = result.replace(pattern, replacement)
  }

  // 動詞パターンを適用（文頭に近い位置の動詞を翻訳）
  for (const [pattern, replacement] of VERB_PATTERNS) {
    result = result.replace(pattern, replacement)
  }

  // 余分な空白を整理
  result = result.replace(/\s+/g, ' ').trim()

  return result
}

/**
 * テキストが主に英語かどうかを判定
 *
 * @param text - チェックするテキスト
 * @returns 英語の場合true
 */
export function isEnglishText(text: string): boolean {
  // ASCII文字（英数字、スペース、記号）の割合を計算
  const asciiChars = text.match(/[\x20-\x7E]/g) || []
  return asciiChars.length / text.length > 0.7
}

/**
 * 必要に応じて翻訳を適用
 *
 * 英語テキストの場合のみ翻訳を適用し、
 * すでに日本語の場合はそのまま返す
 *
 * @param text - テキスト
 * @returns 翻訳されたテキスト（または元のテキスト）
 */
export function translateIfNeeded(text: string): string {
  if (isEnglishText(text)) {
    return translateToJapanese(text)
  }
  return text
}
