<script setup lang="ts">
import { nextTick, onMounted, ref, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { compileInteractiveExample } from '../modules/logic/compileInteractiveExample'
import { loadEditorPreviewSession } from '../modules/editor/editorPreviewSession'
import {
  buildImportMapFromStore,
  collectComponentTags,
  defaultImportPath,
  extractTemplateInner,
  syncPreviewStyleSheet,
} from '../modules/editor/componentFile'
import { loadComponentFiles } from '../modules/editor/componentFileStore'
import { buildPreviewRegistryFromStore, setPreviewRegistry } from '../modules/editor/livePreview'
import {
  libraryComponents,
  refreshLibraryComponents,
} from '../modules/library/useLibraryComponents'

const router = useRouter()
const previewComp = shallowRef<object | null>(null)
const previewRoot = ref<HTMLElement | null>(null)
const previewCode = ref('')
const compileError = ref<string | null>(null)
const filename = ref('untitled.vue')
const loading = ref(true)

function libraryFiles() {
  return libraryComponents.value.length > 0 ? libraryComponents.value : loadComponentFiles()
}

function rebuildPreview() {
  loading.value = true
  compileError.value = null

  syncPreviewRegistry()
  const session = loadEditorPreviewSession()
  filename.value = session.filename

  const importMap = buildImportMapFromStore(libraryFiles(), session.componentCode)
  const inner = extractTemplateInner(session.componentCode) ?? ''
  const componentImports = collectComponentTags(inner).map((tag) => ({
    tag,
    path: defaultImportPath(tag, importMap),
  }))

  const { component, error } = compileInteractiveExample(
    session.componentCode,
    session.logic,
    componentImports,
  )

  previewCode.value = session.componentCode
  previewComp.value = component
  compileError.value = error
  loading.value = false
  nextTick(() => syncPreviewStyleSheet(previewCode.value, previewRoot.value))
}

watch([previewComp, previewCode, previewRoot], () => {
  nextTick(() => syncPreviewStyleSheet(previewCode.value, previewRoot.value))
})

function syncPreviewRegistry() {
  setPreviewRegistry(buildPreviewRegistryFromStore(libraryFiles()))
}

function backToEditor() {
  void router.push({ path: '/editor' })
}

onMounted(async () => {
  await refreshLibraryComponents()
  rebuildPreview()
})
</script>

<template>
  <div class="preview-page">
    <header class="preview-page__head">
      <button type="button" class="preview-page__back" @click="backToEditor">← 返回画板</button>
      <div class="preview-page__title-wrap">
        <h1 class="preview-page__title">组件示例</h1>
        <span class="preview-page__file">{{ filename }}</span>
      </div>
      <button type="button" class="preview-page__refresh" @click="rebuildPreview">刷新</button>
    </header>

    <p class="preview-page__hint">
      合并 template 绑定与逻辑块生成的 script · 可点击、输入，与导出效果一致
    </p>

    <div v-if="compileError" class="preview-page__error">
      编译失败：{{ compileError }}
    </div>

    <main class="preview-page__stage">
      <div v-if="loading" class="preview-page__loading">加载中…</div>
      <div v-else-if="previewComp" ref="previewRoot" class="preview-page__demo">
        <component :is="previewComp" />
      </div>
      <p v-else class="preview-page__empty">暂无预览内容</p>
    </main>
  </div>
</template>

<style scoped>
.preview-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--td-bg-color-page);
}

.preview-page__head {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--td-component-border);
  background: var(--td-bg-color-container);
  flex-shrink: 0;
}

.preview-page__back,
.preview-page__refresh {
  border: 1px solid var(--td-component-border);
  background: var(--td-bg-color-container);
  color: var(--td-text-color-primary);
  border-radius: 8px;
  padding: 7px 12px;
  font-size: 13px;
  cursor: pointer;
  flex-shrink: 0;
}

.preview-page__back:hover,
.preview-page__refresh:hover {
  border-color: var(--td-brand-color);
  color: var(--td-brand-color);
}

.preview-page__title-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.preview-page__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.preview-page__file {
  font-size: 12px;
  color: var(--td-text-color-placeholder);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.preview-page__hint {
  margin: 0;
  padding: 8px 20px;
  font-size: 12px;
  color: var(--td-text-color-secondary);
  background: var(--td-bg-color-secondarycontainer);
  border-bottom: 1px solid var(--td-component-border);
  flex-shrink: 0;
}

.preview-page__error {
  margin: 12px 20px 0;
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--td-error-color);
  background: var(--td-error-color-1);
  border: 1px solid var(--td-error-color-3);
  border-radius: 8px;
  flex-shrink: 0;
}

.preview-page__stage {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 32px;
  background-color: var(--td-bg-color-page);
  background-image:
    linear-gradient(rgba(0, 0, 0, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.04) 1px, transparent 1px);
  background-size: 20px 20px;
}

.preview-page__loading,
.preview-page__empty {
  font-size: 14px;
  color: var(--td-text-color-placeholder);
}

.preview-page__demo {
  width: fit-content;
  max-width: min(960px, 100%);
  padding: 24px;
  border-radius: 12px;
  background: var(--td-bg-color-container);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.04);
}
</style>
