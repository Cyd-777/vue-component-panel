<script setup lang="ts">
import { computed } from 'vue'
import {
  EFFECT_TYPE_LABELS,
  motionEffectDisplayFromPreset,
  readEffectConfigFromPreset,
  type TriggerType,
} from '../tokens/effectConfig'
import { getPresetsByCategory, getStylePresetById } from '../tokens/stylePresetStore'
import {
  RADIUS_TOKEN_OPTIONS,
  SHADOW_LEVEL_OPTIONS,
  THEME_USAGE_SECTIONS,
  type ThemePresetFieldDef,
  type ThemeUsageSettings,
} from '../tokens/themeUsageDefs'
import { setThemeUsage, themeUsageState } from '../tokens/themeUsageStore'
import MotionEffectSummary from './MotionEffectSummary.vue'

const props = defineProps<{
  compact?: boolean
}>()

const MOTION_FIELD_TRIGGER: Partial<Record<keyof ThemeUsageSettings, TriggerType>> = {
  hoverMotionPresetId: 'hover',
  activeMotionPresetId: 'active',
  focusMotionPresetId: 'focus',
  enterMotionPresetId: 'enter',
  exitMotionPresetId: 'exit',
  expandMotionPresetId: 'expand',
}

function presetsForCategory(category: ThemePresetFieldDef['category']) {
  return getPresetsByCategory(category)
}

function presetValue(key: keyof ThemeUsageSettings): string {
  return themeUsageState[key] as string
}

function onPresetChange(key: keyof ThemeUsageSettings, raw: string) {
  setThemeUsage(key, raw)
}

function onShadowChange(raw: string) {
  setThemeUsage('cardShadowLevel', raw as ThemeUsageSettings['cardShadowLevel'])
}

function motionFieldDisplay(key: keyof ThemeUsageSettings, presetId: string) {
  if (!presetId) return null
  const preset = getStylePresetById(presetId)
  if (!preset) return null
  return motionEffectDisplayFromPreset(preset, MOTION_FIELD_TRIGGER[key])
}

function motionPresetOptionLabel(presetId: string): string {
  const preset = getStylePresetById(presetId)
  if (!preset) return presetId
  const fx = readEffectConfigFromPreset(preset)
  return `${preset.name} · ${EFFECT_TYPE_LABELS[fx.effectType]}`
}

function isMotionSection(sectionId: string): boolean {
  return sectionId === 'motion-interaction' || sectionId === 'motion-lifecycle'
}

const sections = computed(() => THEME_USAGE_SECTIONS)
</script>

<template>
  <div class="global-theme" :class="{ 'global-theme--compact': compact }">
    <header v-if="!compact" class="global-theme__head">
      <h3 class="global-theme__title">全局默认</h3>
      <p class="global-theme__intro">
        定义层命名样式与尺寸 token 的<strong>语义槽位</strong>。组件 binding 未单独指定时继承此处；
        色板颜色自动全局生效，不在此绑。
      </p>
    </header>

    <section
      v-for="section in sections"
      :key="section.id"
      class="global-theme__block"
    >
      <header class="global-theme__block-head">
        <h4 class="global-theme__block-title">
          {{ section.title }}
          <span v-if="isMotionSection(section.id)" class="global-theme__badge">EffectConfig</span>
        </h4>
        <p class="global-theme__block-desc">{{ section.description }}</p>
      </header>

      <template v-if="section.presetFields">
        <label
          v-for="field in section.presetFields"
          :key="field.key"
          class="global-theme__field"
        >
          <span class="global-theme__field-label">
            {{ field.label }}
            <span class="global-theme__field-hint">{{ field.hint }}</span>
          </span>
          <select
            v-if="presetsForCategory(field.category).length"
            class="global-theme__select"
            :value="presetValue(field.key)"
            @change="onPresetChange(field.key, ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="p in presetsForCategory(field.category)" :key="p.id" :value="p.id">
              {{ field.category === 'motion' ? motionPresetOptionLabel(p.id) : p.name }}
            </option>
          </select>
          <p v-else class="global-theme__empty">{{ field.empty }}</p>
          <MotionEffectSummary
            v-if="field.category === 'motion' && motionFieldDisplay(field.key, presetValue(field.key))"
            :display="motionFieldDisplay(field.key, presetValue(field.key))!"
            :compact="compact"
          />
        </label>
      </template>

      <template v-if="section.tokenFields">
        <label
          v-for="field in section.tokenFields"
          :key="field.key"
          class="global-theme__field"
        >
          <span class="global-theme__field-label">
            {{ field.label }}
            <span class="global-theme__field-hint">{{ field.hint }}</span>
          </span>
          <select
            v-if="field.kind === 'radius'"
            class="global-theme__select"
            :value="themeUsageState[field.key]"
            @change="
              setThemeUsage(
                field.key,
                ($event.target as HTMLSelectElement).value as ThemeUsageSettings['cardRadiusToken'],
              )
            "
          >
            <option v-for="opt in RADIUS_TOKEN_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
          <select
            v-else-if="field.kind === 'shadow'"
            class="global-theme__select"
            :value="themeUsageState.cardShadowLevel"
            @change="onShadowChange(($event.target as HTMLSelectElement).value)"
          >
            <option v-for="opt in SHADOW_LEVEL_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </label>
      </template>
    </section>
  </div>
</template>

<style scoped>
.global-theme {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.global-theme--compact {
  gap: 12px;
}

.global-theme__head {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.global-theme__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.global-theme__intro {
  margin: 0;
  font-size: 11px;
  line-height: 1.45;
  color: var(--td-text-color-secondary);
}

.global-theme__block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--td-component-border);
}

.global-theme__block:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.global-theme__block-head {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.global-theme__block-title {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.global-theme__badge {
  padding: 1px 6px;
  font-size: 9px;
  font-weight: 500;
  border-radius: 999px;
  color: var(--td-brand-color);
  background: var(--td-brand-color-light);
  border: 1px solid color-mix(in srgb, var(--td-brand-color) 25%, transparent);
}

.global-theme__block-desc {
  margin: 0;
  font-size: 10px;
  line-height: 1.4;
  color: var(--td-text-color-placeholder);
}

.global-theme__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.global-theme__field-label {
  display: flex;
  flex-direction: column;
  gap: 1px;
  font-size: 10px;
  font-weight: 500;
  color: var(--td-text-color-secondary);
}

.global-theme__field-hint {
  font-weight: 400;
  color: var(--td-text-color-placeholder);
}

.global-theme__select {
  width: 100%;
  height: 30px;
  padding: 0 8px;
  font-size: 11px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-container);
}

.global-theme__empty {
  margin: 0;
  font-size: 10px;
  color: var(--td-text-color-placeholder);
}

.global-theme__summary {
  margin: 0;
  font-size: 10px;
  line-height: 1.35;
  color: var(--td-text-color-placeholder);
}
</style>
