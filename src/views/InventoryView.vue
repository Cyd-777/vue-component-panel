<script setup lang="ts">
import { ref } from 'vue'
import { loadGlobal, getGlobal, unregisterGlobal, loadPages, getPageComponents, unregisterPageComponent, type ComponentRegistration } from '../modules/registry/componentRegistry'

loadGlobal()
loadPages()

const globalList = ref<ComponentRegistration[]>(getGlobal())

// 示例页面 ID（后续从路由或配置中获取）
const currentPage = ref('home')
const localList = ref<ComponentRegistration[]>(getPageComponents(currentPage.value))

function removeGlobal(id: string) {
  unregisterGlobal(id)
  globalList.value = [...getGlobal()]
}

function removeLocal(id: string) {
  unregisterPageComponent(currentPage.value, id)
  localList.value = [...getPageComponents(currentPage.value)]
}

function switchPage(page: string) {
  currentPage.value = page
  localList.value = [...getPageComponents(page)]
}

const pages = ['home', 'user', 'dashboard']
</script>

<template>
  <div class="iv">
    <div class="iv__section">
      <div class="iv__head">
        <h3 class="iv__title">全局注册（global.json）</h3>
        <span class="iv__count">{{ globalList.length }} 个</span>
      </div>
      <table v-if="globalList.length" class="iv__table">
        <thead><tr><th>标签</th><th>名称</th><th>路径</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="c in globalList" :key="c.id">
            <td><code>{{ c.tag }}</code></td>
            <td>{{ c.name }}</td>
            <td class="iv__path">{{ c.path }}</td>
            <td><button class="iv__btn iv__btn--danger" @click="removeGlobal(c.id)">移除</button></td>
          </tr>
        </tbody>
      </table>
      <div v-else class="iv__empty">暂无全局注册组件</div>
    </div>

    <div class="iv__section">
      <div class="iv__head">
        <h3 class="iv__title">局部注册（pages/）</h3>
        <nav class="iv__pages">
          <button v-for="p in pages" :key="p"
            class="iv__page-btn"
            :class="{ 'iv__page-btn--active': currentPage === p }"
            @click="switchPage(p)">{{ p }}.json</button>
        </nav>
      </div>
      <table v-if="localList.length" class="iv__table">
        <thead><tr><th>标签</th><th>名称</th><th>路径</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="c in localList" :key="c.id">
            <td><code>{{ c.tag }}</code></td>
            <td>{{ c.name }}</td>
            <td class="iv__path">{{ c.path }}</td>
            <td><button class="iv__btn iv__btn--danger" @click="removeLocal(c.id)">移除</button></td>
          </tr>
        </tbody>
      </table>
      <div v-else class="iv__empty">该页面暂无局部注册组件</div>
    </div>
  </div>
</template>

<style scoped>
.iv {
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 32px;
  overflow: auto;
}

.iv__head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.iv__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.iv__count {
  font-size: 12px;
  color: var(--td-text-color-placeholder);
}

.iv__pages {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.iv__page-btn {
  padding: 2px 10px;
  font-size: 11px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: transparent;
  color: var(--td-text-color-secondary);
  cursor: pointer;
}

.iv__page-btn--active {
  background: var(--td-brand-color-light);
  border-color: var(--td-brand-color);
  color: var(--td-brand-color);
}

.iv__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.iv__table th, .iv__table td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--td-component-border);
  text-align: left;
}

.iv__table th {
  font-size: 11px;
  font-weight: 600;
  color: var(--td-text-color-secondary);
  background: var(--td-bg-color-secondarycontainer);
}

.iv__path {
  font-family: monospace;
  font-size: 11px;
  color: var(--td-text-color-placeholder);
}

.iv__empty {
  padding: 24px;
  text-align: center;
  color: var(--td-text-color-placeholder);
  font-size: 13px;
  background: var(--td-bg-color-secondarycontainer);
  border-radius: var(--td-radius-small);
}

.iv__btn {
  padding: 2px 10px;
  font-size: 11px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: transparent;
  cursor: pointer;
}

.iv__btn--danger {
  color: var(--td-error-color);
  border-color: var(--td-error-color);
}
.iv__btn--danger:hover {
  background: var(--td-error-color);
  color: #fff;
}
</style>
