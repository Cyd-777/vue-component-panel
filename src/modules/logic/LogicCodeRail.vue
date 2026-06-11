<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import CodeEditor from '../code-editor/CodeEditor.vue'
import {
  collectComponentTags,
  defaultImportPath,
  extractTemplateInner,
} from '../editor/componentFile'
import LogicBlocksPanel from './LogicBlocksPanel.vue'
import LogicLifecyclePanel from './LogicLifecyclePanel.vue'
import { buildLogicTokenContext, mergeSfcWithLogic } from './scriptCodegen'
import type { ComponentLogicModel, LogicBlockStub, LogicLifecycleBlock, VueLifecycleHook } from './logicTypes'

const props = defineProps<{
  modelValue: string
  compileError: string | null
  logic: ComponentLogicModel
  /** 组件库文件，用于 import 路径解析 */
  libraryFiles?: { tag: string; filename: string }[]
}>()

const emit = defineEmits<{
  (e: 'change', val: string): void
  (e: 'add-block', blockType: string): void
  (e: 'remove-block', id: string): void
  (e: 'update-block', id: string, patch: Partial<LogicBlockStub>): void
  (e: 'add-lifecycle', hook: VueLifecycleHook): void
  (e: 'remove-lifecycle', id: string): void
  (e: 'update-lifecycle', id: string, patch: Partial<LogicLifecycleBlock>): void
  (e: 'binding-drag-start', payload: { blockId: string; anchorX: number; anchorY: number }): void
  (e: 'unbind-block', id: string): void
}>()

/** 默认：逻辑块 */
const tab = ref<'blocks' | 'lifecycle' | 'source'>('blocks')
const blocksPanelRef = ref<InstanceType<typeof LogicBlocksPanel> | null>(null)

const tokenContext = computed(() => buildLogicTokenContext(props.logic))

const mergedSource = computed(() => {
  const importMap: Record<string, string> = { LayoutContainer: './LayoutContainer.vue' }
  for (const f of props.libraryFiles ?? []) {
    importMap[f.tag] = `./${f.filename}`
  }
  const inner = extractTemplateInner(props.modelValue) ?? ''
  const componentImports = collectComponentTags(inner).map((tag) => ({
    tag,
    path: defaultImportPath(tag, importMap),
  }))
  return mergeSfcWithLogic(props.modelValue, props.logic, componentImports)
})

const hasGeneratedLogic = computed(() =>
  props.logic.blocks.length > 0
  || props.logic.lifecycles.length > 0
  || props.logic.variables.length > 0
  || props.logic.methods.length > 0
  || props.logic.props.length > 0
  || props.logic.emits.length > 0,
)

watch(tab, (val) => {
  if (val !== 'blocks') blocksPanelRef.value?.closePicker()
})
</script>

<template>
  <div class="lcr">
    <div class="lcr__tabs">
      <button
        type="button"
        class="lcr__tab"
        :class="{ 'lcr__tab--active': tab === 'blocks' }"
        @click="tab = 'blocks'"
      >逻辑块</button>
      <button
        type="button"
        class="lcr__tab"
        :class="{ 'lcr__tab--active': tab === 'lifecycle' }"
        @click="tab = 'lifecycle'"
      >生命周期</button>
      <button
        type="button"
        class="lcr__tab"
        :class="{ 'lcr__tab--active': tab === 'source' }"
        @click="tab = 'source'"
      >源码</button>
    </div>

    <div v-if="compileError && tab === 'source'" class="lcr__error">
      编译未通过，画布仍显示上一次有效预览：{{ compileError }}
    </div>

    <div v-if="tab === 'source' && hasGeneratedLogic" class="lcr__gen-hint">
      script 由逻辑模型自动生成 · template 来自样式模式画布
    </div>

    <div class="lcr__body">
      <LogicBlocksPanel
        v-if="tab === 'blocks'"
        ref="blocksPanelRef"
        :blocks="logic.blocks"
        :token-context="tokenContext"
        @add-block="(type) => emit('add-block', type)"
        @remove-block="(id) => emit('remove-block', id)"
        @update-block="(id, patch) => emit('update-block', id, patch)"
        @binding-drag-start="(payload) => emit('binding-drag-start', payload)"
        @unbind-block="(id) => emit('unbind-block', id)"
      />
      <LogicLifecyclePanel
        v-show="tab === 'lifecycle'"
        :lifecycles="logic.lifecycles"
        :token-context="tokenContext"
        @add-lifecycle="(hook) => emit('add-lifecycle', hook)"
        @remove-lifecycle="(id) => emit('remove-lifecycle', id)"
        @update-lifecycle="(id, patch) => emit('update-lifecycle', id, patch)"
      />
      <CodeEditor
        v-show="tab === 'source'"
        :model-value="hasGeneratedLogic ? mergedSource : modelValue"
        language="html"
        :read-only="hasGeneratedLogic"
        @change="!hasGeneratedLogic && emit('change', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.lcr {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.lcr__tabs {
  display: flex;
  gap: 0;
  padding: 0 8px;
  border-bottom: 1px solid var(--td-component-border);
  flex-shrink: 0;
}

.lcr__tab {
  flex: 1;
  padding: 8px 6px;
  font-size: 11px;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--td-text-color-secondary);
  cursor: pointer;
  white-space: nowrap;
}

.lcr__tab--active {
  color: var(--td-brand-color);
  border-bottom-color: var(--td-brand-color);
  font-weight: 500;
}

.lcr__error {
  padding: 6px 12px;
  font-size: 11px;
  line-height: 1.4;
  color: var(--td-error-color);
  background: var(--td-error-color-1);
  border-bottom: 1px solid var(--td-error-color-3);
  flex-shrink: 0;
}

.lcr__gen-hint {
  padding: 6px 12px;
  font-size: 10px;
  line-height: 1.4;
  color: var(--td-text-color-secondary);
  background: var(--td-bg-color-secondarycontainer);
  border-bottom: 1px solid var(--td-component-border);
  flex-shrink: 0;
}

.lcr__body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.lcr__body :deep(.monaco-editor) {
  min-height: 0;
}
</style>
