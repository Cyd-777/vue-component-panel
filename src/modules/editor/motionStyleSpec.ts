/** 动效 tab · 写入 .fp-el-N { … } 基础规则（非伪类） */

export const MOTION_CSS_PROPERTIES = [
  'transition',
  'transition-property',
  'transition-duration',
  'transition-timing-function',
  'transition-delay',
  'animation',
  'animation-name',
  'animation-duration',
  'animation-timing-function',
  'animation-delay',
  'animation-iteration-count',
  'animation-direction',
  'animation-fill-mode',
] as const

export type MotionTimingId =
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'linear'

export const MOTION_TIMING_OPTIONS: { id: MotionTimingId; label: string }[] = [
  { id: 'ease', label: 'Ease' },
  { id: 'ease-in', label: 'Ease In' },
  { id: 'ease-out', label: 'Ease Out' },
  { id: 'ease-in-out', label: 'Ease In Out' },
  { id: 'linear', label: 'Linear' },
]

export type MotionPropertyPresetId = 'all' | 'colors' | 'transform' | 'opacity' | 'custom'

export const MOTION_PROPERTY_PRESETS: {
  id: MotionPropertyPresetId
  label: string
  value?: string
}[] = [
  { id: 'all', label: '全部', value: 'all' },
  { id: 'colors', label: '颜色', value: 'color, background-color, border-color' },
  { id: 'transform', label: '变换', value: 'transform' },
  { id: 'opacity', label: '透明度', value: 'opacity' },
  { id: 'custom', label: '自定义' },
]

export function isMotionCssProperty(prop: string): boolean {
  return (
    (MOTION_CSS_PROPERTIES as readonly string[]).includes(prop)
    || prop.startsWith('transition-')
    || prop.startsWith('animation-')
  )
}
