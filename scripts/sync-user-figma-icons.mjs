/**
 * 从用户手动导出的 Figma SVG 文件夹同步到 src/assets/editor/
 * 用法: node scripts/sync-user-figma-icons.mjs [源目录]
 *
 * 尺寸约定：layout/spacing 等用户 icon → viewBox 0 0 24 24，面板固定展示 24×24px。
 * 仅 align/mode-*.svg（九宫格三根柱）为 viewBox 0 0 10 10。
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const defaultSrc = '/Users/cyd-777/Downloads/未命名文件夹 3'
const srcDir = process.argv[2] ?? defaultSrc
const assets = join(root, 'src/assets/editor')

function normalizeSvg(raw, viewBox = '0 0 24 24') {
  let s = raw.replace(/<svg([^>]*)>/i, (_, attrs) => {
    const cleaned = attrs.replace(/\s(width|height)="[^"]*"/gi, '')
    return `<svg${cleaned}>`
  })
  s = s
    .replace(/stroke="#B3B3B3"/gi, 'stroke="currentColor"')
    .replace(/stroke="#BABABA"/gi, 'stroke="currentColor"')
    .replace(/stroke="black"/gi, 'stroke="currentColor"')
    .replace(/fill="black"/gi, 'fill="currentColor"')
    .replace(/fill="white"/gi, 'fill="none"')
  if (!/viewBox=/i.test(s)) {
    s = s.replace('<svg', `<svg viewBox="${viewBox}"`)
  }
  if (!/aria-hidden/.test(s)) {
    s = s.replace('<svg', '<svg aria-hidden="true"')
  }
  return s
}

async function writeNormalized(dest, raw, viewBox) {
  await mkdir(dirname(dest), { recursive: true })
  await writeFile(dest, normalizeSvg(raw, viewBox).trim() + '\n')
}

async function copyMap(pairs, viewBox = '0 0 24 24') {
  for (const [name, destRel] of pairs) {
    const raw = await readFile(join(srcDir, name), 'utf8')
    await writeNormalized(join(assets, destRel), raw, viewBox)
  }
}

const DOT_POS = {
  'start-start': [6, 6],
  'center-start': [12, 6],
  'end-start': [18, 6],
  'start-center': [6, 12],
  'center-center': [12, 12],
  'end-center': [18, 12],
  'start-end': [6, 18],
  'center-end': [12, 18],
  'end-end': [18, 18],
}

function dotSvg(key) {
  const [cx, cy] = DOT_POS[key]
  return `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<circle cx="${cx}" cy="${cy}" r="2" fill="currentColor"/>
</svg>
`
}

await copyMap([
  ['Property 1=默认.svg', 'layout/layout-default.svg'],
  ['Property 1=flex.svg', 'layout/layout-flex.svg'],
  ['Property 1=grid.svg', 'layout/layout-grid.svg'],
  ['用处=元素堆叠, 状态=false.svg', 'layout/float-off.svg'],
  ['用处=元素堆叠, 状态=true.svg', 'layout/float-on.svg'],
  ['用处=是否排除描边, 状态=false.svg', 'layout/exclude-stroke-off.svg'],
  ['用处=是否排除描边, 状态=true.svg', 'layout/exclude-stroke-on.svg'],
  ['用处=文字基线对齐, 状态=false.svg', 'layout/baseline-align-off.svg'],
  ['用处=文字基线对齐, 状态=true.svg', 'layout/baseline-align-on.svg'],
  ['icon 类型=flex 布局排序方向, 作用=上至下.svg', 'layout/flex-dir-column.svg'],
  ['icon 类型=flex 布局排序方向, 作用=左至右.svg', 'layout/flex-dir-row.svg'],
  ['icon 类型=flex 布局排序方向, 作用=下至上.svg', 'layout/flex-dir-column-reverse.svg'],
  ['icon 类型=flex 布局排序方向, 作用=右至左.svg', 'layout/flex-dir-row-reverse.svg'],
  ['方向=上.svg', 'spacing/top.svg'],
  ['方向=下.svg', 'spacing/bottom.svg'],
  ['方向=左.svg', 'spacing/left.svg'],
  ['方向=右.svg', 'spacing/right.svg'],
  ['方向=上下.svg', 'spacing/vertical.svg'],
  ['方向=左右.svg', 'spacing/horizontal.svg'],
  ['方向=四向.svg', 'spacing/linked.svg'],
  ['icon 类型=间距, 作用=列间距.svg', 'spacing/gap-column.svg'],
  ['icon 类型=间距, 作用=行间距.svg', 'spacing/gap-row.svg'],
])

const alignDir = join(assets, 'align')
await mkdir(alignDir, { recursive: true })

/** 九宫格悬停：模式= 三套 × 对齐方向（在=左/start） */
await copyMap(
  [
    ['模式=垂直方向, 对齐方向=在.svg', 'align/mode-vertical-start.svg'],
    ['模式=垂直方向, 对齐方向=中.svg', 'align/mode-vertical-center.svg'],
    ['模式=垂直方向, 对齐方向=右.svg', 'align/mode-vertical-end.svg'],
    ['模式=水平方向, 对齐方向=上.svg', 'align/mode-horizontal-start.svg'],
    ['模式=水平方向, 对齐方向=中.svg', 'align/mode-horizontal-center.svg'],
    ['模式=水平方向, 对齐方向=下.svg', 'align/mode-horizontal-end.svg'],
    ['模式=自动换行, 对齐方向=在.svg', 'align/mode-wrap-start.svg'],
    ['模式=自动换行, 对齐方向=中.svg', 'align/mode-wrap-center.svg'],
    ['模式=自动换行, 对齐方向=右.svg', 'align/mode-wrap-end.svg'],
  ],
  '0 0 10 10',
)

for (const key of Object.keys(DOT_POS)) {
  await writeFile(join(alignDir, `dot-${key}.svg`), dotSvg(key).trim() + '\n')
}

const mapPath = join(alignDir, 'figma-export-map.json')
let map = {}
try {
  map = JSON.parse(await readFile(mapPath, 'utf8'))
} catch {
  map = { figmaNodes: {}, dot: {}, hover: {} }
}
map.userExportFolder = srcDir
map.userExportSyncedAt = new Date().toISOString().slice(0, 10)
map.alignMatrixModes = {
  vertical: {
    files: [
      '模式=垂直方向, 对齐方向=在.svg',
      '模式=垂直方向, 对齐方向=中.svg',
      '模式=垂直方向, 对齐方向=右.svg',
    ],
    when: 'default / flex 纵向 / grid 等（默认）',
    axis: '按列 contentAlign.x',
  },
  horizontal: {
    files: [
      '模式=水平方向, 对齐方向=上.svg',
      '模式=水平方向, 对齐方向=中.svg',
      '模式=水平方向, 对齐方向=下.svg',
    ],
    when: 'flex 横向且未换行',
    axis: '按行 contentAlign.y',
  },
  wrap: {
    files: [
      '模式=自动换行, 对齐方向=在.svg',
      '模式=自动换行, 对齐方向=中.svg',
      '模式=自动换行, 对齐方向=右.svg',
    ],
    when: 'flex 开启换行',
    axis: '按列 contentAlign.x',
  },
}
await writeFile(mapPath, JSON.stringify(map, null, 2) + '\n')

console.log('Synced icons from:', srcDir)
console.log('  layout: 3, spacing: 7, align mode: 9, align dot: 9')
