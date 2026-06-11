import {
  computed,
  onActivated,
  onBeforeMount,
  onBeforeUnmount,
  onBeforeUpdate,
  onDeactivated,
  onErrorCaptured,
  onMounted,
  onServerPrefetch,
  onUnmounted,
  onUpdated,
  reactive,
  ref,
  readonly,
  shallowReactive,
  shallowRef,
} from 'vue'
import type { ComponentLogicModel, LogicBlockStub, LogicMethodDef, VueLifecycleHook } from './logicTypes'
import { buildLogicTokenContext, mergeSfcWithLogic, type ComponentImportLine } from './scriptCodegen'
import { expandLogicBody } from './logicTokens'
import {
  getPreviewRegistry,
  tryCreatePreviewComponent,
  type PreviewCompileResult,
} from '../editor/livePreview'

const LIFECYCLE_REGISTRARS: Record<VueLifecycleHook, (fn: () => void) => void> = {
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted,
  onActivated,
  onDeactivated,
  onErrorCaptured,
  onServerPrefetch,
}

function isValidIdent(name: string): boolean {
  return /^[$A-Z_a-z][\w$]*$/.test(name)
}

function evalInitialValue(source: string): unknown {
  const trimmed = source.trim()
  if (!trimmed) return undefined
  try {
    // eslint-disable-next-line no-new-func
    return new Function(`return (${trimmed})`)()
  } catch {
    return undefined
  }
}

function createRunBody(scope: Record<string, unknown>, ctx: ReturnType<typeof buildLogicTokenContext>) {
  return (body: string, event?: unknown) => {
    const expanded = expandLogicBody(body, ctx)
    if (!expanded.trim()) return
    const keys = Object.keys(scope)
    const values = keys.map((k) => scope[k])
    try {
      // eslint-disable-next-line no-new-func
      new Function(...keys, 'event', expanded)(...values, event)
    } catch (e) {
      console.warn('[InteractiveExample] run body error:', e)
    }
  }
}

function attachMethod(
  scope: Record<string, unknown>,
  name: string,
  body: string,
  runBody: ReturnType<typeof createRunBody>,
) {
  if (!isValidIdent(name) || scope[name]) return
  scope[name] = (event?: unknown) => runBody(body, event)
}

function attachHandlerBlock(
  scope: Record<string, unknown>,
  block: LogicBlockStub,
  runBody: ReturnType<typeof createRunBody>,
) {
  if (!isValidIdent(block.name)) return
  attachMethod(scope, block.name, block.body, runBody)
}

function attachDeclaredMethod(
  scope: Record<string, unknown>,
  method: LogicMethodDef,
  runBody: ReturnType<typeof createRunBody>,
) {
  if (!isValidIdent(method.name)) return
  attachMethod(scope, method.name, method.body, runBody)
}

/** 从逻辑模型构建可交互 setup 上下文（变量、方法、生命周期） */
export function buildInteractiveSetup(logic: ComponentLogicModel) {
  return () => {
    const ctx = buildLogicTokenContext(logic)
    const scope: Record<string, unknown> = {}
    const runBody = createRunBody(scope, ctx)

    for (const variable of logic.variables) {
      if (!isValidIdent(variable.name)) continue
      const init = evalInitialValue(expandLogicBody(variable.initialValue || 'undefined', ctx))
      scope[variable.name] = variable.kind === 'ref' ? ref(init) : reactive(init ?? {})
    }

    for (const block of logic.blocks) {
      if (!isValidIdent(block.name) || scope[block.name]) continue
      if (block.category === 'state') {
        const init = evalInitialValue(expandLogicBody(block.body, ctx))
        if (block.type.includes('shallowRef')) scope[block.name] = shallowRef(init)
        else if (block.type.includes('shallowReactive')) scope[block.name] = shallowReactive(init ?? {})
        else if (block.type.includes('reactive') && !block.type.includes('Ref')) scope[block.name] = reactive(init ?? {})
        else if (block.type.includes('readonly')) scope[block.name] = readonly(init ?? {})
        else scope[block.name] = ref(init)
        continue
      }
      if (block.category === 'computed') {
        scope[block.name] = computed(() => {
          try {
            const keys = Object.keys(scope)
            const values = keys.map((k) => scope[k])
            const expanded = expandLogicBody(block.body, ctx)
            // eslint-disable-next-line no-new-func
            return new Function(...keys, expanded)(...values)
          } catch {
            return undefined
          }
        })
      }
    }

    for (const method of logic.methods) {
      attachDeclaredMethod(scope, method, runBody)
    }

    for (const block of logic.blocks) {
      if (
        block.category === 'method'
        || block.category === 'dom-event'
        || block.category === 'component-event'
      ) {
        attachHandlerBlock(scope, block, runBody)
      }
    }

    for (const lc of logic.lifecycles) {
      const register = LIFECYCLE_REGISTRARS[lc.hook]
      if (!register) continue
      register(() => runBody(lc.body))
    }

    return scope
  }
}

/**
 * 编译可交互组件示例：template（含绑定）+ 逻辑 setup，供独立预览页使用。
 */
export function compileInteractiveExample(
  editorCode: string,
  logic: ComponentLogicModel,
  componentImports: ComponentImportLine[] = [],
  componentMap = getPreviewRegistry(),
): PreviewCompileResult {
  const merged = mergeSfcWithLogic(editorCode, logic, componentImports)
  return tryCreatePreviewComponent(
    merged,
    componentMap,
    buildInteractiveSetup(logic),
  )
}
