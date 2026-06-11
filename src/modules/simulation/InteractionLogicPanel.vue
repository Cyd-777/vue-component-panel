<script setup lang="ts">
import type { InteractionRule } from './simulationTypes'

defineProps<{
  rules: InteractionRule[]
  tagOptions: { index: string; label: string }[]
}>()

const emit = defineEmits<{
  (e: 'add'): void
  (e: 'remove', id: string): void
  (e: 'update-rule', id: string, patch: Partial<InteractionRule>): void
}>()

const triggers = [
  { value: 'click', label: '单击' },
  { value: 'dblclick', label: '双击' },
] as const

const actions = [
  { value: 'appendOutputLog', label: '写入流水' },
  { value: 'setOutput', label: '设置输出字段' },
  { value: 'setInput', label: '设置输入字段' },
] as const
</script>

<template>
  <div class="ilp">
    <div class="ilp__head">
      <span class="ilp__title">交互规则</span>
      <button type="button" class="ilp__add" @click="emit('add')">+ 规则</button>
    </div>
    <p class="ilp__hint">编写方法 / 事件处理函数，并将触发事件绑定到画布元素（当前为规则原型，后续写回 script 与 template）。</p>

    <div v-if="rules.length === 0" class="ilp__empty">暂无规则，点击上方添加</div>

    <div v-for="rule in rules" :key="rule.id" class="ilp__rule">
      <div class="ilp__rule-top">
        <input
          class="ilp__input ilp__input--name"
          :value="rule.name"
          placeholder="规则名称"
          @input="emit('update-rule', rule.id, { name: ($event.target as HTMLInputElement).value })"
        />
        <button type="button" class="ilp__del" title="删除" @click="emit('remove', rule.id)">×</button>
      </div>
      <div class="ilp__row">
        <label class="ilp__label">元素</label>
        <select
          class="ilp__input"
          :value="rule.targetElIndex"
          @change="emit('update-rule', rule.id, { targetElIndex: ($event.target as HTMLSelectElement).value })"
        >
          <option value="">任意</option>
          <option v-for="t in tagOptions" :key="t.index" :value="t.index">{{ t.label }}</option>
        </select>
      </div>
      <div class="ilp__row">
        <label class="ilp__label">触发</label>
        <select
          class="ilp__input"
          :value="rule.trigger"
          @change="emit('update-rule', rule.id, { trigger: ($event.target as HTMLSelectElement).value as InteractionRule['trigger'] })"
        >
          <option v-for="t in triggers" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
      </div>
      <div class="ilp__row">
        <label class="ilp__label">动作</label>
        <select
          class="ilp__input"
          :value="rule.action"
          @change="emit('update-rule', rule.id, { action: ($event.target as HTMLSelectElement).value as InteractionRule['action'] })"
        >
          <option v-for="a in actions" :key="a.value" :value="a.value">{{ a.label }}</option>
        </select>
      </div>
      <div class="ilp__row">
        <label class="ilp__label">键</label>
        <input
          class="ilp__input"
          :value="rule.payloadKey"
          @input="emit('update-rule', rule.id, { payloadKey: ($event.target as HTMLInputElement).value })"
        />
      </div>
      <div class="ilp__row">
        <label class="ilp__label">值</label>
        <input
          class="ilp__input"
          :value="rule.payloadValue"
          @input="emit('update-rule', rule.id, { payloadValue: ($event.target as HTMLInputElement).value })"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.ilp {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ilp__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ilp__title {
  font-size: 11px;
  font-weight: 600;
  color: var(--td-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.ilp__add {
  padding: 2px 8px;
  font-size: 11px;
  border: 1px solid var(--td-brand-color);
  border-radius: var(--td-radius-small);
  background: var(--td-brand-color);
  color: #fff;
  cursor: pointer;
}

.ilp__hint {
  margin: 0;
  font-size: 10px;
  color: var(--td-text-color-placeholder);
  line-height: 1.4;
}

.ilp__empty {
  font-size: 12px;
  color: var(--td-text-color-placeholder);
  padding: 12px 0;
}

.ilp__rule {
  padding: 10px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-secondarycontainer);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ilp__rule-top {
  display: flex;
  gap: 6px;
  align-items: center;
}

.ilp__row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ilp__label {
  width: 36px;
  flex-shrink: 0;
  font-size: 11px;
  color: var(--td-text-color-placeholder);
}

.ilp__input {
  flex: 1;
  min-width: 0;
  height: 26px;
  padding: 0 6px;
  font-size: 11px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-container);
}

.ilp__input--name {
  font-weight: 600;
}

.ilp__del {
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  color: var(--td-text-color-placeholder);
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}

.ilp__del:hover {
  color: var(--td-error-color);
}
</style>
