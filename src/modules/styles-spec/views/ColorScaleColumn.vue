<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DesignTokenValues } from '../tokens/designTokenDefs'
import { designTokenState } from '../tokens/designTokenStore'
import {
  getBrandScaleSlot,
  getEffectiveSemanticScaleColor,
  getPaletteSlotColor,
  isSemanticScaleOverridden,
  setPaletteSlotColor,
} from '../tokens/colorPaletteStore'
import {
  colorPaletteSettings,
  getMainStepForColumn,
  setMainStepForColumn,
} from '../tokens/colorPaletteSettings'
import type { ColorPaletteSlot } from '../tokens/colorPaletteDefs'
import { DESIGN_TOKEN_DEFS } from '../tokens/designTokenDefs'
import {
  hexToRgbString,
  normalizeHex,
  parseColorToHex,
  resolveColorForPicker,
} from '../tokens/colorUtils'
import { getSwatchDisplayColors } from '../tokens/swatchTextColor'
import SwatchWcagIndicator from './SwatchWcagIndicator.vue'
import { paletteScaleCssVar, type FunctionalColorColumnDef } from '../tokens/colorPalettePageDefs'

const props = defineProps<{
  columnId: string
  title: string
  tokenKey: keyof DesignTokenValues
  scalePrefix?: string
}>()

const columnDef = computed(
  (): FunctionalColorColumnDef => ({
    id: props.columnId,
    title: props.title,
    tokenKey: props.tokenKey,
    scalePrefix: props.scalePrefix,
  }),
)

const openSlotId = ref<string | null>(null)
const headerPickerOpen = ref(false)
const headerTextFlipped = ref(false)
const textFlips = ref<Record<number, boolean>>({})

const coreSlot = computed((): ColorPaletteSlot => ({
  id: props.scalePrefix ?? props.tokenKey,
  cssVar: DESIGN_TOKEN_DEFS.find((d) => d.key === props.tokenKey)?.cssVar ?? '',
  label: props.title,
  tokenKey: props.tokenKey,
}))

const mainStep = computed(() => {
  void colorPaletteSettings.mainStepByColumn[props.columnId]
  return getMainStepForColumn(props.columnId)
})

const mainColor = computed(() => {
  void designTokenState[props.tokenKey]
  void colorPaletteSettings.mainStepByColumn[props.columnId]
  const raw = getPaletteSlotColor(coreSlot.value)
  return parseColorToHex(raw ?? '') ?? resolveColorForPicker(raw ?? '', '#0052d9')
})

const headerDisplay = computed(() => {
  void headerTextFlipped.value
  return getSwatchDisplayColors(
    mainColor.value,
    'large',
    {
      kind: 'functional-header',
      mainStep: mainStep.value,
    },
    { textFlipped: headerTextFlipped.value },
  )
})

const scaleRows = computed(() => {
  void designTokenState[props.tokenKey]
  void colorPaletteSettings.mainStepByColumn[props.columnId]
  void textFlips.value
  const main = mainColor.value
  const col = columnDef.value
  const stepMain = mainStep.value
  return Array.from({ length: 10 }, (_, i) => {
    const step = i + 1
    const color = getEffectiveSemanticScaleColor(props.columnId, props.scalePrefix, step, main)
    const flipped = textFlips.value[step] ?? false
    const display = getSwatchDisplayColors(
      color,
      'normal',
      {
        kind: 'functional-scale',
        scaleStep: step,
        mainStep: stepMain,
      },
      { textFlipped: flipped },
    )
    return {
      step,
      cssVar: paletteScaleCssVar(col, step),
      color,
      hex: normalizeHex(color).toLowerCase(),
      textColor: display.textColor,
      textFlipped: flipped,
      wcag: display,
      overridden: isSemanticScaleOverridden(props.scalePrefix, step),
      isMainStep: step === stepMain,
      slot: props.scalePrefix === 'brand' ? getBrandScaleSlot(step) : null,
    }
  })
})

function setTextFlip(step: number, value: boolean) {
  textFlips.value = { ...textFlips.value, [step]: value }
}

function getTextFlip(step: number): boolean {
  return textFlips.value[step] ?? false
}

function onMainStepChange(event: Event) {
  const n = Number((event.target as HTMLSelectElement).value)
  setMainStepForColumn(props.columnId, n)
}

function scaleSlot(step: number): ColorPaletteSlot | null {
  if (props.scalePrefix !== 'brand') return null
  return getBrandScaleSlot(step)
}

function onHeaderColorChange(value: string) {
  setPaletteSlotColor(coreSlot.value, value)
}

function onScaleColorChange(step: number, value: string) {
  const slot = scaleSlot(step)
  if (slot) setPaletteSlotColor(slot, value)
}

function togglePopover(id: string, visible: boolean) {
  openSlotId.value = visible ? id : null
}
</script>

<template>
  <div class="color-col">
    <t-popup
      v-model:visible="headerPickerOpen"
      trigger="click"
      placement="bottom"
      show-arrow
      destroy-on-close
    >
      <button
        type="button"
        class="color-col__header"
        :class="{ 'color-col__header--wcag-fail': !headerDisplay.passesRules }"
        :style="{ background: mainColor, color: headerDisplay.textColor }"
      >
        <span class="color-col__name">{{ title }}</span>
        <span class="color-col__meta">{{ normalizeHex(mainColor).toLowerCase() }}</span>
        <span class="color-col__meta">{{ hexToRgbString(mainColor) }}</span>
        <SwatchWcagIndicator
          v-model:flipped="headerTextFlipped"
          class="color-col__header-wcag"
          :display="headerDisplay"
          text-size="large"
        />
        <label class="color-col__main-step" @click.stop>
          <span class="color-col__main-step-label">功能色阶</span>
          <select
            class="color-col__main-step-select"
            :value="mainStep"
            @change="onMainStepChange"
          >
            <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
          </select>
        </label>
      </button>
      <template #content>
        <div class="color-col-picker">
          <t-color-picker
            :model-value="mainColor"
            format="HEX"
            size="small"
            @change="onHeaderColorChange"
          />
        </div>
      </template>
    </t-popup>

    <div class="color-col__scale palette-scale-strip palette-scale-strip--vertical">
      <div
        v-for="row in scaleRows"
        :key="row.step"
        class="palette-scale-strip__cell"
        :class="{
          'palette-scale-strip__cell--fail': !row.wcag.passesRules,
          'palette-scale-strip__cell--main': row.isMainStep,
          'palette-scale-strip__cell--overridden': row.overridden,
        }"
      >
        <t-popup
          v-if="row.slot"
          :visible="openSlotId === row.slot.id"
          trigger="click"
          placement="bottom"
          show-arrow
          destroy-on-close
          @visible-change="(v: boolean) => togglePopover(row.slot!.id, v)"
        >
          <button
            type="button"
            class="color-col__row"
            :style="{ background: row.color, color: row.textColor }"
          >
            <div class="color-col__row-line">
              <span class="color-col__row-var">{{ row.cssVar }}</span>
              <span
                v-if="row.isMainStep"
                class="color-col__main-dot"
                title="主色阶"
                aria-label="主色阶"
              />
            </div>
            <div class="color-col__row-meta">
              <code class="color-col__row-hex">{{ row.hex }}</code>
              <SwatchWcagIndicator
                :flipped="getTextFlip(row.step)"
                :display="row.wcag"
                @update:flipped="(v: boolean) => setTextFlip(row.step, v)"
              />
            </div>
          </button>
          <template #content>
            <div class="color-col-picker">
              <t-color-picker
                :model-value="row.color"
                format="HEX"
                size="small"
                @change="(v: string) => onScaleColorChange(row.step, v)"
              />
            </div>
          </template>
        </t-popup>
        <div
          v-else
          class="color-col__row color-col__row--readonly"
          :style="{ background: row.color, color: row.textColor }"
        >
          <div class="color-col__row-line">
            <span class="color-col__row-var">{{ row.cssVar }}</span>
            <span
              v-if="row.isMainStep"
              class="color-col__main-dot"
              title="主色阶"
              aria-label="主色阶"
            />
          </div>
          <div class="color-col__row-meta">
            <code class="color-col__row-hex">{{ row.hex }}</code>
            <SwatchWcagIndicator
              :flipped="getTextFlip(row.step)"
              :display="row.wcag"
              @update:flipped="(v: boolean) => setTextFlip(row.step, v)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import './palette-scale-strip.css';

.color-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.color-col__header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  width: 100%;
  min-height: 88px;
  padding: 14px 12px;
  margin-bottom: 8px;
  border: none;
  border-radius: var(--td-radius-small);
  cursor: pointer;
  text-align: left;
  transition: filter 0.12s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.color-col__header--wcag-fail {
  box-shadow: inset 0 0 0 2px var(--td-error-color);
}

.color-col__header-wcag {
  margin-left: 0;
  margin-top: 2px;
}

.color-col__header:hover {
  filter: brightness(0.97);
}

.color-col__name {
  font-size: 15px;
  font-weight: 600;
}

.color-col__meta {
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  opacity: 0.92;
}

.color-col__scale {
  width: 100%;
}

.color-col__scale .palette-scale-strip__cell > :deep(*) {
  flex: 1;
  display: flex;
  width: 100%;
  min-width: 0;
  min-height: 0;
}

.color-col__row {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  gap: 4px;
  width: 100%;
  height: 100%;
  min-height: 44px;
  padding: 6px 10px;
  border: none;
  font-size: 11px;
  cursor: pointer;
  text-align: left;
}

.color-col__row-line {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-width: 0;
}

.color-col__row-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-width: 0;
}

.color-col__row--readonly {
  cursor: default;
}

.color-col__main-step {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: default;
}

.color-col__main-step-label {
  font-size: 10px;
  opacity: 0.9;
}

.color-col__main-step-select {
  height: 22px;
  padding: 0 4px;
  font-size: 11px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.15);
  color: inherit;
}

.color-col__main-dot {
  flex-shrink: 0;
  margin-left: auto;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.95;
}

.color-col__row-var {
  flex: 1;
  min-width: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px;
  line-height: 1.3;
  opacity: 0.95;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.color-col__row-hex {
  flex: 1;
  min-width: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px;
  line-height: 1.3;
  opacity: 0.92;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.color-col__row-meta :deep(.swatch-rule) {
  flex-shrink: 0;
  margin-left: auto;
}

.color-col-picker {
  padding: 4px;
}
</style>
