import type { ComponentThemeId } from './componentThemeBindingDefs'

/** 绑定档案 — 见 docs/COMPONENT_THEME_ADAPTATION.md §二 */
export type ComponentBindingProfile = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

export const PROFILE_LABELS: Record<ComponentBindingProfile, string> = {
  A: 'Profile A · 多语义',
  B: 'Profile B · 表单态',
  C: 'Profile C · 双态',
  D: 'Profile D · 容器面',
  E: 'Profile E · 文本链',
  F: 'Profile F · 极简',
}

export const PROFILE_HINTS: Record<ComponentBindingProfile, string> = {
  A: 'N 种 theme × 主色 / 衬色 / 浅底；形态由组件内配方组合，不在此设置。',
  B: '默认 / 聚焦 / 禁用 / 错误 — 各绑 2～3 个色板变量。',
  C: '开 / 关（+ 禁用）轨道与选中色；无五语义。',
  D: '背景、边框、分隔；圆角与效果走组件统一项。',
  E: '默认 / 悬停 / 访问过；链接字体 + 动效。',
  F: '1～3 个色变量；常无圆角 / 边框独立项。',
}

export const COMPONENT_BINDING_PROFILE: Record<ComponentThemeId, ComponentBindingProfile> = {
  button: 'A',
  radio: 'C',
  checkbox: 'C',
  input: 'B',
  'input-number': 'B',
  select: 'B',
  cascader: 'B',
  switch: 'C',
  slider: 'B',
  'date-picker': 'B',
  rate: 'B',
  transfer: 'B',
  table: 'B',
  tag: 'A',
  progress: 'F',
  tree: 'F',
  pagination: 'A',
  badge: 'A',
  alert: 'A',
  loading: 'F',
  message: 'A',
  'message-box': 'D',
  notification: 'A',
  menu: 'A',
  tabs: 'A',
  tooltip: 'F',
  popover: 'D',
  card: 'D',
  collapse: 'D',
  avatar: 'F',
}

/** 各档案「色块」应出现的角色字段（面板结构预览 / 后续 store 字段） */
export const PROFILE_COLOR_FIELDS: Record<
  ComponentBindingProfile,
  { key: string; label: string }[]
> = {
  A: [
    { key: 'main', label: '主色' },
    { key: 'onMain', label: '衬色' },
    { key: 'light', label: '浅底（可选）' },
  ],
  B: [
    { key: 'default', label: '默认' },
    { key: 'focus', label: '聚焦' },
    { key: 'disabled', label: '禁用' },
    { key: 'error', label: '错误' },
  ],
  C: [
    { key: 'on', label: '选中 / 开启' },
    { key: 'off', label: '未选 / 关闭' },
    { key: 'disabled', label: '禁用' },
  ],
  D: [
    { key: 'background', label: '表面背景' },
    { key: 'border', label: '边框' },
    { key: 'divider', label: '分隔' },
  ],
  E: [
    { key: 'default', label: '默认' },
    { key: 'hover', label: '悬停' },
    { key: 'visited', label: '访问过' },
  ],
  F: [
    { key: 'primary', label: '主色' },
    { key: 'track', label: '轨道 / 占位（可选）' },
  ],
}

export const BUTTON_MOTION_INTERACTION_DEFS = [
  {
    key: 'hoverMotionPresetId' as const,
    globalKey: 'hoverMotionPresetId' as const,
    label: '悬停 · hover',
    trigger: 'hover' as const,
  },
  {
    key: 'activeMotionPresetId' as const,
    globalKey: 'activeMotionPresetId' as const,
    label: '按下 · active',
    trigger: 'active' as const,
  },
  {
    key: 'focusMotionPresetId' as const,
    globalKey: 'focusMotionPresetId' as const,
    label: '聚焦 · focus',
    trigger: 'focus' as const,
  },
] as const

export const UNIFIED_FIELD_DEFS = [
  { key: 'radius', label: '圆角', hint: '尺寸尺度 token' },
  { key: 'borderEffect', label: '边框效果', hint: '效果 Tab 预设' },
  { key: 'surfaceEffect', label: '表面效果', hint: '效果 Tab 预设' },
  { key: 'motion', label: '动效', hint: '动效 Tab 预设' },
  { key: 'fontLarge', label: '大字号字体', hint: '字体格式预设' },
  { key: 'fontMedium', label: '中字号字体', hint: '字体格式预设' },
  { key: 'fontSmall', label: '小字号字体', hint: '字体格式预设' },
] as const
