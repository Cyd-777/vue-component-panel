<script setup lang="ts">
defineProps<{
  activeId: string | null
  components: { id: string; name: string }[]
}>()
</script>

<template>
  <div class="docs">
    <main class="docs__main">
      <div v-if="!activeId" class="docs__empty">
        <p>从左侧选择一个组件查看文档</p>
      </div>
      <div v-else class="docs__content">
        <h2>{{ components.find((c) => c.id === activeId)?.name }}</h2>
        <p class="docs__hint">组件文档与示例展示区域</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.docs {
  flex: 1;
  display: flex;
  min-height: 0;
}

.docs__main {
  flex: 1;
  min-height: 0;
  padding: 32px;
  overflow: auto;
}

.docs__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--td-text-color-placeholder);
  font-size: 13px;
}

.docs__content h2 {
  margin: 0 0 8px;
  font-size: 18px;
}

.docs__hint {
  color: var(--td-text-color-placeholder);
  font-size: 13px;
}
</style>
