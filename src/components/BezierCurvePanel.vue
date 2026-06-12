<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  clampBezierUnit,
  formatCubicBezier,
  timingToBezierPoints,
  type CubicBezierPoints,
} from '../modules/styles-spec/tokens/motionPresetOptions'

const props = withDefaults(
  defineProps<{
    modelValue: string
    disabled?: boolean
  }>(),
  { disabled: false },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const local = ref<CubicBezierPoints>(timingToBezierPoints(props.modelValue))
const dragging = ref<'p1' | 'p2' | null>(null)
const svgRef = ref<SVGSVGElement | null>(null)

watch(
  () => props.modelValue,
  (raw) => {
    if (dragging.value) return
    local.value = timingToBezierPoints(raw)
  },
)

const curvePath = computed(() => {
  const { x1, y1, x2, y2 } = local.value
  const sx = 0
  const sy = 100
  const ex = 100
  const ey = 0
  const c1x = x1 * 100
  const c1y = (1 - y1) * 100
  const c2x = x2 * 100
  const c2y = (1 - y2) * 100
  return `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${ex} ${ey}`
})

const handleStyle = (x: number, y: number) => ({
  left: `${x * 100}%`,
  top: `${(1 - y) * 100}%`,
})

function emitBezier(points: CubicBezierPoints) {
  emit('update:modelValue', formatCubicBezier(points))
}

function setPoint(which: 'x1' | 'y1' | 'x2' | 'y2', raw: number) {
  const next = { ...local.value }
  if (which === 'x1' || which === 'x2') next[which] = clampBezierUnit(raw)
  else next[which] = Math.round(raw * 1000) / 1000
  local.value = next
  emitBezier(next)
}

function pointerToBezier(svg: SVGSVGElement, clientX: number, clientY: number): { x: number; y: number } {
  const rect = svg.getBoundingClientRect()
  const x = clampBezierUnit((clientX - rect.left) / rect.width)
  const y = Math.round((1 - (clientY - rect.top) / rect.height) * 1000) / 1000
  return { x, y }
}

function onPointerDown(which: 'p1' | 'p2', e: PointerEvent) {
  if (props.disabled) return
  dragging.value = which
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!dragging.value || !svgRef.value || props.disabled) return
  const { x, y } = pointerToBezier(svgRef.value, e.clientX, e.clientY)
  const next = { ...local.value }
  if (dragging.value === 'p1') {
    next.x1 = x
    next.y1 = y
  } else {
    next.x2 = x
    next.y2 = y
  }
  local.value = next
  emitBezier(next)
}

function onPointerUp() {
  dragging.value = null
}

const cssValue = computed(() => formatCubicBezier(local.value))
</script>

<template>
  <div class="bezier" :class="{ 'bezier--disabled': disabled }">
    <div class="bezier__canvas-wrap">
      <svg
        ref="svgRef"
        class="bezier__svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <line x1="0" y1="100" :x2="local.x1 * 100" :y2="(1 - local.y1) * 100" class="bezier__guide" />
        <line x1="100" y1="0" :x2="local.x2 * 100" :y2="(1 - local.y2) * 100" class="bezier__guide" />
        <path :d="curvePath" class="bezier__curve" fill="none" />
        <line x1="0" y1="100" x2="100" y2="0" class="bezier__baseline" />
      </svg>
      <button
        type="button"
        class="bezier__handle bezier__handle--p1"
        :style="handleStyle(local.x1, local.y1)"
        :disabled="disabled"
        aria-label="控制点 P1"
        @pointerdown="onPointerDown('p1', $event)"
      />
      <button
        type="button"
        class="bezier__handle bezier__handle--p2"
        :style="handleStyle(local.x2, local.y2)"
        :disabled="disabled"
        aria-label="控制点 P2"
        @pointerdown="onPointerDown('p2', $event)"
      />
      <span class="bezier__axis bezier__axis--time">时间 →</span>
      <span class="bezier__axis bezier__axis--value">进度 ↑</span>
    </div>

    <div class="bezier__inputs">
      <label v-for="key in (['x1', 'y1', 'x2', 'y2'] as const)" :key="key" class="bezier__input-row">
        <span class="bezier__input-label">{{ key.toUpperCase() }}</span>
        <input
          class="bezier__input"
          type="number"
          :min="key.startsWith('x') ? 0 : undefined"
          :max="key.startsWith('x') ? 1 : undefined"
          step="0.01"
          :value="local[key]"
          :disabled="disabled"
          @change="setPoint(key, Number(($event.target as HTMLInputElement).value))"
        />
      </label>
    </div>

    <code class="bezier__code">{{ cssValue }}</code>
  </div>
</template>

<style scoped>
.bezier {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.bezier--disabled {
  opacity: 0.45;
  pointer-events: none;
}

.bezier__canvas-wrap {
  position: relative;
  height: 120px;
  border-radius: var(--td-radius-small);
  border: 1px solid var(--td-component-border);
  background:
    linear-gradient(to right, transparent 49.5%, var(--td-component-border) 49.5%, var(--td-component-border) 50.5%, transparent 50.5%),
    linear-gradient(to top, transparent 49.5%, var(--td-component-border) 49.5%, var(--td-component-border) 50.5%, transparent 50.5%),
    var(--td-bg-color-container);
  overflow: hidden;
}

.bezier__svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.bezier__guide {
  stroke: var(--td-text-color-placeholder);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
  stroke-dasharray: 3 3;
}

.bezier__baseline {
  stroke: var(--td-component-border);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.bezier__curve {
  stroke: var(--td-brand-color);
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
}

.bezier__handle {
  position: absolute;
  width: 12px;
  height: 12px;
  margin: -6px 0 0 -6px;
  padding: 0;
  border-radius: 50%;
  border: 2px solid var(--td-bg-color-container);
  cursor: grab;
  touch-action: none;
}

.bezier__handle:active {
  cursor: grabbing;
}

.bezier__handle--p1 {
  background: var(--td-brand-color);
}

.bezier__handle--p2 {
  background: var(--td-warning-color);
}

.bezier__axis {
  position: absolute;
  font-size: 9px;
  color: var(--td-text-color-placeholder);
  pointer-events: none;
}

.bezier__axis--time {
  right: 6px;
  bottom: 4px;
}

.bezier__axis--value {
  left: 6px;
  top: 4px;
}

.bezier__inputs {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}

.bezier__input-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.bezier__input-label {
  font-size: 10px;
  color: var(--td-text-color-placeholder);
}

.bezier__input {
  width: 100%;
  box-sizing: border-box;
  padding: 4px 6px;
  font-size: 11px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-container);
}

.bezier__code {
  display: block;
  padding: 6px 8px;
  font-size: 10px;
  line-height: 1.3;
  word-break: break-all;
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-secondarycontainer);
  color: var(--td-text-color-secondary);
}
</style>
