<script setup lang="ts">
import { ref } from 'vue'
import BrandScaleStrip from './BrandScaleStrip.vue'
import {
  COLOR_PALETTE_BOARDS,
  type ColorPaletteSlot,
} from '../tokens/colorPaletteDefs'
import {
  clearPaletteSlotColor,
  getPaletteSlotColor,
  isPaletteSlotEmpty,
  setPaletteSlotColor,
} from '../tokens/colorPaletteStore'
import { resolveColorForPicker } from '../tokens/colorUtils'

const openSlotId = ref<string | null>(null)

function pickerHex(slot: ColorPaletteSlot): string {
  const raw = getPaletteSlotColor(slot)
  return resolveColorForPicker(raw ?? '', '#0052d9')
}

function slotColor(slot: ColorPaletteSlot): string | null {
  return getPaletteSlotColor(slot)
}

function onPickerChange(slot: ColorPaletteSlot, value: string) {
  setPaletteSlotColor(slot, value)
}

function onHexInput(slot: ColorPaletteSlot, raw: string) {
  if (raw.trim()) setPaletteSlotColor(slot, raw)
}

function clearSlot(slot: ColorPaletteSlot) {
  clearPaletteSlotColor(slot.id)
  openSlotId.value = null
}

function togglePopover(slotId: string, visible: boolean) {
  openSlotId.value = visible ? slotId : null
}
</script>

<template>
  <div class="palette-matrix">
    <section v-for="board in COLOR_PALETTE_BOARDS" :key="board.title" class="palette-block">
      <header class="palette-block__head">
        <h3 class="palette-block__title">{{ board.title }}</h3>
        <p v-if="board.hint" class="palette-block__hint">{{ board.hint }}</p>
      </header>

      <!-- 纵列矩阵：每列主色在上，扩展色往下叠；纯色块，非表格 -->
      <div class="palette-columns">
        <div
          v-for="col in board.columns"
          :key="col.id"
          class="palette-column"
          :class="{ 'palette-column--brand': col.id === 'brand' }"
        >
          <span class="palette-column__title">{{ col.title }}</span>

          <div class="palette-column__stack">
            <div
              v-for="(slot, index) in col.slots"
              :key="slot.id"
              class="palette-cell"
              :class="{ 'palette-cell--core': index === 0 }"
            >
              <t-popup
                :visible="openSlotId === slot.id"
                trigger="click"
                placement="bottom"
                show-arrow
                destroy-on-close
                @visible-change="(v: boolean) => togglePopover(slot.id, v)"
              >
                <button
                  type="button"
                  class="palette-cell__swatch"
                  :class="{
                    'palette-cell__swatch--empty': isPaletteSlotEmpty(slot),
                    'palette-cell__swatch--filled': !isPaletteSlotEmpty(slot),
                  }"
                  :style="slotColor(slot) ? { background: slotColor(slot)! } : undefined"
                  :title="slot.label"
                >
                  <span v-if="isPaletteSlotEmpty(slot)" class="palette-cell__plus">+</span>
                </button>

                <template #content>
                  <div class="palette-picker">
                    <t-color-picker
                      :model-value="pickerHex(slot)"
                      format="HEX"
                      size="small"
                      @change="(v: string) => onPickerChange(slot, v)"
                    />
                    <div class="palette-picker__hex">
                      <input
                        class="palette-picker__input"
                        type="text"
                        :value="slotColor(slot) ?? ''"
                        placeholder="#0052D9"
                        spellcheck="false"
                        @change="onHexInput(slot, ($event.target as HTMLInputElement).value)"
                      />
                      <button
                        v-if="slot.optional && !isPaletteSlotEmpty(slot)"
                        type="button"
                        class="palette-picker__clear"
                        @click="clearSlot(slot)"
                      >
                        清除
                      </button>
                    </div>
                    <code class="palette-picker__var">{{ slot.cssVar }}</code>
                  </div>
                </template>
              </t-popup>

              <span class="palette-cell__label">{{ slot.label }}</span>
            </div>
          </div>

          <BrandScaleStrip v-if="col.id === 'brand'" />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.palette-matrix {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.palette-block__head {
  margin-bottom: 12px;
}

.palette-block__title {
  margin: 0 0 2px;
  font-size: 13px;
  font-weight: 600;
}

.palette-block__hint {
  margin: 0;
  font-size: 11px;
  color: var(--td-text-color-placeholder);
}

/* 纵列并排，列内色块往下排 */
.palette-columns {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 20px 16px;
}

.palette-column {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 72px;
}

.palette-column--brand {
  min-width: 280px;
  align-items: stretch;
}

.palette-column__title {
  font-size: 11px;
  font-weight: 600;
  color: var(--td-text-color-secondary);
  text-align: center;
}

.palette-column__stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.palette-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 72px;
}

.palette-cell__swatch {
  position: relative;
  width: 100%;
  height: 52px;
  padding: 0;
  border-radius: var(--td-radius-small);
  cursor: pointer;
  transition: box-shadow 0.15s, border-color 0.15s;
}

.palette-cell--core .palette-cell__swatch {
  height: 60px;
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--td-brand-color) 25%, transparent);
}

.palette-cell__swatch--empty {
  border: 1px dashed var(--td-component-border);
  background:
    linear-gradient(45deg, var(--td-bg-color-secondarycontainer) 25%, transparent 25%),
    linear-gradient(-45deg, var(--td-bg-color-secondarycontainer) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--td-bg-color-secondarycontainer) 75%),
    linear-gradient(-45deg, transparent 75%, var(--td-bg-color-secondarycontainer) 75%);
  background-size: 10px 10px;
  background-position:
    0 0,
    0 5px,
    5px -5px,
    -5px 0;
  background-color: var(--td-bg-color-container);
}

.palette-cell__swatch--filled {
  border: 1px solid color-mix(in srgb, var(--td-text-color-primary) 12%, transparent);
}

.palette-cell__swatch:hover {
  box-shadow: 0 0 0 2px var(--td-brand-color-light);
  border-color: var(--td-brand-color);
}

.palette-cell__plus {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  line-height: 1;
  color: var(--td-text-color-placeholder);
}

.palette-cell__label {
  width: 100%;
  font-size: 10px;
  line-height: 1.3;
  color: var(--td-text-color-secondary);
  text-align: center;
  word-break: break-all;
}

.palette-cell--core .palette-cell__label {
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.palette-picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px;
  min-width: 240px;
}

.palette-picker__hex {
  display: flex;
  gap: 6px;
  align-items: center;
}

.palette-picker__input {
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

.palette-picker__clear {
  flex-shrink: 0;
  padding: 4px 8px;
  font-size: 11px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-container);
  color: var(--td-text-color-secondary);
  cursor: pointer;
}

.palette-picker__clear:hover {
  border-color: var(--td-error-color);
  color: var(--td-error-color);
}

.palette-picker__var {
  font-size: 10px;
  color: var(--td-text-color-placeholder);
}
</style>
