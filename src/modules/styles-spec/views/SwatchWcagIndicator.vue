<script setup lang="ts">
import { computed } from 'vue'
import { formatVisualDeltaCoef } from '../tokens/perceptualColor'
import { swatchDisplayTitle } from '../tokens/swatchTextColor'
import type { SwatchDisplayColors } from '../tokens/swatchTextColor'
import type { WcagTextSize } from '../tokens/colorUtils'

const props = defineProps<{
  display: SwatchDisplayColors
  textSize?: WcagTextSize
}>()

const flipped = defineModel<boolean>('flipped', { default: false })

const textSize = computed(() => props.textSize ?? 'normal')
const isWarn = computed(() => !props.display.passesRules)

const title = computed(() =>
  swatchDisplayTitle(props.display, textSize.value, flipped.value),
)

const coefLabel = computed(() =>
  formatVisualDeltaCoef(props.display.rules.visualDelta),
)

function handleSwitchClick(event: MouseEvent) {
  event.stopPropagation()
}
</script>

<template>
  <span
    class="swatch-rule"
    :title="title"
    :aria-label="title"
  >
    <t-switch
      v-if="display.isAmbiguousContrast"
      v-model="flipped"
      class="swatch-rule__switch"
      size="small"
      @click="handleSwitchClick"
    />
    <span
      class="swatch-rule__coef"
      :class="{ 'swatch-rule__coef--warn': isWarn }"
    >
      <span v-if="isWarn" class="swatch-rule__mark">!!!</span>
      <span>{{ coefLabel }}</span>
    </span>
  </span>
</template>

<style scoped>
.swatch-rule {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 0;
  padding: 0;
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
  background: transparent;
  color: inherit;
  flex-shrink: 0;
}

.swatch-rule__coef {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 9px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  opacity: 0.95;
}

.swatch-rule__coef--warn {
  display: inline-flex;
  align-items: baseline;
  gap: 0;
}

.swatch-rule__mark {
  flex-shrink: 0;
  font-weight: 900;
  letter-spacing: -0.04em;
}

.swatch-rule__switch {
  flex-shrink: 0;
  transform: scale(0.72);
  transform-origin: center left;
}

.swatch-rule__switch :deep(.t-switch__content) {
  font-size: 9px;
  min-width: auto;
}
</style>
