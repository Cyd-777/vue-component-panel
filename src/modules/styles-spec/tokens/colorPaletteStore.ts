import { watch } from 'vue'
import { applyDesignTokensNow } from './designTokenStore'
import { coerceColorValue, generateScaleAtStep } from './colorUtils'
import { getMainStepForColumn } from './colorPaletteSettings'
import {
  BRAND_SCALE_SLOTS,
  type ColorPaletteSlot,
  findPaletteSlot,
} from './colorPaletteDefs'
import {
  colorPaletteOverrides,
  initColorPaletteOverrides,
  saveColorPaletteOverrides,
} from './colorPaletteOverrides'
import { designTokenState, setDesignToken } from './designTokenStore'
import type { DesignTokenDef } from './designTokenDefs'
import { DESIGN_TOKEN_DEFS } from './designTokenDefs'

export { colorPaletteOverrides, getColorPaletteOverrideVars } from './colorPaletteOverrides'

let initialized = false

export function initColorPalette() {
  if (initialized) return
  initialized = true
  initColorPaletteOverrides()
  watch(
    colorPaletteOverrides,
    () => applyDesignTokensNow(),
    { deep: true },
  )
}

export function getPaletteSlotColor(slot: ColorPaletteSlot): string | null {
  if (slot.tokenKey) {
    const v = designTokenState[slot.tokenKey]
    return v?.trim() ? v : null
  }
  const override = colorPaletteOverrides[slot.id]
  return override?.trim() ? override : null
}

export function isPaletteSlotEmpty(slot: ColorPaletteSlot): boolean {
  return !slot.tokenKey && !colorPaletteOverrides[slot.id]?.trim()
}

export function setPaletteSlotColor(slot: ColorPaletteSlot, raw: string) {
  const value = coerceColorValue(raw)
  if (!value) return

  if (slot.tokenKey) {
    const def = DESIGN_TOKEN_DEFS.find((d) => d.key === slot.tokenKey) as DesignTokenDef | undefined
    setDesignToken(slot.tokenKey, value, def)
    return
  }

  colorPaletteOverrides[slot.id] = value
  saveColorPaletteOverrides()
  applyDesignTokensNow()
}

export function clearPaletteSlotColor(slotId: string) {
  const slot = findPaletteSlot(slotId)
  if (!slot || slot.tokenKey) return
  delete colorPaletteOverrides[slotId]
  saveColorPaletteOverrides()
  applyDesignTokensNow()
}

export function getBrandScaleSlot(step: number): ColorPaletteSlot {
  return BRAND_SCALE_SLOTS[step - 1]
}

/** 色阶展示色：有手动覆盖用覆盖，否则由主色 + 主色阶自动生成 */
export function getEffectiveBrandScaleColor(step: number): string {
  const slot = getBrandScaleSlot(step)
  const override = colorPaletteOverrides[slot.id]
  if (override?.trim()) return coerceColorValue(override)
  const brand = designTokenState.brandColor?.trim() || '#0052d9'
  const mainStep = getMainStepForColumn('primary')
  return generateScaleAtStep(brand, mainStep)[step - 1] ?? brand
}

export function isBrandScaleOverridden(step: number): boolean {
  return !!colorPaletteOverrides[`brand-${step}`]?.trim()
}

export function getEffectiveSemanticScaleColor(
  columnId: string,
  scalePrefix: string | undefined,
  step: number,
  mainColor: string,
): string {
  if (scalePrefix === 'brand') return getEffectiveBrandScaleColor(step)
  const slotId = scalePrefix ? `${scalePrefix}-${step}` : null
  if (slotId && colorPaletteOverrides[slotId]?.trim()) {
    return coerceColorValue(colorPaletteOverrides[slotId])
  }
  const mainStep = getMainStepForColumn(columnId)
  return generateScaleAtStep(mainColor, mainStep)[step - 1] ?? mainColor
}

export function isSemanticScaleOverridden(scalePrefix: string | undefined, step: number): boolean {
  if (scalePrefix === 'brand') return isBrandScaleOverridden(step)
  if (!scalePrefix) return false
  return !!colorPaletteOverrides[`${scalePrefix}-${step}`]?.trim()
}
