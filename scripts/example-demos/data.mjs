import { block, sizeBlockVertical } from './shared.mjs'

export const dataDemos = {
  avatar: {
    template:
      block('基础用法', '', `      <t-space>
        <t-avatar>U</t-avatar>
        <t-avatar image="https://tdesign.gtimg.com/site/avatar.jpg" />
        <t-avatar icon="user" />
      </t-space>`) +
      sizeBlockVertical([
        { label: 'small', lines: '<t-avatar size="small">S</t-avatar>' },
        { label: 'medium', lines: '<t-avatar size="medium">M</t-avatar>' },
        { label: 'large', lines: '<t-avatar size="large">L</t-avatar>' },
      ]) +
      block('形状 shape', '', `      <t-space>
        <t-avatar shape="circle">圆</t-avatar>
        <t-avatar shape="round">圆角</t-avatar>
      </t-space>`) +
      block('头像组', '', `      <t-avatar-group cascading="left-up" :max="3">
        <t-avatar image="https://tdesign.gtimg.com/site/avatar.jpg" />
        <t-avatar>A</t-avatar>
        <t-avatar>B</t-avatar>
        <t-avatar>C</t-avatar>
      </t-avatar-group>`) +
      block('自定义内容', '', `      <t-avatar style="background: var(--td-brand-color)"><t-icon name="user" /></t-avatar>`),
  },

  badge: {
    template:
      block('基础用法', '', `      <t-badge count="8"><t-button variant="outline">消息</t-button></t-badge>`) +
      block('红点 dot', '', `      <t-badge dot><t-button variant="outline">通知</t-button></t-badge>`) +
      sizeBlockVertical([
        { label: '默认', lines: '<t-badge count="99"><div class="badge-block" /></t-badge>' },
        { label: 'small', lines: '<t-badge count="99" size="small"><div class="badge-block" /></t-badge>' },
      ], '徽标数字区域尺寸：默认与 small。') +
      block('最大值', '', `      <t-badge count="120" :max-count="99"><t-button variant="outline">99+</t-button></t-badge>`) +
      block('偏移 offset', '', `      <t-badge count="2" :offset="[10, 10]"><t-avatar shape="round">A</t-avatar></t-badge>`) +
      block('自定义颜色', '', `      <t-badge count="3" color="var(--td-success-color)"><t-button variant="outline">成功</t-button></t-badge>`),
  },

  calendar: {
    script: `import { ref } from 'vue'
const value = ref('2024-06-01')`,
    template:
      block('基础用法', '', `      <t-calendar />`) +
      block('受控模式', '', `      <t-calendar v-model="value" />`) +
      block('单元格插槽', '', `      <t-calendar>
        <template #cell="{ date }">
          <div>{{ date.getDate() }}</div>
        </template>
      </t-calendar>`) +
      block('头部插槽', '', `      <t-calendar>
        <template #head><div class="demo-muted">自定义头部</div></template>
      </t-calendar>`) +
      block('周起始日', '', `      <t-calendar :first-day-of-week="7" />`),
    style: `<style scoped>
.demo-muted { padding: 8px; font-size: 13px; color: var(--td-text-color-secondary); }
</style>`,
  },

  card: {
    template:
      block('基础用法', '', `      <t-card title="卡片标题" subtitle="副标题" hover-shadow style="width: 360px">
        <p>卡片内容区域，可承载任意信息。</p>
        <template #actions><t-link theme="primary">操作</t-link></template>
      </t-card>`) +
      block('无边框', '', `      <t-card title="无边框" :bordered="false" style="width: 360px">内容区域</t-card>`) +
      block('封面', '', `      <t-card cover="https://tdesign.gtimg.com/site/sourcecard-demo.png" title="带封面" style="width: 360px">描述文字</t-card>`) +
      block('加载中', '', `      <t-card title="加载中" loading style="width: 360px">内容</t-card>`) +
      block('底部操作', '', `      <t-card title="带底部" style="width: 360px">
        内容
        <template #footer><t-button theme="primary" block>确认</t-button></template>
      </t-card>`) +
      sizeBlockVertical([
        { label: 'small', lines: '<t-card title="Small" size="small" style="width: 240px">小卡片内容</t-card>' },
        { label: 'medium', lines: '<t-card title="Medium" size="medium" style="width: 280px">中卡片内容</t-card>' },
      ], 'Card 支持 small / medium。'),
  },

  collapse: {
    script: `import { ref } from 'vue'
const value = ref(['1'])`,
    template:
      block('基础用法', '', `      <t-collapse default-expand-all>
        <t-collapse-panel header="面板一" value="1">内容一</t-collapse-panel>
        <t-collapse-panel header="面板二" value="2">内容二</t-collapse-panel>
        <t-collapse-panel header="面板三" value="3">内容三</t-collapse-panel>
      </t-collapse>`) +
      block('手风琴', '', `      <t-collapse v-model="value" expand-mutex>
        <t-collapse-panel header="面板一" value="1">内容一</t-collapse-panel>
        <t-collapse-panel header="面板二" value="2">内容二</t-collapse-panel>
      </t-collapse>`) +
      block('禁用', '', `      <t-collapse>
        <t-collapse-panel header="正常" value="1">内容</t-collapse-panel>
        <t-collapse-panel header="禁用" value="2" disabled>不可展开</t-collapse-panel>
      </t-collapse>`) +
      block('无边框', '', `      <t-collapse borderless>
        <t-collapse-panel header="无边框" value="1">内容</t-collapse-panel>
      </t-collapse>`) +
      block('自定义图标', '', `      <t-collapse expand-icon-placement="right">
        <t-collapse-panel header="图标在右" value="1">内容</t-collapse-panel>
      </t-collapse>`),
  },

  comment: {
    template:
      block('基础用法', '', `      <t-comment avatar="https://tdesign.gtimg.com/site/avatar.jpg" author="用户名" datetime="今天">
        这是一条示例评论内容。
      </t-comment>`) +
      block('带回复', '', `      <t-comment avatar="https://tdesign.gtimg.com/site/avatar.jpg" author="张三" datetime="2 小时前" content="主评论内容">
        <template #reply>
          <t-comment avatar="https://tdesign.gtimg.com/site/avatar.jpg" author="李四" datetime="1 小时前" content="回复内容" />
        </template>
      </t-comment>`) +
      block('操作栏', '', `      <t-comment avatar="https://tdesign.gtimg.com/site/avatar.jpg" author="用户" datetime="今天" content="评论内容">
        <template #actions>
          <t-space><t-link>回复</t-link><t-link>点赞</t-link></t-space>
        </template>
      </t-comment>`) +
      block('引用', '', `      <t-comment avatar="https://tdesign.gtimg.com/site/avatar.jpg" author="用户" datetime="今天" quote="被引用的原文内容" content="评论内容" />`) +
      block('对齐方式', '', `      <t-comment avatar="https://tdesign.gtimg.com/site/avatar.jpg" author="用户" datetime="今天" align="right" content="右对齐评论" />`),
  },

  image: {
    template:
      block('基础用法', '', `      <t-image src="https://tdesign.gtimg.com/site/sourcecard-demo.png" style="width: 240px" />`) +
      block('填充模式', '', `      <t-space>
        <t-image src="https://tdesign.gtimg.com/site/sourcecard-demo.png" fit="cover" style="width: 120px; height: 80px" />
        <t-image src="https://tddesign.gtimg.com/site/sourcecard-demo.png" fit="contain" style="width: 120px; height: 80px" />
        <t-image src="https://tdesign.gtimg.com/site/sourcecard-demo.png" fit="fill" style="width: 120px; height: 80px" />
      </t-space>`) +
      block('加载失败', '', `      <t-image src="invalid-url" style="width: 240px" />`) +
      block('懒加载', '', `      <t-image src="https://tdesign.gtimg.com/site/sourcecard-demo.png" lazy style="width: 240px" />`) +
      block('圆角', '', `      <t-image src="https://tdesign.gtimg.com/site/sourcecard-demo.png" shape="round" style="width: 120px; height: 120px" />`) +
      block('画廊模式', '', `      <t-image-viewer :images="['https://tdesign.gtimg.com/site/sourcecard-demo.png']">
        <template #trigger="{ open }">
          <t-image src="https://tdesign.gtimg.com/site/sourcecard-demo.png" style="width: 120px; cursor: pointer" @click="open" />
        </template>
      </t-image-viewer>`),
  },

  list: {
    template:
      block('基础用法', '', `      <t-list style="width: 360px">
        <t-list-item>列表项一</t-list-item>
        <t-list-item>列表项二</t-list-item>
        <t-list-item>列表项三</t-list-item>
      </t-list>`) +
      block('带头部', '', `      <t-list header="列表标题" style="width: 360px">
        <t-list-item>列表项一</t-list-item>
        <t-list-item>列表项二</t-list-item>
      </t-list>`) +
      block('带操作', '', `      <t-list style="width: 360px">
        <t-list-item>
          列表项
          <template #action><t-link theme="primary">编辑</t-link></template>
        </t-list-item>
      </t-list>`) +
      block('分割线', '', `      <t-list split style="width: 360px">
        <t-list-item>项一</t-list-item>
        <t-list-item>项二</t-list-item>
      </t-list>`) +
      sizeBlockVertical([
        { label: 'small', lines: '<t-list size="small" split style="width: 360px"><t-list-item>列表内容的描述性文字</t-list-item><t-list-item>列表内容的描述性文字</t-list-item></t-list>' },
        { label: 'medium', lines: '<t-list split style="width: 360px"><t-list-item>列表内容的描述性文字</t-list-item><t-list-item>列表内容的描述性文字</t-list-item></t-list>' },
        { label: 'large', lines: '<t-list size="large" split style="width: 360px"><t-list-item>列表内容的描述性文字</t-list-item><t-list-item>列表内容的描述性文字</t-list-item></t-list>' },
      ]) +
      block('加载更多', '', `      <t-list style="width: 360px">
        <t-list-item>列表项一</t-list-item>
        <t-list-item>列表项二</t-list-item>
        <template #footer><t-button variant="text" block>加载更多</t-button></template>
      </t-list>`),
  },

  progress: {
    template:
      block('基础用法', '', `      <t-progress :percentage="30" style="width: 360px" />`) +
      block('主题 theme', '', `      <t-space direction="vertical" style="width: 360px">
        <t-progress theme="line" :percentage="30" />
        <t-progress theme="plump" :percentage="60" />
        <t-progress theme="circle" :percentage="75" />
      </t-space>`) +
      block('状态 status', '', `      <t-space direction="vertical" style="width: 360px">
        <t-progress :percentage="100" status="success" />
        <t-progress :percentage="50" status="warning" />
        <t-progress :percentage="30" status="error" />
        <t-progress :percentage="60" status="active" />
      </t-space>`) +
      block('尺寸 size', '', `      <t-space direction="vertical" style="width: 360px">
        <t-progress :percentage="50" size="small" />
        <t-progress :percentage="50" size="medium" />
        <t-progress :percentage="50" size="large" />
      </t-space>`) +
      block('自定义颜色', '', `      <t-progress :percentage="80" color="#00A870" style="width: 360px" />`) +
      block('带标签', '', `      <t-progress :percentage="60" label style="width: 360px" />`),
  },

  qrcode: {
    template:
      block('基础用法', '', `      <t-qrcode value="https://tdesign.tencent.com/vue-next" :size="120" />`) +
      sizeBlockVertical([
        { label: '80px', lines: '<t-qrcode value="https://tdesign.tencent.com" :size="80" />' },
        { label: '120px', lines: '<t-qrcode value="https://tdesign.tencent.com" :size="120" />' },
        { label: '160px', lines: '<t-qrcode value="https://tdesign.tencent.com" :size="160" />' },
      ], 'QRCode 通过 :size 像素值控制边长。') +
      block('纠错等级', '', `      <t-space>
        <t-qrcode value="https://tdesign.tencent.com" :size="100" level="L" />
        <t-qrcode value="https://tdesign.tencent.com" :size="100" level="M" />
        <t-qrcode value="https://tdesign.tencent.com" :size="100" level="H" />
      </t-space>`) +
      block('带 Logo', '', `      <t-qrcode value="https://tdesign.tencent.com" :size="120" icon="https://tdesign.gtimg.com/site/avatar.jpg" />`) +
      block('边框', '', `      <t-qrcode value="https://tdesign.tencent.com" :size="120" borderless />`) +
      block('过期状态', '', `      <t-qrcode value="https://tdesign.tencent.com" :size="120" status="expired" />`),
  },

  'range-input': {
    script: `import { ref } from 'vue'
const range = ref([])
const range2 = ref(['10', '100'])`,
    template:
      block('基础用法', '', `      <t-range-input v-model="range" style="width: 320px" />`) +
      sizeBlockVertical([
        { label: 'small', lines: '<t-range-input v-model="range2" size="small" style="width: 320px" />' },
        { label: 'medium', lines: '<t-range-input v-model="range2" size="medium" style="width: 320px" />' },
        { label: 'large', lines: '<t-range-input v-model="range2" size="large" style="width: 320px" />' },
      ]) +
      block('禁用', '', `      <t-range-input v-model="range2" disabled style="width: 320px" />`) +
      block('状态 status', '', `      <t-range-input v-model="range2" status="error" tips="范围不正确" style="width: 320px" />`) +
      block('分隔符', '', `      <t-range-input v-model="range2" separator="~" style="width: 320px" />`) +
      block('无边框', '', `      <t-range-input v-model="range2" borderless style="width: 320px" />`),
  },

  'select-input': {
    script: `import { ref } from 'vue'
const value = ref({ label: '选项一', value: '1' })
const multi = ref([])
const options = [
  { label: '选项一', value: '1' },
  { label: '选项二', value: '2' },
  { label: '选项三', value: '3' },
]`,
    template:
      block('基础用法', '', `      <t-select-input v-model="value" :options="options" placeholder="请选择或输入" style="width: 280px" />`) +
      sizeBlockVertical([
        { label: 'small', lines: '<t-select-input v-model="value" :options="options" size="small" style="width: 280px" />' },
        { label: 'medium', lines: '<t-select-input v-model="value" :options="options" size="medium" style="width: 280px" />' },
        { label: 'large', lines: '<t-select-input v-model="value" :options="options" size="large" style="width: 280px" />' },
      ]) +
      block('多选', '', `      <t-select-input v-model="multi" :options="options" multiple placeholder="多选" style="width: 280px" />`) +
      block('禁用', '', `      <t-select-input v-model="value" :options="options" disabled style="width: 280px" />`) +
      block('可清空', '', `      <t-select-input v-model="value" :options="options" clearable style="width: 280px" />`) +
      block('无边框', '', `      <t-select-input v-model="value" :options="options" borderless style="width: 280px" />`),
  },

  skeleton: {
    template:
      block('基础用法', '', `      <t-skeleton :row-col="[{ width: '60%' }, { width: '80%' }, { width: '40%' }]" />`) +
      block('动画', '', `      <t-skeleton animation="gradient" :row-col="[{ width: '60%' }, { width: '80%' }]" />`) +
      block('头像骨架', '', `      <t-skeleton theme="avatar" />`) +
      block('段落骨架', '', `      <t-skeleton theme="paragraph" />`) +
      block('图片骨架', '', `      <t-skeleton theme="image" />`) +
      block('加载完成', '', `      <t-skeleton :loading="false" :row-col="[{ width: '60%' }]">
        <div>实际内容已加载</div>
      </t-skeleton>`),
  },

  statistic: {
    template:
      block('基础用法', '', `      <t-statistic title="活跃用户" :value="112893" trend="increase" />`) +
      block('趋势', '', `      <t-space size="large">
        <t-statistic title="增长" :value="12.5" suffix="%" trend="increase" />
        <t-statistic title="下降" :value="3.2" suffix="%" trend="decrease" />
      </t-space>`) +
      block('前缀后缀', '', `      <t-statistic title="销售额" prefix="¥" :value="9876543" />`) +
      block('颜色', '', `      <t-statistic title="完成率" :value="85" suffix="%" color="var(--td-success-color)" />`) +
      block('动画', '', `      <t-statistic title="实时数据" :value="12345" animation />`) +
      block('字号层级', 'Statistic 无 size 属性，可通过 valueStyle 控制数值字号。', `      <div class="demo-size-stack">
        <div class="demo-size-row">
          <span class="demo-size-label">20px</span>
          <t-statistic title="紧凑" :value="112893" :value-style="{ fontSize: '20px', lineHeight: '28px' }" />
        </div>
        <div class="demo-size-row">
          <span class="demo-size-label">28px（默认）</span>
          <t-statistic title="默认" :value="112893" />
        </div>
        <div class="demo-size-row">
          <span class="demo-size-label">36px</span>
          <t-statistic title="强调" :value="112893" :value-style="{ fontSize: '36px', lineHeight: '44px' }" />
        </div>
      </div>`),
  },

  table: {
    script: `const columns = [
  { colKey: 'name', title: '姓名' },
  { colKey: 'role', title: '角色' },
  { colKey: 'status', title: '状态' },
]
const data = [
  { name: '张三', role: '设计', status: '在职' },
  { name: '李四', role: '开发', status: '在职' },
  { name: '王五', role: '产品', status: '离职' },
]`,
    template:
      block('基础用法', '', `      <t-table row-key="name" :data="data" :columns="columns" bordered />`) +
      block('斑马纹', '', `      <t-table row-key="name" :data="data" :columns="columns" stripe />`) +
      sizeBlockVertical([
        { label: 'small', lines: '<t-table row-key="name" :data="data" :columns="columns" size="small" bordered />' },
        { label: 'medium', lines: '<t-table row-key="name" :data="data" :columns="columns" size="medium" bordered />' },
        { label: 'large', lines: '<t-table row-key="name" :data="data" :columns="columns" size="large" bordered />' },
      ]) +
      block('加载中', '', `      <t-table row-key="name" :data="data" :columns="columns" loading />`) +
      block('空数据', '', `      <t-table row-key="name" :data="[]" :columns="columns" />`) +
      block('hover 高亮', '', `      <t-table row-key="name" :data="data" :columns="columns" hover />`) +
      block('固定表头', '', `      <t-table row-key="name" :data="[...data, ...data]" :columns="columns" max-height="200" bordered />`),
  },

  tag: {
    template:
      block('基础用法', '', `      <t-space>
        <t-tag>默认</t-tag>
        <t-tag theme="primary">主要</t-tag>
        <t-tag theme="success">成功</t-tag>
        <t-tag theme="warning">警告</t-tag>
        <t-tag theme="danger">危险</t-tag>
      </t-space>`) +
      block('变体 variant', '', `      <t-space>
        <t-tag theme="primary">Dark</t-tag>
        <t-tag theme="primary" variant="light">Light</t-tag>
        <t-tag theme="primary" variant="outline">Outline</t-tag>
        <t-tag theme="primary" variant="light-outline">Light Outline</t-tag>
      </t-space>`) +
      sizeBlockVertical([
        { label: 'small', lines: '<t-tag size="small">Small</t-tag>' },
        { label: 'medium', lines: '<t-tag size="medium">Medium</t-tag>' },
        { label: 'large', lines: '<t-tag size="large">Large</t-tag>' },
      ]) +
      block('可关闭', '', `      <t-tag closable theme="primary">可关闭</t-tag>`) +
      block('禁用', '', `      <t-tag disabled>禁用</t-tag>`) +
      block('带图标', '', `      <t-tag theme="success"><template #icon><t-icon name="check" /></template>成功</t-tag>`) +
      block('形状 shape', '', `      <t-space>
        <t-tag shape="square">方形</t-tag>
        <t-tag shape="round">圆角</t-tag>
        <t-tag shape="mark">标记</t-tag>
      </t-space>`),
  },

  'tag-input': {
    script: `import { ref } from 'vue'
const tags = ref(['Vue', 'TDesign'])
const tags2 = ref(['标签一', '标签二'])
const tags3 = ref(['A', 'B', 'C', 'D', 'E'])`,
    template:
      block('基础用法', '', `      <t-tag-input v-model="tags" clearable placeholder="输入后回车" style="width: 360px" />`) +
      sizeBlockVertical([
        { label: 'small', lines: '<t-tag-input v-model="tags2" size="small" style="width: 360px" />' },
        { label: 'medium', lines: '<t-tag-input v-model="tags2" size="medium" style="width: 360px" />' },
        { label: 'large', lines: '<t-tag-input v-model="tags2" size="large" style="width: 360px" />' },
      ]) +
      block('禁用', '', `      <t-tag-input v-model="tags" disabled style="width: 360px" />`) +
      block('最大数量', '', `      <t-tag-input v-model="tags" :max="3" placeholder="最多 3 个" style="width: 360px" />`) +
      block('无边框', '', `      <t-tag-input v-model="tags" borderless style="width: 360px" />`) +
      block('折叠标签', '', `      <t-tag-input v-model="tags3" excess-tags-display-type="break-line" style="width: 360px" />`),
  },

  timeline: {
    template:
      block('基础用法', '', `      <t-timeline mode="same">
        <t-timeline-item label="2024-01">立项</t-timeline-item>
        <t-timeline-item label="2024-06">开发</t-timeline-item>
        <t-timeline-item label="2024-12">上线</t-timeline-item>
      </t-timeline>`) +
      block('主题 theme', '', `      <t-timeline>
        <t-timeline-item dot-color="primary">主要节点</t-timeline-item>
        <t-timeline-item dot-color="success">成功节点</t-timeline-item>
        <t-timeline-item dot-color="warning">警告节点</t-timeline-item>
        <t-timeline-item dot-color="error">错误节点</t-timeline-item>
      </t-timeline>`) +
      block('交替布局', '', `      <t-timeline mode="alternate">
        <t-timeline-item label="步骤 1">内容一</t-timeline-item>
        <t-timeline-item label="步骤 2">内容二</t-timeline-item>
        <t-timeline-item label="步骤 3">内容三</t-timeline-item>
      </t-timeline>`) +
      block('自定义节点', '', `      <t-timeline>
        <t-timeline-item><template #dot><t-icon name="check-circle-filled" style="color: var(--td-success-color)" /></template>完成</t-timeline-item>
        <t-timeline-item>进行中</t-timeline-item>
      </t-timeline>`) +
      block('加载中', '', `      <t-timeline>
        <t-timeline-item loading>加载中</t-timeline-item>
        <t-timeline-item>已完成</t-timeline-item>
      </t-timeline>`),
  },

  tooltip: {
    template:
      block('基础用法', '', `      <t-tooltip content="提示文字">
        <t-button variant="outline">悬浮查看</t-button>
      </t-tooltip>`) +
      block('主题 theme', '', `      <t-space>
        <t-tooltip content="默认" theme="default"><t-button variant="outline">Default</t-button></t-tooltip>
        <t-tooltip content="主要" theme="primary"><t-button variant="outline">Primary</t-button></t-tooltip>
        <t-tooltip content="成功" theme="success"><t-button variant="outline">Success</t-button></t-tooltip>
        <t-tooltip content="警告" theme="warning"><t-button variant="outline">Warning</t-button></t-tooltip>
        <t-tooltip content="危险" theme="danger"><t-button variant="outline">Danger</t-button></t-tooltip>
      </t-space>`) +
      block('触发方式', '', `      <t-space>
        <t-tooltip content="hover 触发"><t-button variant="outline">Hover</t-button></t-tooltip>
        <t-tooltip content="click 触发" trigger="click"><t-button variant="outline">Click</t-button></t-tooltip>
      </t-space>`) +
      block('位置 placement', '', `      <t-space>
        <t-tooltip content="上方" placement="top"><t-button variant="outline">Top</t-button></t-tooltip>
        <t-tooltip content="下方" placement="bottom"><t-button variant="outline">Bottom</t-button></t-tooltip>
        <t-tooltip content="左侧" placement="left"><t-button variant="outline">Left</t-button></t-tooltip>
        <t-tooltip content="右侧" placement="right"><t-button variant="outline">Right</t-button></t-tooltip>
      </t-space>`) +
      block('带箭头', '', `      <t-tooltip content="带箭头提示" show-arrow><t-button variant="outline">Arrow</t-button></t-tooltip>`) +
      block('禁用', '', `      <t-tooltip content="不会显示"><t-button disabled>禁用</t-button></t-tooltip>`),
  },

  tree: {
    script: `const data = [
  { label: '一级 1', value: '1', children: [{ label: '二级 1-1', value: '1-1' }, { label: '二级 1-2', value: '1-2' }] },
  { label: '一级 2', value: '2', children: [{ label: '二级 2-1', value: '2-1' }] },
]`,
    template:
      block('基础用法', '', `      <t-tree :data="data" expand-all hover />`) +
      block('复选框', '', `      <t-tree :data="data" checkable expand-all />`) +
      block('禁用节点', '', `      <t-tree :data="[{ label: '正常', value: '1' }, { label: '禁用', value: '2', disabled: true }]" />`) +
      block('连线', '', `      <t-tree :data="data" line expand-all />`) +
      block('图标', '', `      <t-tree :data="data" icon expand-all />`) +
      block('懒加载', '', `      <t-tree :data="[{ label: '懒加载节点', value: '1', children: true }]" lazy />`),
  },

  watermark: {
    template:
      block('基础用法', '', `      <t-watermark content="Flow Panel" :y="120" :x="80" :width="120" :height="60">
        <div class="watermark-box">水印覆盖区域</div>
      </t-watermark>`) +
      block('多行水印', '', `      <t-watermark :content="['Flow Panel', 'TDesign']" :y="100" :x="60">
        <div class="watermark-box">多行水印</div>
      </t-watermark>`) +
      block('旋转角度', '', `      <t-watermark content="Rotated" :rotate="-22" :y="120" :x="80">
        <div class="watermark-box">旋转水印</div>
      </t-watermark>`) +
      block('图片水印', '', `      <t-watermark :watermark-content="{ type: 'image', url: 'https://tdesign.gtimg.com/site/logo.png', width: 60, height: 20 }">
        <div class="watermark-box">图片水印</div>
      </t-watermark>`) +
      block('灰阶', '', `      <t-watermark content="Grayscale" grayscale>
        <div class="watermark-box">灰阶水印</div>
      </t-watermark>`),
    style: `<style scoped>
.watermark-box {
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--td-bg-color-container);
  border: 1px dashed var(--td-component-border);
  border-radius: var(--td-radius-default);
}
</style>`,
  },

  'back-top': {
    template:
      block('基础用法', '页面右下角可见回到顶部按钮。', `      <p class="demo-muted">向下滚动页面后，右下角会出现回到顶部按钮。</p>
      <t-back-top />`) +
      block('自定义内容', '', `      <t-back-top>
        <div class="back-top-btn">TOP</div>
      </t-back-top>`) +
      block('可见高度', '', `      <t-back-top :visible-height="200" />`) +
      block('主题 theme', '', `      <t-back-top theme="primary" />`) +
      block('尺寸 size', 'BackTop 支持 small / medium，使用相对定位便于预览。', `      <t-space align="center" size="large">
        <div class="loading-size-item">
          <t-back-top :visible-height="0" size="small" style="position: relative; inset: auto" />
          <span class="demo-size-label">small</span>
        </div>
        <div class="loading-size-item">
          <t-back-top :visible-height="0" size="medium" style="position: relative; inset: auto" />
          <span class="demo-size-label">medium</span>
        </div>
      </t-space>`),
    style: `<style scoped>
.demo-muted { font-size: 13px; color: var(--td-text-color-secondary); }
.back-top-btn {
  width: 40px; height: 40px; border-radius: 50%;
  background: var(--td-brand-color); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 600;
}
</style>`,
  },

  descriptions: {
    template:
      block('基础用法', '', `      <t-descriptions title="用户信息" bordered>
        <t-descriptions-item label="姓名">张三</t-descriptions-item>
        <t-descriptions-item label="手机">138****8888</t-descriptions-item>
        <t-descriptions-item label="地址">深圳市</t-descriptions-item>
      </t-descriptions>`) +
      block('布局', '', `      <t-descriptions title="垂直布局" layout="vertical" bordered>
        <t-descriptions-item label="姓名">张三</t-descriptions-item>
        <t-descriptions-item label="手机">138****8888</t-descriptions-item>
      </t-descriptions>`) +
      block('列数', '', `      <t-descriptions title="三列" :column="3">
        <t-descriptions-item label="姓名">张三</t-descriptions-item>
        <t-descriptions-item label="年龄">28</t-descriptions-item>
        <t-descriptions-item label="城市">深圳</t-descriptions-item>
      </t-descriptions>`) +
      sizeBlockVertical([
        { label: 'small', lines: '<t-descriptions title="Small" size="small" bordered><t-descriptions-item label="姓名">张三</t-descriptions-item><t-descriptions-item label="手机">138****8888</t-descriptions-item></t-descriptions>' },
        { label: 'medium', lines: '<t-descriptions title="Medium" size="medium" bordered><t-descriptions-item label="姓名">张三</t-descriptions-item><t-descriptions-item label="手机">138****8888</t-descriptions-item></t-descriptions>' },
        { label: 'large', lines: '<t-descriptions title="Large" size="large" bordered><t-descriptions-item label="姓名">张三</t-descriptions-item><t-descriptions-item label="手机">138****8888</t-descriptions-item></t-descriptions>' },
      ]) +
      block('无边框', '', `      <t-descriptions title="无边框" :bordered="false">
        <t-descriptions-item label="姓名">张三</t-descriptions-item>
        <t-descriptions-item label="手机">138****8888</t-descriptions-item>
      </t-descriptions>`) +
      block('对齐', '', `      <t-descriptions title="左对齐" item-layout="horizontal" label-align="left">
        <t-descriptions-item label="姓名">张三</t-descriptions-item>
        <t-descriptions-item label="备注">这是一段较长的备注信息</t-descriptions-item>
      </t-descriptions>`),
  },
}
