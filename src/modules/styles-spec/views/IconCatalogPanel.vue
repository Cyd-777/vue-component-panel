<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  PROJECT_ICON_CATALOG,
  PROJECT_ICON_FOLDER_TREE,
  iconMatchesFolder,
  type ProjectIconEntry,
  type ProjectIconFolderNode,
} from '../tokens/projectIconCatalog'

interface FlatFolderRow {
  path: string
  label: string
  depth: number
  iconCount: number
}

const query = ref('')
const selectedFolder = ref('')

function flattenFolderTree(
  nodes: ProjectIconFolderNode[],
  depth = 0,
  out: FlatFolderRow[] = [],
): FlatFolderRow[] {
  for (const node of nodes) {
    out.push({
      path: node.path,
      label: node.name,
      depth,
      iconCount: node.iconCount,
    })
    if (node.children.length) flattenFolderTree(node.children, depth + 1, out)
  }
  return out
}

const folderRows = computed(() => flattenFolderTree(PROJECT_ICON_FOLDER_TREE))

const filteredIcons = computed(() => {
  const q = query.value.trim().toLowerCase()
  return PROJECT_ICON_CATALOG.filter((icon) => {
    if (!iconMatchesFolder(icon, selectedFolder.value)) return false
    if (!q) return true
    return (
      icon.name.toLowerCase().includes(q)
      || icon.relativePath.toLowerCase().includes(q)
      || icon.format.toLowerCase().includes(q)
    )
  })
})

const groupedIcons = computed(() => {
  if (selectedFolder.value) {
    return filteredIcons.value.length ? [['', filteredIcons.value] as [string, ProjectIconEntry[]]] : []
  }
  const map = new Map<string, ProjectIconEntry[]>()
  for (const icon of filteredIcons.value) {
    const list = map.get(icon.group) ?? []
    list.push(icon)
    map.set(icon.group, list)
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, 'zh-CN'))
})

const selectedFolderLabel = computed(() => {
  if (!selectedFolder.value) return '全部文件夹'
  return selectedFolder.value
})

function selectFolder(path: string) {
  selectedFolder.value = path
}

async function copyPath(icon: ProjectIconEntry) {
  try {
    await navigator.clipboard.writeText(icon.relativePath)
  } catch {
    /* ignore */
  }
}
</script>

<template>
  <div class="icon-catalog">
    <div class="icon-catalog__toolbar">
      <input
        v-model="query"
        class="icon-catalog__search"
        type="search"
        placeholder="搜索图标名或路径…"
        aria-label="搜索图标"
      />
      <span class="icon-catalog__count">{{ filteredIcons.length }} 个</span>
    </div>

    <p v-if="!PROJECT_ICON_CATALOG.length" class="icon-catalog__empty">
      未扫描到图标。请将 SVG / PNG 等放入 <code>src/assets/icons/</code> 或现有
      <code>src/assets/editor/</code> 目录。
    </p>

    <div v-else class="icon-catalog__layout">
      <aside class="icon-catalog__folders" aria-label="文件夹">
        <p class="icon-catalog__folders-title">文件夹</p>
        <nav class="icon-catalog__folder-nav">
          <button
            type="button"
            class="icon-catalog__folder-btn"
            :class="{ 'icon-catalog__folder-btn--active': selectedFolder === '' }"
            @click="selectFolder('')"
          >
            <span class="icon-catalog__folder-name">全部</span>
            <span class="icon-catalog__folder-count">{{ PROJECT_ICON_CATALOG.length }}</span>
          </button>
          <button
            v-for="row in folderRows"
            :key="row.path"
            type="button"
            class="icon-catalog__folder-btn"
            :class="{ 'icon-catalog__folder-btn--active': selectedFolder === row.path }"
            :style="{ paddingLeft: `${8 + row.depth * 14}px` }"
            @click="selectFolder(row.path)"
          >
            <span class="icon-catalog__folder-name">{{ row.label }}</span>
            <span class="icon-catalog__folder-count">{{ row.iconCount }}</span>
          </button>
        </nav>
      </aside>

      <div class="icon-catalog__main">
        <p class="icon-catalog__path">{{ selectedFolderLabel }}</p>

        <p v-if="!filteredIcons.length" class="icon-catalog__empty">没有匹配的图标。</p>

        <section
          v-for="[group, icons] in groupedIcons"
          v-else
          :key="group || 'flat'"
          class="icon-catalog__section"
        >
          <header v-if="!selectedFolder && group" class="icon-catalog__section-head">
            <h3 class="icon-catalog__section-title">{{ group }}</h3>
            <span class="icon-catalog__section-count">{{ icons.length }}</span>
          </header>

          <div class="icon-catalog__grid">
            <button
              v-for="icon in icons"
              :key="icon.id"
              type="button"
              class="icon-catalog__card"
              :title="`复制路径：${icon.relativePath}`"
              @click="copyPath(icon)"
            >
              <span class="icon-catalog__preview" aria-hidden="true">
                <img class="icon-catalog__img" :src="icon.url" :alt="icon.name" loading="lazy" />
              </span>
              <span class="icon-catalog__format">{{ icon.format }}</span>
              <span class="icon-catalog__name">{{ icon.name }}</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.icon-catalog {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.icon-catalog__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.icon-catalog__search {
  flex: 1;
  min-width: 200px;
  height: 32px;
  padding: 0 10px;
  font-size: 13px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-container);
}

.icon-catalog__count {
  font-size: 12px;
  color: var(--td-text-color-placeholder);
}

.icon-catalog__layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  min-height: 240px;
}

.icon-catalog__folders {
  width: 220px;
  flex-shrink: 0;
  padding: 12px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-medium);
  background: var(--td-bg-color-secondarycontainer);
}

.icon-catalog__folders-title {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 600;
  color: var(--td-text-color-secondary);
}

.icon-catalog__folder-nav {
  display: flex;
  flex-direction: column;
  max-height: min(520px, 60vh);
  overflow: auto;
}

.icon-catalog__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.icon-catalog__path {
  margin: 0;
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--td-text-color-placeholder);
  word-break: break-all;
}

.icon-catalog__empty {
  margin: 0;
  font-size: 13px;
  color: var(--td-text-color-secondary);
}

.icon-catalog__empty code {
  font-size: 12px;
}

.icon-catalog__section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.icon-catalog__section-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.icon-catalog__section-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.icon-catalog__section-count {
  font-size: 11px;
  color: var(--td-text-color-placeholder);
}

.icon-catalog__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 12px;
}

.icon-catalog__folder-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  margin: 2px 0;
  padding: 6px 8px;
  border: none;
  border-radius: var(--td-radius-small);
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.icon-catalog__folder-btn:hover {
  background: var(--td-bg-color-container-hover);
}

.icon-catalog__folder-btn--active {
  background: var(--td-brand-color-light);
  color: var(--td-brand-color);
}

.icon-catalog__folder-name {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.icon-catalog__folder-count {
  flex-shrink: 0;
  font-size: 10px;
  color: var(--td-text-color-placeholder);
}

.icon-catalog__folder-btn--active .icon-catalog__folder-count {
  color: var(--td-brand-color);
}

.icon-catalog__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 14px 8px 10px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-container);
  cursor: pointer;
  text-align: center;
}

.icon-catalog__card:hover {
  border-color: var(--td-brand-color);
  background: var(--td-brand-color-light);
}

.icon-catalog__preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.icon-catalog__img {
  max-width: 24px;
  max-height: 24px;
  width: auto;
  height: auto;
  object-fit: contain;
}

.icon-catalog__format {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--td-text-color-placeholder);
}

.icon-catalog__name {
  font-size: 10px;
  line-height: 1.3;
  color: var(--td-text-color-secondary);
  word-break: break-all;
}
</style>
