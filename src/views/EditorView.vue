<script setup lang="ts">
import { ref, shallowRef, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import CodeEditor from '../modules/code-editor/CodeEditor.vue'
import { createPreviewComponent, tryCreatePreviewComponent, stripEmptyDynamicAttrsInSource, setPreviewRegistry, buildPreviewRegistryFromStore } from '../modules/editor/livePreview'
import PropsPanel from '../modules/editor/PropsPanel.vue'
import InteractionStateRail from '../modules/editor/InteractionStateRail.vue'
import { syncInteractionStatePreview } from '../modules/editor/interactionStatePreview'
import {
  interactionStateLabel,
  interactionStateUsesCanvasPreview,
  type FlowInteractionStateId,
} from '../modules/editor/interactionStateSpec'
import { interactionStateHasOverrides } from '../modules/editor/pseudoClassStyle'
import StructureTreePanel from '../modules/editor/StructureTreePanel.vue'
import SelectionOverlay from '../modules/editor/interaction/SelectionOverlay.vue'
import {
  patchTagAttributes,
  patchPreserveVisualSize,
  patchSpanPadding,
  patchChildClearGridPlacement,
  getTagAttrsFromCode,
} from '../modules/editor/attrPatch'
import {
  type HandleId,
  type ExtremeBandsView,
  type ElasticSnapGuidesView,
  type ElasticRulerContext,
  type ElasticRulerZoneView,
  type SizeMode,
  canResizeTag,
  isSpanTag,
  computeResizePreview,
  getAxisLimits,
  computeExtremeBands,
  captureElasticRulerContext,
  buildRulerZones,
  createElasticRulerGuides,
  updateElasticRulerGuides,
  detectResizeModesFromRuler,
  detectResizeModesFull,
  buildResizePatch,
} from '../modules/editor/resizeLogic'
import {
  type GapAxis,
  type PaddingEdge,
  canEditLayoutSpacing,
  canShowSpacingHandles,
  isLayoutContainerTag,
  isEditorStructuralContainer,
  isImportedComponentTag,
  getSpacingAttrs,
  buildGapPatch,
  buildBorderRadiusPatch,
  formatBorderRadiusPreview,
  paddingDeltaFromDrag,
  applyPaddingDragDelta,
  getPaddingDragMode,
  type PaddingDragMode,
  type PaddingLinkMode,
  radiusDeltaFromDragForCorner,
  clampSpacing,
  formatPaddingAttr,
  type RadiusCornerIndex,
  type BorderRadiusCorners,
} from '../modules/editor/layoutSpacingLogic'
import {
  applyGridTrackStateFromEditor,
  buildGridTrackPatch,
  computeGridTrackCapsules,
  getGridTracksFromCode,
  hitGridTrackHoverAtPoint,
  gridTrackDragPreview as buildGridTrackDragPreview,
  resolveGridTrackDropIndex,
  moveGridTracks,
  applyGridMatrixToCode,
  buildGridPlacementMatrixFromCode,
  inferGridMatrixRowCount,
  moveGridPlacementMatrixColumns,
  moveGridPlacementMatrixRows,
  gridDomInsertAtForCell,
  hitGridCellAtPoint,
  getGridCellViewportRect,
  commitGridCoordinateDrop,
  assignGridChildToFirstEmptyCell,
  type GridElementDropPreview,
  type GridTrackDragPreview,
  type GridTrackSizeMode,
} from '../modules/editor/gridTrackLogic'
import { findTagLineInSource, reindexTemplateDataIds } from '../modules/editor/tagIndex'
import {
  getDirectChildTagIndices,
  getTagParentIndex,
  isDescendantTag,
  moveTagToParent,
  insertTagBlock,
  deleteTagBlock,
  moveTagGroupToParent,
  wrapTagsInLayoutContainer,
  normalizeGroupTagIndices,
  extractTagBlockLines,
  pasteTagBlockAfter,
  countTags,
} from '../modules/editor/sourceManip'
import LogicSidePanel from '../modules/logic/LogicSidePanel.vue'
import LogicCodeRail from '../modules/logic/LogicCodeRail.vue'
import { useComponentLogic } from '../modules/logic/useComponentLogic'
import { useSimulationScenario } from '../modules/simulation/useSimulationScenario'
import type { InteractionTrigger } from '../modules/simulation/simulationTypes'
import {
  buildExportSfc,
  buildImportMapFromStore,
  buildComponentInsertSnippet,
  collectComponentTags,
  defaultImportPath,
  downloadTextFile,
  ensureScriptImports,
  extractTemplateInner,
  inferComponentMeta,
  parseImportedSfc,
  EMPTY_SFC,
  syncPreviewStyleSheet,
} from '../modules/editor/componentFile'
import { buildLogicTokenContext, mergeSfcWithLogic } from '../modules/logic/scriptCodegen'
import LogicBindingOverlay from '../modules/logic/LogicBindingOverlay.vue'
import {
  LOGIC_BLOCK_CATEGORY_ACCENT,
  getLogicBlockLabel,
} from '../modules/logic/logicBlockCatalog'
import { expandLogicBody } from '../modules/logic/logicTokens'
import { stripDomEventBindingsFromTemplate } from '../modules/logic/templateBindingCodegen'
import {
  useLogicBindingDrag,
  type BindingDragStartPayload,
} from '../modules/logic/useLogicBindingDrag'
import {
  loadComponentFiles,
  upsertComponentFile,
  loadEditorSession,
  saveEditorSession,
  type StoredComponentFile,
} from '../modules/editor/componentFileStore'
import { loadGlobal, registerGlobal } from '../modules/registry/componentRegistry'
import { getStoredPaddingLinkMode } from '../modules/editor/paddingLinkModeStore'
import {
  writeVueToLibrary,
  readVueFromLibrary,
  getLibraryPathLabel,
} from '../modules/library/libraryDirectory'
import {
  libraryComponents,
  libraryStatus,
  libraryScanning,
  refreshLibraryComponents,
  reconnectLibraryDirectory,
} from '../modules/library/useLibraryComponents'

const previewComp = shallowRef<any>(null)
const compileError = ref<string | null>(null)
const previewRoot = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLElement | null>(null)
/** overlay 坐标原点：与 SelectionOverlay 的 position:absolute 容器一致 */
const overlayRootRef = ref<HTMLElement | null>(null)
const router = useRouter()

/** 编辑舞台留白：组件居中，并为容器外胶囊/手柄留出可视空间 */
const EDIT_STAGE_INSET = { top: 48, right: 40, bottom: 40, left: 56 } as const

type Tool = 'select' | 'add-container' | 'add-text' | 'edit-radius' | 'add-component'
type CanvasMode = 'edit' | 'simulate'

const showCode = ref(false)
const showHistory = ref(false)
const activeTool = ref<Tool>('select')
const canvasMode = ref<CanvasMode>('edit')

const isEditMode = computed(() => canvasMode.value === 'edit')

const {
  scenario: simulationScenario,
  appendLog: appendSimulationLog,
  setOutputKey: setSimulationOutput,
  setInputKey: setSimulationInput,
  clearOutputLog: clearSimulationLog,
} = useSimulationScenario()

// ── 组件文件源码（单一数据源） ──
const DEFAULT_COMPONENT_CODE = reindexTemplateDataIds(`\
<template>
  <LayoutContainer layout="flex" flex-direction="column" :padding="[24,24,24,24]" :column-gap="16" :row-gap="16" border="1px solid var(--td-component-border)" :border-radius="8">
    <span>这是一行文本</span>
    <LayoutContainer layout="flex" flex-direction="row" :padding="16" :column-gap="12" :row-gap="12" width-mode="minmax" :min-width="100" :max-width="400" height-mode="hug" border="1px solid var(--td-component-border)" :border-radius="8">
    </LayoutContainer>
  </LayoutContainer>
</template>`)

const componentCode = ref(DEFAULT_COMPONENT_CODE)
const currentFilename = ref('untitled.vue')
const currentFileId = ref<string | null>(null)

const {
  logic: componentLogic,
  addProp: addLogicProp,
  removeProp: removeLogicProp,
  updateProp: updateLogicProp,
  addEmit: addLogicEmit,
  removeEmit: removeLogicEmit,
  updateEmit: updateLogicEmit,
  addVariable: addLogicVariable,
  removeVariable: removeLogicVariable,
  updateVariable: updateLogicVariable,
  addMethod: addLogicMethod,
  removeMethod: removeLogicMethod,
  updateMethod: updateLogicMethod,
  addBlock: addLogicBlock,
  updateBlock: updateLogicBlock,
  removeBlock: removeLogicBlock,
  addLifecycle: addLogicLifecycle,
  removeLifecycle: removeLogicLifecycle,
  updateLifecycle: updateLogicLifecycle,
} = useComponentLogic(currentFileId)

interface BindingBadgeView {
  elIndex: number
  rect: { x: number; y: number; width: number; height: number }
  label: string
  accent: string
}

const boundBadges = ref<BindingBadgeView[]>([])

const logicBindingDrag = useLogicBindingDrag({
  hitElement: (target) => hitSelectableElement(target),
  getElementRect: (el) => getElementOverlayRect(el),
  onComplete: (blockId, elIndex) => completeLogicBinding(blockId, elIndex),
})

const {
  dragActive: bindingDragActive,
  dragAnchor: bindingDragAnchor,
  dragPointer: bindingDragPointer,
  hoverRect: bindingHoverRect,
  startDrag: startLogicBindingDrag,
  cancelDrag: cancelLogicBindingDrag,
} = logicBindingDrag

function refreshBoundBadges() {
  if (canvasMode.value !== 'simulate' || !previewRoot.value) {
    boundBadges.value = []
    return
  }
  const badges: BindingBadgeView[] = []
  for (const block of componentLogic.value.blocks) {
    if (block.boundElIndex == null) continue
    const el = elByIndex(String(block.boundElIndex))
    const rect = el ? getElementOverlayRect(el) : null
    if (!rect) continue
    const accent = LOGIC_BLOCK_CATEGORY_ACCENT[block.category] ?? '#0052d9'
    const ev = block.templateEvent ? `@${block.templateEvent}` : ''
    badges.push({
      elIndex: block.boundElIndex,
      rect,
      label: `${getLogicBlockLabel(block.type)}${ev ? ` ${ev}` : ''}`,
      accent,
    })
  }
  boundBadges.value = badges
}

function completeLogicBinding(blockId: string, elIndex: number) {
  updateLogicBlock(blockId, { boundElIndex: elIndex })
  nextTick(refreshBoundBadges)
}

function unbindLogicBlock(blockId: string) {
  const block = componentLogic.value.blocks.find((b) => b.id === blockId)
  if (!block || block.boundElIndex == null) return
  updateLogicBlock(blockId, { boundElIndex: null })
  nextTick(refreshBoundBadges)
}

/** 编辑器 template 保持无 @event；preview 只编译结构 */
function prepareEditorCodeForPreview(code: string): string {
  return stripDomEventBindingsFromTemplate(code)
}

function runBoundLogicBlocks(elIndex: string, trigger: string, event?: Event) {
  const idx = parseInt(elIndex, 10)
  if (Number.isNaN(idx)) return
  const ctx = buildLogicTokenContext(componentLogic.value)
  for (const block of componentLogic.value.blocks) {
    if (block.boundElIndex !== idx) continue
    if (block.templateEvent !== trigger) continue
    if (block.category !== 'dom-event' && block.category !== 'component-event') continue
    const body = expandLogicBody(block.body, ctx)
    if (!body.trim()) continue
    try {
      // eslint-disable-next-line no-new-func
      new Function('event', body)(event ?? new Event(trigger))
    } catch (e) {
      console.warn('[Logic] bound handler error:', block.name, e)
    }
  }
}

function onLogicBindingDragStart(payload: BindingDragStartPayload) {
  if (canvasMode.value !== 'simulate') return
  startLogicBindingDrag(payload)
}

watch(
  () => [componentLogic.value.blocks, canvasMode.value, previewComp.value],
  () => nextTick(refreshBoundBadges),
  { deep: true },
)

const showOpenMenu = ref(false)
const showInsertPicker = ref(false)
const openFileInputRef = ref<HTMLInputElement | null>(null)
const pendingInsertComponent = ref<{ tag: string; path: string } | null>(null)

loadGlobal()

function libraryFilesForPreview(): StoredComponentFile[] {
  return libraryComponents.value.length > 0 ? libraryComponents.value : loadComponentFiles()
}

function syncPreviewRegistry() {
  setPreviewRegistry(buildPreviewRegistryFromStore(libraryFilesForPreview()))
}

function persistEditorSession() {
  saveEditorSession({
    currentFileId: currentFileId.value,
    filename: currentFilename.value,
    draftCode: componentCode.value,
  })
}

function openComponentPreview() {
  persistEditorSession()
  void router.push({ path: '/preview' })
}

function loadCodeIntoEditor(code: string, filename: string, fileId: string | null) {
  let val = reindexTemplateDataIds(stripEmptyDynamicAttrsInSource(code))
  val = prepareEditorCodeForPreview(val)
  syncPreviewRegistry()
  const { component, error } = tryCreatePreviewComponent(val)
  if (!component) {
    compileError.value = error ?? '编译失败'
    return false
  }
  compileError.value = null
  history.value = [val]
  historyIndex.value = 0
  componentCode.value = val
  previewComp.value = component
  currentFilename.value = filename.endsWith('.vue') ? filename : `${filename}.vue`
  currentFileId.value = fileId
  clearSelection()
  persistEditorSession()
  refocusCanvas()
  return true
}

async function exportCurrentComponent() {
  const prompted = window.prompt('导出文件名', currentFilename.value)
  if (prompted === null) return

  const filename = prompted.endsWith('.vue') ? prompted : `${prompted}.vue`
  const meta = inferComponentMeta(componentCode.value, filename)
  const importMap = buildImportMapFromStore(libraryFilesForPreview(), componentCode.value)
  const inner = extractTemplateInner(componentCode.value) ?? ''
  const componentImports = collectComponentTags(inner).map((tag) => ({
    tag,
    path: defaultImportPath(tag, importMap),
  }))
  const exportCode = mergeSfcWithLogic(componentCode.value, componentLogic.value, componentImports)

  let written = await writeVueToLibrary(filename, exportCode)
  if (!written) {
    const reconnected = await reconnectLibraryDirectory()
    if (reconnected) {
      written = await writeVueToLibrary(filename, exportCode)
    }
  }

  if (!written) {
    downloadTextFile(exportCode, filename)
    window.alert(
      `未能写入组件库目录「${getLibraryPathLabel() || '未绑定'}」。\n`
      + '已改为下载 .vue；请返回首页重新选择组件库文件夹后再导出。',
    )
  }

  const stored: StoredComponentFile = {
    id: meta.id,
    name: meta.name,
    tag: meta.tag,
    filename,
    code: exportCode,
    updatedAt: Date.now(),
  }
  upsertComponentFile(stored)
  await refreshLibraryComponents()
  syncPreviewRegistry()

  registerGlobal({
    id: meta.id,
    name: meta.name,
    tag: meta.tag,
    path: `./${filename}`,
    description: '从画板导出',
    category: 'custom',
  })

  currentFileId.value = meta.id
  currentFilename.value = filename
  persistEditorSession()
}

async function openStoredComponentFile(file: StoredComponentFile) {
  const fresh = await readVueFromLibrary(file.filename)
  const code = fresh ?? file.code
  if (loadCodeIntoEditor(code, file.filename, file.id)) {
    showOpenMenu.value = false
  }
}

function onOpenFileFromDisk(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    const text = String(reader.result ?? '')
    const parsed = parseImportedSfc(text)
    if (parsed.error) {
      window.alert(parsed.error)
      return
    }
    const meta = inferComponentMeta(parsed.code, file.name)
    if (loadCodeIntoEditor(parsed.code, meta.filename, meta.id)) {
      upsertComponentFile({
        id: meta.id,
        name: meta.name,
        tag: meta.tag,
        filename: meta.filename,
        code: buildExportSfc(parsed.code, {
          filename: meta.filename,
          importMap: buildImportMapFromStore(libraryFilesForPreview(), parsed.code),
        }),
        updatedAt: Date.now(),
      })
      void refreshLibraryComponents().then(() => syncPreviewRegistry())
      showOpenMenu.value = false
    }
  }
  reader.readAsText(file)
  input.value = ''
}

function newComponentFile() {
  if (!loadCodeIntoEditor(EMPTY_SFC, 'untitled.vue', null)) return
  showOpenMenu.value = false
}

const insertableComponents = computed(() =>
  libraryComponents.value.filter((f) => f.filename !== currentFilename.value),
)

const libraryPathHint = computed(() => {
  const label = libraryStatus.value.pathLabel || getLibraryPathLabel()
  if (!label) return '未绑定组件库'
  if (!libraryStatus.value.hasWritableHandle) return `${label}（需重新授权）`
  return label
})

function pickInsertComponent(file: StoredComponentFile) {
  pendingInsertComponent.value = { tag: file.tag, path: `./${file.filename}` }
  showInsertPicker.value = false
  showOpenMenu.value = false
  activeTool.value = 'add-component'
}

function cancelAddComponentTool() {
  pendingInsertComponent.value = null
  if (activeTool.value === 'add-component') activeTool.value = 'select'
}

function setActiveTool(tool: Tool) {
  if (tool !== 'add-component') pendingInsertComponent.value = null
  if (tool !== 'add-component') showInsertPicker.value = false
  showOpenMenu.value = false
  activeTool.value = tool
}

async function toggleOpenMenu() {
  showOpenMenu.value = !showOpenMenu.value
  if (showOpenMenu.value) {
    showInsertPicker.value = false
    await refreshLibraryComponents()
    syncPreviewRegistry()
  }
}

async function toggleInsertPicker() {
  showInsertPicker.value = !showInsertPicker.value
  if (showInsertPicker.value) {
    showOpenMenu.value = false
    await refreshLibraryComponents()
    syncPreviewRegistry()
  }
}

async function onReconnectLibrary() {
  const ok = await reconnectLibraryDirectory()
  if (!ok) return
  await refreshLibraryComponents()
  syncPreviewRegistry()
}

const simulationTagOptions = computed(() => {
  const opts: { index: string; label: string }[] = []
  let i = 0
  while (true) {
    const loc = findTagLineInSource(componentCode.value, i)
    if (!loc) break
    opts.push({ index: String(i), label: `<${loc.tagName}> #${i}` })
    i++
  }
  return opts
})


function syncCode(code: string) {
  const val = prepareEditorCodeForPreview(code)
  const { component, error } = tryCreatePreviewComponent(val)
  previewComp.value = component
  compileError.value = error
  if (component) {
    componentCode.value = val
    console.log('[preview] compiled OK')
  }
}

// ── 代码变更 → 重新渲染 ──
// 历史操作栈
const history = ref<string[]>([componentCode.value])
const historyIndex = ref(0)
const maxHistory = 50

function pushHistory(val: string) {
  // 如果当前不在栈顶（用户已经回退过），截断后面的历史
  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1)
  }
  history.value.push(val)
  if (history.value.length > maxHistory) {
    history.value.shift()
  }
  historyIndex.value = history.value.length - 1
}

function applyCompiledCode(val: string, component: NonNullable<ReturnType<typeof createPreviewComponent>>) {
  compileError.value = null
  pushHistory(val)
  componentCode.value = val
  previewComp.value = component
  persistEditorSession()
  refocusCanvas()
}

function onCodeChange(val: string) {
  val = reindexTemplateDataIds(val)
  val = stripEmptyDynamicAttrsInSource(val)
  val = prepareEditorCodeForPreview(val)
  const { component, error } = tryCreatePreviewComponent(val)
  if (!component) {
    compileError.value = error ?? '编译失败'
    console.error('[EditorView] compile failed, keeping last preview:', compileError.value)
    return
  }
  applyCompiledCode(val, component)
}

function undo() {
  if (historyIndex.value <= 0) return
  historyIndex.value--
  const val = prepareEditorCodeForPreview(history.value[historyIndex.value])
  const { component, error } = tryCreatePreviewComponent(val)
  if (!component) {
    compileError.value = error
    return
  }
  compileError.value = null
  componentCode.value = val
  previewComp.value = component
  refocusCanvas()
}

function redo() {
  if (historyIndex.value >= history.value.length - 1) return
  historyIndex.value++
  const val = prepareEditorCodeForPreview(history.value[historyIndex.value])
  const { component, error } = tryCreatePreviewComponent(val)
  if (!component) {
    compileError.value = error
    return
  }
  compileError.value = null
  componentCode.value = val
  previewComp.value = component
  refocusCanvas()
}

function jumpToHistory(index: number) {
  if (index < 0 || index >= history.value.length) return
  historyIndex.value = index
  const val = prepareEditorCodeForPreview(history.value[index])
  const { component, error } = tryCreatePreviewComponent(val)
  if (!component) {
    compileError.value = error
    return
  }
  compileError.value = null
  componentCode.value = val
  previewComp.value = component
  showHistory.value = false
  refocusCanvas()
}

function historyLabel(code: string, index: number): string {
  const first = code.match(/<\w[\w-]*/)?.[0]?.replace('<', '') ?? 'template'
  return `${index + 1}. ${first}${index === historyIndex.value ? ' · 当前' : ''}`
}

function refocusCanvas() {
  if (isMonacoFocused() || editingIndex !== null) return
  setTimeout(() => {
    if (isMonacoFocused() || editingIndex !== null) return
    const active = document.activeElement as HTMLElement | null
    if (active?.isContentEditable || active?.closest('.el-editing')) return
    ;(document.querySelector('.editor__canvas') as HTMLElement)?.focus()
  }, 0)
}

function isMonacoFocused(): boolean {
  const el = document.activeElement as HTMLElement | null
  return !!el?.closest('.monaco-editor')
}

function setCanvasMode(mode: CanvasMode) {
  if (canvasMode.value === mode) return
  stopElementDrag()
  stopResize(false)
  stopSpacing(false)
  stopGridTrackDrag(false)
  if (marqueeMoveHandler) {
    document.removeEventListener('pointermove', marqueeMoveHandler)
    marqueeMoveHandler = null
  }
  if (marqueeUpHandler) {
    document.removeEventListener('pointerup', marqueeUpHandler)
    marqueeUpHandler = null
  }
  marqueeStart = null
  marqueeRect.value = null
  clearSelection()
  clearHover()
  cancelLogicBindingDrag()
  if (mode === 'simulate') {
    setActiveTool('select')
  }
  canvasMode.value = mode
  nextTick(() => {
    refreshBoundBadges()
    centerStageInView()
  })
}

function runInteractionRules(elIndex: string, trigger: InteractionTrigger) {
  for (const rule of simulationScenario.value.rules) {
    if (rule.trigger !== trigger) continue
    if (rule.targetElIndex && rule.targetElIndex !== elIndex) continue

    const tag = simulationTagOptions.value.find((t) => t.index === elIndex)?.label ?? `el-${elIndex}`

    if (rule.action === 'appendOutputLog') {
      appendSimulationLog(rule.payloadValue || `${tag} · ${trigger}`)
    } else if (rule.action === 'setOutput') {
      setSimulationOutput(rule.payloadKey || 'lastAction', rule.payloadValue)
      appendSimulationLog(`输出.${rule.payloadKey} ← ${rule.payloadValue}`)
    } else if (rule.action === 'setInput') {
      setSimulationInput(rule.payloadKey || 'value', rule.payloadValue)
      appendSimulationLog(`输入.${rule.payloadKey} ← ${rule.payloadValue}`)
    }
  }
}

// ── 拖拽（同级排序 + 跨容器移动 → 同步源码） ──
interface DropTarget {
  parentTagIndex: number
  insertAt: number
  /** grid 落点列（1-based） */
  gridCol?: number
  /** grid 落点行（1-based） */
  gridRow?: number
}

const dropTargetParentId = ref<string | null>(null)
const gridElementDropPreview = ref<GridElementDropPreview | null>(null)
const DRAG_THRESHOLD = 5
const DRAG_FLIP_MS = 220
const DRAG_FLIP_EASE = 'cubic-bezier(0.2, 0, 0, 1)'

function dragMotionEnabled(): boolean {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function getDragFlipSkipSet(): Set<HTMLElement> {
  const skip = new Set<HTMLElement>()
  if (!dragState) return skip
  if (dragState.placeholderEl) skip.add(dragState.placeholderEl)
  for (const ge of dragState.groupEls) skip.add(ge)
  return skip
}

function captureFlipTargets(parentEl: HTMLElement, skip: Set<HTMLElement>): HTMLElement[] {
  return [...parentEl.children].filter(
    (node): node is HTMLElement =>
      node instanceof HTMLElement
      && !skip.has(node)
      && !node.hasAttribute('data-drag-placeholder'),
  )
}

function snapshotRects(els: HTMLElement[]): Map<HTMLElement, DOMRect> {
  return new Map(els.map((el) => [el, el.getBoundingClientRect()]))
}

function applyFlip(parentEl: HTMLElement, before: Map<HTMLElement, DOMRect>, skip: Set<HTMLElement>) {
  const els = captureFlipTargets(parentEl, skip)
  for (const el of els) {
    const prev = before.get(el)
    if (!prev) continue
    const next = el.getBoundingClientRect()
    const dx = prev.left - next.left
    const dy = prev.top - next.top
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue
    el.style.transition = 'none'
    el.style.transform = `translate(${dx}px, ${dy}px)`
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      for (const el of els) {
        if (!before.has(el)) continue
        el.style.transition = `transform ${DRAG_FLIP_MS}ms ${DRAG_FLIP_EASE}`
        el.style.transform = ''
      }
    })
  })
}

function flipOnPlaceholderMove(targetParent: HTMLElement, mutate: () => void) {
  if (!dragMotionEnabled()) {
    mutate()
    return
  }

  const skip = getDragFlipSkipSet()
  const oldParent = dragState?.placeholderEl?.parentElement ?? null
  const affected = new Set<HTMLElement>([targetParent])
  if (oldParent) affected.add(oldParent)

  const snapshots = new Map<HTMLElement, Map<HTMLElement, DOMRect>>()
  for (const parent of affected) {
    snapshots.set(parent, snapshotRects(captureFlipTargets(parent, skip)))
  }

  mutate()

  for (const [parent, before] of snapshots) {
    if (parent.isConnected) applyFlip(parent, before, skip)
  }
}

function clearSiblingFlipTransforms() {
  if (!previewRoot.value) return
  const skip = dragState ? new Set(dragState.groupEls) : new Set<HTMLElement>()
  previewRoot.value.querySelectorAll('[data-el-i]').forEach((node) => {
    const el = node as HTMLElement
    if (skip.has(el)) return
    el.style.transition = ''
    el.style.transform = ''
  })
}

function setDragSessionActive(active: boolean) {
  previewRoot.value?.classList.toggle('editor-is-dragging', active)
}

interface DragFlowSnapshot {
  position: string
  left: string
  top: string
  width: string
  height: string
  margin: string
  flex: string
  minWidth: string
  minHeight: string
  maxWidth: string
  maxHeight: string
  transform: string
  zIndex: string
  opacity: string
  pointerEvents: string
  cursor: string
}

interface DragState {
  el: HTMLElement
  tagIndex: number
  groupIndices: number[]
  groupEls: HTMLElement[]
  groupOffsets: Map<HTMLElement, { x: number; y: number }>
  startX: number
  startY: number
  active: boolean
  floated: boolean
  dropTarget: DropTarget | null
  flowParentEl: HTMLElement | null
  flowParentWasStatic: boolean
  groupSnapshots: Map<HTMLElement, DragFlowSnapshot>
  placeholderEl: HTMLElement | null
  placeholderParentTagIndex: number | null
  placeholderInsertAt: number | null
  sourceParentTagIndex: number | null
  sourceInsertAt: number
  moveHandler: (e: PointerEvent) => void
  upHandler: (e: PointerEvent) => void
}

let dragState: DragState | null = null

function measureGroupSlot(
  groupEls: HTMLElement[],
  isRow: boolean,
  gapPx: number,
): { width: number; height: number } {
  if (groupEls.length === 0) return { width: 0, height: 0 }
  if (isRow) {
    let width = 0
    let height = 0
    for (let i = 0; i < groupEls.length; i++) {
      width += groupEls[i].offsetWidth
      if (i > 0) width += gapPx
      height = Math.max(height, groupEls[i].offsetHeight)
    }
    return { width: Math.max(1, width), height: Math.max(1, height) }
  }
  let width = 0
  let height = 0
  for (let i = 0; i < groupEls.length; i++) {
    height += groupEls[i].offsetHeight
    if (i > 0) height += gapPx
    width = Math.max(width, groupEls[i].offsetWidth)
  }
  return { width: Math.max(1, width), height: Math.max(1, height) }
}

function createDragPlaceholder(width: number, height: number): HTMLElement {
  const el = document.createElement('div')
  el.className = 'editor-drag-placeholder'
  el.setAttribute('data-drag-placeholder', '1')
  el.style.width = `${width}px`
  el.style.height = `${height}px`
  el.style.minWidth = `${width}px`
  el.style.minHeight = `${height}px`
  el.style.flexShrink = '0'
  el.style.boxSizing = 'border-box'
  el.style.pointerEvents = 'none'
  return el
}

function insertDragPlaceholder(
  parentEl: HTMLElement,
  remainingIndices: number[],
  insertAt: number,
  placeholder: HTMLElement,
) {
  if (remainingIndices.length === 0 || insertAt >= remainingIndices.length) {
    parentEl.appendChild(placeholder)
    return
  }
  const anchor = elByIndex(String(remainingIndices[insertAt]))
  if (anchor?.parentElement === parentEl) {
    parentEl.insertBefore(placeholder, anchor)
  } else {
    parentEl.appendChild(placeholder)
  }
}

/** 被拖元素在原父级子列表（排除自身后）中应占的插入下标 */
function sourceSlotInsertAt(allChildren: number[], excludeIndices: number[]): number {
  const exclude = new Set(excludeIndices)
  const positions = excludeIndices
    .map((idx) => allChildren.indexOf(idx))
    .filter((p) => p >= 0)
  if (positions.length === 0) return 0
  const firstPos = Math.min(...positions)
  let insertAt = 0
  for (let i = 0; i < firstPos; i++) {
    if (!exclude.has(allChildren[i])) insertAt++
  }
  return insertAt
}

function isGridLayoutContainerOnCode(code: string, tagIndex: number): boolean {
  const attrs = getTagAttrsFromCode(code, tagIndex)
  return (attrs.layout ?? 'none') === 'grid'
}

function isGridLayoutContainer(tagIndex: number): boolean {
  return isGridLayoutContainerOnCode(componentCode.value, tagIndex)
}

function insertSourceDragPlaceholder(
  parentTagIndex: number,
  excludeIndices: number[],
  groupEls: HTMLElement[],
): void {
  if (!dragState) return
  if (isGridLayoutContainer(parentTagIndex)) return
  const parentEl = elByIndex(String(parentTagIndex))
  if (!parentEl) return

  const allChildren = getDirectChildTagIndices(componentCode.value, parentTagIndex)
  const exclude = new Set(excludeIndices)
  const remaining = allChildren.filter((idx) => !exclude.has(idx))
  const insertAt = sourceSlotInsertAt(allChildren, excludeIndices)

  const style = getComputedStyle(parentEl)
  const isRow = (style.flexDirection || 'column').includes('row')
  const gapPx = parseFloat(isRow ? style.columnGap : style.rowGap) || 0
  const slot = measureGroupSlot(groupEls, isRow, gapPx)
  const placeholder = createDragPlaceholder(slot.width, slot.height)

  insertDragPlaceholder(parentEl, remaining, insertAt, placeholder)

  dragState.placeholderEl = placeholder
  dragState.placeholderParentTagIndex = parentTagIndex
  dragState.placeholderInsertAt = insertAt
  dragState.sourceParentTagIndex = parentTagIndex
  dragState.sourceInsertAt = insertAt
}

function repositionDragPlaceholder(
  target: DropTarget,
  excludeIndices: number[],
): void {
  if (!dragState?.placeholderEl) return

  const parentEl = elByIndex(String(target.parentTagIndex))
  if (!parentEl) return

  if (
    dragState.placeholderParentTagIndex === target.parentTagIndex
    && dragState.placeholderInsertAt === target.insertAt
  ) {
    return
  }

  const exclude = new Set(excludeIndices)
  const remaining = getDirectChildTagIndices(componentCode.value, target.parentTagIndex)
    .filter((idx) => !exclude.has(idx))
  const placeholder = dragState.placeholderEl

  flipOnPlaceholderMove(parentEl, () => {
    insertDragPlaceholder(parentEl, remaining, target.insertAt, placeholder)
  })

  dragState.placeholderParentTagIndex = target.parentTagIndex
  dragState.placeholderInsertAt = target.insertAt
}

function restoreDragPlaceholderToSource(excludeIndices: number[]): void {
  if (!dragState?.placeholderEl || dragState.sourceParentTagIndex === null) return
  repositionDragPlaceholder(
    {
      parentTagIndex: dragState.sourceParentTagIndex,
      insertAt: dragState.sourceInsertAt,
    },
    excludeIndices,
  )
}

function floatDragGroupOutOfFlow(
  parentEl: HTMLElement,
  groupEls: HTMLElement[],
  parentTagIndex: number,
  groupIndices: number[],
  anchorEl: HTMLElement,
  clientX: number,
  clientY: number,
) {
  if (!dragState || dragState.floated) return

  insertSourceDragPlaceholder(parentTagIndex, groupIndices, groupEls)

  const parentStyle = getComputedStyle(parentEl)
  dragState.flowParentEl = parentEl
  dragState.flowParentWasStatic = parentStyle.position === 'static'
  if (dragState.flowParentWasStatic) {
    parentEl.style.position = 'relative'
  }

  const parentRect = parentEl.getBoundingClientRect()
  const anchorRect = anchorEl.getBoundingClientRect()
  dragState.groupOffsets.clear()

  for (const ge of groupEls) {
    const rect = ge.getBoundingClientRect()
    const relX = rect.left - anchorRect.left
    const relY = rect.top - anchorRect.top
    dragState.groupOffsets.set(ge, { x: relX, y: relY })

    dragState.groupSnapshots.set(ge, {
      position: ge.style.position,
      left: ge.style.left,
      top: ge.style.top,
      width: ge.style.width,
      height: ge.style.height,
      margin: ge.style.margin,
      flex: ge.style.flex,
      minWidth: ge.style.minWidth,
      minHeight: ge.style.minHeight,
      maxWidth: ge.style.maxWidth,
      maxHeight: ge.style.maxHeight,
      transform: ge.style.transform,
      zIndex: ge.style.zIndex,
      opacity: ge.style.opacity,
      pointerEvents: ge.style.pointerEvents,
      cursor: ge.style.cursor,
    })

    ge.style.position = 'absolute'
    ge.style.left = `${clientX - parentRect.left + parentEl.scrollLeft + relX}px`
    ge.style.top = `${clientY - parentRect.top + parentEl.scrollTop + relY}px`
    ge.style.width = `${rect.width}px`
    ge.style.height = `${rect.height}px`
    ge.style.margin = '0'
    ge.style.flex = 'none'
    ge.style.minWidth = '0'
    ge.style.minHeight = '0'
    ge.style.maxWidth = 'none'
    ge.style.maxHeight = 'none'
    ge.style.transform = ''
    ge.style.transformOrigin = 'top left'
  }

  dragState.floated = true
}

function updateDragGroupPosition(clientX: number, clientY: number) {
  if (!dragState?.floated || !dragState.flowParentEl) return
  const parentEl = dragState.flowParentEl
  const parentRect = parentEl.getBoundingClientRect()
  const liftScale = dragMotionEnabled() ? ' scale(1.015)' : ''

  for (const ge of dragState.groupEls) {
    const off = dragState.groupOffsets.get(ge) ?? { x: 0, y: 0 }
    ge.style.left = `${clientX - parentRect.left + parentEl.scrollLeft + off.x}px`
    ge.style.top = `${clientY - parentRect.top + parentEl.scrollTop + off.y}px`
    ge.style.transform = liftScale
    ge.style.transformOrigin = 'top left'
  }
}

function removeDragPlaceholder() {
  if (!dragState?.placeholderEl) return
  dragState.placeholderEl.remove()
  dragState.placeholderEl = null
  dragState.placeholderParentTagIndex = null
  dragState.placeholderInsertAt = null
}

function restoreDragFlowLayout() {
  if (!dragState) return

  removeDragPlaceholder()

  for (const [ge, snap] of dragState.groupSnapshots) {
    ge.style.position = snap.position
    ge.style.left = snap.left
    ge.style.top = snap.top
    ge.style.width = snap.width
    ge.style.height = snap.height
    ge.style.margin = snap.margin
    ge.style.flex = snap.flex
    ge.style.minWidth = snap.minWidth
    ge.style.minHeight = snap.minHeight
    ge.style.maxWidth = snap.maxWidth
    ge.style.maxHeight = snap.maxHeight
    ge.style.transform = snap.transform
    ge.style.zIndex = snap.zIndex
    ge.style.opacity = snap.opacity
    ge.style.pointerEvents = snap.pointerEvents
    ge.style.cursor = snap.cursor
  }
  dragState.groupSnapshots.clear()

  if (dragState.flowParentEl && dragState.flowParentWasStatic) {
    dragState.flowParentEl.style.position = ''
  }
  dragState.flowParentEl = null
  dragState.floated = false
}

function updateGridElementDropPreview(target: DropTarget) {
  if (target.gridCol === undefined || target.gridRow === undefined) {
    gridElementDropPreview.value = null
    return
  }
  const parentEl = elByIndex(String(target.parentTagIndex))
  if (!parentEl) {
    gridElementDropPreview.value = null
    return
  }
  const rect = getGridCellViewportRect(parentEl, target.gridCol - 1, target.gridRow - 1)
  if (!rect) {
    gridElementDropPreview.value = null
    return
  }
  const tl = toOverlayLocal(rect.left, rect.top)
  const br = toOverlayLocal(rect.left + rect.width, rect.top + rect.height)
  gridElementDropPreview.value = {
    bandX: tl.x,
    bandY: tl.y,
    bandWidth: Math.max(1, br.x - tl.x),
    bandHeight: Math.max(1, br.y - tl.y),
  }
}

function updateDragFlowPreview(
  target: DropTarget,
  excludeIndices: number[],
) {
  if (!dragState?.floated) return
  if (isGridLayoutContainer(target.parentTagIndex)) {
    updateGridElementDropPreview(target)
    return
  }
  gridElementDropPreview.value = null
  repositionDragPlaceholder(target, excludeIndices)
}

function isPointerInContainerInterior(
  containerEl: HTMLElement,
  clientX: number,
  clientY: number,
  draggedTagIndex: number,
  excludeTagIndices: number[] = [],
): boolean {
  const exclude = new Set([draggedTagIndex, ...excludeTagIndices])
  for (const child of containerEl.children) {
    if (!(child instanceof HTMLElement) || !child.hasAttribute('data-el-i')) continue
    const childIdx = parseInt(child.getAttribute('data-el-i')!, 10)
    if (exclude.has(childIdx)) continue
    const r = child.getBoundingClientRect()
    if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
      return false
    }
  }
  const r = containerEl.getBoundingClientRect()
  return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom
}

function computeFlexInsertIndexAmongChildren(
  parentTagIndex: number,
  clientX: number,
  clientY: number,
  excludeTagIndices: number[] = [],
): number {
  const exclude = new Set(excludeTagIndices)
  const children = getDirectChildTagIndices(componentCode.value, parentTagIndex)
    .filter((idx) => !exclude.has(idx))
  const parentEl = elByIndex(String(parentTagIndex))
  if (!parentEl || children.length === 0) return 0

  const flexDir = getComputedStyle(parentEl).flexDirection || 'column'
  const isRow = flexDir.includes('row')
  const pointer = isRow ? clientX : clientY
  const parentRect = parentEl.getBoundingClientRect()

  const lastChildEl = elByIndex(String(children[children.length - 1]))
  if (lastChildEl) {
    const lr = lastChildEl.getBoundingClientRect()
    if (isRow) {
      if (pointer > lr.right && pointer <= parentRect.right) return children.length
    } else if (pointer > lr.bottom && pointer <= parentRect.bottom) {
      return children.length
    }
  }

  for (let i = 0; i < children.length; i++) {
    const sibEl = elByIndex(String(children[i]))
    if (!sibEl) continue
    const r = sibEl.getBoundingClientRect()
    const mid = isRow ? (r.left + r.right) / 2 : (r.top + r.bottom) / 2
    if (pointer < mid) return i
  }
  return children.length
}

function computeGridDropTarget(
  parentTagIndex: number,
  clientX: number,
  clientY: number,
  excludeTagIndices: number[] = [],
): DropTarget {
  const fallback: DropTarget = {
    parentTagIndex,
    insertAt: 0,
    gridCol: 1,
    gridRow: 1,
  }
  const parentEl = elByIndex(String(parentTagIndex))
  if (!parentEl) return fallback

  const hit = hitGridCellAtPoint(parentEl, clientX, clientY)
  if (!hit) return fallback

  const allChildren = getDirectChildTagIndices(componentCode.value, parentTagIndex)
  const excludeFlat = excludeTagIndices
    .map((idx) => allChildren.indexOf(idx))
    .filter((i) => i >= 0)

  const { columns, rows } = getGridTracksFromCode(componentCode.value, parentTagIndex)
  const colCount = Math.max(1, columns.length)
  const rowCount = inferGridMatrixRowCount(
    componentCode.value,
    allChildren,
    colCount,
    rows.length,
  )

  const matrix = buildGridPlacementMatrixFromCode(
    componentCode.value,
    allChildren,
    colCount,
    rowCount,
  )
  const insertAt = gridDomInsertAtForCell(matrix, hit.col, hit.row, excludeFlat)

  return {
    parentTagIndex,
    insertAt,
    gridCol: hit.col + 1,
    gridRow: hit.row + 1,
  }
}

function resolveChildrenDropTarget(
  parentTagIndex: number,
  clientX: number,
  clientY: number,
  excludeTagIndices: number[] = [],
): DropTarget {
  if (isGridLayoutContainer(parentTagIndex)) {
    return computeGridDropTarget(parentTagIndex, clientX, clientY, excludeTagIndices)
  }
  return {
    parentTagIndex,
    insertAt: computeFlexInsertIndexAmongChildren(
      parentTagIndex,
      clientX,
      clientY,
      excludeTagIndices,
    ),
  }
}

function isDragExcludedHit(
  hitIndex: number,
  draggedTagIndex: number,
  excludeTagIndices: number[],
): boolean {
  if (hitIndex === draggedTagIndex) return true
  if (excludeTagIndices.includes(hitIndex)) return true
  if (excludeTagIndices.some((idx) => isDescendantTag(componentCode.value, idx, hitIndex))) {
    return true
  }
  if (isDescendantTag(componentCode.value, draggedTagIndex, hitIndex)) return true
  return false
}

function resolveDropTargetFromHitEl(
  hitEl: HTMLElement,
  hitIndex: number,
  draggedTagIndex: number,
  clientX: number,
  clientY: number,
  excludeTagIndices: number[],
): DropTarget | null {
  const hitLoc = findTagLineInSource(componentCode.value, hitIndex)
  if (!hitLoc) return null

  if (isImportedComponentTag(componentCode.value, hitIndex)) {
    return null
  }

  let targetParent = getTagParentIndex(componentCode.value, hitIndex)

  if (
    isEditorStructuralContainer(componentCode.value, hitIndex)
    && isPointerInContainerInterior(hitEl, clientX, clientY, draggedTagIndex, excludeTagIndices)
  ) {
    targetParent = hitIndex
  }

  if (targetParent === null || !findTagLineInSource(componentCode.value, targetParent)) {
    return null
  }

  if (!isEditorStructuralContainer(componentCode.value, targetParent)) return null

  return resolveChildrenDropTarget(targetParent, clientX, clientY, excludeTagIndices)
}

function resolveDropTarget(
  draggedTagIndex: number,
  clientX: number,
  clientY: number,
  excludeTagIndices: number[] = [],
): DropTarget | null {
  if (getTagParentIndex(componentCode.value, draggedTagIndex) === null) return null

  for (const node of document.elementsFromPoint(clientX, clientY)) {
    if (!(node instanceof HTMLElement)) continue
    if (!previewRoot.value?.contains(node)) continue

    const hitEl = node.closest('[data-el-i]') as HTMLElement | null
    if (!hitEl) continue

    const hitIndex = parseInt(hitEl.getAttribute('data-el-i')!, 10)
    if (Number.isNaN(hitIndex)) continue
    if (isDragExcludedHit(hitIndex, draggedTagIndex, excludeTagIndices)) continue

    return resolveDropTargetFromHitEl(
      hitEl,
      hitIndex,
      draggedTagIndex,
      clientX,
      clientY,
      excludeTagIndices,
    )
  }

  return null
}

function clearDropTargetHighlight() {
  if (dropTargetParentId.value !== null) {
    elByIndex(dropTargetParentId.value.replace('el-', ''))?.classList.remove('el-drop-target')
    dropTargetParentId.value = null
  }
}

function setDropTargetHighlight(parentTagIndex: number) {
  const id = `el-${parentTagIndex}`
  if (dropTargetParentId.value === id) return
  clearDropTargetHighlight()
  dropTargetParentId.value = id
  elByIndex(String(parentTagIndex))?.classList.add('el-drop-target')
}

function stopElementDrag() {
  if (!dragState) return
  const { groupEls, moveHandler, upHandler } = dragState
  document.removeEventListener('pointermove', moveHandler)
  document.removeEventListener('pointerup', upHandler)
  clearSiblingFlipTransforms()
  restoreDragFlowLayout()
  for (const ge of groupEls) {
    ge.classList.remove('editor-drag-lift')
    ge.style.transform = ''
    ge.style.transformOrigin = ''
    ge.style.opacity = ''
    ge.style.zIndex = ''
    ge.style.pointerEvents = ''
    ge.style.cursor = ''
    ge.querySelectorAll('[data-el-i]').forEach((node) => {
      ;(node as HTMLElement).style.pointerEvents = ''
    })
  }
  setDragSessionActive(false)
  elementDragActive.value = false
  dragState = null
  clearDropTargetHighlight()
  gridElementDropPreview.value = null
}

function getDragGroupIndices(tagIndex: number): number[] {
  if (selectedIds.value.size <= 1) return [tagIndex]
  const parent = getTagParentIndex(componentCode.value, tagIndex)
  if (parent === null) return [tagIndex]

  const raw: number[] = []
  for (const id of selectedIds.value) {
    const n = parseInt(id.replace('el-', ''), 10)
    if (!Number.isNaN(n)) raw.push(n)
  }
  const filtered = raw.filter(
    (i) => !raw.some((j) => j !== i && isDescendantTag(componentCode.value, j, i)),
  )
  const siblings = filtered
    .filter((idx) => getTagParentIndex(componentCode.value, idx) === parent)
    .sort((a, b) => {
      return findTagLineInSource(componentCode.value, a)!.lineIndex
        - findTagLineInSource(componentCode.value, b)!.lineIndex
    })
  if (!siblings.includes(tagIndex) || siblings.length <= 1) return [tagIndex]
  return siblings
}

function restoreSelectionIndices(indices: number[]) {
  if (indices.length === 0) return
  selectedIds.value = new Set(indices.map((i) => `el-${i}`))
  selectedId.value = `el-${indices[indices.length - 1]}`
}

function startElementDrag(e: PointerEvent, el: HTMLElement, idx: string) {
  if (editingIndex !== null || resizeActive.value || spacingActive.value) return
  const tagIndex = parseInt(idx, 10)
  if (getTagParentIndex(componentCode.value, tagIndex) === null) return

  stopElementDrag()

  const groupIndices = getDragGroupIndices(tagIndex)
  const groupEls = groupIndices
    .map((i) => elByIndex(String(i)))
    .filter((node): node is HTMLElement => node !== null)
  if (groupEls.length === 0) return

  const startX = e.clientX
  const startY = e.clientY
  const savedSizes = groupIndices.map((i) => {
    const node = elByIndex(String(i))
    return { i, w: node?.offsetWidth ?? 0, h: node?.offsetHeight ?? 0 }
  })

  const moveHandler = (move: PointerEvent) => {
    if (!dragState) return
    const dx = move.clientX - startX
    const dy = move.clientY - startY

    if (!dragState.active) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return
      dragState.active = true
      elementDragActive.value = true
      pointerOverSelected.value = false
      const parentIdx = getTagParentIndex(componentCode.value, tagIndex)
      const flowParent = parentIdx !== null ? elByIndex(String(parentIdx)) : null
      if (flowParent && parentIdx !== null) {
        floatDragGroupOutOfFlow(
          flowParent,
          dragState.groupEls,
          parentIdx,
          dragState.groupIndices,
          dragState.el,
          move.clientX,
          move.clientY,
        )
      }
      setDragSessionActive(true)
      for (const ge of dragState.groupEls) {
        ge.classList.add('editor-drag-lift')
        ge.style.zIndex = '1000'
        ge.style.pointerEvents = 'none'
        ge.querySelectorAll('[data-el-i]').forEach((node) => {
          ;(node as HTMLElement).style.pointerEvents = 'none'
        })
      }
    }

    if (dragState.floated) {
      updateDragGroupPosition(move.clientX, move.clientY)
    } else {
      const liftScale = dragState.active && dragMotionEnabled() ? ' scale(1.015)' : ''
      for (const ge of dragState.groupEls) {
        ge.style.transform = `translate(${dx}px, ${dy}px)${liftScale}`
        ge.style.transformOrigin = 'top left'
      }
    }
    const target = resolveDropTarget(
      tagIndex,
      move.clientX,
      move.clientY,
      dragState.groupIndices,
    )
    dragState.dropTarget = target
    if (target) {
      setDropTargetHighlight(target.parentTagIndex)
      updateDragFlowPreview(target, dragState.groupIndices)
    } else {
      clearDropTargetHighlight()
      restoreDragPlaceholderToSource(dragState.groupIndices)
      gridElementDropPreview.value = null
    }
  }

  const upHandler = () => {
    if (!dragState) return
    const { active, dropTarget, groupIndices: group } = dragState
    const oldParent = getTagParentIndex(componentCode.value, tagIndex)
    stopElementDrag()

    if (!active || !dropTarget) return

    const gridParent =
      dropTarget.gridCol !== undefined
      && dropTarget.gridRow !== undefined
      && isGridLayoutContainer(dropTarget.parentTagIndex)
        ? dropTarget.parentTagIndex
        : null

    let newCode = componentCode.value
    let movedIndices: number[]

    if (gridParent !== null) {
      const crossContainer = oldParent !== gridParent

      if (crossContainer) {
        const appendAt = getDirectChildTagIndices(componentCode.value, gridParent)
          .filter((idx) => !group.includes(idx)).length
        const result = group.length > 1
          ? moveTagGroupToParent(componentCode.value, group, gridParent, appendAt)
          : moveTagToParent(componentCode.value, tagIndex, gridParent, appendAt)
        if (!result) return
        newCode = result.code
        movedIndices = group.length > 1
          ? (result as { movedTagIndices: number[] }).movedTagIndices
          : [(result as { movedTagIndex: number }).movedTagIndex]

        for (let i = 0; i < movedIndices.length; i++) {
          const movedIdx = movedIndices[i]
          const size = savedSizes.find((s) => s.i === group[i]) ?? savedSizes[i]
          if (!size || !canResizeTag(newCode, movedIdx)) continue
          const patched = patchPreserveVisualSize(newCode, movedIdx, size.w, size.h)
          if (patched) newCode = patched
        }
        if (oldParent !== null && isGridLayoutContainer(oldParent)) {
          for (const movedIdx of movedIndices) {
            newCode = patchChildClearGridPlacement(newCode, movedIdx) ?? newCode
          }
        }
      } else {
        movedIndices = [...group]
      }

      const gridCommit = commitGridCoordinateDrop(
        newCode,
        gridParent,
        movedIndices,
        dropTarget.gridCol!,
        dropTarget.gridRow!,
      )
      onCodeChange(gridCommit.code)
      nextTick(() => restoreSelectionIndices(gridCommit.movedTagIndices))
      return
    }

    const result = group.length > 1
      ? moveTagGroupToParent(
          componentCode.value,
          group,
          dropTarget.parentTagIndex,
          dropTarget.insertAt,
        )
      : moveTagToParent(
          componentCode.value,
          tagIndex,
          dropTarget.parentTagIndex,
          dropTarget.insertAt,
        )
    if (!result) return

    newCode = result.code
    movedIndices = group.length > 1
      ? (result as { movedTagIndices: number[] }).movedTagIndices
      : [(result as { movedTagIndex: number }).movedTagIndex]

    const crossContainer = oldParent !== dropTarget.parentTagIndex
    if (crossContainer) {
      for (let i = 0; i < movedIndices.length; i++) {
        const movedIdx = movedIndices[i]
        const size = savedSizes.find((s) => s.i === group[i]) ?? savedSizes[i]
        if (!size || !canResizeTag(newCode, movedIdx)) continue
        const patched = patchPreserveVisualSize(newCode, movedIdx, size.w, size.h)
        if (patched) newCode = patched
      }
      if (
        oldParent !== null
        && isGridLayoutContainer(oldParent)
        && !isGridLayoutContainer(dropTarget.parentTagIndex)
      ) {
        for (const movedIdx of movedIndices) {
          newCode = patchChildClearGridPlacement(newCode, movedIdx) ?? newCode
        }
      }
    }

    onCodeChange(newCode)
    nextTick(() => restoreSelectionIndices(movedIndices))
  }

  dragState = {
    el,
    tagIndex,
    groupIndices,
    groupEls,
    groupOffsets: new Map(),
    startX,
    startY,
    active: false,
    floated: false,
    dropTarget: null,
    flowParentEl: null,
    flowParentWasStatic: false,
    groupSnapshots: new Map(),
    placeholderEl: null,
    placeholderParentTagIndex: null,
    placeholderInsertAt: null,
    sourceParentTagIndex: null,
    sourceInsertAt: 0,
    moveHandler,
    upHandler,
  }
  document.addEventListener('pointermove', moveHandler)
  document.addEventListener('pointerup', upHandler)
}

// ── 八向手柄缩放 ──
interface CanvasRect { x: number; y: number; width: number; height: number }

interface ResizeState {
  handle: HandleId
  tagIndex: number
  el: HTMLElement
  startX: number
  startY: number
  startW: number
  startH: number
  lastW: number
  lastH: number
  lastRawW: number
  lastRawH: number
  limitsW: ReturnType<typeof getAxisLimits>
  limitsH: ReturnType<typeof getAxisLimits>
  ruler: ElasticRulerContext | null
  widthZones: ElasticRulerZoneView[] | null
  heightZones: ElasticRulerZoneView[] | null
  moveHandler: (e: PointerEvent) => void
  upHandler: (e: PointerEvent) => void
}

const resizeActive = ref(false)
const extremeBands = ref<ExtremeBandsView | null>(null)
const elasticSnapGuides = ref<ElasticSnapGuidesView | null>(null)
const extremeBandFocus = ref<'width-min' | 'width-max' | 'height-min' | 'height-max' | null>(null)
const resizeTooltip = ref<{ x: number; y: number; text: string } | null>(null)
let resizeState: ResizeState | null = null

function clearExtremeBands() {
  extremeBands.value = null
}

const showResizeHandles = computed(() => {
  if (activeTool.value !== 'select') return false
  if (!selectedId.value || selectedIds.value.size !== 1) return false
  const idx = parseInt(selectedId.value.replace('el-', ''), 10)
  return canResizeTag(componentCode.value, idx)
})

function getOverlayRootEl(): HTMLElement | null {
  return overlayRootRef.value ?? canvasRef.value
}

/** 将屏幕坐标转为 overlay 本地坐标（与 SelectionOverlay 同一原点） */
function toOverlayLocal(clientX: number, clientY: number): { x: number; y: number } {
  const root = getOverlayRootEl()
  if (!root) return { x: clientX, y: clientY }
  const rr = root.getBoundingClientRect()
  return { x: clientX - rr.left, y: clientY - rr.top }
}

function getElementOverlayRect(el: HTMLElement): CanvasRect | null {
  const root = getOverlayRootEl()
  if (!root) return null
  const rr = root.getBoundingClientRect()
  const er = el.getBoundingClientRect()
  return {
    x: er.left - rr.left,
    y: er.top - rr.top,
    width: er.width,
    height: er.height,
  }
}

/** 根容器 fill / 极值带参照区：画布 content 区换算到 overlay 坐标 */
function getOverlayContentRect(): CanvasRect | null {
  const root = getOverlayRootEl()
  const content = getCanvasContentRect()
  if (!root || !canvasRef.value || !content) return null
  const rr = root.getBoundingClientRect()
  const cr = canvasRef.value.getBoundingClientRect()
  return {
    x: cr.left + content.x - rr.left,
    y: cr.top + content.y - rr.top,
    width: content.width,
    height: content.height,
  }
}

function getResizeParentEl(el: HTMLElement): HTMLElement | null {
  const parent = el.parentElement
  if (!parent || parent === previewRoot.value) return null
  return parent
}

function getCanvasContentRect(): CanvasRect | null {
  if (!canvasRef.value) return null
  const { top, right, bottom, left } = EDIT_STAGE_INSET
  return {
    x: left,
    y: top,
    width: canvasRef.value.clientWidth - left - right,
    height: canvasRef.value.clientHeight - top - bottom,
  }
}

function getResizeParentFallback(): { width: number; height: number } | undefined {
  const rect = getCanvasContentRect()
  if (!rect) return undefined
  return { width: rect.width, height: rect.height }
}

function applyResizePreview(el: HTMLElement, w: number, h: number) {
  if (el.tagName === 'SPAN') {
    el.style.display = 'inline-block'
  } else {
    el.style.flex = '0 0 auto'
  }
  el.style.width = `${w}px`
  el.style.height = `${h}px`
  el.style.maxWidth = 'none'
  el.style.maxHeight = 'none'
}

function clearResizePreview(el: HTMLElement) {
  el.style.flex = ''
  el.style.display = ''
  el.style.width = ''
  el.style.height = ''
  el.style.maxWidth = ''
  el.style.maxHeight = ''
}

function stopResize(commit: boolean) {
  if (!resizeState) return
  const {
    el,
    moveHandler,
    upHandler,
    tagIndex,
    handle,
    lastW,
    lastH,
    limitsW,
    limitsH,
  } = resizeState

  document.removeEventListener('pointermove', moveHandler)
  document.removeEventListener('pointerup', upHandler)

  if (commit) {
    clearResizePreview(el)

    if (isSpanTag(componentCode.value, tagIndex)) {
      const parentEl = getResizeParentEl(el)
      const result = detectResizeModesFull(
        handle,
        resizeState.lastRawW,
        resizeState.lastRawH,
        el,
        parentEl,
        componentCode.value,
        tagIndex,
        limitsW,
        limitsH,
        parentEl ? undefined : getResizeParentFallback(),
      )
      const patch = buildResizePatch(componentCode.value, tagIndex, result)
      const newCode = patchTagAttributes(componentCode.value, tagIndex, patch)
      if (newCode) onCodeChange(newCode)
    } else {
      const parentEl = getResizeParentEl(el)
      const ruler = resizeState.ruler
      let result: import('../modules/editor/resizeLogic').ResizeModeResult
      if (ruler) {
        const attrs = getTagAttrsFromCode(componentCode.value, tagIndex)
        result = detectResizeModesFromRuler(
          handle,
          resizeState.lastRawW,
          resizeState.lastRawH,
          ruler,
          limitsW,
          limitsH,
          (attrs['width-mode'] ?? 'fill') as SizeMode,
          (attrs['height-mode'] ?? 'hug') as SizeMode,
        )
      } else {
        result = detectResizeModesFull(
          handle,
          lastW,
          lastH,
          el,
          parentEl,
          componentCode.value,
          tagIndex,
          limitsW,
          limitsH,
          parentEl ? undefined : getResizeParentFallback(),
        )
      }
      const patch = buildResizePatch(componentCode.value, tagIndex, result)
      const newCode = patchTagAttributes(componentCode.value, tagIndex, patch)
      if (newCode) onCodeChange(newCode)
    }
  } else {
    clearResizePreview(el)
  }
  resizeState = null
  resizeActive.value = false
  clearExtremeBands()
  elasticSnapGuides.value = null
  resizeTooltip.value = null
}

function onResizeStart(handle: HandleId, e: PointerEvent) {
  if (activeTool.value !== 'select') return
  if (editingIndex !== null || !selectedId.value) return

  stopElementDrag()
  stopResize(false)
  stopSpacing(false)
  stopGridTrackDrag(false)

  const tagIndex = parseInt(selectedId.value.replace('el-', ''), 10)
  if (!canResizeTag(componentCode.value, tagIndex)) return

  const el = elByIndex(String(tagIndex))
  if (!el) return

  e.preventDefault()
  e.stopPropagation()

  const resizeEl = el
  const startW = el.offsetWidth
  const startH = el.offsetHeight
  const limitsW = getAxisLimits(componentCode.value, tagIndex, 'width')
  const limitsH = getAxisLimits(componentCode.value, tagIndex, 'height')

  const parentEl = getResizeParentEl(el)
  const elRect = getElementOverlayRect(el)
  const parentRect = parentEl ? getElementOverlayRect(parentEl) : getOverlayContentRect()

  function syncExtremeBandsFromPreview() {
    const previewRect = getElementOverlayRect(resizeEl)
    if (previewRect) {
      extremeBands.value = computeExtremeBands(previewRect, parentRect, limitsW, limitsH)
    }
  }

  syncExtremeBandsFromPreview()
  resizeActive.value = true
  elasticSnapGuides.value = null

  const parentFallback = parentEl ? undefined : getResizeParentFallback()
  const isSpan = isSpanTag(componentCode.value, tagIndex)
  const ruler: ElasticRulerContext | null = isSpan
    ? null
    : captureElasticRulerContext(handle, resizeEl, parentEl, parentFallback)
  const widthZones = ruler?.width ? buildRulerZones() : null
  const heightZones = ruler?.height ? buildRulerZones() : null

  let lastW = startW
  let lastH = startH

  const moveHandler = (move: PointerEvent) => {
    if (!resizeState) return
    const dx = move.clientX - resizeState.startX
    const dy = move.clientY - resizeState.startY
    const rawPreview = computeResizePreview(
      handle,
      startW,
      startH,
      dx,
      dy,
      limitsW,
      limitsH,
      ruler || isSpanTag(componentCode.value, tagIndex) ? { clampToLimits: false } : undefined,
    )

    const pt = toOverlayLocal(move.clientX, move.clientY)
    const bubbleX = pt.x
    const bubbleY = pt.y

    if (ruler) {
      const attrs = getTagAttrsFromCode(componentCode.value, tagIndex)
      const result = detectResizeModesFromRuler(
        handle,
        rawPreview.width,
        rawPreview.height,
        ruler,
        limitsW,
        limitsH,
        (attrs['width-mode'] ?? 'fill') as SizeMode,
        (attrs['height-mode'] ?? 'hug') as SizeMode,
      )
      lastW = result.width
      lastH = result.height
      resizeState.lastW = lastW
      resizeState.lastH = lastH
      resizeState.lastRawW = rawPreview.width
      resizeState.lastRawH = rawPreview.height
      applyResizePreview(resizeEl, lastW, lastH)

      const previewRect = getElementOverlayRect(resizeEl)
      if (elasticSnapGuides.value && previewRect) {
        elasticSnapGuides.value = updateElasticRulerGuides(
          elasticSnapGuides.value,
          ruler,
          rawPreview.width,
          rawPreview.height,
          limitsW,
          limitsH,
          previewRect,
        )
      }

      syncExtremeBandsFromPreview()
      resizeTooltip.value = null
      return
    }

    const result = detectResizeModesFull(
      handle,
      rawPreview.width,
      rawPreview.height,
      resizeEl,
      parentEl,
      componentCode.value,
      tagIndex,
      limitsW,
      limitsH,
      parentFallback,
    )
    lastW = result.width
    lastH = result.height
    resizeState.lastW = lastW
    resizeState.lastH = lastH
    resizeState.lastRawW = rawPreview.width
    resizeState.lastRawH = rawPreview.height
    applyResizePreview(resizeEl, lastW, lastH)
    syncExtremeBandsFromPreview()

    resizeTooltip.value = result.tooltip
      ? { x: bubbleX, y: bubbleY, text: result.tooltip }
      : null
  }

  const upHandler = () => stopResize(true)

  if (ruler && elRect) {
    elasticSnapGuides.value = createElasticRulerGuides(
      ruler,
      startW,
      startH,
      limitsW,
      limitsH,
      elRect,
      widthZones,
      heightZones,
    )
  }

  resizeState = {
    handle,
    tagIndex,
    el: resizeEl,
    startX: e.clientX,
    startY: e.clientY,
    startW,
    startH,
    lastW,
    lastH,
    lastRawW: startW,
    lastRawH: startH,
    limitsW,
    limitsH,
    ruler,
    widthZones,
    heightZones,
    moveHandler,
    upHandler,
  }
  document.addEventListener('pointermove', moveHandler)
  document.addEventListener('pointerup', upHandler)
}

// ── 布局间距拖拽（gap / padding / 圆角）──
interface SpacingState {
  kind: 'gap' | 'padding' | 'radius'
  tagIndex: number
  el: HTMLElement
  axis?: GapAxis
  gapIndex?: number
  edge?: PaddingEdge
  paddingMode?: PaddingDragMode
  paddingLinkMode?: PaddingLinkMode
  radiusCorner?: RadiusCornerIndex
  radiusLinked?: boolean
  startX: number
  startY: number
  handleAnchorX: number
  handleAnchorY: number
  startValue: number | [number, number, number, number] | BorderRadiusCorners
  lastValue: number | [number, number, number, number] | BorderRadiusCorners
  moveHandler: (e: PointerEvent) => void
  upHandler: (e: PointerEvent) => void
}

const spacingActive = ref(false)
const spacingDragHint = ref<{
  kind: 'padding' | 'gap' | 'radius'
  edge?: PaddingEdge
  axis?: GapAxis
  mode?: PaddingDragMode
  radiusCorner?: RadiusCornerIndex
  radiusLinked?: boolean
} | null>(null)
const spacingTooltip = ref<{ x: number; y: number; text: string; kind: 'padding' | 'gap' | 'radius' } | null>(null)
const gapDragPreview = ref<{ axis: GapAxis; gapIndex: number; x: number; y: number } | null>(null)
const gridTrackDragPreview = ref<GridTrackDragPreview | null>(null)
let spacingState: SpacingState | null = null

function clearSpacingPreview(el: HTMLElement) {
  el.style.columnGap = ''
  el.style.rowGap = ''
  el.style.padding = ''
  el.style.borderRadius = ''
}

function stopSpacing(commit: boolean) {
  if (!spacingState) return
  const { el, moveHandler, upHandler, tagIndex, kind, lastValue } = spacingState

  document.removeEventListener('pointermove', moveHandler)
  document.removeEventListener('pointerup', upHandler)

  if (commit) {
    clearSpacingPreview(el)
    let newCode: string | null = null
    let patch: Record<string, import('../modules/editor/attrPatch').AttrEntry> | null = null
    const { axis } = spacingState
    if (kind === 'gap' && typeof lastValue === 'number' && axis) {
      patch = buildGapPatch(axis, lastValue)
    } else if (kind === 'padding' && Array.isArray(lastValue)) {
      if (isSpanTag(componentCode.value, tagIndex)) {
        newCode = patchSpanPadding(
          componentCode.value,
          tagIndex,
          lastValue as [number, number, number, number],
        )
      } else {
        patch = {
          padding: {
            value: formatPaddingAttr(lastValue as [number, number, number, number]),
            dynamic: true,
          },
        }
      }
    } else if (kind === 'radius' && Array.isArray(lastValue)) {
      patch = buildBorderRadiusPatch(
        lastValue as BorderRadiusCorners,
        spacingState.radiusLinked ?? true,
      )
    }
    if (!newCode && patch) {
      newCode = patchTagAttributes(componentCode.value, tagIndex, patch)
    }
    if (newCode) onCodeChange(newCode)
  } else {
    clearSpacingPreview(el)
  }

  spacingState = null
  spacingActive.value = false
  spacingDragHint.value = null
  spacingTooltip.value = null
  gapDragPreview.value = null
}

interface GridTrackDragState {
  tagIndex: number
  axis: 'column' | 'row'
  fromIndex: number
  dropIndex: number
  pointerId: number
  captureEl: HTMLElement
  startX: number
  startY: number
  moveHandler: (e: PointerEvent) => void
  upHandler: (e: PointerEvent) => void
}

let gridTrackDragState: GridTrackDragState | null = null

function commitGridTrackReorder(
  tagIndex: number,
  axis: 'column' | 'row',
  fromIndex: number,
  dropIndex: number,
) {
  let code = componentCode.value
  const { columns, rows } = getGridTracksFromCode(code, tagIndex)
  const colCount = Math.max(1, columns.length)
  const children = getDirectChildTagIndices(code, tagIndex)
  const rowCount = inferGridMatrixRowCount(code, children, colCount, rows.length)

  if (axis === 'column') {
    if (colCount < 2) return

    const matrix = buildGridPlacementMatrixFromCode(code, children, colCount, rowCount)
    const movedMatrix = moveGridPlacementMatrixColumns(matrix, fromIndex, dropIndex)
    const nextCols = moveGridTracks(columns, fromIndex, dropIndex)
    const patch = {
      ...buildGridTrackPatch('column', nextCols),
      cols: { value: String(nextCols.length), dynamic: false },
    }
    code = patchTagAttributes(code, tagIndex, patch) ?? code
    code = applyGridMatrixToCode(code, tagIndex, movedMatrix, []).code
    onCodeChange(code)
    return
  }

  const effectiveRowCount = inferGridMatrixRowCount(code, children, colCount, rows.length)
  if (effectiveRowCount < 2) return

  const matrix = buildGridPlacementMatrixFromCode(code, children, colCount, effectiveRowCount)
  const movedMatrix = moveGridPlacementMatrixRows(matrix, fromIndex, dropIndex)

  if (rows.length > 0) {
    const nextRows = moveGridTracks(rows, fromIndex, dropIndex)
    const patch = {
      ...buildGridTrackPatch('row', nextRows),
      rows: { value: String(nextRows.length), dynamic: false },
    }
    code = patchTagAttributes(code, tagIndex, patch) ?? code
  }

  code = applyGridMatrixToCode(code, tagIndex, movedMatrix, []).code
  onCodeChange(code)
}

function stopGridTrackDrag(commit: boolean) {
  if (!gridTrackDragState) return
  const { tagIndex, axis, fromIndex, dropIndex, pointerId, captureEl, moveHandler, upHandler } =
    gridTrackDragState
  document.removeEventListener('pointermove', moveHandler)
  document.removeEventListener('pointerup', upHandler)
  document.removeEventListener('pointercancel', upHandler)
  try {
    captureEl.releasePointerCapture(pointerId)
  } catch {
    /* ignore */
  }

  if (commit && fromIndex !== dropIndex) {
    commitGridTrackReorder(tagIndex, axis, fromIndex, dropIndex)
  }

  gridTrackDragState = null
  gridTrackDragPreview.value = null
}

function onGridTrackDragStart(axis: 'column' | 'row', index: number, e: PointerEvent) {
  if (activeTool.value !== 'select' || editingIndex !== null || !selectedId.value) return
  stopElementDrag()
  stopResize(false)
  stopSpacing(false)
  stopGridTrackDrag(false)
  stopGridTrackDrag(false)

  const tagIndex = parseInt(selectedId.value.replace('el-', ''), 10)
  if (!canEditLayoutSpacing(componentCode.value, tagIndex)) return
  const attrs = getTagAttrsFromCode(componentCode.value, tagIndex)
  if ((attrs.layout ?? 'none') !== 'grid') return

  const el = elByIndex(String(tagIndex))
  const root = getOverlayRootEl()
  if (!el || !root) return

  e.preventDefault()
  e.stopPropagation()

  const tracks = getGridTracksFromCode(componentCode.value, tagIndex)
  const cr = root.getBoundingClientRect()
  const capsules = computeGridTrackCapsules(
    el,
    cr,
    tracks.columns,
    tracks.rows,
  )
  const list = axis === 'column' ? capsules.columns : capsules.rows
  if (list.length < 2) return

  const captureEl = e.currentTarget as HTMLElement
  let dropIndex = index

  const moveHandler = (move: PointerEvent) => {
    if (!gridTrackDragState) return
    const pt = toOverlayLocal(move.clientX, move.clientY)
    dropIndex = resolveGridTrackDropIndex(axis, pt.x, pt.y, list)
    gridTrackDragState.dropIndex = dropIndex
    gridTrackDragPreview.value = buildGridTrackDragPreview(axis, index, dropIndex, list)
  }

  const upHandler = (up: PointerEvent) => {
    if (up.pointerId !== e.pointerId) return
    stopGridTrackDrag(true)
  }

  gridTrackDragState = {
    tagIndex,
    axis,
    fromIndex: index,
    dropIndex: index,
    pointerId: e.pointerId,
    captureEl,
    startX: e.clientX,
    startY: e.clientY,
    moveHandler,
    upHandler,
  }
  captureEl.setPointerCapture(e.pointerId)
  document.addEventListener('pointermove', moveHandler)
  document.addEventListener('pointerup', upHandler)
  document.addEventListener('pointercancel', upHandler)
  moveHandler(e)
}

function onGridTrackSizeChange(
  axis: 'column' | 'row',
  index: number,
  mode: GridTrackSizeMode,
  value: number,
) {
  if (!selectedId.value) return
  const tagIndex = parseInt(selectedId.value.replace('el-', ''), 10)
  if (Number.isNaN(tagIndex)) return

  const { columns, rows } = getGridTracksFromCode(componentCode.value, tagIndex)
  const prev = axis === 'column' ? columns[index] : rows[index]
  const state = applyGridTrackStateFromEditor(mode, value, prev)

  if (axis === 'column') {
    const next = [...columns]
    while (next.length <= index) next.push({ mode: 'fill', value: 1 })
    next[index] = state
    const patch = {
      ...buildGridTrackPatch('column', next),
      cols: { value: String(next.length), dynamic: false },
    }
    const newCode = patchTagAttributes(componentCode.value, tagIndex, patch)
    if (newCode) onCodeChange(newCode)
    return
  }

  const next = rows.length ? [...rows] : [{ mode: 'hug' as const, value: 0 }]
  while (next.length <= index) next.push({ mode: 'hug', value: 0 })
  next[index] = state
  const patch = {
    ...buildGridTrackPatch('row', next),
    rows: { value: String(next.length), dynamic: false },
  }
  const newCode = patchTagAttributes(componentCode.value, tagIndex, patch)
  if (newCode) onCodeChange(newCode)
}

function onGapDragStart(axis: GapAxis, gapIndex: number, handleX: number, handleY: number, e: PointerEvent) {
  if (activeTool.value !== 'select' || editingIndex !== null || !selectedId.value) return
  stopElementDrag()
  stopResize(false)
  stopSpacing(false)
  stopGridTrackDrag(false)

  const tagIndex = parseInt(selectedId.value.replace('el-', ''), 10)
  if (!canEditLayoutSpacing(componentCode.value, tagIndex)) return
  const el = elByIndex(String(tagIndex))
  if (!el) return

  e.preventDefault()
  e.stopPropagation()

  const attrs = getSpacingAttrs(componentCode.value, tagIndex)
  const startValue = axis === 'column' ? attrs.columnGap : attrs.rowGap
  let lastValue = startValue

  gapDragPreview.value = { axis, gapIndex, x: handleX, y: handleY }

  const moveHandler = (move: PointerEvent) => {
    if (!spacingState) return
    const delta = axis === 'column' ? move.clientX - spacingState.startX : move.clientY - spacingState.startY
    lastValue = clampSpacing(startValue + delta)
    spacingState.lastValue = lastValue
    if (axis === 'column') el.style.columnGap = `${lastValue}px`
    else el.style.rowGap = `${lastValue}px`

    const pt = toOverlayLocal(move.clientX, move.clientY)
    if (axis === 'column') {
      gapDragPreview.value = {
        axis,
        gapIndex,
        x: pt.x,
        y: spacingState.handleAnchorY,
      }
    } else {
      gapDragPreview.value = {
        axis,
        gapIndex,
        x: spacingState.handleAnchorX,
        y: pt.y,
      }
    }

    const label = axis === 'column' ? 'column-gap' : 'row-gap'
    spacingTooltip.value = {
      x: pt.x,
      y: pt.y,
      text: `${label}: ${lastValue}px`,
      kind: 'gap',
    }
  }

  const upHandler = () => stopSpacing(true)

  spacingActive.value = true
  spacingDragHint.value = { kind: 'gap', axis }
  spacingState = {
    kind: 'gap',
    tagIndex,
    el,
    axis,
    gapIndex,
    startX: e.clientX,
    startY: e.clientY,
    handleAnchorX: handleX,
    handleAnchorY: handleY,
    startValue,
    lastValue,
    moveHandler,
    upHandler,
  }
  document.addEventListener('pointermove', moveHandler)
  document.addEventListener('pointerup', upHandler)
}

function onPaddingDragStart(edge: PaddingEdge, e: PointerEvent) {
  if (activeTool.value !== 'select' || editingIndex !== null || !selectedId.value) return
  stopElementDrag()
  stopResize(false)
  stopSpacing(false)
  stopGridTrackDrag(false)

  const tagIndex = parseInt(selectedId.value.replace('el-', ''), 10)
  if (!canShowSpacingHandles(componentCode.value, tagIndex)) return
  const el = elByIndex(String(tagIndex))
  if (!el) return

  e.preventDefault()
  e.stopPropagation()

  const attrs = getSpacingAttrs(componentCode.value, tagIndex)
  const startPadding = [...attrs.padding] as [number, number, number, number]
  let lastPadding = [...startPadding] as [number, number, number, number]
  const paddingLinkMode = getStoredPaddingLinkMode(selectedId.value, startPadding)

  if (isSpanTag(componentCode.value, tagIndex) && !el.style.display) {
    el.style.display = 'inline-block'
  }

  let paddingMode: PaddingDragMode =
    edge === 's' || edge === 'e'
      ? getPaddingDragMode(componentCode.value, tagIndex, el, edge)
      : 'compress'

  const moveHandler = (move: PointerEvent) => {
    if (!spacingState) return
    if (edge === 's' || edge === 'e') {
      paddingMode = getPaddingDragMode(componentCode.value, tagIndex, el, edge)
      spacingState.paddingMode = paddingMode
      spacingDragHint.value = { kind: 'padding', edge, mode: paddingMode }
    }
    const dx = move.clientX - spacingState.startX
    const dy = move.clientY - spacingState.startY
    const delta = paddingDeltaFromDrag(edge, dx, dy, paddingMode)
    lastPadding = applyPaddingDragDelta(
      startPadding,
      edge,
      delta,
      spacingState.paddingLinkMode ?? 'none',
    )
    spacingState.lastValue = lastPadding
    el.style.padding = `${lastPadding[0]}px ${lastPadding[1]}px ${lastPadding[2]}px ${lastPadding[3]}px`

    const pt = toOverlayLocal(move.clientX, move.clientY)
    const tip =
      paddingLinkMode === 'all'
        ? `padding: ${lastPadding[0]}px（四向）`
        : paddingLinkMode === 'vertical' && (edge === 'n' || edge === 's')
          ? `padding 上下: ${lastPadding[0]}px`
          : `padding: ${lastPadding.join(' ')}`
    spacingTooltip.value = { x: pt.x, y: pt.y, text: tip, kind: 'padding' }
  }

  const upHandler = () => stopSpacing(true)

  spacingActive.value = true
  spacingDragHint.value = { kind: 'padding', edge, mode: paddingMode }
  spacingState = {
    kind: 'padding',
    tagIndex,
    el,
    edge,
    paddingMode,
    paddingLinkMode,
    startX: e.clientX,
    startY: e.clientY,
    handleAnchorX: 0,
    handleAnchorY: 0,
    startValue: startPadding,
    lastValue: lastPadding,
    moveHandler,
    upHandler,
  }
  document.addEventListener('pointermove', moveHandler)
  document.addEventListener('pointerup', upHandler)
}

function onRadiusDragStart(corner: RadiusCornerIndex, e: PointerEvent) {
  if (activeTool.value !== 'edit-radius' || editingIndex !== null || !selectedId.value) return
  stopElementDrag()
  stopResize(false)
  stopSpacing(false)
  stopGridTrackDrag(false)

  const tagIndex = parseInt(selectedId.value.replace('el-', ''), 10)
  if (!isLayoutContainerTag(componentCode.value, tagIndex)) return
  const el = elByIndex(String(tagIndex))
  if (!el) return

  e.preventDefault()
  e.stopPropagation()

  const spacing = getSpacingAttrs(componentCode.value, tagIndex)
  const startCorners: BorderRadiusCorners = [...spacing.borderRadiusCorners]
  const linked = spacing.borderRadiusLinked
  let lastValue: BorderRadiusCorners = [...startCorners]

  const moveHandler = (move: PointerEvent) => {
    if (!spacingState) return
    const dx = move.clientX - spacingState.startX
    const dy = move.clientY - spacingState.startY
    const delta = radiusDeltaFromDragForCorner(corner, dx, dy)
    if (linked) {
      const next = clampSpacing(startCorners[0] + delta)
      lastValue = [next, next, next, next]
    } else {
      lastValue = [...startCorners]
      lastValue[corner] = clampSpacing(startCorners[corner] + delta)
    }
    spacingState.lastValue = lastValue
    el.style.borderRadius = formatBorderRadiusPreview(lastValue)

    const pt = toOverlayLocal(move.clientX, move.clientY)
    spacingTooltip.value = {
      x: pt.x,
      y: pt.y,
      text: linked
        ? `border-radius: ${lastValue[0]}px`
        : `border-radius: ${formatBorderRadiusPreview(lastValue)}`,
      kind: 'radius',
    }
  }

  const upHandler = () => stopSpacing(true)

  spacingActive.value = true
  spacingDragHint.value = { kind: 'radius', radiusCorner: corner, radiusLinked: linked }
  spacingState = {
    kind: 'radius',
    tagIndex,
    el,
    radiusCorner: corner,
    radiusLinked: linked,
    startX: e.clientX,
    startY: e.clientY,
    handleAnchorX: 0,
    handleAnchorY: 0,
    startValue: startCorners,
    lastValue,
    moveHandler,
    upHandler,
  }
  document.addEventListener('pointermove', moveHandler)
  document.addEventListener('pointerup', upHandler)
}

// ── 选中 ──
const selectedId = ref<string | null>(null)       // 主选中（最后一个点击的）
const selectedIds = ref<Set<string>>(new Set())   // 多选集合
const interactionState = ref<FlowInteractionStateId>('default')

function selectedTagIndex(): number | null {
  if (!selectedId.value) return null
  const n = parseInt(selectedId.value.replace('el-', ''), 10)
  return Number.isNaN(n) ? null : n
}

const interactionStateHasCanvasOverrides = computed(() => {
  const idx = selectedTagIndex()
  if (idx == null || interactionState.value === 'default') return false
  if (interactionState.value === 'motion') {
    return interactionStateHasOverrides(componentCode.value, idx, 'motion')
  }
  return interactionStateHasOverrides(componentCode.value, idx, interactionState.value)
})
const hoveredId = ref<string | null>(null)
/** 单选时指针是否在选中元素（含子节点）或 overlay 手柄上 */
const pointerOverSelected = ref(false)
/** 画布内拖拽元素时为 true，隐藏 overlay 手柄 */
const elementDragActive = ref(false)
/** overlay 本地坐标系下的指针位置，用于 padding/gap 排线悬浮检测 */
const overlayPointer = ref<{ x: number; y: number } | null>(null)
const gridTrackHover = ref<{ col: number | null; row: number | null }>({ col: null, row: null })

function clearGridTrackHover() {
  gridTrackHover.value = { col: null, row: null }
}

function updateGridTrackHover(e: PointerEvent) {
  clearGridTrackHover()
  if (canvasMode.value === 'simulate') return
  if (resizeActive.value || spacingActive.value) return
  if (!selectedId.value || selectedIds.value.size !== 1) return
  const tagIndex = parseInt(selectedId.value.replace('el-', ''), 10)
  if (!Number.isFinite(tagIndex)) return
  const attrs = getTagAttrsFromCode(componentCode.value, tagIndex)
  if ((attrs.layout ?? 'none') !== 'grid') return
  if (!canvasRef.value || !previewRoot.value) return

  const containerEl = previewRoot.value.querySelector(
    `[data-el-i="${tagIndex}"]`,
  ) as HTMLElement | null
  if (!containerEl) return

  const root = getOverlayRootEl()
  if (!root) return
  const cr = root.getBoundingClientRect()
  const x = e.clientX - cr.left
  const y = e.clientY - cr.top
  const tracks = getGridTracksFromCode(componentCode.value, tagIndex)
  const capsules = computeGridTrackCapsules(containerEl, cr, tracks.columns, tracks.rows)
  gridTrackHover.value = {
    col: hitGridTrackHoverAtPoint(x, y, capsules.columns, 'column'),
    row: hitGridTrackHoverAtPoint(x, y, capsules.rows, 'row'),
  }
}

const showSpacingHandles = computed(() => {
  if (activeTool.value !== 'select') return false
  if (!selectedId.value || selectedIds.value.size !== 1) return false
  const idx = parseInt(selectedId.value.replace('el-', ''), 10)
  return canShowSpacingHandles(componentCode.value, idx)
})

const showGapHandles = computed(() => {
  if (activeTool.value !== 'select') return false
  if (!selectedId.value || selectedIds.value.size !== 1) return false
  const idx = parseInt(selectedId.value.replace('el-', ''), 10)
  return canEditLayoutSpacing(componentCode.value, idx)
})

/** 圆角工具激活且选中 LayoutContainer 时显示四角圆角手柄 */
const showRadiusHandles = computed(() => {
  if (activeTool.value !== 'edit-radius') return false
  if (!selectedId.value || selectedIds.value.size !== 1) return false
  const idx = parseInt(selectedId.value.replace('el-', ''), 10)
  return isLayoutContainerTag(componentCode.value, idx)
})

/** 代码面板打开时，高亮选中元素在源码中的开标签行（1-based） */
const selectedCodeLine = computed(() => {
  if (!showCode.value || !selectedId.value) return null
  const idx = parseInt(selectedId.value.replace('el-', ''), 10)
  if (Number.isNaN(idx)) return null
  const loc = findTagLineInSource(componentCode.value, idx)
  return loc ? loc.lineIndex + 1 : null
})

// 框选
interface Rect { x: number; y: number; width: number; height: number }
const marqueeRect = ref<Rect | null>(null)
let marqueeStart: { x: number; y: number } | null = null

function elByIndex(index: string): HTMLElement | null {
  if (!previewRoot.value) return null
  return previewRoot.value.querySelector(`[data-el-i="${index}"]`)
}

function clearHover() {
  if (hoveredId.value !== null) {
    elByIndex(hoveredId.value.replace('el-', ''))?.classList.remove('el-hover')
    hoveredId.value = null
  }
}

function setHover(index: string) {
  const id = `el-${index}`
  if (selectedIds.value.has(id)) {
    clearHover()
    return
  }
  clearHover()
  const el = elByIndex(index)
  if (el) {
    el.classList.add('el-hover')
    hoveredId.value = id
  }
}

function clearSelection() {
  selectedIds.value = new Set()
  selectedId.value = null
  pointerOverSelected.value = false
  clearGridTrackHover()
  stopGridTrackDrag(false)
}

function setSelection(index: string, shift = false, refocus = true) {
  if (shift && selectedId.value !== null) {
    const id = `el-${index}`
    const next = new Set(selectedIds.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    if (next.size === 0) {
      selectedIds.value = new Set()
      selectedId.value = null
    } else {
      selectedIds.value = next
      selectedId.value = id
    }
    clearHover()
    return
  }

  clearSelection()
  if (elByIndex(index)) {
    selectedIds.value = new Set([`el-${index}`])
    selectedId.value = `el-${index}`
  }
  clearHover()
  if (refocus) refocusCanvas()
}


// ── 画布内文本编辑 ──
let editingIndex: number | null = null
let editingEl: HTMLElement | null = null
let editingOldText = ''
let editingKeydownHandler: ((e: KeyboardEvent) => void) | null = null
let editingBlurHandler: (() => void) | null = null
let editingReady = false

function onCanvasDblClick(e: MouseEvent) {
  if (canvasMode.value === 'simulate') {
    const el = hitSelectableElement(e.target)
    const idx = el?.getAttribute('data-el-i')
    if (idx) {
      runBoundLogicBlocks(idx, 'dblclick', e)
      runInteractionRules(idx, 'dblclick')
    }
    return
  }
  if (activeTool.value !== 'select') return

  const el = hitSelectableElement(e.target)
  if (!el) return
  // 只编辑 span 标签
  if (el.tagName !== 'SPAN') return

  const idx = el.getAttribute('data-el-i')
  if (!idx) return

  // 选中它（勿 refocus 画布，否则会抢走 contentEditable 焦点）
  setSelection(idx, false, false)

  // 进入编辑模式
  editingIndex = parseInt(idx, 10)
  editingEl = el
  editingOldText = el.innerText
  editingReady = false
  el.contentEditable = 'true'
  el.classList.add('el-editing')
  el.focus()

  // 聚焦并选中全部文本
  const range = document.createRange()
  range.selectNodeContents(el)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)

  // Enter 保存
  const onKeydown = (ke: KeyboardEvent) => {
    if (ke.key === 'Enter') {
      ke.preventDefault()
      commitEdit()
    } else if (ke.key === 'Escape') {
      ke.preventDefault()
      cancelEdit()
    }
  }
  el.addEventListener('keydown', onKeydown)

  // 失焦保存（延迟绑定，避免 dblclick 聚焦过程中的误触发）
  const onBlur = () => {
    if (!editingReady) return
    commitEdit()
  }
  requestAnimationFrame(() => {
    if (editingEl !== el) return
    editingReady = true
    el.addEventListener('blur', onBlur)
  })

  editingKeydownHandler = onKeydown
  editingBlurHandler = onBlur
}

function commitEdit() {
  if (editingIndex === null || !editingEl) return

  const el = editingEl
  const idx = editingIndex
  const newText = el.innerText.trim()
  const oldText = editingOldText

  if (newText === oldText) {
    cleanupEdit()
    return
  }

  if (newText === '') {
    el.innerText = oldText
    cleanupEdit()
    return
  }

  const loc = findTagLineInSource(componentCode.value, idx)
  if (!loc || loc.tagName.toLowerCase() !== 'span') {
    console.log('[commitEdit] line not found for index', idx)
    cleanupEdit()
    return
  }

  const lines = componentCode.value.split('\n')
  const oldLine = lines[loc.lineIndex]
  const newLine = oldLine.replace(
    /(<span[^>]*>).*?(<\/span>)/,
    `$1${newText}$2`,
  )
  cleanupEdit()
  if (newLine === oldLine) return
  lines[loc.lineIndex] = newLine
  onCodeChange(lines.join('\n'))
}

function cancelEdit() {
  if (editingIndex === null || !editingEl) return

  // 恢复原始文本
  editingEl.innerText = editingOldText
  cleanupEdit()
}

function cleanupEdit() {
  editingReady = false
  if (editingEl) {
    editingEl.contentEditable = 'false'
    editingEl.classList.remove('el-editing')
    if (editingKeydownHandler) {
      editingEl.removeEventListener('keydown', editingKeydownHandler)
    }
    if (editingBlurHandler) {
      editingEl.removeEventListener('blur', editingBlurHandler)
    }
  }
  editingIndex = null
  editingEl = null
  editingOldText = ''
  editingKeydownHandler = null
  editingBlurHandler = null
  refocusCanvas()
}

// ── 工具模式：添加容器 / 文本 ──
const CONTAINER_SNIPPET = [
  '<LayoutContainer layout="flex" flex-direction="row" :padding="16" :column-gap="12" :row-gap="12" height-mode="hug" border="1px solid var(--td-component-border)" :border-radius="8">',
  '</LayoutContainer>',
]

const SPAN_SNIPPET = ['<span>文本</span>']

function findRootContainerIndex(): number | null {
  const n = countTags(componentCode.value)
  for (let i = 0; i < n; i++) {
    if (getTagParentIndex(componentCode.value, i) !== null) continue
    const loc = findTagLineInSource(componentCode.value, i)
    if (loc && loc.tagName.toLowerCase() !== 'span') return i
  }
  return null
}

function resolveInsertTarget(clientX: number, clientY: number): DropTarget | null {
  const fallbackParent = (): DropTarget | null => {
    const root = findRootContainerIndex()
    if (root === null) return null
    const children = getDirectChildTagIndices(componentCode.value, root)
    return { parentTagIndex: root, insertAt: children.length }
  }

  const hit = document.elementFromPoint(clientX, clientY) as HTMLElement | null
  if (!hit || !previewRoot.value?.contains(hit)) return fallbackParent()

  const hitEl = hit.closest('[data-el-i]') as HTMLElement | null
  if (!hitEl) return fallbackParent()

  const hitIndex = parseInt(hitEl.getAttribute('data-el-i')!, 10)
  if (Number.isNaN(hitIndex)) return fallbackParent()

  const hitLoc = findTagLineInSource(componentCode.value, hitIndex)
  if (!hitLoc) return fallbackParent()

  if (isImportedComponentTag(componentCode.value, hitIndex)) {
    return null
  }

  let targetParent = getTagParentIndex(componentCode.value, hitIndex)

  if (
    isEditorStructuralContainer(componentCode.value, hitIndex)
    && isPointerInContainerInterior(hitEl, clientX, clientY, -1)
  ) {
    targetParent = hitIndex
  } else if (targetParent === null && isEditorStructuralContainer(componentCode.value, hitIndex)) {
    targetParent = hitIndex
  }

  if (targetParent === null) return null

  if (!isEditorStructuralContainer(componentCode.value, targetParent)) return null

  return resolveChildrenDropTarget(targetParent, clientX, clientY)
}

function handleAddToolPointerDown(e: PointerEvent) {
  const tool = activeTool.value
  if (tool === 'add-component') {
    handleAddComponentPointerDown(e)
    return
  }
  if (tool !== 'add-container' && tool !== 'add-text') return

  const target = resolveInsertTarget(e.clientX, e.clientY)
  if (!target) return

  const snippet = tool === 'add-container' ? CONTAINER_SNIPPET : SPAN_SNIPPET
  const result = insertTagBlock(
    componentCode.value,
    target.parentTagIndex,
    target.insertAt,
    snippet,
  )
  if (!result) return

  let newCode = result.code
  if (
    target.gridCol !== undefined
    && target.gridRow !== undefined
    && isGridLayoutContainer(target.parentTagIndex)
  ) {
    const gridCommit = commitGridCoordinateDrop(
      newCode,
      target.parentTagIndex,
      [result.newTagIndex],
      target.gridCol,
      target.gridRow,
    )
    newCode = gridCommit.code
    onCodeChange(newCode)
    setActiveTool('select')
    nextTick(() => setSelection(String(gridCommit.movedTagIndices[0] ?? result.newTagIndex)))
    return
  }

  onCodeChange(newCode)
  setActiveTool('select')
  nextTick(() => setSelection(String(result.newTagIndex)))
}

function handleAddComponentPointerDown(e: PointerEvent) {
  const pending = pendingInsertComponent.value
  if (!pending) return

  const target = resolveInsertTarget(e.clientX, e.clientY)
  if (!target) return

  const snippet = buildComponentInsertSnippet(pending.tag)
  const result = insertTagBlock(
    componentCode.value,
    target.parentTagIndex,
    target.insertAt,
    snippet,
  )
  if (!result) return

  let newCode = ensureScriptImports(result.code, [{ tag: pending.tag, path: pending.path }])

  if (
    target.gridCol !== undefined
    && target.gridRow !== undefined
    && isGridLayoutContainer(target.parentTagIndex)
  ) {
    const gridCommit = commitGridCoordinateDrop(
      newCode,
      target.parentTagIndex,
      [result.newTagIndex],
      target.gridCol,
      target.gridRow,
    )
    newCode = gridCommit.code
  }

  pendingInsertComponent.value = null
  onCodeChange(newCode)
  setActiveTool('select')
  nextTick(() => setSelection(String(result.newTagIndex)))
}

function toggleTool(tool: Exclude<Tool, 'select'>) {
  setActiveTool(activeTool.value === tool ? 'select' : tool)
}

/** 工具栏数字键 1–8（与工具栏从左到右顺序一致） */
const TOOLBAR_DIGIT_ACTIONS: Record<string, () => void> = {
  '1': () => {
    setActiveTool('select')
  },
  '2': () => {
    setActiveTool('add-container')
  },
  '3': () => {
    setActiveTool('add-text')
  },
  '4': () => {
    setActiveTool('edit-radius')
  },
  '5': () => {
    wrapSelectionInAutoLayout()
  },
  '6': () => {
    showHistory.value = !showHistory.value
  },
  '7': () => {
    showCode.value = !showCode.value
  },
  '8': () => {
    setCanvasMode('simulate')
  },
}

function toggleCanvasMode() {
  setCanvasMode(canvasMode.value === 'edit' ? 'simulate' : 'edit')
}

function handleCanvasModeTabShortcut(e: KeyboardEvent): boolean {
  if (e.key !== 'Tab' || e.shiftKey) return false
  if (e.ctrlKey || e.metaKey || e.altKey) return false
  if (shouldBlockCanvasShortcuts()) return false
  e.preventDefault()
  toggleCanvasMode()
  return true
}

function handleToolbarDigitShortcut(e: KeyboardEvent): boolean {
  if (e.ctrlKey || e.metaKey || e.altKey) return false
  if (e.key.length !== 1 || e.key < '1' || e.key > '8') return false

  if (canvasMode.value === 'simulate') {
    if (e.key !== '1') return false
    e.preventDefault()
    setCanvasMode('edit')
    setActiveTool('select')
    return true
  }

  const action = TOOLBAR_DIGIT_ACTIONS[e.key]
  if (!action) return false
  e.preventDefault()
  action()
  return true
}

// ── 键盘快捷键（window 级别捕获） ──
let copiedSourceBlock: string[] | null = null

function shouldBlockCanvasShortcuts(): boolean {
  const el = document.activeElement as HTMLElement | null
  if (!el) return false
  if (el.tagName === 'INPUT') return true
  if (el.isContentEditable) return true
  // 代码面板编辑时，所有画布快捷键交给 Monaco
  if (el.closest('.monaco-editor')) return true
  if (el.tagName === 'TEXTAREA') return true
  return false
}

function onWindowKeyDown(e: KeyboardEvent) {
  if (editingIndex !== null) return

  if (handleToolbarDigitShortcut(e)) return

  if (handleCanvasModeTabShortcut(e)) return

  if (shouldBlockCanvasShortcuts()) return

  if (canvasMode.value === 'simulate') return

  if (e.key === 'Escape' && activeTool.value !== 'select') {
    e.preventDefault()
    cancelAddComponentTool()
    setActiveTool('select')
    return
  }

  if (e.key === 'Escape') {
    showOpenMenu.value = false
    showInsertPicker.value = false
  }

  if (activeTool.value !== 'select') return

  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
    e.preventDefault()
    wrapSelectionInAutoLayout()
    return
  }

  // 撤销 / 重做
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    undo()
    return
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
    e.preventDefault()
    redo()
    return
  }

  // 以下快捷键需要选中元素
  if (selectedId.value === null) return

  const idx = parseInt(selectedId.value.replace('el-', ''), 10)

  if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault()
    deleteSelectedTags()
    return
  }

  if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
    e.preventDefault()
    const block = extractTagBlockLines(componentCode.value, idx)
    if (block) copiedSourceBlock = block
    return
  }

  if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
    e.preventDefault()
    if (!copiedSourceBlock) return
    const result = pasteTagBlockAfter(componentCode.value, idx, copiedSourceBlock)
    if (!result) return
    let newCode = result.code
    const pasteParent = getTagParentIndex(newCode, result.newTagIndex)
    if (pasteParent !== null && isGridLayoutContainerOnCode(newCode, pasteParent)) {
      newCode = assignGridChildToFirstEmptyCell(newCode, pasteParent, result.newTagIndex)
    }
    onCodeChange(newCode)
    nextTick(() => setSelection(String(result.newTagIndex)))
  }
}

// ── 画布事件（canvas 负责空白点击/框选，preview 负责悬浮/双击） ──
let marqueeMoveHandler: ((e: PointerEvent) => void) | null = null
let marqueeUpHandler: ((e: PointerEvent) => void) | null = null

const MARQUEE_MIN_PX = 4

/** @deprecated 使用 toOverlayLocal；保留别名避免遗漏调用点 */
function toCanvasLocal(clientX: number, clientY: number): { x: number; y: number } {
  return toOverlayLocal(clientX, clientY)
}

function hitSelectableElement(target: EventTarget | null): HTMLElement | null {
  if (!previewRoot.value || !(target instanceof HTMLElement)) return null
  if (!previewRoot.value.contains(target)) return null
  return target.closest('[data-el-i]') as HTMLElement | null
}

/** overlay 上可点的手柄/胶囊等，不应触发画布空白点击逻辑 */
function isOverlayChromeTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return !!target.closest(
    '.so__handle, .so__pad-handle, .so__gap-handle, .so__radius-handle, .so__grid-track-wrap',
  )
}

function isPointerOverSelectedElement(el: HTMLElement): boolean {
  if (!selectedId.value || selectedIds.value.size !== 1) return false
  const selectedIdx = selectedId.value.replace('el-', '')
  const hitIdx = el.getAttribute('data-el-i')
  if (hitIdx === selectedIdx) return true
  const selectedEl = elByIndex(selectedIdx)
  return !!selectedEl?.contains(el)
}

function updatePointerOverSelected(e: PointerEvent) {
  if (canvasMode.value === 'simulate' || elementDragActive.value) {
    pointerOverSelected.value = false
    return
  }
  if (!selectedId.value || selectedIds.value.size !== 1) {
    pointerOverSelected.value = false
    return
  }
  if (isOverlayChromeTarget(e.target)) return
  const el = hitSelectableElement(e.target)
  pointerOverSelected.value = !!(el && isPointerOverSelectedElement(el))
}

function updateMarqueeRect(clientX: number, clientY: number) {
  if (!marqueeStart) return
  const pt = toOverlayLocal(clientX, clientY)
  const startPt = toOverlayLocal(marqueeStart.x, marqueeStart.y)
  marqueeRect.value = {
    x: Math.min(startPt.x, pt.x),
    y: Math.min(startPt.y, pt.y),
    width: Math.abs(pt.x - startPt.x),
    height: Math.abs(pt.y - startPt.y),
  }
}

function stopMarquee(up: PointerEvent) {
  if (marqueeMoveHandler) {
    document.removeEventListener('pointermove', marqueeMoveHandler)
    marqueeMoveHandler = null
  }
  if (marqueeUpHandler) {
    document.removeEventListener('pointerup', marqueeUpHandler)
    marqueeUpHandler = null
  }

  const start = marqueeStart
  marqueeStart = null
  const rect = marqueeRect.value
  marqueeRect.value = null

  if (!start || !rect) return
  if (rect.width < MARQUEE_MIN_PX && rect.height < MARQUEE_MIN_PX) return

  finishMarquee(start.x, start.y, up.clientX, up.clientY)
}

function startMarquee(e: PointerEvent) {
  const pt = toCanvasLocal(e.clientX, e.clientY)
  marqueeStart = { x: e.clientX, y: e.clientY }
  marqueeRect.value = { x: pt.x, y: pt.y, width: 0, height: 0 }

  marqueeMoveHandler = (move: PointerEvent) => updateMarqueeRect(move.clientX, move.clientY)
  marqueeUpHandler = (up: PointerEvent) => stopMarquee(up)
  document.addEventListener('pointermove', marqueeMoveHandler)
  document.addEventListener('pointerup', marqueeUpHandler)
}

function onCanvasPointerDown(e: PointerEvent) {
  if (e.button !== 0) return

  if (canvasMode.value === 'simulate') {
    if (bindingDragActive.value) return
    const el = hitSelectableElement(e.target)
    const idx = el?.getAttribute('data-el-i')
    if (idx) {
      runBoundLogicBlocks(idx, 'click', e)
      runInteractionRules(idx, 'click')
    }
    return
  }

  if (resizeActive.value || spacingActive.value) return

  if (activeTool.value === 'add-container' || activeTool.value === 'add-text' || activeTool.value === 'add-component') {
    e.preventDefault()
    handleAddToolPointerDown(e)
    return
  }

  if (activeTool.value === 'edit-radius') {
    if (isOverlayChromeTarget(e.target)) return
    const el = hitSelectableElement(e.target)
    if (el) {
      const idx = el.getAttribute('data-el-i')
      if (idx) {
        if (e.shiftKey) {
          setSelection(idx, true)
        } else {
          setSelection(idx, false)
        }
        pointerOverSelected.value = true
        return
      }
    }
    if (!e.shiftKey) clearSelection()
    return
  }

  if (activeTool.value !== 'select') return

  if (isOverlayChromeTarget(e.target)) return

  const el = hitSelectableElement(e.target)
  if (el) {
    const idx = el.getAttribute('data-el-i')
    if (idx) {
      if (e.shiftKey) {
        setSelection(idx, true)
      } else if (!selectedIds.value.has(`el-${idx}`)) {
        setSelection(idx, false)
        pointerOverSelected.value = true
        startElementDrag(e, el, idx)
      } else {
        selectedId.value = `el-${idx}`
        clearHover()
        pointerOverSelected.value = true
        startElementDrag(e, el, idx)
      }
      return
    }
  }

  // 点击画布空白：取消选中并开始框选
  if (!e.shiftKey) clearSelection()
  startMarquee(e)
}

function onCanvasPointerMove(e: PointerEvent) {
  if (canvasMode.value === 'simulate') return
  if (activeTool.value !== 'select' && activeTool.value !== 'add-container' && activeTool.value !== 'add-text' && activeTool.value !== 'edit-radius' && activeTool.value !== 'add-component') return
  if (marqueeStart) return

  updateGridTrackHover(e)
  updatePointerOverSelected(e)
  overlayPointer.value = toOverlayLocal(e.clientX, e.clientY)

  const el = hitSelectableElement(e.target)
  if (el) {
    const idx = el.getAttribute('data-el-i')
    if (idx) {
      setHover(idx)
      return
    }
  }
  clearHover()
}

function finishMarquee(x1: number, y1: number, x2: number, y2: number) {
  if (!previewRoot.value) return
  const els = previewRoot.value.querySelectorAll('[data-el-i]') as NodeListOf<HTMLElement>
  const minX = Math.min(x1, x2)
  const minY = Math.min(y1, y2)
  const maxX = Math.max(x1, x2)
  const maxY = Math.max(y1, y2)

  const selected: string[] = []
  for (const el of els) {
    const r = el.getBoundingClientRect()
    if (r.left < maxX && r.right > minX && r.top < maxY && r.bottom > minY) {
      const idx = el.getAttribute('data-el-i')
      if (idx) selected.push(idx)
    }
  }

  if (selected.length === 0) return
  clearSelection()
  const next = new Set<string>()
  for (const idx of selected) {
    next.add(`el-${idx}`)
  }
  selectedIds.value = next
  selectedId.value = `el-${selected[selected.length - 1]}`
  clearHover()
}

function onCanvasPointerLeave() {
  if (!marqueeStart) clearHover()
  pointerOverSelected.value = false
  overlayPointer.value = null
  clearGridTrackHover()
}

watch(selectedId, (id) => {
  extremeBandFocus.value = null
  clearGridTrackHover()
  if (!resizeActive.value) clearExtremeBands()
  if (!id) interactionState.value = 'default'
})

function refreshInteractionStatePreview() {
  nextTick(() => {
    syncInteractionStatePreview(
      previewRoot.value,
      componentCode.value,
      selectedTagIndex(),
      interactionState.value,
    )
  })
}

watch([componentCode, previewRoot, previewComp, selectedId, interactionState], () => {
  refreshInteractionStatePreview()
})

watch(componentCode, () => {
  if (!resizeActive.value) clearExtremeBands()
})

/** 将组件舞台滚到可视区域正中（模式切换 / 侧栏变化后仍居中） */
function centerStageInView() {
  if (!canvasRef.value || !previewRoot.value) return
  nextTick(() => {
    const canvas = canvasRef.value
    const board = previewRoot.value?.parentElement
    if (!canvas || !board) return
    const cr = canvas.getBoundingClientRect()
    const br = board.getBoundingClientRect()
    const scrollLeft =
      canvas.scrollLeft + (br.left + br.width / 2) - (cr.left + cr.width / 2)
    const scrollTop =
      canvas.scrollTop + (br.top + br.height / 2) - (cr.top + cr.height / 2)
    canvas.scrollTo({
      left: Math.max(0, scrollLeft),
      top: Math.max(0, scrollTop),
    })
  })
}

watch([previewComp, isEditMode, showCode], () => centerStageInView())

watch([componentCode, previewRoot, isEditMode], ([code, root, edit]) => {
  syncPreviewStyleSheet(code, root, { interactionLive: !edit })
})

watch(previewRoot, (el, _, onCleanup) => {
  if (!el) return
  el.addEventListener('dblclick', onCanvasDblClick)
  onCleanup(() => el.removeEventListener('dblclick', onCanvasDblClick))
})

function onDocPointerDown(ev: PointerEvent) {
  const t = ev.target as HTMLElement | null
  if (t?.closest('.editor__toolbar')) return
  if (t?.closest('.app__header')) return
  if (t?.closest('.editor__props-head')) return
  showOpenMenu.value = false
  showInsertPicker.value = false
}

onMounted(async () => {
  await refreshLibraryComponents()
  syncPreviewRegistry()
  const savedSession = loadEditorSession()
  if (savedSession?.draftCode) {
    loadCodeIntoEditor(savedSession.draftCode, savedSession.filename || 'untitled.vue', savedSession.currentFileId)
  } else {
    syncCode(componentCode.value)
  }

  // 清理历史误写入 template 的 @event，避免 preview 编译失败
  const cleaned = prepareEditorCodeForPreview(componentCode.value)
  if (cleaned !== componentCode.value) {
    onCodeChange(cleaned)
  }

  document.addEventListener('pointerdown', onDocPointerDown)
  document.addEventListener('keydown', onWindowKeyDown, true)
  if (canvasRef.value) {
    canvasRef.value.addEventListener('pointerdown', onCanvasPointerDown)
    canvasRef.value.addEventListener('pointermove', onCanvasPointerMove)
    canvasRef.value.addEventListener('pointerleave', onCanvasPointerLeave)
    canvasRef.value.addEventListener('dblclick', onCanvasDblClick)
  }
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocPointerDown)
  document.removeEventListener('keydown', onWindowKeyDown, true)
  if (canvasRef.value) {
    canvasRef.value.removeEventListener('pointerdown', onCanvasPointerDown)
    canvasRef.value.removeEventListener('pointermove', onCanvasPointerMove)
    canvasRef.value.removeEventListener('pointerleave', onCanvasPointerLeave)
    canvasRef.value.removeEventListener('dblclick', onCanvasDblClick)
  }
  if (marqueeMoveHandler) document.removeEventListener('pointermove', marqueeMoveHandler)
  if (marqueeUpHandler) document.removeEventListener('pointerup', marqueeUpHandler)
  stopElementDrag()
  stopResize(false)
})

/** 删除选中元素（整段标签块；容器含子元素） */
function selectionTagIndices(): number[] {
  const raw: number[] = []
  if (selectedIds.value.size > 0) {
    for (const id of selectedIds.value) {
      const n = parseInt(id.replace('el-', ''), 10)
      if (!Number.isNaN(n)) raw.push(n)
    }
  } else if (selectedId.value) {
    const n = parseInt(selectedId.value.replace('el-', ''), 10)
    if (!Number.isNaN(n)) raw.push(n)
  }
  return raw
}

function wrapSelectionInAutoLayout() {
  const raw = selectionTagIndices()
  if (raw.length < 2) return
  const normalized = normalizeGroupTagIndices(componentCode.value, raw)
  if (!normalized || normalized.length < 2) return
  const result = wrapTagsInLayoutContainer(componentCode.value, normalized)
  if (!result) return
  onCodeChange(result.code)
  nextTick(() => setSelection(String(result.wrapperTagIndex)))
}

function deleteSelectedTags() {
  const rawIndices: number[] = []
  if (selectedIds.value.size > 0) {
    for (const id of selectedIds.value) {
      const n = parseInt(id.replace('el-', ''), 10)
      if (!Number.isNaN(n)) rawIndices.push(n)
    }
  } else if (selectedId.value) {
    const n = parseInt(selectedId.value.replace('el-', ''), 10)
    if (!Number.isNaN(n)) rawIndices.push(n)
  }
  if (rawIndices.length === 0) return

  // 若同时选中祖先与子孙，只删祖先块
  const indices = rawIndices.filter(
    (i) => !rawIndices.some((j) => j !== i && isDescendantTag(componentCode.value, j, i)),
  )

  const sorted = indices
    .map((i) => ({
      i,
      line: findTagLineInSource(componentCode.value, i)?.lineIndex ?? -1,
    }))
    .filter((x) => x.line >= 0)
    .sort((a, b) => b.line - a.line)

  let code = componentCode.value
  let deleted = false
  for (const { i } of sorted) {
    const next = deleteTagBlock(code, i)
    if (next) {
      code = next
      deleted = true
    }
  }

  if (!deleted) return
  clearSelection()
  onCodeChange(code)
}

</script>

<template>
  <div class="editor">
    <div class="editor__main">
      <aside v-if="isEditMode" class="editor__layers">
        <div class="editor__layers-head">结构</div>
        <div class="editor__layers-body">
          <StructureTreePanel
            :code="componentCode"
            :selected-id="selectedId"
            :selected-ids="selectedIds"
            @select="(index, shift) => setSelection(index, shift)"
          />
        </div>
      </aside>
      <aside v-else class="editor__logic-panel">
        <div class="editor__logic-panel-head">逻辑</div>
        <div class="editor__logic-panel-body">
          <LogicSidePanel
            :logic="componentLogic"
            :scenario="simulationScenario"
            @add-prop="addLogicProp()"
            @remove-prop="removeLogicProp"
            @update-prop="updateLogicProp"
            @add-emit="addLogicEmit()"
            @remove-emit="removeLogicEmit"
            @update-emit="updateLogicEmit"
            @add-variable="addLogicVariable()"
            @remove-variable="removeLogicVariable"
            @update-variable="updateLogicVariable"
            @add-method="addLogicMethod()"
            @remove-method="removeLogicMethod"
            @update-method="updateLogicMethod"
            @update:inputs="(v) => { simulationScenario.inputs = v }"
            @update:outputs="(v) => { simulationScenario.outputs = v }"
            @clear-log="clearSimulationLog"
          />
        </div>
      </aside>
      <div
        class="editor__canvas"
        :class="{
          'editor__canvas--add': isEditMode && (activeTool === 'add-container' || activeTool === 'add-text' || activeTool === 'add-component'),
          'editor__canvas--simulate': !isEditMode,
        }"
        ref="canvasRef"
        tabindex="0"
      >
        <div class="editor__stage editor__stage--centered">
          <div class="editor__stage-board" ref="overlayRootRef">
            <div class="editor__preview" v-if="previewComp" ref="previewRoot">
              <component :is="previewComp" />
            </div>
            <p v-else class="editor__hint">组件预览</p>
            <SelectionOverlay
              v-if="isEditMode"
              :selected-id="selectedId"
              :selected-ids="selectedIds"
              :hovered-id="hoveredId"
              :pointer-over-selected="pointerOverSelected && !elementDragActive"
              :overlay-pointer="overlayPointer"
              :marquee-rect="marqueeRect"
              :preview-root="previewRoot"
              :container-el="overlayRootRef"
              :show-resize-handles="showResizeHandles"
              :show-spacing-handles="showSpacingHandles"
              :show-gap-handles="showGapHandles"
              :show-radius-handles="showRadiusHandles"
              :resize-active="resizeActive"
              :spacing-active="spacingActive"
              :spacing-drag-hint="spacingDragHint"
              :extreme-bands="extremeBands"
              :elastic-snap-guides="elasticSnapGuides"
              :extreme-band-focus="extremeBandFocus"
              :resize-tooltip="resizeTooltip"
              :spacing-tooltip="spacingTooltip"
              :gap-drag-preview="gapDragPreview"
              :grid-track-drag-preview="gridTrackDragPreview"
              :grid-element-drop-preview="gridElementDropPreview"
              :grid-track-hover="gridTrackHover"
              :component-code="componentCode"
              @resize-start="onResizeStart"
              @gap-drag-start="(axis, gapIndex, hx, hy, ev) => onGapDragStart(axis, gapIndex, hx, hy, ev)"
              @padding-drag-start="onPaddingDragStart"
              @radius-drag-start="onRadiusDragStart"
              @grid-track-drag-start="onGridTrackDragStart"
              @grid-track-size-change="onGridTrackSizeChange"
            />
            <LogicBindingOverlay
              v-if="!isEditMode"
              :drag-active="bindingDragActive"
              :drag-anchor="bindingDragAnchor"
              :drag-pointer="bindingDragPointer"
              :hover-rect="bindingHoverRect"
              :bound-badges="boundBadges"
            />
          </div>
        </div>
        <div v-if="!isEditMode" class="editor__canvas-banner editor__canvas-banner--simulate">
          交互逻辑 · 从逻辑块圆点拖到画布元素完成绑定；组件实例可交互
        </div>
        <div
          v-else-if="interactionState === 'motion' && selectedId"
          class="editor__canvas-banner editor__canvas-banner--motion"
        >
          编辑动效 · 画板不模拟指针交互；在示例预览中查看真实过渡
        </div>
        <div
          v-else-if="interactionStateUsesCanvasPreview(interactionState) && selectedId"
          class="editor__canvas-banner editor__canvas-banner--interaction"
        >
          Tab 强制预览「{{ interactionStateLabel(interactionState) }}」样式 · 指针交互不生效
          <span v-if="!interactionStateHasCanvasOverrides" class="editor__canvas-banner-muted">
            （未配置覆盖，与默认一致）
          </span>
          <span class="editor__canvas-banner-muted"> · 真实交互请用示例预览</span>
        </div>
      </div>
      <aside v-if="isEditMode" class="editor__props">
        <div class="editor__props-head" @pointerdown.stop>
          <span class="editor__props-title">属性</span>
          <InteractionStateRail
            v-model="interactionState"
            :code="componentCode"
            :selected-id="selectedId"
          />
        </div>
        <div class="editor__props-body">
          <PropsPanel
            :code="componentCode"
            :selected-id="selectedId"
            :interaction-state="interactionState"
            @update:code="onCodeChange"
            @extreme-focus="(v) => { extremeBandFocus = v }"
          />
        </div>
      </aside>
      <aside v-else class="editor__code-rail">
        <LogicCodeRail
          :model-value="componentCode"
          :compile-error="compileError"
          :logic="componentLogic"
          :library-files="libraryFilesForPreview()"
          @change="onCodeChange"
          @add-block="addLogicBlock"
          @remove-block="removeLogicBlock"
          @update-block="updateLogicBlock"
          @add-lifecycle="addLogicLifecycle"
          @remove-lifecycle="removeLogicLifecycle"
          @update-lifecycle="updateLogicLifecycle"
          @binding-drag-start="onLogicBindingDragStart"
          @unbind-block="unbindLogicBlock"
        />
      </aside>
    </div>

    <div class="editor__toolbar" @pointerdown.stop>
      <div class="editor__toolbar-left">
        <div class="editor__mode-switch">
          <button
            type="button"
            class="editor__mode-btn"
            :class="{ 'editor__mode-btn--active': isEditMode }"
            title="组件样式 (Tab)"
            @click="setCanvasMode('edit')"
          >组件样式</button>
          <button
            type="button"
            class="editor__mode-btn"
            :class="{ 'editor__mode-btn--active': !isEditMode }"
            title="交互逻辑 (Tab)"
            @click="setCanvasMode('simulate')"
          >交互逻辑</button>
        </div>
        <span class="editor__toolbar-sep"></span>
        <template v-if="isEditMode">
          <button type="button" class="editor__toolbar-btn" :class="{ 'editor__toolbar-btn--active': activeTool === 'select' }" title="光标 (1)" @click="setActiveTool('select')">⬤ 光标</button>
          <button type="button" class="editor__toolbar-btn" :class="{ 'editor__toolbar-btn--active': activeTool === 'add-container' }" title="添加容器 (2)" @click="toggleTool('add-container')">+ 容器</button>
          <button type="button" class="editor__toolbar-btn" :class="{ 'editor__toolbar-btn--active': activeTool === 'add-text' }" title="添加文本 (3)" @click="toggleTool('add-text')">+ 文本</button>
          <button type="button" class="editor__toolbar-btn" :class="{ 'editor__toolbar-btn--active': activeTool === 'edit-radius' }" title="圆角 (4)" @click="toggleTool('edit-radius')">◢ 圆角</button>
          <button type="button" class="editor__toolbar-btn" title="自动布局 (5)" @click="wrapSelectionInAutoLayout">自动布局</button>
          <div class="editor__insert-wrap">
            <button
              type="button"
              class="editor__toolbar-btn"
              :class="{ 'editor__toolbar-btn--active': activeTool === 'add-component' || showInsertPicker }"
              title="插入已保存组件"
              @click="toggleInsertPicker"
            >+ 组件</button>
            <div v-if="showInsertPicker" class="editor__file-menu editor__insert-menu">
              <div class="editor__file-menu-divider editor__file-menu-path">{{ libraryPathHint }}</div>
              <button
                v-if="!libraryStatus.hasWritableHandle"
                type="button"
                class="editor__file-menu-item"
                @click="onReconnectLibrary"
              >
                <span class="editor__file-menu-name">重新选择组件库目录…</span>
              </button>
              <div v-if="libraryScanning" class="editor__file-menu-empty">正在扫描组件库…</div>
              <div v-else-if="insertableComponents.length === 0" class="editor__file-menu-empty">
                组件库目录暂无其他 .vue。请先「导出」到组件库，或重新选择目录。
              </div>
              <button
                v-for="file in insertableComponents"
                :key="file.id"
                type="button"
                class="editor__file-menu-item"
                @click="pickInsertComponent(file)"
              >
                <span class="editor__file-menu-name">{{ file.filename }}</span>
                <code class="editor__file-menu-tag">{{ file.tag }}</code>
              </button>
            </div>
          </div>
          <span class="editor__toolbar-sep"></span>
          <span class="editor__shortcut-label">Tab 切换逻辑</span>
          <span class="editor__shortcut-label">1–8 工具栏</span>
          <span class="editor__shortcut-label">Del 删除</span>
          <span class="editor__shortcut-label">Ctrl+C/V 复制粘贴</span>
          <span class="editor__shortcut-label">Ctrl+Z/Shift+Z 撤销重做</span>
        </template>
        <span v-else class="editor__shortcut-label">Tab 切换样式 · 左：添加逻辑块 · 右：Script · 1 返回组件样式</span>
      </div>
      <div class="editor__toolbar-right">
        <span class="editor__file-label" :title="`${currentFilename} · ${libraryPathHint}`">{{ currentFilename }}</span>
        <button type="button" class="editor__toolbar-btn" title="可交互组件示例预览" @click="openComponentPreview">示例预览</button>
        <button type="button" class="editor__toolbar-btn" title="导出到组件库目录" @click="exportCurrentComponent">导出</button>
        <div class="editor__file-wrap">
          <button
            type="button"
            class="editor__toolbar-btn"
            :class="{ 'editor__toolbar-btn--active': showOpenMenu }"
            title="打开组件文件"
            @click="toggleOpenMenu"
          >打开</button>
          <div v-if="showOpenMenu" class="editor__file-menu">
            <div class="editor__file-menu-divider editor__file-menu-path">{{ libraryPathHint }}</div>
            <button
              v-if="!libraryStatus.hasWritableHandle"
              type="button"
              class="editor__file-menu-item"
              @click="onReconnectLibrary"
            >
              <span class="editor__file-menu-name">重新选择组件库目录…</span>
            </button>
            <button type="button" class="editor__file-menu-item" @click="newComponentFile">新建空白组件</button>
            <button type="button" class="editor__file-menu-item" @click="openFileInputRef?.click()">从磁盘选择 .vue…</button>
            <input
              ref="openFileInputRef"
              type="file"
              accept=".vue,text/plain"
              class="editor__file-input"
              @change="onOpenFileFromDisk"
            />
            <div v-if="libraryComponents.length" class="editor__file-menu-divider">组件库</div>
            <button
              v-for="file in libraryComponents"
              :key="file.id"
              type="button"
              class="editor__file-menu-item"
              :class="{ 'editor__file-menu-item--active': file.filename === currentFilename }"
              @click="openStoredComponentFile(file)"
            >
              <span class="editor__file-menu-name">{{ file.filename }}</span>
              <span class="editor__file-menu-meta">{{ file.tag }}</span>
            </button>
          </div>
        </div>
        <div v-if="isEditMode" class="editor__history-wrap">
          <button
            class="editor__toolbar-btn"
            :class="{ 'editor__toolbar-btn--active': showHistory }"
            title="历史 (6)"
            @click="showHistory = !showHistory"
          >历史</button>
          <div v-if="showHistory" class="editor__history-menu">
            <button
              v-for="(entry, i) in history"
              :key="i"
              class="editor__history-item"
              :class="{ 'editor__history-item--active': i === historyIndex }"
              @click="jumpToHistory(i)"
            >{{ historyLabel(entry, i) }}</button>
          </div>
        </div>
        <button
          v-if="isEditMode"
          class="editor__toolbar-btn"
          :class="{ 'editor__toolbar-btn--active': showCode }"
          title="代码面板 (7)"
          @click="showCode = !showCode"
        >代码面板</button>
      </div>
    </div>

    <div v-if="showCode && isEditMode" class="editor__code">
      <div class="editor__code-head">
        <span>组件文件源码</span>
        <button class="editor__code-close" @click="showCode = false">关闭</button>
      </div>
      <div v-if="compileError" class="editor__code-error">
        编译未通过，画布仍显示上一次有效预览：{{ compileError }}
      </div>
      <div class="editor__code-body">
        <CodeEditor
          :model-value="componentCode"
          language="html"
          :highlight-line="selectedCodeLine"
          @change="onCodeChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--td-bg-color-page);
}

.editor__main {
  flex: 1;
  display: flex;
  min-height: 0;
  position: relative;
  z-index: 0;
}

.editor__canvas:focus {
  outline: none;
}

.editor__canvas {
  flex: 1;
  min-height: 0;
  padding: 0;
  overflow: auto;
  position: relative;
  background-color: var(--td-bg-color-page);
  background-image:
    linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px);
  background-size: 20px 20px;
  user-select: none;
}

.editor__canvas--add {
  cursor: crosshair;
}

.editor__canvas--simulate {
  cursor: default;
}

.editor__stage {
  position: relative;
  box-sizing: border-box;
  min-width: 100%;
  min-height: 100%;
}

.editor__stage--centered {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 40px 40px 56px;
}

.editor__stage-board {
  position: relative;
  flex-shrink: 0;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.editor__preview {
  width: fit-content;
  max-width: none;
}

.editor__canvas-banner {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  box-sizing: border-box;
  padding: 8px 12px;
  font-size: 11px;
  line-height: 1.4;
  text-align: center;
  pointer-events: none;
}

.editor__canvas-banner--simulate {
  color: var(--td-text-color-secondary);
  background: color-mix(in srgb, var(--td-bg-color-container) 92%, transparent);
  border-bottom: 1px solid var(--td-component-border);
  backdrop-filter: blur(6px);
}

.editor__canvas-banner--interaction {
  color: var(--td-brand-color);
  background: color-mix(in srgb, var(--td-brand-color) 8%, var(--td-bg-color-container) 88%);
  border-bottom: 1px solid color-mix(in srgb, var(--td-brand-color) 22%, var(--td-component-border));
  backdrop-filter: blur(6px);
}

.editor__canvas-banner--motion {
  color: var(--td-text-color-secondary);
  background: color-mix(in srgb, var(--td-text-color-secondary) 8%, var(--td-bg-color-container) 88%);
  border-bottom: 1px solid var(--td-component-border);
}

.editor__canvas-banner-muted {
  color: var(--td-text-color-placeholder);
}

.editor__mode-switch {
  display: inline-flex;
  padding: 2px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-secondarycontainer);
}

.editor__mode-btn {
  padding: 4px 12px;
  font-size: 12px;
  border: none;
  border-radius: calc(var(--td-radius-small) - 2px);
  background: transparent;
  color: var(--td-text-color-secondary);
  cursor: pointer;
}

.editor__mode-btn--active {
  background: var(--td-bg-color-container);
  color: var(--td-brand-color);
  font-weight: 500;
  box-shadow: var(--td-shadow-1);
}

.editor__layers {
  width: var(--flow-sidebar-width);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--td-component-border);
  background: var(--td-bg-color-container);
}

.editor__layers-head {
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  border-bottom: 1px solid var(--td-component-border);
}

.editor__layers-body {
  flex: 1;
  padding: 8px;
  overflow: auto;
  min-height: 0;
}

.editor__logic-panel {
  width: var(--flow-sidebar-width);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--td-component-border);
  background: var(--td-bg-color-container);
  min-height: 0;
}

.editor__logic-panel-head {
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  border-bottom: 1px solid var(--td-component-border);
}

.editor__logic-panel-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 0;
}

.editor__code-rail {
  width: var(--flow-sidebar-right-width);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-left: 1px solid var(--td-component-border);
  background: var(--td-bg-color-container);
}

.editor__code-rail-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  border-bottom: 1px solid var(--td-component-border);
}

.editor__code-rail-hint {
  font-size: 10px;
  font-weight: 400;
  color: var(--td-text-color-placeholder);
  white-space: nowrap;
}

.editor__code-rail-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.editor__props {
  width: var(--flow-sidebar-right-width);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-left: 1px solid var(--td-component-border);
  background: var(--td-bg-color-container);
  position: relative;
  z-index: 1;
}

.editor__props-head {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 600;
  border-bottom: 1px solid var(--td-component-border);
  background: var(--td-bg-color-container);
  flex-shrink: 0;
  position: relative;
  z-index: 10;
  pointer-events: auto;
}

.editor__props-title {
  font-size: 13px;
  font-weight: 600;
}

.editor__props-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 0 12px;
  border-top: 1px solid var(--td-component-border);
  background: var(--td-bg-color-container);
  flex-shrink: 0;
  position: relative;
  z-index: 200;
}

.editor__toolbar-left, .editor__toolbar-right { display: flex; align-items: center; gap: 6px; }

.editor__file-label {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  color: var(--td-text-color-placeholder);
  padding: 0 4px;
}

.editor__file-wrap,
.editor__insert-wrap {
  position: relative;
}

.editor__file-input {
  display: none;
}

.editor__file-menu {
  position: absolute;
  right: 0;
  bottom: calc(100% + 6px);
  z-index: 30;
  min-width: 220px;
  max-height: 280px;
  overflow: auto;
  padding: 4px;
  background: var(--td-bg-color-container);
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  box-shadow: var(--td-shadow-2);
}

.editor__insert-menu {
  left: 0;
  right: auto;
}

.editor__file-menu-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: var(--td-radius-small);
  background: transparent;
  text-align: left;
  cursor: pointer;
  color: var(--td-text-color-primary);
}

.editor__file-menu-item:hover {
  background: var(--td-bg-color-container-hover);
}

.editor__file-menu-item--active {
  background: var(--td-brand-color-light);
}

.editor__file-menu-name {
  font-size: 12px;
}

.editor__file-menu-tag {
  font-size: 10px;
  color: var(--td-text-color-secondary);
}

.editor__file-menu-meta {
  font-size: 10px;
  color: var(--td-text-color-placeholder);
}

.editor__file-menu-divider {
  padding: 6px 10px 4px;
  font-size: 10px;
  color: var(--td-text-color-placeholder);
}

.editor__file-menu-path {
  font-weight: 500;
  color: var(--td-text-color-secondary);
  word-break: break-all;
}

.editor__file-menu-empty {
  padding: 12px 10px;
  font-size: 11px;
  color: var(--td-text-color-placeholder);
  line-height: 1.4;
}

.editor__toolbar-sep {
  width: 1px;
  height: 18px;
  background: var(--td-component-border);
  margin: 0 4px;
}

.editor__shortcut-label {
  font-size: 11px;
  color: var(--td-text-color-placeholder);
  white-space: nowrap;
}

.editor__toolbar-btn {
  padding: 4px 12px;
  font-size: 12px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-container);
  color: var(--td-text-color-secondary);
  cursor: pointer;
}
.editor__toolbar-btn:hover { border-color: var(--td-brand-color); color: var(--td-brand-color); }
.editor__toolbar-btn--active { background: var(--td-brand-color-light); border-color: var(--td-brand-color); color: var(--td-brand-color); }

.editor__history-wrap {
  position: relative;
}

.editor__history-menu {
  position: absolute;
  bottom: calc(100% + 6px);
  right: 0;
  min-width: 160px;
  max-height: 240px;
  overflow: auto;
  padding: 4px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: var(--td-bg-color-container);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  z-index: 20;
}

.editor__history-item {
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

.editor__history-item:hover {
  background: var(--td-bg-color-container-hover);
}

.editor__history-item--active {
  color: var(--td-brand-color);
  background: var(--td-brand-color-light);
}

.editor__code {
  height: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--td-component-border);
  background: var(--td-bg-color-container);
}

.editor__code-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  border-bottom: 1px solid var(--td-component-border);
}

.editor__code-close {
  padding: 2px 8px;
  font-size: 11px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-small);
  background: transparent;
  cursor: pointer;
}

.editor__code-error {
  padding: 6px 12px;
  font-size: 11px;
  line-height: 1.4;
  color: var(--td-error-color);
  background: var(--td-error-color-1);
  border-bottom: 1px solid var(--td-error-color-3);
}

.editor__code-body {
  flex: 1;
  min-height: 0;
}

.editor__hint {
  color: var(--td-text-color-placeholder);
  font-size: 13px;
}
</style>

<!-- 全局样式：画布元素高亮 + 编辑模式 -->
<style>
.el-hover {
  outline: 2px solid #409eff !important;
  outline-offset: -2px;
}

.el-editing {
  outline: 2px solid #e6a23c !important;
  outline-offset: 1px;
  user-select: text !important;
  cursor: text;
}

.el-drop-target {
  outline: 2px dashed #67c23a !important;
  outline-offset: 2px;
  transition: outline-color 0.22s ease, outline-offset 0.22s ease;
}

.editor-drag-lift {
  cursor: grabbing !important;
  opacity: 0.94;
  transition:
    box-shadow 0.22s cubic-bezier(0.2, 0, 0, 1),
    opacity 0.22s ease;
  box-shadow:
    0 12px 32px rgba(15, 23, 42, 0.14),
    0 2px 8px rgba(15, 23, 42, 0.08);
  will-change: left, top, transform;
}

.editor-drag-placeholder {
  border-radius: 4px;
  background: rgba(64, 158, 255, 0.1);
  outline: 1px dashed rgba(64, 158, 255, 0.45);
  transition:
    width 0.22s cubic-bezier(0.2, 0, 0, 1),
    height 0.22s cubic-bezier(0.2, 0, 0, 1),
    min-width 0.22s cubic-bezier(0.2, 0, 0, 1),
    min-height 0.22s cubic-bezier(0.2, 0, 0, 1),
    opacity 0.22s ease,
    transform 0.22s cubic-bezier(0.2, 0, 0, 1);
  animation: editor-ph-in 0.22s cubic-bezier(0.2, 0, 0, 1);
}

@keyframes editor-ph-in {
  from {
    opacity: 0;
    transform: scale(0.97);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .editor-drag-lift {
    transition: none;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1);
  }

  .editor-drag-placeholder {
    animation: none;
    transition: none;
  }

  .el-drop-target {
    transition: none;
  }
}
</style>
