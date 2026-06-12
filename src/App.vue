<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getLibraryPathLabel,
  isLibraryFsAccessSupported,
  pickLibraryDirectory,
  setLibraryPathLabel,
} from './modules/library/libraryDirectory'
import { refreshLibraryComponents } from './modules/library/useLibraryComponents'

const route = useRoute()
const router = useRouter()

const navItems = [
  { value: 'library', label: '组件库', path: '/library' },
  { value: 'styles', label: '全局样式规范', path: '/styles' },
  { value: 'editor', label: '组件画板', path: '/editor' },
] as const

const activeNav = computed(() => {
  const path = route.path
  if (path.startsWith('/editor') || path.startsWith('/preview')) return 'editor'
  if (path.startsWith('/styles')) return 'styles'
  return 'library'
})

function onNavChange(value: string) {
  const item = navItems.find((n) => n.value === value)
  if (item) void router.push({ path: item.path })
}

const libPath = ref(getLibraryPathLabel())
const hasPath = ref(!!getLibraryPathLabel())
const fsAccess = isLibraryFsAccessSupported()

async function onSelect() {
  const path = libPath.value.trim()
  if (!path) return
  setLibraryPathLabel(path)
  hasPath.value = true
  await refreshLibraryComponents()
  void router.push({ path: '/library' })
}

async function onPickLibraryFolder() {
  if (fsAccess) {
    const ok = await pickLibraryDirectory()
    if (!ok) return
    libPath.value = getLibraryPathLabel()
    hasPath.value = true
    await refreshLibraryComponents()
    void router.push({ path: '/library' })
    return
  }
  folderInputRef.value?.click()
}

const folderInputRef = ref<HTMLInputElement | null>(null)

function onFolderPicked(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    const fullPath = input.files[0].webkitRelativePath
    libPath.value = fullPath.split('/')[0]
  }
  input.value = ''
}

function inputEnter() {
  if (libPath.value.trim()) void onSelect()
}

onMounted(() => {
  if (hasPath.value) void refreshLibraryComponents()
})
</script>

<template>
  <!-- 未选路径：设置页 -->
  <div v-if="!hasPath" class="setup">
    <div class="setup__card">
      <h1 class="setup__title">Flow Panel</h1>
      <p class="setup__desc">选择组件库目录</p>
      <button type="button" class="setup__folder-btn" @click="onPickLibraryFolder">
        <span class="setup__folder-icon">📁</span>
        选择组件库文件夹
      </button>
      <input
        ref="folderInputRef"
        type="file"
        webkitdirectory
        class="setup__folder-input"
        @change="onFolderPicked"
      />
      <div class="setup__divider"><span>或手动输入路径</span></div>
      <div class="setup__custom">
        <input v-model="libPath" class="setup__input" placeholder="输入组件库路径" @keydown.enter="inputEnter" />
        <button class="setup__btn" :disabled="!libPath.trim()" @click="onSelect">确认</button>
      </div>
      <div class="setup__hint">
        {{ fsAccess
          ? '将绑定可读写目录，导出与「+ 组件」均从此目录读写 .vue'
          : '当前浏览器仅支持记录目录名；请使用 Chrome / Edge 以绑定完整目录' }}
      </div>
    </div>
  </div>

  <!-- 已选路径：导航 + 页面 -->
  <div v-else class="app">
    <header class="app__header" @pointerdown.stop>
      <span class="app__brand">Flow Panel</span>
      <nav class="app__nav">
        <button v-for="item in navItems" :key="item.value"
          class="app__nav-btn"
          :class="{ 'app__nav-btn--active': activeNav === item.value }"
          @click="onNavChange(item.value)">{{ item.label }}</button>
      </nav>
    </header>
    <main class="app__body">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.setup {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  background: var(--td-bg-color-page);
}

.setup__card {
  width: 400px;
  padding: 48px 40px;
  background: var(--td-bg-color-container);
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-medium);
  box-shadow: var(--td-shadow-2);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setup__title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  text-align: center;
}

.setup__desc {
  margin: 0 0 4px;
  font-size: 13px;
  color: var(--td-text-color-secondary);
  text-align: center;
}

.setup__folder-input {
  display: none;
}

.setup__folder-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 48px;
  border: 2px dashed var(--td-component-border);
  border-radius: var(--td-radius-medium);
  font-size: 14px;
  color: var(--td-text-color-primary);
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
}

.setup__folder-btn:hover {
  border-color: var(--td-brand-color);
  color: var(--td-brand-color);
  background: var(--td-brand-color-light);
}

.setup__folder-icon {
  font-size: 18px;
}

.setup__divider {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--td-text-color-placeholder);
  font-size: 12px;
}

.setup__divider::before,
.setup__divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--td-component-border);
}

.setup__custom {
  display: flex;
  gap: 8px;
}

.setup__input {
  flex: 1;
  height: 36px;
  padding: 0 12px;
  font-size: 13px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  outline: none;
  background: var(--td-bg-color-container);
}

.setup__input:focus {
  border-color: var(--td-brand-color);
}

.setup__btn {
  height: 36px;
  padding: 0 20px;
  font-size: 13px;
  border: none;
  border-radius: var(--td-radius-small);
  background: var(--td-brand-color);
  color: #fff;
  cursor: pointer;
  flex-shrink: 0;
}

.setup__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.setup__hint {
  text-align: center;
  font-size: 11px;
  color: var(--td-text-color-placeholder);
}

/* ── 导航布局 ── */
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--td-bg-color-page);
}

.app__header {
  display: flex;
  align-items: center;
  gap: 24px;
  height: 48px;
  padding: 0 24px;
  border-bottom: 1px solid var(--td-component-stroke);
  background: var(--td-bg-color-container);
  flex-shrink: 0;
  position: relative;
  z-index: 300;
}

.app__brand {
  font-size: 16px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.app__nav {
  display: flex;
  gap: 4px;
}

.app__nav-btn {
  padding: 6px 16px;
  font-size: 13px;
  border: none;
  border-radius: var(--td-radius-small);
  background: transparent;
  color: var(--td-text-color-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.app__nav-btn:hover {
  background: var(--td-bg-color-container-hover);
  color: var(--td-text-color-primary);
}

.app__nav-btn--active {
  background: var(--td-brand-color-light);
  color: var(--td-brand-color);
  font-weight: 500;
}

.app__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
