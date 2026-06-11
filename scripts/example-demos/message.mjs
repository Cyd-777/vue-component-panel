import { block } from './shared.mjs'

export const messageDemos = {
  alert: {
    template:
      block('基础用法', '', `      <t-space direction="vertical" style="width: 100%">
        <t-alert theme="success" message="成功提示" />
        <t-alert theme="info" message="信息提示" />
        <t-alert theme="warning" message="警告提示" />
        <t-alert theme="error" message="错误提示" />
      </t-space>`) +
      block('带标题', '', `      <t-alert theme="info" title="提示标题" message="详细描述信息。" />`) +
      block('可关闭', '', `      <t-alert theme="warning" message="可关闭的警告" close />`) +
      block('带图标', '', `      <t-alert theme="success" message="带默认图标" icon />`) +
      block('自定义操作', '', `      <t-alert theme="info" message="操作提示">
        <template #operation><t-link theme="primary">查看详情</t-link></template>
      </t-alert>`) +
      block('折叠', '', `      <t-alert theme="info" message="较长内容..." :max-line="2" />`) +
      block('无边框', '', `      <t-alert theme="success" message="无边框样式" :close-btn="false" />`),
  },

  dialog: {
    script: `import { ref } from 'vue'
const visible = ref(false)
const visible2 = ref(false)
const dialogW480 = ref(false)
const dialogW680 = ref(false)
const dialogW960 = ref(false)`,
    template:
      block('基础用法', '', `      <t-button @click="visible = true">打开对话框</t-button>
      <t-dialog v-model:visible="visible" header="标题" :on-confirm="() => (visible = false)">
        对话框内容
      </t-dialog>`) +
      block('确认与取消', '', `      <t-button @click="visible2 = true">确认对话框</t-button>
      <t-dialog v-model:visible="visible2" header="确认操作" theme="warning" :on-confirm="() => (visible2 = false)">
        确定要执行此操作吗？
      </t-dialog>`) +
      block('宽度规格', 'Dialog 通过 width 控制对话框大小。', `      <t-space>
        <t-button @click="dialogW480 = true">480px</t-button>
        <t-button @click="dialogW680 = true">680px</t-button>
        <t-button @click="dialogW960 = true">960px</t-button>
      </t-space>
      <t-dialog v-model:visible="dialogW480" header="480px" width="480px" :on-confirm="() => (dialogW480 = false)">偏小对话框</t-dialog>
      <t-dialog v-model:visible="dialogW680" header="680px" width="680px" :on-confirm="() => (dialogW680 = false)">中等对话框</t-dialog>
      <t-dialog v-model:visible="dialogW960" header="960px" width="960px" :on-confirm="() => (dialogW960 = false)">宽大对话框</t-dialog>`) +
      block('无头部', '', `      <t-button @click="visible = true">无头部</t-button>
      <t-dialog v-model:visible="visible" :header="false" :on-confirm="() => (visible = false)">无头部对话框</t-dialog>`) +
      block('加载中', '', `      <t-dialog v-model:visible="visible" header="提交中" :confirm-btn="{ loading: true }">处理中...</t-dialog>`) +
      block('全屏', '', `      <t-dialog v-model:visible="visible" header="全屏" mode="full-screen" :on-confirm="() => (visible = false)">全屏内容</t-dialog>`) +
      block('拖拽', '', `      <t-dialog v-model:visible="visible" header="可拖拽" draggable :on-confirm="() => (visible = false)">拖拽移动</t-dialog>`),
  },

  drawer: {
    script: `import { ref } from 'vue'
const visible = ref(false)
const placement = ref('right')
const drawerSize = ref('small')`,
    template:
      block('基础用法', '', `      <t-button @click="visible = true">打开抽屉</t-button>
      <t-drawer v-model:visible="visible" header="抽屉标题" size="360px">
        抽屉内容
      </t-drawer>`) +
      block('弹出方向', '', `      <t-space>
        <t-button @click="placement = 'left'; visible = true">Left</t-button>
        <t-button @click="placement = 'right'; visible = true">Right</t-button>
        <t-button @click="placement = 'top'; visible = true">Top</t-button>
        <t-button @click="placement = 'bottom'; visible = true">Bottom</t-button>
      </t-space>
      <t-drawer v-model:visible="visible" :placement="placement" header="抽屉" size="360px">内容</t-drawer>`) +
      block('尺寸 size', 'Drawer 的 size 可为 small / medium / large 或具体宽度。', `      <t-radio-group v-model="drawerSize" variant="default-filled">
        <t-radio-button value="small">Small</t-radio-button>
        <t-radio-button value="medium">Medium</t-radio-button>
        <t-radio-button value="large">Large</t-radio-button>
      </t-radio-group>
      <t-button style="margin-top: 12px" @click="visible = true">打开抽屉</t-button>
      <t-drawer v-model:visible="visible" header="尺寸预览" :size="drawerSize">当前 size：{{ drawerSize }}</t-drawer>`) +
      block('无头部', '', `      <t-drawer v-model:visible="visible" :header="false" size="360px">无头部抽屉</t-drawer>`) +
      block('带底部', '', `      <t-drawer v-model:visible="visible" header="带底部" size="360px">
        内容
        <template #footer><t-button theme="primary" block @click="visible = false">确认</t-button></template>
      </t-drawer>`) +
      block('遮罩可关闭', '', `      <t-drawer v-model:visible="visible" header="点击遮罩关闭" :close-on-overlay-click="true" size="360px">内容</t-drawer>`),
  },

  loading: {
    script: `import { ref } from 'vue'
const loading = ref(true)
const fullscreen = ref(false)`,
    template:
      block('基础用法', '', `      <t-loading :loading="loading" text="加载中...">
        <div class="loading-box">内容区域</div>
      </t-loading>
      <t-button size="small" class="loading-toggle" @click="loading = !loading">切换</t-button>`) +
      block('尺寸 size', '', `      <t-space align="center" size="large">
        <div class="loading-size-item">
          <t-loading size="small" />
          <span class="demo-size-label">small</span>
        </div>
        <div class="loading-size-item">
          <t-loading size="medium" />
          <span class="demo-size-label">medium</span>
        </div>
        <div class="loading-size-item">
          <t-loading size="large" />
          <span class="demo-size-label">large</span>
        </div>
      </t-space>`) +
      block('全屏加载', '', `      <t-button @click="fullscreen = true">全屏 Loading</t-button>
      <t-loading :loading="fullscreen" fullscreen text="全屏加载中..." />`) +
      block('延迟显示', '', `      <t-loading :loading="loading" :delay="500">
        <div class="loading-box">延迟 500ms 显示</div>
      </t-loading>`) +
      block('自定义指示器', '', `      <t-loading :loading="loading" indicator>
        <template #indicator><t-icon name="loading" /></template>
        <div class="loading-box">自定义图标</div>
      </t-loading>`) +
      block('inherit 继承', '', `      <t-loading :loading="loading" inherit-color text="继承文字色">
        <div class="loading-box">继承颜色</div>
      </t-loading>`),
    style: `<style scoped>
.loading-box {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--td-bg-color-container);
  border-radius: var(--td-radius-default);
}
.loading-toggle { margin-top: 12px; }
</style>`,
  },

  message: {
    script: `import { MessagePlugin } from 'tdesign-vue-next'
function show(theme: 'success' | 'warning' | 'error' | 'info') {
  MessagePlugin[theme]('这是一条消息')
}
function showClose() {
  MessagePlugin.info({ content: '可关闭消息', closeBtn: true })
}
function showDuration() {
  MessagePlugin.success({ content: '3 秒后关闭', duration: 3000 })
}`,
    template:
      block('基础用法', '', `      <t-space>
        <t-button @click="show('success')">成功</t-button>
        <t-button @click="show('warning')">警告</t-button>
        <t-button @click="show('error')">错误</t-button>
        <t-button @click="show('info')">信息</t-button>
      </t-space>`) +
      block('可关闭', '', `      <t-button @click="showClose">可关闭消息</t-button>`) +
      block('自定义时长', '', `      <t-button @click="showDuration">3 秒关闭</t-button>`) +
      block('带图标', '', `      <t-button @click="MessagePlugin.success({ content: '带图标', icon: true })">带图标</t-button>`) +
      block('自定义内容', '', `      <t-button @click="MessagePlugin.info('自定义内容消息')">自定义</t-button>`) +
      block('批量关闭', '', `      <t-button @click="MessagePlugin.closeAll()">关闭全部</t-button>`),
  },

  notification: {
    script: `import { NotifyPlugin } from 'tdesign-vue-next'
function open(theme: 'success' | 'warning' | 'error' | 'info') {
  NotifyPlugin[theme]({ title: '通知标题', content: '通知内容描述' })
}
function openCustom() {
  NotifyPlugin.info({ title: '自定义', content: '自定义通知内容', duration: 5000, closeBtn: true })
}`,
    template:
      block('基础用法', '', `      <t-space>
        <t-button @click="open('success')">成功</t-button>
        <t-button @click="open('warning')">警告</t-button>
        <t-button @click="open('error')">错误</t-button>
        <t-button @click="open('info')">信息</t-button>
      </t-space>`) +
      block('自定义时长', '', `      <t-button @click="openCustom">5 秒关闭</t-button>`) +
      block('无标题', '', `      <t-button @click="NotifyPlugin.success({ content: '无标题通知' })">无标题</t-button>`) +
      block('位置 placement', '', `      <t-space>
        <t-button @click="NotifyPlugin.info({ title: '右上', content: '内容', placement: 'top-right' })">Top Right</t-button>
        <t-button @click="NotifyPlugin.info({ title: '右下', content: '内容', placement: 'bottom-right' })">Bottom Right</t-button>
      </t-space>`) +
      block('关闭全部', '', `      <t-button @click="NotifyPlugin.closeAll()">关闭全部</t-button>`) +
      block('带图标', '', `      <t-button @click="NotifyPlugin.warning({ title: '警告', content: '请注意', icon: true })">带图标</t-button>`),
  },

  popconfirm: {
    template:
      block('基础用法', '', `      <t-popconfirm content="确认删除吗？">
        <t-button theme="danger" variant="outline">删除</t-button>
      </t-popconfirm>`) +
      block('主题 theme', '', `      <t-space>
        <t-popconfirm content="默认确认" theme="default"><t-button variant="outline">Default</t-button></t-popconfirm>
        <t-popconfirm content="警告确认" theme="warning"><t-button variant="outline">Warning</t-button></t-popconfirm>
        <t-popconfirm content="危险确认" theme="danger"><t-button variant="outline">Danger</t-button></t-popconfirm>
      </t-space>`) +
      block('自定义按钮', '', `      <t-popconfirm content="确认操作？" confirm-btn="确定" cancel-btn="取消">
        <t-button variant="outline">自定义按钮</t-button>
      </t-popconfirm>`) +
      block('触发方式', '', `      <t-space>
        <t-popconfirm content="点击触发" trigger="click"><t-button variant="outline">Click</t-button></t-popconfirm>
        <t-popconfirm content="悬浮触发" trigger="hover"><t-button variant="outline">Hover</t-button></t-popconfirm>
      </t-space>`) +
      block('位置 placement', '', `      <t-popconfirm content="上方确认" placement="top">
        <t-button variant="outline">Top</t-button>
      </t-popconfirm>`) +
      block('带图标', '', `      <t-popconfirm content="确认提交？" icon>
        <t-button theme="primary">提交</t-button>
      </t-popconfirm>`),
  },

  popup: {
    template:
      block('基础用法', '', `      <t-popup content="弹出层内容" trigger="hover">
        <t-button variant="outline">悬浮显示</t-button>
      </t-popup>`) +
      block('触发方式', '', `      <t-space>
        <t-popup content="hover" trigger="hover"><t-button variant="outline">Hover</t-button></t-popup>
        <t-popup content="click" trigger="click"><t-button variant="outline">Click</t-button></t-popup>
        <t-popup content="focus" trigger="focus"><t-button variant="outline">Focus</t-button></t-popup>
      </t-space>`) +
      block('位置 placement', '', `      <t-space>
        <t-popup content="上方" placement="top"><t-button variant="outline">Top</t-button></t-popup>
        <t-popup content="下方" placement="bottom"><t-button variant="outline">Bottom</t-button></t-popup>
        <t-popup content="左侧" placement="left"><t-button variant="outline">Left</t-button></t-popup>
        <t-popup content="右侧" placement="right"><t-button variant="outline">Right</t-button></t-popup>
      </t-space>`) +
      block('带箭头', '', `      <t-popup content="带箭头" show-arrow trigger="hover">
        <t-button variant="outline">Arrow</t-button>
      </t-popup>`) +
      block('延迟', '', `      <t-popup content="延迟显示" :delay="[300, 0]" trigger="hover">
        <t-button variant="outline">Delay 300ms</t-button>
      </t-popup>`) +
      block('自定义内容', '', `      <t-popup trigger="click">
        <template #content>
          <div style="padding: 12px">自定义弹出内容</div>
        </template>
        <t-button variant="outline">自定义</t-button>
      </t-popup>`),
  },
}
