/** 与 StylesView 对齐的设计 token（编辑器属性面板引用） */

export const MOTION_TOKEN_VARS = {
  duration: '--flow-motion-duration',
  delay: '--flow-motion-delay',
  easing: '--flow-motion-easing',
  property: '--flow-motion-property',
} as const

export interface ShadowToken {
  id: 'shadow-1' | 'shadow-2' | 'shadow-3'
  name: string
  token: string
  value: string
}

export const SHADOW_TOKENS: ShadowToken[] = [
  { id: 'shadow-1', name: '阴影 1', token: '--td-shadow-1', value: '0 2px 8px rgba(0,0,0,0.08)' },
  { id: 'shadow-2', name: '阴影 2', token: '--td-shadow-2', value: '0 4px 16px rgba(0,0,0,0.1)' },
  { id: 'shadow-3', name: '阴影 3', token: '--td-shadow-3', value: '0 8px 32px rgba(0,0,0,0.12)' },
]

export const SHADOW_PRESET_OPTIONS = [
  { id: 'none', label: '无' },
  ...SHADOW_TOKENS.map((t) => ({ id: t.id, label: t.name })),
  { id: 'custom', label: '自定义' },
] as const

export type ShadowPresetId = (typeof SHADOW_PRESET_OPTIONS)[number]['id']
