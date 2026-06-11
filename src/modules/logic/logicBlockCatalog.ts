/**
 * 逻辑块类型目录 — 与 Vue 3 `<script setup>` + template 绑定一一对应。
 * 生命周期走 LIFECYCLE_TIMELINE，不在此 catalog。
 */

export type LogicBlockCategory =
  | 'state'
  | 'computed'
  | 'watch'
  | 'method'
  | 'dom-event'
  | 'component-event'
  | 'template-binding'
  | 'timing'
  | 'composable'

export interface LogicBlockCatalogEntry {
  /** 唯一类型 id，如 dom-event.click */
  type: string
  category: LogicBlockCategory
  /** 英文/API 名（codegen 用） */
  label: string
  /** 中文名称（界面主展示） */
  labelZh: string
  /** 中文说明 */
  description: string
  /** template 事件名 → `@click` */
  templateEvent?: string
  /** 默认 handler 函数名 */
  defaultName?: string
  /** 需要锚点连到画布元素 */
  requiresBinding?: boolean
  optional?: boolean
}

export const LOGIC_BLOCK_CATEGORY_LABELS: Record<LogicBlockCategory, string> = {
  state: '响应式状态',
  computed: '计算属性',
  watch: '侦听器',
  method: '方法与函数',
  'dom-event': 'DOM / 模板事件',
  'component-event': '组件事件',
  'template-binding': '模板绑定',
  timing: '定时与条件',
  composable: '组合式 / 高级',
}

/** 快捷指令风格：分类强调色（左侧色条 / 图标底） */
export const LOGIC_BLOCK_CATEGORY_ACCENT: Record<LogicBlockCategory, string> = {
  state: '#007AFF',
  computed: '#AF52DE',
  watch: '#FF9500',
  method: '#34C759',
  'dom-event': '#FF3B30',
  'component-event': '#5AC8FA',
  'template-binding': '#5856D6',
  timing: '#FFCC00',
  composable: '#8E8E93',
}

/** 快捷指令风格：分类图标（emoji 占位，后续可换 SVG） */
export const LOGIC_BLOCK_CATEGORY_ICON: Record<LogicBlockCategory, string> = {
  state: '◆',
  computed: 'ƒ',
  watch: '👁',
  method: '⚡',
  'dom-event': '👆',
  'component-event': '📡',
  'template-binding': '🔗',
  timing: '⏱',
  composable: '🧩',
}

function entry(partial: LogicBlockCatalogEntry): LogicBlockCatalogEntry {
  return {
    requiresBinding: partial.category === 'dom-event' || partial.category === 'component-event',
    ...partial,
  }
}

/** 全量逻辑块类型目录（按 category 分组展示） */
export const LOGIC_BLOCK_CATALOG: LogicBlockCatalogEntry[] = [
  // ── 响应式状态 ──
  entry({ type: 'state.ref', category: 'state', label: 'ref', labelZh: '响应式引用', description: '基本类型用 ref 包装，如数字、字符串', defaultName: 'count' }),
  entry({ type: 'state.reactive', category: 'state', label: 'reactive', labelZh: '响应式对象', description: '对象/数组整体响应式', defaultName: 'state' }),
  entry({ type: 'state.shallowRef', category: 'state', label: 'shallowRef', labelZh: '浅层引用', description: '只追踪 .value 变化，不深度侦听', defaultName: 'shallow', optional: true }),
  entry({ type: 'state.shallowReactive', category: 'state', label: 'shallowReactive', labelZh: '浅层对象', description: '对象浅层响应式', defaultName: 'shallowState', optional: true }),
  entry({ type: 'state.readonly', category: 'state', label: 'readonly', labelZh: '只读包装', description: '禁止修改的响应式数据', defaultName: 'readonlyState', optional: true }),

  // ── 计算属性 ──
  entry({ type: 'computed.getter', category: 'computed', label: 'computed', labelZh: '计算属性', description: '根据其他数据自动计算的只读值', defaultName: 'doubled' }),
  entry({ type: 'computed.writable', category: 'computed', label: 'computed (writable)', labelZh: '可写计算属性', description: '带 getter 和 setter 的计算属性', defaultName: 'fullName', optional: true }),

  // ── 侦听器 ──
  entry({ type: 'watch.source', category: 'watch', label: 'watch', labelZh: '数据侦听', description: '监听 ref / reactive 变化后执行', defaultName: 'stopWatch' }),
  entry({ type: 'watch.effect', category: 'watch', label: 'watchEffect', labelZh: '自动侦听', description: '自动收集依赖，变化时重新执行', defaultName: 'effectCleanup' }),
  entry({ type: 'watch.immediate', category: 'watch', label: 'watch (immediate)', labelZh: '立即侦听', description: '创建时立刻执行一次回调', defaultName: 'watchImmediate', optional: true }),
  entry({ type: 'watch.deep', category: 'watch', label: 'watch (deep)', labelZh: '深度侦听', description: '深度监听对象内部属性变化', defaultName: 'watchDeep', optional: true }),

  // ── 方法与函数 ──
  entry({ type: 'method.function', category: 'method', label: 'function', labelZh: '普通函数', description: '可被多处调用的业务方法', defaultName: 'doSomething' }),
  entry({ type: 'method.async', category: 'method', label: 'async function', labelZh: '异步函数', description: 'await 请求、异步流程', defaultName: 'fetchData' }),
  entry({ type: 'method.arrow', category: 'method', label: 'arrow function', labelZh: '箭头函数', description: '箭头函数形式的常量方法', defaultName: 'handleAction', optional: true }),

  // ── DOM / 模板事件（pointer & mouse）──
  entry({ type: 'dom-event.click', category: 'dom-event', label: 'click', labelZh: '单击', description: '用户点击或轻触元素', templateEvent: 'click', defaultName: 'onClick' }),
  entry({ type: 'dom-event.dblclick', category: 'dom-event', label: 'dblclick', labelZh: '双击', description: '连续快速点击两次', templateEvent: 'dblclick', defaultName: 'onDblclick' }),
  entry({ type: 'dom-event.contextmenu', category: 'dom-event', label: 'contextmenu', labelZh: '右键菜单', description: '打开上下文菜单', templateEvent: 'contextmenu', defaultName: 'onContextmenu' }),
  entry({ type: 'dom-event.mousedown', category: 'dom-event', label: 'mousedown', labelZh: '鼠标按下', description: '按下鼠标键（按住不放起点）', templateEvent: 'mousedown', defaultName: 'onMousedown' }),
  entry({ type: 'dom-event.mouseup', category: 'dom-event', label: 'mouseup', labelZh: '鼠标释放', description: '松开鼠标键', templateEvent: 'mouseup', defaultName: 'onMouseup' }),
  entry({ type: 'dom-event.mouseenter', category: 'dom-event', label: 'mouseenter', labelZh: '指针进入', description: '鼠标移入元素区域', templateEvent: 'mouseenter', defaultName: 'onMouseenter' }),
  entry({ type: 'dom-event.mouseleave', category: 'dom-event', label: 'mouseleave', labelZh: '指针离开', description: '鼠标移出元素区域', templateEvent: 'mouseleave', defaultName: 'onMouseleave' }),
  entry({ type: 'dom-event.mouseover', category: 'dom-event', label: 'mouseover', labelZh: '悬停经过', description: '鼠标悬停在其上（含子元素）', templateEvent: 'mouseover', defaultName: 'onMouseover' }),
  entry({ type: 'dom-event.mouseout', category: 'dom-event', label: 'mouseout', labelZh: '悬停离开', description: '鼠标从元素或其子元素移出', templateEvent: 'mouseout', defaultName: 'onMouseout' }),
  entry({ type: 'dom-event.mousemove', category: 'dom-event', label: 'mousemove', labelZh: '鼠标移动', description: '鼠标在元素上移动', templateEvent: 'mousemove', defaultName: 'onMousemove', optional: true }),

  entry({ type: 'dom-event.pointerdown', category: 'dom-event', label: 'pointerdown', labelZh: '指针按下', description: '触摸/鼠标/笔按下', templateEvent: 'pointerdown', defaultName: 'onPointerdown', optional: true }),
  entry({ type: 'dom-event.pointerup', category: 'dom-event', label: 'pointerup', labelZh: '指针释放', description: '触摸/鼠标/笔释放', templateEvent: 'pointerup', defaultName: 'onPointerup', optional: true }),
  entry({ type: 'dom-event.pointerenter', category: 'dom-event', label: 'pointerenter', labelZh: '指针进入', description: '指针进入元素边界', templateEvent: 'pointerenter', defaultName: 'onPointerenter', optional: true }),
  entry({ type: 'dom-event.pointerleave', category: 'dom-event', label: 'pointerleave', labelZh: '指针离开', description: '指针离开元素边界', templateEvent: 'pointerleave', defaultName: 'onPointerleave', optional: true }),

  entry({ type: 'dom-event.touchstart', category: 'dom-event', label: 'touchstart', labelZh: '触摸开始', description: '手指接触屏幕', templateEvent: 'touchstart', defaultName: 'onTouchstart', optional: true }),
  entry({ type: 'dom-event.touchend', category: 'dom-event', label: 'touchend', labelZh: '触摸结束', description: '手指离开屏幕', templateEvent: 'touchend', defaultName: 'onTouchend', optional: true }),
  entry({ type: 'dom-event.touchmove', category: 'dom-event', label: 'touchmove', labelZh: '触摸移动', description: '手指在屏幕上滑动', templateEvent: 'touchmove', defaultName: 'onTouchmove', optional: true }),
  entry({ type: 'dom-event.touchcancel', category: 'dom-event', label: 'touchcancel', labelZh: '触摸取消', description: '触摸被系统打断', templateEvent: 'touchcancel', defaultName: 'onTouchcancel', optional: true }),

  entry({ type: 'dom-event.keydown', category: 'dom-event', label: 'keydown', labelZh: '按键按下', description: '键盘按键被按下', templateEvent: 'keydown', defaultName: 'onKeydown' }),
  entry({ type: 'dom-event.keyup', category: 'dom-event', label: 'keyup', labelZh: '按键释放', description: '键盘按键被松开', templateEvent: 'keyup', defaultName: 'onKeyup' }),
  entry({ type: 'dom-event.keypress', category: 'dom-event', label: 'keypress', labelZh: '字符键', description: '按下可打印字符键（已较少用）', templateEvent: 'keypress', defaultName: 'onKeypress', optional: true }),

  entry({ type: 'dom-event.focus', category: 'dom-event', label: 'focus', labelZh: '获得焦点', description: '元素成为当前输入焦点', templateEvent: 'focus', defaultName: 'onFocus' }),
  entry({ type: 'dom-event.blur', category: 'dom-event', label: 'blur', labelZh: '失去焦点', description: '元素失去输入焦点', templateEvent: 'blur', defaultName: 'onBlur' }),
  entry({ type: 'dom-event.focusin', category: 'dom-event', label: 'focusin', labelZh: '焦点进入', description: '焦点进入（会冒泡）', templateEvent: 'focusin', defaultName: 'onFocusin', optional: true }),
  entry({ type: 'dom-event.focusout', category: 'dom-event', label: 'focusout', labelZh: '焦点离开', description: '焦点离开（会冒泡）', templateEvent: 'focusout', defaultName: 'onFocusout', optional: true }),

  entry({ type: 'dom-event.input', category: 'dom-event', label: 'input', labelZh: '输入变化', description: '输入框等内容实时变化', templateEvent: 'input', defaultName: 'onInput' }),
  entry({ type: 'dom-event.change', category: 'dom-event', label: 'change', labelZh: '值变更', description: '输入完成、选中项改变等', templateEvent: 'change', defaultName: 'onChange' }),
  entry({ type: 'dom-event.submit', category: 'dom-event', label: 'submit', labelZh: '表单提交', description: '提交表单', templateEvent: 'submit', defaultName: 'onSubmit' }),
  entry({ type: 'dom-event.reset', category: 'dom-event', label: 'reset', labelZh: '表单重置', description: '重置表单字段', templateEvent: 'reset', defaultName: 'onReset', optional: true }),
  entry({ type: 'dom-event.invalid', category: 'dom-event', label: 'invalid', labelZh: '校验失败', description: '表单字段校验不通过', templateEvent: 'invalid', defaultName: 'onInvalid', optional: true }),

  entry({ type: 'dom-event.scroll', category: 'dom-event', label: 'scroll', labelZh: '滚动', description: '元素发生滚动', templateEvent: 'scroll', defaultName: 'onScroll', optional: true }),
  entry({ type: 'dom-event.wheel', category: 'dom-event', label: 'wheel', labelZh: '滚轮', description: '鼠标滚轮滚动', templateEvent: 'wheel', defaultName: 'onWheel', optional: true }),

  entry({ type: 'dom-event.dragstart', category: 'dom-event', label: 'dragstart', labelZh: '开始拖拽', description: '开始拖动元素', templateEvent: 'dragstart', defaultName: 'onDragstart', optional: true }),
  entry({ type: 'dom-event.dragend', category: 'dom-event', label: 'dragend', labelZh: '结束拖拽', description: '拖拽操作结束', templateEvent: 'dragend', defaultName: 'onDragend', optional: true }),
  entry({ type: 'dom-event.dragover', category: 'dom-event', label: 'dragover', labelZh: '拖拽经过', description: '拖动物经过目标上方', templateEvent: 'dragover', defaultName: 'onDragover', optional: true }),
  entry({ type: 'dom-event.drop', category: 'dom-event', label: 'drop', labelZh: '放置', description: '在目标上释放拖动物', templateEvent: 'drop', defaultName: 'onDrop', optional: true }),

  entry({ type: 'dom-event.play', category: 'dom-event', label: 'play', labelZh: '开始播放', description: '音视频开始播放', templateEvent: 'play', defaultName: 'onPlay', optional: true }),
  entry({ type: 'dom-event.pause', category: 'dom-event', label: 'pause', labelZh: '暂停播放', description: '音视频暂停', templateEvent: 'pause', defaultName: 'onPause', optional: true }),
  entry({ type: 'dom-event.ended', category: 'dom-event', label: 'ended', labelZh: '播放结束', description: '音视频播放到末尾', templateEvent: 'ended', defaultName: 'onEnded', optional: true }),
  entry({ type: 'dom-event.timeupdate', category: 'dom-event', label: 'timeupdate', labelZh: '进度更新', description: '播放时间变化', templateEvent: 'timeupdate', defaultName: 'onTimeupdate', optional: true }),
  entry({ type: 'dom-event.volumechange', category: 'dom-event', label: 'volumechange', labelZh: '音量变化', description: '音量被改变', templateEvent: 'volumechange', defaultName: 'onVolumechange', optional: true }),
  entry({ type: 'dom-event.load', category: 'dom-event', label: 'load', labelZh: '加载完成', description: '图片/媒体等资源加载完毕', templateEvent: 'load', defaultName: 'onLoad', optional: true }),
  entry({ type: 'dom-event.error', category: 'dom-event', label: 'error', labelZh: '加载错误', description: '资源加载失败', templateEvent: 'error', defaultName: 'onError', optional: true }),

  entry({ type: 'dom-event.transitionend', category: 'dom-event', label: 'transitionend', labelZh: '过渡结束', description: 'CSS 过渡动画播放完成', templateEvent: 'transitionend', defaultName: 'onTransitionend', optional: true }),
  entry({ type: 'dom-event.animationend', category: 'dom-event', label: 'animationend', labelZh: '动画结束', description: 'CSS 关键帧动画播放完成', templateEvent: 'animationend', defaultName: 'onAnimationend', optional: true }),

  // ── 组件事件 ──
  entry({ type: 'component-event.custom', category: 'component-event', label: '@event', labelZh: '子组件事件', description: '监听子组件 emit 出来的自定义事件', defaultName: 'onChildEvent' }),
  entry({ type: 'component-event.v-model', category: 'component-event', label: 'v-model', labelZh: '双向绑定', description: '与子组件双向同步数据', defaultName: 'modelValue' }),
  entry({ type: 'component-event.v-model-arg', category: 'component-event', label: 'v-model:arg', labelZh: '具名双向绑定', description: '如 v-model:visible 绑定可见性', defaultName: 'visible', optional: true }),
  entry({ type: 'component-event.native', category: 'component-event', label: '.native', labelZh: '根元素原生事件', description: '监听组件根节点原生事件（旧版概念）', defaultName: 'onNative', optional: true }),

  // ── 模板绑定 ──
  entry({ type: 'template-binding.prop', category: 'template-binding', label: ':prop', labelZh: '属性绑定', description: '把数据绑到子组件或元素的 prop', defaultName: 'boundProp', requiresBinding: true }),
  entry({ type: 'template-binding.attr', category: 'template-binding', label: 'v-bind', labelZh: '动态属性', description: '批量或动态绑定 HTML 属性', defaultName: 'attrs', requiresBinding: true }),
  entry({ type: 'template-binding.class', category: 'template-binding', label: ':class', labelZh: '动态类名', description: '根据条件切换 CSS class', defaultName: 'dynamicClass', requiresBinding: true }),
  entry({ type: 'template-binding.style', category: 'template-binding', label: ':style', labelZh: '动态样式', description: '根据数据绑定内联 style', defaultName: 'dynamicStyle', requiresBinding: true }),

  // ── 定时与条件 ──
  entry({ type: 'timing.delay', category: 'timing', label: 'setTimeout', labelZh: '延迟触发', description: '等待一段时间后自动执行', defaultName: 'afterDelay' }),
  entry({ type: 'timing.interval', category: 'timing', label: 'setInterval', labelZh: '周期触发', description: '按固定间隔重复执行', defaultName: 'onInterval', optional: true }),
  entry({ type: 'timing.debounce', category: 'timing', label: 'debounce', labelZh: '防抖', description: '连续触发时只执行最后一次', defaultName: 'debouncedFn', optional: true }),
  entry({ type: 'timing.throttle', category: 'timing', label: 'throttle', labelZh: '节流', description: '限制一定时间内只执行一次', defaultName: 'throttledFn', optional: true }),
  entry({ type: 'timing.conditional', category: 'timing', label: 'if/else', labelZh: '条件分支', description: '满足条件时执行不同动作', defaultName: 'whenCondition' }),

  // ── 组合式 / 高级 ──
  entry({ type: 'composable.custom', category: 'composable', label: 'useXxx', labelZh: '组合式函数', description: '调用 useXxx() 复用逻辑', defaultName: 'useFeature', optional: true }),
  entry({ type: 'composable.provide', category: 'composable', label: 'provide', labelZh: '向下提供', description: '向子孙组件提供数据', defaultName: 'providedKey', optional: true }),
  entry({ type: 'composable.inject', category: 'composable', label: 'inject', labelZh: '向上注入', description: '从祖先组件获取 provide 的数据', defaultName: 'injectedValue', optional: true }),
  entry({ type: 'composable.expose', category: 'composable', label: 'defineExpose', labelZh: '暴露给父组件', description: '让父组件通过 ref 调用子组件方法', defaultName: 'exposedApi', optional: true }),
  entry({ type: 'composable.templateRef', category: 'composable', label: 'templateRef', labelZh: '模板引用', description: '获取模板里某个 DOM/组件实例', defaultName: 'elRef', optional: true }),
  entry({ type: 'composable.nextTick', category: 'composable', label: 'nextTick', labelZh: '下一帧', description: 'DOM 更新完成后再执行', defaultName: 'afterTick', optional: true }),
]

const catalogByType = new Map(LOGIC_BLOCK_CATALOG.map((e) => [e.type, e]))

export function getLogicBlockCatalogEntry(type: string): LogicBlockCatalogEntry | undefined {
  return catalogByType.get(type)
}

export function getLogicBlockLabel(type: string): string {
  return catalogByType.get(type)?.labelZh ?? catalogByType.get(type)?.label ?? type
}

export function getLogicBlockLabelEn(type: string): string {
  return catalogByType.get(type)?.label ?? type
}

export function getLogicBlockDescription(type: string): string {
  return catalogByType.get(type)?.description ?? ''
}

export function getLogicBlockCategoryLabel(category: LogicBlockCategory): string {
  return LOGIC_BLOCK_CATEGORY_LABELS[category] ?? category
}

/** 按 category 分组，保持 catalog 顺序 */
export function getLogicBlockCatalogByCategory(): { category: LogicBlockCategory; label: string; entries: LogicBlockCatalogEntry[] }[] {
  const order: LogicBlockCategory[] = [
    'state',
    'computed',
    'watch',
    'method',
    'dom-event',
    'component-event',
    'template-binding',
    'timing',
    'composable',
  ]
  const grouped = new Map<LogicBlockCategory, LogicBlockCatalogEntry[]>()
  for (const e of LOGIC_BLOCK_CATALOG) {
    const list = grouped.get(e.category) ?? []
    list.push(e)
    grouped.set(e.category, list)
  }
  return order
    .filter((cat) => grouped.has(cat))
    .map((cat) => ({
      category: cat,
      label: LOGIC_BLOCK_CATEGORY_LABELS[cat],
      entries: grouped.get(cat)!,
    }))
}

/** 旧 kind → 新 type 迁移 */
export const LEGACY_BLOCK_KIND_TO_TYPE: Record<string, string> = {
  state: 'state.ref',
  computed: 'computed.getter',
  watch: 'watch.source',
  method: 'method.function',
  handler: 'dom-event.click',
}
