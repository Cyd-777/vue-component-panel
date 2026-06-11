/**
 * Grid 轨道：列/行胶囊位置、模板解析、排序交换与尺寸补丁。
 */
import { getTagAttrsFromCode, parseInlineStyle, parseNumericAttr, patchChildGridPlacement, patchChildClearGridPlacement, type AttrEntry } from './attrPatch'
import { findTagIndexAtLine, findTagLineInSource } from './tagIndex'
import { getDirectChildTagIndices, reorderDirectChildren } from './sourceManip'
import { clearChildPositionStyles } from './positionLogic'

export type GridTrackSizeMode = 'hug' | 'fill' | 'fixed' | 'minmax'

export interface GridTrackState {
  mode: GridTrackSizeMode
  value: number
  min?: number
  max?: number
}

/** @deprecated 内部兼容别名 */
export type GridTrackKind = 'fr' | 'px' | 'auto'

export interface GridTrackToken {
  kind: GridTrackKind
  value: number
}

export interface GridTrackCapsuleView {
  axis: 'column' | 'row'
  index: number
  x: number
  y: number
  bandX: number
  bandY: number
  bandWidth: number
  bandHeight: number
  state: GridTrackState
}

export interface GridTrackDragPreview {
  axis: 'column' | 'row'
  fromIndex: number
  toIndex: number
  bandX: number
  bandY: number
  bandWidth: number
  bandHeight: number
}

export const GRID_TRACK_SIZE_MODES: GridTrackSizeMode[] = ['hug', 'fill', 'fixed', 'minmax']

export function gridTrackModeLabel(mode: GridTrackSizeMode): string {
  if (mode === 'hug') return '适应'
  if (mode === 'fill') return '填充'
  if (mode === 'fixed') return '固定'
  return 'minmax'
}

export function gridTrackStateSummary(state: GridTrackState): string {
  if (state.mode === 'hug') return '适应'
  if (state.mode === 'fill') return state.value === 1 ? '1fr' : `${state.value}fr`
  if (state.mode === 'fixed') return `${Math.round(state.value)}px`
  const min = state.min ?? 80
  const max = state.max ?? 400
  return `minmax(${min}, ${max})`
}

export function parseGridTrackCss(raw: string): GridTrackState {
  const t = raw.trim()
  if (!t) return { mode: 'fill', value: 1 }
  if (t === 'auto' || t === 'min-content' || t === 'max-content') {
    return { mode: 'hug', value: 0 }
  }
  const minmax = t.match(/^minmax\(\s*([^,]+)\s*,\s*([^)]+)\s*\)$/i)
  if (minmax) {
    const minRaw = minmax[1].trim()
    const maxRaw = minmax[2].trim()
    const minPx = parsePx(minRaw) ?? 80
    const maxPx = parsePx(maxRaw) ?? parseFr(maxRaw) ?? 400
    return { mode: 'minmax', value: maxPx, min: minPx, max: maxPx }
  }
  const fr = t.match(/^(\d+(?:\.\d+)?)fr$/)
  if (fr) return { mode: 'fill', value: Math.max(0.1, Number(fr[1])) }
  const px = parsePx(t)
  if (px !== null) return { mode: 'fixed', value: px }
  return { mode: 'fill', value: 1 }
}

function parsePx(raw: string): number | null {
  const m = raw.match(/^(\d+(?:\.\d+)?)px$/)
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? Math.max(0, n) : null
}

function parseFr(raw: string): number | null {
  const m = raw.match(/^(\d+(?:\.\d+)?)fr$/)
  if (!m) return null
  return Math.max(0.1, Number(m[1]))
}

export function formatGridTrackCss(state: GridTrackState): string {
  if (state.mode === 'hug') return 'auto'
  if (state.mode === 'fill') {
    const v = state.value === 1 ? 1 : Math.max(0.1, state.value)
    return v === 1 ? '1fr' : `${v}fr`
  }
  if (state.mode === 'fixed') {
    return `${Math.max(0, Math.round(state.value))}px`
  }
  const min = Math.max(0, Math.round(state.min ?? 80))
  const max = Math.max(min, Math.round(state.max ?? state.value ?? 400))
  return `minmax(${min}px, ${max}px)`
}

export function parseGridTemplateStates(raw: string | undefined, fallbackCount: number): GridTrackState[] {
  if (!raw?.trim()) {
    return Array.from({ length: Math.max(1, fallbackCount) }, () => ({
      mode: 'fill' as const,
      value: 1,
    }))
  }
  const trimmed = raw.trim()
  const repeat = trimmed.match(/^repeat\(\s*(\d+)\s*,\s*(.+)\)$/i)
  if (repeat) {
    const count = Math.max(1, parseInt(repeat[1], 10))
    const state = parseGridTrackCss(repeat[2])
    return Array.from({ length: count }, () => ({ ...state }))
  }
  return trimmed.split(/\s+/).filter(Boolean).map(parseGridTrackCss)
}

export function formatGridTemplateStates(states: GridTrackState[]): string {
  if (states.length === 0) return '1fr'
  const allSame =
    states.length > 1 &&
    states.every(
      (s) =>
        s.mode === states[0].mode &&
        s.value === states[0].value &&
        s.min === states[0].min &&
        s.max === states[0].max,
    )
  if (allSame && states[0].mode === 'fill' && states[0].value === 1) {
    return `repeat(${states.length}, 1fr)`
  }
  return states.map(formatGridTrackCss).join(' ')
}

export function getGridTracksFromCode(
  code: string,
  tagIndex: number,
): { columns: GridTrackState[]; rows: GridTrackState[] } {
  const attrs = getTagAttrsFromCode(code, tagIndex)
  const cols = Math.max(1, parseNumericAttr(attrs, 'cols') ?? 3)
  const rowsCount = parseNumericAttr(attrs, 'rows') ?? 0
  const columns = parseGridTemplateStates(attrs['grid-template-columns'], cols)
  const rows =
    rowsCount > 0
      ? parseGridTemplateStates(attrs['grid-template-rows'], rowsCount)
      : []
  return { columns, rows }
}

export function buildGridTrackPatch(
  axis: 'column' | 'row',
  states: GridTrackState[],
): Record<string, AttrEntry> {
  const key = axis === 'column' ? 'grid-template-columns' : 'grid-template-rows'
  return {
    [key]: { value: formatGridTemplateStates(states), dynamic: false },
  }
}

export function swapGridTracks<T>(states: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= states.length || to >= states.length) {
    return states
  }
  const next = [...states]
  ;[next[from], next[to]] = [next[to], next[from]]
  return next
}

export function parseGridLineNumber(value: string): number | null {
  if (!value || value === 'auto') return null
  const m = value.match(/^(\d+)/)
  if (!m) return null
  const n = parseInt(m[1], 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

function flatAutoPlacement(flatIndex: number, colCount: number): { col: number; row: number } {
  const cols = Math.max(1, colCount)
  return {
    col: (flatIndex % cols) + 1,
    row: Math.floor(flatIndex / cols) + 1,
  }
}

function placementFromCode(
  code: string,
  tagIndex: number,
  flatIndex: number,
  colCount: number,
): { col: number; row: number } {
  const attrs = getTagAttrsFromCode(code, tagIndex)
  const styles = parseInlineStyle(attrs.style ?? '')
  const auto = flatAutoPlacement(flatIndex, colCount)
  return {
    col:
      parseGridLineNumber(attrs['grid-column'] ?? '')
      ?? parseGridLineNumber(styles['grid-column'] ?? '')
      ?? auto.col,
    row:
      parseGridLineNumber(attrs['grid-row'] ?? '')
      ?? parseGridLineNumber(styles['grid-row'] ?? '')
      ?? auto.row,
  }
}

/** 推断网格矩阵行数（模板行 / 子项显式 grid-row / auto-placement） */
export function inferGridMatrixRowCount(
  code: string,
  childTagIndices: number[],
  colCount: number,
  templateRowCount: number,
): number {
  const cols = Math.max(1, colCount)
  let maxRow = Math.max(1, templateRowCount, Math.ceil(childTagIndices.length / cols))
  for (let j = 0; j < childTagIndices.length; j++) {
    const { row } = placementFromCode(code, childTagIndices[j], j, cols)
    maxRow = Math.max(maxRow, row)
  }
  return maxRow
}

/** 从源码 style 构建占位矩阵（commit 用，不依赖预览 DOM） */
export function buildGridPlacementMatrixFromCode(
  code: string,
  childTagIndices: number[],
  colCount: number,
  rowCount: number,
  skipFlatIndices: number[] = [],
): (number | null)[][] {
  const cols = Math.max(1, colCount)
  const rows = Math.max(1, rowCount)
  const skip = new Set(skipFlatIndices)
  const matrix: (number | null)[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null),
  )

  for (let j = 0; j < childTagIndices.length; j++) {
    if (skip.has(j)) continue
    const { col, row } = placementFromCode(code, childTagIndices[j], j, cols)
    const c0 = col - 1
    const r0 = row - 1
    if (r0 >= 0 && r0 < rows && c0 >= 0 && c0 < cols) {
      matrix[r0][c0] = j
    }
  }
  return matrix
}

function findCellOfFlat(
  matrix: (number | null)[][],
  flatIndex: number,
): { row: number; col: number } | null {
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c] === flatIndex) return { row: r, col: c }
    }
  }
  return null
}

/** 当前子项在网格中的占位矩阵（matrix[row][col] = 子项 flat 下标，null 为空格） */
export function buildGridPlacementMatrix(
  containerEl: HTMLElement | null,
  childTagIndices: number[],
  colCount: number,
  rowCount: number,
): (number | null)[][] {
  const cols = Math.max(1, colCount)
  const rows = Math.max(1, rowCount)
  const childCount = childTagIndices.length
  const matrix: (number | null)[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null),
  )

  for (let j = 0; j < childCount; j++) {
    let col1 = (j % cols) + 1
    let row1 = Math.floor(j / cols) + 1
    if (containerEl) {
      const el = containerEl.querySelector(
        `[data-el-i="${childTagIndices[j]}"]`,
      ) as HTMLElement | null
      if (el) {
        const style = getComputedStyle(el)
        col1 = parseGridLineNumber(style.gridColumnStart) ?? col1
        row1 = parseGridLineNumber(style.gridRowStart) ?? row1
      }
    }
    const c0 = col1 - 1
    const r0 = row1 - 1
    if (r0 >= 0 && r0 < rows && c0 >= 0 && c0 < cols && matrix[r0][c0] === null) {
      matrix[r0][c0] = j
    }
  }
  return matrix
}

export function moveGridPlacementMatrixColumns(
  matrix: (number | null)[][],
  fromCol: number,
  toCol: number,
): (number | null)[][] {
  if (matrix.length === 0 || fromCol === toCol) return matrix.map((row) => [...row])
  const rowCount = matrix.length
  const colCount = matrix[0]?.length ?? 0
  if (colCount <= 1) return matrix.map((row) => [...row])

  const columns: (number | null)[][] = []
  for (let c = 0; c < colCount; c++) {
    columns.push(matrix.map((row) => row[c] ?? null))
  }
  const movedCols = moveGridTracks(columns, fromCol, toCol)
  return Array.from({ length: rowCount }, (_, r) =>
    movedCols.map((col) => col[r] ?? null),
  )
}

export function moveGridPlacementMatrixRows(
  matrix: (number | null)[][],
  fromRow: number,
  toRow: number,
): (number | null)[][] {
  if (matrix.length <= 1 || fromRow === toRow) return matrix.map((row) => [...row])
  return moveGridTracks(matrix.map((row) => [...row]), fromRow, toRow)
}

export interface GridChildPlacement {
  flatIndex: number
  col: number
  row: number
}

export function collectGridPlacementsFromMatrix(
  matrix: (number | null)[][],
): GridChildPlacement[] {
  const out: GridChildPlacement[] = []
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      const flatIndex = matrix[r][c]
      if (flatIndex === null) continue
      out.push({ flatIndex, col: c + 1, row: r + 1 })
    }
  }
  return out
}

export interface GridCellHit {
  col: number
  row: number
}

export interface GridElementDropPreview {
  bandX: number
  bandY: number
  bandWidth: number
  bandHeight: number
}

/** row-major 顺序下，目标格对应的 DOM insertAt（排除被拖元素后） */
export function gridDomInsertAtForCell(
  matrix: (number | null)[][],
  targetCol: number,
  targetRow: number,
  excludeFlatIndices: number[],
): number {
  const exclude = new Set(excludeFlatIndices)
  let insertAt = 0
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (r === targetRow && c === targetCol) return insertAt
      const cell = matrix[r][c]
      if (cell !== null && !exclude.has(cell)) insertAt++
    }
  }
  return insertAt
}

function rowMajorCellIndex(cols: number, row: number, col: number): number {
  return row * cols + col
}

function minDraggedRowMajorIndex(
  matrix: (number | null)[][],
  draggedFlatIndices: number[],
): number {
  const cols = matrix[0]?.length ?? 0
  let min = Number.POSITIVE_INFINITY
  for (const flat of draggedFlatIndices) {
    const pos = findCellOfFlat(matrix, flat)
    if (!pos) continue
    min = Math.min(min, rowMajorCellIndex(cols, pos.row, pos.col))
  }
  return Number.isFinite(min) ? min : 0
}

/**
 * row-major 插入：目标格有人时链式改坐标；目标格为空时只移动被拖元素（不紧凑填格、不补位）。
 */
export function applyGridElementInsertToMatrix(
  matrix: (number | null)[][],
  draggedFlatIndices: number[],
  targetCol: number,
  targetRow: number,
): (number | null)[][] {
  const rows = matrix.length
  const cols = matrix[0]?.length ?? 0
  if (rows === 0 || cols === 0) return matrix.map((row) => [...row])

  const draggedSet = new Set(draggedFlatIndices)
  const targetFlat = matrix[targetRow]?.[targetCol] ?? null

  if (targetFlat === null || draggedSet.has(targetFlat)) {
    return applyGridInsertAtEmptyCell(matrix, draggedFlatIndices, targetRow, targetCol)
  }

  return applyGridInsertAtOccupiedCell(matrix, draggedFlatIndices, targetRow, targetCol)
}

/** 目标格为空：仅被拖元素改到目标坐标，其余不动 */
function applyGridInsertAtEmptyCell(
  matrix: (number | null)[][],
  draggedFlatIndices: number[],
  targetRow: number,
  targetCol: number,
): (number | null)[][] {
  const rows = matrix.length
  const cols = matrix[0]?.length ?? 0
  const draggedSet = new Set(draggedFlatIndices)
  const next = matrix.map((row) => row.map((cell) => cell))

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (next[r][c] !== null && draggedSet.has(next[r][c]!)) {
        next[r][c] = null
      }
    }
  }

  let r = targetRow
  let c = targetCol
  for (const flat of draggedFlatIndices) {
    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      next[r][c] = flat
    }
    c++
    if (c >= cols) {
      c = 0
      r++
    }
  }
  return next
}

/** 目标格有人：链式插入，元素依次占用 row-major 已有占位坐标 */
function applyGridInsertAtOccupiedCell(
  matrix: (number | null)[][],
  draggedFlatIndices: number[],
  targetRow: number,
  targetCol: number,
): (number | null)[][] {
  const rows = matrix.length
  const cols = matrix[0]?.length ?? 0
  const draggedSet = new Set(draggedFlatIndices)

  const refCoords: { row: number; col: number }[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (matrix[r][c] !== null) refCoords.push({ row: r, col: c })
    }
  }

  const seq: number[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const flat = matrix[r][c]
      if (flat !== null && !draggedSet.has(flat)) seq.push(flat)
    }
  }

  const targetFlat = matrix[targetRow][targetCol]!
  const targetCellIndex = rowMajorCellIndex(cols, targetRow, targetCol)
  const draggedFromAfter = minDraggedRowMajorIndex(matrix, draggedFlatIndices) > targetCellIndex

  const posInSeq = seq.indexOf(targetFlat)
  let insertIdx = draggedFromAfter ? posInSeq : posInSeq + 1
  insertIdx = Math.max(0, Math.min(insertIdx, seq.length))
  seq.splice(insertIdx, 0, ...draggedFlatIndices)

  const next: (number | null)[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null),
  )
  for (let k = 0; k < seq.length; k++) {
    const coord = refCoords[k]
    if (!coord) break
    next[coord.row][coord.col] = seq[k]
  }
  return next
}

/** @deprecated 使用 applyGridElementInsertToMatrix */
export const applyGridElementDropToMatrix = applyGridElementInsertToMatrix

export interface GridInsertCommitResult {
  code: string
  movedTagIndices: number[]
}

/** 将矩阵占位写回坐标 + 按 row-major 重排 HTML 子标签 */
export function applyGridMatrixToCode(
  code: string,
  parentTagIndex: number,
  matrix: (number | null)[][],
  movedTagIndices: number[],
): GridInsertCommitResult {
  const parentLine = findTagLineInSource(code, parentTagIndex)?.lineIndex
  if (parentLine === undefined) return { code, movedTagIndices }

  const children = getDirectChildTagIndices(code, parentTagIndex)
  let next = code

  for (const placement of collectGridPlacementsFromMatrix(matrix)) {
    const childTagIndex = children[placement.flatIndex]
    next =
      patchChildGridPlacement(next, childTagIndex, placement.col, placement.row) ?? next
  }

  const orderedTagIndices: number[] = []
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < (matrix[r]?.length ?? 0); c++) {
      const flat = matrix[r][c]
      if (flat !== null) orderedTagIndices.push(children[flat])
    }
  }

  if (orderedTagIndices.length > 0) {
    const reordered = reorderDirectChildren(next, parentTagIndex, orderedTagIndices)
    if (reordered) next = reordered
  }

  const newParentIdx = findTagIndexAtLine(next, parentLine)
  if (newParentIdx === null) return { code: next, movedTagIndices }

  const newChildren = getDirectChildTagIndices(next, newParentIdx)
  const oldToNew = new Map<number, number>()
  for (let i = 0; i < orderedTagIndices.length; i++) {
    const oldIdx = orderedTagIndices[i]
    const newIdx = newChildren[i]
    if (newIdx !== undefined) oldToNew.set(oldIdx, newIdx)
  }

  return {
    code: next,
    movedTagIndices: movedTagIndices.map((idx) => oldToNew.get(idx) ?? idx),
  }
}

/** grid 元素插入落点：改坐标 + HTML 顺序（预览/commit 共用矩阵算法） */
export function commitGridCoordinateDrop(
  code: string,
  parentTagIndex: number,
  movedTagIndices: number[],
  targetCol: number,
  targetRow: number,
): GridInsertCommitResult {
  const children = getDirectChildTagIndices(code, parentTagIndex)
  const { columns, rows } = getGridTracksFromCode(code, parentTagIndex)
  const colCount = Math.max(1, columns.length)
  const rowCount = inferGridMatrixRowCount(code, children, colCount, rows.length)

  const draggedFlat = movedTagIndices
    .map((idx) => children.indexOf(idx))
    .filter((i) => i >= 0)

  let matrix = buildGridPlacementMatrixFromCode(code, children, colCount, rowCount)
  matrix = applyGridElementInsertToMatrix(matrix, draggedFlat, targetCol - 1, targetRow - 1)

  return applyGridMatrixToCode(code, parentTagIndex, matrix, movedTagIndices)
}

/**
 * 切换为 grid 时：按当前 HTML 顺序 + 已有坐标（无则 auto）为直接子项写入 grid-column / grid-row。
 */
export function stampGridChildCoordinates(code: string, parentTagIndex: number): string {
  const children = getDirectChildTagIndices(code, parentTagIndex)
  if (children.length === 0) return code

  const { columns, rows } = getGridTracksFromCode(code, parentTagIndex)
  const colCount = Math.max(1, columns.length)
  const rowCount = inferGridMatrixRowCount(code, children, colCount, rows.length)
  const matrix = buildGridPlacementMatrixFromCode(code, children, colCount, rowCount)

  let next = code
  for (const placement of collectGridPlacementsFromMatrix(matrix)) {
    const childTagIndex = children[placement.flatIndex]
    next = clearChildPositionStyles(next, childTagIndex) ?? next
    next =
      patchChildGridPlacement(next, childTagIndex, placement.col, placement.row) ?? next
  }
  return next
}

/**
 * 离开 grid 时：清除直接子项 grid 坐标（切 flex/none 时源码更干净；再切回 grid 会重新 stamp）。
 */
export function clearGridChildCoordinates(code: string, parentTagIndex: number): string {
  const children = getDirectChildTagIndices(code, parentTagIndex)
  let next = code
  for (const childTagIndex of children) {
    next = patchChildClearGridPlacement(next, childTagIndex) ?? next
  }
  return next
}

/** 在父 grid 中为子项找第一个空位（row-major；omit 不参与占位） */
export function findFirstEmptyGridCell(
  code: string,
  parentTagIndex: number,
  omitChildTagIndex?: number,
): { col: number; row: number } {
  const children = getDirectChildTagIndices(code, parentTagIndex)
  const { columns, rows } = getGridTracksFromCode(code, parentTagIndex)
  const colCount = Math.max(1, columns.length)
  const rowCount = inferGridMatrixRowCount(code, children, colCount, rows.length)
  const omitFlat =
    omitChildTagIndex !== undefined ? children.indexOf(omitChildTagIndex) : -1
  const skipFlat = omitFlat >= 0 ? [omitFlat] : []
  const matrix = buildGridPlacementMatrixFromCode(
    code,
    children,
    colCount,
    rowCount,
    skipFlat,
  )

  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < (matrix[r]?.length ?? 0); c++) {
      if (matrix[r][c] === null) {
        return { col: c + 1, row: r + 1 }
      }
    }
  }
  return { col: 1, row: matrix.length + 1 }
}

/** 粘贴进 grid 后：为子项写入第一个空位坐标 */
export function assignGridChildToFirstEmptyCell(
  code: string,
  parentTagIndex: number,
  childTagIndex: number,
): string {
  const { col, row } = findFirstEmptyGridCell(code, parentTagIndex, childTagIndex)
  return patchChildGridPlacement(code, childTagIndex, col, row) ?? code
}

/** 预览用：与 commit 相同的插入矩阵（可含尚未入树的被拖项） */
export function previewGridInsertMatrix(
  code: string,
  parentTagIndex: number,
  movedTagIndices: number[],
  targetCol: number,
  targetRow: number,
): (number | null)[][] | null {
  const children = getDirectChildTagIndices(code, parentTagIndex)
  const { columns, rows } = getGridTracksFromCode(code, parentTagIndex)
  const colCount = Math.max(1, columns.length)
  const rowCount = inferGridMatrixRowCount(code, children, colCount, rows.length)

  const draggedFlat = movedTagIndices
    .map((idx) => children.indexOf(idx))
    .filter((i) => i >= 0)
  if (draggedFlat.length === 0) return null

  let matrix = buildGridPlacementMatrixFromCode(code, children, colCount, rowCount)
  return applyGridElementInsertToMatrix(matrix, draggedFlat, targetCol - 1, targetRow - 1)
}

function measureRowBandsForHit(containerEl: HTMLElement, canvasRect: DOMRect): GridTrackBand[] {
  const bands = measureRowBands(containerEl, canvasRect)
  if (bands.length > 0) return bands

  const style = getComputedStyle(containerEl)
  const pl = parseFloat(style.paddingLeft) || 0
  const pr = parseFloat(style.paddingRight) || 0
  const pt = parseFloat(style.paddingTop) || 0
  const pb = parseFloat(style.paddingBottom) || 0
  const cr = containerEl.getBoundingClientRect()
  return [
    {
      index: 0,
      x: cr.left + pl - canvasRect.left,
      y: cr.top + pt - canvasRect.top,
      width: Math.max(1, cr.width - pl - pr),
      height: Math.max(1, cr.height - pt - pb),
    },
  ]
}

/** 指针所在 grid 单元格（0-based col/row） */
export function hitGridCellAtPoint(
  containerEl: HTMLElement,
  clientX: number,
  clientY: number,
): GridCellHit | null {
  const cr = containerEl.getBoundingClientRect()
  const colBands = measureColumnBands(containerEl, cr)
  const rowBands = measureRowBandsForHit(containerEl, cr)
  if (colBands.length === 0 || rowBands.length === 0) return null

  const style = getComputedStyle(containerEl)
  const colGap = parseFloat(style.columnGap) || 0
  const rowGap = parseFloat(style.rowGap) || 0

  let col = colBands.length - 1
  for (let i = 0; i < colBands.length; i++) {
    const band = colBands[i]!
    const left = cr.left + band.x
    const right = left + band.width
    if (clientX <= right + (i < colBands.length - 1 ? colGap * 0.5 : 0)) {
      col = i
      break
    }
  }

  let row = rowBands.length - 1
  for (let i = 0; i < rowBands.length; i++) {
    const band = rowBands[i]!
    const top = cr.top + band.y
    const bottom = top + band.height
    if (clientY <= bottom + (i < rowBands.length - 1 ? rowGap * 0.5 : 0)) {
      row = i
      break
    }
  }

  return { col, row }
}

export function getGridCellViewportRect(
  containerEl: HTMLElement,
  col: number,
  row: number,
): { left: number; top: number; width: number; height: number } | null {
  const cr = containerEl.getBoundingClientRect()
  const colBands = measureColumnBands(containerEl, cr)
  const rowBands = measureRowBandsForHit(containerEl, cr)
  const colBand = colBands[col]
  const rowBand = rowBands[row]
  if (!colBand || !rowBand) return null
  return {
    left: cr.left + colBand.x,
    top: cr.top + rowBand.y,
    width: colBand.width,
    height: rowBand.height,
  }
}

/** 将轨道 from 插入到 to 位置（排序拖拽用，非交换） */
export function moveGridTracks<T>(states: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= states.length || to >= states.length) {
    return [...states]
  }
  const next = [...states]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

/** 按 auto-placement 将列轨道 from 移到 to 时，子项 flat 下标的新顺序 */
export function permuteFlatIndicesForColumnMove(
  childCount: number,
  colCount: number,
  fromCol: number,
  toCol: number,
): number[] {
  if (childCount <= 1 || colCount <= 1 || fromCol === toCol) {
    return Array.from({ length: childCount }, (_, i) => i)
  }
  const rowCount = Math.ceil(childCount / colCount)
  const matrix: (number | null)[][] = []
  let idx = 0
  for (let r = 0; r < rowCount; r++) {
    const row: (number | null)[] = []
    for (let c = 0; c < colCount; c++) {
      row.push(idx < childCount ? idx : null)
      idx++
    }
    matrix.push(row)
  }
  const columns: (number | null)[][] = []
  for (let c = 0; c < colCount; c++) {
    columns.push(matrix.map((row) => row[c]))
  }
  const movedCols = moveGridTracks(columns, fromCol, toCol)
  const flat: number[] = []
  for (let r = 0; r < rowCount; r++) {
    for (let c = 0; c < colCount; c++) {
      const v = movedCols[c][r]
      if (v !== null) flat.push(v)
    }
  }
  return flat
}

/** 按 auto-placement 将行轨道 from 移到 to 时，子项 flat 下标的新顺序 */
export function permuteFlatIndicesForRowMove(
  childCount: number,
  colCount: number,
  rowCount: number,
  fromRow: number,
  toRow: number,
): number[] {
  if (childCount <= 1 || rowCount <= 1 || fromRow === toRow) {
    return Array.from({ length: childCount }, (_, i) => i)
  }
  const cols = Math.max(1, colCount)
  const rows = Math.max(1, rowCount)
  const matrix: (number | null)[][] = []
  let idx = 0
  for (let r = 0; r < rows; r++) {
    const row: (number | null)[] = []
    for (let c = 0; c < cols; c++) {
      row.push(idx < childCount ? idx : null)
      idx++
    }
    matrix.push(row)
  }
  const movedRows = moveGridTracks(matrix, fromRow, toRow)
  const flat: number[] = []
  for (let r = 0; r < movedRows.length; r++) {
    for (let c = 0; c < cols; c++) {
      const v = movedRows[r][c]
      if (v !== null) flat.push(v)
    }
  }
  return flat
}

export interface GridTrackBand {
  index: number
  x: number
  y: number
  width: number
  height: number
}

function measureColumnBands(containerEl: HTMLElement, canvasRect: DOMRect): GridTrackBand[] {
  const style = getComputedStyle(containerEl)
  const pl = parseFloat(style.paddingLeft) || 0
  const pt = parseFloat(style.paddingTop) || 0
  const pb = parseFloat(style.paddingBottom) || 0
  const colGap = parseFloat(style.columnGap) || 0
  const cr = containerEl.getBoundingClientRect()
  const originX = cr.left + pl - canvasRect.left
  const originY = cr.top + pt - canvasRect.top
  const bandH = Math.max(1, cr.height - pt - pb)

  const parts = style.gridTemplateColumns.split(/\s+/).filter(Boolean)
  const bands: GridTrackBand[] = []
  let x = originX
  for (let i = 0; i < parts.length; i++) {
    const w = Math.max(1, parseFloat(parts[i]) || 0)
    bands.push({ index: i, x, y: originY, width: w, height: bandH })
    x += w + (i < parts.length - 1 ? colGap : 0)
  }
  return bands
}

function measureRowBands(containerEl: HTMLElement, canvasRect: DOMRect): GridTrackBand[] {
  const style = getComputedStyle(containerEl)
  const pl = parseFloat(style.paddingLeft) || 0
  const pr = parseFloat(style.paddingRight) || 0
  const pt = parseFloat(style.paddingTop) || 0
  const rowGap = parseFloat(style.rowGap) || 0
  const cr = containerEl.getBoundingClientRect()
  const originX = cr.left + pl - canvasRect.left
  const originY = cr.top + pt - canvasRect.top
  const bandW = Math.max(1, cr.width - pl - pr)

  const parts = style.gridTemplateRows.split(/\s+/).filter(Boolean)
  if (parts.length === 0 || parts.every((p) => p === 'auto' || p === 'none')) {
    const children = Array.from(containerEl.children).filter(
      (c) => (c as HTMLElement).dataset.elI,
    ) as HTMLElement[]
    if (children.length === 0) return []

    const rowTops = new Map<number, number>()
    const rowHeights = new Map<number, number>()
    for (const child of children) {
      const r = child.getBoundingClientRect()
      const top = Math.round(r.top - canvasRect.top)
      const h = r.height
      const key = top
      rowTops.set(key, Math.min(rowTops.get(key) ?? top, top))
      rowHeights.set(key, Math.max(rowHeights.get(key) ?? h, h))
    }
    const keys = [...rowTops.keys()].sort((a, b) => a - b)
    const bands: GridTrackBand[] = []
    for (let i = 0; i < keys.length; i++) {
      const y = keys[i]
      const h = rowHeights.get(keys[i]) ?? 40
      bands.push({ index: i, x: originX, y, width: bandW, height: h })
    }
    return bands
  }

  const bands: GridTrackBand[] = []
  let y = originY
  for (let i = 0; i < parts.length; i++) {
    const h = Math.max(1, parseFloat(parts[i]) || 40)
    bands.push({ index: i, x: originX, y, width: bandW, height: h })
    y += h + (i < parts.length - 1 ? rowGap : 0)
  }
  return bands
}

const GRID_TRACK_CAPSULE_OUTSET = 16

export function computeGridTrackCapsules(
  containerEl: HTMLElement,
  canvasRect: DOMRect,
  columns: GridTrackState[],
  rows: GridTrackState[],
): { columns: GridTrackCapsuleView[]; rows: GridTrackCapsuleView[] } {
  const colBands = measureColumnBands(containerEl, canvasRect)
  const rowBands = measureRowBands(containerEl, canvasRect)
  const cr = containerEl.getBoundingClientRect()
  const containerTop = cr.top - canvasRect.top
  const containerLeft = cr.left - canvasRect.left

  const colCapsules: GridTrackCapsuleView[] = colBands.map((band, i) => {
    const state = columns[i] ?? { mode: 'fill' as const, value: 1 }
    return {
      axis: 'column',
      index: i,
      x: band.x + band.width / 2,
      y: containerTop - GRID_TRACK_CAPSULE_OUTSET,
      bandX: band.x,
      bandY: band.y,
      bandWidth: band.width,
      bandHeight: band.height,
      state,
    }
  })

  const rowCapsules: GridTrackCapsuleView[] = rowBands.map((band, i) => {
    const state = rows[i] ?? { mode: 'hug' as const, value: 0 }
    return {
      axis: 'row',
      index: i,
      x: containerLeft - GRID_TRACK_CAPSULE_OUTSET,
      y: band.y + band.height / 2,
      bandX: band.x,
      bandY: band.y,
      bandWidth: band.width,
      bandHeight: band.height,
      state,
    }
  })

  return { columns: colCapsules, rows: rowCapsules }
}

export function hitGridTrackAtPoint(
  x: number,
  y: number,
  capsules: GridTrackCapsuleView[],
): number | null {
  for (const c of capsules) {
    if (
      x >= c.bandX &&
      x <= c.bandX + c.bandWidth &&
      y >= c.bandY &&
      y <= c.bandY + c.bandHeight
    ) {
      return c.index
    }
  }
  return null
}

/** 轨道带 + 容器外胶囊热区（便于移入点击） */
export function hitGridTrackHoverAtPoint(
  x: number,
  y: number,
  capsules: GridTrackCapsuleView[],
  axis: 'column' | 'row',
): number | null {
  const inBand = hitGridTrackAtPoint(x, y, capsules)
  if (inBand !== null) return inBand

  const capW = axis === 'column' ? 72 : 56
  const capH = axis === 'column' ? 28 : 72
  for (const c of capsules) {
    if (axis === 'column') {
      const left = c.x - capW / 2
      const top = c.y - capH
      if (x >= left && x <= left + capW && y >= top && y <= c.y + 4) return c.index
    } else {
      const left = c.x - capW
      const top = c.y - capH / 2
      if (x >= left && x <= c.x + 4 && y >= top && y <= top + capH) return c.index
    }
  }
  return null
}

export function resolveGridTrackDropIndex(
  axis: 'column' | 'row',
  pointerX: number,
  pointerY: number,
  capsules: GridTrackCapsuleView[],
): number {
  if (capsules.length === 0) return 0
  if (axis === 'column') {
    for (let i = 0; i < capsules.length; i++) {
      const c = capsules[i]
      const mid = c.bandX + c.bandWidth / 2
      if (pointerX < mid) return i
    }
    return capsules.length - 1
  }
  for (let i = 0; i < capsules.length; i++) {
    const c = capsules[i]
    const mid = c.bandY + c.bandHeight / 2
    if (pointerY < mid) return i
  }
  return capsules.length - 1
}

export function gridTrackDragPreview(
  axis: 'column' | 'row',
  fromIndex: number,
  toIndex: number,
  capsules: GridTrackCapsuleView[],
): GridTrackDragPreview | null {
  const target = capsules[toIndex]
  if (!target || fromIndex === toIndex) return null
  return {
    axis,
    fromIndex,
    toIndex,
    bandX: target.bandX,
    bandY: target.bandY,
    bandWidth: target.bandWidth,
    bandHeight: target.bandHeight,
  }
}

export function applyGridTrackStateFromEditor(
  mode: GridTrackSizeMode,
  value: number,
  prev?: GridTrackState,
): GridTrackState {
  if (mode === 'hug') return { mode: 'hug', value: 0 }
  if (mode === 'fill') return { mode: 'fill', value: Math.max(0.1, value || 1) }
  if (mode === 'fixed') return { mode: 'fixed', value: Math.max(0, Math.round(value)) }
  return {
    mode: 'minmax',
    value: Math.max(0, Math.round(value || prev?.max || 400)),
    min: prev?.min ?? 80,
    max: Math.max(prev?.min ?? 80, Math.round(value || prev?.max || 400)),
  }
}

/** 兼容旧 emit */
export function gridTrackTokenLabel(state: GridTrackState): string {
  return gridTrackStateSummary(state)
}
