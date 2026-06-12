<script setup lang="ts">
import { computed, ref } from 'vue'
import GlobalThemeUsagePanel from './GlobalThemeUsagePanel.vue'
import ThemeMotionSlotsPreview from './ThemeMotionSlotsPreview.vue'
import UsageSpecSettingsPanel from './UsageSpecSettingsPanel.vue'
import ComponentSpecHeader from './ComponentSpecHeader.vue'
import ComponentSpecPreview from './ComponentSpecPreview.vue'
import ButtonSpecMatrix, { type ButtonMatrixSelection } from './ButtonSpecMatrix.vue'
import {
  COMPONENT_THEME_REGISTRY,
  type ComponentThemeId,
} from '../tokens/componentThemeBindingDefs'
import {
  presetPropertiesToInlineStyle,
  type StylePreset,
} from '../tokens/stylePresetDefs'
import { getStylePresetById } from '../tokens/stylePresetStore'
import { themeUsageState } from '../tokens/themeUsageStore'
import {
  radiusTokenCssVar,
  shadowLevelCssVar,
} from '../tokens/themeUsageDefs'

const editingComponentId = ref<ComponentThemeId | null>(null)
const buttonMatrixSelection = ref<ButtonMatrixSelection | null>(null)

function presetStyle(preset: StylePreset): Record<string, string> {
  return presetPropertiesToInlineStyle(preset.properties)
}

function presetStyleById(id: string): Record<string, string> {
  const preset = getStylePresetById(id)
  return preset ? presetStyle(preset) : {}
}

const headlineFontStyle = computed(() => presetStyleById(themeUsageState.headlineFontPresetId))
const titleFontStyle = computed(() => presetStyleById(themeUsageState.titleFontPresetId))
const bodyFontStyle = computed(() => presetStyleById(themeUsageState.bodyFontPresetId))
const captionFontStyle = computed(() => presetStyleById(themeUsageState.captionFontPresetId))

const cardEffectStyle = computed(() => ({
  ...presetStyleById(themeUsageState.cardEffectPresetId),
  borderRadius: `var(${radiusTokenCssVar(themeUsageState.cardRadiusToken)})`,
  boxShadow: `var(${shadowLevelCssVar(themeUsageState.cardShadowLevel)})`,
}))

function openEditor(id: ComponentThemeId) {
  editingComponentId.value = id
}

function onButtonMatrixSelect(sel: ButtonMatrixSelection) {
  buttonMatrixSelection.value = sel
  editingComponentId.value = 'button'
}

const emit = defineEmits<{
  openRules: []
}>()
</script>

<template>
  <div class="usage-layout">
    <div class="usage-layout__banner">
      <p>
        本页为<strong>过渡</strong>中的旧版组件 binding 预览。语义色、错误边、禁用效果已在定义层全库统一；
        新规范请在侧栏 <strong>使用规则</strong> 配置场景、区间与项目默认槽。
      </p>
      <button type="button" class="usage-layout__banner-btn" @click="emit('openRules')">
        前往使用规则 →
      </button>
    </div>

    <div class="usage-layout__body">
    <div class="usage-layout__preview usage-spec">
      <section
        v-for="(meta, index) in COMPONENT_THEME_REGISTRY"
        :key="meta.id"
        class="usage-spec__component"
      >
        <ComponentSpecHeader
          :index="index + 1"
          :title="meta.label"
          :active="editingComponentId === meta.id"
          @edit="openEditor(meta.id)"
        />
        <ButtonSpecMatrix
          v-if="meta.id === 'button'"
          :selected="buttonMatrixSelection"
          @select="onButtonMatrixSelect"
        />
        <ComponentSpecPreview
          v-else
          :component-id="meta.id"
          :card-style="meta.id === 'card' ? cardEffectStyle : undefined"
        />
      </section>

      <section class="usage-spec__component">
        <ComponentSpecHeader title="Typography 文本" :editable="false" />
        <p class="usage-spec__hint">字体槽位在右侧「全局默认 · 字体格式」中配置。</p>
        <div class="usage-spec__card" :style="cardEffectStyle">
          <h2 class="usage-spec__h2" :style="headlineFontStyle">大标题示例</h2>
          <h3 class="usage-spec__h3" :style="titleFontStyle">标题示例</h3>
          <p class="usage-spec__body" :style="bodyFontStyle">正文示例</p>
          <p class="usage-spec__small" :style="captionFontStyle">辅助说明</p>
        </div>
      </section>

      <ThemeMotionSlotsPreview />
    </div>

    <aside class="usage-layout__settings">
      <GlobalThemeUsagePanel />

      <UsageSpecSettingsPanel
        v-if="editingComponentId"
        :component-id="editingComponentId"
        :button-focus="buttonMatrixSelection"
      />

      <p v-else class="usage-layout__aside-hint">
        点击左侧组件「编辑 »」或 Button 矩阵格，配置<strong>组件级</strong> binding（块 A / 块 B）。
        全局字体 / 效果 / 动效 / 圆角槽位已在上方设置。
      </p>
    </aside>
    </div>
  </div>
</template>

<style scoped>
.usage-layout {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 0 -32px -24px;
  min-height: calc(100vh - 140px);
}

.usage-layout__banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 32px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--td-text-color-secondary);
  background: color-mix(in srgb, var(--td-warning-color) 10%, var(--td-bg-color-secondarycontainer));
  border-bottom: 1px solid color-mix(in srgb, var(--td-warning-color) 25%, var(--td-component-border));
}

.usage-layout__banner p {
  margin: 0;
  flex: 1;
}

.usage-layout__banner-btn {
  flex-shrink: 0;
  padding: 6px 12px;
  font-size: 12px;
  border: 1px solid var(--td-brand-color);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-container);
  color: var(--td-brand-color);
  cursor: pointer;
}

.usage-layout__banner-btn:hover {
  background: var(--td-brand-color-light);
}

.usage-layout__body {
  display: flex;
  flex: 1;
  min-height: 0;
}

.usage-layout__preview {
  flex: 1;
  min-width: 0;
  padding: 0 24px 24px 32px;
  overflow: auto;
}

.usage-layout__settings {
  width: 400px;
  flex-shrink: 0;
  padding: 0 32px 24px 24px;
  border-left: 1px solid var(--td-component-border);
  background: var(--td-bg-color-secondarycontainer);
  overflow: auto;
  position: sticky;
  top: 0;
  align-self: flex-start;
  max-height: calc(100vh - 140px);
}

.usage-spec {
  display: flex;
  flex-direction: column;
  gap: 40px;
  max-width: 100%;
}

.usage-spec__component {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.usage-spec__hint {
  margin: 0;
  font-size: 12px;
  color: var(--td-text-color-placeholder);
}

.usage-spec__card {
  padding: 16px 20px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-medium);
  background: var(--td-bg-color-container);
}

.usage-layout__aside-hint {
  margin: 16px 0 0;
  padding: 12px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--td-text-color-secondary);
  border: 1px dashed var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-container);
}

.usage-spec__h2 { margin: 0 0 6px; font-size: 24px; font-weight: 700; }
.usage-spec__h3 { margin: 0 0 8px; font-size: 20px; font-weight: 600; }
.usage-spec__body { margin: 0 0 6px; font-size: 14px; line-height: 1.6; }
.usage-spec__small { margin: 0; font-size: 12px; color: var(--td-text-color-secondary); }
</style>
