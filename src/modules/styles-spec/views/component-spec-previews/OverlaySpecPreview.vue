<script setup lang="ts">
import SpecDemoBlock from './SpecDemoBlock.vue'

defineProps<{ componentId: string }>()
</script>

<template>
  <div class="spec-preview">
    <template v-if="componentId === 'tooltip'">
      <SpecDemoBlock title="基础用法">
        <t-tooltip content="Tooltip content">
          <t-button variant="outline">Hover</t-button>
        </t-tooltip>
      </SpecDemoBlock>
      <SpecDemoBlock title="主题 theme">
        <t-space wrap>
          <t-tooltip content="Default" theme="default"><t-button variant="outline">Default</t-button></t-tooltip>
          <t-tooltip content="Primary" theme="primary"><t-button variant="outline">Primary</t-button></t-tooltip>
          <t-tooltip content="Success" theme="success"><t-button variant="outline">Success</t-button></t-tooltip>
          <t-tooltip content="Warning" theme="warning"><t-button variant="outline">Warning</t-button></t-tooltip>
          <t-tooltip content="Danger" theme="danger"><t-button variant="outline">Danger</t-button></t-tooltip>
        </t-space>
      </SpecDemoBlock>
      <SpecDemoBlock title="触发方式">
        <t-space>
          <t-tooltip content="Hover trigger"><t-button variant="outline">Hover</t-button></t-tooltip>
          <t-tooltip content="Click trigger" trigger="click"><t-button variant="outline">Click</t-button></t-tooltip>
        </t-space>
      </SpecDemoBlock>
      <SpecDemoBlock title="位置 placement">
        <t-space wrap>
          <t-tooltip content="Top" placement="top"><t-button variant="outline">Top</t-button></t-tooltip>
          <t-tooltip content="Bottom" placement="bottom"><t-button variant="outline">Bottom</t-button></t-tooltip>
          <t-tooltip content="Left" placement="left"><t-button variant="outline">Left</t-button></t-tooltip>
          <t-tooltip content="Right" placement="right"><t-button variant="outline">Right</t-button></t-tooltip>
        </t-space>
      </SpecDemoBlock>
      <SpecDemoBlock title="带箭头">
        <t-tooltip content="With arrow" show-arrow><t-button variant="outline">Arrow</t-button></t-tooltip>
      </SpecDemoBlock>
      <SpecDemoBlock title="禁用">
        <t-tooltip content="Hidden"><t-button disabled>Disabled</t-button></t-tooltip>
      </SpecDemoBlock>
    </template>

    <template v-else-if="componentId === 'popover'">
      <SpecDemoBlock title="基础用法">
        <t-popover content="Popover content">
          <t-button variant="outline">Hover</t-button>
        </t-popover>
      </SpecDemoBlock>
      <SpecDemoBlock title="触发方式">
        <t-space>
          <t-popover content="Hover" trigger="hover"><t-button variant="outline">Hover</t-button></t-popover>
          <t-popover content="Click" trigger="click"><t-button variant="outline">Click</t-button></t-popover>
          <t-popover content="Focus" trigger="focus"><t-button variant="outline">Focus</t-button></t-popover>
        </t-space>
      </SpecDemoBlock>
      <SpecDemoBlock title="位置 placement">
        <t-space wrap>
          <t-popover content="Top" placement="top"><t-button variant="outline">Top</t-button></t-popover>
          <t-popover content="Bottom" placement="bottom"><t-button variant="outline">Bottom</t-button></t-popover>
          <t-popover content="Left" placement="left"><t-button variant="outline">Left</t-button></t-popover>
          <t-popover content="Right" placement="right"><t-button variant="outline">Right</t-button></t-popover>
        </t-space>
      </SpecDemoBlock>
      <SpecDemoBlock title="带箭头">
        <t-popover content="With arrow" show-arrow><t-button variant="outline">Arrow</t-button></t-popover>
      </SpecDemoBlock>
      <SpecDemoBlock title="自定义内容">
        <t-popover trigger="click">
          <template #content>
            <div style="padding: 12px">Custom popover content</div>
          </template>
          <t-button variant="outline">Custom</t-button>
        </t-popover>
      </SpecDemoBlock>
      <SpecDemoBlock title="主题 theme">
        <t-space>
          <t-popover content="Default"><t-button variant="outline">Default</t-button></t-popover>
          <t-popover content="Brand" theme="brand"><t-button variant="outline">Brand</t-button></t-popover>
        </t-space>
      </SpecDemoBlock>
    </template>
  </div>
</template>

<style scoped>
@import './spec-preview-styles.css';
</style>
