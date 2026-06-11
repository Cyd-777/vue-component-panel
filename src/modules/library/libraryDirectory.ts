/**
 * 组件库目录 — 与启动页选择的 flow-library-path 联动
 * 使用 File System Access API 读写目录内 .vue 文件
 */
import { inferComponentMeta } from '../editor/componentFile'
import type { StoredComponentFile } from '../editor/componentFileStore'

export const LIBRARY_PATH_KEY = 'flow-library-path'
const HANDLE_DB = 'flow-panel-fs'
const HANDLE_STORE = 'handles'
const HANDLE_KEY = 'library-root'

export interface LibraryDirectoryStatus {
  pathLabel: string
  hasWritableHandle: boolean
  fileCount: number
}

let cachedHandle: FileSystemDirectoryHandle | null = null
let cachedPathLabel = ''

function isFsAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window
}

function openHandleDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(HANDLE_DB, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(HANDLE_STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function loadPersistedHandle(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFsAccessSupported()) return null
  try {
    const db = await openHandleDb()
    const handle = await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
      const tx = db.transaction(HANDLE_STORE, 'readonly')
      const req = tx.objectStore(HANDLE_STORE).get(HANDLE_KEY)
      req.onsuccess = () => resolve((req.result as FileSystemDirectoryHandle) ?? null)
      req.onerror = () => reject(req.error)
    })
    db.close()
    if (!handle) return null
    const perm = await handle.queryPermission({ mode: 'readwrite' })
    if (perm === 'granted') return handle
    const reqPerm = await handle.requestPermission({ mode: 'readwrite' })
    return reqPerm === 'granted' ? handle : null
  } catch {
    return null
  }
}

async function persistHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openHandleDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(HANDLE_STORE, 'readwrite')
    tx.objectStore(HANDLE_STORE).put(handle, HANDLE_KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

export function getLibraryPathLabel(): string {
  if (cachedPathLabel) return cachedPathLabel
  return localStorage.getItem(LIBRARY_PATH_KEY) ?? ''
}

export function setLibraryPathLabel(label: string): void {
  const trimmed = label.trim()
  if (trimmed) localStorage.setItem(LIBRARY_PATH_KEY, trimmed)
  else localStorage.removeItem(LIBRARY_PATH_KEY)
  cachedPathLabel = trimmed
}

export async function pickLibraryDirectory(): Promise<boolean> {
  if (!isFsAccessSupported()) return false
  try {
    const handle = await window.showDirectoryPicker!({ mode: 'readwrite' })
    cachedHandle = handle
    setLibraryPathLabel(handle.name)
    await persistHandle(handle)
    return true
  } catch {
    return false
  }
}

export async function ensureLibraryDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  if (cachedHandle) {
    try {
      const perm = await cachedHandle.queryPermission({ mode: 'readwrite' })
      if (perm === 'granted') return cachedHandle
      const req = await cachedHandle.requestPermission({ mode: 'readwrite' })
      if (req === 'granted') return cachedHandle
    } catch {
      cachedHandle = null
    }
  }

  const loaded = await loadPersistedHandle()
  if (loaded) {
    cachedHandle = loaded
    if (!cachedPathLabel) setLibraryPathLabel(loaded.name)
    return loaded
  }
  return null
}

async function readVueFromHandle(
  handle: FileSystemFileHandle,
  filename: string,
): Promise<StoredComponentFile | null> {
  try {
    const file = await handle.getFile()
    const code = await file.text()
    const meta = inferComponentMeta(code, filename)
    return {
      id: meta.id,
      name: meta.name,
      tag: meta.tag,
      filename: meta.filename,
      code,
      updatedAt: file.lastModified,
    }
  } catch {
    return null
  }
}

/** 扫描组件库目录下所有 .vue（不含子目录） */
export async function scanLibraryVueFiles(): Promise<StoredComponentFile[]> {
  const root = await ensureLibraryDirectoryHandle()
  if (!root) return []

  const files: StoredComponentFile[] = []
  for await (const [name, entry] of root.entries()) {
    if (entry.kind !== 'file') continue
    if (!name.toLowerCase().endsWith('.vue')) continue
    const parsed = await readVueFromHandle(entry as FileSystemFileHandle, name)
    if (parsed) files.push(parsed)
  }

  files.sort((a, b) => a.filename.localeCompare(b.filename))
  return files
}

export async function writeVueToLibrary(filename: string, content: string): Promise<boolean> {
  const root = await ensureLibraryDirectoryHandle()
  if (!root) return false
  try {
    const fileHandle = await root.getFileHandle(filename, { create: true })
    const writable = await fileHandle.createWritable()
    await writable.write(content)
    await writable.close()
    return true
  } catch (e) {
    console.error('[library] write failed:', e)
    return false
  }
}

export async function readVueFromLibrary(filename: string): Promise<string | null> {
  const root = await ensureLibraryDirectoryHandle()
  if (!root) return null
  try {
    const fileHandle = await root.getFileHandle(filename)
    const file = await fileHandle.getFile()
    return await file.text()
  } catch {
    return null
  }
}

export async function getLibraryDirectoryStatus(): Promise<LibraryDirectoryStatus> {
  const pathLabel = getLibraryPathLabel()
  const handle = await ensureLibraryDirectoryHandle()
  if (!handle) {
    return { pathLabel, hasWritableHandle: false, fileCount: 0 }
  }
  const files = await scanLibraryVueFiles()
  return { pathLabel: pathLabel || handle.name, hasWritableHandle: true, fileCount: files.length }
}

export function isLibraryFsAccessSupported(): boolean {
  return isFsAccessSupported()
}
