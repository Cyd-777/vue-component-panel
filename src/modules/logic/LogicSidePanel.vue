<script setup lang="ts">
import { computed, ref } from 'vue'
import type {
  ComponentLogicModel,
  LogicEmitDef,
  LogicMethodDef,
  LogicPropDef,
  LogicVariableDef,
} from './logicTypes'
import type { SimulationScenario } from '../simulation/simulationTypes'
import LogicApiPanel from './LogicApiPanel.vue'
import LogicVariablesPanel from './LogicVariablesPanel.vue'
import LogicMethodsPanel from './LogicMethodsPanel.vue'
import SimulationDataPanel from '../simulation/SimulationDataPanel.vue'
import { buildLogicTokenContext } from './scriptCodegen'

const props = defineProps<{
  logic: ComponentLogicModel
  scenario: SimulationScenario
}>()

const tokenContext = computed(() => buildLogicTokenContext(props.logic))

const emit = defineEmits<{
  (e: 'add-prop'): void
  (e: 'remove-prop', id: string): void
  (e: 'update-prop', id: string, patch: Partial<LogicPropDef>): void
  (e: 'add-emit'): void
  (e: 'remove-emit', id: string): void
  (e: 'update-emit', id: string, patch: Partial<LogicEmitDef>): void
  (e: 'add-variable'): void
  (e: 'remove-variable', id: string): void
  (e: 'update-variable', id: string, patch: Partial<LogicVariableDef>): void
  (e: 'add-method'): void
  (e: 'remove-method', id: string): void
  (e: 'update-method', id: string, patch: Partial<LogicMethodDef>): void
  (e: 'update:inputs', val: Record<string, unknown>): void
  (e: 'update:outputs', val: Record<string, unknown>): void
  (e: 'clear-log'): void
}>()

const tab = ref<'api' | 'vars' | 'methods' | 'mock'>('api')
</script>

<template>
  <div class="lsp">
    <div class="lsp__tabs">
      <button
        type="button"
        class="lsp__tab"
        :class="{ 'lsp__tab--active': tab === 'api' }"
        @click="tab = 'api'"
      >API</button>
      <button
        type="button"
        class="lsp__tab"
        :class="{ 'lsp__tab--active': tab === 'vars' }"
        @click="tab = 'vars'"
      >变量</button>
      <button
        type="button"
        class="lsp__tab"
        :class="{ 'lsp__tab--active': tab === 'methods' }"
        @click="tab = 'methods'"
      >方法</button>
      <button
        type="button"
        class="lsp__tab"
        :class="{ 'lsp__tab--active': tab === 'mock' }"
        @click="tab = 'mock'"
      >模拟</button>
    </div>
    <div class="lsp__body">
      <LogicApiPanel
        v-show="tab === 'api'"
        :props="logic.props"
        :emits="logic.emits"
        @add-prop="emit('add-prop')"
        @remove-prop="(id) => emit('remove-prop', id)"
        @update-prop="(id, patch) => emit('update-prop', id, patch)"
        @add-emit="emit('add-emit')"
        @remove-emit="(id) => emit('remove-emit', id)"
        @update-emit="(id, patch) => emit('update-emit', id, patch)"
      />
      <LogicVariablesPanel
        v-show="tab === 'vars'"
        :variables="logic.variables"
        @add="emit('add-variable')"
        @remove="(id) => emit('remove-variable', id)"
        @update="(id, patch) => emit('update-variable', id, patch)"
      />
      <LogicMethodsPanel
        v-show="tab === 'methods'"
        :methods="logic.methods"
        :token-context="tokenContext"
        @add="emit('add-method')"
        @remove="(id) => emit('remove-method', id)"
        @update="(id, patch) => emit('update-method', id, patch)"
      />
      <SimulationDataPanel
        v-show="tab === 'mock'"
        :scenario="scenario"
        @update:inputs="emit('update:inputs', $event)"
        @update:outputs="emit('update:outputs', $event)"
        @clear-log="emit('clear-log')"
      />
    </div>
    <div class="lsp__footer">
      元素绑定与锚点连线 · 后续开放
    </div>
  </div>
</template>

<style scoped>
.lsp {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.lsp__tabs {
  display: flex;
  gap: 2px;
  padding: 8px 8px 0;
  border-bottom: 1px solid var(--td-component-border);
  flex-shrink: 0;
}

.lsp__tab {
  flex: 1;
  padding: 6px 4px;
  font-size: 11px;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--td-text-color-secondary);
  cursor: pointer;
}

.lsp__tab--active {
  color: var(--td-brand-color);
  border-bottom-color: var(--td-brand-color);
  font-weight: 500;
}

.lsp__body {
  flex: 1;
  overflow: auto;
  padding: 12px;
  min-height: 0;
}

.lsp__footer {
  flex-shrink: 0;
  padding: 6px 12px;
  font-size: 10px;
  text-align: center;
  color: var(--td-text-color-placeholder);
  border-top: 1px solid var(--td-component-border);
  background: var(--td-bg-color-secondarycontainer);
}
</style>
