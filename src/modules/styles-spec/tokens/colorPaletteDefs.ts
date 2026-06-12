import type { DesignTokenValues } from './designTokenDefs'

/** 色板矩阵槽位 — 固定集合，非「新建样式」 */
export interface ColorPaletteSlot {
  id: string
  cssVar: string
  label: string
  /** 核心色：读写 designTokenState，始终有值 */
  tokenKey?: keyof DesignTokenValues
  /** 可选色：未设置时在矩阵中显示为空 */
  optional?: boolean
}

export interface ColorPaletteColumn {
  id: string
  title: string
  slots: ColorPaletteSlot[]
}

export interface ColorPaletteBoard {
  title: string
  hint?: string
  columns: ColorPaletteColumn[]
}

const BRAND_CORE: ColorPaletteSlot = {
  id: 'brand',
  cssVar: '--td-brand-color',
  label: '品牌色',
  tokenKey: 'brandColor',
}

const BRAND_STATES: ColorPaletteSlot[] = [
  { id: 'brand-hover', cssVar: '--td-brand-color-hover', label: '品牌悬停', optional: true },
  { id: 'brand-active', cssVar: '--td-brand-color-active', label: '品牌激活', optional: true },
  { id: 'brand-focus', cssVar: '--td-brand-color-focus', label: '聚焦', optional: true },
  { id: 'brand-light', cssVar: '--td-brand-color-light', label: '浅色', optional: true },
  { id: 'brand-light-hover', cssVar: '--td-brand-color-light-hover', label: '浅色悬停', optional: true },
  { id: 'brand-disabled', cssVar: '--td-brand-color-disabled', label: '禁用', optional: true },
]

const BRAND_SCALE: ColorPaletteSlot[] = Array.from({ length: 10 }, (_, i) => ({
  id: `brand-${i + 1}`,
  cssVar: `--td-brand-color-${i + 1}`,
  label: `Brand${i + 1}`,
  optional: true,
}))

export const BRAND_SCALE_SLOTS: ColorPaletteSlot[] = BRAND_SCALE

function semanticCore(
  kind: 'success' | 'warning' | 'error',
  label: string,
  tokenKey: keyof DesignTokenValues,
): ColorPaletteSlot {
  return {
    id: kind,
    cssVar: `--td-${kind}-color`,
    label: `${label}色`,
    tokenKey,
  }
}

function semanticStates(kind: 'success' | 'warning' | 'error', label: string): ColorPaletteSlot[] {
  return [
    { id: `${kind}-hover`, cssVar: `--td-${kind}-color-hover`, label: `${label}悬停`, optional: true },
    { id: `${kind}-active`, cssVar: `--td-${kind}-color-active`, label: `${label}激活`, optional: true },
    { id: `${kind}-light`, cssVar: `--td-${kind}-color-light`, label: `${label}浅色`, optional: true },
  ]
}

const ERROR_AUX: ColorPaletteSlot[] = [
  { id: 'error-1', cssVar: '--td-error-color-1', label: '背景 1', optional: true },
  { id: 'error-2', cssVar: '--td-error-color-2', label: '背景 2', optional: true },
  { id: 'error-3', cssVar: '--td-error-color-3', label: '边框', optional: true },
]

/** 四列功能色：主色在上，扩展色纵排 */
export const COLOR_PALETTE_FUNCTIONAL_BOARD: ColorPaletteBoard = {
  title: '功能色',
  hint: '主色已预设；空色块可点击设置，清除后恢复自动生成。',
  columns: [
    {
      id: 'brand',
      title: '品牌',
      slots: [BRAND_CORE, ...BRAND_STATES],
    },
    {
      id: 'success',
      title: '成功',
      slots: [
        semanticCore('success', '成功', 'successColor'),
        ...semanticStates('success', '成功'),
      ],
    },
    {
      id: 'warning',
      title: '警告',
      slots: [
        semanticCore('warning', '警告', 'warningColor'),
        ...semanticStates('warning', '警告'),
      ],
    },
    {
      id: 'error',
      title: '错误',
      slots: [
        semanticCore('error', '错误', 'errorColor'),
        ...semanticStates('error', '错误'),
        ...ERROR_AUX,
      ],
    },
  ],
}

/** 中性色：文字 / 背景 / 边框三列纵排 */
export const COLOR_PALETTE_NEUTRAL_BOARD: ColorPaletteBoard = {
  title: '文字与背景',
  hint: '界面中性色；扩展项默认可为空。',
  columns: [
    {
      id: 'text',
      title: '文字',
      slots: [
        { id: 'text-primary', cssVar: '--td-text-color-primary', label: '主文字', tokenKey: 'textPrimary' },
        { id: 'text-secondary', cssVar: '--td-text-color-secondary', label: '次要文字', tokenKey: 'textSecondary' },
        { id: 'text-placeholder', cssVar: '--td-text-color-placeholder', label: '占位文字', optional: true },
        { id: 'text-brand', cssVar: '--td-text-color-brand', label: '品牌文字', optional: true },
        { id: 'text-link', cssVar: '--td-text-color-link', label: '链接文字', optional: true },
        { id: 'text-disabled', cssVar: '--td-text-color-disabled', label: '禁用文字', optional: true },
      ],
    },
    {
      id: 'background',
      title: '背景',
      slots: [
        { id: 'bg-page', cssVar: '--td-bg-color-page', label: '页面背景', tokenKey: 'bgPage' },
        { id: 'bg-container', cssVar: '--td-bg-color-container', label: '容器背景', tokenKey: 'bgContainer' },
        { id: 'bg-secondary', cssVar: '--td-bg-color-secondarycontainer', label: '次级容器', optional: true },
        { id: 'bg-hover', cssVar: '--td-bg-color-container-hover', label: '容器悬停', optional: true },
        { id: 'bg-active', cssVar: '--td-bg-color-container-active', label: '容器激活', optional: true },
      ],
    },
    {
      id: 'border',
      title: '边框',
      slots: [
        { id: 'border', cssVar: '--td-component-border', label: '组件边框', tokenKey: 'borderColor' },
        { id: 'stroke', cssVar: '--td-component-stroke', label: '组件描边', optional: true },
        { id: 'border-level-1', cssVar: '--td-border-level-1-color', label: '层级 1', optional: true },
        { id: 'border-level-2', cssVar: '--td-border-level-2-color', label: '层级 2', optional: true },
      ],
    },
  ],
}

export const COLOR_PALETTE_BOARDS: ColorPaletteBoard[] = [
  COLOR_PALETTE_FUNCTIONAL_BOARD,
  COLOR_PALETTE_NEUTRAL_BOARD,
]

export const ALL_COLOR_PALETTE_SLOTS: ColorPaletteSlot[] = [
  ...COLOR_PALETTE_BOARDS.flatMap((board) => board.columns.flatMap((col) => col.slots)),
  ...BRAND_SCALE_SLOTS,
]

export function findPaletteSlot(id: string): ColorPaletteSlot | undefined {
  return ALL_COLOR_PALETTE_SLOTS.find((s) => s.id === id)
}
