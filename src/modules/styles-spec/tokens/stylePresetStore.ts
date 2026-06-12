import { reactive, watch } from 'vue'
import {
  buildFontPresetsFromCatalog,
  mergeMissingFontPresets,
} from './fontPresetCatalog'
import {
  defaultStylePresetProperties,
  mergeStylePresetProperties,
  presetPropertiesToInlineStyle,
  stylePresetCssClass,
  stylePresetCssVarPrefix,
  stylePresetCssVars,
  type StylePreset,
  type StylePresetCategory,
  type StylePresetProperties,
} from './stylePresetDefs'
import { MOTION_META_PROPERTY_KEYS } from './motionPresetOptions'
import {
  MOTION_EFFECT_CONFIG_KEY,
  effectConfigToCssRules,
  mergeEffectConfigIntoProperties,
  readEffectConfigFromPreset,
} from './effectConfig'
import { mergeVisualEffectIntoProperties, VISUAL_EFFECT_CONFIG_KEY, VISUAL_EFFECT_META_KEYS } from './visualEffectConfig'
import {
  buildCanonicalEffectPresets,
  CANONICAL_EFFECT_PRESET_IDS,
} from './effectPresetCatalog'
import {
  buildCanonicalMotionPresets,
  CANONICAL_MOTION_PRESET_IDS,
} from './motionPresetCatalog'

const STORAGE_KEY = 'flow-style-presets'
const STYLE_ID = 'flow-style-presets-css'
const PRESET_META_KEYS = new Set([...MOTION_META_PROPERTY_KEYS, ...VISUAL_EFFECT_META_KEYS])

export const stylePresets = reactive<StylePreset[]>([])

let initialized = false

function loadFromStorage(): StylePreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as StylePreset[]
  } catch {
    /* ignore */
  }
  return []
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stylePresets))
}

function seedEffectAndMotionDefaults() {
  stylePresets.push(...buildCanonicalEffectPresets(), ...buildCanonicalMotionPresets())
}

function seedDefaults() {
  if (stylePresets.length > 0) return
  stylePresets.push(...buildFontPresetsFromCatalog())
  seedEffectAndMotionDefaults()
}

function mergeMissingEffectPresets(list: StylePreset[]): StylePreset[] {
  const ids = new Set(list.filter((p) => p.category === 'effect').map((p) => p.id))
  const missing = buildCanonicalEffectPresets()
    .filter((p) => !ids.has(p.id))
    .map((p) => ({
      ...p,
      properties: mergeVisualEffectIntoProperties(
        p.id,
        p.name,
        mergeStylePresetProperties('effect', p.properties),
      ),
    }))
  return missing.length ? [...list, ...missing] : list
}

function mergeMissingMotionPresets(list: StylePreset[]): StylePreset[] {
  const ids = new Set(list.filter((p) => p.category === 'motion').map((p) => p.id))
  const missing = buildCanonicalMotionPresets()
    .filter((p) => !ids.has(p.id))
    .map((p) => ({
      ...p,
      properties: mergeEffectConfigIntoProperties(
        p.id,
        p.name,
        mergeStylePresetProperties('motion', p.properties),
      ),
    }))
  return missing.length ? [...list, ...missing] : list
}

function motionPresetIds(list: StylePreset[]): Set<string> {
  return new Set(list.filter((p) => p.category === 'motion').map((p) => p.id))
}

function isCanonicalEffectSetComplete(list: StylePreset[]): boolean {
  const ids = new Set(list.filter((p) => p.category === 'effect').map((p) => p.id))
  return CANONICAL_EFFECT_PRESET_IDS.every((id) => ids.has(id))
}

function effectPresetsNeedVisualConfigSync(list: StylePreset[]): boolean {
  return list.some(
    (p) => p.category === 'effect' && !p.properties[VISUAL_EFFECT_CONFIG_KEY]?.trim(),
  )
}

function syncAllVisualEffectConfigs(): boolean {
  let changed = false
  for (let i = 0; i < stylePresets.length; i++) {
    const preset = stylePresets[i]
    if (preset.category !== 'effect') continue
    const before = preset.properties[VISUAL_EFFECT_CONFIG_KEY]
    const properties = mergeVisualEffectIntoProperties(preset.id, preset.name, { ...preset.properties })
    if (properties[VISUAL_EFFECT_CONFIG_KEY] !== before) {
      stylePresets[i] = { ...preset, properties }
      changed = true
    }
  }
  return changed
}

function repairCanonicalEffectPresets(): boolean {
  let changed = false
  const withMissing = mergeMissingEffectPresets([...stylePresets])
  if (withMissing.length !== stylePresets.length) {
    stylePresets.splice(0, stylePresets.length, ...withMissing)
    changed = true
  }
  if (!isCanonicalEffectSetComplete(stylePresets)) {
    const repaired = mergeMissingEffectPresets([...stylePresets])
    stylePresets.splice(0, stylePresets.length, ...repaired)
    changed = true
  }
  if (syncAllVisualEffectConfigs()) changed = true
  if (changed) {
    saveToStorage()
    applyStylePresetsToDocument()
  }
  return changed
}

function isCanonicalMotionSetComplete(list: StylePreset[]): boolean {
  const ids = motionPresetIds(list)
  return CANONICAL_MOTION_PRESET_IDS.every((id) => ids.has(id))
}

function motionPresetsNeedEffectConfigSync(list: StylePreset[]): boolean {
  return list.some(
    (p) => p.category === 'motion' && !p.properties[MOTION_EFFECT_CONFIG_KEY]?.trim(),
  )
}

function syncAllMotionEffectConfigs(): boolean {
  let changed = false
  for (let i = 0; i < stylePresets.length; i++) {
    const preset = stylePresets[i]
    if (preset.category !== 'motion') continue
    const before = preset.properties[MOTION_EFFECT_CONFIG_KEY]
    const properties = mergeEffectConfigIntoProperties(preset.id, preset.name, { ...preset.properties })
    if (properties[MOTION_EFFECT_CONFIG_KEY] !== before) {
      stylePresets[i] = { ...preset, properties }
      changed = true
    }
  }
  return changed
}

function repairCanonicalMotionPresets(): boolean {
  let changed = false
  const withMissing = mergeMissingMotionPresets([...stylePresets])
  if (withMissing.length !== stylePresets.length) {
    stylePresets.splice(0, stylePresets.length, ...withMissing)
    changed = true
  }
  if (!isCanonicalMotionSetComplete(stylePresets)) {
    const repaired = mergeMissingMotionPresets([...stylePresets])
    stylePresets.splice(0, stylePresets.length, ...repaired)
    changed = true
  }
  if (syncAllMotionEffectConfigs()) changed = true
  if (changed) {
    saveToStorage()
    applyStylePresetsToDocument()
  }
  return changed
}

function normalizeLoadedPresets(list: StylePreset[]): StylePreset[] {
  const merged = list.map((p) => {
    const properties = mergeStylePresetProperties(p.category, p.properties)
    if (p.category === 'motion') {
      return {
        ...p,
        properties: mergeEffectConfigIntoProperties(p.id, p.name, properties),
      }
    }
    if (p.category === 'effect') {
      return {
        ...p,
        properties: mergeVisualEffectIntoProperties(p.id, p.name, properties),
      }
    }
    return { ...p, properties }
  })
  return mergeMissingMotionPresets(mergeMissingEffectPresets(mergeMissingFontPresets(merged)))
}

function buildPresetClassRules(preset: StylePreset): string {
  if (preset.category === 'motion') {
    const config = readEffectConfigFromPreset(preset)
    return effectConfigToCssRules(stylePresetCssClass(preset.id), config)
  }

  const cls = stylePresetCssClass(preset.id)
  const baseEntries = Object.entries(preset.properties).filter(
    ([prop]) => !PRESET_META_KEYS.has(prop),
  )
  const baseLines = baseEntries.map(([prop, val]) => `  ${prop}: ${val};`).join('\n')
  return `.${cls} {\n${baseLines}\n}`
}

export function applyStylePresetsToDocument() {
  const classRules = stylePresets
    .map((preset) => buildPresetClassRules(preset))
    .join('\n\n')

  const rootVars = stylePresets
    .flatMap((preset) => Object.entries(stylePresetCssVars(preset)))
    .map(([key, val]) => `  ${key}: ${val};`)
    .join('\n')

  const css = `:root {\n${rootVars}\n}\n\n${classRules}`

  let el = document.getElementById(STYLE_ID)
  if (!el) {
    el = document.createElement('style')
    el.id = STYLE_ID
    document.head.appendChild(el)
  }
  el.textContent = css
}

export function initStylePresets() {
  if (initialized) {
    repairCanonicalMotionPresets()
    repairCanonicalEffectPresets()
    return
  }
  initialized = true

  const saved = loadFromStorage()
  if (saved.length) {
    const normalized = normalizeLoadedPresets(saved)
    stylePresets.splice(0, stylePresets.length, ...normalized)
    const needsSave =
      normalized.length !== saved.length
      || !isCanonicalMotionSetComplete(normalized)
      || !isCanonicalEffectSetComplete(normalized)
      || motionPresetsNeedEffectConfigSync(normalized)
      || effectPresetsNeedVisualConfigSync(normalized)
    if (needsSave) saveToStorage()
  } else {
    seedDefaults()
    syncAllMotionEffectConfigs()
    syncAllVisualEffectConfigs()
    saveToStorage()
  }

  applyStylePresetsToDocument()
  syncAllMotionEffectConfigs()
  syncAllVisualEffectConfigs()

  watch(
    stylePresets,
    () => {
      saveToStorage()
      applyStylePresetsToDocument()
      import('./themeUsageStore').then(({ refreshThemeUsageCss }) => refreshThemeUsageCss())
    },
    { deep: true },
  )
}

export function getPresetsByCategory(category: StylePresetCategory): StylePreset[] {
  return stylePresets.filter((p) => p.category === category)
}

export function getStylePresetById(id: string): StylePreset | undefined {
  return stylePresets.find((p) => p.id === id)
}

function slugifyName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/gi, '-')
    .replace(/^-+|-+$/g, '')
  return base || 'style'
}

function uniquePresetId(base: string): string {
  if (!stylePresets.some((p) => p.id === base)) return base
  let i = 2
  while (stylePresets.some((p) => p.id === `${base}-${i}`)) i += 1
  return `${base}-${i}`
}

function uniquePresetName(category: StylePresetCategory): string {
  const base = '未命名样式'
  const existing = stylePresets.filter((p) => p.category === category).map((p) => p.name)
  if (!existing.includes(base)) return base
  let i = 2
  while (existing.includes(`${base} ${i}`)) i += 1
  return `${base} ${i}`
}

export function createStylePresetDraft(category: StylePresetCategory): StylePreset {
  const name = uniquePresetName(category)
  return {
    id: uniquePresetId(slugifyName(name)),
    name,
    category,
    properties: defaultStylePresetProperties(category),
  }
}

export function saveStylePreset(preset: StylePreset) {
  let properties = { ...preset.properties }
  if (preset.category === 'motion') {
    properties = mergeEffectConfigIntoProperties(preset.id, preset.name, properties)
  } else if (preset.category === 'effect') {
    properties = mergeVisualEffectIntoProperties(preset.id, preset.name, properties)
  }
  const normalized = { ...preset, properties }

  const idx = stylePresets.findIndex((p) => p.id === normalized.id)
  if (idx >= 0) {
    stylePresets[idx] = normalized
  } else {
    stylePresets.push(normalized)
  }
}

export function deleteStylePreset(id: string) {
  const idx = stylePresets.findIndex((p) => p.id === id)
  if (idx >= 0) stylePresets.splice(idx, 1)
}

export function applyStylePresetProperties(
  properties: StylePresetProperties,
): Record<string, string> {
  return presetPropertiesToInlineStyle(properties)
}

export function formatPresetPropertySummary(properties: StylePresetProperties): string {
  const keys = Object.keys(properties)
  if (!keys.length) return '空样式'
  const preview = keys
    .slice(0, 3)
    .map((k) => `${k}: ${properties[k]}`)
    .join(' · ')
  return keys.length > 3 ? `${preview} …` : preview
}

export function presetReferenceToken(id: string): string {
  return stylePresetCssVarPrefix(id)
}
