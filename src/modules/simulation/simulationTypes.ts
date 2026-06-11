/** 模拟场景：输入数据、输出数据、交互规则 */

export type InteractionTrigger = 'click' | 'dblclick'

export type InteractionAction =
  | 'appendOutputLog'
  | 'setOutput'
  | 'setInput'

export interface InteractionRule {
  id: string
  name: string
  /** 触发元素 data-el-i，如 0、1；空表示任意元素 */
  targetElIndex: string
  trigger: InteractionTrigger
  action: InteractionAction
  /** setOutput / setInput 时的 JSON 路径或键名 */
  payloadKey: string
  /** 静态值或表达式占位（后续扩展） */
  payloadValue: string
}

export interface SimulationScenario {
  name: string
  /** 模拟输入（驱动组件 props / 外部数据） */
  inputs: Record<string, unknown>
  /** 交互输出（由规则写入） */
  outputs: Record<string, unknown>
  /** 事件流水 */
  outputLog: string[]
  rules: InteractionRule[]
}

export const DEFAULT_SIMULATION_SCENARIO: SimulationScenario = {
  name: '默认场景',
  inputs: {
    userName: '访客',
    count: 0,
  },
  outputs: {
    lastAction: '',
  },
  outputLog: [],
  rules: [
    {
      id: 'rule-1',
      name: '点击文本记录',
      targetElIndex: '1',
      trigger: 'click',
      action: 'appendOutputLog',
      payloadKey: 'message',
      payloadValue: '点击了 span 文本',
    },
  ],
}

export function createRuleId(): string {
  return `rule-${Date.now().toString(36)}`
}
