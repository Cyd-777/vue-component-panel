/**
 * Flow Panel — 组件样式 · 交互态规范
 *
 * 五态：默认 + 悬停 / 按下 / 聚焦（伪类覆盖）+ 动效（.fp-el-N 过渡/动画）
 * 交互态仅存储相对默认的覆盖项；伪类态画布可预览合并样式。
 * 不含布局、尺寸、位置（网格位置 / 布局 / 尺寸 / 浮动）。
 */

export type FlowInteractionStateId = 'default' | 'hover' | 'active' | 'focus' | 'motion'

/** 写入 CSS 的伪类名 */
export type FlowInteractionPseudoId = 'hover' | 'active' | 'focus-visible'

export interface FlowInteractionStateSpec {
  id: FlowInteractionStateId
  label: string
  shortLabel: string
  hint: string
}

export const FLOW_INTERACTION_STATES: FlowInteractionStateSpec[] = [
  { id: 'default', label: '默认', shortLabel: '默', hint: '常态样式 · inline / 组件属性' },
  { id: 'hover', label: '悬停', shortLabel: '悬', hint: ':hover · 指针位于元素上' },
  { id: 'active', label: '按下', shortLabel: '按', hint: ':active · 鼠标按下' },
  { id: 'focus', label: '聚焦', shortLabel: '聚', hint: ':focus-visible · 键盘聚焦' },
  { id: 'motion', label: '动效', shortLabel: '动', hint: '过渡 / 动画 · 状态切换时生效' },
]

export function interactionStateToCssPseudo(
  state: FlowInteractionStateId,
): FlowInteractionPseudoId | null {
  if (state === 'default' || state === 'motion') return null
  if (state === 'focus') return 'focus-visible'
  return state
}

export function interactionStateUsesCanvasPreview(state: FlowInteractionStateId): boolean {
  return state === 'hover' || state === 'active' || state === 'focus'
}

export function interactionStateLabel(state: FlowInteractionStateId): string {
  return FLOW_INTERACTION_STATES.find((s) => s.id === state)?.label ?? state
}
