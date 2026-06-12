/** 动效预设分组 — 全局槽位 + 常用示例卡片 */

import {
  canonicalPresetEffectConfig,
  defaultEffectConfig,
  effectConfigToStylePresetProperties,
  triggerToCssPseudo,
  type EffectConfig,
  type TriggerType,
} from './effectConfig'
import type { StylePreset } from './stylePresetDefs'
import type { ThemeMotionSlotKey } from './themeUsageDefs'

const MOTION_SLOT_IDS = ['hover', 'active', 'focus', 'enter', 'exit', 'expand'] as const

/** 系统内置动效预设 id（含全局槽位与示例卡片） */
export const CANONICAL_MOTION_PRESET_IDS = [
  ...MOTION_SLOT_IDS,
  'motion-hover-scale',
  'motion-active-ripple',
  'motion-focus-pop',
  'motion-enter-slide-up',
  'motion-enter-bounce',
  'motion-exit-fade',
  'motion-exit-scale',
  'motion-loading-spin',
  'motion-attention-pulse',
  'motion-error-shake',
  'motion-success-jelly',
] as const

export type CanonicalMotionPresetId = (typeof CANONICAL_MOTION_PRESET_IDS)[number]

type MotionExampleDef = {
  id: Exclude<CanonicalMotionPresetId, ThemeMotionSlotKey>
  name: string
  trigger: TriggerType
  partial?: Partial<Omit<EffectConfig, 'id' | 'name' | 'trigger'>>
}

const MOTION_EXAMPLE_DEFS: MotionExampleDef[] = [
  {
    id: 'motion-hover-scale',
    name: '悬停微放大',
    trigger: 'hover',
    partial: {
      effectType: 'custom',
      duration: 180,
      easing: 'ease-out',
      initialState: { transform: 'scale(1)' },
      finalState: { transform: 'scale(1.04)' },
    },
  },
  {
    id: 'motion-active-ripple',
    name: '涟漪反馈',
    trigger: 'active',
    partial: {
      effectType: 'ripple',
      duration: 450,
      easing: 'ease-out',
    },
  },
  {
    id: 'motion-focus-pop',
    name: '聚焦弹出',
    trigger: 'focus',
    partial: {
      effectType: 'scale-up',
      duration: 140,
      easing: 'ease-out',
      initialState: { transform: 'scale(1)' },
      finalState: { transform: 'scale(1.02)' },
    },
  },
  {
    id: 'motion-enter-slide-up',
    name: '上浮入场',
    trigger: 'enter',
    partial: {
      effectType: 'slide-up',
      duration: 280,
      easing: 'ease-out',
    },
  },
  {
    id: 'motion-enter-bounce',
    name: '弹跳入场',
    trigger: 'enter',
    partial: {
      effectType: 'bounce-in',
      duration: 420,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
  },
  {
    id: 'motion-exit-fade',
    name: '淡出退场',
    trigger: 'exit',
    partial: {
      effectType: 'fade-out',
      duration: 200,
      easing: 'ease-in',
    },
  },
  {
    id: 'motion-exit-scale',
    name: '缩小退场',
    trigger: 'exit',
    partial: {
      effectType: 'scale-down',
      duration: 220,
      easing: 'ease-in',
    },
  },
  {
    id: 'motion-loading-spin',
    name: '加载旋转',
    trigger: 'load',
    partial: {
      effectType: 'spin',
      duration: 900,
      easing: 'linear',
      iterations: 'infinite',
    },
  },
  {
    id: 'motion-attention-pulse',
    name: '脉冲提示',
    trigger: 'manual',
    partial: {
      effectType: 'pulse',
      duration: 800,
      easing: 'ease-in-out',
      iterations: 'infinite',
      direction: 'alternate',
    },
  },
  {
    id: 'motion-error-shake',
    name: '错误摇晃',
    trigger: 'manual',
    partial: {
      effectType: 'shake',
      duration: 420,
      easing: 'ease-in-out',
      iterations: 2,
    },
  },
  {
    id: 'motion-success-jelly',
    name: '成功果冻',
    trigger: 'enter',
    partial: {
      effectType: 'jelly',
      duration: 520,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
  },
]

function buildSlotPreset(id: ThemeMotionSlotKey, name: string): StylePreset {
  const config = canonicalPresetEffectConfig(id, name)
  return {
    id,
    name,
    category: 'motion',
    properties: effectConfigToStylePresetProperties(config),
  }
}

function buildExamplePreset(def: MotionExampleDef): StylePreset {
  const config = defaultEffectConfig({
    id: def.id,
    name: def.name,
    trigger: def.trigger,
    ...def.partial,
  })
  return {
    id: def.id,
    name: def.name,
    category: 'motion',
    properties: effectConfigToStylePresetProperties(config),
  }
}

export function buildCanonicalMotionPresets(): StylePreset[] {
  return [
    buildSlotPreset('hover', '悬停过渡'),
    buildSlotPreset('active', '按下反馈'),
    buildSlotPreset('focus', '聚焦反馈'),
    buildSlotPreset('enter', '进入过渡'),
    buildSlotPreset('exit', '离开过渡'),
    buildSlotPreset('expand', '展开过渡'),
    ...MOTION_EXAMPLE_DEFS.map(buildExamplePreset),
  ]
}

export interface MotionPresetGroupDef {
  id: 'slots-interaction' | 'slots-lifecycle' | 'interaction-examples' | 'lifecycle-examples' | 'feedback-examples' | 'custom'
  label: string
  description: string
  presetIds: readonly string[]
}

export const MOTION_PRESET_GROUP_DEFS: MotionPresetGroupDef[] = [
  {
    id: 'slots-interaction',
    label: '全局槽位 · 交互态',
    description: 'hover / active / focus — 与「设置」Tab 动效槽位默认对应',
    presetIds: ['hover', 'active', 'focus'],
  },
  {
    id: 'slots-lifecycle',
    label: '全局槽位 · 显隐过渡',
    description: 'enter / exit / expand — Popup、Collapse 等生命周期',
    presetIds: ['enter', 'exit', 'expand'],
  },
  {
    id: 'interaction-examples',
    label: '交互示例',
    description: '悬停、按下、聚焦的常见微交互',
    presetIds: ['motion-hover-scale', 'motion-active-ripple', 'motion-focus-pop'],
  },
  {
    id: 'lifecycle-examples',
    label: '显隐示例',
    description: '入场、退场过渡的常见组合',
    presetIds: ['motion-enter-slide-up', 'motion-enter-bounce', 'motion-exit-fade', 'motion-exit-scale'],
  },
  {
    id: 'feedback-examples',
    label: '状态反馈',
    description: '加载、提示、错误、成功等场景',
    presetIds: ['motion-loading-spin', 'motion-attention-pulse', 'motion-error-shake', 'motion-success-jelly'],
  },
]

/** 槽位 id → 伪类（示例卡片由 trigger 推导，见 motionPresetTriggerPseudo） */
export const MOTION_PRESET_TRIGGER_PSEUDO: Partial<
  Record<string, ':hover' | ':active' | ':focus-visible'>
> = {
  hover: ':hover',
  active: ':active',
  focus: ':focus-visible',
}

const EXAMPLE_INTERACTION_PSEUDO = Object.fromEntries(
  MOTION_EXAMPLE_DEFS.flatMap((def) => {
    const pseudo = triggerToCssPseudo(def.trigger)
    if (!pseudo) return []
    return [[def.id, pseudo] as const]
  }),
) as Partial<Record<string, ':hover' | ':active' | ':focus-visible'>>

export function motionPresetTriggerPseudo(presetId: string): string | null {
  return MOTION_PRESET_TRIGGER_PSEUDO[presetId]
    ?? EXAMPLE_INTERACTION_PSEUDO[presetId]
    ?? null
}

export function groupMotionPresets(presets: StylePreset[]): {
  group: MotionPresetGroupDef
  presets: StylePreset[]
}[] {
  const known = new Set<string>()
  const grouped = MOTION_PRESET_GROUP_DEFS.map((group) => {
    const matched = group.presetIds
      .map((id) => presets.find((p) => p.id === id))
      .filter((p): p is StylePreset => !!p)
    matched.forEach((p) => known.add(p.id))
    return { group, presets: matched }
  })

  const custom = presets.filter((p) => !known.has(p.id))
  if (custom.length) {
    grouped.push({
      group: {
        id: 'custom',
        label: '自定义',
        description: '用户新建的命名动效样式',
        presetIds: [],
      },
      presets: custom,
    })
  }

  return grouped
}

export function motionSlotLabel(slot: ThemeMotionSlotKey): string {
  const labels: Record<ThemeMotionSlotKey, string> = {
    hover: '悬停',
    active: '按下',
    focus: '聚焦',
    enter: '进入',
    exit: '离开',
    expand: '展开',
  }
  return labels[slot]
}

/** 列表卡片预览短文案 */
export function motionPresetPreviewLabel(presetId: string): string {
  const labels: Record<string, string> = {
    hover: 'Hover',
    active: 'Press',
    focus: 'Focus',
    enter: 'Enter',
    exit: 'Exit',
    expand: 'Expand',
    'motion-hover-scale': 'Scale',
    'motion-active-ripple': 'Ripple',
    'motion-focus-pop': 'Pop',
    'motion-enter-slide-up': 'Slide',
    'motion-enter-bounce': 'Bounce',
    'motion-exit-fade': 'Fade',
    'motion-exit-scale': 'Shrink',
    'motion-loading-spin': 'Spin',
    'motion-attention-pulse': 'Pulse',
    'motion-error-shake': 'Shake',
    'motion-success-jelly': 'Jelly',
  }
  return labels[presetId] ?? 'Motion'
}
