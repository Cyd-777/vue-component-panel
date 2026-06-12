<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentThemeId } from '../tokens/componentThemeBindingDefs'
import DataSpecPreview from './component-spec-previews/DataSpecPreview.vue'
import FeedbackSpecPreview from './component-spec-previews/FeedbackSpecPreview.vue'
import FormSpecPreview from './component-spec-previews/FormSpecPreview.vue'
import NavSpecPreview from './component-spec-previews/NavSpecPreview.vue'
import OverlaySpecPreview from './component-spec-previews/OverlaySpecPreview.vue'

const props = defineProps<{
  componentId: ComponentThemeId
  cardStyle?: Record<string, string>
}>()

const FORM_IDS = new Set<ComponentThemeId>([
  'radio',
  'checkbox',
  'input',
  'input-number',
  'select',
  'cascader',
  'switch',
  'slider',
  'date-picker',
  'rate',
  'transfer',
])

const DATA_IDS = new Set<ComponentThemeId>([
  'table',
  'tag',
  'progress',
  'tree',
  'pagination',
  'badge',
  'avatar',
  'collapse',
  'card',
])

const FEEDBACK_IDS = new Set<ComponentThemeId>([
  'alert',
  'loading',
  'message',
  'message-box',
  'notification',
])

const NAV_IDS = new Set<ComponentThemeId>(['menu', 'tabs'])
const OVERLAY_IDS = new Set<ComponentThemeId>(['tooltip', 'popover'])

const previewComponent = computed(() => {
  if (FORM_IDS.has(props.componentId)) return FormSpecPreview
  if (DATA_IDS.has(props.componentId)) return DataSpecPreview
  if (FEEDBACK_IDS.has(props.componentId)) return FeedbackSpecPreview
  if (NAV_IDS.has(props.componentId)) return NavSpecPreview
  if (OVERLAY_IDS.has(props.componentId)) return OverlaySpecPreview
  return null
})
</script>

<template>
  <component
    :is="previewComponent"
    v-if="previewComponent"
    :component-id="componentId"
    :card-style="cardStyle"
  />
</template>
