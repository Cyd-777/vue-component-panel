import { getColorPaletteOverrideVars } from './colorPaletteOverrides'
import { DESIGN_TOKEN_DEFS, type DesignTokenValues } from './designTokenDefs'
import {
  coerceColorValue,
  generateBrandScale,
  isRgbColor,
  mixHex,
  normalizeHex,
} from './colorUtils'

const STYLE_ID = 'flow-panel-design-tokens'
const ROOT_SELECTOR = ':root, :root[theme-mode="light"], #app'

function px(value: string): string {
  const n = Number(value)
  return Number.isFinite(n) ? `${n}px` : value
}

function lineHeightFor(fontSize: number): number {
  return Math.round(fontSize * 1.57)
}

function collectBrandVars(vars: Record<string, string>, brandRaw: string) {
  const main = normalizeHex(brandRaw)
  const scale = generateBrandScale(main)
  scale.forEach((color, index) => {
    vars[`--td-brand-color-${index + 1}`] = color
  })
  vars['--td-brand-color'] = main
  vars['--td-brand-color-7'] = main
  vars['--td-brand-color-hover'] = scale[5] ?? main
  vars['--td-brand-color-active'] = scale[7] ?? main
  vars['--td-brand-color-focus'] = scale[1] ?? main
  vars['--td-brand-color-light'] = scale[0] ?? main
  vars['--td-brand-color-light-hover'] = scale[1] ?? main
  vars['--td-brand-color-disabled'] = scale[2] ?? main
  vars['--td-text-color-brand'] = main
  vars['--td-text-color-link'] = scale[7] ?? main
}

function collectSemanticVars(
  vars: Record<string, string>,
  key: 'success' | 'warning' | 'error',
  raw: string,
) {
  const color = coerceColorValue(raw)
  if (isRgbColor(color)) {
    vars[`--td-${key}-color`] = color
    return
  }
  const main = normalizeHex(color)
  vars[`--td-${key}-color`] = main
  vars[`--td-${key}-color-hover`] = mixHex(main, '#ffffff', 0.12)
  vars[`--td-${key}-color-active`] = mixHex(main, '#000000', 0.1)
  vars[`--td-${key}-color-light`] = mixHex(main, '#ffffff', 0.88)
}

function formatOptionalPx(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return '0px'
  if (/px|em|rem|%/.test(trimmed)) return trimmed
  const n = Number(trimmed)
  return Number.isFinite(n) ? `${n}px` : trimmed
}

function collectFontVars(vars: Record<string, string>, values: DesignTokenValues) {
  const family = values.fontFamily
  const body = Number(values.fontSizeBody)
  const title = Number(values.fontSizeTitle)
  const headline = Number(values.fontSizeHeadline)
  const wReg = values.fontWeightRegular
  const wBold = values.fontWeightSemibold

  const bodyLh = Number(values.lineHeightBody) || lineHeightFor(body)
  const titleLh = Number(values.lineHeightTitle) || lineHeightFor(title)
  const headlineLh = Number(values.lineHeightHeadline) || lineHeightFor(headline)

  vars['--td-font-family'] = family
  vars['--td-font-family-medium'] = family
  vars['--flow-font-weight-regular'] = wReg
  vars['--flow-font-weight-semibold'] = wBold

  vars['--flow-font-style'] = values.fontStyle || 'normal'
  vars['--flow-font-variant'] = values.fontVariant || 'normal'
  vars['--flow-font-stretch'] = values.fontStretch || 'normal'
  vars['--flow-font-kerning'] = values.fontKerning || 'auto'
  vars['--flow-font-feature-settings'] = values.fontFeatureSettings || 'normal'
  vars['--flow-font-variation-settings'] = values.fontVariationSettings || 'normal'
  vars['--flow-font-synthesis'] = values.fontSynthesis || 'weight style'
  vars['--flow-font-optical-sizing'] = values.fontOpticalSizing || 'auto'
  vars['--flow-text-transform'] = values.textTransform || 'none'
  vars['--flow-text-decoration-line'] = values.textDecorationLine || 'none'
  vars['--flow-text-decoration-style'] = values.textDecorationStyle || 'solid'
  vars['--flow-text-decoration-color'] = values.textDecorationColor || 'currentColor'
  vars['--flow-text-decoration-thickness'] = values.textDecorationThickness || 'auto'
  vars['--flow-letter-spacing'] = formatOptionalPx(values.letterSpacing)
  vars['--flow-word-spacing'] = formatOptionalPx(values.wordSpacing)
  vars['--flow-font-smooth'] = values.fontSmooth || 'auto'

  vars['--flow-line-height-body'] = `${bodyLh}px`
  vars['--flow-line-height-title'] = `${titleLh}px`
  vars['--flow-line-height-headline'] = `${headlineLh}px`

  vars['--td-font-size-body-medium'] = px(values.fontSizeBody)
  vars['--td-font-size-body-small'] = px(String(Math.max(12, body - 2)))
  vars['--td-font-size-body-large'] = px(String(body + 2))
  vars['--td-font-size-title-medium'] = px(values.fontSizeTitle)
  vars['--td-font-size-title-small'] = px(String(Math.max(12, title - 2)))
  vars['--td-font-size-title-large'] = px(String(title + 2))
  vars['--td-font-size-headline-small'] = px(values.fontSizeHeadline)

  vars['--td-line-height-body-medium'] = `${bodyLh}px`
  vars['--td-line-height-title-medium'] = `${titleLh}px`
  vars['--td-line-height-headline-small'] = `${headlineLh}px`

  vars['--td-font-body-medium'] = `${wReg} ${body}px / ${bodyLh}px ${family}`
  vars['--td-font-title-medium'] = `${wBold} ${title}px / ${titleLh}px ${family}`
  vars['--td-font-headline-small'] = `${wBold} ${headline}px / ${headlineLh}px ${family}`
}

function collectSpacingVars(vars: Record<string, string>, values: DesignTokenValues) {
  const unit = Number(values.spacingUnit)
  const md = Number(values.spacingMd)
  const lg = Number(values.spacingLg)

  if (Number.isFinite(unit)) {
    vars['--td-size-2'] = `${unit}px`
    vars['--td-size-3'] = `${unit * 1.5}px`
    vars['--td-size-4'] = `${unit * 2}px`
    vars['--td-size-5'] = `${unit * 3}px`
  }
  if (Number.isFinite(md)) {
    vars['--td-size-6'] = `${md}px`
    vars['--td-comp-margin-m'] = `${md}px`
    vars['--td-comp-paddingLR-m'] = `${md}px`
  }
  if (Number.isFinite(lg)) {
    vars['--td-size-8'] = `${lg}px`
    vars['--td-comp-margin-l'] = `${lg}px`
  }
}

export function normalizeDesignTokenValues(
  values: DesignTokenValues,
): DesignTokenValues {
  const next = { ...values }
  for (const def of DESIGN_TOKEN_DEFS) {
    const raw = values[def.key]
    if (def.type === 'color') {
      next[def.key] = coerceColorValue(raw) as DesignTokenValues[typeof def.key]
    } else if (
      def.type === 'px'
      || def.type === 'fontWeight'
      || def.type === 'enum'
      || def.type === 'string'
      || def.type === 'fontFamily'
    ) {
      next[def.key] = String(raw) as DesignTokenValues[typeof def.key]
    }
  }
  return next
}

export function buildDesignTokenCssVars(values: DesignTokenValues): Record<string, string> {
  const v = normalizeDesignTokenValues(values)
  const vars: Record<string, string> = {}

  collectBrandVars(vars, v.brandColor)
  collectSemanticVars(vars, 'success', v.successColor)
  collectSemanticVars(vars, 'warning', v.warningColor)
  collectSemanticVars(vars, 'error', v.errorColor)

  vars['--td-text-color-primary'] = coerceColorValue(v.textPrimary)
  vars['--td-text-color-secondary'] = coerceColorValue(v.textSecondary)
  vars['--td-bg-color-page'] = coerceColorValue(v.bgPage)
  vars['--td-bg-color-container'] = coerceColorValue(v.bgContainer)
  vars['--td-component-border'] = coerceColorValue(v.borderColor)
  vars['--td-component-stroke'] = coerceColorValue(v.borderColor)

  collectFontVars(vars, v)
  collectSpacingVars(vars, v)

  vars['--td-radius-small'] = px(v.radiusSmall)
  vars['--td-radius-default'] = px(v.radiusDefault)
  vars['--td-radius-medium'] = px(v.radiusMedium)
  vars['--td-radius-large'] = px(v.radiusLarge)

  vars['--td-shadow-1'] = '0 2px 8px rgba(0,0,0,0.08)'
  vars['--td-shadow-2'] = '0 4px 16px rgba(0,0,0,0.1)'
  vars['--td-shadow-3'] = '0 8px 32px rgba(0,0,0,0.12)'

  const motionDuration = Number(v.motionDuration)
  const motionDelay = Number(v.motionDelay)
  vars['--flow-motion-duration'] = Number.isFinite(motionDuration) ? `${motionDuration}ms` : '150ms'
  vars['--flow-motion-delay'] = Number.isFinite(motionDelay) ? `${motionDelay}ms` : '0ms'
  vars['--flow-motion-easing'] = v.motionEasing.trim() || 'ease'
  vars['--flow-motion-property'] = v.motionProperty.trim() || 'all'

  return vars
}

export function applyDesignTokensToDocument(values: DesignTokenValues) {
  const vars = {
    ...buildDesignTokenCssVars(values),
    ...getColorPaletteOverrideVars(),
  }
  const cssBody = Object.entries(vars)
    .map(([key, val]) => `  ${key}: ${val};`)
    .join('\n')

  let el = document.getElementById(STYLE_ID)
  if (!el) {
    el = document.createElement('style')
    el.id = STYLE_ID
    document.head.appendChild(el)
  }
  el.textContent = `${ROOT_SELECTOR} {\n${cssBody}\n}`

  const root = document.documentElement
  for (const [key, val] of Object.entries(vars)) {
    root.style.setProperty(key, val)
  }
}
