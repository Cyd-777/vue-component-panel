export type TokenGroup = 'color' | 'fonts' | 'spacing' | 'radius' | 'layout' | 'motion'

export type TokenFieldType = 'color' | 'px' | 'fontFamily' | 'fontWeight' | 'enum' | 'string'

export interface DesignTokenDef {
  key: keyof DesignTokenValues
  cssVar: string
  label: string
  group: TokenGroup
  type: TokenFieldType
  default: string
  min?: number
  max?: number
  step?: number
  description?: string
  cssProperty?: string
  options?: { value: string; label: string }[]
}

export interface DesignTokenValues {
  brandColor: string
  successColor: string
  warningColor: string
  errorColor: string
  infoColor: string
  textPrimary: string
  textSecondary: string
  bgPage: string
  bgContainer: string
  borderColor: string
  fontFamily: string
  fontSizeBody: string
  fontSizeTitle: string
  fontSizeHeadline: string
  fontWeightRegular: string
  fontWeightSemibold: string
  fontStyle: string
  fontVariant: string
  fontStretch: string
  lineHeightBody: string
  lineHeightTitle: string
  lineHeightHeadline: string
  letterSpacing: string
  wordSpacing: string
  fontKerning: string
  fontFeatureSettings: string
  fontVariationSettings: string
  fontSynthesis: string
  fontOpticalSizing: string
  textTransform: string
  textDecorationLine: string
  textDecorationStyle: string
  textDecorationColor: string
  textDecorationThickness: string
  fontSmooth: string
  spacingUnit: string
  spacingMd: string
  spacingLg: string
  layoutPadding: string
  layoutGap: string
  layoutSectionGap: string
  radiusSmall: string
  radiusDefault: string
  radiusMedium: string
  radiusLarge: string
  motionDuration: string
  motionDelay: string
  motionEasing: string
  motionProperty: string
}

export const DEFAULT_TOKEN_VALUES: DesignTokenValues = {
  brandColor: '#0052D9',
  successColor: '#2BA471',
  warningColor: '#E37318',
  errorColor: '#D54941',
  infoColor: '#697586',
  textPrimary: 'rgba(0, 0, 0, 0.9)',
  textSecondary: 'rgba(0, 0, 0, 0.6)',
  bgPage: '#EEEEEE',
  bgContainer: '#FFFFFF',
  borderColor: '#C6C6C6',
  fontFamily: 'PingFang SC, Microsoft YaHei, Arial, sans-serif',
  fontSizeBody: '14',
  fontSizeTitle: '16',
  fontSizeHeadline: '24',
  fontWeightRegular: '400',
  fontWeightSemibold: '600',
  fontStyle: 'normal',
  fontVariant: 'normal',
  fontStretch: 'normal',
  lineHeightBody: '22',
  lineHeightTitle: '25',
  lineHeightHeadline: '38',
  letterSpacing: '0',
  wordSpacing: '0',
  fontKerning: 'auto',
  fontFeatureSettings: 'normal',
  fontVariationSettings: 'normal',
  fontSynthesis: 'weight style',
  fontOpticalSizing: 'auto',
  textTransform: 'none',
  textDecorationLine: 'none',
  textDecorationStyle: 'solid',
  textDecorationColor: 'currentColor',
  textDecorationThickness: 'auto',
  fontSmooth: 'auto',
  spacingUnit: '4',
  spacingMd: '16',
  spacingLg: '24',
  layoutPadding: '16',
  layoutGap: '12',
  layoutSectionGap: '24',
  radiusSmall: '2',
  radiusDefault: '3',
  radiusMedium: '6',
  radiusLarge: '9',
  motionDuration: '150',
  motionDelay: '0',
  motionEasing: 'ease',
  motionProperty: 'all',
}

export const DESIGN_TOKEN_DEFS: DesignTokenDef[] = [
  {
    key: 'brandColor',
    cssVar: '--td-brand-color',
    label: '品牌主色',
    group: 'color',
    type: 'color',
    default: DEFAULT_TOKEN_VALUES.brandColor,
    description: '影响按钮、链接、选中态等',
  },
  {
    key: 'successColor',
    cssVar: '--td-success-color',
    label: '成功色',
    group: 'color',
    type: 'color',
    default: DEFAULT_TOKEN_VALUES.successColor,
  },
  {
    key: 'warningColor',
    cssVar: '--td-warning-color',
    label: '警告色',
    group: 'color',
    type: 'color',
    default: DEFAULT_TOKEN_VALUES.warningColor,
  },
  {
    key: 'errorColor',
    cssVar: '--td-error-color',
    label: '错误色',
    group: 'color',
    type: 'color',
    default: DEFAULT_TOKEN_VALUES.errorColor,
  },
  {
    key: 'infoColor',
    cssVar: '--flow-info-color',
    label: 'Info 功能色',
    group: 'color',
    type: 'color',
    default: DEFAULT_TOKEN_VALUES.infoColor,
    description: 'Info 语义功能色；与 Primary 混合生成中性色倾向',
  },
  {
    key: 'textPrimary',
    cssVar: '--td-text-color-primary',
    label: '主要文字',
    group: 'color',
    type: 'color',
    default: DEFAULT_TOKEN_VALUES.textPrimary,
  },
  {
    key: 'textSecondary',
    cssVar: '--td-text-color-secondary',
    label: '次要文字',
    group: 'color',
    type: 'color',
    default: DEFAULT_TOKEN_VALUES.textSecondary,
  },
  {
    key: 'bgPage',
    cssVar: '--td-bg-color-page',
    label: '页面背景',
    group: 'color',
    type: 'color',
    default: DEFAULT_TOKEN_VALUES.bgPage,
  },
  {
    key: 'bgContainer',
    cssVar: '--td-bg-color-container',
    label: '容器背景',
    group: 'color',
    type: 'color',
    default: DEFAULT_TOKEN_VALUES.bgContainer,
  },
  {
    key: 'borderColor',
    cssVar: '--td-component-border',
    label: '边框色',
    group: 'color',
    type: 'color',
    default: DEFAULT_TOKEN_VALUES.borderColor,
  },
  {
    key: 'fontFamily',
    cssVar: '--td-font-family',
    label: '字体家族',
    group: 'fonts',
    type: 'fontFamily',
    default: DEFAULT_TOKEN_VALUES.fontFamily,
  },
  {
    key: 'fontSizeBody',
    cssVar: '--td-font-size-body-medium',
    label: '正文字号',
    group: 'fonts',
    type: 'px',
    default: DEFAULT_TOKEN_VALUES.fontSizeBody,
    min: 12,
    max: 18,
    step: 1,
  },
  {
    key: 'fontSizeTitle',
    cssVar: '--td-font-size-title-medium',
    label: '标题字号',
    group: 'fonts',
    type: 'px',
    default: DEFAULT_TOKEN_VALUES.fontSizeTitle,
    min: 14,
    max: 24,
    step: 1,
  },
  {
    key: 'fontSizeHeadline',
    cssVar: '--td-font-size-headline-small',
    label: '大标题字号',
    group: 'fonts',
    type: 'px',
    default: DEFAULT_TOKEN_VALUES.fontSizeHeadline,
    min: 20,
    max: 40,
    step: 1,
  },
  {
    key: 'fontWeightRegular',
    cssVar: '--flow-font-weight-regular',
    label: '常规字重',
    group: 'fonts',
    type: 'fontWeight',
    default: DEFAULT_TOKEN_VALUES.fontWeightRegular,
    min: 300,
    max: 500,
    step: 100,
  },
  {
    key: 'fontWeightSemibold',
    cssVar: '--flow-font-weight-semibold',
    label: '强调字重',
    group: 'fonts',
    type: 'fontWeight',
    default: DEFAULT_TOKEN_VALUES.fontWeightSemibold,
    min: 500,
    max: 700,
    step: 100,
    cssProperty: 'font-weight',
  },
  {
    key: 'fontStyle',
    cssVar: '--flow-font-style',
    label: '字体样式',
    group: 'fonts',
    type: 'enum',
    default: DEFAULT_TOKEN_VALUES.fontStyle,
    cssProperty: 'font-style',
    options: [
      { value: 'normal', label: 'normal' },
      { value: 'italic', label: 'italic' },
      { value: 'oblique', label: 'oblique' },
    ],
  },
  {
    key: 'fontVariant',
    cssVar: '--flow-font-variant',
    label: '字体变体',
    group: 'fonts',
    type: 'enum',
    default: DEFAULT_TOKEN_VALUES.fontVariant,
    cssProperty: 'font-variant',
    options: [
      { value: 'normal', label: 'normal' },
      { value: 'small-caps', label: 'small-caps' },
      { value: 'all-small-caps', label: 'all-small-caps' },
      { value: 'petite-caps', label: 'petite-caps' },
      { value: 'unicase', label: 'unicase' },
    ],
  },
  {
    key: 'fontStretch',
    cssVar: '--flow-font-stretch',
    label: '字体拉伸',
    group: 'fonts',
    type: 'enum',
    default: DEFAULT_TOKEN_VALUES.fontStretch,
    cssProperty: 'font-stretch',
    options: [
      { value: 'normal', label: 'normal' },
      { value: 'ultra-condensed', label: 'ultra-condensed' },
      { value: 'extra-condensed', label: 'extra-condensed' },
      { value: 'condensed', label: 'condensed' },
      { value: 'semi-condensed', label: 'semi-condensed' },
      { value: 'semi-expanded', label: 'semi-expanded' },
      { value: 'expanded', label: 'expanded' },
      { value: 'extra-expanded', label: 'extra-expanded' },
      { value: 'ultra-expanded', label: 'ultra-expanded' },
    ],
  },
  {
    key: 'lineHeightBody',
    cssVar: '--flow-line-height-body',
    label: '正文行高',
    group: 'fonts',
    type: 'px',
    default: DEFAULT_TOKEN_VALUES.lineHeightBody,
    min: 12,
    max: 48,
    step: 1,
    cssProperty: 'line-height',
  },
  {
    key: 'lineHeightTitle',
    cssVar: '--flow-line-height-title',
    label: '标题行高',
    group: 'fonts',
    type: 'px',
    default: DEFAULT_TOKEN_VALUES.lineHeightTitle,
    min: 14,
    max: 56,
    step: 1,
    cssProperty: 'line-height',
  },
  {
    key: 'lineHeightHeadline',
    cssVar: '--flow-line-height-headline',
    label: '大标题行高',
    group: 'fonts',
    type: 'px',
    default: DEFAULT_TOKEN_VALUES.lineHeightHeadline,
    min: 20,
    max: 72,
    step: 1,
    cssProperty: 'line-height',
  },
  {
    key: 'letterSpacing',
    cssVar: '--flow-letter-spacing',
    label: '字间距',
    group: 'fonts',
    type: 'px',
    default: DEFAULT_TOKEN_VALUES.letterSpacing,
    min: -4,
    max: 20,
    step: 0.1,
    cssProperty: 'letter-spacing',
  },
  {
    key: 'wordSpacing',
    cssVar: '--flow-word-spacing',
    label: '词间距',
    group: 'fonts',
    type: 'px',
    default: DEFAULT_TOKEN_VALUES.wordSpacing,
    min: -4,
    max: 32,
    step: 0.1,
    cssProperty: 'word-spacing',
  },
  {
    key: 'fontKerning',
    cssVar: '--flow-font-kerning',
    label: '字距调整',
    group: 'fonts',
    type: 'enum',
    default: DEFAULT_TOKEN_VALUES.fontKerning,
    cssProperty: 'font-kerning',
    options: [
      { value: 'auto', label: 'auto' },
      { value: 'normal', label: 'normal' },
      { value: 'none', label: 'none' },
    ],
  },
  {
    key: 'fontFeatureSettings',
    cssVar: '--flow-font-feature-settings',
    label: 'OpenType 特性',
    group: 'fonts',
    type: 'string',
    default: DEFAULT_TOKEN_VALUES.fontFeatureSettings,
    cssProperty: 'font-feature-settings',
    description: '如 "liga" 1, "kern" 1',
  },
  {
    key: 'fontVariationSettings',
    cssVar: '--flow-font-variation-settings',
    label: '可变字体轴',
    group: 'fonts',
    type: 'string',
    default: DEFAULT_TOKEN_VALUES.fontVariationSettings,
    cssProperty: 'font-variation-settings',
    description: '如 "wght" 400, "wdth" 100',
  },
  {
    key: 'fontSynthesis',
    cssVar: '--flow-font-synthesis',
    label: '字体合成',
    group: 'fonts',
    type: 'enum',
    default: DEFAULT_TOKEN_VALUES.fontSynthesis,
    cssProperty: 'font-synthesis',
    options: [
      { value: 'weight style', label: 'weight style' },
      { value: 'none', label: 'none' },
      { value: 'weight', label: 'weight' },
      { value: 'style', label: 'style' },
    ],
  },
  {
    key: 'fontOpticalSizing',
    cssVar: '--flow-font-optical-sizing',
    label: '光学字号',
    group: 'fonts',
    type: 'enum',
    default: DEFAULT_TOKEN_VALUES.fontOpticalSizing,
    cssProperty: 'font-optical-sizing',
    options: [
      { value: 'auto', label: 'auto' },
      { value: 'none', label: 'none' },
    ],
  },
  {
    key: 'textTransform',
    cssVar: '--flow-text-transform',
    label: '文本转换',
    group: 'fonts',
    type: 'enum',
    default: DEFAULT_TOKEN_VALUES.textTransform,
    cssProperty: 'text-transform',
    options: [
      { value: 'none', label: 'none' },
      { value: 'capitalize', label: 'capitalize' },
      { value: 'uppercase', label: 'uppercase' },
      { value: 'lowercase', label: 'lowercase' },
    ],
  },
  {
    key: 'textDecorationLine',
    cssVar: '--flow-text-decoration-line',
    label: '装饰线',
    group: 'fonts',
    type: 'enum',
    default: DEFAULT_TOKEN_VALUES.textDecorationLine,
    cssProperty: 'text-decoration-line',
    options: [
      { value: 'none', label: 'none' },
      { value: 'underline', label: 'underline' },
      { value: 'overline', label: 'overline' },
      { value: 'line-through', label: 'line-through' },
      { value: 'underline line-through', label: 'underline line-through' },
    ],
  },
  {
    key: 'textDecorationStyle',
    cssVar: '--flow-text-decoration-style',
    label: '装饰样式',
    group: 'fonts',
    type: 'enum',
    default: DEFAULT_TOKEN_VALUES.textDecorationStyle,
    cssProperty: 'text-decoration-style',
    options: [
      { value: 'solid', label: 'solid' },
      { value: 'double', label: 'double' },
      { value: 'dotted', label: 'dotted' },
      { value: 'dashed', label: 'dashed' },
      { value: 'wavy', label: 'wavy' },
    ],
  },
  {
    key: 'textDecorationColor',
    cssVar: '--flow-text-decoration-color',
    label: '装饰颜色',
    group: 'fonts',
    type: 'string',
    default: DEFAULT_TOKEN_VALUES.textDecorationColor,
    cssProperty: 'text-decoration-color',
    description: 'CSS 颜色或 currentColor',
  },
  {
    key: 'textDecorationThickness',
    cssVar: '--flow-text-decoration-thickness',
    label: '装饰粗细',
    group: 'fonts',
    type: 'string',
    default: DEFAULT_TOKEN_VALUES.textDecorationThickness,
    cssProperty: 'text-decoration-thickness',
    description: 'auto / from-font / 1px 等',
  },
  {
    key: 'fontSmooth',
    cssVar: '--flow-font-smooth',
    label: '字体平滑',
    group: 'fonts',
    type: 'enum',
    default: DEFAULT_TOKEN_VALUES.fontSmooth,
    cssProperty: '-webkit-font-smoothing',
    options: [
      { value: 'auto', label: 'auto（系统默认）' },
      { value: 'antialiased', label: 'antialiased' },
      { value: 'subpixel-antialiased', label: 'subpixel-antialiased' },
    ],
  },
  {
    key: 'spacingUnit',
    cssVar: '--td-size-2',
    label: '基数单位',
    group: 'spacing',
    type: 'px',
    default: DEFAULT_TOKEN_VALUES.spacingUnit,
    min: 2,
    max: 12,
    step: 1,
    description: '间距滑动条的步进基准；其它项为其整数倍',
  },
  {
    key: 'spacingMd',
    cssVar: '--td-size-6',
    label: '中间距',
    group: 'spacing',
    type: 'px',
    default: DEFAULT_TOKEN_VALUES.spacingMd,
    min: 8,
    max: 32,
    step: 2,
  },
  {
    key: 'spacingLg',
    cssVar: '--td-size-8',
    label: '大间距',
    group: 'spacing',
    type: 'px',
    default: DEFAULT_TOKEN_VALUES.spacingLg,
    min: 16,
    max: 48,
    step: 2,
  },
  {
    key: 'layoutPadding',
    cssVar: '--flow-layout-padding',
    label: '容器内边距',
    group: 'layout',
    type: 'px',
    default: DEFAULT_TOKEN_VALUES.layoutPadding,
    min: 0,
    max: 48,
    step: 2,
    description: 'LayoutContainer 等布局容器默认 padding',
  },
  {
    key: 'layoutGap',
    cssVar: '--flow-layout-gap',
    label: '布局间距',
    group: 'layout',
    type: 'px',
    default: DEFAULT_TOKEN_VALUES.layoutGap,
    min: 0,
    max: 32,
    step: 2,
    description: 'Flex / Grid 行列间距（column-gap / row-gap）',
  },
  {
    key: 'layoutSectionGap',
    cssVar: '--flow-layout-section-gap',
    label: '区块间距',
    group: 'layout',
    type: 'px',
    default: DEFAULT_TOKEN_VALUES.layoutSectionGap,
    min: 8,
    max: 64,
    step: 4,
    description: '页面区块、模块之间的垂直间距',
  },
  {
    key: 'radiusSmall',
    cssVar: '--td-radius-small',
    label: '小圆角',
    group: 'radius',
    type: 'px',
    default: DEFAULT_TOKEN_VALUES.radiusSmall,
    min: 0,
    max: 8,
    step: 1,
  },
  {
    key: 'radiusDefault',
    cssVar: '--td-radius-default',
    label: '默认圆角',
    group: 'radius',
    type: 'px',
    default: DEFAULT_TOKEN_VALUES.radiusDefault,
    min: 0,
    max: 12,
    step: 1,
  },
  {
    key: 'radiusMedium',
    cssVar: '--td-radius-medium',
    label: '中圆角',
    group: 'radius',
    type: 'px',
    default: DEFAULT_TOKEN_VALUES.radiusMedium,
    min: 0,
    max: 16,
    step: 1,
  },
  {
    key: 'radiusLarge',
    cssVar: '--td-radius-large',
    label: '大圆角',
    group: 'radius',
    type: 'px',
    default: DEFAULT_TOKEN_VALUES.radiusLarge,
    min: 0,
    max: 24,
    step: 1,
  },
  {
    key: 'motionDuration',
    cssVar: '--flow-motion-duration',
    label: '过渡时长',
    group: 'motion',
    type: 'px',
    default: DEFAULT_TOKEN_VALUES.motionDuration,
    min: 0,
    max: 2000,
    step: 10,
    description: '组件状态切换默认过渡时长（ms）',
  },
  {
    key: 'motionDelay',
    cssVar: '--flow-motion-delay',
    label: '过渡延迟',
    group: 'motion',
    type: 'px',
    default: DEFAULT_TOKEN_VALUES.motionDelay,
    min: 0,
    max: 2000,
    step: 10,
  },
  {
    key: 'motionEasing',
    cssVar: '--flow-motion-easing',
    label: '缓动曲线',
    group: 'motion',
    type: 'fontWeight',
    default: DEFAULT_TOKEN_VALUES.motionEasing,
    description: 'ease / ease-in / ease-out / ease-in-out / linear',
  },
  {
    key: 'motionProperty',
    cssVar: '--flow-motion-property',
    label: '过渡属性',
    group: 'motion',
    type: 'fontFamily',
    default: DEFAULT_TOKEN_VALUES.motionProperty,
    description: 'all 或逗号分隔的 CSS 属性列表',
  },
]

export const TOKEN_GROUP_LABELS: Record<TokenGroup, string> = {
  color: '色彩',
  fonts: '字体',
  spacing: '间距',
  radius: '圆角',
  layout: '布局尺寸',
  motion: '动效',
}

export function getDefsByGroup(group: TokenGroup | 'all') {
  if (group === 'all') return DESIGN_TOKEN_DEFS
  return DESIGN_TOKEN_DEFS.filter((d) => d.group === group)
}
