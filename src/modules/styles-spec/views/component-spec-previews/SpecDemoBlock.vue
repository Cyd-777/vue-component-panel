<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <section class="spec-demo-block">
    <header class="spec-demo-block__head">
      <h4 class="spec-demo-block__title">{{ title }}</h4>
      <p v-if="description" class="spec-demo-block__desc">{{ description }}</p>
    </header>
    <div class="spec-demo-block__body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.spec-demo-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.spec-demo-block__title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--td-text-color-secondary);
}

.spec-demo-block__desc {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--td-text-color-placeholder);
}

.spec-demo-block__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
