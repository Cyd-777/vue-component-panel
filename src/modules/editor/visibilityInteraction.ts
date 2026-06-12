/**
 * 可见性交互 — 「触发区悬停/按下/聚焦 → 目标元素显隐」
 *
 * 非默认态不写 `.fp-el-TARGET:hover`（目标自身被悬停），而写：
 * `.fp-el-TRIGGER:hover .fp-el-TARGET { display / visibility }`
 *
 * 典型：卡片悬停时内部操作按钮出现。
 */
import {
  formatInlineStyle,
  getTagAttrEntries,
  parseInlineStyle,
  patchTagAttributes,
} from './attrPatch'
import { findTagLineInSource } from './tagIndex'
import { getTagParentIndex } from './sourceManip'
import {
  interactionStateToCssPseudo,
  type FlowInteractionPseudoId,
  type FlowInteractionStateId,
} from './interactionStateSpec'
import { pseudoScopeClass, readPseudoRule, writePseudoRule } from './pseudoClassStyle'

const VISIBILITY_KEYS = ['display', 'visibility'] as const

function extractStyleBlock(code: string): { before: string; inner: string; after: string } | null {
  const m = code.match(/^([\s\S]*?<style[^>]*>)([\s\S]*?)(<\/style>[\s\S]*)$/i)
  if (!m) return null
  return { before: m[1], inner: m[2], after: m[3] }
}

function ensureStyleBlock(code: string): string {
  if (/<style[\s>]/i.test(code)) return code
  return `${code.trimEnd()}\n\n<style scoped>\n</style>\n`
}

function formatRuleBody(styles: Record<string, string>): string {
  const decl = formatInlineStyle(styles)
  if (!decl) return ''
  return decl
    .split('; ')
    .filter(Boolean)
    .map((line) => `  ${line}${line.includes('!important') ? '' : ' !important'};`)
    .join('\n')
}

function compoundRulePattern(
  triggerIndex: number,
  targetIndex: number,
  pseudo: FlowInteractionPseudoId,
): RegExp {
  const esc = pseudo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(
    `\\n?\\.${pseudoScopeClass(triggerIndex)}:${esc}\\s+\\.${pseudoScopeClass(targetIndex)}\\s*\\{[^}]*\\}`,
    'g',
  )
}

function anyCompoundRuleForTargetPattern(targetIndex: number, pseudo: FlowInteractionPseudoId): RegExp {
  const esc = pseudo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(
    `\\.fp-el-(\\d+):${esc}\\s+\\.${pseudoScopeClass(targetIndex)}\\s*\\{[^}]*\\}`,
    'g',
  )
}

function pickVisibilityStyles(styles: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const key of VISIBILITY_KEYS) {
    const val = styles[key]
    if (val?.trim()) out[key] = val.replace(/\s*!important\s*$/i, '').trim()
  }
  return out
}

function stripVisibilityFromStyles(styles: Record<string, string>): Record<string, string> {
  const next = { ...styles }
  for (const key of VISIBILITY_KEYS) delete next[key]
  return next
}

function ensureScopeClass(code: string, tagIndex: number): string {
  const cls = pseudoScopeClass(tagIndex)
  const attrs = getTagAttrEntries(code, tagIndex)
  const existing = attrs.class?.value ?? ''
  const classes = existing.split(/\s+/).filter(Boolean)
  if (classes.includes(cls)) return code
  classes.push(cls)
  return patchTagAttributes(code, tagIndex, {
    class: { value: classes.join(' '), dynamic: false },
  }) ?? code
}

/** 默认触发区：最近的上级 LayoutContainer；无则自身 */
export function defaultVisibilityTriggerIndex(code: string, targetIndex: number): number {
  let current = targetIndex
  while (true) {
    const parent = getTagParentIndex(code, current)
    if (parent === null) return targetIndex
    const loc = findTagLineInSource(code, parent)
    if (loc?.tagName === 'LayoutContainer') return parent
    current = parent
  }
}

export interface VisibilityTriggerOption {
  index: number
  label: string
  isDefault: boolean
}

/** 可选触发区：自身 + 各级父 LayoutContainer */
export function listVisibilityTriggerOptions(
  code: string,
  targetIndex: number,
): VisibilityTriggerOption[] {
  const def = defaultVisibilityTriggerIndex(code, targetIndex)
  const options: VisibilityTriggerOption[] = []
  const seen = new Set<number>()

  function push(index: number, label: string) {
    if (seen.has(index)) return
    seen.add(index)
    options.push({ index, label, isDefault: index === def })
  }

  push(targetIndex, '自身')

  let current = targetIndex
  let depth = 0
  while (true) {
    const parent = getTagParentIndex(code, current)
    if (parent === null) break
    const loc = findTagLineInSource(code, parent)
    if (loc?.tagName === 'LayoutContainer') {
      depth++
      push(parent, depth === 1 ? '父容器' : `上级容器 ${depth}`)
    }
    current = parent
  }

  return options
}

export function visibilityTriggerLabel(code: string, targetIndex: number, triggerIndex: number): string {
  const opt = listVisibilityTriggerOptions(code, targetIndex).find((o) => o.index === triggerIndex)
  if (opt) return opt.label
  const loc = findTagLineInSource(code, triggerIndex)
  return loc ? `<${loc.tagName}>` : `元素 ${triggerIndex}`
}

export function readCompoundVisibilityRule(
  code: string,
  triggerIndex: number,
  targetIndex: number,
  state: FlowInteractionStateId,
): Record<string, string> {
  const pseudo = interactionStateToCssPseudo(state)
  if (!pseudo) return {}
  const block = extractStyleBlock(code)
  if (!block) return {}
  const m = block.inner.match(compoundRulePattern(triggerIndex, targetIndex, pseudo))
  if (!m?.[0]) return {}
  const bodyMatch = m[0].match(/\{([\s\S]*)\}/)
  if (!bodyMatch) return {}
  return pickVisibilityStyles(parseInlineStyle(bodyMatch[1].replace(/\n/g, ' ').trim()))
}

/** 当前交互态下可见性规则绑定的触发区；无规则时返回默认触发区 */
export function getVisibilityTriggerIndex(
  code: string,
  targetIndex: number,
  state: FlowInteractionStateId,
): number {
  if (state === 'default' || state === 'motion') {
    return defaultVisibilityTriggerIndex(code, targetIndex)
  }
  const pseudo = interactionStateToCssPseudo(state)
  if (!pseudo) return defaultVisibilityTriggerIndex(code, targetIndex)

  const block = extractStyleBlock(code)
  if (block) {
    const re = anyCompoundRuleForTargetPattern(targetIndex, pseudo)
    const m = re.exec(block.inner)
    if (m?.[1]) return parseInt(m[1], 10)
  }

  const selfVis = pickVisibilityStyles(readPseudoRule(code, targetIndex, pseudo))
  if (Object.keys(selfVis).length > 0) return targetIndex

  return defaultVisibilityTriggerIndex(code, targetIndex)
}

/** 默认态下目标是否处于隐藏 */
export function isTargetHiddenByDefault(code: string, targetIndex: number): boolean {
  const loc = findTagLineInSource(code, targetIndex)
  if (!loc) return false
  const attrs = getTagAttrEntries(code, targetIndex)
  const styles = parseInlineStyle(attrs.style?.value ?? '')
  const display = styles.display?.replace(/\s*!important\s*$/i, '').trim()
  const visibility = styles.visibility?.replace(/\s*!important\s*$/i, '').trim()
  return display === 'none' || visibility === 'hidden'
}

/** 交互态选「显示」时：默认隐藏则写入显式 display，否则清除覆盖 */
export function resolveInteractionShowStyles(code: string, targetIndex: number): Record<string, string> {
  const loc = findTagLineInSource(code, targetIndex)
  if (!loc) return {}
  const attrs = getTagAttrEntries(code, targetIndex)
  const styles = parseInlineStyle(attrs.style?.value ?? '')
  const display = styles.display?.replace(/\s*!important\s*$/i, '').trim()
  const visibility = styles.visibility?.replace(/\s*!important\s*$/i, '').trim()
  if (display === 'none') {
    if (loc.tagName === 'span') return { display: 'inline-block' }
    return { display: 'flex' }
  }
  if (visibility === 'hidden') return { visibility: 'visible' }
  return {}
}

export function readVisibilityOverrides(
  code: string,
  targetIndex: number,
  state: FlowInteractionStateId,
): Record<string, string> {
  if (state === 'default' || state === 'motion') return {}
  const trigger = getVisibilityTriggerIndex(code, targetIndex, state)
  if (trigger === targetIndex) {
    return pickVisibilityStyles(readPseudoRule(code, targetIndex, interactionStateToCssPseudo(state)!))
  }
  return readCompoundVisibilityRule(code, trigger, targetIndex, state)
}

export function visibilityStateHasOverrides(
  code: string,
  targetIndex: number,
  state: Exclude<FlowInteractionStateId, 'default' | 'motion'>,
): boolean {
  return Object.keys(readVisibilityOverrides(code, targetIndex, state)).length > 0
}

export interface CompoundVisibilityTarget {
  targetIndex: number
  styles: Record<string, string>
}

/** 触发区在指定交互态下，所有复合可见性目标 */
export function listCompoundVisibilityTargetsForTrigger(
  code: string,
  triggerIndex: number,
  state: FlowInteractionStateId,
): CompoundVisibilityTarget[] {
  const pseudo = interactionStateToCssPseudo(state)
  if (!pseudo) return []
  const block = extractStyleBlock(code)
  if (!block) return []

  const esc = pseudo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(
    `\\.${pseudoScopeClass(triggerIndex)}:${esc}\\s+\\.fp-el-(\\d+)\\s*\\{([^}]*)\\}`,
    'g',
  )

  const out: CompoundVisibilityTarget[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(block.inner)) !== null) {
    const targetIndex = parseInt(m[1], 10)
    if (Number.isNaN(targetIndex)) continue
    const styles = pickVisibilityStyles(parseInlineStyle(m[2].replace(/\n/g, ' ').trim()))
    if (Object.keys(styles).length === 0) continue
    out.push({ targetIndex, styles })
  }
  return out
}

function removeCompoundRulesForTarget(
  inner: string,
  targetIndex: number,
  pseudo: FlowInteractionPseudoId,
): string {
  return inner.replace(anyCompoundRuleForTargetPattern(targetIndex, pseudo), '')
}

function writeCompoundVisibilityRule(
  code: string,
  triggerIndex: number,
  targetIndex: number,
  pseudo: FlowInteractionPseudoId,
  styles: Record<string, string>,
): string {
  let full = ensureStyleBlock(code)
  const block = extractStyleBlock(full)
  if (!block) return full

  const filtered = pickVisibilityStyles(styles)
  let inner = removeCompoundRulesForTarget(block.inner, targetIndex, pseudo)
  inner = inner.replace(compoundRulePattern(triggerIndex, targetIndex, pseudo), '')

  if (Object.keys(filtered).length > 0) {
    const body = formatRuleBody(filtered)
    const rule =
      `\n.${pseudoScopeClass(triggerIndex)}:${pseudo} .${pseudoScopeClass(targetIndex)} {\n${body}\n}\n`
    inner = `${inner.trimEnd()}${rule}`
  }

  inner = inner.replace(/\n{3,}/g, '\n\n')
  let result = block.before + inner + block.after

  if (Object.keys(filtered).length > 0) {
    result = ensureScopeClass(result, triggerIndex)
    result = ensureScopeClass(result, targetIndex)
  }
  return result
}

/**
 * 写入交互态可见性（清除同态旧规则后按触发区写入）
 */
export function writeVisibilityInteraction(
  code: string,
  targetIndex: number,
  state: FlowInteractionStateId,
  triggerIndex: number,
  visibilityStyles: Record<string, string>,
): string {
  if (state === 'default' || state === 'motion') return code
  const pseudo = interactionStateToCssPseudo(state)
  if (!pseudo) return code

  const vis = pickVisibilityStyles(visibilityStyles)
  let next = code

  // 去掉同态下所有针对该目标的复合规则
  const block = extractStyleBlock(ensureStyleBlock(next))
  if (block) {
    let inner = removeCompoundRulesForTarget(block.inner, targetIndex, pseudo)
    next = block.before + inner + block.after
  }

  // 去掉自身伪类里的 display/visibility
  const selfPseudo = readPseudoRule(next, targetIndex, pseudo)
  const selfRest = stripVisibilityFromStyles(selfPseudo)
  next = writePseudoRule(next, targetIndex, pseudo, selfRest)

  if (Object.keys(vis).length === 0) return next

  if (triggerIndex === targetIndex) {
    const merged = { ...selfRest, ...vis }
    return writePseudoRule(next, targetIndex, pseudo, merged)
  }

  return writeCompoundVisibilityRule(next, triggerIndex, targetIndex, pseudo, vis)
}
