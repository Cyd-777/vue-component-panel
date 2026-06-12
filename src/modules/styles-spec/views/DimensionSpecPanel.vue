<script setup lang="ts">
import { computed } from 'vue'
import {
  DESIGN_TOKEN_DEFS,
  TOKEN_GROUP_LABELS,
  type DesignTokenDef,
} from '../tokens/designTokenDefs'
import { designTokenState, setDesignToken } from '../tokens/designTokenStore'

const spacingTokenDefs = computed(() =>
  DESIGN_TOKEN_DEFS.filter((d) => d.group === 'spacing' && d.key !== 'spacingUnit'),
)

const radiusTokenDefs = computed(() =>
  DESIGN_TOKEN_DEFS.filter((d) => d.group === 'radius'),
)

const layoutTokenDefs = computed(() =>
  DESIGN_TOKEN_DEFS.filter((d) => d.group === 'layout'),
)

const baseUnitDef = computed(() =>
  DESIGN_TOKEN_DEFS.find((d) => d.key === 'spacingUnit')!,
)

const baseUnit = computed(() => {
  void designTokenState.spacingUnit
  const unit = Number(designTokenState.spacingUnit)
  return Number.isFinite(unit) && unit > 0 ? unit : 4
})

const spacingScale = computed(() => {
  void designTokenState.spacingUnit
  void designTokenState.spacingMd
  void designTokenState.spacingLg
  const unit = baseUnit.value
  const md = Number(designTokenState.spacingMd) || unit * 4
  const lg = Number(designTokenState.spacingLg) || unit * 6
  return [
    { label: '2', px: unit },
    { label: '3', px: unit * 1.5 },
    { label: '4', px: unit * 2 },
    { label: '5', px: unit * 3 },
    { label: '6', px: md },
    { label: '8', px: lg },
  ]
})

function snapToBase(px: number, base: number): number {
  const snapped = Math.round(px / base) * base
  return Math.max(base, snapped)
}

function sliderMultipleBounds(def: DesignTokenDef, base: number) {
  const minPx = def.min ?? base
  const maxPx = def.max ?? base * 16
  const min = Math.max(1, Math.ceil(minPx / base))
  const max = Math.max(min, Math.floor(maxPx / base))
  return { min, max }
}

function pxForDef(def: DesignTokenDef): number {
  void designTokenState[def.key]
  return Number(designTokenState[def.key]) || 0
}

function multipleForDef(def: DesignTokenDef): number {
  return snapToBase(pxForDef(def), baseUnit.value) / baseUnit.value
}

function setTokenPx(def: DesignTokenDef, px: number) {
  setDesignToken(def.key, String(px), def)
}

function onBaseUnitPxChange(px: number) {
  const def = baseUnitDef.value
  const nextBase = Math.max(def.min ?? 2, Math.min(def.max ?? 12, Math.round(px)))
  setTokenPx(def, nextBase)
  resnapAllToBase(nextBase)
}

function resnapAllToBase(base: number) {
  const keys = [
    ...spacingTokenDefs.value,
    ...radiusTokenDefs.value,
    ...layoutTokenDefs.value,
  ]
  for (const def of keys) {
    const minPx = def.min ?? base
    const maxPx = def.max ?? base * 16
    const snapped = snapToBase(pxForDef(def), base)
    const clamped = Math.min(maxPx, Math.max(minPx, snapped))
    setTokenPx(def, clamped)
  }
}

function onMultipleChange(def: DesignTokenDef, multiple: number) {
  const { min, max } = sliderMultipleBounds(def, baseUnit.value)
  const mult = Math.max(min, Math.min(max, Math.round(multiple)))
  setTokenPx(def, mult * baseUnit.value)
}
</script>

<template>
  <div class="dim-spec">
    <p class="dim-spec__intro">
      间距尺寸定义间距、圆角与布局等全局 CSS 变量；滑动条按<strong>基数单位</strong>的整数倍取值，右侧显示实际 px。
    </p>

    <section class="dim-spec__section">
      <h3 class="dim-spec__title">{{ TOKEN_GROUP_LABELS.spacing }}</h3>

      <div class="dim-spec__preview-block">
        <div class="dim-spec__scale-row">
          <div
            v-for="s in spacingScale"
            :key="s.label"
            class="dim-spec__scale-item"
          >
            <div
              class="dim-spec__scale-bar"
              :style="{ width: `${s.px}px`, height: `${s.px}px` }"
            />
            <span class="dim-spec__scale-label">size-{{ s.label }}</span>
            <span class="dim-spec__scale-px">{{ s.px }}px</span>
          </div>
        </div>
      </div>

      <div class="dim-spec__sliders">
        <div class="dim-spec__slider-field dim-spec__slider-field--base">
          <div class="dim-spec__slider-head">
            <span class="dim-spec__field-label">基数单位</span>
            <code class="dim-spec__field-var">{{ baseUnitDef.cssVar }}</code>
            <span class="dim-spec__slider-px">{{ baseUnit }}px</span>
          </div>
          <p v-if="baseUnitDef.description" class="dim-spec__field-desc">
            {{ baseUnitDef.description }}；其余间距滑动条为其整数倍
          </p>
          <t-slider
            class="dim-spec__slider"
            :model-value="baseUnit"
            :min="baseUnitDef.min ?? 2"
            :max="baseUnitDef.max ?? 12"
            :step="1"
            @change="onBaseUnitPxChange"
          />
        </div>

        <div
          v-for="def in spacingTokenDefs"
          :key="def.key"
          class="dim-spec__slider-field"
        >
          <div class="dim-spec__slider-head">
            <span class="dim-spec__field-label">{{ def.label }}</span>
            <code class="dim-spec__field-var">{{ def.cssVar }}</code>
            <span class="dim-spec__slider-px">{{ pxForDef(def) }}px</span>
          </div>
          <p v-if="def.description" class="dim-spec__field-desc">{{ def.description }}</p>
          <t-slider
            class="dim-spec__slider"
            :model-value="multipleForDef(def)"
            :min="sliderMultipleBounds(def, baseUnit).min"
            :max="sliderMultipleBounds(def, baseUnit).max"
            :step="1"
            @change="(v: number) => onMultipleChange(def, v)"
          />
          <span class="dim-spec__slider-mult">
            × {{ baseUnit }}px = {{ pxForDef(def) }}px
          </span>
        </div>
      </div>
    </section>

    <section class="dim-spec__section">
      <h3 class="dim-spec__title">{{ TOKEN_GROUP_LABELS.radius }}</h3>

      <div class="dim-spec__preview-block">
        <div class="dim-spec__radius-row">
          <div
            v-for="key in ['radiusSmall', 'radiusDefault', 'radiusMedium', 'radiusLarge'] as const"
            :key="key"
            class="dim-spec__radius-box"
            :style="{ borderRadius: `${designTokenState[key]}px` }"
          >
            {{ designTokenState[key] }}px
          </div>
        </div>
      </div>

      <div class="dim-spec__sliders">
        <div
          v-for="def in radiusTokenDefs"
          :key="def.key"
          class="dim-spec__slider-field"
        >
          <div class="dim-spec__slider-head">
            <span class="dim-spec__field-label">{{ def.label }}</span>
            <code class="dim-spec__field-var">{{ def.cssVar }}</code>
            <span class="dim-spec__slider-px">{{ pxForDef(def) }}px</span>
          </div>
          <t-slider
            class="dim-spec__slider"
            :model-value="multipleForDef(def)"
            :min="sliderMultipleBounds(def, baseUnit).min"
            :max="sliderMultipleBounds(def, baseUnit).max"
            :step="1"
            @change="(v: number) => onMultipleChange(def, v)"
          />
          <span class="dim-spec__slider-mult">
            × {{ baseUnit }}px = {{ pxForDef(def) }}px
          </span>
        </div>
      </div>
    </section>

    <section class="dim-spec__section">
      <h3 class="dim-spec__title">{{ TOKEN_GROUP_LABELS.layout }}</h3>

      <div class="dim-spec__preview-block">
        <div
          class="dim-spec__layout-demo"
          :style="{
            padding: `var(--flow-layout-padding)`,
            gap: `var(--flow-layout-gap)`,
          }"
        >
          <div class="dim-spec__layout-cell">区块 A</div>
          <div class="dim-spec__layout-cell">区块 B</div>
          <div class="dim-spec__layout-cell">区块 C</div>
        </div>
        <p class="dim-spec__layout-note">
          区块间距 token：<code>--flow-layout-section-gap</code>（{{ designTokenState.layoutSectionGap }}px）
        </p>
      </div>

      <div class="dim-spec__sliders">
        <div
          v-for="def in layoutTokenDefs"
          :key="def.key"
          class="dim-spec__slider-field"
        >
          <div class="dim-spec__slider-head">
            <span class="dim-spec__field-label">{{ def.label }}</span>
            <code class="dim-spec__field-var">{{ def.cssVar }}</code>
            <span class="dim-spec__slider-px">{{ pxForDef(def) }}px</span>
          </div>
          <p v-if="def.description" class="dim-spec__field-desc">{{ def.description }}</p>
          <t-slider
            class="dim-spec__slider"
            :model-value="multipleForDef(def)"
            :min="sliderMultipleBounds(def, baseUnit).min"
            :max="sliderMultipleBounds(def, baseUnit).max"
            :step="1"
            @change="(v: number) => onMultipleChange(def, v)"
          />
          <span class="dim-spec__slider-mult">
            × {{ baseUnit }}px = {{ pxForDef(def) }}px
          </span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dim-spec {
  display: flex;
  flex-direction: column;
  gap: 28px;
  max-width: 720px;
}

.dim-spec__intro {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
  color: var(--td-text-color-secondary);
}

.dim-spec__section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dim-spec__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.dim-spec__preview-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-medium);
  background: var(--td-bg-color-secondarycontainer);
}

.dim-spec__sliders {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dim-spec__slider-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 0;
}

.dim-spec__slider-field--base {
  padding-top: 0;
}

.dim-spec__slider-head {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
}

.dim-spec__field-label {
  font-size: 13px;
  font-weight: 500;
}

.dim-spec__field-var {
  font-size: 10px;
  color: var(--td-text-color-placeholder);
}

.dim-spec__field-desc {
  margin: 0;
  font-size: 11px;
  line-height: 1.4;
  color: var(--td-text-color-secondary);
}

.dim-spec__slider-px {
  margin-left: auto;
  font-size: 13px;
  font-weight: 600;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-variant-numeric: tabular-nums;
  color: var(--td-text-color-primary);
}

.dim-spec__slider {
  width: 100%;
}

.dim-spec__slider-mult {
  font-size: 10px;
  color: var(--td-text-color-placeholder);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.dim-spec__scale-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
}

.dim-spec__scale-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.dim-spec__scale-bar {
  background: var(--td-brand-color-light);
  border: 1px solid var(--td-brand-color);
  border-radius: 2px;
}

.dim-spec__scale-label {
  font-size: 11px;
  color: var(--td-text-color-secondary);
}

.dim-spec__scale-px {
  font-size: 10px;
  color: var(--td-text-color-placeholder);
}

.dim-spec__radius-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.dim-spec__radius-box {
  width: 100px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  text-align: center;
  border: 1px solid var(--td-component-border);
  background: var(--td-bg-color-container);
}

.dim-spec__layout-demo {
  display: flex;
  flex-wrap: wrap;
  border: 1px dashed var(--td-component-border);
  border-radius: var(--td-radius-medium);
  background: var(--td-bg-color-container);
}

.dim-spec__layout-cell {
  flex: 1 1 80px;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-container);
  border: 1px solid var(--td-component-border);
}

.dim-spec__layout-note {
  margin: 0;
  font-size: 11px;
  color: var(--td-text-color-placeholder);
}

.dim-spec__layout-note code {
  font-size: 10px;
}
</style>
