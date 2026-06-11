/** 命名样式预设 — 一组 CSS 属性 + 名称，供全局样式页创建、画板引用 */

export type StylePresetCategory = 'font' | 'effect' | 'motion'

export type StylePresetProperties = Record<string, string>

export interface StylePreset {
  id: string
  name: string
  category: StylePresetCategory
  properties: StylePresetProperties
}

export type StylePresetFieldType =
  | 'string'
  | 'px'
  | 'fontWeight'
  | 'iconEnum'
  | 'synthesisEnum'
  | 'motionProperty'
  | 'motionTiming'

export interface StylePresetFieldDef {
  cssProperty: string
  label: string
  type: StylePresetFieldType
  default: string
  iconEnumKey?: string
  min?: number
  max?: number
  step?: number
  description?: string
}

export interface StylePresetSection {
  title: string
  fields: StylePresetFieldDef[]
}

export const STYLE_PRESET_CATEGORY_LABELS: Record<StylePresetCategory, string> = {
  font: '字体样式',
  effect: '视觉样式',
  motion: '动效样式',
}

const FONT_BASE_FIELDS: StylePresetFieldDef[] = [
  {
    cssProperty: 'font-family',
    label: '字体',
    type: 'string',
    default: 'PingFang SC, Microsoft YaHei, Arial, sans-serif',
  },
  {
    cssProperty: 'font-size',
    label: '字号',
    type: 'px',
    default: '14px',
    min: 8,
    max: 96,
  },
  {
    cssProperty: 'font-weight',
    label: '字重',
    type: 'fontWeight',
    default: '400',
    min: 100,
    max: 900,
    step: 100,
  },
  {
    cssProperty: 'line-height',
    label: '行高',
    type: 'px',
    default: '22px',
    min: 12,
    max: 72,
  },
  {
    cssProperty: 'letter-spacing',
    label: '字间距',
    type: 'px',
    default: '0px',
    min: -4,
    max: 20,
    step: 0.1,
  },
  {
    cssProperty: 'word-spacing',
    label: '词间距',
    type: 'px',
    default: '0px',
    min: -4,
    max: 32,
    step: 0.1,
  },
  {
    cssProperty: 'color',
    label: '颜色',
    type: 'string',
    default: 'rgba(0, 0, 0, 0.9)',
  },
  {
    cssProperty: 'text-align',
    label: '对齐',
    type: 'string',
    default: 'left',
    description: 'left / center / right / justify',
  },
]

const FONT_VARIANT_FIELDS: StylePresetFieldDef[] = [
  {
    cssProperty: 'font-style',
    label: '字形',
    type: 'iconEnum',
    default: 'normal',
    iconEnumKey: 'fontStyle',
  },
  {
    cssProperty: 'font-variant',
    label: '字体变体',
    type: 'iconEnum',
    default: 'normal',
    iconEnumKey: 'fontVariant',
  },
  {
    cssProperty: 'font-stretch',
    label: '字体拉伸',
    type: 'iconEnum',
    default: 'normal',
    iconEnumKey: 'fontStretch',
  },
  {
    cssProperty: 'font-synthesis',
    label: '字体合成',
    type: 'synthesisEnum',
    default: 'weight style',
  },
  {
    cssProperty: 'font-optical-sizing',
    label: '光学字号',
    type: 'iconEnum',
    default: 'auto',
    iconEnumKey: 'fontOpticalSizing',
  },
  {
    cssProperty: 'font-kerning',
    label: '字距调整',
    type: 'iconEnum',
    default: 'auto',
    iconEnumKey: 'fontKerning',
  },
  {
    cssProperty: 'font-feature-settings',
    label: 'OpenType 特性',
    type: 'string',
    default: 'normal',
    description: '如 "liga" 1, "kern" 1',
  },
  {
    cssProperty: 'font-variation-settings',
    label: '可变字体轴',
    type: 'string',
    default: 'normal',
    description: '如 "wght" 400, "wdth" 100',
  },
]

const FONT_DECORATION_FIELDS: StylePresetFieldDef[] = [
  {
    cssProperty: 'text-transform',
    label: '大小写',
    type: 'iconEnum',
    default: 'none',
    iconEnumKey: 'textTransform',
  },
  {
    cssProperty: 'text-decoration-line',
    label: '装饰线',
    type: 'iconEnum',
    default: 'none',
    iconEnumKey: 'textDecorationLine',
  },
  {
    cssProperty: 'text-decoration-style',
    label: '装饰样式',
    type: 'iconEnum',
    default: 'solid',
    iconEnumKey: 'textDecorationStyle',
  },
  {
    cssProperty: 'text-decoration-color',
    label: '装饰颜色',
    type: 'string',
    default: 'currentColor',
  },
  {
    cssProperty: 'text-decoration-thickness',
    label: '装饰粗细',
    type: 'string',
    default: 'auto',
    description: 'auto / from-font / 1px 等',
  },
]

const FONT_RENDER_FIELDS: StylePresetFieldDef[] = [
  {
    cssProperty: '-webkit-font-smoothing',
    label: '字体平滑',
    type: 'iconEnum',
    default: 'auto',
    iconEnumKey: 'fontSmooth',
  },
]

export const FONT_STYLE_PRESET_SECTIONS: StylePresetSection[] = [
  { title: '基础', fields: FONT_BASE_FIELDS },
  { title: '字体变体', fields: FONT_VARIANT_FIELDS },
  { title: '文本装饰', fields: FONT_DECORATION_FIELDS },
  { title: '渲染', fields: FONT_RENDER_FIELDS },
]

export const EFFECT_STYLE_PRESET_SECTIONS: StylePresetSection[] = [
  {
    title: '圆角与填充',
    fields: [
      {
        cssProperty: 'border-radius',
        label: '圆角',
        type: 'px',
        default: '6px',
        min: 0,
        max: 48,
      },
      {
        cssProperty: 'background-color',
        label: '背景色',
        type: 'string',
        default: '#FFFFFF',
      },
      {
        cssProperty: 'opacity',
        label: '不透明度',
        type: 'string',
        default: '1',
        description: '0 ~ 1 或百分比',
      },
    ],
  },
  {
    title: '描边',
    fields: [
      {
        cssProperty: 'border-width',
        label: '描边宽度',
        type: 'string',
        default: '1px',
      },
      {
        cssProperty: 'border-style',
        label: '描边样式',
        type: 'string',
        default: 'solid',
      },
      {
        cssProperty: 'border-color',
        label: '描边颜色',
        type: 'string',
        default: '#C6C6C6',
      },
      {
        cssProperty: 'outline',
        label: '外轮廓',
        type: 'string',
        default: 'none',
      },
    ],
  },
  {
    title: '效果',
    fields: [
      {
        cssProperty: 'box-shadow',
        label: '阴影',
        type: 'string',
        default: '0 2px 8px rgba(0,0,0,0.08)',
      },
      {
        cssProperty: 'filter',
        label: '滤镜',
        type: 'string',
        default: 'none',
      },
    ],
  },
]

export const MOTION_STYLE_PRESET_SECTIONS: StylePresetSection[] = [
  {
    title: '过渡',
    fields: [
      {
        cssProperty: 'transition-property',
        label: '过渡属性',
        type: 'motionProperty',
        default: 'all',
      },
      {
        cssProperty: 'transition-duration',
        label: '时长',
        type: 'px',
        default: '150ms',
        min: 0,
        max: 2000,
        step: 10,
        description: '毫秒',
      },
      {
        cssProperty: 'transition-timing-function',
        label: '缓动',
        type: 'motionTiming',
        default: 'ease',
      },
      {
        cssProperty: 'transition-delay',
        label: '延迟',
        type: 'px',
        default: '0ms',
        min: 0,
        max: 2000,
        step: 10,
        description: '毫秒',
      },
    ],
  },
]

export function getStylePresetSections(category: StylePresetCategory): StylePresetSection[] {
  if (category === 'font') return FONT_STYLE_PRESET_SECTIONS
  if (category === 'effect') return EFFECT_STYLE_PRESET_SECTIONS
  return MOTION_STYLE_PRESET_SECTIONS
}

export function getStylePresetFields(category: StylePresetCategory): StylePresetFieldDef[] {
  return getStylePresetSections(category).flatMap((s) => s.fields)
}

export function defaultStylePresetProperties(category: StylePresetCategory): StylePresetProperties {
  const fields = getStylePresetFields(category)
  return Object.fromEntries(fields.map((f) => [f.cssProperty, f.default]))
}

export function mergeStylePresetProperties(
  category: StylePresetCategory,
  properties: StylePresetProperties,
): StylePresetProperties {
  return { ...defaultStylePresetProperties(category), ...properties }
}

export function stylePresetCssClass(id: string): string {
  return `flow-style-${id}`
}

export function stylePresetCssVarPrefix(id: string): string {
  return `--flow-style-${id}`
}

function cssPropToVarSuffix(cssProperty: string): string {
  return cssProperty.replace(/^-webkit-/, 'webkit-')
}

export function stylePresetCssVars(preset: StylePreset): Record<string, string> {
  const prefix = stylePresetCssVarPrefix(preset.id)
  const vars: Record<string, string> = {}
  for (const [prop, val] of Object.entries(preset.properties)) {
    vars[`${prefix}-${cssPropToVarSuffix(prop)}`] = val
  }
  return vars
}

function cssPropertyToStyleKey(cssProperty: string): string {
  if (cssProperty.startsWith('-webkit-')) {
    const rest = cssProperty.slice(9).replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
    return `Webkit${rest.charAt(0).toUpperCase()}${rest.slice(1)}`
  }
  return cssProperty.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
}

export function presetPropertiesToInlineStyle(properties: StylePresetProperties): Record<string, string> {
  const style: Record<string, string> = {}
  for (const [prop, val] of Object.entries(properties)) {
    style[cssPropertyToStyleKey(prop)] = val
  }
  return style
}

export interface PresetPropertyEntry {
  label: string
  cssProperty: string
  value: string
}

/** 列表展示：按字段定义顺序列出样式内全部属性 */
export function listPresetPropertyEntries(
  category: StylePresetCategory,
  properties: StylePresetProperties,
): PresetPropertyEntry[] {
  return getStylePresetFields(category).map((field) => ({
    label: field.label,
    cssProperty: field.cssProperty,
    value: properties[field.cssProperty] ?? field.default,
  }))
}

export function isIconEnumField(def: StylePresetFieldDef): boolean {
  return def.type === 'iconEnum' && !!def.iconEnumKey
}

export function isSynthesisEnumField(def: StylePresetFieldDef): boolean {
  return def.type === 'synthesisEnum'
}

export function isFullWidthPresetField(def: StylePresetFieldDef): boolean {
  return (
    def.type === 'string'
    || def.type === 'iconEnum'
    || def.type === 'synthesisEnum'
    || def.type === 'motionProperty'
  )
}

/** @deprecated 使用 getStylePresetSections */
export const FONT_STYLE_PRESET_FIELDS = FONT_BASE_FIELDS
  .concat(FONT_VARIANT_FIELDS, FONT_DECORATION_FIELDS, FONT_RENDER_FIELDS)

export const EFFECT_STYLE_PRESET_FIELDS = getStylePresetFields('effect')
export const MOTION_STYLE_PRESET_FIELDS = getStylePresetFields('motion')
