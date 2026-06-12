import { reactive, watch } from 'vue'
import { coerceColorValue } from './colorUtils'
import { ALL_COLOR_PALETTE_SLOTS } from './colorPaletteDefs'

const STORAGE_KEY = 'flow-panel:color-palette-overrides'

/** 可选色槽位的手动覆盖（id → 颜色值） */
export const colorPaletteOverrides = reactive<Record<string, string>>({})

let initialized = false

function loadFromStorage(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Record<string, string>
  } catch {
    /* ignore */
  }
  return {}
}

export function saveColorPaletteOverrides() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...colorPaletteOverrides }))
}

export function initColorPaletteOverrides() {
  if (initialized) return
  initialized = true
  Object.assign(colorPaletteOverrides, loadFromStorage())
  watch(
    colorPaletteOverrides,
    () => saveColorPaletteOverrides(),
    { deep: true },
  )
}

/** 写入 CSS 的可选色覆盖（核心色由 designTokenState 负责） */
export function getColorPaletteOverrideVars(): Record<string, string> {
  const vars: Record<string, string> = {}
  for (const slot of ALL_COLOR_PALETTE_SLOTS) {
    if (slot.tokenKey) continue
    const raw = colorPaletteOverrides[slot.id]
    if (raw?.trim()) vars[slot.cssVar] = coerceColorValue(raw)
  }
  return vars
}
