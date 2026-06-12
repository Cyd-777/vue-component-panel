/**
 * 全局样式规范模块 — 对外只读 API
 *
 * 供组件画板属性面板等消费已注入的主题变量与命名样式。
 * 其它分区请只从此文件导入，勿深入模块内部。
 */
export { getTokenValue, designTokenState } from './tokens/designTokenStore'
export {
  getPresetsByCategory,
  getStylePresetById,
} from './tokens/stylePresetStore'
export {
  presetPropertiesToInlineStyle,
  stylePresetCssClass,
  type StylePreset,
  type StylePresetCategory,
} from './tokens/stylePresetDefs'
export {
  resolveColorForPicker,
  parseColorToHex,
  contrastRatio,
} from './tokens/colorUtils'
export {
  getSwatchDisplayColors,
  pickTextColorOnBackground,
  computePerceptualWeight,
  isAmbiguousTextContrast,
  SWATCH_TEXT_STRATEGY,
} from './tokens/swatchTextColor'
export type {
  SwatchDisplayColors,
  SwatchDisplayOptions,
  SwatchUsageContext,
  SwatchTextStrategy,
} from './tokens/swatchTextColor'
export { runColorRules, colorRuleSummary } from './tokens/colorRuleChecker'
export type { ColorRuleReport, ColorRuleFinding } from './tokens/colorRuleChecker'
export {
  COLOR_THEORY_CATALOG,
  COLOR_RULE_LABELS,
  ruleTheoryLabels,
  ruleTheoryCitations,
  colorRuleLabel,
  theoriesForRule,
} from './tokens/colorTheoryCatalog'
export type { ColorTheoryRef } from './tokens/colorTheoryCatalog'
export {
  MOTION_TIMING_OPTIONS,
  MOTION_PROPERTY_PRESETS,
  MOTION_DURATION_PRESETS,
  MOTION_MOVE_PRESETS,
  MOTION_HOVER_TRANSFORM_KEY,
  formatMotionPresetSummary,
  formatMotionTransitionCss,
  motionTimingOptionId,
  motionMovePresetId,
  normalizeMotionTimingValue,
  parseCubicBezier,
  formatCubicBezier,
  timingToBezierPoints,
  resolveHoverTransform,
  type MotionTimingId,
  type MotionPropertyPresetId,
  type MotionMovePresetId,
  type CubicBezierPoints,
} from './tokens/motionPresetOptions'
export { themeUsageState, setThemeUsage, refreshThemeUsageCss } from './tokens/themeUsageStore'
export type { ThemeUsageSettings } from './tokens/themeUsageDefs'
export {
  THEME_USAGE_SECTIONS,
  THEME_MOTION_SLOT_KEYS,
  themeMotionSlotCssVarPrefix,
  themeMotionPresetSettingKey,
} from './tokens/themeUsageDefs'
export {
  MOTION_EFFECT_CONFIG_KEY,
  EFFECT_TYPE_GROUPS,
  EFFECT_TYPE_LABELS,
  TRIGGER_TYPE_LABELS,
  canonicalPresetEffectConfig,
  defaultEffectConfig,
  effectConfigSummary,
  effectConfigToCssRules,
  effectConfigToStylePresetProperties,
  effectTemplate,
  inferEffectConfigFromLegacyProperties,
  isInteractionTrigger,
  isLifecycleTrigger,
  mergeEffectConfigIntoProperties,
  motionEffectDisplayFromPreset,
  readEffectConfigFromPreset,
  resolveElementMotionBinding,
  themeMotionSlotToTrigger,
  triggerToCssPseudo,
  type EffectConfig,
  type EffectDirection,
  type EffectFillMode,
  type EffectPerformanceLevel,
  type EffectScope,
  type EffectState,
  type EffectType,
  type ElementMotionBinding,
  type TriggerType,
} from './tokens/effectConfig'
export {
  VISUAL_EFFECT_CONFIG_KEY,
  readVisualEffectFromPreset,
  mergeVisualEffectIntoProperties,
  visualEffectSummary,
  defaultVisualEffectConfig,
  type VisualEffectConfig,
} from './tokens/visualEffectConfig'
