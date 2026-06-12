# Flow{Name} API

> themeId: `{themeId}` · profile: `{A|B|C|D|E|F}` · 替换: `{TDesignTag}`

---

## 元信息（AI 可读）

| 字段 | 值 |
|------|-----|
| component | Flow{Name} |
| themeId | |
| profile | |
| registry.tag | Flow{Name} |
| settingsCatalog | COMPONENT_SETTINGS_CATALOG §4.2 · 行 __ |

---

## 导入与基本用法

```vue
<script setup lang="ts">
import { Flow{Name} } from '@/modules/components/{name}'
</script>

<template>
  <Flow{Name} />
</template>
```

---

## Props（行为 API）

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| | | | |

---

## Emits

| 事件 | payload | 说明 |
|------|---------|------|
| | | |

---

## Slots

| 名称 | 说明 |
|------|------|
| default | |

---

## 变体与交互态（传统对齐）

（说明 theme / variant / 状态机与 TDesign 对应关系）

---

## 样式 CSS 变量（完整清单）

> 实现前填完本节；● 设置项必须在表中有行。

### 统一项（组件级）

| 变量名 | 类型 | 默认 fallback | 设置项 | binding 键 | 说明 |
|--------|------|---------------|--------|------------|------|
| `--flow-{name}-radius` | length | `var(--td-radius-default)` | 圆角 | | |

### 语义项 / 表单态项（按 profile 选一节）

| … | | | | | |

### 交互态（配方）

| 状态 | 行为 | 变量来源 |
|------|------|----------|
| hover | | |

### 形态配方（代码片段 · 见 §样式代码片段）

| variant | … |
|---------|---|

## 样式代码片段（非纯变量实现）

| 片段 ID | 类型 | 用途 | 关键参数 | 参数来源 | 设置项 |
|---------|------|------|----------|----------|--------|

### 预设引用

| 槽位 | preset 类型 | binding 字段 |
|------|-------------|--------------|

---

## 禁止事项

- 禁止硬编码主题色
- 禁止未在本文档声明的样式 props

---

## 相关链接

- [COMPONENT_SETTINGS_CATALOG.md](../../styles-spec/docs/COMPONENT_SETTINGS_CATALOG.md)
- [CSS_VARIABLE_SYSTEM.md](../../styles-spec/docs/CSS_VARIABLE_SYSTEM.md)
