/**
 * 视觉效果配置 — 组件库效果分层模型（阴影 / 模糊 / 圆角 / 背景 / 边框 / 滤镜 / transform）
 *
 * 持久化于 preset.properties['visual-effect-config']，并同步为标准 CSS 属性供 class / 变量引用。
 */
import type { StylePreset, StylePresetProperties } from './stylePresetDefs'
import {
  EFFECT_SHADOW_OPTIONS,
  normalizeBoxShadowValue,
  type EffectShadowLevel,
} from './stylePresetDefs'

export const VISUAL_EFFECT_CONFIG_KEY = 'visual-effect-config'

export const VISUAL_EFFECT_META_KEYS = new Set<string>([VISUAL_EFFECT_CONFIG_KEY])

export type ShadowMode = 'none' | 'token' | 'custom'

export interface ShadowParams {
  mode: ShadowMode
  tokenLevel: EffectShadowLevel
  inset: boolean
  offsetX: number
  offsetY: number
  blurRadius: number
  spreadRadius: number
  color: string
}

export interface RadiusParams {
  linked: boolean
  all: number
  topLeft: number
  topRight: number
  bottomRight: number
  bottomLeft: number
}

export type BackgroundKind = 'solid' | 'linear' | 'radial' | 'conic'

export interface BackgroundParams {
  kind: BackgroundKind
  solid: string
  angle: number
  stop1Color: string
  stop1Pos: number
  stop2Color: string
  stop2Pos: number
  radialShape: 'circle' | 'ellipse'
}

export type BorderStyleKind = 'none' | 'solid' | 'dashed' | 'dotted'

export interface BorderParams {
  style: BorderStyleKind
  color: string
  width: number
  sidesIndependent: boolean
  topWidth: number
  rightWidth: number
  bottomWidth: number
  leftWidth: number
}

export type ClipPathPresetId =
  | 'none'
  | 'circle'
  | 'ellipse'
  | 'diamond'
  | 'hexagon'
  | 'inset-round'
  | 'custom'

export interface VisualEffectConfig {
  id: string
  name: string
  shadow: ShadowParams
  blur: number
  opacity: number
  borderRadius: RadiusParams
  background: BackgroundParams
  border: BorderParams
  backdropBlur: number
  clipPathPreset: ClipPathPresetId
  clipPathCustom: string
  grayscale: number
  brightness: number
  contrast: number
  mixBlendMode: string
  rotate: number
  scale: number
}

export const CLIP_PATH_PRESETS: {
  id: ClipPathPresetId
  label: string
  value: string
}[] = [
  { id: 'none', label: '无', value: 'none' },
  { id: 'circle', label: '圆形', value: 'circle(50% at 50% 50%)' },
  { id: 'ellipse', label: '椭圆', value: 'ellipse(45% 35% at 50% 50%)' },
  { id: 'diamond', label: '菱形', value: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' },
  { id: 'hexagon', label: '六边形', value: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' },
  { id: 'inset-round', label: '内圆角', value: 'inset(8% 8% 8% 8% round 12px)' },
  { id: 'custom', label: '自定义', value: '' },
]

export const MIX_BLEND_MODE_OPTIONS: { value: string; label: string }[] = [
  { value: 'normal', label: 'normal · 正常' },
  { value: 'multiply', label: 'multiply · 正片叠底' },
  { value: 'screen', label: 'screen · 滤色' },
  { value: 'overlay', label: 'overlay · 叠加' },
  { value: 'darken', label: 'darken · 变暗' },
  { value: 'lighten', label: 'lighten · 变亮' },
  { value: 'color-dodge', label: 'color-dodge · 颜色减淡' },
  { value: 'color-burn', label: 'color-burn · 颜色加深' },
  { value: 'hard-light', label: 'hard-light · 强光' },
  { value: 'soft-light', label: 'soft-light · 柔光' },
  { value: 'difference', label: 'difference · 差值' },
  { value: 'exclusion', label: 'exclusion · 排除' },
  { value: 'hue', label: 'hue · 色相' },
  { value: 'saturation', label: 'saturation · 饱和度' },
  { value: 'color', label: 'color · 颜色' },
  { value: 'luminosity', label: 'luminosity · 明度' },
]

export const VISUAL_EFFECT_TIER_LABELS = {
  tier1: '第一梯队 · 通用基础',
  tier2: '第二梯队 · 容器装饰',
  tier3: '第三梯队 · 特定组件',
} as const

function defaultShadow(): ShadowParams {
  return {
    mode: 'token',
    tokenLevel: '1',
    inset: false,
    offsetX: 0,
    offsetY: 2,
    blurRadius: 8,
    spreadRadius: 0,
    color: 'rgba(0, 0, 0, 0.08)',
  }
}

function defaultRadius(): RadiusParams {
  return { linked: true, all: 6, topLeft: 6, topRight: 6, bottomRight: 6, bottomLeft: 6 }
}

function defaultBackground(): BackgroundParams {
  return {
    kind: 'solid',
    solid: '#FFFFFF',
    angle: 135,
    stop1Color: 'var(--td-brand-color)',
    stop1Pos: 0,
    stop2Color: 'var(--td-brand-color-8)',
    stop2Pos: 100,
    radialShape: 'circle',
  }
}

function defaultBorder(): BorderParams {
  return {
    style: 'solid',
    color: 'var(--td-component-border)',
    width: 1,
    sidesIndependent: false,
    topWidth: 1,
    rightWidth: 1,
    bottomWidth: 1,
    leftWidth: 1,
  }
}

export function defaultVisualEffectConfig(
  partial: Partial<VisualEffectConfig> & Pick<VisualEffectConfig, 'id' | 'name'>,
): VisualEffectConfig {
  return {
    id: partial.id,
    name: partial.name,
    shadow: { ...defaultShadow(), ...partial.shadow },
    blur: partial.blur ?? 0,
    opacity: partial.opacity ?? 1,
    borderRadius: { ...defaultRadius(), ...partial.borderRadius },
    background: { ...defaultBackground(), ...partial.background },
    border: { ...defaultBorder(), ...partial.border },
    backdropBlur: partial.backdropBlur ?? 0,
    clipPathPreset: partial.clipPathPreset ?? 'none',
    clipPathCustom: partial.clipPathCustom ?? '',
    grayscale: partial.grayscale ?? 0,
    brightness: partial.brightness ?? 100,
    contrast: partial.contrast ?? 100,
    mixBlendMode: partial.mixBlendMode ?? 'normal',
    rotate: partial.rotate ?? 0,
    scale: partial.scale ?? 1,
  }
}

export function buildBoxShadowFromParams(params: ShadowParams): string {
  if (params.mode === 'none') return 'none'
  if (params.mode === 'token') {
    const token = EFFECT_SHADOW_OPTIONS.find((o) => o.value === params.tokenLevel)
    return token?.cssValue ?? 'none'
  }
  const inset = params.inset ? 'inset ' : ''
  return `${inset}${params.offsetX}px ${params.offsetY}px ${params.blurRadius}px ${params.spreadRadius}px ${params.color}`
}

export function buildBorderRadiusCss(radius: RadiusParams): string {
  if (radius.linked) return `${radius.all}px`
  return `${radius.topLeft}px ${radius.topRight}px ${radius.bottomRight}px ${radius.bottomLeft}px`
}

export function buildBackgroundCss(bg: BackgroundParams): { backgroundColor?: string; backgroundImage?: string } {
  if (bg.kind === 'solid') {
    return { backgroundColor: bg.solid, backgroundImage: 'none' }
  }
  if (bg.kind === 'linear') {
    return {
      backgroundColor: 'transparent',
      backgroundImage: `linear-gradient(${bg.angle}deg, ${bg.stop1Color} ${bg.stop1Pos}%, ${bg.stop2Color} ${bg.stop2Pos}%)`,
    }
  }
  if (bg.kind === 'radial') {
    const shape = bg.radialShape === 'circle' ? 'circle' : 'ellipse'
    return {
      backgroundColor: 'transparent',
      backgroundImage: `radial-gradient(${shape}, ${bg.stop1Color} ${bg.stop1Pos}%, ${bg.stop2Color} ${bg.stop2Pos}%)`,
    }
  }
  return {
    backgroundColor: 'transparent',
    backgroundImage: `conic-gradient(from ${bg.angle}deg, ${bg.stop1Color} ${bg.stop1Pos}%, ${bg.stop2Color} ${bg.stop2Pos}%)`,
  }
}

export function buildBorderCss(border: BorderParams): Record<string, string> {
  if (border.style === 'none') {
    return { border: 'none' }
  }
  if (!border.sidesIndependent) {
    return {
      'border-width': `${border.width}px`,
      'border-style': border.style,
      'border-color': border.color,
    }
  }
  return {
    'border-style': border.style,
    'border-color': border.color,
    'border-top-width': `${border.topWidth}px`,
    'border-right-width': `${border.rightWidth}px`,
    'border-bottom-width': `${border.bottomWidth}px`,
    'border-left-width': `${border.leftWidth}px`,
  }
}

export function buildFilterCss(config: Pick<VisualEffectConfig, 'blur' | 'grayscale' | 'brightness' | 'contrast'>): string {
  const parts: string[] = []
  if (config.blur > 0) parts.push(`blur(${Math.min(20, config.blur)}px)`)
  if (config.grayscale > 0) parts.push(`grayscale(${Math.min(100, config.grayscale)}%)`)
  if (config.brightness !== 100) parts.push(`brightness(${config.brightness}%)`)
  if (config.contrast !== 100) parts.push(`contrast(${config.contrast}%)`)
  return parts.length ? parts.join(' ') : 'none'
}

export function buildTransformCss(config: Pick<VisualEffectConfig, 'rotate' | 'scale'>): string {
  const parts: string[] = []
  if (config.rotate !== 0) parts.push(`rotate(${config.rotate}deg)`)
  if (config.scale !== 1) parts.push(`scale(${config.scale})`)
  return parts.length ? parts.join(' ') : 'none'
}

export function resolveClipPath(config: Pick<VisualEffectConfig, 'clipPathPreset' | 'clipPathCustom'>): string {
  if (config.clipPathPreset === 'custom') return config.clipPathCustom.trim() || 'none'
  const preset = CLIP_PATH_PRESETS.find((p) => p.id === config.clipPathPreset)
  return preset?.value ?? 'none'
}

export function visualEffectConfigToStylePresetProperties(config: VisualEffectConfig): StylePresetProperties {
  const bg = buildBackgroundCss(config.background)
  const border = buildBorderCss(config.border)
  const filter = buildFilterCss(config)
  const transform = buildTransformCss(config)
  const clipPath = resolveClipPath(config)

  const properties: StylePresetProperties = {
    opacity: String(Math.min(1, Math.max(0, config.opacity))),
    'box-shadow': normalizeBoxShadowValue(buildBoxShadowFromParams(config.shadow)),
    filter,
    'background-color': bg.backgroundColor ?? config.background.solid,
    'background-image': bg.backgroundImage ?? 'none',
    ...border,
    'backdrop-filter': config.backdropBlur > 0 ? `blur(${Math.min(20, config.backdropBlur)}px)` : 'none',
    'clip-path': clipPath,
    'mix-blend-mode': config.mixBlendMode || 'normal',
    transform,
    [VISUAL_EFFECT_CONFIG_KEY]: JSON.stringify(config),
  }

  if (config.borderRadius.linked) {
    properties['border-radius'] = buildBorderRadiusCss(config.borderRadius)
  } else {
    properties['border-top-left-radius'] = `${config.borderRadius.topLeft}px`
    properties['border-top-right-radius'] = `${config.borderRadius.topRight}px`
    properties['border-bottom-right-radius'] = `${config.borderRadius.bottomRight}px`
    properties['border-bottom-left-radius'] = `${config.borderRadius.bottomLeft}px`
  }

  return properties
}

function parsePx(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback
  const n = parseFloat(raw)
  return Number.isFinite(n) ? n : fallback
}

function parseOpacity(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback
  const trimmed = raw.trim()
  if (trimmed.endsWith('%')) return Math.min(1, parseFloat(trimmed) / 100)
  const n = parseFloat(trimmed)
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : fallback
}

function parseFilterBlur(filter: string | undefined): number {
  if (!filter) return 0
  const m = filter.match(/blur\(\s*([\d.]+)\s*px\s*\)/i)
  return m ? parsePx(m[1], 0) : 0
}

function parseFilterPercent(filter: string | undefined, fn: string, fallback: number): number {
  if (!filter) return fallback
  const m = filter.match(new RegExp(`${fn}\\(\\s*([\\d.]+)\\s*%\\s*\\)`, 'i'))
  return m ? parsePx(m[1], fallback) : fallback
}

function parseTransformRotate(transform: string | undefined): number {
  if (!transform) return 0
  const m = transform.match(/rotate\(\s*(-?[\d.]+)\s*deg\s*\)/i)
  return m ? parsePx(m[1], 0) : 0
}

function parseTransformScale(transform: string | undefined): number {
  if (!transform) return 1
  const m = transform.match(/scale\(\s*([\d.]+)\s*\)/i)
  return m ? parsePx(m[1], 1) : 1
}

function inferShadowFromBoxShadow(boxShadow: string): ShadowParams {
  const normalized = normalizeBoxShadowValue(boxShadow)
  const token = EFFECT_SHADOW_OPTIONS.find((o) => o.cssValue === normalized)
  if (token && token.value !== 'none') {
    return { ...defaultShadow(), mode: 'token', tokenLevel: token.value as EffectShadowLevel }
  }
  if (!normalized || normalized === 'none') {
    return { ...defaultShadow(), mode: 'none' }
  }
  const inset = /^inset\s+/i.test(normalized)
  const core = inset ? normalized.replace(/^inset\s+/i, '') : normalized
  const m = core.match(
    /^(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(.+)$/i,
  )
  if (m) {
    return {
      mode: 'custom',
      tokenLevel: '1',
      inset,
      offsetX: parsePx(m[1], 0),
      offsetY: parsePx(m[2], 2),
      blurRadius: parsePx(m[3], 8),
      spreadRadius: parsePx(m[4], 0),
      color: m[5].trim(),
    }
  }
  return { ...defaultShadow(), mode: 'custom', tokenLevel: '1' }
}

function inferRadius(properties: StylePresetProperties): RadiusParams {
  const unified = properties['border-radius']
  const tl = properties['border-top-left-radius']
  if (tl || (unified && unified.includes(' '))) {
    const parts = (unified ?? `${tl} ${properties['border-top-right-radius']} ${properties['border-bottom-right-radius']} ${properties['border-bottom-left-radius']}`)
      .split(/\s+/)
      .map((p) => parsePx(p, 0))
    return {
      linked: false,
      all: parts[0] ?? 0,
      topLeft: parts[0] ?? 0,
      topRight: parts[1] ?? parts[0] ?? 0,
      bottomRight: parts[2] ?? parts[0] ?? 0,
      bottomLeft: parts[3] ?? parts[1] ?? parts[0] ?? 0,
    }
  }
  return { linked: true, all: parsePx(unified, 6), topLeft: 6, topRight: 6, bottomRight: 6, bottomLeft: 6 }
}

function inferBackground(properties: StylePresetProperties): BackgroundParams {
  const bgImage = properties['background-image'] ?? 'none'
  if (bgImage.includes('linear-gradient')) {
    const m = bgImage.match(/linear-gradient\(\s*([\d.]+)deg\s*,\s*(.+)\s*\)/i)
    const stops = m?.[2]?.split(',') ?? []
    return {
      ...defaultBackground(),
      kind: 'linear',
      angle: parsePx(m?.[1], 135),
      stop1Color: stops[0]?.trim().split(/\s+/)[0] ?? 'var(--td-brand-color)',
      stop1Pos: parsePx(stops[0]?.match(/([\d.]+)%/)?.[1], 0),
      stop2Color: stops[1]?.trim().split(/\s+/)[0] ?? 'var(--td-brand-color-8)',
      stop2Pos: parsePx(stops[1]?.match(/([\d.]+)%/)?.[1], 100),
    }
  }
  if (bgImage.includes('radial-gradient')) {
    return { ...defaultBackground(), kind: 'radial' }
  }
  if (bgImage.includes('conic-gradient')) {
    return { ...defaultBackground(), kind: 'conic' }
  }
  return {
    ...defaultBackground(),
    kind: 'solid',
    solid: properties['background-color'] ?? '#FFFFFF',
  }
}

function inferBorder(properties: StylePresetProperties): BorderParams {
  const style = (properties['border-style'] ?? 'solid') as BorderStyleKind
  const top = properties['border-top-width']
  if (top) {
    return {
      style,
      color: properties['border-color'] ?? 'var(--td-component-border)',
      width: parsePx(properties['border-width'], 1),
      sidesIndependent: true,
      topWidth: parsePx(top, 1),
      rightWidth: parsePx(properties['border-right-width'], 1),
      bottomWidth: parsePx(properties['border-bottom-width'], 1),
      leftWidth: parsePx(properties['border-left-width'], 1),
    }
  }
  return {
    ...defaultBorder(),
    style,
    color: properties['border-color'] ?? defaultBorder().color,
    width: parsePx(properties['border-width'], 1),
  }
}

function inferClipPath(clipPath: string | undefined): Pick<VisualEffectConfig, 'clipPathPreset' | 'clipPathCustom'> {
  const raw = clipPath?.trim() ?? 'none'
  if (!raw || raw === 'none') return { clipPathPreset: 'none', clipPathCustom: '' }
  const preset = CLIP_PATH_PRESETS.find((p) => p.value === raw)
  if (preset) return { clipPathPreset: preset.id, clipPathCustom: '' }
  return { clipPathPreset: 'custom', clipPathCustom: raw }
}

export function inferVisualEffectFromLegacyProperties(
  presetId: string,
  presetName: string,
  properties: StylePresetProperties,
): VisualEffectConfig {
  const filter = properties.filter ?? 'none'
  const backdrop = properties['backdrop-filter'] ?? 'none'
  return defaultVisualEffectConfig({
    id: presetId,
    name: presetName,
    shadow: inferShadowFromBoxShadow(properties['box-shadow'] ?? 'none'),
    blur: parseFilterBlur(filter),
    opacity: parseOpacity(properties.opacity, 1),
    borderRadius: inferRadius(properties),
    background: inferBackground(properties),
    border: inferBorder(properties),
    backdropBlur: parseFilterBlur(backdrop),
    ...inferClipPath(properties['clip-path']),
    grayscale: parseFilterPercent(filter, 'grayscale', 0),
    brightness: parseFilterPercent(filter, 'brightness', 100),
    contrast: parseFilterPercent(filter, 'contrast', 100),
    mixBlendMode: properties['mix-blend-mode'] ?? 'normal',
    rotate: parseTransformRotate(properties.transform),
    scale: parseTransformScale(properties.transform),
  })
}

export function parseVisualEffectConfigJson(raw: string | undefined): VisualEffectConfig | null {
  if (!raw?.trim()) return null
  try {
    const parsed = JSON.parse(raw) as VisualEffectConfig
    if (!parsed?.id || !parsed.shadow) return null
    return defaultVisualEffectConfig(parsed)
  } catch {
    return null
  }
}

export function readVisualEffectFromPreset(preset: StylePreset): VisualEffectConfig {
  const embedded = parseVisualEffectConfigJson(preset.properties[VISUAL_EFFECT_CONFIG_KEY])
  if (embedded) return defaultVisualEffectConfig({ ...embedded, id: preset.id, name: preset.name })
  return inferVisualEffectFromLegacyProperties(preset.id, preset.name, preset.properties)
}

export function mergeVisualEffectIntoProperties(
  presetId: string,
  presetName: string,
  properties: StylePresetProperties,
): StylePresetProperties {
  const embedded = parseVisualEffectConfigJson(properties[VISUAL_EFFECT_CONFIG_KEY])
  const config = defaultVisualEffectConfig({
    ...(embedded ?? inferVisualEffectFromLegacyProperties(presetId, presetName, properties)),
    id: presetId,
    name: presetName,
  })
  return { ...properties, ...visualEffectConfigToStylePresetProperties(config) }
}

export function visualEffectSummary(config: VisualEffectConfig): string {
  const parts: string[] = []
  if (config.shadow.mode === 'token') parts.push(`阴影 ${config.shadow.tokenLevel}`)
  else if (config.shadow.mode === 'custom') parts.push('自定义阴影')
  if (config.blur > 0) parts.push(`模糊 ${config.blur}px`)
  if (config.opacity < 1) parts.push(`透明度 ${Math.round(config.opacity * 100)}%`)
  if (config.background.kind !== 'solid') parts.push(config.background.kind)
  if (config.backdropBlur > 0) parts.push(`毛玻璃 ${config.backdropBlur}px`)
  if (config.grayscale > 0) parts.push(`灰度 ${config.grayscale}%`)
  if (config.rotate !== 0) parts.push(`旋转 ${config.rotate}°`)
  if (config.scale !== 1) parts.push(`缩放 ${config.scale}`)
  return parts.join(' · ') || '基础容器效果'
}
