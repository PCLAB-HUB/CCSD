/**
 * ベストプラクティスリンターフック
 * Claude Code設定ファイルのリンティングを実行
 */

import { useCallback, useMemo, useState } from 'react'

import { lint } from '../utils/linter'
import {
  AGENT_KNOWN_FIELDS,
  LINTER_RULES,
  SKILL_KNOWN_FIELDS,
  type FrontmatterData,
  type LinterContext,
  type LinterIssue,
  type LinterResult,
  type LinterRule,
  type LinterRuleCategory,
} from '../utils/linterRules'

// ============================================================================
// 型定義
// ============================================================================

/** リンター設定 */
export interface LinterConfig {
  /** 有効なルールカテゴリ */
  enabledCategories: LinterRuleCategory[]
  /** 重大度の上書き */
  severityOverrides: Partial<Record<string, 'error' | 'warning' | 'info'>>
}

const DEFAULT_CONFIG: LinterConfig = {
  enabledCategories: ['skill', 'agent', 'common'],
  severityOverrides: {},
}

// ============================================================================
// React Hook
// ============================================================================

/**
 * ベストプラクティスリンターを管理するカスタムフック
 */
export function useLinter(initialConfig: Partial<LinterConfig> = {}) {
  const [config, setConfig] = useState<LinterConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  })
  const [lastResult, setLastResult] = useState<LinterResult | null>(null)

  /**
   * リンティングを実行
   */
  const runLint = useCallback(
    (content: string, filePath: string): LinterResult => {
      const lintResult = lint(content, filePath)
      setLastResult(lintResult)
      return lintResult
    },
    []
  )

  /**
   * リンター設定を更新
   */
  const updateConfig = useCallback((updates: Partial<LinterConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }))
  }, [])

  /**
   * 特定カテゴリの有効/無効を切り替え
   */
  const toggleCategory = useCallback((category: LinterRuleCategory) => {
    setConfig((prev) => {
      const enabled = prev.enabledCategories.includes(category)
      return {
        ...prev,
        enabledCategories: enabled
          ? prev.enabledCategories.filter((c) => c !== category)
          : [...prev.enabledCategories, category],
      }
    })
  }, [])

  /**
   * 結果をクリア
   */
  const clearResult = useCallback(() => {
    setLastResult(null)
  }, [])

  /**
   * 全ルール一覧（設定を反映）
   */
  const rules = useMemo((): LinterRule[] => {
    return LINTER_RULES.map((rule) => ({
      ...rule,
      enabled: config.enabledCategories.includes(rule.category),
    }))
  }, [config.enabledCategories])

  /**
   * 問題があるかどうか
   */
  const hasIssues = useMemo(() => {
    return lastResult !== null && lastResult.issues.length > 0
  }, [lastResult])

  /**
   * エラーがあるかどうか
   */
  const hasErrors = useMemo(() => {
    return lastResult !== null && lastResult.errorCount > 0
  }, [lastResult])

  return {
    // 状態
    config,
    lastResult,
    rules,
    hasIssues,
    hasErrors,
    // アクション
    runLint,
    updateConfig,
    toggleCategory,
    clearResult,
  }
}

// ============================================================================
// エクスポート
// ============================================================================

// lint関数をre-export（後方互換性のため）
export { lint } from '../utils/linter'

// 型のre-export
export type { LinterRule, LinterIssue, LinterResult, LinterContext, FrontmatterData }
export { LINTER_RULES, SKILL_KNOWN_FIELDS, AGENT_KNOWN_FIELDS }
