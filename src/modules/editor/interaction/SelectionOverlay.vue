<script setup lang="ts">
/**
 * SelectionOverlay — 选中框、手柄、极值带、框选等视觉层。
 * 指针在选中元素上时显示手柄；悬浮 padding/gap 区域显示排线；仅手柄可拖拽改值。
 */
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import type {
  ExtremeBandsView,
  HandleId,
  ElasticSnapGuidesView,
  ElasticZoneKind,
} from '../resizeLogic'
import {
  collectGapBandsForAxis,
  computeGapHandleViews,
  computePaddingBands,
  computeRadiusHandlePosition,
  getPaddingDragMode,
  type GapAxis,
  type GapBandRect,
  type GapHandleView,
  type PaddingBandView,
  type PaddingDragMode,
  type PaddingEdge,
  type RadiusCornerIndex,
} from '../layoutSpacingLogic'
import {
  computeGridTrackCapsules,
  getGridTracksFromCode,
  gridTrackModeLabel,
  GRID_TRACK_SIZE_MODES,
  type GridTrackCapsuleView,
  type GridTrackDragPreview,
  type GridTrackSizeMode,
  type GridElementDropPreview,
} from '../gridTrackLogic'
import { getTagAttrsFromCode } from '../attrPatch'

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

interface SpacingTooltip {
  x: number
  y: number
  text: string
  kind: 'padding' | 'gap' | 'radius'
}

interface ResizeTooltip {
  x: number
  y: number
  text: string
}

interface PaddingHandleView {
  edge: PaddingEdge
  x: number
  y: number
  cursor: string
}

interface RadiusHandleView {
  corner: RadiusCornerIndex
  x: number
  y: number
}

interface SpacingDragHint {
  kind: 'padding' | 'gap' | 'radius'
  edge?: PaddingEdge
  axis?: GapAxis
  mode?: PaddingDragMode
}

const props = defineProps<{
  selectedId: string | null
  selectedIds?: Set<string>
  hoveredId: string | null
  /** 指针在选中元素（含子节点）或 overlay 手柄上时为 true */
  pointerOverSelected?: boolean
  /** overlay 本地坐标，用于 padding/gap 区域排线悬浮（不拦截 pointer 事件） */
  overlayPointer?: { x: number; y: number } | null
  marqueeRect: Rect | null
  previewRoot: HTMLElement | null
  /** overlay 坐标原点（与 .so 的 position:absolute 容器一致，非滚动 canvas） */
  containerEl: HTMLElement | null
  componentCode?: string
  showResizeHandles?: boolean
  showSpacingHandles?: boolean
  showGapHandles?: boolean
  showRadiusHandles?: boolean
  resizeActive?: boolean
  spacingActive?: boolean
  spacingDragHint?: SpacingDragHint | null
  extremeBands?: ExtremeBandsView | null
  elasticSnapGuides?: ElasticSnapGuidesView | null
  extremeBandFocus?: 'width-min' | 'width-max' | 'height-min' | 'height-max' | null
  resizeTooltip?: ResizeTooltip | null
  spacingTooltip?: SpacingTooltip | null
  gapDragPreview?: { axis: GapAxis; gapIndex: number; x: number; y: number } | null
  gridTrackDragPreview?: GridTrackDragPreview | null
  gridElementDropPreview?: GridElementDropPreview | null
  gridTrackHover?: { col: number | null; row: number | null } | null
}>()

const emit = defineEmits<{
  (e: 'resize-start', handle: HandleId, event: PointerEvent): void
  (e: 'gap-drag-start', axis: GapAxis, gapIndex: number, handleX: number, handleY: number, event: PointerEvent): void
  (e: 'padding-drag-start', edge: PaddingEdge, event: PointerEvent): void
  (e: 'radius-drag-start', corner: RadiusCornerIndex, event: PointerEvent): void
  (e: 'grid-track-drag-start', axis: 'column' | 'row', index: number, event: PointerEvent): void
  (
    e: 'grid-track-size-change',
    axis: 'column' | 'row',
    index: number,
    mode: GridTrackSizeMode,
    value: number,
  ): void
}>()

const selectedRect = ref<Rect | null>(null)
const selectionFrames = ref<{ id: string; rect: Rect }[]>([])
const hoveredRect = ref<Rect | null>(null)
const gapHandles = ref<GapHandleView[]>([])
const paddingHandles = ref<PaddingHandleView[]>([])
const paddingBands = ref<PaddingBandView[]>([])
const gridColumnTracks = ref<GridTrackCapsuleView[]>([])
const gridRowTracks = ref<GridTrackCapsuleView[]>([])
const gridTrackExpanded = ref<{ axis: 'column' | 'row'; index: number } | null>(null)
const gridTrackModeMenu = ref<{ axis: 'column' | 'row'; index: number } | null>(null)
const gridTrackWrapHoverCol = ref<number | null>(null)
const gridTrackWrapHoverRow = ref<number | null>(null)
const radiusHandles = ref<RadiusHandleView[]>([])
const hoveredPadEdge = ref<PaddingEdge | null>(null)
const hoveredGapKey = ref<string | null>(null)
const paddingEdgeModes = ref<{ s: PaddingDragMode; e: PaddingDragMode }>({
  s: 'compress',
  e: 'compress',
})

function getSelectionIds(): string[] {
  if (props.selectedIds && props.selectedIds.size > 0) {
    return Array.from(props.selectedIds)
  }
  return props.selectedId ? [props.selectedId] : []
}

function getElRect(index: string): Rect | null {
  if (!props.previewRoot || !props.containerEl) return null
  const el = props.previewRoot.querySelector(`[data-el-i="${index}"]`) as HTMLElement | null
  if (!el) return null
  const cr = props.containerEl.getBoundingClientRect()
  const er = el.getBoundingClientRect()
  return {
    x: er.left - cr.left,
    y: er.top - cr.top,
    width: er.width,
    height: er.height,
  }
}

function clearSpacingHandleViews() {
  gapHandles.value = []
  paddingHandles.value = []
  paddingBands.value = []
  gridColumnTracks.value = []
  gridRowTracks.value = []
}

function updateRadiusHandles(containerEl: HTMLElement, cr: DOMRect) {
  if (!props.showRadiusHandles) {
    radiusHandles.value = []
    return
  }

  const style = getComputedStyle(containerEl)
  const cornerRadii: [number, number, number, number] = [
    parseFloat(style.borderTopLeftRadius) || 0,
    parseFloat(style.borderTopRightRadius) || 0,
    parseFloat(style.borderBottomRightRadius) || 0,
    parseFloat(style.borderBottomLeftRadius) || 0,
  ]

  const er = containerEl.getBoundingClientRect()
  const bx = er.left - cr.left
  const by = er.top - cr.top
  const bw = er.width
  const bh = er.height

  radiusHandles.value = ([0, 1, 2, 3] as RadiusCornerIndex[]).map((corner) => ({
    corner,
    ...computeRadiusHandlePosition(bx, by, bw, bh, corner, cornerRadii[corner]),
  }))
}

function updateSpacingHandles(containerEl: HTMLElement, cr: DOMRect) {
  if (!props.showSpacingHandles) {
    clearSpacingHandleViews()
    return
  }

  const style = getComputedStyle(containerEl)
  const padTop = parseFloat(style.paddingTop) || 0
  const padRight = parseFloat(style.paddingRight) || 0
  const padBottom = parseFloat(style.paddingBottom) || 0
  const padLeft = parseFloat(style.paddingLeft) || 0

  const er = containerEl.getBoundingClientRect()
  const bx = er.left - cr.left
  const by = er.top - cr.top
  const bw = er.width
  const bh = er.height

  paddingHandles.value = [
    { edge: 'n', x: bx + bw / 2, y: by + padTop / 2, cursor: 'ns-resize' },
    { edge: 'e', x: bx + bw - padRight / 2, y: by + bh / 2, cursor: 'ew-resize' },
    { edge: 's', x: bx + bw / 2, y: by + bh - padBottom / 2, cursor: 'ns-resize' },
    { edge: 'w', x: bx + padLeft / 2, y: by + bh / 2, cursor: 'ew-resize' },
  ]

  paddingBands.value = computePaddingBands(bx, by, bw, bh, padTop, padRight, padBottom, padLeft)

  const tagIndex = parseInt(props.selectedId?.replace('el-', '') ?? '', 10)
  if (props.componentCode && Number.isFinite(tagIndex)) {
    paddingEdgeModes.value = {
      s: getPaddingDragMode(props.componentCode, tagIndex, containerEl, 's'),
      e: getPaddingDragMode(props.componentCode, tagIndex, containerEl, 'e'),
    }
  } else {
    paddingEdgeModes.value = { s: 'compress', e: 'compress' }
  }

  gapHandles.value = props.showGapHandles ? computeGapHandleViews(containerEl, cr) : []

  const display = style.display
  const isGrid = display === 'grid' || display === 'inline-grid'

  if (isGrid && props.componentCode && Number.isFinite(tagIndex)) {
    const tracks = getGridTracksFromCode(props.componentCode, tagIndex)
    const capsules = computeGridTrackCapsules(containerEl, cr, tracks.columns, tracks.rows)
    gridColumnTracks.value = capsules.columns
    gridRowTracks.value = capsules.rows
  } else {
    gridColumnTracks.value = []
    gridRowTracks.value = []
  }
}

function updateRects() {
  const frames: { id: string; rect: Rect }[] = []
  for (const id of getSelectionIds()) {
    const rect = getElRect(id.replace('el-', ''))
    if (rect) frames.push({ id, rect })
  }
  selectionFrames.value = frames

  if (props.selectedId) {
    const idx = props.selectedId.replace('el-', '')
    selectedRect.value = getElRect(idx)
    if (props.previewRoot && props.containerEl) {
      const containerEl = props.previewRoot.querySelector(
        `[data-el-i="${idx}"]`,
      ) as HTMLElement | null
      if (containerEl) {
        const cr = props.containerEl.getBoundingClientRect()
        if (props.showSpacingHandles) {
          updateSpacingHandles(containerEl, cr)
        } else {
          clearSpacingHandleViews()
        }
        updateRadiusHandles(containerEl, cr)
      } else {
        clearSpacingHandleViews()
        radiusHandles.value = []
      }
    } else {
      clearSpacingHandleViews()
      radiusHandles.value = []
    }
  } else {
    selectedRect.value = null
    clearSpacingHandleViews()
    radiusHandles.value = []
  }
  if (props.hoveredId) {
    const idx = props.hoveredId.replace('el-', '')
    hoveredRect.value = getElRect(idx)
  } else {
    hoveredRect.value = null
  }
}

watch(() => props.selectedId, updateRects)
watch(() => props.selectedIds, updateRects)
watch(() => props.hoveredId, updateRects)
watch(() => props.componentCode, updateRects)

/** 拖动手柄时元素被卸载，pointerleave 不会触发，需在间距拖拽开始/结束时清掉悬浮态 */
watch(
  () => props.spacingActive,
  () => {
    hoveredPadEdge.value = null
    hoveredGapKey.value = null
  },
)

let rafId = 0
onMounted(() => {
  function tick() {
    updateRects()
    syncSpacingHoverFromPointer()
    rafId = requestAnimationFrame(tick)
  }
  rafId = requestAnimationFrame(tick)
  document.addEventListener('pointerdown', onGridTrackOutsidePointerDown, true)
})
onUnmounted(() => {
  cancelAnimationFrame(rafId)
  document.removeEventListener('pointerdown', onGridTrackOutsidePointerDown, true)
})

const HANDLE = 8
const HALF = HANDLE / 2

const handles = computed(() => {
  const r = selectedRect.value
  if (!r || !props.showResizeHandles) return []
  const { x, y, width: w, height: h } = r
  return [
    { id: 'nw' as HandleId, cx: x, cy: y, cur: 'nw-resize' },
    { id: 'n' as HandleId, cx: x + w / 2, cy: y, cur: 'n-resize' },
    { id: 'ne' as HandleId, cx: x + w, cy: y, cur: 'ne-resize' },
    { id: 'e' as HandleId, cx: x + w, cy: y + h / 2, cur: 'e-resize' },
    { id: 'se' as HandleId, cx: x + w, cy: y + h, cur: 'se-resize' },
    { id: 's' as HandleId, cx: x + w / 2, cy: y + h, cur: 's-resize' },
    { id: 'sw' as HandleId, cx: x, cy: y + h, cur: 'sw-resize' },
    { id: 'w' as HandleId, cx: x, cy: y + h / 2, cur: 'w-resize' },
  ]
})

function onHandlePointerDown(handle: HandleId, e: PointerEvent) {
  e.preventDefault()
  e.stopPropagation()
  emit('resize-start', handle, e)
}

function onGapPointerDown(h: GapHandleView, e: PointerEvent) {
  e.preventDefault()
  e.stopPropagation()
  hoveredGapKey.value = null
  emit('gap-drag-start', h.axis, h.gapIndex, h.x, h.y, e)
}

function gapHandlePosition(h: GapHandleView): { x: number; y: number } {
  const preview = props.gapDragPreview
  if (preview && preview.axis === h.axis && preview.gapIndex === h.gapIndex) {
    return { x: preview.x, y: preview.y }
  }
  return { x: h.x, y: h.y }
}

function onPaddingPointerDown(h: PaddingHandleView, e: PointerEvent) {
  e.preventDefault()
  e.stopPropagation()
  hoveredPadEdge.value = null
  emit('padding-drag-start', h.edge, e)
}

function onRadiusPointerDown(corner: RadiusCornerIndex, e: PointerEvent) {
  e.preventDefault()
  e.stopPropagation()
  emit('radius-drag-start', corner, e)
}

const isGridContainerSelected = computed(() => {
  if (!props.showSpacingHandles) return false
  if (props.resizeActive || props.spacingActive) return false
  if (!props.selectedId || !props.componentCode) return false
  const tagIndex = parseInt(props.selectedId.replace('el-', ''), 10)
  if (!Number.isFinite(tagIndex)) return false
  const attrs = getTagAttrsFromCode(props.componentCode, tagIndex)
  return (attrs.layout ?? 'none') === 'grid'
})

const showGridTrackUi = computed(() => {
  if (!isGridContainerSelected.value) return false
  if (props.gridTrackDragPreview) return false
  if (!props.pointerOverSelected) return false
  return true
})

const spacingChromeVisible = computed(
  () =>
    !!props.pointerOverSelected &&
    !!props.showSpacingHandles &&
    !!selectedRect.value &&
    !props.resizeActive &&
    !props.spacingActive,
)

const resizeChromeVisible = computed(
  () => !!props.pointerOverSelected && !props.resizeActive && !props.spacingActive,
)

const radiusChromeVisible = computed(() => {
  if (!props.showRadiusHandles || !selectedRect.value) return false
  if (props.resizeActive) return false
  if (props.spacingActive && props.spacingDragHint?.kind !== 'radius') return false
  return true
})

const gapHitZones = computed(() =>
  gapHandles.value
    .filter((h) => h.band)
    .map((h) => ({ handle: h, key: gapKey(h), band: h.band! })),
)

function pointInOverlayBand(
  x: number,
  y: number,
  band: { x: number; y: number; width: number; height: number },
): boolean {
  return x >= band.x && x <= band.x + band.width && y >= band.y && y <= band.y + band.height
}

/** 由 overlay 指针坐标判定 padding/gap 排线，避免透明命中层拦截元素拖动 */
function syncSpacingHoverFromPointer() {
  if (props.spacingActive || props.resizeActive || !props.pointerOverSelected || !props.showSpacingHandles) {
    if (!props.spacingActive) {
      hoveredPadEdge.value = null
      hoveredGapKey.value = null
    }
    return
  }

  const pt = props.overlayPointer
  if (!pt) {
    hoveredPadEdge.value = null
    hoveredGapKey.value = null
    return
  }

  let pad: PaddingEdge | null = null
  for (const band of paddingBands.value) {
    if (pointInOverlayBand(pt.x, pt.y, band)) {
      pad = band.edge
      break
    }
  }

  let gap: string | null = null
  for (const zone of gapHitZones.value) {
    if (pointInOverlayBand(pt.x, pt.y, zone.band)) {
      gap = zone.key
      break
    }
  }

  hoveredPadEdge.value = pad
  hoveredGapKey.value = gap
}

const effectiveGridHoverCol = computed(() => {
  const ex = gridTrackExpanded.value
  if (ex?.axis === 'column') return ex.index
  if (gridTrackWrapHoverCol.value !== null) return gridTrackWrapHoverCol.value
  return props.gridTrackHover?.col ?? null
})

const effectiveGridHoverRow = computed(() => {
  const ex = gridTrackExpanded.value
  if (ex?.axis === 'row') return ex.index
  if (gridTrackWrapHoverRow.value !== null) return gridTrackWrapHoverRow.value
  return props.gridTrackHover?.row ?? null
})

const hoveredColCapsule = computed(() => {
  if (effectiveGridHoverCol.value === null) return null
  return gridColumnTracks.value.find((c) => c.index === effectiveGridHoverCol.value) ?? null
})

const hoveredRowCapsule = computed(() => {
  if (effectiveGridHoverRow.value === null) return null
  return gridRowTracks.value.find((c) => c.index === effectiveGridHoverRow.value) ?? null
})

function isGridTrackExpanded(axis: 'column' | 'row', index: number): boolean {
  const ex = gridTrackExpanded.value
  return ex?.axis === axis && ex.index === index
}

function isGridTrackModeMenu(axis: 'column' | 'row', index: number): boolean {
  const m = gridTrackModeMenu.value
  return m?.axis === axis && m.index === index
}

function expandGridTrack(axis: 'column' | 'row', index: number) {
  gridTrackExpanded.value = { axis, index }
  gridTrackModeMenu.value = null
  if (axis === 'column') gridTrackWrapHoverCol.value = index
  else gridTrackWrapHoverRow.value = index
}

function collapseGridTrack() {
  gridTrackExpanded.value = null
  gridTrackModeMenu.value = null
  gridTrackWrapHoverCol.value = null
  gridTrackWrapHoverRow.value = null
}

function onGridTrackWrapEnter(axis: 'column' | 'row', index: number) {
  if (axis === 'column') gridTrackWrapHoverCol.value = index
  else gridTrackWrapHoverRow.value = index
  expandGridTrack(axis, index)
}

function onGridTrackWrapLeave(axis: 'column' | 'row') {
  if (props.gridTrackDragPreview?.axis === axis) return
  if (gridTrackModeMenu.value?.axis === axis) return
  collapseGridTrack()
}

function toggleGridTrackModeMenu(axis: 'column' | 'row', index: number) {
  if (isGridTrackModeMenu(axis, index)) {
    gridTrackModeMenu.value = null
  } else {
    gridTrackModeMenu.value = { axis, index }
  }
}

function onGridTrackDragHandleDown(c: GridTrackCapsuleView, e: PointerEvent) {
  e.preventDefault()
  e.stopPropagation()
  emit('grid-track-drag-start', c.axis, c.index, e)
}

function onGridTrackModePick(c: GridTrackCapsuleView, mode: GridTrackSizeMode) {
  const value =
    mode === 'fixed' || mode === 'fill'
      ? c.state.value || (mode === 'fill' ? 1 : 120)
      : c.state.max ?? c.state.value ?? 400
  emit('grid-track-size-change', c.axis, c.index, mode, value)
  gridTrackModeMenu.value = null
}

function onGridTrackValueInput(c: GridTrackCapsuleView, raw: string) {
  const n = Number(raw)
  if (!Number.isFinite(n)) return
  emit('grid-track-size-change', c.axis, c.index, c.state.mode, n)
}

function onGridTrackOutsidePointerDown(e: PointerEvent) {
  if (!gridTrackExpanded.value && !gridTrackModeMenu.value) return
  const target = e.target as HTMLElement | null
  if (target?.closest('.so__grid-track-wrap')) return
  collapseGridTrack()
}

watch(() => props.selectedId, () => {
  collapseGridTrack()
})

function gapKey(h: GapHandleView): string {
  return `${h.axis}-${h.gapIndex}`
}

function hoveredGapHandle(): GapHandleView | null {
  if (!hoveredGapKey.value) return null
  return gapHandles.value.find((g) => gapKey(g) === hoveredGapKey.value) ?? null
}

const gapBandsToShow = computed((): GapBandRect[] => {
  const hint = props.spacingDragHint
  if (props.spacingActive && hint?.kind === 'gap' && hint.axis) {
    return collectGapBandsForAxis(gapHandles.value, hint.axis)
  }
  const hovered = hoveredGapHandle()
  if (hovered) {
    return collectGapBandsForAxis(gapHandles.value, hovered.axis)
  }
  return []
})

const hoveredGapAxis = computed((): GapAxis | null => hoveredGapHandle()?.axis ?? null)

function paddingBandVisible(band: PaddingBandView): boolean {
  const hint = props.spacingDragHint
  if (props.spacingActive && hint?.kind === 'padding' && hint.edge) {
    return band.edge === hint.edge
  }
  return hoveredPadEdge.value === band.edge
}

function paddingEdgeExpandMode(edge: PaddingEdge): boolean {
  if (edge !== 's' && edge !== 'e') return false
  const hint = props.spacingDragHint
  if (props.spacingActive && hint?.kind === 'padding' && hint.edge === edge && hint.mode) {
    return hint.mode === 'expand'
  }
  return paddingEdgeModes.value[edge] === 'expand'
}

const extremeBandsVisible = computed(
  () => !!props.extremeBands && !!props.resizeActive,
)

function bandFocused(axis: 'width' | 'height', kind: 'min' | 'max'): boolean {
  return props.extremeBandFocus === `${axis}-${kind}`
}

function elasticZoneLabel(kind: ElasticZoneKind): string {
  if (kind === 'hug') return '适应内容'
  if (kind === 'fill') return '占用容器剩余'
  return '固定值'
}
</script>

<template>
  <div class="so">
    <!-- 选中框（overlay 统一绘制，不再依赖元素 outline） -->
    <div
      v-for="frame in selectionFrames"
      :key="frame.id"
      class="so__selected"
      :class="{
        'so__selected--resizing': resizeActive && frame.id === selectedId,
        'so__selected--secondary': frame.id !== selectedId,
      }"
      :style="{
        left: frame.rect.x + 'px',
        top: frame.rect.y + 'px',
        width: frame.rect.width + 'px',
        height: frame.rect.height + 'px',
      }"
    />

    <!-- 弹性尺寸标尺气泡（固定三区，指针随拖动移动） -->
    <template v-if="resizeActive && elasticSnapGuides?.width">
      <div
        class="so__elastic-bubble"
        :style="{
          left: elasticSnapGuides.width.bubbleX + 'px',
          top: elasticSnapGuides.width.bubbleY + 'px',
        }"
      >
        <div class="so__elastic-bubble-head">
          宽 {{ elasticSnapGuides.width.dragSize }}px
          · {{ elasticZoneLabel(elasticSnapGuides.width.activeKind) }}
        </div>
        <div class="so__elastic-ruler">
          <div
            v-for="z in elasticSnapGuides.width.zones"
            :key="'wzone-' + z.kind"
            class="so__elastic-zone"
            :class="[
              `so__elastic-zone--${z.kind}`,
              { 'so__elastic-zone--active': elasticSnapGuides.width.activeKind === z.kind },
            ]"
            :style="{
              left: z.start * 100 + '%',
              width: (z.end - z.start) * 100 + '%',
            }"
          >
            <span v-if="z.end - z.start >= 0.14" class="so__elastic-zone-label">{{ z.label }}</span>
          </div>
          <div
            class="so__elastic-marker"
            :style="{ left: `calc(${elasticSnapGuides.width.markerRatio * 100}% - 1px)` }"
          />
        </div>
      </div>
    </template>
    <template v-if="resizeActive && elasticSnapGuides?.height">
      <div
        class="so__elastic-bubble"
        :style="{
          left: elasticSnapGuides.height.bubbleX + 'px',
          top: elasticSnapGuides.height.bubbleY + 'px',
        }"
      >
        <div class="so__elastic-bubble-head">
          高 {{ elasticSnapGuides.height.dragSize }}px
          · {{ elasticZoneLabel(elasticSnapGuides.height.activeKind) }}
        </div>
        <div class="so__elastic-ruler">
          <div
            v-for="z in elasticSnapGuides.height.zones"
            :key="'hzone-' + z.kind"
            class="so__elastic-zone"
            :class="[
              `so__elastic-zone--${z.kind}`,
              { 'so__elastic-zone--active': elasticSnapGuides.height.activeKind === z.kind },
            ]"
            :style="{
              left: z.start * 100 + '%',
              width: (z.end - z.start) * 100 + '%',
            }"
          >
            <span v-if="z.end - z.start >= 0.14" class="so__elastic-zone-label">{{ z.label }}</span>
          </div>
          <div
            class="so__elastic-marker"
            :style="{ left: `calc(${elasticSnapGuides.height.markerRatio * 100}% - 1px)` }"
          />
        </div>
      </div>
    </template>

    <!-- 极值带：宽轴 -->
    <template v-if="extremeBandsVisible && extremeBands?.width">
      <div
        v-if="extremeBands.width.minBand"
        class="so__band so__band--min"
        :class="{ 'so__band--focused': bandFocused('width', 'min') }"
        :style="{
          left: extremeBands.width.minBand.x + 'px',
          top: extremeBands.width.minBand.y + 'px',
          width: extremeBands.width.minBand.width + 'px',
          height: extremeBands.width.minBand.height + 'px',
        }"
      />
      <div
        v-if="extremeBands.width.maxBand"
        class="so__band so__band--max"
        :class="{ 'so__band--focused': bandFocused('width', 'max') }"
        :style="{
          left: extremeBands.width.maxBand.x + 'px',
          top: extremeBands.width.maxBand.y + 'px',
          width: extremeBands.width.maxBand.width + 'px',
          height: extremeBands.width.maxBand.height + 'px',
        }"
      />
      <div
        v-if="extremeBands.width.validRect"
        class="so__band-valid"
        :style="{
          left: extremeBands.width.validRect.x + 'px',
          top: extremeBands.width.validRect.y + 'px',
          width: extremeBands.width.validRect.width + 'px',
          height: extremeBands.width.validRect.height + 'px',
        }"
      />
    </template>

    <!-- 极值带：高轴 -->
    <template v-if="extremeBandsVisible && extremeBands?.height">
      <div
        v-if="extremeBands.height.minBand"
        class="so__band so__band--min"
        :class="{ 'so__band--focused': bandFocused('height', 'min') }"
        :style="{
          left: extremeBands.height.minBand.x + 'px',
          top: extremeBands.height.minBand.y + 'px',
          width: extremeBands.height.minBand.width + 'px',
          height: extremeBands.height.minBand.height + 'px',
        }"
      />
      <div
        v-if="extremeBands.height.maxBand"
        class="so__band so__band--max"
        :class="{ 'so__band--focused': bandFocused('height', 'max') }"
        :style="{
          left: extremeBands.height.maxBand.x + 'px',
          top: extremeBands.height.maxBand.y + 'px',
          width: extremeBands.height.maxBand.width + 'px',
          height: extremeBands.height.maxBand.height + 'px',
        }"
      />
      <div
        v-if="extremeBands.height.validRect"
        class="so__band-valid"
        :style="{
          left: extremeBands.height.validRect.x + 'px',
          top: extremeBands.height.validRect.y + 'px',
          width: extremeBands.height.validRect.width + 'px',
          height: extremeBands.height.validRect.height + 'px',
        }"
      />
    </template>

    <!-- 框选矩形 -->
    <div
      v-if="marqueeRect"
      class="so__marquee"
      :style="{
        left: marqueeRect.x + 'px',
        top: marqueeRect.y + 'px',
        width: marqueeRect.width + 'px',
        height: marqueeRect.height + 'px',
      }"
    />

    <!-- 缩放 / 间距模式提示 -->
    <div
      v-if="resizeTooltip && !elasticSnapGuides"
      class="so__resize-tip"
      :style="{ left: resizeTooltip.x + 'px', top: resizeTooltip.y + 'px' }"
    >
      {{ resizeTooltip.text }}
    </div>
    <div
      v-if="spacingTooltip"
      class="so__resize-tip"
      :class="{
        'so__resize-tip--padding': spacingTooltip.kind === 'padding',
        'so__resize-tip--gap': spacingTooltip.kind === 'gap',
        'so__resize-tip--radius': spacingTooltip.kind === 'radius',
      }"
      :style="{ left: spacingTooltip.x + 'px', top: spacingTooltip.y + 'px' }"
    >
      {{ spacingTooltip.text }}
    </div>

    <!-- grid 轨道排序预览 -->
    <div
      v-if="gridTrackDragPreview"
      class="so__grid-track-highlight"
      :style="{
        left: gridTrackDragPreview.bandX + 'px',
        top: gridTrackDragPreview.bandY + 'px',
        width: gridTrackDragPreview.bandWidth + 'px',
        height: gridTrackDragPreview.bandHeight + 'px',
      }"
    />

    <!-- 元素拖入 grid 单元格预览 -->
    <div
      v-if="gridElementDropPreview"
      class="so__grid-cell-drop-preview"
      :style="{
        left: gridElementDropPreview.bandX + 'px',
        top: gridElementDropPreview.bandY + 'px',
        width: gridElementDropPreview.bandWidth + 'px',
        height: gridElementDropPreview.bandHeight + 'px',
      }"
    />

    <template v-if="showGridTrackUi">
      <!-- 悬浮轨道区：淡蓝高亮 -->
      <div
        v-for="c in gridColumnTracks"
        v-show="effectiveGridHoverCol === c.index && !isGridTrackExpanded('column', c.index)"
        :key="'gcol-hover-' + c.index"
        class="so__grid-band-hint so__grid-band-hint--col"
        :style="{
          left: c.bandX + 'px',
          top: c.bandY + 'px',
          width: c.bandWidth + 'px',
          height: c.bandHeight + 'px',
        }"
      />
      <div
        v-for="c in gridRowTracks"
        v-show="effectiveGridHoverRow === c.index && !isGridTrackExpanded('row', c.index)"
        :key="'grow-hover-' + c.index"
        class="so__grid-band-hint so__grid-band-hint--row"
        :style="{
          left: c.bandX + 'px',
          top: c.bandY + 'px',
          width: c.bandWidth + 'px',
          height: c.bandHeight + 'px',
        }"
      />

      <!-- 展开复合控件后：整列/整行轨道标注 -->
      <div
        v-for="c in gridColumnTracks"
        v-show="isGridTrackExpanded('column', c.index)"
        :key="'gcol-band-' + c.index"
        class="so__grid-track-band so__grid-track-band--col so__grid-track-band--active"
        :style="{
          left: c.bandX + 'px',
          top: c.bandY + 'px',
          width: c.bandWidth + 'px',
          height: c.bandHeight + 'px',
        }"
      />
      <div
        v-for="c in gridRowTracks"
        v-show="isGridTrackExpanded('row', c.index)"
        :key="'grow-band-' + c.index"
        class="so__grid-track-band so__grid-track-band--row so__grid-track-band--active"
        :style="{
          left: c.bandX + 'px',
          top: c.bandY + 'px',
          width: c.bandWidth + 'px',
          height: c.bandHeight + 'px',
        }"
      />

      <div
        v-if="hoveredColCapsule"
        class="so__grid-track-wrap so__grid-track-wrap--col"
        :style="{ left: hoveredColCapsule.x + 'px', top: hoveredColCapsule.y + 'px' }"
        @pointerdown.stop
        @pointerenter="onGridTrackWrapEnter('column', hoveredColCapsule.index)"
        @pointerleave="onGridTrackWrapLeave('column')"
      >
        <div
          v-if="!isGridTrackExpanded('column', hoveredColCapsule.index)"
          class="so__grid-track-hint"
        >
          列 {{ hoveredColCapsule.index + 1 }}
        </div>
        <div
          v-else
          class="so__grid-track-composite"
        >
          <div
            class="so__grid-track-grab so__grid-track-grab--col"
            title="拖动排序"
            @pointerdown="onGridTrackDragHandleDown(hoveredColCapsule, $event)"
          >
            Ⅲ
          </div>
          <input
            v-if="hoveredColCapsule.state.mode !== 'hug'"
            class="so__grid-track-value"
            type="number"
            min="0"
            :step="hoveredColCapsule.state.mode === 'fill' ? 0.1 : 1"
            :value="hoveredColCapsule.state.value"
            @change="onGridTrackValueInput(hoveredColCapsule, ($event.target as HTMLInputElement).value)"
          />
          <button
            type="button"
            class="so__grid-track-mode-btn"
            @click.stop="toggleGridTrackModeMenu('column', hoveredColCapsule.index)"
          >
            {{ gridTrackModeLabel(hoveredColCapsule.state.mode) }} ▾
          </button>
          <div
            v-if="isGridTrackModeMenu('column', hoveredColCapsule.index)"
            class="so__grid-track-mode-menu"
          >
            <button
              v-for="m in GRID_TRACK_SIZE_MODES"
              :key="'cm-' + m"
              type="button"
              class="so__grid-track-mode-item"
              :class="{ 'so__grid-track-mode-item--active': hoveredColCapsule.state.mode === m }"
              @click="onGridTrackModePick(hoveredColCapsule, m)"
            >
              {{ gridTrackModeLabel(m) }}
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="hoveredRowCapsule"
        class="so__grid-track-wrap so__grid-track-wrap--row"
        :style="{ left: hoveredRowCapsule.x + 'px', top: hoveredRowCapsule.y + 'px' }"
        @pointerdown.stop
        @pointerenter="onGridTrackWrapEnter('row', hoveredRowCapsule.index)"
        @pointerleave="onGridTrackWrapLeave('row')"
      >
        <div
          v-if="!isGridTrackExpanded('row', hoveredRowCapsule.index)"
          class="so__grid-track-hint"
        >
          行 {{ hoveredRowCapsule.index + 1 }}
        </div>
        <div
          v-else
          class="so__grid-track-composite"
        >
          <div
            class="so__grid-track-grab so__grid-track-grab--row"
            title="拖动排序"
            @pointerdown="onGridTrackDragHandleDown(hoveredRowCapsule, $event)"
          >
            ≡
          </div>
          <input
            v-if="hoveredRowCapsule.state.mode !== 'hug'"
            class="so__grid-track-value"
            type="number"
            min="0"
            :step="hoveredRowCapsule.state.mode === 'fill' ? 0.1 : 1"
            :value="hoveredRowCapsule.state.value"
            @change="onGridTrackValueInput(hoveredRowCapsule, ($event.target as HTMLInputElement).value)"
          />
          <button
            type="button"
            class="so__grid-track-mode-btn"
            @click.stop="toggleGridTrackModeMenu('row', hoveredRowCapsule.index)"
          >
            {{ gridTrackModeLabel(hoveredRowCapsule.state.mode) }} ▾
          </button>
          <div
            v-if="isGridTrackModeMenu('row', hoveredRowCapsule.index)"
            class="so__grid-track-mode-menu"
          >
            <button
              v-for="m in GRID_TRACK_SIZE_MODES"
              :key="'rm-' + m"
              type="button"
              class="so__grid-track-mode-item"
              :class="{ 'so__grid-track-mode-item--active': hoveredRowCapsule.state.mode === m }"
              @click="onGridTrackModePick(hoveredRowCapsule, m)"
            >
              {{ gridTrackModeLabel(m) }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- 悬浮 / 拖拽：padding / gap 影响范围排线 -->
    <div
      v-for="band in paddingBands"
      v-show="paddingBandVisible(band)"
      :key="'pad-band-' + band.edge"
      class="so__hatch so__hatch--padding"
      :class="{ 'so__hatch--padding-expand': paddingEdgeExpandMode(band.edge) }"
      :style="{
        left: band.x + 'px',
        top: band.y + 'px',
        width: band.width + 'px',
        height: band.height + 'px',
      }"
    />
    <div
      v-for="(band, i) in gapBandsToShow"
      :key="'gap-band-' + i + '-' + band.x + '-' + band.y"
      class="so__hatch so__hatch--gap"
      :style="{
        left: band.x + 'px',
        top: band.y + 'px',
        width: band.width + 'px',
        height: band.height + 'px',
      }"
    />

    <!-- padding 内边距手柄 -->
    <template v-if="spacingChromeVisible">
      <div
        v-for="(ph, i) in paddingHandles"
        :key="'pad-' + ph.edge + i"
        class="so__pad-handle"
        :class="[
          `so__pad-handle--${ph.edge}`,
          {
            'so__pad-handle--hover': hoveredPadEdge === ph.edge,
            'so__pad-handle--expand': paddingEdgeExpandMode(ph.edge),
          },
        ]"
        :style="{ left: ph.x + 'px', top: ph.y + 'px', cursor: ph.cursor }"
        @pointerdown="onPaddingPointerDown(ph, $event)"
      />
    </template>

    <!-- gap 间距手柄 -->
    <template v-if="spacingChromeVisible && showGapHandles">
      <div
        v-for="gh in gapHandles"
        :key="'gap-' + gh.axis + gh.gapIndex"
        class="so__gap-handle"
        :class="[
          gh.axis === 'column' ? 'so__gap-handle--col' : 'so__gap-handle--row',
          { 'so__gap-handle--hover': hoveredGapAxis === gh.axis },
        ]"
        :style="{
          left: gapHandlePosition(gh).x + 'px',
          top: gapHandlePosition(gh).y + 'px',
          cursor: gh.cursor,
        }"
        @pointerdown="onGapPointerDown(gh, $event)"
      />
    </template>

    <!-- 四角圆角手柄（圆角工具 + 选中 LayoutContainer） -->
    <template v-if="radiusChromeVisible && radiusHandles.length">
      <div
        v-for="rh in radiusHandles"
        :key="'radius-' + rh.corner"
        class="so__radius-handle"
        :class="[
          'so__radius-handle--' + ['tl', 'tr', 'br', 'bl'][rh.corner],
          { 'so__radius-handle--active': spacingActive && spacingDragHint?.kind === 'radius' },
        ]"
        :style="{ left: rh.x + 'px', top: rh.y + 'px' }"
        @pointerdown="onRadiusPointerDown(rh.corner, $event)"
      />
    </template>

    <!-- 缩放手柄 -->
    <template v-if="resizeChromeVisible">
      <div
        v-for="h in handles"
        :key="h.id"
        class="so__handle"
        :style="{
          left: (h.cx - HALF) + 'px',
          top: (h.cy - HALF) + 'px',
          width: HANDLE + 'px',
          height: HANDLE + 'px',
          cursor: h.cur,
        }"
        @pointerdown="onHandlePointerDown(h.id, $event)"
      />
    </template>
  </div>
</template>

<style scoped>
.so {
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;
}

.so__selected {
  position: absolute;
  pointer-events: none;
  box-sizing: border-box;
  outline: 1px solid #409eff;
  outline-offset: 0;
  border-radius: 0;
}

.so__selected--secondary {
  outline-color: rgba(64, 158, 255, 0.55);
}

.so__selected--resizing {
  outline-color: #7c3aed;
}

.so__marquee {
  position: absolute;
  background: rgba(64, 158, 255, 0.08);
  border: 1px solid #409eff;
  pointer-events: none;
}

.so__band {
  position: absolute;
  pointer-events: none;
  z-index: 9;
  border-radius: 2px;
  opacity: 0.72;
}

.so__band--focused {
  opacity: 1;
  z-index: 10;
}

.so__band--min.so__band--focused {
  outline-width: 2px;
  outline-style: solid;
}

.so__band--max.so__band--focused {
  outline-width: 2px;
  outline-style: solid;
}

.so__band--min {
  background: rgba(167, 139, 250, 0.28);
  outline: 1px dashed rgba(124, 58, 237, 0.45);
}

.so__band--max {
  background: rgba(134, 239, 172, 0.28);
  outline: 1px dashed rgba(22, 163, 74, 0.45);
}

.so__band-valid {
  position: absolute;
  pointer-events: none;
  z-index: 8;
  background: rgba(64, 158, 255, 0.04);
  outline: 1px solid rgba(64, 158, 255, 0.15);
  border-radius: 2px;
}

.so__band-valid--preview {
  background: rgba(64, 158, 255, 0.06);
  outline-color: rgba(64, 158, 255, 0.28);
}

.so__elastic-bubble {
  position: absolute;
  pointer-events: none;
  z-index: 14;
  min-width: 220px;
  padding: 8px 10px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(124, 58, 237, 0.35);
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.12);
  transform: translate(-50%, 0);
}

.so__elastic-bubble-head {
  margin-bottom: 6px;
  font-size: 11px;
  font-weight: 500;
  color: rgba(15, 23, 42, 0.82);
  white-space: nowrap;
}

.so__elastic-ruler {
  position: relative;
  width: 220px;
  height: 14px;
  border-radius: 4px;
  overflow: hidden;
  outline: 1px solid rgba(100, 116, 139, 0.35);
  background: rgba(148, 163, 184, 0.1);
}

.so__elastic-zone {
  position: absolute;
  top: 0;
  bottom: 0;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid rgba(255, 255, 255, 0.45);
  opacity: 0.88;
}

.so__elastic-zone--hug {
  background: rgba(245, 158, 11, 0.28);
}

.so__elastic-zone--fixed {
  background: rgba(100, 116, 139, 0.22);
}

.so__elastic-zone--fill {
  background: rgba(16, 185, 129, 0.28);
  border-right: none;
}

.so__elastic-zone--active {
  opacity: 1;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.95);
}

.so__elastic-zone-label {
  font-size: 9px;
  line-height: 1;
  color: rgba(15, 23, 42, 0.72);
  white-space: nowrap;
  pointer-events: none;
}

.so__elastic-marker {
  position: absolute;
  top: -2px;
  bottom: -2px;
  width: 2px;
  background: #7c3aed;
  box-shadow: 0 0 0 1px #fff;
  z-index: 2;
}

.so__resize-tip {
  position: absolute;
  z-index: 20;
  pointer-events: none;
  padding: 4px 8px;
  font-size: 12px;
  line-height: 1.4;
  color: #fff;
  background: rgba(30, 30, 30, 0.88);
  border-radius: 4px;
  white-space: nowrap;
  /* 锚点在指针位置，略偏右下移避免遮挡光标 */
  transform: translate(calc(-50% + 28px), 36px);
}

.so__resize-tip--padding {
  background: rgba(37, 99, 235, 0.92);
}

.so__resize-tip--gap {
  background: rgba(190, 24, 93, 0.92);
}

.so__resize-tip--radius {
  background: rgba(5, 150, 105, 0.92);
}

.so__grid-cell {
  position: absolute;
  pointer-events: none;
  z-index: 8;
  box-sizing: border-box;
  border: 1px dashed rgba(96, 165, 250, 0.55);
  background: rgba(96, 165, 250, 0.06);
  border-radius: 2px;
}

.so__grid-track-band {
  position: absolute;
  pointer-events: none;
  z-index: 7;
  box-sizing: border-box;
  border: 1px dashed rgba(96, 165, 250, 0.28);
  background: rgba(96, 165, 250, 0.04);
  border-radius: 2px;
}

.so__grid-track-band--active {
  border-color: rgba(59, 130, 246, 0.65);
  background: rgba(59, 130, 246, 0.1);
  z-index: 9;
}

.so__grid-track-highlight {
  position: absolute;
  pointer-events: none;
  z-index: 11;
  box-sizing: border-box;
  border: 2px solid rgba(124, 58, 237, 0.75);
  background: rgba(124, 58, 237, 0.08);
  border-radius: 3px;
}

.so__grid-cell-drop-preview {
  position: absolute;
  pointer-events: none;
  z-index: 11;
  box-sizing: border-box;
  border: 2px solid rgba(64, 158, 255, 0.75);
  background: rgba(64, 158, 255, 0.12);
  border-radius: 4px;
}

.so__grid-band-hint {
  position: absolute;
  pointer-events: none;
  z-index: 10;
  box-sizing: border-box;
  border: 1px dashed rgba(59, 130, 246, 0.55);
  background: rgba(59, 130, 246, 0.1);
  border-radius: 2px;
}

.so__grid-track-wrap {
  position: absolute;
  z-index: 13;
  pointer-events: auto;
}

.so__grid-track-wrap--col {
  transform: translate(-50%, -100%);
}

.so__grid-track-wrap--row {
  transform: translate(-100%, -50%);
}

.so__grid-track-hint {
  padding: 2px 10px;
  font-size: 10px;
  line-height: 16px;
  font-weight: 500;
  color: rgba(15, 23, 42, 0.78);
  white-space: nowrap;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(59, 130, 246, 0.4);
  border-radius: 999px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
  cursor: pointer;
  pointer-events: auto;
}

.so__grid-track-composite {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(124, 58, 237, 0.45);
  border-radius: 999px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.12);
}

.so__grid-track-grab {
  width: 16px;
  height: 18px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  border-radius: 4px;
  font-size: 13px;
  line-height: 1;
  font-weight: 600;
  color: rgba(51, 65, 85, 0.85);
  user-select: none;
  touch-action: none;
}

.so__grid-track-grab--col {
  letter-spacing: -0.08em;
}

.so__grid-track-grab--row {
  font-size: 15px;
  font-weight: 500;
}

.so__grid-track-grab:active {
  cursor: grabbing;
}

.so__grid-track-value {
  width: 48px;
  font-size: 11px;
  padding: 2px 4px;
  border: 1px solid rgba(100, 116, 139, 0.35);
  border-radius: 4px;
}

.so__grid-track-mode-btn {
  font-size: 10px;
  padding: 2px 6px;
  border: 1px solid rgba(100, 116, 139, 0.35);
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  white-space: nowrap;
}

.so__grid-track-mode-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 50%;
  transform: translateX(-50%);
  min-width: 72px;
  padding: 4px;
  background: #fff;
  border: 1px solid rgba(100, 116, 139, 0.35);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
  z-index: 16;
}

.so__grid-track-wrap--row .so__grid-track-mode-menu {
  top: 50%;
  left: calc(100% + 4px);
  transform: translateY(-50%);
}

.so__grid-track-mode-item {
  display: block;
  width: 100%;
  padding: 4px 8px;
  font-size: 11px;
  text-align: left;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
}

.so__grid-track-mode-item:hover,
.so__grid-track-mode-item--active {
  background: rgba(124, 58, 237, 0.1);
  color: rgba(91, 33, 182, 1);
}

.so__grid-track-composite {
  position: relative;
}

.so__hatch {
  position: absolute;
  pointer-events: none;
  z-index: 9;
  border-radius: 2px;
}

.so__hatch--padding {
  background: repeating-linear-gradient(
    -45deg,
    rgba(64, 158, 255, 0.12),
    rgba(64, 158, 255, 0.12) 4px,
    rgba(64, 158, 255, 0.28) 4px,
    rgba(64, 158, 255, 0.28) 8px
  );
  outline: 1px solid rgba(64, 158, 255, 0.45);
}

.so__hatch--padding-expand {
  background: repeating-linear-gradient(
    -45deg,
    rgba(245, 158, 11, 0.12),
    rgba(245, 158, 11, 0.12) 4px,
    rgba(245, 158, 11, 0.28) 4px,
    rgba(245, 158, 11, 0.28) 8px
  );
  outline: 1px solid rgba(245, 158, 11, 0.55);
}

.so__hatch--gap {
  background: repeating-linear-gradient(
    -45deg,
    rgba(236, 72, 153, 0.12),
    rgba(236, 72, 153, 0.12) 4px,
    rgba(236, 72, 153, 0.28) 4px,
    rgba(236, 72, 153, 0.28) 8px
  );
  outline: 1px solid rgba(236, 72, 153, 0.45);
}

.so__handle {
  position: absolute;
  background: #fff;
  border: 2px solid #409eff;
  border-radius: 2px;
  box-sizing: border-box;
  pointer-events: auto;
  z-index: 12;
}

.so__selected--resizing ~ .so__handle {
  border-color: #7c3aed;
}

.so__pad-handle {
  position: absolute;
  width: 28px;
  height: 4px;
  margin-left: -14px;
  margin-top: -2px;
  background: rgba(64, 158, 255, 0.85);
  border-radius: 2px;
  pointer-events: auto;
  z-index: 11;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.9);
}

.so__pad-handle--e,
.so__pad-handle--w {
  width: 4px;
  height: 28px;
  margin-left: -2px;
  margin-top: -14px;
}

.so__gap-handle {
  position: absolute;
  width: 28px;
  height: 4px;
  margin-left: -14px;
  margin-top: -2px;
  background: rgba(236, 72, 153, 0.85);
  border-radius: 2px;
  pointer-events: auto;
  z-index: 11;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.9);
}

.so__gap-handle--col {
  width: 4px;
  height: 28px;
  margin-left: -2px;
  margin-top: -14px;
}

.so__pad-handle--hover {
  background: rgba(37, 99, 235, 1);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.35);
}

.so__pad-handle--expand {
  background: rgba(245, 158, 11, 0.92);
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.45);
}

.so__pad-handle--expand.so__pad-handle--hover {
  background: rgba(217, 119, 6, 1);
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.55);
}

.so__pad-handle--expand.so__pad-handle--s::after,
.so__pad-handle--expand.so__pad-handle--e::after {
  content: '';
  position: absolute;
  pointer-events: none;
  border: 4px solid transparent;
}

.so__pad-handle--expand.so__pad-handle--s::after {
  left: 50%;
  top: calc(100% + 3px);
  transform: translateX(-50%);
  border-top-color: rgba(217, 119, 6, 0.95);
}

.so__pad-handle--expand.so__pad-handle--e::after {
  left: calc(100% + 3px);
  top: 50%;
  transform: translateY(-50%);
  border-left-color: rgba(217, 119, 6, 0.95);
}

.so__gap-handle--row {
  width: 28px;
  height: 4px;
  margin-left: -14px;
  margin-top: -2px;
}

.so__gap-handle--hover {
  background: rgba(219, 39, 119, 1);
  box-shadow: 0 0 0 2px rgba(236, 72, 153, 0.35);
}

.so__radius-handle {
  position: absolute;
  width: 12px;
  height: 12px;
  margin-left: -6px;
  margin-top: -6px;
  border: 2px solid #10b981;
  border-radius: 50%;
  background: #fff;
  pointer-events: auto;
  z-index: 11;
  cursor: nwse-resize;
}

.so__radius-handle--active {
  border-color: #7c3aed;
  background: #f5f3ff;
}
</style>
