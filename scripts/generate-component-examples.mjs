/**
 * 生成表单 / 数据展示 / 消息类组件示例页（一次性脚本）
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { formDemos } from './example-demos/form.mjs'
import { dataDemos } from './example-demos/data.mjs'
import { messageDemos } from './example-demos/message.mjs'
import { SIZE_DEMO_STYLE, mergeStyles } from './example-demos/shared.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const formDir = path.join(root, 'src/views/components/examples/form')
const dataDir = path.join(root, 'src/views/components/examples/data')
const messageDir = path.join(root, 'src/views/components/examples/message')

for (const dir of [formDir, dataDir, messageDir]) {
  fs.mkdirSync(dir, { recursive: true })
}

function pascalFromKebab(key) {
  return key
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')
}

function shell(apiKey, title, description, blocks) {
  const demoImport = `import ExamplePageShell from '../ExamplePageShell.vue'
import ExampleDemoBlock from '../../../../components/ExampleDemoBlock.vue'`

  const raw = (blocks.script || '').trim()
  const lines = raw ? raw.split('\n') : []
  const vueImports = lines.filter((l) => l.startsWith('import '))
  const body = lines.filter((l) => !l.startsWith('import '))
  const script = [demoImport, ...vueImports, ...body].filter(Boolean).join('\n')

  return `<script setup lang="ts">
${script}
</script>

<template>
  <ExamplePageShell
    api-key="${apiKey}"
    title="${title}"
    description="${description}"
  >
${blocks.template}
  </ExamplePageShell>
</template>

${mergeStyles(
    blocks.template.includes('demo-size-stack') ||
    blocks.template.includes('demo-size-label') ||
    blocks.template.includes('loading-size-item') ||
    blocks.template.includes('badge-block')
      ? SIZE_DEMO_STYLE
      : '',
    blocks.style,
  )}
`
}

const demos = {
  ...formDemos,
  ...dataDemos,
  ...messageDemos,
}

const catalog = {
  form: [
    ['auto-complete', 'AutoComplete 自动完成', '根据输入内容提示联想选项。'],
    ['cascader', 'Cascader 级联选择', '多级层级数据选择。'],
    ['checkbox', 'Checkbox 多选框', '从一组选项中选择一个或多个。'],
    ['color-picker', 'ColorPicker 颜色选择器', '选择或输入颜色值。'],
    ['date-picker', 'DatePicker 日期选择器', '选择日期或日期区间。'],
    ['form', 'Form 表单', '收集、校验与提交数据。'],
    ['input', 'Input 输入框', '单行文本输入。'],
    ['input-adornment', 'InputAdornment 输入装饰器', '为输入框添加前置/后置内容。'],
    ['input-number', 'InputNumber 数字输入框', '仅允许输入数字。'],
    ['radio', 'Radio 单选框', '从一组选项中仅选一项。'],
    ['rate', 'Rate 评分', '对事物进行打分。'],
    ['select', 'Select 选择器', '从下拉列表中选择。'],
    ['slider', 'Slider 滑块', '通过拖动选择数值或区间。'],
    ['switch', 'Switch 开关', '两种状态之间的切换。'],
    ['textarea', 'Textarea 多行文本', '多行文本输入。'],
    ['time-picker', 'TimePicker 时间选择器', '选择时间点或时间段。'],
    ['transfer', 'Transfer 穿梭框', '在两栏之间移动选项。'],
    ['tree-select', 'TreeSelect 树选择', '树形结构数据选择。'],
    ['upload', 'Upload 上传', '上传文件或图片。'],
  ],
  data: [
    ['avatar', 'Avatar 头像', '展示用户或实体头像。'],
    ['badge', 'Badge 徽标', '在元素上显示数字或状态。'],
    ['calendar', 'Calendar 日历', '按日历视图展示日期。'],
    ['card', 'Card 卡片', '承载信息的容器。'],
    ['collapse', 'Collapse 折叠面板', '可折叠/展开的内容区域。'],
    ['comment', 'Comment 评论', '展示用户评论与回复。'],
    ['image', 'Image 图片', '图片展示与占位。'],
    ['list', 'List 列表', '垂直排列的数据列表。'],
    ['progress', 'Progress 进度条', '展示任务或加载进度。'],
    ['qrcode', 'QRCode 二维码', '将信息编码为二维码。'],
    ['range-input', 'RangeInput 范围输入', '输入数值区间。'],
    ['select-input', 'SelectInput 筛选输入', '下拉选择与输入组合。'],
    ['skeleton', 'Skeleton 骨架屏', '加载中的占位图形。'],
    ['statistic', 'Statistic 统计数值', '突出展示统计数字。'],
    ['table', 'Table 表格', '行列形式展示结构化数据。'],
    ['tag', 'Tag 标签', '标记和分类。'],
    ['tag-input', 'TagInput 标签输入', '输入并展示多个标签。'],
    ['timeline', 'Timeline 时间轴', '按时间顺序展示事件。'],
    ['tooltip', 'Tooltip 文字提示', '悬浮时展示说明文字。'],
    ['tree', 'Tree 树', '树形层级数据展示。'],
    ['watermark', 'Watermark 水印', '在页面上添加水印。'],
    ['back-top', 'BackTop 回到顶部', '快速返回页面顶部。'],
    ['descriptions', 'Descriptions 描述列表', '成组展示字段名与字段值。'],
  ],
  message: [
    ['alert', 'Alert 警告条', '静态展示重要提示信息。'],
    ['dialog', 'Dialog 对话框', '模态对话框，需用户处理。'],
    ['drawer', 'Drawer 抽屉', '从屏幕边缘滑出的面板。'],
    ['loading', 'Loading 加载', '页面或区域的加载状态。'],
    ['message', 'Message 消息提示', '全局轻量级反馈。'],
    ['notification', 'Notification 通知', '系统级通知提醒。'],
    ['popconfirm', 'Popconfirm 气泡确认', '点击元素弹出确认框。'],
    ['popup', 'Popup 弹出层', '弹出层基础能力。'],
  ],
}

let count = 0
for (const [subdir, items] of Object.entries(catalog)) {
  const dir = subdir === 'form' ? formDir : subdir === 'data' ? dataDir : messageDir
  for (const [id, title, desc] of items) {
    const d = demos[id]
    if (!d) {
      console.warn('missing demo', id)
      continue
    }
    const file = path.join(dir, `${pascalFromKebab(id)}Example.vue`)
    fs.writeFileSync(file, shell(id, title, desc, d))
    count++
  }
}
console.log(`Generated ${count} example files`)
