/**
 * 使用规范 — 组件级主题绑定定义
 *
 * 原则：
 * - 项目色板、字体格式 Tab = 固定清单，只维护数值，不做「绑定」
 * - 使用规范 = 按**组件类型**绑定，且仅绑定组件**实际引用的全局 CSS 变量**
 * - 填充/描边/幽灵/文字按钮等形态共用变量，组件级统一项即可覆盖，不为每种 variant 单独开设置项
 * - 不按页面上某个具体按钮实例配置，只配置「Button 组件」一套规则
 */
import type { RadiusTokenKey } from './themeUsageDefs'

/** 引用色板 / token 的 CSS 变量名（非自由填色） */
export type ColorVarRef = string

export type ButtonSemanticTheme = 'default' | 'success' | 'warning' | 'danger' | 'gray'
export type ButtonVariantKind = 'filled' | 'ghost' | 'outline'
export type ButtonSize = 'large' | 'medium' | 'small'
export type InteractionState = 'default' | 'hover' | 'active' | 'focus' | 'disabled'

/** 单交互态颜色（背景 / 文字 / 边框） */
export interface StateColorTriplet {
  background?: ColorVarRef
  text?: ColorVarRef
  border?: ColorVarRef
}

/** 语义色角色 — 块 B（Profile A）；交互 hover/active 跟色板 C1，不在此绑 */
export interface ButtonSemanticColorRoles {
  main: ColorVarRef
  onMain: ColorVarRef
  light?: ColorVarRef
}

/** @deprecated 旧版三态 triplet，仅用于 localStorage 迁移 */
export interface ButtonSemanticColorBinding {
  theme: ButtonSemanticTheme
  default: StateColorTriplet
  hover: StateColorTriplet
  active: StateColorTriplet
  focus?: StateColorTriplet
  disabled?: StateColorTriplet
}

/** 幽灵 / 描边 — 组件内配方，设置层 zero 项 */
export interface ButtonVariantBinding {
  kind: ButtonVariantKind
  transparentFill: boolean
  borderFromSemantic: boolean
}

export interface ButtonThemeBinding {
  componentId: 'button'
  semanticColors: Record<ButtonSemanticTheme, ButtonSemanticColorRoles>
  variants: Record<ButtonVariantKind, ButtonVariantBinding>
  radiusToken: RadiusTokenKey
  borderEffectPresetId: string
  effectPresetId: string
  /** @deprecated 迁移至 hoverMotionPresetId；空字符串表示继承全局槽位 */
  motionPresetId: string
  /** 空 = 继承全局 hoverMotionPresetId */
  hoverMotionPresetId: string
  activeMotionPresetId: string
  focusMotionPresetId: string
  fontPresetBySize: Record<ButtonSize, string>
}

export type ComponentThemeId =
  | 'button'
  | 'radio'
  | 'checkbox'
  | 'input'
  | 'input-number'
  | 'select'
  | 'cascader'
  | 'switch'
  | 'slider'
  | 'date-picker'
  | 'rate'
  | 'transfer'
  | 'table'
  | 'tag'
  | 'progress'
  | 'tree'
  | 'pagination'
  | 'badge'
  | 'alert'
  | 'loading'
  | 'message'
  | 'message-box'
  | 'notification'
  | 'menu'
  | 'tabs'
  | 'tooltip'
  | 'popover'
  | 'card'
  | 'collapse'
  | 'avatar'

export interface ComponentThemeMeta {
  id: ComponentThemeId
  label: string
  description: string
  /** 参考组件：状态是否丰富，用于文档与预览优先级 */
  reference?: boolean
  status: 'ready' | 'planned'
}

/** 设置 Tab 基础组件清单（顺序与用户清单一致） */
export const COMPONENT_THEME_REGISTRY: ComponentThemeMeta[] = [
  {
    id: 'button',
    label: 'Button 按钮',
    description: '五语义色、幽灵/描边、三尺寸、统一圆角/边框/效果/动效',
    reference: true,
    status: 'ready',
  },
  {
    id: 'radio',
    label: 'Radio 单选框',
    description: '选中/未选/禁用态颜色，标签字体',
    status: 'planned',
  },
  {
    id: 'checkbox',
    label: 'Checkbox 多选框',
    description: '选中/未选/禁用态颜色，统一圆角，标签字体',
    status: 'planned',
  },
  {
    id: 'input',
    label: 'Input 输入框',
    description: '默认/聚焦/禁用/错误态颜色，统一圆角边框，尺寸字体',
    status: 'planned',
  },
  {
    id: 'input-number',
    label: 'InputNumber 数字输入',
    description: '同 Input 规格，步进按钮与数值区样式',
    status: 'planned',
  },
  {
    id: 'select',
    label: 'Select 选择器',
    description: '同 Input 规格 + 下拉面板效果',
    status: 'planned',
  },
  {
    id: 'cascader',
    label: 'Cascader 级联选择',
    description: '同 Select + 多级面板样式',
    status: 'planned',
  },
  {
    id: 'switch',
    label: 'Switch 开关',
    description: '开/关/禁用态颜色，轨道圆角，动效',
    status: 'planned',
  },
  {
    id: 'slider',
    label: 'Slider 滑块',
    description: '轨道、填充段、拇指颜色与圆角',
    status: 'planned',
  },
  {
    id: 'date-picker',
    label: 'DatePicker 日期选择',
    description: '输入框 + 日历面板，同 Input 表单态规格',
    status: 'planned',
  },
  {
    id: 'rate',
    label: 'Rate 评分',
    description: '未选/已选/半选图标色',
    status: 'planned',
  },
  {
    id: 'transfer',
    label: 'Transfer 穿梭框',
    description: '双列列表、选中态与面板边框',
    status: 'planned',
  },
  {
    id: 'table',
    label: 'Table 表格',
    description: '表头、行 hover、边框与分隔色',
    status: 'planned',
  },
  {
    id: 'tag',
    label: 'Tag 标签',
    description: '五语义色 + 描边/浅色形态，小尺寸字体',
    status: 'planned',
  },
  {
    id: 'progress',
    label: 'Progress 进度条',
    description: '轨道与进度填充色，圆角',
    status: 'planned',
  },
  {
    id: 'tree',
    label: 'Tree 树',
    description: '节点选中/hover、连线与展开图标色',
    status: 'planned',
  },
  {
    id: 'pagination',
    label: 'Pagination 分页',
    description: '页码钮继承 Button 变量，当前页高亮',
    status: 'planned',
  },
  {
    id: 'badge',
    label: 'Badge 徽标',
    description: '依附语义色的角标填充与描边',
    status: 'planned',
  },
  {
    id: 'alert',
    label: 'Alert 提示',
    description: '四语义色背景/边框/图标色，圆角，正文字体',
    status: 'planned',
  },
  {
    id: 'loading',
    label: 'Loading 加载',
    description: '指示器颜色与动效',
    status: 'planned',
  },
  {
    id: 'message',
    label: 'Message 消息',
    description: '全局轻提示背景/图标/文字色',
    status: 'planned',
  },
  {
    id: 'message-box',
    label: 'MessageBox 对话框',
    description: '确认/警示弹层，同 Dialog 表面规格',
    status: 'planned',
  },
  {
    id: 'notification',
    label: 'Notification 通知',
    description: '右上角通知卡片，同 Alert 语义色',
    status: 'planned',
  },
  {
    id: 'menu',
    label: 'Menu 导航菜单',
    description: '选中/未选项、子菜单与分隔色',
    status: 'planned',
  },
  {
    id: 'tabs',
    label: 'Tabs 选项卡',
    description: '选中/未选标签、下划线或胶囊形态',
    status: 'planned',
  },
  {
    id: 'tooltip',
    label: 'Tooltip 文字提示',
    description: '浮层背景、文字与箭头色',
    status: 'planned',
  },
  {
    id: 'popover',
    label: 'Popover 弹出层',
    description: '浮层表面、边框与阴影',
    status: 'planned',
  },
  {
    id: 'card',
    label: 'Card 卡片',
    description: '表面色、边框、圆角、阴影效果，标题/正文字体引用',
    status: 'planned',
  },
  {
    id: 'collapse',
    label: 'Collapse 折叠面板',
    description: '面板头、分隔线与展开图标色',
    status: 'planned',
  },
  {
    id: 'avatar',
    label: 'Avatar 头像',
    description: '占位背景、尺寸 token、圆角',
    status: 'planned',
  },
]

export const BUTTON_SEMANTIC_LABELS: Record<ButtonSemanticTheme, string> = {
  default: 'Primary',
  success: 'Success',
  warning: 'Warning',
  danger: 'Danger',
  gray: 'Info',
}

export const BUTTON_VARIANT_LABELS: Record<ButtonVariantKind, string> = {
  filled: '填充',
  ghost: '幽灵',
  outline: '描边',
}

export const BUTTON_SIZE_LABELS: Record<ButtonSize, string> = {
  large: '大',
  medium: '中',
  small: '小',
}

export const INTERACTION_STATE_LABELS: Record<InteractionState, string> = {
  default: '默认',
  hover: '悬浮',
  active: '按下',
  focus: '聚焦',
  disabled: '禁用',
}

export const BUTTON_SEMANTIC_ROLE_LABELS: Record<keyof ButtonSemanticColorRoles, string> = {
  main: '主色',
  onMain: '衬色',
  light: '浅底',
}

function semanticRoles(
  main: ColorVarRef,
  onMain: ColorVarRef,
  light?: ColorVarRef,
): ButtonSemanticColorRoles {
  return light ? { main, onMain, light } : { main, onMain }
}

/** Button 默认绑定 — 颜色来自项目色板变量 */
export function defaultButtonThemeBinding(): ButtonThemeBinding {
  return {
    componentId: 'button',
    semanticColors: {
      default: semanticRoles('--td-brand-color', '#ffffff', '--td-brand-color-light'),
      success: semanticRoles('--td-success-color', '#ffffff', '--td-success-color-light'),
      warning: semanticRoles('--td-warning-color', '#ffffff', '--td-warning-color-light'),
      danger: semanticRoles('--td-error-color', '#ffffff', '--td-error-color-light'),
      gray: semanticRoles('--td-bg-color-component', '--td-text-color-primary', '--td-bg-color-container-hover'),
    },
    variants: {
      filled: { kind: 'filled', transparentFill: false, borderFromSemantic: false },
      ghost: { kind: 'ghost', transparentFill: true, borderFromSemantic: false },
      outline: { kind: 'outline', transparentFill: true, borderFromSemantic: true },
    },
    radiusToken: 'radiusSmall',
    borderEffectPresetId: 'control',
    effectPresetId: 'card',
    motionPresetId: 'hover',
    hoverMotionPresetId: '',
    activeMotionPresetId: '',
    focusMotionPresetId: '',
    fontPresetBySize: {
      large: 'button-lg',
      medium: 'button',
      small: 'button-sm',
    },
  }
}

/** 旧 triplet 存储 → 语义角色 */
export function migrateSemanticColorBinding(
  legacy: ButtonSemanticColorBinding | ButtonSemanticColorRoles,
): ButtonSemanticColorRoles {
  if ('main' in legacy) return legacy
  return {
    main: legacy.default.background ?? '--td-brand-color',
    onMain: legacy.default.text ?? '#ffffff',
    light: legacy.hover?.background,
  }
}

/** 绑定面板可选颜色 — 来自色板 / 设计 token */
export const THEME_COLOR_VAR_OPTIONS: { value: ColorVarRef; label: string }[] = [
  { value: '--td-brand-color', label: '品牌主色' },
  { value: '--td-brand-color-hover', label: '品牌悬停' },
  { value: '--td-brand-color-active', label: '品牌按下' },
  { value: '--td-success-color', label: '成功' },
  { value: '--td-success-color-hover', label: '成功悬停' },
  { value: '--td-success-color-active', label: '成功按下' },
  { value: '--td-warning-color', label: '警告' },
  { value: '--td-warning-color-hover', label: '警告悬停' },
  { value: '--td-warning-color-active', label: '警告按下' },
  { value: '--td-error-color', label: '危险' },
  { value: '--td-error-color-hover', label: '危险悬停' },
  { value: '--td-error-color-active', label: '危险按下' },
  { value: '--td-text-color-primary', label: '文字主色' },
  { value: '--td-text-color-secondary', label: '文字次色' },
  { value: '--td-text-color-placeholder', label: '文字占位' },
  { value: '--td-bg-color-container', label: '容器背景' },
  { value: '--td-bg-color-component', label: '组件背景' },
  { value: '--td-bg-color-container-hover', label: '容器悬停' },
  { value: '--td-bg-color-component-active', label: '组件按下' },
  { value: '--td-component-border', label: '组件边框' },
  { value: '#ffffff', label: '白色（固定）' },
]
