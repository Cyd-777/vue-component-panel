<script setup lang="ts">
import type { LogicMethodDef } from './logicTypes'
import type { LogicTokenContext } from './logicTokens'
import LogicInteractiveEditor from './LogicInteractiveEditor.vue'

defineProps<{
  methods: LogicMethodDef[]
  tokenContext: LogicTokenContext
}>()

const emit = defineEmits<{
  (e: 'add'): void
  (e: 'remove', id: string): void
  (e: 'update', id: string, patch: Partial<LogicMethodDef>): void
}>()
</script>

<template>
  <div class="lp">
    <div class="lp__head">
      <span class="lp__title">函数 / 方法</span>
      <button type="button" class="lp__add" @click="emit('add')">+</button>
    </div>
    <p class="lp__hint">事件 handler 与业务方法 · 元素绑定后续</p>
    <div v-if="methods.length === 0" class="lp__empty">暂无方法</div>
    <div v-for="item in methods" :key="item.id" class="lp__card">
      <div class="lp__card-top">
        <input
          class="lp__input lp__input--name"
          :value="item.name"
          placeholder="函数名"
          @input="emit('update', item.id, { name: ($event.target as HTMLInputElement).value })"
        />
        <button type="button" class="lp__del" @click="emit('remove', item.id)">×</button>
      </div>
      <label class="lp__check">
        <input
          type="checkbox"
          :checked="item.isAsync"
          @change="emit('update', item.id, { isAsync: ($event.target as HTMLInputElement).checked })"
        />
        async
      </label>
      <div class="lp__row">
        <label class="lp__label">参数</label>
        <input
          class="lp__input"
          :value="item.params"
          placeholder="e: MouseEvent"
          @input="emit('update', item.id, { params: ($event.target as HTMLInputElement).value })"
        />
      </div>
      <div class="lp__field">
        <label class="lp__field-label">函数体</label>
        <LogicInteractiveEditor
          :model-value="item.body"
          :token-context="tokenContext"
          :min-height="96"
          @update:model-value="emit('update', item.id, { body: $event })"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.lp {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.lp__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.lp__title {
  font-size: 11px;
  font-weight: 600;
  color: var(--td-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.lp__add {
  padding: 2px 8px;
  font-size: 11px;
  border: 1px solid var(--td-brand-color);
  border-radius: var(--td-radius-small);
  background: var(--td-brand-color);
  color: #fff;
  cursor: pointer;
}

.lp__hint {
  margin: 0;
  font-size: 10px;
  color: var(--td-text-color-placeholder);
  line-height: 1.4;
}

.lp__empty {
  font-size: 12px;
  color: var(--td-text-color-placeholder);
  padding: 8px 0;
}

.lp__card {
  padding: 10px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-secondarycontainer);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.lp__card-top {
  display: flex;
  gap: 6px;
  align-items: center;
}

.lp__row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lp__label {
  width: 36px;
  flex-shrink: 0;
  font-size: 11px;
  color: var(--td-text-color-placeholder);
}

.lp__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lp__field-label {
  font-size: 11px;
  color: var(--td-text-color-placeholder);
}

.lp__input {
  flex: 1;
  min-width: 0;
  height: 26px;
  padding: 0 6px;
  font-size: 11px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-container);
}

.lp__input--name {
  font-weight: 600;
}

.lp__del {
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  color: var(--td-text-color-placeholder);
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}

.lp__del:hover {
  color: var(--td-error-color);
}

.lp__check {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--td-text-color-secondary);
}
</style>
