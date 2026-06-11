<script setup lang="ts">
import type { LogicLifecycleBlock, VueLifecycleHook } from './logicTypes'
import type { LogicTokenContext } from './logicTokens'
import LogicLifecycleTimeline from './LogicLifecycleTimeline.vue'

defineProps<{
  lifecycles: LogicLifecycleBlock[]
  tokenContext: LogicTokenContext
}>()

const emit = defineEmits<{
  (e: 'add-lifecycle', hook: VueLifecycleHook): void
  (e: 'remove-lifecycle', id: string): void
  (e: 'update-lifecycle', id: string, patch: Partial<LogicLifecycleBlock>): void
}>()
</script>

<template>
  <div class="lcp">
    <p class="lcp__intro">
      单一组件里生命周期<strong>不是必用</strong>。常见只有「挂载完成」拉数据、「卸载清理」定时器；其余钩子按需添加。
    </p>

    <div class="lcp__body">
      <LogicLifecycleTimeline
        :lifecycles="lifecycles"
        :token-context="tokenContext"
        @add="(hook) => emit('add-lifecycle', hook)"
        @remove="(id) => emit('remove-lifecycle', id)"
        @update="(id, patch) => emit('update-lifecycle', id, patch)"
      />
    </div>
  </div>
</template>

<style scoped>
.lcp {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--td-bg-color-secondarycontainer);
}

.lcp__intro {
  flex-shrink: 0;
  margin: 0;
  padding: 10px 12px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--td-text-color-secondary);
  background: var(--td-bg-color-container);
  border-bottom: 1px solid var(--td-component-border);
}

.lcp__intro strong {
  color: var(--td-text-color-primary);
  font-weight: 600;
}

.lcp__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px;
}
</style>
