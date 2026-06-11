import {
  formatInlineStyle,
  getTagAttrEntries,
  parseInlineStyle,
  patchTagAttributes,
} from './attrPatch'
import { isMotionCssProperty } from './motionStyleSpec'

function scopeClass(tagIndex: number): string {
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

function baseRulePattern(tagIndex: number): RegExp {
  return new RegExp(`\\n?\\.fp-el-${tagIndex}(?![\\w:-])\\s*\\{[^}]*\\}`, 'g')
}

function formatMotionRuleBody(styles: Record<string, string>): string {
  const decl = formatInlineStyle(styles)
  if (!decl) return ''
  return decl
    .split('; ')
    .filter(Boolean)
    .map((line) => `  ${line};`)
    .join('\n')
}

function pickMotionStyles(styles: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(styles).filter(([k, v]) => isMotionCssProperty(k) && v.trim() !== ''),
  )
}

export function readMotionRule(code: string, tagIndex: number): Record<string, string> {
  const block = extractStyleBlock(code)
  if (!block) return {}
  const m = block.inner.match(baseRulePattern(tagIndex))
  if (!m?.[0]) return {}
  const bodyMatch = m[0].match(/\{([\s\S]*)\}/)
  if (!bodyMatch) return {}
  return pickMotionStyles(parseInlineStyle(bodyMatch[1].replace(/\n/g, ' ').trim()))
}

export function motionStateHasOverrides(code: string, tagIndex: number): boolean {
  return Object.keys(readMotionRule(code, tagIndex)).length > 0
}

function hasAnyPseudoRulesForElement(code: string, tagIndex: number): boolean {
  const block = extractStyleBlock(code)
  if (!block) return false
  return new RegExp(`\\.fp-el-${tagIndex}:`).test(block.inner)
}

function ensureScopeClass(code: string, tagIndex: number): string {
  const cls = scopeClass(tagIndex)
  const attrs = getTagAttrEntries(code, tagIndex)
  const existing = attrs.class?.value ?? ''
  const classes = existing.split(/\s+/).filter(Boolean)
  if (classes.includes(cls)) return code
  classes.push(cls)
  return patchTagAttributes(code, tagIndex, {
    class: { value: classes.join(' '), dynamic: false },
  }) ?? code
}

function maybeRemoveScopeClass(code: string, tagIndex: number): string {
  if (hasAnyPseudoRulesForElement(code, tagIndex)) return code
  if (motionStateHasOverrides(code, tagIndex)) return code
  const cls = scopeClass(tagIndex)
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

export function writeMotionRule(
  code: string,
  tagIndex: number,
  styles: Record<string, string>,
): string {
  let full = ensureStyleBlock(code)
  const block = extractStyleBlock(full)
  if (!block) return full

  const filtered = pickMotionStyles(styles)

  let inner = block.inner.replace(baseRulePattern(tagIndex), '')

  if (Object.keys(filtered).length > 0) {
    const body = formatMotionRuleBody(filtered)
    const rule = `\n.${scopeClass(tagIndex)} {\n${body}\n}\n`
    inner = `${inner.trimEnd()}${rule}`
  }

  inner = inner.replace(/\n{3,}/g, '\n\n')
  let result = block.before + inner + block.after

  if (Object.keys(filtered).length > 0) {
    result = ensureScopeClass(result, tagIndex)
  } else {
    result = maybeRemoveScopeClass(result, tagIndex)
  }
  return result
}
