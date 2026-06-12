<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, toRaw } from 'vue'
import ScrubInput from '../../../components/ScrubInput.vue'
import MotionEffectEditorPanel from './MotionEffectEditorPanel.vue'
import EffectStyleEditorPanel from './EffectStyleEditorPanel.vue'
import {
  formatMotionTransitionCss,
} from '../tokens/motionPresetOptions'
import {
  STYLE_PRESET_CATEGORY_LABELS,
  EFFECT_SHADOW_OPTIONS,
  boxShadowToLevel,
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
  effectConfigSummary,
  mergeEffectConfigIntoProperties,
  readEffectConfigFromPreset,
} from '../tokens/effectConfig'
import {
  effectConfigToCssRules,
  effectPreviewInlineStyle,
} from '../tokens/effectTypeCss'
import {
  mergeVisualEffectIntoProperties,
  readVisualEffectFromPreset,
  visualEffectSummary,
} from '../tokens/visualEffectConfig'
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
  if (props.category === 'motion') {
    base.properties = mergeEffectConfigIntoProperties(base.id, base.name, base.properties)
  }
  if (props.category === 'effect') {
    base.properties = mergeVisualEffectIntoProperties(base.id, base.name, base.properties)
  }
  return base
}

const draft = reactive<StylePreset>(buildDraft())

const sections = computed(() => getStylePresetSections(props.category))
const categoryLabel = computed(() => STYLE_PRESET_CATEGORY_LABELS[props.category])

const motionFxConfig = computed(() =>
  props.category === 'motion' ? readEffectConfigFromPreset(draft as StylePreset) : null,
)

const visualFxConfig = computed(() =>
  props.category === 'effect' ? readVisualEffectFromPreset(draft as StylePreset) : null,
)

const previewStyle = computed(() => presetPropertiesToInlineStyle(draft.properties))

const effectPreviewBackdropStyle = computed(() => {
  if (props.category !== 'effect' || !visualFxConfig.value) return {}
  const blur = visualFxConfig.value.backdropBlur
  if (blur <= 0) return {}
  return {
    backgroundImage: 'linear-gradient(135deg, var(--td-brand-color) 0%, var(--td-warning-color) 100%)',
    padding: '12px',
    borderRadius: 'var(--td-radius-medium)',
  }
})

const motionPreviewCss = computed(() => {
  if (props.category !== 'motion' || !motionFxConfig.value || motionDurationMs.value <= 0) return ''
  return effectConfigToCssRules('motion-fx-live-preview', motionFxConfig.value, { preview: true })
})

const motionPreviewStyle = computed(() => {
  if (props.category !== 'motion' || !motionFxConfig.value) return previewStyle.value
  return {
    ...previewStyle.value,
    ...effectPreviewInlineStyle(motionFxConfig.value),
  }
})

const motionPreviewKey = computed(() => {
  const cfg = motionFxConfig.value
  if (!cfg) return 'motion-preview'
  return [
    cfg.effectType,
    cfg.trigger,
    cfg.duration,
    cfg.delay,
    cfg.easing,
    cfg.iterations,
    JSON.stringify(cfg.initialState),
    JSON.stringify(cfg.finalState),
  ].join('|')
})

const motionPreviewLabel = computed(() => {
  const trigger = motionFxConfig.value?.trigger
  if (trigger === 'active') return 'Press me'
  if (trigger === 'focus') return 'Focus me'
  if (trigger === 'enter') return 'Enter'
  if (trigger === 'exit') return 'Exit'
  if (trigger === 'expand') return 'Expand'
  return 'Hover me'
})

const motionPreviewHint = computed(() => {
  const cfg = motionFxConfig.value
  if (!cfg || cfg.duration <= 0) return '时长为 0，无过渡'
  if (cfg.trigger === 'active') return '按下查看动效'
  if (cfg.trigger === 'focus') return 'Tab 聚焦查看'
  if (cfg.trigger === 'enter' || cfg.trigger === 'exit' || cfg.trigger === 'expand') {
    return '显隐过渡 · 预览自动循环'
  }
  if (cfg.effectType === 'ripple') return '按下查看涟漪'
  if (cfg.effectType === 'spin' || cfg.effectType === 'pulse' || cfg.effectType === 'blink') {
    return '悬停查看循环动效'
  }
  return '悬停查看动效'
})

const categoryFormHint = computed(() => {
  if (props.category === 'motion') {
    return '按 EffectConfig 编辑：触发方式、效果类型、时间、缓动、状态边界、重复与作用范围。保存后同步 transition 字段与 effect-config JSON。'
  }
  if (props.category === 'effect') {
    return '按三梯队编辑视觉效果：阴影/模糊/透明度/圆角 → 背景/边框/毛玻璃/裁剪 → 滤镜/混合/变换。保存后同步 CSS 属性与 visual-effect-config JSON。'
  }
  return '组合一组 CSS 属性并命名，保存后可在组件画板引用，并写入全局 CSS 变量。'
})

const motionTransitionCss = computed(() => formatMotionTransitionCss(draft.properties))

const motionFxSummary = computed(() =>
  motionFxConfig.value ? effectConfigSummary(motionFxConfig.value) : '',
)

const visualFxSummary = computed(() =>
  visualFxConfig.value ? visualEffectSummary(visualFxConfig.value) : '',
)

const motionDurationMs = computed(() => {
  const raw = draft.properties['transition-duration'] ?? '0ms'
  return parseNumericProp(raw)
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

function fieldTitle(def: StylePresetFieldDef): string {
  return `${def.label} · ${def.cssProperty}`
}

function iconRadioTooltipEnabled(sectionTitle: string): boolean {
  return sectionTitle === '字体变体'
}

function shadowPreviewStyle(cssValue: string): Record<string, string> {
  if (cssValue === 'none') {
    return {
      boxShadow: 'none',
      border: '1px solid var(--td-component-border)',
    }
  }
  return { boxShadow: cssValue }
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
  if (props.category === 'motion') {
    saved.properties = mergeEffectConfigIntoProperties(saved.id, saved.name, saved.properties)
  }
  if (props.category === 'effect') {
    saved.properties = mergeVisualEffectIntoProperties(saved.id, saved.name, saved.properties)
  }
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
  const propsMerged = mergeStylePresetProperties(props.category, fresh.properties)
  Object.assign(
    draft.properties,
    props.category === 'motion'
      ? mergeEffectConfigIntoProperties(fresh.id, fresh.name, propsMerged)
      : props.category === 'effect'
        ? mergeVisualEffectIntoProperties(fresh.id, fresh.name, propsMerged)
        : propsMerged,
  )
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
      <div
        class="style-modal__dialog"
        :class="{
          'style-modal__dialog--motion': category === 'motion' || category === 'effect',
        }"
        role="dialog"
        aria-modal="true"
        :aria-label="`${categoryLabel}编辑`"
      >
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

        <div v-if="category === 'motion'" class="style-modal__body style-modal__body--motion">
          <aside class="style-modal__preview-pane" aria-label="效果预览">
            <component :is="'style'">{{ motionPreviewCss }}</component>
            <p class="style-modal__preview-label">效果预览</p>
            <div class="style-modal__preview-stage">
              <div
                :key="motionPreviewKey"
                class="style-modal__motion-demo style-modal__motion-demo--stage motion-fx-live-preview"
                :class="{ 'style-modal__motion-demo--disabled': motionDurationMs <= 0 }"
                :style="motionPreviewStyle"
                :tabindex="motionFxConfig?.trigger === 'focus' ? 0 : undefined"
              >
                <span class="style-modal__motion-label">{{ motionPreviewLabel }}</span>
                <span class="style-modal__motion-sub">{{ motionPreviewHint }}</span>
              </div>
            </div>
            <div class="style-modal__motion-meta">
              <p class="style-modal__motion-code">
                <code>{{ motionTransitionCss }}</code>
              </p>
              <p v-if="motionFxSummary" class="style-modal__motion-summary">{{ motionFxSummary }}</p>
            </div>
          </aside>

          <div class="style-modal__scroll">
            <section class="style-modal__form style-modal__form--motion">
              <p class="style-modal__form-hint">{{ categoryFormHint }}</p>
              <MotionEffectEditorPanel :preset="draft" hide-summary />
            </section>
          </div>
        </div>

        <div v-else-if="category === 'effect'" class="style-modal__body style-modal__body--motion">
          <aside class="style-modal__preview-pane" aria-label="效果预览">
            <p class="style-modal__preview-label">效果预览</p>
            <div class="style-modal__preview-stage style-modal__preview-stage--effect">
              <div class="style-modal__effect-backdrop" :style="effectPreviewBackdropStyle">
                <div class="style-modal__effect-card style-modal__effect-card--stage" :style="previewStyle">
                  <span class="style-modal__effect-card-title">预览卡片</span>
                  <span class="style-modal__effect-card-sub">VisualEffectConfig</span>
                </div>
              </div>
            </div>
            <p v-if="visualFxSummary" class="style-modal__motion-summary">{{ visualFxSummary }}</p>
          </aside>

          <div class="style-modal__scroll">
            <section class="style-modal__form style-modal__form--motion">
              <p class="style-modal__form-hint">{{ categoryFormHint }}</p>
              <EffectStyleEditorPanel :preset="draft" />
            </section>
          </div>
        </div>

        <template v-else>
        <section class="style-modal__preview">
          <p class="style-modal__preview-label">效果预览</p>

          <template v-if="category === 'font'">
            <p class="style-modal__font-sample" :style="previewStyle">
              The quick brown fox · 可视化组件开发平台 · 0123456789
            </p>
          </template>
        </section>

        <div class="style-modal__scroll">
          <section class="style-modal__form">
            <p class="style-modal__form-hint">{{ categoryFormHint }}</p>

            <div v-for="section in sections" :key="section.title" class="style-modal__section">
              <h3 class="style-modal__section-title">{{ section.title }}</h3>
              <p v-if="section.description" class="style-modal__section-desc">{{ section.description }}</p>
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
                    <t-tooltip
                      v-for="opt in FONT_SYNTHESIS_ICON_OPTIONS"
                      :key="opt.value"
                      :content="opt.label"
                      placement="top"
                      show-arrow
                      destroy-on-close
                      :disabled="!iconRadioTooltipEnabled(section.title)"
                    >
                      <button
                        type="button"
                        class="style-modal__icon-radio-btn"
                        :class="{ 'style-modal__icon-radio-btn--active': propValue(def) === opt.value }"
                        :title="iconRadioTooltipEnabled(section.title) ? undefined : opt.label"
                        :aria-label="opt.label"
                        role="radio"
                        @click="setProp(def, opt.value)"
                      >
                        <span class="style-modal__enum-glyph style-modal__enum-glyph--synthesis" aria-hidden="true">
                          {{ opt.glyph }}
                        </span>
                      </button>
                    </t-tooltip>
                  </div>

                  <div
                    v-else-if="isIconEnumField(def) && getFontCssGlyphIconConfig(def.iconEnumKey!)"
                    class="style-modal__icon-radio"
                    role="radiogroup"
                    :aria-label="def.label"
                  >
                    <t-tooltip
                      v-for="opt in getFontCssGlyphIconConfig(def.iconEnumKey!)!.options"
                      :key="opt.value"
                      :content="opt.label"
                      placement="top"
                      show-arrow
                      destroy-on-close
                      :disabled="!iconRadioTooltipEnabled(section.title)"
                    >
                      <button
                        type="button"
                        class="style-modal__icon-radio-btn"
                        :class="{ 'style-modal__icon-radio-btn--active': propValue(def) === opt.value }"
                        :title="iconRadioTooltipEnabled(section.title) ? undefined : opt.label"
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
                    </t-tooltip>
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

                  <div
                    v-else-if="def.type === 'shadowLevel'"
                    class="style-modal__shadow-picker"
                    role="radiogroup"
                    :aria-label="def.label"
                  >
                    <button
                      v-for="opt in EFFECT_SHADOW_OPTIONS"
                      :key="opt.value"
                      type="button"
                      class="style-modal__shadow-option"
                      :class="{ 'style-modal__shadow-option--active': boxShadowToLevel(propValue(def)) === opt.value }"
                      :title="opt.label"
                      :aria-label="opt.label"
                      role="radio"
                      :aria-checked="boxShadowToLevel(propValue(def)) === opt.value"
                      @click="setProp(def, opt.cssValue)"
                    >
                      <span
                        class="style-modal__shadow-swatch"
                        :style="shadowPreviewStyle(opt.cssValue)"
                        aria-hidden="true"
                      />
                      <span class="style-modal__shadow-label">{{ opt.label }}</span>
                    </button>
                    <p
                      v-if="boxShadowToLevel(propValue(def)) === 'custom'"
                      class="style-modal__hint style-modal__hint--inline"
                    >
                      当前为自定义值：<code>{{ propValue(def) }}</code>
                    </p>
                  </div>

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
                    :suffix="def.type === 'fontWeight' ? '' : 'px'"
                    :narrow="false"
                    @update:model-value="setNumericValue(def, $event)"
                  />

                  <p v-if="def.description" class="style-modal__hint">{{ def.description }}</p>
                </div>
                </div>
              </div>
            </div>
          </section>
        </div>
        </template>

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

.style-modal__dialog--motion {
  width: min(1080px, 100%);
  max-height: min(92vh, 960px);
}

.style-modal__body--motion {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(240px, 280px) minmax(0, 1fr);
}

.style-modal__preview-pane {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  padding: 16px;
  border-right: 1px solid var(--td-component-border);
  background: var(--td-bg-color-secondarycontainer);
  overflow: auto;
}

.style-modal__preview-stage {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  padding: 20px 12px;
  border: 1px dashed color-mix(in srgb, var(--td-component-border) 85%, transparent);
  border-radius: var(--td-radius-medium);
  background: var(--td-bg-color-container);
}

.style-modal__motion-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.style-modal__motion-summary {
  margin: 0;
  font-size: 11px;
  line-height: 1.45;
  color: var(--td-text-color-secondary);
}

.style-modal__form--motion {
  padding-top: 12px;
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
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 20px 24px;
  font-size: 13px;
  color: var(--td-text-color-secondary);
}

.style-modal__effect-card--stage {
  min-width: 160px;
  color: var(--td-text-color-primary);
}

.style-modal__effect-card-title {
  font-size: 15px;
  font-weight: 600;
}

.style-modal__effect-card-sub {
  font-size: 11px;
  color: var(--td-text-color-secondary);
}

.style-modal__effect-backdrop {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 180px;
  border-radius: var(--td-radius-medium);
}

.style-modal__preview-stage--effect {
  padding: 0;
  border: none;
  background: transparent;
}

.style-modal__motion-code {
  margin: 0;
  padding: 8px 10px;
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-container);
  border: 1px solid var(--td-component-border);
  font-size: 10px;
  line-height: 1.45;
  color: var(--td-text-color-secondary);
  word-break: break-all;
}

.style-modal__motion-code code {
  font-family: ui-monospace, monospace;
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
  transition:
    border-color var(--transition-duration, 0.2s),
    background var(--transition-duration, 0.2s),
    transform var(--transition-duration, 0.2s),
    box-shadow var(--transition-duration, 0.2s);
}

.style-modal__motion-demo--stage {
  min-width: 168px;
  padding: 28px 24px;
  box-shadow: var(--td-shadow-1);
}

.style-modal__motion-demo--disabled,
.style-modal__motion-demo--disabled:hover,
.style-modal__motion-demo--disabled:active,
.style-modal__motion-demo--disabled:focus-visible {
  border-color: var(--td-component-border);
  background: var(--td-bg-color-container);
  transform: none !important;
  box-shadow: none;
  animation: none !important;
  opacity: 1 !important;
}

.style-modal__preview-pane .style-modal__motion-label {
  font-size: 16px;
}

.style-modal__preview-pane .style-modal__motion-sub {
  font-size: 12px;
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

.style-modal__section-desc {
  margin: 0 0 4px;
  font-size: 11px;
  line-height: 1.45;
  color: var(--td-text-color-placeholder);
}

.style-modal__duration-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.style-modal__duration-chip {
  padding: 4px 10px;
  font-size: 11px;
  border-radius: var(--td-radius-small);
  border: 1px solid var(--td-component-border);
  background: var(--td-bg-color-container);
  color: var(--td-text-color-secondary);
  cursor: pointer;
}

.style-modal__duration-chip:hover {
  border-color: var(--td-brand-color);
  color: var(--td-brand-color);
}

.style-modal__duration-chip--active {
  border-color: var(--td-brand-color);
  background: var(--td-brand-color-light);
  color: var(--td-brand-color);
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

.style-modal__icon-radio :deep(.t-tooltip) {
  display: inline-flex;
}

.style-modal__icon-radio :deep(.t-popup__reference) {
  display: inline-flex;
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

.style-modal__shadow-picker {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.style-modal__shadow-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 8px 6px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-container);
  cursor: pointer;
}

.style-modal__shadow-option--active {
  border-color: var(--td-brand-color);
  background: var(--td-brand-color-light);
}

.style-modal__shadow-swatch {
  width: 44px;
  height: 28px;
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-container);
}

.style-modal__shadow-label {
  font-size: 10px;
  line-height: 1.2;
  text-align: center;
  color: var(--td-text-color-secondary);
}

.style-modal__shadow-option--active .style-modal__shadow-label {
  color: var(--td-brand-color);
  font-weight: 600;
}

.style-modal__hint--inline {
  grid-column: 1 / -1;
}

.style-modal__hint--inline code {
  font-size: 10px;
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
