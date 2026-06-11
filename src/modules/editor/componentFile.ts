/**
 * 组件文件（.vue SFC）导入 / 导出与 script import 维护
 */

const VOID_HTML = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'])

export function stripEditorDataIds(code: string): string {
  return code.replace(/\s*\bdata-el-i="\d+"/g, '')
}

const PREVIEW_STYLE_ID = 'fp-editor-preview-style'

export function extractStyleBlockInner(code: string): string {
  const m = code.match(/<style[^>]*>([\s\S]*?)<\/style>/i)
  return m?.[1]?.trim() ?? ''
}

/** 交互态伪类需盖过 template inline / 组件 props 内联样式 */
export function preparePseudoRulesForRuntime(css: string): string {
  return css.replace(
    /(\.fp-el-\d+:(?:hover|active|focus-visible|focus)\s*\{)([\s\S]*?)(\})/g,
    (_full, open: string, body: string, close: string) => {
      const nextBody = body.replace(/([^;\n{][^;{}]*?);/g, (_match, decl: string) => {
        const trimmed = decl.trim()
        if (!trimmed || trimmed.includes('!important')) return `${decl};`
        return `  ${trimmed} !important;`
      })
      return `${open}${nextBody}${close}`
    },
  )
}

/** 画布 / 示例预览注入 SFC style 块（伪类等 scoped 规则在 livePreview 模板编译外生效） */
export function syncPreviewStyleSheet(code: string, mountEl: HTMLElement | null): void {
  if (!mountEl) return
  const inner = preparePseudoRulesForRuntime(extractStyleBlockInner(code))
  let el = mountEl.querySelector(`#${PREVIEW_STYLE_ID}`) as HTMLStyleElement | null
  if (!inner) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('style')
    el.id = PREVIEW_STYLE_ID
    mountEl.prepend(el)
  }
  if (el.textContent !== inner) el.textContent = inner
}

export function extractTemplateInner(code: string): string | null {
  const m = code.match(/<template>([\s\S]*?)<\/template>/)
  return m ? m[1] : null
}

/** PascalCase 组件标签（含 LayoutContainer，不含 span） */
export function collectComponentTags(templateInner: string): string[] {
  const tags = new Set<string>()
  const re = /<(\/?)([A-Z][\w-]*)\b/g
  let m: RegExpExecArray | null
  while ((m = re.exec(templateInner)) !== null) {
    if (m[1]) continue
    tags.add(m[2])
  }
  return [...tags].sort()
}

export function tagToKebabFilename(tag: string): string {
  return `${tag.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}.vue`
}

export function inferComponentMeta(
  code: string,
  filename?: string,
): { id: string; name: string; tag: string; filename: string } {
  const base = (filename ?? 'untitled.vue').replace(/\.vue$/i, '')
  const tagFromName = base
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')

  const scriptMatch = code.match(/<script[\s\S]*?<\/script>/)
  const exportName = scriptMatch?.[0].match(/export\s+default\s+\{\s*name:\s*['"]([^'"]+)['"]/)?.[1]

  const tag = exportName || tagFromName || 'UntitledComponent'
  const id = base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'untitled'
  const name = exportName || tag
  const outFilename = filename?.endsWith('.vue') ? filename : `${filename ?? tagToKebabFilename(tag)}`

  return { id, name, tag, filename: outFilename.endsWith('.vue') ? outFilename : `${outFilename}.vue` }
}

export function ensureFullSfc(code: string): string {
  let result = code.trim()
  if (!/<template[\s>]/i.test(result)) {
    result = `<template>\n${result}\n</template>`
  }
  if (!/<script[\s>]/i.test(result)) {
    result += '\n\n<script setup lang="ts">\n</script>\n'
  }
  if (!/<style[\s>]/i.test(result)) {
    result += '\n<style scoped>\n</style>\n'
  }
  return result
}

export function defaultImportPath(tag: string, importMap?: Record<string, string>): string {
  if (importMap?.[tag]) return importMap[tag]
  if (tag === 'LayoutContainer') return './LayoutContainer.vue'
  return `./${tagToKebabFilename(tag)}`
}

export function buildImportMapFromStore(
  stored: { tag: string; filename: string }[],
  editorCode: string,
): Record<string, string> {
  const map: Record<string, string> = {
    LayoutContainer: './LayoutContainer.vue',
  }
  for (const f of stored) {
    map[f.tag] = `./${f.filename}`
  }
  const inner = extractTemplateInner(editorCode)
  if (inner) {
    for (const tag of collectComponentTags(inner)) {
      if (!map[tag]) map[tag] = defaultImportPath(tag)
    }
  }
  return map
}

export function buildExportSfc(
  editorCode: string,
  opts: { filename: string; importMap?: Record<string, string> },
): string {
  const full = ensureFullSfc(editorCode)
  const templateMatch = full.match(/<template>[\s\S]*?<\/template>/i)
  const styleMatch = full.match(/<style[\s\S]*?<\/style>/i)
  const template = templateMatch?.[0] ?? '<template></template>'
  const style = styleMatch?.[0] ?? '<style scoped>\n</style>'

  const cleanedTemplate = template.replace(/\s*\bdata-el-i="\d+"/g, '')
  const inner = extractTemplateInner(cleanedTemplate) ?? ''
  const usedTags = collectComponentTags(inner)

  const importMap = opts.importMap ?? buildImportMapFromStore([], editorCode)
  const importLines = usedTags.map(
    (tag) => `import ${tag} from '${defaultImportPath(tag, importMap)}'`,
  )

  const script = importLines.length
    ? `<script setup lang="ts">\n${importLines.join('\n')}\n</script>`
    : '<script setup lang="ts">\n</script>'

  return `${cleanedTemplate}\n\n${script}\n\n${style}\n`
}

export function ensureScriptImports(
  code: string,
  newImports: { tag: string; path: string }[],
): string {
  if (newImports.length === 0) return code

  const full = ensureFullSfc(code)
  const scriptRe = /(<script([^>]*)>)([\s\S]*?)(<\/script>)/i
  const match = full.match(scriptRe)
  if (!match) return full

  const open = match[1]
  const body = match[3]
  const close = match[4]

  const existing = new Set<string>()
  const importRe = /import\s+(\w+)\s+from\s+['"][^'"]+['"]/g
  let im: RegExpExecArray | null
  while ((im = importRe.exec(body)) !== null) {
    existing.add(im[1])
  }

  const linesToAdd: string[] = []
  for (const { tag, path } of newImports) {
    if (existing.has(tag)) continue
    linesToAdd.push(`import ${tag} from '${path}'`)
    existing.add(tag)
  }

  if (linesToAdd.length === 0) return full

  const trimmed = body.trim()
  const newBody = linesToAdd.join('\n') + (trimmed ? `\n${trimmed}` : '\n')
  return full.replace(scriptRe, `${open}${newBody}${close}`)
}

export function buildComponentInsertSnippet(tag: string): string[] {
  const voidTag = VOID_HTML.has(tag.toLowerCase())
  if (voidTag) return [`<${tag} />`]
  return [`<${tag} />`]
}

export function parseImportedSfc(text: string): { code: string; error?: string } {
  const trimmed = text.trim()
  if (!trimmed) return { code: '', error: '文件为空' }
  if (!/<template[\s>]/i.test(trimmed)) {
    return { code: ensureFullSfc(`<template>\n${trimmed}\n</template>`) }
  }
  return { code: trimmed }
}

export function downloadTextFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const EMPTY_SFC = `<template>

</template>

<script setup lang="ts">

</script>

<style scoped>

</style>
`
