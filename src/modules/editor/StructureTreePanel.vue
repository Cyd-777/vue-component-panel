<script setup lang="ts">
import { computed } from 'vue'
import StructureTreeRows from './StructureTreeRows.vue'
import { buildTagTree } from './tagTree'

const props = defineProps<{
  code: string
  selectedId: string | null
  selectedIds?: Set<string>
}>()

const emit = defineEmits<{
  (e: 'select', index: string, shift?: boolean): void
}>()

const roots = computed(() => buildTagTree(props.code))
</script>

<template>
  <div class="stp">
    <p v-if="roots.length === 0" class="stp__empty">暂无元素</p>
    <StructureTreeRows
      v-else
      :nodes="roots"
      :depth="0"
      :selected-id="selectedId"
      :selected-ids="selectedIds"
      @select="(index, shift) => emit('select', index, shift)"
    />
  </div>
</template>

<style scoped>
.stp {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.stp__empty {
  margin: 0;
  font-size: 12px;
  color: var(--td-text-color-placeholder);
}
</style>
