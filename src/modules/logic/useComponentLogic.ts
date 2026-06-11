import { ref, watch, type Ref } from 'vue'
import {
  type ComponentLogicModel,
  type LogicBlockStub,
  type LogicEmitDef,
  type LogicLifecycleBlock,
  type LogicMethodDef,
  type LogicPropDef,
  type LogicVariableDef,
  type VueLifecycleHook,
  createDefaultLogicModel,
  createLogicId,
} from './logicTypes'
import {
  LEGACY_BLOCK_KIND_TO_TYPE,
  getLogicBlockCatalogEntry,
  LOGIC_BLOCK_CATALOG,
  type LogicBlockCatalogEntry,
} from './logicBlockCatalog'
import {
  assertBlockDefaultBodiesComplete,
  getDefaultBlockBody,
  getDefaultLifecycleBody,
} from './logicBlockDefaultBodies'

assertBlockDefaultBodiesComplete(LOGIC_BLOCK_CATALOG.map((e) => e.type))

function storageKey(fileId: string | null): string {
  return fileId ? `flow-component-logic:${fileId}` : 'flow-component-logic:draft'
}

const LEGACY_LIFECYCLE_KIND = 'lifecycle'

const LEGACY_TODO = '// TODO'

function resolveBlockBody(
  entry: LogicBlockCatalogEntry,
  rawBody: unknown,
  name?: string,
): string {
  if (typeof rawBody === 'string' && rawBody.trim() !== '' && rawBody !== LEGACY_TODO) {
    return rawBody
  }
  return getDefaultBlockBody(entry, name)
}

function normalizeBlock(raw: Record<string, unknown>): LogicBlockStub | null {
  const id = typeof raw.id === 'string' ? raw.id : createLogicId('block')

  if (typeof raw.type === 'string' && typeof raw.category === 'string') {
    const entry = getLogicBlockCatalogEntry(raw.type)
    return {
      id,
      type: raw.type,
      category: (raw.category as LogicBlockStub['category']),
      name: typeof raw.name === 'string' ? raw.name : entry?.defaultName ?? raw.type,
      templateEvent: typeof raw.templateEvent === 'string'
        ? raw.templateEvent
        : entry?.templateEvent,
      eventModifier: typeof raw.eventModifier === 'string' ? raw.eventModifier : '',
      body: entry
        ? resolveBlockBody(
          entry,
          raw.body,
          typeof raw.name === 'string' ? raw.name : undefined,
        )
        : (typeof raw.body === 'string' ? raw.body : LEGACY_TODO),
      boundElIndex: typeof raw.boundElIndex === 'number' ? raw.boundElIndex : null,
    }
  }

  const legacyKind = typeof raw.kind === 'string' ? raw.kind : null
  if (legacyKind) {
    const type = LEGACY_BLOCK_KIND_TO_TYPE[legacyKind] ?? 'method.function'
    const entry = getLogicBlockCatalogEntry(type)
    if (!entry) return null
    return {
      id,
      type,
      category: entry.category,
      name: typeof raw.name === 'string' && raw.name !== legacyKind
        ? raw.name
        : entry.defaultName ?? type,
      templateEvent: entry.templateEvent,
      eventModifier: '',
      body: resolveBlockBody(
        entry,
        raw.body,
        typeof raw.name === 'string' && raw.name !== legacyKind ? raw.name : undefined,
      ),
      boundElIndex: typeof raw.boundElIndex === 'number' ? raw.boundElIndex : null,
    }
  }

  return null
}

function resolveLifecycleBody(hook: VueLifecycleHook, rawBody: unknown): string {
  if (typeof rawBody === 'string' && rawBody.trim() !== '' && rawBody !== LEGACY_TODO) {
    return rawBody
  }
  return getDefaultLifecycleBody(hook)
}

function normalizeLogicModel(parsed: Partial<ComponentLogicModel> & { blocks?: unknown[] }): ComponentLogicModel {
  const base = {
    ...createDefaultLogicModel(),
    ...parsed,
    props: parsed.props ?? [],
    emits: parsed.emits ?? [],
    variables: parsed.variables ?? [],
    methods: parsed.methods ?? [],
    lifecycles: parsed.lifecycles ?? [],
    blocks: parsed.blocks ?? [],
  }

  const lifecycles: LogicLifecycleBlock[] = (base.lifecycles as LogicLifecycleBlock[]).map((lc) => ({
    id: lc.id,
    hook: lc.hook,
    body: resolveLifecycleBody(lc.hook, lc.body),
  }))
  const blocks: LogicBlockStub[] = []

  for (const block of base.blocks) {
    const rawKind = (block as { kind?: string }).kind
    if (rawKind === LEGACY_LIFECYCLE_KIND) {
      const legacy = block as LogicBlockStub & { name: string }
      const hook = guessLifecycleHook(legacy.name)
      lifecycles.push({
        id: legacy.id,
        hook,
        body: resolveLifecycleBody(hook, legacy.body),
      })
      continue
    }
    const normalized = normalizeBlock(block as unknown as Record<string, unknown>)
    if (normalized) blocks.push(normalized)
  }

  return { ...base, lifecycles, blocks }
}

function guessLifecycleHook(name: string): VueLifecycleHook {
  const normalized = name.trim()
  if (normalized.startsWith('on') && normalized.length > 2) {
    return normalized as VueLifecycleHook
  }
  return 'onMounted'
}

export function loadComponentLogic(fileId: string | null): ComponentLogicModel {
  try {
    const raw = localStorage.getItem(storageKey(fileId))
    if (!raw) return createDefaultLogicModel()
    const parsed = JSON.parse(raw) as Partial<ComponentLogicModel>
    return normalizeLogicModel(parsed)
  } catch {
    return createDefaultLogicModel()
  }
}

function loadLogic(fileId: string | null): ComponentLogicModel {
  return loadComponentLogic(fileId)
}

export function useComponentLogic(fileId: Ref<string | null>) {
  const logic = ref<ComponentLogicModel>(loadLogic(fileId.value))

  watch(
    fileId,
    (id) => {
      logic.value = loadLogic(id)
    },
  )

  watch(
    logic,
    (val) => {
      localStorage.setItem(storageKey(fileId.value), JSON.stringify(val))
    },
    { deep: true },
  )

  function addProp(partial?: Partial<LogicPropDef>) {
    logic.value.props.push({
      id: createLogicId('prop'),
      name: 'propName',
      type: 'string',
      required: false,
      defaultValue: '',
      ...partial,
    })
  }

  function removeProp(id: string) {
    logic.value.props = logic.value.props.filter((p) => p.id !== id)
  }

  function updateProp(id: string, patch: Partial<LogicPropDef>) {
    const item = logic.value.props.find((p) => p.id === id)
    if (item) Object.assign(item, patch)
  }

  function addEmit(partial?: Partial<LogicEmitDef>) {
    logic.value.emits.push({
      id: createLogicId('emit'),
      name: 'change',
      payloadHint: '',
      ...partial,
    })
  }

  function removeEmit(id: string) {
    logic.value.emits = logic.value.emits.filter((e) => e.id !== id)
  }

  function updateEmit(id: string, patch: Partial<LogicEmitDef>) {
    const item = logic.value.emits.find((e) => e.id === id)
    if (item) Object.assign(item, patch)
  }

  function addVariable(partial?: Partial<LogicVariableDef>) {
    logic.value.variables.push({
      id: createLogicId('var'),
      name: 'count',
      kind: 'ref',
      typeHint: 'number',
      initialValue: '0',
      ...partial,
    })
  }

  function removeVariable(id: string) {
    logic.value.variables = logic.value.variables.filter((v) => v.id !== id)
  }

  function updateVariable(id: string, patch: Partial<LogicVariableDef>) {
    const item = logic.value.variables.find((v) => v.id === id)
    if (item) Object.assign(item, patch)
  }

  function addMethod(partial?: Partial<LogicMethodDef>) {
    logic.value.methods.push({
      id: createLogicId('fn'),
      name: 'onClick',
      params: '',
      body: '// TODO',
      isAsync: false,
      ...partial,
    })
  }

  function removeMethod(id: string) {
    logic.value.methods = logic.value.methods.filter((m) => m.id !== id)
  }

  function updateMethod(id: string, patch: Partial<LogicMethodDef>) {
    const item = logic.value.methods.find((m) => m.id === id)
    if (item) Object.assign(item, patch)
  }

  /** 按 catalog 类型添加逻辑块 */
  function addBlock(blockType: string, partial?: Partial<LogicBlockStub>) {
    const entry = getLogicBlockCatalogEntry(blockType)
    if (!entry) return
    const name = partial?.name ?? entry.defaultName ?? blockType.split('.').pop() ?? 'handler'
    logic.value.blocks.push({
      id: createLogicId('block'),
      type: blockType,
      category: entry.category,
      name,
      templateEvent: entry.templateEvent,
      eventModifier: '',
      body: getDefaultBlockBody(entry, name),
      boundElIndex: null,
      ...partial,
    })
  }

  function updateBlock(id: string, patch: Partial<LogicBlockStub>) {
    const item = logic.value.blocks.find((b) => b.id === id)
    if (item) Object.assign(item, patch)
  }

  function removeBlock(id: string) {
    logic.value.blocks = logic.value.blocks.filter((b) => b.id !== id)
  }

  function addLifecycle(hook: VueLifecycleHook, partial?: Partial<LogicLifecycleBlock>) {
    logic.value.lifecycles.push({
      id: createLogicId('lc'),
      hook,
      body: getDefaultLifecycleBody(hook),
      ...partial,
    })
  }

  function removeLifecycle(id: string) {
    logic.value.lifecycles = logic.value.lifecycles.filter((l) => l.id !== id)
  }

  function updateLifecycle(id: string, patch: Partial<LogicLifecycleBlock>) {
    const item = logic.value.lifecycles.find((l) => l.id === id)
    if (item) Object.assign(item, patch)
  }

  return {
    logic,
    addProp,
    removeProp,
    updateProp,
    addEmit,
    removeEmit,
    updateEmit,
    addVariable,
    removeVariable,
    updateVariable,
    addMethod,
    removeMethod,
    updateMethod,
    addBlock,
    updateBlock,
    removeBlock,
    addLifecycle,
    removeLifecycle,
    updateLifecycle,
  }
}
