export function coerceColorValue(raw: unknown): string {
  if (raw == null) return ''
  if (typeof raw === 'string') return raw.trim()
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    if (typeof obj.css === 'string') return obj.css
    if (typeof obj.rgba === 'string') return obj.rgba
    if (typeof obj.rgb === 'string') return obj.rgb
    if (typeof obj.hex === 'string') {
      const hex = obj.hex.trim()
      return hex.startsWith('#') ? hex : `#${hex}`
    }
  }
  return String(raw).trim()
}

export function isRgbColor(value: string): boolean {
  return /^rgba?\(/i.test(value.trim())
}

export function normalizeHex(hex: string): string {
  const input = coerceColorValue(hex)
  if (isRgbColor(input)) return input
  const raw = input.replace(/^#/, '')
  if (raw.length === 3) {
    return `#${raw
      .split('')
      .map((c) => c + c)
      .join('')}`
  }
  if (raw.length === 6 || raw.length === 8) return `#${raw.slice(0, 6)}`
  return '#0052D9'
}

export function hexToRgb(hex: string): [number, number, number] {
  const n = normalizeHex(hex).slice(1)
  return [
    Number.parseInt(n.slice(0, 2), 16),
    Number.parseInt(n.slice(2, 4), 16),
    Number.parseInt(n.slice(4, 6), 16),
  ]
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')}`
}

/** 将 var / rgb / hex 解析为 #rrggbb，供 type=color 与自定义输入框使用 */
export function resolveColorForPicker(raw: string, fallback = '#ffffff'): string {
  const v = coerceColorValue(raw)
  if (!v) return normalizeHex(fallback)
  if (/^#[0-9a-fA-F]{3,8}$/.test(v)) return normalizeHex(v)
  if (isRgbColor(v)) {
    const m = v.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i)
    if (m) return rgbToHex(Number(m[1]), Number(m[2]), Number(m[3]))
  }
  const varMatch = v.match(/^var\((--[\w-]+)\)$/)
  if (varMatch && typeof document !== 'undefined') {
    const css = getComputedStyle(document.documentElement).getPropertyValue(varMatch[1]).trim()
    if (css) return resolveColorForPicker(css, fallback)
  }
  return normalizeHex(fallback)
}

export function mixHex(base: string, target: string, amount: number): string {
  const t = Math.max(0, Math.min(1, amount))
  const [r1, g1, b1] = hexToRgb(base)
  const [r2, g2, b2] = hexToRgb(target)
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t)
}

/**
 * 根据主色生成 10 阶色阶，主色落在 mainStep（1–10）
 */
export function generateScaleAtStep(mainHex: string, mainStep: number): string[] {
  const main = normalizeHex(mainHex)
  const center = Math.max(1, Math.min(10, Math.round(mainStep)))
  const steps: string[] = []
  for (let i = 1; i <= 10; i += 1) {
    if (i < center) {
      const t = center === 1 ? 0 : (center - i) / (center - 1)
      steps.push(mixHex(main, '#ffffff', t * 0.92))
    } else if (i === center) {
      steps.push(main)
    } else {
      const t = center === 10 ? 0 : (i - center) / (10 - center)
      steps.push(mixHex(main, '#000000', t * 0.88))
    }
  }
  return steps
}

/** 根据主色生成 TDesign brand 1–10 色阶（主色在第 7 阶） */
export function generateBrandScale(mainHex: string): string[] {
  return generateScaleAtStep(mainHex, 7)
}

/** Primary 各阶与 Info 对应阶按同一占比混合 */
export function generatePrimaryInfoScaleMix(
  primaryScale: string[],
  infoScale: string[],
  primaryPct: number,
): string[] {
  const share = Math.max(0, Math.min(100, primaryPct)) / 100
  const count = Math.min(primaryScale.length, infoScale.length)
  return Array.from({ length: count }, (_, i) =>
    mixHex(normalizeHex(infoScale[i]!), normalizeHex(primaryScale[i]!), share),
  )
}

/** @deprecated 使用 generatePrimaryInfoScaleMix */
export function generatePrimaryInfoVerticalScale(
  primaryHex: string,
  infoHex: string,
  primaryPct: number,
  stepCount = 10,
): string[] {
  const primary = normalizeHex(primaryHex)
  const info = normalizeHex(infoHex)
  const primaryScale = generateScaleAtStep(primary, 7)
  const infoScale = generateScaleAtStep(info, 7)
  return generatePrimaryInfoScaleMix(primaryScale, infoScale, primaryPct).slice(0, stepCount)
}

/** @deprecated 使用 generatePrimaryInfoVerticalScale */
export function generatePrimaryInfoMixBar(
  primaryHex: string,
  infoHex: string,
  count: number,
  _lightPrimaryPct: number,
  darkPrimaryPct: number,
): string[] {
  return generatePrimaryInfoVerticalScale(primaryHex, infoHex, darkPrimaryPct, count)
}

/** @deprecated 使用 generatePrimaryInfoMixBar */
export function generatePrimaryNeutralBar(
  primaryHex: string,
  count: number,
  mixLightPct: number,
  mixDarkPct: number,
): string[] {
  return generatePrimaryInfoMixBar(primaryHex, '#697586', count, mixLightPct, mixDarkPct)
}

/** 相对主色阶的派生态索引（hover 浅一档、active 深一档等） */
export function scaleStateIndices(mainStep: number): {
  main: number
  hover: number
  active: number
  focus: number
  light: number
  lightHover: number
  disabled: number
} {
  const main = mainStep - 1
  return {
    main,
    hover: Math.max(0, main - 1),
    active: Math.min(9, main + 1),
    focus: Math.min(9, Math.max(0, main - 5)),
    light: 0,
    lightHover: Math.min(9, 1),
    disabled: Math.min(9, Math.max(0, main - 4)),
  }
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG 对比度 */
export function contrastRatio(fgHex: string, bgHex: string): number {
  const l1 = relativeLuminance(normalizeHex(fgHex))
  const l2 = relativeLuminance(normalizeHex(bgHex))
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export function formatContrastRatio(ratio: number): string {
  if (!Number.isFinite(ratio) || ratio <= 0) return '—'
  return `${ratio.toFixed(2)}:1`
}

/** WCAG 2.x 对比度阈值 */
export const WCAG_RATIO = {
  AA_NORMAL: 4.5,
  AA_LARGE: 3,
  AAA_NORMAL: 7,
  AAA_LARGE: 4.5,
} as const

/** 色卡标签字号对应 WCAG 档位：正文 / 大号字（≥14px 粗体或 ≥18px） */
export type WcagTextSize = 'normal' | 'large'

export interface WcagCompliance {
  ratio: number
  aaNormal: boolean
  aaLarge: boolean
  aaaNormal: boolean
  aaaLarge: boolean
}

export function minContrastForTextSize(size: WcagTextSize): number {
  return size === 'large' ? WCAG_RATIO.AA_LARGE : WCAG_RATIO.AA_NORMAL
}

export function getWcagCompliance(fgHex: string, bgHex: string): WcagCompliance {
  const ratio = contrastRatio(fgHex, bgHex)
  return {
    ratio,
    aaNormal: ratio >= WCAG_RATIO.AA_NORMAL,
    aaLarge: ratio >= WCAG_RATIO.AA_LARGE,
    aaaNormal: ratio >= WCAG_RATIO.AAA_NORMAL,
    aaaLarge: ratio >= WCAG_RATIO.AAA_LARGE,
  }
}

/** @deprecated 请使用 swatchTextColor.getSwatchDisplayColors */
export function pickTextColorOnBackground(
  bgHex: string,
  textSize: WcagTextSize = 'normal',
): string {
  const bg = normalizeHex(bgHex)
  const minRequired = minContrastForTextSize(textSize)
  const whiteRatio = contrastRatio('#ffffff', bg)
  const blackRatio = contrastRatio('#000000', bg)
  const whitePass = whiteRatio >= minRequired
  const blackPass = blackRatio >= minRequired

  if (whitePass && blackPass) {
    return whiteRatio >= blackRatio ? '#ffffff' : '#000000'
  }
  if (whitePass) return '#ffffff'
  if (blackPass) return '#000000'
  return whiteRatio >= blackRatio ? '#ffffff' : '#000000'
}

/** 将 hex / rgb() / rgba() 解析为 #rrggbb，无法解析时返回 null */
export function parseColorToHex(raw: string): string | null {
  const v = coerceColorValue(raw)
  if (!v) return null
  if (/^#[0-9a-fA-F]{3,8}$/.test(v)) return normalizeHex(v)
  if (isRgbColor(v)) {
    const m = v.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i)
    if (m) return rgbToHex(Number(m[1]), Number(m[2]), Number(m[3]))
  }
  return null
}

export function hexToRgbString(hex: string): string {
  const [r, g, b] = hexToRgb(normalizeHex(hex))
  return `rgb(${r}, ${g}, ${b})`
}

export function swatchWcagTitle(
  ratioLabel: string,
  passesAA: boolean,
  minRequired: number,
  textSize: WcagTextSize,
): string {
  const tier = textSize === 'large' ? 'AA 大号字' : 'AA 正文'
  const req = `${minRequired}:1`
  if (passesAA) return `对比度 ${ratioLabel}，满足 ${tier}（≥ ${req}）`
  return `对比度 ${ratioLabel}，未达 ${tier}（≥ ${req}）`
}
