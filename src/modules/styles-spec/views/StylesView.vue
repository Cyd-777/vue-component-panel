<script setup lang="ts">
/**
 * 全局样式规范页壳 — Tab 路由与内容区。
 * 功能逻辑与 Tab 职责见 ../STYLES_SPEC.md
 */
import { computed, ref, watch } from 'vue'
import ColorPaletteMatrix from './ColorPaletteMatrix.vue'
import DimensionSpecPanel from './DimensionSpecPanel.vue'
import UsageSpecPanel from './UsageSpecPanel.vue'
import UsageRulesPanel from './UsageRulesPanel.vue'
import type { UsageRuleEditTab } from '../tokens/usageRulesDefs'
import CssVariableCatalogPanel from './CssVariableCatalogPanel.vue'
import IconCatalogPanel from './IconCatalogPanel.vue'
import WcagContrastPanel from './WcagContrastPanel.vue'
import StyleEditorPanel from './StyleEditorPanel.vue'
import {
  STYLE_PRESET_CATEGORY_LABELS,
  presetPropertiesToInlineStyle,
  type StylePreset,
  type StylePresetCategory,
} from '../tokens/stylePresetDefs'
import { groupFontPresets } from '../tokens/fontPresetCatalog'
import { groupMotionPresets, motionPresetPreviewLabel, motionPresetTriggerPseudo } from '../tokens/motionPresetCatalog'
import { effectPresetPreviewLabel, groupEffectPresets } from '../tokens/effectPresetCatalog'
import { getPresetsByCategory, presetReferenceToken } from '../tokens/stylePresetStore'
import { formatMotionPresetSummary, resolveHoverTransform, MOTION_HOVER_TRANSFORM_KEY } from '../tokens/motionPresetOptions'
import { readVisualEffectFromPreset, visualEffectSummary } from '../tokens/visualEffectConfig'

type StyleTab = 'colors' | 'dimensions' | 'fonts' | 'effects' | 'motion' | 'wcag' | 'rules' | 'usage' | 'variables' | 'icons'

const activeTab = ref<StyleTab>(
  (typeof sessionStorage !== 'undefined'
    && (sessionStorage.getItem('flow-styles-tab') as StyleTab | null))
  || 'colors',
)

watch(activeTab, (tab) => {
  try {
    sessionStorage.setItem('flow-styles-tab', tab)
  } catch {
    /* ignore */
  }
})

const tabs: { value: StyleTab; label: string; deprecated?: boolean }[] = [
  { value: 'colors', label: '项目色板' },
  { value: 'dimensions', label: '间距尺寸' },
  { value: 'fonts', label: '字体格式' },
  { value: 'effects', label: '效果' },
  { value: 'motion', label: '动效' },
  { value: 'wcag', label: '色彩规则' },
  { value: 'rules', label: '使用规则' },
  { value: 'variables', label: 'CSS 变量' },
  { value: 'usage', label: '设置', deprecated: true },
  { value: 'icons', label: 'Icon' },
]

const editorOpen = ref(false)
const editorCategory = ref<StylePresetCategory | null>(null)
const editorPresetId = ref<string | null>(null)

const tabMeta: Record<StyleTab, { title: string; hint: string }> = {
  colors: {
    title: '项目色板',
    hint: '功能色阶与 primary 倾向中性色，项目色彩基础定义。',
  },
  dimensions: {
    title: '间距尺寸',
    hint: '间距、圆角、布局内边距与区块间距；滑动条按基数单位整数倍取值，显示实际 px。',
  },
  wcag: {
    title: '色彩规则',
    hint: '系统色彩规则检测：以视觉感知为基线，校验组件用法并规避视错觉；传统 WCAG 仅作参考。',
  },
  rules: {
    title: '使用规则',
    hint: '场景条文、动效区间、语义用法与组合约束；项目默认槽在此配置。画板可 override，超出区间时提示。',
  },
  usage: {
    title: '设置',
    hint: '【过渡】旧版组件 binding 预览；新规范请使用「使用规则」。本页仍可进入对照。',
  },
  variables: {
    title: 'CSS 变量清单',
    hint: '项目登记的全部 CSS 变量、:root 当前值与筛选；可跳转至对应编辑 Tab。',
  },
  fonts: {
    title: '字体格式',
    hint: '项目必备字体命名集合（展示/标题 H1–H6 / 正文 / 辅助 / 链接代码 / 控件）。可编辑数值，供主题与画板引用。',
  },
  icons: { title: 'Icon', hint: '自动扫描项目内图标文件（assets/icons、assets/editor），展示格式与名称。' },
  effects: {
    title: '效果',
    hint: '按三梯队展示示例卡片：全局绑定 card/popup/control + 阴影/毛玻璃/渐变/头像等 VisualEffectConfig 预设。',
  },
  motion: {
    title: '动效样式',
    hint: '按交互态与显隐过渡分组；在「使用规则」配置全局槽位与时长区间。',
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

const fontPresetGroups = computed(() => {
  if (activeTab.value !== 'fonts') return []
  return groupFontPresets(getPresetsByCategory('font'))
})

const motionPresetGroups = computed(() => {
  if (activeTab.value !== 'motion') return []
  return groupMotionPresets(getPresetsByCategory('motion'))
})

const effectPresetGroups = computed(() => {
  if (activeTab.value !== 'effects') return []
  return groupEffectPresets(getPresetsByCategory('effect'))
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

function navigateFromCatalog(tab: 'colors' | 'dimensions' | 'fonts' | 'effects' | 'motion' | 'rules') {
  activeTab.value = tab
}

function navigateFromRules(tab: UsageRuleEditTab) {
  if (tab === 'wcag') {
    activeTab.value = 'wcag'
    return
  }
  activeTab.value = tab
}

watch(activeTab, () => closeStyleEditor())

function presetPreviewStyle(preset: StylePreset): Record<string, string> {
  const base = presetPropertiesToInlineStyle(preset.properties)
  if (preset.category !== 'motion') return base
  return {
    ...base,
    '--motion-card-hover-transform': resolveHoverTransform(preset.properties[MOTION_HOVER_TRANSFORM_KEY]),
  }
}

function motionPresetSummary(preset: StylePreset): string {
  return formatMotionPresetSummary(preset.properties)
}

function effectPresetSummary(preset: StylePreset): string {
  return visualEffectSummary(readVisualEffectFromPreset(preset))
}

function effectPreviewBackdropStyle(preset: StylePreset): Record<string, string> {
  const cfg = readVisualEffectFromPreset(preset)
  if (cfg.backdropBlur <= 0) return {}
  return {
    backgroundImage: 'linear-gradient(135deg, var(--td-brand-color) 0%, var(--td-warning-color) 100%)',
    padding: '8px',
    borderRadius: 'var(--td-radius-medium)',
  }
}
</script>

<template>
  <div class="styles">
    <aside class="styles__side">
      <nav class="styles__nav">
        <button
          v-for="t in tabs"
          :key="t.value"
          type="button"
          class="styles__nav-btn"
          :class="{
            'styles__nav-btn--active': activeTab === t.value,
            'styles__nav-btn--deprecated': t.deprecated,
          }"
          @click="activeTab = t.value"
        >
          {{ t.label }}
          <span v-if="t.deprecated" class="styles__nav-tag">旧</span>
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

        <header
          v-else-if="activeTab !== 'usage' && activeTab !== 'rules'"
          class="styles__page-head styles__page-head--plain"
        >
          <div>
            <h2 class="styles__page-title">{{ tabMeta[activeTab].title }}</h2>
            <p class="styles__page-hint">{{ tabMeta[activeTab].hint }}</p>
          </div>
        </header>

        <header v-else-if="activeTab === 'rules'" class="styles__page-head styles__page-head--plain">
          <div>
            <h2 class="styles__page-title">{{ tabMeta.rules.title }}</h2>
            <p class="styles__page-hint">{{ tabMeta.rules.hint }}</p>
          </div>
        </header>

        <header v-else class="styles__page-head styles__page-head--plain">
          <div>
            <h2 class="styles__page-title">{{ tabMeta.usage.title }}</h2>
            <p class="styles__page-hint">{{ tabMeta.usage.hint }}</p>
          </div>
        </header>

        <!-- 项目色板 -->
        <ColorPaletteMatrix v-if="activeTab === 'colors'" />

        <!-- 尺寸尺度 -->
        <DimensionSpecPanel v-else-if="activeTab === 'dimensions'" />

        <!-- WCAG -->
        <WcagContrastPanel v-else-if="activeTab === 'wcag'" />

        <!-- CSS 变量清单 -->
        <CssVariableCatalogPanel
          v-else-if="activeTab === 'variables'"
          @navigate-tab="navigateFromCatalog"
        />

        <!-- 使用规则 -->
        <UsageRulesPanel
          v-else-if="activeTab === 'rules'"
          @navigate-tab="navigateFromRules"
        />

        <!-- 设置（过渡） -->
        <UsageSpecPanel v-else-if="activeTab === 'usage'" @open-rules="activeTab = 'rules'" />

        <!-- Icon -->
        <IconCatalogPanel v-else-if="activeTab === 'icons'" />

        <!-- 命名样式列表 -->
        <div v-else-if="tabPresetCategory(activeTab)" class="styles__browse">
          <section class="styles__group">
            <h3 class="styles__group-title">
              {{ STYLE_PRESET_CATEGORY_LABELS[tabPresetCategory(activeTab)!] }}
            </h3>

            <p v-if="!categoryPresets.length" class="styles__empty">
              暂无样式。点击「+ 新建样式」组合属性并命名。
            </p>

            <template v-else-if="activeTab === 'fonts'">
              <section
                v-for="{ group, presets } in fontPresetGroups"
                :key="group.id"
                class="styles__font-group"
              >
                <header class="styles__font-group-head">
                  <h4 class="styles__font-group-title">{{ group.label }}</h4>
                  <p class="styles__font-group-desc">{{ group.description }}</p>
                </header>
                <div class="styles__preset-list styles__preset-list--font">
                  <button
                    v-for="preset in presets"
                    :key="preset.id"
                    type="button"
                    class="styles__preset-card styles__preset-card--font"
                    @click="openEditStyle(preset.id)"
                  >
                    <p class="styles__font-sample" :style="presetPreviewStyle(preset)">
                      {{ preset.name }}
                    </p>
                    <code class="styles__font-var">{{ presetReferenceToken(preset.id) }}</code>
                  </button>
                </div>
              </section>
            </template>

            <template v-else-if="activeTab === 'effects'">
              <section
                v-for="{ group, presets } in effectPresetGroups"
                :key="group.id"
                class="styles__font-group"
              >
                <header class="styles__font-group-head">
                  <h4 class="styles__font-group-title">{{ group.label }}</h4>
                  <p class="styles__font-group-desc">{{ group.description }}</p>
                </header>
                <div class="styles__preset-list styles__preset-list--font">
                  <button
                    v-for="preset in presets"
                    :key="preset.id"
                    type="button"
                    class="styles__preset-card"
                    @click="openEditStyle(preset.id)"
                  >
                    <div
                      class="styles__effect-preview-wrap"
                      :style="effectPreviewBackdropStyle(preset)"
                    >
                      <div
                        class="styles__preset-preview styles__preset-preview--effect"
                        :class="`flow-style-${preset.id}`"
                        :style="presetPreviewStyle(preset)"
                      >
                        <span class="styles__preset-effect-label">{{ effectPresetPreviewLabel(preset.id) }}</span>
                      </div>
                    </div>
                    <span class="styles__font-name">{{ preset.name }}</span>
                    <p class="styles__preset-motion-summary">{{ effectPresetSummary(preset) }}</p>
                    <code class="styles__font-var">{{ presetReferenceToken(preset.id) }}</code>
                  </button>
                </div>
              </section>
            </template>

            <template v-else-if="activeTab === 'motion'">
              <section
                v-for="{ group, presets } in motionPresetGroups"
                :key="group.id"
                class="styles__font-group"
              >
                <header class="styles__font-group-head">
                  <h4 class="styles__font-group-title">{{ group.label }}</h4>
                  <p class="styles__font-group-desc">{{ group.description }}</p>
                </header>
                <div class="styles__preset-list styles__preset-list--font">
                  <button
                    v-for="preset in presets"
                    :key="preset.id"
                    type="button"
                    class="styles__preset-card"
                    @click="openEditStyle(preset.id)"
                  >
                    <div
                      v-if="motionPresetTriggerPseudo(preset.id)"
                      class="styles__preset-preview styles__preset-preview--motion"
                    >
                      <span
                        class="styles__preset-motion-label"
                        :class="`flow-style-${preset.id}`"
                      >
                        {{ motionPresetPreviewLabel(preset.id) }}
                      </span>
                    </div>
                    <div
                      v-else
                      class="styles__preset-preview styles__preset-preview--motion styles__preset-preview--lifecycle"
                      :style="presetPreviewStyle(preset)"
                    >
                      <span class="styles__preset-motion-label">{{ motionPresetPreviewLabel(preset.id) }}</span>
                    </div>
                    <span class="styles__font-name">{{ preset.name }}</span>
                    <p class="styles__preset-motion-summary">{{ motionPresetSummary(preset) }}</p>
                    <code class="styles__font-var">{{ presetReferenceToken(preset.id) }}</code>
                  </button>
                </div>
              </section>
            </template>

            <div v-else-if="activeTab !== 'effects' && activeTab !== 'motion'" class="styles__preset-list">
              <button
                v-for="preset in categoryPresets"
                :key="preset.id"
                type="button"
                class="styles__preset-card"
                @click="openEditStyle(preset.id)"
              >
                <div
                  class="styles__preset-preview"
                  :class="`styles__preset-preview--${preset.category}`"
                  :style="presetPreviewStyle(preset)"
                >
                  <template v-if="preset.category === 'effect'">样式预览</template>
                </div>
                <span class="styles__font-name">{{ preset.name }}</span>
                <p v-if="preset.category === 'effect'" class="styles__preset-motion-summary">{{ effectPresetSummary(preset) }}</p>
                <code class="styles__font-var">{{ presetReferenceToken(preset.id) }}</code>
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

.styles__nav-btn--deprecated {
  color: var(--td-text-color-placeholder);
  opacity: 0.78;
}

.styles__nav-btn--deprecated:hover {
  color: var(--td-text-color-secondary);
  opacity: 1;
}

.styles__nav-btn--deprecated.styles__nav-btn--active {
  color: var(--td-text-color-secondary);
  background: var(--td-bg-color-secondarycontainer);
  border-right-color: var(--td-text-color-placeholder);
  font-weight: 500;
}

.styles__nav-tag {
  margin-left: 6px;
  padding: 0 4px;
  font-size: 9px;
  font-weight: 500;
  line-height: 14px;
  border-radius: 3px;
  color: var(--td-text-color-placeholder);
  background: var(--td-bg-color-component-disabled);
  vertical-align: middle;
}

.styles__nav-btn--active .styles__nav-tag {
  color: var(--td-text-color-secondary);
}

.styles__main {
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: auto;
  background: #fff;
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

.styles__font-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 28px;
}

.styles__font-group:last-child {
  margin-bottom: 0;
}

.styles__font-group-head {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.styles__font-group-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.styles__font-group-desc {
  margin: 0;
  font-size: 11px;
  line-height: 1.4;
  color: var(--td-text-color-placeholder);
}

.styles__font-var {
  display: block;
  margin: 0;
  padding: 8px 12px 10px;
  font-size: 10px;
  color: var(--td-text-color-placeholder);
  font-family: ui-monospace, monospace;
  line-height: 1.3;
  word-break: break-all;
  background: var(--td-bg-color-secondarycontainer);
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

.styles__effect-preview-wrap {
  width: 100%;
}

.styles__preset-preview--effect {
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--td-text-color-secondary);
}

.styles__preset-effect-label {
  font-size: 12px;
  font-weight: 600;
  color: inherit;
}

.styles__preset-preview--motion {
  width: fit-content;
  min-width: 120px;
  cursor: default;
}

.styles__preset-preview--motion:hover {
  border-color: var(--td-brand-color);
  transform: var(--motion-card-hover-transform, translateY(-2px));
  box-shadow: var(--td-shadow-2);
}

.styles__preset-motion-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.styles__preset-motion-summary {
  margin: 0;
  font-size: 11px;
  line-height: 1.4;
  color: var(--td-text-color-secondary);
}
</style>
