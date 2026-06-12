/**
 * 色板页 — 功能色主色阶、中性色混合等设置（与色值 override 分离）
 */
import { reactive, watch } from 'vue'
import { applyDesignTokensNow } from './designTokenStore'
import { FUNCTIONAL_COLOR_COLUMNS } from './colorPalettePageDefs'

const STORAGE_KEY = 'flow-panel:color-palette-settings'

/** 中性色阶总阶数 */
export const NEUTRAL_SCALE_STEP_COUNT = 10

export interface ColorPaletteSettings {
  /** 各功能色列：功能色对应色阶 1–10，默认 7（TDesign 惯例） */
  mainStepByColumn: Record<string, number>
  /** Primary + Info 混合：第 10 阶 Primary 占比 0–100（Info = 100 − Primary） */
  neutralMixPrimary: number
}

const DEFAULT_MAIN_STEP = 7

function defaultMainStepByColumn(): Record<string, number> {
  return Object.fromEntries(
    FUNCTIONAL_COLOR_COLUMNS.map((col) => [col.id, DEFAULT_MAIN_STEP]),
  )
}

function defaultSettings(): ColorPaletteSettings {
  return {
    mainStepByColumn: defaultMainStepByColumn(),
    neutralMixPrimary: 50,
  }
}

function migrateSavedSettings(saved: Partial<ColorPaletteSettings> & Record<string, unknown>) {
  const next = { ...saved } as Partial<ColorPaletteSettings> & Record<string, unknown>
  if (next.neutralMixPrimary == null) {
    const legacyDark = saved.neutralMixDark as number | undefined
    const legacyLight = saved.neutralMixLight as number | undefined
    next.neutralMixPrimary =
      typeof legacyDark === 'number'
        ? legacyDark
        : typeof legacyLight === 'number'
          ? legacyLight
          : defaultSettings().neutralMixPrimary
  }
  delete next.neutralMixLight
  delete next.neutralMixDark
  return next as Partial<ColorPaletteSettings>
}

export const colorPaletteSettings = reactive<ColorPaletteSettings>(defaultSettings())

let initialized = false

function loadFromStorage(): Partial<ColorPaletteSettings> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return migrateSavedSettings(JSON.parse(raw) as Record<string, unknown>)
  } catch {
    return null
  }
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...colorPaletteSettings }))
}

export function initColorPaletteSettings() {
  if (initialized) return
  initialized = true

  const saved = loadFromStorage()
  const defaults = defaultSettings()
  Object.assign(colorPaletteSettings, defaults, saved ?? {})
  colorPaletteSettings.mainStepByColumn = {
    ...defaults.mainStepByColumn,
    ...(saved?.mainStepByColumn ?? {}),
  }

  watch(
    colorPaletteSettings,
    () => {
      saveToStorage()
      applyDesignTokensNow()
    },
    { deep: true },
  )
}

export function getMainStepForColumn(columnId: string): number {
  const step = colorPaletteSettings.mainStepByColumn[columnId]
  if (typeof step === 'number' && step >= 1 && step <= 10) return Math.round(step)
  return DEFAULT_MAIN_STEP
}

export function setMainStepForColumn(columnId: string, step: number) {
  const n = Math.max(1, Math.min(10, Math.round(step)))
  colorPaletteSettings.mainStepByColumn[columnId] = n
}

export function getNeutralMixPrimary(): number {
  return colorPaletteSettings.neutralMixPrimary
}

export function setNeutralMixPrimary(primaryPct: number) {
  colorPaletteSettings.neutralMixPrimary = Math.max(0, Math.min(100, Math.round(primaryPct)))
}

export function setNeutralMixInfo(infoPct: number) {
  setNeutralMixPrimary(100 - Math.round(infoPct))
}

/** @deprecated 使用 setNeutralMixPrimary */
export function setNeutralMixLight(primaryPct: number) {
  setNeutralMixPrimary(primaryPct)
}

/** @deprecated 使用 setNeutralMixInfo */
export function setNeutralMixLightInfo(infoPct: number) {
  setNeutralMixInfo(infoPct)
}

/** @deprecated 使用 setNeutralMixInfo */
export function setNeutralMixDarkInfo(infoPct: number) {
  setNeutralMixInfo(infoPct)
}

/** @deprecated 使用 setNeutralMixPrimary */
export function setNeutralMixDark(primaryPct: number) {
  setNeutralMixPrimary(primaryPct)
}
