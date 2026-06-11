/**
 * componentRegistry — 组件注册表
 *
 * 通过两个文件管理组件的全局注册与局部注册：
 *
 * 1. global.json  — 全局注册清单。项目级可复用的组件，相当于 app.component()
 * 2. pages/      — 页面级局部注册清单。每个页面的组件依赖声明，相当于页面的 usingComponents
 *
 * 结构：
 *   components/              ← 组件库根目录
 *   ├── global.json          ← 全局组件清单
 *   ├── Button.vue
 *   ├── Card.vue
 *   └── pages/
 *       ├── home.json        ← home 页面的局部组件清单
 *       └── user.json        ← user 页面的局部组件清单
 */

export interface ComponentRegistration {
  /** 组件标识，如 'Button' */
  id: string
  /** 显示名称 */
  name: string
  /** 组件标签名，如 'MyButton' */
  tag: string
  /** 组件文件路径（相对组件库根目录），如 './Button.vue' */
  path: string
  /** 组件描述 */
  description?: string
  /** 分类 */
  category?: string
}

// ── 全局注册表 ──

const GLOBAL_KEY = 'flow-registry-global'
let _global: ComponentRegistration[] = []

export function loadGlobal(): ComponentRegistration[] {
  try {
    const raw = localStorage.getItem(GLOBAL_KEY)
    if (raw) { _global = JSON.parse(raw); return _global }
  } catch { /* ignore */ }
  _global = getDefaultGlobal()
  saveGlobal()
  return _global
}

export function saveGlobal(): void {
  localStorage.setItem(GLOBAL_KEY, JSON.stringify(_global))
}

export function getGlobal(): ComponentRegistration[] {
  return _global
}

export function registerGlobal(comp: ComponentRegistration): void {
  const i = _global.findIndex((c) => c.id === comp.id)
  i >= 0 ? _global[i] = comp : _global.push(comp)
  saveGlobal()
}

export function unregisterGlobal(id: string): void {
  _global = _global.filter((c) => c.id !== id)
  saveGlobal()
}

// ── 局部注册表（按页面） ──

const LOCAL_KEY = 'flow-registry-pages'
let _pages: Record<string, ComponentRegistration[]> = {}

export function loadPages(): Record<string, ComponentRegistration[]> {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (raw) { _pages = JSON.parse(raw); return _pages }
  } catch { /* ignore */ }
  _pages = {}
  savePages()
  return _pages
}

export function savePages(): void {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(_pages))
}

/** 获取某个页面的局部注册组件 */
export function getPageComponents(pageId: string): ComponentRegistration[] {
  return _pages[pageId] ?? []
}

/** 为某个页面注册一个组件（局部） */
export function registerPageComponent(pageId: string, comp: ComponentRegistration): void {
  if (!_pages[pageId]) _pages[pageId] = []
  const i = _pages[pageId].findIndex((c) => c.id === comp.id)
  i >= 0 ? _pages[pageId][i] = comp : _pages[pageId].push(comp)
  savePages()
}

/** 从某个页面的局部注册中移除 */
export function unregisterPageComponent(pageId: string, id: string): void {
  if (!_pages[pageId]) return
  _pages[pageId] = _pages[pageId].filter((c) => c.id !== id)
  savePages()
}

function getDefaultGlobal(): ComponentRegistration[] {
  return [
    { id: 'layout-container', name: 'LayoutContainer 布局容器', tag: 'LayoutContainer', path: './LayoutContainer.vue', description: '通用布局容器', category: 'layout' },
    { id: 'code-editor', name: 'CodeEditor 代码编辑器', tag: 'CodeEditor', path: './CodeEditor.vue', description: '代码编辑器', category: 'editor' },
  ]
}
