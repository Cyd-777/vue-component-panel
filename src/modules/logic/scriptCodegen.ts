import type { ComponentLogicModel, LogicBlockStub, LogicMethodDef, LogicVariableDef, VueLifecycleHook } from './logicTypes'
import { applyLogicBindingsToTemplate } from './templateBindingCodegen'
import { expandLogicBody, type LogicTokenContext } from './logicTokens'

export interface ComponentImportLine {
  tag: string
  path: string
}

function indentBlock(body: string, spaces = 2): string {
  const pad = ' '.repeat(spaces)
  return body
    .split('\n')
    .map((line) => (line.trim() ? `${pad}${line}` : line))
    .join('\n')
}

function expand(body: string, ctx: LogicTokenContext): string {
  return expandLogicBody(body.trim(), ctx)
}

function isValidIdent(name: string): boolean {
  return /^[$A-Z_a-z][\w$]*$/.test(name)
}

function handlerParams(block: LogicBlockStub): string {
  const ev = block.templateEvent ?? ''
  if (ev.startsWith('key')) return 'event: KeyboardEvent'
  if (['click', 'dblclick', 'mousedown', 'mouseup', 'mouseenter', 'mouseleave', 'mouseover', 'mouseout', 'mousemove', 'contextmenu', 'wheel'].includes(ev)) {
    return 'event: MouseEvent'
  }
  if (ev.startsWith('touch')) return 'event: TouchEvent'
  return 'event: Event'
}

function blockHandlerParams(block: LogicBlockStub): string {
  if (block.category === 'dom-event' || block.category === 'component-event') {
    return handlerParams(block)
  }
  return ''
}

/** 从逻辑模型构建 token 展开上下文 */
export function buildLogicTokenContext(logic: ComponentLogicModel): LogicTokenContext {
  const varMap = new Map<string, LogicTokenContext['variables'][0]>()
  for (const v of logic.variables) {
    if (isValidIdent(v.name)) varMap.set(v.name, { name: v.name, kind: v.kind, label: v.name })
  }
  for (const b of logic.blocks) {
    if (b.category !== 'state' || !isValidIdent(b.name)) continue
    if (varMap.has(b.name)) continue
    const kind = b.type.includes('reactive') && !b.type.includes('Ref') ? 'reactive' : 'ref'
    varMap.set(b.name, { name: b.name, kind, label: b.name })
  }

  const methodMap = new Map<string, LogicTokenContext['methods'][0]>()
  for (const m of logic.methods) {
    if (isValidIdent(m.name)) methodMap.set(m.name, { name: m.name, label: m.name })
  }
  for (const b of logic.blocks) {
    if (!isValidIdent(b.name)) continue
    if (b.category === 'method' || b.category === 'dom-event' || b.category === 'component-event') {
      if (!methodMap.has(b.name)) methodMap.set(b.name, { name: b.name, label: b.name })
    }
  }

  return {
    variables: [...varMap.values()],
    methods: [...methodMap.values()],
    props: logic.props.filter((p) => isValidIdent(p.name)).map((p) => ({ name: p.name, label: p.name })),
    emits: logic.emits.filter((e) => isValidIdent(e.name)).map((e) => ({ name: e.name, label: e.name })),
  }
}

function collectVueImports(logic: ComponentLogicModel, blocks: LogicBlockStub[]): Set<string> {
  const names = new Set<string>()
  const add = (n: string) => { if (n) names.add(n) }

  for (const v of logic.variables) {
    add(v.kind === 'ref' ? 'ref' : 'reactive')
  }
  for (const b of blocks) {
    if (b.type.startsWith('state.ref') || b.type.startsWith('state.shallowRef')) add('ref')
    if (b.type.startsWith('state.reactive') || b.type.startsWith('state.shallowReactive')) add('reactive')
    if (b.type.startsWith('state.shallowRef')) add('shallowRef')
    if (b.type.startsWith('state.shallowReactive')) add('shallowReactive')
    if (b.type.startsWith('state.readonly')) add('readonly')
    if (b.type.startsWith('computed.')) add('computed')
    if (b.type.startsWith('watch.source') || b.type.startsWith('watch.immediate') || b.type.startsWith('watch.deep')) add('watch')
    if (b.type.startsWith('watch.effect')) add('watchEffect')
    if (b.type.startsWith('composable.provide')) add('provide')
    if (b.type.startsWith('composable.inject')) add('inject')
    if (b.type.startsWith('composable.expose')) add('defineExpose')
    if (b.type.startsWith('composable.nextTick')) add('nextTick')
  }
  for (const lc of logic.lifecycles) add(lc.hook)
  if (logic.props.length) add('defineProps')
  if (logic.emits.length) add('defineEmits')
  return names
}

function emitPropsBlock(logic: ComponentLogicModel): string[] {
  if (logic.props.length === 0) return []
  const lines = logic.props.map((p) => {
    const req = p.required ? '' : '?'
    return `  ${p.name}${req}: ${p.type}`
  })
  return ['const props = defineProps<{', ...lines, '}>()']
}

function emitEmitsBlock(logic: ComponentLogicModel): string[] {
  if (logic.emits.length === 0) return []
  const lines = logic.emits.map((e) => {
    const hint = e.payloadHint.trim()
    return hint ? `  (e: '${e.name}', payload: ${hint}): void` : `  (e: '${e.name}'): void`
  })
  return ['const emit = defineEmits<{', ...lines, '}>()']
}

function emitVariable(v: LogicVariableDef, ctx: LogicTokenContext): string | null {
  if (!isValidIdent(v.name)) return null
  const init = expand(v.initialValue || 'undefined', ctx)
  if (v.kind === 'ref') return `const ${v.name} = ref(${init})`
  return `const ${v.name} = reactive(${init})`
}

function emitMethod(m: LogicMethodDef, ctx: LogicTokenContext): string | null {
  if (!isValidIdent(m.name)) return null
  const params = m.params.trim()
  const body = expand(m.body, ctx)
  const head = m.isAsync ? `async function ${m.name}` : `function ${m.name}`
  return `${head}(${params}) {\n${indentBlock(body)}\n}`
}

function emitStateBlock(block: LogicBlockStub, ctx: LogicTokenContext, declared: Set<string>): string | null {
  if (!isValidIdent(block.name) || declared.has(block.name)) return null
  declared.add(block.name)
  const body = expand(block.body, ctx)
  if (block.type === 'state.ref') return `const ${block.name} = ref(${body || 'undefined'})`
  if (block.type === 'state.reactive') return `const ${block.name} = reactive(${body || '{}'})`
  if (block.type === 'state.shallowRef') return `const ${block.name} = shallowRef(${body || 'undefined'})`
  if (block.type === 'state.shallowReactive') return `const ${block.name} = shallowReactive(${body || '{}'})`
  if (block.type === 'state.readonly') return `const ${block.name} = readonly(${body || 'source'})`
  return null
}

function emitComputedBlock(block: LogicBlockStub, ctx: LogicTokenContext, declared: Set<string>): string | null {
  if (!isValidIdent(block.name) || declared.has(block.name)) return null
  declared.add(block.name)
  const body = expand(block.body, ctx)
  if (block.type === 'computed.writable') {
    return `const ${block.name} = computed({\n${indentBlock(body)}\n})`
  }
  return `const ${block.name} = computed(() => {\n${indentBlock(body)}\n})`
}

function emitWatchBlock(block: LogicBlockStub, ctx: LogicTokenContext): string | null {
  const body = expand(block.body, ctx)
  if (!body) return null
  return body.includes('watch(') || body.includes('watchEffect(') ? body : `watch(/* source */, ${body})`
}

function emitHandlerBlock(block: LogicBlockStub, ctx: LogicTokenContext, declared: Set<string>): string | null {
  if (!isValidIdent(block.name) || declared.has(block.name)) return null
  declared.add(block.name)
  const body = expand(block.body, ctx)
  const params = blockHandlerParams(block)
  if (block.type === 'method.async') {
    return `async function ${block.name}(${params}) {\n${indentBlock(body)}\n}`
  }
  if (block.type === 'method.arrow') {
    return `const ${block.name} = (${params}) => {\n${indentBlock(body)}\n}`
  }
  if (block.category === 'method' || block.category === 'dom-event' || block.category === 'component-event') {
    return `function ${block.name}(${params}) {\n${indentBlock(body)}\n}`
  }
  return null
}

function emitRawBlock(block: LogicBlockStub, ctx: LogicTokenContext): string | null {
  const body = expand(block.body, ctx)
  if (!body) return null
  return body
}

function emitLifecycle(hook: VueLifecycleHook, body: string, ctx: LogicTokenContext): string {
  const expanded = expand(body, ctx)
  return `${hook}(() => {\n${indentBlock(expanded || '//')}\n})`
}

/** 生成 `<script setup>` 内部 TS（不含外层 script 标签） */
export function generateScriptSetup(
  logic: ComponentLogicModel,
  componentImports: ComponentImportLine[] = [],
): string {
  const ctx = buildLogicTokenContext(logic)
  const blocks = logic.blocks
  const vueImports = collectVueImports(logic, blocks)
  const lines: string[] = []

  if (vueImports.size) {
    lines.push(`import { ${[...vueImports].sort().join(', ')} } from 'vue'`)
  }
  for (const imp of componentImports) {
    lines.push(`import ${imp.tag} from '${imp.path}'`)
  }
  if (lines.length) lines.push('')

  const propsLines = emitPropsBlock(logic)
  if (propsLines.length) {
    lines.push(...propsLines, '')
  }
  const emitsLines = emitEmitsBlock(logic)
  if (emitsLines.length) {
    lines.push(...emitsLines, '')
  }

  const declared = new Set<string>()

  for (const v of logic.variables) {
    const code = emitVariable(v, ctx)
    if (code) {
      declared.add(v.name)
      lines.push(code)
    }
  }

  for (const b of blocks.filter((x) => x.category === 'state')) {
    const code = emitStateBlock(b, ctx, declared)
    if (code) lines.push(code)
  }

  if (lines.length && lines[lines.length - 1] !== '') lines.push('')

  for (const b of blocks.filter((x) => x.category === 'computed')) {
    const code = emitComputedBlock(b, ctx, declared)
    if (code) lines.push(code)
  }

  for (const m of logic.methods) {
    const code = emitMethod(m, ctx)
    if (code && !declared.has(m.name)) {
      declared.add(m.name)
      lines.push(code)
    }
  }

  for (const b of blocks.filter((x) =>
    x.category === 'method' || x.category === 'dom-event' || x.category === 'component-event',
  )) {
    const code = emitHandlerBlock(b, ctx, declared)
    if (code) lines.push(code)
  }

  for (const b of blocks.filter((x) => x.category === 'watch')) {
    const code = emitWatchBlock(b, ctx)
    if (code) lines.push(code)
  }

  for (const b of blocks.filter((x) =>
    x.category === 'timing' || x.category === 'template-binding' || x.category === 'composable',
  )) {
    const code = emitRawBlock(b, ctx)
    if (code) lines.push(code)
  }

  for (const lc of logic.lifecycles) {
    lines.push(emitLifecycle(lc.hook, lc.body, ctx))
  }

  return lines.join('\n').trimEnd()
}

/** 将 template + 生成 script + style 合并为完整 SFC */
export function mergeSfcWithLogic(
  editorCode: string,
  logic: ComponentLogicModel,
  componentImports: ComponentImportLine[],
): string {
  const templateMatch = editorCode.match(/<template>[\s\S]*?<\/template>/i)
  const styleMatch = editorCode.match(/<style[\s\S]*?<\/style>/i)
  const templateRaw = (templateMatch?.[0] ?? '<template></template>').replace(/\s*\bdata-el-i="\d+"/g, '')
  const templateBound = applyLogicBindingsToTemplate(templateRaw, logic.blocks)
  const style = styleMatch?.[0] ?? '<style scoped>\n</style>'
  const scriptInner = generateScriptSetup(logic, componentImports)
  const script = scriptInner
    ? `<script setup lang="ts">\n${scriptInner}\n</script>`
    : '<script setup lang="ts">\n</script>'
  return `${templateBound}\n\n${script}\n\n${style}\n`
}
