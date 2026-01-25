import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
  build: {
    outDir: 'dist',
    target: ['es2021', 'chrome100', 'safari13'],
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        preview: resolve(__dirname, 'preview.html'),
      },
      output: {
        manualChunks: {
          // Monaco Editorを分離（重いライブラリ）
          'monaco-editor': ['@monaco-editor/react', 'monaco-editor'],
          // Markdown関連を分離
          'markdown': ['react-markdown', 'remark-gfm'],
          // シンタックスハイライトを分離
          'syntax-highlighter': ['react-syntax-highlighter'],
          // gray-matterを分離
          'gray-matter': ['gray-matter'],
          // React関連のvendor
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
