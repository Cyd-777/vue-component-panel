/**
 * 字体格式 — 项目必备命名样式目录
 *
 * 初始化与升级时合并进 stylePresetStore；用户可编辑数值，不建议删系统 id。
 */
import {
  defaultStylePresetProperties,
  type StylePreset,
  type StylePresetProperties,
} from './stylePresetDefs'

const FF = 'PingFang SC, Microsoft YaHei, Arial, sans-serif'
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
const C_PRIMARY = 'var(--td-text-color-primary)'
const C_SECONDARY = 'var(--td-text-color-secondary)'
const C_PLACEHOLDER = 'var(--td-text-color-placeholder)'
const C_BRAND = 'var(--td-brand-color)'
const C_ERROR = 'var(--td-error-color)'

export type FontPresetGroupId =
  | 'display'
  | 'heading'
  | 'body'
  | 'auxiliary'
  | 'functional'
  | 'control'
  | 'custom'

export interface FontPresetGroupDef {
  id: FontPresetGroupId
  label: string
  description: string
}

export interface FontPresetCatalogEntry {
  id: string
  name: string
  group: FontPresetGroupId
  sampleText: string
  properties: StylePresetProperties
  /** 列表排序，越小越靠前 */
  order: number
}

export const FONT_PRESET_GROUPS: FontPresetGroupDef[] = [
  {
    id: 'display',
    label: '展示标题',
    description: '落地页、空状态、数据大屏等主视觉标题',
  },
  {
    id: 'heading',
    label: '标题层级',
    description: 'H1–H6 与页面内各级标题，对应语义化 HTML 标题',
  },
  {
    id: 'body',
    label: '正文',
    description: '段落、列表、表格单元格等主阅读内容',
  },
  {
    id: 'auxiliary',
    label: '辅助文本',
    description: '说明、标签、角标等次要信息',
  },
  {
    id: 'functional',
    label: '功能文本',
    description: '链接、代码、价格等带交互或特殊排版的文字',
  },
  {
    id: 'control',
    label: '控件文字',
    description: '按钮、标签页、分段器等控件内文案',
  },
  {
    id: 'custom',
    label: '自定义',
    description: '用户新建的命名样式',
  },
]

function fontProps(overrides: Partial<StylePresetProperties>): StylePresetProperties {
  return {
    ...defaultStylePresetProperties('font'),
    'font-family': FF,
    color: C_PRIMARY,
    ...overrides,
  }
}

/** 必备字体格式清单（与 TDesign 字号体系对齐，可随项目 token 再调） */
export const FONT_PRESET_CATALOG: FontPresetCatalogEntry[] = [
  {
    id: 'display',
    name: '展示标题 Display',
    group: 'display',
    order: 10,
    sampleText: '展示标题',
    properties: fontProps({
      'font-size': '36px',
      'font-weight': '600',
      'line-height': '44px',
      'letter-spacing': '-0.02em',
    }),
  },
  {
    id: 'headline',
    name: '大标题 Headline',
    group: 'display',
    order: 20,
    sampleText: '大标题',
    properties: fontProps({
      'font-size': '28px',
      'font-weight': '600',
      'line-height': '36px',
    }),
  },
  {
    id: 'h1',
    name: '一级标题 H1',
    group: 'heading',
    order: 30,
    sampleText: 'Heading 1',
    properties: fontProps({
      'font-size': '28px',
      'font-weight': '600',
      'line-height': '36px',
    }),
  },
  {
    id: 'h2',
    name: '二级标题 H2',
    group: 'heading',
    order: 40,
    sampleText: 'Heading 2',
    properties: fontProps({
      'font-size': '24px',
      'font-weight': '600',
      'line-height': '32px',
    }),
  },
  {
    id: 'h3',
    name: '三级标题 H3',
    group: 'heading',
    order: 50,
    sampleText: 'Heading 3',
    properties: fontProps({
      'font-size': '20px',
      'font-weight': '600',
      'line-height': '28px',
    }),
  },
  {
    id: 'h4',
    name: '四级标题 H4',
    group: 'heading',
    order: 60,
    sampleText: 'Heading 4',
    properties: fontProps({
      'font-size': '18px',
      'font-weight': '600',
      'line-height': '26px',
    }),
  },
  {
    id: 'h5',
    name: '五级标题 H5',
    group: 'heading',
    order: 70,
    sampleText: 'Heading 5',
    properties: fontProps({
      'font-size': '16px',
      'font-weight': '600',
      'line-height': '24px',
    }),
  },
  {
    id: 'h6',
    name: '六级标题 H6',
    group: 'heading',
    order: 80,
    sampleText: 'Heading 6',
    properties: fontProps({
      'font-size': '14px',
      'font-weight': '600',
      'line-height': '22px',
    }),
  },
  {
    id: 'title',
    name: '标题（通用）',
    group: 'heading',
    order: 85,
    sampleText: '通用标题',
    properties: fontProps({
      'font-size': '16px',
      'font-weight': '600',
      'line-height': '24px',
    }),
  },
  {
    id: 'body-lg',
    name: '正文-大 Body Large',
    group: 'body',
    order: 100,
    sampleText: '大号正文用于强调段落或简介区域。',
    properties: fontProps({
      'font-size': '16px',
      'font-weight': '400',
      'line-height': '24px',
    }),
  },
  {
    id: 'body',
    name: '正文 Body',
    group: 'body',
    order: 110,
    sampleText: '标准正文，列表与表单说明的默认字号。',
    properties: fontProps({
      'font-size': '14px',
      'font-weight': '400',
      'line-height': '22px',
    }),
  },
  {
    id: 'body-sm',
    name: '正文-小 Body Small',
    group: 'body',
    order: 120,
    sampleText: '紧凑场景下的正文，如表格密排。',
    properties: fontProps({
      'font-size': '12px',
      'font-weight': '400',
      'line-height': '20px',
    }),
  },
  {
    id: 'caption',
    name: '辅助说明 Caption',
    group: 'auxiliary',
    order: 130,
    sampleText: '辅助说明、图表注释',
    properties: fontProps({
      'font-size': '12px',
      'font-weight': '400',
      'line-height': '20px',
      color: C_SECONDARY,
    }),
  },
  {
    id: 'label',
    name: '表单标签 Label',
    group: 'auxiliary',
    order: 140,
    sampleText: '字段名称',
    properties: fontProps({
      'font-size': '14px',
      'font-weight': '500',
      'line-height': '22px',
    }),
  },
  {
    id: 'overline',
    name: '角标 Overline',
    group: 'auxiliary',
    order: 150,
    sampleText: 'CATEGORY',
    properties: fontProps({
      'font-size': '11px',
      'font-weight': '500',
      'line-height': '16px',
      'letter-spacing': '0.08em',
      'text-transform': 'uppercase',
      color: C_PLACEHOLDER,
    }),
  },
  {
    id: 'hint',
    name: '提示 Hint',
    group: 'auxiliary',
    order: 160,
    sampleText: '校验失败或操作提示',
    properties: fontProps({
      'font-size': '12px',
      'font-weight': '400',
      'line-height': '20px',
      color: C_ERROR,
    }),
  },
  {
    id: 'link',
    name: '链接 Link',
    group: 'functional',
    order: 200,
    sampleText: '查看详情',
    properties: fontProps({
      'font-size': '14px',
      'font-weight': '400',
      'line-height': '22px',
      color: C_BRAND,
      'text-decoration-line': 'none',
    }),
  },
  {
    id: 'link-hover',
    name: '链接-悬停 Link Hover',
    group: 'functional',
    order: 210,
    sampleText: '悬停态链接',
    properties: fontProps({
      'font-size': '14px',
      'font-weight': '400',
      'line-height': '22px',
      color: C_BRAND,
      'text-decoration-line': 'underline',
      'text-decoration-color': C_BRAND,
    }),
  },
  {
    id: 'code',
    name: '代码 Code',
    group: 'functional',
    order: 220,
    sampleText: 'npm run dev',
    properties: fontProps({
      'font-family': MONO,
      'font-size': '13px',
      'font-weight': '400',
      'line-height': '20px',
      color: C_PRIMARY,
    }),
  },
  {
    id: 'code-inline',
    name: '行内代码 Inline Code',
    group: 'functional',
    order: 230,
    sampleText: 'const x = 1',
    properties: fontProps({
      'font-family': MONO,
      'font-size': '12px',
      'font-weight': '400',
      'line-height': '20px',
      color: C_PRIMARY,
    }),
  },
  {
    id: 'price',
    name: '价格 Price',
    group: 'functional',
    order: 240,
    sampleText: '¥ 1,280.00',
    properties: fontProps({
      'font-size': '20px',
      'font-weight': '600',
      'line-height': '28px',
      'letter-spacing': '0.02em',
      color: C_ERROR,
    }),
  },
  {
    id: 'button-lg',
    name: '按钮-大',
    group: 'control',
    order: 300,
    sampleText: '主要操作',
    properties: fontProps({
      'font-size': '16px',
      'font-weight': '500',
      'line-height': '24px',
    }),
  },
  {
    id: 'button',
    name: '按钮-中',
    group: 'control',
    order: 310,
    sampleText: '确认',
    properties: fontProps({
      'font-size': '14px',
      'font-weight': '500',
      'line-height': '22px',
    }),
  },
  {
    id: 'button-sm',
    name: '按钮-小',
    group: 'control',
    order: 320,
    sampleText: '取消',
    properties: fontProps({
      'font-size': '12px',
      'font-weight': '500',
      'line-height': '20px',
    }),
  },
  {
    id: 'tab',
    name: '标签页 Tab',
    group: 'control',
    order: 330,
    sampleText: '选项卡',
    properties: fontProps({
      'font-size': '14px',
      'font-weight': '500',
      'line-height': '22px',
      color: C_SECONDARY,
    }),
  },
  {
    id: 'badge',
    name: '徽标 Badge',
    group: 'control',
    order: 340,
    sampleText: 'NEW',
    properties: fontProps({
      'font-size': '10px',
      'font-weight': '600',
      'line-height': '14px',
      'letter-spacing': '0.04em',
      'text-transform': 'uppercase',
    }),
  },
]

const catalogById = new Map(FONT_PRESET_CATALOG.map((e) => [e.id, e]))

export function getFontPresetCatalogEntry(id: string): FontPresetCatalogEntry | undefined {
  return catalogById.get(id)
}

export function catalogEntryToPreset(entry: FontPresetCatalogEntry): StylePreset {
  return {
    id: entry.id,
    name: entry.name,
    category: 'font',
    properties: { ...entry.properties },
  }
}

export function buildFontPresetsFromCatalog(): StylePreset[] {
  return FONT_PRESET_CATALOG.map(catalogEntryToPreset)
}

export function mergeMissingFontPresets(existing: StylePreset[]): StylePreset[] {
  const merged = [...existing]
  for (const entry of FONT_PRESET_CATALOG) {
    if (!merged.some((p) => p.id === entry.id)) {
      merged.push(catalogEntryToPreset(entry))
    }
  }
  return merged
}

export function fontPresetOrder(id: string): number {
  return catalogById.get(id)?.order ?? 9000
}

export function fontPresetGroup(id: string): FontPresetGroupId {
  return catalogById.get(id)?.group ?? 'custom'
}

export function fontPresetSampleText(id: string): string {
  return catalogById.get(id)?.sampleText ?? '示例文字'
}

export function groupFontPresets(presets: StylePreset[]): {
  group: FontPresetGroupDef
  presets: StylePreset[]
}[] {
  const sorted = [...presets].sort(
    (a, b) => fontPresetOrder(a.id) - fontPresetOrder(b.id) || a.name.localeCompare(b.name, 'zh'),
  )

  const buckets = new Map<FontPresetGroupId, StylePreset[]>()
  for (const preset of sorted) {
    const g = fontPresetGroup(preset.id)
    if (!buckets.has(g)) buckets.set(g, [])
    buckets.get(g)!.push(preset)
  }

  return FONT_PRESET_GROUPS.filter((g) => (buckets.get(g.id)?.length ?? 0) > 0).map((group) => ({
    group,
    presets: buckets.get(group.id) ?? [],
  }))
}
