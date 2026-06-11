<script setup lang="ts">
import { computed } from 'vue'

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

interface BoundBadge {
  elIndex: number
  rect: Rect
  label: string
  accent: string
}

const props = defineProps<{
  dragActive: boolean
  dragAnchor: { x: number; y: number } | null
  dragPointer: { x: number; y: number } | null
  hoverRect: Rect | null
  boundBadges: BoundBadge[]
}>()

const dragLine = computed(() => {
  if (!props.dragActive || !props.dragAnchor || !props.dragPointer) return null
  return {
    x1: props.dragAnchor.x,
    y1: props.dragAnchor.y,
    x2: props.dragPointer.x,
    y2: props.dragPointer.y,
  }
})
</script>

<template>
  <Teleport to="body">
    <svg
      v-if="dragLine"
      class="lbd-line"
      aria-hidden="true"
    >
      <line
        :x1="dragLine.x1"
        :y1="dragLine.y1"
        :x2="dragLine.x2"
        :y2="dragLine.y2"
      />
    </svg>
  </Teleport>

  <div class="lbo" aria-hidden="true">
    <div
      v-for="badge in boundBadges"
      :key="badge.elIndex"
      class="lbo__bound"
      :style="{
        left: `${badge.rect.x}px`,
        top: `${badge.rect.y}px`,
        width: `${badge.rect.width}px`,
        height: `${badge.rect.height}px`,
        '--lbo-accent': badge.accent,
      }"
    >
      <span class="lbo__badge">{{ badge.label }}</span>
    </div>

    <div
      v-if="dragActive && hoverRect"
      class="lbo__hover"
      :style="{
        left: `${hoverRect.x}px`,
        top: `${hoverRect.y}px`,
        width: `${hoverRect.width}px`,
        height: `${hoverRect.height}px`,
      }"
    />
  </div>
</template>

<style scoped>
.lbd-line {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 10000;
}

.lbd-line line {
  stroke: var(--td-brand-color, #0052d9);
  stroke-width: 2;
  stroke-dasharray: 6 4;
  opacity: 0.85;
}

.lbo {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 50;
  overflow: hidden;
}

.lbo__bound {
  position: absolute;
  box-sizing: border-box;
  border: 2px solid var(--lbo-accent, var(--td-brand-color));
  border-radius: 4px;
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--lbo-accent, #0052d9) 25%, transparent);
}

.lbo__badge {
  position: absolute;
  top: -22px;
  left: 0;
  max-width: 160px;
  padding: 2px 6px;
  font-size: 10px;
  line-height: 1.3;
  border-radius: 4px;
  background: var(--lbo-accent, var(--td-brand-color));
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lbo__hover {
  position: absolute;
  box-sizing: border-box;
  border: 2px dashed var(--td-brand-color);
  border-radius: 4px;
  background: color-mix(in srgb, var(--td-brand-color) 8%, transparent);
}
</style>
