/**
 * 源码级标签树操作：解析父子关系、提取标签块、同级重排。
 */
import { stripGridPlacementFromOpeningLine } from './attrPatch'
import { findTagLineInSource, findTagIndexAtLine, reindexTemplateDataIds } from './tagIndex'
import { isEditorStructuralContainer } from './layoutSpacingLogic'

export function countTags(code: string): number {
  let n = 0
  while (findTagLineInSource(code, n)) n++
  return n
}

/** 标签在源码中占用的行范围（含起止行） */
export function getTagBlockRange(
  code: string,
  tagIndex: number,
): { start: number; end: number } | null {
  const loc = findTagLineInSource(code, tagIndex)
  if (!loc) return null

  const lines = code.split('\n')
  const start = loc.lineIndex
  const openLine = lines[start]

  if (loc.tagName.toLowerCase() === 'span' || /\/\s*>\s*$/.test(openLine.trim())) {
    return { start, end: start }
  }

  let depth = 0
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i]
    if (line.includes(`</${loc.tagName}>`)) {
      if (depth === 0) return { start, end: i }
      depth--
    } else if (new RegExp(`<${loc.tagName}(\\s|>)`).test(line) && !line.includes('</')) {
      depth++
    }
  }
  return { start, end: start }
}

/** 直接父标签 index；template 根层元素 parent 为 null */
export function getTagParentIndex(code: string, tagIndex: number): number | null {
  const loc = findTagLineInSource(code, tagIndex)
  if (!loc) return null

  const tagCount = countTags(code)
  let parent: number | null = null
  let parentStartLine = -1

  for (let i = 0; i < tagCount; i++) {
    if (i === tagIndex) continue
    const candidate = findTagLineInSource(code, i)
    if (!candidate || candidate.tagName.toLowerCase() === 'span') continue

    const block = getTagBlockRange(code, i)
    if (!block) continue
    if (loc.lineIndex > block.start && loc.lineIndex <= block.end) {
      if (candidate.lineIndex > parentStartLine) {
        parent = i
        parentStartLine = candidate.lineIndex
      }
    }
  }
  return parent
}

/** 同级兄弟标签，按源码行序排列 */
export function getSiblingTagIndices(code: string, tagIndex: number): number[] {
  const parent = getTagParentIndex(code, tagIndex)
  const tagCount = countTags(code)
  const siblings: number[] = []

  for (let i = 0; i < tagCount; i++) {
    if (getTagParentIndex(code, i) === parent) siblings.push(i)
  }

  return siblings.sort((a, b) => {
    const la = findTagLineInSource(code, a)!.lineIndex
    const lb = findTagLineInSource(code, b)!.lineIndex
    return la - lb
  })
}

/** 某容器标签的直接子元素 index 列表 */
export function getDirectChildTagIndices(code: string, parentTagIndex: number): number[] {
  const tagCount = countTags(code)
  const children: number[] = []
  for (let i = 0; i < tagCount; i++) {
    if (getTagParentIndex(code, i) === parentTagIndex) children.push(i)
  }
  return children.sort((a, b) => {
    const la = findTagLineInSource(code, a)!.lineIndex
    const lb = findTagLineInSource(code, b)!.lineIndex
    return la - lb
  })
}

/** 按给定顺序重排父容器下直接子标签（DOM 顺序） */
export function reorderDirectChildren(
  code: string,
  parentTagIndex: number,
  orderedChildIndices: number[],
): string | null {
  const current = getDirectChildTagIndices(code, parentTagIndex)
  if (current.length === 0 || current.length !== orderedChildIndices.length) return null
  const currentSet = new Set(current)
  if (orderedChildIndices.some((idx) => !currentSet.has(idx))) return null

  const parentBlock = getTagBlockRange(code, parentTagIndex)
  if (!parentBlock) return null

  const lines = code.split('\n')
  const innerStart = parentBlock.start + 1
  const innerEnd = parentBlock.end - 1
  if (innerEnd < innerStart) return null

  const blockByIndex = new Map<number, string[]>()
  for (const idx of current) {
    const range = getTagBlockRange(code, idx)!
    blockByIndex.set(idx, lines.slice(range.start, range.end + 1))
  }

  const reorderedBlocks = orderedChildIndices.map((idx) => blockByIndex.get(idx)!)
  const newLines = [
    ...lines.slice(0, innerStart),
    ...reorderedBlocks.flat(),
    ...lines.slice(innerEnd + 1),
  ]
  return reindexTemplateDataIds(newLines.join('\n'))
}

/** tagIndex 是否为 ancestorIndex 的子孙 */
export function isDescendantTag(
  code: string,
  ancestorIndex: number,
  tagIndex: number,
): boolean {
  let current = getTagParentIndex(code, tagIndex)
  while (current !== null) {
    if (current === ancestorIndex) return true
    current = getTagParentIndex(code, current)
  }
  return false
}

function isContainerTag(code: string, tagIndex: number): boolean {
  const loc = findTagLineInSource(code, tagIndex)
  return !!loc && loc.tagName.toLowerCase() !== 'span'
}

function reindentBlock(blockLines: string[], newBaseIndent: string): string[] {
  const oldBase = blockLines[0]?.match(/^\s*/)?.[0] ?? ''
  return blockLines.map((line) => {
    if (!line.trim()) return line
    return newBaseIndent + line.slice(oldBase.length)
  })
}

/** insertAt 为排除被拖元素后、目标父级子列表中的插入下标（0..remaining.length） */
function insertAtToSiblingIndex(oldPos: number, insertAt: number, siblingCount: number): number {
  if (siblingCount <= 1) return 0
  const remainingLen = siblingCount - 1
  const clamped = Math.max(0, Math.min(insertAt, remainingLen))
  const order: number[] = []
  for (let i = 0; i < siblingCount; i++) {
    if (i !== oldPos) order.push(i)
  }
  order.splice(clamped, 0, oldPos)
  return order.indexOf(oldPos)
}

export interface MoveTagResult {
  code: string
  /** 移动后该标签在文档中的 ordinal（与 data-el-i 一致） */
  movedTagIndex: number
}

/** 将 tagIndex 移动到同级 newSiblingIndex 位置 */
export function reorderTagAmongSiblings(
  code: string,
  tagIndex: number,
  newSiblingIndex: number,
): MoveTagResult | null {
  const siblings = getSiblingTagIndices(code, tagIndex)
  const oldIndex = siblings.indexOf(tagIndex)
  if (oldIndex < 0) return null
  if (newSiblingIndex < 0 || newSiblingIndex >= siblings.length) return null
  if (oldIndex === newSiblingIndex) return null

  const parent = getTagParentIndex(code, tagIndex)
  if (parent === null) return null

  const lines = code.split('\n')
  const parentBlock = getTagBlockRange(code, parent)
  if (!parentBlock || parentBlock.end <= parentBlock.start) return null

  const innerStart = parentBlock.start + 1
  const innerEnd = parentBlock.end - 1

  const siblingBlocks = siblings.map((idx) => {
    const range = getTagBlockRange(code, idx)!
    return lines.slice(range.start, range.end + 1)
  })

  const reordered = [...siblings]
  reordered.splice(oldIndex, 1)
  reordered.splice(newSiblingIndex, 0, tagIndex)

  const reorderedBlocks = reordered.map((idx) => {
    const pos = siblings.indexOf(idx)
    return siblingBlocks[pos]
  })

  let movedOpenLine = innerStart
  {
    let lineCursor = innerStart
    for (const idx of reordered) {
      if (idx === tagIndex) movedOpenLine = lineCursor
      const pos = siblings.indexOf(idx)
      lineCursor += siblingBlocks[pos].length
    }
  }

  const newLines = [
    ...lines.slice(0, innerStart),
    ...reorderedBlocks.flat(),
    ...lines.slice(innerEnd + 1),
  ]
  const newCode = newLines.join('\n')
  const movedTagIndex = findTagIndexAtLine(newCode, movedOpenLine)
  if (movedTagIndex === null) return null
  return { code: newCode, movedTagIndex }
}

/** 将标签移动到其他父容器（或同级重排），insertAt 为在目标父级子列表中的插入位置 */
export function moveTagToParent(
  code: string,
  tagIndex: number,
  targetParentIndex: number,
  insertAt: number,
): MoveTagResult | null {
  const oldParent = getTagParentIndex(code, tagIndex)
  if (oldParent === null) return null
  if (!isContainerTag(code, targetParentIndex)) return null
  if (tagIndex === targetParentIndex) return null
  if (isDescendantTag(code, tagIndex, targetParentIndex)) return null

  if (oldParent === targetParentIndex) {
    const siblings = getDirectChildTagIndices(code, targetParentIndex)
    const oldPos = siblings.indexOf(tagIndex)
    if (oldPos < 0) return null
    const newPos = insertAtToSiblingIndex(oldPos, insertAt, siblings.length)
    return reorderTagAmongSiblings(code, tagIndex, newPos)
  }

  const lines = code.split('\n')
  const draggedBlock = getTagBlockRange(code, tagIndex)
  const targetParentBlock = getTagBlockRange(code, targetParentIndex)
  if (!draggedBlock || !targetParentBlock || targetParentBlock.end <= targetParentBlock.start) {
    return null
  }

  const targetChildren = getDirectChildTagIndices(code, targetParentIndex)
    .filter((idx) => idx !== tagIndex)
  const clampedInsert = Math.max(0, Math.min(insertAt, targetChildren.length))

  let insertLine: number
  if (targetChildren.length === 0 || clampedInsert >= targetChildren.length) {
    insertLine = targetParentBlock.end
  } else {
    const childBlock = getTagBlockRange(code, targetChildren[clampedInsert])!
    insertLine = childBlock.start
  }

  const parentOpenIndent = lines[targetParentBlock.start].match(/^\s*/)?.[0] ?? ''
  const childIndent = `${parentOpenIndent}  `
  const movedLines = reindentBlock(
    lines.slice(draggedBlock.start, draggedBlock.end + 1),
    childIndent,
  )

  // 先删后插，按行号修正插入位置
  lines.splice(draggedBlock.start, draggedBlock.end - draggedBlock.start + 1)
  if (draggedBlock.start < insertLine) {
    insertLine -= draggedBlock.end - draggedBlock.start + 1
  }
  lines.splice(insertLine, 0, ...movedLines)
  const newCode = lines.join('\n')
  const movedTagIndex = findTagIndexAtLine(newCode, insertLine)
  if (movedTagIndex === null) return null
  return { code: newCode, movedTagIndex }
}

export interface InsertTagResult {
  code: string
  /** 新标签的 data-el-i / ordinal（reindex 前） */
  newTagIndex: number
}

/** 向容器父级插入一段标签行（可多行），返回新源码与新标签 index */
export function insertTagBlock(
  code: string,
  parentTagIndex: number,
  insertAt: number,
  blockLines: string[],
): InsertTagResult | null {
  if (blockLines.length === 0) return null

  const parentLoc = findTagLineInSource(code, parentTagIndex)
  if (!parentLoc || !isEditorStructuralContainer(code, parentTagIndex)) return null

  const parentBlock = getTagBlockRange(code, parentTagIndex)
  if (!parentBlock || parentBlock.end <= parentBlock.start) return null

  const lines = code.split('\n')
  const children = getDirectChildTagIndices(code, parentTagIndex)
  const clampedInsert = Math.max(0, Math.min(insertAt, children.length))

  let insertLine: number
  if (children.length === 0 || clampedInsert >= children.length) {
    insertLine = parentBlock.end
  } else {
    const childBlock = getTagBlockRange(code, children[clampedInsert])!
    insertLine = childBlock.start
  }

  const parentOpenIndent = lines[parentBlock.start].match(/^\s*/)?.[0] ?? ''
  const childIndent = `${parentOpenIndent}  `
  const insertedLines = blockLines.map((line) => {
    const trimmed = line.trimStart()
    return trimmed ? `${childIndent}${trimmed}` : line
  })

  lines.splice(insertLine, 0, ...insertedLines)
  const newCode = lines.join('\n')
  const newTagIndex = findTagIndexAtLine(newCode, insertLine)
  if (newTagIndex === null) return null
  return { code: newCode, newTagIndex }
}

/** 删除标签块（含子树）；template 根层元素不可删 */
export function deleteTagBlock(code: string, tagIndex: number): string | null {
  if (getTagParentIndex(code, tagIndex) === null) return null

  const block = getTagBlockRange(code, tagIndex)
  if (!block) return null

  const lines = code.split('\n')
  lines.splice(block.start, block.end - block.start + 1)
  return lines.join('\n')
}

interface BlockSlice {
  start: number
  end: number
  lines: string[]
}

export const LAYOUT_CONTAINER_WRAP_OPEN =
  '<LayoutContainer layout="flex" flex-direction="row" height-mode="hug" border="1px solid var(--td-component-border)" :border-radius="8">'

/** 多选归一：同父、去子孙重复，按源码行序 */
export function normalizeGroupTagIndices(code: string, tagIndices: number[]): number[] | null {
  let indices = [...new Set(tagIndices)].sort((a, b) => {
    return findTagLineInSource(code, a)!.lineIndex - findTagLineInSource(code, b)!.lineIndex
  })
  indices = indices.filter(
    (idx) => !indices.some((other) => other !== idx && isDescendantTag(code, other, idx)),
  )
  if (indices.length === 0) return null
  const parent = getTagParentIndex(code, indices[0])
  if (parent === null) return null
  if (!indices.every((idx) => getTagParentIndex(code, idx) === parent)) return null
  return indices
}

function collectBlockSlices(code: string, indices: number[]): BlockSlice[] | null {
  const lines = code.split('\n')
  const blocks: BlockSlice[] = []
  for (const idx of indices) {
    const range = getTagBlockRange(code, idx)
    if (!range) return null
    blocks.push({
      start: range.start,
      end: range.end,
      lines: lines.slice(range.start, range.end + 1),
    })
  }
  return blocks
}

function removeBlockSlices(lines: string[], blocks: BlockSlice[]): number {
  const anchor = Math.min(...blocks.map((b) => b.start))
  let insertLine = anchor
  for (const b of [...blocks].sort((a, b) => b.start - a.start)) {
    lines.splice(b.start, b.end - b.start + 1)
  }
  for (const b of blocks) {
    if (b.start < anchor) insertLine -= b.end - b.start + 1
  }
  return insertLine
}

function parentLineAfterRemovals(
  parentLineBefore: number,
  removedBlocks: BlockSlice[],
): number {
  let line = parentLineBefore
  for (const b of removedBlocks) {
    if (b.end < parentLineBefore) line -= b.end - b.start + 1
  }
  return line
}

function movedIndicesFromInsertLine(
  newCode: string,
  insertLine: number,
  blockCount: number,
  blockLineCounts: number[],
): number[] | null {
  const indices: number[] = []
  let line = insertLine
  for (let i = 0; i < blockCount; i++) {
    const idx = findTagIndexAtLine(newCode, line)
    if (idx === null) return null
    indices.push(idx)
    line += blockLineCounts[i]
  }
  return indices
}

/** 同级/跨容器移动多个兄弟标签，保持相对顺序 */
export function moveTagGroupToParent(
  code: string,
  tagIndices: number[],
  targetParentIndex: number,
  insertAt: number,
): { code: string; movedTagIndices: number[] } | null {
  const indices = normalizeGroupTagIndices(code, tagIndices)
  if (!indices) return null
  if (indices.length === 1) {
    const r = moveTagToParent(code, indices[0], targetParentIndex, insertAt)
    if (!r) return null
    return { code: r.code, movedTagIndices: [r.movedTagIndex] }
  }

  if (!isContainerTag(code, targetParentIndex)) return null
  if (indices.some((idx) => idx === targetParentIndex || isDescendantTag(code, idx, targetParentIndex))) {
    return null
  }

  const targetParentLine = findTagLineInSource(code, targetParentIndex)?.lineIndex
  if (targetParentLine === undefined) return null

  const lines = code.split('\n')
  const blocks = collectBlockSlices(code, indices)
  if (!blocks) return null

  const flatLines = blocks.flatMap((b) => b.lines)
  const blockLineCounts = blocks.map((b) => b.lines.length)
  removeBlockSlices(lines, blocks)

  const adjustedParentLine = parentLineAfterRemovals(targetParentLine, blocks)
  const newParentIndex = findTagIndexAtLine(lines.join('\n'), adjustedParentLine)
  if (newParentIndex === null) return null

  const parentBlock = getTagBlockRange(lines.join('\n'), newParentIndex)
  if (!parentBlock || parentBlock.end <= parentBlock.start) return null

  const remainingChildren = getDirectChildTagIndices(lines.join('\n'), newParentIndex)
  const clampedInsert = Math.max(0, Math.min(insertAt, remainingChildren.length))

  let targetInsertLine: number
  if (remainingChildren.length === 0 || clampedInsert >= remainingChildren.length) {
    targetInsertLine = parentBlock.end
  } else {
    const childBlock = getTagBlockRange(lines.join('\n'), remainingChildren[clampedInsert])!
    targetInsertLine = childBlock.start
  }

  const parentOpenIndent = lines[parentBlock.start].match(/^\s*/)?.[0] ?? ''
  const childIndent = `${parentOpenIndent}  `
  const movedLines = reindentBlock(flatLines, childIndent)

  lines.splice(targetInsertLine, 0, ...movedLines)
  const newCode = lines.join('\n')

  const movedTagIndices = movedIndicesFromInsertLine(
    newCode,
    targetInsertLine,
    blocks.length,
    blockLineCounts,
  )
  if (!movedTagIndices) return null
  return { code: newCode, movedTagIndices }
}

export interface WrapTagsResult {
  code: string
  wrapperTagIndex: number
}

/** 用 LayoutContainer（Auto Layout）包裹多个同级元素 */
export function wrapTagsInLayoutContainer(
  code: string,
  tagIndices: number[],
): WrapTagsResult | null {
  const indices = normalizeGroupTagIndices(code, tagIndices)
  if (!indices || indices.length < 2) return null

  const lines = code.split('\n')
  const blocks = collectBlockSlices(code, indices)
  if (!blocks) return null

  const insertLine = removeBlockSlices(lines, blocks)
  const wrapperIndent = blocks[0].lines[0].match(/^\s*/)?.[0] ?? ''
  const innerIndent = `${wrapperIndent}  `
  const innerLines = blocks.flatMap((b) => reindentBlock(b.lines, innerIndent))
  const wrapperLines = [
    `${wrapperIndent}${LAYOUT_CONTAINER_WRAP_OPEN}`,
    ...innerLines,
    `${wrapperIndent}</LayoutContainer>`,
  ]

  lines.splice(insertLine, 0, ...wrapperLines)
  const newCode = lines.join('\n')
  const wrapperTagIndex = findTagIndexAtLine(newCode, insertLine)
  if (wrapperTagIndex === null) return null
  return { code: newCode, wrapperTagIndex }
}

/** 提取标签完整源码块（含子树） */
export function extractTagBlockLines(code: string, tagIndex: number): string[] | null {
  const block = getTagBlockRange(code, tagIndex)
  if (!block) return null
  return code.split('\n').slice(block.start, block.end + 1)
}

function stripDataElIFromBlock(lines: string[]): string[] {
  return lines.map((line) => line.replace(/\s*\bdata-el-i="\d+"/g, ''))
}

/** 粘贴块：去掉根开标签上的 grid 坐标（粘贴后由 grid 父级重新分配） */
function stripGridPlacementFromBlockRoot(lines: string[]): string[] {
  if (lines.length === 0) return lines
  return [stripGridPlacementFromOpeningLine(lines[0]), ...lines.slice(1)]
}

/** 在 tagIndex 对应块之后粘贴同级副本（保持缩进） */
export function pasteTagBlockAfter(
  code: string,
  afterTagIndex: number,
  blockLines: string[],
): { code: string; newTagIndex: number } | null {
  if (blockLines.length === 0) return null

  const afterBlock = getTagBlockRange(code, afterTagIndex)
  if (!afterBlock) return null

  const lines = code.split('\n')
  const siblingIndent = lines[afterBlock.start].match(/^\s*/)?.[0] ?? ''
  const pasted = reindentBlock(
    stripGridPlacementFromBlockRoot(stripDataElIFromBlock(blockLines)),
    siblingIndent,
  )

  const insertLine = afterBlock.end + 1
  lines.splice(insertLine, 0, ...pasted)
  const newCode = reindexTemplateDataIds(lines.join('\n'))
  const newTagIndex = findTagIndexAtLine(newCode, insertLine)
  if (newTagIndex === null) return null
  return { code: newCode, newTagIndex }
}
