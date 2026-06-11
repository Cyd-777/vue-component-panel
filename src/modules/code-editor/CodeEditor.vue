<script setup lang="ts">
/**
 * CodeEditor — 基于 Monaco Editor 的代码编辑器组件
 */
import { onMounted, onUnmounted, ref, watch } from 'vue'
import * as monaco from 'monaco-editor'
import { ensureMonacoEnvironment } from './monacoSetup'

const props = withDefaults(defineProps<{
  modelValue?: string
  language?: string
  readOnly?: boolean
  /** 1-based line number to highlight (whole line) */
  highlightLine?: number | null
}>(), {
  modelValue: '',
  language: 'html',
  readOnly: false,
  highlightLine: null,
})

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
  (e: 'change', val: string): void
}>()

const containerRef = ref<HTMLElement | null>(null)
let editor: monaco.editor.IStandaloneCodeEditor | null = null
let suppressChangeEvent = false
let highlightDecorationIds: string[] = []

function applyHighlightLine(line: number | null | undefined) {
  if (!editor) return
  if (line == null || line < 1) {
    highlightDecorationIds = editor.deltaDecorations(highlightDecorationIds, [])
    return
  }
  highlightDecorationIds = editor.deltaDecorations(highlightDecorationIds, [{
    range: new monaco.Range(line, 1, line, 1),
    options: {
      isWholeLine: true,
      className: 'code-editor-highlight-line',
    },
  }])
  editor.revealLineInCenter(line)
}

onMounted(() => {
  if (!containerRef.value) return

  ensureMonacoEnvironment()

  editor = monaco.editor.create(containerRef.value, {
    value: props.modelValue,
    language: props.language,
    theme: 'vs',
    fontSize: 12,
    lineNumbers: 'on',
    minimap: { enabled: false },
    automaticLayout: true,
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    readOnly: props.readOnly,
    tabSize: 2,
  })

  editor.onDidChangeModelContent(() => {
    if (suppressChangeEvent) return
    const val = editor?.getValue() ?? ''
    emit('update:modelValue', val)
    emit('change', val)
  })

  applyHighlightLine(props.highlightLine)
})

onUnmounted(() => {
  editor?.dispose()
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
  applyHighlightLine(props.highlightLine)
})

watch(() => props.readOnly, (readOnly) => {
  editor?.updateOptions({ readOnly })
})

watch(() => props.highlightLine, (line) => {
  applyHighlightLine(line)
})
</script>

<template>
  <div ref="containerRef" class="code-editor" />
</template>

<style scoped>
.code-editor {
  width: 100%;
  height: 100%;
  min-height: 200px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  overflow: hidden;
}
</style>

<style>
.monaco-editor .code-editor-highlight-line {
  background: rgba(64, 158, 255, 0.14);
}

.monaco-editor .margin-view-overlays .code-editor-highlight-line {
  background: rgba(64, 158, 255, 0.08);
}
</style>
