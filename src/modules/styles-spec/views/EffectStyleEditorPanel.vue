<script setup lang="ts">
import { computed } from 'vue'
import ScrubInput from '../../../components/ScrubInput.vue'
import { EFFECT_SHADOW_OPTIONS } from '../tokens/stylePresetDefs'
import {
  CLIP_PATH_PRESETS,
  MIX_BLEND_MODE_OPTIONS,
  VISUAL_EFFECT_TIER_LABELS,
  buildBoxShadowFromParams,
  defaultVisualEffectConfig,
  readVisualEffectFromPreset,
  visualEffectConfigToStylePresetProperties,
  visualEffectSummary,
  type BackgroundKind,
  type BorderStyleKind,
  type ClipPathPresetId,
  type ShadowMode,
  type VisualEffectConfig,
} from '../tokens/visualEffectConfig'
import type { StylePreset } from '../tokens/stylePresetDefs'

const props = defineProps<{
  preset: StylePreset
}>()

const config = computed(() => readVisualEffectFromPreset(props.preset))

const summary = computed(() => visualEffectSummary(config.value))
const shadowPreview = computed(() => buildBoxShadowFromParams(config.value.shadow))

function patch(partial: Partial<VisualEffectConfig>) {
  const next = defaultVisualEffectConfig({
    ...config.value,
    ...partial,
    id: props.preset.id,
    name: props.preset.name,
  })
  Object.assign(props.preset.properties, visualEffectConfigToStylePresetProperties(next))
}

function patchShadow(partial: Partial<VisualEffectConfig['shadow']>) {
  patch({ shadow: { ...config.value.shadow, ...partial } })
}

function patchRadius(partial: Partial<VisualEffectConfig['borderRadius']>) {
  patch({ borderRadius: { ...config.value.borderRadius, ...partial } })
}

function patchBackground(partial: Partial<VisualEffectConfig['background']>) {
  patch({ background: { ...config.value.background, ...partial } })
}

function patchBorder(partial: Partial<VisualEffectConfig['border']>) {
  patch({ border: { ...config.value.border, ...partial } })
}

function setShadowMode(mode: ShadowMode) {
  patchShadow({ mode })
}

function setRadiusAll(px: number) {
  const v = Math.max(0, Math.round(px))
  patchRadius({ linked: true, all: v, topLeft: v, topRight: v, bottomRight: v, bottomLeft: v })
}

function setRadiusCorner(key: keyof VisualEffectConfig['borderRadius'], px: number) {
  patchRadius({ linked: false, [key]: Math.max(0, Math.round(px)) })
}
</script>

<template>
  <div class="visual-fx-editor">
    <p class="visual-fx-editor__summary">{{ summary }}</p>

    <section class="visual-fx-editor__block">
      <h3 class="visual-fx-editor__title">{{ VISUAL_EFFECT_TIER_LABELS.tier1 }}</h3>

      <div class="visual-fx-editor__subblock">
        <span class="visual-fx-editor__label">阴影</span>
        <div class="visual-fx-editor__chips" role="radiogroup" aria-label="阴影模式">
          <button
            type="button"
            class="visual-fx-editor__chip"
            :class="{ 'visual-fx-editor__chip--active': config.shadow.mode === 'none' }"
            @click="setShadowMode('none')"
          >
            无
          </button>
          <button
            type="button"
            class="visual-fx-editor__chip"
            :class="{ 'visual-fx-editor__chip--active': config.shadow.mode === 'token' }"
            @click="setShadowMode('token')"
          >
            Token
          </button>
          <button
            type="button"
            class="visual-fx-editor__chip"
            :class="{ 'visual-fx-editor__chip--active': config.shadow.mode === 'custom' }"
            @click="setShadowMode('custom')"
          >
            自定义
          </button>
        </div>
        <div v-if="config.shadow.mode === 'token'" class="visual-fx-editor__chips">
          <button
            v-for="opt in EFFECT_SHADOW_OPTIONS.filter((o) => o.value !== 'none')"
            :key="opt.value"
            type="button"
            class="visual-fx-editor__chip"
            :class="{ 'visual-fx-editor__chip--active': config.shadow.tokenLevel === opt.value }"
            @click="patchShadow({ tokenLevel: opt.value as '1' | '2' | '3' })"
          >
            {{ opt.label }}
          </button>
        </div>
        <div v-if="config.shadow.mode === 'custom'" class="visual-fx-editor__grid">
          <label class="visual-fx-editor__field visual-fx-editor__field--check">
            <span>内阴影 inset</span>
            <input
              type="checkbox"
              :checked="config.shadow.inset"
              @change="patchShadow({ inset: ($event.target as HTMLInputElement).checked })"
            />
          </label>
          <label class="visual-fx-editor__field">
            <span>X 偏移</span>
            <ScrubInput icon="X" :model-value="config.shadow.offsetX" :min="-48" :max="48" suffix="px" @update:model-value="(v) => patchShadow({ offsetX: v })" />
          </label>
          <label class="visual-fx-editor__field">
            <span>Y 偏移</span>
            <ScrubInput icon="Y" :model-value="config.shadow.offsetY" :min="-48" :max="48" suffix="px" @update:model-value="(v) => patchShadow({ offsetY: v })" />
          </label>
          <label class="visual-fx-editor__field">
            <span>模糊半径</span>
            <ScrubInput icon="◎" :model-value="config.shadow.blurRadius" :min="0" :max="64" suffix="px" @update:model-value="(v) => patchShadow({ blurRadius: v })" />
          </label>
          <label class="visual-fx-editor__field">
            <span>扩散半径</span>
            <ScrubInput icon="+" :model-value="config.shadow.spreadRadius" :min="-24" :max="48" suffix="px" @update:model-value="(v) => patchShadow({ spreadRadius: v })" />
          </label>
          <label class="visual-fx-editor__field visual-fx-editor__field--full">
            <span>颜色</span>
            <input
              class="visual-fx-editor__input"
              :value="config.shadow.color"
              @change="patchShadow({ color: ($event.target as HTMLInputElement).value })"
            />
          </label>
        </div>
        <p v-if="config.shadow.mode !== 'none'" class="visual-fx-editor__hint"><code>{{ shadowPreview }}</code></p>
      </div>

      <div class="visual-fx-editor__grid">
        <label class="visual-fx-editor__field">
          <span>模糊 filter</span>
          <ScrubInput icon="◎" :model-value="config.blur" :min="0" :max="20" :step="0.5" suffix="px" @update:model-value="(v) => patch({ blur: v })" />
        </label>
        <label class="visual-fx-editor__field">
          <span>透明度</span>
          <ScrubInput icon="%" :model-value="Math.round(config.opacity * 100)" :min="0" :max="100" suffix="%" @update:model-value="(v) => patch({ opacity: v / 100 })" />
        </label>
      </div>

      <div class="visual-fx-editor__subblock">
        <div class="visual-fx-editor__row-head">
          <span class="visual-fx-editor__label">圆角</span>
          <label class="visual-fx-editor__field visual-fx-editor__field--check">
            <span>四角联动</span>
            <input
              type="checkbox"
              :checked="config.borderRadius.linked"
              @change="patchRadius({ linked: ($event.target as HTMLInputElement).checked })"
            />
          </label>
        </div>
        <label v-if="config.borderRadius.linked" class="visual-fx-editor__field">
          <span>统一圆角</span>
          <ScrubInput icon="◢" :model-value="config.borderRadius.all" :min="0" :max="48" suffix="px" @update:model-value="setRadiusAll" />
        </label>
        <div v-else class="visual-fx-editor__grid">
          <label class="visual-fx-editor__field"><span>左上</span><ScrubInput icon="◢" :model-value="config.borderRadius.topLeft" :min="0" :max="48" suffix="px" @update:model-value="(v) => setRadiusCorner('topLeft', v)" /></label>
          <label class="visual-fx-editor__field"><span>右上</span><ScrubInput icon="◢" :model-value="config.borderRadius.topRight" :min="0" :max="48" suffix="px" @update:model-value="(v) => setRadiusCorner('topRight', v)" /></label>
          <label class="visual-fx-editor__field"><span>右下</span><ScrubInput icon="◢" :model-value="config.borderRadius.bottomRight" :min="0" :max="48" suffix="px" @update:model-value="(v) => setRadiusCorner('bottomRight', v)" /></label>
          <label class="visual-fx-editor__field"><span>左下</span><ScrubInput icon="◢" :model-value="config.borderRadius.bottomLeft" :min="0" :max="48" suffix="px" @update:model-value="(v) => setRadiusCorner('bottomLeft', v)" /></label>
        </div>
      </div>
    </section>

    <section class="visual-fx-editor__block">
      <h3 class="visual-fx-editor__title">{{ VISUAL_EFFECT_TIER_LABELS.tier2 }}</h3>

      <div class="visual-fx-editor__subblock">
        <span class="visual-fx-editor__label">背景</span>
        <select
          class="visual-fx-editor__select"
          :value="config.background.kind"
          @change="patchBackground({ kind: ($event.target as HTMLSelectElement).value as BackgroundKind })"
        >
          <option value="solid">纯色</option>
          <option value="linear">线性渐变</option>
          <option value="radial">径向渐变</option>
          <option value="conic">角度渐变</option>
        </select>
        <label v-if="config.background.kind === 'solid'" class="visual-fx-editor__field visual-fx-editor__field--full">
          <span>背景色</span>
          <input class="visual-fx-editor__input" :value="config.background.solid" @change="patchBackground({ solid: ($event.target as HTMLInputElement).value })" />
        </label>
        <template v-else>
          <div class="visual-fx-editor__grid">
            <label class="visual-fx-editor__field">
              <span>{{ config.background.kind === 'radial' ? '形状' : '角度' }}</span>
              <select
                v-if="config.background.kind === 'radial'"
                class="visual-fx-editor__select"
                :value="config.background.radialShape"
                @change="patchBackground({ radialShape: ($event.target as HTMLSelectElement).value as 'circle' | 'ellipse' })"
              >
                <option value="circle">circle</option>
                <option value="ellipse">ellipse</option>
              </select>
              <ScrubInput v-else icon="°" :model-value="config.background.angle" :min="0" :max="360" suffix="°" @update:model-value="(v) => patchBackground({ angle: v })" />
            </label>
            <label class="visual-fx-editor__field"><span>色标 1</span><input class="visual-fx-editor__input" :value="config.background.stop1Color" @change="patchBackground({ stop1Color: ($event.target as HTMLInputElement).value })" /></label>
            <label class="visual-fx-editor__field"><span>位置 1</span><ScrubInput icon="%" :model-value="config.background.stop1Pos" :min="0" :max="100" suffix="%" @update:model-value="(v) => patchBackground({ stop1Pos: v })" /></label>
            <label class="visual-fx-editor__field"><span>色标 2</span><input class="visual-fx-editor__input" :value="config.background.stop2Color" @change="patchBackground({ stop2Color: ($event.target as HTMLInputElement).value })" /></label>
            <label class="visual-fx-editor__field"><span>位置 2</span><ScrubInput icon="%" :model-value="config.background.stop2Pos" :min="0" :max="100" suffix="%" @update:model-value="(v) => patchBackground({ stop2Pos: v })" /></label>
          </div>
        </template>
      </div>

      <div class="visual-fx-editor__subblock">
        <span class="visual-fx-editor__label">边框</span>
        <div class="visual-fx-editor__grid">
          <label class="visual-fx-editor__field">
            <span>样式</span>
            <select class="visual-fx-editor__select" :value="config.border.style" @change="patchBorder({ style: ($event.target as HTMLSelectElement).value as BorderStyleKind })">
              <option value="none">无</option>
              <option value="solid">实线</option>
              <option value="dashed">虚线</option>
              <option value="dotted">点线</option>
            </select>
          </label>
          <label class="visual-fx-editor__field">
            <span>宽度</span>
            <ScrubInput icon="#" :model-value="config.border.width" :min="0" :max="8" suffix="px" @update:model-value="(v) => patchBorder({ width: v })" />
          </label>
          <label class="visual-fx-editor__field visual-fx-editor__field--full">
            <span>颜色</span>
            <input class="visual-fx-editor__input" :value="config.border.color" @change="patchBorder({ color: ($event.target as HTMLInputElement).value })" />
          </label>
          <label class="visual-fx-editor__field visual-fx-editor__field--check visual-fx-editor__field--full">
            <span>四边独立宽度</span>
            <input type="checkbox" :checked="config.border.sidesIndependent" @change="patchBorder({ sidesIndependent: ($event.target as HTMLInputElement).checked })" />
          </label>
        </div>
        <div v-if="config.border.sidesIndependent" class="visual-fx-editor__grid">
          <label class="visual-fx-editor__field"><span>上</span><ScrubInput icon="#" :model-value="config.border.topWidth" :min="0" :max="8" suffix="px" @update:model-value="(v) => patchBorder({ topWidth: v })" /></label>
          <label class="visual-fx-editor__field"><span>右</span><ScrubInput icon="#" :model-value="config.border.rightWidth" :min="0" :max="8" suffix="px" @update:model-value="(v) => patchBorder({ rightWidth: v })" /></label>
          <label class="visual-fx-editor__field"><span>下</span><ScrubInput icon="#" :model-value="config.border.bottomWidth" :min="0" :max="8" suffix="px" @update:model-value="(v) => patchBorder({ bottomWidth: v })" /></label>
          <label class="visual-fx-editor__field"><span>左</span><ScrubInput icon="#" :model-value="config.border.leftWidth" :min="0" :max="8" suffix="px" @update:model-value="(v) => patchBorder({ leftWidth: v })" /></label>
        </div>
      </div>

      <div class="visual-fx-editor__grid">
        <label class="visual-fx-editor__field">
          <span>毛玻璃 backdrop</span>
          <ScrubInput icon="◎" :model-value="config.backdropBlur" :min="0" :max="20" :step="0.5" suffix="px" @update:model-value="(v) => patch({ backdropBlur: v })" />
        </label>
        <label class="visual-fx-editor__field">
          <span>裁剪 clip-path</span>
          <select
            class="visual-fx-editor__select"
            :value="config.clipPathPreset"
            @change="patch({ clipPathPreset: ($event.target as HTMLSelectElement).value as ClipPathPresetId })"
          >
            <option v-for="p in CLIP_PATH_PRESETS" :key="p.id" :value="p.id">{{ p.label }}</option>
          </select>
        </label>
        <label v-if="config.clipPathPreset === 'custom'" class="visual-fx-editor__field visual-fx-editor__field--full">
          <span>自定义 clip-path</span>
          <input class="visual-fx-editor__input" :value="config.clipPathCustom" placeholder="polygon(...)" @change="patch({ clipPathCustom: ($event.target as HTMLInputElement).value })" />
        </label>
      </div>
    </section>

    <section class="visual-fx-editor__block">
      <h3 class="visual-fx-editor__title">{{ VISUAL_EFFECT_TIER_LABELS.tier3 }}</h3>
      <div class="visual-fx-editor__grid">
        <label class="visual-fx-editor__field">
          <span>灰度</span>
          <ScrubInput icon="%" :model-value="config.grayscale" :min="0" :max="100" suffix="%" @update:model-value="(v) => patch({ grayscale: v })" />
        </label>
        <label class="visual-fx-editor__field">
          <span>亮度</span>
          <ScrubInput icon="%" :model-value="config.brightness" :min="0" :max="200" suffix="%" @update:model-value="(v) => patch({ brightness: v })" />
        </label>
        <label class="visual-fx-editor__field">
          <span>对比度</span>
          <ScrubInput icon="%" :model-value="config.contrast" :min="0" :max="200" suffix="%" @update:model-value="(v) => patch({ contrast: v })" />
        </label>
        <label class="visual-fx-editor__field visual-fx-editor__field--full">
          <span>混合模式 mix-blend-mode</span>
          <select class="visual-fx-editor__select" :value="config.mixBlendMode" @change="patch({ mixBlendMode: ($event.target as HTMLSelectElement).value })">
            <option v-for="opt in MIX_BLEND_MODE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </label>
        <label class="visual-fx-editor__field">
          <span>旋转 transform</span>
          <ScrubInput icon="°" :model-value="config.rotate" :min="-180" :max="180" suffix="°" @update:model-value="(v) => patch({ rotate: v })" />
        </label>
        <label class="visual-fx-editor__field">
          <span>缩放 transform</span>
          <ScrubInput icon="×" :model-value="Math.round(config.scale * 100)" :min="50" :max="200" suffix="%" @update:model-value="(v) => patch({ scale: v / 100 })" />
        </label>
      </div>
    </section>
  </div>
</template>

<style scoped>
.visual-fx-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.visual-fx-editor__summary {
  margin: 0;
  padding: 8px 10px;
  font-size: 11px;
  line-height: 1.45;
  color: var(--td-text-color-secondary);
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-secondarycontainer);
}

.visual-fx-editor__block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.visual-fx-editor__title {
  margin: 0;
  padding-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--td-text-color-secondary);
  border-bottom: 1px solid var(--td-component-border);
}

.visual-fx-editor__subblock {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.visual-fx-editor__row-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.visual-fx-editor__label {
  font-size: 11px;
  font-weight: 500;
  color: var(--td-text-color-primary);
}

.visual-fx-editor__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
}

.visual-fx-editor__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
  color: var(--td-text-color-primary);
}

.visual-fx-editor__field--full {
  grid-column: 1 / -1;
}

.visual-fx-editor__field--check {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.visual-fx-editor__select,
.visual-fx-editor__input {
  width: 100%;
  height: 28px;
  padding: 0 8px;
  font-size: 12px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-container);
}

.visual-fx-editor__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.visual-fx-editor__chip {
  padding: 4px 10px;
  font-size: 11px;
  border-radius: var(--td-radius-small);
  border: 1px solid var(--td-component-border);
  background: var(--td-bg-color-container);
  cursor: pointer;
}

.visual-fx-editor__chip--active {
  border-color: var(--td-brand-color);
  background: var(--td-brand-color-light);
  color: var(--td-brand-color);
}

.visual-fx-editor__hint {
  margin: 0;
  font-size: 10px;
  color: var(--td-text-color-placeholder);
  word-break: break-all;
}

.visual-fx-editor__hint code {
  font-family: ui-monospace, monospace;
}

.visual-fx-editor__field :deep(.scrub) {
  width: 100%;
  max-width: none;
}
</style>
