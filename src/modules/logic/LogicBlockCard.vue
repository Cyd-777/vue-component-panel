<script setup lang="ts">
import { computed } from 'vue'
import {
  getLogicBlockCatalogEntry,
  getLogicBlockCategoryLabel,
  getLogicBlockDescription,
  getLogicBlockLabel,
  getLogicBlockLabelEn,
  LOGIC_BLOCK_CATEGORY_ACCENT,
  LOGIC_BLOCK_CATEGORY_ICON,
  type LogicBlockCategory,
} from './logicBlockCatalog'
import type { LogicBlockStub } from './logicTypes'
import type { LogicTokenContext } from './logicTokens'
import LogicInteractiveEditor from './LogicInteractiveEditor.vue'

const props = defineProps<{
  block: LogicBlockStub
  expanded: boolean
  showConnector: boolean
  tokenContext: LogicTokenContext
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'remove'): void
  (e: 'update', patch: Partial<LogicBlockStub>): void
  (e: 'binding-drag-start', payload: { blockId: string; anchorX: number; anchorY: number }): void
  (e: 'unbind'): void
}>()

const entry = computed(() => getLogicBlockCatalogEntry(props.block.type))
const accent = computed(() => LOGIC_BLOCK_CATEGORY_ACCENT[props.block.category as LogicBlockCategory] ?? '#8E8E93')
const icon = computed(() => LOGIC_BLOCK_CATEGORY_ICON[props.block.category as LogicBlockCategory] ?? '▢')

const bindingHint = computed(() => {
  if (!entry.value?.requiresBinding) return null
  if (props.block.boundElIndex != null) {
    const ev = props.block.templateEvent ? `@${props.block.templateEvent}` : ''
    return `已绑定 #${props.block.boundElIndex}${ev ? ` · ${ev}` : ''}`
  }
  return props.block.templateEvent
    ? `拖动圆点绑定 · @${props.block.templateEvent}`
    : '拖动圆点绑定画布元素'
})

function onAnchorPointerDown(e: PointerEvent) {
  if (!entry.value?.requiresBinding) return
  e.preventDefault()
  e.stopPropagation()
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  emit('binding-drag-start', {
    blockId: props.block.id,
    anchorX: rect.left + rect.width / 2,
    anchorY: rect.top + rect.height / 2,
  })
}
</script>

<template>
  <div class="lbc-wrap">
    <div
      class="lbc"
      :class="{ 'lbc--expanded': expanded }"
      :style="{ '--lbc-accent': accent }"
    >
      <button type="button" class="lbc__head" @click="emit('toggle')">
        <span class="lbc__icon" aria-hidden="true">{{ icon }}</span>
        <span class="lbc__text">
          <span class="lbc__title">{{ getLogicBlockLabel(block.type) }}</span>
          <span class="lbc__meta">
            <template v-if="block.templateEvent">@{{ block.templateEvent }}</template>
            <template v-else>{{ getLogicBlockLabelEn(block.type) }}</template>
            <span v-if="block.name" class="lbc__meta-sep">·</span>
            <span v-if="block.name" class="lbc__meta-name">{{ block.name }}</span>
          </span>
        </span>
        <span class="lbc__chev" :class="{ 'lbc__chev--open': expanded }">›</span>
      </button>

      <div v-if="expanded" class="lbc__body" @click.stop>
        <p v-if="getLogicBlockDescription(block.type)" class="lbc__desc">
          {{ getLogicBlockDescription(block.type) }}
        </p>

        <div v-if="bindingHint" class="lbc__bind" :class="{ 'lbc__bind--done': block.boundElIndex != null }">
          <span
            class="lbc__bind-dot"
            :class="{ 'lbc__bind-dot--draggable': block.boundElIndex == null }"
            title="拖动到画布元素"
            @pointerdown="onAnchorPointerDown"
          />
          <span class="lbc__bind-text">{{ bindingHint }}</span>
          <button
            v-if="block.boundElIndex != null"
            type="button"
            class="lbc__unbind"
            title="解除绑定"
            @click.stop="emit('unbind')"
          >×</button>
        </div>

        <label class="lbc__field">
          <span class="lbc__field-label">名称</span>
          <input
            class="lbc__input"
            :value="block.name"
            placeholder="如 onClick"
            @input="emit('update', { name: ($event.target as HTMLInputElement).value })"
          />
        </label>

        <label class="lbc__field">
          <span class="lbc__field-label">代码片段</span>
          <LogicInteractiveEditor
            :model-value="block.body"
            :token-context="tokenContext"
            :min-height="88"
            placeholder="右键插入变量、方法…"
            @update:model-value="emit('update', { body: $event })"
          />
        </label>

        <div class="lbc__foot">
          <span class="lbc__cat">{{ getLogicBlockCategoryLabel(block.category as LogicBlockCategory) }}</span>
          <button type="button" class="lbc__remove" @click.stop="emit('remove')">删除动作</button>
        </div>
      </div>
    </div>
    <div v-if="showConnector" class="lbc-connector" aria-hidden="true" />
  </div>
</template>

<style scoped>
.lbc-wrap {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.lbc {
  border-radius: 12px;
  background: var(--td-bg-color-container);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.lbc--expanded {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06), 0 0 0 1px var(--lbc-accent);
}

.lbc__head {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px 10px 0;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  border-left: 4px solid var(--lbc-accent);
}

.lbc__head:hover {
  background: var(--td-bg-color-container-hover, rgba(0, 0, 0, 0.02));
}

.lbc__icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  margin-left: 10px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  background: color-mix(in srgb, var(--lbc-accent) 14%, transparent);
  color: var(--lbc-accent);
}

.lbc__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.lbc__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--td-text-color-primary);
  line-height: 1.3;
}

.lbc__meta {
  font-size: 11px;
  color: var(--td-text-color-placeholder);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lbc__meta-name {
  font-family: inherit;
}

.lbc__meta-sep {
  margin: 0 4px;
  opacity: 0.5;
}

.lbc__chev {
  flex-shrink: 0;
  font-size: 18px;
  line-height: 1;
  color: var(--td-text-color-placeholder);
  transform: rotate(0deg);
  transition: transform 0.15s ease;
}

.lbc__chev--open {
  transform: rotate(90deg);
}

.lbc__body {
  padding: 0 12px 12px 14px;
  border-top: 1px solid var(--td-component-border);
  background: var(--td-bg-color-secondarycontainer);
}

.lbc__desc {
  margin: 10px 0 0;
  font-size: 11px;
  line-height: 1.45;
  color: var(--td-text-color-secondary);
}

.lbc__bind {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 6px 8px;
  font-size: 11px;
  border-radius: 8px;
  background: var(--td-bg-color-container);
  color: var(--td-text-color-secondary);
  border: 1px dashed var(--td-component-border);
}

.lbc__bind--done {
  border-style: solid;
  border-color: color-mix(in srgb, var(--lbc-accent) 35%, var(--td-component-border));
}

.lbc__bind-text {
  flex: 1;
  min-width: 0;
}

.lbc__bind-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--lbc-accent);
  flex-shrink: 0;
}

.lbc__bind-dot--draggable {
  cursor: grab;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--lbc-accent) 20%, transparent);
}

.lbc__bind-dot--draggable:active {
  cursor: grabbing;
}

.lbc__unbind {
  border: none;
  background: transparent;
  color: var(--td-text-color-placeholder);
  font-size: 14px;
  line-height: 1;
  padding: 0 2px;
  cursor: pointer;
}

.lbc__unbind:hover {
  color: var(--td-error-color);
}

.lbc__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 10px;
}

.lbc__field-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--td-text-color-placeholder);
}

.lbc__input {
  width: 100%;
  box-sizing: border-box;
  font-size: 12px;
  padding: 7px 9px;
  border: 1px solid var(--td-component-border);
  border-radius: 8px;
  background: var(--td-bg-color-container);
  color: var(--td-text-color-primary);
}

.lbc__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  gap: 8px;
}

.lbc__cat {
  font-size: 10px;
  color: var(--td-text-color-placeholder);
}

.lbc__remove {
  border: none;
  background: transparent;
  font-size: 11px;
  color: var(--td-error-color);
  cursor: pointer;
  padding: 4px 0;
}

.lbc-connector {
  align-self: center;
  width: 2px;
  height: 10px;
  background: var(--td-component-border);
  border-radius: 1px;
}
</style>
