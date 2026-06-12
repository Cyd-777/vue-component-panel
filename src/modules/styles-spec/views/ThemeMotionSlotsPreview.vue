<script setup lang="ts">
import { computed } from 'vue'
import { motionEffectDisplayFromPreset } from '../tokens/effectConfig'
import { motionSlotLabel } from '../tokens/motionPresetCatalog'
import { getStylePresetById } from '../tokens/stylePresetStore'
import { THEME_MOTION_GROUPS, themeMotionPresetSettingKey } from '../tokens/themeUsageDefs'
import { themeUsageState } from '../tokens/themeUsageStore'
import MotionEffectSummary from './MotionEffectSummary.vue'

const groups = computed(() =>
  THEME_MOTION_GROUPS.map((group) => ({
    ...group,
    items: group.slots.map((slot) => {
      const presetId = themeUsageState[themeMotionPresetSettingKey(slot)] as string
      const preset = presetId ? getStylePresetById(presetId) : undefined
      const display = preset ? motionEffectDisplayFromPreset(preset, slot) : null
      return {
        slot,
        label: motionSlotLabel(slot),
        presetId,
        presetName: preset?.name ?? '—',
        display,
        className: `flow-theme-motion-${slot}`,
        interactive: group.id === 'interaction',
      }
    }),
  })),
)
</script>

<template>
  <section class="motion-slots">
    <h4 class="motion-slots__title">全局动效槽位</h4>
    <p class="motion-slots__hint">
      按触发方式分组：交互态对应画板「悬停 / 按下 / 聚焦」；显隐过渡供弹层、折叠展开引用。
    </p>

    <section v-for="group in groups" :key="group.id" class="motion-slots__group">
      <header class="motion-slots__group-head">
        <h5 class="motion-slots__group-title">{{ group.title }}</h5>
        <p class="motion-slots__group-desc">{{ group.description }}</p>
      </header>
      <div class="motion-slots__grid">
        <div
          v-for="item in group.items"
          :key="item.slot"
          class="motion-slots__chip"
          :class="`motion-slots__chip--${item.slot}`"
        >
          <span class="motion-slots__chip-label">{{ item.label }} · {{ item.slot }}</span>
          <span class="motion-slots__chip-name">{{ item.presetName }}</span>
          <button
            v-if="item.interactive"
            type="button"
            class="motion-slots__demo"
            :class="item.className"
          >
            {{ item.slot === 'focus' ? 'Focus me' : item.slot === 'active' ? 'Press me' : 'Hover me' }}
          </button>
          <code v-else class="motion-slots__code">{{ item.presetId || '未绑定' }}</code>
          <MotionEffectSummary
            v-if="item.display"
            :display="item.display"
            compact
          />
        </div>
      </div>
    </section>
  </section>
</template>

<style scoped>
.motion-slots {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-medium);
  background: var(--td-bg-color-container);
}

.motion-slots__title {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
}

.motion-slots__hint {
  margin: 0;
  font-size: 10px;
  line-height: 1.4;
  color: var(--td-text-color-placeholder);
}

.motion-slots__group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.motion-slots__group-head {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.motion-slots__group-title {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.motion-slots__group-desc {
  margin: 0;
  font-size: 10px;
  color: var(--td-text-color-placeholder);
}

.motion-slots__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
}

.motion-slots__chip {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  border-radius: var(--td-radius-small);
  border: 1px solid var(--td-component-border);
  background: var(--td-bg-color-secondarycontainer);
}

.motion-slots__chip-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--td-text-color-secondary);
}

.motion-slots__chip-name {
  font-size: 11px;
  color: var(--td-text-color-primary);
}

.motion-slots__demo {
  align-self: flex-start;
  margin-top: 2px;
  padding: 6px 10px;
  font-size: 11px;
  border-radius: var(--td-radius-small);
  border: 1px solid var(--td-component-border);
  background: var(--td-bg-color-container);
  cursor: default;
}

.motion-slots__demo:focus-visible {
  outline: 2px solid var(--td-brand-color);
  outline-offset: 2px;
}

.motion-slots__code {
  font-size: 9px;
  color: var(--td-text-color-placeholder);
  word-break: break-all;
}

.motion-slots__summary {
  font-size: 9px;
  line-height: 1.35;
  color: var(--td-text-color-placeholder);
}
</style>
