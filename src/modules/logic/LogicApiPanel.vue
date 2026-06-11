<script setup lang="ts">
import type { LogicEmitDef, LogicPropDef, LogicPropType } from './logicTypes'

defineProps<{
  props: LogicPropDef[]
  emits: LogicEmitDef[]
}>()

const emit = defineEmits<{
  (e: 'add-prop'): void
  (e: 'remove-prop', id: string): void
  (e: 'update-prop', id: string, patch: Partial<LogicPropDef>): void
  (e: 'add-emit'): void
  (e: 'remove-emit', id: string): void
  (e: 'update-emit', id: string, patch: Partial<LogicEmitDef>): void
}>()

const propTypes: { value: LogicPropType; label: string }[] = [
  { value: 'string', label: 'string' },
  { value: 'number', label: 'number' },
  { value: 'boolean', label: 'boolean' },
  { value: 'object', label: 'object' },
  { value: 'array', label: 'array' },
  { value: 'any', label: 'any' },
]
</script>

<template>
  <div class="lp">
    <section class="lp__section">
      <div class="lp__head">
        <span class="lp__title">Props</span>
        <button type="button" class="lp__add" @click="emit('add-prop')">+</button>
      </div>
      <p class="lp__hint">defineProps · 尚未写回 script</p>
      <div v-if="props.length === 0" class="lp__empty">暂无 Props</div>
      <div v-for="item in props" :key="item.id" class="lp__card">
        <div class="lp__card-top">
          <input
            class="lp__input lp__input--name"
            :value="item.name"
            placeholder="名称"
            @input="emit('update-prop', item.id, { name: ($event.target as HTMLInputElement).value })"
          />
          <button type="button" class="lp__del" @click="emit('remove-prop', item.id)">×</button>
        </div>
        <div class="lp__row">
          <label class="lp__label">类型</label>
          <select
            class="lp__input"
            :value="item.type"
            @change="emit('update-prop', item.id, { type: ($event.target as HTMLSelectElement).value as LogicPropType })"
          >
            <option v-for="t in propTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
          </select>
        </div>
        <div class="lp__row">
          <label class="lp__label">默认</label>
          <input
            class="lp__input"
            :value="item.defaultValue"
            placeholder="默认值"
            @input="emit('update-prop', item.id, { defaultValue: ($event.target as HTMLInputElement).value })"
          />
        </div>
        <label class="lp__check">
          <input
            type="checkbox"
            :checked="item.required"
            @change="emit('update-prop', item.id, { required: ($event.target as HTMLInputElement).checked })"
          />
          必填
        </label>
      </div>
    </section>

    <section class="lp__section">
      <div class="lp__head">
        <span class="lp__title">Emits</span>
        <button type="button" class="lp__add" @click="emit('add-emit')">+</button>
      </div>
      <p class="lp__hint">defineEmits · 尚未写回 script</p>
      <div v-if="emits.length === 0" class="lp__empty">暂无 Emits</div>
      <div v-for="item in emits" :key="item.id" class="lp__card">
        <div class="lp__card-top">
          <input
            class="lp__input lp__input--name"
            :value="item.name"
            placeholder="事件名"
            @input="emit('update-emit', item.id, { name: ($event.target as HTMLInputElement).value })"
          />
          <button type="button" class="lp__del" @click="emit('remove-emit', item.id)">×</button>
        </div>
        <div class="lp__row">
          <label class="lp__label">载荷</label>
          <input
            class="lp__input"
            :value="item.payloadHint"
            placeholder="payload 说明（可选）"
            @input="emit('update-emit', item.id, { payloadHint: ($event.target as HTMLInputElement).value })"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.lp {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.lp__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
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
