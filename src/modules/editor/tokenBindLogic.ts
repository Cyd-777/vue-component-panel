/**
 * 属性面板 — 全局 design token 绑定（var(--td-*)）
 */
import { SHADOW_TOKENS } from './designTokens'

export interface TokenOption {
  id: string
  label: string
  cssVar?: string
}

export const BACKGROUND_COLOR_TOKENS: TokenOption[] = [
  { id: 'none', label: '无' },
  { id: 'bg-container', label: '容器背景', cssVar: '--td-bg-color-container' },
  { id: 'bg-page', label: '页面背景', cssVar: '--td-bg-color-page' },
  { id: 'brand', label: '品牌色', cssVar: '--td-brand-color' },
  { id: 'brand-light', label: '品牌浅色', cssVar: '--td-brand-color-light' },
  { id: 'custom', label: '自定义' },
]

export const TEXT_COLOR_TOKENS: TokenOption[] = [
  { id: 'text-primary', label: '主文字', cssVar: '--td-text-color-primary' },
  { id: 'text-secondary', label: '次要文字', cssVar: '--td-text-color-secondary' },
  { id: 'brand', label: '品牌色', cssVar: '--td-brand-color' },
  { id: 'success', label: '成功色', cssVar: '--td-success-color' },
  { id: 'warning', label: '警告色', cssVar: '--td-warning-color' },
  { id: 'error', label: '错误色', cssVar: '--td-error-color' },
  { id: 'custom', label: '自定义' },
]

export const BORDER_COLOR_TOKENS: TokenOption[] = [
  { id: 'border', label: '组件边框', cssVar: '--td-component-border' },
  { id: 'brand', label: '品牌色', cssVar: '--td-brand-color' },
  { id: 'text-primary', label: '主文字', cssVar: '--td-text-color-primary' },
  { id: 'custom', label: '自定义' },
]

export const FONT_SIZE_TOKENS: TokenOption[] = [
  { id: 'body', label: '正文', cssVar: '--td-font-size-body-medium' },
  { id: 'title', label: '标题', cssVar: '--td-font-size-title-medium' },
  { id: 'headline', label: '大标题', cssVar: '--td-font-size-headline-small' },
  { id: 'custom', label: '自定义' },
]

export const FONT_FAMILY_TOKENS: TokenOption[] = [
  { id: 'inherit', label: '继承' },
  { id: 'global', label: '全局字体', cssVar: '--td-font-family' },
  { id: 'custom', label: '自定义' },
]

export const FONT_WEIGHT_TOKENS: TokenOption[] = [
  { id: '400', label: '常规' },
  { id: '500', label: '中等' },
  { id: '600', label: '半粗' },
  { id: '700', label: '粗体' },
  { id: 'token-regular', label: 'Token 常规', cssVar: '--flow-font-weight-regular' },
  { id: 'token-semibold', label: 'Token 半粗', cssVar: '--flow-font-weight-semibold' },
  { id: 'custom', label: '自定义' },
]

/** 与全局样式「样式」tab 圆角 token 对齐 */
export const RADIUS_TOKENS: TokenOption[] = [
  { id: 'none', label: '无' },
  { id: 'radius-small', label: '小圆角', cssVar: '--td-radius-small' },
  { id: 'radius-default', label: '默认圆角', cssVar: '--td-radius-default' },
  { id: 'radius-medium', label: '中圆角', cssVar: '--td-radius-medium' },
  { id: 'radius-large', label: '大圆角', cssVar: '--td-radius-large' },
  { id: 'custom', label: '自定义' },
]

export const TEXT_DECORATIONS = [
  { value: 'none', label: '无' },
  { value: 'underline', label: '下划线' },
  { value: 'line-through', label: '删除线' },
] as const

export function formatCssVar(token: string): string {
  return `var(${token})`
}

export function detectTokenPreset(raw: string, options: TokenOption[]): string {
  const v = raw.trim()
  if (!v) return options[0]?.id ?? 'custom'
  for (const opt of options) {
    if (!opt.cssVar) continue
    if (v === formatCssVar(opt.cssVar)) return opt.id
  }
  return 'custom'
}

export function valueForTokenPreset(
  presetId: string,
  options: TokenOption[],
  custom: string,
): string {
  if (presetId === 'none') return ''
  if (presetId === 'inherit') return ''
  if (presetId === 'custom') return custom.trim()
  const opt = options.find((o) => o.id === presetId)
  return opt?.cssVar ? formatCssVar(opt.cssVar) : custom.trim()
}

/** 阴影 token 检测（含字面量与 var） */
export function detectShadowTokenPreset(boxShadow: string): string {
  const v = boxShadow.trim()
  if (!v || v === 'none') return 'none'
  for (const t of SHADOW_TOKENS) {
    if (v === t.value || v === formatCssVar(t.token)) return t.id
  }
  return 'custom'
}

export function spanFontSizeDisplay(raw: string): string {
  if (!raw) return ''
  const m = raw.match(/^var\((--[\w-]+)\)$/)
  if (m) return raw
  const px = parseFloat(raw)
  if (raw.endsWith('px') && Number.isFinite(px)) return String(Math.round(px))
  return raw
}

export function detectFontSizePreset(raw: string): string {
  return detectTokenPreset(raw, FONT_SIZE_TOKENS)
}

export function detectFontFamilyPreset(raw: string): string {
  if (!raw.trim()) return 'inherit'
  return detectTokenPreset(raw, FONT_FAMILY_TOKENS)
}

export function detectFontWeightPreset(raw: string): string {
  const v = raw.trim() || '400'
  for (const opt of FONT_WEIGHT_TOKENS) {
    if (opt.id === 'custom') continue
    if (opt.cssVar && v === formatCssVar(opt.cssVar)) return opt.id
    if (!opt.cssVar && v === opt.id) return opt.id
  }
  return 'custom'
}
