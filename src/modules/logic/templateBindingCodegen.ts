import { findOpeningTagEnd } from '../editor/attrPatch'
import { findTagLineInSource } from '../editor/tagIndex'
import type { LogicBlockStub } from './logicTypes'

function isEventBindingBlock(block: LogicBlockStub): boolean {
  return block.category === 'dom-event' || block.category === 'component-event'
}

function formatEventBinding(block: LogicBlockStub): string | null {
  if (!block.templateEvent || !block.name.trim()) return null
  const mod = block.eventModifier?.trim()
  const eventPart = mod ? `${block.templateEvent}.${mod}` : block.templateEvent
  return `@${eventPart}="${block.name.trim()}"`
}

function stripEventBinding(attrs: string, eventName: string): string {
  return attrs.replace(new RegExp(`\\s@${eventName}(?:\\.[\\w.]+)?="[^"]*"`, 'g'), '')
}

function injectBindingIntoLine(line: string, tagName: string, binding: string, eventName?: string): string | null {
  const openStart = line.search(new RegExp(`<${tagName}(?=\\s|>|/)`, 'i'))
  if (openStart < 0) return null

  const openEnd = findOpeningTagEnd(line, tagName)
  if (openEnd < 0) return null

  const head = line.slice(0, openStart)
  const openTag = line.slice(openStart, openEnd + 1)
  const tail = line.slice(openEnd + 1)

  const innerMatch = openTag.match(new RegExp(`^<${tagName}((?:\\s[^>]*)?)(\\/?>)$`, 'i'))
  if (!innerMatch) return null

  let attrs = innerMatch[1]
  if (eventName) attrs = stripEventBinding(attrs, eventName)
  const space = attrs.trim() ? ' ' : ' '
  const rebuilt = `<${tagName}${attrs}${space}${binding}${innerMatch[2]}`
  return head + rebuilt + tail
}

/** 从指定元素行移除该块对应的事件绑定 */
export function removeBlockEventBinding(
  code: string,
  block: LogicBlockStub,
  elIndex: number,
): string | null {
  if (!block.templateEvent) return null
  const loc = findTagLineInSource(code, elIndex)
  if (!loc) return null

  const lines = code.split('\n')
  const line = lines[loc.lineIndex]
  const openStart = line.search(new RegExp(`<${loc.tagName}(?=\\s|>|/)`, 'i'))
  if (openStart < 0) return null

  const openEnd = findOpeningTagEnd(line, loc.tagName)
  if (openEnd < 0) return null

  const head = line.slice(0, openStart)
  const openTag = line.slice(openStart, openEnd + 1)
  const tail = line.slice(openEnd + 1)
  const innerMatch = openTag.match(new RegExp(`^<${loc.tagName}((?:\\s[^>]*)?)(\\/?>)$`, 'i'))
  if (!innerMatch) return null

  const attrs = stripEventBinding(innerMatch[1], block.templateEvent)
  const rebuilt = `<${loc.tagName}${attrs}${innerMatch[2]}`
  lines[loc.lineIndex] = head + rebuilt + tail
  return lines.join('\n')
}

/** 将单个逻辑块的事件绑定写入 template 对应元素 */
export function applyBlockEventBinding(code: string, block: LogicBlockStub): string | null {
  if (block.boundElIndex == null || !isEventBindingBlock(block)) return null
  const binding = formatEventBinding(block)
  if (!binding) return null

  const loc = findTagLineInSource(code, block.boundElIndex)
  if (!loc) return null

  const lines = code.split('\n')
  const newLine = injectBindingIntoLine(lines[loc.lineIndex], loc.tagName, binding, block.templateEvent)
  if (!newLine) return null
  lines[loc.lineIndex] = newLine
  return lines.join('\n')
}

/** 导出前批量应用所有已绑定的事件块 */
export function applyLogicBindingsToTemplate(code: string, blocks: LogicBlockStub[]): string {
  let result = code
  for (const block of blocks) {
    if (block.boundElIndex == null || !isEventBindingBlock(block)) continue
    result = applyBlockEventBinding(result, block) ?? result
  }
  return result
}

/**
 * 编辑器 template 不应含 DOM 事件绑定（由逻辑模型持有，导出时再写入）。
 * 清理误写入或历史遗留的 @event，避免 preview 编译失败。
 */
export function stripDomEventBindingsFromTemplate(code: string): string {
  return code.replace(
    /(<template>)([\s\S]*?)(<\/template>)/i,
    (_full, open: string, inner: string, close: string) => {
      const cleaned = inner.replace(/\s@[\w.:-]+(?:="[^"]*"|='[^']*'|=\{[^}]*\})/g, '')
      return `${open}${cleaned}${close}`
    },
  )
}
