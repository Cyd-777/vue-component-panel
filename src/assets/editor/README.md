# 编辑器属性面板图标

## 尺寸（硬性）

| 类型 | viewBox | 面板展示 |
|------|---------|----------|
| 用户导出（`layout/`、`spacing/` 等） | `0 0 24 24`（浮动 off 等为宽图则 contain 缩入 24px） | **固定 24×24 px**（`.editor-user-icon`） |

布局通用开关：`layout/float-*.svg`、`layout/exclude-stroke-*.svg`
| 九宫格「模式=」三根柱（`align/mode-*.svg`） | `0 0 10 10` | **固定 16×16 px** |

同步脚本：`node scripts/sync-user-figma-icons.mjs`

常量：`src/editor/editorIconTokens.ts`

## 双 icon 输入框（Figma `413:36`）

属性面板（除「图层 / HTML」、**tab 分段切换 / 单 icon 按钮**）中带 select 的输入行用 `InspectorIconField.vue`：

- 左 **32×32** icon + 中间 select 一体背景，**无内部分割线与外边框**
- 尾部 icon 占位暂不展示
