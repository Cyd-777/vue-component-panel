/**
 * 浏览器内组件文件库（localStorage）与画板编辑会话
 */

export interface StoredComponentFile {
  id: string
  name: string
  tag: string
  filename: string
  code: string
  updatedAt: number
}

export interface EditorSession {
  currentFileId: string | null
  filename: string
  draftCode: string
}

const FILES_KEY = 'flow-component-files'
const SESSION_KEY = 'flow-editor-session'

export function loadComponentFiles(): StoredComponentFile[] {
  try {
    const raw = localStorage.getItem(FILES_KEY)
    if (raw) return JSON.parse(raw) as StoredComponentFile[]
  } catch { /* ignore */ }
  return []
}

export function saveComponentFiles(files: StoredComponentFile[]): void {
  localStorage.setItem(FILES_KEY, JSON.stringify(files))
}

export function upsertComponentFile(file: StoredComponentFile): void {
  const list = loadComponentFiles()
  const i = list.findIndex((f) => f.id === file.id)
  if (i >= 0) list[i] = file
  else list.push(file)
  saveComponentFiles(list)
}

export function getComponentFile(id: string): StoredComponentFile | undefined {
  return loadComponentFiles().find((f) => f.id === id)
}

export function deleteComponentFile(id: string): void {
  saveComponentFiles(loadComponentFiles().filter((f) => f.id !== id))
}

export function loadEditorSession(): EditorSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (raw) return JSON.parse(raw) as EditorSession
  } catch { /* ignore */ }
  return null
}

export function saveEditorSession(session: EditorSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}
