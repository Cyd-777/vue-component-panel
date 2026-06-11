<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, toRaw } from 'vue'
import ScrubInput from '../modules/editor/ScrubInput.vue'
import {
  MOTION_PROPERTY_PRESETS,
  MOTION_TIMING_OPTIONS,
  type MotionPropertyPresetId,
  type MotionTimingId,
} from '../modules/editor/motionStyleSpec'
import {
  STYLE_PRESET_CATEGORY_LABELS,
  getStylePresetSections,
  isFullWidthPresetField,
  isIconEnumField,
  isSynthesisEnumField,
  mergeStylePresetProperties,
  presetPropertiesToInlineStyle,
  stylePresetCssClass,
  type StylePreset,
  type StylePresetCategory,
  type StylePresetFieldDef,
} from '../tokens/stylePresetDefs'
import {
  createStylePresetDraft,
  deleteStylePreset,
  getStylePresetById,
  presetReferenceToken,
  saveStylePreset,
} from '../tokens/stylePresetStore'
import {
  FONT_SMOOTH_ICON_OPTIONS,
  FONT_SYNTHESIS_ICON_OPTIONS,
  cssPropertyPreviewStyle,
  fontSmoothPreviewStyle,
  getFontCssGlyphIconConfig,
  getIconEnumOptions,
  TEXT_DECORATION_LINE_ICON_OPTIONS,
  TEXT_DECORATION_STYLE_ICON_OPTIONS,
  TEXT_TRANSFORM_ICON_OPTIONS,
  textDecorationLinePreviewStyle,
} from './styleEditorVisualOptions'

const props = defineProps<{
  category: StylePresetCategory
  /** 已有样式 id；省略则为新建 */
  presetId?: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', preset: StylePreset): void
}>()

const isNew = computed(() => !props.presetId)
const originalId = ref(props.presetId ?? '')
const backdropReady = ref(false)

function clonePreset(source: StylePreset): StylePreset {
  return JSON.parse(JSON.stringify(toRaw(source))) as StylePreset
}

function buildDraft(): StylePreset {
  const existing = props.presetId ? getStylePresetById(props.presetId) : undefined
  const base = existing ? clonePreset(existing) : createStylePresetDraft(props.category)
  base.properties = mergeStylePresetProperties(props.category, base.properties)
  return base
}

const draft = reactive<StylePreset>(buildDraft())

const sections = computed(() => getStylePresetSections(props.category))
const categoryLabel = computed(() => STYLE_PRESET_CATEGORY_LABELS[props.category])

const previewStyle = computed(() => presetPropertiesToInlineStyle(draft.properties))

const motionDurationMs = computed(() => {
  const raw = draft.properties['transition-duration'] ?? '0ms'
  return parseNumericProp(raw)
})

const motionPropertyPreset = computed((): MotionPropertyPresetId => {
  const raw = draft.properties['transition-property'] ?? 'all'
  const preset = MOTION_PROPERTY_PRESETS.find((p) => p.id !== 'custom' && p.value === raw)
  if (preset) return preset.id
  if (raw === 'all' || !raw) return 'all'
  return 'custom'
})

function parseNumericProp(raw: string): number {
  const n = parseFloat(raw)
  return Number.isFinite(n) ? n : 0
}

function propValue(def: StylePresetFieldDef): string {
  return draft.properties[def.cssProperty] ?? def.default
}

function setProp(def: StylePresetFieldDef, value: string) {
  draft.properties[def.cssProperty] = value
}

function formatNumericProp(def: StylePresetFieldDef, n: number): string {
  if (def.cssProperty.startsWith('transition-')) return `${Math.max(0, Math.round(n))}ms`
  if (def.type === 'fontWeight') return String(Math.round(n))
  const step = def.step ?? 1
  const rounded = step < 1 ? Math.round(n * 10) / 10 : Math.round(n)
  return `${rounded}px`
}

function numericValue(def: StylePresetFieldDef): number {
  return parseNumericProp(propValue(def))
}

function setNumericValue(def: StylePresetFieldDef, n: number) {
  const min = def.min ?? -999
  const max = def.max ?? 9999
  const clamped = Math.min(max, Math.max(min, n))
  setProp(def, formatNumericProp(def, clamped))
}

function findField(cssProperty: string): StylePresetFieldDef {
  const def = sections.value.flatMap((s) => s.fields).find((f) => f.cssProperty === cssProperty)
  if (!def) throw new Error(`Missing preset field: ${cssProperty}`)
  return def
}

function setMotionPropertyPreset(id: MotionPropertyPresetId) {
  const preset = MOTION_PROPERTY_PRESETS.find((p) => p.id === id)
  if (id === 'custom' || !preset?.value) return
  setProp(findField('transition-property'), preset.value)
}

function setMotionPropertyCustom(raw: string) {
  setProp(findField('transition-property'), raw.trim() || 'all')
}

function setMotionTiming(id: MotionTimingId) {
  setProp(findField('transition-timing-function'), id)
}

function fieldTitle(def: StylePresetFieldDef): string {
  return `${def.label} · ${def.cssProperty}`
}

function iconEnumGlyph(def: StylePresetFieldDef, value: string): string {
  if (def.iconEnumKey === 'textTransform') return value === 'none' ? 'Aa' : 'aa'
  if (def.iconEnumKey === 'textDecorationLine') return 'ab'
  const glyphConfig = def.iconEnumKey ? getFontCssGlyphIconConfig(def.iconEnumKey) : undefined
  return glyphConfig?.glyph ?? 'A'
}

function saveDraft() {
  const name = draft.name.trim()
  if (!name) {
    draft.name = '未命名样式'
  }
  const saved = clonePreset(draft as StylePreset)
  saveStylePreset(saved)
  emit('saved', saved)
  emit('close')
}

function removeDraft() {
  if (!isNew.value && originalId.value) {
    deleteStylePreset(originalId.value)
  }
  emit('close')
}

function resetDraftDefaults() {
  const fresh = createStylePresetDraft(props.category)
  draft.name = fresh.name
  Object.assign(draft.properties, mergeStylePresetProperties(props.category, fresh.properties))
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    emit('close')
  }
}

function onBackdropClick() {
  if (!backdropReady.value) return
  emit('close')
}

onMounted(() => {
  document.body.style.overflow = 'hidden'
  document.addEventListener('keydown', onKeydown)
  requestAnimationFrame(() => {
    backdropReady.value = true
  })
})

onUnmounted(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div class="style-modal" @click.self="onBackdropClick">
      <div class="style-modal__dialog" role="dialog" aria-modal="true" :aria-label="`${categoryLabel}编辑`">
        <header class="style-modal__head">
          <div class="style-modal__head-main">
            <p class="style-modal__eyebrow">{{ isNew ? '新建样式' : '编辑样式' }}</p>
            <input
              v-model="draft.name"
              class="style-modal__name-input"
              type="text"
              placeholder="样式名称"
              aria-label="样式名称"
            />
            <p class="style-modal__meta">
              <code>{{ presetReferenceToken(draft.id) }}</code>
              · 类名 <code>.{{ stylePresetCssClass(draft.id) }}</code>
            </p>
          </div>
          <button type="button" class="style-modal__close" title="关闭 (Esc)" @click="emit('close')">×</button>
        </header>

        <section class="style-modal__preview">
          <p class="style-modal__preview-label">效果预览</p>

          <template v-if="category === 'font'">
            <p class="style-modal__font-sample" :style="previewStyle">
              The quick brown fox · 可视化组件开发平台 · 0123456789
            </p>
          </template>

          <template v-else-if="category === 'effect'">
            <div class="style-modal__effect-card" :style="previewStyle">
              样式预览卡片
            </div>
          </template>

          <template v-else>
            <div class="style-modal__motion-demo" :style="previewStyle">
              <span class="style-modal__motion-label">Hover me</span>
              <span class="style-modal__motion-sub">悬停查看动效</span>
            </div>
          </template>
        </section>

        <div class="style-modal__scroll">
          <section class="style-modal__form">
            <p class="style-modal__form-hint">组合一组 CSS 属性并命名，保存后可在组件画板引用，并写入全局 CSS 变量。</p>

            <div v-for="section in sections" :key="section.title" class="style-modal__section">
              <h3 class="style-modal__section-title">{{ section.title }}</h3>
              <div class="style-modal__section-grid">
                <div
                  v-for="def in section.fields"
                  :key="def.cssProperty"
                  class="style-modal__field"
                  :class="{
                    'style-modal__field--full': isFullWidthPresetField(def),
                    'style-modal__field--icon-radio': isIconEnumField(def) || isSynthesisEnumField(def),
                  }"
                >
                <label class="style-modal__field-label" :title="fieldTitle(def)">{{ def.label }}</label>
                <div class="style-modal__field-control">
                  <div
                    v-if="isIconEnumField(def) && def.iconEnumKey === 'textTransform'"
                    class="style-modal__icon-radio"
                    role="radiogroup"
                    :aria-label="def.label"
                  >
                    <button
                      v-for="opt in TEXT_TRANSFORM_ICON_OPTIONS"
                      :key="opt.value"
                      type="button"
                      class="style-modal__icon-radio-btn"
                      :class="{ 'style-modal__icon-radio-btn--active': propValue(def) === opt.value }"
                      :title="opt.label"
                      :aria-label="opt.label"
                      role="radio"
                      @click="setProp(def, opt.value)"
                    >
                      <span
                        class="style-modal__tt-glyph"
                        :class="`style-modal__tt-glyph--${opt.value}`"
                        aria-hidden="true"
                      >{{ opt.value === 'none' ? 'Aa' : 'aa' }}</span>
                    </button>
                  </div>

                  <div
                    v-else-if="isIconEnumField(def) && def.iconEnumKey === 'textDecorationLine'"
                    class="style-modal__icon-radio"
                    role="radiogroup"
                    :aria-label="def.label"
                  >
                    <button
                      v-for="opt in TEXT_DECORATION_LINE_ICON_OPTIONS"
                      :key="opt.value"
                      type="button"
                      class="style-modal__icon-radio-btn"
                      :class="{ 'style-modal__icon-radio-btn--active': propValue(def) === opt.value }"
                      :title="opt.label"
                      :aria-label="opt.label"
                      role="radio"
                      @click="setProp(def, opt.value)"
                    >
                      <span
                        class="style-modal__deco-line-glyph"
                        :style="textDecorationLinePreviewStyle(opt.value)"
                        aria-hidden="true"
                      >ab</span>
                    </button>
                  </div>

                  <div
                    v-else-if="isIconEnumField(def) && def.iconEnumKey === 'textDecorationStyle'"
                    class="style-modal__icon-radio"
                    role="radiogroup"
                    :aria-label="def.label"
                  >
                    <button
                      v-for="opt in TEXT_DECORATION_STYLE_ICON_OPTIONS"
                      :key="opt.value"
                      type="button"
                      class="style-modal__icon-radio-btn"
                      :class="{ 'style-modal__icon-radio-btn--active': propValue(def) === opt.value }"
                      :title="opt.label"
                      :aria-label="opt.label"
                      role="radio"
                      @click="setProp(def, opt.value)"
                    >
                      <span
                        v-if="opt.value !== 'wavy'"
                        class="style-modal__deco-line"
                        :class="`style-modal__deco-line--${opt.value}`"
                        aria-hidden="true"
                      />
                      <svg v-else class="style-modal__deco-wavy" viewBox="0 0 24 8" aria-hidden="true">
                        <path
                          d="M0 4 Q3 1 6 4 T12 4 T18 4 T24 4"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                        />
                      </svg>
                    </button>
                  </div>

                  <div
                    v-else-if="isIconEnumField(def) && def.iconEnumKey === 'fontSmooth'"
                    class="style-modal__icon-radio"
                    role="radiogroup"
                    :aria-label="def.label"
                  >
                    <button
                      v-for="opt in FONT_SMOOTH_ICON_OPTIONS"
                      :key="opt.value"
                      type="button"
                      class="style-modal__icon-radio-btn"
                      :class="{ 'style-modal__icon-radio-btn--active': propValue(def) === opt.value }"
                      :title="opt.label"
                      :aria-label="opt.label"
                      role="radio"
                      @click="setProp(def, opt.value)"
                    >
                      <span
                        class="style-modal__smooth-glyph"
                        :style="fontSmoothPreviewStyle(opt.value)"
                        aria-hidden="true"
                      >A</span>
                    </button>
                  </div>

                  <div
                    v-else-if="isSynthesisEnumField(def)"
                    class="style-modal__icon-radio"
                    role="radiogroup"
                    :aria-label="def.label"
                  >
                    <button
                      v-for="opt in FONT_SYNTHESIS_ICON_OPTIONS"
                      :key="opt.value"
                      type="button"
                      class="style-modal__icon-radio-btn"
                      :class="{ 'style-modal__icon-radio-btn--active': propValue(def) === opt.value }"
                      :title="opt.label"
                      :aria-label="opt.label"
                      role="radio"
                      @click="setProp(def, opt.value)"
                    >
                      <span class="style-modal__enum-glyph style-modal__enum-glyph--synthesis" aria-hidden="true">
                        {{ opt.glyph }}
                      </span>
                    </button>
                  </div>

                  <div
                    v-else-if="isIconEnumField(def) && getFontCssGlyphIconConfig(def.iconEnumKey!)"
                    class="style-modal__icon-radio"
                    role="radiogroup"
                    :aria-label="def.label"
                  >
                    <button
                      v-for="opt in getFontCssGlyphIconConfig(def.iconEnumKey!)!.options"
                      :key="opt.value"
                      type="button"
                      class="style-modal__icon-radio-btn"
                      :class="{ 'style-modal__icon-radio-btn--active': propValue(def) === opt.value }"
                      :title="opt.label"
                      :aria-label="opt.label"
                      role="radio"
                      @click="setProp(def, opt.value)"
                    >
                      <span
                        class="style-modal__enum-glyph"
                        :style="cssPropertyPreviewStyle(def.cssProperty, opt.value)"
                        aria-hidden="true"
                      >{{ getFontCssGlyphIconConfig(def.iconEnumKey!)!.glyph }}</span>
                    </button>
                  </div>

                  <div
                    v-else-if="isIconEnumField(def) && getIconEnumOptions(def.iconEnumKey!)"
                    class="style-modal__icon-radio"
                    role="radiogroup"
                    :aria-label="def.label"
                  >
                    <button
                      v-for="opt in getIconEnumOptions(def.iconEnumKey!)!"
                      :key="opt.value"
                      type="button"
                      class="style-modal__icon-radio-btn"
                      :class="{ 'style-modal__icon-radio-btn--active': propValue(def) === opt.value }"
                      :title="opt.label"
                      :aria-label="opt.label"
                      role="radio"
                      @click="setProp(def, opt.value)"
                    >
                      <span class="style-modal__enum-glyph" aria-hidden="true">{{ iconEnumGlyph(def, opt.value) }}</span>
                    </button>
                  </div>

                  <template v-else-if="def.type === 'motionProperty'">
                    <select
                      class="style-modal__select"
                      :value="motionPropertyPreset"
                      :disabled="motionDurationMs <= 0"
                      @change="setMotionPropertyPreset(($event.target as HTMLSelectElement).value as MotionPropertyPresetId)"
                    >
                      <option v-for="p in MOTION_PROPERTY_PRESETS" :key="p.id" :value="p.id">{{ p.label }}</option>
                    </select>
                    <input
                      v-if="motionPropertyPreset === 'custom'"
                      class="style-modal__input"
                      :value="propValue(def)"
                      placeholder="transform, opacity"
                      @change="setMotionPropertyCustom(($event.target as HTMLInputElement).value)"
                    />
                  </template>

                  <select
                    v-else-if="def.type === 'motionTiming'"
                    class="style-modal__select"
                    :value="propValue(def)"
                    :disabled="motionDurationMs <= 0"
                    @change="setMotionTiming(($event.target as HTMLSelectElement).value as MotionTimingId)"
                  >
                    <option v-for="t in MOTION_TIMING_OPTIONS" :key="t.id" :value="t.id">{{ t.label }}</option>
                  </select>

                  <input
                    v-else-if="def.type === 'string'"
                    class="style-modal__input"
                    :value="propValue(def)"
                    :placeholder="def.default"
                    @change="setProp(def, ($event.target as HTMLInputElement).value)"
                  />

                  <ScrubInput
                    v-else
                    :icon="def.type === 'fontWeight' ? 'B' : def.cssProperty.startsWith('transition-') ? '⏱' : '#'"
                    :model-value="numericValue(def)"
                    :min="def.min ?? 0"
                    :max="def.max ?? 999"
                    :step="def.step ?? 1"
                    :suffix="def.cssProperty.startsWith('transition-') ? 'ms' : def.type === 'fontWeight' ? '' : 'px'"
                    :narrow="false"
                    :disabled="def.cssProperty === 'transition-delay' && motionDurationMs <= 0"
                    @update:model-value="setNumericValue(def, $event)"
                  />

                  <p v-if="def.description" class="style-modal__hint">{{ def.description }}</p>
                </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <footer class="style-modal__foot">
          <button
            v-if="!isNew"
            type="button"
            class="style-modal__delete"
            @click="removeDraft"
          >
            删除
          </button>
          <div class="style-modal__foot-spacer" />
          <button type="button" class="style-modal__reset" @click="resetDraftDefaults">恢复默认</button>
          <button type="button" class="style-modal__done" @click="saveDraft">保存样式</button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.style-modal {
  position: fixed;
  inset: 0;
  z-index: 2500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.45);
}

.style-modal__dialog {
  width: min(880px, 100%);
  max-height: min(88vh, 920px);
  display: flex;
  flex-direction: column;
  border-radius: var(--td-radius-large);
  border: 1px solid var(--td-component-border);
  background: var(--td-bg-color-container);
  box-shadow: var(--td-shadow-3);
  overflow: hidden;
}

.style-modal__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--td-component-border);
}

.style-modal__head-main {
  flex: 1;
  min-width: 0;
}

.style-modal__eyebrow {
  margin: 0 0 4px;
  font-size: 11px;
  color: var(--td-text-color-placeholder);
}

.style-modal__name-input {
  width: 100%;
  max-width: 360px;
  height: 34px;
  padding: 0 10px;
  font-size: 18px;
  font-weight: 600;
  border: 1px solid transparent;
  border-radius: var(--td-radius-small);
  background: transparent;
  color: var(--td-text-color-primary);
}

.style-modal__name-input:hover,
.style-modal__name-input:focus {
  border-color: var(--td-component-border);
  background: var(--td-bg-color-container);
  outline: none;
}

.style-modal__meta {
  margin: 6px 0 0;
  font-size: 11px;
  color: var(--td-text-color-placeholder);
}

.style-modal__meta code {
  font-size: 10px;
}

.style-modal__close {
  width: 32px;
  height: 32px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: transparent;
  color: var(--td-text-color-secondary);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}

.style-modal__close:hover {
  border-color: var(--td-brand-color);
  color: var(--td-brand-color);
}

.style-modal__scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.style-modal__preview {
  flex-shrink: 0;
  padding: 16px 20px;
  border-bottom: 1px solid var(--td-component-border);
  background: var(--td-bg-color-secondarycontainer);
}

.style-modal__preview-label {
  margin: 0 0 12px;
  font-size: 11px;
  font-weight: 600;
  color: var(--td-text-color-secondary);
}

.style-modal__font-sample {
  margin: 0;
  padding: 16px;
  border-radius: var(--td-radius-medium);
  border: 1px solid var(--td-component-border);
  background: var(--td-bg-color-container);
}

.style-modal__effect-card {
  padding: 20px 24px;
  font-size: 13px;
  color: var(--td-text-color-secondary);
}

.style-modal__motion-demo {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: fit-content;
  min-width: 140px;
  padding: 16px 18px;
  border-radius: var(--td-radius-medium);
  border: 1px solid var(--td-component-border);
  background: var(--td-bg-color-container);
  cursor: default;
}

.style-modal__motion-demo:hover {
  border-color: var(--td-brand-color);
  background: color-mix(in srgb, var(--td-brand-color) 10%, var(--td-bg-color-container));
  transform: translateY(-2px);
  box-shadow: var(--td-shadow-2);
}

.style-modal__motion-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.style-modal__motion-sub {
  font-size: 11px;
  color: var(--td-text-color-secondary);
}

.style-modal__form {
  padding: 16px 20px 20px;
}

.style-modal__form-hint {
  margin: 0 0 12px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--td-text-color-secondary);
}

.style-modal__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.style-modal__section-title {
  margin: 0;
  padding-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--td-text-color-secondary);
  border-bottom: 1px solid var(--td-component-border);
}

.style-modal__section-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 16px;
}

.style-modal__field {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  gap: 4px 10px;
  align-items: center;
  padding: 4px 6px;
  border-radius: var(--td-radius-small);
  min-width: 0;
}

.style-modal__field--full {
  grid-column: 1 / -1;
  grid-template-columns: 96px minmax(0, 1fr);
}

.style-modal__icon-radio {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.style-modal__icon-radio-btn {
  width: 36px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-container);
  color: var(--td-text-color-primary);
  cursor: pointer;
}

.style-modal__icon-radio-btn--active {
  border-color: var(--td-brand-color);
  background: var(--td-brand-color-light);
  color: var(--td-brand-color);
}

.style-modal__tt-glyph {
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
}

.style-modal__tt-glyph--capitalize { text-transform: capitalize; }
.style-modal__tt-glyph--uppercase { text-transform: uppercase; }
.style-modal__tt-glyph--lowercase { text-transform: lowercase; }

.style-modal__deco-line-glyph {
  font-size: 12px;
  font-weight: 600;
  text-decoration-color: currentColor;
  text-decoration-thickness: 1.5px;
}

.style-modal__enum-glyph {
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

.style-modal__enum-glyph--synthesis {
  font-size: 11px;
  letter-spacing: -0.02em;
}

.style-modal__smooth-glyph {
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
}

.style-modal__deco-line {
  display: block;
  width: 22px;
  height: 0;
}

.style-modal__deco-line--solid { border-top: 2px solid currentColor; }
.style-modal__deco-line--double { border-top: 3px double currentColor; }
.style-modal__deco-line--dotted { border-top: 2px dotted currentColor; }
.style-modal__deco-line--dashed { border-top: 2px dashed currentColor; }

.style-modal__deco-wavy {
  width: 24px;
  height: 8px;
}

.style-modal__field-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--td-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.style-modal__field-control {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.style-modal__field-control :deep(.scrub) {
  flex: none;
  width: 100%;
  height: 28px;
  max-width: none;
}

.style-modal__input,
.style-modal__select {
  width: 100%;
  height: 28px;
  padding: 0 8px;
  font-size: 12px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-container);
}

.style-modal__hint {
  margin: 0;
  font-size: 11px;
  color: var(--td-text-color-placeholder);
}

.style-modal__foot {
  padding: 12px 20px;
  border-top: 1px solid var(--td-component-border);
  display: flex;
  align-items: center;
  gap: 8px;
}

.style-modal__foot-spacer {
  flex: 1;
}

.style-modal__delete,
.style-modal__reset,
.style-modal__done {
  padding: 7px 14px;
  font-size: 12px;
  border-radius: var(--td-radius-small);
  cursor: pointer;
}

.style-modal__delete {
  border: 1px solid var(--td-error-color);
  background: transparent;
  color: var(--td-error-color);
}

.style-modal__reset {
  border: 1px solid var(--td-component-border);
  background: transparent;
  color: var(--td-text-color-secondary);
}

.style-modal__done {
  border: none;
  background: var(--td-brand-color);
  color: #fff;
}
</style>
