import { contrastRatio, formatContrastRatio, type WcagTextSize } from './colorUtils'
import {
  formatVisualDelta,
  hexToLab,
  hueDifference,
  VISUAL_DELTA_THRESHOLD,
  visualSeparation,
} from './perceptualColor'

export type ColorRuleLevel = 'error' | 'warn' | 'info'

/** 与 swatchTextColor 策略 id 一致 */
export type SwatchTextStrategyId =
  | 'on-light'
  | 'on-tint'
  | 'on-deep'
  | 'on-saturated'

export type ColorRuleContextKind =
  | 'functional-scale'
  | 'functional-header'
  | 'neutral-scale'
  | 'auto'

export interface ColorRuleFinding {
  id: string
  level: ColorRuleLevel
  title: string
  message: string
  /** 色彩理论 / 视错觉说明 */
  theory?: string
}

export interface ColorRuleReport {
  /** 无 error 级问题 */
  passes: boolean
  visualDelta: number
  visualDeltaLabel: string
  minVisualDelta: number
  passesVisualSeparation: boolean
  findings: ColorRuleFinding[]
  referenceWcagRatio: number
  referenceWcagLabel: string
}

const DEEP_STRATEGIES: SwatchTextStrategyId[] = ['on-deep', 'on-saturated']
const LIGHT_STRATEGIES: SwatchTextStrategyId[] = ['on-light', 'on-tint']

function isWhiteFg(fgHex: string): boolean {
  const lab = hexToLab(fgHex)
  return lab.L > 92 && lab.C < 8
}

function isBlackFg(fgHex: string): boolean {
  const lab = hexToLab(fgHex)
  return lab.L < 12 && lab.C < 8
}

function push(
  list: ColorRuleFinding[],
  finding: ColorRuleFinding,
): void {
  list.push(finding)
}

/** 系统色彩规则检测 — 类似语法检查，基线为视觉感知 + 组件用法 */
export function runColorRules(
  fgHex: string,
  bgHex: string,
  textSize: WcagTextSize,
  strategy: SwatchTextStrategyId,
  bgPerceptualWeight: number,
): ColorRuleReport {
  const findings: ColorRuleFinding[] = []
  const fgLab = hexToLab(fgHex)
  const bgLab = hexToLab(bgHex)
  const deltaLStar = Math.abs(fgLab.L - bgLab.L)
  const deltaLp = visualSeparation(fgHex, bgHex)
  const deltaH = hueDifference(fgLab.h, bgLab.h)
  const minVisualDelta = VISUAL_DELTA_THRESHOLD[textSize]
  const passesVisualSeparation = deltaLp >= minVisualDelta

  if (!passesVisualSeparation) {
    push(findings, {
      id: 'visual-separation',
      level: 'error',
      title: '感知明度差不足',
      message: `${formatVisualDelta(deltaLp)}，需 ≥ ΔLp ${minVisualDelta}（CIELAB + 色相亮度补偿）`,
      theory:
        'CIE L*a*b* 均匀色彩空间（CIE, 1976）；Helmholtz–Kohlrausch 效应（Helmholtz; Kohlrausch）。',
    })
  } else {
    push(findings, {
      id: 'visual-separation',
      level: 'info',
      title: '感知明度差达标',
      message: `${formatVisualDelta(deltaLp)} ≥ ${minVisualDelta}`,
      theory: 'CIE L*a*b*（CIE, 1976）+ Helmholtz–Kohlrausch 效应。',
    })
  }

  const expectsLightText = DEEP_STRATEGIES.includes(strategy)
  const expectsDarkText = LIGHT_STRATEGIES.includes(strategy)

  if (expectsLightText && isBlackFg(fgHex)) {
    push(findings, {
      id: 'usage-deep-needs-light',
      level: 'error',
      title: '用法不符：深彩底应浅字',
      message: '当前为深底/深彩策略，却使用近黑字，违反组件库「深彩底 + 白字」规则。',
      theory: 'Itten 明度对比（Johannes Itten）；语义色彩角色（Flow 设计系统）。',
    })
  }

  if (expectsDarkText && isWhiteFg(fgHex)) {
    push(findings, {
      id: 'usage-light-needs-dark',
      level: 'error',
      title: '用法不符：浅彩底应深字',
      message: '当前为浅底/浅彩策略，却使用近白字，违反组件库「浅彩底 + 黑字」规则。',
      theory: 'Itten 明度对比（Johannes Itten）；Munsell 明度 Value（A. H. Munsell）。',
    })
  }

  if (bgPerceptualWeight >= 0.45 && isBlackFg(fgHex) && bgLab.C > 25) {
    push(findings, {
      id: 'illusion-heavy-bg-black-text',
      level: 'error',
      title: '视错觉风险：重色底 + 黑字',
      message: '背景视觉重量偏高且含饱和色相，黑字易与底色「糊边」，应优先白字或同色相浅字。',
      theory:
        'Helmholtz–Kohlrausch 效应；Mach 带（Ernst Mach, 1865）；格式塔视觉重量（Wertheimer; Arnheim）。',
    })
  }

  const isYellowFamily = bgLab.h >= 35 && bgLab.h <= 95 && bgLab.C > 18
  if (isYellowFamily && bgLab.L > 62 && isWhiteFg(fgHex)) {
    push(findings, {
      id: 'illusion-yellow-white',
      level: 'error',
      title: '视错觉：亮黄底不宜白字',
      message: '感知上最亮的是高饱和黄而非纯白，白字在亮黄底上易「融底」。',
      theory:
        'Itten 明度对比 — 黄为色轮最亮极；Helmholtz–Kohlrausch 效应 — 饱和黄视觉亮度高于无彩色白。',
    })
  }

  if (deltaLStar < 16 && deltaH > 55 && bgLab.C > 15 && fgLab.C > 5) {
    push(findings, {
      id: 'illusion-hue-without-lightness',
      level: 'warn',
      title: '视错觉：仅有色相差、明度接近',
      message: `ΔL* ${deltaLStar.toFixed(1)} 过小但色相差 ${deltaH.toFixed(0)}°，可能「看起来有对比、读起来费劲」。`,
      theory: '同时对比（Michel Eugène Chevreul, 1839）；Munsell 明度 Value 不足。',
    })
  }

  if (deltaH > 140 && deltaH < 220 && deltaLStar < 28) {
    push(findings, {
      id: 'illusion-complementary-vibration',
      level: 'warn',
      title: '视错觉：互补色振动',
      message: '近似互补色且明度接近，边界可能产生「颤动」感，不宜作正文搭配。',
      theory: '同时对比（Chevreul, 1839）— 互补并置边界颤动。',
    })
  }

  const wcagRatio = contrastRatio(fgHex, bgHex)
  push(findings, {
    id: 'reference-wcag',
    level: 'info',
    title: '参考：传统 WCAG 对比度',
    message: `${formatContrastRatio(wcagRatio)}（仅作对照，非本系统判定基线）`,
    theory: 'WCAG 相对亮度对比度（W3C WAI, WCAG 2.x）— 仅参考对照。',
  })

  const passes = !findings.some((f) => f.level === 'error')

  return {
    passes,
    visualDelta: deltaLp,
    visualDeltaLabel: formatVisualDelta(deltaLp),
    minVisualDelta,
    passesVisualSeparation,
    findings,
    referenceWcagRatio: wcagRatio,
    referenceWcagLabel: formatContrastRatio(wcagRatio),
  }
}

export function colorRuleSummary(report: ColorRuleReport): string {
  if (report.passes) {
    return `${report.visualDeltaLabel} · 规则通过`
  }
  const first = report.findings.find((f) => f.level === 'error')
  return first ? `${first.title}：${first.message}` : '存在色彩规则问题'
}
