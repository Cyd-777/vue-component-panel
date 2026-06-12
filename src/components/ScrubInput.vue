<script setup lang="ts">
/**
 * 一体式图标 + 数值输入；按住图标左右拖拽改值（Shift 10 倍步进）。
 */
import { ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: number
    icon?: string
    min?: number
    max?: number
    step?: number
    /** 输入框右侧单位提示，如 px */
    suffix?: string
    narrow?: boolean
    disabled?: boolean
  }>(),
  {
    icon: '#',
    min: 0,
    max: 9999,
    step: 1,
    suffix: '',
    narrow: true,
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
  focus: [ev: FocusEvent]
  blur: [ev: FocusEvent]
}>()

const draft = ref(formatDraft(props.modelValue))

watch(
  () => props.modelValue,
  (v) => {
    draft.value = formatDraft(v)
  },
)

function clamp(n: number): number {
  return Math.max(props.min, Math.min(props.max, n))
}

function formatDraft(n: number): string {
  if (!Number.isFinite(n)) return '0'
  const rounded =
    props.step >= 1 ? String(Math.round(n)) : String(Math.round(n * 10) / 10)
  return rounded
}

function commitDraft() {
  const n = Number(draft.value)
  if (!Number.isFinite(n)) {
    draft.value = formatDraft(props.modelValue)
    return
  }
  emit('update:modelValue', clamp(n))
}

function onInput(e: Event) {
  draft.value = (e.target as HTMLInputElement).value
}

const SCRUB_PX_PER_STEP = 4

function onIconPointerDown(e: PointerEvent) {
  if (props.disabled) return
  e.preventDefault()
  const handle = e.currentTarget as HTMLElement
  handle.setPointerCapture(e.pointerId)

  const startX = e.clientX
  const startValue = props.modelValue

  const onMove = (ev: PointerEvent) => {
    const mult = ev.shiftKey ? 10 : 1
    const deltaSteps = Math.round((ev.clientX - startX) / SCRUB_PX_PER_STEP)
    const next = clamp(startValue + deltaSteps * props.step * mult)
    emit('update:modelValue', next)
  }

  const onUp = (ev: PointerEvent) => {
    handle.releasePointerCapture(ev.pointerId)
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onUp)
  }

  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onUp)
}
</script>

<template>
  <div
    class="scrub"
    :class="{ 'scrub--narrow': narrow, 'scrub--disabled': disabled }"
  >
    <button
      type="button"
      class="scrub__icon"
      :title="'拖拽改值' + (step !== 1 ? `（步进 ${step}）` : '') + '，Shift 加速'"
      :disabled="disabled"
      @pointerdown="onIconPointerDown"
    >{{ icon }}</button>
    <input
      class="scrub__input"
      type="text"
      inputmode="decimal"
      :value="draft"
      :disabled="disabled"
      @input="onInput"
      @change="commitDraft"
      @keydown.enter.prevent="commitDraft"
      @focus="emit('focus', $event)"
      @blur="emit('blur', $event)"
    />
    <span v-if="suffix" class="scrub__suffix">{{ suffix }}</span>
  </div>
</template>

<style scoped>
.scrub {
  display: inline-flex;
  align-items: stretch;
  height: 28px;
  min-width: 0;
  flex: 1;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-container);
  overflow: hidden;
}

.scrub--narrow {
  flex: 0 0 88px;
  width: 88px;
}

.scrub--disabled {
  opacity: 0.55;
}

.scrub:focus-within {
  border-color: var(--td-brand-color);
  box-shadow: inset 0 0 0 1px var(--td-brand-color);
}

.scrub__icon {
  flex: 0 0 26px;
  width: 26px;
  margin: 0;
  padding: 0;
  border: none;
  border-right: 1px solid var(--td-component-border);
  background: var(--td-bg-color-secondarycontainer);
  color: var(--td-text-color-secondary);
  font-size: 11px;
  line-height: 1;
  cursor: ew-resize;
  touch-action: none;
  user-select: none;
}

.scrub__icon:hover:not(:disabled) {
  background: var(--td-brand-color-light);
  color: var(--td-brand-color);
}

.scrub__icon:active:not(:disabled) {
  background: var(--td-brand-color-2, var(--td-brand-color-light));
}

.scrub__input {
  flex: 1;
  min-width: 0;
  width: 100%;
  margin: 0;
  padding: 0 6px;
  border: none;
  background: transparent;
  font-size: 12px;
  color: var(--td-text-color-primary);
  outline: none;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.scrub__suffix {
  flex: 0 0 auto;
  padding: 0 6px 0 0;
  font-size: 10px;
  color: var(--td-text-color-placeholder);
  line-height: 28px;
  user-select: none;
}
</style>
