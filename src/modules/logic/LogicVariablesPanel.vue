<script setup lang="ts">
import type { LogicVarKind, LogicVariableDef } from './logicTypes'

defineProps<{
  variables: LogicVariableDef[]
}>()

const emit = defineEmits<{
  (e: 'add'): void
  (e: 'remove', id: string): void
  (e: 'update', id: string, patch: Partial<LogicVariableDef>): void
}>()

const kinds: { value: LogicVarKind; label: string }[] = [
  { value: 'ref', label: 'ref' },
  { value: 'reactive', label: 'reactive' },
]
</script>

<template>
  <div class="lp">
    <div class="lp__head">
      <span class="lp__title">变量声明</span>
      <button type="button" class="lp__add" @click="emit('add')">+</button>
    </div>
    <p class="lp__hint">ref / reactive · 绑定与 codegen 后续</p>
    <div v-if="variables.length === 0" class="lp__empty">暂无变量</div>
    <div v-for="item in variables" :key="item.id" class="lp__card">
      <div class="lp__card-top">
        <input
          class="lp__input lp__input--name"
          :value="item.name"
          placeholder="变量名"
          @input="emit('update', item.id, { name: ($event.target as HTMLInputElement).value })"
        />
        <button type="button" class="lp__del" @click="emit('remove', item.id)">×</button>
      </div>
      <div class="lp__row">
        <label class="lp__label">种类</label>
        <select
          class="lp__input"
          :value="item.kind"
          @change="emit('update', item.id, { kind: ($event.target as HTMLSelectElement).value as LogicVarKind })"
        >
          <option v-for="k in kinds" :key="k.value" :value="k.value">{{ k.label }}</option>
        </select>
      </div>
      <div class="lp__row">
        <label class="lp__label">类型</label>
        <input
          class="lp__input"
          :value="item.typeHint"
          placeholder="如 number"
          @input="emit('update', item.id, { typeHint: ($event.target as HTMLInputElement).value })"
        />
      </div>
      <div class="lp__row">
        <label class="lp__label">初值</label>
        <input
          class="lp__input"
          :value="item.initialValue"
          placeholder="0 / '' / {}"
          @input="emit('update', item.id, { initialValue: ($event.target as HTMLInputElement).value })"
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
</style>
