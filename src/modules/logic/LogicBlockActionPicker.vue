<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  getLogicBlockCatalogByCategory,
  LOGIC_BLOCK_CATEGORY_ACCENT,
  LOGIC_BLOCK_CATEGORY_ICON,
  LOGIC_BLOCK_CATEGORY_LABELS,
  type LogicBlockCatalogEntry,
  type LogicBlockCategory,
} from './logicBlockCatalog'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'pick', type: string): void
}>()

const query = ref('')
const sections = getLogicBlockCatalogByCategory()

watch(
  () => props.open,
  (val) => {
    if (val) query.value = ''
  },
)

const filteredSections = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return sections
  return sections
    .map((section) => ({
      ...section,
      entries: section.entries.filter((e) => matchEntry(e, q)),
    }))
    .filter((s) => s.entries.length > 0)
})

function matchEntry(entry: LogicBlockCatalogEntry, q: string): boolean {
  return (
    entry.labelZh.toLowerCase().includes(q)
    || entry.label.toLowerCase().includes(q)
    || entry.description.toLowerCase().includes(q)
    || (entry.templateEvent?.toLowerCase().includes(q) ?? false)
    || entry.type.toLowerCase().includes(q)
  )
}

function onPick(entry: LogicBlockCatalogEntry) {
  emit('pick', entry.type)
  emit('close')
}

function onBackdropClick() {
  emit('close')
}
</script>

<template>
  <div v-if="open" class="picker-root">
    <button type="button" class="picker-backdrop" aria-label="关闭" @click="onBackdropClick" />

    <div class="picker-sheet" role="dialog" aria-modal="true" aria-label="添加动作">
      <div class="picker-grabber" />

      <div class="picker-head">
        <span class="picker-title">添加动作</span>
        <button type="button" class="picker-close" @click="emit('close')">完成</button>
      </div>

      <div class="picker-search-wrap">
        <input
          v-model="query"
          class="picker-search"
          type="search"
          placeholder="搜索动作，如 单击、watch、延迟…"
        />
      </div>

      <div class="picker-list">
        <div v-if="filteredSections.length === 0" class="picker-empty">没有匹配的动作</div>

        <section
          v-for="section in filteredSections"
          :key="section.category"
          class="picker-section"
        >
          <div
            class="picker-section-head"
            :style="{ '--sec-accent': LOGIC_BLOCK_CATEGORY_ACCENT[section.category as LogicBlockCategory] }"
          >
            <span class="picker-section-icon">{{ LOGIC_BLOCK_CATEGORY_ICON[section.category as LogicBlockCategory] }}</span>
            {{ LOGIC_BLOCK_CATEGORY_LABELS[section.category as LogicBlockCategory] }}
          </div>

          <button
            v-for="entry in section.entries"
            :key="entry.type"
            type="button"
            class="picker-row"
            @click="onPick(entry)"
          >
            <span
              class="picker-row-icon"
              :style="{ '--row-accent': LOGIC_BLOCK_CATEGORY_ACCENT[section.category as LogicBlockCategory] }"
            >
              {{ LOGIC_BLOCK_CATEGORY_ICON[section.category as LogicBlockCategory] }}
            </span>
            <span class="picker-row-text">
              <span class="picker-row-title">{{ entry.labelZh }}</span>
              <span class="picker-row-sub">
                <template v-if="entry.templateEvent">@{{ entry.templateEvent }}</template>
                <template v-else>{{ entry.label }}</template>
                · {{ entry.description }}
              </span>
            </span>
          </button>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 遮罩仅覆盖逻辑块面板，不挡住底部工具栏 */
.picker-root {
  position: absolute;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.picker-backdrop {
  position: absolute;
  inset: 0;
  border: none;
  background: rgba(0, 0, 0, 0.35);
  cursor: pointer;
}

.picker-sheet {
  position: relative;
  max-height: min(85%, 520px);
  display: flex;
  flex-direction: column;
  border-radius: 14px 14px 0 0;
  background: var(--td-bg-color-container);
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.12);
}

.picker-grabber {
  width: 36px;
  height: 4px;
  margin: 8px auto 0;
  border-radius: 2px;
  background: var(--td-component-border);
  flex-shrink: 0;
}

.picker-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px 8px;
  flex-shrink: 0;
}

.picker-title {
  font-size: 15px;
  font-weight: 600;
}

.picker-close {
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  color: var(--td-brand-color);
  cursor: pointer;
}

.picker-search-wrap {
  padding: 0 12px 10px;
  flex-shrink: 0;
}

.picker-search {
  width: 100%;
  box-sizing: border-box;
  padding: 9px 12px;
  font-size: 13px;
  border: none;
  border-radius: 10px;
  background: var(--td-bg-color-secondarycontainer);
  color: var(--td-text-color-primary);
}

.picker-search:focus {
  outline: 2px solid var(--td-brand-color-light);
}

.picker-list {
  flex: 1;
  overflow: auto;
  padding: 0 0 16px;
  -webkit-overflow-scrolling: touch;
}

.picker-empty {
  padding: 24px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--td-text-color-placeholder);
}

.picker-section-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--sec-accent, var(--td-text-color-placeholder));
  position: sticky;
  top: 0;
  background: var(--td-bg-color-container);
  z-index: 1;
}

.picker-section-icon {
  font-size: 12px;
}

.picker-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.picker-row:hover {
  background: var(--td-bg-color-secondarycontainer);
}

.picker-row-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  background: color-mix(in srgb, var(--row-accent) 14%, transparent);
  color: var(--row-accent);
}

.picker-row-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.picker-row-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--td-text-color-primary);
}

.picker-row-sub {
  font-size: 11px;
  line-height: 1.35;
  color: var(--td-text-color-placeholder);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
