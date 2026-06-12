<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    title: string
    index?: number
    active?: boolean
    editable?: boolean
  }>(),
  { editable: true },
)

defineEmits<{
  edit: []
}>()

const indexLabel = computed(() => {
  const n = props.index
  if (n == null) return ''
  return String(n).padStart(2, '0')
})
</script>

<template>
  <header class="spec-header" :class="{ 'spec-header--active': active }">
    <h2 class="spec-header__title">
      <span v-if="indexLabel" class="spec-header__index">{{ indexLabel }}</span>
      {{ title }}
    </h2>
    <button
      v-if="editable"
      type="button"
      class="spec-header__edit"
      @click="$emit('edit')"
    >
      编辑 »
    </button>
  </header>
</template>

<style scoped>
.spec-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--td-component-border);
}

.spec-header--active {
  border-bottom-color: var(--td-brand-color);
}

.spec-header__title {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.spec-header__index {
  flex-shrink: 0;
  min-width: 28px;
  font-size: 13px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--td-text-color-placeholder);
}

.spec-header__edit {
  flex-shrink: 0;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  color: var(--td-brand-color);
  border: 1px solid var(--td-brand-color-light);
  border-radius: var(--td-radius-small);
  background: var(--td-brand-color-light);
  cursor: pointer;
}

.spec-header__edit:hover {
  background: var(--td-brand-color);
  color: #fff;
  border-color: var(--td-brand-color);
}
</style>
