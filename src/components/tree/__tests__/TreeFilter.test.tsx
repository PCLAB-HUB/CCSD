/**
 * TreeFilterButton と TreeFilterMenu のテスト
 *
 * @testing-library/react を使用したReactコンポーネントテスト
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import TreeFilterButton from '../TreeFilterButton'
import TreeFilterMenu from '../TreeFilterMenu'
import type { FilterType } from '../../../types/treeFilter'

// ============================================================
// TreeFilterButton テスト
// ============================================================

describe('TreeFilterButton', () => {
  const defaultProps = {
    activeFilterCount: 0,
    isMenuOpen: false,
    onToggleMenu: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('レンダリング', () => {
    it('正しくレンダリングされる', () => {
      render(<TreeFilterButton {...defaultProps} />)

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('フィルターアイコンが表示される', () => {
      render(<TreeFilterButton {...defaultProps} />)

      // SVGアイコンが存在することを確認
      const button = screen.getByRole('button')
      const svg = button.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('バッジ表示', () => {
    it('activeFilterCount > 0 でバッジが表示される', () => {
      render(<TreeFilterButton {...defaultProps} activeFilterCount={3} />)

      // バッジのテキストが表示される
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('activeFilterCount = 0 でバッジが表示されない', () => {
      render(<TreeFilterButton {...defaultProps} activeFilterCount={0} />)

      // バッジが存在しないことを確認
      expect(screen.queryByText('0')).not.toBeInTheDocument()
    })

    it('activeFilterCount > 9 で "9+" が表示される', () => {
      render(<TreeFilterButton {...defaultProps} activeFilterCount={15} />)

      expect(screen.getByText('9+')).toBeInTheDocument()
    })

    it('activeFilterCount = 9 で "9" が表示される', () => {
      render(<TreeFilterButton {...defaultProps} activeFilterCount={9} />)

      expect(screen.getByText('9')).toBeInTheDocument()
    })
  })

  describe('クリックイベント', () => {
    it('クリックでonToggleMenuが呼ばれる', async () => {
      const onToggleMenu = vi.fn()
      render(<TreeFilterButton {...defaultProps} onToggleMenu={onToggleMenu} />)

      const button = screen.getByRole('button')
      await userEvent.click(button)

      expect(onToggleMenu).toHaveBeenCalledTimes(1)
    })

    it('複数回クリックで複数回呼ばれる', async () => {
      const onToggleMenu = vi.fn()
      render(<TreeFilterButton {...defaultProps} onToggleMenu={onToggleMenu} />)

      const button = screen.getByRole('button')
      await userEvent.click(button)
      await userEvent.click(button)
      await userEvent.click(button)

      expect(onToggleMenu).toHaveBeenCalledTimes(3)
    })
  })

  describe('アクセシビリティ', () => {
    it('aria-label が正しく設定される（フィルターなし）', () => {
      render(<TreeFilterButton {...defaultProps} activeFilterCount={0} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'フィルター')
    })

    it('aria-label が正しく設定される（フィルターあり）', () => {
      render(<TreeFilterButton {...defaultProps} activeFilterCount={3} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute(
        'aria-label',
        'フィルター（3件のフィルターが有効）'
      )
    })

    it('aria-expanded が正しく設定される（閉じている）', () => {
      render(<TreeFilterButton {...defaultProps} isMenuOpen={false} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-expanded', 'false')
    })

    it('aria-expanded が正しく設定される（開いている）', () => {
      render(<TreeFilterButton {...defaultProps} isMenuOpen={true} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-expanded', 'true')
    })

    it('aria-haspopup="menu" が設定される', () => {
      render(<TreeFilterButton {...defaultProps} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-haspopup', 'menu')
    })

    it('title属性が正しく設定される（フィルターなし）', () => {
      render(<TreeFilterButton {...defaultProps} activeFilterCount={0} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('title', 'フィルター')
    })

    it('title属性が正しく設定される（フィルターあり）', () => {
      render(<TreeFilterButton {...defaultProps} activeFilterCount={2} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('title', '2件のフィルターが有効')
    })
  })

  describe('スタイル', () => {
    it('メニューオープン時にアクティブスタイルが適用される', () => {
      render(<TreeFilterButton {...defaultProps} isMenuOpen={true} />)

      const button = screen.getByRole('button')
      expect(button.className).toContain('bg-blue-100')
    })

    it('フィルター有効時にスタイルが変わる', () => {
      render(
        <TreeFilterButton
          {...defaultProps}
          activeFilterCount={1}
          isMenuOpen={false}
        />
      )

      const button = screen.getByRole('button')
      expect(button.className).toContain('bg-blue-50')
    })

    it('追加のclassNameが適用される', () => {
      render(<TreeFilterButton {...defaultProps} className="custom-class" />)

      const button = screen.getByRole('button')
      expect(button.className).toContain('custom-class')
    })
  })
})

// ============================================================
// TreeFilterMenu テスト
// ============================================================

describe('TreeFilterMenu', () => {
  const defaultProps = {
    onClose: vi.fn(),
    activeFilters: [] as FilterType[],
    onToggleFilter: vi.fn(),
    onClearFilters: vi.fn(),
    searchFilter: '',
    onSearchFilterChange: vi.fn(),
    showHiddenFiles: false,
    onToggleHiddenFiles: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('レンダリング', () => {
    it('正しくレンダリングされる', () => {
      render(<TreeFilterMenu {...defaultProps} />)

      const menu = screen.getByRole('menu')
      expect(menu).toBeInTheDocument()
    })

    it('aria-label が正しく設定される', () => {
      render(<TreeFilterMenu {...defaultProps} />)

      const menu = screen.getByRole('menu')
      expect(menu).toHaveAttribute('aria-label', 'ファイルフィルターメニュー')
    })
  })

  describe('フィルターオプション表示', () => {
    it('すべてのフィルターオプションが表示される', () => {
      render(<TreeFilterMenu {...defaultProps} />)

      expect(screen.getByText('すべて表示')).toBeInTheDocument()
      expect(screen.getByText('Markdown (.md)')).toBeInTheDocument()
      expect(screen.getByText('JSON (.json)')).toBeInTheDocument()
      expect(screen.getByText('スキルファイル')).toBeInTheDocument()
      expect(screen.getByText('エージェント定義')).toBeInTheDocument()
      expect(screen.getByText('ディレクトリのみ')).toBeInTheDocument()
    })

    it('隠しファイル表示オプションが表示される', () => {
      render(<TreeFilterMenu {...defaultProps} />)

      expect(screen.getByText('隠しファイルを表示')).toBeInTheDocument()
    })

    it('検索入力フィールドが表示される', () => {
      render(<TreeFilterMenu {...defaultProps} />)

      expect(
        screen.getByPlaceholderText('ファイル名で検索...')
      ).toBeInTheDocument()
    })
  })

  describe('チェックボックスクリック', () => {
    it('フィルターオプションクリックでonToggleFilterが呼ばれる', async () => {
      const onToggleFilter = vi.fn()
      render(
        <TreeFilterMenu {...defaultProps} onToggleFilter={onToggleFilter} />
      )

      // Markdown (.md) をクリック
      const markdownOption = screen.getByText('Markdown (.md)')
      await userEvent.click(markdownOption)

      expect(onToggleFilter).toHaveBeenCalledWith('markdown')
    })

    it('JSONフィルターをクリックするとonToggleFilterが呼ばれる', async () => {
      const onToggleFilter = vi.fn()
      render(
        <TreeFilterMenu {...defaultProps} onToggleFilter={onToggleFilter} />
      )

      const jsonOption = screen.getByText('JSON (.json)')
      await userEvent.click(jsonOption)

      expect(onToggleFilter).toHaveBeenCalledWith('json')
    })

    it('「すべて表示」クリックでonClearFiltersが呼ばれる', async () => {
      const onClearFilters = vi.fn()
      render(
        <TreeFilterMenu {...defaultProps} onClearFilters={onClearFilters} />
      )

      const allOption = screen.getByText('すべて表示')
      await userEvent.click(allOption)

      expect(onClearFilters).toHaveBeenCalledTimes(1)
    })

    it('隠しファイルオプションクリックでonToggleHiddenFilesが呼ばれる', async () => {
      const onToggleHiddenFiles = vi.fn()
      render(
        <TreeFilterMenu
          {...defaultProps}
          onToggleHiddenFiles={onToggleHiddenFiles}
        />
      )

      const hiddenFilesOption = screen.getByText('隠しファイルを表示')
      await userEvent.click(hiddenFilesOption)

      expect(onToggleHiddenFiles).toHaveBeenCalledTimes(1)
    })
  })

  describe('検索入力', () => {
    it('検索入力でonSearchFilterChangeが呼ばれる', async () => {
      const onSearchFilterChange = vi.fn()
      render(
        <TreeFilterMenu
          {...defaultProps}
          onSearchFilterChange={onSearchFilterChange}
        />
      )

      const searchInput = screen.getByPlaceholderText('ファイル名で検索...')
      await userEvent.type(searchInput, 'test')

      // 各文字入力ごとに呼ばれる（4回）
      // 制御されたコンポーネントなので、propsのsearchFilterが空のままだと
      // 各入力は1文字ずつになる（t, e, s, t）
      expect(onSearchFilterChange).toHaveBeenCalledTimes(4)
      expect(onSearchFilterChange).toHaveBeenNthCalledWith(1, 't')
      expect(onSearchFilterChange).toHaveBeenNthCalledWith(2, 'e')
      expect(onSearchFilterChange).toHaveBeenNthCalledWith(3, 's')
      expect(onSearchFilterChange).toHaveBeenNthCalledWith(4, 't')
    })

    it('検索入力に初期値が表示される', () => {
      render(<TreeFilterMenu {...defaultProps} searchFilter="initial" />)

      const searchInput = screen.getByPlaceholderText(
        'ファイル名で検索...'
      ) as HTMLInputElement
      expect(searchInput.value).toBe('initial')
    })

    it('検索クリアボタンが表示される（検索文字列がある場合）', () => {
      render(<TreeFilterMenu {...defaultProps} searchFilter="test" />)

      // 検索クリアボタン（aria-label="検索をクリア"）
      const clearButton = screen.getByLabelText('検索をクリア')
      expect(clearButton).toBeInTheDocument()
    })

    it('検索クリアボタンが表示されない（検索文字列がない場合）', () => {
      render(<TreeFilterMenu {...defaultProps} searchFilter="" />)

      expect(screen.queryByLabelText('検索をクリア')).not.toBeInTheDocument()
    })

    it('検索クリアボタンクリックでonSearchFilterChangeが空文字で呼ばれる', async () => {
      const onSearchFilterChange = vi.fn()
      render(
        <TreeFilterMenu
          {...defaultProps}
          searchFilter="test"
          onSearchFilterChange={onSearchFilterChange}
        />
      )

      const clearButton = screen.getByLabelText('検索をクリア')
      await userEvent.click(clearButton)

      expect(onSearchFilterChange).toHaveBeenCalledWith('')
    })
  })

  describe('クリアボタン', () => {
    it('アクティブなフィルターがある場合、クリアボタンが表示される', () => {
      render(
        <TreeFilterMenu
          {...defaultProps}
          activeFilters={['markdown']}
        />
      )

      const clearButton = screen.getByLabelText('すべてのフィルターをクリア')
      expect(clearButton).toBeInTheDocument()
    })

    it('検索フィルターがある場合、クリアボタンが表示される', () => {
      render(
        <TreeFilterMenu
          {...defaultProps}
          searchFilter="test"
        />
      )

      const clearButton = screen.getByLabelText('すべてのフィルターをクリア')
      expect(clearButton).toBeInTheDocument()
    })

    it('隠しファイル表示がオンの場合、クリアボタンが表示される', () => {
      render(
        <TreeFilterMenu
          {...defaultProps}
          showHiddenFiles={true}
        />
      )

      const clearButton = screen.getByLabelText('すべてのフィルターをクリア')
      expect(clearButton).toBeInTheDocument()
    })

    it('アクティブなフィルターがない場合、クリアボタンが表示されない', () => {
      render(
        <TreeFilterMenu
          {...defaultProps}
          activeFilters={[]}
          searchFilter=""
          showHiddenFiles={false}
        />
      )

      expect(
        screen.queryByLabelText('すべてのフィルターをクリア')
      ).not.toBeInTheDocument()
    })

    it('クリアボタンクリックでonClearFiltersとonSearchFilterChangeが呼ばれる', async () => {
      const onClearFilters = vi.fn()
      const onSearchFilterChange = vi.fn()
      render(
        <TreeFilterMenu
          {...defaultProps}
          activeFilters={['markdown']}
          searchFilter="test"
          onClearFilters={onClearFilters}
          onSearchFilterChange={onSearchFilterChange}
        />
      )

      const clearButton = screen.getByLabelText('すべてのフィルターをクリア')
      await userEvent.click(clearButton)

      expect(onClearFilters).toHaveBeenCalledTimes(1)
      expect(onSearchFilterChange).toHaveBeenCalledWith('')
    })

    it('クリアボタンにアクティブなフィルター数が表示される', () => {
      render(
        <TreeFilterMenu
          {...defaultProps}
          activeFilters={['markdown', 'json']}
          searchFilter="test"
          showHiddenFiles={true}
        />
      )

      // 2 (フィルター) + 1 (検索) + 1 (隠しファイル) = 4
      expect(screen.getByText('すべてクリア (4)')).toBeInTheDocument()
    })
  })

  describe('Escapeキー', () => {
    it('EscapeキーでonCloseが呼ばれる', () => {
      const onClose = vi.fn()
      render(<TreeFilterMenu {...defaultProps} onClose={onClose} />)

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('アクティブ状態表示', () => {
    it('アクティブなフィルターにチェックマークが表示される', () => {
      render(
        <TreeFilterMenu
          {...defaultProps}
          activeFilters={['markdown']}
        />
      )

      // Markdownオプションがアクティブ
      const markdownOption = screen
        .getByText('Markdown (.md)')
        .closest('button')
      expect(markdownOption).toHaveAttribute('aria-checked', 'true')
    })

    it('非アクティブなフィルターにチェックマークが表示されない', () => {
      render(
        <TreeFilterMenu
          {...defaultProps}
          activeFilters={['markdown']}
        />
      )

      // JSONオプションは非アクティブ
      const jsonOption = screen.getByText('JSON (.json)').closest('button')
      expect(jsonOption).toHaveAttribute('aria-checked', 'false')
    })

    it('フィルターがない場合、「すべて表示」がアクティブ', () => {
      render(
        <TreeFilterMenu
          {...defaultProps}
          activeFilters={[]}
        />
      )

      const allOption = screen.getByText('すべて表示').closest('button')
      expect(allOption).toHaveAttribute('aria-checked', 'true')
    })

    it('隠しファイル表示がオンの場合、チェックマークが表示される', () => {
      render(
        <TreeFilterMenu
          {...defaultProps}
          showHiddenFiles={true}
        />
      )

      const hiddenFilesOption = screen
        .getByText('隠しファイルを表示')
        .closest('button')
      expect(hiddenFilesOption).toHaveAttribute('aria-checked', 'true')
    })
  })
})
