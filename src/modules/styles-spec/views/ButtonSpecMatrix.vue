<script setup lang="ts">
import {
  BUTTON_SEMANTIC_LABELS,
  type ButtonSemanticTheme,
} from '../tokens/componentThemeBindingDefs'

export type ButtonMatrixRowId = 'default' | 'outline' | 'ghost' | 'dashed'

export interface ButtonMatrixSelection {
  semantic: ButtonSemanticTheme
  row: ButtonMatrixRowId
}

const props = defineProps<{
  selected?: ButtonMatrixSelection | null
}>()

const emit = defineEmits<{
  select: [selection: ButtonMatrixSelection]
}>()

const semantics = Object.keys(BUTTON_SEMANTIC_LABELS) as ButtonSemanticTheme[]

const variantRows: ButtonMatrixRowId[] = ['default', 'outline', 'ghost', 'dashed']

const themeMap: Record<ButtonSemanticTheme, 'primary' | 'success' | 'warning' | 'danger' | 'default'> = {
  default: 'primary',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  gray: 'default',
}

function isSelected(semantic: ButtonSemanticTheme, row: ButtonMatrixRowId) {
  return props.selected?.semantic === semantic && props.selected?.row === row
}

function onCell(semantic: ButtonSemanticTheme, row: ButtonMatrixRowId) {
  emit('select', { semantic, row })
}

function buttonVariant(row: ButtonMatrixRowId): 'outline' | 'text' | 'dashed' | undefined {
  if (row === 'outline') return 'outline'
  if (row === 'ghost') return 'text'
  if (row === 'dashed') return 'dashed'
  return undefined
}
</script>

<template>
  <div class="btn-matrix">
    <div v-for="row in variantRows" :key="row" class="btn-matrix__row">
      <div
        v-for="sem in semantics"
        :key="sem + row"
        class="btn-matrix__cell"
        :class="{ 'btn-matrix__cell--selected': isSelected(sem, row) }"
        @click="onCell(sem, row)"
      >
        <t-button
          size="small"
          :theme="themeMap[sem]"
          :variant="buttonVariant(row)"
        >
          {{ BUTTON_SEMANTIC_LABELS[sem] }}
        </t-button>
      </div>
    </div>

    <div class="btn-matrix__sizes">
      <t-button size="large" theme="primary">大</t-button>
      <t-button theme="primary">中</t-button>
      <t-button size="small" theme="primary">小</t-button>
    </div>
  </div>
</template>

<style scoped>
.btn-matrix {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-matrix__row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.btn-matrix__cell {
  padding: 4px;
  border-radius: var(--td-radius-small);
  cursor: pointer;
  transition: background 0.12s, box-shadow 0.12s;
}

.btn-matrix__cell:hover {
  background: var(--td-brand-color-light);
}

.btn-matrix__cell--selected {
  box-shadow: inset 0 0 0 2px var(--td-brand-color);
  background: var(--td-brand-color-light);
}

.btn-matrix__sizes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 4px;
}
</style>
