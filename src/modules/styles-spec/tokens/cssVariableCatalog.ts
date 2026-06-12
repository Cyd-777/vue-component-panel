/**
 * CSS 变量清单 — 登记与运行时值聚合
 * 供全局样式规范 · CSS 变量 Tab 使用
 */
import { buildDesignTokenCssVars } from './applyDesignTokens'
import { ALL_COLOR_PALETTE_SLOTS } from './colorPaletteDefs'
import { DESIGN_TOKEN_DEFS, type TokenGroup } from './designTokenDefs'
import { designTokenState } from './designTokenStore'
import { stylePresetCssVars, type StylePreset } from './stylePresetDefs'
import { stylePresets } from './stylePresetStore'
import { getColorPaletteOverrideVars } from './colorPaletteOverrides'

export type CssVarLayer = 'td' | 'flow' | 'flow-style' | 'component'

export type CssVarCategory =
  | 'color'
  | 'radius'
  | 'size'
  | 'font'
  | 'motion'
  | 'effect'
  | 'shadow'
  | 'layout'
  | 'border'
  | 'component'
  | 'other'

export type CssVarSource =
  | 'colors'
  | 'dimensions'
  | 'fonts'
  | 'effects'
  | 'motion'
  | 'palette'
  | 'derived'
  | 'preset'
  | 'component-plan'
  | 'runtime'

export type CssVarEditTab = 'colors' | 'dimensions' | 'fonts' | 'effects' | 'motion' | null

export interface CssVariableCatalogEntry {
  name: string
  label: string
  layer: CssVarLayer
  category: CssVarCategory
  source: CssVarSource
  editTab: CssVarEditTab
  description?: string
  /** 运行时 :root 计算值 */
  currentValue: string
  /** 是否可在规范页某 Tab 直接编辑 */
  editable: boolean
}

const TOKEN_GROUP_TO_CATEGORY: Record<TokenGroup, CssVarCategory> = {
  color: 'color',
  fonts: 'font',
  spacing: 'size',
  radius: 'radius',
  layout: 'layout',
  motion: 'motion',
}

const TOKEN_GROUP_TO_TAB: Record<TokenGroup, CssVarEditTab> = {
  color: 'colors',
  fonts: 'fonts',
  spacing: 'dimensions',
  radius: 'dimensions',
  layout: 'dimensions',
  motion: 'motion',
}

/** FlowButton 等组件规划变量（实现前登记，见 components/button/API.md） */
const COMPONENT_PLANNED_VARS: Omit<CssVariableCatalogEntry, 'currentValue' | 'editable'>[] = [
  { name: '--flow-button-radius', label: 'Button 圆角', layer: 'component', category: 'radius', source: 'component-plan', editTab: null, description: 'FlowButton 统一圆角' },
  { name: '--flow-button-main', label: 'Button 当前语义主色', layer: 'component', category: 'color', source: 'component-plan', editTab: null, description: 'binding 注入的短名 alias' },
  { name: '--flow-button-on-main', label: 'Button 衬色', layer: 'component', category: 'color', source: 'component-plan', editTab: null },
  { name: '--flow-button-light', label: 'Button 浅底', layer: 'component', category: 'color', source: 'component-plan', editTab: null },
  { name: '--flow-button-motion', label: 'Button 过渡', layer: 'component', category: 'motion', source: 'component-plan', editTab: null },
  { name: '--flow-button-shadow', label: 'Button 阴影', layer: 'component', category: 'shadow', source: 'component-plan', editTab: null },
  { name: '--flow-button-border-width', label: 'Button 边框宽', layer: 'component', category: 'border', source: 'component-plan', editTab: null },
  { name: '--flow-button-focus-ring', label: 'Button 焦点环', layer: 'component', category: 'border', source: 'component-plan', editTab: null },
]

/** applyDesignTokens 派生、但不在 DESIGN_TOKEN_DEFS 的变量说明 */
const DERIVED_VAR_META: Record<string, Pick<CssVariableCatalogEntry, 'label' | 'category' | 'description'>> = {
  '--td-shadow-1': { label: '阴影 1 · 轻', category: 'shadow', description: 'applyDesignTokens 注入' },
  '--td-shadow-2': { label: '阴影 2 · 中', category: 'shadow' },
  '--td-shadow-3': { label: '阴影 3 · 重', category: 'shadow' },
  '--td-component-stroke': { label: '组件描边色', category: 'border', description: '与 border 同步' },
  '--td-font-body-medium': { label: '正文字体复合', category: 'font' },
  '--td-font-title-medium': { label: '标题字体复合', category: 'font' },
  '--td-font-headline-small': { label: '大标题字体复合', category: 'font' },
  '--td-line-height-body-medium': { label: '正文行高', category: 'font' },
  '--td-radius-extraLarge': { label: '超大圆角', category: 'radius', description: 'TDesign 默认 token，项目待接 UI' },
  '--td-radius-round': { label: '胶囊圆角', category: 'radius' },
  '--td-radius-circle': { label: '圆形', category: 'radius' },
}

function inferLayer(name: string): CssVarLayer {
  if (name.startsWith('--flow-style-')) return 'flow-style'
  if (/^--flow-[a-z]+-/.test(name) && !name.startsWith('--flow-layout-') && !name.startsWith('--flow-font-') && !name.startsWith('--flow-motion-') && !name.startsWith('--flow-line-') && !name.startsWith('--flow-text-')) {
    const seg = name.split('-')[2]
    if (seg && ['button', 'input', 'tag', 'card'].includes(seg)) return 'component'
  }
  if (name.startsWith('--flow-button-')) return 'component'
  if (name.startsWith('--td-')) return 'td'
  return 'flow'
}

function inferCategory(name: string): CssVarCategory {
  if (name.includes('shadow')) return 'shadow'
  if (name.includes('radius')) return 'radius'
  if (name.includes('font') || name.includes('line-height')) return 'font'
  if (name.includes('motion') || name.includes('transition')) return 'motion'
  if (name.includes('border') || name.includes('stroke')) return 'border'
  if (name.includes('comp-size') || name.includes('padding') || name.includes('margin') || /^--td-size-/.test(name)) return 'size'
  if (name.includes('color') || name.includes('bg-') || name.includes('text-')) return 'color'
  if (name.includes('layout')) return 'layout'
  if (name.startsWith('--flow-button-')) return 'component'
  return 'other'
}

function readRootCssVar(name: string): string {
  if (typeof document === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function mergeEntry(
  map: Map<string, CssVariableCatalogEntry>,
  partial: Omit<CssVariableCatalogEntry, 'currentValue' | 'editable'> & { editable?: boolean },
) {
  const existing = map.get(partial.name)
  if (existing && existing.source !== 'runtime' && partial.source === 'runtime') return

  map.set(partial.name, {
    ...partial,
    layer: partial.layer ?? inferLayer(partial.name),
    category: partial.category ?? inferCategory(partial.name),
    currentValue: '',
    editable: partial.editable ?? partial.editTab !== null,
  })
}

function tokenSourceFromGroup(group: TokenGroup): CssVarSource {
  if (group === 'color') return 'colors'
  if (group === 'motion') return 'motion'
  if (group === 'fonts') return 'fonts'
  return 'dimensions'
}

export function buildCssVariableCatalog(): CssVariableCatalogEntry[] {
  const map = new Map<string, CssVariableCatalogEntry>()

  for (const def of DESIGN_TOKEN_DEFS) {
    mergeEntry(map, {
      name: def.cssVar,
      label: def.label,
      layer: def.cssVar.startsWith('--td-') ? 'td' : 'flow',
      category: TOKEN_GROUP_TO_CATEGORY[def.group],
      source: tokenSourceFromGroup(def.group),
      editTab: TOKEN_GROUP_TO_TAB[def.group],
      description: def.description,
      editable: true,
    })
  }

  for (const slot of ALL_COLOR_PALETTE_SLOTS) {
    mergeEntry(map, {
      name: slot.cssVar,
      label: slot.label,
      layer: 'td',
      category: 'color',
      source: slot.tokenKey ? 'colors' : 'palette',
      editTab: slot.tokenKey ? 'colors' : 'colors',
      description: slot.optional ? '色板可选槽' : undefined,
      editable: !!slot.tokenKey,
    })
  }

  for (const item of COMPONENT_PLANNED_VARS) {
    mergeEntry(map, { ...item, editable: false })
  }

  const runtimeVars = {
    ...buildDesignTokenCssVars(designTokenState),
    ...getColorPaletteOverrideVars(),
  }

  for (const [name] of Object.entries(runtimeVars)) {
    const meta = DERIVED_VAR_META[name]
    mergeEntry(map, {
      name,
      label: meta?.label ?? name.replace(/^--/, ''),
      layer: inferLayer(name),
      category: meta?.category ?? inferCategory(name),
      source: map.has(name) ? 'derived' : 'derived',
      editTab: map.get(name)?.editTab ?? null,
      description: meta?.description ?? '由定义层派生注入',
      editable: map.get(name)?.editable ?? false,
    })
  }

  for (const preset of stylePresets as StylePreset[]) {
    for (const [name] of Object.entries(stylePresetCssVars(preset))) {
      mergeEntry(map, {
        name,
        label: `${preset.name} · ${name.split('-').pop()}`,
        layer: 'flow-style',
        category: name.includes('transition') ? 'motion' : name.includes('shadow') ? 'shadow' : 'effect',
        source: 'preset',
        editTab: preset.category === 'font' ? 'fonts' : preset.category === 'motion' ? 'motion' : 'effects',
        description: `命名预设 ${preset.id}`,
        editable: true,
      })
    }
  }

  for (const [name, entry] of map) {
    entry.currentValue = readRootCssVar(name) || runtimeVars[name as keyof typeof runtimeVars] || ''
  }

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
}

export const CSS_VAR_LAYER_OPTIONS: { value: CssVarLayer | 'all'; label: string }[] = [
  { value: 'all', label: '全部层级' },
  { value: 'td', label: 'TDesign · --td-*' },
  { value: 'flow', label: '项目 · --flow-*' },
  { value: 'flow-style', label: '命名预设 · --flow-style-*' },
  { value: 'component', label: '组件 alias · --flow-{comp}-*' },
]

export const CSS_VAR_CATEGORY_OPTIONS: { value: CssVarCategory | 'all'; label: string }[] = [
  { value: 'all', label: '全部类别' },
  { value: 'color', label: '颜色' },
  { value: 'radius', label: '圆角' },
  { value: 'size', label: '尺寸' },
  { value: 'font', label: '字体' },
  { value: 'border', label: '边框' },
  { value: 'shadow', label: '阴影' },
  { value: 'effect', label: '效果' },
  { value: 'motion', label: '动效' },
  { value: 'layout', label: '布局' },
  { value: 'component', label: '组件' },
  { value: 'other', label: '其他' },
]

export const CSS_VAR_SOURCE_OPTIONS: { value: CssVarSource | 'all'; label: string }[] = [
  { value: 'all', label: '全部来源' },
  { value: 'colors', label: '色板 / 核心色' },
  { value: 'dimensions', label: '间距尺寸' },
  { value: 'fonts', label: '字体定义' },
  { value: 'effects', label: '效果预设' },
  { value: 'motion', label: '动效定义' },
  { value: 'palette', label: '色板可选槽' },
  { value: 'derived', label: '派生注入' },
  { value: 'preset', label: '命名预设变量' },
  { value: 'component-plan', label: '组件规划' },
]

export function filterCssVariableCatalog(
  entries: CssVariableCatalogEntry[],
  filters: {
    layer: CssVarLayer | 'all'
    category: CssVarCategory | 'all'
    source: CssVarSource | 'all'
    query: string
    editableOnly: boolean
  },
): CssVariableCatalogEntry[] {
  const q = filters.query.trim().toLowerCase()
  return entries.filter((e) => {
    if (filters.layer !== 'all' && e.layer !== filters.layer) return false
    if (filters.category !== 'all' && e.category !== filters.category) return false
    if (filters.source !== 'all' && e.source !== filters.source) return false
    if (filters.editableOnly && !e.editable) return false
    if (!q) return true
    return (
      e.name.toLowerCase().includes(q)
      || e.label.toLowerCase().includes(q)
      || e.description?.toLowerCase().includes(q)
      || e.currentValue.toLowerCase().includes(q)
    )
  })
}

export const CSS_VAR_EDIT_TAB_LABELS: Record<NonNullable<CssVarEditTab>, string> = {
  colors: '项目色板',
  dimensions: '间距尺寸',
  fonts: '字体格式',
  effects: '效果',
  motion: '动效',
}
