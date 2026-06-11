<script setup lang="ts">
import type { TagTreeNode } from './tagTree'

defineProps<{
  nodes: TagTreeNode[]
  depth: number
  selectedId: string | null
  selectedIds?: Set<string>
}>()

const emit = defineEmits<{
  (e: 'select', index: string, shift?: boolean): void
}>()

function isSelected(index: number, selectedId: string | null, selectedIds?: Set<string>): boolean {
  const id = `el-${index}`
  if (selectedIds?.size) return selectedIds.has(id)
  return selectedId === id
}
</script>

<template>
  <div class="str">
    <template v-for="node in nodes" :key="node.index">
      <button
        type="button"
        class="str__row"
        :class="{ 'str__row--selected': isSelected(node.index, selectedId, selectedIds) }"
        :style="{ paddingLeft: `${12 + depth * 14}px` }"
        @click="emit('select', String(node.index), ($event as MouseEvent).shiftKey)"
      >
        <span class="str__tag">{{ node.tagName }}</span>
        <span class="str__label">{{ node.label }}</span>
      </button>
      <StructureTreeRows
        v-if="node.children.length"
        :nodes="node.children"
        :depth="depth + 1"
        :selected-id="selectedId"
        :selected-ids="selectedIds"
        @select="(index, shift) => emit('select', index, shift)"
      />
    </template>
  </div>
</template>

<style scoped>
.str {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.str__row {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 6px 10px;
  border: none;
  border-radius: var(--td-radius-small);
  background: transparent;
  text-align: left;
  cursor: pointer;
  font-size: 12px;
  color: var(--td-text-color-primary);
}

.str__row:hover {
  background: var(--td-bg-color-container-hover);
}

.str__row--selected {
  background: var(--td-brand-color-light);
  color: var(--td-brand-color);
}

.str__tag {
  flex-shrink: 0;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  font-weight: 600;
  color: var(--td-text-color-secondary);
}

.str__row--selected .str__tag {
  color: var(--td-brand-color);
}

.str__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
