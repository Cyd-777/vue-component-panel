<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import {
  LOGIC_STYLE_PROPERTIES,
  getLogicStylePropertySpec,
  isStyleTokenFilled,
  resolveStyleValueFromPreset,
} from './logicStyleToken'
import { detectTokenPreset } from '../editor/tokenBindLogic'

const VIEWPORT_MARGIN = 8
const ANCHOR_GAP = 6

const props = defineProps<{
  open: boolean
  x: number
  y: number
  prop: string
  value: string
}>()

const emit = defineEmits<{
  (e: 'confirm', payload: { prop: string; value: string }): void
  (e: 'close'): void
}>()

const panelRef = ref<HTMLElement | null>(null)
const fittedPos = ref({ x: 0, y: 0 })

const draftProp = ref('')
const draftValue = ref('')
const tokenPreset = ref('custom')
const customValue = ref('')

const spec = computed(() => getLogicStylePropertySpec(draftProp.value))

function fitPopoverToViewport(anchorX: number, anchorY: number) {
  const panel = panelRef.value
  if (!panel) {
    fittedPos.value = { x: anchorX, y: anchorY }
    return
  }

  const { width, height } = panel.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight

  let left = anchorX
  let top = anchorY

  if (left + width > vw - VIEWPORT_MARGIN) {
    left = vw - width - VIEWPORT_MARGIN
  }
  if (left < VIEWPORT_MARGIN) left = VIEWPORT_MARGIN

  if (top + height > vh - VIEWPORT_MARGIN) {
    const flipped = anchorY - height - ANCHOR_GAP
    top = flipped >= VIEWPORT_MARGIN
      ? flipped
      : Math.max(VIEWPORT_MARGIN, vh - height - VIEWPORT_MARGIN)
  }
  if (top < VIEWPORT_MARGIN) top = VIEWPORT_MARGIN

  fittedPos.value = { x: left, y: top }
}

async function updatePopoverPosition() {
  if (!props.open) return
  fittedPos.value = { x: props.x, y: props.y }
  await nextTick()
  fitPopoverToViewport(props.x, props.y)
}

watch(
  () => [props.open, props.prop, props.value] as const,
  ([open, prop, value]) => {
    if (!open) return
    draftProp.value = prop
    draftValue.value = value
    const propSpec = getLogicStylePropertySpec(prop)
    if (propSpec?.tokenOptions) {
      tokenPreset.value = detectTokenPreset(value, propSpec.tokenOptions)
      customValue.value = tokenPreset.value === 'custom' ? value : ''
    } else {
      tokenPreset.value = 'custom'
      customValue.value = value
    }
  },
  { immediate: true },
)

watch(
  () => [props.open, props.x, props.y] as const,
  ([open]) => {
    if (!open) return
    void updatePopoverPosition()
  },
)

watch([draftProp, tokenPreset, customValue], () => {
  if (props.open) void updatePopoverPosition()
})

watch(draftProp, (prop) => {
  const nextSpec = getLogicStylePropertySpec(prop)
  if (nextSpec?.tokenOptions) {
    tokenPreset.value = detectTokenPreset(draftValue.value, nextSpec.tokenOptions)
    customValue.value = tokenPreset.value === 'custom' ? draftValue.value : ''
  } else if (nextSpec?.selectOptions?.length) {
    customValue.value = draftValue.value || nextSpec.selectOptions[0].value
  }
})

function resolvedValue(): string {
  const s = getLogicStylePropertySpec(draftProp.value)
  if (s?.tokenOptions) {
    return resolveStyleValueFromPreset(draftProp.value, tokenPreset.value, customValue.value)
  }
  if (s?.type === 'select' && s.selectOptions?.length) {
    return customValue.value
  }
  return customValue.value.trim()
}

function onConfirm() {
  const prop = draftProp.value.trim()
  const value = resolvedValue()
  if (!isStyleTokenFilled(prop, value)) return
  emit('confirm', { prop, value })
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
  if (e.key === 'Enter') {
    e.preventDefault()
    onConfirm()
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="lsp-backdrop"
      @click="emit('close')"
    />
    <div
      v-if="open"
      ref="panelRef"
      class="lsp"
      :style="{ left: `${fittedPos.x}px`, top: `${fittedPos.y}px` }"
      @keydown="onKeydown"
    >
      <div class="lsp__head">样式变更</div>
      <p class="lsp__hint">作用于事件触发元素 · 导出为 `style.setProperty`</p>

      <label class="lsp__field">
        <span class="lsp__label">属性</span>
        <select v-model="draftProp" class="lsp__select">
          <option value="" disabled>选择属性</option>
          <option v-for="p in LOGIC_STYLE_PROPERTIES" :key="p.id" :value="p.id">
            {{ p.label }}
          </option>
        </select>
      </label>

      <label v-if="spec?.tokenOptions" class="lsp__field">
        <span class="lsp__label">值</span>
        <select v-model="tokenPreset" class="lsp__select">
          <option v-for="opt in spec.tokenOptions" :key="opt.id" :value="opt.id">
            {{ opt.label }}
          </option>
        </select>
        <input
          v-if="tokenPreset === 'custom'"
          v-model="customValue"
          class="lsp__input"
          placeholder="如 #0052d9 或 var(--td-brand-color)"
        />
      </label>

      <label v-else-if="spec?.selectOptions" class="lsp__field">
        <span class="lsp__label">值</span>
        <select v-model="customValue" class="lsp__select">
          <option v-for="opt in spec.selectOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </label>

      <label v-else-if="spec" class="lsp__field">
        <span class="lsp__label">值</span>
        <input
          v-model="customValue"
          class="lsp__input"
          :placeholder="spec.placeholder ?? '属性值'"
        />
      </label>

      <div class="lsp__foot">
        <button type="button" class="lsp__btn lsp__btn--ghost" @click="emit('close')">取消</button>
        <button
          type="button"
          class="lsp__btn lsp__btn--primary"
          :disabled="!draftProp || !resolvedValue().trim()"
          @click="onConfirm"
        >确定</button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.lsp-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: transparent;
}

.lsp {
  position: fixed;
  z-index: 1101;
  width: 260px;
  max-width: calc(100vw - 16px);
  max-height: calc(100vh - 16px);
  overflow-y: auto;
  padding: 12px;
  border-radius: 12px;
  background: var(--td-bg-color-container);
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.14), 0 0 0 1px var(--td-component-border);
}

.lsp__head {
  font-size: 13px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.lsp__hint {
  margin: 4px 0 10px;
  font-size: 10px;
  line-height: 1.4;
  color: var(--td-text-color-placeholder);
}

.lsp__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.lsp__label {
  font-size: 10px;
  font-weight: 600;
  color: var(--td-text-color-placeholder);
}

.lsp__select,
.lsp__input {
  width: 100%;
  box-sizing: border-box;
  font-size: 12px;
  padding: 7px 8px;
  border: 1px solid var(--td-component-border);
  border-radius: 8px;
  background: var(--td-bg-color-container);
  color: var(--td-text-color-primary);
}

.lsp__foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

.lsp__btn {
  border: none;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
}

.lsp__btn--ghost {
  background: transparent;
  color: var(--td-text-color-secondary);
}

.lsp__btn--ghost:hover {
  background: var(--td-bg-color-secondarycontainer);
}

.lsp__btn--primary {
  background: var(--td-brand-color);
  color: #fff;
}

.lsp__btn--primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
