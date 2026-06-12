/**
 * 各 EffectType 的 CSS 实现 — keyframes、transition、伪类触发
 */
import {
  effectStateField,
  isInteractionTrigger,
  triggerToCssPseudo,
  type EffectConfig,
  type EffectState,
  type EffectType,
} from './effectConfig'
import { normalizeMotionTimingValue } from './motionPresetOptions'

export type EffectRenderStrategy =
  | 'none'
  | 'transition-pseudo'
  | 'keyframes-self'
  | 'keyframes-pseudo'
  | 'keyframes-pseudo-after'

function sanitizeName(id: string, effectType: EffectType): string {
  return `flow-fx-${id.replace(/[^a-z0-9-]/gi, '-')}-${effectType}`
}

function formatMs(ms: number): string {
  return `${Math.max(0, Math.round(ms))}ms`
}

function stateLines(state: EffectState): string {
  return Object.entries(state)
    .filter(([, val]) => val !== undefined && val !== '')
    .map(([prop, val]) => `  ${prop}: ${val};`)
    .join('\n')
}

function transitionPropertyFor(config: EffectConfig): string {
  return config.performanceLevel === 'performance' ? 'transform, opacity' : 'all'
}

function animationBlock(config: EffectConfig, name: string): string {
  const iteration =
    config.iterations === 'infinite' ? 'infinite' : String(Math.max(1, config.iterations))
  return [
    `  animation-name: ${name};`,
    `  animation-duration: ${formatMs(config.duration)};`,
    `  animation-timing-function: ${normalizeMotionTimingValue(config.easing)};`,
    `  animation-delay: ${formatMs(config.delay)};`,
    `  animation-iteration-count: ${iteration};`,
    `  animation-direction: ${config.direction};`,
    `  animation-fill-mode: ${config.fillMode};`,
  ].join('\n')
}

/** 需要专用多帧 keyframes 的效果（非简单 from/to） */
const MULTI_FRAME_EFFECTS = new Set<EffectType>([
  'blink',
  'bounce-in',
  'shake',
  'jelly',
  'ripple',
  'typewriter',
])

/** 交互态下用 transition + 伪类即可准确表达的效果 */
const TRANSITION_PSEUDO_EFFECTS = new Set<EffectType>(['lift', 'press-down', 'none'])

export function getEffectRenderStrategy(config: EffectConfig): EffectRenderStrategy {
  if (config.effectType === 'none' || config.duration <= 0) return 'none'
  if (config.effectType === 'ripple') return 'keyframes-pseudo-after'

  if (isInteractionTrigger(config.trigger)) {
    if (TRANSITION_PSEUDO_EFFECTS.has(config.effectType)) return 'transition-pseudo'
    if (config.effectType === 'custom' && config.iterations === 1 && !MULTI_FRAME_EFFECTS.has(config.effectType)) {
      return 'transition-pseudo'
    }
    return 'keyframes-pseudo'
  }

  return 'keyframes-self'
}

/** 生成 @keyframes 定义；返回 null 表示无需 keyframes */
export function buildEffectKeyframes(config: EffectConfig): { name: string; css: string } | null {
  if (config.effectType === 'none' || config.duration <= 0) return null

  const name = sanitizeName(config.id, config.effectType)
  const { initialState, finalState, effectType } = config

  if (!MULTI_FRAME_EFFECTS.has(effectType)) {
    const from = stateLines(initialState)
    const to = stateLines(finalState)
    if (!from && !to) return null
    return {
      name,
      css: `@keyframes ${name} {
  from {
${from}
  }
  to {
${to}
  }
}`,
    }
  }

  switch (effectType) {
    case 'blink':
      return {
        name,
        css: `@keyframes ${name} {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.25; }
}`,
      }
    case 'bounce-in':
      return {
        name,
        css: `@keyframes ${name} {
  0% { opacity: 0; transform: scale(0.85); }
  60% { opacity: 1; transform: scale(1.06); }
  100% { opacity: 1; transform: scale(1); }
}`,
      }
    case 'shake':
      return {
        name,
        css: `@keyframes ${name} {
  0%, 100% { transform: translateX(0); }
  15% { transform: translateX(-6px); }
  30% { transform: translateX(5px); }
  45% { transform: translateX(-4px); }
  60% { transform: translateX(4px); }
  75% { transform: translateX(-2px); }
}`,
      }
    case 'jelly':
      return {
        name,
        css: `@keyframes ${name} {
  0%, 100% { transform: scale(1, 1); }
  25% { transform: scale(1.08, 0.92); }
  50% { transform: scale(0.94, 1.06); }
  75% { transform: scale(1.04, 0.98); }
}`,
      }
    case 'ripple':
      return {
        name,
        css: `@keyframes ${name} {
  0% { transform: scale(0.4); opacity: 0.45; }
  100% { transform: scale(1.4); opacity: 0; }
}`,
      }
    case 'typewriter':
      return {
        name,
        css: `@keyframes ${name} {
  from { clip-path: inset(0 100% 0 0); opacity: 0.6; }
  to { clip-path: inset(0 0 0 0); opacity: 1; }
}`,
      }
    default:
      return null
  }
}

function transitionBlock(config: EffectConfig): string {
  return [
    `  transition-property: ${transitionPropertyFor(config)};`,
    `  transition-duration: ${formatMs(config.duration)};`,
    `  transition-timing-function: ${normalizeMotionTimingValue(config.easing)};`,
    `  transition-delay: ${formatMs(config.delay)};`,
  ].join('\n')
}

function buildTransitionPseudoRules(cls: string, config: EffectConfig): string {
  const pseudo = triggerToCssPseudo(config.trigger)
  if (!pseudo) {
    const base = stateLines(config.initialState)
    return base ? `.${cls} {\n${transitionBlock(config)}\n${base}\n}` : `.${cls} {\n${transitionBlock(config)}\n}`
  }

  const baseState = stateLines(config.initialState)
  const finalState = stateLines(config.finalState)
  let rules = `.${cls} {\n${transitionBlock(config)}${baseState ? `\n${baseState}` : ''}\n}`
  if (finalState) {
    rules += `\n\n.${cls}${pseudo} {\n${finalState}\n}`
  }
  return rules
}

function buildKeyframesSelfRules(cls: string, config: EffectConfig, keyframes: { name: string; css: string }): string {
  const extra =
    config.effectType === 'flip'
      ? '  perspective: 900px;\n  transform-style: preserve-3d;\n'
      : config.effectType === 'typewriter'
        ? '  display: inline-block;\n  overflow: hidden;\n  white-space: nowrap;\n'
        : ''
  const base = stateLines(config.initialState)
  return `${keyframes.css}\n\n.${cls} {\n${extra}${animationBlock(config, keyframes.name)}${base ? `\n${base}` : ''}\n}`
}

function buildKeyframesPseudoRules(
  cls: string,
  config: EffectConfig,
  keyframes: { name: string; css: string },
): string {
  const pseudo = triggerToCssPseudo(config.trigger) ?? ':hover'
  const base = stateLines(config.initialState)
  return `${keyframes.css}\n\n.${cls} {\n${base ? `${base}\n` : ''}}\n\n.${cls}${pseudo} {\n${animationBlock(config, keyframes.name)}\n}`
}

function buildRippleRules(cls: string, config: EffectConfig, keyframes: { name: string; css: string }): string {
  const pseudo = triggerToCssPseudo(config.trigger) ?? ':active'
  return `${keyframes.css}

.${cls} {
  position: relative;
  overflow: hidden;
}

.${cls}::after {
  content: '';
  position: absolute;
  inset: 0;
  margin: auto;
  width: 40%;
  height: 40%;
  border-radius: 50%;
  background: color-mix(in srgb, var(--td-brand-color) 35%, transparent);
  opacity: 0;
  pointer-events: none;
  transform: scale(0.4);
}

.${cls}${pseudo}::after {
  ${animationBlock(config, keyframes.name)}
}`
}

/** 由 EffectConfig 生成完整 CSS 规则（preset class / theme class / 预览） */
export function effectConfigToCssRules(
  className: string,
  config: EffectConfig,
  options?: { preview?: boolean },
): string {
  const cls = className.startsWith('.') ? className.slice(1) : className
  const strategy = getEffectRenderStrategy(config)

  if (strategy === 'none') return `.${cls} {}`

  if (strategy === 'transition-pseudo') {
    return buildTransitionPseudoRules(cls, config)
  }

  const keyframes = buildEffectKeyframes(config)
  if (!keyframes) {
    return buildTransitionPseudoRules(cls, config)
  }

  if (strategy === 'keyframes-pseudo-after') {
    return buildRippleRules(cls, config, keyframes)
  }

  if (strategy === 'keyframes-pseudo') {
    return buildKeyframesPseudoRules(cls, config, keyframes)
  }

  let rules = buildKeyframesSelfRules(cls, config, keyframes)

  if (options?.preview && !isInteractionTrigger(config.trigger)) {
    rules += `\n\n.${cls} {\n  animation-iteration-count: infinite;\n  animation-direction: alternate;\n}`
  }

  return rules
}

/** 预览区：从 finalState 提取 inline transform（兼容旧预览变量） */
export function effectPreviewTransform(config: EffectConfig): string {
  return effectStateField(config.finalState, 'transform') || 'none'
}

/** 预览区：transition 相关 inline 变量 */
export function effectPreviewInlineStyle(config: EffectConfig): Record<string, string> {
  return {
    '--transition-duration': formatMs(config.duration),
    '--motion-preview-hover-transform': effectPreviewTransform(config),
  }
}
