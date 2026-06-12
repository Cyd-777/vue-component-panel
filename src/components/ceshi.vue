<template>
  <LayoutContainer :padding="[12,16,12,16]" :column-gap="16" :row-gap="16" :border-radius="8" layout="flex" flex-direction="column" border="1px solid var(--td-brand-color)" background-color="#000000">
    <span style="color: #ffffff; font-weight: 700">测试用组件</span>
    <LayoutContainer :padding="[2,16,2,16]" :column-gap="12" :row-gap="12" :min-width="100" :max-width="400" :border-radius="8" layout="flex" flex-direction="row" width-mode="minmax" height-mode="hug" border="1px solid var(--td-component-border)">
      <span>测试 button</span>
    </LayoutContainer>
  </LayoutContainer>
</template>

<script setup lang="ts">
import LayoutContainer from '../modules/layout-container/LayoutContainer.vue'
</script>

<style scoped>
</style>
