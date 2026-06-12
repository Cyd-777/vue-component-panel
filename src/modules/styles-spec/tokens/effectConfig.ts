/**
 * 动效配置模型 — 与命名预设、全局槽位、画板元素 binding 对齐
 *
 * EffectConfig 为单一真相；StylePreset.properties 通过 effect-config JSON 持久化，
 * 并与 transition-* / hover-transform 字段双向同步（兼容旧数据）。
 */
import type { StylePreset, StylePresetProperties } from './stylePresetDefs'
import {
  MOTION_HOVER_TRANSFORM_KEY,
  MOTION_META_PROPERTY_KEYS,
  normalizeMotionTimingValue,
  resolveHoverTransform,
} from './motionPresetOptions'
import type { ThemeMotionSlotKey } from './themeUsageDefs'

/** JSON 持久化键（不参与 transition 基础规则） */
export const MOTION_EFFECT_CONFIG_KEY = 'effect-config'

/** CSS 状态边界 — 值为 CSS 属性字符串或数字（会被 stringify） */
export type EffectState = Record<string, string | number>

/** 触发方式 */
export type TriggerType =
  | 'hover'
  | 'active'
  | 'focus'
  | 'enter'
  | 'exit'
  | 'expand'
  | 'scroll-into-view'
  | 'load'
  | 'manual'

/** 预设效果枚举 */
export type EffectType =
  | 'none'
  | 'fade-in'
  | 'fade-out'
  | 'blink'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'bounce-in'
  | 'scale-up'
  | 'scale-down'
  | 'pulse'
  | 'press-down'
  | 'rotate-in'
  | 'spin'
  | 'shake'
  | 'jelly'
  | 'flip'
  | 'ripple'
  | 'typewriter'
  | 'lift'
  | 'custom'

export type EffectScope = 'self' | 'children-stagger' | 'decorative-only'

export type EffectFillMode = 'none' | 'forwards' | 'backwards' | 'both'

export type EffectDirection = 'normal' | 'alternate'

export type EffectPerformanceLevel = 'performance' | 'full'

export interface EffectConfig {
  id: string
  name: string
  trigger: TriggerType
  effectType: EffectType
  duration: number
  delay: number
  endDelay?: number
  easing: string
  iterations: number | 'infinite'
  direction: EffectDirection
  initialState: EffectState
  finalState: EffectState
  threshold?: number
  scope: EffectScope
  staggerDelay?: number
  fillMode: EffectFillMode
  interruptible: boolean
  performanceLevel: EffectPerformanceLevel
}

/** 画板节点 / 组件实例 — 指定元素绑定 */
export interface ElementMotionBinding {
  /** 画板节点 tagIndex 或组件实例 id */
  targetId: string
  /** 引用命名预设 id；与 inline config 二选一，inline 优先 */
  presetId?: string
  /** 内联配置；可只填 override 字段 */
  config?: Partial<EffectConfig>
}

export const TRIGGER_TYPE_LABELS: Record<TriggerType, string> = {
  hover: '悬停 · hover',
  active: '按下 · active',
  focus: '聚焦 · focus-visible',
  enter: '进入 · enter',
  exit: '离开 · exit',
  expand: '展开 · expand',
  'scroll-into-view': '滚入视口',
  load: '加载完成',
  manual: '手动',
}

export const EFFECT_TYPE_GROUPS: {
  id: string
  label: string
  types: EffectType[]
}[] = [
  { id: 'opacity', label: '透明度', types: ['fade-in', 'fade-out', 'blink'] },
  {
    id: 'translate',
    label: '位移',
    types: ['slide-up', 'slide-down', 'slide-left', 'slide-right', 'bounce-in', 'lift'],
  },
  {
    id: 'scale',
    label: '缩放',
    types: ['scale-up', 'scale-down', 'pulse', 'press-down'],
  },
  { id: 'rotate', label: '旋转', types: ['rotate-in', 'spin', 'shake'] },
  {
    id: 'composite',
    label: '复合',
    types: ['jelly', 'flip', 'ripple', 'typewriter'],
  },
  { id: 'other', label: '其它', types: ['none', 'custom'] },
]

export const EFFECT_TYPE_LABELS: Record<EffectType, string> = {
  none: '无',
  'fade-in': '淡入',
  'fade-out': '淡出',
  blink: '闪烁',
  'slide-up': '上浮',
  'slide-down': '下浮',
  'slide-left': '左滑',
  'slide-right': '右滑',
  'bounce-in': '弹跳入场',
  'scale-up': '放大入场',
  'scale-down': '缩小退场',
  pulse: '脉冲',
  'press-down': '按压反馈',
  'rotate-in': '旋转入场',
  spin: '持续旋转',
  shake: '摇晃',
  jelly: '果冻弹跳',
  flip: '翻转卡片',
  ripple: '涟漪扩散',
  typewriter: '打字机',
  lift: '上浮（交互）',
  custom: '自定义',
}

const INTERACTION_TRIGGERS: TriggerType[] = ['hover', 'active', 'focus']
const LIFECYCLE_TRIGGERS: TriggerType[] = ['enter', 'exit', 'expand']

export function isInteractionTrigger(trigger: TriggerType): boolean {
  return INTERACTION_TRIGGERS.includes(trigger)
}

export function isLifecycleTrigger(trigger: TriggerType): boolean {
  return LIFECYCLE_TRIGGERS.includes(trigger)
}

export function themeMotionSlotToTrigger(slot: ThemeMotionSlotKey): TriggerType {
  return slot
}

export function triggerToCssPseudo(trigger: TriggerType): string | null {
  if (trigger === 'hover') return ':hover'
  if (trigger === 'active') return ':active'
  if (trigger === 'focus') return ':focus-visible'
  return null
}

/** 效果模板 — initial / final 边界 */
export function effectTemplate(type: EffectType): Pick<EffectConfig, 'initialState' | 'finalState' | 'effectType'> {
  const templates: Record<
    EffectType,
    Pick<EffectConfig, 'initialState' | 'finalState' | 'effectType'>
  > = {
    none: { effectType: 'none', initialState: {}, finalState: {} },
    custom: { effectType: 'custom', initialState: {}, finalState: {} },
    'fade-in': {
      effectType: 'fade-in',
      initialState: { opacity: 0 },
      finalState: { opacity: 1 },
    },
    'fade-out': {
      effectType: 'fade-out',
      initialState: { opacity: 1 },
      finalState: { opacity: 0 },
    },
    blink: {
      effectType: 'blink',
      initialState: { opacity: 1 },
      finalState: { opacity: 0.3 },
    },
    'slide-up': {
      effectType: 'slide-up',
      initialState: { opacity: 0, transform: 'translateY(16px)' },
      finalState: { opacity: 1, transform: 'translateY(0)' },
    },
    'slide-down': {
      effectType: 'slide-down',
      initialState: { opacity: 0, transform: 'translateY(-16px)' },
      finalState: { opacity: 1, transform: 'translateY(0)' },
    },
    'slide-left': {
      effectType: 'slide-left',
      initialState: { opacity: 0, transform: 'translateX(16px)' },
      finalState: { opacity: 1, transform: 'translateX(0)' },
    },
    'slide-right': {
      effectType: 'slide-right',
      initialState: { opacity: 0, transform: 'translateX(-16px)' },
      finalState: { opacity: 1, transform: 'translateX(0)' },
    },
    'bounce-in': {
      effectType: 'bounce-in',
      initialState: { opacity: 0, transform: 'scale(0.85)' },
      finalState: { opacity: 1, transform: 'scale(1)' },
    },
    'scale-up': {
      effectType: 'scale-up',
      initialState: { opacity: 0, transform: 'scale(0.92)' },
      finalState: { opacity: 1, transform: 'scale(1)' },
    },
    'scale-down': {
      effectType: 'scale-down',
      initialState: { opacity: 1, transform: 'scale(1)' },
      finalState: { opacity: 0, transform: 'scale(0.92)' },
    },
    pulse: {
      effectType: 'pulse',
      initialState: { transform: 'scale(1)' },
      finalState: { transform: 'scale(1.05)' },
    },
    'press-down': {
      effectType: 'press-down',
      initialState: { transform: 'scale(1)' },
      finalState: { transform: 'scale(0.97)' },
    },
    lift: {
      effectType: 'lift',
      initialState: { transform: 'translateY(0)' },
      finalState: { transform: 'translateY(-4px)' },
    },
    'rotate-in': {
      effectType: 'rotate-in',
      initialState: { opacity: 0, transform: 'rotate(-8deg)' },
      finalState: { opacity: 1, transform: 'rotate(0deg)' },
    },
    spin: {
      effectType: 'spin',
      initialState: { transform: 'rotate(0deg)' },
      finalState: { transform: 'rotate(360deg)' },
    },
    shake: {
      effectType: 'shake',
      initialState: { transform: 'translateX(0)' },
      finalState: { transform: 'translateX(-4px)' },
    },
    jelly: { effectType: 'jelly', initialState: { transform: 'scale(1)' }, finalState: { transform: 'scale(1.06)' } },
    flip: { effectType: 'flip', initialState: { transform: 'rotateY(90deg)' }, finalState: { transform: 'rotateY(0deg)' } },
    ripple: { effectType: 'ripple', initialState: { opacity: 0.4 }, finalState: { opacity: 0 } },
    typewriter: { effectType: 'typewriter', initialState: { opacity: 0 }, finalState: { opacity: 1 } },
  }
  return templates[type]
}

export function defaultEffectConfig(partial: Partial<EffectConfig> & Pick<EffectConfig, 'id' | 'name' | 'trigger'>): EffectConfig {
  const effectType = partial.effectType ?? defaultEffectTypeForTrigger(partial.trigger)
  const template = effectTemplate(effectType)
  const duration = partial.duration ?? defaultDurationForTrigger(partial.trigger)
  const easing = partial.easing ?? defaultEasingForTrigger(partial.trigger)

  return {
    id: partial.id,
    name: partial.name,
    trigger: partial.trigger,
    effectType,
    duration,
    delay: partial.delay ?? 0,
    endDelay: partial.endDelay,
    easing,
    iterations: partial.iterations ?? defaultIterationsForEffect(effectType),
    direction: partial.direction ?? (effectType === 'pulse' || effectType === 'blink' ? 'alternate' : 'normal'),
    initialState: partial.initialState ?? { ...template.initialState },
    finalState: partial.finalState ?? { ...template.finalState },
    threshold: partial.threshold,
    scope: partial.scope ?? 'self',
    staggerDelay: partial.staggerDelay,
    fillMode: partial.fillMode ?? 'forwards',
    interruptible: partial.interruptible ?? true,
    performanceLevel: partial.performanceLevel ?? defaultPerformanceForEffect(effectType),
  }
}

function defaultEffectTypeForTrigger(trigger: TriggerType): EffectType {
  const map: Partial<Record<TriggerType, EffectType>> = {
    hover: 'lift',
    active: 'press-down',
    focus: 'none',
    enter: 'fade-in',
    exit: 'fade-out',
    expand: 'slide-down',
  }
  return map[trigger] ?? 'none'
}

function defaultDurationForTrigger(trigger: TriggerType): number {
  if (trigger === 'active') return 100
  if (trigger === 'focus') return 120
  if (trigger === 'enter') return 240
  if (trigger === 'exit') return 180
  if (trigger === 'expand') return 200
  return 150
}

function defaultEasingForTrigger(trigger: TriggerType): string {
  if (trigger === 'active' || trigger === 'exit') return 'ease-in'
  if (trigger === 'enter' || trigger === 'expand' || trigger === 'hover') return 'ease-out'
  return 'ease'
}

function defaultIterationsForEffect(type: EffectType): number | 'infinite' {
  if (type === 'spin' || type === 'pulse' || type === 'blink') return 'infinite'
  return 1
}

function defaultPerformanceForEffect(type: EffectType): EffectPerformanceLevel {
  if (type === 'typewriter') return 'full'
  return 'performance'
}

/** 6 个系统预设 → EffectConfig */
export function canonicalPresetEffectConfig(presetId: string, presetName: string): EffectConfig {
  const trigger = presetId as ThemeMotionSlotKey
  return defaultEffectConfig({
    id: presetId,
    name: presetName,
    trigger,
    ...(presetId === 'hover'
      ? { effectType: 'lift', duration: 150, easing: 'ease-out' }
      : {}),
    ...(presetId === 'active'
      ? { effectType: 'press-down', duration: 100, easing: 'ease-in' }
      : {}),
    ...(presetId === 'focus'
      ? { effectType: 'none', duration: 120 }
      : {}),
    ...(presetId === 'enter'
      ? { effectType: 'fade-in', duration: 240, easing: 'ease-out' }
      : {}),
    ...(presetId === 'exit'
      ? { effectType: 'fade-out', duration: 180, easing: 'ease-in' }
      : {}),
    ...(presetId === 'expand'
      ? {
          effectType: 'slide-down',
          duration: 200,
          easing: 'ease-out',
          performanceLevel: 'full',
        }
      : {}),
  })
}

function parseMs(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback
  const n = parseFloat(raw)
  return Number.isFinite(n) ? n : fallback
}

function formatMs(ms: number): string {
  return `${Math.max(0, Math.round(ms))}ms`
}

function normalizeEffectState(state: EffectState): EffectState {
  const out: EffectState = {}
  for (const [key, val] of Object.entries(state)) {
    out[key] = typeof val === 'number' ? String(val) : val
  }
  return out
}

export function serializeEffectConfig(config: EffectConfig): string {
  return JSON.stringify(config)
}

export function parseEffectConfigJson(raw: string | undefined): EffectConfig | null {
  if (!raw?.trim()) return null
  try {
    const parsed = JSON.parse(raw) as EffectConfig
    if (!parsed || typeof parsed !== 'object' || !parsed.id || !parsed.trigger) return null
    return normalizeEffectConfig(parsed)
  } catch {
    return null
  }
}

export function applyEffectTypeToConfig(config: EffectConfig, effectType: EffectType): EffectConfig {
  const template = effectTemplate(effectType)
  return normalizeEffectConfig({
    ...config,
    effectType,
    initialState: { ...template.initialState },
    finalState: { ...template.finalState },
    iterations: defaultIterationsForEffect(effectType),
    direction: effectType === 'pulse' || effectType === 'blink' ? 'alternate' : 'normal',
    performanceLevel: defaultPerformanceForEffect(effectType),
  })
}

export function effectStateField(
  state: EffectState,
  key: string,
): string {
  const val = state[key]
  return val === undefined || val === null ? '' : String(val)
}

export function patchEffectStateField(
  state: EffectState,
  key: string,
  raw: string,
): EffectState {
  const next = { ...state }
  const trimmed = raw.trim()
  if (!trimmed) {
    delete next[key]
    return next
  }
  next[key] = trimmed
  return next
}

export function normalizeEffectConfig(
  config: Partial<EffectConfig> & Pick<EffectConfig, 'id' | 'name' | 'trigger'>,
): EffectConfig {
  return defaultEffectConfig({
    ...config,
    effectType: config.effectType ?? defaultEffectTypeForTrigger(config.trigger),
    initialState: normalizeEffectState(
      config.initialState
      ?? effectTemplate(config.effectType ?? defaultEffectTypeForTrigger(config.trigger)).initialState,
    ),
    finalState: normalizeEffectState(
      config.finalState
      ?? effectTemplate(config.effectType ?? defaultEffectTypeForTrigger(config.trigger)).finalState,
    ),
  })
}

/** 从旧版 transition + hover-transform 推断 EffectConfig */
export function inferEffectConfigFromLegacyProperties(
  presetId: string,
  presetName: string,
  properties: StylePresetProperties,
): EffectConfig {
  const trigger = (['hover', 'active', 'focus', 'enter', 'exit', 'expand'].includes(presetId)
    ? presetId
    : 'manual') as TriggerType

  const isCanonical = ['hover', 'active', 'focus', 'enter', 'exit', 'expand'].includes(presetId)
  const base = isCanonical
    ? canonicalPresetEffectConfig(presetId, presetName)
    : defaultEffectConfig({ id: presetId, name: presetName, trigger: 'manual' })

  const duration = parseMs(properties['transition-duration'], base.duration)
  const delay = parseMs(properties['transition-delay'], 0)
  const easing = normalizeMotionTimingValue(properties['transition-timing-function'] ?? base.easing)

  const hoverTransform = resolveHoverTransform(properties[MOTION_HOVER_TRANSFORM_KEY])
  let effectType = base.effectType
  let finalState = { ...base.finalState }
  let initialState = { ...base.initialState }

  if (hoverTransform !== 'none') {
    if (hoverTransform.includes('scale(0.9') || hoverTransform.includes('scale(0.97')) {
      effectType = 'press-down'
    } else if (hoverTransform.includes('translateY(-')) {
      effectType = 'lift'
    } else {
      effectType = 'custom'
    }
    initialState = { transform: 'none' }
    finalState = { transform: hoverTransform }
  }

  return normalizeEffectConfig({
    ...base,
    id: presetId,
    name: presetName,
    trigger,
    effectType,
    duration,
    delay,
    easing,
    initialState,
    finalState,
  })
}

export function readEffectConfigFromPreset(preset: StylePreset): EffectConfig {
  const embedded = parseEffectConfigJson(preset.properties[MOTION_EFFECT_CONFIG_KEY])
  if (embedded) {
    return normalizeEffectConfig({ ...embedded, id: preset.id, name: preset.name })
  }
  return inferEffectConfigFromLegacyProperties(preset.id, preset.name, preset.properties)
}

export function effectConfigToStylePresetProperties(config: EffectConfig): StylePresetProperties {
  const transitionProperty =
    config.performanceLevel === 'performance'
      ? 'transform, opacity'
      : 'all'

  const properties: StylePresetProperties = {
    'transition-property': transitionProperty,
    'transition-duration': formatMs(config.duration),
    'transition-timing-function': normalizeMotionTimingValue(config.easing),
    'transition-delay': formatMs(config.delay),
    [MOTION_EFFECT_CONFIG_KEY]: serializeEffectConfig(config),
  }

  const finalTransform = config.finalState.transform
  if (typeof finalTransform === 'string' && finalTransform && isInteractionTrigger(config.trigger)) {
    properties[MOTION_HOVER_TRANSFORM_KEY] = finalTransform
  } else {
    properties[MOTION_HOVER_TRANSFORM_KEY] = 'none'
  }

  return properties
}

export function mergeEffectConfigIntoProperties(
  presetId: string,
  presetName: string,
  properties: StylePresetProperties,
): StylePresetProperties {
  const embedded = parseEffectConfigJson(properties[MOTION_EFFECT_CONFIG_KEY])
  let config = embedded
    ? normalizeEffectConfig({ ...embedded, id: presetId, name: presetName })
    : inferEffectConfigFromLegacyProperties(presetId, presetName, properties)

  config = normalizeEffectConfig({
    ...config,
    duration: parseMs(properties['transition-duration'], config.duration),
    delay: parseMs(properties['transition-delay'], config.delay),
    easing: normalizeMotionTimingValue(
      properties['transition-timing-function'] ?? config.easing,
    ),
  })

  const hoverTransform = resolveHoverTransform(properties[MOTION_HOVER_TRANSFORM_KEY])
  if (hoverTransform !== 'none' && isInteractionTrigger(config.trigger)) {
    config = normalizeEffectConfig({
      ...config,
      finalState: { ...config.finalState, transform: hoverTransform },
    })
  }

  return { ...properties, ...effectConfigToStylePresetProperties(config) }
}

export function effectConfigSummary(config: EffectConfig): string {
  const parts = [
    EFFECT_TYPE_LABELS[config.effectType],
    `${config.duration}ms`,
    TRIGGER_TYPE_LABELS[config.trigger],
  ]
  if (config.delay > 0) parts.splice(2, 0, `延迟 ${config.delay}ms`)
  if (config.iterations === 'infinite') parts.push('∞')
  else if (config.iterations > 1) parts.push(`×${config.iterations}`)
  if (config.scope !== 'self') parts.push(config.scope)
  return parts.join(' · ')
}

export interface MotionEffectDisplay {
  summary: string
  effectLabel: string
  triggerLabel: string
  meta: string
  triggerMismatch: boolean
}

export function motionEffectDisplayFromPreset(
  preset: StylePreset,
  expectedTrigger?: TriggerType,
): MotionEffectDisplay {
  const config = readEffectConfigFromPreset(preset)
  const metaParts: string[] = []
  if (config.fillMode !== 'forwards') metaParts.push(`fill: ${config.fillMode}`)
  if (config.performanceLevel === 'performance') metaParts.push('GPU')
  if (config.interruptible === false) metaParts.push('不可打断')
  if (config.staggerDelay) metaParts.push(`stagger ${config.staggerDelay}ms`)

  return {
    summary: effectConfigSummary(config),
    effectLabel: EFFECT_TYPE_LABELS[config.effectType],
    triggerLabel: TRIGGER_TYPE_LABELS[config.trigger],
    meta: metaParts.join(' · '),
    triggerMismatch: !!expectedTrigger && config.trigger !== expectedTrigger,
  }
}

export {
  effectConfigToCssRules,
  buildEffectKeyframes,
  getEffectRenderStrategy,
  effectPreviewInlineStyle,
  effectPreviewTransform,
} from './effectTypeCss'
export type { EffectRenderStrategy } from './effectTypeCss'

/** 合并元素 binding：预设 + 内联 override */
export function resolveElementMotionBinding(
  preset: StylePreset | undefined,
  binding: ElementMotionBinding,
): EffectConfig | null {
  const base = preset ? readEffectConfigFromPreset(preset) : null
  if (!base && !binding.config) return null
  if (!binding.config) return base
  return normalizeEffectConfig({
    ...(base ?? defaultEffectConfig({
      id: binding.targetId,
      name: binding.targetId,
      trigger: binding.config.trigger ?? 'manual',
    })),
    ...binding.config,
    id: binding.config.id ?? base?.id ?? binding.targetId,
    name: binding.config.name ?? base?.name ?? binding.targetId,
    trigger: binding.config.trigger ?? base?.trigger ?? 'manual',
  })
}

/** 注册 meta 键，避免写入 transition 基础块 */
export function registerEffectConfigMetaKeys(): void {
  MOTION_META_PROPERTY_KEYS.add(MOTION_EFFECT_CONFIG_KEY)
}

registerEffectConfigMetaKeys()
