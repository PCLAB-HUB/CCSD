import { invoke } from '@tauri-apps/api/core'

export interface FileNode {
  name: string
  path: string
  file_type: 'file' | 'directory'
  children?: FileNode[]
}

export interface FileContent {
  path: string
  content: string
  name: string
}

export async function getFileTree(): Promise<FileNode[]> {
  try {
    return await invoke<FileNode[]>('get_file_tree')
  } catch {
    return []
  }
}

export async function readFile(path: string): Promise<FileContent | null> {
  try {
    return await invoke<FileContent>('read_file', { path })
  } catch {
    return null
  }
}

export async function writeFile(path: string, content: string): Promise<boolean> {
  try {
    await invoke('write_file', { path, content })
    return true
  } catch {
    return false
  }
}

export async function searchFiles(query: string): Promise<FileContent[]> {
  try {
    return await invoke<FileContent[]>('search_files', { query })
  } catch {
    return []
  }
}

export async function getBackups(): Promise<FileNode[]> {
  try {
    return await invoke<FileNode[]>('get_backups')
  } catch {
    return []
  }
}

export async function restoreBackup(backupPath: string, targetPath: string): Promise<boolean> {
  try {
    await invoke('restore_backup', { backupPath, targetPath })
    return true
  } catch {
    return false
  }
}

// Tauri環境かどうかを判定
// Tauri v2では __TAURI_INTERNALS__ も使用される
export function isTauri(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  return '__TAURI__' in window || '__TAURI_INTERNALS__' in window
}
