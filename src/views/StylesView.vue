<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ColorPaletteMatrix from './ColorPaletteMatrix.vue'
import StyleEditorPanel from './StyleEditorPanel.vue'
import {
  STYLE_PRESET_CATEGORY_LABELS,
  presetPropertiesToInlineStyle,
  type StylePreset,
  type StylePresetCategory,
} from '../tokens/stylePresetDefs'
import { getPresetsByCategory } from '../tokens/stylePresetStore'

type StyleTab = 'colors' | 'fonts' | 'icons' | 'effects' | 'motion'

const activeTab = ref<StyleTab>('colors')

const tabs: { value: StyleTab; label: string }[] = [
  { value: 'colors', label: '色板' },
  { value: 'fonts', label: '字体' },
  { value: 'icons', label: 'Icon' },
  { value: 'effects', label: '样式' },
  { value: 'motion', label: '动效' },
]

const editorOpen = ref(false)
const editorCategory = ref<StylePresetCategory | null>(null)
const editorPresetId = ref<string | null>(null)

const tabMeta: Record<StyleTab, { title: string; hint: string }> = {
  colors: {
    title: '色板',
    hint: '固定色板矩阵：核心色已预设，其余色块为空时可点击设置；清除后恢复自动生成。',
  },
  fonts: {
    title: '字体样式',
    hint: '创建命名文本样式（如正文、标题），组合字号/字重/行高等属性，供画板引用。',
  },
  icons: { title: 'Icon', hint: 'TDesign 图标库预览。' },
  effects: {
    title: '视觉样式',
    hint: '创建命名视觉样式（圆角、阴影、描边等组合），供画板引用。',
  },
  motion: {
    title: '动效样式',
    hint: '创建命名过渡组合（属性、时长、缓动），供画板引用。',
  },
}

function tabPresetCategory(tab: StyleTab): StylePresetCategory | null {
  if (tab === 'fonts') return 'font'
  if (tab === 'effects') return 'effect'
  if (tab === 'motion') return 'motion'
  return null
}

const showStyleEditorEntry = computed(() => tabPresetCategory(activeTab.value) !== null)

const categoryPresets = computed(() => {
  const category = tabPresetCategory(activeTab.value)
  return category ? getPresetsByCategory(category) : []
})

function openCreateStyle() {
  const category = tabPresetCategory(activeTab.value)
  if (!category) return
  editorCategory.value = category
  editorPresetId.value = null
  editorOpen.value = true
}

function openEditStyle(presetId: string) {
  const category = tabPresetCategory(activeTab.value)
  if (!category) return
  editorCategory.value = category
  editorPresetId.value = presetId
  editorOpen.value = true
}

function closeStyleEditor() {
  editorOpen.value = false
  editorCategory.value = null
  editorPresetId.value = null
}

watch(activeTab, () => closeStyleEditor())

function presetPreviewStyle(preset: StylePreset): Record<string, string> {
  return presetPropertiesToInlineStyle(preset.properties)
}

const iconList = [
  'add', 'close', 'chevron-down', 'chevron-up', 'chevron-left', 'chevron-right',
  'search', 'setting', 'user', 'file', 'folder', 'image', 'video',
  'edit', 'delete', 'copy', 'download', 'upload', 'share',
  'check', 'info-circle', 'warning', 'error-circle',
]
</script>

<template>
  <div class="styles">
    <aside class="styles__side">
      <nav class="styles__nav">
        <button
          v-for="t in tabs"
          :key="t.value"
          class="styles__nav-btn"
          :class="{ 'styles__nav-btn--active': activeTab === t.value }"
          @click="activeTab = t.value"
        >
          {{ t.label }}
        </button>
      </nav>
    </aside>

    <main class="styles__main">
      <div class="styles__content">
        <header v-if="showStyleEditorEntry" class="styles__page-head">
          <div>
            <h2 class="styles__page-title">{{ tabMeta[activeTab].title }}</h2>
            <p class="styles__page-hint">{{ tabMeta[activeTab].hint }}</p>
          </div>
          <button type="button" class="styles__create-btn" @click="openCreateStyle">
            + 新建样式
          </button>
        </header>

        <header v-else class="styles__page-head styles__page-head--plain">
          <div>
            <h2 class="styles__page-title">{{ tabMeta[activeTab].title }}</h2>
            <p class="styles__page-hint">{{ tabMeta[activeTab].hint }}</p>
          </div>
        </header>

        <!-- 色板 -->
        <ColorPaletteMatrix v-if="activeTab === 'colors'" />

        <!-- Icon -->
        <div v-else-if="activeTab === 'icons'" class="styles__grid styles__grid--icons">
          <div v-for="name in iconList" :key="name" class="styles__icon-card">
            <t-icon :name="name" size="24px" />
            <span class="styles__icon-name">{{ name }}</span>
          </div>
        </div>

        <!-- 命名样式列表 -->
        <div v-else class="styles__browse">
          <section class="styles__group">
            <h3 class="styles__group-title">
              {{ STYLE_PRESET_CATEGORY_LABELS[tabPresetCategory(activeTab)!] }}
            </h3>

            <p v-if="!categoryPresets.length" class="styles__empty">
              暂无样式。点击「+ 新建样式」组合属性并命名。
            </p>

            <div
              v-else
              class="styles__preset-list"
              :class="{ 'styles__preset-list--font': activeTab === 'fonts' }"
            >
              <button
                v-for="preset in categoryPresets"
                :key="preset.id"
                type="button"
                class="styles__preset-card"
                :class="{ 'styles__preset-card--font': preset.category === 'font' }"
                @click="openEditStyle(preset.id)"
              >
                <template v-if="preset.category === 'font'">
                  <p class="styles__font-sample" :style="presetPreviewStyle(preset)">
                    示例文字
                  </p>
                  <span class="styles__font-name">{{ preset.name }}</span>
                </template>

                <template v-else>
                  <div
                    class="styles__preset-preview"
                    :class="`styles__preset-preview--${preset.category}`"
                    :style="presetPreviewStyle(preset)"
                  >
                    <template v-if="preset.category === 'effect'">样式预览</template>
                    <template v-else>
                      <span class="styles__preset-motion-label">Hover me</span>
                    </template>
                  </div>
                  <span class="styles__font-name">{{ preset.name }}</span>
                </template>
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>

    <StyleEditorPanel
      v-if="editorOpen && editorCategory"
      :key="`${editorCategory}-${editorPresetId ?? 'new'}`"
      :category="editorCategory"
      :preset-id="editorPresetId"
      @close="closeStyleEditor"
      @saved="closeStyleEditor"
    />
  </div>
</template>

<style scoped>
.styles {
  flex: 1;
  display: flex;
  min-height: 0;
}

.styles__side {
  width: var(--flow-sidebar-width);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--td-component-border);
  background: var(--td-bg-color-container);
  padding: 8px 0;
}

.styles__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.styles__nav-btn {
  padding: 8px 16px;
  font-size: 13px;
  text-align: left;
  border: none;
  background: transparent;
  color: var(--td-text-color-secondary);
  cursor: pointer;
  border-right: 2px solid transparent;
}

.styles__nav-btn:hover {
  background: var(--td-bg-color-container-hover);
  color: var(--td-text-color-primary);
}

.styles__nav-btn--active {
  background: var(--td-brand-color-light);
  color: var(--td-brand-color);
  font-weight: 500;
  border-right-color: var(--td-brand-color);
}

.styles__main {
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: auto;
}

.styles__content {
  min-height: 0;
  padding: 24px 32px;
}

.styles__page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.styles__page-head--plain {
  margin-bottom: 16px;
}

.styles__page-title {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 600;
}

.styles__page-hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--td-text-color-secondary);
}

.styles__create-btn {
  flex-shrink: 0;
  padding: 8px 14px;
  font-size: 13px;
  border: 1px dashed var(--td-brand-color);
  border-radius: var(--td-radius-small);
  background: var(--td-brand-color-light);
  color: var(--td-brand-color);
  cursor: pointer;
}

.styles__create-btn:hover {
  background: color-mix(in srgb, var(--td-brand-color) 12%, var(--td-bg-color-container));
}

.styles__browse {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 960px;
}

.styles__group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.styles__group-title {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 600;
}

.styles__empty {
  margin: 0;
  padding: 24px 16px;
  font-size: 13px;
  color: var(--td-text-color-placeholder);
  border: 1px dashed var(--td-component-border);
  border-radius: var(--td-radius-small);
  text-align: center;
}

.styles__preset-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.styles__preset-list--font {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.styles__preset-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding: 12px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-medium);
  background: var(--td-bg-color-secondarycontainer);
  text-align: left;
  cursor: pointer;
}

.styles__preset-card:hover {
  border-color: var(--td-brand-color);
  background: var(--td-brand-color-light);
}

.styles__preset-card--font {
  padding: 0;
  overflow: hidden;
  gap: 0;
}

.styles__font-sample {
  margin: 0;
  width: 100%;
  box-sizing: border-box;
  padding: 20px 16px;
  background: var(--td-bg-color-container);
}

.styles__font-name {
  display: block;
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--td-text-color-secondary);
}

.styles__preset-card--font .styles__font-name {
  border-top: 1px solid var(--td-component-border);
  background: var(--td-bg-color-secondarycontainer);
}

.styles__preset-preview {
  width: 100%;
  box-sizing: border-box;
  padding: 16px;
  border-radius: var(--td-radius-small);
  border: 1px solid var(--td-component-border);
  background: var(--td-bg-color-container);
}

.styles__preset-preview--effect {
  font-size: 13px;
  color: var(--td-text-color-secondary);
}

.styles__preset-preview--motion {
  width: fit-content;
  min-width: 120px;
  cursor: default;
}

.styles__preset-preview--motion:hover {
  border-color: var(--td-brand-color);
  transform: translateY(-2px);
  box-shadow: var(--td-shadow-2);
}

.styles__preset-motion-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.styles__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.styles__grid--icons {
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
}

.styles__icon-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 8px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
}

.styles__icon-name {
  font-size: 10px;
  color: var(--td-text-color-placeholder);
  text-align: center;
}
</style>
