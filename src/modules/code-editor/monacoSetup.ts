import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

/** Monaco 0.55 d.ts 将 languages.typescript 标为 deprecated，运行时仍可用 */
interface MonacoTsLanguageService {
  setCompilerOptions(options: Record<string, unknown>): void
  setDiagnosticsOptions(options: Record<string, unknown>): void
  addExtraLib(content: string, filePath: string): void
}

interface MonacoTsLanguage {
  typescriptDefaults: MonacoTsLanguageService
  javascriptDefaults: MonacoTsLanguageService
  ScriptTarget: { ES2020: number }
  ModuleKind: { ESNext: number }
  ModuleResolutionKind: { NodeJs: number }
}

let environmentReady = false
let snippetIntelliSenseReady = false

const LOGIC_SNIPPET_EXTRA_LIB = `
declare module 'vue' {
  export function ref<T>(value: T): { value: T }
  export function reactive<T extends object>(target: T): T
  export function computed<T>(getter: () => T): { readonly value: T }
  export function watch<T>(source: T, cb: (value: T, oldValue: T) => void): void
  export function watchEffect(effect: () => void): void
  export function onMounted(hook: () => void): void
  export function onUnmounted(hook: () => void): void
  export function onBeforeMount(hook: () => void): void
  export function onBeforeUnmount(hook: () => void): void
  export function nextTick(fn?: () => void): Promise<void>
}

declare function defineProps<T extends Record<string, unknown>>(): T
declare function defineEmits<T extends Record<string, (...args: never[]) => void>>(): T
declare function emit(event: string, ...args: unknown[]): void
declare const console: Console
declare const setTimeout: typeof globalThis.setTimeout
declare const clearTimeout: typeof globalThis.clearTimeout
declare const setInterval: typeof globalThis.setInterval
declare const clearInterval: typeof globalThis.clearInterval
`

function getMonacoTsLanguage(): MonacoTsLanguage | null {
  const ts = (monaco.languages as unknown as { typescript?: MonacoTsLanguage }).typescript
  return ts ?? null
}

/** 注册 Monaco Worker（全局仅需一次） */
export function ensureMonacoEnvironment() {
  if (environmentReady) return
  self.MonacoEnvironment = {
    getWorker(_: string, label: string) {
      if (label === 'typescript' || label === 'javascript') return new tsWorker()
      return new editorWorker()
    },
  }
  environmentReady = true
}

/** 逻辑片段编辑：Vue / TS 基础补全 */
export function ensureLogicSnippetIntelliSense() {
  ensureMonacoEnvironment()
  if (snippetIntelliSenseReady) return

  const ts = getMonacoTsLanguage()
  if (!ts) return

  const defaults = [ts.typescriptDefaults, ts.javascriptDefaults]

  for (const d of defaults) {
    d.setCompilerOptions({
      target: ts.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      noEmit: true,
      esModuleInterop: true,
      allowJs: true,
    })
    d.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    })
    d.addExtraLib(LOGIC_SNIPPET_EXTRA_LIB, 'flow-logic-snippet.d.ts')
  }

  snippetIntelliSenseReady = true
}
