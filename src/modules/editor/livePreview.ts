/**
 * LivePreview — 动态编译和渲染 Vue template
 *
 * 用 @vue/compiler-dom 编译 template，用 @vue/runtime-dom 提供运行时。
 *
 * 编译前会自动给每个顶层标签注入 data-el-i 属性（如果还没有的话），
 * 用于画布交互拾取。已存在的 data-el-i 会保留不变，确保 syncCode 后索引稳定。
 */
import { defineComponent } from 'vue'
import { compile } from '@vue/compiler-dom'
import * as VueDOM from '@vue/runtime-dom'
import LayoutContainer from '../../modules/layout-container/LayoutContainer.vue'
import type { StoredComponentFile } from './componentFileStore'

const baseComponents: Record<string, any> = { LayoutContainer }
let runtimeComponents: Record<string, any> = { ...baseComponents }

export function setPreviewRegistry(extra: Record<string, any>): void {
  runtimeComponents = { ...baseComponents, ...extra }
}

export function getPreviewRegistry(): Record<string, any> {
  return runtimeComponents
}

/** 多轮编译，使已保存组件可互相嵌套预览 */
export function buildPreviewRegistryFromStore(
  files: StoredComponentFile[],
): Record<string, any> {
  const map: Record<string, any> = { ...baseComponents }
  let progress = true
  let guard = 0
  while (progress && guard++ < files.length + 3) {
    progress = false
    for (const f of files) {
      if (map[f.tag]) continue
      const { component } = tryCreatePreviewComponent(f.code, map)
      if (component) {
        map[f.tag] = component
        progress = true
      }
    }
  }
  return map
}

/**
 * 确保 template 中每个非 template 标签都有 data-el-i 属性。
 * 已有 data-el-i 的标签保留原值，没有的注入新的递增序号。
 */
function ensureDataIndex(template: string): string {
  let index = 0
  return template.replace(
    /<(\w[\w-]*)((?:\s[^>]*)?)(\/?>)/g,
    (match, tagName: string, attrs: string, closer: string) => {
      if (tagName === 'template') return match
      // 已有 data-el-i 就保留原值
      const existing = attrs.match(/\bdata-el-i="(\d+)"/)
      if (existing) {
        const v = parseInt(existing[1], 10)
        if (v >= index) index = v + 1
        return match
      }
      const i = index++
      return `<${tagName} data-el-i="${i}"${attrs}${closer}`
    },
  )
}

/**
 * 去掉空动态绑定 `:foo=""`，避免 Vue 报 v-bind is missing expression。
 */
function stripEmptyDynamicAttrs(template: string): string {
  return template.replace(/\s:[A-Za-z][\w-]*=""/g, '')
}

/** 从完整 SFC 源码的 template 段去掉空动态绑定 */
export function stripEmptyDynamicAttrsInSource(code: string): string {
  return code.replace(
    /(<template>)([\s\S]*?)(<\/template>)/,
    (_full, open: string, inner: string, close: string) =>
      `${open}${stripEmptyDynamicAttrs(inner)}${close}`,
  )
}

export interface PreviewCompileResult {
  component: ReturnType<typeof defineComponent> | null
  error: string | null
}

export function tryCreatePreviewComponent(
  code: string,
  componentMap: Record<string, any> = runtimeComponents,
  setup?: () => Record<string, unknown>,
): PreviewCompileResult {
  const tmplMatch = code.match(/<template>([\s\S]*?)<\/template>/)
  if (!tmplMatch) {
    return { component: null, error: '缺少 <template> 块' }
  }

  let templateContent = tmplMatch[1].trim()
  if (!templateContent) {
    return { component: null, error: 'template 内容为空' }
  }

  templateContent = stripEmptyDynamicAttrs(templateContent)
  templateContent = ensureDataIndex(templateContent)

  try {
    const compiled = compile(templateContent, { mode: 'function' })
    const renderCode = compiled.code

    const fn = new Function(
      'Vue',
      `with (Vue) { ${renderCode} }; return render`,
    )

    const renderFn = fn(VueDOM)

    if (typeof renderFn !== 'function') {
      return { component: null, error: '编译结果无效' }
    }

    return {
      component: defineComponent({
        setup,
        render: renderFn,
        components: componentMap,
      }),
      error: null,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[LivePreview] compile error:', e)
    return { component: null, error: msg }
  }
}

export function createPreviewComponent(code: string) {
  return tryCreatePreviewComponent(code).component
}
