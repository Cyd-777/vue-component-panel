<script setup lang="ts">
/**
 * PropsPanel — 属性面板（t1：结构化控件 + 全部属性）
 */
import { computed, ref, watch } from 'vue'
import ScrubInput from './ScrubInput.vue'
import {
  getTagAttrEntries,
  getTagAttrsFromCode,
  parseInlineStyle,
  formatInlineStyle,
  rebuildTagLineWithAttrs,
  readBorderFromAttrs,
  parseStylePx,
  patchChildGridPlacement,
  readBorderWidthsFromAttrs,
  isBorderWidthLinked,
  buildBorderPlacementPatch,
  BORDER_WIDTH_LABELS,
  type BorderWidths,
  type AttrEntry,
} from './attrPatch'
import { findTagLineInSource } from './tagIndex'
import { getTagParentIndex } from './sourceManip'
import {
  parsePaddingAttr,
  formatPaddingAttr,
  type PaddingLinkMode,
  parseBorderRadiusAttr,
  isBorderRadiusAttrLinked,
  buildBorderRadiusPatch,
  RADIUS_LABELS,
  type BorderRadiusCorners,
} from './layoutSpacingLogic'
import { stampGridChildCoordinates, clearGridChildCoordinates } from './gridTrackLogic'
import { buildAxisSizeModePatch, type SizeMode } from './sizeModeLogic'
import {
  readFloatingFromStyle,
  applyFloatingToStyles,
  ensureParentPositionContext,
  type FloatingPosition,
} from './positionLogic'
import {
  detectShadowPreset,
  shadowCssForPreset,
  parseBlurPx,
  applyEffectToStyles,
} from './effectLogic'
import { SHADOW_PRESET_OPTIONS, type ShadowPresetId } from './designTokens'
import {
  BACKGROUND_COLOR_TOKENS,
  TEXT_COLOR_TOKENS,
  BORDER_COLOR_TOKENS,
  FONT_SIZE_TOKENS,
  FONT_FAMILY_TOKENS,
  FONT_WEIGHT_TOKENS,
  TEXT_DECORATIONS,
  detectTokenPreset,
  valueForTokenPreset,
  detectFontSizePreset,
  detectFontFamilyPreset,
  detectFontWeightPreset,
  RADIUS_TOKENS,
  spanFontSizeDisplay,
} from './tokenBindLogic'
import {
  ensureStoredPaddingLinkMode,
  getStoredPaddingLinkMode,
  setStoredPaddingLinkMode,
} from './paddingLinkModeStore'
import { resolveColorForPicker } from '../../tokens/colorUtils'
import { getTokenValue } from '../../tokens/designTokenStore'
import { getPresetsByCategory, getStylePresetById } from '../../tokens/stylePresetStore'
import {
  FLOW_INTERACTION_STATES,
  interactionStateLabel,
  type FlowInteractionStateId,
} from './interactionStateSpec'
import {
  readInteractionOverrides,
  writeInteractionOverrides,
} from './pseudoClassStyle'
import { readMotionRule, writeMotionRule } from './motionStyle'
import {
  MOTION_PROPERTY_PRESETS,
  MOTION_TIMING_OPTIONS,
  type MotionPropertyPresetId,
  type MotionTimingId,
} from './motionStyleSpec'
import {
  applyBorderRadiusToStyleDict,
  applyBorderToStyleDict,
  isBorderWidthLinkedInStyles,
  readBorderFromStyleDict,
  readBorderWidthsFromStyleDict,
} from './interactionStateBridge'

const props = defineProps<{
  code: string
  selectedId: string | null
  interactionState: FlowInteractionStateId
}>()

const emit = defineEmits<{
  (e: 'update:code', val: string): void
  (e: 'extreme-focus', focus: 'width-min' | 'width-max' | 'height-min' | 'height-max' | null): void
}>()

interface TagInfo {
  id: string
  tag: string
  attrs: Record<string, AttrEntry>
  label: string
}

const SIZE_MODES = ['hug', 'fill', 'fixed', 'minmax'] as const
const BORDER_STYLES = ['solid', 'dashed', 'dotted', 'none'] as const
const TEXT_ALIGNS = ['left', 'center', 'right', 'justify'] as const

const tags = computed<TagInfo[]>(() => {
  const result: TagInfo[] = []
  let i = 0
  while (true) {
    const loc = findTagLineInSource(props.code, i)
    if (!loc) break
    result.push({
      id: `el-${i}`,
      tag: loc.tagName,
      attrs: getTagAttrEntries(props.code, i),
      label: `<${loc.tagName}>`,
    })
    i++
  }
  return result
})

const selectedTag = computed(() =>
  props.selectedId ? tags.value.find((t) => t.id === props.selectedId) ?? null : null,
)

const isDefaultState = computed(() => props.interactionState === 'default')
const isMotionState = computed(() => props.interactionState === 'motion')

const tagIndex = computed(() => {
  if (!props.selectedId) return null
  const n = parseInt(props.selectedId.replace('el-', ''), 10)
  return Number.isNaN(n) ? null : n
})

const pseudoStyleSheet = computed(() => {
  if (isDefaultState.value || isMotionState.value || tagIndex.value == null) return {}
  return readInteractionOverrides(props.code, tagIndex.value, props.interactionState)
})

const motionStyles = computed(() => {
  if (!isMotionState.value || tagIndex.value == null) return {}
  return readMotionRule(props.code, tagIndex.value)
})

const interactionStateHint = computed(() => {
  const meta = FLOW_INTERACTION_STATES.find((s) => s.id === props.interactionState)
  return meta?.hint ?? ''
})

function patchPseudoStyles(mutator: (styles: Record<string, string>) => void) {
  if (isDefaultState.value || isMotionState.value || tagIndex.value == null) return
  const next = { ...pseudoStyleSheet.value }
  mutator(next)
  emit(
    'update:code',
    writeInteractionOverrides(props.code, tagIndex.value, props.interactionState, next),
  )
}

function patchMotionStyles(mutator: (styles: Record<string, string>) => void) {
  if (!isMotionState.value || tagIndex.value == null) return
  const next = { ...motionStyles.value }
  mutator(next)
  emit('update:code', writeMotionRule(props.code, tagIndex.value, next))
}

function parseCssMs(raw: string): number {
  const m = raw.trim().match(/^([\d.]+)(ms|s)?$/i)
  if (!m) return 0
  const n = Number(m[1])
  if (!Number.isFinite(n)) return 0
  return m[2]?.toLowerCase() === 's' ? Math.round(n * 1000) : Math.round(n)
}

function motionDurationMs(): number {
  return parseCssMs(motionStyles.value['transition-duration'] ?? '')
}

function ensureMotionBasics(styles: Record<string, string>) {
  if (!styles['transition-property']) styles['transition-property'] = getTokenValue('motionProperty')
  if (!styles['transition-timing-function']) styles['transition-timing-function'] = getTokenValue('motionEasing')
  if (!styles['transition-duration']) styles['transition-duration'] = `${getTokenValue('motionDuration')}ms`
  const delay = Number(getTokenValue('motionDelay'))
  if (!styles['transition-delay'] && Number.isFinite(delay) && delay > 0) {
    styles['transition-delay'] = `${delay}ms`
  }
}

function setMotionDurationMs(ms: number) {
  patchMotionStyles((styles) => {
    if (ms <= 0) {
      for (const key of Object.keys(styles)) delete styles[key]
      return
    }
    ensureMotionBasics(styles)
    styles['transition-duration'] = `${Math.round(ms)}ms`
    delete styles.transition
  })
}

function motionTiming(): MotionTimingId {
  const raw = motionStyles.value['transition-timing-function'] ?? 'ease'
  return MOTION_TIMING_OPTIONS.some((o) => o.id === raw) ? (raw as MotionTimingId) : 'ease'
}

function setMotionTiming(id: MotionTimingId) {
  patchMotionStyles((styles) => {
    if (motionDurationMs() <= 0) ensureMotionBasics(styles)
    styles['transition-timing-function'] = id
    delete styles.transition
  })
}

function motionDelayMs(): number {
  return parseCssMs(motionStyles.value['transition-delay'] ?? '0ms')
}

function setMotionDelayMs(ms: number) {
  patchMotionStyles((styles) => {
    if (motionDurationMs() <= 0 && ms <= 0) return
    if (motionDurationMs() <= 0) ensureMotionBasics(styles)
    if (ms <= 0) delete styles['transition-delay']
    else styles['transition-delay'] = `${Math.round(ms)}ms`
    delete styles.transition
  })
}

function motionPropertyPreset(): MotionPropertyPresetId {
  const raw = motionStyles.value['transition-property'] ?? 'all'
  const preset = MOTION_PROPERTY_PRESETS.find((p) => p.id !== 'custom' && p.value === raw)
  if (preset) return preset.id
  if (raw === 'all' || !raw) return 'all'
  return 'custom'
}

function setMotionPropertyPreset(id: MotionPropertyPresetId) {
  patchMotionStyles((styles) => {
    if (motionDurationMs() <= 0) ensureMotionBasics(styles)
    const preset = MOTION_PROPERTY_PRESETS.find((p) => p.id === id)
    if (id === 'custom') return
    if (preset?.value) styles['transition-property'] = preset.value
    delete styles.transition
  })
}

function motionPropertyCustom(): string {
  return motionStyles.value['transition-property'] ?? ''
}

function setMotionPropertyCustom(raw: string) {
  patchMotionStyles((styles) => {
    if (motionDurationMs() <= 0) ensureMotionBasics(styles)
    const trimmed = raw.trim()
    if (!trimmed) delete styles['transition-property']
    else styles['transition-property'] = trimmed
    delete styles.transition
  })
}

function motionAnimation(): string {
  return motionStyles.value.animation ?? ''
}

function setMotionAnimation(raw: string) {
  patchMotionStyles((styles) => {
    const trimmed = raw.trim()
    if (!trimmed) delete styles.animation
    else styles.animation = trimmed
  })
}

const isLayoutContainer = computed(() => selectedTag.value?.tag === 'LayoutContainer')
const isSpan = computed(() => selectedTag.value?.tag === 'span')

const isGridChild = computed(() => {
  if (!props.selectedId) return false
  const tagIndex = parseInt(props.selectedId.replace('el-', ''), 10)
  if (Number.isNaN(tagIndex)) return false
  const parent = getTagParentIndex(props.code, tagIndex)
  if (parent === null) return false
  const parentAttrs = getTagAttrsFromCode(props.code, parent)
  return parentAttrs.layout === 'grid'
})

const canEditPosition = computed(
  () => !isGridChild.value && (isLayoutContainer.value || isSpan.value),
)

const floatingPosition = computed(() => readFloatingFromStyle(getAttr('style')))

function commitFloatingPosition(values: FloatingPosition) {
  if (!props.selectedId) return
  const tagIndex = parseInt(props.selectedId.replace('el-', ''), 10)
  if (Number.isNaN(tagIndex)) return
  const loc = findTagLineInSource(props.code, tagIndex)
  if (!loc) return

  const styles = parseInlineStyle(getAttr('style'))
  applyFloatingToStyles(styles, values)
  const formatted = formatInlineStyle(styles)
  if (formatted) editValues.value.style = { value: formatted, dynamic: false }
  else delete editValues.value.style

  const lines = props.code.split('\n')
  const newLine = rebuildTagLineWithAttrs(lines[loc.lineIndex], loc.tagName, editValues.value)
  if (!newLine) return
  lines[loc.lineIndex] = newLine
  let code = lines.join('\n')
  if (values.enabled) {
    code = ensureParentPositionContext(code, tagIndex)
  }
  emit('update:code', code)
}

function setFloatingEnabled(on: boolean) {
  commitFloatingPosition({ ...floatingPosition.value, enabled: on })
}

function setFloatingLeft(raw: string) {
  commitFloatingPosition({
    ...floatingPosition.value,
    enabled: true,
    left: Math.round(Number(raw) || 0),
  })
}

function setFloatingTop(raw: string) {
  commitFloatingPosition({
    ...floatingPosition.value,
    enabled: true,
    top: Math.round(Number(raw) || 0),
  })
}

function setFloatingZIndex(raw: string) {
  commitFloatingPosition({ ...floatingPosition.value, zIndex: raw.trim() })
}

function gridPlacementCol(): string {
  const fromAttr = getAttr('grid-column')
  if (fromAttr) return fromAttr
  return getStyleProp('grid-column') || '1'
}

function gridPlacementRow(): string {
  const fromAttr = getAttr('grid-row')
  if (fromAttr) return fromAttr
  return getStyleProp('grid-row') || '1'
}

function setGridPlacementCol(raw: string) {
  if (!props.selectedId) return
  const tagIndex = parseInt(props.selectedId.replace('el-', ''), 10)
  if (Number.isNaN(tagIndex)) return
  const col = Math.max(1, Math.round(Number(raw) || 1))
  const row = Math.max(1, Math.round(Number(gridPlacementRow()) || 1))
  const next = patchChildGridPlacement(props.code, tagIndex, col, row)
  if (next) emit('update:code', next)
}

function setGridPlacementRow(raw: string) {
  if (!props.selectedId) return
  const tagIndex = parseInt(props.selectedId.replace('el-', ''), 10)
  if (Number.isNaN(tagIndex)) return
  const col = Math.max(1, Math.round(Number(gridPlacementCol()) || 1))
  const row = Math.max(1, Math.round(Number(raw) || 1))
  const next = patchChildGridPlacement(props.code, tagIndex, col, row)
  if (next) emit('update:code', next)
}

const editValues = ref<Record<string, AttrEntry>>({})
const prevSelectedId = ref<string | null>(null)

function syncEditValuesFromTag() {
  if (!selectedTag.value) {
    editValues.value = {}
    return
  }
  const next: Record<string, AttrEntry> = {}
  for (const [k, v] of Object.entries(selectedTag.value.attrs)) {
    next[k] = { ...v }
  }
  editValues.value = next
}

watch(
  () => props.selectedId,
  (newId) => {
    if (newId !== prevSelectedId.value) {
      prevSelectedId.value = newId
      syncEditValuesFromTag()
    }
  },
  { immediate: true },
)

/** 画布拖拽改尺寸等外部写回源码时，保持面板数值同步 */
watch(
  () => props.code,
  () => {
    if (props.selectedId) syncEditValuesFromTag()
  },
)

function getAttr(key: string, fallback = ''): string {
  return editValues.value[key]?.value ?? fallback
}

function flushTagLine() {
  if (!isDefaultState.value) return
  if (!props.selectedId) return
  const tagIndex = parseInt(props.selectedId.replace('el-', ''), 10)
  if (Number.isNaN(tagIndex)) return
  const loc = findTagLineInSource(props.code, tagIndex)
  if (!loc) return
  const lines = props.code.split('\n')
  const newLine = rebuildTagLineWithAttrs(lines[loc.lineIndex], loc.tagName, editValues.value)
  if (!newLine) return
  lines[loc.lineIndex] = newLine
  emit('update:code', lines.join('\n'))
}

function setAttr(key: string, value: string, dynamic = false) {
  if (!isDefaultState.value) return
  editValues.value[key] = { value, dynamic }
  flushTagLine()
}

function removeAttr(key: string) {
  if (!isDefaultState.value) return
  delete editValues.value[key]
  flushTagLine()
}

function toggleDynamic(key: string) {
  const entry = editValues.value[key]
  if (!entry) return
  entry.dynamic = !entry.dynamic
  flushTagLine()
}

function deleteAttr(key: string) {
  delete editValues.value[key]
  flushTagLine()
}

function updateAttr(key: string, value: string) {
  if (!editValues.value[key]) {
    editValues.value[key] = { value, dynamic: false }
  } else {
    editValues.value[key].value = value
  }
  flushTagLine()
}

const newAttrName = ref('')
const newAttrValue = ref('')
const newAttrDynamic = ref(false)

function addAttr() {
  const tag = selectedTag.value
  if (!tag || !newAttrName.value.trim()) return
  const key = newAttrName.value.trim()
  const value = newAttrValue.value
  if (key in tag.attrs) {
    updateAttr(key, value)
  } else {
    editValues.value[key] = { value, dynamic: newAttrDynamic.value }
    flushTagLine()
  }
  newAttrName.value = ''
  newAttrValue.value = ''
  newAttrDynamic.value = false
}

const LAYOUT_MODES = ['flex', 'grid', 'none'] as const

const flexDirection = computed(() => getAttr('flex-direction', 'row'))
const layoutMode = computed(() => getAttr('layout', 'flex'))
const widthMode = computed(() => getAttr('width-mode', 'fill'))
const heightMode = computed(() => getAttr('height-mode', 'hug'))

function setLayoutMode(mode: (typeof LAYOUT_MODES)[number]) {
  if (!props.selectedId) return
  const tagIndex = parseInt(props.selectedId.replace('el-', ''), 10)
  if (Number.isNaN(tagIndex)) return

  const prev = getAttr('layout', 'flex')
  if (prev === mode) return

  editValues.value['layout'] = { value: mode, dynamic: false }
  if (mode === 'grid') {
    if (!getAttr('cols')) editValues.value['cols'] = { value: '3', dynamic: true }
  } else if (mode === 'flex') {
    if (!getAttr('flex-direction')) {
      editValues.value['flex-direction'] = { value: 'row', dynamic: false }
    }
  }

  const loc = findTagLineInSource(props.code, tagIndex)
  if (!loc) return
  const lines = props.code.split('\n')
  const newLine = rebuildTagLineWithAttrs(lines[loc.lineIndex], loc.tagName, editValues.value)
  if (!newLine) return
  lines[loc.lineIndex] = newLine
  let code = lines.join('\n')

  if (prev === 'grid' && mode !== 'grid') {
    code = clearGridChildCoordinates(code, tagIndex)
  }
  if (mode === 'grid' && prev !== 'grid') {
    code = stampGridChildCoordinates(code, tagIndex)
  }

  emit('update:code', code)
}

function setFlexDirection(dir: 'row' | 'column') {
  setAttr('flex-direction', dir, false)
}

function setSizeMode(axis: 'width' | 'height', mode: string) {
  const current = Object.fromEntries(
    Object.entries(editValues.value).map(([k, v]) => [k, v.value]),
  )
  const patch = buildAxisSizeModePatch(axis, mode as SizeMode, current)
  for (const [key, entry] of Object.entries(patch)) {
    if (entry === null) delete editValues.value[key]
    else editValues.value[key] = { ...entry }
  }
  flushTagLine()
}

function setNumericAttr(key: string, raw: string, fallback = '0') {
  const v = raw.trim() === '' ? fallback : raw.trim()
  setAttr(key, v, true)
}

function focusExtreme(axis: 'width' | 'height', kind: 'min' | 'max') {
  emit('extreme-focus', `${axis}-${kind}`)
}

function blurExtreme() {
  emit('extreme-focus', null)
}

function getStyleProp(prop: string): string {
  if (!isDefaultState.value) return pseudoStyleSheet.value[prop] ?? ''
  return parseInlineStyle(getAttr('style'))[prop] ?? ''
}

function setStyleProp(prop: string, value: string) {
  if (!isDefaultState.value) {
    patchPseudoStyles((styles) => {
      if (value) styles[prop] = value
      else delete styles[prop]
    })
    return
  }
  const styles = parseInlineStyle(getAttr('style'))
  if (value) styles[prop] = value
  else delete styles[prop]
  const formatted = formatInlineStyle(styles)
  if (formatted) setAttr('style', formatted, false)
  else removeAttr('style')
}

const shadowPreset = ref<ShadowPresetId>('none')
const shadowCustom = ref('')

function syncEffectFromAttrs() {
  const boxShadow = getStyleProp('box-shadow')
  shadowPreset.value = detectShadowPreset(boxShadow)
  shadowCustom.value = shadowPreset.value === 'custom' ? boxShadow : ''
}

watch(
  () => [props.selectedId, props.interactionState] as const,
  () => syncEffectFromAttrs(),
  { immediate: true },
)

watch(
  () => props.code,
  () => {
    if (props.selectedId) syncEffectFromAttrs()
  },
)

function commitEffectStyles(mutator: (styles: Record<string, string>) => void) {
  if (!isDefaultState.value) {
    patchPseudoStyles(mutator)
    return
  }
  const styles = parseInlineStyle(getAttr('style'))
  mutator(styles)
  const formatted = formatInlineStyle(styles)
  if (formatted) setAttr('style', formatted, false)
  else removeAttr('style')
}

function applyShadowFromPanel() {
  commitEffectStyles((styles) => {
    const shadow = shadowCssForPreset(shadowPreset.value, shadowCustom.value)
    applyEffectToStyles(styles, shadow, parseBlurPx(styles.filter ?? ''))
  })
}

function setShadowPreset(id: ShadowPresetId) {
  shadowPreset.value = id
  applyShadowFromPanel()
}

function setShadowCustom(raw: string) {
  shadowCustom.value = raw
  shadowPreset.value = 'custom'
  applyShadowFromPanel()
}

function setEffectBlur(raw: string) {
  const blur = Math.max(0, Number(raw) || 0)
  commitEffectStyles((styles) => {
    applyEffectToStyles(styles, styles['box-shadow'] ?? '', blur)
  })
}

const borderValues = computed(() => {
  if (!isDefaultState.value) return readBorderFromStyleDict(pseudoStyleSheet.value)
  return readBorderFromAttrs(editValues.value)
})

const borderWidthValues = computed((): BorderWidths => {
  if (!isDefaultState.value) return readBorderWidthsFromStyleDict(pseudoStyleSheet.value)
  return readBorderWidthsFromAttrs(editValues.value)
})

const borderWidthLinked = ref(true)

watch(
  () => [props.selectedId, props.interactionState, props.code] as const,
  () => {
    if (!props.selectedId || !isLayoutContainer.value) return
    borderWidthLinked.value = isDefaultState.value
      ? isBorderWidthLinked(editValues.value)
      : isBorderWidthLinkedInStyles(pseudoStyleSheet.value)
  },
  { immediate: true },
)

watch(
  () => props.code,
  () => {
    if (!props.selectedId || !isLayoutContainer.value) return
    borderWidthLinked.value = isDefaultState.value
      ? isBorderWidthLinked(editValues.value)
      : isBorderWidthLinkedInStyles(pseudoStyleSheet.value)
  },
)

function applyBorderPlacement(
  widths: BorderWidths,
  linked?: boolean,
  style?: string,
  color?: string,
) {
  const v = borderValues.value
  if (!isDefaultState.value) {
    patchPseudoStyles((styles) => {
      applyBorderToStyleDict(
        styles,
        widths,
        style ?? v.style ?? 'solid',
        color ?? v.color ?? '#dcdcdc',
        linked ?? borderWidthLinked.value,
      )
    })
    return
  }
  const patch = buildBorderPlacementPatch(
    widths,
    style ?? v.style ?? 'solid',
    color ?? v.color ?? '#dcdcdc',
    linked ?? borderWidthLinked.value,
    editValues.value.style?.value,
  )
  for (const [key, entry] of Object.entries(patch)) {
    if (entry === null) delete editValues.value[key]
    else editValues.value[key] = { ...entry }
  }
  flushTagLine()
}

function setBorderWidthLinked(val: boolean) {
  if (val === borderWidthLinked.value) return
  borderWidthLinked.value = val
  if (val) {
    const v = borderWidthValues.value[0]
    applyBorderPlacement([v, v, v, v], true)
  } else {
    applyBorderPlacement([...borderWidthValues.value], false)
  }
}

function setBorderWidthAll(raw: string) {
  const w = Math.max(0, Math.round(Number(raw) || 0))
  applyBorderPlacement([w, w, w, w])
}

function setBorderWidthSide(index: number, raw: string) {
  const next = [...borderWidthValues.value] as BorderWidths
  next[index] = Math.max(0, Math.round(Number(raw) || 0))
  applyBorderPlacement(next, false)
}

function setBorderStyle(style: string) {
  applyBorderPlacement(borderWidthValues.value, borderWidthLinked.value, style)
}

function setBorderColor(color: string) {
  applyBorderPlacement(borderWidthValues.value, borderWidthLinked.value, undefined, color)
}

function gapDisplay(key: 'column-gap' | 'row-gap'): string {
  return getAttr(key, '12')
}

function setGapAttr(key: 'column-gap' | 'row-gap', raw: string) {
  const v = raw.trim()
  if (v === 'auto') {
    editValues.value[key] = { value: 'auto', dynamic: true }
    flushTagLine()
    return
  }
  setNumericAttr(key, v, '12')
}

const backgroundPresetChoice = ref('none')
const spanColorPresetChoice = ref('text-primary')
const borderColorPresetChoice = ref('border')
const borderRadiusPresetChoice = ref('custom')

function borderRadiusRaw(): string {
  if (!isLayoutContainer.value) return ''
  if (!isDefaultState.value) return pseudoStyleSheet.value['border-radius'] ?? ''
  return getAttr('border-radius')
}

function syncStylePresetChoices() {
  backgroundPresetChoice.value = detectTokenPreset(backgroundColorValue(), BACKGROUND_COLOR_TOKENS)
  const spanRaw = getStyleProp('color')
  spanColorPresetChoice.value = !spanRaw.trim()
    ? 'custom'
    : detectTokenPreset(spanRaw, TEXT_COLOR_TOKENS)
  borderColorPresetChoice.value = detectTokenPreset(borderValues.value.color, BORDER_COLOR_TOKENS)
  if (isLayoutContainer.value) {
    borderRadiusPresetChoice.value = detectTokenPreset(borderRadiusRaw(), RADIUS_TOKENS)
  }
}

function setBackgroundColor(value: string) {
  const trimmed = value.trim()
  if (!isDefaultState.value) {
    setStyleProp('background-color', trimmed)
    return
  }
  if (isLayoutContainer.value) {
    if (trimmed) setAttr('background-color', trimmed, false)
    else removeAttr('background-color')
    return
  }
  setStyleProp('background-color', trimmed)
}

function colorPickerHex(raw: string, fallback: string): string {
  return resolveColorForPicker(raw, fallback)
}

function backgroundColorValue(): string {
  if (!isDefaultState.value) return getStyleProp('background-color')
  if (isLayoutContainer.value) return getAttr('background-color')
  return getStyleProp('background-color')
}

function setBackgroundColorPreset(id: string) {
  backgroundPresetChoice.value = id
  if (id === 'custom') {
    const current = backgroundColorValue()
    if (detectTokenPreset(current, BACKGROUND_COLOR_TOKENS) !== 'custom') {
      setBackgroundColor(resolveColorForPicker(current, '#ffffff'))
    }
    return
  }
  setBackgroundColor(valueForTokenPreset(id, BACKGROUND_COLOR_TOKENS, backgroundColorValue()))
}

function setSpanColorPreset(id: string) {
  spanColorPresetChoice.value = id
  if (id === 'custom') {
    const current = getStyleProp('color')
    if (!current.trim() || detectTokenPreset(current, TEXT_COLOR_TOKENS) !== 'custom') {
      setStyleProp('color', resolveColorForPicker(current, '#1a1a1a'))
    }
    return
  }
  setStyleProp('color', valueForTokenPreset(id, TEXT_COLOR_TOKENS, getStyleProp('color')))
}

const fontStylePresets = computed(() => getPresetsByCategory('font'))

const fontStylePresetSelectRef = ref<HTMLSelectElement | null>(null)

function applyFontStylePreset(presetId: string) {
  if (!presetId) return
  const preset = getStylePresetById(presetId)
  if (!preset) return
  for (const [prop, val] of Object.entries(preset.properties)) {
    setStyleProp(prop, val)
  }
  syncStylePresetChoices()
}

function onFontStylePresetPick(e: Event) {
  applyFontStylePreset((e.target as HTMLSelectElement).value)
  if (fontStylePresetSelectRef.value) fontStylePresetSelectRef.value.value = ''
}

function spanFontSizePreset(): string {
  const raw = getStyleProp('font-size')
  if (!raw.trim()) return 'custom'
  return detectFontSizePreset(raw)
}

function setSpanFontSizePreset(id: string) {
  if (id === 'custom') return
  const val = valueForTokenPreset(id, FONT_SIZE_TOKENS, getStyleProp('font-size'))
  if (val) setStyleProp('font-size', val)
  else removeStyleProp('font-size')
}

function setSpanFontSizePx(raw: string) {
  const n = Math.max(8, Math.round(Number(raw) || 14))
  setStyleProp('font-size', `${n}px`)
}

function spanFontFamilyPreset(): string {
  return detectFontFamilyPreset(getStyleProp('font-family'))
}

function setSpanFontFamilyPreset(id: string) {
  if (id === 'custom') return
  if (id === 'inherit') removeStyleProp('font-family')
  else setStyleProp('font-family', valueForTokenPreset(id, FONT_FAMILY_TOKENS, getStyleProp('font-family')))
}

function setSpanFontFamilyCustom(raw: string) {
  const v = raw.trim()
  if (v) setStyleProp('font-family', v)
  else removeStyleProp('font-family')
}

function spanFontWeightPreset(): string {
  return detectFontWeightPreset(getStyleProp('font-weight'))
}

function setSpanFontWeightPreset(id: string) {
  if (id === 'custom') return
  const opt = FONT_WEIGHT_TOKENS.find((o) => o.id === id)
  if (!opt) return
  if (opt.cssVar) setStyleProp('font-weight', valueForTokenPreset(id, FONT_WEIGHT_TOKENS, ''))
  else setSpanFontWeight(opt.id)
}

function setSpanTextDecoration(raw: string) {
  if (!raw || raw === 'none') removeStyleProp('text-decoration')
  else setStyleProp('text-decoration', raw)
}

function setSpanFontStyle(raw: string) {
  if (!raw || raw === 'normal') removeStyleProp('font-style')
  else setStyleProp('font-style', raw)
}

function setBorderColorPreset(id: string) {
  borderColorPresetChoice.value = id
  if (id === 'custom') {
    const current = borderValues.value.color
    if (detectTokenPreset(current, BORDER_COLOR_TOKENS) !== 'custom') {
      setBorderColor(resolveColorForPicker(current, '#dcdcdc'))
    }
    return
  }
  setBorderColor(valueForTokenPreset(id, BORDER_COLOR_TOKENS, borderValues.value.color))
}

function setBorderRadiusPreset(id: string) {
  borderRadiusPresetChoice.value = id
  if (id === 'custom') {
    const raw = borderRadiusRaw()
    if (detectTokenPreset(raw, RADIUS_TOKENS) !== 'custom') {
      applyBorderRadius([8, 8, 8, 8], true)
    }
    return
  }
  if (id === 'none') {
    applyBorderRadius([0, 0, 0, 0], true)
    return
  }
  const val = valueForTokenPreset(id, RADIUS_TOKENS, '')
  if (!isDefaultState.value) {
    patchPseudoStyles((styles) => {
      if (val) styles['border-radius'] = val
      else delete styles['border-radius']
    })
    return
  }
  if (!val) {
    delete editValues.value['border-radius']
    flushTagLine()
    return
  }
  editValues.value['border-radius'] = { value: val, dynamic: false }
  flushTagLine()
}

watch(
  () => [props.selectedId, props.interactionState, props.code] as const,
  () => {
    if (props.selectedId) syncStylePresetChoices()
  },
  { immediate: true },
)

function removeStyleProp(prop: string) {
  if (!isDefaultState.value) {
    patchPseudoStyles((styles) => {
      delete styles[prop]
    })
    return
  }
  const styles = parseInlineStyle(getAttr('style'))
  delete styles[prop]
  const formatted = formatInlineStyle(styles)
  if (formatted) setAttr('style', formatted, false)
  else removeAttr('style')
}

function spanSizePx(axis: 'width' | 'height'): string {
  const n = parseStylePx(parseInlineStyle(getAttr('style')), axis)
  return n !== null ? String(Math.round(n)) : ''
}

function setSpanSize(axis: 'width' | 'height', raw: string) {
  const styles = parseInlineStyle(getAttr('style'))
  styles.display = 'inline-block'
  const trimmed = raw.trim()
  if (trimmed) styles[axis] = `${Math.max(1, Math.round(Number(trimmed) || 1))}px`
  else delete styles[axis]
  const formatted = formatInlineStyle(styles)
  if (formatted) setAttr('style', formatted, false)
  else removeAttr('style')
}

const displayAttrKeys = computed(() => {
  const keys = Object.keys(editValues.value)
  return keys.length > 0 ? keys : Object.keys(selectedTag.value?.attrs ?? {})
})

function spanLineHeight(): string {
  const raw = getStyleProp('line-height')
  if (!raw) return ''
  const px = parseFloat(raw)
  if (raw.endsWith('px') && Number.isFinite(px)) return String(Math.round(px))
  return raw
}

function setSpanLineHeight(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) {
    removeStyleProp('line-height')
    return
  }
  const n = Number(trimmed)
  if (Number.isFinite(n) && n > 0) {
    setStyleProp('line-height', `${Math.round(n)}px`)
    return
  }
  setStyleProp('line-height', trimmed)
}

function setSpanFontWeight(raw: string) {
  if (raw) setStyleProp('font-weight', raw)
  else removeStyleProp('font-weight')
}

function spanLetterSpacing(): string {
  const raw = getStyleProp('letter-spacing')
  if (!raw) return ''
  const px = parseFloat(raw)
  if (raw.endsWith('px') && Number.isFinite(px)) return String(px)
  return raw
}

function setSpanLetterSpacing(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed || trimmed === '0') {
    removeStyleProp('letter-spacing')
    return
  }
  const n = Number(trimmed)
  if (Number.isFinite(n)) setStyleProp('letter-spacing', `${n}px`)
  else setStyleProp('letter-spacing', trimmed)
}

const borderRadiusValues = computed((): [number, number, number, number] => {
  if (!isLayoutContainer.value) return [8, 8, 8, 8]
  if (!isDefaultState.value) {
    return parseBorderRadiusAttr(pseudoStyleSheet.value['border-radius'] ?? '', 8)
  }
  return parseBorderRadiusAttr(getAttr('border-radius'), 8)
})

const borderRadiusLinked = ref(true)

watch(
  () => [props.selectedId, props.interactionState, props.code] as const,
  () => {
    if (!props.selectedId) return
    const raw = isDefaultState.value
      ? getAttr('border-radius')
      : pseudoStyleSheet.value['border-radius'] ?? ''
    borderRadiusLinked.value = isBorderRadiusAttrLinked(raw)
  },
  { immediate: true },
)

watch(
  () => props.code,
  () => {
    if (!props.selectedId || !isLayoutContainer.value) return
    const raw = isDefaultState.value
      ? getAttr('border-radius')
      : pseudoStyleSheet.value['border-radius'] ?? ''
    borderRadiusLinked.value = isBorderRadiusAttrLinked(raw)
  },
)

function setBorderRadiusLinked(val: boolean) {
  if (val === borderRadiusLinked.value) return
  borderRadiusLinked.value = val
  if (val) {
    const v = borderRadiusValues.value[0]
    applyBorderRadius([v, v, v, v], true)
  } else {
    applyBorderRadius([...borderRadiusValues.value], false)
  }
}

function applyBorderRadius(corners: BorderRadiusCorners, linked?: boolean) {
  if (!isDefaultState.value) {
    patchPseudoStyles((styles) => {
      applyBorderRadiusToStyleDict(styles, corners)
    })
    return
  }
  const patch = buildBorderRadiusPatch(corners, linked ?? borderRadiusLinked.value)
  const entry = patch['border-radius']
  if (!entry) return
  editValues.value['border-radius'] = { ...entry }
  flushTagLine()
}

function setBorderRadiusCorner(index: number, raw: string) {
  const next = [...borderRadiusValues.value] as [number, number, number, number]
  next[index] = Math.max(0, Math.round(Number(raw) || 0))
  applyBorderRadius(next)
}

function setBorderRadiusAll(raw: string) {
  const v = Math.max(0, Math.round(Number(raw) || 0))
  applyBorderRadius([v, v, v, v])
}

const ALIGN_MATRIX = [
  { id: 'nw', justify: 'flex-start', align: 'flex-start', title: '左上' },
  { id: 'n', justify: 'center', align: 'flex-start', title: '上' },
  { id: 'ne', justify: 'flex-end', align: 'flex-start', title: '右上' },
  { id: 'w', justify: 'flex-start', align: 'center', title: '左' },
  { id: 'c', justify: 'center', align: 'center', title: '居中' },
  { id: 'e', justify: 'flex-end', align: 'center', title: '右' },
  { id: 'sw', justify: 'flex-start', align: 'flex-end', title: '左下' },
  { id: 's', justify: 'center', align: 'flex-end', title: '下' },
  { id: 'se', justify: 'flex-end', align: 'flex-end', title: '右下' },
] as const

function alignPositionActive(pos: (typeof ALIGN_MATRIX)[number]): boolean {
  const j = getAttr('justify-content', 'flex-start')
  const a = getAttr('align-items', 'stretch')
  return j === pos.justify && a === pos.align
}

function setAlignPosition(pos: (typeof ALIGN_MATRIX)[number]) {
  setAttr('justify-content', pos.justify, false)
  setAttr('align-items', pos.align, false)
}

const paddingValues = computed((): [number, number, number, number] => {
  if (!selectedTag.value) return [0, 0, 0, 0]
  if (isSpan.value) {
    const styles = parseInlineStyle(getAttr('style'))
    const top = parseInt(styles['padding-top'] || '0', 10) || 0
    const right = parseInt(styles['padding-right'] || '0', 10) || 0
    const bottom = parseInt(styles['padding-bottom'] || '0', 10) || 0
    const left = parseInt(styles['padding-left'] || '0', 10) || 0
    return [top, right, bottom, left]
  }
  return parsePaddingAttr(getAttr('padding'))
})

const paddingLinkMode = ref<PaddingLinkMode>('all')
const PADDING_SIDE_LABELS = ['上', '右', '下', '左'] as const

function syncPaddingLinkModeFromValues() {
  if (!props.selectedId) return
  ensureStoredPaddingLinkMode(props.selectedId, paddingValues.value)
  paddingLinkMode.value = getStoredPaddingLinkMode(props.selectedId, paddingValues.value)
}

watch(() => props.selectedId, syncPaddingLinkModeFromValues, { immediate: true })

watch(
  () => props.code,
  () => {
    if (props.selectedId) {
      paddingLinkMode.value = getStoredPaddingLinkMode(props.selectedId, paddingValues.value)
    }
  },
)

function setPaddingLinkMode(mode: PaddingLinkMode) {
  if (mode === paddingLinkMode.value) return
  paddingLinkMode.value = mode
  setStoredPaddingLinkMode(props.selectedId, mode)
  const p = paddingValues.value
  if (mode === 'all') {
    applyPadding([p[0], p[0], p[0], p[0]])
  } else if (mode === 'vertical') {
    applyPadding([p[0], p[1], p[0], p[3]])
  }
}

function applyPadding(p: [number, number, number, number]) {
  if (isSpan.value) {
    const styles = parseInlineStyle(getAttr('style'))
    styles.display = 'inline-block'
    styles.padding = `${p[0]}px ${p[1]}px ${p[2]}px ${p[3]}px`
    delete styles['padding-top']
    delete styles['padding-right']
    delete styles['padding-bottom']
    delete styles['padding-left']
    const formatted = formatInlineStyle(styles)
    if (formatted) setAttr('style', formatted, false)
    else removeAttr('style')
    return
  }
  setAttr('padding', formatPaddingAttr(p), true)
}

function setPaddingAll(raw: string) {
  const n = Math.max(0, Math.round(Number(raw) || 0))
  applyPadding([n, n, n, n])
}

function setPaddingVertical(raw: string) {
  const n = Math.max(0, Math.round(Number(raw) || 0))
  const p = paddingValues.value
  applyPadding([n, p[1], n, p[3]])
}

function setPaddingSide(index: number, raw: string) {
  const n = Math.max(0, Math.round(Number(raw) || 0))
  const p = [...paddingValues.value] as [number, number, number, number]

  if (paddingLinkMode.value === 'all') {
    applyPadding([n, n, n, n])
    return
  }

  if (paddingLinkMode.value === 'vertical') {
    if (index === 0 || index === 2) {
      applyPadding([n, p[1], n, p[3]])
    } else {
      p[index] = n
      applyPadding(p)
    }
    return
  }

  p[index] = n
  applyPadding(p)
}

function gapIsNumeric(key: 'column-gap' | 'row-gap'): boolean {
  const v = gapDisplay(key).trim()
  return v !== 'auto' && v !== ''
}

function gapNumber(key: 'column-gap' | 'row-gap'): number {
  const n = Number(gapDisplay(key))
  return Number.isFinite(n) ? n : 12
}

function numAttr(key: string, fallback: number): number {
  const n = Number(getAttr(key, String(fallback)))
  return Number.isFinite(n) ? n : fallback
}

function spanLineHeightNum(): number {
  const raw = spanLineHeight()
  if (!raw) return 0
  const n = Number(raw)
  return Number.isFinite(n) ? n : 0
}

function spanLetterSpacingNum(): number {
  const raw = spanLetterSpacing()
  if (!raw) return 0
  const n = Number(raw)
  return Number.isFinite(n) ? n : 0
}

function effectBlurNum(): number {
  return parseBlurPx(getStyleProp('filter'))
}

function setSpanSizeFromScrub(axis: 'width' | 'height', n: number) {
  if (n <= 0) {
    const styles = parseInlineStyle(getAttr('style'))
    delete styles[axis]
    const formatted = formatInlineStyle(styles)
    if (formatted) setAttr('style', formatted, false)
    else removeAttr('style')
    return
  }
  setSpanSize(axis, String(Math.round(n)))
}

function clipContentEnabled(): boolean {
  return getAttr('overflow') === 'hidden'
}

function setClipContent(on: boolean) {
  if (on) setAttr('overflow', 'hidden', false)
  else removeAttr('overflow')
}
</script>

<template>
  <div class="pp">
    <div v-if="!selectedTag" class="pp__empty">选择一个元素以编辑属性</div>
    <div v-else class="pp__fields">
      <div class="pp__head">
        <code class="pp__tag">{{ selectedTag.label }}</code>
        <span v-if="!isDefaultState" class="pp__state-chip">
          {{ interactionStateLabel(interactionState) }}
        </span>
      </div>

      <div v-if="isMotionState" class="pp__state-banner">
        配置悬停 / 按下 / 聚焦切换时的过渡与动画；在示例预览中交互即可看到动效。
        <span class="pp__state-banner-hint">{{ interactionStateHint }}</span>
      </div>
      <div v-else-if="!isDefaultState" class="pp__state-banner">
        编辑「{{ interactionStateLabel(interactionState) }}」覆盖样式；未填项继承默认，画布同步预览。
        <span class="pp__state-banner-hint">{{ interactionStateHint }}</span>
      </div>

      <section v-if="isMotionState && (isLayoutContainer || isSpan)" class="pp-section">
        <header class="pp-section__head">
          <h3 class="pp-section__title">动效</h3>
        </header>
        <div class="pp-section__body">
          <div class="pp__row">
            <span class="pp__row-label">时长</span>
            <ScrubInput
              icon="⏱"
              :model-value="motionDurationMs()"
              :min="0"
              :step="10"
              suffix="ms"
              @update:model-value="setMotionDurationMs($event)"
            />
          </div>
          <div class="pp__row">
            <span class="pp__row-label">缓动</span>
            <select
              class="pp__input"
              :value="motionTiming()"
              :disabled="motionDurationMs() <= 0"
              @change="setMotionTiming(($event.target as HTMLSelectElement).value as MotionTimingId)"
            >
              <option v-for="t in MOTION_TIMING_OPTIONS" :key="t.id" :value="t.id">{{ t.label }}</option>
            </select>
          </div>
          <div class="pp__row">
            <span class="pp__row-label">延迟</span>
            <ScrubInput
              icon="↻"
              :model-value="motionDelayMs()"
              :min="0"
              :step="10"
              suffix="ms"
              :disabled="motionDurationMs() <= 0"
              @update:model-value="setMotionDelayMs($event)"
            />
          </div>
          <div class="pp__row">
            <span class="pp__row-label">属性</span>
            <select
              class="pp__input"
              :value="motionPropertyPreset()"
              :disabled="motionDurationMs() <= 0"
              @change="setMotionPropertyPreset(($event.target as HTMLSelectElement).value as MotionPropertyPresetId)"
            >
              <option v-for="p in MOTION_PROPERTY_PRESETS" :key="p.id" :value="p.id">{{ p.label }}</option>
            </select>
          </div>
          <div v-if="motionPropertyPreset() === 'custom'" class="pp__row">
            <span class="pp__row-label">自定义</span>
            <input
              class="pp__input pp__input--grow"
              :value="motionPropertyCustom()"
              placeholder="transform, opacity"
              @change="setMotionPropertyCustom(($event.target as HTMLInputElement).value)"
            />
          </div>
          <div class="pp__row pp__row--stack">
            <span class="pp__row-label">动画</span>
            <input
              class="pp__input pp__input--grow"
              :value="motionAnimation()"
              placeholder="pulse 1s ease infinite（可选）"
              @change="setMotionAnimation(($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>
      </section>

      <section v-if="isGridChild && isDefaultState" class="pp-section">
        <header class="pp-section__head">
          <h3 class="pp-section__title">网格位置</h3>
        </header>
        <div class="pp-section__body">
        <div class="pp__row">
          <span class="pp__row-label">列</span>
          <ScrubInput
            icon="C"
            :model-value="Math.max(1, Math.round(Number(gridPlacementCol()) || 1))"
            :min="1"
            @update:model-value="setGridPlacementCol(String($event))"
          />
        </div>
        <div class="pp__row">
          <span class="pp__row-label">行</span>
          <ScrubInput
            icon="R"
            :model-value="Math.max(1, Math.round(Number(gridPlacementRow()) || 1))"
            :min="1"
            @update:model-value="setGridPlacementRow(String($event))"
          />
        </div>
        </div>
      </section>

      <!-- 布局：容器排布 + 浮动 -->
      <section v-if="isDefaultState && (isLayoutContainer || (isSpan && canEditPosition))" class="pp-section">
        <header class="pp-section__head">
          <h3 class="pp-section__title">布局</h3>
        </header>
        <div class="pp-section__body">
        <template v-if="isLayoutContainer">
        <div class="pp__row">
          <span class="pp__row-label">模式</span>
          <div class="pp__seg pp__seg--wrap">
            <button
              v-for="m in LAYOUT_MODES"
              :key="m"
              type="button"
              class="pp__seg-btn pp__seg-btn--sm"
              :class="{ 'pp__seg-btn--active': layoutMode === m }"
              @click="setLayoutMode(m)"
            >{{ m }}</button>
          </div>
        </div>
        <div v-if="layoutMode === 'flex'" class="pp__row">
          <span class="pp__row-label">方向</span>
          <div class="pp__seg">
            <button
              type="button"
              class="pp__seg-btn"
              :class="{ 'pp__seg-btn--active': flexDirection.includes('row') }"
              @click="setFlexDirection('row')"
            >↔ 行</button>
            <button
              type="button"
              class="pp__seg-btn"
              :class="{ 'pp__seg-btn--active': flexDirection.includes('column') }"
              @click="setFlexDirection('column')"
            >↕ 列</button>
          </div>
        </div>
        <div v-if="layoutMode === 'flex'" class="pp__row pp__row--stack">
          <span class="pp__row-label">对齐</span>
          <div class="pp__align-grid">
            <button
              v-for="pos in ALIGN_MATRIX"
              :key="pos.id"
              type="button"
              class="pp__align-cell"
              :class="{ 'pp__align-cell--active': alignPositionActive(pos) }"
              :title="pos.title"
              @click="setAlignPosition(pos)"
            />
          </div>
        </div>
        <template v-if="layoutMode === 'grid'">
          <div class="pp__row">
            <span class="pp__row-label">列数</span>
            <ScrubInput
              icon="⊞"
              :model-value="numAttr('cols', 3)"
              :min="1"
              @update:model-value="setNumericAttr('cols', String($event), '3')"
            />
          </div>
          <div class="pp__row">
            <span class="pp__row-label">行数</span>
            <ScrubInput
              icon="⊟"
              :model-value="numAttr('rows', 0)"
              :min="0"
              @update:model-value="setNumericAttr('rows', String($event), '0')"
            />
          </div>
        </template>
        <div v-if="layoutMode === 'flex' || layoutMode === 'grid'" class="pp__row">
          <span class="pp__row-label">列间距</span>
          <ScrubInput
            v-if="gapIsNumeric('column-gap')"
            icon="↔"
            :model-value="gapNumber('column-gap')"
            :min="0"
            suffix="px"
            @update:model-value="setGapAttr('column-gap', String($event))"
          />
          <input
            v-else
            class="pp__input pp__input--narrow"
            type="text"
            :value="gapDisplay('column-gap')"
            placeholder="12 或 auto"
            @change="setGapAttr('column-gap', ($event.target as HTMLInputElement).value)"
          />
        </div>
        <div v-if="layoutMode === 'flex' || layoutMode === 'grid'" class="pp__row">
          <span class="pp__row-label">行间距</span>
          <ScrubInput
            v-if="gapIsNumeric('row-gap')"
            icon="↕"
            :model-value="gapNumber('row-gap')"
            :min="0"
            suffix="px"
            @update:model-value="setGapAttr('row-gap', String($event))"
          />
          <input
            v-else
            class="pp__input pp__input--narrow"
            type="text"
            :value="gapDisplay('row-gap')"
            placeholder="12 或 auto"
            @change="setGapAttr('row-gap', ($event.target as HTMLInputElement).value)"
          />
        </div>
        <div class="pp__row pp__row--stack">
          <span class="pp__row-label">内边距</span>
          <div class="pp__seg pp__seg--wrap">
            <button
              type="button"
              class="pp__seg-btn pp__seg-btn--sm"
              :class="{ 'pp__seg-btn--active': paddingLinkMode === 'none' }"
              @click="setPaddingLinkMode('none')"
            >独立</button>
            <button
              type="button"
              class="pp__seg-btn pp__seg-btn--sm"
              :class="{ 'pp__seg-btn--active': paddingLinkMode === 'vertical' }"
              @click="setPaddingLinkMode('vertical')"
            >上下</button>
            <button
              type="button"
              class="pp__seg-btn pp__seg-btn--sm"
              :class="{ 'pp__seg-btn--active': paddingLinkMode === 'all' }"
              @click="setPaddingLinkMode('all')"
            >四向</button>
          </div>
        </div>
        <div v-if="paddingLinkMode === 'all'" class="pp__row">
          <span class="pp__row-label">全部</span>
          <ScrubInput
            icon="▢"
            :model-value="paddingValues[0]"
            :min="0"
            suffix="px"
            @update:model-value="setPaddingAll(String($event))"
          />
        </div>
        <template v-else-if="paddingLinkMode === 'vertical'">
          <div class="pp__row">
            <span class="pp__row-label">上下</span>
            <ScrubInput
              icon="↕"
              :model-value="paddingValues[0]"
              :min="0"
              suffix="px"
              @update:model-value="setPaddingVertical(String($event))"
            />
          </div>
          <div class="pp__row">
            <span class="pp__row-label">右</span>
            <ScrubInput
              icon="→"
              :model-value="paddingValues[1]"
              :min="0"
              suffix="px"
              @update:model-value="setPaddingSide(1, String($event))"
            />
          </div>
          <div class="pp__row">
            <span class="pp__row-label">左</span>
            <ScrubInput
              icon="←"
              :model-value="paddingValues[3]"
              :min="0"
              suffix="px"
              @update:model-value="setPaddingSide(3, String($event))"
            />
          </div>
        </template>
        <template v-else>
          <div v-for="(label, i) in PADDING_SIDE_LABELS" :key="label" class="pp__row">
            <span class="pp__row-label">{{ label }}</span>
            <ScrubInput
              :icon="['↑', '→', '↓', '←'][i]"
              :model-value="paddingValues[i]"
              :min="0"
              suffix="px"
              @update:model-value="setPaddingSide(i, String($event))"
            />
          </div>
        </template>
        <div class="pp__row">
          <span class="pp__row-label">裁剪</span>
          <label class="pp__check">
            <input
              type="checkbox"
              :checked="clipContentEnabled()"
              @change="setClipContent(($event.target as HTMLInputElement).checked)"
            />
            裁切溢出内容
          </label>
        </div>
        </template>
        <template v-if="canEditPosition">
          <p v-if="isLayoutContainer" class="pp__subhead">浮动</p>
          <div class="pp__row">
            <span class="pp__row-label">浮动</span>
            <label class="pp__check">
              <input
                type="checkbox"
                :checked="floatingPosition.enabled"
                @change="setFloatingEnabled(($event.target as HTMLInputElement).checked)"
              />
              开启
            </label>
          </div>
          <template v-if="floatingPosition.enabled">
            <div class="pp__row">
              <span class="pp__row-label">X</span>
              <ScrubInput
                icon="X"
                :model-value="floatingPosition.left"
                suffix="px"
                @update:model-value="setFloatingLeft(String($event))"
              />
            </div>
            <div class="pp__row">
              <span class="pp__row-label">Y</span>
              <ScrubInput
                icon="Y"
                :model-value="floatingPosition.top"
                suffix="px"
                @update:model-value="setFloatingTop(String($event))"
              />
            </div>
            <div class="pp__row">
              <span class="pp__row-label">层级</span>
              <ScrubInput
                icon="Z"
                :model-value="Number(floatingPosition.zIndex) || 0"
                :min="0"
                @update:model-value="setFloatingZIndex(String($event))"
              />
            </div>
          </template>
        </template>
        </div>
      </section>

      <section v-if="isLayoutContainer && isDefaultState" class="pp-section">
        <header class="pp-section__head">
          <h3 class="pp-section__title">尺寸</h3>
        </header>
        <div class="pp-section__body">
        <div class="pp__row pp__row--stack">
          <span class="pp__row-label">宽度</span>
          <div class="pp__seg pp__seg--wrap">
            <button
              v-for="m in SIZE_MODES"
              :key="'w-' + m"
              type="button"
              class="pp__seg-btn pp__seg-btn--sm"
              :class="{ 'pp__seg-btn--active': widthMode === m }"
              @click="setSizeMode('width', m)"
            >{{ m }}</button>
          </div>
          <ScrubInput
            v-if="widthMode === 'fixed'"
            icon="W"
            :model-value="numAttr('width', 200)"
            :min="1"
            suffix="px"
            @update:model-value="setNumericAttr('width', String($event), '200')"
          />
        </div>
        <div class="pp__row pp__row--stack">
          <span class="pp__row-label">高度</span>
          <div class="pp__seg pp__seg--wrap">
            <button
              v-for="m in SIZE_MODES"
              :key="'h-' + m"
              type="button"
              class="pp__seg-btn pp__seg-btn--sm"
              :class="{ 'pp__seg-btn--active': heightMode === m }"
              @click="setSizeMode('height', m)"
            >{{ m }}</button>
          </div>
          <ScrubInput
            v-if="heightMode === 'fixed'"
            icon="H"
            :model-value="numAttr('height', 160)"
            :min="1"
            suffix="px"
            @update:model-value="setNumericAttr('height', String($event), '160')"
          />
        </div>
        <template v-if="widthMode === 'minmax'">
          <div class="pp__row">
            <span class="pp__row-label">min 宽</span>
            <ScrubInput
              icon="◧"
              :model-value="numAttr('min-width', 100)"
              :min="0"
              suffix="px"
              @focus="focusExtreme('width', 'min')"
              @blur="blurExtreme"
              @update:model-value="setNumericAttr('min-width', String($event))"
            />
          </div>
          <div class="pp__row">
            <span class="pp__row-label">max 宽</span>
            <ScrubInput
              icon="◨"
              :model-value="numAttr('max-width', 400)"
              :min="0"
              suffix="px"
              @focus="focusExtreme('width', 'max')"
              @blur="blurExtreme"
              @update:model-value="setNumericAttr('max-width', String($event))"
            />
          </div>
        </template>
        <template v-if="heightMode === 'minmax'">
          <div class="pp__row">
            <span class="pp__row-label">min 高</span>
            <ScrubInput
              icon="◧"
              :model-value="numAttr('min-height', 80)"
              :min="0"
              suffix="px"
              @focus="focusExtreme('height', 'min')"
              @blur="blurExtreme"
              @update:model-value="setNumericAttr('min-height', String($event))"
            />
          </div>
          <div class="pp__row">
            <span class="pp__row-label">max 高</span>
            <ScrubInput
              icon="◨"
              :model-value="numAttr('max-height', 400)"
              :min="0"
              suffix="px"
              @focus="focusExtreme('height', 'max')"
              @blur="blurExtreme"
              @update:model-value="setNumericAttr('max-height', String($event))"
            />
          </div>
        </template>
        </div>
      </section>

      <section v-if="!isMotionState && (isLayoutContainer || isSpan)" class="pp-section">
        <header class="pp-section__head">
          <h3 class="pp-section__title">样式</h3>
        </header>
        <div class="pp-section__body">
        <p class="pp__subhead">背景</p>
        <div class="pp__row">
          <span class="pp__row-label">背景</span>
          <select
            class="pp__input"
            :value="backgroundPresetChoice"
            @change="setBackgroundColorPreset(($event.target as HTMLSelectElement).value)"
          >
            <option v-for="t in BACKGROUND_COLOR_TOKENS" :key="t.id" :value="t.id">{{ t.label }}</option>
          </select>
        </div>
        <div v-if="backgroundPresetChoice === 'custom'" class="pp__row">
          <span class="pp__row-label">自定义</span>
          <input
            type="color"
            class="pp__color-swatch"
            :value="colorPickerHex(backgroundColorValue(), '#ffffff')"
            @input="setBackgroundColor(($event.target as HTMLInputElement).value)"
          />
          <input
            class="pp__input pp__input--grow"
            :value="backgroundColorValue()"
            placeholder="#ffffff"
            spellcheck="false"
            @input="setBackgroundColor(($event.target as HTMLInputElement).value)"
          />
        </div>

        <template v-if="isLayoutContainer">
          <p class="pp__subhead">描边</p>
          <div class="pp__row">
            <span class="pp__row-label">宽度</span>
            <label class="pp__check">
              <input
                type="checkbox"
                :checked="borderWidthLinked"
                @change="setBorderWidthLinked(($event.target as HTMLInputElement).checked)"
              />
              统一
            </label>
          </div>
          <div v-if="borderWidthLinked" class="pp__row">
            <span class="pp__row-label">全部</span>
            <ScrubInput
              icon="▭"
              :model-value="borderWidthValues[0]"
              :min="0"
              suffix="px"
              @update:model-value="setBorderWidthAll(String($event))"
            />
          </div>
          <template v-else>
            <div v-for="(label, i) in BORDER_WIDTH_LABELS" :key="'bw-' + label" class="pp__row">
              <span class="pp__row-label">{{ label }}</span>
              <ScrubInput
                :icon="['↑', '→', '↓', '←'][i]"
                :model-value="borderWidthValues[i]"
                :min="0"
                suffix="px"
                @update:model-value="setBorderWidthSide(i, String($event))"
              />
            </div>
          </template>
          <div class="pp__row">
            <span class="pp__row-label">颜色</span>
            <select
              class="pp__input"
              :value="borderColorPresetChoice"
              @change="setBorderColorPreset(($event.target as HTMLSelectElement).value)"
            >
              <option v-for="t in BORDER_COLOR_TOKENS" :key="t.id" :value="t.id">{{ t.label }}</option>
            </select>
          </div>
          <div v-if="borderColorPresetChoice === 'custom'" class="pp__row">
            <span class="pp__row-label">自定义</span>
            <input
              type="color"
              class="pp__color-swatch"
              :value="colorPickerHex(borderValues.color, '#dcdcdc')"
              @input="setBorderColor(($event.target as HTMLInputElement).value)"
            />
            <input
              class="pp__input pp__input--grow"
              :value="borderValues.color"
              placeholder="#dcdcdc"
              spellcheck="false"
              @input="setBorderColor(($event.target as HTMLInputElement).value)"
            />
          </div>
          <div class="pp__row">
            <span class="pp__row-label">样式</span>
            <select
              class="pp__input"
              :value="borderValues.style || 'solid'"
              @change="setBorderStyle(($event.target as HTMLSelectElement).value)"
            >
              <option v-for="s in BORDER_STYLES" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <div class="pp__row">
            <span class="pp__row-label">圆角</span>
            <select
              class="pp__input"
              :value="borderRadiusPresetChoice"
              @change="setBorderRadiusPreset(($event.target as HTMLSelectElement).value)"
            >
              <option v-for="t in RADIUS_TOKENS" :key="t.id" :value="t.id">{{ t.label }}</option>
            </select>
          </div>
          <template v-if="borderRadiusPresetChoice === 'custom'">
            <div class="pp__row">
              <span class="pp__row-label">统一</span>
              <label class="pp__check">
                <input
                  type="checkbox"
                  :checked="borderRadiusLinked"
                  @change="setBorderRadiusLinked(($event.target as HTMLInputElement).checked)"
                />
                四角相同
              </label>
            </div>
            <div v-if="borderRadiusLinked" class="pp__row">
              <span class="pp__row-label">全部</span>
              <ScrubInput
                icon="◢"
                :model-value="borderRadiusValues[0]"
                :min="0"
                suffix="px"
                @update:model-value="setBorderRadiusAll(String($event))"
              />
            </div>
            <template v-else>
              <div v-for="(label, i) in RADIUS_LABELS" :key="label" class="pp__row">
                <span class="pp__row-label">{{ label }}</span>
                <ScrubInput
                  icon="◢"
                  :model-value="borderRadiusValues[i]"
                  :min="0"
                  suffix="px"
                  @update:model-value="setBorderRadiusCorner(i, String($event))"
                />
              </div>
            </template>
          </template>
        </template>

        <p class="pp__subhead">效果</p>
        <div class="pp__row">
          <span class="pp__row-label">阴影</span>
          <select
            class="pp__input"
            :value="shadowPreset"
            @change="setShadowPreset(($event.target as HTMLSelectElement).value as ShadowPresetId)"
          >
            <option v-for="p in SHADOW_PRESET_OPTIONS" :key="p.id" :value="p.id">{{ p.label }}</option>
          </select>
        </div>
        <div v-if="shadowPreset === 'custom'" class="pp__row">
          <span class="pp__row-label">自定义</span>
          <input
            class="pp__input pp__input--grow"
            :value="shadowCustom"
            placeholder="0 4px 12px rgba(0,0,0,0.12)"
            @change="setShadowCustom(($event.target as HTMLInputElement).value)"
          />
        </div>
        <div class="pp__row">
          <span class="pp__row-label">模糊</span>
          <ScrubInput
            icon="◎"
            :model-value="effectBlurNum()"
            :min="0"
            :step="0.5"
            suffix="px"
            @update:model-value="setEffectBlur(String($event))"
          />
        </div>
        </div>
      </section>

      <section v-if="isSpan && isDefaultState" class="pp-section">
        <header class="pp-section__head">
          <h3 class="pp-section__title">尺寸</h3>
        </header>
        <div class="pp-section__body">
        <div class="pp__row">
          <span class="pp__row-label">宽度</span>
          <ScrubInput
            icon="W"
            :model-value="Number(spanSizePx('width')) || 0"
            :min="0"
            suffix="px"
            @update:model-value="setSpanSizeFromScrub('width', $event)"
          />
        </div>
        <div class="pp__row">
          <span class="pp__row-label">高度</span>
          <ScrubInput
            icon="H"
            :model-value="Number(spanSizePx('height')) || 0"
            :min="0"
            suffix="px"
            @update:model-value="setSpanSizeFromScrub('height', $event)"
          />
        </div>
        </div>
      </section>

      <section v-if="!isMotionState && isSpan" class="pp-section">
        <header class="pp-section__head">
          <h3 class="pp-section__title">文本</h3>
        </header>
        <div class="pp-section__body">
        <div class="pp__row">
          <span class="pp__row-label">文本样式</span>
          <select
            ref="fontStylePresetSelectRef"
            class="pp__input"
            @change="onFontStylePresetPick"
          >
            <option value="">引用命名样式…</option>
            <option v-for="p in fontStylePresets" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>
        <div class="pp__row">
          <span class="pp__row-label">字体</span>
          <select
            class="pp__input"
            :value="spanFontFamilyPreset()"
            @change="setSpanFontFamilyPreset(($event.target as HTMLSelectElement).value)"
          >
            <option v-for="t in FONT_FAMILY_TOKENS" :key="t.id" :value="t.id">{{ t.label }}</option>
          </select>
        </div>
        <div v-if="spanFontFamilyPreset() === 'custom'" class="pp__row">
          <span class="pp__row-label">字体族</span>
          <input
            class="pp__input pp__input--grow"
            :value="getStyleProp('font-family')"
            placeholder="PingFang SC, sans-serif"
            @change="setSpanFontFamilyCustom(($event.target as HTMLInputElement).value)"
          />
        </div>
        <div class="pp__row">
          <span class="pp__row-label">字号</span>
          <select
            class="pp__input pp__input--narrow"
            :value="spanFontSizePreset()"
            @change="setSpanFontSizePreset(($event.target as HTMLSelectElement).value)"
          >
            <option v-for="t in FONT_SIZE_TOKENS" :key="t.id" :value="t.id">{{ t.label }}</option>
          </select>
          <ScrubInput
            v-if="spanFontSizePreset() === 'custom'"
            icon="Aa"
            :model-value="Number(spanFontSizeDisplay(getStyleProp('font-size')) || 14)"
            :min="8"
            suffix="px"
            @update:model-value="setSpanFontSizePx(String($event))"
          />
        </div>
        <div class="pp__row">
          <span class="pp__row-label">颜色</span>
          <select
            class="pp__input"
            :value="spanColorPresetChoice"
            @change="setSpanColorPreset(($event.target as HTMLSelectElement).value)"
          >
            <option v-for="t in TEXT_COLOR_TOKENS" :key="t.id" :value="t.id">{{ t.label }}</option>
          </select>
        </div>
        <div v-if="spanColorPresetChoice === 'custom'" class="pp__row">
          <span class="pp__row-label">自定义</span>
          <input
            type="color"
            class="pp__color-swatch"
            :value="colorPickerHex(getStyleProp('color'), '#1a1a1a')"
            @input="setStyleProp('color', ($event.target as HTMLInputElement).value)"
          />
          <input
            class="pp__input pp__input--grow"
            :value="getStyleProp('color')"
            placeholder="#1a1a1a"
            spellcheck="false"
            @input="setStyleProp('color', ($event.target as HTMLInputElement).value)"
          />
        </div>
        <div class="pp__row">
          <span class="pp__row-label">对齐</span>
          <select
            class="pp__input"
            :value="getStyleProp('text-align') || 'left'"
            @change="setStyleProp('text-align', ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="a in TEXT_ALIGNS" :key="a" :value="a">{{ a }}</option>
          </select>
        </div>
        <div class="pp__row">
          <span class="pp__row-label">字重</span>
          <select
            class="pp__input"
            :value="spanFontWeightPreset()"
            @change="setSpanFontWeightPreset(($event.target as HTMLSelectElement).value)"
          >
            <option v-for="w in FONT_WEIGHT_TOKENS" :key="w.id" :value="w.id">{{ w.label }}</option>
          </select>
        </div>
        <div v-if="spanFontWeightPreset() === 'custom'" class="pp__row">
          <span class="pp__row-label">自定义</span>
          <ScrubInput
            icon="B"
            :model-value="Number(getStyleProp('font-weight')) || 400"
            :min="100"
            :max="900"
            :step="100"
            @update:model-value="setSpanFontWeight(String($event))"
          />
        </div>
        <div class="pp__row">
          <span class="pp__row-label">样式</span>
          <select
            class="pp__input"
            :value="getStyleProp('font-style') || 'normal'"
            @change="setSpanFontStyle(($event.target as HTMLSelectElement).value)"
          >
            <option value="normal">常规</option>
            <option value="italic">斜体</option>
          </select>
        </div>
        <div class="pp__row">
          <span class="pp__row-label">装饰</span>
          <select
            class="pp__input"
            :value="getStyleProp('text-decoration') || 'none'"
            @change="setSpanTextDecoration(($event.target as HTMLSelectElement).value)"
          >
            <option v-for="d in TEXT_DECORATIONS" :key="d.value" :value="d.value">{{ d.label }}</option>
          </select>
        </div>
        <div class="pp__row">
          <span class="pp__row-label">行高</span>
          <ScrubInput
            icon="↕"
            :model-value="spanLineHeightNum()"
            :min="0"
            suffix="px"
            @update:model-value="setSpanLineHeight(String($event))"
          />
        </div>
        <div class="pp__row">
          <span class="pp__row-label">字间距</span>
          <ScrubInput
            icon="A·A"
            :model-value="spanLetterSpacingNum()"
            :step="0.1"
            suffix="px"
            @update:model-value="setSpanLetterSpacing(String($event))"
          />
        </div>
        </div>
      </section>

      <section v-if="isDefaultState" class="pp-section">
        <header class="pp-section__head">
          <h3 class="pp-section__title">全部属性</h3>
        </header>
        <div class="pp-section__body">
      <div v-for="key in displayAttrKeys" :key="key" class="pp__field">
        <button
          class="pp__dyn"
          :class="{ 'pp__dyn--on': (editValues[key] ?? selectedTag.attrs[key])?.dynamic }"
          @click="toggleDynamic(key)"
          title="切换动态绑定 :key"
        >:</button>
        <label class="pp__label">{{ key }}</label>
        <input
          :value="(editValues[key] ?? selectedTag.attrs[key])?.value ?? ''"
          class="pp__input"
          @input="updateAttr(key, ($event.target as HTMLInputElement).value)"
        />
        <button class="pp__del" title="删除属性" @click="deleteAttr(key)">×</button>
      </div>

      <div class="pp__add">
        <button
          class="pp__dyn"
          :class="{ 'pp__dyn--on': newAttrDynamic }"
          @click="newAttrDynamic = !newAttrDynamic"
          title="切换动态绑定 :key"
        >:</button>
        <input v-model="newAttrName" class="pp__add-input pp__add-input--name" placeholder="属性名" @keyup.enter="addAttr" />
        <input v-model="newAttrValue" class="pp__add-input" placeholder="值" @keyup.enter="addAttr" />
        <button class="pp__add-btn" @click="addAttr" :disabled="!newAttrName.trim()">+</button>
      </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.pp {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.pp__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--td-text-color-placeholder);
  font-size: 13px;
}

.pp__fields {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.pp-section {
  display: flex;
  flex-direction: column;
  border-radius: var(--td-radius-medium);
  border: 1px solid var(--td-component-border);
  background: var(--td-bg-color-container);
}

.pp-section__head {
  padding: 7px 10px 6px;
  border-bottom: 1px solid var(--td-component-border);
  background: var(--td-bg-color-secondarycontainer, rgba(0, 0, 0, 0.02));
}

.pp-section__title {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--td-text-color-primary);
  letter-spacing: 0.02em;
}

.pp-section__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 10px 10px;
}

.pp__subhead {
  margin: 4px 0 0;
  padding-top: 4px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--td-text-color-placeholder);
  border-top: 1px solid var(--td-component-border);
}

.pp__subhead:first-child {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.pp__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}

.pp__state-chip {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--td-brand-color) 12%, transparent);
  color: var(--td-brand-color);
}

.pp__state-banner {
  padding: 8px 10px;
  margin-bottom: 4px;
  font-size: 11px;
  line-height: 1.45;
  color: var(--td-text-color-secondary);
  background: color-mix(in srgb, var(--td-brand-color) 6%, var(--td-bg-color-container));
  border: 1px solid color-mix(in srgb, var(--td-brand-color) 18%, var(--td-component-border));
  border-radius: 6px;
}

.pp__state-banner-hint {
  display: block;
  margin-top: 4px;
  color: var(--td-text-color-placeholder);
  font-size: 10px;
}

.pp__tag {
  font-size: 13px;
  font-weight: 600;
  color: var(--td-brand-color);
  font-family: monospace;
}

.pp__row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pp__row--stack {
  flex-wrap: wrap;
  align-items: flex-start;
}

.pp__row > .scrub {
  margin-left: auto;
}

.pp__row-label {
  width: 52px;
  flex-shrink: 0;
  font-size: 11px;
  color: var(--td-text-color-placeholder);
}

.pp__seg {
  display: flex;
  gap: 4px;
  flex-wrap: nowrap;
}

.pp__seg--wrap {
  flex-wrap: wrap;
  flex: 1;
}

.pp__seg-btn {
  padding: 4px 10px;
  font-size: 11px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-container);
  color: var(--td-text-color-secondary);
  cursor: pointer;
}

.pp__seg-btn--sm {
  padding: 3px 6px;
  font-size: 10px;
  text-transform: capitalize;
}

.pp__seg-btn--active {
  border-color: var(--td-brand-color);
  background: var(--td-brand-color-light);
  color: var(--td-brand-color);
}

.pp__field {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pp__dyn {
  width: 22px;
  height: 22px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-container);
  color: var(--td-text-color-placeholder);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  font-family: monospace;
  padding: 0;
}

.pp__dyn--on {
  background: var(--td-brand-color-light);
  border-color: var(--td-brand-color);
  color: var(--td-brand-color);
}

.pp__label {
  width: 80px;
  font-size: 11px;
  color: var(--td-text-color-placeholder);
  flex-shrink: 0;
  font-family: monospace;
}

.pp__input {
  flex: 1;
  height: 28px;
  padding: 0 8px;
  font-size: 12px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  outline: none;
  background: var(--td-bg-color-container);
  min-width: 0;
}

.pp__input--narrow {
  flex: 0 0 72px;
  width: 72px;
}

.pp__input--grow {
  flex: 1;
  min-width: 0;
}

.pp__color-swatch {
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: transparent;
  cursor: pointer;
}

.pp__input:focus {
  border-color: var(--td-brand-color);
}

.pp__del {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--td-text-color-placeholder);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  flex-shrink: 0;
  border-radius: var(--td-radius-small);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pp__del:hover {
  background: var(--td-error-color-1);
  color: var(--td-error-color);
}

.pp__add {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--td-component-border);
}

.pp__add-input {
  flex: 1;
  height: 26px;
  padding: 0 6px;
  font-size: 11px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  outline: none;
  background: var(--td-bg-color-container);
  font-family: monospace;
}

.pp__add-input--name {
  flex: 0 0 100px;
}

.pp__add-input:focus {
  border-color: var(--td-brand-color);
}

.pp__add-input::placeholder {
  color: var(--td-text-color-placeholder);
}

.pp__add-btn {
  width: 26px;
  height: 26px;
  border: 1px solid var(--td-brand-color);
  background: var(--td-brand-color);
  color: #fff;
  border-radius: var(--td-radius-small);
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pp__add-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pp__add-btn:not(:disabled):hover {
  opacity: 0.85;
}

.pp__align-grid {
  display: grid;
  grid-template-columns: repeat(3, 24px);
  gap: 4px;
}

.pp__align-cell {
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1px solid var(--td-component-border);
  border-radius: 4px;
  background: var(--td-bg-color-container);
  cursor: pointer;
}

.pp__align-cell--active {
  border-color: var(--td-brand-color);
  background: var(--td-brand-color-light);
  box-shadow: inset 0 0 0 1px var(--td-brand-color);
}

.pp__check {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--td-text-color-secondary);
  cursor: pointer;
}
</style>
