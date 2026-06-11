#!/usr/bin/env node
/**
 * 从 Figma MCP get_design_context 返回的 asset URL 批量下载九宫格 icon。
 *
 * 用法（MCP 恢复后）：
 * 1. 对 405:21 / 404:134 / 405:86 各调一次 get_design_context
 * 2. 把响应里的 figma.com/api/mcp/asset/... URL 填入 figma-asset-urls.json
 * 3. node scripts/sync-figma-align-icons.mjs
 */
import { readFile, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const alignDir = join(root, 'src/assets/editor/align')
const manifestPath = join(alignDir, 'figma-asset-urls.json')

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))

async function download(url, filename) {
  if (!url) return false
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${filename}: ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await writeFile(join(alignDir, filename), buf)
  console.log('wrote', filename)
  return true
}

const { hover = {}, dot = {} } = manifest.downloadUrls ?? {}

for (const [key, url] of Object.entries(hover)) {
  await download(url, `hover-${key}.svg`)
}
for (const [key, url] of Object.entries(dot)) {
  await download(url, `dot-${key}.svg`)
}

if (!manifest.downloadUrls) {
  console.log(
    'No downloadUrls in figma-asset-urls.json — add hover/dot maps from get_design_context asset URLs.',
  )
}
