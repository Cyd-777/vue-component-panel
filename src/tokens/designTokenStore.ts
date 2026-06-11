import { reactive, watch } from 'vue'
import { applyDesignTokensToDocument, normalizeDesignTokenValues } from './applyDesignTokens'
import { coerceColorValue } from './colorUtils'
import {
  DEFAULT_TOKEN_VALUES,
  DESIGN_TOKEN_DEFS,
  getDefsByGroup,
  type DesignTokenDef,
  type DesignTokenValues,
  type TokenGroup,
} from './designTokenDefs'

const STORAGE_KEY = 'flow-panel:design-tokens'

export const designTokenState = reactive<DesignTokenValues>({
  ...DEFAULT_TOKEN_VALUES,
})

let initialized = false

function loadFromStorage(): Partial<DesignTokenValues> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Partial<DesignTokenValues>
  } catch {
    return null
  }
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...designTokenState }))
}

export function applyDesignTokensNow() {
  applyDesignTokensToDocument(designTokenState)
}

export function setDesignToken<K extends keyof DesignTokenValues>(
  key: K,
  raw: unknown,
  def?: DesignTokenDef,
) {
  const meta = def ?? DESIGN_TOKEN_DEFS.find((item) => item.key === key)
  if (!meta) return

  if (meta.type === 'color') {
    designTokenState[key] = coerceColorValue(raw) as DesignTokenValues[K]
  } else {
    designTokenState[key] = String(raw ?? meta.default) as DesignTokenValues[K]
  }

  applyDesignTokensNow()
  saveToStorage()
}

export function initDesignTokens() {
  if (initialized) return
  initialized = true

  const saved = loadFromStorage()
  if (saved) {
    const merged = normalizeDesignTokenValues({
      ...DEFAULT_TOKEN_VALUES,
      ...saved,
    })
    Object.assign(designTokenState, merged)
  }

  applyDesignTokensNow()

  watch(
    designTokenState,
    () => {
      applyDesignTokensNow()
      saveToStorage()
    },
    { deep: true, flush: 'post' },
  )
}

export function resetDesignTokens(group?: TokenGroup | 'all') {
  const defs = getDefsByGroup(group ?? 'all')
  for (const def of defs) {
    designTokenState[def.key] = def.default
  }
  applyDesignTokensNow()
  saveToStorage()
}

export function getTokenValue(key: keyof DesignTokenValues): string {
  return designTokenState[key]
}
