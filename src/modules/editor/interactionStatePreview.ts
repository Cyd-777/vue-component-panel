import {
  interactionStateToCssPseudo,
  type FlowInteractionPseudoId,
  type FlowInteractionStateId,
} from './interactionStateSpec'
import { readPseudoRule } from './pseudoClassStyle'
import {
  listCompoundVisibilityTargetsForTrigger,
  readVisibilityOverrides,
} from './visibilityInteraction'

const PREVIEW_INLINE_ATTR = 'data-fp-preview-inline'

function mountElement(mountEl: HTMLElement, tagIndex: number): HTMLElement | null {
  return mountEl.querySelector(`[data-el-i="${tagIndex}"]`) as HTMLElement | null
}

function applyForcedStyles(el: HTMLElement, overrides: Record<string, string>): void {
  const applied: string[] = []
  for (const [prop, val] of Object.entries(overrides)) {
    const clean = val.replace(/\s*!important\s*$/i, '').trim()
    if (!clean) continue
    el.style.setProperty(prop, clean, 'important')
    applied.push(prop)
  }
  if (applied.length) el.setAttribute(PREVIEW_INLINE_ATTR, applied.join(','))
}

function collectSelfInteractionOverrides(
  code: string,
  tagIndex: number,
  state: FlowInteractionStateId,
  pseudo: FlowInteractionPseudoId,
): Record<string, string> {
  const selfOverrides = readPseudoRule(code, tagIndex, pseudo)
  delete selfOverrides.display
  delete selfOverrides.visibility
  const visibilityOverrides = readVisibilityOverrides(code, tagIndex, state)
  return { ...selfOverrides, ...visibilityOverrides }
}

/**
 * 画板编辑：按属性面板 Tab 强制预览交互态样式（非真实指针交互）。
 * 示例预览中由注入的 :hover/:active 伪类规则负责真实交互。
 */
export function syncInteractionStatePreview(
  mountEl: HTMLElement | null,
  code: string,
  tagIndex: number | null,
  state: FlowInteractionStateId,
): void {
  if (!mountEl) return

  clearInteractionStatePreview(mountEl)

  if (state === 'default' || state === 'motion' || tagIndex == null) return

  const pseudo = interactionStateToCssPseudo(state)
  if (!pseudo) return

  const previewed = new Set<number>()

  const selectedEl = mountElement(mountEl, tagIndex)
  if (selectedEl) {
    const overrides = collectSelfInteractionOverrides(code, tagIndex, state, pseudo)
    if (Object.keys(overrides).length > 0) {
      applyForcedStyles(selectedEl, overrides)
      previewed.add(tagIndex)
    }
  }

  // 选中触发区时，同步预览其子目标的可见性变化
  for (const { targetIndex, styles } of listCompoundVisibilityTargetsForTrigger(
    code,
    tagIndex,
    state,
  )) {
    if (previewed.has(targetIndex)) continue
    const targetEl = mountElement(mountEl, targetIndex)
    if (!targetEl || Object.keys(styles).length === 0) continue
    applyForcedStyles(targetEl, styles)
    previewed.add(targetIndex)
  }
}

export function clearInteractionStatePreview(mountEl: HTMLElement | null): void {
  if (!mountEl) return
  mountEl.querySelectorAll(`[${PREVIEW_INLINE_ATTR}]`).forEach((node) => {
    if (!(node instanceof HTMLElement)) return
    const props = node.getAttribute(PREVIEW_INLINE_ATTR)?.split(',').filter(Boolean) ?? []
    for (const p of props) node.style.removeProperty(p)
    node.removeAttribute(PREVIEW_INLINE_ATTR)
  })
}
