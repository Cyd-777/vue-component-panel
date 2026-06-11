import { reindexTemplateDataIds } from './tagIndex'
import { stripEmptyDynamicAttrsInSource } from './livePreview'
import { loadEditorSession } from './componentFileStore'
import { loadComponentLogic } from '../logic/useComponentLogic'
import { stripDomEventBindingsFromTemplate } from '../logic/templateBindingCodegen'
import type { ComponentLogicModel } from '../logic/logicTypes'

export interface EditorPreviewSession {
  fileId: string | null
  filename: string
  componentCode: string
  logic: ComponentLogicModel
}

const FALLBACK_CODE = reindexTemplateDataIds(`\
<template>
  <LayoutContainer layout="flex" flex-direction="column" :padding="[24,24,24,24]" :column-gap="16" :row-gap="16" border="1px solid var(--td-component-border)" :border-radius="8">
    <span>这是一行文本</span>
  </LayoutContainer>
</template>`)

/** 读取画板当前草稿 + 逻辑模型，供示例预览页使用 */
export function loadEditorPreviewSession(): EditorPreviewSession {
  const session = loadEditorSession()
  const fileId = session?.currentFileId ?? null
  let componentCode = session?.draftCode ?? FALLBACK_CODE
  componentCode = reindexTemplateDataIds(stripEmptyDynamicAttrsInSource(componentCode))
  componentCode = stripDomEventBindingsFromTemplate(componentCode)
  return {
    fileId,
    filename: session?.filename ?? 'untitled.vue',
    componentCode,
    logic: loadComponentLogic(fileId),
  }
}
