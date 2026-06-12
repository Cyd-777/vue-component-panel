<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  buildCssVariableCatalog,
  CSS_VAR_CATEGORY_OPTIONS,
  CSS_VAR_EDIT_TAB_LABELS,
  CSS_VAR_LAYER_OPTIONS,
  CSS_VAR_SOURCE_OPTIONS,
  filterCssVariableCatalog,
  type CssVarCategory,
  type CssVarLayer,
  type CssVarSource,
  type CssVariableCatalogEntry,
} from '../tokens/cssVariableCatalog'

const emit = defineEmits<{
  navigateTab: [tab: 'colors' | 'dimensions' | 'fonts' | 'effects' | 'motion']
}>()

const catalog = ref<CssVariableCatalogEntry[]>([])

const layerFilter = ref<CssVarLayer | 'all'>('all')
const categoryFilter = ref<CssVarCategory | 'all'>('all')
const sourceFilter = ref<CssVarSource | 'all'>('all')
const query = ref('')
const editableOnly = ref(false)

function refreshCatalog() {
  catalog.value = buildCssVariableCatalog()
}

onMounted(refreshCatalog)

const filtered = computed(() =>
  filterCssVariableCatalog(catalog.value, {
    layer: layerFilter.value,
    category: categoryFilter.value,
    source: sourceFilter.value,
    query: query.value,
    editableOnly: editableOnly.value,
  }),
)

const layerBadgeClass: Record<CssVariableCatalogEntry['layer'], string> = {
  td: 'var-catalog__badge--td',
  flow: 'var-catalog__badge--flow',
  'flow-style': 'var-catalog__badge--preset',
  component: 'var-catalog__badge--comp',
}

const sourceLabel = computed(() => {
  const map = Object.fromEntries(CSS_VAR_SOURCE_OPTIONS.map((o) => [o.value, o.label]))
  return (s: CssVarSource) => map[s] ?? s
})

function resetFilters() {
  layerFilter.value = 'all'
  categoryFilter.value = 'all'
  sourceFilter.value = 'all'
  query.value = ''
  editableOnly.value = false
}

async function copyVar(name: string) {
  try {
    await navigator.clipboard.writeText(name)
  } catch {
    /* ignore */
  }
}

function isColorValue(value: string): boolean {
  const v = value.trim()
  return v.startsWith('#') || v.startsWith('rgb') || v.startsWith('hsl') || v === 'transparent'
}

function swatchStyle(value: string): Record<string, string> {
  if (!isColorValue(value)) return {}
  return { background: value }
}
</script>

<template>
  <div class="var-catalog">
    <div class="var-catalog__toolbar">
      <div class="var-catalog__filters">
        <label class="var-catalog__filter">
          <span class="var-catalog__filter-label">层级</span>
          <select v-model="layerFilter" class="var-catalog__select">
            <option v-for="o in CSS_VAR_LAYER_OPTIONS" :key="o.value" :value="o.value">
              {{ o.label }}
            </option>
          </select>
        </label>

        <label class="var-catalog__filter">
          <span class="var-catalog__filter-label">类别</span>
          <select v-model="categoryFilter" class="var-catalog__select">
            <option v-for="o in CSS_VAR_CATEGORY_OPTIONS" :key="o.value" :value="o.value">
              {{ o.label }}
            </option>
          </select>
        </label>

        <label class="var-catalog__filter">
          <span class="var-catalog__filter-label">来源</span>
          <select v-model="sourceFilter" class="var-catalog__select">
            <option v-for="o in CSS_VAR_SOURCE_OPTIONS" :key="o.value" :value="o.value">
              {{ o.label }}
            </option>
          </select>
        </label>

        <label class="var-catalog__filter var-catalog__filter--grow">
          <span class="var-catalog__filter-label">搜索</span>
          <input
            v-model="query"
            type="search"
            class="var-catalog__input"
            placeholder="变量名、标签、当前值…"
            spellcheck="false"
          />
        </label>
      </div>

      <div class="var-catalog__actions">
        <label class="var-catalog__check">
          <input v-model="editableOnly" type="checkbox" />
          仅可编辑
        </label>
        <button type="button" class="var-catalog__btn" @click="resetFilters">重置筛选</button>
        <button type="button" class="var-catalog__btn var-catalog__btn--primary" @click="refreshCatalog">
          刷新当前值
        </button>
      </div>
    </div>

    <p class="var-catalog__summary">
      显示 <strong>{{ filtered.length }}</strong> / {{ catalog.length }} 项
      <span class="var-catalog__summary-hint">· 值为 :root 计算结果；组件规划项在实现前可能为空</span>
    </p>

    <div class="var-catalog__table-wrap">
      <table class="var-catalog__table">
        <thead>
          <tr>
            <th>变量名</th>
            <th>当前值</th>
            <th>标签</th>
            <th>层级</th>
            <th>类别</th>
            <th>来源</th>
            <th>编辑</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!filtered.length">
            <td colspan="7" class="var-catalog__empty">无匹配项，请调整筛选条件</td>
          </tr>
          <tr v-for="row in filtered" :key="row.name">
            <td class="var-catalog__name">
              <code>{{ row.name }}</code>
              <button
                type="button"
                class="var-catalog__copy"
                title="复制变量名"
                @click="copyVar(row.name)"
              >
                复制
              </button>
            </td>
            <td class="var-catalog__value">
              <span
                v-if="isColorValue(row.currentValue)"
                class="var-catalog__swatch"
                :style="swatchStyle(row.currentValue)"
              />
              <code>{{ row.currentValue || '—' }}</code>
            </td>
            <td>
              <span class="var-catalog__label">{{ row.label }}</span>
              <span v-if="row.description" class="var-catalog__desc">{{ row.description }}</span>
            </td>
            <td>
              <span class="var-catalog__badge" :class="layerBadgeClass[row.layer]">{{ row.layer }}</span>
            </td>
            <td>{{ row.category }}</td>
            <td class="var-catalog__source">{{ sourceLabel(row.source) }}</td>
            <td>
              <button
                v-if="row.editTab"
                type="button"
                class="var-catalog__link"
                @click="emit('navigateTab', row.editTab)"
              >
                {{ CSS_VAR_EDIT_TAB_LABELS[row.editTab] }}
              </button>
              <span v-else class="var-catalog__muted">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.var-catalog {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 1200px;
}

.var-catalog__toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-medium);
  background: var(--td-bg-color-secondarycontainer);
}

.var-catalog__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
}

.var-catalog__filter {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 140px;
}

.var-catalog__filter--grow {
  flex: 1;
  min-width: 200px;
}

.var-catalog__filter-label {
  font-size: 11px;
  color: var(--td-text-color-placeholder);
}

.var-catalog__select,
.var-catalog__input {
  height: 32px;
  padding: 0 10px;
  font-size: 13px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-container);
  color: var(--td-text-color-primary);
}

.var-catalog__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.var-catalog__check {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--td-text-color-secondary);
  cursor: pointer;
}

.var-catalog__btn {
  padding: 6px 12px;
  font-size: 12px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-container);
  cursor: pointer;
  color: var(--td-text-color-primary);
}

.var-catalog__btn--primary {
  border-color: var(--td-brand-color);
  color: var(--td-brand-color);
  background: var(--td-brand-color-light);
}

.var-catalog__summary {
  margin: 0;
  font-size: 12px;
  color: var(--td-text-color-secondary);
}

.var-catalog__summary-hint {
  color: var(--td-text-color-placeholder);
}

.var-catalog__table-wrap {
  overflow: auto;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-medium);
}

.var-catalog__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.var-catalog__table th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  background: var(--td-bg-color-container);
  border-bottom: 1px solid var(--td-component-border);
  white-space: nowrap;
}

.var-catalog__table td {
  padding: 10px 12px;
  vertical-align: top;
  border-bottom: 1px solid var(--td-component-border);
  background: #fff;
}

.var-catalog__table tbody tr:hover td {
  background: var(--td-bg-color-container-hover);
}

.var-catalog__empty {
  text-align: center;
  color: var(--td-text-color-placeholder);
  padding: 32px !important;
}

.var-catalog__name code {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  word-break: break-all;
}

.var-catalog__copy {
  display: inline-block;
  margin-left: 8px;
  padding: 0 6px;
  font-size: 10px;
  border: none;
  background: transparent;
  color: var(--td-brand-color);
  cursor: pointer;
}

.var-catalog__value {
  max-width: 220px;
}

.var-catalog__value code {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  word-break: break-all;
}

.var-catalog__swatch {
  display: inline-block;
  width: 14px;
  height: 14px;
  margin-right: 6px;
  vertical-align: middle;
  border: 1px solid var(--td-component-border);
  border-radius: 2px;
}

.var-catalog__label {
  display: block;
  color: var(--td-text-color-primary);
}

.var-catalog__desc {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  color: var(--td-text-color-placeholder);
}

.var-catalog__badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
}

.var-catalog__badge--td {
  background: #e8f3ff;
  color: #0052d9;
}

.var-catalog__badge--flow {
  background: #f3f3f3;
  color: #393939;
}

.var-catalog__badge--preset {
  background: #e3f9e9;
  color: #008858;
}

.var-catalog__badge--comp {
  background: #fff1e9;
  color: #e37318;
}

.var-catalog__source {
  white-space: nowrap;
  color: var(--td-text-color-secondary);
}

.var-catalog__link {
  padding: 0;
  border: none;
  background: none;
  font-size: 12px;
  color: var(--td-brand-color);
  cursor: pointer;
  text-decoration: underline;
}

.var-catalog__muted {
  color: var(--td-text-color-placeholder);
}
</style>
