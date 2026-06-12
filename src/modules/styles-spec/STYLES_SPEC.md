# 全局样式规范 — 功能框架

> 路由：`/styles`（顶栏「全局样式规范」）  
> 模块：`src/modules/styles-spec/` · 壳组件：`views/StylesView.vue`  
> 本文档描述该页面的**功能逻辑闭环**与 Tab 职责，作为实现与扩展的唯一参照。

---

## 一、页面定位

全局样式规范页 = **项目主题（Theme）的定义与应用入口**。

它同时承担三种角色（对用户而言是一套逻辑）：

| 角色 | 说明 |
|------|------|
| **组件库的设计规范** | 团队约定的色彩、尺寸、字体、效果、动效 |
| **代码层全局变量** | 写入 `:root` 的 CSS 变量（`--td-*`、`--flow-*`） |
| **可引用的命名集合** | 字体 / 效果 / 动效预设 = 一组变量的打包名字 |

画板与组件库中的组件**消费**这里定义的主题，而不是在画板里再定义一套全局样式。

---

## 二、Bootstrap 与 TDesign 的定位

组件库项目要求**内容自洽**：规范页、设置页、画板、文档最终都应使用**自家组件 + 自家 token**。  
搭建初期存在 bootstrap 悖论——规范与 token 要先有界面才能定下来，而界面又依赖尚未存在的自家组件（「盖房子的砖，要等房子盖好才产」）。

**TDesign 在本项目中的角色是临时代工，不是组件库定义本身。**

| 角色 | 用途 | 何时弱化 |
|------|------|----------|
| **参考** | 30 个基础组件的形态、状态、语义色结构；Design Token 对齐 `--td-*` | 自家组件 API / 变体定稿后，TDesign 仅作对照 |
| **过渡** | 全局样式规范页左侧预览、设置 Tab 的可视反馈——在自家组件为 0 时仍能调主题 | 某组件自家实现 ready 后，预览从 `<t-*>` 换为自家组件 |

```
现在有的（自己的）                 暂时借的（TDesign）
──────────────────                 ──────────────────
styles-spec 定义层                  t-button / t-input …
--td-* / --flow-* 注入             读变量的临时预览消费者
30 组件设置清单                     形态 / 交互的参考样本
COMPONENT_SETTINGS_CATALOG          左侧示例实例
```

**自洽是渐进的，不是 Day 1 全换自家组件：**

1. **先定规范** — token、七大设置项、组件绑定关系（`styles-spec` 模块产出）。
2. **TDesign 当预览替身** — 让 `/styles` 在初期可运行、可验证变量闭环。
3. **按清单逐个替换** — 与 [COMPONENT_SETTINGS_CATALOG.md](./docs/COMPONENT_SETTINGS_CATALOG.md) 实现状态对齐；每组件 [API.md](../components/{name}/API.md) 声明全部样式变量；binding 与预览切到自家组件后，该条不再依赖 TDesign。

**心智模型：** TDesign 是施工脚手架；`styles-spec` 是图纸与建材厂。房子盖好后拆脚手架，图纸与 token 留下。

画板与导出组件**不**以 TDesign 为长期依赖；TDesign 主要占用全局样式规范页的**预览层**。详见 [PROJECT.md](../../../PROJECT.md) §一 Bootstrap 与 TDesign。

---

## 三、功能闭环（核心逻辑）

```
┌─────────────────────────────────────────────────────────────┐
│  ① 定义层 — 编辑全局变量与命名集合                            │
│     项目色板 · 尺寸尺度 · 字体格式 · 效果 · 动效              │
└──────────────────────────┬──────────────────────────────────┘
                           │ 注入 CSS 变量 / 预设 class
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  ② 约束层 — 色彩规则（视觉基线 + 组件用法 + 视错觉检测）          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  ③ 应用层 — 设置 = 组件主题绑定                               │
│     左侧：主题设置（选命名集合）                                │
│     右侧：基础组件在当前主题下的预览                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  ④ 产出 — 组件库组件呈现 = 规范页示例的样子                     │
│     画板新建组件默认遵守同一套主题变量                          │
└─────────────────────────────────────────────────────────────┘
```

**原则（保持简单）：**

- 样式代码层尽量只用**全局变量**。
- **设置项 = 组件实际使用的 CSS 变量**：用了才能设，没用不设；改变量则所有读该变量的形态（填充/描边/幽灵/文字按钮）一起生效。
- 「字体格式 / 效果 / 动效」Tab 做的是**命名集合**，不是第二套样式系统。
- 「设置」按**组件类型**绑定主题；左侧预览按组件分组，维度标题为颜色 / 效果 / 动效 / 字体等。
- 形态差异（描边、幽灵等）在组件内组合变量，**不**在设置里为每种形态单独开项。

---

## 四、Tab 功能框架

侧栏顺序即信息架构：

| 顺序 | Tab | 层级 | 职责 | 主要视图 / 模块 |
|------|-----|------|------|-----------------|
| 1 | **项目色板** | 定义 | 功能色阶、primary 倾向中性色；色彩 token 源头 | `ColorPaletteMatrix.vue` |
| 2 | **尺寸尺度** | 定义 | 间距、圆角、布局内边距 / 间距 / 区块间距 | `DimensionSpecPanel.vue` |
| 3 | **字体格式** | 定义 | 命名文本样式集合（CRUD） | `StylesView` + `StyleEditorPanel.vue` |
| 4 | **效果** | 定义 | 命名视觉样式集合（圆角、阴影、描边等） | 同上 |
| 5 | **动效** | 定义 | 命名过渡 / 动画集合 | 同上 |
| 6 | **色彩规则** | 约束 | 视觉 ΔLp 检测、组件用法、视错觉规则；传统 WCAG 仅参考 | `WcagContrastPanel.vue` |
| 7 | **CSS 变量** | 参考 | 变量登记清单、:root 当前值、筛选与跳转 | `CssVariableCatalogPanel.vue` |
| 8 | **设置** | 应用 | 右侧组件主题绑定 + 左侧按组件预览 | `UsageSpecSettingsPanel.vue` + `UsageSpecPanel.vue` |
| 9 | **Icon** | 参考 | TDesign 图标一览 | `StylesView` 内联 |

### 3.1 定义层 Tab（编辑 token / 预设）

- **项目色板**：改色 → 生成色阶 → `colorPaletteStore` → `applyDesignTokens` → `--td-*`
- **尺寸尺度**：改数值 → `designTokenStore` → `applyDesignTokens` → `--td-size-*` / `--td-radius-*` / `--flow-layout-*`
- **字体 / 效果 / 动效**：命名样式 → `stylePresetStore`；字体必备清单见 `fontPresetCatalog.ts`（展示、H1–H6、正文三档、辅助、链接/代码、控件等 26 项）

### 3.2 设置 Tab（组件主题绑定）

布局：**左示例矩阵 · 右单组件设置**

- 左侧：按组件列出全部形态（Button 为 5 语义 × 交互态/形态矩阵）；组件标题旁 **「编辑 »」** 唤起右侧设置。
- 右侧：仅显示**当前选中组件**的设置；未选时提示点击「编辑 »」或矩阵单元格。
- 点击矩阵某一格：选中该语义/态，右侧高亮对应颜色块（设置仍对该组件全体生效）。

#### 什么不需要绑定

| 来源 Tab | 说明 |
|----------|------|
| **项目色板** | 固定清单，只维护色值；组件绑定时**引用** `--td-*` 变量 |
| **字体格式** | 固定必备清单（`fontPresetCatalog`），只维护属性；组件绑定时**选用**命名样式 id |

#### 什么需要绑定（按组件类型，不按实例）

绑定字段必须能映射到**该组件已消费的全局 CSS 变量**。  
**完整设置项清单（七大类 × 30 组件）**见 **[`docs/COMPONENT_SETTINGS_CATALOG.md`](./docs/COMPONENT_SETTINGS_CATALOG.md)**。

每个组件类型一套规则，典型包括：

1. **语义颜色**（引用色板变量）
2. **圆角 / 边框 / 效果 / 动效**（组件级统一，覆盖所有形态）
3. **字体**（按尺寸；交互态可选）

描边钮、幽灵钮、文字钮等 **variant 不单独占设置区** — 它们读的是同一批变量，由组件内配方区分。

全组件适配性核对见 **[`docs/COMPONENT_THEME_ADAPTATION.md`](./docs/COMPONENT_THEME_ADAPTATION.md)**：方法论适用于所有消费 `--td-*` 的 TDesign 组件；差异用绑定档案（多语义 / 表单态 / 双态 / 容器 / 链接 / 极简）区分，而非每人五语义色。

#### 范本：Button

完整盘点（公共项 / 差异项 / 最少设置项）见 **[`docs/BUTTON_THEME_MODEL.md`](./docs/BUTTON_THEME_MODEL.md)**。

摘要：

| 分类 | 内容 | 是否进设置面板 |
|------|------|----------------|
| **按钮统一** | 圆角、边框宽、效果、动效、字体×尺寸 — **对 Button 全部形态/语义/交互生效** | ✅ 约 7 项 |
| **语义颜色** | 常规/成功/警告/危险/灰色 — 每种只绑主色（+衬色/浅底），**只有颜色** | ✅ 约 5×2 项 |
| **形态** | 填充/描边/虚线/幽灵 — 用配方消费语义色，**不能**与语义合并成「类型」 | ❌ 规则内置 |
| **交互态** | 悬浮/按下/聚焦 — 优先跟色板 `-hover/-active`，或按钮级 3 条全局规则 | ⚠️ 0～3 项 |
| **尺寸** | 大中小 — 字体预设 | ✅ 含在统一项 |

不按「某个页面上的某个按钮」配置，只配置 **Button 组件**；Input、Card 等后续同规格扩展。

#### 存储

- `componentThemeBindingStore` → `flow-panel:component-theme-bindings`
- 定义见 `componentThemeBindingDefs.ts`

### 3.3 色彩规则 Tab

系统色彩规则检测器（类似语法检查）：基线为 CIELAB 感知明度差 ΔLp + 组件库深浅字用法，并检测亮黄白字、互补振动等视错觉。W3C WCAG 2.x 对比度仅作参考对照，不作为 pass/fail 主判定。

---

## 五、数据与运行时

### 4.1 三类数据产出

| 类型 | 存储 | 运行时 |
|------|------|--------|
| **设计 token** | `designTokenStore` + 色板 `colorPaletteStore` | `applyDesignTokensToDocument()` → `#flow-panel-design-tokens` |
| **命名样式预设** | `stylePresetStore` | `applyStylePresetsToDocument()` → `.flow-style-*` |
| **主题应用选择** | `themeUsageStore` | 使用规范预览读取；后续供画板 / 组件库默认引用 |

### 4.2 关键文件索引

```
src/modules/styles-spec/
  index.ts                    # 模块入口
  bootstrap.ts                # initStylesSpecModule()
  publicApi.ts                # 对外 API（画板只从此导入）
  views/                      # 规范页 UI
  tokens/                     # 主题数据与 CSS 注入
```

### 4.3 初始化

```ts
import { initStylesSpecModule } from './modules/styles-spec'
initStylesSpecModule()
```

---

## 六、与其他分区的边界

| 分区 | 关系 |
|------|------|
| **组件库 `/library`** | 清单与文档；组件渲染应使用本页主题变量 |
| **组件画板 `/editor`** | 属性面板**引用**规范（token / 命名预设），不做全局定义 |
| **示例预览 `/preview`** | 真实指针交互；画板编辑态用 Tab 强制预览交互样式 |

```
全局样式规范（定义主题）
        ↓ 变量 + 命名集合
组件库基础组件（默认外观 = 使用规范预览）
        ↓
画板（实例编辑，可局部覆盖）
```

---

## 七、页面 UI 框架（结构）

```
StylesView
├── aside.styles__side          # 一级 Tab 导航
└── main.styles__main
    ├── header                  # 页标题 + 说明（使用规范略简）
    └── 内容区（按 activeTab）
        ├── ColorPaletteMatrix
        ├── DimensionSpecPanel
        ├── 命名样式列表 + StyleEditorPanel（字体/效果/动效）
        ├── WcagContrastPanel
        ├── UsageSpecPanel
        │   ├── aside             # UsageSpecSettingsPanel（主题设置）
        │   └── main              # 组件预览
        └── Icon 网格
```

**交互约定：**

- 字体 / 效果 / 动效 Tab：列表点击 → 右侧/浮层 `StyleEditorPanel` 编辑。
- 使用规范：无「新建样式」；只选已有命名集合。
- 全页主内容区背景为白色（`styles__main`）。

---

## 八、当前闭环状态与后续

| 能力 | 状态 |
|------|------|
| Tab 信息架构与页面壳 | ✅ |
| 色板 / 尺寸 / 命名样式 CRUD | ✅（持久化 localStorage） |
| 主题设置 + 使用规范预览 | ✅ |
| WCAG 计算器 | ✅ |
| 画板属性面板系统引用主题 | 🔶 部分 token 下拉，待按本框架收敛 |
| 项目级规范单文件导出 | ⬜ 后续（替代分散 localStorage） |
| 组件库组件自动读 themeUsage | ⬜ 后续 |

扩展时遵守 **§三原则**：不引入逐组件复杂绑定；新能力优先归为「新 token」或「新命名集合」。

---

## 九、相关文档

- CSS 变量清单页：`CssVariableCatalogPanel.vue` · 数据 `tokens/cssVariableCatalog.ts`
- 项目架构：[PROJECT.md](./PROJECT.md) §一 Bootstrap 与 TDesign
- CSS 变量体系：[docs/CSS_VARIABLE_SYSTEM.md](./docs/CSS_VARIABLE_SYSTEM.md)
- 组件 API 文档规范：[docs/COMPONENT_API_DOC_SPEC.md](./docs/COMPONENT_API_DOC_SPEC.md)
- AI 元提示词：[docs/AI_META_PROMPT.md](./docs/AI_META_PROMPT.md)
- 组件设置清单：[docs/COMPONENT_SETTINGS_CATALOG.md](./docs/COMPONENT_SETTINGS_CATALOG.md)
