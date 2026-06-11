/**
 * 浮动布局：style 内 position:absolute + top/left/z-index
 */
import {
  formatInlineStyle,
  getTagAttrEntries,
  parseInlineStyle,
  parseStylePx,
  patchTagAttributes,
  type AttrEntry,
} from './attrPatch'
import { getTagParentIndex } from './sourceManip'

export const POSITION_STYLE_KEYS = [
  'position',
  'top',
  'left',
  'right',
  'bottom',
  'z-index',
] as const

export interface FloatingPosition {
  enabled: boolean
  left: number
  top: number
  zIndex: string
}

export function readFloatingFromStyle(styleRaw: string): FloatingPosition {
  const styles = parseInlineStyle(styleRaw)
  const pos = styles.position?.toLowerCase()
  const enabled = pos === 'absolute' || pos === 'relative' || pos === 'fixed'
  return {
    enabled,
    left: parseStylePx(styles, 'left') ?? 0,
    top: parseStylePx(styles, 'top') ?? 0,
    zIndex: styles['z-index']?.trim() ?? '',
  }
}

export function applyFloatingToStyles(
  styles: Record<string, string>,
  values: FloatingPosition,
): void {
  for (const key of POSITION_STYLE_KEYS) delete styles[key]
  if (!values.enabled) return

  styles.position = 'absolute'
  styles.left = `${Math.round(values.left)}px`
  styles.top = `${Math.round(values.top)}px`
  if (values.zIndex.trim()) styles['z-index'] = values.zIndex.trim()
}

export function patchTagInlineStyle(
  code: string,
  tagIndex: number,
  mutator: (styles: Record<string, string>) => void,
): string | null {
  const entries = getTagAttrEntries(code, tagIndex)
  const styles = parseInlineStyle(entries.style?.value ?? '')
  mutator(styles)
  const formatted = formatInlineStyle(styles)
  const patch: Record<string, AttrEntry | null> = formatted
    ? { style: { value: formatted, dynamic: false } }
    : { style: null }
  return patchTagAttributes(code, tagIndex, patch)
}

/** grid stamp 时清除子项浮动定位，避免与 grid-column/row 冲突 */
export function clearChildPositionStyles(code: string, childTagIndex: number): string | null {
  return patchTagInlineStyle(code, childTagIndex, (styles) => {
    for (const key of POSITION_STYLE_KEYS) delete styles[key]
  })
}

/** 浮动子项时确保父级有定位上下文 */
export function ensureParentPositionContext(code: string, childTagIndex: number): string {
  const parent = getTagParentIndex(code, childTagIndex)
  if (parent === null) return code

  const parentEntries = getTagAttrEntries(code, parent)
  const styles = parseInlineStyle(parentEntries.style?.value ?? '')
  const pos = styles.position?.toLowerCase()
  if (pos === 'absolute' || pos === 'fixed' || pos === 'sticky' || pos === 'relative') {
    return code
  }

  const next = patchTagInlineStyle(code, parent, (s) => {
    s.position = 'relative'
  })
  return next ?? code
}

/** @deprecated 旧 API 别名 */
export const readPositionFromStyle = readFloatingFromStyle
