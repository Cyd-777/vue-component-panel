# FlowButton API

> themeId: `button` · profile: **A** · 替换: `TButton` / `<t-button>`

---

## 元信息（AI 可读）

| 字段 | 值 |
|------|-----|
| component | FlowButton |
| themeId | button |
| profile | A |
| registry.tag | FlowButton |
| registry.category | form |
| settingsCatalog | COMPONENT_SETTINGS_CATALOG §4.2 · 行 01 |
| tdesignRef | `theme` · `variant` · `size` · `shape` · `disabled` · `loading` |

---

## 导入与基本用法

```vue
<script setup lang="ts">
import { FlowButton } from '@/modules/components/button'
</script>

<template>
  <FlowButton theme="primary" variant="outline" size="medium">保存</FlowButton>
</template>
```

---

## Props（行为 API）

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `theme` | `'primary' \| 'success' \| 'warning' \| 'danger' \| 'default'` | `'primary'` | 语义色；映射内部 `ButtonSemanticTheme` |
| `variant` | `'base' \| 'outline' \| 'dashed' \| 'text'` | `'base'` | 形态；仅改 CSS 配方，不增变量 |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | 高度 / 内边距 / 字号槽 |
| `shape` | `'rectangle' \| 'square' \| 'round' \| 'circle'` | `'rectangle'` | 圆角规则；circle 可走 `--flow-button-radius-round` |
| `disabled` | `boolean` | `false` | 读 disabled 配方 + 语义 disabled 色 |
| `loading` | `boolean` | `false` | 只读行为，样式同 disabled 变体 |
| `block` | `boolean` | `false` | 宽度 100% |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | 原生 type |

### theme 与 TDesign 映射

| FlowButton | TDesign `theme` |
|------------|-----------------|
| primary | primary |
| success | success |
| warning | warning |
| danger | danger |
| default | default |

---

## Emits

| 事件 |  payload | 说明 |
|------|----------|------|
| `click` | `MouseEvent` | disabled / loading 时不触发 |

---

## Slots

| 名称 | 说明 |
|------|------|
| default | 按钮文字 |
| icon | 左侧图标（可选） |

---

## 变体与交互态（传统对齐）

- **variant** 不引入独立颜色变量；见 §形态配方。  
- **交互态** hover / active / focus-visible / disabled / loading 由伪类 + 色板 `-hover` / `-active` / `-disabled` 驱动。  
- **focus 环** 使用 `--flow-button-focus-ring`（统一项，非 per-theme）。

---

## 样式 CSS 变量（完整清单）

组件根节点 class：`flow-btn`。  
所有样式属性通过下列变量定义；实现时 **fallback 链必须与下表一致**。

### 统一项（组件级 · 全 theme · 全 variant · 全 state）

| 变量名 | 类型 | 默认 fallback | 设置项 | binding 键 | 说明 |
|--------|------|---------------|--------|------------|------|
| `--flow-button-radius` | length | `var(--td-radius-default)` | 圆角 | `radiusToken` → `--td-radius-*` | 外轮廓圆角 |
| `--flow-button-radius-round` | length | `var(--td-radius-round)` | 圆角 | — | shape=circle |
| `--flow-button-height-small` | length | `var(--td-comp-size-s)` | 尺寸 | — | size=small |
| `--flow-button-height-medium` | length | `var(--td-comp-size-m)` | 尺寸 | — | size=medium |
| `--flow-button-height-large` | length | `var(--td-comp-size-l)` | 尺寸 | — | size=large |
| `--flow-button-padding-x-small` | length | `var(--td-comp-paddingLR-m)` | 尺寸 | — | 水平内边距 |
| `--flow-button-padding-x-medium` | length | `var(--td-comp-paddingLR-l)` | 尺寸 | — | |
| `--flow-button-padding-x-large` | length | `var(--td-comp-paddingLR-xl)` | 尺寸 | — | |
| `--flow-button-font-small` | font | `var(--td-font-body-small)` 或 preset | 字体格式 | `fontPresetBySize.small` | |
| `--flow-button-font-medium` | font | `var(--td-font-body-medium)` 或 preset | 字体格式 | `fontPresetBySize.medium` | |
| `--flow-button-font-large` | font | `var(--td-font-body-large)` 或 preset | 字体格式 | `fontPresetBySize.large` | |
| `--flow-button-shadow` | shadow | `none` 或 effect preset | 效果 | `effectPresetId` | 填充钮阴影；outline/text 常为 none |
| `--flow-button-border-width` | length | `1px` | 边框 | `borderEffectPresetId` | outline/dashed |
| `--flow-button-border-style` | — | `solid` | 边框 | — | dashed variant 写死 `dashed` |
| `--flow-button-motion` | transition | `var(--flow-motion-transition-base)` | 交互态 | `motionPresetId` | hover/active 过渡 |
| `--flow-button-focus-ring` | border | `2px solid var(--td-brand-color-focus)` | 交互态 | — | focus-visible outline |

### 语义项（per theme · Profile A）

每种 theme 三个角色；组件内通过 `[data-theme="…"]` 或 class `flow-btn--theme-*` 作用域赋值。

| theme | 角色 | 变量名 | 默认引用 `--td-*` | binding 键 |
|-------|------|--------|-------------------|------------|
| primary | main | `--flow-button-main-primary` | `--td-brand-color` | `semanticColors.default.main` |
| primary | on-main | `--flow-button-on-main-primary` | `--td-text-color-anti` | `semanticColors.default.onMain` |
| primary | light | `--flow-button-light-primary` | `--td-brand-color-light` | `semanticColors.default.light` |
| success | main | `--flow-button-main-success` | `--td-success-color` | `semanticColors.success.main` |
| success | on-main | `--flow-button-on-main-success` | `--td-text-color-anti` | `semanticColors.success.onMain` |
| success | light | `--flow-button-light-success` | `--td-success-color-light` | `semanticColors.success.light` |
| warning | main | `--flow-button-main-warning` | `--td-warning-color` | `semanticColors.warning.main` |
| warning | on-main | `--flow-button-on-main-warning` | `--td-text-color-anti` | `semanticColors.warning.onMain` |
| warning | light | `--flow-button-light-warning` | `--td-warning-color-light` | `semanticColors.warning.light` |
| danger | main | `--flow-button-main-danger` | `--td-error-color` | `semanticColors.danger.main` |
| danger | on-main | `--flow-button-on-main-danger` | `--td-text-color-anti` | `semanticColors.danger.onMain` |
| danger | light | `--flow-button-light-danger` | `--td-error-color-light` | `semanticColors.danger.light` |
| default | main | `--flow-button-main-default` | `--td-bg-color-component` | `semanticColors.gray.main` |
| default | on-main | `--flow-button-on-main-default` | `--td-text-color-primary` | `semanticColors.gray.onMain` |
| default | light | `--flow-button-light-default` | `--td-bg-color-container-hover` | `semanticColors.gray.light` |

**运行时简化：** 选中 theme 后将当前 theme 的三角色映射到短名 `--flow-button-main` / `--flow-button-on-main` / `--flow-button-light`（由 binding inject 或组件 computed style）。

### 交互态（配方 · 不单独绑 grid）

| 状态 | 行为 | 变量来源 |
|------|------|----------|
| hover | 填充：bg → `{semantic}-hover` | `var(--td-{semantic}-color-hover)` 或 main 的 hover 映射 |
| active | 填充：bg → `{semantic}-active` | `var(--td-{semantic}-color-active)` |
| disabled | 填充/描边/字 → disabled | `var(--td-{semantic}-color-disabled)` 或 component-disabled |
| focus-visible | 焦点环 | `--flow-button-focus-ring` |

### 形态配方（代码片段 · 零增变量）

| variant | background | border | color | hover 背景 |
|---------|------------|--------|-------|------------|
| base | `--flow-button-main` | same as bg | `--flow-button-on-main` | semantic hover |
| outline | transparent | `--flow-button-main` | `--flow-button-main` | `--flow-button-light` |
| dashed | 同 outline | + `border-style: dashed` | 同 outline | 同 outline |
| text | transparent | none | `--flow-button-main` | transparent 或 light |

## 样式代码片段（非纯变量实现）

| 片段 ID | 类型 | 用途 | 关键参数 | 参数来源 | 设置项 |
|---------|------|------|----------|----------|--------|
| `variant-base` | recipe | 填充形态 | main, on-main | `--flow-button-main` 等 | — |
| `variant-outline` | recipe | 描边形态 | main, light | 同上 | — |
| `variant-dashed` | recipe | 虚线描边 | 同 outline + border-style | 片段内 `dashed` 常量 | — |
| `variant-text` | recipe | 幽灵/文字 | main | 同上 | — |
| `state-hover-filled` | pseudo | 填充 hover | bg | `--td-*-hover` | 交互态 |
| `state-hover-outline` | pseudo | 描边 hover 铺底 | light | `--flow-button-light` | 交互态 |
| `state-focus-visible` | pseudo | 焦点环 | ring | `--flow-button-focus-ring` | 交互态 |
| `state-disabled` | pseudo | 禁用 | disabled 色 | `--td-*-disabled` | 交互态 |

> `loading` 若用旋转图标，增加 `spin-loading`（keyframes）片段时，须声明 `--flow-button-spin-duration` 变量。

### 预设引用

| 槽位 | preset 类型 | binding 字段 |
|------|-------------|--------------|
| 表面效果 | effect | `effectPresetId` |
| 边框效果 | effect | `borderEffectPresetId` |
| 过渡 | motion | `motionPresetId` |
| 字号大/中/小 | font | `fontPresetBySize.*` |

---

## 禁止事项

- 禁止在组件 CSS / props 中写死主题 hex（`#0052d9` 等）。  
- 禁止为每个 variant 新增颜色变量（如 `--flow-button-outline-success-bg`）。  
- 禁止在设置 Tab 为 5×3 交互态网格绑 bg/text/border。  
- 禁止 bypass 变量直接 `@import` TDesign button 样式（过渡目标为纯 Flow CSS）。

---

## 相关链接

- [BUTTON_THEME_MODEL.md](../../styles-spec/docs/BUTTON_THEME_MODEL.md)
- [COMPONENT_SETTINGS_CATALOG.md](../../styles-spec/docs/COMPONENT_SETTINGS_CATALOG.md) · 01 Button
- [CSS_VARIABLE_SYSTEM.md](../../styles-spec/docs/CSS_VARIABLE_SYSTEM.md)
