/**
 * 全局设置槽位 → :root CSS 变量与工具 class
 */
import { stylePresetCssClass, stylePresetCssVarPrefix } from './stylePresetDefs'
import { getStylePresetById } from './stylePresetStore'
import { effectConfigToCssRules, readEffectConfigFromPreset, themeMotionSlotToTrigger } from './effectConfig'
import { MOTION_HOVER_TRANSFORM_KEY } from './motionPresetOptions'
import {
  radiusTokenCssVar,
  shadowLevelCssVar,
  THEME_MOTION_INTERACTION_SLOTS,
  THEME_MOTION_LIFECYCLE_SLOTS,
  themeMotionPresetSettingKey,
  themeMotionSlotCssVarPrefix,
  type ThemeMotionSlotKey,
  type ThemeUsageSettings,
} from './themeUsageDefs'

const STYLE_ID = 'flow-theme-usage-css'

const FONT_SLOTS: { key: keyof ThemeUsageSettings; cssSuffix: string }[] = [
  { key: 'headlineFontPresetId', cssSuffix: 'headline' },
  { key: 'titleFontPresetId', cssSuffix: 'title' },
  { key: 'bodyFontPresetId', cssSuffix: 'body' },
  { key: 'captionFontPresetId', cssSuffix: 'caption' },
]

const EFFECT_SLOTS: { key: keyof ThemeUsageSettings; cssSuffix: string }[] = [
  { key: 'cardEffectPresetId', cssSuffix: 'card' },
  { key: 'popupEffectPresetId', cssSuffix: 'popup' },
  { key: 'controlEffectPresetId', cssSuffix: 'control' },
]

function presetVarRef(presetId: string, cssProperty: string): string {
  const suffix = cssProperty.replace(/^-webkit-/, 'webkit-')
  return `var(${stylePresetCssVarPrefix(presetId)}-${suffix})`
}

function appendPresetRefVars(lines: string[], prefix: string, presetId: string, properties: string[]) {
  if (!presetId) return
  const preset = getStylePresetById(presetId)
  if (!preset) return
  lines.push(`  ${prefix}-preset-id: '${presetId}';`)
  lines.push(`  ${prefix}-class: '${stylePresetCssClass(presetId)}';`)
  for (const prop of properties) {
    lines.push(`  ${prefix}-${prop}: ${presetVarRef(presetId, prop)};`)
  }
}

function buildMotionTriggerRules(slot: string, presetId: string): string {
  const preset = getStylePresetById(presetId)
  if (!preset || preset.category !== 'motion') return ''

  const config = readEffectConfigFromPreset(preset)
  return effectConfigToCssRules(`flow-theme-motion-${slot}`, {
    ...config,
    trigger: themeMotionSlotToTrigger(slot as ThemeMotionSlotKey),
  })
}

export function applyThemeUsageToDocument(state: ThemeUsageSettings): void {
  const lines: string[] = []

  for (const { key, cssSuffix } of FONT_SLOTS) {
    const presetId = state[key] as string
    appendPresetRefVars(lines, `--flow-theme-font-${cssSuffix}`, presetId, [
      'font-family',
      'font-size',
      'font-weight',
      'line-height',
    ])
  }

  for (const { key, cssSuffix } of EFFECT_SLOTS) {
    const presetId = state[key] as string
    appendPresetRefVars(lines, `--flow-theme-effect-${cssSuffix}`, presetId, [
      'border-radius',
      'box-shadow',
      'border',
      'filter',
      'opacity',
    ])
  }

  lines.push(`  --flow-theme-radius-card: var(${radiusTokenCssVar(state.cardRadiusToken)});`)
  lines.push(`  --flow-theme-radius-control: var(${radiusTokenCssVar(state.controlRadiusToken)});`)
  lines.push(`  --flow-theme-shadow-card: var(${shadowLevelCssVar(state.cardShadowLevel)});`)

  const motionRules: string[] = []
  for (const slot of [...THEME_MOTION_INTERACTION_SLOTS, ...THEME_MOTION_LIFECYCLE_SLOTS]) {
    const settingKey = themeMotionPresetSettingKey(slot)
    const presetId = state[settingKey] as string
    const prefix = themeMotionSlotCssVarPrefix(slot)
    appendPresetRefVars(lines, prefix, presetId, [
      'transition-property',
      'transition-duration',
      'transition-timing-function',
      'transition-delay',
    ])
    if (presetId) {
      const preset = getStylePresetById(presetId)
      const hoverTransform = preset?.properties[MOTION_HOVER_TRANSFORM_KEY]
      if (hoverTransform) {
        lines.push(`  ${prefix}-hover-transform: ${hoverTransform};`)
      }
      if (THEME_MOTION_INTERACTION_SLOTS.includes(slot)) {
        const triggerRule = buildMotionTriggerRules(slot, presetId)
        if (triggerRule) motionRules.push(triggerRule)
      }
    }
  }

  const css = `:root {\n${lines.join('\n')}\n}\n\n${motionRules.join('\n\n')}`

  let el = document.getElementById(STYLE_ID)
  if (!el) {
    el = document.createElement('style')
    el.id = STYLE_ID
    document.head.appendChild(el)
  }
  el.textContent = css
}
