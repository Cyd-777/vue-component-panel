<script setup lang="ts">
import { computed } from 'vue'
import ScrubInput from '../../../components/ScrubInput.vue'
import GlobalThemeUsagePanel from './GlobalThemeUsagePanel.vue'
import {
  MOTION_RANGE_FIELD_DEFS,
  USAGE_COMBINATION_RULES,
  USAGE_PHILOSOPHY_RULES,
  USAGE_RADIUS_SCENES,
  USAGE_SEMANTIC_RULES,
  USAGE_SPACING_SCENES,
  type UsageRuleEditTab,
} from '../tokens/usageRulesDefs'
import {
  auditThemeMotionCompliance,
  setUsageRuleConstraint,
  usageRulesState,
} from '../tokens/usageRulesStore'
import { getPresetsByCategory } from '../tokens/stylePresetStore'
import { motionSlotLabel } from '../tokens/motionPresetCatalog'

const emit = defineEmits<{
  navigateTab: [tab: UsageRuleEditTab]
}>()

const effectPresets = () => getPresetsByCategory('effect')

const motionAudit = computed(() => auditThemeMotionCompliance())

const motionAuditSummary = computed(() => {
  const rows = motionAudit.value
  if (!rows.length) return { ok: true, label: '未配置动效槽位' }
  const failed = rows.filter((r) => !r.ok)
  if (!failed.length) return { ok: true, label: `已检查 ${rows.length} 个槽位，均在区间内` }
  return { ok: false, label: `${failed.length} / ${rows.length} 个槽位超出区间` }
})

function goTab(tab: UsageRuleEditTab | undefined) {
  if (tab) emit('navigateTab', tab)
}
</script>

<template>
  <div class="usage-rules">
    <section class="usage-rules__intro">
      <p>
        <strong>使用规范</strong>回答「什么时候用什么、边界在哪」——不是给 30 个组件填表。
        色板 / 间距 / 字体 / 效果 / 动效已在定义 Tab 维护；此处配置<strong>区间、场景条文与项目默认槽</strong>。
        画板仍可高度自定义，超出区间时提示而不阻断。
      </p>
    </section>

    <!-- 分层原则 -->
    <section class="usage-rules__section">
      <header class="usage-rules__head">
        <h3 class="usage-rules__title">分层原则</h3>
        <p class="usage-rules__desc">定义层 · 使用规范 · 画板实例 各司其职。</p>
      </header>
      <div class="usage-rules__cards">
        <article
          v-for="rule in USAGE_PHILOSOPHY_RULES"
          :key="rule.id"
          class="usage-rules__card"
        >
          <h4 class="usage-rules__card-title">{{ rule.title }}</h4>
          <p class="usage-rules__card-summary">{{ rule.summary }}</p>
          <ul v-if="rule.doList?.length" class="usage-rules__list usage-rules__list--do">
            <li v-for="item in rule.doList" :key="item">{{ item }}</li>
          </ul>
          <ul v-if="rule.dontList?.length" class="usage-rules__list usage-rules__list--dont">
            <li v-for="item in rule.dontList" :key="item">{{ item }}</li>
          </ul>
          <button
            v-if="rule.editTab"
            type="button"
            class="usage-rules__link"
            @click="goTab(rule.editTab)"
          >
            前往定义 Tab →
          </button>
        </article>
      </div>
    </section>

    <!-- 圆角场景 -->
    <section class="usage-rules__section">
      <header class="usage-rules__head">
        <h3 class="usage-rules__title">圆角与容器</h3>
        <p class="usage-rules__desc">按场景选用圆角 token；具体默认值在下方「项目默认槽」。</p>
      </header>
      <table class="usage-rules__table">
        <thead>
          <tr>
            <th>场景</th>
            <th>何时</th>
            <th>推荐</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in USAGE_RADIUS_SCENES" :key="row.id">
            <td>{{ row.scene }}</td>
            <td class="usage-rules__muted">{{ row.when }}</td>
            <td><code>{{ row.recommend }}</code></td>
            <td>
              <button
                v-if="row.editTab"
                type="button"
                class="usage-rules__link usage-rules__link--inline"
                @click="goTab(row.editTab)"
              >
                编辑
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- 间距密度 -->
    <section class="usage-rules__section">
      <header class="usage-rules__head">
        <h3 class="usage-rules__title">间距与密度</h3>
        <p class="usage-rules__desc">密集区用小间距；营销区块可加大，但避免与重装饰叠加。</p>
      </header>
      <table class="usage-rules__table">
        <thead>
          <tr>
            <th>场景</th>
            <th>何时</th>
            <th>推荐</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in USAGE_SPACING_SCENES" :key="row.id">
            <td>{{ row.scene }}</td>
            <td class="usage-rules__muted">{{ row.when }}</td>
            <td><code>{{ row.recommend }}</code></td>
            <td>
              <button
                v-if="row.editTab"
                type="button"
                class="usage-rules__link usage-rules__link--inline"
                @click="goTab(row.editTab)"
              >
                编辑
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- 动效区间 -->
    <section class="usage-rules__section">
      <header class="usage-rules__head">
        <h3 class="usage-rules__title">动效时长区间</h3>
        <p class="usage-rules__desc">项目默认槽所选 preset 的 duration 应落在此区间内。</p>
      </header>
      <div class="usage-rules__fields">
        <label
          v-for="field in MOTION_RANGE_FIELD_DEFS"
          :key="field.key"
          class="usage-rules__field"
        >
          <span class="usage-rules__field-label">
            {{ field.label }}
            <span class="usage-rules__field-hint">{{ field.hint }}</span>
          </span>
          <ScrubInput
            :model-value="usageRulesState[field.key] as number"
            :min="field.min"
            :max="field.max"
            :step="field.step"
            suffix="ms"
            @update:model-value="setUsageRuleConstraint(field.key, $event as number)"
          />
        </label>
      </div>

      <div
        class="usage-rules__audit"
        :class="{ 'usage-rules__audit--warn': !motionAuditSummary.ok }"
      >
        <p class="usage-rules__audit-title">
          {{ motionAuditSummary.ok ? '✓' : '⚠' }} {{ motionAuditSummary.label }}
        </p>
        <ul v-if="motionAudit.length" class="usage-rules__audit-list">
          <li
            v-for="row in motionAudit"
            :key="row.slot"
            :class="{ 'usage-rules__audit-item--bad': !row.ok }"
          >
            <span>{{ motionSlotLabel(row.slot) }}</span>
            <span>{{ row.presetName }}</span>
            <span>{{ row.message }}</span>
          </li>
        </ul>
        <button type="button" class="usage-rules__link" @click="goTab('motion')">
          前往动效 Tab →
        </button>
      </div>
    </section>

    <!-- 效果与禁用 -->
    <section class="usage-rules__section">
      <header class="usage-rules__head">
        <h3 class="usage-rules__title">效果与禁用态</h3>
        <p class="usage-rules__desc">禁用视觉统一走效果 preset；错误边走色板 error 语义。</p>
      </header>
      <label class="usage-rules__field">
        <span class="usage-rules__field-label">
          全库禁用效果 preset
          <span class="usage-rules__field-hint">opacity / grayscale 等，非单独灰底 hex</span>
        </span>
        <select
          v-if="effectPresets().length"
          class="usage-rules__select"
          :value="usageRulesState.disabledEffectPresetId"
          @change="
            setUsageRuleConstraint(
              'disabledEffectPresetId',
              ($event.target as HTMLSelectElement).value,
            )
          "
        >
          <option v-for="p in effectPresets()" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </label>
    </section>

    <!-- 语义色用法 -->
    <section class="usage-rules__section">
      <header class="usage-rules__head">
        <h3 class="usage-rules__title">语义色用法</h3>
        <p class="usage-rules__desc">全库统一；不在组件设置面板重复绑色。</p>
      </header>
      <div class="usage-rules__cards usage-rules__cards--compact">
        <article
          v-for="rule in USAGE_SEMANTIC_RULES"
          :key="rule.id"
          class="usage-rules__card usage-rules__card--compact"
        >
          <h4 class="usage-rules__card-title">{{ rule.title }}</h4>
          <p class="usage-rules__card-summary">{{ rule.summary }}</p>
          <button
            v-if="rule.editTab"
            type="button"
            class="usage-rules__link"
            @click="goTab(rule.editTab)"
          >
            前往定义 Tab →
          </button>
        </article>
      </div>
    </section>

    <!-- 组合约束 -->
    <section class="usage-rules__section">
      <header class="usage-rules__head">
        <h3 class="usage-rules__title">组合约束</h3>
        <p class="usage-rules__desc">同一视图内避免以下叠加（后续可接画板 lint）。</p>
      </header>
      <ul class="usage-rules__prohibitions">
        <li v-for="rule in USAGE_COMBINATION_RULES" :key="rule.id">
          <strong>{{ rule.title }}</strong>
          <span>{{ rule.reason }}</span>
        </li>
      </ul>
    </section>

    <!-- 项目默认槽 -->
    <section class="usage-rules__section usage-rules__section--defaults">
      <header class="usage-rules__head">
        <h3 class="usage-rules__title">项目默认槽</h3>
        <p class="usage-rules__desc">
          画板新建与未 override 的组件继承此处；语义色仍来自色板，不在此绑。
        </p>
      </header>
      <GlobalThemeUsagePanel />
    </section>
  </div>
</template>

<style scoped>
.usage-rules {
  display: flex;
  flex-direction: column;
  gap: 28px;
  max-width: 920px;
}

.usage-rules__intro {
  padding: 14px 16px;
  font-size: 13px;
  line-height: 1.55;
  color: var(--td-text-color-secondary);
  background: var(--td-bg-color-secondarycontainer);
  border-radius: var(--td-radius-medium);
  border: 1px solid var(--td-component-border);
}

.usage-rules__intro p {
  margin: 0;
}

.usage-rules__section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.usage-rules__section--defaults {
  padding-top: 8px;
  border-top: 2px solid var(--td-component-border);
}

.usage-rules__head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.usage-rules__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.usage-rules__desc {
  margin: 0;
  font-size: 12px;
  color: var(--td-text-color-placeholder);
  line-height: 1.45;
}

.usage-rules__cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.usage-rules__cards--compact {
  grid-template-columns: 1fr;
}

.usage-rules__card {
  padding: 14px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-medium);
  background: var(--td-bg-color-container);
}

.usage-rules__card--compact {
  padding: 12px 14px;
}

.usage-rules__card-title {
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 600;
}

.usage-rules__card-summary {
  margin: 0 0 8px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--td-text-color-secondary);
}

.usage-rules__list {
  margin: 0 0 8px;
  padding-left: 18px;
  font-size: 11px;
  line-height: 1.5;
}

.usage-rules__list--do {
  color: var(--td-success-color);
}

.usage-rules__list--dont {
  color: var(--td-error-color);
}

.usage-rules__link {
  padding: 0;
  border: none;
  background: none;
  font-size: 11px;
  color: var(--td-brand-color);
  cursor: pointer;
  text-align: left;
}

.usage-rules__link--inline {
  font-size: 11px;
}

.usage-rules__link:hover {
  text-decoration: underline;
}

.usage-rules__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.usage-rules__table th,
.usage-rules__table td {
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid var(--td-component-border);
  vertical-align: top;
}

.usage-rules__table th {
  font-size: 11px;
  font-weight: 600;
  color: var(--td-text-color-secondary);
  background: var(--td-bg-color-secondarycontainer);
}

.usage-rules__table code {
  font-size: 11px;
  word-break: break-word;
}

.usage-rules__muted {
  color: var(--td-text-color-placeholder);
  font-size: 11px;
}

.usage-rules__fields {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.usage-rules__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.usage-rules__field-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
  font-weight: 500;
  color: var(--td-text-color-secondary);
}

.usage-rules__field-hint {
  font-weight: 400;
  color: var(--td-text-color-placeholder);
}

.usage-rules__select {
  height: 32px;
  padding: 0 8px;
  font-size: 12px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-container);
}

.usage-rules__audit {
  padding: 12px 14px;
  border-radius: var(--td-radius-medium);
  border: 1px solid color-mix(in srgb, var(--td-success-color) 35%, var(--td-component-border));
  background: color-mix(in srgb, var(--td-success-color) 6%, var(--td-bg-color-container));
}

.usage-rules__audit--warn {
  border-color: color-mix(in srgb, var(--td-warning-color) 45%, var(--td-component-border));
  background: color-mix(in srgb, var(--td-warning-color) 8%, var(--td-bg-color-container));
}

.usage-rules__audit-title {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 600;
}

.usage-rules__audit-list {
  margin: 0 0 8px;
  padding: 0;
  list-style: none;
  font-size: 11px;
}

.usage-rules__audit-list li {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px dashed var(--td-component-border);
}

.usage-rules__audit-item--bad {
  color: var(--td-error-color);
}

.usage-rules__prohibitions {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.usage-rules__prohibitions li {
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.45;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-secondarycontainer);
}

.usage-rules__prohibitions strong {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
}

.usage-rules__prohibitions span {
  color: var(--td-text-color-secondary);
  font-size: 11px;
}
</style>
