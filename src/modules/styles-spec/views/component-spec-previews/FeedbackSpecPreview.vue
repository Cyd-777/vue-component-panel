<script setup lang="ts">
import { ref } from 'vue'
import { DialogPlugin, MessagePlugin, NotifyPlugin } from 'tdesign-vue-next'
import SpecDemoBlock from './SpecDemoBlock.vue'

defineProps<{ componentId: string }>()

const loading = ref(true)
const fullscreen = ref(false)
const dialogVisible = ref(false)
const dialogConfirm = ref(false)

function showMessage(theme: 'info' | 'success' | 'warning' | 'error') {
  MessagePlugin[theme]('Message content')
}

function showMessageClose() {
  MessagePlugin.info({ content: 'Closable message', closeBtn: true })
}

function showMessageDuration() {
  MessagePlugin.success({ content: 'Auto close in 3s', duration: 3000 })
}

function showMessageBox() {
  DialogPlugin.confirm({
    header: 'Confirm',
    body: 'Are you sure?',
    confirmBtn: 'OK',
    cancelBtn: 'Cancel',
  })
}

function showMessageBoxAlert() {
  DialogPlugin.alert({
    header: 'Alert',
    body: 'Alert message',
    confirmBtn: 'OK',
  })
}

function showNotification(theme: 'info' | 'success' | 'warning' | 'error') {
  NotifyPlugin[theme]({ title: 'Notification', content: `${theme} content` })
}

function showNotificationPlacement(placement: 'top-right' | 'bottom-right') {
  NotifyPlugin.info({ title: 'Notification', content: 'Content', placement })
}
</script>

<template>
  <div class="spec-preview">
    <template v-if="componentId === 'alert'">
      <SpecDemoBlock title="基础用法">
        <t-alert theme="success" message="Success message" />
        <t-alert theme="info" message="Info message" />
        <t-alert theme="warning" message="Warning message" />
        <t-alert theme="error" message="Error message" />
      </SpecDemoBlock>
      <SpecDemoBlock title="带标题">
        <t-alert theme="info" title="Title" message="Description text." />
      </SpecDemoBlock>
      <SpecDemoBlock title="可关闭">
        <t-alert theme="warning" message="Closable alert" close />
      </SpecDemoBlock>
      <SpecDemoBlock title="带图标">
        <t-alert theme="success" message="With icon" icon />
      </SpecDemoBlock>
      <SpecDemoBlock title="自定义操作">
        <t-alert theme="info" message="Action alert">
          <template #operation><t-link theme="primary">Details</t-link></template>
        </t-alert>
      </SpecDemoBlock>
      <SpecDemoBlock title="折叠">
        <t-alert theme="info" message="Long content that can be collapsed with max-line." :max-line="2" />
      </SpecDemoBlock>
    </template>

    <template v-else-if="componentId === 'loading'">
      <SpecDemoBlock title="基础用法">
        <t-loading :loading="loading" text="Loading...">
          <div class="loading-box">Content area</div>
        </t-loading>
        <t-button size="small" @click="loading = !loading">Toggle</t-button>
      </SpecDemoBlock>
      <SpecDemoBlock title="尺寸 size">
        <t-space align="center" size="large">
          <div class="loading-size-item">
            <t-loading size="small" />
            <span class="spec-size-label">small</span>
          </div>
          <div class="loading-size-item">
            <t-loading size="medium" />
            <span class="spec-size-label">medium</span>
          </div>
          <div class="loading-size-item">
            <t-loading size="large" />
            <span class="spec-size-label">large</span>
          </div>
        </t-space>
      </SpecDemoBlock>
      <SpecDemoBlock title="全屏加载">
        <t-button @click="fullscreen = true">Fullscreen Loading</t-button>
        <t-loading :loading="fullscreen" fullscreen text="Loading..." />
      </SpecDemoBlock>
      <SpecDemoBlock title="延迟显示">
        <t-loading :loading="loading" :delay="500">
          <div class="loading-box">Delay 500ms</div>
        </t-loading>
      </SpecDemoBlock>
      <SpecDemoBlock title="inherit 继承">
        <t-loading :loading="loading" inherit-color text="Inherit color">
          <div class="loading-box">Inherit</div>
        </t-loading>
      </SpecDemoBlock>
    </template>

    <template v-else-if="componentId === 'message'">
      <SpecDemoBlock title="基础用法">
        <t-space wrap>
          <t-button @click="showMessage('success')">Success</t-button>
          <t-button @click="showMessage('warning')">Warning</t-button>
          <t-button @click="showMessage('error')">Error</t-button>
          <t-button @click="showMessage('info')">Info</t-button>
        </t-space>
      </SpecDemoBlock>
      <SpecDemoBlock title="可关闭">
        <t-button @click="showMessageClose">Closable</t-button>
      </SpecDemoBlock>
      <SpecDemoBlock title="自定义时长">
        <t-button @click="showMessageDuration">3s auto close</t-button>
      </SpecDemoBlock>
      <SpecDemoBlock title="带图标">
        <t-button @click="MessagePlugin.success({ content: 'With icon', icon: true })">With icon</t-button>
      </SpecDemoBlock>
      <SpecDemoBlock title="批量关闭">
        <t-button @click="MessagePlugin.closeAll()">Close all</t-button>
      </SpecDemoBlock>
    </template>

    <template v-else-if="componentId === 'message-box'">
      <SpecDemoBlock title="函数调用 confirm">
        <t-button @click="showMessageBox">Confirm</t-button>
        <t-button @click="showMessageBoxAlert">Alert</t-button>
      </SpecDemoBlock>
      <SpecDemoBlock title="组件用法">
        <t-button @click="dialogVisible = true">Open Dialog</t-button>
        <t-dialog v-model:visible="dialogVisible" header="Dialog" :on-confirm="() => (dialogVisible = false)">
          Dialog content
        </t-dialog>
      </SpecDemoBlock>
      <SpecDemoBlock title="确认与取消">
        <t-button @click="dialogConfirm = true">Warning Dialog</t-button>
        <t-dialog
          v-model:visible="dialogConfirm"
          header="Confirm"
          theme="warning"
          :on-confirm="() => (dialogConfirm = false)"
        >
          Are you sure?
        </t-dialog>
      </SpecDemoBlock>
      <SpecDemoBlock title="无头部">
        <t-button @click="dialogVisible = true">No header</t-button>
        <t-dialog v-model:visible="dialogVisible" :header="false" :on-confirm="() => (dialogVisible = false)">
          No header dialog
        </t-dialog>
      </SpecDemoBlock>
      <SpecDemoBlock title="加载中">
        <t-dialog v-model:visible="dialogVisible" header="Submitting" :confirm-btn="{ loading: true }">
          Processing...
        </t-dialog>
      </SpecDemoBlock>
    </template>

    <template v-else-if="componentId === 'notification'">
      <SpecDemoBlock title="基础用法">
        <t-space wrap>
          <t-button @click="showNotification('success')">Success</t-button>
          <t-button @click="showNotification('warning')">Warning</t-button>
          <t-button @click="showNotification('error')">Error</t-button>
          <t-button @click="showNotification('info')">Info</t-button>
        </t-space>
      </SpecDemoBlock>
      <SpecDemoBlock title="自定义时长">
        <t-button @click="NotifyPlugin.info({ title: 'Custom', content: '5s close', duration: 5000, closeBtn: true })">
          5s close
        </t-button>
      </SpecDemoBlock>
      <SpecDemoBlock title="无标题">
        <t-button @click="NotifyPlugin.success({ content: 'No title' })">No title</t-button>
      </SpecDemoBlock>
      <SpecDemoBlock title="位置 placement">
        <t-space>
          <t-button @click="showNotificationPlacement('top-right')">Top Right</t-button>
          <t-button @click="showNotificationPlacement('bottom-right')">Bottom Right</t-button>
        </t-space>
      </SpecDemoBlock>
      <SpecDemoBlock title="关闭全部">
        <t-button @click="NotifyPlugin.closeAll()">Close all</t-button>
      </SpecDemoBlock>
      <SpecDemoBlock title="带图标">
        <t-button @click="NotifyPlugin.warning({ title: 'Warning', content: 'Notice', icon: true })">With icon</t-button>
      </SpecDemoBlock>
    </template>
  </div>
</template>

<style scoped>
@import './spec-preview-styles.css';
</style>
