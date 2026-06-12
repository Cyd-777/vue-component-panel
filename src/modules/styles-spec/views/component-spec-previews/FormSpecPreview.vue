<script setup lang="ts">
import { ref } from 'vue'
import SpecDemoBlock from './SpecDemoBlock.vue'
import {
  cascaderOptions,
  checkboxOptions,
  selectOptions,
  transferData,
  transferDataPaged,
} from './shared'

defineProps<{ componentId: string }>()

const radioVal = ref('a')
const radioVal2 = ref('b')
const checked = ref(['a'])
const checkAll = ref(false)
const indeterminate = ref(true)
const inputVal = ref('')
const pwd = ref('')
const num = ref(3)
const num2 = ref(10)
const selectVal = ref('')
const multiSelect = ref<string[]>([])
const cascaderVal = ref<string[]>([])
const switchOn = ref(true)
const sliderVal = ref(30)
const sliderRange = ref([20, 60])
const sliderVertical = ref(40)
const date = ref('')
const dateRange = ref<string[]>([])
const month = ref('')
const rateVal = ref(3)
const rateHalf = ref(2.5)
const transferTarget = ref<string[]>([])
const transferTarget2 = ref(['1'])
</script>

<template>
  <div class="spec-preview">
    <template v-if="componentId === 'radio'">
      <SpecDemoBlock title="基础用法">
        <t-radio-group v-model="radioVal">
          <t-radio value="a">Option A</t-radio>
          <t-radio value="b">Option B</t-radio>
          <t-radio value="c">Option C</t-radio>
        </t-radio-group>
      </SpecDemoBlock>
      <SpecDemoBlock title="尺寸 size">
        <div class="spec-size-stack">
          <div class="spec-size-row">
            <span class="spec-size-label">small</span>
            <t-radio-group v-model="radioVal2" size="small">
              <t-radio value="a">Small A</t-radio>
              <t-radio value="b">Small B</t-radio>
            </t-radio-group>
          </div>
          <div class="spec-size-row">
            <span class="spec-size-label">medium</span>
            <t-radio-group v-model="radioVal2" size="medium">
              <t-radio value="a">Medium A</t-radio>
              <t-radio value="b">Medium B</t-radio>
            </t-radio-group>
          </div>
          <div class="spec-size-row">
            <span class="spec-size-label">large</span>
            <t-radio-group v-model="radioVal2" size="large">
              <t-radio value="a">Large A</t-radio>
              <t-radio value="b">Large B</t-radio>
            </t-radio-group>
          </div>
        </div>
      </SpecDemoBlock>
      <SpecDemoBlock title="禁用">
        <t-radio-group v-model="radioVal">
          <t-radio value="a">Normal</t-radio>
          <t-radio value="b" disabled>Disabled</t-radio>
          <t-radio value="c" disabled>Disabled checked</t-radio>
        </t-radio-group>
      </SpecDemoBlock>
      <SpecDemoBlock title="按钮样式">
        <t-radio-group v-model="radioVal" variant="primary-filled">
          <t-radio-button value="a">Option A</t-radio-button>
          <t-radio-button value="b">Option B</t-radio-button>
          <t-radio-button value="c">Option C</t-radio-button>
        </t-radio-group>
      </SpecDemoBlock>
      <SpecDemoBlock title="允许取消">
        <t-radio-group v-model="radioVal" allow-uncheck>
          <t-radio value="a">Uncheck A</t-radio>
          <t-radio value="b">Uncheck B</t-radio>
        </t-radio-group>
      </SpecDemoBlock>
    </template>

    <template v-else-if="componentId === 'checkbox'">
      <SpecDemoBlock title="基础用法">
        <t-checkbox-group v-model="checked" :options="checkboxOptions" />
      </SpecDemoBlock>
      <SpecDemoBlock title="尺寸 size">
        <div class="spec-size-stack">
          <div v-for="size in (['small', 'medium', 'large'] as const)" :key="size" class="spec-size-row">
            <span class="spec-size-label">{{ size }}</span>
            <t-checkbox-group v-model="checked" :options="checkboxOptions" :size="size" />
          </div>
        </div>
      </SpecDemoBlock>
      <SpecDemoBlock title="全选">
        <t-space direction="vertical">
          <t-checkbox v-model="checkAll" :indeterminate="indeterminate">Select all</t-checkbox>
          <t-checkbox-group v-model="checked" :options="checkboxOptions" />
        </t-space>
      </SpecDemoBlock>
      <SpecDemoBlock title="禁用">
        <t-checkbox-group v-model="checked" :options="checkboxOptions" disabled />
      </SpecDemoBlock>
      <SpecDemoBlock title="单个复选框">
        <t-space>
          <t-checkbox>Unchecked</t-checkbox>
          <t-checkbox :checked="true">Checked</t-checkbox>
          <t-checkbox disabled>Disabled</t-checkbox>
          <t-checkbox disabled :checked="true">Disabled checked</t-checkbox>
        </t-space>
      </SpecDemoBlock>
      <SpecDemoBlock title="最大可选数">
        <t-checkbox-group v-model="checked" :options="checkboxOptions" :max="2" />
      </SpecDemoBlock>
    </template>

    <template v-else-if="componentId === 'input'">
      <SpecDemoBlock title="基础用法">
        <t-input v-model="inputVal" placeholder="Placeholder" clearable class="spec-field" />
      </SpecDemoBlock>
      <SpecDemoBlock title="尺寸 size">
        <div class="spec-size-stack">
          <div v-for="size in (['small', 'medium', 'large'] as const)" :key="size" class="spec-size-row">
            <span class="spec-size-label">{{ size }}</span>
            <t-input v-model="inputVal" :size="size" :placeholder="size" class="spec-field" />
          </div>
        </div>
      </SpecDemoBlock>
      <SpecDemoBlock title="密码输入">
        <t-input v-model="pwd" type="password" placeholder="Password" class="spec-field" />
      </SpecDemoBlock>
      <SpecDemoBlock title="禁用与只读">
        <t-input value="Disabled" disabled class="spec-field" />
        <t-input value="Readonly" readonly class="spec-field" />
      </SpecDemoBlock>
      <SpecDemoBlock title="状态 status">
        <t-input v-model="inputVal" status="success" tips="Success" class="spec-field" />
        <t-input v-model="inputVal" status="warning" tips="Warning" class="spec-field" />
        <t-input v-model="inputVal" status="error" tips="Error message" class="spec-field" />
      </SpecDemoBlock>
      <SpecDemoBlock title="字数限制">
        <t-input v-model="inputVal" :maxlength="20" show-limit-number placeholder="Max 20" class="spec-field" />
      </SpecDemoBlock>
      <SpecDemoBlock title="无边框">
        <t-input v-model="inputVal" borderless placeholder="Borderless" class="spec-field" />
      </SpecDemoBlock>
      <SpecDemoBlock title="前缀后缀">
        <t-input v-model="inputVal" placeholder="Search" class="spec-field">
          <template #prefix-icon><t-icon name="search" /></template>
          <template #suffix-icon><t-icon name="close-circle-filled" /></template>
        </t-input>
      </SpecDemoBlock>
    </template>

    <template v-else-if="componentId === 'input-number'">
      <SpecDemoBlock title="基础用法">
        <t-input-number v-model="num" :min="0" :max="10" theme="column" />
      </SpecDemoBlock>
      <SpecDemoBlock title="尺寸 size">
        <t-space>
          <t-input-number v-model="num2" size="small" />
          <t-input-number v-model="num2" size="medium" />
          <t-input-number v-model="num2" size="large" />
        </t-space>
      </SpecDemoBlock>
      <SpecDemoBlock title="主题 theme">
        <t-space>
          <t-input-number v-model="num" theme="normal" />
          <t-input-number v-model="num" theme="column" />
          <t-input-number v-model="num" theme="row" />
        </t-space>
      </SpecDemoBlock>
      <SpecDemoBlock title="禁用">
        <t-input-number v-model="num" disabled />
      </SpecDemoBlock>
      <SpecDemoBlock title="步长与精度">
        <t-input-number v-model="num2" :step="0.5" :decimal-places="1" :min="0" :max="100" />
      </SpecDemoBlock>
      <SpecDemoBlock title="无边框">
        <t-input-number v-model="num" borderless />
      </SpecDemoBlock>
    </template>

    <template v-else-if="componentId === 'select'">
      <SpecDemoBlock title="基础用法">
        <t-select v-model="selectVal" :options="selectOptions" placeholder="Select" clearable class="spec-field-sm" />
      </SpecDemoBlock>
      <SpecDemoBlock title="尺寸 size">
        <div class="spec-size-stack">
          <div v-for="size in (['small', 'medium', 'large'] as const)" :key="size" class="spec-size-row">
            <span class="spec-size-label">{{ size }}</span>
            <t-select v-model="selectVal" :options="selectOptions" :size="size" :placeholder="size" class="spec-field-sm" />
          </div>
        </div>
      </SpecDemoBlock>
      <SpecDemoBlock title="多选">
        <t-select v-model="multiSelect" :options="selectOptions" multiple placeholder="Multiple" class="spec-field-md" />
      </SpecDemoBlock>
      <SpecDemoBlock title="禁用">
        <t-select v-model="selectVal" :options="selectOptions" disabled placeholder="Disabled" class="spec-field-sm" />
      </SpecDemoBlock>
      <SpecDemoBlock title="可搜索">
        <t-select v-model="selectVal" :options="selectOptions" filterable placeholder="Filterable" class="spec-field-sm" />
      </SpecDemoBlock>
      <SpecDemoBlock title="状态 status">
        <t-select v-model="selectVal" :options="selectOptions" status="success" tips="Success" class="spec-field-sm" />
        <t-select v-model="selectVal" :options="selectOptions" status="error" tips="Required" class="spec-field-sm" />
      </SpecDemoBlock>
      <SpecDemoBlock title="无边框">
        <t-select v-model="selectVal" :options="selectOptions" borderless placeholder="Borderless" class="spec-field-sm" />
      </SpecDemoBlock>
    </template>

    <template v-else-if="componentId === 'cascader'">
      <SpecDemoBlock title="基础用法">
        <t-cascader v-model="cascaderVal" :options="cascaderOptions" clearable placeholder="Select" class="spec-field-md" />
      </SpecDemoBlock>
      <SpecDemoBlock title="尺寸 size">
        <div class="spec-size-stack">
          <div v-for="size in (['small', 'medium', 'large'] as const)" :key="size" class="spec-size-row">
            <span class="spec-size-label">{{ size }}</span>
            <t-cascader v-model="cascaderVal" :options="cascaderOptions" :size="size" :placeholder="size" class="spec-field-md" />
          </div>
        </div>
      </SpecDemoBlock>
      <SpecDemoBlock title="多选">
        <t-cascader v-model="cascaderVal" :options="cascaderOptions" multiple placeholder="Multiple" class="spec-field-md" />
      </SpecDemoBlock>
      <SpecDemoBlock title="禁用">
        <t-cascader v-model="cascaderVal" :options="cascaderOptions" disabled placeholder="Disabled" class="spec-field-md" />
      </SpecDemoBlock>
      <SpecDemoBlock title="仅显示最后一级">
        <t-cascader v-model="cascaderVal" :options="cascaderOptions" :show-all-levels="false" placeholder="Last level" class="spec-field-md" />
      </SpecDemoBlock>
      <SpecDemoBlock title="可搜索">
        <t-cascader v-model="cascaderVal" :options="cascaderOptions" filterable placeholder="Filterable" class="spec-field-md" />
      </SpecDemoBlock>
    </template>

    <template v-else-if="componentId === 'switch'">
      <SpecDemoBlock title="基础用法">
        <t-switch v-model="switchOn" />
      </SpecDemoBlock>
      <SpecDemoBlock title="尺寸 size">
        <t-space>
          <t-switch v-model="switchOn" size="small" />
          <t-switch v-model="switchOn" size="medium" />
          <t-switch v-model="switchOn" size="large" />
        </t-space>
      </SpecDemoBlock>
      <SpecDemoBlock title="禁用">
        <t-space>
          <t-switch disabled />
          <t-switch disabled :value="true" />
        </t-space>
      </SpecDemoBlock>
      <SpecDemoBlock title="加载中">
        <t-switch v-model="switchOn" loading />
      </SpecDemoBlock>
      <SpecDemoBlock title="自定义文字">
        <t-switch v-model="switchOn" :label="['On', 'Off']" />
      </SpecDemoBlock>
    </template>

    <template v-else-if="componentId === 'slider'">
      <SpecDemoBlock title="基础用法">
        <t-slider v-model="sliderVal" :marks="{ 0: '0', 100: '100' }" />
      </SpecDemoBlock>
      <SpecDemoBlock title="区间选择">
        <t-slider v-model="sliderRange" range />
      </SpecDemoBlock>
      <SpecDemoBlock title="禁用">
        <t-slider v-model="sliderVal" disabled />
      </SpecDemoBlock>
      <SpecDemoBlock title="步长">
        <t-slider v-model="sliderVal" :step="10" :marks="{ 0: '0', 50: '50', 100: '100' }" />
      </SpecDemoBlock>
      <SpecDemoBlock title="输入框模式">
        <t-slider v-model="sliderVal" :input-number-props="{ theme: 'column' }" />
      </SpecDemoBlock>
      <SpecDemoBlock title="垂直方向">
        <div class="spec-slider-vertical">
          <t-slider v-model="sliderVertical" layout="vertical" />
        </div>
      </SpecDemoBlock>
    </template>

    <template v-else-if="componentId === 'date-picker'">
      <SpecDemoBlock title="基础用法">
        <t-date-picker v-model="date" placeholder="Select date" class="spec-field-xs" />
      </SpecDemoBlock>
      <SpecDemoBlock title="日期区间">
        <t-date-range-picker v-model="dateRange" class="spec-field-lg" />
      </SpecDemoBlock>
      <SpecDemoBlock title="尺寸 size">
        <div class="spec-size-stack">
          <div v-for="size in (['small', 'medium', 'large'] as const)" :key="size" class="spec-size-row">
            <span class="spec-size-label">{{ size }}</span>
            <t-date-picker v-model="date" :size="size" :placeholder="size" class="spec-field-xs" />
          </div>
        </div>
      </SpecDemoBlock>
      <SpecDemoBlock title="禁用">
        <t-date-picker v-model="date" disabled placeholder="Disabled" class="spec-field-xs" />
      </SpecDemoBlock>
      <SpecDemoBlock title="月份选择">
        <t-date-picker v-model="month" mode="month" placeholder="Month" class="spec-field-xs" />
      </SpecDemoBlock>
      <SpecDemoBlock title="带时间">
        <t-date-picker v-model="date" enable-time-picker placeholder="Date + time" class="spec-field-sm" />
      </SpecDemoBlock>
    </template>

    <template v-else-if="componentId === 'rate'">
      <SpecDemoBlock title="基础用法">
        <t-rate v-model="rateVal" />
      </SpecDemoBlock>
      <SpecDemoBlock title="半星">
        <t-rate v-model="rateHalf" allow-half />
      </SpecDemoBlock>
      <SpecDemoBlock title="尺寸 size">
        <t-space>
          <t-rate v-model="rateVal" size="small" />
          <t-rate v-model="rateVal" size="medium" />
          <t-rate v-model="rateVal" size="large" />
        </t-space>
      </SpecDemoBlock>
      <SpecDemoBlock title="禁用">
        <t-rate v-model="rateVal" disabled />
      </SpecDemoBlock>
      <SpecDemoBlock title="自定义数量">
        <t-rate v-model="rateVal" :count="10" />
      </SpecDemoBlock>
      <SpecDemoBlock title="带文字">
        <t-rate v-model="rateVal" show-text />
      </SpecDemoBlock>
    </template>

    <template v-else-if="componentId === 'transfer'">
      <SpecDemoBlock title="基础用法">
        <t-transfer v-model="transferTarget" :data="transferData" />
      </SpecDemoBlock>
      <SpecDemoBlock title="搜索">
        <t-transfer v-model="transferTarget" :data="transferData" search />
      </SpecDemoBlock>
      <SpecDemoBlock title="禁用">
        <t-transfer v-model="transferTarget2" :data="transferData" disabled />
      </SpecDemoBlock>
      <SpecDemoBlock title="自定义标题">
        <t-transfer v-model="transferTarget" :data="transferData" :titles="['Source', 'Target']" />
      </SpecDemoBlock>
      <SpecDemoBlock title="分页">
        <t-transfer v-model="transferTarget" :data="transferDataPaged" pagination />
      </SpecDemoBlock>
      <SpecDemoBlock title="目标可拖拽">
        <t-transfer v-model="transferTarget" :data="transferData" :target-draggable="true" />
      </SpecDemoBlock>
    </template>
  </div>
</template>

<style scoped>
@import './spec-preview-styles.css';
</style>
