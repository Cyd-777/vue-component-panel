/**
 * 使用规范 — 规则目录（词典 vs 用法 vs 实例）
 *
 * 定义层 Tab 维护「有什么」；本模块维护「什么时候用、区间与禁忌」。
 * 可编辑项持久化见 usageRulesStore。
 */
import type { RadiusTokenKey } from './themeUsageDefs'

export type UsageRuleEditTab =
  | 'colors'
  | 'dimensions'
  | 'fonts'
  | 'effects'
  | 'motion'
  | 'wcag'

export interface UsageRuleSection {
  id: string
  title: string
  description: string
}

export interface UsageGuidelineRule {
  id: string
  title: string
  summary: string
  doList?: string[]
  dontList?: string[]
  editTab?: UsageRuleEditTab
}

/** 场景 → 推荐 token / 预设（条文；具体值在项目默认槽配置） */
export interface UsageSceneMapping {
  id: string
  scene: string
  when: string
  recommend: string
  tokenKey?: RadiusTokenKey | 'spacingMd' | 'spacingLg'
  presetId?: string
  editTab?: UsageRuleEditTab
}

export interface UsageProhibitionRule {
  id: string
  title: string
  reason: string
}

export const USAGE_RULE_SECTIONS: UsageRuleSection[] = [
  {
    id: 'philosophy',
    title: '分层原则',
    description: '定义层提供词汇；使用规范约束用法；画板自由组合实例。',
  },
  {
    id: 'radius-scene',
    title: '圆角与容器',
    description: '按容器角色选用圆角 token，避免同一视图混用过多档。',
  },
  {
    id: 'spacing-density',
    title: '间距与密度',
    description: '密集表单 vs 营销区块的间距尺度。',
  },
  {
    id: 'motion-ranges',
    title: '动效时长区间',
    description: '交互反馈与显隐过渡的允许区间；超出区间应警告而非禁止画板 override。',
  },
  {
    id: 'effect-disabled',
    title: '效果与禁用态',
    description: '禁用视觉走效果 preset（滤镜/透明度），错误边走色板全局语义色。',
  },
  {
    id: 'semantic-usage',
    title: '语义色用法',
    description: '全库统一的 brand / success / warning / error；不在组件面板重复绑色。',
  },
  {
    id: 'combinations',
    title: '组合约束',
    description: '同一区域内避免冲突的视觉叠加。',
  },
]

export const USAGE_PHILOSOPHY_RULES: UsageGuidelineRule[] = [
  {
    id: 'layer-def',
    title: '定义层 = 词典',
    summary: '色板、间距尺寸、字体格式、效果、动效 Tab 只维护数值与命名集合。',
    doList: ['在定义 Tab 改 token / preset', '保留示例卡片作模板库'],
    dontList: ['在设置页为每个组件重复填色值'],
    editTab: 'colors',
  },
  {
    id: 'layer-usage',
    title: '使用规范 = 语法',
    summary: '声明场景、区间、禁忌；画板新建时带入推荐默认值。',
    doList: ['配置项目默认槽（下方）', '设定动效允许区间'],
    dontList: ['用 30 张组件表单替代规范条文'],
  },
  {
    id: 'layer-instance',
    title: '画板 = 实例',
    summary: '高度自定义；超出规范时提示，不阻断专家 override。',
    doList: ['引用 --td-* 与 .flow-style-*', '接受规范侧 lint 提示'],
  },
]

export const USAGE_RADIUS_SCENES: UsageSceneMapping[] = [
  {
    id: 'radius-control',
    scene: '按钮 / 输入框 / 选择器',
    when: '可点击、可聚焦的控件外轮廓',
    recommend: 'radiusSmall 或 radiusDefault',
    tokenKey: 'radiusSmall',
    editTab: 'dimensions',
  },
  {
    id: 'radius-card',
    scene: '卡片 / 列表项 / 预览区块',
    when: '内容分组、非浮层容器',
    recommend: 'radiusMedium（项目默认 · 卡片圆角）',
    tokenKey: 'radiusMedium',
    editTab: 'dimensions',
  },
  {
    id: 'radius-popup',
    scene: '对话框 / 抽屉 / 下拉面板',
    when: '浮于页面之上的层',
    recommend: 'radiusMedium ～ radiusLarge；效果 preset 用 popup',
    tokenKey: 'radiusLarge',
    presetId: 'popup',
    editTab: 'effects',
  },
  {
    id: 'radius-pill',
    scene: 'Tag / 胶囊按钮 / Switch 轨道',
    when: '全圆角形态',
    recommend: 'radiusRound（尺寸尺度）或组件内置 round',
    editTab: 'dimensions',
  },
]

export const USAGE_SPACING_SCENES: UsageSceneMapping[] = [
  {
    id: 'spacing-dense',
    scene: '表单 / 表格 / 设置列表',
    when: '信息密度高、纵向堆叠控件',
    recommend: 'spacingMd 及以下；layoutGap 不超过 16px 等价',
    tokenKey: 'spacingMd',
    editTab: 'dimensions',
  },
  {
    id: 'spacing-comfort',
    scene: '卡片内边距 / 模块间距',
    when: '阅读型内容、卡片列表',
    recommend: 'layoutPadding + layoutGap（尺寸尺度 Tab）',
    editTab: 'dimensions',
  },
  {
    id: 'spacing-marketing',
    scene: '落地页 / Hero / 大区块',
    when: '强调留白、低信息密度',
    recommend: 'spacingLg 与 layoutSectionGap；避免与重阴影+大圆角同区叠加',
    tokenKey: 'spacingLg',
    editTab: 'dimensions',
  },
]

export const USAGE_SEMANTIC_RULES: UsageGuidelineRule[] = [
  {
    id: 'semantic-global',
    title: '语义色全库统一',
    summary: 'brand / success / warning / error / neutral 仅在项目色板维护。',
    doList: ['改色板 → 所有 Button / Tag / Alert 一起变'],
    dontList: ['在组件设置面板再绑一遍语义主色'],
    editTab: 'colors',
  },
  {
    id: 'semantic-danger',
    title: '危险色',
    summary: '仅用于不可逆、破坏性操作的主按钮或关键警示。',
    dontList: ['导航、普通取消、装饰性图标滥用 danger'],
    editTab: 'colors',
  },
  {
    id: 'semantic-error-border',
    title: '错误边 / 错误文案',
    summary: '表单校验失败使用 --td-error-color；全库一致，不在 Input 单独绑。',
    editTab: 'colors',
  },
  {
    id: 'semantic-disabled',
    title: '禁用态',
    summary: '禁用底视觉 = 效果 preset（opacity + grayscale），不是再绑一层灰底 hex。',
    doList: ['选用 effect-disabled 或同类 preset'],
    editTab: 'effects',
  },
]

export const USAGE_COMBINATION_RULES: UsageProhibitionRule[] = [
  {
    id: 'combo-heavy',
    title: '重阴影 + 大圆角 + 大间距 同区',
    reason: '营销风叠加进密集表单会破坏层级与可扫读性。',
  },
  {
    id: 'combo-motion-slow-hover',
    title: 'hover 动效 > 600ms',
    reason: '指针反馈过慢会被感知为卡顿。',
  },
  {
    id: 'combo-headline-control',
    title: '控件内使用 headline 字号预设',
    reason: '破坏字体层级；控件应使用 button / body / caption 预设。',
  },
  {
    id: 'combo-success-nav',
    title: 'success 语义用于主导航',
    reason: 'success 保留给完成态与正向结果，避免与 brand 主导航混淆。',
  },
]

/** 可编辑区间字段（持久化键） */
export interface UsageRulesConstraints {
  disabledEffectPresetId: string
  motionInteractionMinMs: number
  motionInteractionMaxMs: number
  motionLifecycleMinMs: number
  motionLifecycleMaxMs: number
  motionHoverHardMaxMs: number
}

export const DEFAULT_USAGE_RULES_CONSTRAINTS: UsageRulesConstraints = {
  disabledEffectPresetId: 'effect-disabled',
  motionInteractionMinMs: 80,
  motionInteractionMaxMs: 320,
  motionLifecycleMinMs: 180,
  motionLifecycleMaxMs: 520,
  motionHoverHardMaxMs: 600,
}

export const MOTION_RANGE_FIELD_DEFS: {
  key: keyof UsageRulesConstraints
  label: string
  hint: string
  min: number
  max: number
  step: number
}[] = [
  {
    key: 'motionInteractionMinMs',
    label: '交互态 · 最短',
    hint: 'hover / active / focus',
    min: 0,
    max: 500,
    step: 10,
  },
  {
    key: 'motionInteractionMaxMs',
    label: '交互态 · 最长',
    hint: 'hover / active / focus',
    min: 50,
    max: 800,
    step: 10,
  },
  {
    key: 'motionLifecycleMinMs',
    label: '显隐 · 最短',
    hint: 'enter / exit / expand',
    min: 0,
    max: 800,
    step: 10,
  },
  {
    key: 'motionLifecycleMaxMs',
    label: '显隐 · 最长',
    hint: 'enter / exit / expand',
    min: 100,
    max: 1200,
    step: 10,
  },
  {
    key: 'motionHoverHardMaxMs',
    label: 'hover 硬上限（警告）',
    hint: '超出即违反组合约束',
    min: 200,
    max: 1500,
    step: 50,
  },
]
