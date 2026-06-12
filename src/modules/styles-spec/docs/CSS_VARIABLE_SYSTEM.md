# CSS 变量体系 — 对齐 TDesign

> 全局样式模块的变量命名、分层与注入规则。  
> 与 [COMPONENT_SETTINGS_CATALOG.md](./COMPONENT_SETTINGS_CATALOG.md) 七大设置项一一对应。

---

## 一、设计原则

```
┌─────────────────────────────────────────────────────────────┐
│  Layer A  --td-*          TDesign 官方 Design Token（名称不可改） │
│  Layer B  --flow-*        项目扩展（TDesign 未 token 化的能力）      │
│  Layer C  --flow-style-*  命名预设（字体 / 效果 / 动效打包）         │
└─────────────────────────────────────────────────────────────┘
         ↓ applyDesignTokens / applyStylePresets / 色板覆盖
      :root { … }
         ↓
   TDesign 组件 CSS 读 var(--td-*)
   项目组件 / 画板节点 可读 --flow-* 或 preset class
```

| 原则 | 说明 |
|------|------|
| **对齐 TDesign** | 凡 TDesign 已声明的 `--td-*`，项目只**覆盖值**，不改名 |
| **扩展用 `--flow-*`** | TDesign 未暴露的字体细项、动效、布局等放项目前缀 |
| **预设 = 变量 + class** | 命名样式同时写 `:root` 变量与 `.flow-style-{id}`，便于画板引用 |
| **组件绑定 = 指向** | 设置 Tab 不发明新变量名，只声明「Button 圆角 → `--td-radius-default`」 |

**注入入口（代码）：**

- `applyDesignTokens.ts` → Layer A + 部分 Layer B
- `colorPaletteOverrides` → Layer A 可选色槽
- `stylePresetStore` → Layer C
- `componentThemeBindingStore`（待接）→ 组件 scoped 映射，仍引用 Layer A/C

---

## 二、Layer A — `--td-*` 完整清单（对齐官方）

来源：`tdesign-vue-next/es/style/index.css` + [TDesign Design Token](https://github.com/Tencent/tdesign-common/tree/develop/style/web/theme)。

### 2.1 颜色

#### 语义色阶梯（每类 10 档）

| 前缀 | 变量示例 |
|------|----------|
| 品牌 | `--td-brand-color-1` … `--td-brand-color-10` |
| 成功 | `--td-success-color-1` … `-10` |
| 警告 | `--td-warning-color-1` … `-10` |
| 错误 | `--td-error-color-1` … `-10` |
| 中性灰 | `--td-gray-color-1` … `-14` |

#### 语义色快捷（组件最常用）

| 变量 | 用途 | 项目编辑入口 |
|------|------|--------------|
| `--td-brand-color` | 主色 | 色板 · 品牌主色 |
| `--td-brand-color-hover` / `-active` / `-focus` / `-light` / `-disabled` | 交互态 | 色板可选槽 / 由主色派生 |
| `--td-success-color` + hover/active/light/disabled | 成功语义 | 色板 |
| `--td-warning-color` + … | 警告 | 色板 |
| `--td-error-color` + … | 危险 / 错误 | 色板 |
| `--td-text-color-primary` / `-secondary` / `-placeholder` / `-disabled` / `-anti` / `-brand` / `-link` | 文字 | 色板 · 文字 / 品牌 |
| `--td-bg-color-page` / `-container` / `-container-hover` / `-component` / `-specialcomponent` 等 | 表面 | 色板 · 背景 |
| `--td-component-border` / `--td-component-stroke` | 边框色 | 色板 · 边框色 |
| `--td-border-level-1-color` / `-2-color` | 分隔层级 | 色板可选 |
| `--td-mask-active` / `-disabled` / `-background` | 遮罩 | 色板可选 |

#### 字体色（明暗模式内建）

`--td-font-white-1` … `-4`、`--td-font-gray-1` … `-4` — 一般通过 text/bg token 间接引用，少直接改。

### 2.2 圆角

| 变量 | 默认 | 项目 key |
|------|------|----------|
| `--td-radius-small` | 2px | `radiusSmall` |
| `--td-radius-default` | 3px | `radiusDefault` |
| `--td-radius-medium` | 6px | `radiusMedium` |
| `--td-radius-large` | 9px | `radiusLarge` |
| `--td-radius-extraLarge` | 12px | （待加 key） |
| `--td-radius-round` | 999px | Switch 轨道等 |
| `--td-radius-circle` | 50% | Avatar 圆形 |

### 2.3 尺寸

#### 基础间距尺

`--td-size-1` (2px) … `--td-size-16` (72px)

#### 组件高宽

`--td-comp-size-xxxs` … `--td-comp-size-xxxxxl` → 引用 `--td-size-*`

#### 内边距 / 外边距

| 系列 | 变量 |
|------|------|
| 水平 padding | `--td-comp-paddingLR-xxs` … `-xxl` |
| 垂直 padding | `--td-comp-paddingTB-xxs` … `-xxl` |
| margin | `--td-comp-margin-xxs` … `-xxxxl` |
| 浮层 padding | `--td-pop-padding-s` … `-xxl` |

**项目现状：** `designTokenState` 仅映射 `spacingUnit` → `--td-size-2/3/4/5`，`spacingMd/Lg` → 部分 comp 变量；**待补全** comp-size 全链与 size-1…16 的联动。

### 2.4 字体

| 变量 | 说明 | 项目 key |
|------|------|----------|
| `--td-font-family` / `-medium` | 字体族 | `fontFamily` |
| `--td-font-size-body-small/medium/large` | 正文字号 | `fontSizeBody` → medium |
| `--td-font-size-title-*` | 标题 | `fontSizeTitle` |
| `--td-font-size-headline-*` | 大标题 | `fontSizeHeadline` |
| `--td-line-height-*` | 行高 | 由字号派生写入 `--td-line-height-body-medium` 等 |
| `--td-font-body-medium` 等 | 复合 font 简写 | 由 family + size + weight 组装 |

TDesign 还有 link/mark/display 字号阶梯 — 项目字体格式 Tab 的命名预设可映射到对应 `--td-font-*`。

### 2.5 效果（阴影）

| 变量 | 用途 |
|------|------|
| `--td-shadow-1` | 轻阴影（表格 hover 等） |
| `--td-shadow-2` | 中阴影（Dropdown / Select 面板） |
| `--td-shadow-3` | 重阴影（Dialog / Drawer） |
| `--td-shadow-inset-*` | 内阴影 |
| `--td-table-shadow-color` | 表格 |

**边框：** TDesign **只有边框颜色 token**，线宽 / 线型在组件 CSS 里多为写死的 `1px solid`，**没有** `--td-border-width`。

### 2.6 交互态颜色

不单独建变量族 — 复用语义色的 `-hover` / `-active` / `-disabled` / `-light`。  
组件 CSS 在 `:hover` 规则里读这些变量（如 Button 读 `--td-brand-color-hover`）。

### 2.7 动效

**TDesign 官方 global theme 中没有** `--td-transition-*` / `--td-motion-*`。  
组件样式里多为硬编码，例如：

```css
transition: all 0.2s linear;
transition: color 0.2s cubic-bezier(0.38, 0, 0.24, 1);
```

因此动效**不能**仅靠改 `:root` 上现有的 `--td-*` 覆盖全库，见 §五。

---

## 三、Layer B — `--flow-*` 项目扩展

TDesign 未 token 化、但项目规范页需要的能力。

### 3.1 字体细项（已实现）

| 变量 | 对应 designToken key |
|------|----------------------|
| `--flow-font-weight-regular` / `-semibold` | fontWeightRegular / Semibold |
| `--flow-font-style` / `-variant` / `-stretch` | fontStyle / Variant / Stretch |
| `--flow-letter-spacing` / `-word-spacing` | letterSpacing / wordSpacing |
| `--flow-font-kerning` / `-feature-settings` / `-variation-settings` | … |
| `--flow-text-transform` / `-decoration-*` | 文本装饰 |
| `--flow-font-smooth` | fontSmooth |
| `--flow-line-height-body` / `-title` / `-headline` | 辅助行高（同步写入 `--td-line-height-*`） |

### 3.2 布局（已实现）

| 变量 | 用途 |
|------|------|
| `--flow-layout-padding` | 页面 / 区块 padding |
| `--flow-layout-gap` | 栅格 gap |
| `--flow-layout-section-gap` | 区块间距 |
| `--flow-sidebar-width` | 规范页侧栏（StylesView） |

### 3.3 动效（已声明，TDesign 未消费）

| 变量 | 默认 | 说明 |
|------|------|------|
| `--flow-motion-duration` | 150ms | 全局过渡时长 |
| `--flow-motion-delay` | 0ms | 延迟 |
| `--flow-motion-easing` | ease | 缓动 |
| `--flow-motion-property` | all | 过渡属性 |

**建议扩展（待实现）：**

```css
--flow-motion-duration-fast: 200ms;
--flow-motion-duration-medium: 300ms;
--flow-motion-easing-standard: cubic-bezier(0.38, 0, 0.24, 1);
--flow-motion-easing-linear: linear;
--flow-motion-transition-base: var(--flow-motion-property) var(--flow-motion-duration) var(--flow-motion-easing);
--flow-motion-transition-color: color var(--flow-motion-duration-fast) var(--flow-motion-easing-standard);
```

需配合 **Layer D 覆盖规则**（§5.2）才能让 TDesign 组件读到。

### 3.4 边框扩展（待实现）

TDesign 无边宽 token，项目可增：

| 变量 | 建议默认 |
|------|----------|
| `--flow-border-width-thin` | 1px |
| `--flow-border-width-medium` | 2px |
| `--flow-border-style-default` | solid |
| `--flow-border-default` | var(--flow-border-width-thin) var(--flow-border-style-default) var(--td-component-border) |

同样需 Layer D 或自定义组件 CSS 引用。

---

## 四、Layer C — 命名预设

| 类别 | class | 变量前缀 | 字段 |
|------|-------|----------|------|
| 字体格式 | `.flow-style-{id}` | `--flow-style-{id}-font-size` 等 | font-family, size, weight, … |
| 效果 | `.flow-style-{id}` | `--flow-style-{id}-box-shadow` 等 | border-radius, border-*, box-shadow, filter, opacity |
| 动效 | `.flow-style-{id}` | `--flow-style-{id}-transition-duration` 等 | transition-* |

预设 **不会自动** 应用到 TDesign 组件，除非：

1. 设置 Tab 把组件绑定到某 preset id，并注入 scoped 规则；或  
2. 画板节点显式挂 class / inline style。

---

## 五、七大设置项 → 变量映射

| 设置项 | 主要变量层 | TDesign 组件能否直接受益 |
|--------|------------|-------------------------|
| **圆角** | `--td-radius-*` | ✅ 凡组件 CSS 写了 `border-radius: var(--td-radius-*)` |
| **颜色** | `--td-*-color`、text、bg、border | ✅ 覆盖最全 |
| **尺寸** | `--td-comp-size-*`、`--td-comp-padding*` | ⚠️ 部分组件；项目待补全 size 链 |
| **字体格式** | `--td-font-*` + `--flow-font-*` + preset | ⚠️ 组件读 `--td-font-body-medium`；细项需 preset class |
| **交互态样式** | `--td-*-hover/active/disabled` | ✅ 改色板即可；动效过渡见下 |
| **效果** | `--td-shadow-*` + preset `box-shadow/filter` | ⚠️ 阴影仅部分组件引用 shadow token |
| **边框** | `--td-component-border`（色）+ `--flow-border-*`（宽/型） | ⚠️ 仅颜色可全局覆盖；宽/型需 Layer D |

---

## 六、只使用 CSS 变量，能否覆盖组件库全部样式？

### 短答

**不能 100%。**  
对 TDesign **开箱组件**而言，仅覆盖 `:root` 上的 CSS 变量，大约能覆盖 **视觉主题的 70%～85%**（颜色、圆角、字号、组件高度、部分阴影）。  
**效果（滤镜/复合边框）、动效（transition/animation）、形态配方（outline/ghost）** 有一部分**不在** TDesign 的变量体系里，需要额外 CSS 层。

### 分项结论

| 需求 | 只用 CSS 变量（:root） | 说明 |
|------|------------------------|------|
| 品牌 / 语义色 | ✅ 可以 | TDesign 设计核心，覆盖 `--td-brand-color` 等即可 |
| 明暗模式 | ✅ 可以 | 切换 `theme-mode` / `.dark`，同一套变量名 |
| 圆角 | ✅ 可以 | 改 `--td-radius-*` |
| 字号 / 字族 | ✅  mostly | 改 `--td-font-*`；OpenType 细项 TDesign 不读 |
| 组件尺寸 | ⚠️ 大部分 | 改 `--td-comp-size-*`、padding token |
| 阴影 | ⚠️ 部分 | 仅引用 `--td-shadow-*` 的组件会变（Popup、部分 Card） |
| 边框颜色 | ✅ 可以 | `--td-component-border` |
| 边框宽度 / 虚线 | ❌ 不够 | 组件 CSS 多写死 `1px solid` |
| hover 颜色 | ✅ 可以 | 改 `-hover` / `-active` 变量 |
| **过渡 duration / easing** | ❌ 不够 | TDesign 大量 `transition: 0.2s linear` 硬编码 |
| **keyframes 动画** | ❌ 不够 | Tree 展开、Loading 等用 `@keyframes`，变量无法单独改曲线 |
| **复杂动效** | ❌ 不够 | 需 JS（Statistic 数字滚动）或改组件 CSS |
| 形态变体 | ❌ 不适用 | filled / outline 是选择器配方，不是变量 |
| 组件 layout 结构 | ❌ 不适用 | 如 Button icon 间距、Table 列宽 — 非 token 范畴 |

### 实践上的覆盖模型

**Flow 自家组件** — 见 [STYLING_IMPLEMENTATION.md](./STYLING_IMPLEMENTATION.md)：

```
① CSS 变量   → 能变量化的全部写 --flow-{comp}-*
② 代码片段   → variant / 伪类 / keyframes / JS 动效；关键参数仍接 var 或 props
③ 行为 Props → 结构/逻辑，不进设置 Tab
```

**TDesign 过渡期：**

```
① :root 覆盖 --td-*          → TDesign 原生能读的全部生效（主路径）
② :root 覆盖 --flow-*        → 项目自定义组件 + 预设
③ 薄覆盖层 CSS（Layer D）     → 把硬编码 transition / border-width 改为 var(--flow-motion-*)
   或 ESM + less modifyVars   → 构建时改 @btn-height-default 等（非运行时）
④ 命名 preset class          → 效果 / 动效 / 字体打包，挂到节点或组件 binding
```

**TDesign 过渡期结论：**

- **定义层**改 `--td-*` / `--flow-*` → 凡读变量的 TDesign 组件一起变 ✅  
- **动效 Tab、效果 Tab** 的命名预设 → 变量 + class，**要作用于 TDesign 组件还需 binding 或 Layer D** ⚠️  
- **形态、结构、keyframes** → TDesign 侧不能单靠变量；Flow 组件用 **代码片段 + 可变参数** 解决 ✅  

---

## 七、与现有代码的对照

| 能力 | 变量层 | 状态 |
|------|--------|------|
| 色板 → `--td-brand-color` 等 | A | ✅ `applyDesignTokens` + 色板 |
| 尺寸 / 圆角 | A | ⚠️ 部分映射 |
| 字体主阶梯 | A | ✅ |
| 字体细项 | B | ✅ 写入 `--flow-*`，TDesign 不自动读 |
| 阴影 | A | ⚠️ 写死 shadow 值，未接 UI 选 level |
| 动效全局 | B | ⚠️ 已声明，TDesign 未读 |
| 命名预设 | C | ✅ class + `--flow-style-*` |
| 组件 binding 注入 | D | ⬜ Button store 未 apply |

---

## 八、推荐下一步（实现顺序）

1. **补全 Layer A 映射** — `spacing` → 完整 `--td-size-*` / `--td-comp-size-m` 链；阴影接 `cardShadowLevel` → `--td-shadow-{1|2|3}`  
2. **Layer D 动效覆盖** — 可选开关，注入 `.t-button, .t-input, … { transition: var(--flow-motion-transition-color); }`  
3. **组件 binding apply** — Button 语义色映射到 scoped 规则，避免误改全局 `--td-brand-color`  
4. **边框** — 定义 `--flow-border-*`，Layer D 或封装组件引用  

---

## 九、相关文档

- [COMPONENT_SETTINGS_CATALOG.md](./COMPONENT_SETTINGS_CATALOG.md) — 30 组件 × 七大项
- [STYLES_SPEC.md](../STYLES_SPEC.md) — Tab 闭环
- [TDesign 主题配置](https://github.com/Tencent/tdesign-common/blob/develop/docs/web/theme.md)
