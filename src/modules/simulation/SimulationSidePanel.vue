<script setup lang="ts">
import { ref } from 'vue'
import type { InteractionRule, SimulationScenario } from './simulationTypes'
import SimulationDataPanel from './SimulationDataPanel.vue'
import InteractionLogicPanel from './InteractionLogicPanel.vue'

defineProps<{
  scenario: SimulationScenario
  tagOptions: { index: string; label: string }[]
}>()

const emit = defineEmits<{
  (e: 'update:inputs', val: Record<string, unknown>): void
  (e: 'update:outputs', val: Record<string, unknown>): void
  (e: 'clear-log'): void
  (e: 'add-rule'): void
  (e: 'remove-rule', id: string): void
  (e: 'update-rule', id: string, patch: Partial<InteractionRule>): void
}>()

const tab = ref<'data' | 'logic'>('logic')
</script>

<template>
  <div class="ssp">
    <div class="ssp__tabs">
      <button
        type="button"
        class="ssp__tab"
        :class="{ 'ssp__tab--active': tab === 'logic' }"
        @click="tab = 'logic'"
      >方法与绑定</button>
      <button
        type="button"
        class="ssp__tab"
        :class="{ 'ssp__tab--active': tab === 'data' }"
        @click="tab = 'data'"
      >模拟数据</button>
    </div>
    <div class="ssp__body">
      <SimulationDataPanel
        v-show="tab === 'data'"
        :scenario="scenario"
        @update:inputs="emit('update:inputs', $event)"
        @update:outputs="emit('update:outputs', $event)"
        @clear-log="emit('clear-log')"
      />
      <InteractionLogicPanel
        v-show="tab === 'logic'"
        :rules="scenario.rules"
        :tag-options="tagOptions"
        @add="emit('add-rule')"
        @remove="emit('remove-rule', $event)"
        @update-rule="(id, patch) => emit('update-rule', id, patch)"
      />
    </div>
  </div>
</template>

<style scoped>
.ssp {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.ssp__tabs {
  display: flex;
  gap: 4px;
  padding: 0 12px 8px;
  border-bottom: 1px solid var(--td-component-border);
}

.ssp__tab {
  flex: 1;
  padding: 6px 0;
  font-size: 12px;
  border: 1px solid transparent;
  border-radius: var(--td-radius-small);
  background: transparent;
  color: var(--td-text-color-secondary);
  cursor: pointer;
}

.ssp__tab--active {
  background: var(--td-brand-color-light);
  border-color: var(--td-brand-color);
  color: var(--td-brand-color);
  font-weight: 500;
}

.ssp__body {
  flex: 1;
  overflow: auto;
  padding: 12px;
  min-height: 0;
}
</style>
