import {
  interactionStateToCssPseudo,
  type FlowInteractionStateId,
} from './interactionStateSpec'
import { readPseudoRule } from './pseudoClassStyle'

const PREVIEW_INLINE_ATTR = 'data-fp-preview-inline'

export function syncInteractionStatePreview(
  mountEl: HTMLElement | null,
  code: string,
  tagIndex: number | null,
  state: FlowInteractionStateId,
): void {
  if (!mountEl) return

  clearInteractionStatePreview(mountEl)

  if (state === 'default' || tagIndex == null) return

  const pseudo = interactionStateToCssPseudo(state)
  if (!pseudo) return

  const overrides = readPseudoRule(code, tagIndex, pseudo)
  if (Object.keys(overrides).length === 0) return

  const el = mountEl.querySelector(`[data-el-i="${tagIndex}"]`) as HTMLElement | null
  if (!el) return

  const applied: string[] = []
  for (const [prop, val] of Object.entries(overrides)) {
    el.style.setProperty(prop, val)
    applied.push(prop)
  }
  if (applied.length) el.setAttribute(PREVIEW_INLINE_ATTR, applied.join(','))
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
