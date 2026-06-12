<script setup lang="ts">
/**
 * LayoutContainer — 布局容器组件
 *
 * 提供基础布局能力（none / flex / grid），支持内边距、间距、排序方向、
 * 宽高模式（hug / fill / fixed / minmax）、最大最小宽高、背景、圆角、描边。
 */
import { computed, useAttrs, type CSSProperties } from 'vue'

defineOptions({ inheritAttrs: false })

export type ContainerLayout = 'none' | 'flex' | 'grid'
export type PaddingValue = number | [number, number, number, number]
export type FlexDirection = 'row' | 'row-reverse' | 'column' | 'column-reverse'
export type SizeMode = 'hug' | 'fill' | 'fixed' | 'minmax'

const props = withDefaults(defineProps<{
  layout?: ContainerLayout
  padding?: PaddingValue
  columnGap?: number | string
  rowGap?: number | string
  flexDirection?: FlexDirection
  alignItems?: string
  justifyContent?: string
  overflow?: 'visible' | 'hidden' | 'auto' | 'clip'
  /** Grid 列数（repeat(n, 1fr)） */
  cols?: number
  /** Grid 行数（repeat(n, auto)；0 或未设则不固定行数） */
  rows?: number
  /** 列轨道模板，如 `1fr 200px` 或 `repeat(3, 1fr)` */
  gridTemplateColumns?: string
  /** 行轨道模板，如 `auto 120px` */
  gridTemplateRows?: string
  /** grid 子项列位置（1-based） */
  gridColumn?: number | string
  /** grid 子项行位置（1-based） */
  gridRow?: number | string
  backgroundColor?: string
  /** CSS border 简写，如 `1px solid #dcdcdc`（优先于拆分属性） */
  border?: string
  borderRadius?: number | string
  borderWidth?: number
  borderColor?: string
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none'

  widthMode?: SizeMode
  width?: number
  minWidth?: number
  maxWidth?: number

  heightMode?: SizeMode
  height?: number
  minHeight?: number
  maxHeight?: number
}>(), {
  layout: 'none',
  padding: 0,
  columnGap: 12,
  rowGap: 12,
  flexDirection: 'row',
  alignItems: 'stretch',
  justifyContent: 'flex-start',
  overflow: 'visible',
  cols: 3,
  rows: 0,
  backgroundColor: undefined,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: 'var(--td-component-border)',
  borderStyle: 'solid',
  widthMode: 'fill',
  width: 200,
  heightMode: 'hug',
  height: 160,
})

function toPx(v: number): string { return `${v}px` }

const paddingStyle = computed(() => {
  const p = props.padding
  if (typeof p === 'number') return toPx(p)
  if (Array.isArray(p) && p.length === 4) return p.map(toPx).join(' ')
  return '0px'
})

function applyMinMaxClamp(
  style: CSSProperties,
  axis: 'width' | 'height',
  min?: number,
  max?: number,
) {
  if (min !== undefined && Number.isFinite(min)) {
    const minKey = axis === 'width' ? 'minWidth' : 'minHeight'
    style[minKey] = toPx(Math.max(0, min))
  }
  if (max !== undefined && Number.isFinite(max)) {
    const maxKey = axis === 'width' ? 'maxWidth' : 'maxHeight'
    style[maxKey] = toPx(Math.max(0, max))
  }
}

function applySizeStyle(
  style: CSSProperties,
  axis: 'width' | 'height',
  mode: SizeMode,
  fixed: number,
  min?: number,
  max?: number,
) {
  if (mode === 'hug') {
    style[axis] = 'fit-content'
    applyMinMaxClamp(style, axis, min, max)
  } else if (mode === 'fill') {
    style[axis] = '100%'
    applyMinMaxClamp(style, axis, min, max)
  } else if (mode === 'fixed') {
    style[axis] = toPx(Math.max(0, fixed))
    applyMinMaxClamp(style, axis, min, max)
  } else if (mode === 'minmax') {
    applyMinMaxClamp(style, axis, min, max)
    style[axis] = 'fit-content'
  }
}

const attrs = useAttrs()

function applyStyleEntry(base: CSSProperties, key: string, value: string) {
  const k = key.trim().toLowerCase()
  if (!value) return
  if (k === 'grid-column') base.gridColumn = value
  else if (k === 'grid-row') base.gridRow = value
  else if (k === 'border-width') {
    base.borderWidth = value
    delete base.border
  } else if (k === 'border-style') {
    base.borderStyle = value
    delete base.border
  } else if (k === 'border-color') {
    base.borderColor = value
    delete base.border
  } else if (k === 'position') {
    base.position = value as CSSProperties['position']
  } else if (k === 'top') {
    base.top = value
  } else if (k === 'left') {
    base.left = value
  } else if (k === 'right') {
    base.right = value
  } else if (k === 'bottom') {
    base.bottom = value
  } else if (k === 'z-index') {
    base.zIndex = value
  } else if (k === 'box-shadow') {
    base.boxShadow = value
  } else if (k === 'filter') {
    base.filter = value
  } else if (k === 'background-color') {
    base.backgroundColor = value
  } else if (k === 'color') {
    base.color = value
  } else if (k === 'font-size') {
    base.fontSize = value
  } else if (k === 'font-family') {
    base.fontFamily = value
  } else if (k === 'font-weight') {
    base.fontWeight = value
  } else if (k === 'font-style') {
    base.fontStyle = value
  } else if (k === 'line-height') {
    base.lineHeight = value
  } else if (k === 'letter-spacing') {
    base.letterSpacing = value
  } else if (k === 'text-align') {
    base.textAlign = value as CSSProperties['textAlign']
  } else if (k === 'text-decoration') {
    base.textDecoration = value
  } else if (k === 'display') {
    base.display = value as CSSProperties['display']
  } else if (k === 'visibility') {
    base.visibility = value as CSSProperties['visibility']
  }
}

function mergeInlineStyleFromAttrs(base: CSSProperties, raw: unknown) {
  if (raw == null) return
  if (typeof raw === 'string') {
    if (!raw.trim()) return
    for (const part of raw.split(';')) {
      const sep = part.indexOf(':')
      if (sep < 0) continue
      applyStyleEntry(base, part.slice(0, sep), part.slice(sep + 1).trim())
    }
    return
  }
  if (Array.isArray(raw)) {
    for (const item of raw) mergeInlineStyleFromAttrs(base, item)
    return
  }
  if (typeof raw === 'object') {
    for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
      if (val == null || val === '') continue
      applyStyleEntry(base, key, String(val))
    }
  }
}

const containerStyle = computed<CSSProperties>(() => {
  const base: CSSProperties = {
    position: 'relative',
    boxSizing: 'border-box',
    padding: paddingStyle.value,
  }

  applySizeStyle(base, 'width', props.widthMode, props.width, props.minWidth, props.maxWidth)
  applySizeStyle(base, 'height', props.heightMode, props.height, props.minHeight, props.maxHeight)

  if (props.backgroundColor) base.backgroundColor = props.backgroundColor
  if (props.borderRadius !== undefined) {
    if (typeof props.borderRadius === 'number') {
      base.borderRadius = toPx(props.borderRadius)
    } else {
      const trimmed = props.borderRadius.trim()
      if (/^\d+(\s+\d+){3}$/.test(trimmed)) {
        base.borderRadius = trimmed.split(/\s+/).map((n) => `${n}px`).join(' ')
      } else {
        base.borderRadius = trimmed
      }
    }
  }
  if (props.border && props.border !== 'none') {
    base.border = props.border
  } else if (props.borderWidth > 0) {
    base.borderWidth = toPx(props.borderWidth)
    base.borderStyle = props.borderStyle
    base.borderColor = props.borderColor
  }

  if (props.overflow && props.overflow !== 'visible') {
    base.overflow = props.overflow
  }

  if (props.layout === 'flex') {
    const isRow = props.flexDirection.includes('row')
    base.display = 'flex'
    base.flexDirection = props.flexDirection
    base.flexWrap = 'wrap'
    base.alignItems = props.alignItems
    base.justifyContent = props.justifyContent
    base.columnGap = typeof props.columnGap === 'number' ? `${props.columnGap}px` : String(props.columnGap)
    base.rowGap = typeof props.rowGap === 'number' ? `${props.rowGap}px` : String(props.rowGap)

    const selfStartCross =
      (!isRow && props.widthMode !== 'fill') ||
      (isRow && props.heightMode !== 'fill')
    if (selfStartCross) {
      base.alignSelf = 'flex-start'
    }
    if (
      props.widthMode === 'fixed' ||
      props.heightMode === 'fixed' ||
      props.widthMode === 'minmax' ||
      props.heightMode === 'minmax'
    ) {
      base.flexShrink = 0
    }
  } else if (props.layout === 'grid') {
    base.display = 'grid'
    const colCount = Math.max(1, props.cols ?? 3)
    if (props.gridTemplateColumns?.trim()) {
      base.gridTemplateColumns = props.gridTemplateColumns.trim()
    } else {
      base.gridTemplateColumns = `repeat(${colCount}, 1fr)`
    }
    if (props.gridTemplateRows?.trim()) {
      base.gridTemplateRows = props.gridTemplateRows.trim()
    } else if (props.rows !== undefined && props.rows > 0) {
      base.gridTemplateRows = `repeat(${props.rows}, auto)`
    }
    base.columnGap = typeof props.columnGap === 'number' ? `${props.columnGap}px` : String(props.columnGap)
    base.rowGap = typeof props.rowGap === 'number' ? `${props.rowGap}px` : String(props.rowGap)
  }

  mergeInlineStyleFromAttrs(base, attrs.style)
  // grid-column / grid-row 属性（props）优先于 style 字符串，与 patchChildGridPlacement 写回方式一致
  if (props.gridColumn !== undefined && props.gridColumn !== '') {
    base.gridColumn = String(props.gridColumn)
  }
  if (props.gridRow !== undefined && props.gridRow !== '') {
    base.gridRow = String(props.gridRow)
  }

  return base
})

/** 画布 hover/选中依赖根节点上的 data-el-i（inheritAttrs: false 时需显式绑定） */
const dataElI = computed(() => {
  const v = attrs['data-el-i'] ?? attrs.dataElI
  return v != null && v !== '' ? String(v) : undefined
})

/** 伪类作用域 class（fp-el-N）等需落到根节点，供 scoped 选择器匹配 */
const passThroughClass = computed(() => attrs.class)
</script>

<template>
  <div class="lc" :class="passThroughClass" :data-el-i="dataElI" :style="containerStyle">
    <slot />
  </div>
</template>

<style scoped>
.lc {
  background: #fff;
}
</style>
