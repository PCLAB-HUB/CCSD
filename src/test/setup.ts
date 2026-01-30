/**
 * Vitest テストセットアップファイル
 *
 * @testing-library/jest-dom のマッチャーを追加
 */

import '@testing-library/jest-dom'

// グローバルなモック設定
// Tauri APIのモック（必要に応じて）
vi.mock('@tauri-apps/api', () => ({
  invoke: vi.fn(),
}))

// ResizeObserverのモック（Monaco Editor等で必要）
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// matchMediaのモック（ダークモード検出等で必要）
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
