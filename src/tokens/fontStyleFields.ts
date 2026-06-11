import type { DesignTokenDef, DesignTokenValues } from './designTokenDefs'

/** 字体模态窗分组（覆盖 CSS font / text 相关可设属性） */
export const FONT_EDITOR_SECTIONS: { title: string; keys: (keyof DesignTokenValues)[] }[] = [
  {
    title: '基础',
    keys: [
      'fontFamily',
      'fontSizeBody',
      'fontSizeTitle',
      'fontSizeHeadline',
      'fontWeightRegular',
      'fontWeightSemibold',
    ],
  },
  {
    title: '字体变体',
    keys: [
      'fontStyle',
      'fontVariant',
      'fontStretch',
      'fontSynthesis',
      'fontOpticalSizing',
      'fontKerning',
      'fontFeatureSettings',
      'fontVariationSettings',
    ],
  },
  {
    title: '排版',
    keys: [
      'lineHeightBody',
      'lineHeightTitle',
      'lineHeightHeadline',
      'letterSpacing',
      'wordSpacing',
    ],
  },
  {
    title: '文本装饰',
    keys: [
      'textTransform',
      'textDecorationLine',
      'textDecorationStyle',
      'textDecorationColor',
      'textDecorationThickness',
    ],
  },
  {
    title: '渲染',
    keys: ['fontSmooth'],
  },
]

/** 预览区使用的 CSS 变量映射 */
export const FONT_PREVIEW_CSS_VARS = {
  family: '--td-font-family',
  size: '--td-font-size-body-medium',
  weight: '--flow-font-weight-regular',
  style: '--flow-font-style',
  variant: '--flow-font-variant',
  stretch: '--flow-font-stretch',
  lineHeight: '--flow-line-height-body',
  letterSpacing: '--flow-letter-spacing',
  wordSpacing: '--flow-word-spacing',
  kerning: '--flow-font-kerning',
  featureSettings: '--flow-font-feature-settings',
  variationSettings: '--flow-font-variation-settings',
  synthesis: '--flow-font-synthesis',
  opticalSizing: '--flow-font-optical-sizing',
  textTransform: '--flow-text-transform',
  decorationLine: '--flow-text-decoration-line',
  decorationStyle: '--flow-text-decoration-style',
  decorationColor: '--flow-text-decoration-color',
  decorationThickness: '--flow-text-decoration-thickness',
  smooth: '--flow-font-smooth',
} as const

export function fontDefsBySection(
  allDefs: DesignTokenDef[],
): { title: string; defs: DesignTokenDef[] }[] {
  const map = new Map(allDefs.map((d) => [d.key, d]))
  return FONT_EDITOR_SECTIONS.map((section) => ({
    title: section.title,
    defs: section.keys.map((k) => map.get(k)).filter(Boolean) as DesignTokenDef[],
  }))
}
