import { hexToRgb, normalizeHex } from './colorUtils'

/** CIELAB（D65） */
export interface LabColor {
  L: number
  a: number
  b: number
  /** 色度 C* */
  C: number
  /** 色相角 h° */
  h: number
}

function linearizeSrgb(channel: number): number {
  const s = channel / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

function rgbToXyz(r: number, g: number, b: number) {
  const rl = linearizeSrgb(r)
  const gl = linearizeSrgb(g)
  const bl = linearizeSrgb(b)
  return {
    x: rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375,
    y: rl * 0.2126729 + gl * 0.7151522 + bl * 0.072175,
    z: rl * 0.0193339 + gl * 0.119192 + bl * 0.9503041,
  }
}

function xyzToLab(x: number, y: number, z: number): LabColor {
  const xn = 0.95047
  const yn = 1
  const zn = 1.08883
  const f = (t: number) =>
    t > 0.008856 ? t ** (1 / 3) : 7.787 * t + 16 / 116
  const fx = f(x / xn)
  const fy = f(y / yn)
  const fz = f(z / zn)
  const L = 116 * fy - 16
  const a = 500 * (fx - fy)
  const bVal = 200 * (fy - fz)
  const C = Math.sqrt(a * a + bVal * bVal)
  let h = (Math.atan2(bVal, a) * 180) / Math.PI
  if (h < 0) h += 360
  return { L, a, b: bVal, C, h }
}

export function hexToLab(hex: string): LabColor {
  const [r, g, b] = hexToRgb(normalizeHex(hex))
  const { x, y, z } = rgbToXyz(r, g, b)
  return xyzToLab(x, y, z)
}

/**
 * 感知亮度 Lp（Helmholtz–Kohlrausch 简化）
 * 同 L* 下：黄系更「亮」、蓝系更「沉」
 */
export function perceivedLightness(lab: LabColor): number {
  const yellowFactor = Math.max(0, Math.cos(((lab.h - 90) * Math.PI) / 180))
  const blueFactor = Math.max(0, Math.cos(((lab.h - 270) * Math.PI) / 180))
  const hkBoost = lab.C * 0.042 * yellowFactor
  const hkDim = lab.C * 0.03 * blueFactor
  return lab.L + hkBoost - hkDim
}

/** 前景与背景的感知明度差 ΔLp */
export function visualSeparation(fgHex: string, bgHex: string): number {
  const fg = perceivedLightness(hexToLab(fgHex))
  const bg = perceivedLightness(hexToLab(bgHex))
  return Math.abs(fg - bg)
}

export function formatVisualDelta(delta: number): string {
  if (!Number.isFinite(delta)) return '—'
  return `ΔLp ${delta.toFixed(1)}`
}

/** 色卡角标：ΔLp + 四舍五入整数 */
export function formatVisualDeltaCoef(delta: number): string {
  if (!Number.isFinite(delta)) return '—'
  return `ΔLp ${Math.round(delta)}`
}

/** 色相差（0–180） */
export function hueDifference(h1: number, h2: number): number {
  const d = Math.abs(h1 - h2) % 360
  return d > 180 ? 360 - d : d
}

/** 视觉可读：正文 / 大号字 最低 ΔLp */
export const VISUAL_DELTA_THRESHOLD = {
  normal: 38,
  large: 30,
} as const
