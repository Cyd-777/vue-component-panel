/**
 * 布局间距：gap / padding / border-radius 画布拖拽逻辑。
 */
import {
  getTagAttrsFromCode,
  getTagAttrEntries,
  parseInlineStyle,
  parseNumericAttr,
  type AttrEntry,
} from './attrPatch'
import { findTagLineInSource } from './tagIndex'

export type PaddingEdge = 'n' | 'e' | 's' | 'w'
export type GapAxis = 'column' | 'row'

export function isLayoutContainerTag(code: string, tagIndex: number): boolean {
  return findTagLineInSource(code, tagIndex)?.tagName.toLowerCase() === 'layoutcontainer'
}

export function isSpanTag(code: string, tagIndex: number): boolean {
  return findTagLineInSource(code, tagIndex)?.tagName.toLowerCase() === 'span'
}

/** 画板可编辑结构容器（可嵌套子节点、可作为拖放父级） */
export function isEditorStructuralContainer(code: string, tagIndex: number): boolean {
  return isLayoutContainerTag(code, tagIndex)
}

/** 组件库导入的自定义组件（整颗子树不可在画板内拆解编辑） */
export function isImportedComponentTag(code: string, tagIndex: number): boolean {
  const loc = findTagLineInSource(code, tagIndex)
  if (!loc) return false
  const name = loc.tagName.toLowerCase()
  return name !== 'span' && name !== 'layoutcontainer'
}

/** flex/grid 容器的 gap / 圆角等 */
export function canEditLayoutSpacing(code: string, tagIndex: number): boolean {
  if (!isLayoutContainerTag(code, tagIndex)) return false
  const attrs = getTagAttrsFromCode(code, tagIndex)
  const layout = attrs.layout ?? 'none'
  return layout === 'flex' || layout === 'grid'
}

/** 画布间距手柄：LayoutContainer（flex/grid）或 span（仅 padding） */
export function canShowSpacingHandles(code: string, tagIndex: number): boolean {
  if (isSpanTag(code, tagIndex)) return true
  return canEditLayoutSpacing(code, tagIndex)
}

export function parsePaddingAttr(raw: string | undefined): [number, number, number, number] {
  if (!raw) return [0, 0, 0, 0]
  const trimmed = raw.trim()
  if (trimmed.startsWith('[')) {
    const nums = trimmed
      .replace(/^\[|\]$/g, '')
      .split(',')
      .map((s) => Number(s.trim()))
    if (nums.length === 4 && nums.every((n) => Number.isFinite(n))) {
      return [nums[0], nums[1], nums[2], nums[3]]
    }
  }
  const n = Number(trimmed)
  if (Number.isFinite(n)) return [n, n, n, n]
  return [0, 0, 0, 0]
}

export function formatPaddingAttr(p: [number, number, number, number]): string {
  if (p[0] === p[1] && p[1] === p[2] && p[2] === p[3]) {
    return String(Math.max(0, Math.round(p[0])))
  }
  return `[${p.map((v) => Math.max(0, Math.round(v))).join(',')}]`
}

export type PaddingLinkMode = 'none' | 'vertical' | 'all'

/** 根据四向 padding 推断属性面板的绑定模式 */
export function inferPaddingLinkMode(p: [number, number, number, number]): PaddingLinkMode {
  if (p[0] === p[1] && p[1] === p[2] && p[2] === p[3]) return 'all'
  if (p[0] === p[2]) return 'vertical'
  return 'none'
}

function parsePxToken(raw: string | undefined): number | null {
  if (!raw) return null
  const m = raw.trim().match(/^(-?\d+(?:\.\d+)?)px$/)
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n : null
}

/** 从 span 等 inline style 读取四向 padding */
export function parsePaddingFromInlineStyle(styles: Record<string, string>): [number, number, number, number] {
  const top = parsePxToken(styles['padding-top'])
  const right = parsePxToken(styles['padding-right'])
  const bottom = parsePxToken(styles['padding-bottom'])
  const left = parsePxToken(styles['padding-left'])
  if (top !== null || right !== null || bottom !== null || left !== null) {
    return [top ?? 0, right ?? 0, bottom ?? 0, left ?? 0]
  }

  const shorthand = styles.padding?.trim()
  if (!shorthand) return [0, 0, 0, 0]

  const parts = shorthand.split(/\s+/).map((part) => parsePxToken(part) ?? parseFloat(part))
  if (parts.length === 1 && Number.isFinite(parts[0])) {
    return [parts[0], parts[0], parts[0], parts[0]]
  }
  if (parts.length === 2 && parts.every((n) => Number.isFinite(n))) {
    return [parts[0], parts[1], parts[0], parts[1]]
  }
  if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
    return [parts[0], parts[1], parts[2], parts[3]]
  }
  return [0, 0, 0, 0]
}

export interface SpacingAttrs {
  columnGap: number
  rowGap: number
  padding: [number, number, number, number]
  /** @deprecated 用 borderRadiusCorners */
  borderRadius: number
  borderRadiusCorners: BorderRadiusCorners
  /** 是否统一模式（由源码格式决定，非四角数值是否相等） */
  borderRadiusLinked: boolean
  flexDirection: string
}

export function getSpacingAttrs(code: string, tagIndex: number): SpacingAttrs {
  const attrs = getTagAttrsFromCode(code, tagIndex)

  if (isSpanTag(code, tagIndex)) {
    const entries = getTagAttrEntries(code, tagIndex)
    const styles = parseInlineStyle(entries.style?.value ?? '')
    const padding = parsePaddingFromInlineStyle(styles)
    const raw = styles['border-radius']
    const corners = parseBorderRadiusAttr(raw, 0)
    const linked = isBorderRadiusAttrLinked(raw)
    return {
      columnGap: 0,
      rowGap: 0,
      padding,
      borderRadius: corners[0],
      borderRadiusCorners: corners,
      borderRadiusLinked: linked,
      flexDirection: 'row',
    }
  }

  const raw = attrs['border-radius']
  const corners = parseBorderRadiusAttr(raw, 8)
  const linked = isBorderRadiusAttrLinked(raw)
  return {
    columnGap: parseNumericAttr(attrs, 'column-gap') ?? 12,
    rowGap: parseNumericAttr(attrs, 'row-gap') ?? 12,
    padding: parsePaddingAttr(attrs.padding),
    borderRadius: corners[0],
    borderRadiusCorners: corners,
    borderRadiusLinked: linked,
    flexDirection: attrs['flex-direction'] ?? 'row',
  }
}

export function clampSpacing(n: number, min = 0, max = 999): number {
  return Math.max(min, Math.min(max, Math.round(n)))
}

export function buildGapPatch(axis: GapAxis, value: number): Record<string, AttrEntry> {
  const key = axis === 'column' ? 'column-gap' : 'row-gap'
  return { [key]: { value: String(clampSpacing(value)), dynamic: true } }
}

const PADDING_EDGE_INDEX: Record<PaddingEdge, number> = { n: 0, e: 1, s: 2, w: 3 }

export function buildPaddingPatch(
  edge: PaddingEdge,
  nextEdgeValue: number,
  current: [number, number, number, number],
): Record<string, AttrEntry> {
  const p = [...current] as [number, number, number, number]
  p[PADDING_EDGE_INDEX[edge]] = clampSpacing(nextEdgeValue)
  return { padding: { value: formatPaddingAttr(p), dynamic: true } }
}

/** 按绑定模式应用单条边的 padding 拖拽增量 */
export function applyPaddingDragDelta(
  start: [number, number, number, number],
  edge: PaddingEdge,
  delta: number,
  mode: PaddingLinkMode,
): [number, number, number, number] {
  const edgeIdx = PADDING_EDGE_INDEX[edge]
  const draggedNext = clampSpacing(start[edgeIdx] + delta)

  if (mode === 'all') {
    return [draggedNext, draggedNext, draggedNext, draggedNext]
  }

  const next = [...start] as [number, number, number, number]

  if (mode === 'vertical') {
    if (edge === 'n' || edge === 's') {
      next[0] = draggedNext
      next[2] = draggedNext
    } else {
      next[edgeIdx] = draggedNext
    }
    return next
  }

  next[edgeIdx] = draggedNext
  return next
}

export type BorderRadiusCorners = [number, number, number, number]
/** 0=左上 1=右上 2=右下 3=左下（CSS border-radius 顺序） */
export type RadiusCornerIndex = 0 | 1 | 2 | 3

const RADIUS_LABELS = ['左上', '右上', '右下', '左下'] as const

export function parseBorderRadiusAttr(raw: string | undefined, fallback = 8): BorderRadiusCorners {
  if (!raw?.trim()) return [fallback, fallback, fallback, fallback]
  const trimmed = raw.trim()
  if (trimmed.startsWith('[')) {
    const nums = trimmed
      .replace(/^\[|\]$/g, '')
      .split(',')
      .map((s) => Number(s.trim().replace(/px$/i, '')))
    if (nums.length === 4 && nums.every((n) => Number.isFinite(n))) {
      return [nums[0], nums[1], nums[2], nums[3]]
    }
  }
  const parts = trimmed.split(/\s+/).map((s) => Number(s.replace(/px$/i, '')))
  if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
    return [parts[0], parts[1], parts[2], parts[3]]
  }
  const n = Number(trimmed.replace(/px$/i, ''))
  if (Number.isFinite(n)) return [n, n, n, n]
  return [fallback, fallback, fallback, fallback]
}

/** 源码是否为统一圆角（单值）；四角数值相同但写四值时仍为独立模式 */
export function isBorderRadiusAttrLinked(raw: string | undefined): boolean {
  if (!raw?.trim()) return true
  const trimmed = raw.trim()
  if (trimmed.startsWith('[')) {
    const nums = trimmed
      .replace(/^\[|\]$/g, '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    return nums.length !== 4
  }
  return trimmed.split(/\s+/).filter(Boolean).length < 2
}

export function formatBorderRadiusAttr(corners: BorderRadiusCorners): string {
  const clamped = corners.map((n) => clampSpacing(n)) as BorderRadiusCorners
  return clamped.map((n) => `${n}px`).join(' ')
}

export function formatBorderRadiusPreview(corners: BorderRadiusCorners): string {
  return formatBorderRadiusAttr(corners)
}

export function buildRadiusPatch(value: number): Record<string, AttrEntry> {
  return buildBorderRadiusPatch([value, value, value, value], true)
}

export function buildBorderRadiusPatch(
  corners: BorderRadiusCorners,
  linked: boolean,
): Record<string, AttrEntry> {
  const clamped = corners.map((n) => clampSpacing(n)) as BorderRadiusCorners
  if (linked) {
    return { 'border-radius': { value: String(clamped[0]), dynamic: true } }
  }
  return {
    'border-radius': { value: formatBorderRadiusAttr(clamped), dynamic: false },
  }
}

export function computeRadiusHandlePosition(
  bx: number,
  by: number,
  bw: number,
  bh: number,
  corner: RadiusCornerIndex,
  radius: number,
): { x: number; y: number } {
  const inset = Math.min(24, Math.max(8, radius + 4))
  switch (corner) {
    case 0:
      return { x: bx + inset, y: by + inset }
    case 1:
      return { x: bx + bw - inset, y: by + inset }
    case 2:
      return { x: bx + bw - inset, y: by + bh - inset }
    case 3:
      return { x: bx + inset, y: by + bh - inset }
  }
}

/** 各角手柄拖拽增量（向容器中心拖为增大） */
export function radiusDeltaFromDragForCorner(
  corner: RadiusCornerIndex,
  dx: number,
  dy: number,
): number {
  switch (corner) {
    case 0:
      return (dx + dy) / 2
    case 1:
      return (-dx + dy) / 2
    case 2:
      return -(dx + dy) / 2
    case 3:
      return (dx - dy) / 2
  }
}

/** @deprecated 使用 radiusDeltaFromDragForCorner(2, dx, dy) */
export function radiusDeltaFromDrag(dx: number, dy: number): number {
  return radiusDeltaFromDragForCorner(2, dx, dy)
}

export { RADIUS_LABELS }

export type PaddingDragMode = 'compress' | 'expand'

const PADDING_SLACK_PX = 2

type ContainerSizeMode = 'hug' | 'fill' | 'fixed' | 'min-max'

function getContainerAxisMode(code: string, tagIndex: number, axis: 'width' | 'height'): ContainerSizeMode {
  const attrs = getTagAttrsFromCode(code, tagIndex)
  const key = axis === 'height' ? 'height-mode' : 'width-mode'
  const raw = attrs[key] ?? (axis === 'height' ? 'hug' : 'fill')
  return raw as ContainerSizeMode
}

function isAxisElastic(code: string, tagIndex: number, axis: 'width' | 'height'): boolean {
  const mode = getContainerAxisMode(code, tagIndex, axis)
  return mode === 'fill' || mode === 'fixed' || mode === 'min-max'
}

function parseCssMinPx(el: HTMLElement, prop: 'minHeight' | 'minWidth'): number {
  const v = getComputedStyle(el)[prop]
  if (!v || v === 'auto' || v === 'none' || v === '0px') return 0
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

function childMinAlong(el: HTMLElement, axis: 'horizontal' | 'vertical'): number {
  const cssMin = parseCssMinPx(el, axis === 'vertical' ? 'minHeight' : 'minWidth')
  if (cssMin > 0) return cssMin
  if (axis === 'vertical') return Math.min(el.offsetHeight, el.scrollHeight)
  return Math.min(el.offsetWidth, el.scrollWidth)
}

function measureStackExtent(
  kids: HTMLElement[],
  measure: (el: HTMLElement) => number,
  gap: number,
  stack: boolean,
): number {
  if (!kids.length) return 0
  if (stack) {
    return kids.reduce((sum, k, i) => sum + measure(k) + (i > 0 ? gap : 0), 0)
  }
  return Math.max(...kids.map(measure))
}

function contentCanShrinkAlong(
  containerEl: HTMLElement,
  code: string,
  tagIndex: number,
  axis: 'horizontal' | 'vertical',
): boolean {
  const kids = Array.from(containerEl.children).filter(
    (n): n is HTMLElement => n instanceof HTMLElement,
  )
  if (kids.length === 0) return false

  const attrs = getTagAttrsFromCode(code, tagIndex)
  const layout = (attrs.layout ?? 'flex').toLowerCase()
  const flexDir = (attrs['flex-direction'] ?? 'row').toLowerCase()
  const style = getComputedStyle(containerEl)
  const rowGap = parseFloat(style.rowGap) || 0
  const colGap = parseFloat(style.columnGap) || 0

  if (layout === 'grid') {
    if (axis === 'vertical') {
      const minH = measureStackExtent(kids, (k) => childMinAlong(k, axis), rowGap, true)
      const curH = measureStackExtent(kids, (k) => k.offsetHeight, rowGap, true)
      return curH > minH + PADDING_SLACK_PX
    }
    const minW = measureStackExtent(kids, (k) => childMinAlong(k, axis), colGap, true)
    const curW = measureStackExtent(kids, (k) => k.offsetWidth, colGap, true)
    return curW > minW + PADDING_SLACK_PX
  }

  const isColumn = flexDir.startsWith('column')
  if (axis === 'vertical') {
    const minExtent = measureStackExtent(
      kids,
      (k) => childMinAlong(k, axis),
      rowGap,
      isColumn,
    )
    const curExtent = measureStackExtent(kids, (k) => k.offsetHeight, rowGap, isColumn)
    return curExtent > minExtent + PADDING_SLACK_PX
  }

  const minExtent = measureStackExtent(
    kids,
    (k) => childMinAlong(k, axis),
    colGap,
    !isColumn,
  )
  const curExtent = measureStackExtent(kids, (k) => k.offsetWidth, colGap, !isColumn)
  return curExtent > minExtent + PADDING_SLACK_PX
}

/**
 * 下/右内边距手柄拖动方向：
 * - compress：内部仍可被挤压 → 向内拖增大 padding
 * - expand：已达最小或无子项可挤 → 向外拖增大 padding
 *
 * 假设容器在画布中顶-left 锚定；若改为始终居中定位需另行验证。
 */
export function getPaddingDragMode(
  code: string,
  tagIndex: number,
  containerEl: HTMLElement,
  edge: PaddingEdge,
): PaddingDragMode {
  if (edge !== 's' && edge !== 'e') return 'compress'

  if (isSpanTag(code, tagIndex)) return 'expand'

  const axis = edge === 's' ? 'height' : 'width'
  if (!isAxisElastic(code, tagIndex, axis)) return 'expand'

  const along: 'horizontal' | 'vertical' = edge === 's' ? 'vertical' : 'horizontal'
  if (contentCanShrinkAlong(containerEl, code, tagIndex, along)) return 'compress'
  return 'expand'
}

/** 向内拖增大 padding（compress）；expand 模式下 s/e 改为向外拖增大 */
export function paddingDeltaFromDrag(
  edge: PaddingEdge,
  dx: number,
  dy: number,
  mode: PaddingDragMode = 'compress',
): number {
  if (mode === 'expand') {
    if (edge === 's') return dy
    if (edge === 'e') return dx
  }
  switch (edge) {
    case 'n': return dy
    case 's': return -dy
    case 'w': return dx
    case 'e': return -dx
  }
}

export interface GapHandleView {
  axis: GapAxis
  gapIndex: number
  x: number
  y: number
  width: number
  height: number
  cursor: string
  /** 悬浮时高亮的影响区域（画布坐标） */
  band?: { x: number; y: number; width: number; height: number }
}

export interface PaddingBandView {
  edge: PaddingEdge
  x: number
  y: number
  width: number
  height: number
}

export interface GridCellOutline {
  x: number
  y: number
  width: number
  height: number
}

export interface GapBandRect {
  x: number
  y: number
  width: number
  height: number
}

/** 列/行间距拖拽会同时改容器内同轴全部 gap，返回该轴所有影响区域 */
export function collectGapBandsForAxis(handles: GapHandleView[], axis: GapAxis): GapBandRect[] {
  return handles
    .filter((h) => h.axis === axis && h.band)
    .map((h) => h.band!)
}

interface LocalRect {
  left: number
  right: number
  top: number
  bottom: number
}

const ROW_CLUSTER_PX = 6

function clusterByAxis(values: number[], threshold: number): number[][] {
  const indexed = values.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v)
  const groups: number[][] = []
  for (const { v, i } of indexed) {
    const last = groups[groups.length - 1]
    if (!last) {
      groups.push([i])
      continue
    }
    const ref = values[last[0]]
    if (Math.abs(v - ref) <= threshold) last.push(i)
    else groups.push([i])
  }
  return groups
}

function clusterByRow(rects: LocalRect[]): number[][] {
  return clusterByAxis(
    rects.map((r) => r.top),
    ROW_CLUSTER_PX,
  )
}

function clusterByCol(rects: LocalRect[]): number[][] {
  return clusterByAxis(
    rects.map((r) => r.left),
    ROW_CLUSTER_PX,
  )
}

function makeColumnHandle(
  a: LocalRect,
  b: LocalRect,
  gapIndex: number,
): GapHandleView {
  const xMid = (a.right + b.left) / 2
  const yTop = Math.min(a.top, b.top)
  const yBottom = Math.max(a.bottom, b.bottom)
  return {
    axis: 'column',
    gapIndex,
    x: xMid,
    y: (yTop + yBottom) / 2,
    width: 4,
    height: 28,
    cursor: 'col-resize',
    band: {
      x: a.right,
      y: yTop,
      width: Math.max(1, b.left - a.right),
      height: Math.max(1, yBottom - yTop),
    },
  }
}

function makeRowHandleBetweenRowGroups(
  rects: LocalRect[],
  rowA: number[],
  rowB: number[],
  gapIndex: number,
  containerRect: LocalRect,
): GapHandleView | null {
  const bottomA = Math.max(...rowA.map((i) => rects[i].bottom))
  const topB = Math.min(...rowB.map((i) => rects[i].top))
  if (topB <= bottomA + 0.5) return null

  const centerX = (containerRect.left + containerRect.right) / 2

  return {
    axis: 'row',
    gapIndex,
    x: centerX,
    y: (bottomA + topB) / 2,
    width: 28,
    height: 4,
    cursor: 'row-resize',
    band: {
      x: containerRect.left,
      y: bottomA,
      width: Math.max(1, containerRect.right - containerRect.left),
      height: Math.max(1, topB - bottomA),
    },
  }
}

function makeColumnHandleBetweenColGroups(
  rects: LocalRect[],
  colA: number[],
  colB: number[],
  gapIndex: number,
  containerRect: LocalRect,
): GapHandleView | null {
  const rightA = Math.max(...colA.map((i) => rects[i].right))
  const leftB = Math.min(...colB.map((i) => rects[i].left))
  if (leftB <= rightA + 0.5) return null

  const centerY = (containerRect.top + containerRect.bottom) / 2

  return {
    axis: 'column',
    gapIndex,
    x: (rightA + leftB) / 2,
    y: centerY,
    width: 4,
    height: 28,
    cursor: 'col-resize',
    band: {
      x: rightA,
      y: containerRect.top,
      width: Math.max(1, leftB - rightA),
      height: Math.max(1, containerRect.bottom - containerRect.top),
    },
  }
}

function addColumnHandlesPerRow(gaps: GapHandleView[], rects: LocalRect[], gapIndex: number): number {
  for (const row of clusterByRow(rects)) {
    const sorted = [...row].sort((a, b) => rects[a].left - rects[b].left)
    for (let k = 0; k < sorted.length - 1; k++) {
      const a = rects[sorted[k]]
      const b = rects[sorted[k + 1]]
      if (b.left >= a.right - 1) {
        gaps.push(makeColumnHandle(a, b, gapIndex++))
      }
    }
  }
  return gapIndex
}

function addRowHandlesAtContainerCenter(
  gaps: GapHandleView[],
  rects: LocalRect[],
  containerRect: LocalRect,
  gapIndex: number,
): number {
  const rowGroups = clusterByRow(rects)
  if (rowGroups.length < 2) return gapIndex

  for (let r = 0; r < rowGroups.length - 1; r++) {
    const handle = makeRowHandleBetweenRowGroups(
      rects,
      rowGroups[r],
      rowGroups[r + 1],
      gapIndex++,
      containerRect,
    )
    if (handle) gaps.push(handle)
  }
  return gapIndex
}

function addColumnHandlesAtContainerCenter(
  gaps: GapHandleView[],
  rects: LocalRect[],
  containerRect: LocalRect,
  gapIndex: number,
): number {
  const colGroups = clusterByCol(rects)
  if (colGroups.length < 2) return gapIndex

  for (let c = 0; c < colGroups.length - 1; c++) {
    const handle = makeColumnHandleBetweenColGroups(
      rects,
      colGroups[c],
      colGroups[c + 1],
      gapIndex++,
      containerRect,
    )
    if (handle) gaps.push(handle)
  }
  return gapIndex
}

/** flex 行方向 / grid：按行显示列间距手柄；行间距在容器水平居中 */
function addFlexRowGapHandles(
  gaps: GapHandleView[],
  rects: LocalRect[],
  containerRect: LocalRect,
): void {
  let gapIndex = 0
  gapIndex = addColumnHandlesPerRow(gaps, rects, gapIndex)
  addRowHandlesAtContainerCenter(gaps, rects, containerRect, gapIndex)
}

/** flex 列方向：按行显示列间距；行间距手柄水平居中；多列时列间距在容器垂直居中 */
function addFlexColumnGapHandles(
  gaps: GapHandleView[],
  rects: LocalRect[],
  containerRect: LocalRect,
): void {
  let gapIndex = 0
  gapIndex = addColumnHandlesPerRow(gaps, rects, gapIndex)
  gapIndex = addRowHandlesAtContainerCenter(gaps, rects, containerRect, gapIndex)
  addColumnHandlesAtContainerCenter(gaps, rects, containerRect, gapIndex)
}

function addGridGapHandles(
  gaps: GapHandleView[],
  rects: LocalRect[],
  containerRect: LocalRect,
): void {
  let gapIndex = 0
  gapIndex = addColumnHandlesPerRow(gaps, rects, gapIndex)
  addRowHandlesAtContainerCenter(gaps, rects, containerRect, gapIndex)
}

/** 选中 grid 容器时，淡蓝 cell 轮廓 */
export function computeGridCellOutlines(
  containerEl: HTMLElement,
  canvasRect: DOMRect,
): GridCellOutline[] {
  const style = getComputedStyle(containerEl)
  if (style.display !== 'grid' && style.display !== 'inline-grid') return []

  const children = Array.from(containerEl.children).filter(
    (c) => (c as HTMLElement).dataset.elI,
  ) as HTMLElement[]
  if (children.length === 0) return []

  return children.map((c) => {
    const r = c.getBoundingClientRect()
    return {
      x: r.left - canvasRect.left,
      y: r.top - canvasRect.top,
      width: r.width,
      height: r.height,
    }
  })
}

export function computePaddingBands(
  bx: number,
  by: number,
  bw: number,
  bh: number,
  padTop: number,
  padRight: number,
  padBottom: number,
  padLeft: number,
): PaddingBandView[] {
  const bands: PaddingBandView[] = []
  if (padTop > 0) {
    bands.push({ edge: 'n', x: bx, y: by, width: bw, height: padTop })
  }
  if (padRight > 0) {
    bands.push({ edge: 'e', x: bx + bw - padRight, y: by, width: padRight, height: bh })
  }
  if (padBottom > 0) {
    bands.push({ edge: 's', x: bx, y: by + bh - padBottom, width: bw, height: padBottom })
  }
  if (padLeft > 0) {
    bands.push({ edge: 'w', x: bx, y: by, width: padLeft, height: bh })
  }
  return bands
}

/** 根据子元素实际排布计算 gap 拖拽手柄（flex 换行 / grid 均支持行列间距） */
export function computeGapHandleViews(
  containerEl: HTMLElement,
  canvasRect: DOMRect,
): GapHandleView[] {
  const style = getComputedStyle(containerEl)
  const display = style.display
  const flexDir = style.flexDirection
  const isFlexRow = flexDir.startsWith('row')

  const children = Array.from(containerEl.children).filter(
    (c) => (c as HTMLElement).dataset.elI,
  ) as HTMLElement[]
  if (children.length < 1) return []

  const rects: LocalRect[] = children.map((c) => {
    const r = c.getBoundingClientRect()
    return {
      left: r.left - canvasRect.left,
      right: r.right - canvasRect.left,
      top: r.top - canvasRect.top,
      bottom: r.bottom - canvasRect.top,
    }
  })

  const gaps: GapHandleView[] = []
  const containerRect: LocalRect = {
    left: rects.length ? Math.min(...rects.map((r) => r.left)) : 0,
    right: rects.length ? Math.max(...rects.map((r) => r.right)) : 0,
    top: rects.length ? Math.min(...rects.map((r) => r.top)) : 0,
    bottom: rects.length ? Math.max(...rects.map((r) => r.bottom)) : 0,
  }
  const crEl = containerEl.getBoundingClientRect()
  containerRect.left = crEl.left - canvasRect.left
  containerRect.right = crEl.right - canvasRect.left
  containerRect.top = crEl.top - canvasRect.top
  containerRect.bottom = crEl.bottom - canvasRect.top

  if (display === 'grid' || display === 'inline-grid') {
    addGridGapHandles(gaps, rects, containerRect)
    return gaps
  }

  if (display === 'flex' || display === 'inline-flex') {
    if (isFlexRow) addFlexRowGapHandles(gaps, rects, containerRect)
    else addFlexColumnGapHandles(gaps, rects, containerRect)
    return gaps
  }

  return gaps
}
