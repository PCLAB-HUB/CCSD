import { useRef, useEffect } from 'react'
import type * as monaco from 'monaco-editor'
import type { SearchHighlight } from '../types'

export interface UseSearchHighlightProps {
  editorRef: React.MutableRefObject<monaco.editor.IStandaloneCodeEditor | null>
  searchHighlight: SearchHighlight | null
  onSearchCountUpdate: (count: number) => void
}

export interface UseSearchHighlightReturn {
  decorationsRef: React.MutableRefObject<string[]>
  matchesRef: React.MutableRefObject<monaco.editor.FindMatch[]>
}

export function useSearchHighlight({
  editorRef,
  searchHighlight,
  onSearchCountUpdate,
}: UseSearchHighlightProps): UseSearchHighlightReturn {
  const decorationsRef = useRef<string[]>([])
  const matchesRef = useRef<monaco.editor.FindMatch[]>([])

  // 検索ハイライトの更新
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    const model = editor.getModel()
    if (!model) return

    // 既存のデコレーションをクリア
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [])
    matchesRef.current = []

    if (!searchHighlight?.query) {
      onSearchCountUpdate(0)
      return
    }

    // 検索マッチを取得
    const matches = model.findMatches(
      searchHighlight.query,
      true, // searchOnlyEditableRange
      false, // isRegex
      false, // matchCase
      null, // wordSeparators
      true // captureMatches
    )

    matchesRef.current = matches
    onSearchCountUpdate(matches.length)

    if (matches.length === 0) return

    // モナコのOverviewRulerLaneの値（直接指定）
    const OverviewRulerLaneCenter = 2

    // デコレーションを作成（ハイライト表示）
    const decorations: monaco.editor.IModelDeltaDecoration[] = matches.map((match, index) => ({
      range: match.range,
      options: {
        className: index === searchHighlight.currentIndex
          ? 'search-highlight-current'
          : 'search-highlight',
        overviewRuler: {
          color: index === searchHighlight.currentIndex ? '#ff9900' : '#ffff00',
          position: OverviewRulerLaneCenter,
        },
      },
    }))

    decorationsRef.current = editor.deltaDecorations([], decorations)

    // 現在のマッチにスクロール
    if (matches[searchHighlight.currentIndex]) {
      const currentMatch = matches[searchHighlight.currentIndex]
      editor.setSelection(currentMatch.range)
      editor.revealRangeInCenter(currentMatch.range)
    }
  }, [editorRef, searchHighlight?.query, searchHighlight?.currentIndex, searchHighlight?.totalCount, onSearchCountUpdate])

  return {
    decorationsRef,
    matchesRef,
  }
}
