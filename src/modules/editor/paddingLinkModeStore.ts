import { inferPaddingLinkMode, type PaddingLinkMode } from './layoutSpacingLogic'

const byTagId = new Map<string, PaddingLinkMode>()

export function getStoredPaddingLinkMode(
  tagId: string | null,
  padding: [number, number, number, number],
): PaddingLinkMode {
  if (tagId && byTagId.has(tagId)) return byTagId.get(tagId)!
  return inferPaddingLinkMode(padding)
}

export function setStoredPaddingLinkMode(tagId: string | null, mode: PaddingLinkMode): void {
  if (!tagId) return
  byTagId.set(tagId, mode)
}

export function ensureStoredPaddingLinkMode(
  tagId: string | null,
  padding: [number, number, number, number],
): PaddingLinkMode {
  if (!tagId) return inferPaddingLinkMode(padding)
  if (!byTagId.has(tagId)) {
    byTagId.set(tagId, inferPaddingLinkMode(padding))
  }
  return byTagId.get(tagId)!
}
