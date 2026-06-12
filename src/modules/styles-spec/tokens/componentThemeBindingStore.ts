/**
 * 使用规范 — 组件级主题绑定状态
 */
import { reactive, watch } from 'vue'
import {
  defaultButtonThemeBinding,
  migrateSemanticColorBinding,
  type ButtonSemanticColorRoles,
  type ButtonSemanticTheme,
  type ButtonSize,
  type ButtonThemeBinding,
  type ComponentThemeId,
} from './componentThemeBindingDefs'
import type { RadiusTokenKey } from './themeUsageDefs'

const STORAGE_KEY = 'flow-panel:component-theme-bindings'

export interface ComponentThemeBindings {
  button: ButtonThemeBinding
}

export const componentThemeBindings = reactive<ComponentThemeBindings>({
  button: defaultButtonThemeBinding(),
})

let initialized = false

function loadFromStorage(): Partial<ComponentThemeBindings> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Partial<ComponentThemeBindings>
  } catch {
    return null
  }
}

function normalizeButtonBinding(raw: Partial<ButtonThemeBinding> | undefined): ButtonThemeBinding {
  const defaults = defaultButtonThemeBinding()
  if (!raw) return defaults

  const themes = Object.keys(defaults.semanticColors) as ButtonSemanticTheme[]
  const semanticColors = { ...defaults.semanticColors }
  for (const theme of themes) {
    const saved = raw.semanticColors?.[theme]
    if (saved) semanticColors[theme] = migrateSemanticColorBinding(saved)
  }

  return {
    ...defaults,
    ...raw,
    semanticColors,
    variants: { ...defaults.variants, ...raw.variants },
    fontPresetBySize: { ...defaults.fontPresetBySize, ...raw.fontPresetBySize },
    hoverMotionPresetId:
      raw.hoverMotionPresetId
      ?? (raw.motionPresetId && raw.motionPresetId !== defaults.motionPresetId
        ? raw.motionPresetId
        : ''),
    activeMotionPresetId: raw.activeMotionPresetId ?? defaults.activeMotionPresetId,
    focusMotionPresetId: raw.focusMotionPresetId ?? defaults.focusMotionPresetId,
  }
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...componentThemeBindings }))
}

export function initComponentThemeBindings() {
  if (initialized) return
  initialized = true

  const saved = loadFromStorage()
  if (saved?.button) {
    componentThemeBindings.button = normalizeButtonBinding(saved.button)
  }

  watch(componentThemeBindings, saveToStorage, { deep: true })
}

export function setButtonRadiusToken(token: RadiusTokenKey) {
  componentThemeBindings.button.radiusToken = token
}

export function setButtonEffectPreset(id: string) {
  componentThemeBindings.button.effectPresetId = id
}

export function setButtonBorderEffectPreset(id: string) {
  componentThemeBindings.button.borderEffectPresetId = id
}

export function setButtonMotionPreset(id: string) {
  componentThemeBindings.button.motionPresetId = id
  componentThemeBindings.button.hoverMotionPresetId = id
}

export function setButtonInteractionMotionPreset(
  slot: 'hoverMotionPresetId' | 'activeMotionPresetId' | 'focusMotionPresetId',
  id: string,
) {
  componentThemeBindings.button[slot] = id
}

export function resolvedButtonMotionPresetId(
  slot: 'hoverMotionPresetId' | 'activeMotionPresetId' | 'focusMotionPresetId',
  globalIds: {
    hoverMotionPresetId: string
    activeMotionPresetId: string
    focusMotionPresetId: string
  },
): string {
  const local = componentThemeBindings.button[slot]
  if (local) return local
  return globalIds[slot]
}

export function setButtonFontBySize(size: ButtonSize, presetId: string) {
  componentThemeBindings.button.fontPresetBySize[size] = presetId
}

export function setButtonSemanticRole(
  theme: ButtonSemanticTheme,
  role: keyof ButtonSemanticColorRoles,
  cssVar: string,
) {
  const roles = componentThemeBindings.button.semanticColors[theme]
  if (role === 'light' && !cssVar) {
    delete roles.light
    return
  }
  roles[role] = cssVar
}

export function getComponentBinding(id: ComponentThemeId): ButtonThemeBinding | null {
  if (id === 'button') return componentThemeBindings.button
  return null
}
