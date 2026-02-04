import { memo } from 'react'

import { Icon } from '../common'

import type { NodeDetail, GraphNode, TreeNode, NodeType, SkillMetadata } from '../../types/graph'
import { NODE_TYPE_LABELS, NODE_TYPE_BADGE_STYLES, BADGE_BASE_STYLE } from '../../constants/graph'

interface NodeDetailPanelProps {
  nodeDetail: NodeDetail | null
  /** ノードクリック時のハンドラ（GraphNodeまたはTreeNodeを受け取る） */
  onNodeClick: (node: GraphNode | TreeNode) => void
  onOpenFile: (path: string, name: string) => void
  darkMode: boolean
}

/** ノードタイプに応じたバッジスタイル */
const getNodeTypeBadgeStyle = (type: NodeType, darkMode: boolean): string => {
  const mode = darkMode ? 'dark' : 'light'
  return `${BADGE_BASE_STYLE} ${NODE_TYPE_BADGE_STYLES[mode][type]}`
}

/** セクションヘッダーのスタイル */
const getSectionHeaderStyle = (darkMode: boolean): string => `
  text-xs font-medium mb-2
  ${darkMode ? 'text-gray-400' : 'text-gray-500'}
`

/** セクションコンテナのスタイル */
const getSectionStyle = (darkMode: boolean): string => `
  p-4 border-b
  ${darkMode ? 'border-gray-700' : 'border-gray-200'}
`

/** タグバッジのスタイル */
const getTagStyle = (darkMode: boolean, variant: 'skill' | 'agent' | 'trigger'): string => {
  const baseStyle = 'text-xs px-2 py-0.5 rounded-full'
  const variantStyles = {
    skill: darkMode
      ? 'bg-green-900/50 text-green-300 border border-green-700'
      : 'bg-green-100 text-green-700 border border-green-200',
    agent: darkMode
      ? 'bg-purple-900/50 text-purple-300 border border-purple-700'
      : 'bg-purple-100 text-purple-700 border border-purple-200',
    trigger: darkMode
      ? 'bg-amber-900/50 text-amber-300 border border-amber-700'
      : 'bg-amber-100 text-amber-700 border border-amber-200',
  }
  return `${baseStyle} ${variantStyles[variant]}`
}

/**
 * スキル/エージェントのメタデータ表示セクション
 */
const SkillMetadataSection = memo<{ metadata: SkillMetadata; darkMode: boolean; nodeType?: string }>(
  ({ metadata, darkMode, nodeType }) => {
    const hasTriggers = metadata.triggers.length > 0
    const hasRelatedSkills = metadata.relatedSkills.length > 0
    const hasRelatedAgents = metadata.relatedAgents.length > 0
    const hasKeyPoints = metadata.keyPoints && metadata.keyPoints.length > 0
    const hasExamples = metadata.examples.length > 0

    // 表示するコンテンツがない場合は何も表示しない
    if (!hasTriggers && !hasRelatedSkills && !hasRelatedAgents && !hasKeyPoints && !hasExamples) {
      return null
    }

    // ノードタイプに応じたラベル
    const typeLabel = nodeType === 'subagent' ? 'エージェント' : 'スキル'

    return (
      <>
        {/* 発動条件 */}
        {hasTriggers && (
          <div className={getSectionStyle(darkMode)}>
            <h4 className={getSectionHeaderStyle(darkMode)}>
              <Icon name="lightning" className="w-3 h-3 inline-block mr-1" />
              この{typeLabel}の使用タイミング
            </h4>
            <p className={`text-xs mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              以下のような場合に使用されます：
            </p>
            <ul className="space-y-2">
              {metadata.triggers.map((trigger, index) => (
                <li
                  key={index}
                  className={`
                    text-sm flex items-start gap-2
                    ${darkMode ? 'text-gray-300' : 'text-gray-700'}
                  `}
                >
                  <span className={`flex-shrink-0 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                    •
                  </span>
                  <span className="flex-1">{trigger.condition}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 連携コンポーネント */}
        {(hasRelatedSkills || hasRelatedAgents) && (
          <div className={getSectionStyle(darkMode)}>
            <h4 className={getSectionHeaderStyle(darkMode)}>
              <Icon name="link" className="w-3 h-3 inline-block mr-1" />
              一緒に使用されるコンポーネント
            </h4>
            <p className={`text-xs mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              この{typeLabel}と連携して動作します：
            </p>
            <div className="space-y-2">
              {hasRelatedSkills && (
                <div>
                  <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    関連スキル:
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {metadata.relatedSkills.map((skill) => (
                      <span key={skill} className={getTagStyle(darkMode, 'skill')}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {hasRelatedAgents && (
                <div>
                  <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    関連エージェント:
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {metadata.relatedAgents.map((agent) => (
                      <span key={agent} className={getTagStyle(darkMode, 'agent')}>
                        {agent}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* キーポイント */}
        {hasKeyPoints && (
          <div className={getSectionStyle(darkMode)}>
            <h4 className={getSectionHeaderStyle(darkMode)}>
              <Icon name="star" className="w-3 h-3 inline-block mr-1" />
              重要なポイント
            </h4>
            <ul className="space-y-1">
              {metadata.keyPoints?.map((point, index) => (
                <li
                  key={index}
                  className={`
                    text-sm flex items-start gap-2
                    ${darkMode ? 'text-gray-300' : 'text-gray-700'}
                  `}
                >
                  <span className={`text-xs ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                    ★
                  </span>
                  <span className="flex-1">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 使用例 */}
        {hasExamples && (
          <div className={getSectionStyle(darkMode)}>
            <h4 className={getSectionHeaderStyle(darkMode)}>
              <Icon name="code" className="w-3 h-3 inline-block mr-1" />
              使用例
            </h4>
            <div className="space-y-2">
              {metadata.examples.map((example, index) => (
                <div key={index}>
                  {example.title && (
                    <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {example.title}
                    </span>
                  )}
                  <div
                    className={`
                      mt-1 text-xs font-mono p-2 rounded overflow-x-auto
                      ${example.type === 'code'
                        ? darkMode
                          ? 'bg-gray-800 text-green-400'
                          : 'bg-gray-100 text-gray-800'
                        : darkMode
                          ? 'bg-gray-800 text-gray-300'
                          : 'bg-gray-50 text-gray-700'
                      }
                    `}
                  >
                    <pre className="whitespace-pre-wrap break-all">
                      {example.content.length > 200
                        ? `${example.content.slice(0, 200)}...`
                        : example.content}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    )
  }
)

SkillMetadataSection.displayName = 'SkillMetadataSection'

/**
 * ノード詳細パネル
 *
 * 選択されたノードの詳細情報を表示するパネル
 * - ノード名、タイプ、パス
 * - 説明（frontmatterから）
 * - 参照先・参照元一覧
 * - 未解決の参照
 * - ファイルを開くボタン
 */
const NodeDetailPanel = memo<NodeDetailPanelProps>(({
  nodeDetail,
  onNodeClick,
  onOpenFile,
  darkMode,
}) => {
  // ノードが選択されていない場合
  if (!nodeDetail) {
    return (
      <div
        className={`
          w-[280px] flex-shrink-0 flex flex-col items-center justify-center
          border-l p-4
          ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}
        `}
      >
        <Icon
          name="infoCircle"
          className={`w-12 h-12 mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}
        />
        <p className={`text-sm text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          ノードを選択してください
        </p>
      </div>
    )
  }

  const { node, referencesTo, referencedBy, unknownRefs } = nodeDetail

  return (
    <div
      className={`
        w-[280px] flex-shrink-0 flex flex-col
        border-l overflow-hidden
        ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}
      `}
    >
      {/* スクロール可能なコンテンツ領域 */}
      <div className="flex-1 overflow-y-auto">
        {/* ノード基本情報 */}
        <div
          className={`
            p-4 border-b
            ${darkMode ? 'border-gray-700' : 'border-gray-200'}
          `}
        >
          {/* ノード名とエラーインジケーター */}
          <div className="flex items-start gap-2 mb-2">
            <h3
              className={`
                font-semibold text-base break-all flex-1
                ${darkMode ? 'text-gray-100' : 'text-gray-900'}
              `}
            >
              {node.label}
            </h3>
            {node.hasError && (
              <Icon
                name="warning"
                className="w-5 h-5 flex-shrink-0 text-red-500"
              />
            )}
          </div>

          {/* タイプバッジ */}
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              タイプ:
            </span>
            <span className={getNodeTypeBadgeStyle(node.type, darkMode)}>
              {NODE_TYPE_LABELS[node.type]}
            </span>
          </div>

          {/* パス */}
          <div className="mb-2">
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              パス:
            </span>
            <p
              className={`
                text-xs mt-1 font-mono break-all
                ${darkMode ? 'text-gray-300' : 'text-gray-600'}
              `}
            >
              {node.path}
            </p>
          </div>
        </div>

        {/* 説明（存在する場合） */}
        {node.description && (
          <div
            className={`
              p-4 border-b
              ${darkMode ? 'border-gray-700' : 'border-gray-200'}
            `}
          >
            <h4
              className={`
                text-xs font-medium mb-2
                ${darkMode ? 'text-gray-400' : 'text-gray-500'}
              `}
            >
              説明
            </h4>
            <p
              className={`
                text-sm leading-relaxed
                ${darkMode ? 'text-gray-300' : 'text-gray-700'}
              `}
            >
              {node.description}
            </p>
          </div>
        )}

        {/* メタデータセクション（スキル/エージェントの場合） */}
        {node.metadata && (
          <SkillMetadataSection metadata={node.metadata} darkMode={darkMode} nodeType={node.type} />
        )}

        {/* 参照先 */}
        <div
          className={`
            p-4 border-b
            ${darkMode ? 'border-gray-700' : 'border-gray-200'}
          `}
        >
          <h4
            className={`
              text-xs font-medium mb-2
              ${darkMode ? 'text-gray-400' : 'text-gray-500'}
            `}
          >
            参照先 ({referencesTo.length})
          </h4>
          {referencesTo.length > 0 ? (
            <ul className="space-y-1.5">
              {referencesTo.map((refNode) => (
                <li key={refNode.id}>
                  <button
                    type="button"
                    onClick={() => onNodeClick(refNode)}
                    className={`
                      text-sm text-left w-full px-2 py-1 rounded
                      transition-colors flex items-center gap-2
                      ${darkMode
                        ? 'text-blue-400 hover:bg-gray-800 hover:text-blue-300'
                        : 'text-blue-600 hover:bg-gray-100 hover:text-blue-700'
                      }
                    `}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: refNode.color || '#6b7280' }}
                    />
                    <span className="truncate">{refNode.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              なし
            </p>
          )}
        </div>

        {/* 参照元 */}
        <div
          className={`
            p-4 border-b
            ${darkMode ? 'border-gray-700' : 'border-gray-200'}
          `}
        >
          <h4
            className={`
              text-xs font-medium mb-2
              ${darkMode ? 'text-gray-400' : 'text-gray-500'}
            `}
          >
            参照元 ({referencedBy.length})
          </h4>
          {referencedBy.length > 0 ? (
            <ul className="space-y-1.5">
              {referencedBy.map((refNode) => (
                <li key={refNode.id}>
                  <button
                    type="button"
                    onClick={() => onNodeClick(refNode)}
                    className={`
                      text-sm text-left w-full px-2 py-1 rounded
                      transition-colors flex items-center gap-2
                      ${darkMode
                        ? 'text-blue-400 hover:bg-gray-800 hover:text-blue-300'
                        : 'text-blue-600 hover:bg-gray-100 hover:text-blue-700'
                      }
                    `}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: refNode.color || '#6b7280' }}
                    />
                    <span className="truncate">{refNode.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              なし
            </p>
          )}
        </div>

        {/* 未解決の参照（存在する場合） */}
        {unknownRefs.length > 0 && (
          <div
            className={`
              p-4 border-b
              ${darkMode ? 'border-gray-700' : 'border-gray-200'}
            `}
          >
            <h4
              className={`
                text-xs font-medium mb-2
                ${darkMode ? 'text-gray-400' : 'text-gray-500'}
              `}
            >
              未解決の参照 ({unknownRefs.length})
            </h4>
            <ul className="space-y-1">
              {unknownRefs.map((ref, index) => (
                <li
                  key={`${ref}-${index}`}
                  className={`
                    text-sm flex items-center gap-2
                    ${darkMode ? 'text-purple-400' : 'text-purple-600'}
                  `}
                >
                  <Icon name="warning" className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{ref}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ファイルを開くボタン（固定フッター） */}
      <div
        className={`
          p-4 border-t
          ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}
        `}
      >
        <button
          type="button"
          onClick={() => onOpenFile(node.path, node.label)}
          className={`
            w-full px-4 py-2 text-sm font-medium rounded-md
            transition-colors flex items-center justify-center gap-2
            ${darkMode
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
            }
          `}
        >
          <Icon name="externalLink" className="w-4 h-4" />
          ファイルを開く
        </button>
      </div>
    </div>
  )
})

NodeDetailPanel.displayName = 'NodeDetailPanel'

export default NodeDetailPanel
