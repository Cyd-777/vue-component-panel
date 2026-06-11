/** 逻辑块内联标签：`⟦var:count⟧` · `⟦style:color|#0052d9⟧` → codegen 时展开 */

import {
  expandStyleTokenToCode,
  parseStyleTokenPayload,
  styleTokenChipLabel,
} from './logicStyleToken'

export type LogicTokenKind = 'var' | 'method' | 'prop' | 'emit' | 'style'

export interface LogicTokenSegment {
  type: 'text' | 'token'
  value: string
  tokenKind?: LogicTokenKind
  tokenName?: string
}

export interface LogicTokenContextItem {
  name: string
  label?: string
  kind?: 'ref' | 'reactive'
}

export interface LogicTokenContext {
  variables: LogicTokenContextItem[]
  methods: LogicTokenContextItem[]
  props: LogicTokenContextItem[]
  emits: LogicTokenContextItem[]
}

const TOKEN_RE = /⟦(var|method|prop|emit|style):([^⟧]*)⟧/g

export function parseLogicBody(raw: string): LogicTokenSegment[] {
  const segments: LogicTokenSegment[] = []
  let last = 0
  let m: RegExpExecArray | null
  TOKEN_RE.lastIndex = 0
  while ((m = TOKEN_RE.exec(raw)) !== null) {
    if (m.index > last) {
      segments.push({ type: 'text', value: raw.slice(last, m.index) })
    }
    segments.push({
      type: 'token',
      value: m[0],
      tokenKind: m[1] as LogicTokenKind,
      tokenName: m[2],
    })
    last = m.index + m[0].length
  }
  if (last < raw.length) {
    segments.push({ type: 'text', value: raw.slice(last) })
  }
  return segments.length ? segments : [{ type: 'text', value: raw }]
}

export function serializeLogicBody(segments: LogicTokenSegment[]): string {
  return segments
    .map((seg) => {
      if (seg.type === 'token' && seg.tokenKind && seg.tokenName) {
        return `⟦${seg.tokenKind}:${seg.tokenName}⟧`
      }
      return seg.value
    })
    .join('')
}

export function makeLogicToken(kind: LogicTokenKind, name: string): string {
  return `⟦${kind}:${name}⟧`
}

export function expandLogicBody(
  raw: string,
  ctx: LogicTokenContext,
): string {
  const varKinds = new Map(ctx.variables.map((v) => [v.name, v.kind ?? 'ref']))
  return raw.replace(TOKEN_RE, (_full, kind: LogicTokenKind, name: string) => {
    switch (kind) {
      case 'var': {
        const vk = varKinds.get(name) ?? 'ref'
        return vk === 'ref' ? `${name}.value` : name
      }
      case 'method':
        return `${name}()`
      case 'prop':
        return name
      case 'emit':
        return `emit('${name}')`
      case 'style': {
        const { prop, value } = parseStyleTokenPayload(name)
        return expandStyleTokenToCode(prop, value)
      }
      default:
        return name
    }
  })
}

export function tokenChipLabel(kind: LogicTokenKind, name: string): string {
  switch (kind) {
    case 'var':
      return name
    case 'method':
      return `${name}()`
    case 'prop':
      return `prop:${name}`
    case 'emit':
      return `emit:${name}`
    case 'style': {
      const { prop, value } = parseStyleTokenPayload(name)
      return styleTokenChipLabel(prop, value)
    }
    default:
      return name
  }
}
