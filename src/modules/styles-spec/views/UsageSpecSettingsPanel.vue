<script setup lang="ts">
import { computed } from 'vue'
import {
  BUTTON_SEMANTIC_LABELS,
  BUTTON_SEMANTIC_ROLE_LABELS,
  BUTTON_SIZE_LABELS,
  BUTTON_VARIANT_LABELS,
  COMPONENT_THEME_REGISTRY,
  THEME_COLOR_VAR_OPTIONS,
  type ButtonSemanticTheme,
  type ButtonSize,
  type ComponentThemeId,
} from '../tokens/componentThemeBindingDefs'
import {
  BUTTON_MOTION_INTERACTION_DEFS,
  COMPONENT_BINDING_PROFILE,
  PROFILE_COLOR_FIELDS,
  PROFILE_HINTS,
  PROFILE_LABELS,
  UNIFIED_FIELD_DEFS,
} from '../tokens/componentThemeBindingProfiles'
import {
  componentThemeBindings,
  resolvedButtonMotionPresetId,
  setButtonBorderEffectPreset,
  setButtonEffectPreset,
  setButtonFontBySize,
  setButtonInteractionMotionPreset,
  setButtonRadiusToken,
  setButtonSemanticRole,
} from '../tokens/componentThemeBindingStore'
import { motionEffectDisplayFromPreset } from '../tokens/effectConfig'
import { getPresetsByCategory, getStylePresetById } from '../tokens/stylePresetStore'
import { RADIUS_TOKEN_OPTIONS, type RadiusTokenKey } from '../tokens/themeUsageDefs'
import { themeUsageState } from '../tokens/themeUsageStore'
import type { ButtonMatrixSelection } from './ButtonSpecMatrix.vue'
import MotionEffectSummary from './MotionEffectSummary.vue'

const props = defineProps<{
  componentId: ComponentThemeId | null
  buttonFocus?: ButtonMatrixSelection | null
}>()

const fontPresets = () => getPresetsByCategory('font')
const effectPresets = () => getPresetsByCategory('effect')
const motionPresets = () => getPresetsByCategory('motion')

const button = componentThemeBindings.button
const semanticThemes = Object.keys(BUTTON_SEMANTIC_LABELS) as ButtonSemanticTheme[]
const buttonSizes = Object.keys(BUTTON_SIZE_LABELS) as ButtonSize[]

const activeMeta = computed(() =>
  COMPONENT_THEME_REGISTRY.find((c) => c.id === props.componentId),
)

const profile = computed(() =>
  props.componentId ? COMPONENT_BINDING_PROFILE[props.componentId] : null,
)

const profileLabel = computed(() => (profile.value ? PROFILE_LABELS[profile.value] : ''))
const profileHint = computed(() => (profile.value ? PROFILE_HINTS[profile.value] : ''))
const colorFields = computed(() => (profile.value ? PROFILE_COLOR_FIELDS[profile.value] : []))

const focusedSemantic = computed(() => props.buttonFocus?.semantic ?? null)

const focusRowLabel = computed(() => {
  const row = props.buttonFocus?.row
  if (!row) return ''
  const map: Record<string, string> = {
    default: BUTTON_VARIANT_LABELS.filled,
    outline: BUTTON_VARIANT_LABELS.outline,
    ghost: BUTTON_VARIANT_LABELS.ghost,
    dashed: '虚线',
  }
  return map[row] ?? row
})

const isButtonReady = computed(() => props.componentId === 'button')

function buttonMotionBindingDisplay(
  slot: (typeof BUTTON_MOTION_INTERACTION_DEFS)[number]['key'],
  trigger: (typeof BUTTON_MOTION_INTERACTION_DEFS)[number]['trigger'],
) {
  const localId = button[slot]
  const resolvedId = resolvedButtonMotionPresetId(slot, themeUsageState)
  const preset = resolvedId ? getStylePresetById(resolvedId) : undefined
  if (!preset) return null
  return {
    inherited: !localId,
    display: motionEffectDisplayFromPreset(preset, trigger),
  }
}
</script>

<template>
  <div class="theme-settings">
    <template v-if="!componentId">
      <header class="theme-settings__head">
        <h3 class="theme-settings__title">组件设置</h3>
        <p class="theme-settings__intro">
          请从左侧预览选择组件。全局字体 / 效果 / 动效 / 圆角槽位在右栏上方「全局默认」中配置。
        </p>
      </header>
    </template>

    <template v-else>
      <header class="theme-settings__head theme-settings__head--component">
        <p class="theme-settings__eyebrow">组件 binding</p>
        <h3 class="theme-settings__title">{{ activeMeta?.label }}</h3>
        <p v-if="profileLabel" class="theme-settings__profile">{{ profileLabel }}</p>
        <p v-if="buttonFocus && isButtonReady" class="theme-settings__focus">
          矩阵定位：
          <strong>{{ BUTTON_SEMANTIC_LABELS[buttonFocus.semantic] }}</strong>
          · {{ focusRowLabel }}
        </p>
        <p class="theme-settings__intro">{{ profileHint }}</p>
      </header>

      <div class="theme-settings__body">
        <!-- 块 A：组件统一 -->
        <section class="theme-settings__block">
          <h4 class="theme-settings__block-title">块 A · 组件统一</h4>
          <p class="theme-settings__block-hint">
            对该组件<strong>全部形态与状态</strong>生效；填充 / 描边 / 幽灵等共用这些项。
          </p>

          <template v-if="isButtonReady">
            <label class="theme-settings__field">
              <span>{{ UNIFIED_FIELD_DEFS[0].label }}</span>
              <select
                class="theme-settings__select"
                :value="button.radiusToken"
                @change="setButtonRadiusToken(($event.target as HTMLSelectElement).value as RadiusTokenKey)"
              >
                <option v-for="opt in RADIUS_TOKEN_OPTIONS" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </label>
            <label class="theme-settings__field">
              <span>{{ UNIFIED_FIELD_DEFS[1].label }}</span>
              <select
                v-if="effectPresets().length"
                class="theme-settings__select"
                :value="button.borderEffectPresetId"
                @change="setButtonBorderEffectPreset(($event.target as HTMLSelectElement).value)"
              >
                <option v-for="p in effectPresets()" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
            </label>
            <label class="theme-settings__field">
              <span>{{ UNIFIED_FIELD_DEFS[2].label }}</span>
              <select
                v-if="effectPresets().length"
                class="theme-settings__select"
                :value="button.effectPresetId"
                @change="setButtonEffectPreset(($event.target as HTMLSelectElement).value)"
              >
                <option v-for="p in effectPresets()" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
            </label>
            <div class="theme-settings__motion-block">
              <p class="theme-settings__motion-block-title">动效 · 交互态</p>
              <p class="theme-settings__motion-block-hint">
                与全局「动效 · 交互态」槽位对齐；选「继承全局」时使用右栏全局默认。
              </p>
              <label
                v-for="slotDef in BUTTON_MOTION_INTERACTION_DEFS"
                :key="slotDef.key"
                class="theme-settings__field"
              >
                <span>{{ slotDef.label }}</span>
                <select
                  v-if="motionPresets().length"
                  class="theme-settings__select"
                  :value="button[slotDef.key]"
                  @change="setButtonInteractionMotionPreset(slotDef.key, ($event.target as HTMLSelectElement).value)"
                >
                  <option value="">继承全局</option>
                  <option v-for="p in motionPresets()" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>
                <p
                  v-if="buttonMotionBindingDisplay(slotDef.key, slotDef.trigger)?.inherited"
                  class="theme-settings__inherit"
                >
                  当前继承全局
                </p>
                <MotionEffectSummary
                  v-if="buttonMotionBindingDisplay(slotDef.key, slotDef.trigger)"
                  :display="buttonMotionBindingDisplay(slotDef.key, slotDef.trigger)!.display"
                  compact
                />
              </label>
            </div>
            <label v-for="size in buttonSizes" :key="size" class="theme-settings__field">
              <span>{{ BUTTON_SIZE_LABELS[size] }}号字体</span>
              <select
                v-if="fontPresets().length"
                class="theme-settings__select"
                :value="button.fontPresetBySize[size]"
                @change="setButtonFontBySize(size, ($event.target as HTMLSelectElement).value)"
              >
                <option v-for="p in fontPresets()" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
            </label>
          </template>

          <template v-else>
            <label v-for="field in UNIFIED_FIELD_DEFS" :key="field.key" class="theme-settings__field">
              <span>{{ field.label }}</span>
              <select class="theme-settings__select" disabled>
                <option>{{ field.hint }} — 待实现</option>
              </select>
            </label>
          </template>
        </section>

        <!-- 块 B：档案色块 -->
        <section class="theme-settings__block">
          <h4 class="theme-settings__block-title">块 B · {{ profile === 'A' ? '语义颜色' : profile === 'B' ? '表单态颜色' : profile === 'C' ? '双态颜色' : profile === 'D' ? '容器面' : profile === 'E' ? '链接色' : '极简色' }}</h4>

          <div v-if="profile === 'A'" class="theme-settings__note">
            <p>填充 / 描边 / 虚线 / 幽灵 — <strong>形态配方</strong>，零设置项。</p>
            <p>悬浮 / 按下 / 聚焦 — 跟色板 <code>-hover</code> / <code>-active</code>（C1），零设置项。</p>
          </div>

          <div v-else class="theme-settings__note">
            <p>该组件走 {{ profileLabel }}，字段见下方结构预览。</p>
          </div>

          <template v-if="isButtonReady && profile === 'A'">
            <div
              v-for="theme in semanticThemes"
              :key="theme"
              class="theme-settings__semantic"
              :class="{ 'theme-settings__semantic--focus': focusedSemantic === theme }"
            >
              <div class="theme-settings__semantic-head">{{ BUTTON_SEMANTIC_LABELS[theme] }}</div>
              <label
                v-for="role in (['main', 'onMain', 'light'] as const)"
                :key="role"
                class="theme-settings__field"
              >
                <span>{{ BUTTON_SEMANTIC_ROLE_LABELS[role] }}</span>
                <select
                  class="theme-settings__select"
                  :value="button.semanticColors[theme][role] ?? ''"
                  @change="setButtonSemanticRole(theme, role, ($event.target as HTMLSelectElement).value)"
                >
                  <option v-if="role === 'light'" value="">不绑定</option>
                  <option v-for="opt in THEME_COLOR_VAR_OPTIONS" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </label>
            </div>
          </template>

          <template v-else>
            <div class="theme-settings__semantic">
              <div class="theme-settings__semantic-head">结构预览</div>
              <label v-for="field in colorFields" :key="field.key" class="theme-settings__field">
                <span>{{ field.label }}</span>
                <select class="theme-settings__select" disabled>
                  <option>引用色板变量 — store 待实现</option>
                </select>
              </label>
            </div>
          </template>
        </section>

        <!-- 形态 / 交互说明（零项） -->
        <section v-if="profile === 'A'" class="theme-settings__block theme-settings__block--muted">
          <h4 class="theme-settings__block-title">形态 · 交互（零设置项）</h4>
          <ul class="theme-settings__recipe">
            <li><strong>填充</strong> — bg = 主色，text = 衬色</li>
            <li><strong>描边 / 虚线</strong> — bg 透明，border/text = 主色，hover 铺浅底</li>
            <li><strong>幽灵</strong> — bg/border 无，text = 主色</li>
            <li><strong>交互</strong> — 色板派生 hover/active，不在此绑 bg/text/border 网格</li>
          </ul>
        </section>

        <p v-if="!isButtonReady" class="theme-settings__pending">
          该组件的 store 与运行时注入待实现；面板结构已按方法论对齐。
        </p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.theme-settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.theme-settings__head {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.theme-settings__head--component {
  padding-top: 16px;
  border-top: 1px solid var(--td-component-border);
}

.theme-settings__eyebrow {
  margin: 0;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--td-text-color-placeholder);
}

.theme-settings__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.theme-settings__profile {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  color: var(--td-brand-color);
}

.theme-settings__focus {
  margin: 0;
  font-size: 11px;
  color: var(--td-text-color-secondary);
}

.theme-settings__intro {
  margin: 0;
  font-size: 11px;
  line-height: 1.45;
  color: var(--td-text-color-secondary);
}

.theme-settings__methodology {
  padding: 10px 12px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--td-text-color-secondary);
  background: var(--td-bg-color-container);
  border-radius: var(--td-radius-small);
  border: 1px solid var(--td-component-border);
}

.theme-settings__methodology p {
  margin: 0 0 6px;
}

.theme-settings__methodology p:last-child {
  margin-bottom: 0;
}

.theme-settings__empty {
  padding: 24px 12px;
  text-align: center;
  font-size: 12px;
  color: var(--td-text-color-placeholder);
  border: 1px dashed var(--td-component-border);
  border-radius: var(--td-radius-small);
}

.theme-settings__body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.theme-settings__block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.theme-settings__block--muted {
  padding-top: 4px;
}

.theme-settings__block-title {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
}

.theme-settings__block-hint {
  margin: 0;
  font-size: 10px;
  line-height: 1.4;
  color: var(--td-text-color-placeholder);
}

.theme-settings__motion-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 0 4px;
  border-top: 1px dashed var(--td-component-border);
}

.theme-settings__motion-block-title {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
}

.theme-settings__motion-block-hint {
  margin: 0;
  font-size: 10px;
  line-height: 1.4;
  color: var(--td-text-color-placeholder);
}

.theme-settings__inherit {
  margin: 0;
  font-size: 9px;
  color: var(--td-text-color-placeholder);
}

.theme-settings__note {
  padding: 8px 10px;
  font-size: 10px;
  line-height: 1.45;
  color: var(--td-text-color-secondary);
  background: var(--td-bg-color-secondarycontainer);
  border-radius: var(--td-radius-small);
}

.theme-settings__note p {
  margin: 0 0 4px;
}

.theme-settings__note p:last-child {
  margin-bottom: 0;
}

.theme-settings__note code {
  font-size: 10px;
}

.theme-settings__semantic {
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  overflow: hidden;
}

.theme-settings__semantic--focus {
  border-color: var(--td-brand-color);
}

.theme-settings__semantic-head {
  padding: 8px 10px;
  font-size: 11px;
  font-weight: 600;
  background: var(--td-bg-color-container);
  border-bottom: 1px solid var(--td-component-border);
}

.theme-settings__semantic .theme-settings__field {
  padding: 8px 10px;
}

.theme-settings__field {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 10px;
  color: var(--td-text-color-secondary);
}

.theme-settings__select {
  width: 100%;
  height: 30px;
  padding: 0 8px;
  font-size: 11px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: #fff;
}

.theme-settings__select:disabled {
  color: var(--td-text-color-placeholder);
  background: var(--td-bg-color-secondarycontainer);
}

.theme-settings__recipe {
  margin: 0;
  padding-left: 18px;
  font-size: 10px;
  line-height: 1.55;
  color: var(--td-text-color-secondary);
}

.theme-settings__pending {
  margin: 0;
  font-size: 10px;
  color: var(--td-text-color-placeholder);
}
</style>
