import {
  BACKGROUND_COLOR_TOKENS,
  FONT_SIZE_TOKENS,
  FONT_WEIGHT_TOKENS,
  TEXT_COLOR_TOKENS,
  type TokenOption,
  valueForTokenPreset,
} from '../editor/tokenBindLogic'

export interface LogicStylePropertySpec {
  id: string
  label: string
  type?: 'token' | 'number' | 'select' | 'text'
  tokenOptions?: TokenOption[]
  selectOptions?: { value: string; label: string }[]
  placeholder?: string
}

/** 交互逻辑可用的样式属性（子集，非组件样式模式全量树） */
export const LOGIC_STYLE_PROPERTIES: LogicStylePropertySpec[] = [
  { id: 'color', label: '文字颜色', type: 'token', tokenOptions: TEXT_COLOR_TOKENS },
  { id: 'background-color', label: '背景色', type: 'token', tokenOptions: BACKGROUND_COLOR_TOKENS },
  { id: 'opacity', label: '透明度', type: 'number', placeholder: '0 ~ 1' },
  { id: 'border-radius', label: '圆角', type: 'text', placeholder: '如 8px' },
  { id: 'font-size', label: '字号', type: 'token', tokenOptions: FONT_SIZE_TOKENS },
  { id: 'font-weight', label: '字重', type: 'token', tokenOptions: FONT_WEIGHT_TOKENS },
  {
    id: 'visibility',
    label: '可见性',
    type: 'select',
    selectOptions: [
      { value: 'visible', label: '可见' },
      { value: 'hidden', label: '隐藏' },
    ],
  },
  {
    id: 'display',
    label: '显示',
    type: 'select',
    selectOptions: [
      { value: 'none', label: 'none' },
      { value: 'block', label: 'block' },
      { value: 'flex', label: 'flex' },
      { value: 'inline-block', label: 'inline-block' },
    ],
  },
  { id: 'transform', label: '变换', type: 'text', placeholder: '如 scale(1.05)' },
]

export function getLogicStylePropertySpec(prop: string): LogicStylePropertySpec | undefined {
  return LOGIC_STYLE_PROPERTIES.find((p) => p.id === prop)
}

/** token payload：`prop|value`，允许为空 */
export function encodeStyleTokenPayload(prop: string, value: string): string {
  return `${prop}|${value}`
}

export function parseStyleTokenPayload(payload: string): { prop: string; value: string } {
  const idx = payload.indexOf('|')
  if (idx < 0) return { prop: payload.trim(), value: '' }
  return {
    prop: payload.slice(0, idx).trim(),
    value: payload.slice(idx + 1).trim(),
  }
}

export function isStyleTokenFilled(prop: string, value: string): boolean {
  return !!prop.trim() && !!value.trim()
}

export function styleTokenChipLabel(prop: string, value: string): string {
  if (!isStyleTokenFilled(prop, value)) return '样式…'
  const spec = getLogicStylePropertySpec(prop)
  const propLabel = spec?.label ?? prop
  const shortVal = value.length > 18 ? `${value.slice(0, 16)}…` : value
  return `${propLabel}: ${shortVal}`
}

function escapeJsString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

/** 展开为 handler 内对触发元素的 style 写入 */
export function expandStyleTokenToCode(prop: string, value: string): string {
  if (!isStyleTokenFilled(prop, value)) return '/* 样式未配置 */'
  const safeProp = prop.replace(/[^a-z0-9-]/gi, '')
  const safeVal = escapeJsString(value)
  return `(event.target as HTMLElement).style.setProperty('${safeProp}', '${safeVal}')`
}

export function resolveStyleValueFromPreset(
  prop: string,
  presetId: string,
  customValue: string,
): string {
  const spec = getLogicStylePropertySpec(prop)
  if (spec?.tokenOptions) {
    return valueForTokenPreset(presetId, spec.tokenOptions, customValue)
  }
  return customValue.trim()
}
