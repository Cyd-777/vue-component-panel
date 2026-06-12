import { colorRuleSummary, runColorRules, type ColorRuleReport } from './colorRuleChecker'
import { formatVisualDeltaCoef, VISUAL_DELTA_THRESHOLD, visualSeparation } from './perceptualColor'
import {
  formatContrastRatio,
  getWcagCompliance,
  hexToRgb,
  minContrastForTextSize,
  normalizeHex,
  type WcagCompliance,
  type WcagTextSize,
} from './colorUtils'

/** 组件库色卡用字策略 */
export const SWATCH_TEXT_STRATEGY = {
  ON_LIGHT: 'on-light',
  ON_TINT: 'on-tint',
  ON_DEEP: 'on-deep',
  ON_SATURATED: 'on-saturated',
} as const

export type SwatchTextStrategy =
  (typeof SWATCH_TEXT_STRATEGY)[keyof typeof SWATCH_TEXT_STRATEGY]

export type SwatchUsageContext =
  | { kind: 'functional-scale'; scaleStep: number; mainStep: number }
  | { kind: 'functional-header'; mainStep: number }
  | { kind: 'neutral-scale'; scaleStep: number; mainStep: number }
  | { kind: 'auto' }

export interface SwatchDisplayOptions {
  /** 两可区对调黑白字 */
  textFlipped?: boolean
}

export interface SwatchDisplayColors {
  textColor: string
  /** 默认策略字色（未对调） */
  defaultTextColor: string
  /** 对调字色（黑 ↔ 白） */
  alternateTextColor: string
  /** ΔLp 黑白两可，可手动对调 */
  isAmbiguousContrast: boolean
  strategy: SwatchTextStrategy
  strategyLabel: string
  /** 感知视觉重量 0–1 */
  perceptualWeight: number
  /** 色彩规则检测报告（视觉基线） */
  rules: ColorRuleReport
  /** 规则是否通过（无 error） */
  passesRules: boolean
  visualDeltaLabel: string
  /** 传统 WCAG，仅参考 */
  referenceWcagLabel: string
  /** @deprecated 使用 passesRules */
  passesAA: boolean
  ratioLabel: string
  minRequired: number
  compliance: WcagCompliance
}

const STRATEGY_LABEL: Record<SwatchTextStrategy, string> = {
  [SWATCH_TEXT_STRATEGY.ON_LIGHT]: '浅底黑字',
  [SWATCH_TEXT_STRATEGY.ON_TINT]: '浅彩底黑字',
  [SWATCH_TEXT_STRATEGY.ON_DEEP]: '深底白字',
  [SWATCH_TEXT_STRATEGY.ON_SATURATED]: '深彩底白字',
}

const TEXT_ON_LIGHT = '#000000'
const TEXT_ON_DEEP = '#ffffff'

/** 主色阶 / 功能色块：主色阶号偏深时默认走深彩白字 */
const FUNCTIONAL_MAIN_WEIGHT_THRESHOLD = 0.4

/** auto 模式阈值 */
const AUTO_WEIGHT_THRESHOLD = 0.38

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const [r, g, b] = hexToRgb(normalizeHex(hex)).map((c) => c / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      default:
        h = ((r - g) / d + 4) / 6
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 }
}

/**
 * 色相视觉重量：同明度下黄偏轻、蓝/红偏重（0–1）
 */
export function hueVisualWeight(h: number): number {
  const hNorm = ((h % 360) + 360) % 360
  const distFromYellow = Math.min(Math.abs(hNorm - 60), 360 - Math.abs(hNorm - 60))
  return 0.2 + Math.min(1, distFromYellow / 120) * 0.55
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(normalizeHex(hex)).map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * 感知视觉重量（0–1）：综合相对亮度、饱和度、HSL 明度、色相轻重
 */
export function computePerceptualWeight(hex: string): number {
  const bg = normalizeHex(hex)
  const lum = relativeLuminance(bg)
  const { h, s, l } = hexToHsl(bg)
  const darkFactor = 1 - lum
  const satFactor = s / 100
  const hslLightFactor = (100 - l) / 100
  const hueFactor = hueVisualWeight(h)
  return (
    darkFactor * 0.4
    + satFactor * 0.25
    + hueFactor * 0.2
    + hslLightFactor * 0.15
  )
}

function alternateTextColor(textColor: string): string {
  return textColor === TEXT_ON_DEEP ? TEXT_ON_LIGHT : TEXT_ON_DEEP
}

function strategyForTextColor(
  textColor: string,
  strategy: SwatchTextStrategy,
): SwatchTextStrategy {
  if (textColor === TEXT_ON_DEEP) {
    if (strategy === SWATCH_TEXT_STRATEGY.ON_LIGHT) return SWATCH_TEXT_STRATEGY.ON_DEEP
    if (strategy === SWATCH_TEXT_STRATEGY.ON_TINT) return SWATCH_TEXT_STRATEGY.ON_SATURATED
    return strategy
  }
  if (textColor === TEXT_ON_LIGHT) {
    if (strategy === SWATCH_TEXT_STRATEGY.ON_DEEP) return SWATCH_TEXT_STRATEGY.ON_LIGHT
    if (strategy === SWATCH_TEXT_STRATEGY.ON_SATURATED) return SWATCH_TEXT_STRATEGY.ON_TINT
    return strategy
  }
  return strategy
}

/** ΔLp 黑白两可：二者均达标，或均不达标且差距很小 */
export function isAmbiguousTextContrast(
  bgHex: string,
  textSize: WcagTextSize = 'normal',
): boolean {
  const bg = normalizeHex(bgHex)
  const minDelta = VISUAL_DELTA_THRESHOLD[textSize]
  const deltaBlack = visualSeparation(TEXT_ON_LIGHT, bg)
  const deltaWhite = visualSeparation(TEXT_ON_DEEP, bg)
  const blackOk = deltaBlack >= minDelta
  const whiteOk = deltaWhite >= minDelta
  const spread = Math.abs(deltaBlack - deltaWhite)

  if (blackOk && whiteOk) return true
  if (!blackOk && !whiteOk && spread <= 4) return true
  return false
}

function strategyPick(
  strategy: SwatchTextStrategy,
  weight: number,
): { strategy: SwatchTextStrategy; textColor: string; weight: number } {
  const textColor =
    strategy === SWATCH_TEXT_STRATEGY.ON_DEEP
    || strategy === SWATCH_TEXT_STRATEGY.ON_SATURATED
      ? TEXT_ON_DEEP
      : TEXT_ON_LIGHT
  return { strategy, textColor, weight }
}

function pickByWeight(
  bgHex: string,
  threshold: number,
  lightStrategy: SwatchTextStrategy,
  deepStrategy: SwatchTextStrategy,
): { strategy: SwatchTextStrategy; textColor: string; weight: number } {
  const weight = computePerceptualWeight(bgHex)
  if (weight >= threshold) {
    return strategyPick(deepStrategy, weight)
  }
  return strategyPick(lightStrategy, weight)
}

function pickFunctionalScale(
  bgHex: string,
  scaleStep: number,
  mainStep: number,
): { strategy: SwatchTextStrategy; textColor: string; weight: number } {
  const weight = computePerceptualWeight(bgHex)

  if (scaleStep < mainStep) {
    return strategyPick(SWATCH_TEXT_STRATEGY.ON_TINT, weight)
  }
  if (scaleStep > mainStep) {
    return strategyPick(SWATCH_TEXT_STRATEGY.ON_SATURATED, weight)
  }
  if (weight >= FUNCTIONAL_MAIN_WEIGHT_THRESHOLD) {
    return strategyPick(SWATCH_TEXT_STRATEGY.ON_SATURATED, weight)
  }
  return strategyPick(SWATCH_TEXT_STRATEGY.ON_TINT, weight)
}

function resolveTextPick(
  bgHex: string,
  context: SwatchUsageContext,
): { strategy: SwatchTextStrategy; textColor: string; weight: number } {
  switch (context.kind) {
    case 'functional-scale':
      return pickFunctionalScale(bgHex, context.scaleStep, context.mainStep)
    case 'functional-header':
      return pickFunctionalScale(bgHex, context.mainStep, context.mainStep)
    case 'neutral-scale':
      return pickFunctionalScale(bgHex, context.scaleStep, context.mainStep)
    case 'auto':
    default:
      return pickByWeight(
        bgHex,
        AUTO_WEIGHT_THRESHOLD,
        SWATCH_TEXT_STRATEGY.ON_LIGHT,
        SWATCH_TEXT_STRATEGY.ON_DEEP,
      )
  }
}

/** 色卡展示：组件用法策略 + 系统色彩规则检测 */
export function getSwatchDisplayColors(
  bgHex: string,
  textSize: WcagTextSize = 'normal',
  context: SwatchUsageContext = { kind: 'auto' },
  options: SwatchDisplayOptions = {},
): SwatchDisplayColors {
  const bg = normalizeHex(bgHex)
  const minRequired = minContrastForTextSize(textSize)
  const pick = resolveTextPick(bg, context)
  const ambiguous = isAmbiguousTextContrast(bg, textSize)
  const defaultTextColor = pick.textColor
  const altTextColor = alternateTextColor(defaultTextColor)
  const flipped = ambiguous && options.textFlipped === true
  const textColor = flipped ? altTextColor : defaultTextColor
  const strategy = strategyForTextColor(textColor, pick.strategy)
  const compliance = getWcagCompliance(textColor, bg)
  const rules = runColorRules(
    textColor,
    bg,
    textSize,
    strategy,
    pick.weight,
  )

  return {
    textColor,
    defaultTextColor,
    alternateTextColor: altTextColor,
    isAmbiguousContrast: ambiguous,
    strategy,
    strategyLabel: STRATEGY_LABEL[strategy],
    perceptualWeight: pick.weight,
    rules,
    passesRules: rules.passes,
    visualDeltaLabel: rules.visualDeltaLabel,
    referenceWcagLabel: rules.referenceWcagLabel,
    passesAA: textSize === 'large' ? compliance.aaLarge : compliance.aaNormal,
    ratioLabel: formatContrastRatio(compliance.ratio),
    minRequired,
    compliance,
  }
}

export function pickTextColorOnBackground(
  bgHex: string,
  textSize: WcagTextSize = 'normal',
  context: SwatchUsageContext = { kind: 'auto' },
): string {
  return getSwatchDisplayColors(bgHex, textSize, context).textColor
}

export function swatchDisplayTitle(
  display: SwatchDisplayColors,
  _textSize: WcagTextSize = 'normal',
  flipped = false,
): string {
  const coef = formatVisualDeltaCoef(display.rules.visualDelta)
  const toggleHint = display.isAmbiguousContrast
    ? flipped
      ? ' · 已对调字色'
      : ' · 可开关对调字色'
    : ''
  return `${display.strategyLabel} · ${coef}${toggleHint} · ${colorRuleSummary(display.rules)} · WCAG 参考 ${display.referenceWcagLabel}`
}
