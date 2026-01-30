/**
 * ツリーフィルターユーティリティ関数のテスト
 */

import { describe, it, expect } from 'vitest'
import {
  filterFileTree,
  matchesFilter,
  matchesAnyFilter,
  matchesSearchFilter,
  countFilteredNodes,
  countFilteredFiles,
  isHiddenFile,
  FILTER_CONFIGS,
} from '../treeFilterUtils'
import type { FileNode } from '../../types/files'
import type { FilterType } from '../../types/treeFilter'

// ============================================================
// テストデータ
// ============================================================

const mockFileTree: FileNode[] = [
  { name: 'CLAUDE.md', path: '~/.claude/CLAUDE.md', file_type: 'file' },
  { name: 'settings.json', path: '~/.claude/settings.json', file_type: 'file' },
  { name: '.hidden', path: '~/.claude/.hidden', file_type: 'file' },
  { name: '.config', path: '~/.claude/.config', file_type: 'directory', children: [] },
  {
    name: 'skills',
    path: '~/.claude/skills',
    file_type: 'directory',
    children: [
      { name: 'my-skill.md', path: '~/.claude/skills/my-skill.md', file_type: 'file' },
      { name: 'another-skill.md', path: '~/.claude/skills/another-skill.md', file_type: 'file' },
    ],
  },
  {
    name: 'agents',
    path: '~/.claude/agents',
    file_type: 'directory',
    children: [
      { name: 'test-agent.md', path: '~/.claude/agents/test-agent.md', file_type: 'file' },
    ],
  },
  { name: 'readme.txt', path: '~/.claude/readme.txt', file_type: 'file' },
]

// ============================================================
// isHiddenFile
// ============================================================

describe('isHiddenFile', () => {
  it('.で始まるファイルはtrue', () => {
    const hiddenFile: FileNode = { name: '.hidden', path: '~/.claude/.hidden', file_type: 'file' }
    expect(isHiddenFile(hiddenFile)).toBe(true)
  })

  it('.で始まるディレクトリはtrue', () => {
    const hiddenDir: FileNode = { name: '.config', path: '~/.claude/.config', file_type: 'directory' }
    expect(isHiddenFile(hiddenDir)).toBe(true)
  })

  it('CLAUDE.mdは例外でfalse', () => {
    const claudeMd: FileNode = { name: 'CLAUDE.md', path: '~/.claude/CLAUDE.md', file_type: 'file' }
    expect(isHiddenFile(claudeMd)).toBe(false)
  })

  it('通常ファイルはfalse', () => {
    const normalFile: FileNode = { name: 'settings.json', path: '~/.claude/settings.json', file_type: 'file' }
    expect(isHiddenFile(normalFile)).toBe(false)
  })

  it('通常ディレクトリはfalse', () => {
    const normalDir: FileNode = { name: 'skills', path: '~/.claude/skills', file_type: 'directory' }
    expect(isHiddenFile(normalDir)).toBe(false)
  })
})

// ============================================================
// matchesFilter
// ============================================================

describe('matchesFilter', () => {
  describe('allフィルター', () => {
    it('すべてのノードにマッチする', () => {
      const file: FileNode = { name: 'test.md', path: '/test.md', file_type: 'file' }
      const dir: FileNode = { name: 'dir', path: '/dir', file_type: 'directory' }
      expect(matchesFilter(file, 'all')).toBe(true)
      expect(matchesFilter(dir, 'all')).toBe(true)
    })
  })

  describe('markdownフィルター', () => {
    it('.mdファイルにマッチする', () => {
      const mdFile: FileNode = { name: 'readme.md', path: '/readme.md', file_type: 'file' }
      expect(matchesFilter(mdFile, 'markdown')).toBe(true)
    })

    it('.MDファイル（大文字）にマッチする', () => {
      const mdFile: FileNode = { name: 'README.MD', path: '/README.MD', file_type: 'file' }
      expect(matchesFilter(mdFile, 'markdown')).toBe(true)
    })

    it('他の拡張子にはマッチしない', () => {
      const jsonFile: FileNode = { name: 'config.json', path: '/config.json', file_type: 'file' }
      expect(matchesFilter(jsonFile, 'markdown')).toBe(false)
    })

    it('ディレクトリにはマッチしない', () => {
      const dir: FileNode = { name: 'docs.md', path: '/docs.md', file_type: 'directory' }
      expect(matchesFilter(dir, 'markdown')).toBe(false)
    })
  })

  describe('jsonフィルター', () => {
    it('.jsonファイルにマッチする', () => {
      const jsonFile: FileNode = { name: 'settings.json', path: '/settings.json', file_type: 'file' }
      expect(matchesFilter(jsonFile, 'json')).toBe(true)
    })

    it('.JSONファイル（大文字）にマッチする', () => {
      const jsonFile: FileNode = { name: 'CONFIG.JSON', path: '/CONFIG.JSON', file_type: 'file' }
      expect(matchesFilter(jsonFile, 'json')).toBe(true)
    })

    it('他の拡張子にはマッチしない', () => {
      const mdFile: FileNode = { name: 'readme.md', path: '/readme.md', file_type: 'file' }
      expect(matchesFilter(mdFile, 'json')).toBe(false)
    })
  })

  describe('skillフィルター', () => {
    it('skills/配下のファイルにマッチする', () => {
      const skillFile: FileNode = { name: 'my-skill.md', path: '~/.claude/skills/my-skill.md', file_type: 'file' }
      expect(matchesFilter(skillFile, 'skill')).toBe(true)
    })

    it('skills/で始まるパスにマッチする', () => {
      const skillFile: FileNode = { name: 'test.md', path: 'skills/test.md', file_type: 'file' }
      expect(matchesFilter(skillFile, 'skill')).toBe(true)
    })

    it('skills以外のパスにはマッチしない', () => {
      const otherFile: FileNode = { name: 'readme.md', path: '~/.claude/readme.md', file_type: 'file' }
      expect(matchesFilter(otherFile, 'skill')).toBe(false)
    })
  })

  describe('agentフィルター', () => {
    it('agents/配下のファイルにマッチする', () => {
      const agentFile: FileNode = { name: 'test-agent.md', path: '~/.claude/agents/test-agent.md', file_type: 'file' }
      expect(matchesFilter(agentFile, 'agent')).toBe(true)
    })

    it('ファイル名にagentを含むファイルにマッチする', () => {
      const agentFile: FileNode = { name: 'my-agent-config.md', path: '~/.claude/my-agent-config.md', file_type: 'file' }
      expect(matchesFilter(agentFile, 'agent')).toBe(true)
    })

    it('agent関連でないファイルにはマッチしない', () => {
      const otherFile: FileNode = { name: 'readme.md', path: '~/.claude/readme.md', file_type: 'file' }
      expect(matchesFilter(otherFile, 'agent')).toBe(false)
    })
  })

  describe('directoryフィルター', () => {
    it('ディレクトリにマッチする', () => {
      const dir: FileNode = { name: 'skills', path: '/skills', file_type: 'directory' }
      expect(matchesFilter(dir, 'directory')).toBe(true)
    })

    it('ファイルにはマッチしない', () => {
      const file: FileNode = { name: 'readme.md', path: '/readme.md', file_type: 'file' }
      expect(matchesFilter(file, 'directory')).toBe(false)
    })
  })
})

// ============================================================
// matchesAnyFilter
// ============================================================

describe('matchesAnyFilter', () => {
  it('allが含まれていれば常にtrue', () => {
    const file: FileNode = { name: 'test.txt', path: '/test.txt', file_type: 'file' }
    expect(matchesAnyFilter(file, ['all', 'markdown'])).toBe(true)
    expect(matchesAnyFilter(file, ['all'])).toBe(true)
  })

  it('複数フィルターのいずれかにマッチすればtrue（OR条件）', () => {
    const mdFile: FileNode = { name: 'readme.md', path: '/readme.md', file_type: 'file' }
    expect(matchesAnyFilter(mdFile, ['markdown', 'json'])).toBe(true)

    const jsonFile: FileNode = { name: 'config.json', path: '/config.json', file_type: 'file' }
    expect(matchesAnyFilter(jsonFile, ['markdown', 'json'])).toBe(true)
  })

  it('いずれのフィルターにもマッチしなければfalse', () => {
    const txtFile: FileNode = { name: 'readme.txt', path: '/readme.txt', file_type: 'file' }
    expect(matchesAnyFilter(txtFile, ['markdown', 'json'])).toBe(false)
  })

  it('空の配列の場合はfalse', () => {
    const file: FileNode = { name: 'test.md', path: '/test.md', file_type: 'file' }
    expect(matchesAnyFilter(file, [])).toBe(false)
  })
})

// ============================================================
// matchesSearchFilter
// ============================================================

describe('matchesSearchFilter', () => {
  it('部分一致で動作する', () => {
    const file: FileNode = { name: 'my-skill.md', path: '/my-skill.md', file_type: 'file' }
    expect(matchesSearchFilter(file, 'skill')).toBe(true)
    expect(matchesSearchFilter(file, 'my')).toBe(true)
    expect(matchesSearchFilter(file, '.md')).toBe(true)
  })

  it('大文字小文字を無視する', () => {
    const file: FileNode = { name: 'MyFile.md', path: '/MyFile.md', file_type: 'file' }
    expect(matchesSearchFilter(file, 'myfile')).toBe(true)
    expect(matchesSearchFilter(file, 'MYFILE')).toBe(true)
  })

  it('空文字の場合は常にtrue', () => {
    const file: FileNode = { name: 'test.md', path: '/test.md', file_type: 'file' }
    expect(matchesSearchFilter(file, '')).toBe(true)
  })

  it('マッチしない場合はfalse', () => {
    const file: FileNode = { name: 'readme.md', path: '/readme.md', file_type: 'file' }
    expect(matchesSearchFilter(file, 'config')).toBe(false)
  })
})

// ============================================================
// filterFileTree
// ============================================================

describe('filterFileTree', () => {
  it('空の配列を渡すと空の配列を返す', () => {
    const result = filterFileTree([], ['all'])
    expect(result).toEqual([])
  })

  it('allフィルターはすべてのノードを返す（隠しファイル除く）', () => {
    const result = filterFileTree(mockFileTree, ['all'])
    // 隠しファイル(.hidden, .config)を除いた5ノード
    expect(result.length).toBe(5)
    expect(result.find((n) => n.name === 'CLAUDE.md')).toBeDefined()
    expect(result.find((n) => n.name === 'settings.json')).toBeDefined()
    expect(result.find((n) => n.name === '.hidden')).toBeUndefined()
  })

  it('markdownフィルターは.mdファイルのみ返す', () => {
    const result = filterFileTree(mockFileTree, ['markdown'])

    // CLAUDE.mdとskills/配下の2ファイル
    expect(result.find((n) => n.name === 'CLAUDE.md')).toBeDefined()
    expect(result.find((n) => n.name === 'skills')).toBeDefined()

    // JSONファイルは含まれない
    expect(result.find((n) => n.name === 'settings.json')).toBeUndefined()
    // txtファイルは含まれない
    expect(result.find((n) => n.name === 'readme.txt')).toBeUndefined()
  })

  it('jsonフィルターは.jsonファイルのみ返す', () => {
    const result = filterFileTree(mockFileTree, ['json'])

    expect(result.find((n) => n.name === 'settings.json')).toBeDefined()
    expect(result.find((n) => n.name === 'CLAUDE.md')).toBeUndefined()
  })

  it('ディレクトリは子がある場合のみ残る', () => {
    const result = filterFileTree(mockFileTree, ['markdown'])

    // skillsディレクトリは子に.mdファイルがあるので残る
    const skillsDir = result.find((n) => n.name === 'skills')
    expect(skillsDir).toBeDefined()
    expect(skillsDir?.children?.length).toBe(2)

    // agentsディレクトリも子に.mdファイルがあるので残る
    const agentsDir = result.find((n) => n.name === 'agents')
    expect(agentsDir).toBeDefined()
  })

  it('検索フィルターは部分一致で動作する', () => {
    const result = filterFileTree(mockFileTree, ['all'], { searchFilter: 'skill' })

    // skillsディレクトリとその中のファイルがマッチ
    const skillsDir = result.find((n) => n.name === 'skills')
    expect(skillsDir).toBeDefined()
    expect(skillsDir?.children?.length).toBe(2)
  })

  it('隠しファイル設定がfalseの場合、隠しファイルを除外する', () => {
    const result = filterFileTree(mockFileTree, ['all'], { showHiddenFiles: false })

    expect(result.find((n) => n.name === '.hidden')).toBeUndefined()
    expect(result.find((n) => n.name === '.config')).toBeUndefined()
    // CLAUDE.mdは例外なので含まれる
    expect(result.find((n) => n.name === 'CLAUDE.md')).toBeDefined()
  })

  it('隠しファイル設定がtrueの場合、隠しファイルを含める', () => {
    const result = filterFileTree(mockFileTree, ['all'], { showHiddenFiles: true })

    expect(result.find((n) => n.name === '.hidden')).toBeDefined()
    // .configは空ディレクトリなので含まれない
    expect(result.find((n) => n.name === '.config')).toBeUndefined()
  })

  it('複数フィルターの組み合わせ（OR条件）', () => {
    const result = filterFileTree(mockFileTree, ['markdown', 'json'])

    // .mdファイルと.jsonファイルの両方が含まれる
    expect(result.find((n) => n.name === 'CLAUDE.md')).toBeDefined()
    expect(result.find((n) => n.name === 'settings.json')).toBeDefined()
    // txtファイルは含まれない
    expect(result.find((n) => n.name === 'readme.txt')).toBeUndefined()
  })

  it('directoryフィルターはディレクトリを返す', () => {
    const result = filterFileTree(mockFileTree, ['directory'])

    expect(result.find((n) => n.name === 'skills')).toBeDefined()
    expect(result.find((n) => n.name === 'agents')).toBeDefined()
  })

  it('skillフィルターはskills/配下のみ返す', () => {
    const result = filterFileTree(mockFileTree, ['skill'])

    const skillsDir = result.find((n) => n.name === 'skills')
    expect(skillsDir).toBeDefined()
    expect(skillsDir?.children?.length).toBe(2)

    // skills/配下以外は含まれない
    expect(result.find((n) => n.name === 'CLAUDE.md')).toBeUndefined()
  })

  it('agentフィルターはagents/配下を返す', () => {
    const result = filterFileTree(mockFileTree, ['agent'])

    const agentsDir = result.find((n) => n.name === 'agents')
    expect(agentsDir).toBeDefined()
  })
})

// ============================================================
// countFilteredNodes
// ============================================================

describe('countFilteredNodes', () => {
  it('再帰的にカウントする（ディレクトリ含む）', () => {
    const nodes: FileNode[] = [
      { name: 'file1.md', path: '/file1.md', file_type: 'file' },
      {
        name: 'dir',
        path: '/dir',
        file_type: 'directory',
        children: [
          { name: 'file2.md', path: '/dir/file2.md', file_type: 'file' },
          { name: 'file3.md', path: '/dir/file3.md', file_type: 'file' },
        ],
      },
    ]
    // file1 + dir + file2 + file3 = 4
    expect(countFilteredNodes(nodes)).toBe(4)
  })

  it('空配列は0を返す', () => {
    expect(countFilteredNodes([])).toBe(0)
  })

  it('ネストしたディレクトリも正しくカウントする', () => {
    const nodes: FileNode[] = [
      {
        name: 'level1',
        path: '/level1',
        file_type: 'directory',
        children: [
          {
            name: 'level2',
            path: '/level1/level2',
            file_type: 'directory',
            children: [
              { name: 'deep.md', path: '/level1/level2/deep.md', file_type: 'file' },
            ],
          },
        ],
      },
    ]
    // level1 + level2 + deep.md = 3
    expect(countFilteredNodes(nodes)).toBe(3)
  })
})

// ============================================================
// countFilteredFiles
// ============================================================

describe('countFilteredFiles', () => {
  it('ディレクトリはカウントしない', () => {
    const nodes: FileNode[] = [
      { name: 'file1.md', path: '/file1.md', file_type: 'file' },
      {
        name: 'dir',
        path: '/dir',
        file_type: 'directory',
        children: [
          { name: 'file2.md', path: '/dir/file2.md', file_type: 'file' },
          { name: 'file3.md', path: '/dir/file3.md', file_type: 'file' },
        ],
      },
    ]
    // file1 + file2 + file3 = 3（ディレクトリはカウントしない）
    expect(countFilteredFiles(nodes)).toBe(3)
  })

  it('空配列は0を返す', () => {
    expect(countFilteredFiles([])).toBe(0)
  })

  it('ディレクトリのみの場合は0を返す', () => {
    const nodes: FileNode[] = [
      {
        name: 'empty-dir',
        path: '/empty-dir',
        file_type: 'directory',
        children: [],
      },
    ]
    expect(countFilteredFiles(nodes)).toBe(0)
  })
})

// ============================================================
// FILTER_CONFIGS
// ============================================================

describe('FILTER_CONFIGS', () => {
  it('全てのフィルタータイプの設定が存在する', () => {
    const filterTypes: FilterType[] = ['all', 'markdown', 'json', 'skill', 'agent', 'directory']

    for (const type of filterTypes) {
      expect(FILTER_CONFIGS[type]).toBeDefined()
      expect(FILTER_CONFIGS[type].type).toBe(type)
      expect(FILTER_CONFIGS[type].label).toBeTruthy()
      expect(FILTER_CONFIGS[type].icon).toBeTruthy()
      expect(FILTER_CONFIGS[type].description).toBeTruthy()
      expect(typeof FILTER_CONFIGS[type].matchFn).toBe('function')
    }
  })
})
