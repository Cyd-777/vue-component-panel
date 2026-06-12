import type { StylePresetProperties } from './stylePresetDefs'

/** 不参与基础 transition 规则、仅用于 :hover transform 的预设字段 */
export const MOTION_HOVER_TRANSFORM_KEY = 'hover-transform'

export const MOTION_META_PROPERTY_KEYS = new Set<string>([MOTION_HOVER_TRANSFORM_KEY])

export interface MotionTimingOption {
  id: string
  label: string
  cssValue: string
  hint?: string
}

export const MOTION_TIMING_OPTIONS: MotionTimingOption[] = [
  { id: 'ease-out', label: 'Ease Out', cssValue: 'ease-out', hint: '悬停、进入结束' },
  { id: 'ease-in', label: 'Ease In', cssValue: 'ease-in', hint: '离开、进入开始' },
  { id: 'ease-in-out', label: 'Ease In Out', cssValue: 'ease-in-out' },
  { id: 'ease', label: 'Ease', cssValue: 'ease' },
  { id: 'linear', label: 'Linear', cssValue: 'linear' },
  {
    id: 'standard',
    label: 'Standard',
    cssValue: 'cubic-bezier(0.38, 0, 0.24, 1)',
    hint: 'TDesign 标准曲线',
  },
  {
    id: 'decelerate',
    label: 'Decelerate',
    cssValue: 'cubic-bezier(0, 0, 0.15, 1)',
    hint: '减速进入',
  },
  {
    id: 'accelerate',
    label: 'Accelerate',
    cssValue: 'cubic-bezier(0.38, 0, 1, 1)',
    hint: '加速离开',
  },
]

/** @deprecated 使用 option id；保留类型别名供画板属性面板 select 使用 */
export type MotionTimingId = (typeof MOTION_TIMING_OPTIONS)[number]['id']

export const MOTION_DURATION_PRESETS: { id: string; label: string; ms: number }[] = [
  { id: 'instant', label: '关闭', ms: 0 },
  { id: 'fast', label: '快 120', ms: 120 },
  { id: 'base', label: '默认 150', ms: 150 },
  { id: 'medium', label: '中 240', ms: 240 },
  { id: 'slow', label: '慢 400', ms: 400 },
]

export type MotionPropertyPresetId = 'all' | 'colors' | 'transform' | 'opacity' | 'custom'

export const MOTION_PROPERTY_PRESETS: {
  id: MotionPropertyPresetId
  label: string
  value?: string
  hint?: string
}[] = [
  { id: 'all', label: '全部', value: 'all', hint: '所有可过渡属性' },
  { id: 'colors', label: '颜色', value: 'color, background-color, border-color', hint: '文字/背景/边框色' },
  { id: 'transform', label: '变换', value: 'transform', hint: '位移、缩放、旋转' },
  { id: 'opacity', label: '透明度', value: 'opacity' },
  { id: 'custom', label: '自定义' },
]

export type MotionMovePresetId = 'none' | 'lift' | 'sink' | 'scale-up' | 'scale-down' | 'custom'

export const MOTION_MOVE_PRESETS: {
  id: MotionMovePresetId
  label: string
  value: string
  hint?: string
}[] = [
  { id: 'none', label: '无', value: 'none' },
  { id: 'lift', label: '上浮', value: 'translateY(-4px)', hint: '悬停抬起' },
  { id: 'sink', label: '下沉', value: 'translateY(2px)' },
  { id: 'scale-up', label: '放大', value: 'scale(1.04)' },
  { id: 'scale-down', label: '缩小', value: 'scale(0.96)' },
  { id: 'custom', label: '自定义', value: '' },
]

export interface CubicBezierPoints {
  x1: number
  y1: number
  x2: number
  y2: number
}

const KEYWORD_BEZIER: Record<string, CubicBezierPoints> = {
  ease: { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 },
  'ease-in': { x1: 0.42, y1: 0, x2: 1, y2: 1 },
  'ease-out': { x1: 0, y1: 0, x2: 0.58, y2: 1 },
  'ease-in-out': { x1: 0.42, y1: 0, x2: 0.58, y2: 1 },
  linear: { x1: 0, y1: 0, x2: 1, y2: 1 },
}

const CUBIC_BEZIER_RE =
  /^cubic-bezier\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)$/i

export function clampBezierUnit(n: number): number {
  return Math.min(1, Math.max(0, Math.round(n * 1000) / 1000))
}

export function parseCubicBezier(raw: string): CubicBezierPoints | null {
  const trimmed = raw.trim()
  const m = trimmed.match(CUBIC_BEZIER_RE)
  if (m) {
    return {
      x1: clampBezierUnit(Number(m[1])),
      y1: Number(m[2]),
      x2: clampBezierUnit(Number(m[3])),
      y2: Number(m[4]),
    }
  }
  const keyword = KEYWORD_BEZIER[trimmed]
  return keyword ? { ...keyword } : null
}

export function formatCubicBezier(points: CubicBezierPoints): string {
  const { x1, y1, x2, y2 } = points
  return `cubic-bezier(${clampBezierUnit(x1)}, ${y1}, ${clampBezierUnit(x2)}, ${y2})`
}

export function timingToBezierPoints(raw: string): CubicBezierPoints {
  const opt = findMotionTimingOption(raw)
  if (opt) {
    const fromCss = parseCubicBezier(opt.cssValue)
    if (fromCss) return fromCss
  }
  return parseCubicBezier(raw) ?? { ...KEYWORD_BEZIER.ease }
}

export function findMotionTimingOption(raw: string): MotionTimingOption | undefined {
  const trimmed = raw.trim()
  return MOTION_TIMING_OPTIONS.find((o) => o.cssValue === trimmed || o.id === trimmed)
}

export function normalizeMotionTimingValue(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return 'ease'
  if (findMotionTimingOption(trimmed)) return findMotionTimingOption(trimmed)!.cssValue
  if (parseCubicBezier(trimmed)) return trimmed
  if (KEYWORD_BEZIER[trimmed]) return trimmed
  return trimmed
}

export function motionTimingOptionId(raw: string): string {
  return findMotionTimingOption(raw)?.id ?? 'custom'
}

export function motionPropertyPresetLabel(raw: string): string {
  const preset = MOTION_PROPERTY_PRESETS.find((p) => p.id !== 'custom' && p.value === raw)
  if (preset) return preset.label
  if (raw === 'all' || !raw) return '全部'
  return raw
}

export function motionTimingLabel(raw: string): string {
  const opt = findMotionTimingOption(raw)
  if (opt) return opt.label
  if (parseCubicBezier(raw)) return 'Custom Bezier'
  return raw
}

export function motionMovePresetId(raw: string): MotionMovePresetId {
  const trimmed = raw.trim()
  const preset = MOTION_MOVE_PRESETS.find((p) => p.id !== 'custom' && p.value === trimmed)
  if (preset) return preset.id
  if (!trimmed || trimmed === 'none') return 'none'
  return 'custom'
}

export function motionMovePresetLabel(raw: string): string {
  const id = motionMovePresetId(raw)
  return MOTION_MOVE_PRESETS.find((p) => p.id === id)?.label ?? raw
}

export function resolveHoverTransform(raw: string | undefined): string {
  const trimmed = (raw ?? 'none').trim()
  return trimmed || 'none'
}

export function formatMotionTransitionCss(properties: StylePresetProperties): string {
  const prop = properties['transition-property'] ?? 'all'
  const duration = properties['transition-duration'] ?? '150ms'
  const timing = normalizeMotionTimingValue(properties['transition-timing-function'] ?? 'ease')
  const delay = properties['transition-delay'] ?? '0ms'
  const delayMs = parseFloat(delay)
  if (delayMs > 0) return `${prop} ${duration} ${timing} ${delay}`
  return `${prop} ${duration} ${timing}`
}

export function formatMotionPresetSummary(properties: StylePresetProperties): string {
  const prop = properties['transition-property'] ?? 'all'
  const duration = properties['transition-duration'] ?? '150ms'
  const timing = normalizeMotionTimingValue(properties['transition-timing-function'] ?? 'ease')
  const delay = properties['transition-delay'] ?? '0ms'
  const delayMs = parseFloat(delay)
  const move = resolveHoverTransform(properties[MOTION_HOVER_TRANSFORM_KEY])

  let summary = `${motionPropertyPresetLabel(prop)} · ${duration} · ${motionTimingLabel(timing)}`
  if (delayMs > 0) summary += ` · 延迟 ${delay}`
  if (move !== 'none') summary += ` · ${motionMovePresetLabel(move)}`
  return summary
}

export function motionPropertiesToBaseCss(properties: StylePresetProperties): Record<string, string> {
  return Object.fromEntries(
    Object.entries(properties).filter(([key]) => !MOTION_META_PROPERTY_KEYS.has(key)),
  )
}
