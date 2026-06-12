/**
 * 读写标签行上的 HTML 属性（与 PropsPanel 规则一致）。
 */
import { findTagLineInSource } from './tagIndex'
import { buildAxisSizeModePatch } from './sizeModeLogic'

export interface AttrEntry {
  value: string
  dynamic: boolean
}

/** 定位开标签 `>` 的位置（支持属性值内含引号） */
export function findOpeningTagEnd(line: string, tagName: string): number {
  const m = line.match(new RegExp(`<${tagName}(?=\\s|>|/)`))
  if (!m || m.index === undefined) return -1
  let i = m.index + m[0].length
  while (i < line.length) {
    const ch = line[i]
    if (ch === '>') return i
    if (ch === '"') {
      i++
      while (i < line.length && line[i] !== '"') i++
    }
    i++
  }
  return -1
}

function parseAttrsFromAttrsString(attrsStr: string): Record<string, AttrEntry> {
  const attrs: Record<string, AttrEntry> = {}
  const dynRegex = /:(\w[\w-]*)="([^"]*)"/g
  let dm: RegExpExecArray | null
  while ((dm = dynRegex.exec(attrsStr)) !== null) {
    attrs[dm[1]] = { value: dm[2], dynamic: true }
  }
  const staticRegex = /(?:^|\s)(\w[\w-]*)="([^"]*)"/g
  let sm: RegExpExecArray | null
  while ((sm = staticRegex.exec(attrsStr)) !== null) {
    if (!(sm[1] in attrs)) {
      attrs[sm[1]] = { value: sm[2], dynamic: false }
    }
  }
  return attrs
}

function parseAttrsFromLine(line: string, tagName: string): Record<string, AttrEntry> {
  const openEnd = findOpeningTagEnd(line, tagName)
  if (openEnd < 0) return {}
  const openStart = line.search(new RegExp(`<${tagName}(?=\\s|>|/)`))
  const attrsStr = line.slice(openStart + tagName.length + 1, openEnd).trim()
  if (attrsStr.startsWith('/')) return {}
  return parseAttrsFromAttrsString(attrsStr)
}

export function getTagAttrsFromCode(code: string, tagIndex: number): Record<string, string> {
  const loc = findTagLineInSource(code, tagIndex)
  if (!loc) return {}
  const line = code.split('\n')[loc.lineIndex]
  const parsed = parseAttrsFromLine(line, loc.tagName)
  const flat: Record<string, string> = {}
  for (const [k, v] of Object.entries(parsed)) flat[k] = v.value
  return flat
}

export function getTagAttrEntries(code: string, tagIndex: number): Record<string, AttrEntry> {
  const loc = findTagLineInSource(code, tagIndex)
  if (!loc) return {}
  const line = code.split('\n')[loc.lineIndex]
  return parseAttrsFromLine(line, loc.tagName)
}

export function parseNumericAttr(attrs: Record<string, string>, key: string): number | null {
  const raw = attrs[key]
  if (raw === undefined || raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

/** 解析 style="a:b; c:d" 为键值表（键为小写） */
export function parseInlineStyle(style: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const part of style.split(';')) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const colon = trimmed.indexOf(':')
    if (colon <= 0) continue
    const key = trimmed.slice(0, colon).trim().toLowerCase()
    const value = trimmed
      .slice(colon + 1)
      .trim()
      .replace(/\s*!important\s*$/i, '')
      .trim()
    if (key) out[key] = value
  }
  return out
}

export function formatInlineStyle(styles: Record<string, string>): string {
  return Object.entries(styles)
    .filter(([, v]) => v !== '')
    .map(([k, v]) => `${k}: ${v}`)
    .join('; ')
}

export function parseStylePx(styles: Record<string, string>, key: string): number | null {
  const raw = styles[key]
  if (!raw) return null
  const m = raw.match(/^(-?\d+(?:\.\d+)?)px$/)
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n : null
}

export interface BorderValues {
  width: string
  style: string
  color: string
}

/** 上右下左描边宽度（px） */
export type BorderWidths = [number, number, number, number]

export const BORDER_WIDTH_LABELS = ['上', '右', '下', '左'] as const

export function expandBoxShorthand(parts: number[]): BorderWidths {
  if (parts.length === 0) return [0, 0, 0, 0]
  if (parts.length === 1) return [parts[0], parts[0], parts[0], parts[0]]
  if (parts.length === 2) return [parts[0], parts[1], parts[0], parts[1]]
  if (parts.length === 3) return [parts[0], parts[1], parts[2], parts[1]]
  return [parts[0], parts[1], parts[2], parts[3]]
}

export function parsePxParts(raw: string): number[] {
  return raw.split(/\s+/).map((s) => {
    const n = parseInt(s.replace(/px$/i, ''), 10)
    return Number.isFinite(n) ? Math.max(0, n) : 0
  })
}

/** 是否使用 border 简写（统一宽度）；style 里含 border-width 四值则为独立模式 */
export function isBorderWidthLinked(attrs: Record<string, AttrEntry>): boolean {
  const styles = parseInlineStyle(attrs.style?.value ?? '')
  if (styles['border-width']) return false
  return true
}

export function readBorderWidthsFromAttrs(attrs: Record<string, AttrEntry>): BorderWidths {
  const styles = parseInlineStyle(attrs.style?.value ?? '')
  if (styles['border-width']) {
    return expandBoxShorthand(parsePxParts(styles['border-width']))
  }
  const base = readBorderFromAttrs(attrs)
  const w = Math.max(0, parseInt(base.width, 10) || 0)
  return [w, w, w, w]
}

export function formatBorderWidthCss(widths: BorderWidths): string {
  return widths.map((n) => `${n}px`).join(' ')
}

export function buildBorderPlacementPatch(
  widths: BorderWidths,
  style: string,
  color: string,
  linked: boolean,
  existingStyleRaw?: string,
): Record<string, AttrEntry | null> {
  const existing = parseInlineStyle(existingStyleRaw ?? '')
  delete existing['border-width']
  delete existing['border-style']
  delete existing['border-color']

  if (linked) {
    const border = formatBorderShorthand(String(widths[0]), style, color)
    const patch: Record<string, AttrEntry | null> = {
      border: border === 'none' ? null : { value: border, dynamic: false },
      'border-width': null,
      'border-style': null,
      'border-color': null,
    }
    const styleValue = formatInlineStyle(existing)
    patch.style = styleValue ? { value: styleValue, dynamic: false } : null
    return patch
  }

  existing['border-width'] = formatBorderWidthCss(widths)
  existing['border-style'] = style || 'solid'
  if (color) existing['border-color'] = color

  return {
    border: null,
    'border-width': null,
    'border-style': null,
    'border-color': null,
    style: { value: formatInlineStyle(existing), dynamic: false },
  }
}

/** 解析 CSS border 简写，如 `1px solid #ccc` */
export function parseBorderShorthand(raw: string): BorderValues {
  const s = raw.trim()
  if (!s || s === 'none') return { width: '0', style: 'solid', color: '' }

  const m = s.match(/^([\d.]+px|\d+)\s+(solid|dashed|dotted|none)\s+(.+)$/i)
  if (m) {
    return {
      width: m[1].replace(/px$/, ''),
      style: m[2].toLowerCase(),
      color: m[3].trim(),
    }
  }
  return { width: '1', style: 'solid', color: s }
}

export function formatBorderShorthand(width: string, style: string, color: string): string {
  const w = width.trim() || '0'
  if (w === '0' || style === 'none') return 'none'
  const wPx = /^\d+(\.\d+)?$/.test(w) ? `${w}px` : w
  const c = color.trim() || '#dcdcdc'
  return `${wPx} ${style} ${c}`
}

/** 从标签属性表读取描边（优先 border 简写，否则拆分属性） */
export function readBorderFromAttrs(attrs: Record<string, AttrEntry>): BorderValues {
  const border = attrs.border?.value
  if (border) return parseBorderShorthand(border)
  return {
    width: attrs['border-width']?.value ?? '0',
    style: attrs['border-style']?.value ?? 'solid',
    color: attrs['border-color']?.value ?? '',
  }
}

/**
 * 用新的属性表重建标签行，保留开标签后的内容与闭合标签（如 span 单行文本）。
 * 属性不存在时会新增；patch 中 entry 为 null 表示删除。
 */
export function rebuildTagLineWithAttrs(
  line: string,
  tagName: string,
  attrs: Record<string, AttrEntry>,
): string | null {
  const openEnd = findOpeningTagEnd(line, tagName)
  if (openEnd < 0) return null

  const openStart = line.search(new RegExp(`<${tagName}(?=\\s|>|/)`))
  if (openStart < 0) return null

  const indent = line.match(/^(\s*)/)?.[1] ?? ''
  const suffix = line.slice(openEnd + 1)
  const isSelfClose = line[openEnd - 1] === '/'

  let newLine = `${indent}<${tagName}`
  for (const [k, entry] of Object.entries(attrs)) {
    if (entry.value === '') continue
    newLine += entry.dynamic ? ` :${k}="${entry.value}"` : ` ${k}="${entry.value}"`
  }
  newLine += isSelfClose ? ' />' : '>'
  return newLine + suffix
}

export function patchTagAttributes(
  code: string,
  tagIndex: number,
  patch: Record<string, AttrEntry | null>,
): string | null {
  const loc = findTagLineInSource(code, tagIndex)
  if (!loc) return null

  const lines = code.split('\n')
  const line = lines[loc.lineIndex]
  const merged = { ...getTagAttrEntries(code, tagIndex) }

  for (const [k, entry] of Object.entries(patch)) {
    if (entry === null) delete merged[k]
    else merged[k] = entry
  }

  const newLine = rebuildTagLineWithAttrs(line, loc.tagName, merged)
  if (!newLine) return null

  lines[loc.lineIndex] = newLine
  return lines.join('\n')
}

/** 将 span 的 style 宽高写回源码（手柄缩放 commit 用） */
export function patchSpanFixedSize(
  code: string,
  tagIndex: number,
  width: number,
  height: number,
): string | null {
  const loc = findTagLineInSource(code, tagIndex)
  if (!loc || loc.tagName.toLowerCase() !== 'span') return null

  const attrs = getTagAttrEntries(code, tagIndex)
  const styles = parseInlineStyle(attrs.style?.value ?? '')
  styles.display = 'inline-block'
  styles.width = `${Math.max(1, Math.round(width))}px`
  styles.height = `${Math.max(1, Math.round(height))}px`

  return patchTagAttributes(code, tagIndex, {
    style: { value: formatInlineStyle(styles), dynamic: false },
  })
}

/** 将子项 grid 坐标写回源码（span 用 style；LayoutContainer 用 grid-column / grid-row 属性） */
export function patchChildGridPlacement(
  code: string,
  tagIndex: number,
  col: number,
  row: number,
): string | null {
  const loc = findTagLineInSource(code, tagIndex)
  if (!loc) return null

  const colStr = String(Math.max(1, Math.round(col)))
  const rowStr = String(Math.max(1, Math.round(row)))
  const attrs = getTagAttrEntries(code, tagIndex)
  const styles = parseInlineStyle(attrs.style?.value ?? '')
  const isLayoutContainer = loc.tagName.toLowerCase() === 'layoutcontainer'

  const patch: Record<string, AttrEntry | null> = {}

  if (isLayoutContainer) {
    patch['grid-column'] = { value: colStr, dynamic: false }
    patch['grid-row'] = { value: rowStr, dynamic: false }
    if ('grid-column' in styles) delete styles['grid-column']
    if ('grid-row' in styles) delete styles['grid-row']
    const styleValue = formatInlineStyle(styles)
    patch.style = styleValue ? { value: styleValue, dynamic: false } : null
  } else {
    styles['grid-column'] = colStr
    styles['grid-row'] = rowStr
    patch.style = { value: formatInlineStyle(styles), dynamic: false }
  }

  return patchTagAttributes(code, tagIndex, patch)
}

/** 去掉开标签行上的 grid 坐标（粘贴副本时用，避免与现有子项撞格） */
export function stripGridPlacementFromOpeningLine(line: string): string {
  let next = line.replace(/\s+grid-column="[^"]*"/g, '')
  next = next.replace(/\s+grid-row="[^"]*"/g, '')
  next = next.replace(/\sstyle="([^"]*)"/, (_match, raw: string) => {
    const styles = parseInlineStyle(raw)
    delete styles['grid-column']
    delete styles['grid-row']
    const value = formatInlineStyle(styles)
    return value ? ` style="${value}"` : ''
  })
  return next.replace(/\s{2,}/g, ' ')
}

/** 移出 grid 容器时清除 grid 坐标 */
export function patchChildClearGridPlacement(code: string, tagIndex: number): string | null {
  const loc = findTagLineInSource(code, tagIndex)
  if (!loc) return code

  const attrs = getTagAttrEntries(code, tagIndex)
  const styles = parseInlineStyle(attrs.style?.value ?? '')
  let changed = false
  const isLayoutContainer = loc.tagName.toLowerCase() === 'layoutcontainer'

  if ('grid-column' in styles) {
    delete styles['grid-column']
    changed = true
  }
  if ('grid-row' in styles) {
    delete styles['grid-row']
    changed = true
  }

  const patch: Record<string, AttrEntry | null> = {}
  if (changed) {
    const value = formatInlineStyle(styles)
    patch.style = value ? { value, dynamic: false } : null
  }
  if (isLayoutContainer) {
    if (attrs['grid-column']) patch['grid-column'] = null
    if (attrs['grid-row']) patch['grid-row'] = null
  }
  if (Object.keys(patch).length === 0) return code
  return patchTagAttributes(code, tagIndex, patch)
}

/** 将 span 的 style padding 写回源码 */
export function patchSpanPadding(
  code: string,
  tagIndex: number,
  padding: [number, number, number, number],
): string | null {
  const loc = findTagLineInSource(code, tagIndex)
  if (!loc || loc.tagName.toLowerCase() !== 'span') return null

  const attrs = getTagAttrEntries(code, tagIndex)
  const styles = parseInlineStyle(attrs.style?.value ?? '')
  if (!styles.display) styles.display = 'inline-block'

  const p = padding.map((v) => Math.max(0, Math.round(v))) as [number, number, number, number]
  if (p[0] === p[1] && p[1] === p[2] && p[2] === p[3]) {
    if (p[0] === 0) delete styles.padding
    else styles.padding = `${p[0]}px`
  } else {
    styles.padding = `${p[0]}px ${p[1]}px ${p[2]}px ${p[3]}px`
  }

  return patchTagAttributes(code, tagIndex, {
    style: { value: formatInlineStyle(styles), dynamic: false },
  })
}

/** 跨容器移动后按当前渲染尺寸写回 fixed 宽高，避免父级 flex/fill 改变视觉大小 */
export function patchPreserveVisualSize(
  code: string,
  tagIndex: number,
  width: number,
  height: number,
): string | null {
  const loc = findTagLineInSource(code, tagIndex)
  if (!loc) return null

  if (loc.tagName.toLowerCase() === 'span') {
    return patchSpanFixedSize(code, tagIndex, width, height)
  }

  const w = String(Math.max(1, Math.round(width)))
  const h = String(Math.max(1, Math.round(height)))
  const current = getTagAttrsFromCode(code, tagIndex)

  return patchTagAttributes(code, tagIndex, {
    ...buildAxisSizeModePatch('width', 'fixed', current),
    ...buildAxisSizeModePatch('height', 'fixed', current),
    width: { value: w, dynamic: true },
    height: { value: h, dynamic: true },
  })
}
