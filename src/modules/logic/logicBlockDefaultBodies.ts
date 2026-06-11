import type { LogicBlockCatalogEntry } from './logicBlockCatalog'
import type { VueLifecycleHook } from './logicTypes'

/** 占位符：会被 defaultName 替换 */
function withName(template: string, name: string): string {
  return template.replaceAll('{name}', name)
}

/**
 * 各逻辑块类型的默认代码片段（块内 body 字段，非整段 SFC）。
 * 键 = catalog type id
 */
const BLOCK_DEFAULT_BODIES: Record<string, string> = {
  // ── 响应式状态（初值 / 表达式） ──
  'state.ref': '0',
  'state.reactive': '{\n  loading: false,\n  items: [],\n}',
  'state.shallowRef': '{ label: "示例" }',
  'state.shallowReactive': '{\n  count: 0,\n}',
  'state.readonly': 'count',

  // ── 计算属性 ──
  'computed.getter': 'return count.value * 2',
  'computed.writable': 'get: () => firstName.value + " " + lastName.value,\nset: (val) => {\n  [firstName.value, lastName.value] = val.split(" ")\n}',

  // ── 侦听器 ──
  'watch.source': 'watch(count, (newVal, oldVal) => {\n  console.log(newVal, oldVal)\n})',
  'watch.effect': 'watchEffect(() => {\n  console.log(count.value)\n})',
  'watch.immediate': 'watch(count, (val) => {\n  console.log(val)\n}, { immediate: true })',
  'watch.deep': 'watch(state, (val) => {\n  console.log(JSON.stringify(val))\n}, { deep: true })',

  // ── 方法与函数 ──
  'method.function': 'return true',
  'method.async': 'const res = await fetch("/api/data")\nreturn res.json()',
  'method.arrow': 'console.log("action")',

  // ── DOM / 模板事件（handler 函数体） ──
  'dom-event.click': '⟦var:count⟧ += 1',
  'dom-event.dblclick': 'console.log("double click")',
  'dom-event.contextmenu': 'console.log("context menu")',
  'dom-event.mousedown': 'console.log("mouse down", event.button)',
  'dom-event.mouseup': 'console.log("mouse up")',
  'dom-event.mouseenter': 'isHovered.value = true',
  'dom-event.mouseleave': 'isHovered.value = false',
  'dom-event.mouseover': 'console.log("mouseover")',
  'dom-event.mouseout': 'console.log("mouseout")',
  'dom-event.mousemove': 'console.log(event.clientX, event.clientY)',
  'dom-event.pointerdown': 'console.log("pointer down")',
  'dom-event.pointerup': 'console.log("pointer up")',
  'dom-event.pointerenter': 'isActive.value = true',
  'dom-event.pointerleave': 'isActive.value = false',
  'dom-event.touchstart': 'console.log("touch start", event.touches.length)',
  'dom-event.touchend': 'console.log("touch end")',
  'dom-event.touchmove': 'event.preventDefault()',
  'dom-event.touchcancel': 'console.log("touch cancel")',
  'dom-event.keydown': 'if (event.key === "Enter") {\n  // 提交\n}',
  'dom-event.keyup': 'console.log("keyup", event.key)',
  'dom-event.keypress': 'console.log("keypress", event.key)',
  'dom-event.focus': 'console.log("focused")',
  'dom-event.blur': 'console.log("blurred")',
  'dom-event.focusin': 'console.log("focus in")',
  'dom-event.focusout': 'console.log("focus out")',
  'dom-event.input': 'value.value = (event.target as HTMLInputElement).value',
  'dom-event.change': 'console.log("value changed", event)',
  'dom-event.submit': 'event.preventDefault()\n// 校验并提交',
  'dom-event.reset': 'console.log("form reset")',
  'dom-event.invalid': 'console.log("validation failed")',
  'dom-event.scroll': 'console.log("scroll", event.target)',
  'dom-event.wheel': 'event.preventDefault()',
  'dom-event.dragstart': 'event.dataTransfer?.setData("text/plain", "item")',
  'dom-event.dragend': 'console.log("drag end")',
  'dom-event.dragover': 'event.preventDefault()',
  'dom-event.drop': 'event.preventDefault()\nconsole.log("dropped")',
  'dom-event.play': 'console.log("playing")',
  'dom-event.pause': 'console.log("paused")',
  'dom-event.ended': 'console.log("playback ended")',
  'dom-event.timeupdate': 'progress.value = (event.target as HTMLMediaElement).currentTime',
  'dom-event.volumechange': 'console.log("volume changed")',
  'dom-event.load': 'console.log("resource loaded")',
  'dom-event.error': 'console.error("resource error")',
  'dom-event.transitionend': 'console.log("transition ended")',
  'dom-event.animationend': 'console.log("animation ended")',

  // ── 组件事件 ──
  'component-event.custom': 'console.log(payload)',
  'component-event.v-model': 'modelValue.value = payload',
  'component-event.v-model-arg': 'visible.value = payload',
  'component-event.native': 'console.log("native event on root")',

  // ── 模板绑定（表达式 / 对象字面量） ──
  'template-binding.prop': 'count',
  'template-binding.attr': '{ id: "main", disabled: loading.value }',
  'template-binding.class': '{ active: isActive.value, disabled: loading.value }',
  'template-binding.style': '{ color: isActive.value ? "#0052d9" : "#666" }',

  // ── 定时与条件 ──
  'timing.delay': 'setTimeout(() => {\n  console.log("delayed")\n}, 300)',
  'timing.interval': 'const timer = setInterval(() => {\n  console.log("tick")\n}, 1000)\n// onUnmounted(() => clearInterval(timer))',
  'timing.debounce': 'let timer: ReturnType<typeof setTimeout>\nreturn (...args: unknown[]) => {\n  clearTimeout(timer)\n  timer = setTimeout(() => fn(...args), 300)\n}',
  'timing.throttle': 'let locked = false\nreturn (...args: unknown[]) => {\n  if (locked) return\n  locked = true\n  fn(...args)\n  setTimeout(() => { locked = false }, 300)\n}',
  'timing.conditional': 'if (condition.value) {\n  // 条件成立\n} else {\n  // 条件不成立\n}',

  // ── 组合式 / 高级 ──
  'composable.custom': 'const { data, loading } = useFeature()',
  'composable.provide': 'provide("theme", theme)',
  'composable.inject': 'const theme = inject("theme", "light")',
  'composable.expose': 'defineExpose({ open, close })',
  'composable.templateRef': 'const elRef = ref<HTMLElement | null>(null)',
  'composable.nextTick': 'nextTick(() => {\n  console.log("DOM updated")\n})',
}

/** 生命周期钩子默认回调体 */
const LIFECYCLE_DEFAULT_BODIES: Record<VueLifecycleHook, string> = {
  onBeforeMount: '// DOM 挂载前初始化',
  onMounted: '// 挂载完成：拉数据、绑定第三方库\n// await fetchData()',
  onBeforeUpdate: '// 数据变更、DOM 更新前',
  onUpdated: '// DOM 已更新',
  onBeforeUnmount: '// 卸载前清理',
  onUnmounted: '// 清理定时器 / 事件监听\n// clearInterval(timer)',
  onActivated: '// keep-alive 组件被激活',
  onDeactivated: '// keep-alive 组件被缓存隐藏',
  onErrorCaptured: 'console.error(err)\nreturn false',
  onServerPrefetch: '// SSR 预取数据\n// await store.fetch()',
}

export function getDefaultBlockBody(
  entry: LogicBlockCatalogEntry,
  name?: string,
): string {
  const varName = name ?? entry.defaultName ?? 'value'
  const template = BLOCK_DEFAULT_BODIES[entry.type]
  if (template) return withName(template, varName)
  return `// ${entry.labelZh}\n// TODO: ${entry.type}`
}

export function getDefaultLifecycleBody(hook: VueLifecycleHook): string {
  return LIFECYCLE_DEFAULT_BODIES[hook] ?? '// lifecycle callback'
}

/** 开发期校验：catalog 中每个 type 都应有默认 body */
export function assertBlockDefaultBodiesComplete(catalogTypes: string[]): void {
  if (!import.meta.env.DEV) return
  const missing = catalogTypes.filter((t) => !BLOCK_DEFAULT_BODIES[t])
  if (missing.length > 0) {
    console.warn('[logicBlockDefaultBodies] missing defaults for:', missing.join(', '))
  }
}
