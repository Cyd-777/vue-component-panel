<script setup lang="ts">
import { ref, watch } from 'vue'
import type { SimulationScenario } from './simulationTypes'

const props = defineProps<{
  scenario: SimulationScenario
}>()

const emit = defineEmits<{
  (e: 'update:inputs', val: Record<string, unknown>): void
  (e: 'update:outputs', val: Record<string, unknown>): void
  (e: 'clear-log'): void
}>()

const inputsText = ref('')
const outputsText = ref('')
const inputsError = ref('')
const outputsError = ref('')

function syncFromScenario() {
  inputsText.value = JSON.stringify(props.scenario.inputs, null, 2)
  outputsText.value = JSON.stringify(props.scenario.outputs, null, 2)
  inputsError.value = ''
  outputsError.value = ''
}

watch(() => props.scenario.inputs, syncFromScenario, { immediate: true, deep: true })
watch(() => props.scenario.outputs, () => {
  outputsText.value = JSON.stringify(props.scenario.outputs, null, 2)
}, { deep: true })

function commitInputs() {
  try {
    const parsed = JSON.parse(inputsText.value || '{}') as Record<string, unknown>
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      inputsError.value = '请输入 JSON 对象'
      return
    }
    inputsError.value = ''
    emit('update:inputs', parsed)
  } catch {
    inputsError.value = 'JSON 格式无效'
  }
}

function commitOutputs() {
  try {
    const parsed = JSON.parse(outputsText.value || '{}') as Record<string, unknown>
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      outputsError.value = '请输入 JSON 对象'
      return
    }
    outputsError.value = ''
    emit('update:outputs', parsed)
  } catch {
    outputsError.value = 'JSON 格式无效'
  }
}
</script>

<template>
  <div class="sdp">
    <div class="sdp__section">
      <div class="sdp__head">
        <span class="sdp__title">模拟输入</span>
        <button type="button" class="sdp__btn" @click="commitInputs">应用</button>
      </div>
      <textarea
        v-model="inputsText"
        class="sdp__json"
        spellcheck="false"
        @blur="commitInputs"
      />
      <p v-if="inputsError" class="sdp__error">{{ inputsError }}</p>
      <p class="sdp__hint">组件实例可读取的 mock 数据（后续绑定 props / provide）</p>
    </div>

    <div class="sdp__section">
      <div class="sdp__head">
        <span class="sdp__title">交互输出</span>
        <button type="button" class="sdp__btn" @click="commitOutputs">应用</button>
      </div>
      <textarea
        v-model="outputsText"
        class="sdp__json"
        spellcheck="false"
        @blur="commitOutputs"
      />
      <p v-if="outputsError" class="sdp__error">{{ outputsError }}</p>
    </div>

    <div class="sdp__section">
      <div class="sdp__head">
        <span class="sdp__title">事件流水</span>
        <button type="button" class="sdp__btn sdp__btn--ghost" @click="emit('clear-log')">清空</button>
      </div>
      <div v-if="scenario.outputLog.length === 0" class="sdp__empty">在交互逻辑模式下点击组件，按规则写入流水</div>
      <ul v-else class="sdp__log">
        <li v-for="(line, i) in scenario.outputLog" :key="i">{{ line }}</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.sdp {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sdp__section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sdp__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.sdp__title {
  font-size: 11px;
  font-weight: 600;
  color: var(--td-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.sdp__btn {
  padding: 2px 8px;
  font-size: 11px;
  border: 1px solid var(--td-brand-color);
  border-radius: var(--td-radius-small);
  background: var(--td-brand-color-light);
  color: var(--td-brand-color);
  cursor: pointer;
}

.sdp__btn--ghost {
  border-color: var(--td-component-border);
  background: transparent;
  color: var(--td-text-color-secondary);
}

.sdp__json {
  width: 100%;
  min-height: 88px;
  padding: 8px;
  font-size: 11px;
  font-family: ui-monospace, monospace;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  resize: vertical;
  box-sizing: border-box;
  background: var(--td-bg-color-container);
}

.sdp__json:focus {
  outline: none;
  border-color: var(--td-brand-color);
}

.sdp__error {
  margin: 0;
  font-size: 11px;
  color: var(--td-error-color);
}

.sdp__hint {
  margin: 0;
  font-size: 10px;
  color: var(--td-text-color-placeholder);
}

.sdp__empty {
  font-size: 12px;
  color: var(--td-text-color-placeholder);
  padding: 8px 0;
}

.sdp__log {
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 160px;
  overflow: auto;
  font-size: 11px;
  font-family: ui-monospace, monospace;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-secondarycontainer);
}

.sdp__log li {
  padding: 4px 8px;
  border-bottom: 1px solid var(--td-component-border);
}

.sdp__log li:last-child {
  border-bottom: none;
}
</style>
