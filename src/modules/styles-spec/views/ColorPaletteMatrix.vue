<script setup lang="ts">
import { ref } from 'vue'
import ColorScaleColumn from './ColorScaleColumn.vue'
import PaletteNeutralSection from './PaletteNeutralSection.vue'
import { FUNCTIONAL_COLOR_COLUMNS } from '../tokens/colorPalettePageDefs'

type PaletteSection = 'settings' | 'usage'

const section = ref<PaletteSection>('settings')
</script>

<template>
  <div class="palette-spec">
    <nav class="palette-spec__segments" aria-label="色板分区">
      <button
        type="button"
        class="palette-spec__segment"
        :class="{ 'palette-spec__segment--active': section === 'settings' }"
        @click="section = 'settings'"
      >
        设置
      </button>
      <button
        type="button"
        class="palette-spec__segment"
        :class="{ 'palette-spec__segment--active': section === 'usage' }"
        @click="section = 'usage'"
      >
        使用
      </button>
    </nav>

    <template v-if="section === 'settings'">
      <section class="palette-spec__block">
        <header class="palette-spec__block-head">
          <h3 class="palette-spec__title">功能色与色阶</h3>
          <p class="palette-spec__hint">
            色卡角标：ΔLp 整数；规则未通过为 !!!ΔLp；两可时出现开关可对调黑白字。
          </p>
        </header>
        <div class="palette-spec__functional">
          <ColorScaleColumn
            v-for="col in FUNCTIONAL_COLOR_COLUMNS"
            :key="col.id"
            :column-id="col.id"
            :title="col.title"
            :token-key="col.tokenKey"
            :scale-prefix="col.scalePrefix"
          />
        </div>
      </section>

      <section class="palette-spec__block">
        <header class="palette-spec__block-head">
          <h3 class="palette-spec__title">Primary + Info 中性色阶</h3>
          <p class="palette-spec__hint">
            一组 Primary / Info 混合比；10 阶为 Primary 第 N 阶与 Info 第 N 阶按同占比混合（N = 1…10）；角标同功能色阶。
          </p>
        </header>
        <PaletteNeutralSection />
      </section>
    </template>

    <section v-else class="palette-spec__placeholder">
      <p>色板「使用」部分规划后续补充。</p>
    </section>
  </div>
</template>

<style scoped>
.palette-spec {
  display: flex;
  flex-direction: column;
  gap: 28px;
  max-width: 100%;
}

.palette-spec__segments {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  border-radius: var(--td-radius-medium);
  background: var(--td-bg-color-secondarycontainer);
  border: 1px solid var(--td-component-border);
  width: fit-content;
}

.palette-spec__segment {
  padding: 6px 16px;
  font-size: 13px;
  border: none;
  border-radius: var(--td-radius-small);
  background: transparent;
  color: var(--td-text-color-secondary);
  cursor: pointer;
}

.palette-spec__segment--active {
  background: var(--td-bg-color-container);
  color: var(--td-brand-color);
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

.palette-spec__block {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.palette-spec__block-head {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.palette-spec__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--td-text-color-primary);
  letter-spacing: 0.02em;
}

.palette-spec__hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--td-text-color-secondary);
}

.palette-spec__functional {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  overflow-x: auto;
  padding-bottom: 4px;
}

.palette-spec__functional > * {
  flex: 1 1 140px;
  max-width: 200px;
}

.palette-spec__placeholder {
  padding: 48px 24px;
  text-align: center;
  font-size: 13px;
  color: var(--td-text-color-placeholder);
  border: 1px dashed var(--td-component-border);
  border-radius: var(--td-radius-medium);
  background: var(--td-bg-color-secondarycontainer);
}

.palette-spec__placeholder p {
  margin: 0;
}
</style>
