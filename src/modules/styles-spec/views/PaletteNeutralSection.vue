<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  colorPaletteSettings,
  getMainStepForColumn,
  NEUTRAL_SCALE_STEP_COUNT,
  setNeutralMixInfo,
  setNeutralMixPrimary,
} from '../tokens/colorPaletteSettings'
import { getEffectiveSemanticScaleColor } from '../tokens/colorPaletteStore'
import { designTokenState } from '../tokens/designTokenStore'
import {
  generatePrimaryInfoScaleMix,
  normalizeHex,
  parseColorToHex,
  resolveColorForPicker,
} from '../tokens/colorUtils'
import { getSwatchDisplayColors } from '../tokens/swatchTextColor'
import SwatchWcagIndicator from './SwatchWcagIndicator.vue'

function resolveTokenHex(raw: string | undefined, fallback: string) {
  const trimmed = raw?.trim() || fallback
  return parseColorToHex(trimmed) ?? resolveColorForPicker(trimmed, fallback)
}

const primaryHex = computed(() => {
  void designTokenState.brandColor
  return resolveTokenHex(designTokenState.brandColor, '#0052d9')
})

const infoHex = computed(() => {
  void designTokenState.infoColor
  return resolveTokenHex(designTokenState.infoColor, '#697586')
})

const primaryPct = computed(() => colorPaletteSettings.neutralMixPrimary)
const infoPct = computed(() => 100 - primaryPct.value)

const textFlips = ref<Record<number, boolean>>({})

const primaryMainStep = computed(() => {
  void colorPaletteSettings.mainStepByColumn.primary
  return getMainStepForColumn('primary')
})

const neutralBar = computed(() => {
  void designTokenState.brandColor
  void designTokenState.infoColor
  void colorPaletteSettings.neutralMixPrimary
  void colorPaletteSettings.mainStepByColumn.primary
  void colorPaletteSettings.mainStepByColumn.info
  void textFlips.value

  const primaryMain = primaryHex.value
  const infoMain = infoHex.value
  const mainStep = primaryMainStep.value

  const primaryScale = Array.from({ length: NEUTRAL_SCALE_STEP_COUNT }, (_, i) =>
    getEffectiveSemanticScaleColor('primary', 'brand', i + 1, primaryMain),
  )
  const infoScale = Array.from({ length: NEUTRAL_SCALE_STEP_COUNT }, (_, i) =>
    getEffectiveSemanticScaleColor('info', undefined, i + 1, infoMain),
  )

  return generatePrimaryInfoScaleMix(
    primaryScale,
    infoScale,
    colorPaletteSettings.neutralMixPrimary,
  ).map((hex, index) => {
    const step = index + 1
    const flipped = textFlips.value[step] ?? false
    const display = getSwatchDisplayColors(
      hex,
      'normal',
      {
        kind: 'neutral-scale',
        scaleStep: step,
        mainStep,
      },
      { textFlipped: flipped },
    )
    return {
      index,
      step,
      hex: normalizeHex(hex).toLowerCase(),
      textColor: display.textColor,
      wcag: display,
    }
  })
})

function setTextFlip(step: number, value: boolean) {
  textFlips.value = { ...textFlips.value, [step]: value }
}

function getTextFlip(step: number): boolean {
  return textFlips.value[step] ?? false
}

function onPrimaryInput(event: Event) {
  const n = Number((event.target as HTMLInputElement).value)
  setNeutralMixPrimary(Number.isFinite(n) ? n : 0)
}

function onInfoInput(event: Event) {
  setNeutralMixInfo(Number((event.target as HTMLInputElement).value))
}
</script>

<template>
  <section class="neutral">
    <div class="neutral__refs">
      <div class="neutral__ref">
        <span
          class="neutral__swatch"
          :style="{ background: normalizeHex(primaryHex).toLowerCase() }"
          aria-hidden="true"
        />
        <div class="neutral__ref-text">
          <span class="neutral__ref-label">Primary</span>
          <code class="neutral__ref-code">{{ normalizeHex(primaryHex).toLowerCase() }}</code>
        </div>
      </div>
      <span class="neutral__mix-symbol" aria-hidden="true">+</span>
      <div class="neutral__ref">
        <span
          class="neutral__swatch"
          :style="{ background: normalizeHex(infoHex).toLowerCase() }"
          aria-hidden="true"
        />
        <div class="neutral__ref-text">
          <span class="neutral__ref-label">Info</span>
          <code class="neutral__ref-code">{{ normalizeHex(infoHex).toLowerCase() }}</code>
        </div>
      </div>
    </div>

    <p class="neutral__hint">
      10 阶：每一阶 = Primary 第 N 阶 × {{ primaryPct }}% + Info 第 N 阶 × {{ infoPct }}%（N = 1…10）。
    </p>

    <div class="neutral__bar palette-scale-strip palette-scale-strip--horizontal palette-scale-strip--size-md">
      <div
        v-for="block in neutralBar"
        :key="block.index"
        class="neutral__block palette-scale-strip__cell"
        :class="{ 'palette-scale-strip__cell--fail': !block.wcag.passesRules }"
        :style="{ background: block.hex, color: block.textColor }"
        :title="`${block.step} · ${block.hex}`"
      >
        <span class="neutral__block-step">{{ block.step }}</span>
        <SwatchWcagIndicator
          :flipped="getTextFlip(block.step)"
          :display="block.wcag"
          @update:flipped="(v: boolean) => setTextFlip(block.step, v)"
        />
      </div>
    </div>

    <div class="neutral__controls">
      <fieldset class="neutral__mix">
        <legend class="neutral__mix-title">混合比</legend>
        <div class="neutral__mix-row">
          <label class="neutral__field neutral__field--mix">
            <span class="neutral__label">Primary %</span>
            <input
              class="neutral__input"
              type="number"
              min="0"
              max="100"
              :value="primaryPct"
              @change="onPrimaryInput"
            />
          </label>
          <label class="neutral__field neutral__field--mix">
            <span class="neutral__label">Info %</span>
            <input
              class="neutral__input"
              type="number"
              min="0"
              max="100"
              :value="infoPct"
              @change="onInfoInput"
            />
          </label>
        </div>
      </fieldset>
    </div>
  </section>
</template>

<style scoped>
@import './palette-scale-strip.css';

.neutral__refs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
  margin-bottom: 8px;
}

.neutral__ref {
  display: flex;
  align-items: center;
  gap: 10px;
}

.neutral__swatch {
  width: 28px;
  height: 28px;
  border-radius: var(--td-radius-small);
  border: 1px solid var(--td-component-border);
  flex-shrink: 0;
}

.neutral__ref-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.neutral__ref-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.neutral__ref-code {
  font-size: 11px;
  font-family: ui-monospace, monospace;
  color: var(--td-text-color-secondary);
}

.neutral__mix-symbol {
  font-size: 16px;
  font-weight: 600;
  color: var(--td-text-color-placeholder);
}

.neutral__hint {
  margin: 0 0 12px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--td-text-color-secondary);
}

.neutral__bar {
  max-width: 100%;
}

.neutral__block {
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 4px;
  padding: 0 6px 8px;
  text-align: left;
}

.neutral__block-step {
  font-size: 9px;
  font-weight: 600;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  opacity: 0.92;
}

.neutral__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
  margin-top: 16px;
  align-items: flex-start;
}

.neutral__mix {
  margin: 0;
  padding: 0;
  border: none;
  min-width: 0;
}

.neutral__mix-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--td-text-color-primary);
  padding: 0;
  margin-bottom: 8px;
}

.neutral__mix-row {
  display: flex;
  gap: 12px;
}

.neutral__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.neutral__field--mix {
  width: 88px;
}

.neutral__label {
  font-size: 10px;
  font-weight: 600;
  color: var(--td-text-color-secondary);
}

.neutral__input {
  height: 32px;
  padding: 0 8px;
  font-size: 13px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-container);
}
</style>
