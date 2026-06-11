/**
 * 八向手柄缩放：尺寸计算、极值带、fill/hug/fixed 判定。
 */
import {
  formatInlineStyle,
  getTagAttrsFromCode,
  parseInlineStyle,
  parseNumericAttr,
  parseStylePx,
} from './attrPatch'
import type { AttrEntry } from './attrPatch'
import { findTagLineInSource } from './tagIndex'
import { buildContainerResizePatch, type SizeMode as ContainerSizeMode } from './sizeModeLogic'

export type HandleId = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'
export type SizeMode = 'hug' | 'fill' | 'fixed'

export const MIN_SIZE = 40
export const SNAP_PX = 12

export interface CanvasRect {
  x: number
  y: number
  width: number
  height: number
}

export interface AxisLimits {
  min: number | null
  max: number | null
  hasExtreme: boolean
}

export interface ExtremeBandsAxis {
  minBand: CanvasRect | null
  maxBand: CanvasRect | null
  validRect: CanvasRect | null
}

export interface ExtremeBandsView {
  width: ExtremeBandsAxis | null
  height: ExtremeBandsAxis | null
}

export interface ResizeModeResult {
  widthMode: SizeMode
  heightMode: SizeMode
  width: number
  height: number
  tooltip: string | null
}

function modeKey(axis: 'width' | 'height'): string {
  return axis === 'width' ? 'width-mode' : 'height-mode'
}

function minKey(axis: 'width' | 'height'): string {
  return axis === 'width' ? 'min-width' : 'min-height'
}

function maxKey(axis: 'width' | 'height'): string {
  return axis === 'width' ? 'max-width' : 'max-height'
}

function isSpanTag(code: string, tagIndex: number): boolean {
  return findTagLineInSource(code, tagIndex)?.tagName.toLowerCase() === 'span'
}

export { isSpanTag }

function getSpanAxisMode(attrs: Record<string, string>, axis: 'width' | 'height'): SizeMode {
  const styles = parseInlineStyle(attrs.style ?? '')
  const key = axis === 'width' ? 'width' : 'height'
  const value = styles[key]
  if (!value || value === 'auto') return 'hug'
  if (value === '100%') return 'fill'
  if (/^-?\d+(?:\.\d+)?px$/.test(value)) return 'fixed'
  return 'hug'
}

export function getAxisLimits(
  code: string,
  tagIndex: number,
  axis: 'width' | 'height',
): AxisLimits {
  const attrs = getTagAttrsFromCode(code, tagIndex)

  if (isSpanTag(code, tagIndex)) {
    const styles = parseInlineStyle(attrs.style ?? '')
    const min = parseStylePx(styles, minKey(axis))
    const max = parseStylePx(styles, maxKey(axis))
    return { min, max, hasExtreme: min !== null || max !== null }
  }

  const mode = (attrs[modeKey(axis)] ?? '').toLowerCase()
  const min = parseNumericAttr(attrs, minKey(axis))
  const max = parseNumericAttr(attrs, maxKey(axis))
  const hasExtreme = mode === 'minmax' || min !== null || max !== null
  return { min, max, hasExtreme }
}

function clampWithLimits(n: number, limits: AxisLimits): number {
  let v = Math.max(MIN_SIZE, n)
  if (limits.min !== null) v = Math.max(v, limits.min)
  if (limits.max !== null) v = Math.min(v, limits.max)
  return v
}

export interface ResizePreviewOptions {
  /** 为 false 时不限制在 min/max 内，便于越过极值带进入 hug/fill */
  clampToLimits?: boolean
}

interface RulerAxisBounds {
  hugLo: number
  hugEdge: number
  fixedMin: number
  fixedMax: number
  fillEdge: number
  fillHi: number
}

/** 标尺三区对应的尺寸边界；有极值时固定区为 [min, max]，越过极值带才可进入弹性区 */
function getRulerAxisBounds(
  contentSize: number,
  parentSize: number,
  limits: AxisLimits,
): RulerAxisBounds {
  const content = Math.max(MIN_SIZE, Math.round(contentSize))
  const parent = Math.max(content, Math.round(parentSize))

  if (!limits.hasExtreme) {
    return {
      hugLo: 0,
      hugEdge: content + SNAP_PX,
      fixedMin: content + SNAP_PX,
      fixedMax: parent - SNAP_PX,
      fillEdge: parent - SNAP_PX,
      fillHi: parent,
    }
  }

  const { min, max } = limits

  if (min !== null && max !== null) {
    return {
      hugLo: Math.min(content, min - SNAP_PX),
      hugEdge: min - SNAP_PX,
      fixedMin: min,
      fixedMax: max,
      fillEdge: max + SNAP_PX,
      fillHi: parent,
    }
  }

  if (min !== null) {
    return {
      hugLo: Math.min(content, min - SNAP_PX),
      hugEdge: min - SNAP_PX,
      fixedMin: min,
      fixedMax: parent - SNAP_PX,
      fillEdge: parent - SNAP_PX,
      fillHi: parent,
    }
  }

  return {
    hugLo: 0,
    hugEdge: content + SNAP_PX,
    fixedMin: content + SNAP_PX,
    fixedMax: max ?? parent - SNAP_PX,
    fillEdge: (max ?? parent - SNAP_PX) + SNAP_PX,
    fillHi: parent,
  }
}

export function computeResizePreview(
  handle: HandleId,
  startW: number,
  startH: number,
  dx: number,
  dy: number,
  limitsW: AxisLimits,
  limitsH: AxisLimits,
  options?: ResizePreviewOptions,
): { width: number; height: number } {
  let w = startW
  let h = startH

  if (handle.includes('e')) w = startW + dx
  if (handle.includes('w')) w = startW - dx
  if (handle.includes('s')) h = startH + dy
  if (handle.includes('n')) h = startH - dy

  const clampToLimits = options?.clampToLimits !== false
  if (clampToLimits) {
    return {
      width: clampWithLimits(w, limitsW),
      height: clampWithLimits(h, limitsH),
    }
  }

  return {
    width: Math.max(0, w),
    height: Math.max(0, h),
  }
}

function getTextContentSize(el: HTMLElement, axis: 'width' | 'height'): number {
  if (axis === 'width') {
    return Math.max(MIN_SIZE, el.scrollWidth)
  }
  return Math.max(MIN_SIZE, el.scrollHeight)
}

export function getContentSize(el: HTMLElement, axis: 'width' | 'height'): number {
  if (el.tagName === 'SPAN') {
    return getTextContentSize(el, axis)
  }

  const children = Array.from(el.children).filter(
    (c): c is HTMLElement => c instanceof HTMLElement,
  )
  const style = getComputedStyle(el)
  const pl = parseFloat(style.paddingLeft) || 0
  const pr = parseFloat(style.paddingRight) || 0
  const pt = parseFloat(style.paddingTop) || 0
  const pb = parseFloat(style.paddingBottom) || 0

  if (children.length === 0) {
    if (el.textContent?.trim()) {
      return getTextContentSize(el, axis)
    }
    return axis === 'width' ? MIN_SIZE + pl + pr : MIN_SIZE + pt + pb
  }

  if (axis === 'width') {
    let min = Infinity
    let max = -Infinity
    for (const child of children) {
      const r = child.getBoundingClientRect()
      min = Math.min(min, r.left)
      max = Math.max(max, r.right)
    }
    return Math.max(MIN_SIZE, max - min + pl + pr)
  }

  let min = Infinity
  let max = -Infinity
  for (const child of children) {
    const r = child.getBoundingClientRect()
    min = Math.min(min, r.top)
    max = Math.max(max, r.bottom)
  }
  return Math.max(MIN_SIZE, max - min + pt + pb)
}

function near(a: number, b: number): boolean {
  return Math.abs(a - b) <= SNAP_PX
}

function detectAxisMode(
  previewSize: number,
  contentSize: number,
  parentSize: number,
  limits: AxisLimits,
  beyondMin: boolean,
  beyondMax: boolean,
): { mode: SizeMode; tooltip: string | null } {
  const canHugAtContent = limits.min === null || limits.min <= contentSize + SNAP_PX
  const canFillAtParent = limits.max === null || limits.max >= parentSize - SNAP_PX

  if (near(previewSize, contentSize) && canHugAtContent) {
    return { mode: 'hug', tooltip: '适应内容' }
  }
  if (near(previewSize, parentSize) && canFillAtParent) {
    return { mode: 'fill', tooltip: '占用容器剩余位置' }
  }

  if (beyondMin) {
    if (!canHugAtContent) {
      return {
        mode: 'hug',
        tooltip: `适应内容（min ${limits.min}px 大于内容 ${Math.round(contentSize)}px）`,
      }
    }
    return { mode: 'hug', tooltip: '适应内容（越过 min 极值带）' }
  }
  if (beyondMax) {
    if (!canFillAtParent) {
      return {
        mode: 'fill',
        tooltip: `占用容器剩余（max ${limits.max}px 小于父级 ${Math.round(parentSize)}px）`,
      }
    }
    return { mode: 'fill', tooltip: '占用容器剩余（越过 max 极值带）' }
  }

  return { mode: 'fixed', tooltip: null }
}

export interface ParentSizeFallback {
  width: number
  height: number
}

export function getParentContentSize(
  parentEl: HTMLElement | null,
  fallback?: ParentSizeFallback,
): { width: number; height: number } {
  if (parentEl) {
    const st = getComputedStyle(parentEl)
    const pl = parseFloat(st.paddingLeft) || 0
    const pr = parseFloat(st.paddingRight) || 0
    const pt = parseFloat(st.paddingTop) || 0
    const pb = parseFloat(st.paddingBottom) || 0
    return {
      width: Math.max(0, parentEl.clientWidth - pl - pr),
      height: Math.max(0, parentEl.clientHeight - pt - pb),
    }
  }
  if (fallback) return fallback
  return { width: 0, height: 0 }
}

export function detectResizeModesFull(
  handle: HandleId,
  previewW: number,
  previewH: number,
  el: HTMLElement,
  parentEl: HTMLElement | null,
  code: string,
  tagIndex: number,
  limitsW: AxisLimits,
  limitsH: AxisLimits,
  /** 预览根节点等无 layout 父级时，用画布内容区作为 fill 参照 */
  parentFallback?: ParentSizeFallback,
): ResizeModeResult {
  const attrs = getTagAttrsFromCode(code, tagIndex)
  const span = isSpanTag(code, tagIndex)
  const curWMode = span ? getSpanAxisMode(attrs, 'width') : (attrs['width-mode'] ?? 'fill') as SizeMode
  const curHMode = span ? getSpanAxisMode(attrs, 'height') : (attrs['height-mode'] ?? 'hug') as SizeMode

  const parentContent = getParentContentSize(parentEl, parentFallback)
  const parentW = parentContent.width || previewW
  const parentH = parentContent.height || previewH
  const contentW = getContentSize(el, 'width')
  const contentH = getContentSize(el, 'height')

  const beyondMinW = limitsW.min !== null && previewW < limitsW.min - SNAP_PX
  const beyondMaxW = limitsW.max !== null && previewW > limitsW.max + SNAP_PX
  const beyondMinH = limitsH.min !== null && previewH < limitsH.min - SNAP_PX
  const beyondMaxH = limitsH.max !== null && previewH > limitsH.max + SNAP_PX

  const affectsW = handle.includes('e') || handle.includes('w')
  const affectsH = handle.includes('n') || handle.includes('s')

  let widthMode: SizeMode = curWMode
  let heightMode: SizeMode = curHMode
  let tooltip: string | null = null

  if (affectsW) {
    const r = detectAxisMode(previewW, contentW, parentW, limitsW, beyondMinW, beyondMaxW)
    widthMode = r.mode
    if (r.mode !== 'fixed' && r.tooltip) tooltip = r.tooltip
  }
  if (affectsH) {
    const r = detectAxisMode(previewH, contentH, parentH, limitsH, beyondMinH, beyondMaxH)
    heightMode = r.mode
    if (r.mode !== 'fixed' && r.tooltip) tooltip = r.tooltip
  }

  return {
    widthMode,
    heightMode,
    width: Math.round(previewW),
    height: Math.round(previewH),
    tooltip,
  }
}

function buildAxisBands(
  elRect: CanvasRect,
  parentRect: CanvasRect | null,
  axis: 'width' | 'height',
  limits: AxisLimits,
): ExtremeBandsAxis {
  const min = limits.min ?? MIN_SIZE
  const max = limits.max ?? (parentRect
    ? (axis === 'width' ? parentRect.width : parentRect.height)
    : (axis === 'width' ? elRect.width : elRect.height))

  if (axis === 'width') {
    const minBand: CanvasRect = {
      x: elRect.x,
      y: elRect.y,
      width: Math.max(8, min),
      height: elRect.height,
    }
    const maxBand: CanvasRect = {
      x: elRect.x + max,
      y: elRect.y,
      width: Math.max(8, parentRect
        ? parentRect.x + parentRect.width - (elRect.x + max)
        : 60),
      height: elRect.height,
    }
    const validRect: CanvasRect = {
      x: elRect.x + min,
      y: elRect.y,
      width: Math.max(MIN_SIZE, max - min),
      height: elRect.height,
    }
    return { minBand, maxBand, validRect }
  }

  const minBand: CanvasRect = {
    x: elRect.x,
    y: elRect.y,
    width: elRect.width,
    height: Math.max(8, min),
  }
  const maxBand: CanvasRect = {
    x: elRect.x,
    y: elRect.y + max,
    width: elRect.width,
    height: Math.max(8, parentRect
      ? parentRect.y + parentRect.height - (elRect.y + max)
      : 60),
  }
  const validRect: CanvasRect = {
    x: elRect.x,
    y: elRect.y + min,
    width: elRect.width,
    height: Math.max(MIN_SIZE, max - min),
  }
  return { minBand, maxBand, validRect }
}

export function computeExtremeBands(
  elRect: CanvasRect,
  parentRect: CanvasRect | null,
  limitsW: AxisLimits,
  limitsH: AxisLimits,
): ExtremeBandsView {
  return {
    width: limitsW.hasExtreme ? buildAxisBands(elRect, parentRect, 'width', limitsW) : null,
    height: limitsH.hasExtreme ? buildAxisBands(elRect, parentRect, 'height', limitsH) : null,
  }
}

export type ElasticZoneKind = 'hug' | 'fixed' | 'fill'

export interface ElasticRulerAxis {
  contentSize: number
  parentSize: number
}

export interface ElasticRulerContext {
  width: ElasticRulerAxis | null
  height: ElasticRulerAxis | null
}

export interface ElasticRulerZoneView {
  kind: ElasticZoneKind
  label: string
  /** 标尺上的固定比例区间 [0, 1] */
  start: number
  end: number
}

export interface ElasticResizeAxisGuideView {
  axis: 'width' | 'height'
  bubbleX: number
  bubbleY: number
  rulerLength: number
  contentSize: number
  parentSize: number
  /** 手柄拖动的原始尺寸（标尺指针位置） */
  dragSize: number
  activeKind: ElasticZoneKind
  /** 拖拽开始时固定，不随指针移动 */
  zones: ElasticRulerZoneView[]
  markerRatio: number
}

export interface ElasticSnapGuidesView {
  width: ElasticResizeAxisGuideView | null
  height: ElasticResizeAxisGuideView | null
}

export const ELASTIC_BUBBLE_RULER_W = 220
export const ELASTIC_SIDE_ZONE_PX = 56
export const ELASTIC_BUBBLE_GAP = 8
export const ELASTIC_BUBBLE_STACK = 52

export function captureElasticRulerContext(
  handle: HandleId,
  el: HTMLElement,
  parentEl: HTMLElement | null,
  parentFallback?: ParentSizeFallback,
): ElasticRulerContext {
  const affectsW = handle.includes('e') || handle.includes('w')
  const affectsH = handle.includes('n') || handle.includes('s')
  const parentContent = getParentContentSize(parentEl, parentFallback)
  return {
    width: affectsW
      ? { contentSize: getContentSize(el, 'width'), parentSize: parentContent.width }
      : null,
    height: affectsH
      ? { contentSize: getContentSize(el, 'height'), parentSize: parentContent.height }
      : null,
  }
}

/** 拖拽开始时生成固定三区标尺：左右两区像素宽度恒定，中间区占剩余 */
export function buildRulerZones(): ElasticRulerZoneView[] {
  const sideRatio = ELASTIC_SIDE_ZONE_PX / ELASTIC_BUBBLE_RULER_W
  const midStart = sideRatio
  const midEnd = 1 - sideRatio
  return [
    { kind: 'hug', label: '适应内容', start: 0, end: midStart },
    { kind: 'fixed', label: '固定值', start: midStart, end: midEnd },
    { kind: 'fill', label: '占用容器剩余', start: midEnd, end: 1 },
  ]
}

/** 气泡锚在目标下方；双轴时纵向堆叠 */
export function computeElasticBubbleAnchor(
  elRect: CanvasRect,
  stackIndex = 0,
): { x: number; y: number } {
  return {
    x: elRect.x + elRect.width / 2,
    y: elRect.y + elRect.height + ELASTIC_BUBBLE_GAP + stackIndex * ELASTIC_BUBBLE_STACK,
  }
}

/** 将拖动尺寸映射到固定三区标尺上的指针位置 [0, 1] */
export function computeMarkerRatio(
  dragSize: number,
  contentSize: number,
  parentSize: number,
  limits: AxisLimits,
): number {
  const rulerW = ELASTIC_BUBBLE_RULER_W
  const side = ELASTIC_SIDE_ZONE_PX
  const leftEnd = side
  const rightStart = rulerW - side
  const midW = rightStart - leftEnd

  const content = Math.max(MIN_SIZE, Math.round(contentSize))
  const parent = Math.max(content, Math.round(parentSize))
  const raw = Math.max(0, dragSize)
  const bounds = getRulerAxisBounds(content, parent, limits)

  if (raw <= bounds.hugEdge) {
    const span = Math.max(bounds.hugEdge - bounds.hugLo, 1)
    const t = Math.min(1, Math.max(0, (raw - bounds.hugLo) / span))
    return (t * leftEnd) / rulerW
  }

  if (raw >= bounds.fillEdge) {
    const span = Math.max(bounds.fillHi - bounds.fillEdge, 1)
    const t = Math.min(1, (raw - bounds.fillEdge) / span)
    return (rightStart + t * side) / rulerW
  }

  if (limits.hasExtreme && limits.min !== null && limits.max !== null) {
    if (raw < limits.min) return leftEnd / rulerW
    if (raw > limits.max) return rightStart / rulerW
    const t = (raw - limits.min) / Math.max(limits.max - limits.min, 1)
    return (leftEnd + t * midW) / rulerW
  }

  const midSpan = Math.max(bounds.fillEdge - bounds.hugEdge, 1)
  const t = (raw - bounds.hugEdge) / midSpan
  return (leftEnd + t * midW) / rulerW
}

export function classifyAxisByRuler(
  dragSize: number,
  contentSize: number,
  parentSize: number,
  limits: AxisLimits,
): {
  mode: SizeMode
  tooltip: string | null
  previewSize: number
  activeKind: ElasticZoneKind
} {
  const content = Math.max(MIN_SIZE, Math.round(contentSize))
  const parent = Math.max(content, Math.round(parentSize))
  const raw = Math.max(0, dragSize)
  const bounds = getRulerAxisBounds(content, parent, limits)

  if (raw <= bounds.hugEdge) {
    return {
      mode: 'hug',
      tooltip: '适应内容',
      previewSize: content,
      activeKind: 'hug',
    }
  }
  if (raw >= bounds.fillEdge) {
    return {
      mode: 'fill',
      tooltip: '占用容器剩余位置',
      previewSize: parent,
      activeKind: 'fill',
    }
  }

  if (limits.hasExtreme && limits.min !== null && limits.max !== null) {
    if (raw >= limits.min && raw <= limits.max) {
      return {
        mode: 'fixed',
        tooltip: null,
        previewSize: Math.round(raw),
        activeKind: 'fixed',
      }
    }
    if (raw < limits.min) {
      return {
        mode: 'fixed',
        tooltip: null,
        previewSize: limits.min,
        activeKind: 'fixed',
      }
    }
    return {
      mode: 'fixed',
      tooltip: null,
      previewSize: limits.max,
      activeKind: 'fixed',
    }
  }

  if (limits.hasExtreme && limits.min !== null) {
    return {
      mode: 'fixed',
      tooltip: null,
      previewSize: Math.round(Math.max(limits.min, Math.min(raw, bounds.fixedMax))),
      activeKind: 'fixed',
    }
  }

  if (limits.hasExtreme && limits.max !== null) {
    return {
      mode: 'fixed',
      tooltip: null,
      previewSize: Math.round(Math.min(limits.max, Math.max(raw, bounds.fixedMin))),
      activeKind: 'fixed',
    }
  }

  return {
    mode: 'fixed',
    tooltip: null,
    previewSize: Math.round(raw),
    activeKind: 'fixed',
  }
}

/** 按固定标尺三区判定模式，并返回对应预览尺寸 */
export function detectResizeModesFromRuler(
  handle: HandleId,
  rawW: number,
  rawH: number,
  ruler: ElasticRulerContext,
  limitsW: AxisLimits,
  limitsH: AxisLimits,
  curWMode: SizeMode = 'fill',
  curHMode: SizeMode = 'hug',
): ResizeModeResult {
  const affectsW = handle.includes('e') || handle.includes('w')
  const affectsH = handle.includes('n') || handle.includes('s')

  let widthMode: SizeMode = curWMode
  let heightMode: SizeMode = curHMode
  let width = Math.round(rawW)
  let height = Math.round(rawH)
  let tooltip: string | null = null

  if (affectsW && ruler.width) {
    const c = classifyAxisByRuler(rawW, ruler.width.contentSize, ruler.width.parentSize, limitsW)
    widthMode = c.mode
    width = c.previewSize
    if (c.tooltip) tooltip = c.tooltip
  }
  if (affectsH && ruler.height) {
    const c = classifyAxisByRuler(rawH, ruler.height.contentSize, ruler.height.parentSize, limitsH)
    heightMode = c.mode
    height = c.previewSize
    if (c.tooltip) tooltip = c.tooltip
  }

  return { widthMode, heightMode, width, height, tooltip }
}

function buildAxisRulerGuide(
  axis: 'width' | 'height',
  rulerAxis: ElasticRulerAxis,
  zones: ElasticRulerZoneView[],
  dragSize: number,
  limits: AxisLimits,
  bubbleX: number,
  bubbleY: number,
): ElasticResizeAxisGuideView {
  const classified = classifyAxisByRuler(
    dragSize,
    rulerAxis.contentSize,
    rulerAxis.parentSize,
    limits,
  )
  const parent = Math.max(MIN_SIZE, Math.round(rulerAxis.parentSize))
  return {
    axis,
    bubbleX,
    bubbleY,
    rulerLength: ELASTIC_BUBBLE_RULER_W,
    contentSize: Math.round(rulerAxis.contentSize),
    parentSize: parent,
    dragSize: Math.round(dragSize),
    activeKind: classified.activeKind,
    zones,
    markerRatio: Math.min(
      1,
      Math.max(
        0,
        computeMarkerRatio(
          dragSize,
          rulerAxis.contentSize,
          rulerAxis.parentSize,
          limits,
        ),
      ),
    ),
  }
}

export function createElasticRulerGuides(
  ruler: ElasticRulerContext,
  rawW: number,
  rawH: number,
  limitsW: AxisLimits,
  limitsH: AxisLimits,
  elRect: CanvasRect,
  widthZones: ElasticRulerZoneView[] | null,
  heightZones: ElasticRulerZoneView[] | null,
): ElasticSnapGuidesView {
  const widthAnchor = computeElasticBubbleAnchor(elRect, 0)
  const heightStack = ruler.width && ruler.height ? 1 : 0
  const heightAnchor = computeElasticBubbleAnchor(elRect, heightStack)
  return {
    width:
      ruler.width && widthZones
        ? buildAxisRulerGuide(
            'width',
            ruler.width,
            widthZones,
            rawW,
            limitsW,
            widthAnchor.x,
            widthAnchor.y,
          )
        : null,
    height:
      ruler.height && heightZones
        ? buildAxisRulerGuide(
            'height',
            ruler.height,
            heightZones,
            rawH,
            limitsH,
            heightAnchor.x,
            heightAnchor.y,
          )
        : null,
  }
}

export function updateElasticRulerGuides(
  guides: ElasticSnapGuidesView,
  ruler: ElasticRulerContext,
  rawW: number,
  rawH: number,
  limitsW: AxisLimits,
  limitsH: AxisLimits,
  elRect: CanvasRect,
): ElasticSnapGuidesView {
  const widthZones = guides.width?.zones ?? null
  const heightZones = guides.height?.zones ?? null
  return createElasticRulerGuides(
    ruler,
    rawW,
    rawH,
    limitsW,
    limitsH,
    elRect,
    widthZones,
    heightZones,
  )
}

function buildSpanStylePatch(
  existingStyle: string,
  result: ResizeModeResult,
): string {
  const styles = parseInlineStyle(existingStyle)
  styles.display = 'inline-block'

  if (result.widthMode === 'fixed') {
    styles.width = `${result.width}px`
  } else if (result.widthMode === 'fill') {
    styles.width = '100%'
  } else {
    delete styles.width
  }

  if (result.heightMode === 'fixed') {
    styles.height = `${result.height}px`
  } else if (result.heightMode === 'fill') {
    styles.height = '100%'
  } else {
    delete styles.height
  }

  if (result.widthMode === 'hug' && result.heightMode === 'hug' && styles.display === 'inline-block') {
    const onlyDisplay = Object.keys(styles).length === 1
    if (onlyDisplay) delete styles.display
  }

  return formatInlineStyle(styles)
}

export function finalizeSpanResizeResult(
  result: ResizeModeResult,
  handle: HandleId,
  startW: number,
  startH: number,
  lastW: number,
  lastH: number,
): ResizeModeResult {
  const affectsW = handle.includes('e') || handle.includes('w')
  const affectsH = handle.includes('n') || handle.includes('s')
  let { widthMode, heightMode, width, height, tooltip } = result

  if (affectsW && Math.abs(lastW - startW) > 2) {
    widthMode = 'fixed'
    width = Math.round(lastW)
    tooltip = null
  }
  if (affectsH && Math.abs(lastH - startH) > 2) {
    heightMode = 'fixed'
    height = Math.round(lastH)
    tooltip = null
  }

  return { widthMode, heightMode, width, height, tooltip }
}

/** LayoutContainer：贴边 hug/fill 保留判定；中间区写入 fixed 像素 */
export function finalizeContainerResizeResult(
  result: ResizeModeResult,
  handle: HandleId,
  startW: number,
  startH: number,
  lastW: number,
  lastH: number,
): ResizeModeResult {
  const affectsW = handle.includes('e') || handle.includes('w')
  const affectsH = handle.includes('n') || handle.includes('s')
  let { widthMode, heightMode, width, height, tooltip } = result

  if (affectsW && Math.abs(lastW - startW) > 2 && widthMode === 'fixed') {
    width = Math.round(lastW)
    tooltip = null
  }
  if (affectsH && Math.abs(lastH - startH) > 2 && heightMode === 'fixed') {
    height = Math.round(lastH)
    tooltip = null
  }

  return { widthMode, heightMode, width, height, tooltip }
}

export function buildResizePatch(
  code: string,
  tagIndex: number,
  result: ResizeModeResult,
): Record<string, AttrEntry | null> {
  if (isSpanTag(code, tagIndex)) {
    const attrs = getTagAttrsFromCode(code, tagIndex)
    const style = buildSpanStylePatch(attrs.style ?? '', result)
    if (!style) {
      return { style: null }
    }
    return {
      style: { value: style, dynamic: false },
    }
  }

  const current = getTagAttrsFromCode(code, tagIndex)
  return buildContainerResizePatch(
    {
      widthMode: result.widthMode as ContainerSizeMode,
      heightMode: result.heightMode as ContainerSizeMode,
      width: result.width,
      height: result.height,
    },
    current,
  )
}

export function canResizeTag(code: string, tagIndex: number): boolean {
  const loc = findTagLineInSource(code, tagIndex)
  if (!loc) return false
  const tag = loc.tagName.toLowerCase()
  return tag === 'span' || tag === 'layoutcontainer'
}
