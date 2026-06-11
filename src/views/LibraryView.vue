<script setup lang="ts">
import { ref } from 'vue'
import DocsView from './DocsView.vue'
import InventoryView from './InventoryView.vue'

type LibrarySection = 'inventory' | 'docs'

const docComponents = ref([
  { id: 'btn', name: 'Button 按钮' },
  { id: 'input', name: 'Input 输入框' },
  { id: 'card', name: 'Card 卡片' },
  { id: 'dialog', name: 'Dialog 对话框' },
  { id: 'table', name: 'Table 表格' },
])

const activeSection = ref<LibrarySection>('inventory')
const docsOpen = ref(false)
const activeDocId = ref<string | null>(null)

function selectInventory() {
  activeSection.value = 'inventory'
}

function toggleDocsOpen() {
  docsOpen.value = !docsOpen.value
  if (docsOpen.value) activeSection.value = 'docs'
}

function selectDocsSection() {
  activeSection.value = 'docs'
  docsOpen.value = true
}

function selectDoc(id: string) {
  activeSection.value = 'docs'
  activeDocId.value = id
  docsOpen.value = true
}
</script>

<template>
  <div class="library">
    <aside class="library__side">
      <nav class="library__nav">
        <section class="library__group">
          <button
            type="button"
            class="library__group-head"
            :class="{ 'library__group-head--active': activeSection === 'inventory' }"
            @click="selectInventory"
          >
            <span class="library__chevron library__chevron--placeholder" aria-hidden="true"></span>
            <span class="library__group-label">组件注册清单</span>
          </button>
        </section>

        <section class="library__group">
          <button
            type="button"
            class="library__group-head"
            :class="{ 'library__group-head--active': activeSection === 'docs' }"
            @click="selectDocsSection"
          >
            <span
              class="library__chevron"
              :class="{ 'library__chevron--open': docsOpen }"
              @click.stop="toggleDocsOpen"
            >›</span>
            <span class="library__group-label">文档示例</span>
          </button>
          <div v-show="docsOpen" class="library__group-body">
            <button
              v-for="c in docComponents"
              :key="c.id"
              type="button"
              class="library__item"
              :class="{ 'library__item--active': activeSection === 'docs' && activeDocId === c.id }"
              @click="selectDoc(c.id)"
            >
              {{ c.name }}
            </button>
          </div>
        </section>
      </nav>
    </aside>
    <main class="library__main">
      <InventoryView v-if="activeSection === 'inventory'" />
      <DocsView
        v-else
        :active-id="activeDocId"
        :components="docComponents"
      />
    </main>
  </div>
</template>

<style scoped>
.library {
  flex: 1;
  display: flex;
  min-height: 0;
}

.library__side {
  width: var(--flow-sidebar-width);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--td-component-border);
  background: var(--td-bg-color-container);
  padding: 8px 0;
  overflow: auto;
}

.library__nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.library__group {
  display: flex;
  flex-direction: column;
}

.library__group-head {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 8px 12px 8px 10px;
  font-size: 13px;
  text-align: left;
  border: none;
  background: transparent;
  color: var(--td-text-color-secondary);
  cursor: pointer;
}

.library__group-head:hover {
  background: var(--td-bg-color-container-hover);
  color: var(--td-text-color-primary);
}

.library__group-head--active {
  background: var(--td-brand-color-light);
  color: var(--td-brand-color);
  font-weight: 500;
}

.library__chevron {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  font-size: 12px;
  line-height: 1;
  color: var(--td-text-color-placeholder);
  transform: rotate(0deg);
  transition: transform 0.15s ease;
}

.library__chevron--open {
  transform: rotate(90deg);
}

.library__chevron--placeholder {
  visibility: hidden;
}

.library__group-label {
  flex: 1;
  min-width: 0;
}

.library__group-body {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 0 0 4px 28px;
}

.library__item {
  display: block;
  width: 100%;
  padding: 6px 10px;
  font-size: 12px;
  text-align: left;
  border: none;
  border-radius: var(--td-radius-small);
  background: transparent;
  color: var(--td-text-color-secondary);
  cursor: pointer;
}

.library__item:hover {
  background: var(--td-bg-color-container-hover);
  color: var(--td-text-color-primary);
}

.library__item--active {
  background: var(--td-brand-color-light);
  color: var(--td-brand-color);
  font-weight: 500;
}

.library__main {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
