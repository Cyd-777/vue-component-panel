import {
  EFFECT_TYPE_GROUPS,
  EFFECT_TYPE_LABELS,
  TRIGGER_TYPE_LABELS,
  type EffectType,
  type TriggerType,
} from '../tokens/effectConfig'

export interface TriggerVisualOption {
  id: TriggerType
  label: string
  title: string
  icon: string
}

export interface TriggerVisualGroup {
  id: string
  label: string
  triggers: TriggerType[]
}

export interface EffectTypeVisualOption {
  id: EffectType
  label: string
  icon: string
}

export interface EffectTypeVisualGroup {
  id: string
  label: string
  options: EffectTypeVisualOption[]
}

/** 触发方式 — 紧凑标签（单选按钮用） */
export const TRIGGER_SHORT_LABELS: Record<TriggerType, string> = {
  hover: '悬停',
  active: '按下',
  focus: '聚焦',
  enter: '进入',
  exit: '离开',
  expand: '展开',
  'scroll-into-view': '滚入',
  load: '加载',
  manual: '手动',
}

/** 触发方式 — 图标 glyph */
export const TRIGGER_TYPE_ICONS: Record<TriggerType, string> = {
  hover: '↗',
  active: '●',
  focus: '◎',
  enter: '→',
  exit: '←',
  expand: '⤢',
  'scroll-into-view': '⇳',
  load: '↻',
  manual: '▶',
}

/** 效果类型 — 图标 glyph（卡片顶部展示） */
export const EFFECT_TYPE_ICONS: Record<EffectType, string> = {
  none: '—',
  'fade-in': '◐',
  'fade-out': '◑',
  blink: '✦',
  'slide-up': '↑',
  'slide-down': '↓',
  'slide-left': '←',
  'slide-right': '→',
  'bounce-in': '⤴',
  'scale-up': '⊕',
  'scale-down': '⊖',
  pulse: '◎',
  'press-down': '▾',
  'rotate-in': '↻',
  spin: '⟳',
  shake: '≋',
  jelly: '∿',
  flip: '⇄',
  ripple: '◯',
  typewriter: 'A|',
  lift: '⬆',
  custom: '✎',
}

export const TRIGGER_VISUAL_GROUPS: TriggerVisualGroup[] = [
  {
    id: 'interaction',
    label: '交互态',
    triggers: ['hover', 'active', 'focus'],
  },
  {
    id: 'lifecycle',
    label: '显隐过渡',
    triggers: ['enter', 'exit', 'expand'],
  },
  {
    id: 'advanced',
    label: '其它',
    triggers: ['scroll-into-view', 'load', 'manual'],
  },
]

export function triggerVisualOption(id: TriggerType): TriggerVisualOption {
  return {
    id,
    label: TRIGGER_SHORT_LABELS[id],
    title: TRIGGER_TYPE_LABELS[id],
    icon: TRIGGER_TYPE_ICONS[id],
  }
}

export function buildEffectTypeVisualGroups(): EffectTypeVisualGroup[] {
  return EFFECT_TYPE_GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
    options: group.types.map((typeId) => ({
      id: typeId,
      label: EFFECT_TYPE_LABELS[typeId],
      icon: EFFECT_TYPE_ICONS[typeId],
    })),
  }))
}
