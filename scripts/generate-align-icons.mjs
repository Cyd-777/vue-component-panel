/**
 * 九宫格对齐 icon（flowNode 库风格：18×18、描边 2）
 * Figma 源：405:21 悬停九格、404:134 点态 — MCP 可用时用 sync-figma-align-icons.mjs 覆盖
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const alignDir = join(root, 'src/assets/editor/align')

const cells = [
  ['start', 'start', 3],
  ['center', 'start', 9],
  ['end', 'start', 15],
  ['start', 'center', 3],
  ['center', 'center', 9],
  ['end', 'center', 15],
  ['start', 'end', 3],
  ['center', 'end', 9],
  ['end', 'end', 15],
]

/** 与 layout tab 导出一致的圆角方框描边 */
const FRAME_PATH =
  'M3 2.5h12A1.5 1.5 0 0 1 16.5 4v10a1.5 1.5 0 0 1-1.5 1.5H3A1.5 1.5 0 0 1 1.5 14V4A1.5 1.5 0 0 1 3 2.5z'

function hoverSvg(cx, cy) {
  return `<svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<path d="${FRAME_PATH}" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
<circle cx="${cx}" cy="${cy}" r="2" fill="currentColor"/>
</svg>`
}

function dotSvg(cx, cy) {
  return `<svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<circle cx="${cx}" cy="${cy}" r="2" fill="currentColor"/>
</svg>`
}

await mkdir(alignDir, { recursive: true })

for (const [x, y, pos] of cells) {
  const key = `${x}-${y}`
  const cx = pos
  const cy =
    y === 'start' ? 3 : y === 'center' ? 9 : 15
  await writeFile(join(alignDir, `hover-${key}.svg`), hoverSvg(cx, cy))
  await writeFile(join(alignDir, `dot-${key}.svg`), dotSvg(cx, cy))
}

console.log('Regenerated 18 align grid SVGs (Figma-style)')
