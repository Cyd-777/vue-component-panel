<script setup lang="ts">
import { computed } from 'vue'
import {
  FLOW_INTERACTION_STATES,
  type FlowInteractionStateId,
} from './interactionStateSpec'
import { interactionStateHasOverrides } from './pseudoClassStyle'

const props = defineProps<{
  modelValue: FlowInteractionStateId
  code: string
  selectedId: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: FlowInteractionStateId): void
}>()

const tagIndex = computed(() => {
  if (!props.selectedId) return null
  const n = parseInt(props.selectedId.replace('el-', ''), 10)
  return Number.isNaN(n) ? null : n
})

function hasOverrides(state: FlowInteractionStateId): boolean {
  if (state === 'default' || tagIndex.value == null) return false
  return interactionStateHasOverrides(props.code, tagIndex.value, state)
}

function select(state: FlowInteractionStateId) {
  emit('update:modelValue', state)
}
</script>

<template>
  <nav class="isr" aria-label="交互态">
    <button
      v-for="s in FLOW_INTERACTION_STATES"
      :key="s.id"
      type="button"
      class="isr__btn"
      :class="{
        'isr__btn--active': modelValue === s.id,
        'isr__btn--configured': hasOverrides(s.id),
      }"
      :title="s.hint"
      :aria-pressed="modelValue === s.id"
      @click="select(s.id)"
    >
      {{ s.label }}
    </button>
  </nav>
</template>

<style scoped>
.isr {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  pointer-events: auto;
}

.isr__btn {
  position: relative;
  padding: 4px 8px;
  border: 1px solid var(--td-component-border, #e7e7e7);
  border-radius: 6px;
  background: var(--td-bg-color-container, #fff);
  color: var(--td-text-color-secondary, #666);
  font-size: 11px;
  font-weight: 500;
  line-height: 1.2;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s, color 0.12s;
}

.isr__btn:hover {
  border-color: var(--td-brand-color, #0052d9);
  color: var(--td-brand-color, #0052d9);
}

.isr__btn--active {
  border-color: var(--td-brand-color, #0052d9);
  color: var(--td-brand-color, #0052d9);
  background: color-mix(in srgb, var(--td-brand-color, #0052d9) 8%, var(--td-bg-color-container, #fff));
}

.isr__btn--configured:not(.isr__btn--active)::after {
  content: '';
  position: absolute;
  right: 4px;
  top: 3px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--td-brand-color, #0052d9);
}
</style>
