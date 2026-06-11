import { reactive, watch } from 'vue'
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

const STORAGE_KEY = 'flow-style-presets'
const STYLE_ID = 'flow-style-presets-css'

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

function seedDefaults() {
  if (stylePresets.length > 0) return
  stylePresets.push(
    {
      id: 'body',
      name: '正文',
      category: 'font',
      properties: defaultStylePresetProperties('font'),
    },
    {
      id: 'title',
      name: '标题',
      category: 'font',
      properties: {
        ...defaultStylePresetProperties('font'),
        'font-size': '16px',
        'font-weight': '600',
        'line-height': '24px',
      },
    },
    {
      id: 'card',
      name: '卡片',
      category: 'effect',
      properties: defaultStylePresetProperties('effect'),
    },
    {
      id: 'hover',
      name: '悬停过渡',
      category: 'motion',
      properties: defaultStylePresetProperties('motion'),
    },
  )
}

export function applyStylePresetsToDocument() {
  const classRules = stylePresets
    .map((preset) => {
      const lines = Object.entries(preset.properties)
        .map(([prop, val]) => `  ${prop}: ${val};`)
        .join('\n')
      return `.${stylePresetCssClass(preset.id)} {\n${lines}\n}`
    })
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
  if (initialized) return
  initialized = true

  const saved = loadFromStorage()
  if (saved.length) {
    stylePresets.splice(
      0,
      stylePresets.length,
      ...saved.map((p) => ({
        ...p,
        properties: mergeStylePresetProperties(p.category, p.properties),
      })),
    )
  } else {
    seedDefaults()
    saveToStorage()
  }

  applyStylePresetsToDocument()

  watch(
    stylePresets,
    () => {
      saveToStorage()
      applyStylePresetsToDocument()
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
  const idx = stylePresets.findIndex((p) => p.id === preset.id)
  if (idx >= 0) {
    stylePresets[idx] = { ...preset, properties: { ...preset.properties } }
  } else {
    stylePresets.push({ ...preset, properties: { ...preset.properties } })
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
