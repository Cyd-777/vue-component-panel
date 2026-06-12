/**
 * 使用规范 / 主题应用 — 语义槽位绑定命名样式与尺寸 token。
 * 颜色由项目色板自动生效；此处配置字体 / 效果 / 动效 / 圆角引用。
 */
import { reactive, watch } from 'vue'
import { getPresetsByCategory } from './stylePresetStore'
import {
  emptyThemeUsageSettings,
  migrateThemeUsageSaved,
  type ThemeUsageSettings,
} from './themeUsageDefs'

import { applyThemeUsageToDocument } from './themeUsageApply'

const STORAGE_KEY = 'flow-panel:theme-usage'

export type { ThemeUsageSettings } from './themeUsageDefs'

export const themeUsageState = reactive<ThemeUsageSettings>(emptyThemeUsageSettings())

let initialized = false

function defaultPresetId(category: 'font' | 'effect' | 'motion', fallback: string): string {
  const list = getPresetsByCategory(category)
  if (list.some((p) => p.id === fallback)) return fallback
  return list[0]?.id ?? ''
}

function loadFromStorage(): Partial<ThemeUsageSettings> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return migrateThemeUsageSaved(JSON.parse(raw) as Record<string, unknown>)
  } catch {
    return null
  }
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...themeUsageState }))
}

function defaultThemeUsage(): ThemeUsageSettings {
  return {
    headlineFontPresetId: defaultPresetId('font', 'headline'),
    titleFontPresetId: defaultPresetId('font', 'title'),
    bodyFontPresetId: defaultPresetId('font', 'body'),
    captionFontPresetId: defaultPresetId('font', 'caption'),
    cardEffectPresetId: defaultPresetId('effect', 'card'),
    popupEffectPresetId: defaultPresetId('effect', 'popup'),
    controlEffectPresetId: defaultPresetId('effect', 'control'),
    hoverMotionPresetId: defaultPresetId('motion', 'hover'),
    activeMotionPresetId: defaultPresetId('motion', 'active'),
    focusMotionPresetId: defaultPresetId('motion', 'focus'),
    enterMotionPresetId: defaultPresetId('motion', 'enter'),
    exitMotionPresetId: defaultPresetId('motion', 'exit'),
    expandMotionPresetId: defaultPresetId('motion', 'expand'),
    cardRadiusToken: 'radiusMedium',
    controlRadiusToken: 'radiusSmall',
    cardShadowLevel: '1',
  }
}

export function initThemeUsage() {
  if (initialized) return
  initialized = true

  const saved = loadFromStorage()
  Object.assign(themeUsageState, defaultThemeUsage(), saved ?? {})

  watch(themeUsageState, () => {
    saveToStorage()
    applyThemeUsageToDocument({ ...themeUsageState })
  }, { deep: true })

  applyThemeUsageToDocument({ ...themeUsageState })
}

export function refreshThemeUsageCss() {
  applyThemeUsageToDocument({ ...themeUsageState })
}

export function setThemeUsage<K extends keyof ThemeUsageSettings>(key: K, value: ThemeUsageSettings[K]) {
  themeUsageState[key] = value
}
