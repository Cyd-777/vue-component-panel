<script setup lang="ts">
/**
 * CodeSnippetEditor — 紧凑型 Monaco，用于逻辑块 / 方法体等片段编辑（含 TS 补全）
 */
import { onMounted, onUnmounted, ref, watch } from 'vue'
import * as monaco from 'monaco-editor'
import 'monaco-editor/esm/vs/language/typescript/monaco.contribution.js'
import { ensureLogicSnippetIntelliSense, ensureMonacoEnvironment } from './monacoSetup'

const props = withDefaults(defineProps<{
  modelValue?: string
  minHeight?: number
  language?: 'typescript' | 'javascript'
  readOnly?: boolean
}>(), {
  modelValue: '',
  minHeight: 88,
  language: 'typescript',
  readOnly: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
  (e: 'change', val: string): void
}>()

const containerRef = ref<HTMLElement | null>(null)
let editor: monaco.editor.IStandaloneCodeEditor | null = null
let suppressChangeEvent = false

onMounted(() => {
  if (!containerRef.value) return

  ensureMonacoEnvironment()
  ensureLogicSnippetIntelliSense()

  editor = monaco.editor.create(containerRef.value, {
    value: props.modelValue,
    language: props.language,
    theme: 'vs',
    fontSize: 12,
    lineHeight: 18,
    lineNumbers: 'off',
    glyphMargin: false,
    folding: false,
    minimap: { enabled: false },
    automaticLayout: true,
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    readOnly: props.readOnly,
    tabSize: 2,
    insertSpaces: true,
    suggestOnTriggerCharacters: true,
    quickSuggestions: {
      other: true,
      comments: false,
      strings: false,
    },
    tabCompletion: 'on',
    wordBasedSuggestions: 'matchingDocuments',
    scrollbar: {
      vertical: 'auto',
      horizontal: 'hidden',
      verticalScrollbarSize: 8,
    },
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    renderLineHighlight: 'line',
    padding: { top: 6, bottom: 6 },
    fixedOverflowWidgets: true,
  })

  editor.onDidChangeModelContent(() => {
    if (suppressChangeEvent) return
    const val = editor?.getValue() ?? ''
    emit('update:modelValue', val)
    emit('change', val)
  })
})

onUnmounted(() => {
  editor?.dispose()
  editor = null
})

watch(() => props.modelValue, (val) => {
  if (!editor || val === editor.getValue()) return
  const pos = editor.getPosition()
  const scrollTop = editor.getScrollTop()
  suppressChangeEvent = true
  editor.setValue(val)
  suppressChangeEvent = false
  const model = editor.getModel()
  if (model && pos) {
    const line = Math.min(pos.lineNumber, model.getLineCount())
    const column = Math.min(pos.column, model.getLineMaxColumn(line))
    editor.setPosition({ lineNumber: line, column })
  }
  editor.setScrollTop(scrollTop)
})

watch(() => props.readOnly, (readOnly) => {
  editor?.updateOptions({ readOnly })
})
</script>

<template>
  <div
    ref="containerRef"
    class="code-snippet-editor"
    :style="{ minHeight: `${minHeight}px` }"
  />
</template>

<style scoped>
.code-snippet-editor {
  width: 100%;
  border: 1px solid var(--td-component-border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--td-bg-color-container);
}

.code-snippet-editor:focus-within {
  border-color: var(--td-brand-color-light);
  outline: none;
}
</style>
