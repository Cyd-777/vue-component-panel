/**
 * 交互态 CSS 字典 ↔ 属性面板控件（描边 / 圆角等）
 */
import {
  expandBoxShorthand,
  formatBorderShorthand,
  formatBorderWidthCss,
  parseBorderShorthand,
  parsePxParts,
  type BorderValues,
  type BorderWidths,
} from './attrPatch'
import { formatBorderRadiusAttr, type BorderRadiusCorners } from './layoutSpacingLogic'

export function readBorderFromStyleDict(styles: Record<string, string>): BorderValues {
  if (styles.border) return parseBorderShorthand(styles.border)
  const widthRaw = styles['border-width'] ?? '0'
  const first = widthRaw.split(/\s+/)[0] ?? '0'
  return {
    width: first.replace(/px$/i, '') || '0',
    style: styles['border-style'] ?? 'solid',
    color: styles['border-color'] ?? '',
  }
}

export function readBorderWidthsFromStyleDict(styles: Record<string, string>): BorderWidths {
  if (styles['border-width']) {
    return expandBoxShorthand(parsePxParts(styles['border-width']))
  }
  const base = readBorderFromStyleDict(styles)
  const w = Math.max(0, parseInt(base.width, 10) || 0)
  return [w, w, w, w]
}

export function isBorderWidthLinkedInStyles(styles: Record<string, string>): boolean {
  return !styles['border-width']
}

export function applyBorderToStyleDict(
  styles: Record<string, string>,
  widths: BorderWidths,
  style: string,
  color: string,
  linked: boolean,
): void {
  delete styles.border
  delete styles['border-width']
  delete styles['border-style']
  delete styles['border-color']

  const allZero = widths.every((w) => w <= 0)
  if (allZero && (!style || style === 'none')) return

  if (linked) {
    const border = formatBorderShorthand(String(widths[0]), style, color)
    if (border !== 'none') styles.border = border
    return
  }

  styles['border-width'] = formatBorderWidthCss(widths)
  styles['border-style'] = style || 'solid'
  if (color) styles['border-color'] = color
}

export function applyBorderRadiusToStyleDict(
  styles: Record<string, string>,
  corners: BorderRadiusCorners,
): void {
  const val = formatBorderRadiusAttr(corners)
  const allZero = corners.every((n) => n <= 0)
  if (allZero || !val || val === '0px') delete styles['border-radius']
  else styles['border-radius'] = val
}
