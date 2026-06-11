<script setup lang="ts">
import { computed, ref } from 'vue'
import { BRAND_SCALE_SLOTS } from '../tokens/colorPaletteDefs'
import { designTokenState } from '../tokens/designTokenStore'
import {
  clearPaletteSlotColor,
  getBrandScaleSlot,
  getEffectiveBrandScaleColor,
  isBrandScaleOverridden,
  setPaletteSlotColor,
} from '../tokens/colorPaletteStore'
import {
  contrastRatio,
  normalizeHex,
  pickTextColorOnBackground,
  resolveColorForPicker,
} from '../tokens/colorUtils'

const openSlotId = ref<string | null>(null)

const scaleRows = computed(() => {
  void designTokenState.brandColor
  return BRAND_SCALE_SLOTS.map((slot, index) => {
    const step = index + 1
    const color = getEffectiveBrandScaleColor(step)
    const textColor = pickTextColorOnBackground(color)
    const label = step === 7 ? 'Brand7 品牌色' : `Brand${step}`
    return {
      slot,
      step,
      label,
      color,
      hex: normalizeHex(color).toLowerCase(),
      textColor,
      overridden: isBrandScaleOverridden(step),
    }
  })
})

const brand7 = computed(() => scaleRows.value[6])

const headerContrast = computed(() => {
  if (!brand7.value) return '—'
  return `${contrastRatio('#ffffff', brand7.value.color).toFixed(2)}:1`
})

function pickerHex(step: number): string {
  return resolveColorForPicker(getEffectiveBrandScaleColor(step), '#0052d9')
}

function onPickerChange(step: number, value: string) {
  setPaletteSlotColor(getBrandScaleSlot(step), value)
}

function onHexInput(step: number, raw: string) {
  if (raw.trim()) setPaletteSlotColor(getBrandScaleSlot(step), raw)
}

function clearStep(step: number) {
  clearPaletteSlotColor(`brand-${step}`)
  openSlotId.value = null
}

function togglePopover(slotId: string, visible: boolean) {
  openSlotId.value = visible ? slotId : null
}
</script>

<template>
  <div class="brand-scale">
    <div
      class="brand-scale__header"
      :style="{
        background: brand7?.color,
        color: brand7?.textColor,
      }"
    >
      <div class="brand-scale__contrast">Contrast Ratio {{ headerContrast }}</div>
      <div class="brand-scale__headline">
        <span>Brand7 品牌色</span>
        <span class="brand-scale__hex">{{ brand7?.hex }}</span>
      </div>
    </div>

    <div class="brand-scale__steps">
      <div
        v-for="row in scaleRows"
        :key="row.slot.id"
        class="brand-scale__step"
      >
        <t-popup
          :visible="openSlotId === row.slot.id"
          trigger="click"
          placement="bottom"
          show-arrow
          destroy-on-close
          @visible-change="(v: boolean) => togglePopover(row.slot.id, v)"
        >
          <button
            type="button"
            class="brand-scale__row"
            :class="{ 'brand-scale__row--overridden': row.overridden }"
            :style="{ background: row.color, color: row.textColor }"
          >
            <span class="brand-scale__label">{{ row.label }}</span>
            <span class="brand-scale__hex">{{ row.hex }}</span>
          </button>

          <template #content>
            <div class="brand-scale-picker">
              <t-color-picker
                :model-value="pickerHex(row.step)"
                format="HEX"
                size="small"
                @change="(v: string) => onPickerChange(row.step, v)"
              />
              <div class="brand-scale-picker__hex">
                <input
                  class="brand-scale-picker__input"
                  type="text"
                  :value="row.hex"
                  spellcheck="false"
                  @change="onHexInput(row.step, ($event.target as HTMLInputElement).value)"
                />
                <button
                  v-if="row.overridden"
                  type="button"
                  class="brand-scale-picker__clear"
                  @click="clearStep(row.step)"
                >
                  清除
                </button>
              </div>
              <code class="brand-scale-picker__var">{{ row.slot.cssVar }}</code>
            </div>
          </template>
        </t-popup>
      </div>
    </div>
  </div>
</template>

<style scoped>
.brand-scale {
  width: 100%;
  max-width: 280px;
  margin-top: 12px;
  border-radius: var(--td-radius-medium);
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.brand-scale__header {
  padding: 10px 12px 12px;
}

.brand-scale__contrast {
  font-size: 11px;
  line-height: 1.4;
  margin-bottom: 4px;
  opacity: 0.9;
}

.brand-scale__headline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
}

.brand-scale__steps {
  display: flex;
  flex-direction: column;
}

.brand-scale__step + .brand-scale__step .brand-scale__row {
  border-top: 1px solid rgba(0, 0, 0, 0.04);
}

.brand-scale__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-height: 38px;
  padding: 8px 12px;
  border: none;
  font-size: 12px;
  cursor: pointer;
  text-align: left;
  transition: filter 0.12s;
}

.brand-scale__row:hover {
  filter: brightness(0.97);
}

.brand-scale__row--overridden {
  box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--td-brand-color) 55%, transparent);
}

.brand-scale__label {
  font-weight: 500;
}

.brand-scale__hex {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  opacity: 0.92;
}

.brand-scale-picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px;
  min-width: 240px;
}

.brand-scale-picker__hex {
  display: flex;
  gap: 6px;
  align-items: center;
}

.brand-scale-picker__input {
  flex: 1;
  min-width: 0;
  padding: 4px 8px;
  font-size: 12px;
  font-family: ui-monospace, monospace;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-container);
  color: var(--td-text-color-primary);
}

.brand-scale-picker__clear {
  flex-shrink: 0;
  padding: 4px 8px;
  font-size: 11px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-container);
  color: var(--td-text-color-secondary);
  cursor: pointer;
}

.brand-scale-picker__clear:hover {
  border-color: var(--td-error-color);
  color: var(--td-error-color);
}

.brand-scale-picker__var {
  font-size: 10px;
  color: var(--td-text-color-placeholder);
}
</style>
