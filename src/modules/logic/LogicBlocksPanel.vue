<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import LogicBlockActionPicker from './LogicBlockActionPicker.vue'
import LogicBlockCard from './LogicBlockCard.vue'
import type { LogicBlockStub } from './logicTypes'
import type { LogicTokenContext } from './logicTokens'

defineProps<{
  blocks: LogicBlockStub[]
  tokenContext: LogicTokenContext
}>()

const emit = defineEmits<{
  (e: 'add-block', blockType: string): void
  (e: 'remove-block', id: string): void
  (e: 'update-block', id: string, patch: Partial<LogicBlockStub>): void
  (e: 'binding-drag-start', payload: { blockId: string; anchorX: number; anchorY: number }): void
  (e: 'unbind-block', id: string): void
}>()

const pickerOpen = ref(false)
const expandedId = ref<string | null>(null)

function toggleBlock(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function onAddBlock(type: string) {
  emit('add-block', type)
  pickerOpen.value = false
}

function closePicker() {
  pickerOpen.value = false
}

function onPickerKeyDown(e: KeyboardEvent) {
  if (e.key !== 'Escape' || !pickerOpen.value) return
  e.stopPropagation()
  closePicker()
}

onMounted(() => {
  document.addEventListener('keydown', onPickerKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onPickerKeyDown)
  pickerOpen.value = false
})

defineExpose({ closePicker })
</script>

<template>
  <div class="shortcuts">
    <div class="shortcuts__canvas">
      <div v-if="blocks.length === 0" class="shortcuts__empty">
        <p class="shortcuts__empty-title">还没有动作</p>
        <p class="shortcuts__empty-hint">点击下方按钮，添加事件、变量、方法等逻辑（不含生命周期）</p>
      </div>

      <div v-else class="shortcuts__stack">
        <LogicBlockCard
          v-for="(block, index) in blocks"
          :key="block.id"
          :block="block"
          :expanded="expandedId === block.id"
          :show-connector="index < blocks.length - 1"
          :token-context="tokenContext"
          @toggle="toggleBlock(block.id)"
          @remove="emit('remove-block', block.id)"
          @update="(patch) => emit('update-block', block.id, patch)"
          @binding-drag-start="(payload) => emit('binding-drag-start', payload)"
          @unbind="emit('unbind-block', block.id)"
        />
      </div>

      <button type="button" class="shortcuts__add" @click="pickerOpen = true">
        <span class="shortcuts__add-icon">+</span>
        添加动作
      </button>
    </div>

    <LogicBlockActionPicker
      :open="pickerOpen"
      @close="closePicker"
      @pick="onAddBlock"
    />
  </div>
</template>

<style scoped>
.shortcuts {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--td-bg-color-secondarycontainer);
  overflow: hidden;
}

.shortcuts__canvas {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.shortcuts__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  text-align: center;
}

.shortcuts__empty-title {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--td-text-color-secondary);
}

.shortcuts__empty-hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--td-text-color-placeholder);
  max-width: 240px;
}

.shortcuts__stack {
  display: flex;
  flex-direction: column;
}

.shortcuts__add {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 11px 14px;
  margin-top: 4px;
  border: none;
  border-radius: 12px;
  background: var(--td-bg-color-container);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.04);
  font-size: 14px;
  font-weight: 600;
  color: var(--td-brand-color);
  cursor: pointer;
  flex-shrink: 0;
}

.shortcuts__add:hover {
  background: var(--td-bg-color-container-hover, var(--td-bg-color-container));
}

.shortcuts__add-icon {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--td-brand-color);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  line-height: 1;
  font-weight: 400;
}
</style>
