/** 组件逻辑结构化模型（范式 B 前置：API / 变量 / 方法；绑定与锚点后续） */

import type { LogicBlockCategory } from './logicBlockCatalog'
export type { LogicBlockCategory } from './logicBlockCatalog'
export {
  LOGIC_BLOCK_CATALOG,
  LOGIC_BLOCK_CATEGORY_LABELS,
  getLogicBlockCatalogByCategory,
  getLogicBlockCatalogEntry,
  getLogicBlockCategoryLabel,
  getLogicBlockDescription,
  getLogicBlockLabel,
  getLogicBlockLabelEn,
  LOGIC_BLOCK_CATEGORY_ACCENT,
  LOGIC_BLOCK_CATEGORY_ICON,
} from './logicBlockCatalog'

export type LogicPropType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any'

export interface LogicPropDef {
  id: string
  name: string
  type: LogicPropType
  required: boolean
  defaultValue: string
}

export interface LogicEmitDef {
  id: string
  name: string
  /** payload 形状说明，codegen 时转 TS */
  payloadHint: string
}

export type LogicVarKind = 'ref' | 'reactive'

export interface LogicVariableDef {
  id: string
  name: string
  kind: LogicVarKind
  typeHint: string
  initialValue: string
}

export interface LogicMethodDef {
  id: string
  name: string
  params: string
  body: string
  isAsync: boolean
}

/**
 * Vue 3 `<script setup>` 官方生命周期钩子（Composition API）。
 * 非任意命名块；codegen 对应 `import { onMounted, … } from 'vue'`。
 */
export type VueLifecycleHook =
  | 'onBeforeMount'
  | 'onMounted'
  | 'onBeforeUpdate'
  | 'onUpdated'
  | 'onBeforeUnmount'
  | 'onUnmounted'
  | 'onActivated'
  | 'onDeactivated'
  | 'onErrorCaptured'
  | 'onServerPrefetch'

export interface LogicLifecycleBlock {
  id: string
  hook: VueLifecycleHook
  /** 回调体（不含外层 `() => {`） */
  body: string
}

export interface LifecycleHookSpec {
  hook: VueLifecycleHook
  /** 英文钩子名（codegen） */
  label: string
  /** 中文名称 */
  labelZh: string
  description: string
  /** 非默认挂载/更新/卸载链上的钩子 */
  optional?: boolean
}

export interface LifecyclePhaseSpec {
  phase: string
  hooks: LifecycleHookSpec[]
}

/** 与 Vue 官方文档一致的组件生命周期时间轴（自上而下 = 时间推进） */
export const LIFECYCLE_TIMELINE: LifecyclePhaseSpec[] = [
  {
    phase: '挂载',
    hooks: [
      { hook: 'onBeforeMount', label: 'onBeforeMount', labelZh: '挂载前', description: 'DOM 挂载前，尚不可访问 DOM' },
      { hook: 'onMounted', label: 'onMounted', labelZh: '挂载完成', description: 'DOM 已挂载，可访问 DOM、发起请求' },
    ],
  },
  {
    phase: '更新',
    hooks: [
      { hook: 'onBeforeUpdate', label: 'onBeforeUpdate', labelZh: '更新前', description: '响应式数据变更，DOM 更新前' },
      { hook: 'onUpdated', label: 'onUpdated', labelZh: '更新完成', description: 'DOM 已根据新数据更新' },
    ],
  },
  {
    phase: '卸载',
    hooks: [
      { hook: 'onBeforeUnmount', label: 'onBeforeUnmount', labelZh: '卸载前', description: '组件实例即将销毁' },
      { hook: 'onUnmounted', label: 'onUnmounted', labelZh: '卸载完成', description: '实例已销毁，应清理定时器/监听' },
    ],
  },
  {
    phase: '缓存组件',
    hooks: [
      { hook: 'onActivated', label: 'onActivated', labelZh: '被激活', description: '被 keep-alive 缓存后重新显示', optional: true },
      { hook: 'onDeactivated', label: 'onDeactivated', labelZh: '被停用', description: '被 keep-alive 缓存后隐藏', optional: true },
    ],
  },
  {
    phase: '其他',
    hooks: [
      { hook: 'onErrorCaptured', label: 'onErrorCaptured', labelZh: '错误捕获', description: '捕获后代组件抛出的错误', optional: true },
      { hook: 'onServerPrefetch', label: 'onServerPrefetch', labelZh: '服务端预取', description: 'SSR 渲染前预取异步数据', optional: true },
    ],
  },
]

/** 逻辑块（生命周期走 LIFECYCLE_TIMELINE，不在此列） */
export interface LogicBlockStub {
  id: string
  /** catalog 类型 id，如 dom-event.click */
  type: string
  category: LogicBlockCategory
  /** handler / 方法名等 */
  name: string
  /** 冗余：template @event 名，便于绑定与 codegen */
  templateEvent?: string
  /** Vue 事件修饰符，如 prevent / stop（对应 @click.prevent） */
  eventModifier?: string
  /** 块内代码片段（后续 managed 编辑） */
  body: string
  /** 绑定的画布元素 data-el-i（交互逻辑模式拖动锚点设置） */
  boundElIndex?: number | null
}

export interface ComponentLogicModel {
  props: LogicPropDef[]
  emits: LogicEmitDef[]
  variables: LogicVariableDef[]
  methods: LogicMethodDef[]
  /** 生命周期回调块，按官方 hook 归类；同一 hook 可注册多个回调（与 Vue 一致） */
  lifecycles: LogicLifecycleBlock[]
  blocks: LogicBlockStub[]
}

/** @deprecated 仅用于旧数据迁移 */
export type LegacyLogicBlockKind = 'state' | 'computed' | 'method' | 'handler' | 'watch'

/** codegen 预览：`onMounted(() => { … })` */
export function lifecycleCodegenSnippet(block: LogicLifecycleBlock): string {
  const body = block.body.trim() || '// TODO'
  return `${block.hook}(() => {\n  ${body.replace(/\n/g, '\n  ')}\n})`
}

export function createLogicId(prefix = 'logic'): string {
  return `${prefix}-${Date.now().toString(36)}`
}

export function createDefaultLogicModel(): ComponentLogicModel {
  return {
    props: [],
    emits: [],
    variables: [],
    methods: [],
    lifecycles: [],
    blocks: [],
  }
}
