/**
 * 使用规范 / 主题设置 — 字段定义（语义槽位 → 命名集合或 token 键）
 */
import type { StylePresetCategory } from './stylePresetDefs'
import { DESIGN_TOKEN_DEFS } from './designTokenDefs'
import type { DesignTokenValues } from './designTokenDefs'

export type RadiusTokenKey = 'radiusSmall' | 'radiusDefault' | 'radiusMedium' | 'radiusLarge'
export type ShadowLevel = '1' | '2' | '3'

export interface ThemeUsageSettings {
  headlineFontPresetId: string
  titleFontPresetId: string
  bodyFontPresetId: string
  captionFontPresetId: string
  cardEffectPresetId: string
  popupEffectPresetId: string
  controlEffectPresetId: string
  hoverMotionPresetId: string
  activeMotionPresetId: string
  focusMotionPresetId: string
  enterMotionPresetId: string
  exitMotionPresetId: string
  expandMotionPresetId: string
  cardRadiusToken: RadiusTokenKey
  controlRadiusToken: RadiusTokenKey
  cardShadowLevel: ShadowLevel
}

export type ThemePresetFieldKey = {
  [K in keyof ThemeUsageSettings]: ThemeUsageSettings[K] extends string
    ? K
    : never
}[keyof ThemeUsageSettings]

export interface ThemePresetFieldDef {
  key: ThemePresetFieldKey
  label: string
  hint: string
  category: StylePresetCategory
  defaultPresetId: string
  empty: string
}

export interface ThemeTokenFieldDef {
  key: 'cardRadiusToken' | 'controlRadiusToken' | 'cardShadowLevel'
  label: string
  hint: string
  kind: 'radius' | 'shadow'
}

export interface ThemeUsageSection {
  id: string
  title: string
  description: string
  presetFields?: ThemePresetFieldDef[]
  tokenFields?: ThemeTokenFieldDef[]
}

const RADIUS_KEYS: RadiusTokenKey[] = [
  'radiusSmall',
  'radiusDefault',
  'radiusMedium',
  'radiusLarge',
]

export const THEME_USAGE_SECTIONS: ThemeUsageSection[] = [
  {
    id: 'font',
    title: '字体格式',
    description: '各级文本选用「字体格式」Tab 中的命名集合。',
    presetFields: [
      {
        key: 'headlineFontPresetId',
        label: '大标题',
        hint: 'H1、H2 等主标题',
        category: 'font',
        defaultPresetId: 'headline',
        empty: '请先在「字体格式」新建样式',
      },
      {
        key: 'titleFontPresetId',
        label: '标题',
        hint: 'H3–H6 次级标题',
        category: 'font',
        defaultPresetId: 'title',
        empty: '请先在「字体格式」新建样式',
      },
      {
        key: 'bodyFontPresetId',
        label: '正文',
        hint: '段落、列表等主内容',
        category: 'font',
        defaultPresetId: 'body',
        empty: '请先在「字体格式」新建样式',
      },
      {
        key: 'captionFontPresetId',
        label: '辅助说明',
        hint: '注释、次要信息、小字',
        category: 'font',
        defaultPresetId: 'caption',
        empty: '请先在「字体格式」新建样式',
      },
    ],
  },
  {
    id: 'effect',
    title: '效果',
    description: '容器与控件表面选用「效果」Tab 中的命名集合。',
    presetFields: [
      {
        key: 'cardEffectPresetId',
        label: '卡片 / 区块',
        hint: '卡片、面板、预览区块',
        category: 'effect',
        defaultPresetId: 'card',
        empty: '请先在「效果」新建样式',
      },
      {
        key: 'popupEffectPresetId',
        label: '弹层 / 浮层',
        hint: '对话框、抽屉、下拉层',
        category: 'effect',
        defaultPresetId: 'popup',
        empty: '请先在「效果」新建样式',
      },
      {
        key: 'controlEffectPresetId',
        label: '表单控件',
        hint: '输入框、选择器等控件容器',
        category: 'effect',
        defaultPresetId: 'control',
        empty: '请先在「效果」新建样式',
      },
    ],
  },
  {
    id: 'motion-interaction',
    title: '动效 · 交互态',
    description:
      '指针悬停、按下、键盘聚焦三类交互反馈；与画板「悬停 / 按下 / 聚焦」态及组件 :hover/:active/:focus-visible 对齐。',
    presetFields: [
      {
        key: 'hoverMotionPresetId',
        label: '悬停 · hover',
        hint: ':hover — 可点击元素指针进入',
        category: 'motion',
        defaultPresetId: 'hover',
        empty: '请先在「动效」新建样式',
      },
      {
        key: 'activeMotionPresetId',
        label: '按下 · active',
        hint: ':active — 鼠标/触控按下',
        category: 'motion',
        defaultPresetId: 'active',
        empty: '请先在「动效」新建样式',
      },
      {
        key: 'focusMotionPresetId',
        label: '聚焦 · focus',
        hint: ':focus-visible — 键盘 Tab 聚焦',
        category: 'motion',
        defaultPresetId: 'focus',
        empty: '请先在「动效」新建样式',
      },
    ],
  },
  {
    id: 'motion-lifecycle',
    title: '动效 · 显隐过渡',
    description:
      '组件挂载/打开、卸载/关闭、展开收起；供 Dialog、Message、Popup、Collapse 等引用 enter/leave 变量。',
    presetFields: [
      {
        key: 'enterMotionPresetId',
        label: '进入 · enter',
        hint: 'appear / enter-active',
        category: 'motion',
        defaultPresetId: 'enter',
        empty: '请先在「动效」新建样式',
      },
      {
        key: 'exitMotionPresetId',
        label: '离开 · exit',
        hint: 'leave-active / 关闭',
        category: 'motion',
        defaultPresetId: 'exit',
        empty: '请先在「动效」新建样式',
      },
      {
        key: 'expandMotionPresetId',
        label: '展开 · expand',
        hint: 'Collapse / 下拉层 expand 动画',
        category: 'motion',
        defaultPresetId: 'expand',
        empty: '请先在「动效」新建样式',
      },
    ],
  },
  {
    id: 'dimension',
    title: '间距尺寸',
    description: '引用「间距尺寸」Tab 中的圆角 token；阴影档位为全局固定档。',
    tokenFields: [
      {
        key: 'cardRadiusToken',
        label: '卡片圆角',
        hint: '卡片、区块外轮廓',
        kind: 'radius',
      },
      {
        key: 'controlRadiusToken',
        label: '控件圆角',
        hint: '按钮、输入框等',
        kind: 'radius',
      },
      {
        key: 'cardShadowLevel',
        label: '卡片阴影',
        hint: 'Shadow 1 / 2 / 3',
        kind: 'shadow',
      },
    ],
  },
]

export const RADIUS_TOKEN_OPTIONS = RADIUS_KEYS.map((key) => {
  const def = DESIGN_TOKEN_DEFS.find((d) => d.key === key)!
  return { value: key, label: def.label, cssVar: def.cssVar }
})

export const SHADOW_LEVEL_OPTIONS: { value: ShadowLevel; label: string; cssVar: string }[] = [
  { value: '1', label: 'Shadow 1 · 轻', cssVar: '--td-shadow-1' },
  { value: '2', label: 'Shadow 2 · 中', cssVar: '--td-shadow-2' },
  { value: '3', label: 'Shadow 3 · 重', cssVar: '--td-shadow-3' },
]

export function radiusTokenCssVar(key: RadiusTokenKey): string {
  return RADIUS_TOKEN_OPTIONS.find((o) => o.value === key)?.cssVar ?? '--td-radius-medium'
}

export function shadowLevelCssVar(level: ShadowLevel): string {
  return SHADOW_LEVEL_OPTIONS.find((o) => o.value === level)?.cssVar ?? '--td-shadow-1'
}

/** 全局动效槽位 → :root 变量前缀（--flow-theme-motion-hover 等） */
export type ThemeMotionSlotKey =
  | 'hover'
  | 'active'
  | 'focus'
  | 'enter'
  | 'exit'
  | 'expand'

export const THEME_MOTION_INTERACTION_SLOTS: ThemeMotionSlotKey[] = ['hover', 'active', 'focus']

export const THEME_MOTION_LIFECYCLE_SLOTS: ThemeMotionSlotKey[] = ['enter', 'exit', 'expand']

export const THEME_MOTION_SLOT_KEYS: ThemeMotionSlotKey[] = [
  ...THEME_MOTION_INTERACTION_SLOTS,
  ...THEME_MOTION_LIFECYCLE_SLOTS,
]

export const THEME_MOTION_GROUPS: {
  id: 'interaction' | 'lifecycle'
  title: string
  description: string
  slots: ThemeMotionSlotKey[]
}[] = [
  {
    id: 'interaction',
    title: '交互态',
    description: ':hover / :active / :focus-visible',
    slots: [...THEME_MOTION_INTERACTION_SLOTS],
  },
  {
    id: 'lifecycle',
    title: '显隐过渡',
    description: 'enter / exit / expand',
    slots: [...THEME_MOTION_LIFECYCLE_SLOTS],
  },
]

export function themeMotionPresetSettingKey(slot: ThemeMotionSlotKey): keyof ThemeUsageSettings {
  const map: Record<ThemeMotionSlotKey, keyof ThemeUsageSettings> = {
    hover: 'hoverMotionPresetId',
    active: 'activeMotionPresetId',
    focus: 'focusMotionPresetId',
    enter: 'enterMotionPresetId',
    exit: 'exitMotionPresetId',
    expand: 'expandMotionPresetId',
  }
  return map[slot]
}

export function themeMotionSlotCssVarPrefix(slot: ThemeMotionSlotKey): string {
  return `--flow-theme-motion-${slot}`
}

export function emptyThemeUsageSettings(): ThemeUsageSettings {
  return {
    headlineFontPresetId: '',
    titleFontPresetId: '',
    bodyFontPresetId: '',
    captionFontPresetId: '',
    cardEffectPresetId: '',
    popupEffectPresetId: '',
    controlEffectPresetId: '',
    hoverMotionPresetId: '',
    activeMotionPresetId: '',
    focusMotionPresetId: '',
    enterMotionPresetId: '',
    exitMotionPresetId: '',
    expandMotionPresetId: '',
    cardRadiusToken: 'radiusMedium',
    controlRadiusToken: 'radiusSmall',
    cardShadowLevel: '1',
  }
}

/** 兼容旧版 localStorage（单槽 / 缺 enter·exit·expand 等） */
export function migrateThemeUsageSaved(
  saved: Record<string, unknown>,
): Partial<ThemeUsageSettings> {
  const out = { ...saved } as Partial<ThemeUsageSettings>
  const legacyMotion = saved.interactionMotionPresetId
  if (typeof legacyMotion === 'string' && !out.hoverMotionPresetId) {
    out.hoverMotionPresetId = legacyMotion
  }
  if (typeof saved.motionPresetId === 'string' && !out.hoverMotionPresetId) {
    out.hoverMotionPresetId = saved.motionPresetId as string
  }
  return out
}

export function getRadiusTokenValue(
  key: RadiusTokenKey,
  values: DesignTokenValues,
): string {
  return `${values[key]}px`
}
