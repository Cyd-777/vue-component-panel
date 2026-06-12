/** 效果预设分组 — 三梯队示例卡片 + 全局绑定用 card / popup / control */

import {
  defaultVisualEffectConfig,
  visualEffectConfigToStylePresetProperties,
  type BackgroundParams,
  type BorderParams,
  type RadiusParams,
  type ShadowParams,
  type VisualEffectConfig,
} from './visualEffectConfig'
import type { StylePreset } from './stylePresetDefs'

/** 系统内置效果预设 id（含全局设置默认引用） */
export const CANONICAL_EFFECT_PRESET_IDS = [
  'card',
  'popup',
  'control',
  'effect-soft-blur',
  'effect-inset',
  'effect-disabled',
  'effect-glass',
  'effect-gradient',
  'effect-avatar',
  'effect-dashed',
  'effect-photo',
  'effect-icon-tilt',
] as const

export type CanonicalEffectPresetId = (typeof CANONICAL_EFFECT_PRESET_IDS)[number]

type EffectPresetPartial = Partial<Omit<VisualEffectConfig, 'shadow' | 'borderRadius' | 'background' | 'border'>> & {
  shadow?: Partial<ShadowParams>
  borderRadius?: Partial<RadiusParams>
  background?: Partial<BackgroundParams>
  border?: Partial<BorderParams>
}

type EffectPresetDef = {
  id: CanonicalEffectPresetId
  name: string
  partial: EffectPresetPartial
}

const EFFECT_PRESET_DEFS: EffectPresetDef[] = [
  {
    id: 'card',
    name: '卡片',
    partial: {
      shadow: { mode: 'token', tokenLevel: '1' },
      borderRadius: { linked: true, all: 8, topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 },
      background: { kind: 'solid', solid: 'var(--td-bg-color-container)' },
      border: { style: 'none', width: 0, color: 'transparent', sidesIndependent: false, topWidth: 0, rightWidth: 0, bottomWidth: 0, leftWidth: 0 },
    },
  },
  {
    id: 'popup',
    name: '弹层',
    partial: {
      shadow: { mode: 'token', tokenLevel: '3' },
      borderRadius: { linked: true, all: 12, topLeft: 12, topRight: 12, bottomRight: 12, bottomLeft: 12 },
      background: { kind: 'solid', solid: 'var(--td-bg-color-container)' },
      border: { style: 'none', width: 0, color: 'transparent', sidesIndependent: false, topWidth: 0, rightWidth: 0, bottomWidth: 0, leftWidth: 0 },
    },
  },
  {
    id: 'control',
    name: '控件',
    partial: {
      shadow: { mode: 'none', tokenLevel: '1' },
      borderRadius: { linked: true, all: 6, topLeft: 6, topRight: 6, bottomRight: 6, bottomLeft: 6 },
      background: { kind: 'solid', solid: 'var(--td-bg-color-container)' },
      border: { style: 'solid', color: 'var(--td-component-border)', width: 1, sidesIndependent: false, topWidth: 1, rightWidth: 1, bottomWidth: 1, leftWidth: 1 },
    },
  },
  {
    id: 'effect-soft-blur',
    name: '模糊占位',
    partial: {
      shadow: { mode: 'none', tokenLevel: '1' },
      blur: 6,
      opacity: 0.65,
      borderRadius: { linked: true, all: 6, topLeft: 6, topRight: 6, bottomRight: 6, bottomLeft: 6 },
      background: { kind: 'solid', solid: 'var(--td-bg-color-secondarycontainer)' },
    },
  },
  {
    id: 'effect-inset',
    name: '内阴影',
    partial: {
      shadow: {
        mode: 'custom',
        tokenLevel: '1',
        inset: true,
        offsetX: 0,
        offsetY: 2,
        blurRadius: 8,
        spreadRadius: 0,
        color: 'rgba(0, 0, 0, 0.12)',
      },
      borderRadius: { linked: true, all: 8, topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 },
      background: { kind: 'solid', solid: 'var(--td-bg-color-secondarycontainer)' },
    },
  },
  {
    id: 'effect-disabled',
    name: '禁用态',
    partial: {
      shadow: { mode: 'none', tokenLevel: '1' },
      opacity: 0.45,
      grayscale: 100,
      borderRadius: { linked: true, all: 6, topLeft: 6, topRight: 6, bottomRight: 6, bottomLeft: 6 },
      background: { kind: 'solid', solid: 'var(--td-bg-color-container)' },
      border: { style: 'solid', color: 'var(--td-component-border)', width: 1, sidesIndependent: false, topWidth: 1, rightWidth: 1, bottomWidth: 1, leftWidth: 1 },
    },
  },
  {
    id: 'effect-glass',
    name: '毛玻璃',
    partial: {
      shadow: { mode: 'token', tokenLevel: '2' },
      backdropBlur: 12,
      borderRadius: { linked: true, all: 12, topLeft: 12, topRight: 12, bottomRight: 12, bottomLeft: 12 },
      background: { kind: 'solid', solid: 'rgba(255, 255, 255, 0.55)' },
      border: { style: 'solid', color: 'rgba(255, 255, 255, 0.45)', width: 1, sidesIndependent: false, topWidth: 1, rightWidth: 1, bottomWidth: 1, leftWidth: 1 },
    },
  },
  {
    id: 'effect-gradient',
    name: '品牌渐变',
    partial: {
      shadow: { mode: 'token', tokenLevel: '1' },
      borderRadius: { linked: true, all: 10, topLeft: 10, topRight: 10, bottomRight: 10, bottomLeft: 10 },
      background: {
        kind: 'linear',
        solid: 'transparent',
        angle: 135,
        stop1Color: 'var(--td-brand-color)',
        stop1Pos: 0,
        stop2Color: 'var(--td-brand-color-8)',
        stop2Pos: 100,
        radialShape: 'circle',
      },
    },
  },
  {
    id: 'effect-avatar',
    name: '圆形头像',
    partial: {
      shadow: { mode: 'token', tokenLevel: '1' },
      clipPathPreset: 'circle',
      borderRadius: { linked: true, all: 999, topLeft: 999, topRight: 999, bottomRight: 999, bottomLeft: 999 },
      background: { kind: 'solid', solid: 'var(--td-gray-color-3)' },
      border: { style: 'solid', color: 'var(--td-bg-color-container)', width: 2, sidesIndependent: false, topWidth: 2, rightWidth: 2, bottomWidth: 2, leftWidth: 2 },
    },
  },
  {
    id: 'effect-dashed',
    name: '虚线容器',
    partial: {
      shadow: { mode: 'none', tokenLevel: '1' },
      borderRadius: { linked: true, all: 8, topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 },
      background: { kind: 'solid', solid: 'var(--td-bg-color-container)' },
      border: { style: 'dashed', color: 'var(--td-brand-color)', width: 1, sidesIndependent: false, topWidth: 1, rightWidth: 1, bottomWidth: 1, leftWidth: 1 },
    },
  },
  {
    id: 'effect-photo',
    name: '图片增强',
    partial: {
      shadow: { mode: 'token', tokenLevel: '1' },
      brightness: 108,
      contrast: 112,
      borderRadius: { linked: true, all: 4, topLeft: 4, topRight: 4, bottomRight: 4, bottomLeft: 4 },
      background: { kind: 'solid', solid: 'var(--td-gray-color-4)' },
    },
  },
  {
    id: 'effect-icon-tilt',
    name: '图标装饰',
    partial: {
      shadow: { mode: 'none', tokenLevel: '1' },
      rotate: -12,
      scale: 1.08,
      borderRadius: { linked: true, all: 8, topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 },
      background: { kind: 'solid', solid: 'var(--td-brand-color-light)' },
    },
  },
]

function buildEffectPreset(def: EffectPresetDef): StylePreset {
  const base = defaultVisualEffectConfig({ id: def.id, name: def.name })
  const { shadow, borderRadius, background, border, ...rest } = def.partial
  const config = defaultVisualEffectConfig({
    ...base,
    ...rest,
    id: def.id,
    name: def.name,
    shadow: shadow ? { ...base.shadow, ...shadow } : base.shadow,
    borderRadius: borderRadius ? { ...base.borderRadius, ...borderRadius } : base.borderRadius,
    background: background ? { ...base.background, ...background } : base.background,
    border: border ? { ...base.border, ...border } : base.border,
  })
  return {
    id: def.id,
    name: def.name,
    category: 'effect',
    properties: visualEffectConfigToStylePresetProperties(config),
  }
}

export function buildCanonicalEffectPresets(): StylePreset[] {
  return EFFECT_PRESET_DEFS.map(buildEffectPreset)
}

export interface EffectPresetGroupDef {
  id: 'core' | 'tier1' | 'tier2' | 'tier3' | 'custom'
  label: string
  description: string
  presetIds: readonly string[]
}

export const EFFECT_PRESET_GROUP_DEFS: EffectPresetGroupDef[] = [
  {
    id: 'core',
    label: '全局绑定',
    description: 'card / popup / control — 与「设置」Tab 容器效果槽位默认对应',
    presetIds: ['card', 'popup', 'control'],
  },
  {
    id: 'tier1',
    label: '第一梯队 · 通用基础',
    description: '阴影、模糊、透明度、圆角 — 各组件都可能用到',
    presetIds: ['effect-soft-blur', 'effect-inset', 'effect-disabled'],
  },
  {
    id: 'tier2',
    label: '第二梯队 · 容器装饰',
    description: '渐变、毛玻璃、裁剪、边框 — 容器与装饰类组件',
    presetIds: ['effect-glass', 'effect-gradient', 'effect-avatar', 'effect-dashed'],
  },
  {
    id: 'tier3',
    label: '第三梯队 · 特定组件',
    description: '滤镜、变换 — 图片 / 图标等场景',
    presetIds: ['effect-photo', 'effect-icon-tilt'],
  },
]

export function groupEffectPresets(presets: StylePreset[]): {
  group: EffectPresetGroupDef
  presets: StylePreset[]
}[] {
  const known = new Set<string>()
  const grouped = EFFECT_PRESET_GROUP_DEFS.map((group) => {
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
        description: '用户新建的命名效果样式',
        presetIds: [],
      },
      presets: custom,
    })
  }

  return grouped
}

/** 列表卡片预览文案 */
export function effectPresetPreviewLabel(presetId: string): string {
  const labels: Record<string, string> = {
    card: 'Card',
    popup: 'Popup',
    control: 'Ctrl',
    'effect-soft-blur': 'Blur',
    'effect-inset': 'Inset',
    'effect-disabled': 'Off',
    'effect-glass': 'Glass',
    'effect-gradient': 'Grad',
    'effect-avatar': 'Avatar',
    'effect-dashed': 'Dash',
    'effect-photo': 'Photo',
    'effect-icon-tilt': 'Icon',
  }
  return labels[presetId] ?? 'Fx'
}
