<script setup lang="ts">
import { computed, ref } from 'vue'
import { runColorRules, type ColorRuleFinding } from '../tokens/colorRuleChecker'
import {
  COLOR_THEORY_CATALOG,
  colorRuleLabel,
  ruleTheoryCitations,
  ruleTheoryLabels,
} from '../tokens/colorTheoryCatalog'
import { VISUAL_DELTA_THRESHOLD } from '../tokens/perceptualColor'
import { normalizeHex, parseColorToHex } from '../tokens/colorUtils'
import {
  computePerceptualWeight,
  pickTextColorOnBackground,
} from '../tokens/swatchTextColor'

const fgInput = ref('#1a1a1a')
const bgInput = ref('#ffffff')
const textSize = ref<'normal' | 'large'>('normal')

const fgHex = computed(() => parseColorToHex(fgInput.value))
const bgHex = computed(() => parseColorToHex(bgInput.value))
const fgValid = computed(() => fgHex.value !== null)
const bgValid = computed(() => bgHex.value !== null)

const ruleReport = computed(() => {
  if (!fgHex.value || !bgHex.value) return null
  const weight = computePerceptualWeight(bgHex.value)
  const strategy = weight >= 0.4 ? 'on-saturated' : 'on-tint'
  return runColorRules(fgHex.value, bgHex.value, textSize.value, strategy, weight)
})

const previewStyle = computed(() => {
  if (!fgHex.value || !bgHex.value) {
    return {
      color: 'var(--td-text-color-secondary)',
      background: 'var(--td-bg-color-secondarycontainer)',
    }
  }
  return { color: fgHex.value, background: bgHex.value }
})

function findingClass(level: ColorRuleFinding['level']) {
  if (level === 'error') return 'wcag__check-item--fail'
  if (level === 'warn') return 'wcag__check-item--warn'
  return 'wcag__check-item--pass'
}

function onColorInput(which: 'fg' | 'bg', raw: string) {
  if (which === 'fg') fgInput.value = raw
  else bgInput.value = raw
}

function swapColors() {
  const tmp = fgInput.value
  fgInput.value = bgInput.value
  bgInput.value = tmp
}

function suggestFgOnBg() {
  const bg = parseColorToHex(bgInput.value)
  if (bg) fgInput.value = pickTextColorOnBackground(bg, textSize.value, { kind: 'auto' })
}

const illusionRuleRows = [
  {
    ruleId: 'illusion-yellow-white',
    name: '亮黄底 + 白字',
    trigger: '黄系高 L* 背景上使用近白字',
  },
  {
    ruleId: 'illusion-heavy-bg-black-text',
    name: '重色饱和底 + 黑字',
    trigger: '高视觉重量 + 高 C* 底上使用近黑字',
  },
  {
    ruleId: 'illusion-hue-without-lightness',
    name: '仅有色相差',
    trigger: 'ΔL* 过小但色相差 > 55°',
  },
  {
    ruleId: 'illusion-complementary-vibration',
    name: '互补色振动',
    trigger: '色相差 ≈ 180° 且 ΔL* 过小',
  },
] as const
</script>

<template>
  <div class="wcag">
    <section class="wcag__intro">
      <h3 class="wcag__section-title">系统色彩规则（非传统 WCAG）</h3>
      <p class="wcag__text">
        本 Tab 是<strong>色彩规则检测器</strong>，作用类似代码里的语法检查：扫描前景/背景搭配是否符合
        Flow 组件库用法，并规避常见<strong>视错觉</strong>。判定基线是<strong>视觉感知</strong>（CIELAB + 色相亮度补偿），
        不是 W3C WCAG 2.x 的相对亮度公式。
      </p>

      <div class="wcag__formula">
        <p class="wcag__formula-title">视觉基线 · 感知明度差 ΔLp</p>
        <div class="wcag__theory-tags">
          <span
            v-for="t in COLOR_THEORY_CATALOG.filter((x) => x.id === 'cielab' || x.id === 'helmholtz-kohlrausch')"
            :key="t.id"
            class="wcag__theory-tag"
            :title="`${t.term} — ${t.proponent}`"
          >
            {{ t.term }}
          </span>
        </div>
        <code class="wcag__formula-code">
          Lp = L* + 0.042·C*·cos(h−90°)<sub>+</sub> − 0.03·C*·cos(h−270°)<sub>+</sub>
        </code>
        <code class="wcag__formula-code">ΔLp = |Lp<sub>前景</sub> − Lp<sub>背景</sub>|</code>
        <p class="wcag__text wcag__text--muted">
          L*、C*、h 来自 CIELAB（D65）。黄系补偿「视觉更亮」、蓝系补偿「视觉更沉」（Helmholtz–Kohlrausch 简化）。
          正文需 ΔLp ≥ {{ VISUAL_DELTA_THRESHOLD.normal }}，大号字 ≥ {{ VISUAL_DELTA_THRESHOLD.large }}。
        </p>
      </div>

      <section class="wcag__dlp-spec" aria-labelledby="dlp-spec-title">
        <h3 id="dlp-spec-title" class="wcag__section-title">ΔLp 是什么</h3>
        <dl class="wcag__dlp-dl">
          <div class="wcag__dlp-row">
            <dt>名称</dt>
            <dd>
              <strong>ΔLp</strong>（Delta Lp）— 前景与背景的<strong>感知明度差</strong>。
              <code>Lp</code> 为经 Helmholtz–Kohlrausch 补偿后的感知亮度；
              <code>ΔLp = |Lp<sub>前景</sub> − Lp<sub>背景</sub>|</code>。
            </dd>
          </div>
          <div class="wcag__dlp-row">
            <dt>量纲</dt>
            <dd>
              与 CIELAB 的 <code>L*</code> 同尺度，理论区间约 <code>0–100</code>（0 为感知最暗，100 为最亮）。
              <code>ΔLp</code> 表示两者在该尺度上相距多远，<strong>无百分号、不是对比度比值</strong>（勿与 WCAG 的 <code>4.5:1</code> 混淆）。
            </dd>
          </div>
          <div class="wcag__dlp-row">
            <dt>语义</dt>
            <dd>
              在<strong>明度分离</strong>维度上衡量「字是否从底色里立出来、好不好认」。
              <strong>ΔLp 越高，前景与背景在感知明暗上拉得越开，通常越显眼、越可读</strong>；
              但不等于整体 UI 越「抢眼」（色相差、用法、视错觉等需另判）。
            </dd>
          </div>
          <div class="wcag__dlp-row">
            <dt>与 ΔL* 的区别</dt>
            <dd>
              <code>ΔL* = |L*<sub>前景</sub> − L*<sub>背景</sub>|</code> 仅物理明度；
              <code>ΔLp</code> 在 <code>L*</code> 上计入色相：同 <code>L*</code> 下，黄比蓝「看起来更亮」，故更贴近人眼。
            </dd>
          </div>
          <div class="wcag__dlp-row">
            <dt>本系统阈值</dt>
            <dd>
              正文（约 ≤ 14px）：<code>ΔLp ≥ {{ VISUAL_DELTA_THRESHOLD.normal }}</code>；
              大号字（≥ 14px 粗体或 ≥ 18px）：<code>ΔLp ≥ {{ VISUAL_DELTA_THRESHOLD.large }}</code>。
              色卡角标与检测结果中的 <code>ΔLp 42.3</code> 即该数值（保留一位小数）。
            </dd>
          </div>
          <div class="wcag__dlp-row">
            <dt>检索关键词</dt>
            <dd>
              CIE L*a*b* · Helmholtz–Kohlrausch effect · perceived lightness · chromatic luminance
            </dd>
          </div>
        </dl>
        <table class="wcag__table wcag__table--dlp">
          <caption class="wcag__table-caption">ΔLp 读数示意（同一配对内相对比较）</caption>
          <thead>
            <tr>
              <th>ΔLp 区间</th>
              <th>典型感受</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>&lt; {{ VISUAL_DELTA_THRESHOLD.large }}</code></td>
              <td>明度贴太近，易糊、易融底</td>
            </tr>
            <tr>
              <td><code>{{ VISUAL_DELTA_THRESHOLD.large }}–{{ VISUAL_DELTA_THRESHOLD.normal - 1 }}</code></td>
              <td>大号字可读；小字号仍可能不足</td>
            </tr>
            <tr>
              <td><code>≥ {{ VISUAL_DELTA_THRESHOLD.normal }}</code></td>
              <td>正文级分离达标，清晰可认</td>
            </tr>
            <tr>
              <td><code>≥ 55</code></td>
              <td>接近黑白级分离，非常跳，大面积正文可能过刺眼</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="wcag__theory-catalog" aria-labelledby="theory-catalog-title">
        <h3 id="theory-catalog-title" class="wcag__section-title">色彩理论依据（专业术语 · 提出者）</h3>
        <p class="wcag__text wcag__text--muted">
          下列为<strong>可检索的专业术语</strong>及提出者/机构；名词本身承载语义，可在搜索引擎中进一步查阅原文与实验。
        </p>
        <div class="wcag__theory-list">
          <article
            v-for="theory in COLOR_THEORY_CATALOG"
            :key="theory.id"
            class="wcag__theory-card"
          >
            <header class="wcag__theory-card-head">
              <h4 class="wcag__theory-term">{{ theory.term }}</h4>
              <span class="wcag__theory-term-en">{{ theory.termEn }}</span>
            </header>
            <p class="wcag__theory-proponent">
              <span class="wcag__theory-proponent-label">提出者 / 机构</span>
              {{ theory.proponent }}
              <span v-if="theory.proponentEn" class="wcag__theory-proponent-en">
                · {{ theory.proponentEn }}
              </span>
              <span v-if="theory.era" class="wcag__theory-era"> · {{ theory.era }}</span>
            </p>
            <p class="wcag__theory-summary">{{ theory.summary }}</p>
            <p class="wcag__theory-application">
              <span class="wcag__theory-application-label">本系统用法</span>
              {{ theory.application }}
            </p>
            <div class="wcag__theory-tags">
              <span
                v-for="ruleId in theory.ruleIds"
                :key="ruleId"
                class="wcag__theory-rule-tag"
                :title="ruleId"
              >
                {{ colorRuleLabel(ruleId) }}
              </span>
            </div>
          </article>
        </div>
      </section>

      <div class="wcag__table-wrap">
        <p class="wcag__table-caption">组件库用法规则（硬约束）</p>
        <table class="wcag__table">
          <thead>
            <tr>
              <th>场景</th>
              <th>字色</th>
              <th>说明</th>
              <th>色彩理论</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>浅彩底 / 浅阶</td>
              <td><code>#000</code></td>
              <td>浅底深字，同色相体系下的 value 分离</td>
              <td>
                <span
                  v-for="label in ruleTheoryLabels('usage-light-needs-dark')"
                  :key="label"
                  class="wcag__theory-tag wcag__theory-tag--inline"
                >
                  {{ label }}
                </span>
              </td>
            </tr>
            <tr>
              <td>深彩底 / 深阶</td>
              <td><code>#fff</code></td>
              <td>深底浅字，主色按钮、Tag 等</td>
              <td>
                <span
                  v-for="label in ruleTheoryLabels('usage-deep-needs-light')"
                  :key="label"
                  class="wcag__theory-tag wcag__theory-tag--inline"
                >
                  {{ label }}
                </span>
              </td>
            </tr>
            <tr>
              <td>白底 + 彩色块</td>
              <td>块内仍按深浅策略</td>
              <td>页面底中立，组件块内遵守上两条</td>
              <td>
                <span class="wcag__theory-tag wcag__theory-tag--inline">语义色彩角色</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="wcag__table-wrap wcag__table-wrap--secondary">
        <p class="wcag__table-caption">视错觉检测（warn / error）</p>
        <table class="wcag__table">
          <thead>
            <tr>
              <th>规则</th>
              <th>触发条件</th>
              <th>色彩理论</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in illusionRuleRows" :key="row.ruleId">
              <td>{{ row.name }}</td>
              <td>{{ row.trigger }}</td>
              <td>
                <span
                  v-for="label in ruleTheoryLabels(row.ruleId)"
                  :key="label"
                  class="wcag__theory-tag wcag__theory-tag--inline"
                >
                  {{ label }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <p class="wcag__text wcag__text--muted wcag__table-foot">
          传统 WCAG 对比度在结果中作为「参考」列出，对应
          <span class="wcag__theory-tag wcag__theory-tag--inline">WCAG 相对亮度对比度（W3C WAI）</span>，不参与 pass/fail。
        </p>
      </div>
    </section>

    <section class="wcag__calc">
      <h3 class="wcag__section-title">色彩规则检测</h3>
      <p class="wcag__text wcag__text--muted">
        输入前景 / 背景 HEX 或 RGB。支持交换、按组件策略推荐字色。
      </p>

      <label class="wcag__field">
        <span class="wcag__label">检测档位</span>
        <select v-model="textSize" class="wcag__select">
          <option value="normal">正文（ΔLp ≥ {{ VISUAL_DELTA_THRESHOLD.normal }}）</option>
          <option value="large">大号字（ΔLp ≥ {{ VISUAL_DELTA_THRESHOLD.large }}）</option>
        </select>
      </label>

      <div class="wcag__inputs">
        <div class="wcag__field">
          <label class="wcag__label" for="wcag-fg">前景色（文字）</label>
          <div class="wcag__input-row">
            <input
              id="wcag-fg"
              v-model="fgInput"
              class="wcag__input"
              :class="{ 'wcag__input--invalid': fgInput.trim() && !fgValid }"
              type="text"
              spellcheck="false"
            />
            <input
              type="color"
              class="wcag__swatch"
              :value="fgValid ? normalizeHex(fgHex!) : '#000000'"
              @input="onColorInput('fg', ($event.target as HTMLInputElement).value)"
            />
          </div>
          <span v-if="fgInput.trim() && !fgValid" class="wcag__error">无法解析该颜色</span>
          <span v-else-if="fgHex" class="wcag__parsed">{{ normalizeHex(fgHex).toLowerCase() }}</span>
        </div>
        <div class="wcag__field">
          <label class="wcag__label" for="wcag-bg">背景色</label>
          <div class="wcag__input-row">
            <input
              id="wcag-bg"
              v-model="bgInput"
              class="wcag__input"
              :class="{ 'wcag__input--invalid': bgInput.trim() && !bgValid }"
              type="text"
              spellcheck="false"
            />
            <input
              type="color"
              class="wcag__swatch"
              :value="bgValid ? normalizeHex(bgHex!) : '#ffffff'"
              @input="onColorInput('bg', ($event.target as HTMLInputElement).value)"
            />
          </div>
          <span v-if="bgInput.trim() && !bgValid" class="wcag__error">无法解析该颜色</span>
          <span v-else-if="bgHex" class="wcag__parsed">{{ normalizeHex(bgHex).toLowerCase() }}</span>
        </div>
      </div>

      <div class="wcag__actions">
        <button type="button" class="wcag__btn" @click="swapColors">交换前景 / 背景</button>
        <button type="button" class="wcag__btn wcag__btn--ghost" :disabled="!bgValid" @click="suggestFgOnBg">
          按组件策略推荐字色
        </button>
      </div>

      <div v-if="ruleReport" class="wcag__result">
        <div class="wcag__ratio-box">
          <span class="wcag__ratio-label">感知明度差</span>
          <span
            class="wcag__ratio-value"
            :class="{ 'wcag__ratio-value--ok': ruleReport.passesVisualSeparation }"
          >
            {{ ruleReport.visualDeltaLabel }}
          </span>
        </div>
        <p class="wcag__verdict" :class="ruleReport.passes ? 'wcag__verdict--ok' : 'wcag__verdict--fail'">
          {{ ruleReport.passes ? '✓ 色彩规则通过' : '✗ 存在规则错误' }}
          <span class="wcag__verdict-ref">· WCAG 参考 {{ ruleReport.referenceWcagLabel }}</span>
        </p>

        <ul class="wcag__checklist">
          <li
            v-for="item in ruleReport.findings"
            :key="item.id + item.level"
            class="wcag__check-item"
            :class="findingClass(item.level)"
          >
            <span class="wcag__check-icon">
              {{ item.level === 'error' ? '✗' : item.level === 'warn' ? '!' : '·' }}
            </span>
            <div class="wcag__check-body">
              <strong>{{ item.title }}</strong>
              <span>{{ item.message }}</span>
              <div v-if="ruleTheoryCitations(item.id).length" class="wcag__theory-tags">
                <span
                  v-for="cite in ruleTheoryCitations(item.id)"
                  :key="cite"
                  class="wcag__theory-citation"
                >
                  {{ cite }}
                </span>
              </div>
              <span v-if="item.theory" class="wcag__check-theory">{{ item.theory }}</span>
            </div>
          </li>
        </ul>
      </div>

      <div class="wcag__preview" :style="previewStyle">
        <p class="wcag__preview-title">预览文字</p>
        <p class="wcag__preview-body">组件库正文示例 The quick brown fox jumps over the lazy dog.</p>
        <p class="wcag__preview-large">大号字示例 18px+</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.wcag {
  display: flex;
  flex-direction: column;
  gap: 28px;
  max-width: 720px;
}

.wcag__section-title {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
}

.wcag__text {
  margin: 0 0 10px;
  font-size: 13px;
  line-height: 1.65;
  color: var(--td-text-color-primary);
}

.wcag__text--muted {
  color: var(--td-text-color-secondary);
}

.wcag__text code {
  font-size: 12px;
  padding: 1px 5px;
  border-radius: 3px;
  background: var(--td-bg-color-secondarycontainer);
}

.wcag__formula {
  margin: 12px 0;
  padding: 12px 14px;
  border-radius: var(--td-radius-small);
  border: 1px solid var(--td-component-border);
  background: var(--td-bg-color-secondarycontainer);
}

.wcag__dlp-spec {
  margin: 4px 0 8px;
  padding: 14px 16px;
  border-radius: var(--td-radius-small);
  border: 1px solid var(--td-component-border);
  background: var(--td-bg-color-container);
}

.wcag__dlp-dl {
  margin: 0 0 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wcag__dlp-row {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 8px 12px;
  align-items: start;
}

.wcag__dlp-row dt {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  color: var(--td-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.wcag__dlp-row dd {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--td-text-color-primary);
}

.wcag__dlp-row dd code {
  font-size: 11px;
  padding: 1px 4px;
  border-radius: 3px;
  background: var(--td-bg-color-secondarycontainer);
}

.wcag__table--dlp {
  margin-top: 4px;
}

.wcag__formula-title {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--td-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.wcag__formula-code {
  display: block;
  margin: 0 0 8px;
  font-size: 13px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--td-text-color-primary);
}

.wcag__theory-catalog {
  margin: 8px 0 4px;
}

.wcag__theory-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.wcag__theory-card {
  padding: 12px 14px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-container);
}

.wcag__theory-card-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 6px;
}

.wcag__theory-term {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.wcag__theory-term-en {
  font-size: 11px;
  color: var(--td-text-color-placeholder);
  font-style: italic;
}

.wcag__theory-proponent {
  margin: 0 0 8px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--td-text-color-primary);
}

.wcag__theory-proponent-label {
  display: inline-block;
  margin-right: 6px;
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 700;
  border-radius: 4px;
  background: color-mix(in srgb, var(--td-brand-color) 12%, var(--td-bg-color-secondarycontainer));
  color: var(--td-brand-color);
}

.wcag__theory-proponent-en {
  color: var(--td-text-color-secondary);
  font-size: 11px;
}

.wcag__theory-era {
  color: var(--td-text-color-secondary);
  font-size: 11px;
}

.wcag__theory-summary {
  margin: 0 0 8px;
  font-size: 12px;
  line-height: 1.55;
  color: var(--td-text-color-secondary);
}

.wcag__theory-application {
  margin: 0 0 8px;
  font-size: 12px;
  line-height: 1.55;
  color: var(--td-text-color-primary);
}

.wcag__theory-application-label {
  display: inline-block;
  margin-right: 6px;
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 600;
  border-radius: 4px;
  background: var(--td-bg-color-secondarycontainer);
  color: var(--td-text-color-secondary);
}

.wcag__theory-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.wcag__theory-tag {
  display: inline-block;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 600;
  line-height: 1.4;
  border-radius: 999px;
  background: color-mix(in srgb, var(--td-brand-color) 14%, var(--td-bg-color-secondarycontainer));
  color: var(--td-brand-color);
  border: 1px solid color-mix(in srgb, var(--td-brand-color) 22%, transparent);
}

.wcag__theory-tag--inline {
  font-weight: 500;
}

.wcag__theory-rule-tag {
  display: inline-block;
  padding: 1px 6px;
  font-size: 10px;
  border-radius: 4px;
  background: var(--td-bg-color-secondarycontainer);
  color: var(--td-text-color-secondary);
}

.wcag__theory-citation {
  display: block;
  font-size: 10px;
  line-height: 1.45;
  color: var(--td-text-color-secondary);
}

.wcag__table-wrap {
  margin: 16px 0;
}

.wcag__table-wrap--secondary {
  margin-top: 20px;
}

.wcag__table-caption {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.wcag__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  line-height: 1.5;
}

.wcag__table th,
.wcag__table td {
  padding: 8px 10px;
  text-align: left;
  border: 1px solid var(--td-component-border);
  vertical-align: top;
}

.wcag__table th {
  background: var(--td-bg-color-secondarycontainer);
  font-weight: 600;
  color: var(--td-text-color-secondary);
}

.wcag__table td code {
  font-size: 11px;
  padding: 1px 4px;
  border-radius: 3px;
  background: var(--td-bg-color-secondarycontainer);
  white-space: nowrap;
}

.wcag__table-foot {
  margin: 8px 0 0;
  font-size: 11px;
}

.wcag__select {
  height: 32px;
  padding: 0 8px;
  font-size: 12px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-container);
  margin-bottom: 12px;
}

.wcag__inputs {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 12px;
}

.wcag__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.wcag__label {
  font-size: 12px;
  font-weight: 500;
  color: var(--td-text-color-secondary);
}

.wcag__input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.wcag__input {
  flex: 1;
  min-width: 0;
  height: 36px;
  padding: 0 10px;
  font-size: 13px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-container);
  color: var(--td-text-color-primary);
}

.wcag__input:focus {
  outline: none;
  border-color: var(--td-brand-color);
}

.wcag__input--invalid {
  border-color: var(--td-error-color);
}

.wcag__swatch {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  cursor: pointer;
  background: transparent;
}

.wcag__parsed {
  font-size: 11px;
  font-family: ui-monospace, monospace;
  color: var(--td-text-color-placeholder);
}

.wcag__error {
  font-size: 11px;
  color: var(--td-error-color);
}

.wcag__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.wcag__btn {
  padding: 6px 12px;
  font-size: 12px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-container);
  color: var(--td-text-color-primary);
  cursor: pointer;
}

.wcag__btn:hover:not(:disabled) {
  border-color: var(--td-brand-color);
  color: var(--td-brand-color);
}

.wcag__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.wcag__btn--ghost {
  background: transparent;
}

.wcag__result {
  margin-top: 20px;
  padding: 16px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-medium);
  background: var(--td-bg-color-container);
}

.wcag__ratio-box {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 8px;
}

.wcag__ratio-label {
  font-size: 12px;
  color: var(--td-text-color-secondary);
}

.wcag__ratio-value {
  font-size: 28px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--td-error-color);
}

.wcag__ratio-value--ok {
  color: var(--td-success-color);
}

.wcag__verdict {
  margin: 0 0 14px;
  font-size: 13px;
  font-weight: 600;
}

.wcag__verdict--ok {
  color: var(--td-success-color);
}

.wcag__verdict--fail {
  color: var(--td-error-color);
}

.wcag__verdict-ref {
  font-weight: 400;
  color: var(--td-text-color-placeholder);
  font-size: 12px;
}

.wcag__checklist {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.wcag__check-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  padding: 8px;
  border-radius: var(--td-radius-small);
}

.wcag__check-item--pass {
  background: color-mix(in srgb, var(--td-success-color) 8%, transparent);
}

.wcag__check-item--warn {
  background: color-mix(in srgb, var(--td-warning-color) 12%, transparent);
}

.wcag__check-item--fail {
  background: color-mix(in srgb, var(--td-error-color) 10%, transparent);
}

.wcag__check-icon {
  font-weight: 700;
  width: 14px;
  text-align: center;
  flex-shrink: 0;
}

.wcag__check-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.45;
}

.wcag__check-theory {
  font-size: 11px;
  color: var(--td-text-color-placeholder);
}

.wcag__preview {
  margin-top: 16px;
  padding: 20px 16px;
  border-radius: var(--td-radius-medium);
  border: 1px solid var(--td-component-border);
  transition: background 0.15s, color 0.15s;
}

.wcag__preview-title {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 600;
}

.wcag__preview-body {
  margin: 0 0 12px;
  font-size: 14px;
  line-height: 1.5;
}

.wcag__preview-large {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
}
</style>
