import { block, sizeBlockVertical, SIZE_DEMO_STYLE, mergeStyles } from './shared.mjs'

export const formDemos = {
  'auto-complete': {
    script: `import { ref } from 'vue'
const value = ref('')
const value2 = ref('')
const options = ['Vue', 'React', 'Angular', 'Svelte', 'Solid', 'Next.js'].map((v) => ({ label: v, value: v }))`,
    template:
      block('基础用法', '输入时联想匹配。', `      <t-auto-complete v-model="value" :options="options" placeholder="请输入框架名称" style="width: 320px" />`) +
      sizeBlockVertical([
        { label: 'small', lines: '<t-auto-complete v-model="value2" :options="options" size="small" placeholder="small" style="width: 320px" />' },
        { label: 'medium', lines: '<t-auto-complete v-model="value2" :options="options" size="medium" placeholder="medium" style="width: 320px" />' },
        { label: 'large', lines: '<t-auto-complete v-model="value2" :options="options" size="large" placeholder="large" style="width: 320px" />' },
      ]) +
      block('禁用状态', '', `      <t-auto-complete v-model="value" :options="options" disabled placeholder="禁用" style="width: 320px" />`) +
      block('清空', '', `      <t-auto-complete v-model="value" :options="options" clearable placeholder="可清空" style="width: 320px" />`) +
      block('自定义过滤', 'filterable 开启本地过滤。', `      <t-auto-complete v-model="value" :options="options" filterable placeholder="输入过滤" style="width: 320px" />`) +
      block('无边框', '', `      <t-auto-complete v-model="value" :options="options" borderless placeholder="无边框" style="width: 320px" />`),
  },

  cascader: {
    script: `import { ref } from 'vue'
const value = ref([])
const value2 = ref([])
const options = [
  { label: '广东', value: 'gd', children: [{ label: '深圳', value: 'sz' }, { label: '广州', value: 'gz' }] },
  { label: '湖南', value: 'hn', children: [{ label: '长沙', value: 'cs' }] },
]`,
    template:
      block('基础用法', '', `      <t-cascader v-model="value" :options="options" clearable placeholder="请选择" style="width: 320px" />`) +
      sizeBlockVertical([
        { label: 'small', lines: '<t-cascader v-model="value2" :options="options" size="small" placeholder="small" style="width: 320px" />' },
        { label: 'medium', lines: '<t-cascader v-model="value2" :options="options" size="medium" placeholder="medium" style="width: 320px" />' },
        { label: 'large', lines: '<t-cascader v-model="value2" :options="options" size="large" placeholder="large" style="width: 320px" />' },
      ]) +
      block('多选', '', `      <t-cascader v-model="value" :options="options" multiple placeholder="多选" style="width: 320px" />`) +
      block('禁用', '', `      <t-cascader v-model="value" :options="options" disabled placeholder="禁用" style="width: 320px" />`) +
      block('仅显示最后一级', '', `      <t-cascader v-model="value" :options="options" :show-all-levels="false" placeholder="仅最后一级" style="width: 320px" />`) +
      block('可搜索', '', `      <t-cascader v-model="value" :options="options" filterable placeholder="可搜索" style="width: 320px" />`),
  },

  checkbox: {
    script: `import { ref } from 'vue'
const checked = ref(['a'])
const checkAll = ref(false)
const indeterminate = ref(true)
const options = [
  { label: '选项 A', value: 'a' },
  { label: '选项 B', value: 'b' },
  { label: '选项 C', value: 'c' },
]`,
    template:
      block('基础用法', '', `      <t-checkbox-group v-model="checked" :options="options" />`) +
      sizeBlockVertical([
        { label: 'small', lines: '<t-checkbox-group v-model="checked" :options="options" size="small" />' },
        { label: 'medium', lines: '<t-checkbox-group v-model="checked" :options="options" size="medium" />' },
        { label: 'large', lines: '<t-checkbox-group v-model="checked" :options="options" size="large" />' },
      ]) +
      block('全选', '', `      <t-space direction="vertical">
        <t-checkbox v-model="checkAll" :indeterminate="indeterminate">全选</t-checkbox>
        <t-checkbox-group v-model="checked" :options="options" />
      </t-space>`) +
      block('禁用', '', `      <t-checkbox-group v-model="checked" :options="options" disabled />`) +
      block('单个复选框', '', `      <t-space>
        <t-checkbox>未选中</t-checkbox>
        <t-checkbox :checked="true">选中</t-checkbox>
        <t-checkbox disabled>禁用</t-checkbox>
        <t-checkbox disabled :checked="true">禁用选中</t-checkbox>
      </t-space>`) +
      block('最大可选数', '', `      <t-checkbox-group v-model="checked" :options="options" :max="2" />`),
  },

  'color-picker': {
    script: `import { ref } from 'vue'
const color = ref('#0052D9')
const color2 = ref('#E34D59')`,
    template:
      block('基础用法', '', `      <t-color-picker v-model="color" format="HEX" />
      <span class="demo-muted">当前：{{ color }}</span>`) +
      block('多种格式', '', `      <t-space>
        <t-color-picker v-model="color2" format="HEX" />
        <t-color-picker v-model="color2" format="RGB" />
        <t-color-picker v-model="color2" format="HSB" />
      </t-space>`) +
      block('禁用', '', `      <t-color-picker v-model="color" disabled />`) +
      block('无边框', '', `      <t-color-picker v-model="color" borderless />`) +
      sizeBlockVertical([
        { label: 'small', lines: '<t-color-picker v-model="color" size="small" />' },
        { label: 'medium', lines: '<t-color-picker v-model="color" size="medium" />' },
        { label: 'large', lines: '<t-color-picker v-model="color" size="large" />' },
      ]) +
      block('最近使用颜色', '', `      <t-color-picker v-model="color" :recent-colors="['#0052D9', '#E34D59', '#00A870']" />`),
    style: `<style scoped>
.demo-muted { margin-left: 12px; font-size: 13px; color: var(--td-text-color-secondary); }
</style>`,
  },

  'date-picker': {
    script: `import { ref } from 'vue'
const date = ref('')
const range = ref([])
const month = ref('')
const week = ref('')`,
    template:
      block('基础用法', '选择单个日期。', `      <t-date-picker v-model="date" placeholder="选择日期" style="width: 240px" />`) +
      block('日期区间', '', `      <t-date-range-picker v-model="range" style="width: 360px" />`) +
      sizeBlockVertical([
        { label: 'small', lines: '<t-date-picker v-model="date" size="small" placeholder="small" style="width: 240px" />' },
        { label: 'medium', lines: '<t-date-picker v-model="date" size="medium" placeholder="medium" style="width: 240px" />' },
        { label: 'large', lines: '<t-date-picker v-model="date" size="large" placeholder="large" style="width: 240px" />' },
      ]) +
      block('禁用', '', `      <t-date-picker v-model="date" disabled placeholder="禁用" style="width: 240px" />`) +
      block('月份选择', '', `      <t-date-picker v-model="month" mode="month" placeholder="选择月份" style="width: 240px" />`) +
      block('周选择', '', `      <t-date-picker v-model="week" mode="week" placeholder="选择周" style="width: 240px" />`) +
      block('带时间', '', `      <t-date-picker v-model="date" enable-time-picker placeholder="日期+时间" style="width: 280px" />`),
  },

  form: {
    script: `import { ref } from 'vue'
import type { FormProps } from 'tdesign-vue-next'
const formData = ref({ name: '', email: '', agree: false })
const formSize = ref<'medium' | 'large'>('medium')
const rules: FormProps['rules'] = {
  name: [{ required: true, message: '请输入姓名' }],
  email: [{ required: true, message: '请输入邮箱' }, { email: true, message: '邮箱格式不正确' }],
}
function onSubmit({ validateResult }: { validateResult: boolean }) {
  if (validateResult) console.log('submit', formData.value)
}
function onReset() {
  formData.value = { name: '', email: '', agree: false }
}`,
    template:
      block('基础用法', '收集、校验与提交。', `      <t-form :data="formData" :rules="rules" label-width="80px" @submit="onSubmit" @reset="onReset">
        <t-form-item label="姓名" name="name">
          <t-input v-model="formData.name" placeholder="请输入" />
        </t-form-item>
        <t-form-item label="邮箱" name="email">
          <t-input v-model="formData.email" placeholder="请输入邮箱" />
        </t-form-item>
        <t-form-item>
          <t-space>
            <t-button theme="primary" type="submit">提交</t-button>
            <t-button type="reset" variant="outline">重置</t-button>
          </t-space>
        </t-form-item>
      </t-form>`) +
      block('尺寸 size', 'Form 支持 medium / large，内部输入类控件尺寸随表单统一。', `      <t-radio-group v-model="formSize" variant="default-filled">
        <t-radio-button value="medium">Medium</t-radio-button>
        <t-radio-button value="large">Large</t-radio-button>
      </t-radio-group>
      <t-form :data="formData" :size="formSize" :rules="rules" label-width="80px" style="margin-top: 16px">
        <t-form-item label="姓名" name="name"><t-input v-model="formData.name" placeholder="请输入" /></t-form-item>
        <t-form-item label="邮箱" name="email"><t-input v-model="formData.email" placeholder="请输入邮箱" /></t-form-item>
        <t-form-item label="接收通知" name="agree"><t-switch v-model="formData.agree" /></t-form-item>
      </t-form>`) +
      block('布局方向', '', `      <t-form :data="formData" layout="inline" label-width="60px">
        <t-form-item label="姓名" name="name"><t-input v-model="formData.name" /></t-form-item>
        <t-form-item label="邮箱" name="email"><t-input v-model="formData.email" /></t-form-item>
        <t-form-item><t-button theme="primary">查询</t-button></t-form-item>
      </t-form>`) +
      block('必填标记', '', `      <t-form :data="formData" :rules="rules" label-width="80px" required-mark>
        <t-form-item label="姓名" name="name"><t-input v-model="formData.name" /></t-form-item>
      </t-form>`) +
      block('标签对齐', '', `      <t-form :data="formData" label-align="top" label-width="80px">
        <t-form-item label="姓名"><t-input v-model="formData.name" /></t-form-item>
        <t-form-item label="邮箱"><t-input v-model="formData.email" /></t-form-item>
      </t-form>`) +
      block('禁用表单', '', `      <t-form :data="formData" disabled label-width="80px">
        <t-form-item label="姓名"><t-input v-model="formData.name" /></t-form-item>
        <t-form-item label="邮箱"><t-input v-model="formData.email" /></t-form-item>
      </t-form>`) +
      block('校验状态', '', `      <t-form :data="formData" :rules="rules" label-width="80px" status-icon>
        <t-form-item label="姓名" name="name"><t-input v-model="formData.name" /></t-form-item>
        <t-form-item label="邮箱" name="email"><t-input v-model="formData.email" /></t-form-item>
      </t-form>`),
  },

  input: {
    script: `import { ref } from 'vue'
const value = ref('')
const pwd = ref('')`,
    template:
      block('基础用法', '', `      <t-input v-model="value" placeholder="请输入内容" clearable style="width: 320px" />`) +
      sizeBlockVertical([
        { label: 'small', lines: '<t-input v-model="value" size="small" placeholder="small" style="width: 320px" />' },
        { label: 'medium', lines: '<t-input v-model="value" size="medium" placeholder="medium" style="width: 320px" />' },
        { label: 'large', lines: '<t-input v-model="value" size="large" placeholder="large" style="width: 320px" />' },
      ]) +
      block('密码输入', '', `      <t-input v-model="pwd" type="password" placeholder="请输入密码" style="width: 320px" />`) +
      block('禁用与只读', '', `      <t-space direction="vertical">
        <t-input value="禁用状态" disabled style="width: 320px" />
        <t-input value="只读状态" readonly style="width: 320px" />
      </t-space>`) +
      block('状态 status', '', `      <t-space direction="vertical">
        <t-input v-model="value" status="success" tips="校验通过" style="width: 320px" />
        <t-input v-model="value" status="warning" tips="格式警告" style="width: 320px" />
        <t-input v-model="value" status="error" tips="格式错误" style="width: 320px" />
      </t-space>`) +
      block('字数限制', '', `      <t-input v-model="value" :maxlength="20" show-limit-number placeholder="最多 20 字" style="width: 320px" />`) +
      block('无边框', '', `      <t-input v-model="value" borderless placeholder="无边框" style="width: 320px" />`) +
      block('前缀后缀', '', `      <t-input v-model="value" placeholder="搜索" style="width: 320px">
        <template #prefix-icon><t-icon name="search" /></template>
        <template #suffix-icon><t-icon name="close-circle-filled" /></template>
      </t-input>`),
  },

  'input-adornment': {
    template:
      block('基础用法', '前置/后置装饰。', `      <t-space direction="vertical">
        <t-input-adornment prepend="https://">
          <t-input placeholder="请输入域名" style="width: 280px" />
        </t-input-adornment>
        <t-input-adornment append=".com">
          <t-input placeholder="请输入" style="width: 280px" />
        </t-input-adornment>
      </t-space>`) +
      block('前后同时', '', `      <t-input-adornment prepend="¥" append="元">
        <t-input placeholder="金额" style="width: 200px" />
      </t-input-adornment>`) +
      block('下拉前置', '', `      <t-input-adornment>
        <template #prepend><t-select :options="[{ label: '+86', value: '86' }]" default-value="86" style="width: 80px" /></template>
        <t-input placeholder="手机号" style="width: 200px" />
      </t-input-adornment>`) +
      block('按钮后置', '', `      <t-input-adornment append="搜索">
        <t-input placeholder="关键词" style="width: 240px" />
        <template #append><t-button theme="primary">搜索</t-button></template>
      </t-input-adornment>`) +
      sizeBlockVertical([
        { label: 'small', lines: '<t-input-adornment prepend="https://" append=".com"><t-input size="small" placeholder="small" style="width: 280px" /></t-input-adornment>' },
        { label: 'medium', lines: '<t-input-adornment prepend="https://" append=".com"><t-input size="medium" placeholder="medium" style="width: 280px" /></t-input-adornment>' },
        { label: 'large', lines: '<t-input-adornment prepend="https://" append=".com"><t-input size="large" placeholder="large" style="width: 280px" /></t-input-adornment>' },
      ], '尺寸由内部 Input 的 size 控制。'),
  },

  'input-number': {
    script: `import { ref } from 'vue'
const num = ref(3)
const num2 = ref(10)`,
    template:
      block('基础用法', '', `      <t-input-number v-model="num" :min="0" :max="10" theme="column" />`) +
      sizeBlockVertical([
        { label: 'small', lines: '<t-input-number v-model="num2" size="small" />' },
        { label: 'medium', lines: '<t-input-number v-model="num2" size="medium" />' },
        { label: 'large', lines: '<t-input-number v-model="num2" size="large" />' },
      ]) +
      block('主题 theme', '', `      <t-space>
        <t-input-number v-model="num" theme="normal" />
        <t-input-number v-model="num" theme="column" />
        <t-input-number v-model="num" theme="row" />
      </t-space>`) +
      block('禁用', '', `      <t-input-number v-model="num" disabled />`) +
      block('步长与精度', '', `      <t-input-number v-model="num2" :step="0.5" :decimal-places="1" :min="0" :max="100" />`) +
      block('无边框', '', `      <t-input-number v-model="num" borderless />`),
  },

  radio: {
    script: `import { ref } from 'vue'
const value = ref('a')
const value2 = ref('b')`,
    template:
      block('基础用法', '', `      <t-radio-group v-model="value">
        <t-radio value="a">选项 A</t-radio>
        <t-radio value="b">选项 B</t-radio>
        <t-radio value="c">选项 C</t-radio>
      </t-radio-group>`) +
      sizeBlockVertical([
        { label: 'small', lines: '<t-radio-group v-model="value2" size="small"><t-radio value="a">Small</t-radio><t-radio value="b">Small B</t-radio></t-radio-group>' },
        { label: 'medium', lines: '<t-radio-group v-model="value2" size="medium"><t-radio value="a">Medium</t-radio><t-radio value="b">Medium B</t-radio></t-radio-group>' },
        { label: 'large', lines: '<t-radio-group v-model="value2" size="large"><t-radio value="a">Large</t-radio><t-radio value="b">Large B</t-radio></t-radio-group>' },
      ]) +
      block('禁用', '', `      <t-radio-group v-model="value">
        <t-radio value="a">正常</t-radio>
        <t-radio value="b" disabled>禁用未选</t-radio>
        <t-radio value="c" disabled>禁用已选</t-radio>
      </t-radio-group>`) +
      block('按钮样式', '', `      <t-radio-group v-model="value" variant="primary-filled">
        <t-radio-button value="a">选项 A</t-radio-button>
        <t-radio-button value="b">选项 B</t-radio-button>
        <t-radio-button value="c">选项 C</t-radio-button>
      </t-radio-group>`) +
      block('允许取消', '', `      <t-radio-group v-model="value" allow-uncheck>
        <t-radio value="a">可取消 A</t-radio>
        <t-radio value="b">可取消 B</t-radio>
      </t-radio-group>`),
  },

  rate: {
    script: `import { ref } from 'vue'
const value = ref(3)
const value2 = ref(2.5)`,
    template:
      block('基础用法', '', `      <t-rate v-model="value" />`) +
      block('半星', '', `      <t-rate v-model="value2" allow-half />`) +
      sizeBlockVertical([
        { label: 'small', lines: '<t-rate v-model="value" size="small" />' },
        { label: 'medium', lines: '<t-rate v-model="value" size="medium" />' },
        { label: 'large', lines: '<t-rate v-model="value" size="large" />' },
      ]) +
      block('禁用', '', `      <t-rate v-model="value" disabled />`) +
      block('自定义数量', '', `      <t-rate v-model="value" :count="10" />`) +
      block('带文字', '', `      <t-rate v-model="value" show-text />`) +
      block('自定义颜色', '', `      <t-rate v-model="value" color="#E34D59" />`),
  },

  select: {
    script: `import { ref } from 'vue'
const value = ref('')
const multi = ref([])
const options = [
  { label: '选项一', value: '1' },
  { label: '选项二', value: '2' },
  { label: '选项三', value: '3' },
  { label: '选项四（禁用）', value: '4', disabled: true },
]`,
    template:
      block('基础用法', '', `      <t-select v-model="value" :options="options" placeholder="请选择" style="width: 240px" clearable />`) +
      sizeBlockVertical([
        { label: 'small', lines: '<t-select v-model="value" :options="options" size="small" placeholder="small" style="width: 240px" />' },
        { label: 'medium', lines: '<t-select v-model="value" :options="options" size="medium" placeholder="medium" style="width: 240px" />' },
        { label: 'large', lines: '<t-select v-model="value" :options="options" size="large" placeholder="large" style="width: 240px" />' },
      ]) +
      block('多选', '', `      <t-select v-model="multi" :options="options" multiple placeholder="多选" style="width: 280px" />`) +
      block('禁用', '', `      <t-select v-model="value" :options="options" disabled placeholder="禁用" style="width: 240px" />`) +
      block('可搜索', '', `      <t-select v-model="value" :options="options" filterable placeholder="可搜索" style="width: 240px" />`) +
      block('状态 status', '', `      <t-space direction="vertical">
        <t-select v-model="value" :options="options" status="success" tips="校验通过" style="width: 240px" />
        <t-select v-model="value" :options="options" status="error" tips="请选择" style="width: 240px" />
      </t-space>`) +
      block('无边框', '', `      <t-select v-model="value" :options="options" borderless placeholder="无边框" style="width: 240px" />`) +
      block('前缀图标', '', `      <t-select v-model="value" :options="options" placeholder="带前缀" style="width: 240px">
        <template #prefixIcon><t-icon name="browse" /></template>
      </t-select>`),
  },

  slider: {
    script: `import { ref } from 'vue'
const value = ref(30)
const range = ref([20, 60])
const vertical = ref(40)`,
    template:
      block('基础用法', '', `      <t-slider v-model="value" :marks="{ 0: '0', 100: '100' }" />`) +
      block('区间选择', '', `      <t-slider v-model="range" range />`) +
      block('禁用', '', `      <t-slider v-model="value" disabled />`) +
      block('步长', '', `      <t-slider v-model="value" :step="10" :marks="{ 0: '0', 50: '50', 100: '100' }" />`) +
      block('输入框模式', '', `      <t-slider v-model="value" :input-number-props="{ theme: 'column' }" />`) +
      block('垂直方向', '', `      <div style="height: 200px"><t-slider v-model="vertical" layout="vertical" /></div>`),
  },

  switch: {
    script: `import { ref } from 'vue'
const on = ref(true)`,
    template:
      block('基础用法', '', `      <t-switch v-model="on" />`) +
      sizeBlockVertical([
        { label: 'small', lines: '<t-switch v-model="on" size="small" />' },
        { label: 'medium', lines: '<t-switch v-model="on" size="medium" />' },
        { label: 'large', lines: '<t-switch v-model="on" size="large" />' },
      ]) +
      block('禁用', '', `      <t-space>
        <t-switch disabled />
        <t-switch disabled :value="true" />
      </t-space>`) +
      block('加载中', '', `      <t-switch v-model="on" loading />`) +
      block('自定义文字', '', `      <t-switch v-model="on" :label="['开', '关']" />`) +
      block('自定义颜色', '', `      <t-switch v-model="on" :custom-value="[true, false]" />`),
  },

  textarea: {
    script: `import { ref } from 'vue'
const text = ref('')
const text2 = ref('预设内容')`,
    template:
      block('基础用法', '', `      <t-textarea v-model="text" placeholder="请输入" :maxlength="200" style="width: 400px" />`) +
      sizeBlockVertical([
        { label: 'small', lines: '<t-textarea v-model="text" size="small" placeholder="small" style="width: 400px" />' },
        { label: 'medium', lines: '<t-textarea v-model="text" size="medium" placeholder="medium" style="width: 400px" />' },
        { label: 'large', lines: '<t-textarea v-model="text" size="large" placeholder="large" style="width: 400px" />' },
      ]) +
      block('禁用与只读', '', `      <t-space direction="vertical">
        <t-textarea v-model="text2" disabled style="width: 400px" />
        <t-textarea v-model="text2" readonly style="width: 400px" />
      </t-space>`) +
      block('字数统计', '', `      <t-textarea v-model="text" :maxlength="100" show-limit-number style="width: 400px" />`) +
      block('自动高度', '', `      <t-textarea v-model="text" autosize placeholder="高度随内容变化" style="width: 400px" />`) +
      block('状态 status', '', `      <t-textarea v-model="text" status="error" tips="内容不符合要求" style="width: 400px" />`),
  },

  'time-picker': {
    script: `import { ref } from 'vue'
const time = ref('12:00:00')
const range = ref([])`,
    template:
      block('基础用法', '', `      <t-time-picker v-model="time" style="width: 200px" />`) +
      sizeBlockVertical([
        { label: 'small', lines: '<t-time-picker v-model="time" size="small" style="width: 200px" />' },
        { label: 'medium', lines: '<t-time-picker v-model="time" size="medium" style="width: 200px" />' },
        { label: 'large', lines: '<t-time-picker v-model="time" size="large" style="width: 200px" />' },
      ]) +
      block('时间区间', '', `      <t-time-range-picker v-model="range" style="width: 280px" />`) +
      block('禁用', '', `      <t-time-picker v-model="time" disabled style="width: 200px" />`) +
      block('12 小时制', '', `      <t-time-picker v-model="time" format="hh:mm:ss A" style="width: 200px" />`) +
      block('步长', '', `      <t-time-picker v-model="time" :steps="[1, 5, 10]" style="width: 200px" />`),
  },

  transfer: {
    script: `import { ref } from 'vue'
const target = ref([])
const target2 = ref(['1'])
const data = Array.from({ length: 8 }, (_, i) => ({
  label: \`选项 \${i + 1}\`,
  value: String(i + 1),
  disabled: i === 3,
}))`,
    template:
      block('基础用法', '', `      <t-transfer v-model="target" :data="data" />`) +
      block('搜索', '', `      <t-transfer v-model="target" :data="data" search />`) +
      block('禁用', '', `      <t-transfer v-model="target2" :data="data" disabled />`) +
      block('自定义标题', '', `      <t-transfer v-model="target" :data="data" :titles="['待选', '已选']" />`) +
      block('分页', '', `      <t-transfer v-model="target" :data="Array.from({ length: 20 }, (_, i) => ({ label: \`项 \${i + 1}\`, value: String(i + 1) }))" pagination />`) +
      block('单向模式', '', `      <t-transfer v-model="target" :data="data" :target-draggable="true" />`),
  },

  'tree-select': {
    script: `import { ref } from 'vue'
const value = ref('')
const multi = ref([])
const data = [
  { label: '广东省', value: 'gd', children: [{ label: '深圳市', value: 'sz' }, { label: '广州市', value: 'gz' }] },
  { label: '湖南省', value: 'hn', children: [{ label: '长沙市', value: 'cs' }] },
]`,
    template:
      block('基础用法', '', `      <t-tree-select v-model="value" :data="data" placeholder="请选择" style="width: 280px" />`) +
      sizeBlockVertical([
        { label: 'small', lines: '<t-tree-select v-model="value" :data="data" size="small" placeholder="small" style="width: 280px" />' },
        { label: 'medium', lines: '<t-tree-select v-model="value" :data="data" size="medium" placeholder="medium" style="width: 280px" />' },
        { label: 'large', lines: '<t-tree-select v-model="value" :data="data" size="large" placeholder="large" style="width: 280px" />' },
      ]) +
      block('多选', '', `      <t-tree-select v-model="multi" :data="data" multiple placeholder="多选" style="width: 280px" />`) +
      block('禁用', '', `      <t-tree-select v-model="value" :data="data" disabled placeholder="禁用" style="width: 280px" />`) +
      block('可搜索', '', `      <t-tree-select v-model="value" :data="data" filterable placeholder="可搜索" style="width: 280px" />`) +
      block('可清空', '', `      <t-tree-select v-model="value" :data="data" clearable placeholder="可清空" style="width: 280px" />`),
  },

  upload: {
    script: `import { ref } from 'vue'
const files = ref([])`,
    template:
      block('基础上传', '', `      <t-upload action="https://httpbin.org/post" theme="file" />`) +
      block('图片上传', '', `      <t-upload action="https://httpbin.org/post" theme="image" accept="image/*" />`) +
      block('拖拽上传', '', `      <t-upload action="https://httpbin.org/post" theme="file-flow" draggable />`) +
      block('多文件', '', `      <t-upload v-model="files" action="https://httpbin.org/post" theme="file" multiple />`) +
      block('禁用', '', `      <t-upload action="https://httpbin.org/post" theme="file" disabled />`) +
      block('自定义触发', '', `      <t-upload action="https://httpbin.org/post" theme="custom">
        <t-button theme="primary"><template #icon><t-icon name="upload" /></template>上传文件</t-button>
      </t-upload>`) +
      block('图片卡片', '', `      <t-upload action="https://httpbin.org/post" theme="image-flow" accept="image/*" />`),
  },
}
