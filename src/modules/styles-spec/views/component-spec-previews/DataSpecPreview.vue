<script setup lang="ts">
import { ref } from 'vue'
import SpecDemoBlock from './SpecDemoBlock.vue'
import { tableColumns, tableData, treeData } from './shared'

defineProps<{
  componentId: string
  cardStyle?: Record<string, string>
}>()

const collapseVal = ref(['1'])
const page = ref(1)
const pageSize = ref(10)
</script>

<template>
  <div class="spec-preview spec-preview--wide">
    <template v-if="componentId === 'table'">
      <SpecDemoBlock title="基础用法">
        <t-table row-key="name" :data="tableData" :columns="tableColumns" bordered />
      </SpecDemoBlock>
      <SpecDemoBlock title="斑马纹">
        <t-table row-key="name" :data="tableData" :columns="tableColumns" stripe />
      </SpecDemoBlock>
      <SpecDemoBlock title="尺寸 size">
        <div class="spec-size-stack">
          <div v-for="size in (['small', 'medium', 'large'] as const)" :key="size" class="spec-size-row">
            <span class="spec-size-label">{{ size }}</span>
            <t-table row-key="name" :data="tableData" :columns="tableColumns" :size="size" bordered />
          </div>
        </div>
      </SpecDemoBlock>
      <SpecDemoBlock title="加载中">
        <t-table row-key="name" :data="tableData" :columns="tableColumns" loading />
      </SpecDemoBlock>
      <SpecDemoBlock title="空数据">
        <t-table row-key="name" :data="[]" :columns="tableColumns" />
      </SpecDemoBlock>
      <SpecDemoBlock title="hover 高亮">
        <t-table row-key="name" :data="tableData" :columns="tableColumns" hover />
      </SpecDemoBlock>
      <SpecDemoBlock title="固定表头">
        <t-table row-key="name" :data="[...tableData, ...tableData]" :columns="tableColumns" max-height="200" bordered />
      </SpecDemoBlock>
    </template>

    <template v-else-if="componentId === 'tag'">
      <SpecDemoBlock title="基础用法">
        <t-space wrap>
          <t-tag>Default</t-tag>
          <t-tag theme="primary">Primary</t-tag>
          <t-tag theme="success">Success</t-tag>
          <t-tag theme="warning">Warning</t-tag>
          <t-tag theme="danger">Danger</t-tag>
        </t-space>
      </SpecDemoBlock>
      <SpecDemoBlock title="变体 variant">
        <t-space wrap>
          <t-tag theme="primary">Dark</t-tag>
          <t-tag theme="primary" variant="light">Light</t-tag>
          <t-tag theme="primary" variant="outline">Outline</t-tag>
          <t-tag theme="primary" variant="light-outline">Light Outline</t-tag>
        </t-space>
      </SpecDemoBlock>
      <SpecDemoBlock title="尺寸 size">
        <t-space>
          <t-tag size="small">Small</t-tag>
          <t-tag size="medium">Medium</t-tag>
          <t-tag size="large">Large</t-tag>
        </t-space>
      </SpecDemoBlock>
      <SpecDemoBlock title="可关闭">
        <t-tag closable theme="primary">Closable</t-tag>
      </SpecDemoBlock>
      <SpecDemoBlock title="禁用">
        <t-tag disabled>Disabled</t-tag>
      </SpecDemoBlock>
      <SpecDemoBlock title="带图标">
        <t-tag theme="success">
          <template #icon><t-icon name="check" /></template>
          Success
        </t-tag>
      </SpecDemoBlock>
      <SpecDemoBlock title="形状 shape">
        <t-space>
          <t-tag shape="square">Square</t-tag>
          <t-tag shape="round">Round</t-tag>
          <t-tag shape="mark">Mark</t-tag>
        </t-space>
      </SpecDemoBlock>
    </template>

    <template v-else-if="componentId === 'progress'">
      <SpecDemoBlock title="基础用法">
        <t-progress :percentage="30" class="spec-field-lg" />
      </SpecDemoBlock>
      <SpecDemoBlock title="主题 theme">
        <t-progress theme="line" :percentage="30" class="spec-field-lg" />
        <t-progress theme="plump" :percentage="60" class="spec-field-lg" />
        <t-progress theme="circle" :percentage="75" />
      </SpecDemoBlock>
      <SpecDemoBlock title="状态 status">
        <t-progress :percentage="100" status="success" class="spec-field-lg" />
        <t-progress :percentage="50" status="warning" class="spec-field-lg" />
        <t-progress :percentage="30" status="error" class="spec-field-lg" />
        <t-progress :percentage="60" status="active" class="spec-field-lg" />
      </SpecDemoBlock>
      <SpecDemoBlock title="尺寸 size">
        <t-progress :percentage="50" size="small" class="spec-field-lg" />
        <t-progress :percentage="50" size="medium" class="spec-field-lg" />
        <t-progress :percentage="50" size="large" class="spec-field-lg" />
      </SpecDemoBlock>
      <SpecDemoBlock title="带标签">
        <t-progress :percentage="60" label class="spec-field-lg" />
      </SpecDemoBlock>
    </template>

    <template v-else-if="componentId === 'tree'">
      <SpecDemoBlock title="基础用法">
        <t-tree :data="treeData" expand-all hover />
      </SpecDemoBlock>
      <SpecDemoBlock title="复选框">
        <t-tree :data="treeData" checkable expand-all />
      </SpecDemoBlock>
      <SpecDemoBlock title="禁用节点">
        <t-tree :data="[{ label: 'Normal', value: '1' }, { label: 'Disabled', value: '2', disabled: true }]" />
      </SpecDemoBlock>
      <SpecDemoBlock title="连线">
        <t-tree :data="treeData" line expand-all />
      </SpecDemoBlock>
      <SpecDemoBlock title="图标">
        <t-tree :data="treeData" icon expand-all />
      </SpecDemoBlock>
      <SpecDemoBlock title="懒加载">
        <t-tree :data="[{ label: 'Lazy node', value: '1', children: true }]" lazy />
      </SpecDemoBlock>
    </template>

    <template v-else-if="componentId === 'pagination'">
      <SpecDemoBlock title="基础用法">
        <t-pagination v-model="page" v-model:page-size="pageSize" :total="100" show-jumper />
      </SpecDemoBlock>
      <SpecDemoBlock title="尺寸 size">
        <t-pagination v-model="page" :total="100" size="small" />
        <t-pagination v-model="page" :total="100" size="medium" />
      </SpecDemoBlock>
      <SpecDemoBlock title="简洁模式">
        <t-pagination v-model="page" :total="100" page-ellipsis-mode="both-ends" />
      </SpecDemoBlock>
      <SpecDemoBlock title="每页条数">
        <t-pagination v-model="page" v-model:page-size="pageSize" :total="100" show-page-size :page-size-options="[10, 20, 50]" />
      </SpecDemoBlock>
      <SpecDemoBlock title="禁用">
        <t-pagination v-model="page" :total="100" disabled />
      </SpecDemoBlock>
    </template>

    <template v-else-if="componentId === 'badge'">
      <SpecDemoBlock title="基础用法">
        <t-badge count="8"><t-button variant="outline">Messages</t-button></t-badge>
      </SpecDemoBlock>
      <SpecDemoBlock title="红点 dot">
        <t-badge dot><t-button variant="outline">Notify</t-button></t-badge>
      </SpecDemoBlock>
      <SpecDemoBlock title="尺寸 size">
        <t-space>
          <t-badge count="99"><div class="badge-block" /></t-badge>
          <t-badge count="99" size="small"><div class="badge-block" /></t-badge>
        </t-space>
      </SpecDemoBlock>
      <SpecDemoBlock title="最大值">
        <t-badge count="120" :max-count="99"><t-button variant="outline">99+</t-button></t-badge>
      </SpecDemoBlock>
      <SpecDemoBlock title="偏移 offset">
        <t-badge count="2" :offset="[10, 10]"><t-avatar shape="round">A</t-avatar></t-badge>
      </SpecDemoBlock>
      <SpecDemoBlock title="自定义颜色">
        <t-badge count="3" color="var(--td-success-color)"><t-button variant="outline">Success</t-button></t-badge>
      </SpecDemoBlock>
    </template>

    <template v-else-if="componentId === 'avatar'">
      <SpecDemoBlock title="基础用法">
        <t-space>
          <t-avatar>U</t-avatar>
          <t-avatar image="https://tdesign.gtimg.com/site/avatar.jpg" />
          <t-avatar icon="user" />
        </t-space>
      </SpecDemoBlock>
      <SpecDemoBlock title="尺寸 size">
        <t-space>
          <t-avatar size="small">S</t-avatar>
          <t-avatar size="medium">M</t-avatar>
          <t-avatar size="large">L</t-avatar>
        </t-space>
      </SpecDemoBlock>
      <SpecDemoBlock title="形状 shape">
        <t-space>
          <t-avatar shape="circle">C</t-avatar>
          <t-avatar shape="round">R</t-avatar>
        </t-space>
      </SpecDemoBlock>
      <SpecDemoBlock title="头像组">
        <t-avatar-group cascading="left-up" :max="3">
          <t-avatar image="https://tdesign.gtimg.com/site/avatar.jpg" />
          <t-avatar>A</t-avatar>
          <t-avatar>B</t-avatar>
          <t-avatar>C</t-avatar>
        </t-avatar-group>
      </SpecDemoBlock>
      <SpecDemoBlock title="自定义内容">
        <t-avatar style="background: var(--td-brand-color)"><t-icon name="user" /></t-avatar>
      </SpecDemoBlock>
    </template>

    <template v-else-if="componentId === 'collapse'">
      <SpecDemoBlock title="基础用法">
        <t-collapse default-expand-all>
          <t-collapse-panel header="Panel 1" value="1">Content 1</t-collapse-panel>
          <t-collapse-panel header="Panel 2" value="2">Content 2</t-collapse-panel>
          <t-collapse-panel header="Panel 3" value="3">Content 3</t-collapse-panel>
        </t-collapse>
      </SpecDemoBlock>
      <SpecDemoBlock title="手风琴">
        <t-collapse v-model="collapseVal" expand-mutex>
          <t-collapse-panel header="Panel 1" value="1">Content 1</t-collapse-panel>
          <t-collapse-panel header="Panel 2" value="2">Content 2</t-collapse-panel>
        </t-collapse>
      </SpecDemoBlock>
      <SpecDemoBlock title="禁用">
        <t-collapse>
          <t-collapse-panel header="Normal" value="1">Content</t-collapse-panel>
          <t-collapse-panel header="Disabled" value="2" disabled>Disabled</t-collapse-panel>
        </t-collapse>
      </SpecDemoBlock>
      <SpecDemoBlock title="无边框">
        <t-collapse borderless>
          <t-collapse-panel header="Borderless" value="1">Content</t-collapse-panel>
        </t-collapse>
      </SpecDemoBlock>
      <SpecDemoBlock title="图标在右">
        <t-collapse expand-icon-placement="right">
          <t-collapse-panel header="Icon right" value="1">Content</t-collapse-panel>
        </t-collapse>
      </SpecDemoBlock>
    </template>

    <template v-else-if="componentId === 'card'">
      <SpecDemoBlock title="基础用法">
        <t-card title="Card title" subtitle="Subtitle" hover-shadow class="spec-preview__card" :style="cardStyle">
          Card content area.
          <template #actions><t-link theme="primary">Action</t-link></template>
        </t-card>
      </SpecDemoBlock>
      <SpecDemoBlock title="无边框">
        <t-card title="Borderless" :bordered="false" class="spec-preview__card">Content</t-card>
      </SpecDemoBlock>
      <SpecDemoBlock title="封面">
        <t-card cover="https://tdesign.gtimg.com/site/sourcecard-demo.png" title="With cover" class="spec-preview__card">
          Description
        </t-card>
      </SpecDemoBlock>
      <SpecDemoBlock title="加载中">
        <t-card title="Loading" loading class="spec-preview__card">Content</t-card>
      </SpecDemoBlock>
      <SpecDemoBlock title="带底部">
        <t-card title="With footer" class="spec-preview__card">
          Content
          <template #footer><t-button theme="primary" block>Confirm</t-button></template>
        </t-card>
      </SpecDemoBlock>
      <SpecDemoBlock title="尺寸 size">
        <t-card title="Small" size="small" class="spec-preview__card">Small card</t-card>
        <t-card title="Medium" size="medium" class="spec-preview__card">Medium card</t-card>
      </SpecDemoBlock>
    </template>
  </div>
</template>

<style scoped>
@import './spec-preview-styles.css';
</style>
