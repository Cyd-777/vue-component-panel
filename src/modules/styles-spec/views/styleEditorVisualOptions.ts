/** 字体模态窗 — 图标单选控件配置 */

export interface IconRadioOption {
  value: string
  label: string
}

export interface FontCssGlyphIconRadioConfig {
  options: IconRadioOption[]
  glyph: string
}

export interface FontSynthesisIconOption extends IconRadioOption {
  glyph: string
}

export const TEXT_TRANSFORM_ICON_OPTIONS: IconRadioOption[] = [
  { value: 'none', label: '无转换' },
  { value: 'capitalize', label: '首字母大写' },
  { value: 'uppercase', label: '全大写' },
  { value: 'lowercase', label: '全小写' },
]

export const TEXT_DECORATION_LINE_ICON_OPTIONS: IconRadioOption[] = [
  { value: 'none', label: '无' },
  { value: 'underline', label: '下划线' },
  { value: 'overline', label: '上划线' },
  { value: 'line-through', label: '删除线' },
  { value: 'underline line-through', label: '下划线 + 删除线' },
]

export const TEXT_DECORATION_STYLE_ICON_OPTIONS: IconRadioOption[] = [
  { value: 'solid', label: '实线' },
  { value: 'double', label: '双线' },
  { value: 'dotted', label: '点线' },
  { value: 'dashed', label: '虚线' },
  { value: 'wavy', label: '波浪线' },
]

export const FONT_SMOOTH_ICON_OPTIONS: IconRadioOption[] = [
  { value: 'auto', label: '系统默认' },
  { value: 'antialiased', label: '抗锯齿' },
  { value: 'subpixel-antialiased', label: '子像素' },
]

export const FONT_STYLE_ICON_OPTIONS: IconRadioOption[] = [
  { value: 'normal', label: '正常' },
  { value: 'italic', label: '斜体' },
  { value: 'oblique', label: '倾斜' },
]

export const FONT_VARIANT_ICON_OPTIONS: IconRadioOption[] = [
  { value: 'normal', label: '正常' },
  { value: 'small-caps', label: '小型大写' },
  { value: 'all-small-caps', label: '全部小型大写' },
  { value: 'petite-caps', label: 'Petite 大写' },
  { value: 'unicase', label: 'Unicase' },
]

export const FONT_STRETCH_ICON_OPTIONS: IconRadioOption[] = [
  { value: 'ultra-condensed', label: '极窄' },
  { value: 'extra-condensed', label: '特窄' },
  { value: 'condensed', label: '窄' },
  { value: 'semi-condensed', label: '略窄' },
  { value: 'normal', label: '正常' },
  { value: 'semi-expanded', label: '略宽' },
  { value: 'expanded', label: '宽' },
  { value: 'extra-expanded', label: '特宽' },
  { value: 'ultra-expanded', label: '极宽' },
]

export const FONT_KERNING_ICON_OPTIONS: IconRadioOption[] = [
  { value: 'auto', label: '自动' },
  { value: 'normal', label: '正常' },
  { value: 'none', label: '关闭' },
]

export const FONT_SYNTHESIS_ICON_OPTIONS: FontSynthesisIconOption[] = [
  { value: 'weight style', label: '字重 + 字形', glyph: 'BI' },
  { value: 'none', label: '不合成', glyph: '—' },
  { value: 'weight', label: '仅字重', glyph: 'B' },
  { value: 'style', label: '仅字形', glyph: 'I' },
]

export const FONT_OPTICAL_SIZING_ICON_OPTIONS: IconRadioOption[] = [
  { value: 'auto', label: '自动' },
  { value: 'none', label: '关闭' },
]

export const FONT_CSS_GLYPH_ICON_RADIO_CONFIG: Record<string, FontCssGlyphIconRadioConfig> = {
  fontStyle: { options: FONT_STYLE_ICON_OPTIONS, glyph: 'A' },
  fontVariant: { options: FONT_VARIANT_ICON_OPTIONS, glyph: 'Aa' },
  fontStretch: { options: FONT_STRETCH_ICON_OPTIONS, glyph: 'A' },
  fontKerning: { options: FONT_KERNING_ICON_OPTIONS, glyph: 'AV' },
  fontOpticalSizing: { options: FONT_OPTICAL_SIZING_ICON_OPTIONS, glyph: 'A' },
}

const FONT_ICON_RADIO_KEYS = new Set<string>([
  'textTransform',
  'textDecorationLine',
  'textDecorationStyle',
  'fontSmooth',
  'fontSynthesis',
  ...Object.keys(FONT_CSS_GLYPH_ICON_RADIO_CONFIG),
])

export function isFontIconRadioKey(key: string): boolean {
  return FONT_ICON_RADIO_KEYS.has(key)
}

export function getIconEnumOptions(iconEnumKey: string): IconRadioOption[] | undefined {
  if (iconEnumKey === 'textTransform') return TEXT_TRANSFORM_ICON_OPTIONS
  if (iconEnumKey === 'textDecorationLine') return TEXT_DECORATION_LINE_ICON_OPTIONS
  if (iconEnumKey === 'textDecorationStyle') return TEXT_DECORATION_STYLE_ICON_OPTIONS
  if (iconEnumKey === 'fontStyle') return FONT_STYLE_ICON_OPTIONS
  if (iconEnumKey === 'fontVariant') return FONT_VARIANT_ICON_OPTIONS
  if (iconEnumKey === 'fontStretch') return FONT_STRETCH_ICON_OPTIONS
  if (iconEnumKey === 'fontKerning') return FONT_KERNING_ICON_OPTIONS
  if (iconEnumKey === 'fontSmooth') return FONT_SMOOTH_ICON_OPTIONS
  return undefined
}

export function getFontCssGlyphIconConfig(key: string): FontCssGlyphIconRadioConfig | undefined {
  return FONT_CSS_GLYPH_ICON_RADIO_CONFIG[key]
}

function cssPropertyToStyleKey(cssProperty: string): string {
  const vendorMatch = cssProperty.match(/^-(webkit|moz|ms|o)-(.+)$/)
  if (vendorMatch) {
    const rest = vendorMatch[2].replace(/-([a-z])/g, (_, char: string) => char.toUpperCase())
    const prefix = vendorMatch[1].charAt(0).toUpperCase() + vendorMatch[1].slice(1)
    return prefix + rest.charAt(0).toUpperCase() + rest.slice(1)
  }
  return cssProperty.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase())
}

export function cssPropertyPreviewStyle(cssProperty: string, value: string): Record<string, string> {
  return { [cssPropertyToStyleKey(cssProperty)]: value }
}

export function textDecorationLinePreviewStyle(value: string): Record<string, string> {
  return { textDecorationLine: value }
}

export function fontSmoothPreviewStyle(value: string): Record<string, string> {
  if (value === 'antialiased') return { WebkitFontSmoothing: 'antialiased' }
  if (value === 'subpixel-antialiased') return { WebkitFontSmoothing: 'subpixel-antialiased' }
  return { WebkitFontSmoothing: 'auto' }
}
