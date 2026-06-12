import type { DesignTokenValues } from './designTokenDefs'
import { DESIGN_TOKEN_DEFS } from './designTokenDefs'

/** 色板页 — 功能色列（设计稿 5 列） */
export interface FunctionalColorColumnDef {
  id: string
  title: string
  tokenKey: keyof DesignTokenValues
  /** 有独立色阶 override 槽位时使用，如 brand-1…10 */
  scalePrefix?: string
}

export const FUNCTIONAL_COLOR_COLUMNS: FunctionalColorColumnDef[] = [
  { id: 'primary', title: 'Primary', tokenKey: 'brandColor', scalePrefix: 'brand' },
  { id: 'success', title: 'Success', tokenKey: 'successColor' },
  { id: 'warning', title: 'Warning', tokenKey: 'warningColor' },
  { id: 'danger', title: 'Danger', tokenKey: 'errorColor' },
  { id: 'info', title: 'Info', tokenKey: 'infoColor' },
]

/** Primary × Info 混合中性色 — 参考端点（展示用） */
export const PRIMARY_INFO_NEUTRAL_ENDPOINTS = {
  primary: { label: 'Primary', tokenKey: 'brandColor' as const },
  info: { label: 'Info', tokenKey: 'infoColor' as const },
}

export function tokenCssVar(tokenKey: keyof DesignTokenValues): string {
  return DESIGN_TOKEN_DEFS.find((d) => d.key === tokenKey)?.cssVar ?? ''
}

/** 功能色色阶行对应的 CSS 变量名（与品牌色阶命名对齐） */
export function paletteScaleCssVar(col: FunctionalColorColumnDef, step: number): string {
  if (col.scalePrefix === 'brand') return `--td-brand-color-${step}`
  if (col.id === 'info') return `--flow-info-color-${step}`
  const kind = col.id === 'danger' ? 'error' : col.id
  return `--td-${kind}-color-${step}`
}
