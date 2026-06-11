<script setup lang="ts">
import { computed } from 'vue'
import {
  LIFECYCLE_TIMELINE,
  type LogicLifecycleBlock,
  type VueLifecycleHook,
} from './logicTypes'
import LogicInteractiveEditor from './LogicInteractiveEditor.vue'
import type { LogicTokenContext } from './logicTokens'

const props = defineProps<{
  lifecycles: LogicLifecycleBlock[]
  tokenContext: LogicTokenContext
}>()

const emit = defineEmits<{
  (e: 'add', hook: VueLifecycleHook): void
  (e: 'remove', id: string): void
  (e: 'update', id: string, patch: Partial<LogicLifecycleBlock>): void
}>()

const blocksByHook = computed(() => {
  const map = new Map<VueLifecycleHook, LogicLifecycleBlock[]>()
  for (const block of props.lifecycles) {
    const list = map.get(block.hook) ?? []
    list.push(block)
    map.set(block.hook, list)
  }
  return map
})

function blocksForHook(hook: VueLifecycleHook): LogicLifecycleBlock[] {
  return blocksByHook.value.get(hook) ?? []
}
</script>

<template>
  <section class="lct">
    <div class="lct__head">
      <span class="lct__title">生命周期</span>
      <span class="lct__badge">script setup</span>
    </div>
    <p class="lct__intro">
      按 Vue 官方顺序排列；每个节点对应 <code>import { … } from 'vue'</code> 的固定钩子，非任意命名函数。同一钩子可添加多个回调。
    </p>

    <div class="lct__timeline">
      <div
        v-for="(phase, phaseIndex) in LIFECYCLE_TIMELINE"
        :key="phase.phase"
        class="lct__phase"
      >
        <div class="lct__phase-label">{{ phase.phase }}</div>

        <div
          v-for="(spec, hookIndex) in phase.hooks"
          :key="spec.hook"
          class="lct__node"
          :class="{ 'lct__node--optional': spec.optional }"
        >
          <div class="lct__rail">
            <span
              class="lct__dot"
              :class="{ 'lct__dot--filled': blocksForHook(spec.hook).length > 0 }"
            />
            <span
              v-if="!(phaseIndex === LIFECYCLE_TIMELINE.length - 1 && hookIndex === phase.hooks.length - 1)"
              class="lct__line"
            />
          </div>

          <div class="lct__content">
            <div class="lct__hook-row">
              <div class="lct__hook-meta">
                <span class="lct__hook-name-zh">{{ spec.labelZh }}</span>
                <code class="lct__hook-name">{{ spec.label }}</code>
                <span class="lct__hook-desc">{{ spec.description }}</span>
              </div>
              <button
                type="button"
                class="lct__add"
                :title="`添加 ${spec.labelZh}（${spec.label}）回调`"
                @click="emit('add', spec.hook)"
              >+</button>
            </div>

            <div v-if="blocksForHook(spec.hook).length === 0" class="lct__empty-slot">
              未添加回调
            </div>

            <div
              v-for="(block, blockIndex) in blocksForHook(spec.hook)"
              :key="block.id"
              class="lct__block lct__block--card"
            >
              <div class="lct__block-head">
                <span class="lct__block-label">{{ spec.labelZh }} · 回调 {{ blockIndex + 1 }}</span>
                <button type="button" class="lct__del" @click="emit('remove', block.id)">×</button>
              </div>
              <LogicInteractiveEditor
                :model-value="block.body"
                :token-context="tokenContext"
                :min-height="72"
                @update:model-value="emit('update', block.id, { body: $event })"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <p class="lct__hint">导出时写入 script · 右键可插入变量标签</p>
  </section>
</template>

<style scoped>
.lct {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lct__head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lct__title {
  font-size: 12px;
  font-weight: 600;
}

.lct__badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-secondarycontainer);
  color: var(--td-text-color-placeholder);
  border: 1px solid var(--td-component-border);
}

.lct__intro {
  margin: 0;
  font-size: 10px;
  line-height: 1.5;
  color: var(--td-text-color-secondary);
}

.lct__intro code {
  font-size: 10px;
}

.lct__timeline {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.lct__phase-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--td-text-color-placeholder);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
  padding-left: 28px;
}

.lct__node {
  display: flex;
  gap: 10px;
  align-items: stretch;
}

.lct__node--optional .lct__hook-name {
  opacity: 0.85;
}

.lct__rail {
  width: 18px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.lct__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--td-component-border);
  background: var(--td-bg-color-container);
  flex-shrink: 0;
  z-index: 1;
}

.lct__dot--filled {
  border-color: var(--td-brand-color);
  background: var(--td-brand-color);
  box-shadow: 0 0 0 2px var(--td-brand-color-light);
}

.lct__line {
  flex: 1;
  width: 2px;
  min-height: 12px;
  margin: 2px 0;
  background: var(--td-component-border);
}

.lct__content {
  flex: 1;
  min-width: 0;
  padding-bottom: 10px;
}

.lct__hook-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.lct__hook-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.lct__hook-name-zh {
  font-size: 12px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.lct__hook-name {
  font-size: 10px;
  font-weight: 500;
  color: var(--td-text-color-secondary);
}

.lct__hook-desc {
  font-size: 10px;
  color: var(--td-text-color-placeholder);
}

.lct__add {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  padding: 0;
  font-size: 14px;
  line-height: 1;
  border: 1px dashed var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-container);
  color: var(--td-text-color-secondary);
  cursor: pointer;
}

.lct__add:hover {
  border-color: var(--td-brand-color);
  color: var(--td-brand-color);
}

.lct__empty-slot {
  font-size: 10px;
  color: var(--td-text-color-placeholder);
  padding: 4px 0 2px;
}

.lct__block {
  margin-top: 6px;
  padding: 8px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-secondarycontainer);
}

.lct__block--card {
  border-radius: 10px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.lct__block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.lct__block-label {
  font-size: 10px;
  color: var(--td-text-color-placeholder);
}

.lct__preview {
  margin: 6px 0 0;
  padding: 6px 8px;
  font-size: 10px;
  line-height: 1.4;
  color: var(--td-text-color-placeholder);
  background: var(--td-bg-color-container);
  border-radius: var(--td-radius-small);
  overflow-x: auto;
  white-space: pre-wrap;
}

.lct__del {
  border: none;
  background: transparent;
  color: var(--td-text-color-placeholder);
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}

.lct__del:hover {
  color: var(--td-error-color);
}

.lct__hint {
  margin: 4px 0 0;
  font-size: 10px;
  color: var(--td-text-color-placeholder);
}
</style>
