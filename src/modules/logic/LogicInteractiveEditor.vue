<script setup lang="ts">
/**
 * LogicInteractiveEditor — 快捷指令式可交互代码编辑：内联标签 + 右键插入 + 样式飘窗
 */
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import LogicStylePopover from './LogicStylePopover.vue'
import {
  encodeStyleTokenPayload,
  isStyleTokenFilled,
  parseStyleTokenPayload,
  styleTokenChipLabel,
} from './logicStyleToken'
import {
  parseLogicBody,
  type LogicTokenContext,
  type LogicTokenKind,
} from './logicTokens'

const props = withDefaults(defineProps<{
  modelValue?: string
  tokenContext: LogicTokenContext
  minHeight?: number
  placeholder?: string
}>(), {
  modelValue: '',
  minHeight: 88,
  placeholder: '右键插入变量、样式…',
})

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
}>()

const rootRef = ref<HTMLElement | null>(null)
const menuOpen = ref(false)
const menuPos = ref({ x: 0, y: 0 })
const suppressSync = ref(false)

const stylePopoverOpen = ref(false)
const stylePopoverPos = ref({ x: 0, y: 0 })
const stylePopoverProp = ref('')
const stylePopoverValue = ref('')
let editingStyleChip: HTMLSpanElement | null = null

const isEmpty = computed(() => !props.modelValue.trim())

const menuSections = computed(() => {
  const sections: { title: string; kind: LogicTokenKind; items: { name: string; label?: string }[] }[] = []
  if (props.tokenContext.variables.length) {
    sections.push({ title: '变量', kind: 'var', items: props.tokenContext.variables })
  }
  if (props.tokenContext.methods.length) {
    sections.push({ title: '方法', kind: 'method', items: props.tokenContext.methods })
  }
  if (props.tokenContext.props.length) {
    sections.push({ title: 'Props', kind: 'prop', items: props.tokenContext.props })
  }
  if (props.tokenContext.emits.length) {
    sections.push({ title: 'Emits', kind: 'emit', items: props.tokenContext.emits })
  }
  return sections
})

function chipLabel(kind: LogicTokenKind, name: string): string {
  if (kind === 'style') {
    const { prop, value } = parseStyleTokenPayload(name)
    return styleTokenChipLabel(prop, value)
  }
  switch (kind) {
    case 'var':
      return name
    case 'method':
      return `${name}()`
    case 'prop':
      return `:${name}`
    case 'emit':
      return `↑${name}`
    default:
      return name
  }
}

function createChipEl(kind: LogicTokenKind, name: string): HTMLSpanElement {
  if (kind === 'style') {
    return createStyleChipElFromPayload(name)
  }
  const chip = document.createElement('span')
  chip.className = `lie-chip lie-chip--${kind}`
  chip.contentEditable = 'false'
  chip.dataset.token = `${kind}:${name}`
  chip.textContent = chipLabel(kind, name)
  chip.title = `${kind}:${name}`
  return chip
}

function createStyleChipElFromPayload(payload: string): HTMLSpanElement {
  const { prop, value } = parseStyleTokenPayload(payload)
  return createStyleChipEl(prop, value)
}

function createStyleChipEl(prop: string, value: string): HTMLSpanElement {
  const chip = document.createElement('span')
  chip.className = 'lie-chip lie-chip--style'
  if (!isStyleTokenFilled(prop, value)) chip.classList.add('lie-chip--style-empty')
  chip.contentEditable = 'false'
  chip.dataset.token = `style:${encodeStyleTokenPayload(prop, value)}`
  chip.textContent = styleTokenChipLabel(prop, value)
  chip.title = isStyleTokenFilled(prop, value) ? `${prop}: ${value}` : '点击配置样式'
  return chip
}

function updateStyleChip(chip: HTMLSpanElement, prop: string, value: string) {
  chip.dataset.token = `style:${encodeStyleTokenPayload(prop, value)}`
  chip.textContent = styleTokenChipLabel(prop, value)
  chip.title = `${prop}: ${value}`
  chip.classList.toggle('lie-chip--style-empty', !isStyleTokenFilled(prop, value))
}

function serializeEditor(): string {
  const root = rootRef.value
  if (!root) return ''

  function walk(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent ?? ''
    }
    if (node instanceof HTMLElement) {
      const token = node.dataset.token
      if (token) return `⟦${token}⟧`
      if (node.tagName === 'BR') return '\n'
      let out = ''
      for (const child of node.childNodes) out += walk(child)
      return out
    }
    return ''
  }

  return walk(root)
}

function renderEditor(raw: string) {
  const root = rootRef.value
  if (!root) return
  root.innerHTML = ''
  const segments = parseLogicBody(raw)
  if (segments.length === 1 && segments[0].type === 'text' && !segments[0].value) {
    return
  }
  for (const seg of segments) {
    if (seg.type === 'token' && seg.tokenKind && seg.tokenName !== undefined) {
      root.appendChild(createChipEl(seg.tokenKind, seg.tokenName))
    } else if (seg.value) {
      const parts = seg.value.split('\n')
      parts.forEach((part, i) => {
        if (part) root.appendChild(document.createTextNode(part))
        if (i < parts.length - 1) root.appendChild(document.createElement('br'))
      })
    }
  }
}

function emitUpdate() {
  emit('update:modelValue', serializeEditor())
}

function onInput() {
  if (suppressSync.value) return
  emitUpdate()
}

function onContextMenu(e: MouseEvent) {
  e.preventDefault()
  menuPos.value = { x: e.clientX, y: e.clientY }
  menuOpen.value = true
  rootRef.value?.focus()
}

function closeMenu() {
  menuOpen.value = false
}

function insertChipAtCursor(chip: HTMLSpanElement) {
  const root = rootRef.value
  if (!root) return chip

  const sel = window.getSelection()
  if (sel && sel.rangeCount > 0 && root.contains(sel.anchorNode)) {
    const range = sel.getRangeAt(0)
    range.deleteContents()
    range.insertNode(chip)
    range.setStartAfter(chip)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
  } else {
    root.appendChild(chip)
  }
  return chip
}

function insertToken(kind: LogicTokenKind, name: string) {
  closeMenu()
  const root = rootRef.value
  if (!root) return

  insertChipAtCursor(createChipEl(kind, name))
  emitUpdate()
  root.focus()
}

function openStylePopover(chip: HTMLSpanElement | null, x: number, y: number) {
  editingStyleChip = chip
  const payload = chip
    ? parseStyleTokenPayload(chip.dataset.token?.replace(/^style:/, '') ?? '|')
    : { prop: 'color', value: '' }
  stylePopoverProp.value = payload.prop || 'color'
  stylePopoverValue.value = payload.value
  stylePopoverPos.value = { x, y }
  stylePopoverOpen.value = true
}

function insertStyleChange() {
  closeMenu()
  const root = rootRef.value
  if (!root) return

  const chip = createStyleChipEl('', '')
  insertChipAtCursor(chip)
  emitUpdate()
  openStylePopover(chip, menuPos.value.x, menuPos.value.y + 4)
  root.focus()
}

function onStylePopoverConfirm(payload: { prop: string; value: string }) {
  if (editingStyleChip) {
    updateStyleChip(editingStyleChip, payload.prop, payload.value)
    emitUpdate()
  }
  closeStylePopover()
  rootRef.value?.focus()
}

function closeStylePopover() {
  stylePopoverOpen.value = false
  editingStyleChip = null
}

function onEditorClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  const chip = target.closest('.lie-chip--style') as HTMLSpanElement | null
  if (!chip || !rootRef.value?.contains(chip)) return
  e.preventDefault()
  e.stopPropagation()
  const rect = chip.getBoundingClientRect()
  openStylePopover(chip, rect.left, rect.bottom + 6)
}

function onDocClick(e: MouseEvent) {
  if (menuOpen.value) {
    const target = e.target as Node
    if (!(target instanceof HTMLElement && target.closest('.lie-menu'))) {
      closeMenu()
    }
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    closeMenu()
    closeStylePopover()
  }
}

watch(
  () => props.modelValue,
  async (val) => {
    if (suppressSync.value) return
    const current = serializeEditor()
    if (val === current) return
    suppressSync.value = true
    renderEditor(val)
    await nextTick()
    suppressSync.value = false
  },
)

onMounted(() => {
  renderEditor(props.modelValue)
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKeyDown)
})
</script>

<template>
  <div class="lie-wrap">
    <div
      ref="rootRef"
      class="lie"
      :class="{ 'lie--empty': isEmpty }"
      :style="{ minHeight: `${minHeight}px` }"
      contenteditable
      spellcheck="false"
      :data-placeholder="placeholder"
      @input="onInput"
      @click="onEditorClick"
      @contextmenu="onContextMenu"
    />

    <div v-if="menuOpen" class="lie-menu" :style="{ left: `${menuPos.x}px`, top: `${menuPos.y}px` }">
      <section class="lie-menu__sec">
        <div class="lie-menu__title">样式</div>
        <button type="button" class="lie-menu__item" @click="insertStyleChange">
          <span class="lie-chip lie-chip--mini lie-chip--style lie-chip--style-empty">样式…</span>
          <span class="lie-menu__label">样式变更</span>
        </button>
      </section>

      <template v-if="menuSections.length === 0">
        <p class="lie-menu__empty">请先在左栏添加变量 / 方法 / API</p>
      </template>
      <template v-else>
        <section v-for="sec in menuSections" :key="sec.title" class="lie-menu__sec">
          <div class="lie-menu__title">{{ sec.title }}</div>
          <button
            v-for="item in sec.items"
            :key="`${sec.kind}-${item.name}`"
            type="button"
            class="lie-menu__item"
            @click="insertToken(sec.kind, item.name)"
          >
            <span class="lie-chip lie-chip--mini" :class="`lie-chip--${sec.kind}`">{{ chipLabel(sec.kind, item.name) }}</span>
            <span class="lie-menu__label">{{ item.label ?? item.name }}</span>
          </button>
        </section>
      </template>
    </div>

    <LogicStylePopover
      :open="stylePopoverOpen"
      :x="stylePopoverPos.x"
      :y="stylePopoverPos.y"
      :prop="stylePopoverProp"
      :value="stylePopoverValue"
      @confirm="onStylePopoverConfirm"
      @close="closeStylePopover"
    />

    <p class="lie-hint">右键插入 · 样式标签点击可修改 · 导出时展开为 TS</p>
  </div>
</template>

<style scoped>
.lie-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lie {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.6;
  color: var(--td-text-color-primary);
  border: 1px solid var(--td-component-border);
  border-radius: 8px;
  background: var(--td-bg-color-container);
  overflow: auto;
  outline: none;
  white-space: pre-wrap;
  word-break: break-word;
}

.lie:focus {
  border-color: var(--td-brand-color-light);
}

.lie--empty:empty::before {
  content: attr(data-placeholder);
  color: var(--td-text-color-placeholder);
  pointer-events: none;
}

.lie :deep(.lie-chip) {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  margin: 0 2px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  vertical-align: baseline;
  user-select: none;
  cursor: default;
}

.lie :deep(.lie-chip--var) {
  background: color-mix(in srgb, #007aff 16%, transparent);
  color: #007aff;
}

.lie :deep(.lie-chip--method) {
  background: color-mix(in srgb, #34c759 16%, transparent);
  color: #248a3d;
}

.lie :deep(.lie-chip--prop) {
  background: color-mix(in srgb, #5856d6 16%, transparent);
  color: #5856d6;
}

.lie :deep(.lie-chip--emit) {
  background: color-mix(in srgb, #ff9500 16%, transparent);
  color: #c93400;
}

.lie :deep(.lie-chip--style) {
  background: color-mix(in srgb, #af52de 14%, transparent);
  color: #8944ab;
  cursor: pointer;
}

.lie :deep(.lie-chip--style-empty) {
  border: 1px dashed color-mix(in srgb, #af52de 45%, var(--td-component-border));
  background: transparent;
  font-style: italic;
  opacity: 0.85;
}

.lie-menu {
  position: fixed;
  z-index: 1000;
  min-width: 180px;
  max-width: 260px;
  max-height: 320px;
  overflow: auto;
  padding: 6px 0;
  border-radius: 10px;
  background: var(--td-bg-color-container);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.14), 0 0 0 1px var(--td-component-border);
}

.lie-menu__sec + .lie-menu__sec {
  border-top: 1px solid var(--td-component-border);
  margin-top: 4px;
  padding-top: 4px;
}

.lie-menu__title {
  padding: 4px 12px 2px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--td-text-color-placeholder);
}

.lie-menu__item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.lie-menu__item:hover {
  background: var(--td-bg-color-secondarycontainer);
}

.lie-menu__empty {
  margin: 0;
  padding: 10px 12px;
  font-size: 11px;
  color: var(--td-text-color-placeholder);
}

.lie-menu__label {
  font-size: 12px;
  color: var(--td-text-color-primary);
}

.lie-chip--mini {
  padding: 1px 6px;
  font-size: 10px;
}

.lie-hint {
  margin: 0;
  font-size: 10px;
  color: var(--td-text-color-placeholder);
}
</style>
