<template>
  <LayoutContainer :padding="[12,16,12,16]" :column-gap="2" :row-gap="2" :border-radius="8" :width="366" layout="flex" flex-direction="row" border="1px solid var(--td-brand-color)" background-color="#ffffff" width-mode="fixed" height-mode="hug">
    <Ceshi />
    <span style="color: #000000; display: inline-block; width: 128px; height: 30px">@Click.prevent="</span>
    <LayoutContainer :padding="[2,8,2,8]" :column-gap="12" :row-gap="12" :border-radius="8" :width="92" layout="flex" flex-direction="row" height-mode="fixed" border="1px solid var(--td-component-border)" width-mode="fixed" :height="24">
      <span style="color: #000000; display: inline-block; height: 18px">方法名( )</span>
    </LayoutContainer>
    <span style="color: #000000; display: inline-block; width: 12px; height: 27px">"</span>
    <LayoutContainer :padding="4" :column-gap="12" :row-gap="12" :border-radius="8" layout="flex" flex-direction="row" height-mode="hug" border="1px solid var(--td-component-border)">
      <span style="color: #000000; display: inline-block; width: 59px; height: 18px">function</span>
      <span style="color: #000000; display: inline-block; width: 59px; height: 18px">{</span>
      <span style="color: #000000; display: inline-block; height: 18px; width: 303px">代码内容</span>
      <span style="color: #000000; display: inline-block; height: 18px; width: 303px">}</span>
    </LayoutContainer>
  </LayoutContainer>
</template>

<script setup lang="ts">
import Ceshi from './ceshi.vue'
import LayoutContainer from '../modules/layout-container/LayoutContainer.vue'
</script>

<style scoped>
</style>
