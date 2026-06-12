<script setup lang="ts">
import { computed } from 'vue'
import ScrubInput from '../../../components/ScrubInput.vue'
import BezierCurvePanel from '../../../components/BezierCurvePanel.vue'
import {
  MOTION_DURATION_PRESETS,
  MOTION_TIMING_OPTIONS,
  formatMotionTransitionCss,
  motionTimingOptionId,
  normalizeMotionTimingValue,
} from '../tokens/motionPresetOptions'
import {
  CANONICAL_MOTION_PRESET_IDS,
} from '../tokens/motionPresetCatalog'
import {
  applyEffectTypeToConfig,
  effectConfigSummary,
  effectConfigToStylePresetProperties,
  effectStateField,
  normalizeEffectConfig,
  patchEffectStateField,
  readEffectConfigFromPreset,
  themeMotionSlotToTrigger,
  type EffectConfig,
  type EffectDirection,
  type EffectFillMode,
  type EffectPerformanceLevel,
  type EffectScope,
  type EffectType,
  type TriggerType,
} from '../tokens/effectConfig'
import type { ThemeMotionSlotKey } from '../tokens/themeUsageDefs'
import type { StylePreset } from '../tokens/stylePresetDefs'
import {
  buildEffectTypeVisualGroups,
  TRIGGER_VISUAL_GROUPS,
  triggerVisualOption,
} from './motionEffectVisualOptions'

const triggerGroups = TRIGGER_VISUAL_GROUPS
const effectTypeGroups = buildEffectTypeVisualGroups()

const props = defineProps<{
  preset: StylePreset
  /** 预览区已外置时隐藏顶部 transition 摘要 */
  hideSummary?: boolean
}>()

const config = computed(() => readEffectConfigFromPreset(props.preset))

const isCanonicalSlot = computed(() =>
  (CANONICAL_MOTION_PRESET_IDS as readonly string[]).includes(props.preset.id),
)

const transitionCss = computed(() => formatMotionTransitionCss(props.preset.properties))

const timingSelection = computed(() => motionTimingOptionId(config.value.easing))

function patch(partial: Partial<EffectConfig>) {
  const next = normalizeEffectConfig({
    ...config.value,
    ...partial,
    id: props.preset.id,
    name: props.preset.name,
  })
  Object.assign(props.preset.properties, effectConfigToStylePresetProperties(next))
}

function setTrigger(trigger: TriggerType) {
  if (isCanonicalSlot.value) return
  patch({ trigger })
}

function setEffectType(effectType: EffectType) {
  const next = applyEffectTypeToConfig(config.value, effectType)
  Object.assign(
    props.preset.properties,
    effectConfigToStylePresetProperties(
      normalizeEffectConfig({ ...next, id: props.preset.id, name: props.preset.name }),
    ),
  )
}

function setDuration(ms: number) {
  patch({ duration: Math.max(0, Math.round(ms)) })
}

function setDelay(ms: number) {
  patch({ delay: Math.max(0, Math.round(ms)) })
}

function setEndDelay(ms: number) {
  patch({ endDelay: ms > 0 ? Math.round(ms) : undefined })
}

function setTiming(id: string) {
  const option = MOTION_TIMING_OPTIONS.find((o) => o.id === id)
  if (!option) return
  patch({ easing: option.cssValue })
}

function setTimingCss(raw: string) {
  patch({ easing: normalizeMotionTimingValue(raw) })
}

function setIterations(raw: string) {
  if (raw === 'infinite') {
    patch({ iterations: 'infinite' })
    return
  }
  const n = Math.max(1, Math.round(Number(raw) || 1))
  patch({ iterations: n })
}

function setInitialField(key: string, raw: string) {
  patch({ initialState: patchEffectStateField(config.value.initialState, key, raw) })
}

function setFinalField(key: string, raw: string) {
  patch({ finalState: patchEffectStateField(config.value.finalState, key, raw) })
}
</script>

<template>
  <div class="motion-fx-editor">
    <p v-if="!hideSummary" class="motion-fx-editor__summary">
      <code>{{ transitionCss }}</code>
      · {{ effectConfigSummary(config) }}
    </p>

    <section class="motion-fx-editor__block">
      <h3 class="motion-fx-editor__title">基础 · trigger / effectType</h3>

      <div class="motion-fx-editor__field motion-fx-editor__field--full">
        <span class="motion-fx-editor__field-label">触发方式</span>
        <div
          v-for="group in triggerGroups"
          :key="group.id"
          class="motion-fx-trigger-group"
        >
          <span class="motion-fx-trigger-group__label">{{ group.label }}</span>
          <div
            class="motion-fx-trigger-radio"
            role="radiogroup"
            :aria-label="`${group.label}触发方式`"
          >
            <button
              v-for="triggerId in group.triggers"
              :key="triggerId"
              type="button"
              class="motion-fx-trigger-radio__btn"
              :class="{
                'motion-fx-trigger-radio__btn--active': config.trigger === triggerId,
                'motion-fx-trigger-radio__btn--disabled': isCanonicalSlot,
              }"
              role="radio"
              :aria-checked="config.trigger === triggerId"
              :aria-label="triggerVisualOption(triggerId).title"
              :title="triggerVisualOption(triggerId).title"
              :disabled="isCanonicalSlot"
              @click="setTrigger(triggerId)"
            >
              <span class="motion-fx-trigger-radio__dot" aria-hidden="true" />
              <span class="motion-fx-trigger-radio__icon" aria-hidden="true">
                {{ triggerVisualOption(triggerId).icon }}
              </span>
              <span class="motion-fx-trigger-radio__text">
                {{ triggerVisualOption(triggerId).label }}
              </span>
            </button>
          </div>
        </div>
        <p v-if="isCanonicalSlot" class="motion-fx-editor__hint">
          系统槽位预设 id 与触发方式绑定（{{ themeMotionSlotToTrigger(preset.id as ThemeMotionSlotKey) }}）
        </p>
      </div>

      <div class="motion-fx-editor__field motion-fx-editor__field--full">
        <span class="motion-fx-editor__field-label">效果类型</span>
        <div
          v-for="group in effectTypeGroups"
          :key="group.id"
          class="motion-fx-type-group"
        >
          <span class="motion-fx-type-group__label">{{ group.label }}</span>
          <div
            class="motion-fx-type-cards"
            role="radiogroup"
            :aria-label="`${group.label}效果类型`"
          >
            <button
              v-for="option in group.options"
              :key="option.id"
              type="button"
              class="motion-fx-type-card"
              :class="{ 'motion-fx-type-card--active': config.effectType === option.id }"
              role="radio"
              :aria-checked="config.effectType === option.id"
              :aria-label="option.label"
              :title="option.label"
              @click="setEffectType(option.id)"
            >
              <span
                class="motion-fx-type-card__icon"
                :class="`motion-fx-type-card__icon--${option.id}`"
                aria-hidden="true"
              >
                {{ option.icon }}
              </span>
              <span class="motion-fx-type-card__label">{{ option.label }}</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="motion-fx-editor__block">
      <h3 class="motion-fx-editor__title">时间 · duration / delay</h3>
      <div class="motion-fx-editor__chips">
        <button
          v-for="preset in MOTION_DURATION_PRESETS"
          :key="preset.id"
          type="button"
          class="motion-fx-editor__chip"
          :class="{ 'motion-fx-editor__chip--active': config.duration === preset.ms }"
          @click="setDuration(preset.ms)"
        >
          {{ preset.label }}
        </button>
      </div>
      <div class="motion-fx-editor__grid">
        <label class="motion-fx-editor__field">
          <span>持续时间 (ms)</span>
          <ScrubInput
            icon="⏱"
            :model-value="config.duration"
            :min="0"
            :max="2000"
            :step="10"
            suffix="ms"
            :narrow="false"
            @update:model-value="setDuration"
          />
        </label>
        <label class="motion-fx-editor__field">
          <span>延迟 (ms)</span>
          <ScrubInput
            icon="⏱"
            :model-value="config.delay"
            :min="0"
            :max="2000"
            :step="10"
            suffix="ms"
            :narrow="false"
            @update:model-value="setDelay"
          />
        </label>
        <label class="motion-fx-editor__field">
          <span>结束后等待 (ms)</span>
          <ScrubInput
            icon="⏱"
            :model-value="config.endDelay ?? 0"
            :min="0"
            :max="2000"
            :step="10"
            suffix="ms"
            :narrow="false"
            @update:model-value="setEndDelay"
          />
        </label>
      </div>
    </section>

    <section class="motion-fx-editor__block">
      <h3 class="motion-fx-editor__title">缓动 · easing</h3>
      <select
        class="motion-fx-editor__select"
        :value="timingSelection"
        @change="setTiming(($event.target as HTMLSelectElement).value)"
      >
        <option v-if="timingSelection === 'custom'" value="custom" disabled>自定义曲线</option>
        <option v-for="t in MOTION_TIMING_OPTIONS" :key="t.id" :value="t.id">
          {{ t.label }}{{ t.hint ? ` · ${t.hint}` : '' }}
        </option>
      </select>
      <BezierCurvePanel :model-value="config.easing" @update:model-value="setTimingCss" />
    </section>

    <section class="motion-fx-editor__block">
      <h3 class="motion-fx-editor__title">状态边界 · initial / final</h3>
      <p class="motion-fx-editor__hint">切换效果类型会自动填充；可在此微调 from → to。</p>
      <div class="motion-fx-editor__state-grid">
        <div class="motion-fx-editor__state-col">
          <h4 class="motion-fx-editor__state-head">初始 initialState</h4>
          <label class="motion-fx-editor__field">
            <span>opacity</span>
            <input
              class="motion-fx-editor__input"
              :value="effectStateField(config.initialState, 'opacity')"
              placeholder="0–1 或空"
              @change="setInitialField('opacity', ($event.target as HTMLInputElement).value)"
            />
          </label>
          <label class="motion-fx-editor__field">
            <span>transform</span>
            <input
              class="motion-fx-editor__input"
              :value="effectStateField(config.initialState, 'transform')"
              placeholder="translateY(16px) 等"
              @change="setInitialField('transform', ($event.target as HTMLInputElement).value)"
            />
          </label>
        </div>
        <div class="motion-fx-editor__state-col">
          <h4 class="motion-fx-editor__state-head">结束 finalState</h4>
          <label class="motion-fx-editor__field">
            <span>opacity</span>
            <input
              class="motion-fx-editor__input"
              :value="effectStateField(config.finalState, 'opacity')"
              placeholder="0–1 或空"
              @change="setFinalField('opacity', ($event.target as HTMLInputElement).value)"
            />
          </label>
          <label class="motion-fx-editor__field">
            <span>transform</span>
            <input
              class="motion-fx-editor__input"
              :value="effectStateField(config.finalState, 'transform')"
              placeholder="translateY(0) 等"
              @change="setFinalField('transform', ($event.target as HTMLInputElement).value)"
            />
          </label>
        </div>
      </div>
    </section>

    <section class="motion-fx-editor__block">
      <h3 class="motion-fx-editor__title">重复与行为</h3>
      <div class="motion-fx-editor__grid">
        <label class="motion-fx-editor__field">
          <span>重复次数</span>
          <select
            class="motion-fx-editor__select"
            :value="config.iterations === 'infinite' ? 'infinite' : String(config.iterations)"
            @change="setIterations(($event.target as HTMLSelectElement).value)"
          >
            <option value="1">1 次</option>
            <option value="2">2 次</option>
            <option value="3">3 次</option>
            <option value="infinite">无限 ∞</option>
          </select>
        </label>
        <label class="motion-fx-editor__field">
          <span>播放方向</span>
          <select
            class="motion-fx-editor__select"
            :value="config.direction"
            @change="patch({ direction: ($event.target as HTMLSelectElement).value as EffectDirection })"
          >
            <option value="normal">normal</option>
            <option value="alternate">alternate · 往返</option>
          </select>
        </label>
        <label class="motion-fx-editor__field">
          <span>fillMode</span>
          <select
            class="motion-fx-editor__select"
            :value="config.fillMode"
            @change="patch({ fillMode: ($event.target as HTMLSelectElement).value as EffectFillMode })"
          >
            <option value="none">none</option>
            <option value="forwards">forwards · 保持结束态</option>
            <option value="backwards">backwards</option>
            <option value="both">both</option>
          </select>
        </label>
        <label class="motion-fx-editor__field motion-fx-editor__field--check">
          <span>可打断 interruptible</span>
          <input
            type="checkbox"
            :checked="config.interruptible"
            @change="patch({ interruptible: ($event.target as HTMLInputElement).checked })"
          />
        </label>
        <label class="motion-fx-editor__field">
          <span>性能模式</span>
          <select
            class="motion-fx-editor__select"
            :value="config.performanceLevel"
            @change="patch({ performanceLevel: ($event.target as HTMLSelectElement).value as EffectPerformanceLevel })"
          >
            <option value="performance">performance · 仅 transform/opacity</option>
            <option value="full">full · 允许布局属性</option>
          </select>
        </label>
      </div>
    </section>

    <section class="motion-fx-editor__block">
      <h3 class="motion-fx-editor__title">作用范围 · scope</h3>
      <div class="motion-fx-editor__grid">
        <label class="motion-fx-editor__field">
          <span>作用范围</span>
          <select
            class="motion-fx-editor__select"
            :value="config.scope"
            @change="patch({ scope: ($event.target as HTMLSelectElement).value as EffectScope })"
          >
            <option value="self">self · 自身</option>
            <option value="children-stagger">children-stagger · 子元素错峰</option>
            <option value="decorative-only">decorative-only · 仅装饰层</option>
          </select>
        </label>
        <label v-if="config.scope === 'children-stagger'" class="motion-fx-editor__field">
          <span>staggerDelay (ms)</span>
          <ScrubInput
            icon="⏱"
            :model-value="config.staggerDelay ?? 0"
            :min="0"
            :max="500"
            :step="10"
            suffix="ms"
            :narrow="false"
            @update:model-value="(ms) => patch({ staggerDelay: ms > 0 ? ms : undefined })"
          />
        </label>
        <label v-if="config.trigger === 'scroll-into-view'" class="motion-fx-editor__field">
          <span>触发阈值 threshold</span>
          <ScrubInput
            icon="%"
            :model-value="Math.round((config.threshold ?? 0.5) * 100)"
            :min="0"
            :max="100"
            :step="5"
            suffix="%"
            :narrow="false"
            @update:model-value="(v) => patch({ threshold: v / 100 })"
          />
        </label>
      </div>
    </section>
  </div>
</template>

<style scoped>
.motion-fx-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.motion-fx-editor__summary {
  margin: 0;
  padding: 8px 10px;
  font-size: 11px;
  line-height: 1.45;
  color: var(--td-text-color-secondary);
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-secondarycontainer);
  word-break: break-all;
}

.motion-fx-editor__summary code {
  font-family: ui-monospace, monospace;
}

.motion-fx-editor__block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.motion-fx-editor__title {
  margin: 0;
  padding-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--td-text-color-secondary);
  border-bottom: 1px solid var(--td-component-border);
}

.motion-fx-editor__hint {
  margin: 0;
  font-size: 10px;
  line-height: 1.4;
  color: var(--td-text-color-placeholder);
}

.motion-fx-editor__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
}

.motion-fx-editor__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
  color: var(--td-text-color-primary);
}

.motion-fx-editor__field--full {
  grid-column: 1 / -1;
}

.motion-fx-editor__field--check {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.motion-fx-editor__select,
.motion-fx-editor__input {
  width: 100%;
  height: 28px;
  padding: 0 8px;
  font-size: 12px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-container);
}

.motion-fx-editor__field-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--td-text-color-primary);
}

.motion-fx-trigger-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.motion-fx-trigger-group + .motion-fx-trigger-group {
  margin-top: 8px;
}

.motion-fx-trigger-group__label {
  font-size: 10px;
  font-weight: 600;
  color: var(--td-text-color-placeholder);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.motion-fx-trigger-radio {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.motion-fx-trigger-radio__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 30px;
  margin: 0;
  padding: 4px 10px 4px 8px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-container);
  color: var(--td-text-color-primary);
  font-size: 11px;
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s,
    color 0.15s;
}

.motion-fx-trigger-radio__btn:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--td-brand-color) 45%, var(--td-component-border));
}

.motion-fx-trigger-radio__btn--active {
  border-color: var(--td-brand-color);
  background: var(--td-brand-color-light);
  color: var(--td-brand-color);
}

.motion-fx-trigger-radio__btn--disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.motion-fx-trigger-radio__dot {
  width: 10px;
  height: 10px;
  border: 1.5px solid currentColor;
  border-radius: 50%;
  flex-shrink: 0;
  position: relative;
}

.motion-fx-trigger-radio__btn--active .motion-fx-trigger-radio__dot::after {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 50%;
  background: currentColor;
}

.motion-fx-trigger-radio__icon {
  width: 16px;
  font-size: 12px;
  line-height: 1;
  text-align: center;
  flex-shrink: 0;
}

.motion-fx-trigger-radio__text {
  white-space: nowrap;
}

.motion-fx-type-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.motion-fx-type-group + .motion-fx-type-group {
  margin-top: 10px;
}

.motion-fx-type-group__label {
  font-size: 10px;
  font-weight: 600;
  color: var(--td-text-color-placeholder);
}

.motion-fx-type-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 6px;
}

.motion-fx-type-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 64px;
  margin: 0;
  padding: 8px 4px 6px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-container);
  color: var(--td-text-color-primary);
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s,
    box-shadow 0.15s,
    transform 0.15s;
}

.motion-fx-type-card:hover {
  border-color: color-mix(in srgb, var(--td-brand-color) 45%, var(--td-component-border));
  transform: translateY(-1px);
}

.motion-fx-type-card--active {
  border-color: var(--td-brand-color);
  background: var(--td-brand-color-light);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--td-brand-color) 25%, transparent);
}

.motion-fx-type-card--active .motion-fx-type-card__icon {
  color: var(--td-brand-color);
  background: color-mix(in srgb, var(--td-brand-color) 12%, var(--td-bg-color-container));
}

.motion-fx-type-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 28px;
  border-radius: 6px;
  background: var(--td-bg-color-secondarycontainer);
  font-size: 14px;
  line-height: 1;
  font-family: ui-monospace, monospace;
  color: var(--td-text-color-secondary);
}

.motion-fx-type-card__label {
  max-width: 100%;
  font-size: 10px;
  line-height: 1.25;
  text-align: center;
  word-break: keep-all;
}

.motion-fx-type-card--active .motion-fx-type-card__label {
  color: var(--td-brand-color);
  font-weight: 600;
}

.motion-fx-editor__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.motion-fx-editor__chip {
  padding: 4px 10px;
  font-size: 11px;
  border-radius: var(--td-radius-small);
  border: 1px solid var(--td-component-border);
  background: var(--td-bg-color-container);
  cursor: pointer;
}

.motion-fx-editor__chip--active {
  border-color: var(--td-brand-color);
  background: var(--td-brand-color-light);
  color: var(--td-brand-color);
}

.motion-fx-editor__state-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.motion-fx-editor__state-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-container);
}

.motion-fx-editor__state-head {
  margin: 0 0 4px;
  font-size: 10px;
  font-weight: 600;
  color: var(--td-text-color-secondary);
}

.motion-fx-editor__field :deep(.scrub) {
  width: 100%;
  max-width: none;
}
</style>
