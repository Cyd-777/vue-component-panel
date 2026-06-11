/**
 * LayoutContainer 宽高模式（hug / fill / fixed / minmax）切换时的属性清理。
 * 属性面板与八向手柄 commit 共用，避免残留冲突属性。
 */
import type { AttrEntry } from './attrPatch'

export type SizeMode = 'hug' | 'fill' | 'fixed' | 'minmax'
export type SizeAxis = 'width' | 'height'

const DEFAULT_FIXED: Record<SizeAxis, number> = { width: 200, height: 160 }
const DEFAULT_MINMAX: Record<SizeAxis, { min: number; max: number }> = {
  width: { min: 100, max: 400 },
  height: { min: 80, max: 400 },
}

export function readSizeMode(attrs: Record<string, string>, axis: SizeAxis): SizeMode {
  const key = axis === 'width' ? 'width-mode' : 'height-mode'
  const fallback: SizeMode = axis === 'width' ? 'fill' : 'hug'
  const v = attrs[key] ?? fallback
  if (v === 'hug' || v === 'fill' || v === 'fixed' || v === 'minmax') return v
  return fallback
}

/** 单轴切换模式：写 mode，并清理/补全与该模式冲突的属性 */
export function buildAxisSizeModePatch(
  axis: SizeAxis,
  mode: SizeMode,
  current: Record<string, string>,
): Record<string, AttrEntry | null> {
  const modeKey = axis === 'width' ? 'width-mode' : 'height-mode'
  const patch: Record<string, AttrEntry | null> = {
    [modeKey]: { value: mode, dynamic: false },
  }

  if (mode === 'fixed') {
    if (!current[axis]) {
      patch[axis] = { value: String(DEFAULT_FIXED[axis]), dynamic: true }
    }
    patch[`min-${axis}`] = null
    patch[`max-${axis}`] = null
  } else if (mode === 'minmax') {
    patch[axis] = null
    const defaults = DEFAULT_MINMAX[axis]
    if (!current[`min-${axis}`]) {
      patch[`min-${axis}`] = { value: String(defaults.min), dynamic: true }
    }
    if (!current[`max-${axis}`]) {
      patch[`max-${axis}`] = { value: String(defaults.max), dynamic: true }
    }
  } else {
    patch[axis] = null
    patch[`min-${axis}`] = null
    patch[`max-${axis}`] = null
  }

  return patch
}

export interface ContainerResizeModes {
  widthMode: SizeMode
  heightMode: SizeMode
  width: number
  height: number
}

/** 八向手柄松手：双轴模式 + fixed 像素值，并清理 min/max 等冲突项 */
export function buildContainerResizePatch(
  result: ContainerResizeModes,
  current: Record<string, string>,
): Record<string, AttrEntry | null> {
  const patch: Record<string, AttrEntry | null> = {
    ...buildAxisSizeModePatch('width', result.widthMode, current),
    ...buildAxisSizeModePatch('height', result.heightMode, current),
  }

  if (result.widthMode === 'fixed') {
    patch.width = { value: String(result.width), dynamic: true }
  }
  if (result.heightMode === 'fixed') {
    patch.height = { value: String(result.height), dynamic: true }
  }

  return patch
}
