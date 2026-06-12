import { reactive, watch } from 'vue'
import { readEffectConfigFromPreset } from './effectConfig'
import {
  DEFAULT_USAGE_RULES_CONSTRAINTS,
  type UsageRulesConstraints,
} from './usageRulesDefs'
import { getStylePresetById } from './stylePresetStore'
import {
  THEME_MOTION_INTERACTION_SLOTS,
  THEME_MOTION_LIFECYCLE_SLOTS,
  themeMotionPresetSettingKey,
  type ThemeMotionSlotKey,
} from './themeUsageDefs'
import { themeUsageState } from './themeUsageStore'

const STORAGE_KEY = 'flow-usage-rules'

export const usageRulesState = reactive<UsageRulesConstraints>({
  ...DEFAULT_USAGE_RULES_CONSTRAINTS,
})

let initialized = false

function loadFromStorage(): Partial<UsageRulesConstraints> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Partial<UsageRulesConstraints>
  } catch {
    /* ignore */
  }
  return {}
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...usageRulesState }))
}

export function initUsageRules() {
  if (initialized) return
  initialized = true
  const saved = loadFromStorage()
  Object.assign(usageRulesState, DEFAULT_USAGE_RULES_CONSTRAINTS, saved)
  watch(usageRulesState, saveToStorage, { deep: true })
}

export function setUsageRuleConstraint<K extends keyof UsageRulesConstraints>(
  key: K,
  value: UsageRulesConstraints[K],
) {
  usageRulesState[key] = value
}

export interface MotionSlotCompliance {
  slot: ThemeMotionSlotKey
  presetId: string
  presetName: string
  durationMs: number
  ok: boolean
  message: string
}

function motionSlotKind(slot: ThemeMotionSlotKey): 'interaction' | 'lifecycle' {
  return THEME_MOTION_INTERACTION_SLOTS.includes(slot) ? 'interaction' : 'lifecycle'
}

export function checkMotionSlotCompliance(
  slot: ThemeMotionSlotKey,
  presetId: string,
  constraints: UsageRulesConstraints = usageRulesState,
): MotionSlotCompliance | null {
  if (!presetId) return null
  const preset = getStylePresetById(presetId)
  if (!preset) return null
  const config = readEffectConfigFromPreset(preset)
  const durationMs = config.duration
  const kind = motionSlotKind(slot)
  const min =
    kind === 'interaction'
      ? constraints.motionInteractionMinMs
      : constraints.motionLifecycleMinMs
  const max =
    kind === 'interaction'
      ? constraints.motionInteractionMaxMs
      : constraints.motionLifecycleMaxMs

  let ok = durationMs >= min && durationMs <= max
  let message = `${durationMs}ms · 允许 ${min}–${max}ms`

  if (slot === 'hover' && durationMs > constraints.motionHoverHardMaxMs) {
    ok = false
    message = `${durationMs}ms · 超过 hover 硬上限 ${constraints.motionHoverHardMaxMs}ms`
  }

  return {
    slot,
    presetId,
    presetName: preset.name,
    durationMs,
    ok,
    message,
  }
}

export function auditThemeMotionCompliance(
  constraints: UsageRulesConstraints = usageRulesState,
): MotionSlotCompliance[] {
  const slots = [...THEME_MOTION_INTERACTION_SLOTS, ...THEME_MOTION_LIFECYCLE_SLOTS]
  return slots
    .map((slot) => {
      const key = themeMotionPresetSettingKey(slot)
      const presetId = themeUsageState[key] as string
      return checkMotionSlotCompliance(slot, presetId, constraints)
    })
    .filter((row): row is MotionSlotCompliance => !!row)
}
