/**
 * 项目图标清单 — 构建时扫描 assets 下的图片文件（Vite import.meta.glob）
 */

export interface ProjectIconEntry {
  /** 唯一键：相对 src 的路径 */
  id: string
  /** 文件名（无扩展名） */
  name: string
  /** 大写格式标签，如 SVG / PNG */
  format: string
  /** 分组：icons / editor / … */
  group: string
  /** 所在目录（相对 src，不含文件名） */
  folderPath: string
  /** 相对路径，便于复制引用 */
  relativePath: string
  /** 可渲染 URL */
  url: string
}

export interface ProjectIconFolderNode {
  /** 目录路径；空字符串表示全部 */
  path: string
  /** 末级目录名；根为「全部」 */
  name: string
  /** 该目录及子目录下的图标数 */
  iconCount: number
  children: ProjectIconFolderNode[]
}

const SKIP_BASENAMES = new Set(['vue'])

function extensionFromPath(path: string): string {
  const dot = path.lastIndexOf('.')
  if (dot < 0) return ''
  return path.slice(dot + 1).toLowerCase()
}

function basenameWithoutExt(path: string): string {
  const file = path.split('/').pop() ?? path
  const dot = file.lastIndexOf('.')
  return dot > 0 ? file.slice(0, dot) : file
}

function toRelativeSrcPath(absolutePath: string): string {
  return absolutePath.replace(/^\/src\//, '')
}

function folderPathFromRelative(relativePath: string): string {
  const lastSlash = relativePath.lastIndexOf('/')
  return lastSlash >= 0 ? relativePath.slice(0, lastSlash) : ''
}

function inferGroup(relativePath: string): string {
  if (relativePath.startsWith('assets/icons/')) {
    const rest = relativePath.slice('assets/icons/'.length)
    const slash = rest.indexOf('/')
    return slash >= 0 ? rest.slice(0, slash) : 'icons'
  }
  if (relativePath.startsWith('assets/editor/')) {
    const rest = relativePath.slice('assets/editor/'.length)
    const slash = rest.indexOf('/')
    return slash >= 0 ? `editor/${rest.slice(0, slash)}` : 'editor'
  }
  const slash = relativePath.indexOf('/')
  return slash >= 0 ? relativePath.slice(0, slash) : 'assets'
}

function loadIconUrlModules(): Record<string, string> {
  const fromIcons = import.meta.glob<string>('/src/assets/icons/**/*.{svg,png,webp,jpg,jpeg,gif,ico}', {
    eager: true,
    query: '?url',
    import: 'default',
  }) as Record<string, string>

  const fromEditor = import.meta.glob<string>('/src/assets/editor/**/*.svg', {
    eager: true,
    query: '?url',
    import: 'default',
  }) as Record<string, string>

  return { ...fromIcons, ...fromEditor }
}

function buildProjectIconCatalog(): ProjectIconEntry[] {
  const modules = loadIconUrlModules()
  const entries: ProjectIconEntry[] = []

  for (const [absolutePath, url] of Object.entries(modules)) {
    const name = basenameWithoutExt(absolutePath)
    if (SKIP_BASENAMES.has(name)) continue

    const ext = extensionFromPath(absolutePath)
    if (!ext) continue

    const relativePath = toRelativeSrcPath(absolutePath)
    const folderPath = folderPathFromRelative(relativePath)

    entries.push({
      id: relativePath,
      name,
      format: ext.toUpperCase(),
      group: inferGroup(relativePath),
      folderPath,
      relativePath,
      url,
    })
  }

  return entries.sort((a, b) => a.relativePath.localeCompare(b.relativePath, 'zh-CN'))
}

export const PROJECT_ICON_CATALOG = buildProjectIconCatalog()

export function iconMatchesFolder(icon: ProjectIconEntry, folderPath: string): boolean {
  if (!folderPath) return true
  return icon.relativePath.startsWith(`${folderPath}/`)
}

function countIconsInFolder(folderPath: string, catalog: ProjectIconEntry[]): number {
  return catalog.filter((icon) => iconMatchesFolder(icon, folderPath)).length
}

function collectFolderPaths(catalog: ProjectIconEntry[]): Set<string> {
  const paths = new Set<string>()
  for (const icon of catalog) {
    if (!icon.folderPath) continue
    const parts = icon.folderPath.split('/')
    for (let i = 1; i <= parts.length; i += 1) {
      paths.add(parts.slice(0, i).join('/'))
    }
  }
  return paths
}

function ensureFolderNode(
  nodes: ProjectIconFolderNode[],
  segments: string[],
  catalog: ProjectIconEntry[],
): ProjectIconFolderNode {
  const path = segments.join('/')
  const name = segments[segments.length - 1] ?? path
  let node = nodes.find((n) => n.path === path)
  if (!node) {
    node = {
      path,
      name,
      iconCount: countIconsInFolder(path, catalog),
      children: [],
    }
    nodes.push(node)
    nodes.sort((a, b) => a.path.localeCompare(b.path, 'zh-CN'))
  }
  return node
}

export function buildProjectIconFolderTree(catalog: ProjectIconEntry[]): ProjectIconFolderNode[] {
  const roots: ProjectIconFolderNode[] = []
  for (const folderPath of collectFolderPaths(catalog)) {
    const segments = folderPath.split('/')
    let level = roots
    for (let i = 0; i < segments.length; i += 1) {
      const node = ensureFolderNode(level, segments.slice(0, i + 1), catalog)
      level = node.children
    }
  }
  return roots
}

export const PROJECT_ICON_FOLDER_TREE = buildProjectIconFolderTree(PROJECT_ICON_CATALOG)
