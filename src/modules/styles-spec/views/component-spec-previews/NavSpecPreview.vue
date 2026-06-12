<script setup lang="ts">
import { ref } from 'vue'
import SpecDemoBlock from './SpecDemoBlock.vue'
import { menuTreeData } from './shared'

defineProps<{ componentId: string }>()

const menuVal = ref('menu1')
const tabVal = ref('tab1')
const tabCard = ref('tab1')
</script>

<template>
  <div class="spec-preview">
    <template v-if="componentId === 'menu'">
      <SpecDemoBlock title="基础用法">
        <div class="spec-preview__menu">
          <t-menu v-model="menuVal">
            <t-menu-item value="menu1">Menu 1</t-menu-item>
            <t-menu-item value="menu2">Menu 2</t-menu-item>
            <t-menu-item value="menu3" disabled>Disabled</t-menu-item>
          </t-menu>
        </div>
      </SpecDemoBlock>
      <SpecDemoBlock title="子菜单">
        <div class="spec-preview__menu">
          <t-menu v-model="menuVal">
            <t-submenu value="sub1" title="Submenu">
              <t-menu-item value="sub1-1">Item 1-1</t-menu-item>
              <t-menu-item value="sub1-2">Item 1-2</t-menu-item>
            </t-submenu>
            <t-menu-item value="menu2">Menu 2</t-menu-item>
          </t-menu>
        </div>
      </SpecDemoBlock>
      <SpecDemoBlock title="树形菜单">
        <div class="spec-preview__menu">
          <t-menu v-model="menuVal" :data="menuTreeData" />
        </div>
      </SpecDemoBlock>
      <SpecDemoBlock title="带图标">
        <div class="spec-preview__menu">
          <t-menu v-model="menuVal">
            <t-menu-item value="menu1"><template #icon><t-icon name="app" /></template>Dashboard</t-menu-item>
            <t-menu-item value="menu2"><template #icon><t-icon name="setting" /></template>Settings</t-menu-item>
          </t-menu>
        </div>
      </SpecDemoBlock>
      <SpecDemoBlock title="折叠">
        <t-menu v-model="menuVal" collapsed class="spec-preview__menu">
          <t-menu-item value="menu1"><template #icon><t-icon name="app" /></template>Menu 1</t-menu-item>
          <t-menu-item value="menu2"><template #icon><t-icon name="setting" /></template>Menu 2</t-menu-item>
        </t-menu>
      </SpecDemoBlock>
    </template>

    <template v-else-if="componentId === 'tabs'">
      <SpecDemoBlock title="基础用法">
        <t-tabs v-model="tabVal">
          <t-tab-panel value="tab1" label="Tab 1">Panel 1</t-tab-panel>
          <t-tab-panel value="tab2" label="Tab 2">Panel 2</t-tab-panel>
          <t-tab-panel value="tab3" label="Tab 3">Panel 3</t-tab-panel>
        </t-tabs>
      </SpecDemoBlock>
      <SpecDemoBlock title="卡片样式">
        <t-tabs v-model="tabCard" theme="card">
          <t-tab-panel value="tab1" label="Card 1">Card panel 1</t-tab-panel>
          <t-tab-panel value="tab2" label="Card 2">Card panel 2</t-tab-panel>
        </t-tabs>
      </SpecDemoBlock>
      <SpecDemoBlock title="尺寸 size">
        <t-tabs v-model="tabVal" size="medium">
          <t-tab-panel value="tab1" label="Medium">Medium</t-tab-panel>
          <t-tab-panel value="tab2" label="Tab 2">Panel 2</t-tab-panel>
        </t-tabs>
        <t-tabs v-model="tabVal" size="large">
          <t-tab-panel value="tab1" label="Large">Large</t-tab-panel>
          <t-tab-panel value="tab2" label="Tab 2">Panel 2</t-tab-panel>
        </t-tabs>
      </SpecDemoBlock>
      <SpecDemoBlock title="禁用">
        <t-tabs v-model="tabVal">
          <t-tab-panel value="tab1" label="Tab 1">Panel 1</t-tab-panel>
          <t-tab-panel value="tab2" label="Disabled" disabled>Panel 2</t-tab-panel>
        </t-tabs>
      </SpecDemoBlock>
      <SpecDemoBlock title="可删除">
        <t-tabs v-model="tabVal" addable @remove="() => {}">
          <t-tab-panel value="tab1" label="Tab 1" removable>Panel 1</t-tab-panel>
          <t-tab-panel value="tab2" label="Tab 2" removable>Panel 2</t-tab-panel>
        </t-tabs>
      </SpecDemoBlock>
      <SpecDemoBlock title="底部">
        <t-tabs v-model="tabVal" placement="bottom">
          <t-tab-panel value="tab1" label="Bottom 1">Panel 1</t-tab-panel>
          <t-tab-panel value="tab2" label="Bottom 2">Panel 2</t-tab-panel>
        </t-tabs>
      </SpecDemoBlock>
    </template>
  </div>
</template>

<style scoped>
@import './spec-preview-styles.css';
</style>
