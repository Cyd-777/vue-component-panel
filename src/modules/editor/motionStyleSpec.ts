/** 动效 tab · 写入 .fp-el-N { … } 基础规则（非伪类） */

export {
  MOTION_PROPERTY_PRESETS,
  MOTION_TIMING_OPTIONS,
  motionTimingOptionId,
  type MotionPropertyPresetId,
  type MotionTimingId,
} from '../styles-spec/publicApi'

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

export function isMotionCssProperty(prop: string): boolean {
  return (
    (MOTION_CSS_PROPERTIES as readonly string[]).includes(prop)
    || prop.startsWith('transition-')
    || prop.startsWith('animation-')
  )
}
