import {
  formatInlineStyle,
  getTagAttrEntries,
  parseInlineStyle,
  patchTagAttributes,
} from './attrPatch'
import {
  interactionStateToCssPseudo,
  type FlowInteractionPseudoId,
  type FlowInteractionStateId,
} from './interactionStateSpec'
import { motionStateHasOverrides } from './motionStyle'
import { visibilityStateHasOverrides } from './visibilityInteraction'

export function pseudoScopeClass(tagIndex: number): string {
  return `fp-el-${tagIndex}`
}

interface StyleBlockParts {
  before: string
  inner: string
  after: string
}

function extractStyleBlock(code: string): StyleBlockParts | null {
  const m = code.match(/^([\s\S]*?<style[^>]*>)([\s\S]*?)(<\/style>[\s\S]*)$/i)
  if (!m) return null
  return { before: m[1], inner: m[2], after: m[3] }
}

function ensureStyleBlock(code: string): string {
  if (/<style[\s>]/i.test(code)) return code
  return `${code.trimEnd()}\n\n<style scoped>\n</style>\n`
}

function rulePattern(tagIndex: number, pseudo: FlowInteractionPseudoId): RegExp {
  const esc = pseudo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`\\n?\\.fp-el-${tagIndex}:${esc}\\s*\\{[^}]*\\}`, 'g')
}

export function readPseudoRule(
  code: string,
  tagIndex: number,
  pseudo: FlowInteractionPseudoId,
): Record<string, string> {
  const block = extractStyleBlock(code)
  if (!block) return {}
  const m = block.inner.match(rulePattern(tagIndex, pseudo))
  if (!m?.[0]) return {}
  const bodyMatch = m[0].match(/\{([\s\S]*)\}/)
  if (!bodyMatch) return {}
  return parseInlineStyle(bodyMatch[1].replace(/\n/g, ' ').trim())
}

export function readInteractionOverrides(
  code: string,
  tagIndex: number,
  state: FlowInteractionStateId,
): Record<string, string> {
  const pseudo = interactionStateToCssPseudo(state)
  if (!pseudo) return {}
  return readPseudoRule(code, tagIndex, pseudo)
}

export function hasAnyPseudoRulesForElement(code: string, tagIndex: number): boolean {
  const block = extractStyleBlock(code)
  if (!block) return false
  return new RegExp(`\\.fp-el-${tagIndex}:`).test(block.inner)
}

function stripVisibilityKeys(styles: Record<string, string>): Record<string, string> {
  const next = { ...styles }
  delete next.display
  delete next.visibility
  return next
}

export function interactionStateHasOverrides(
  code: string,
  tagIndex: number,
  state: Exclude<FlowInteractionStateId, 'default'>,
): boolean {
  if (state === 'motion') return motionStateHasOverrides(code, tagIndex)
  const pseudo = interactionStateToCssPseudo(state)
  if (!pseudo) return false
  if (visibilityStateHasOverrides(code, tagIndex, state)) return true
  return Object.keys(stripVisibilityKeys(readPseudoRule(code, tagIndex, pseudo))).length > 0
}

function hasBaseScopeRule(code: string, tagIndex: number): boolean {
  const block = extractStyleBlock(code)
  if (!block) return false
  return new RegExp(`\\.fp-el-${tagIndex}(?![\\w:-])\\s*\\{`).test(block.inner)
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

function removePseudoRuleInner(
  inner: string,
  tagIndex: number,
  pseudo: FlowInteractionPseudoId,
): string {
  return inner.replace(rulePattern(tagIndex, pseudo), '')
}

function ensurePseudoScopeClass(code: string, tagIndex: number): string {
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

function maybeRemovePseudoScopeClass(code: string, tagIndex: number): string {
  if (hasAnyPseudoRulesForElement(code, tagIndex)) return code
  if (hasBaseScopeRule(code, tagIndex)) return code
  const cls = pseudoScopeClass(tagIndex)
  const attrs = getTagAttrEntries(code, tagIndex)
  const existing = attrs.class?.value ?? ''
  const classes = existing.split(/\s+/).filter((c) => c && c !== cls)
  if (classes.length === 0) {
    return patchTagAttributes(code, tagIndex, { class: null }) ?? code
  }
  return patchTagAttributes(code, tagIndex, {
    class: { value: classes.join(' '), dynamic: false },
  }) ?? code
}

export function writePseudoRule(
  code: string,
  tagIndex: number,
  pseudo: FlowInteractionPseudoId,
  styles: Record<string, string>,
): string {
  let full = ensureStyleBlock(code)
  const block = extractStyleBlock(full)
  if (!block) return full

  const filtered = Object.fromEntries(
    Object.entries(styles).filter(([, v]) => v.trim() !== ''),
  )

  let inner = removePseudoRuleInner(block.inner, tagIndex, pseudo)

  if (Object.keys(filtered).length > 0) {
    const body = formatRuleBody(filtered)
    const rule = `\n.${pseudoScopeClass(tagIndex)}:${pseudo} {\n${body}\n}\n`
    inner = `${inner.trimEnd()}${rule}`
  }

  inner = inner.replace(/\n{3,}/g, '\n\n')
  let result = block.before + inner + block.after

  if (Object.keys(filtered).length > 0) {
    result = ensurePseudoScopeClass(result, tagIndex)
  } else {
    result = maybeRemovePseudoScopeClass(result, tagIndex)
  }
  return result
}

export function writeInteractionOverrides(
  code: string,
  tagIndex: number,
  state: FlowInteractionStateId,
  styles: Record<string, string>,
): string {
  const pseudo = interactionStateToCssPseudo(state)
  if (!pseudo) return code
  return writePseudoRule(code, tagIndex, pseudo, styles)
}

export function readAllInteractionOverrides(
  code: string,
  tagIndex: number,
): Partial<Record<Exclude<FlowInteractionStateId, 'default'>, Record<string, string>>> {
  return {
    hover: readPseudoRule(code, tagIndex, 'hover'),
    active: readPseudoRule(code, tagIndex, 'active'),
    focus: readPseudoRule(code, tagIndex, 'focus-visible'),
  }
}
