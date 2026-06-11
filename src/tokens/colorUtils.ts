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

/** 根据主色生成 TDesign brand 1–10 色阶 */
export function generateBrandScale(mainHex: string): string[] {
  const main = normalizeHex(mainHex)
  const steps: string[] = []
  for (let i = 1; i <= 10; i += 1) {
    if (i < 7) {
      steps.push(mixHex(main, '#ffffff', (7 - i) / 6))
    } else if (i === 7) {
      steps.push(main)
    } else {
      steps.push(mixHex(main, '#000000', (i - 7) / 3.5))
    }
  }
  return steps
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
  const l1 = relativeLuminance(fgHex)
  const l2 = relativeLuminance(bgHex)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export function pickTextColorOnBackground(bgHex: string): string {
  const bg = normalizeHex(bgHex)
  const white = contrastRatio('#ffffff', bg)
  const black = contrastRatio('#000000', bg)
  return white >= black ? '#ffffff' : '#000000a6'
}
