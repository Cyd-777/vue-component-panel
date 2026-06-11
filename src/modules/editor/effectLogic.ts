/**
 * 视觉效果：box-shadow 预设 + filter blur
 */
import { SHADOW_TOKENS, type ShadowPresetId } from './designTokens'

export function detectShadowPreset(boxShadow: string): ShadowPresetId {
  const v = boxShadow.trim()
  if (!v || v === 'none') return 'none'
  for (const t of SHADOW_TOKENS) {
    if (v === t.value || v === `var(${t.token})`) return t.id
  }
  return 'custom'
}

/** 写入可立即渲染的阴影值（字面量；预设名仍对应 design token） */
export function shadowCssForPreset(preset: ShadowPresetId, custom: string): string {
  if (preset === 'none') return ''
  if (preset === 'custom') return custom.trim()
  const token = SHADOW_TOKENS.find((t) => t.id === preset)
  return token ? `var(${token.token})` : ''
}

export function parseBlurPx(filterRaw: string): number {
  const m = filterRaw.match(/blur\(\s*([\d.]+)\s*px\s*\)/i)
  if (!m) return 0
  const n = parseFloat(m[1])
  return Number.isFinite(n) ? Math.max(0, n) : 0
}

export function formatBlurFilter(blurPx: number): string {
  if (blurPx <= 0) return ''
  return `blur(${Math.round(blurPx * 10) / 10}px)`
}

export function applyEffectToStyles(
  styles: Record<string, string>,
  boxShadow: string,
  blurPx: number,
): void {
  const shadow = boxShadow.trim()
  if (shadow && shadow !== 'none') styles['box-shadow'] = shadow
  else delete styles['box-shadow']

  const filter = formatBlurFilter(blurPx)
  if (filter) styles.filter = filter
  else delete styles.filter
}
