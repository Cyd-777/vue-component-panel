# Flow Panel — 功能列表

> 查阅当前已实现能力、部分完成项与待做项。  
> 交互细节与优先级定义见 [PROJECT.md](./PROJECT.md) 第七节；架构与分区规划见 [PROJECT.md](./PROJECT.md) 第一、二节。

**最后同步：** 2026-06-07（含全局样式规范 STYLES_SPEC、尺寸尺度、使用规范主题设置）

---

## 状态图例

| 标记 | 含义 |
| --- | --- |
| ✅ | 已完成，可正常使用 |
| 🔶 | 部分完成（有 UI 或核心路径，未闭环） |
| ⬜ | 未开始 |
| — | 暂不实施（优先级 `f`） |

---

## 一、应用壳层

| 功能 | 状态 | 说明 | 入口 / 模块 |
| --- | --- | --- | --- |
| 首次启动 — 选择组件库路径 | ✅ | 文件夹选择或手动输入，写入 `localStorage` | `App.vue` |
| 顶栏导航 | ✅ | 「组件库」「组件画板」切换 | `App.vue` → `/library` · `/editor` |
| TDesign 主题与设计 Token | ✅ | 全局 CSS 变量初始化 | `tokens/designTokenStore.ts` |

---

## 二、组件库分区（`/library`）

| 功能 | 状态 | 说明 | 入口 / 模块 |
| --- | --- | --- | --- |
| 文档示例 | 🔶 | 左侧组件列表 + 右侧占位内容；数据为 mock | `DocsView.vue` |
| 组件注册清单 — 全局 | ✅ | 读取 `global.json`，展示 tag / 名称 / 路径，支持移除 | `InventoryView.vue` · `componentRegistry.ts` |
| 组件注册清单 — 页面局部 | ✅ | 按 `pages/*.json` 切换页面，展示局部注册 | `InventoryView.vue` |

---

## 二 A、全局样式规范（`/styles`）

> 独立模块 `src/modules/styles-spec/` · 框架见 **[STYLES_SPEC.md](./src/modules/styles-spec/STYLES_SPEC.md)**。

| 功能 | 状态 | 说明 | 入口 / 模块 |
| --- | --- | --- | --- |
| 页面壳与 Tab 导航 | ✅ | 定义层 → 约束 → 应用层 | `StylesView.vue` |
| 项目色板 | ✅ | 功能色阶、中性色；写入色彩 token | `ColorPaletteMatrix.vue` · `colorPaletteStore.ts` |
| 尺寸尺度 | ✅ | 间距、圆角、布局尺寸 token | `DimensionSpecPanel.vue` · `designTokenStore.ts` |
| 字体 / 效果 / 动效 — 命名样式 | ✅ | 命名集合 CRUD，注入 `.flow-style-*` | `StyleEditorPanel.vue` · `stylePresetStore.ts` |
| WCAG 对比度 | ✅ | 说明、尺寸对照表、计算器 | `WcagContrastPanel.vue` |
| 设置 — 组件主题绑定 | 🚧 | Button 范本：五语义色×交互态、统一圆角/边框/效果/动效、尺寸字体 | `componentThemeBindingDefs.ts` · `UsageSpecSettingsPanel.vue` |
| 设置 — 组件预览 | ✅ | 按组件分组（颜色/效果/动效/字体等维度） | `UsageSpecPanel.vue` |
| Icon 一览 | ✅ | TDesign 图标静态预览 | `StylesView.vue` |
| 规范单文件导出 / 画板全量引用 | ⬜ | 后续；见 STYLES_SPEC §七 | — |

---

## 三、组件画板 — 组件样式模式三视图联动（`/editor` · `canvasMode: edit`）

| 功能 | 状态 | 说明 | 入口 / 模块 |
| --- | --- | --- | --- |
| 画布实时预览 | ✅ | 源码编译为 Vue 组件渲染；`data-el-i` 注入 | `livePreview.ts` · `EditorView.vue` |
| 属性面板 | ✅ | 选中元素编辑标签属性；静态 / 动态绑定切换；增删属性 | `PropsPanel.vue` |
| 代码面板 | ✅ | Monaco 编辑 `<template>` 源码，变更触发重编译 | `CodeEditor.vue` |
| 单一数据源 | ✅ | `componentCode` 字符串为真相；画布 / 属性 / 代码均写回源码 | `EditorView.vue` |
| 编译失败保护 | ✅ | 语法错误保留上次有效预览 + 错误提示 | `livePreview.ts` · `onCodeChange` |
| 组件样式 / 交互逻辑切换 | ✅ | 工具栏分段切换；交互逻辑见 §十三 | `EditorView.vue` |
| 元素结构树（图层列表） | 🔶 | 组件样式模式左侧 DOM 层级 | `StructureTreePanel.vue` · `tagTree.ts` |

---

## 四、组件画板 — 工具栏

| 功能 | 状态 | 说明 | 快捷键 / 入口 |
| --- | --- | --- | --- |
| 添加容器 | ✅ | 点击容器内部或元素间插入 `LayoutContainer`；Esc 取消 | 「+ 容器」+ 画布点击 |
| 添加文本 | ✅ | 点击插入 `<span>文本</span>` | 「+ 文本」+ 画布点击 |
| 自动布局包裹 | ✅ | 多选同级元素 → 包裹为 flex `LayoutContainer` | 「自动布局」/ `Ctrl+Shift+A` |
| 光标工具 | ✅ | 选择、拖拽、框选、缩放 | 工具栏「⬤ 光标」 |
| 代码面板开关 | ✅ | 底部展开 / 收起 Monaco | 「代码面板」 |
| 历史面板 | ✅ | 下拉列出 `history[]`，点击跳转任意快照 | 工具栏「历史」 |

---

## 五、组件画板 — 选择与悬浮

| 功能 | 状态 | 操作方式 | 模块 |
| --- | --- | --- | --- |
| 点击选中 | ✅ | 左键点击元素 | `EditorView.vue` |
| 点击空白取消选中 | ✅ | 左键点击画布空白 | `EditorView.vue` |
| Shift 多选 | ✅ | Shift + 点击切换选中 | `EditorView.vue` |
| 框选 Marquee | 🔶 | 空白拖拽多选 ✅；批量属性/批量手柄等 ⬜ | `SelectionOverlay.vue` · `EditorView.vue` |
| 悬浮高亮 | ✅ | 鼠标移过元素虚线框 | `SelectionOverlay.vue` |
| 选中框 + 八向手柄 | ✅ | 单选 `LayoutContainer` 时显示可交互手柄 | `SelectionOverlay.vue` |
| 选中父容器（双击边缘） | ⬜ | — | — |
| 穿透选中 Ctrl+点击 | ⬜ | — | — |

---

## 六、组件画板 — 移动

| 功能 | 状态 | 操作方式 | 模块 |
| --- | --- | --- | --- |
| 同级拖拽排序 | ✅ | 拖拽元素，蓝线指示插入位置 | `sourceManip.ts` |
| 跨容器拖入 | ✅ | 拖入其他 `LayoutContainer` 内部；绿色高亮目标容器 | `sourceManip.ts` · `EditorView.vue` |
| 根层元素拖拽 | — | `parent === null` 的元素不可拖（模板直系子） | `EditorView.vue` |
| 多选同父拖拽 | ✅ | Shift/框选后拖任一选中项，整组移动并保持顺序 | `moveTagGroupToParent` |
| 吸附对齐 / Shift 约束 / 方向键微调 | — | 优先级 `f`，暂不实施 | — |

---

## 七、组件画板 — 缩放（八向手柄）

| 功能 | 状态 | 操作方式 | 模块 |
| --- | --- | --- | --- |
| 8 方向缩放手柄 | ✅ | 拖动手柄，松手写回源码 | `resizeLogic.ts` · `SelectionOverlay.vue` |
| hug / fill / fixed 判定 | ✅ | 贴内容 → hug；贴父级 → fill；中间 → fixed + 像素值 | `resizeLogic.ts` |
| 极值视觉指引 | ✅ | 有 min/max 时淡紫（min）/ 淡绿（max）区域 | `SelectionOverlay.vue` |
| 预览 clamp | ✅ | 拖动尺寸限制在 min/max 与 `MIN_SIZE=40` 内 | `resizeLogic.ts` |
| 越过极值带辅助判定 | ✅ | min/max 与 hug/fill 冲突时可拖过极值带判定 | `resizeLogic.ts` |
| hug/fill 光标提示 | ✅ | 判定为 hug/fill 时指针下方悬浮文案 | `SelectionOverlay.vue` |
| 手柄编辑 min/max | — | **明确不做**；极值走属性面板或未来独立画布动作 | — |
| Shift 等比 / Alt 从中心 | — | 优先级 `f` | — |

**适用元素：** 仅 `LayoutContainer`（`span` 无手柄）。

**规格摘要：** 见 [PROJECT.md — 八向手柄缩放（现行规格）](./PROJECT.md#八向手柄缩放现行规格)。

---

## 八、组件画板 — 文本

| 功能 | 状态 | 操作方式 | 模块 |
| --- | --- | --- | --- |
| 双击编辑 span 文本 | ✅ | 双击 → `contentEditable` → Enter/失焦保存 | `EditorView.vue` |
| Escape 取消 | ✅ | 恢复原文 | `EditorView.vue` |
| 空文本拒绝保存 | ✅ | 回退为编辑前内容 | `EditorView.vue` |
| 字体 / 字号 / 颜色 / 对齐 | ✅ | 属性面板文本区 + design token 下拉 | `PropsPanel` · `tokenBindLogic.ts` |
| 自动换行 | ✅ | 浏览器原生 | — |

---

## 九、组件画板 — 历史与剪贴板

| 功能 | 状态 | 快捷键 | 模块 |
| --- | --- | --- | --- |
| 撤销 | ✅ | `Ctrl/Cmd + Z` | `EditorView.vue` |
| 重做 | ✅ | `Ctrl/Cmd + Shift + Z` | `EditorView.vue` |
| 历史跳转 | ✅ | 工具栏「历史」下拉 | `EditorView.vue` |
| 删除选中元素 | ✅ | `Delete` / `Backspace`；删除整段标签块（容器含子元素）；根容器不可删 | `EditorView.vue` · `sourceManip.deleteTagBlock` |
| 复制标签块 | ✅ | `Ctrl/Cmd + C`（含 LayoutContainer 整段子树） | `extractTagBlockLines` |
| 粘贴标签块 | ✅ | `Ctrl/Cmd + V`（插入到选中元素块之后，同级）；**grid 父级下粘贴时 strip 剪贴板坐标并分配到第一个空位** | `pasteTagBlockAfter` · `assignGridChildToFirstEmptyCell` |

历史栈上限：**50** 步。

---

## 十、组件画板 — 属性面板能力

| 能力 | 状态 | 说明 |
| --- | --- | --- |
| 编辑已有属性值 | ✅ | 实时写回源码 |
| 静态 ↔ 动态绑定 | ✅ | `key="v"` ↔ `:key="v"` |
| 删除属性 | ✅ | 从标签行移除 |
| 添加新属性 | ✅ | 自定义 key / value |
| 专用布局控件（Hug/Fill 按钮、gap 拖拽等） | ✅ | PropsPanel 结构化控件 + 画布 gap/padding/圆角拖拽 |

---

## 十一、组件画板 — 属性面板（t1）

| 能力 | 状态 | 说明 |
| --- | --- | --- |
| 与画布选中 id 对齐 | ✅ | 按 `data-el-i` / tagIndex 解析，不再用行号错位 |
| LayoutContainer 布局 | ✅ | 方向、gap（含 **auto**）、padding |
| LayoutContainer 尺寸 | ✅ | width/height 模式 + fixed 数值 + minmax（`fit-content`）；根容器可设宽 |
| 下/右 padding 自适应拖动 | ✅ | compress / expand 双模式 + 橙色标记 |
| LayoutContainer 描边 | ✅ | border 简写 + 统一/四向独立宽度 + 圆角 |
| span 文本样式 | ✅ | 字体 token、字号 token、颜色 token、对齐、字重、斜体、装饰、行高、字间距 | `tokenBindLogic.ts` |
| 全局 token 绑定 | ✅ | 背景/描边/文字/字号/字重/阴影 `var(--td-*)` 预设下拉 |
| ScrubInput 拖拽数值 | ✅ | 图标+输入一体；按住图标左右拖（Shift 加速） | `ScrubInput.vue` |
| 位置（style） | ✅ | 浮动开关 + X/Y/层级 | `positionLogic.ts` |
| 效果（style） | ✅ | 阴影 token 预设 + 自定义；模糊 px | `effectLogic.ts` · `designTokens.ts` |
| span / 容器背景色 | ✅ | 外观 → background-color |
| 全部属性（高级） | ✅ | 原有 key-value 编辑保留 |
| 画布 gap / padding / 圆角拖拽 | ✅ | 选中 flex/grid 容器时显示手柄 |
| grid 轨道胶囊 + 复合编辑 | ✅ | 悬浮列/行网格带 → 视觉胶囊；悬停胶囊 → 拖柄+数值+尺寸模式下拉 | `gridTrackLogic.ts` |
| grid 元素拖放（插入语义） | ✅ | 空位只移动被拖项；有人格链式后移；commit 同步坐标 + HTML 顺序 | `applyGridElementInsertToMatrix` |
| grid 切换 stamp / clear | ✅ | 切 grid 为子项写坐标；切 flex/none 清除坐标 | `stampGridChildCoordinates` · `PropsPanel` |
| grid 子项坐标（属性面板） | ✅ | 选中 grid 直接子项时编辑列/行 | `PropsPanel` · `patchChildGridPlacement` |

---

## 十二、已注册组件能力（LayoutContainer）

`LayoutContainer` 是当前画板主要可编辑容器，支持以下属性（源码 / 属性面板 / 手柄部分联动）：

| 类别 | 属性 | 画布交互 |
| --- | --- | --- |
| 布局 | `layout` · `flex-direction` · `column-gap` · `row-gap` · `padding` · `grid-template-columns` · `grid-template-rows` · 子项 `grid-column` / `grid-row` | 属性面板 ✅ + 画布 gap/padding 拖拽 ✅ + grid 轨道胶囊 ✅ + grid 拖放/粘贴 ✅ |
| 尺寸 | `width-mode` · `height-mode` · `:width` · `:height` · min/max | 手柄 ✅ + 属性面板模式切换 ✅ |
| 视觉 | `background-color` · `border-radius` · `border` · style 内 `border-width/style/color` · `box-shadow` · `filter` · `position` | 属性面板 ✅ + 画布圆角拖拽 ✅ |

默认预览模板含内层 `width-mode="minmax"` 示例，便于测试极值带。

---

## 十三、组件画板 — 交互逻辑模式

> **产品约束（硬性）：** 交互逻辑模式画布**没有**结构编辑能力（无选中框、手柄、增删改、结构属性面板）；**可以**在侧边栏编辑逻辑，并用模拟数据测试。  
> **架构：** 逻辑内容属于 `<script setup>`，不双轨存储；路线为方案 C（结构化模型 + 合并进 `.vue`）→ 终态 A（单一 SFC）。完整规格见 [PROJECT.md §九–§十](./PROJECT.md#九组件画板--交互逻辑模式规格)。

### 13.1 模式与画布

| 功能 | 状态 | 说明 | 模块 |
| --- | --- | --- | --- |
| 组件样式 \| 交互逻辑切换 | ✅ | 工具栏「组件样式 / 交互逻辑」；切逻辑时清选中 | `EditorView.vue` |
| 画布禁用结构编辑 | ✅ | 无 overlay、无框选/拖拽/增删、结构快捷键禁用 | `EditorView.vue` |
| 画布实例可交互 | ✅ | 预览区 pointer-events 正常；click/dblclick 走规则引擎 | `EditorView.vue` |
| 画布布局与组件样式对齐 | ✅ | 同一居中舞台与 preview 尺寸 | `EditorView.vue` |
| 顶部说明条 | ✅ | 交互逻辑模式提示 | `EditorView.vue` |
| **左侧逻辑面板** | 🔶 | Tab：API / 变量 / 方法 / 模拟；绑定与锚点后续 | `LogicSidePanel.vue` |
| 🔶 | **逻辑块** Tab | 快捷指令式动作堆叠；可添加 catalog 全部类型（不含生命周期） | `LogicBlocksPanel.vue` |
| 🔶 | **生命周期** Tab | 独立时间轴；仅添加官方生命周期钩子 | `LogicLifecyclePanel.vue` |
| 🔶 | **源码** Tab | 整文件 Monaco | `LogicCodeRail.vue` |

### 13.2 绑定交互 — 范式 B（已拍板）

> 完整说明见 [PROJECT.md §9.6](./PROJECT.md#96-绑定交互方式--范式-b逻辑块--锚点连线)。逻辑块为代码面板 **最初设计能力**，现作为交互逻辑主路线。

| 项 | 说明 | 状态 |
| --- | --- | --- |
| **范式 B** | 逻辑块 + 块内编辑 + 锚点连线到元素 | 🔶 L2a 进行中（表单 + 双 Tab） |
| 范式 A | 选中即绑定（未采用） | — |
| L1–L7 实施 | 见 PROJECT §9.6.5 | 🔶 L2a |
| 共用能力层 | 变量 · 方法 · 事件 · 生命周期 · API | 🔶 左栏表单（未写回 script） |

### 13.3 侧边栏 — 当前原型 vs 规划树

| 功能 | 状态 | 说明 | 模块 |
| --- | --- | --- | --- |
| **交互规则**（动作链 L0） | 🔶 | 画布规则引擎仍可用；左栏 UI 已移除，待 L5 绑定 | `InteractionLogicPanel.vue` |
| **模拟输入** JSON | 🔶 | 左栏「模拟」Tab | `SimulationDataPanel.vue` |
| **输出观测** + 事件流水 | 🔶 | outputs JSON；规则命中写入流水 | `SimulationDataPanel.vue` |
| **对外 API**（props / emits） | 🔶 | 左栏「API」Tab；`ComponentLogicModel` | `LogicApiPanel.vue` |
| **变量 / 方法** | 🔶 | 左栏「变量」「方法」Tab；尚未 codegen | `LogicVariablesPanel.vue` · `LogicMethodsPanel.vue` |
| **逻辑块 · 快捷指令式 UI** | 🔶 | 动作卡片堆叠 + 搜索添加面板 | `LogicBlocksPanel.vue` · `LogicBlockCard.vue` |
| **逻辑块 · 生命周期** | 🔶 | 右栏时间轴：`LIFECYCLE_TIMELINE` · 固定 hook | `LogicLifecycleTimeline.vue` |
| **逻辑块列表** | 🔶 | 按 category 分组；名称可编辑；锚点后续 | `LogicBlocksPanel.vue` |
| **内部状态 / 模板绑定** | ⬜ | 绑定与 codegen 后续 | — |
| **嵌套与通信** | ⬜ | P0：库组件 + 常量 props | — |
| 逻辑模型持久化 | 🔶 | `localStorage` · `flow-component-logic:{fileId}` | `useComponentLogic.ts` |
| 场景持久化（过渡） | 🔶 | `localStorage` 存 `SimulationScenario`；待合并进 script | `useSimulationScenario.ts` |

### 13.4 交互规则（当前能力 · 过渡原型）

| 触发 | 动作 | 状态 |
| --- | --- | --- |
| 单击 / 双击 | 写入事件流水 | ✅ |
| 单击 / 双击 | 设置 `outputs` 字段 | ✅ |
| 单击 / 双击 | 设置 `inputs` 字段 | ✅ |
| 任意元素 / 指定 `data-el-i` | 规则匹配 | ✅ |

### 13.5 待做（按 [PROJECT §10.7](./PROJECT.md#107-建议实施顺序)）

| 方向 | 状态 | 说明 |
| --- | --- | --- |
| Script 模型 + 合并保存 `.vue` | ⬜ | 方案 C 骨架 |
| 组件 API 可视化 | ⬜ | defineProps / defineEmits |
| 动作链 → handler / emit / state | ⬜ | codegen + template `@` |
| `inputs` → 预览 props | ⬜ | 模拟输入驱动 UI |
| emit 结构化输出面板 | ⬜ | 与规则 outputs 分区 |
| 库组件 + 常量 props | ⬜ | 嵌套第一步 |
| managed 块 + 代码片段库 | ⬜ | 扩大可视化覆盖 |

---

## 十四、待做 / 未决（规划参考 — 组件样式模式）

| 方向 | 状态 | 备注 |
| --- | --- | --- |
| 添加容器 / 添加文本工具 | ✅ | 工具栏切换 + 画布点击插入；Esc 取消 |
| 框选 + 批量属性编辑 | ⬜ | 框选已有；批量改属性、批量手柄等随交互能力补齐后再做 |
| 属性面板极值高亮 | 🔶 | minmax 选中时预览合法区；聚焦 min/max 输入高亮对应极值带 |
| 画布独立编辑 min/max | 未决 | 与手柄分轨 |
| template 根层禁止拖拽 | 未决 | 当前已禁止根元素拖出，是否扩展待评估 |
| 属性面板极值高亮联动 | 未决 | — |
| 对齐分布、编组、组件实例化 | ⬜ / — | 见 PROJECT.md 第七节 |
| 文档编辑器、组件库与画板导出闭环 | 🔶 | 画板已支持导出/打开/插入组件；文档侧联动仍 ⬜ |
| 导出为 .vue 组件文件 | ✅ | 工具栏「导出」→ 下载 + localStorage 组件库 + 注册表 |
| 打开组件文件 | ✅ | 磁盘 .vue / 已保存列表 / 新建空白 |
| 插入已有组件 | ✅ | 「+ 组件」→ 选已保存组件 → 画布点击插入 |

---

## 十五、快捷键速查（组件样式模式）

> 交互逻辑模式下述结构编辑快捷键**均不生效**（画布结构只读）。

| 快捷键 | 功能 |
| --- | --- |
| 左键点击 | 选中 |
| Shift + 左键 | 多选切换 |
| Ctrl/Cmd + Shift + A | 自动布局（包裹选中同级元素） |
| 空白拖拽 | 框选 |
| 元素拖拽 | 排序 / 跨容器移动 |
| 手柄拖拽 | 缩放（LayoutContainer） |
| 双击 span | 文本编辑 |
| Enter | 保存文本 |
| Escape | 取消文本编辑 |
| Delete / Backspace | 删除选中标签行 |
| Ctrl/Cmd + C | 复制标签块（含容器子树） |
| Ctrl/Cmd + V | 粘贴到选中元素之后 |
| Ctrl/Cmd + Z | 撤销 |
| Ctrl/Cmd + Shift + Z | 重做 |

---

## 十六、核心源码索引

|  Concern | 文件 |
| --- | --- |
| grid 占位/插入/stamp/粘贴 | `src/modules/editor/gridTrackLogic.ts` |
| 编辑器主页面（组件样式 / 交互逻辑） | `src/views/EditorView.vue` |
| 结构树面板 | `src/modules/editor/StructureTreePanel.vue` · `StructureTreeRows.vue` |
| 源码 → 树数据 | `src/modules/editor/tagTree.ts` |
| 模拟场景 state（过渡） | `src/modules/simulation/useSimulationScenario.ts` |
| 模拟类型与默认值 | `src/modules/simulation/simulationTypes.ts` |
| 模拟侧边栏（数据 \| 交互 Tab） | `src/modules/simulation/SimulationSidePanel.vue` |
| 模拟数据 / 交互输出 / 流水 | `src/modules/simulation/SimulationDataPanel.vue` |
| 交互规则编辑 | `src/modules/simulation/InteractionLogicPanel.vue` |
| 选中 overlay / 手柄 / 极值带（仅组件样式模式） | `src/modules/editor/interaction/SelectionOverlay.vue` |
| 缩放逻辑 | `src/modules/editor/resizeLogic.ts` |
| 属性读写 patch | `src/modules/editor/attrPatch.ts` |
| 布局间距拖拽 | `src/modules/editor/layoutSpacingLogic.ts` |
| 拖拽排序 / 跨容器 | `src/modules/editor/sourceManip.ts` |
| 标签索引 | `src/modules/editor/tagIndex.ts` |
| 预览编译 | `src/modules/editor/livePreview.ts` |
| 组件文件导入导出 | `src/modules/editor/componentFile.ts` |
| 组件文件库（localStorage） | `src/modules/editor/componentFileStore.ts` |
| 属性面板（仅组件样式模式） | `src/modules/editor/PropsPanel.vue` |
| 布局容器组件 | `src/modules/layout-container/LayoutContainer.vue` |
| 组件注册表 | `src/modules/registry/componentRegistry.ts` |

---

## 十七、编辑面板优化（规划）

> 完整条目与逐项状态见 [PROJECT.md §八](./PROJECT.md#八编辑面板优化清单)。以下为分类摘要。

| 类别 | 状态 | 摘要 |
| --- | --- | --- |
| 手柄与画布交互 | ✅ | §8.1：**11/11** ✅（含 grid 轨道胶囊、元素拖放预览） |
| 属性面板内容 | 🔶 | §8.2 内容：**8** ✅ · **2** 🔶 · **3** ⬜ |
| 属性面板样式 | 🔶 | §8.2 样式：**1** ✅ · **1** ⬜ |
| 代码面板体验 | 🔶 | §8.3 逻辑块编辑器（范式 B）；样式模式底栏整文件 |

---

## 十八、交互逻辑 — script 内容树

> 完整清单、概念拆分、架构决策（方案 C → A）、动作链原则见 [PROJECT.md §十](./PROJECT.md#十交互逻辑--script-内容结构与架构)。

### 18.1 八大类 + 验证 + 代码面板

| 大类 | 包含（摘要） | 优先级 |
| --- | --- | --- |
| 依赖与导入 | 组件 / composable / 工具 import | P2 |
| 组件选项 | `defineOptions`（name、inheritAttrs） | P2 |
| 对外 API | Props、Emits、v-model、Expose、Slots | P0–P2 |
| 内部状态与派生 | ref / reactive、computed | P0–P1 |
| 副作用 | watch / watchEffect、生命周期 | P1 |
| 方法与函数 | handler、业务方法 | P0 |
| 模板绑定 | `:prop`、`@event`、`v-model`；动作链入口 | P0–P1 |
| 嵌套与通信 | 子 props、子 emit、slot、provide/inject、attrs 透传 | P0–P2 |
| 模拟与验证 | mock inputs → 预览；emit / 流水观测 | P1 |
| Script 代码面板 | 全文 + managed 块 + 自定义区 | P0 |

### 18.2 Vue script 完整清单（对照表）

| 官方概念 | 常见写法 | 画板归类 |
| --- | --- | --- |
| 依赖导入 | `import …` | 依赖与导入 |
| 组件选项 | `defineOptions` | 组件选项 |
| Props | `defineProps` / `withDefaults` | 对外 API |
| Emits | `defineEmits` | 对外 API |
| v-model | `defineModel` 或 prop+emit | 对外 API |
| Expose | `defineExpose` | 对外 API |
| Slots | `defineSlots` / `useSlots` | 对外 API |
| 响应式状态 | `ref` / `reactive` | 内部状态与派生 |
| 计算属性 | `computed` | 内部状态与派生 |
| 侦听器 | `watch` / `watchEffect` | 副作用 |
| 生命周期 | `onMounted` 等 | 副作用 |
| 方法 / 函数 | function / async | 方法与函数 |
| 模板引用 | ref DOM / `useTemplateRef` | 模板引用（树中可并入状态或单独） |
| Provide / Inject | `provide` / `inject` | 嵌套与通信 |
| Attrs | `useAttrs`、inheritAttrs | 嵌套与通信 |
| 模板属性 / 事件绑定 | `:prop`、`@event`（在 template） | 模板绑定 |

### 18.3 模式边界（摘要）

| 内容 | 模式 |
| --- | --- |
| template 结构、布局、token | 组件样式 |
| script 定义、模板绑定、动作链 | 交互逻辑 |
| 导出产物 | 单一 `.vue`（template + script + style） |

---

## 十九、交互逻辑能力清单

> **非 Figma 原型交互**；完整说明与 Figma 对照见 [PROJECT.md §10.8](./PROJECT.md#108-交互逻辑能力清单vue--flow-panel)。  
> **Figma 组件交互完整参考**见 [PROJECT.md §十一](./PROJECT.md#十一figma-组件交互参考清单)。  
> 画板编辑手势（选中、拖拽、缩放）见 [PROJECT.md §七](./PROJECT.md#七元素交互动作清单)（组件样式模式）。

### 19.1 总览进度

| 分组 | 条目数 | ✅ | 🔶 | ⬜ |
| --- | --- | --- | --- | --- |
| A 基础设施 | 5 | 0 | 1 | 4 |
| B 对外 API | 6 | 0 | 0 | 6 |
| C 状态与副作用 | 5 | 0 | 0 | 5 |
| D 方法与动作链 | 8 | 0 | 1 | 7 |
| E 模板绑定 | 5 | 0 | 2 | 2 |
| F 嵌套与通信 | 6 | 0 | 1 | 5 |
| G 模拟与验证 | 4 | 0 | 2 | 2 |
| H 依赖与选项 | 2 | 0 | 0 | 2 |

### 19.2 分项清单（跟踪用）

| ID | 能力 | 状态 |
| --- | --- | --- |
| A1 | script 结构化模型解析 | ⬜ |
| A2 | 合并写回 `<script setup>` | ⬜ |
| A3 | 交互逻辑 Script 代码面板 | ⬜ |
| A4 | managed 标记区 | ⬜ |
| A5 | 逻辑并入 script（废双轨） | 🔶 |
| B1–B6 | Props / Emits / v-model / Expose / Slots / TS | ⬜ |
| C1–C5 | state / computed / watch / 生命周期 / template ref | ⬜ |
| D1 | 方法定义 | ⬜ |
| D2 | 动作链触发 UI | 🔶 |
| D3–D8 | 改 state / call / emit / 条件 / 片段 / managed | ⬜ |
| E1 | 常量属性绑定 | 🔶 |
| E2–E4 | 动态绑定 / 事件写回 template / v-model | ⬜ |
| F1 | 库组件 + 常量 props | 🔶 |
| F2–F6 | 动态 props / 子 emit / slot / provide / attrs | ⬜ |
| G1 | inputs → 预览 props | 🔶 |
| G2 | emit 结构化采集 | ⬜ |
| G3 | 画布实测规则 | 🔶 |
| G4 | 多场景 | ⬜ |
| H1–H2 | import / defineOptions | ⬜ |

---

## 二十、Figma 组件交互参考清单

> **参考文档，非 Flow Panel 实现进度。** 完整条目与 Figma → Vue 映射见 [PROJECT.md §十一](./PROJECT.md#十一figma-组件交互参考清单)。  
> §十一 各表最右列 **Flow 取舍** 留空，供标注借鉴 / 差异 / 映射决策。

### 20.1 分组索引

| 分组 | §11 条目 | 内容 |
| --- | --- | --- |
| 11.2 组件结构与属性 | C1–C6, P1–P5, N1–N5, V1–V3 | 主组件、五种 property、嵌套暴露、变体 |
| 11.3 交互式组件 | I1–I8, L1–L3 | Change to、状态记忆、变量联动、限制 |
| 11.4 原型触发器 | T1–T10 | click、hover、press、delay、video… |
| 11.5 原型动作 | A1–A16 | Navigate、Overlay、Change to、Set variable… |
| 11.6 多动作与动画 | M1–M6 | 动作堆叠、if/else、Smart animate、状态管理 |
| 11.7 变量 × 组件 | R1–R4 | 属性绑定变量、跨组件联动、modes |
| 11.9 映射参考 | — | Figma 概念 → Vue / Flow Panel |
| 11.10 讨论结论 | — | Flow 取舍 讨论摘要（草案） |

### 20.2 与 §七、§10.8 的区别

| 章节 | 问的是什么 |
| --- | --- |
| §七 | 在画板里 **怎么编辑**（像 Figma 设计工具） |
| §十一 / §二十 | Figma **组件 + 原型** 能做什么 |
| §10.8 / §十九 | Flow Panel **要在 .vue 里可视化** 什么 |

---

## 维护说明

- 新增或完成功能后，请同步更新本文件对应行的 **状态** 与 **模块** 列。
- Vue 交互逻辑能力清单 → [PROJECT.md §10.8](./PROJECT.md#108-交互逻辑能力清单vue--flow-panel)，进度 [§十九](./FEATURES.md#十九交互逻辑能力清单)。
- Figma 组件交互参考清单 → [PROJECT.md §十一](./PROJECT.md#十一figma-组件交互参考清单)，索引 [§二十](./FEATURES.md#二十figma-组件交互参考清单)。
- 画板编辑手势与 Figma 对照 → [PROJECT.md §七](./PROJECT.md#七元素交互动作清单)。本文件侧重 **「现在能用什么」** 的快速查阅。
