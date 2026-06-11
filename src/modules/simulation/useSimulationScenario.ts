import { ref, watch } from 'vue'
import {
  type InteractionRule,
  type SimulationScenario,
  DEFAULT_SIMULATION_SCENARIO,
  createRuleId,
} from './simulationTypes'

const STORAGE_KEY = 'flow-panel-simulation-scenario'

function loadScenario(): SimulationScenario {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(DEFAULT_SIMULATION_SCENARIO)
    return { ...structuredClone(DEFAULT_SIMULATION_SCENARIO), ...JSON.parse(raw) }
  } catch {
    return structuredClone(DEFAULT_SIMULATION_SCENARIO)
  }
}

const scenario = ref<SimulationScenario>(loadScenario())

watch(
  scenario,
  (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  },
  { deep: true },
)

export function useSimulationScenario() {
  function resetScenario() {
    scenario.value = structuredClone(DEFAULT_SIMULATION_SCENARIO)
  }

  function addRule(partial?: Partial<InteractionRule>) {
    scenario.value.rules.push({
      id: createRuleId(),
      name: '新规则',
      targetElIndex: '',
      trigger: 'click',
      action: 'appendOutputLog',
      payloadKey: 'message',
      payloadValue: '交互事件',
      ...partial,
    })
  }

  function removeRule(id: string) {
    scenario.value.rules = scenario.value.rules.filter((r) => r.id !== id)
  }

  function appendLog(line: string) {
    const ts = new Date().toLocaleTimeString()
    scenario.value.outputLog.unshift(`[${ts}] ${line}`)
    if (scenario.value.outputLog.length > 100) {
      scenario.value.outputLog.length = 100
    }
  }

  function setOutputKey(key: string, value: unknown) {
    scenario.value.outputs = { ...scenario.value.outputs, [key]: value }
  }

  function setInputKey(key: string, value: unknown) {
    scenario.value.inputs = { ...scenario.value.inputs, [key]: value }
  }

  function clearOutputLog() {
    scenario.value.outputLog = []
  }

  return {
    scenario,
    resetScenario,
    addRule,
    removeRule,
    appendLog,
    setOutputKey,
    setInputKey,
    clearOutputLog,
  }
}
