import { ref } from 'vue'
import {
  getLibraryPathLabel,
  pickLibraryDirectory,
  scanLibraryVueFiles,
  getLibraryDirectoryStatus,
  type LibraryDirectoryStatus,
} from './libraryDirectory'
import type { StoredComponentFile } from '../editor/componentFileStore'
import { loadComponentFiles } from '../editor/componentFileStore'

export const libraryComponents = ref<StoredComponentFile[]>([])
export const libraryStatus = ref<LibraryDirectoryStatus>({
  pathLabel: getLibraryPathLabel(),
  hasWritableHandle: false,
  fileCount: 0,
})
export const libraryScanning = ref(false)

/** 从组件库目录扫描；无目录句柄时回退 localStorage */
export async function refreshLibraryComponents(): Promise<StoredComponentFile[]> {
  libraryScanning.value = true
  try {
    libraryStatus.value = await getLibraryDirectoryStatus()
    if (libraryStatus.value.hasWritableHandle) {
      libraryComponents.value = await scanLibraryVueFiles()
    } else {
      libraryComponents.value = loadComponentFiles()
    }
    return libraryComponents.value
  } finally {
    libraryScanning.value = false
  }
}

export async function reconnectLibraryDirectory(): Promise<boolean> {
  const ok = await pickLibraryDirectory()
  if (ok) await refreshLibraryComponents()
  return ok
}
