/**
 * 从 template 源码构建标签树（与 sourceManip 父子关系一致）。
 */
import { findTagLineInSource } from './tagIndex'
import { countTags, getDirectChildTagIndices, getTagParentIndex } from './sourceManip'

export interface TagTreeNode {
  /** data-el-i / tagIndex */
  index: number
  tagName: string
  /** 树节点展示文案 */
  label: string
  children: TagTreeNode[]
}

function nodeLabel(code: string, index: number, tagName: string): string {
  if (tagName.toLowerCase() === 'span') {
    const range = code.split('\n')
    const loc = findTagLineInSource(code, index)
    if (!loc) return 'span'
    const line = range[loc.lineIndex] ?? ''
    const text = line.replace(/<span[^>]*>/i, '').replace(/<\/span>.*/, '').trim()
    if (text) return text.length > 24 ? `${text.slice(0, 24)}…` : text
  }
  return tagName
}

function buildNode(code: string, index: number): TagTreeNode {
  const loc = findTagLineInSource(code, index)!
  return {
    index: loc.dataIndex,
    tagName: loc.tagName,
    label: nodeLabel(code, index, loc.tagName),
    children: getDirectChildTagIndices(code, index).map((i) => buildNode(code, i)),
  }
}

/** template 根层标签列表（parent === null） */
export function buildTagTree(code: string): TagTreeNode[] {
  const tagCount = countTags(code)
  const roots: number[] = []
  for (let i = 0; i < tagCount; i++) {
    if (getTagParentIndex(code, i) === null) roots.push(i)
  }
  return roots.map((i) => buildNode(code, i))
}
