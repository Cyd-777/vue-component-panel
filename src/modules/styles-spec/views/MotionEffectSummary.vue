<script setup lang="ts">
import type { MotionEffectDisplay } from '../tokens/effectConfig'

defineProps<{
  display: MotionEffectDisplay
  compact?: boolean
}>()
</script>

<template>
  <div class="motion-fx" :class="{ 'motion-fx--compact': compact }">
    <div class="motion-fx__tags">
      <span class="motion-fx__tag motion-fx__tag--effect">{{ display.effectLabel }}</span>
      <span class="motion-fx__tag">{{ display.triggerLabel }}</span>
    </div>
    <p class="motion-fx__summary">{{ display.summary }}</p>
    <p v-if="display.meta" class="motion-fx__meta">{{ display.meta }}</p>
    <p v-if="display.triggerMismatch" class="motion-fx__warn">
      预设触发方式与槽位不一致，建议在「动效」Tab 选用匹配 id 或调整 effect-config
    </p>
  </div>
</template>

<style scoped>
.motion-fx {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.motion-fx--compact {
  gap: 2px;
}

.motion-fx__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.motion-fx__tag {
  padding: 1px 5px;
  font-size: 9px;
  line-height: 1.3;
  border-radius: 3px;
  color: var(--td-text-color-secondary);
  background: var(--td-bg-color-secondarycontainer);
  border: 1px solid var(--td-component-border);
}

.motion-fx__tag--effect {
  color: var(--td-brand-color);
  border-color: color-mix(in srgb, var(--td-brand-color) 35%, var(--td-component-border));
}

.motion-fx__summary {
  margin: 0;
  font-size: 10px;
  line-height: 1.35;
  color: var(--td-text-color-placeholder);
}

.motion-fx__meta {
  margin: 0;
  font-size: 9px;
  line-height: 1.3;
  color: var(--td-text-color-placeholder);
}

.motion-fx__warn {
  margin: 0;
  font-size: 9px;
  line-height: 1.35;
  color: var(--td-warning-color);
}
</style>
