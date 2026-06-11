# Flow Panel — 项目需求与架构规划

> 本文件是项目顶层设计文档，从架构出发做功能分区，再按分区做模块内聚。
> 当前阶段只规划第一批可实施的内容，不做过度设计。

---

## 一、项目定位

Flow Panel 是一个**可视化组件开发平台**（Visual Component Development Platform），核心能力是：

- **组件库**（Component Library）—— 需要做到常规项目中组件部分的任务，如组件的创建、注册、等
- **组件绘制面板**（Component Editor）—— 基于组件库做到可视化的单文件组件创建、编辑，可使用组件库中已有的组件进行组件嵌套，并导出可被项目直接使用的组件文件。

**画板根本目的：** 将组件创建中的大部分工作变成可视化交互，以此减少工作量。样式（template / 布局 / token）是载体；`**<script setup>` 中的逻辑才是组件文件的主体**。导出 `.vue` 后，协作者 / AI 可直接从文件理解结构与行为，无需反复口述界面细节。

其他功能（全局样式、文档编辑器、组件清单列表）是这两个核心分区的能力集成。  
在此基础上要具备全局样式定义（实现样式统一管理）、组件注册清单（实现组件一站式注册管理）、组件文档及文档编辑器（能够使用当前组件库中的组件进行自定义编写组件文档，一定程度上实现自洽）

---

## 二、框架策略

### 架构风格

**模块化单体（Modular Monolith）+ 经典分层（Classic Layering）**

- 单体应用（Monolith）：整个系统部署为一个单元，简化开发与运维
- 模块化（Modular）：按功能领域拆分为模块，模块间通过接口通信
- 经典分层（Layered）：每个模块内部按 View → Logic → Model 三层组织

### 两大根本功能分区

#### 分区一：组件库

**Component Library —— 负责“定义”**


| 职责维度        | 具体内容               |
| ----------- | ------------------ |
| **核心使命**    | 注册、描述、发现组件         |
| **管理范畴**    | 组件的元数据、参数约束、默认示例   |
| **产出的公共模块** | `model` — 组件数据模型   |
|             | `registry` — 组件注册表 |
|             | `docs` — 文档引擎      |


#### 分区二：组件绘制面板

**Component Editor —— 负责"使用"**


| 职责维度        | 具体内容                                     |
| ----------- | ---------------------------------------- |
| **核心使命**    | 可视化编辑组件实例                                |
| **核心能力**    | 画布渲染、属性面板、代码面板三视图联动；**组件样式 / 交互逻辑** 模式切换 |
| **产出的公共模块** | `editor` — 画布与结构编辑交互                     |
| ➥           | `simulation` — 模拟场景、交互逻辑、模拟/输出数据         |
| ➥           | `codegen` — 代码生成与解析                      |
| ➥           | `properties` — 属性控件                      |


### 2.3 分区关系

```
组件库
  │ - 提供全局样式的 css变量
  │ - 提供当前组件库存在的完成的组件
  ▼
绘制面板（创建用于编辑的默认组件单体文件）
  │ - 使用全局样式变量做到全局统一规范
  │ - 使用组件库中的组件完成组件嵌套
  │ - 画布修改以及属性面板的修改都同步至代码端
  ▼
保存导出完整组件单体文件到组件库
```

### 2.4 分层规则（每个模块内部）

- 依照vue 组件的文档规范，将组件文件在代码中分成三个区域
  - HTML
  - style
  - script

---

## 三、技术栈选型

### 开发环境


| 环境      | 版本                   | 状态                                          |
| ------- | -------------------- | ------------------------------------------- |
| Node.js | 22.19.0              | ✅ 已安装                                       |
| npm     | 10.9.3               | ✅ 已安装                                       |
| 开发服务器   | Vite 8，HMR 热更新       | ✅ 已验证可运行（`npm run dev` -> `localhost:5173`） |
| 类型检查    | vue-tsc 3            | ✅ 已验证可运行（`npx vue-tsc -b`）                  |
| 完整构建    | vue-tsc + vite build | ✅ 已验证可运行（`npm run build`）                   |


### 技术栈


| 层          | 选型                        | 状态  | 说明                                              |
| ---------- | ------------------------- | --- | ----------------------------------------------- |
| **语言**     | TypeScript 6              | ✅   | `tsconfig.json` 已配置，`vue-tsc` 类型检查通过            |
| **框架**     | Vue 3.5 + Composition API | ✅   | `<script setup lang="ts">`                      |
| **UI 组件库** | TDesign Vue Next 1.20     | ✅   | Button、Tabs、Select、t-layout 等，已在 App.vue 中使用    |
| **代码编辑器**  | Monaco Editor 0.55        | ✅   | CodeEditor.vue 已封装，代码面板可用                       |
| **Vue 编译** | `@vue/compiler-dom`       | ✅   | `sceneCodegen.ts` 中使用，`baseParse` 可运行           |
| **拖拽**     | Pointer Events API        | ✅   | `pointerDragSession.ts` 中封装，SpacingDragDemo 已验证 |
| **构建**     | Vite 8 + vue-tsc 3        | ✅   | 开发 HMR 正常，生产构建通过                                |
| **路由**     | vue-router 4              | ✅   | 4 个路由：components / inventory / styles / editor  |
| **样式**     | CSS3 + CSS Variables      | ✅   | `var(--td-*)` design tokens，已集成 TDesign 主题      |
| **持久化**    | localStorage              | ✅   | `useEditorScene` 中有 `localStorage` 存取逻辑         |


### 依赖清单（当前 package.json）

```json
"dependencies": {
  "vue": "^3.5.34",
  "tdesign-vue-next": "^1.20.0",
  "vue-router": "^4.6.4",
  "monaco-editor": "^0.55.1",
  "@monaco-editor/loader": "^1.7.0"
},
"devDependencies": {
  "typescript": "~6.0.2",
  "vite": "^8.0.12",
  "vue-tsc": "^3.2.8",
  "@vitejs/plugin-vue": "^6.0.6",
  "@vue/tsconfig": "^0.9.1",
  "@types/node": "^24.12.3"
}
```

## 架构定位：纯前端 SPA + 文件级持久化

当前项目是**纯前端 Web 应用**，没有后端服务器。

### 项目的产出是组件文件

这个项目的最终产物不是"一个编辑器"，而是一份份**Component Files（组件文件）**。

```
项目产出
  └── 组件文件（Component Files）
        ├── checkout-bar.vue      ← 一个组件 = 一个 .vue 文件
        ├── search-box.vue
        └── user-card.vue
```

一个组件文件就是一个标准的 Vue SFC（Single File Component），可以直接被其他 Vue 项目引用：

```vue
<template>
  <LayoutContainer layout="flex" flex-direction="column" :padding="[24,24,24,24]">
    <span>这是一行文本</span>
    <LayoutContainer layout="flex" :padding="16">
    </LayoutContainer>
  </LayoutContainer>
</template>
```

**关键理解：**

- 编辑器（绘制面板）是对接组件文件的工具，不是目的
- 代码面板直接显示组件文件的源代码
- 画布是组件文件的可视化渲染预览
- 属性面板是编辑组件文件参数的快捷方式
- 代码面板、画布、属性面板操作的是**同一份数据**（组件文件的源码），所以三者天然是双向绑定

### 组件初始化模板

新建组件时，生成的 `.vue` 文件内容遵循 Vue SFC（Single File Component）标准结构：

```vue
<template>

</template>

<script setup lang="ts">

</script>

<style scoped>

</style>
```

每个组件从这个空模板开始。画布解析模板渲染内容，代码面板显示源码，属性面板读取参数。用户加上内容后三者同步更新。

### 数据流

```
组件代码（Vue template 字符串 / JSON）
  ↕  parseCode / generateCode
内存中的组件模型（ContainerNode 树）
  ↕  localStorage
持久化存储
  ↕  文件导入/导出
外部交换（.json / .vue 文件）
```

所有数据在浏览器中操作：

- **编辑中** → 在内存（`shallowRef`），通过 revision 机制强制刷新
- **持久化** → `localStorage` 存 JSON 字符串
- **导出/导入** → `.json` 或 `.vue` 文件

不需要后端的原因：

- 组件描述本质上是**可序列化的 JSON**（layout、style、children 树）
- 组件代码是**文本字符串**，可以直接存文件
- 没有多用户协作需求时，localStorage + 文件导入导出完全够用

### 未来扩展方向

如果后续需要"多用户组件库"、"在线协作"、"组件市场"等功能，可以加一个轻量后端（如 Node.js + SQLite 或文件存储），架构演变为：

```
前端（当前纯前端 SPA）──API──→ 后端（可选）
                                    ├── 文件存储（组件定义）
                                    └── SQLite / 数据库（仅用于索引和搜索）
```

但第一阶段坚持纯前端。

## 架构分区矩阵

用横轴（前端/后端）和纵轴（组件库/绘制面板）做 2x2 矩阵划分，每个模块落在对应的格子里。

```
                    前端（浏览器）             后端（服务器/暂无）
                  ┌──────────────────────┬──────────────────────┐
                  │                      │                      │
   组件库         │  · 组件定义模型       │  · 组件存储 API      │
   Component     │  · 组件注册表 UI      │  · 组件搜索索引      │
   Library       │  · 示例页渲染         │  · 用户组件库        │
                  │  · 组件清单展示       │                      │
                  ├──────────────────────┼──────────────────────┤
                  │                      │                      │
   绘制面板       │  · 画布渲染           │  · 项目文件存储      │
   Component     │  · 属性面板           │  · 协作同步          │
   Editor        │  · 代码面板           │  · 历史版本管理      │
                  │  · LayoutContainer   │                      │
                  │  · ParamVisualizer   │                      │
                  └──────────────────────┴──────────────────────┘
```

### 当前状态（纯前端）

所有模块在左列（前端），右列（后端）为空。

```
                    前端                后端
                  ┌─────────────────┬────────────────┐
   组件库         │  组件定义模型    │                │
                  │  组件注册表 UI   │   （暂无）     │
                  │  示例页渲染      │                │
                  │  组件清单展示    │                │
                  ├─────────────────┤                │
   绘制面板       │  画布渲染        │                │
                  │  属性面板        │   （暂无）     │
                  │  代码面板        │                │
                  │  LayoutContainer│                │
                  │  ParamVisualizer│                │
                  └─────────────────┴────────────────┘
```

### 这个矩阵的作用

1. **看清模块归属** — 每个模块都能落到一个格子
2. **检验划分是否干净** — 如果一个模块跨格子，说明边界没划清，需要拆分
3. **指导扩展方向** — 右上角（后端+组件库）和右下角（后端+绘制面板）是后续加后端时的切入点

---

## 六、项目页面结构树

> **本树描述的是应用导航层级**（路由 / 顶栏 / 侧栏 Tab），不是画板里 DOM 元素的结构树（后者见 `EditorView` 左侧「结构」面板）。

### 6.1 什么该写进树里、什么不该写


| 写进结构树                          | 不写进结构树（改写在对应页面的「模式」说明）                     |
| ------------------------------ | ------------------------------------------ |
| 独立 **路由**（`vue-router` path）   | 同一 URL 内的 **浏览 / 编辑** 切换                   |
| 顶栏一级入口（组件库、组件画板）               | 组件画板的 **组件样式                               |
| 分区侧栏 **Tab**（文档 / 清单 / 全局样式）   | 文档示例未来的 **编辑模式**（仍是 `/library` + docs Tab） |
| 页内稳定的 **二级 Tab**（如全局样式下的色板、字体） | 弹窗、抽屉、Monaco 面板开关等 **UI 状态**               |


**结论（你问的两点）：**

- **组件示例文档的编辑模式** — **不用**在结构树里单独加「编辑页」节点；在「组件示例文档」下注明：`模式：浏览 | 编辑` 即可。
- **全局样式的编辑** — **同样不用**单独加「编辑页」；在「全局样式定义」下注明：`模式：浏览 | 编辑`，其子 Tab（色板 / 字体 / Icon / 样式）可保留在树里。

只有将来编辑态有 **独立路由**（例如 `/library/docs/:id/edit`）时，才在树里升格为子页面。

### 6.2 现行与规划结构（路由对齐 `main.ts`）

```
[无路由] 选择组件库目录（App.vue setup，localStorage 未配置时）
    ↓
App 壳 + 顶栏 Tab
├── /library  组件库（LibraryView）
│   ├── [Tab] 组件示例文档（DocsView）
│   │         模式：浏览 · 编辑（规划，页内切换）
│   ├── [Tab] 组件注册清单（InventoryView）
│   │         模式：浏览 · 编辑条目（规划，页内或行内）
│   └── [Tab] 全局样式定义（StylesView）
│             [子 Tab] 色板 · 字体 · Icon · 样式
│             模式：浏览 · 编辑 token（规划，页内切换）
│
└── /editor   组件画板（EditorView）
              模式：组件样式 · 交互逻辑（页内切换，非子路由）
              组件样式：结构树 | 画布 | 属性 | 代码（底栏可开关）
              交互逻辑：方法与绑定 | 画布 | Script（右侧常驻）
```


| 节点          | 路由 / 入口                 | 实现状态           |
| ----------- | ----------------------- | -------------- |
| 选择组件库       | 首次进入                    | ✅              |
| 组件库         | `/library`              | ✅              |
| 组件示例文档      | Library Tab `docs`      | 🔶 mock 列表     |
| 组件注册清单      | Library Tab `inventory` | ✅              |
| 全局样式        | Library Tab `styles`    | 🔶 只读展示        |
| 组件画板        | `/editor`               | ✅              |
| 组件样式 / 交互逻辑 | Editor 工具栏切换            | ✅ 样式 · 🔶 逻辑闭环 |


（规划）**项目主页**：顶栏目前无独立 home 路由，将来若增加 `/` 或 `/home` 再插入树顶。

---

以 Figma 交互模式为参照，按实施优先级排序。

- **优先级标注方式**
  - 格式：`[f/t][0-3][—]`
  - 第一个字符：`f` = 不需要（future），`t` = 需要（todo）
  - 第二个字符：`0` = 最高，`1` = 高，`2` = 中，`3` = 低
  - 第三个字符（可选）：`—` = 不会原样使用，需要重新设计，方案会写在符号后面
  - 示例：`t0-` = 需要 + 最高优先级 + 需要重新设计
- **完成状态标注方式**
  - `✅` = 已完成（功能闭环，可正常使用）
  - `🔶` = 部分完成（有 UI 或原型，未闭环 / 未同步代码）
  - `⬜` = 未开始
  - `—` = 不适用（优先级为 `f`，暂不实施）


| 分类                     | 动作             | Figma 操作          | 优先级                                               | 完成状态 | 说明                                                                         |
| ---------------------- | -------------- | ----------------- | ------------------------------------------------- | ---- | -------------------------------------------------------------------------- |
| 选择 Select              | 点击选中           | 点击元素              | t0                                                | ✅    | Overlay hitElement → emit('select')                                        |
| 选择 Select              | 取消选中           | 点击空白              | t0                                                | ✅    | emit('select', '')                                                         |
| 选择 Select              | Shift 多选       | Shift+点击          | t0                                                | ✅    | 累积选中列表                                                                     |
| 选择 Select              | 框选 (Marquee)   | 在空白拖拽出矩形          | t0-因为存在属性编辑，所以会有批量属性设置的情景                         | 🔶   | 多选选中 ✅；批量改属性 / 批量用手柄动作 ⬜（待交互能力齐备后做）                                        |
| 选择 Select              | 选中父容器          | 双击容器边缘            | t2-                                               | —    | 体验优化，暂不实施                                                                  |
| 选择 Select              | 穿透选中           | Ctrl+点击           | t2-                                               | —    | 体验优化，暂不实施                                                                  |
| 移动 Move                | 拖拽移动           | 点中元素拖拽            | t0-可更改元素在当前容器内的顺序，或者移动到其他容器，后续可以与框选多选一起联动         | ✅    | 同级排序 + 跨容器；**多选同父拖拽** ✅                                                    |
| 移动 Move                | 吸附对齐           | 拖拽时出现参考线          | f                                                 | —    | 拖拽中计算邻居 rect → SVG 参考线                                                     |
| 移动 Move                | 约束移动（水平/垂直）    | Shift+拖拽          | f                                                 | —    | 限制 dx/dy 轴                                                                 |
| 移动 Move                | 键盘微调           | 方向键               | f                                                 | —    | 方向键 → +1px / +10px                                                         |
| 移动 Move                | 吸附到网格          | 网格设置              | f                                                 | —    | 取整到 grid 步长                                                                |
| 缩放 Resize              | 8 方向缩放手柄       | 拖拽手柄              | t0-拖拽时自动识别为固定值设置，但是在拖动到父级容器边缘或者容器内附近时设置成填充容器或适应内容 | ✅    | `SelectionOverlay` 手柄 + `resizeLogic`；hug/fill/fixed + 固定值；**不**编辑 min/max |
| 缩放 Resize              | 极值阻挡视觉指引       | 拖动手柄时             | t0-                                               | ✅    | 淡紫 min / 淡绿 max 极值带 + clamp + 越过极值区判定；hug/fill 时光标下提示                      |
| 缩放 Resize              | 等比缩放           | Shift+拖拽          | f                                                 | —    | 保持宽高比                                                                      |
| 缩放 Resize              | 从中心缩放          | Alt+拖拽            | f                                                 | —    | 中心不动，两边扩展                                                                  |
| 缩放 Resize              | 最小尺寸约束         | 缩到不能再小            | t0-                                               | ✅    | `MIN_SIZE=40` + min/max clamp                                              |
| 旋转 Rotate              | 旋转手柄           | 选中框上方圆点           | f                                                 | —    | 额外 handle + CSS rotate                                                     |
| 旋转 Rotate              | 以 15° 步进       | Shift+旋转          | f                                                 | —    | 取整                                                                         |
| 旋转 Rotate              | 重置旋转           | 双击旋转手柄            | f                                                 | —    | 归零                                                                         |
| 排列 Arrange             | 上移一层           | Ctrl+]            | f                                                 | —    | 调整源码行顺序                                                                    |
| 排列 Arrange             | 下移一层           | Ctrl+[            | f                                                 | —    | 同上                                                                         |
| 排列 Arrange             | 置顶/置底          | Ctrl+Shift+] / [  | f                                                 | —    | 移到最前/最后                                                                    |
| 排列 Arrange             | 对齐（左/右/上/下/居中） | 对齐按钮              | f                                                 | —    | 计算多个元素 rect → 统一设置位置值                                                      |
| 排列 Arrange             | 等间距分布          | 分布按钮              | f                                                 | —    | 修改 columnGap/rowGap                                                        |
| 排列 Arrange             | 自动布局           | 添加 Auto Layout    | t1                                                | ✅    | 工具栏「自动布局」/ Ctrl+Shift+A；同级多选包裹 LayoutContainer                             |
| 文本 Text                | 双击编辑           | 双击文本              | t0                                                | ✅    | contentEditable → commitEdit                                               |
| 文本 Text                | 字体/字号/颜色       | 属性面板              | t1                                                | ✅    | span 面板：字号、颜色（写 style）                                                     |
| 文本 Text                | 文本对齐           | 属性面板              | t1                                                | ✅    | span 面板：text-align                                                         |
| 文本 Text                | 自动换行           | 宽度变化              | t1                                                | ✅    | 浏览器原生，无需实现                                                                 |
| 间距与布局 Spacing & Layout | 拖拽间距（gap）      | 选中容器后拖动间隙条        | t1                                                | ✅    | 子元素间绿色手柄 → column-gap / row-gap                                            |
| 间距与布局 Spacing & Layout | 拖拽内边距（padding） | 拖动容器边框内侧          | t1                                                | ✅    | 四边蓝色手柄 → padding（支持四边数组）                                                   |
| 间距与布局 Spacing & Layout | 切换排列方向         | 点击 ↕/↔            | t1                                                | ✅    | 属性面板行/列切换 flex-direction                                                   |
| 间距与布局 Spacing & Layout | 切换宽高模式         | 点击 Hug/Fill/Fixed | t1                                                | ✅    | 属性面板 hug/fill/fixed/minmax + 数值                                            |
| 间距与布局 Spacing & Layout | 圆角拖拽           | 拖动圆角手柄            | t1                                                | ✅    | 右下角绿色圆点手柄 → border-radius                                                  |
| 间距与布局 Spacing & Layout | 描边设置           | 属性面板              | t1                                                | ✅    | 统一/四向宽度 + 色/样式；圆角四角手柄                                                      |
| 编组 Group               | 编组             | Ctrl+G            | f-                                                | —    | 选中的多元素用 LayoutContainer 包裹                                                 |
| 编组 Group               | 取消编组           | Ctrl+Shift+G      | f-                                                | —    | 移除包裹的 LayoutContainer                                                      |
| 编组 Group               | 双击进入组          | 双击组               | f                                                 | —    | 限制选中范围到组内                                                                  |
| 组件 Component           | 创建组件           | Ctrl+Alt+K        | f-                                                | —    | 选中元素 → 注册为组件                                                               |
| 组件 Component           | 实例化组件          | 从组件面板拖入           | f-                                                | —    | 复制模板行                                                                      |
| 组件 Component           | 覆盖实例属性         | 修改实例              | f                                                 | —    | 修改 attr 但标记为 override                                                      |
| 组件 Component           | 同步主组件          | 更新主组件             | f                                                 | —    | 覆写主组件源码                                                                    |
| 历史 History             | 撤销             | Ctrl+Z            | t0                                                | ✅    | history 栈                                                                  |
| 历史 History             | 重做             | Ctrl+Shift+Z      | t0                                                | ✅    | history 栈                                                                  |
| 历史 History             | 历史面板           | 查看所有历史            | t0                                                | ✅    | 工具栏历史下拉，跳转 history[]                                                       |


### 八向手柄缩放（现行规格）

**模块：** `resizeLogic.ts` · `attrPatch.ts` · `SelectionOverlay.vue` · `EditorView.vue`

**分工：**

- 手柄只负责 **宽高模式（hug / fill / fixed）+ 固定像素值**；**不**通过手柄编辑 `min-width` / `max-width`。
- 极值存在时仅 **只读展示** 淡紫（min 侧）/ 淡绿（max 侧）区域，拖动预览 **clamp** 在合法区间内。
- 画布上独立编辑 min/max 仍为 **未决**（见「后续可能改动」）。

**拖动手柄判定：**


| 区间      | 判定        | 说明             |
| ------- | --------- | -------------- |
| 靠父级容器边缘 | **fill**  | 贴父级内容区边界       |
| 靠内部子内容  | **hug**   | 贴合 content 包围盒 |
| 中间      | **fixed** | 写入像素宽高         |


**极值冲突辅助：**

- `min >` 内容 hug 尺寸，或 `max <` 父级 fill 尺寸时，贴边/贴内容可能无法触发对应模式 → **拖过极值带** 可辅助判定 hug/fill。
- 判定为 hug/fill 时，**光标下方** 显示悬浮提示（含冲突说明）。

### 后续可能改动

> 以下条目尚未实施或仍待决；八向手柄与极值视觉指引已按上节落地。

#### 尺寸极值 — 独立画布编辑（未决）

- 属性面板可编辑 min/max；画布侧 **独立于八向手柄** 的 min/max 交互（参考线拖拽等）形式未定。


| 方向                 | 说明                                                           | 状态                                |
| ------------------ | ------------------------------------------------------------ | --------------------------------- |
| template 直系子元素禁止拖拽 | 父级容器为 `<template>` 的元素（源码树中 `parent === null` 的同级层）可能限制为不可拖拽 | **未决**                            |
| 属性面板联动极值高亮         | 编辑 min/max 时在画布高亮对应极值带                                       | **🔶** minmax 选中预览 + 输入框 focus 高亮 |
| 极值提示文案 L4 细分       | 多因冲突的更细粒度文案                                                  | **未决**                            |


#### 手柄贴边判定 fill — 已知问题

**现象：** 拖动手柄靠父级容器边缘时，应写入 **fill（填充容器）**，但**部分场景无法触发**或松手后未写回 `width-mode="fill"` / `height-mode="fill"`。

**可能涉及（待排查 / 待改进）：**


| 场景                             | 说明                                                                       |
| ------------------------------ | ------------------------------------------------------------------------ |
| 极值与 fill 冲突                    | `max` 小于父级可用尺寸时，贴父级边缘仍判不出 fill（规格有「越过极值带」辅助，实现可能未覆盖全部轴向/方向）              |
| flex 父级 `align-items: stretch` | 子项视觉已贴满，但 `clientWidth` / 边缘距离与判定阈值（`SNAP_PX`）不一致                        |
| 父级 padding / 嵌套容器              | 「贴边」参考的是 content box 还是 border box，与 `getContentSize` / 父级 `client`* 不一致 |
| span 手柄 commit                 | span 松手走 `detectResizeModesFull` + `buildResizePatch`（hug/fill/固定 style） |
| 仅改单轴                           | 角向 / 单边手柄拖动时，未受影响轴是否干扰 fill 判定                                           |


**状态：** **已知缺陷（部分改善）** — 根容器 fill 误判已修；父级 content box 参照已接入；贴边 hug/fill 与 `finalizeContainer` 冲突已修；flex stretch 等场景仍待验证。

---

## 八、编辑面板优化清单

> **性质：** 体验与 UI 增强，不改变核心数据模型。  
> 与 [FEATURES.md §十七](./FEATURES.md#十七编辑面板优化规划) 对照查阅。  
> **状态图例：** `✅` 已完成 · `🔶` 部分完成 · `⬜` 未开始

### 8.1 手柄样式与画布交互体验


| 状态  | 条目                         | 说明 / 模块                                               |
| --- | -------------------------- | ----------------------------------------------------- |
| ✅   | 边距手柄位于 padding 带中间         | `SelectionOverlay` · `computePaddingBands`            |
| ✅   | 悬浮手柄时用排线标识影响范围             | padding 蓝 / gap 品红 hatch                              |
| ✅   | 拖拽跟随气泡颜色区分                 | padding 蓝 · gap 品红 · 圆角 绿                             |
| ✅   | 无第二行时不出现行距手柄               | `layoutSpacingLogic` · 去掉单行 fallback                  |
| ✅   | 列间距手柄按行显示（每行相邻元素之间）        | `addColumnHandlesPerRow`                              |
| ✅   | 行间距手柄在容器水平居中（影响整行 row-gap） | `makeRowHandleBetweenRowGroups`                       |
| ✅   | 拖拽 gap 手柄沿轴跟随光标（列水平 / 行垂直） | `gapDragPreview` · `EditorView`                       |
| ✅   | grid 淡蓝线标 cell 位置与大小       | `computeGridCellOutlines`                             |
| ✅   | grid cell 排序胶囊手柄 + 复合输入框   | 悬浮网格带显示视觉胶囊；悬停胶囊展开拖柄+数值+尺寸模式下拉（hug/fill/fixed/minmax） |
| ✅   | 拖拽排序时兄弟元素可视化位移             | `EditorView` · placeholder + FLIP 占位流式重排              |
| ✅   | 下/右 padding 手柄双模式          | 可挤压时向内增大；达 min 后向外增大（顶-left 锚定）· 橙色 expand 标记         |


### 8.2 属性面板

**内容补全（规划）：**


| 状态  | 条目                                   | 说明                                                                 |
| --- | ------------------------------------ | ------------------------------------------------------------------ |
| ✅   | 位置坐标                                 | 浮动开关 + X/Y/层级（`position:absolute`）；grid 子项隐藏                       |
| ✅   | 布局方式（flex / grid / none）             | 模式切换 + 切 grid stamp 子项坐标 / 离开 grid clear                           |
| ✅   | grid 子项坐标                            | 属性面板列/行；span 写 style、LayoutContainer 写 `grid-column`/`grid-row` 属性 |
| ✅   | 布局尺寸与模式（hug / fill / fixed / minmax） | 面板 + 手柄共用 `sizeModeLogic` 清理冲突属性                                   |
| ✅   | 对齐单选矩阵（九宫格）                          | `justify-content` + `align-items`                                  |
| ✅   | 行间距、列间距                              | 固定值 + 面板输入 **auto**                                                |
| ✅   | 四向内边距 + 独立值切换                        | 统一 / 上右下左                                                          |
| ✅   | 裁剪内容（overflow 裁切）                    | `overflow="hidden"`                                                |
| ✅   | 背景色                                  | 外观区 + 取色器 + 文本输入（支持 token 字符串）                                     |
| ✅   | 圆角半径                                 | 统一 / 四角分离（`border-radius`）                                         |
| ✅   | 描边                                   | 宽/色/样式 + 统一/四向独立宽度（`border` 简写 vs style 四值）                        |
| ✅   | 效果（投影、阴影、模糊等 + token）                | 阴影预设 `--td-shadow-*` + 自定义简写；`filter: blur`                        |
| ✅   | 字体排印                                 | span 字体/字号 token、颜色 token、对齐、字重、斜体、装饰、行高、字间距                       |
| ✅   | 全局样式变量绑定                             | 背景/描边/文字/字号/字重/阴影等 `var(--td-*)` 下拉绑定                              |


**面板样式：**


| 状态  | 条目                   | 说明                                              |
| --- | -------------------- | ----------------------------------------------- |
| ✅   | 视觉分组展示区块             | `pp-section` 卡片式分组；布局/外观/文本/全部属性等               |
| ✅   | 一体式图标输入框 + 拖拽改值      | `ScrubInput`：图标区拖拽改值（Shift 10×）；布局/尺寸/描边/文本等数值项 |
| ⬜   | 字体属性挂载规则（继承 vs 选中节点） | —                                               |


### 8.3 代码面板交互体验（交互逻辑模式）

> **产品决策：** 交互逻辑模式采用 **范式 B — 逻辑块 + 锚点连线**（见 [§9.6](./PROJECT.md#96-绑定交互方式--范式-b逻辑块--锚点连线)）。  
> **设计沿革：** 逻辑块（managed block、块内编辑、块外只读）是代码面板 **最初设想的核心能力之一**，早期未写入文档、也未推进实现——因组件样式流程与测试不依赖该能力；交互逻辑模式启动后正式纳入路线。

> **交互范式：** 逻辑块编辑器参考 **macOS 快捷指令（Shortcuts）** — 纵向动作卡片堆叠、点击展开参数、底部「添加动作」、搜索式动作目录。锚点绑元素后续接在卡片「待绑定」行。

| 状态 | 条目 | 说明 |
| --- | --- | --- |
| 🔶 | 右侧 Script 三 Tab | **逻辑块**（默认）· **生命周期** · **源码**；互不混添 |
| 🔶 | 左栏逻辑表单 | API / 变量 / 方法 Tab + 模拟数据；`ComponentLogicModel` 持久化，尚未写回 script |
| 🔶 | **逻辑块** Tab | **快捷指令式**动作堆叠 + 搜索添加面板；生命周期分组在下方 |
| ⬜ | 块类型完整编辑 | 变量 · 方法 · 事件 handler · 生命周期 · watch · API codegen |
| ⬜ | 锚点 + 连线 | 块左上角锚点 → 画布元素（`data-el-i`） |
| ⬜ | 预览增强 | 交互逻辑画布可选中 / 高亮元素，作为连线落点 |
| ⬜ | 块 ↔ script codegen | `@flow:managed` 或结构化模型合并进 `<script setup>` |
| ⬜ | Tab 合并 | 功能完善后 **逻辑块 \| 源码** 合并为单一面板 |

组件样式模式底栏代码面板仍为 **整文件 template 编辑**，与逻辑块编辑器 **分离**。


---

## 九、组件画板 — 交互逻辑模式规格

> **画板根本目的：** 将组件创建中的大部分工作变成可视化交互，减少手写代码的工作量。样式（template / 布局 / token）是载体，`**<script setup>` 中的逻辑才是组件文件的主体**。  
> 交互逻辑模式负责 script 与行为；组件样式模式负责 template 与外观。逻辑内容的完整分类、侧边栏树结构、架构路线见 [§十](./PROJECT.md#十交互逻辑--script-内容结构与架构)。  
> 功能清单与实现状态见 [FEATURES.md §十三](./FEATURES.md#十三组件画板--交互逻辑模式)。

### 9.1 定位与切换


| 维度            | 说明                                                                                 |
| ------------- | ---------------------------------------------------------------------------------- |
| **与组件样式模式关系** | 同一 `.vue` 组件文件的两种画布模式，工具栏 **组件样式 | 交互逻辑**（`canvasMode: 'edit' | 'simulate'`，内部名保留） |
| **组件样式模式**    | 改结构：选中、拖拽、属性、代码（template）、增删元素                                                     |
| **交互逻辑模式**    | 改行为：props / emits / state / 方法 / 模板绑定 / 嵌套通信；画布验交互，**不改 DOM 结构**                   |


### 9.2 交互逻辑模式 — 画布硬性约束

交互逻辑模式画布**不得出现任何「结构 / 画布交互编辑」相关 UI 与操作**，包括但不限于：


| 禁止项                         | 说明                        |
| --------------------------- | ------------------------- |
| 选中框、八向手柄、gap/padding/圆角拖拽手柄 | 无 `SelectionOverlay` 等装饰层 |
| 框选、拖拽排序、跨容器移动               | 不改变 template 树            |
| 添加容器 / 文本、删除、复制粘贴、自动布局      | 工具栏结构编辑工具隐藏               |
| 结构属性面板                      | 右侧不展示 `PropsPanel`        |
| 结构编辑快捷键（Del、Ctrl+C/V、撤销重做等） | 避免误触改 template            |


**允许项：** 画布上渲染的**组件实例本身**保持可交互（点击、双击、输入、按钮等），由组件库组件或浏览器原生行为完成。

**代码面板：** 交互逻辑模式下 **右侧常驻 Script 代码面板**（Monaco），与左侧「方法与绑定」并列；侧重 `<script setup>`（props、emits、state、handler、managed 块）。组件样式模式仍为底部可开关代码面板（整文件 template 为主）。

### 9.3 交互逻辑模式 — 页面布局（当前）

**主工作流（范式 B）：** **添加逻辑块**（变量 / 方法 / 事件 / 生命周期…）→ **块内编辑** → **锚点连线到画布元素** → codegen 进 `<script setup>` + template 绑定。

```
┌─────────────────┬──────────────────────┬─────────────────┐
│ 方法与绑定（左）   │ 画布（中，结构只读）    │ Script（右，常驻） │
│ 规则 / 绑定原型   │ 实例可交互            │ Monaco · SFC     │
│ 模拟数据（Tab）   │                      │                 │
└─────────────────┴──────────────────────┴─────────────────┘
│ 工具栏：模式切换 · 导出 · 打开 …                              │
└──────────────────────────────────────────────────────────┘
```

| 区域 | 模块 | 说明 |
| --- | --- | --- |
| 左 280px | `SimulationSidePanel` | Tab：**方法与绑定**（默认）· 模拟数据 |
| 中 | 画布预览 | 与组件样式模式同一舞台；无结构编辑 overlay |
| 右 360px | `CodeEditor` → **逻辑块编辑器**（目标） | 常驻；块内编辑 + 锚点；当前过渡为整文件 Monaco |

侧边栏内容树规划见 [§10.4](./PROJECT.md#104-交互逻辑侧边栏内容树)。当前原型：

| 能力 | 说明 | 现状 |
| --- | --- | --- |
| **方法与绑定**（动作链原型） | 元素 + 触发 + 动作 | 🔶 `InteractionLogicPanel` |
| **模拟数据** | mock JSON | 🔶 未绑定预览 |
| **Script 常驻** | 右侧代码面板 | 🔶 整文件；script 分区 ⬜ |
| **组件 API / state / 嵌套通信** | 见 §十 | ⬜ |

### 9.4 数据与持久化（架构决策）

**不采用双轨存储。** 逻辑内容本身就是 `<script setup>` 的一部分；磁盘上只有标准 `.vue` 文件。

**路线：方案 C → 终态 A**


| 阶段            | 编辑器内                                              | 磁盘（`.vue`）                         |
| ------------- | ------------------------------------------------- | ---------------------------------- |
| **现状（过渡）**    | template 在 `componentCode`；部分逻辑场景在 `localStorage` | 导出时 mostly 只有 template + 空 script  |
| **方案 C（已拍板）** | 内存中维护结构化逻辑模型，与 script 双向同步                        | 保存 / 导出时 **合并写入** `<script setup>` |
| **终态 A**      | 可视化改逻辑 ↔ script 实时一致                              | 始终单一 `.vue`，项目可直接引用                |


```
componentCode（完整 Vue SFC 字符串，唯一真相源）
  ├── <template>   ← 组件样式模式主编辑
  ├── <script setup> ← 交互逻辑模式主编辑（可视化 + 代码面板 + managed 块）
  └── <style scoped> ← 按需
        ↕ 编译预览
   画布上的组件实例（交互逻辑模式：结构只读、实例可交互）
```

**动作链与代码片段（原则）：** 以可视化动作链为主，尽量覆盖常见场景；通过 **codegen 生成 handler / 绑定** + **managed 标记区**（仅动作链可改）+ **块外自定义 TypeScript**（escape hatch）。动作链绑定代码片段，生成值穿入 script 对应位置——详见 [§10.6](./PROJECT.md#106-动作链与代码生成)。

> **当前实现说明：** `simulationScenario`（`localStorage`）为过渡原型，后续应解析 / 合并进 `componentCode` 的 script，而非长期旁挂 JSON。

### 9.5 验收原则（交互逻辑模式）

1. 切换后用户**无法在画布上完成任何改结构操作**。
2. 组件实例**可正常交互**。
3. 侧边栏可编辑逻辑相关内容，并能在输出侧观测结果（流水 / emit / outputs）。
4. 切回组件样式模式后，template 与切换前一致（交互逻辑模式不写 template 结构）。
5. 保存 / 导出后，逻辑落在标准 `.vue` 的 `<script setup>` 内（方案 C 合并，终态 A）。

### 9.6 绑定交互方式 — 范式 B（逻辑块 + 锚点连线）

> **产品决策（已拍板）：** 采用 **范式 B**。Script 面板以 **逻辑块编辑器** 为主交互——这也是代码面板 **最初设计能力之一**（块内编辑、块外受限、锚点绑元素），此前因样式流程未依赖而未写进文档、未实现。  
> 范式 A（选中即绑定）保留为 [§9.6.2 备选参考](#962-范式-a--选中元素--编写即绑定未采用)，不作为主路线。  
> 底层能力层见 [§9.6.1](#961-逻辑能力层范式无关)；Figma 对照见 [§11.10](./PROJECT.md#1110-figma-对照讨论结论草案)。

#### 9.6.1 逻辑能力层（范式无关）

交互逻辑模式都要能创建 / 编辑并写回 script（+ template 绑定）：

| 能力 | Vue 对应 | 说明 |
| --- | --- | --- |
| **变量定义** | `ref` / `reactive` | 组件内部状态 |
| **计算属性** | `computed` | 派生状态 |
| **函数 / 方法** | `function` / 箭头函数 | 业务逻辑、可被动作链调用 |
| **事件处理** | handler + template `@event` | 用户操作入口 |
| **事件类型** | `click`、`change`、`input`、`focus`… | 对应 DOM / 组件 emit |
| **生命周期** | `onMounted`、`onUnmounted` 等 | 单文件组件 `<script setup>` 内；与路由无关 |
| **侦听器** | `watch` / `watchEffect` | 响应式副作用 |
| **对外 API** | `defineProps` / `defineEmits` | 组件契约 |
| **模板绑定** | `:prop`、`v-model` | 连到 `data-el-i` 节点 |
| **动作链** | codegen 展开为 handler 体 | 块内可视化覆盖常见分支 |

**语义模型（范式 B 主数据）：**

```
LogicBlock（id, kind, body, …）     ← 逻辑块编辑器中的「块」
    ↕ 可选 0..n
Binding（blockId, targetElIndex, eventType, attr …）   ← 锚点连线
    ↕ codegen
<script setup>  +  template  @click / :prop
```

**逻辑块类型（规划，见 `logicBlockCatalog.ts`）：**

| category | 说明 | 需 Binding |
| --- | --- | --- |
| `state` | ref / reactive / shallowRef … | 否 |
| `computed` | computed getter / 可写 | 否 |
| `watch` | watch / watchEffect / immediate / deep | 否 |
| `method` | function / async / 箭头函数 | 可选 |
| `dom-event` | **@click / @input / @keydown …**（40+ 种 DOM 事件） | **是** |
| `component-event` | 子组件 @event · v-model · v-model:arg | **是** |
| `template-binding` | :prop · :class · :style · v-bind | **是** |
| `timing` | 延迟 · 周期 · debounce · 条件分支 | 否 |
| `composable` | provide / inject / expose / templateRef … | 否 |
| **生命周期** | `onMounted` 等官方钩子 | 否；**独立时间轴**，非 catalog 块 |

#### 9.6.2 范式 A — 选中元素 → 编写即绑定（未采用，备选参考）

1. 选中画布元素 → 在 Script / 左栏为「当前元素」编写 → 即绑定。  
2. Script 需 **聚焦 / 显示全部** 切换，避免单一大输入框失去全局视图。

未采用原因：全局绑定关系仍不直观；与 **逻辑块 + 连线** 的最初代码面板设计不一致。

#### 9.6.3 范式 B — 交互路径（主路线）

1. Script 区 **外观像代码编辑器**，**不可任意自由编辑全文**。
2. **添加逻辑块**（左栏或 Script 区入口）：变量 / 方法 / handler / 生命周期 / watch …
3. **仅在块内部**编辑（managed 区域；Monaco 嵌入或结构化表单 + 片段）。
4. 需要绑到 DOM 时：块 **左上角锚点** 拖 **箭头** → 画布 **目标元素** → 选择 **事件类型**（或属性绑定）。
5. `Binding` 写入模型 → codegen：`@click="onBlockX"` 等。

**Script 面板分区：**

| 区域 | 行为 |
| --- | --- |
| **逻辑块列表** | 各块卡片/代码段；块内可编辑 |
| **块外** | 只读（generated 预览）或单一 **自定义扩展区** |
| **锚点** | 块左上角；拖线至画布 overlay |
| **（可选）显示全部** | 只读查看完整生成 script，非编辑入口 |

**画布预览增强（范式 B 必需）：**

- 可选中元素（`data-el-i`），**不改结构**
- 高亮当前连线目标 / 已绑定元素
- 接收锚点落点（overlay 层，非 SelectionOverlay 编辑手柄）

#### 9.6.4 与当前页面的关系

| 区域 | 当前 | 目标（范式 B） |
| --- | --- | --- |
| 左「逻辑」 | 规则表单原型 | **API / 变量 / 方法** 表单（L2a）；模拟 Tab；绑定后续 |
| 中画布 | 只读预览 | 可选中 + 高亮 + **连线落点** |
| 右 Script | **逻辑块** Tab + **源码** Tab | 源码保留整文件 Monaco；逻辑块 Tab 预留块列表；成熟后合并 |
| 过渡原型 | `simulationScenario` / `InteractionLogicPanel` | 并入 LogicBlock + Binding，最终淘汰 |

#### 9.6.5 实施顺序（范式 B）

| 阶段 | 内容 |
| --- | --- |
| **L1** | `LogicBlock` + `Binding` 模型；script / template codegen 骨架 |
| **L2a** | 左栏 **API / 变量 / 方法** 表单 UI + `ComponentLogicModel` 持久化（**不写回 script**）；右栏 **逻辑块 \| 源码** 双 Tab（源码 = 当前 Monaco） |
| **L2b** | 逻辑块 Tab：添加块、块内编辑、块外只读；锚点 UI 占位 |
| **L3** | 块类型：state · method · handler · lifecycle（最小集） |
| **L4** | 画布 **预览增强**：选中 / 高亮元素（无结构编辑） |
| **L5** | 块 **锚点 + 拖线** → 元素；持久化 Binding |
| **L6** | Binding → template `@event` / `:prop` 写回 |
| **L7** | 块内 **动作链**；只读「生成 script」视图；合并淘汰 `simulationScenario`；**逻辑块 Tab 与源码 Tab 合并为单一面板** |

当前右栏 **源码 Tab** 为可用过渡 UI；**逻辑块 Tab** 仅块列表占位，不作为终态。

---

## 十、交互逻辑 — script 内容结构与架构

> 本章定义：Vue 3 `<script setup>` 应覆盖哪些内容、交互逻辑侧边栏如何分树、与组件样式模式如何分工、以及 codegen 路线。  
> 与 [FEATURES.md §十八](./FEATURES.md#十八交互逻辑--script-内容树) 对照查阅。

### 10.1 画板分工


| 模式       | 本质       | 主要编辑对象                                                |
| -------- | -------- | ----------------------------------------------------- |
| **组件样式** | 结构 + 外观  | `<template>`、布局属性、Design Token、`<style>`              |
| **交互逻辑** | 行为 + 数据流 | `<script setup>`、模板绑定（`:prop` / `@event` / `v-model`） |


**协作价值：** 用户导出 `.vue` 后，AI / 协作者可通过 template + props 还原视觉结构，无需长篇口述，节省 token、提高效率。逻辑补齐后，还可通过 API 表与绑定关系理解行为。

### 10.2 Vue 3 script 部分完整清单

对照 Vue 3 官方 Composition API + `<script setup>` 文档，组件 script 中与「逻辑」相关的内容如下：


| 官方概念                 | 常见写法                                    | 画板归类    | 备注             |
| -------------------- | --------------------------------------- | ------- | -------------- |
| **依赖导入**             | `import` 组件 / composable / 工具           | 依赖与导入   | 嵌套库组件、复用逻辑     |
| **组件选项**             | `defineOptions({ name, inheritAttrs })` | 组件选项    | 与 attrs 透传相关   |
| **Props**            | `defineProps` / `withDefaults`          | 对外 API  |                |
| **Emits**            | `defineEmits`                           | 对外 API  | 声明与 handler 分离 |
| **v-model**          | `defineModel`（3.4+）或 prop+emit 组合       | 对外 API  | 双向绑定 API       |
| **Expose**           | `defineExpose`                          | 对外 API  | 父组件通过 ref 调子组件 |
| **Slots**            | `defineSlots` / `useSlots`              | 对外 API  | 插槽契约           |
| **响应式状态**            | `ref` / `reactive` / `shallowRef`       | 内部状态与派生 |                |
| **计算属性**             | `computed`                              | 内部状态与派生 | 与 ref 用途不同     |
| **只读派生**             | `readonly` / `toRef(s)`                 | 内部状态与派生 | 前期可不做          |
| **侦听器**              | `watch` / `watchEffect`                 | 副作用     | 响应式副作用         |
| **生命周期**             | `onMounted` / `onUnmounted` 等           | 副作用     | 初始化与清理         |
| **方法 / 函数**          | 普通函数、async 函数                           | 方法与函数   |                |
| **模板引用**             | `ref` 绑 DOM / 子组件、`useTemplateRef`      | 模板引用    | 聚焦、调子组件方法      |
| **Provide / Inject** | `provide` / `inject`                    | 嵌套与通信   | 跨层级            |
| **Attrs**            | `useAttrs()`、`inheritAttrs: false`      | 嵌套与通信   | 透传未声明属性        |


**跨 template 但属交互逻辑模式管理：**


| 概念            | 位置                              | 说明                     |
| ------------- | ------------------------------- | ---------------------- |
| 模板属性绑定        | `<template>` 的 `:prop`、`v-bind` | 常量 / state / prop → 视图 |
| 模板事件绑定        | `<template>` 的 `@click` 等       | 连到 handler 或动作链        |
| v-model 绑定    | 表单项、子组件                         | 双向数据流                  |
| TypeScript 类型 | props / emits 泛型、interface      | 可后期作为 API 子项           |


**画板目标范围外（P3 / 不做）：** SSR（`onServerPrefetch`）、复杂 TS 推断、自定义 directive 注册等。

### 10.3 概念拆分（避免树节点重复）


| 易混概念    | 拆分方式                                                     |
| ------- | -------------------------------------------------------- |
| **事件**  | **声明**（`defineEmits`）≠ **处理**（handler 函数 + template `@`） |
| **API** | **契约定义**（props / emits）≠ **模板绑定**（`:foo`、`@bar` 接到具体节点）  |
| **动作链** | 不是与「方法」并列的新语法，而是 **生成 / 编辑 handler 与 `@` 绑定的可视化入口**      |


### 10.4 交互逻辑侧边栏内容树

```
交互逻辑
│
├─ 📦 依赖与导入 [P2]
│   ├─ 组件导入（库组件、本地组件）
│   ├─ Composable 导入
│   └─ 工具 / 类型导入
│
├─ ⚙️ 组件选项 [P2]
│   ├─ 组件名 name
│   └─ inheritAttrs（是否自动透传 attrs）
│
├─ 🔌 对外 API [P0]
│   ├─ Props（名称 · 类型 · 默认值 · 必填）
│   ├─ Emits（事件名 · payload 类型/形状）
│   ├─ v-model（defineModel 或等价 prop+emit）[P1]
│   ├─ Expose（暴露给父 ref 的成员）[P2]
│   └─ Slots（具名 / 默认插槽定义）[P2]
│
├─ 📊 内部状态与派生 [P0]
│   ├─ 响应式变量 ref / reactive
│   ├─ 计算属性 computed [P1]
│   └─ （可选）只读 / toRefs [P3]
│
├─ 🔄 副作用 [P1]
│   ├─ 侦听器 watch / watchEffect
│   └─ 生命周期 onMounted / onUnmounted / …
│
├─ ƒ 方法与函数 [P0]
│   ├─ 事件处理函数（@click 等对应的 handler）
│   ├─ 业务方法（可被动作链调用）
│   └─ （可选）async / 工具函数 [P2]
│
├─ 🔗 模板绑定 [P0]          ← 动作链主战场
│   ├─ 属性绑定（:prop ← 常量 / state / prop）
│   ├─ 事件绑定（@event → handler / 动作链）
│   ├─ v-model 绑定（表单项、子组件）[P1]
│   └─ class / style 动态绑定 [P3]（样式模式可能已部分覆盖）
│
├─ 🌐 嵌套与通信 [P1]
│   ├─ 子组件 Props 传递 [P0 先做「库组件 + 常量 props」]
│   ├─ 子组件事件监听（@submit → 父 handler / emit）
│   ├─ 插槽使用与转发（默认 / 具名 / 作用域 slot）
│   ├─ Provide / Inject [P2]
│   └─ Attrs 透传（v-bind="$attrs" 等）[P2]
│
├─ 🧪 模拟与验证 [P1]
│   ├─ 模拟输入（mock props → 驱动预览）
│   └─ 输出观测（emit 流水 / outputs）
│
└─ 📝 Script 逻辑块编辑器 [P0]   ← 范式 B 主 UI
    ├─ 添加 / 删除逻辑块（state · method · handler · lifecycle …）
    ├─ 块内编辑（managed）
    ├─ 块锚点 → 画布元素连线
    ├─ 块内动作链
    ├─ 块外 custom 扩展区
    └─ 只读「生成 script」预览（可选）
```

**P0 / P1 / P2 / P3：** 实施优先级；P0 为交互逻辑闭环最小集。

**「库组件 + 常量 props」（P0 嵌套第一步）：**


| 术语           | 含义                                                                 |
| ------------ | ------------------------------------------------------------------ |
| **库组件**      | 「+ 组件」从组件库插入的已有组件（如 `TButton`），非手搭的 `LayoutContainer` / `span`     |
| **常量 props** | 固定属性值，如 `label="确定"`、`:disabled="true"`，尚未绑定 `state.xxx` 或父级 props |


### 10.5 与组件样式模式的边界


| 内容                            | 主要模式 | 说明                       |
| ----------------------------- | ---- | ------------------------ |
| template 结构、布局、静态样式           | 组件样式 | 已有                       |
| props / emits / state / 方法定义  | 交互逻辑 | script 主体                |
| `@click="fn"`、`:disabled="x"` | 交互逻辑 | 绑在 template 上，逻辑模式编辑     |
| `<script>` 全文                 | 交互逻辑 | 代码面板                     |
| mock 数据测预览                    | 交互逻辑 | 验证层；最终 props 定义仍在 script |


**结构树（左侧 DOM 层级）** 仅在组件样式模式显示；**逻辑树（§10.4）** 在交互逻辑模式显示——结构管 DOM，逻辑管 script 与绑定关系。

### 10.6 动作链与代码生成

**原则：** 以 **逻辑块编辑器（范式 B）** 为主 UI；块内可配 **动作链**；codegen 进 `<script setup>` + template 绑定。

**推荐实现路径（方案 C → A）：**

1. **LogicBlock 模型** — 块类型、块体、顺序；持久化在 structured model，合并进 script。
2. **块内编辑** — 每块 managed 区域；块外只读 + 可选 `custom` 扩展区。
3. **Binding + 锚点** — handler 块（等）通过连线绑 `data-el-i` + 事件类型。
4. **动作链** — 在 handler 块内展开为 TS 语句（设 state → emit → …）。
5. **managed 标记**（生成结果示例）：
  ```ts
   // @flow:managed:start block-onEl3Click
   function onEl3Click() { /* 块 + 动作链生成 */ }
   // @flow:managed:end
  ```
6. **不建议** — 全文自由编辑与块模型双向自动解析；块外仅 escape hatch。

动作链在树中的位置：**模板绑定 → 事件绑定 → [元素] → 动作链 → codegen → 方法与函数中的 handler**。

### 10.7 建议实施顺序

绑定 UX（范式 B，L1–L7）见 [§9.6.5](./PROJECT.md#965-实施顺序范式-b)。

| 阶段 | 内容 |
| --- | --- |
| **1** | Script 模型 + 与 `.vue` 合并保存（方案 C 骨架） |
| **2** | 组件 API 面板（props / emits → `defineProps` / `defineEmits`） |
| **3** | 动作链升级（callMethod / emit / 改 state → script + template `@`） |
| **4** | 模拟输入 → 预览 props 绑定（验证闭环） |
| **5** | 库组件 + 常量 props |
| **6** | 嵌套 emit / 透传 / provide |
| **7** | 片段库 + managed 标记区（扩大可视化覆盖率） |


### 10.8 交互逻辑能力清单（Vue / Flow Panel）

> **本清单描述 Flow Panel 要在 `.vue` 里可视化覆盖的能力**（见 [§十九 FEATURES](./FEATURES.md#十九交互逻辑能力清单) 跟踪进度）。  
> **Figma 侧组件 + 原型交互的完整参考**见 [§十一](./PROJECT.md#十一figma-组件交互参考清单)。  
> [§七](./PROJECT.md#七元素交互动作清单) 则是 **画板编辑手势**（选中、拖拽、缩放），属于组件样式模式，与下面两份清单都不同。

**图例：** `⬜` 未做 · `🔶` 原型 / 部分 · `✅` 闭环 · `—` 明确不做 / P3 延后

#### A. 基础设施（方案 C → A）


| #   | 能力项                                      | 可视化 | 写回 script | 状态     |
| --- | ---------------------------------------- | --- | --------- | ------ |
| A1  | `componentCode` 解析出 script 结构化模型         | —   | 读         | ⬜      |
| A2  | 结构化模型合并写回 `<script setup>`（保存 / 导出）      | —   | 写         | ⬜      |
| A3  | 交互逻辑模式 Script 代码面板（Monaco）               | 编辑  | 双向        | ⬜      |
| A4  | managed 标记区（动作链生成块 vs 自定义块）              | 分区  | 写         | ⬜      |
| A5  | 废除 `simulationScenario` 长期双轨，逻辑并入 script | —   | —         | 🔶 过渡中 |


#### B. 对外 API（组件契约）


| #   | 能力项                                  | 可视化  | codegen 目标                     | 状态  |
| --- | ------------------------------------ | ---- | ------------------------------ | --- |
| B1  | Props：增删改（名 / 类型 / 默认值 / 必填）         | 表单   | `defineProps` / `withDefaults` | ⬜   |
| B2  | Emits：增删改（事件名 / payload 说明）          | 表单   | `defineEmits`                  | ⬜   |
| B3  | v-model：`defineModel` 或 prop+emit 组合 | 表单   | `defineModel` 或等价              | ⬜   |
| B4  | Expose：暴露方法 / 属性给父 ref               | 列表   | `defineExpose`                 | ⬜   |
| B5  | Slots：默认 / 具名插槽声明                    | 列表   | `defineSlots`                  | ⬜   |
| B6  | Props / Emits TypeScript 类型          | 可选表单 | 泛型 / interface                 | ⬜   |


#### C. 内部状态与副作用


| #   | 能力项                           | 可视化           | codegen 目标               | 状态  |
| --- | ----------------------------- | ------------- | ------------------------ | --- |
| C1  | 响应式变量 `ref` / `reactive` CRUD | 列表 + 初值       | `const x = ref(...)`     | ⬜   |
| C2  | 计算属性 `computed`               | 依赖 + 表达式 / 片段 | `computed(() => …)`      | ⬜   |
| C3  | 侦听器 `watch` / `watchEffect`   | 源 + 回调 / 片段   | `watch(...)`             | ⬜   |
| C4  | 生命周期 `onMounted` 等            | 选钩子 + 片段      | `onMounted(...)`         | ⬜   |
| C5  | 模板引用（DOM / 子组件 ref）           | 选元素 + 名       | `ref` / `useTemplateRef` | ⬜   |


#### D. 方法与动作链


| #   | 能力项                   | 可视化         | codegen 目标           | 状态                         |
| --- | --------------------- | ----------- | -------------------- | -------------------------- |
| D1  | 方法 / 函数：命名 + 参数 + 体   | 表单 + Monaco | `function fn() {}`   | ⬜                          |
| D2  | 动作链：触发（元素 + 事件类型）     | 规则 UI       | handler + `@`        | 🔶 仅 click/dblclick + 3 动作 |
| D3  | 动作：修改 state           | 链节点         | 赋值语句                 | ⬜                          |
| D4  | 动作：调用 method          | 链节点         | `fn(...)`            | ⬜                          |
| D5  | 动作：emit 事件            | 链节点         | `emit('x', payload)` | ⬜                          |
| D6  | 动作：条件分支               | 链节点         | `if / else`          | ⬜                          |
| D7  | 代码片段库 + 参数槽           | 选片段填槽       | 展开 TS                | ⬜                          |
| D8  | 链 → managed 块；块外手写 TS | 分区          | `@flow:managed`      | ⬜                          |


#### E. 模板绑定（连接 template ↔ script）


| #   | 能力项                     | 可视化      | 写回位置                | 状态                  |
| --- | ----------------------- | -------- | ------------------- | ------------------- |
| E1  | 属性绑定：常量 → 子节点 / 元素      | 选节点 + 键值 | template `:prop`    | 🔶 样式模式有部分静态属性      |
| E2  | 属性绑定：state / prop → 节点  | 选源 + 目标  | template `:prop`    | ⬜                   |
| E3  | 事件绑定：节点 → handler / 动作链 | 选节点 + 事件 | template `@event`   | 🔶 规则引擎未写回 template |
| E4  | v-model：表单项 / 子组件       | 选节点      | `v-model`           | ⬜                   |
| E5  | 动态 class / style（逻辑侧）   | 表达式      | `:class` / `:style` | — P3，样式模式已管大部分      |


#### F. 嵌套与通信


| #   | 能力项                                        | 可视化        | codegen 目标           | 状态             |
| --- | ------------------------------------------ | ---------- | -------------------- | -------------- |
| F1  | 库组件 + **常量** props（如 `label="确定"`）         | 选插入组件 + 表单 | template 属性          | 🔶 插入有，逻辑面板未单列 |
| F2  | 库组件 + **动态** props（绑 state / 父 prop）       | 选源         | `:prop="x"`          | ⬜              |
| F3  | 监听子组件 emit → 父 handler / 再 emit            | 选子事件 + 动作  | `@evt` + handler     | ⬜              |
| F4  | 插槽内容 / 插槽转发                                | 树 + 内容     | `<slot>` / `#name`   | ⬜              |
| F5  | Provide / Inject                           | 键值对        | `provide` / `inject` | ⬜              |
| F6  | Attrs 透传（`inheritAttrs`、`v-bind="$attrs"`） | 开关 + 目标    | template + options   | ⬜              |


#### G. 模拟与验证（开发期，非第二真相源）


| #   | 能力项                | 说明             | 状态             |
| --- | ------------------ | -------------- | -------------- |
| G1  | 模拟输入 → 预览 props 注入 | mock JSON 驱动画布 | 🔶 JSON 有，未绑预览 |
| G2  | emit / 回调结构化采集     | 组件输出面板         | ⬜              |
| G3  | 动作链 / handler 画布实测 | 点击触发 + 观测输出    | 🔶 规则引擎        |
| G4  | 多场景（多套 mock + 规则）  | 验分支            | ⬜              |


#### H. 依赖与选项（P2）


| #   | 能力项                                | 状态  |
| --- | ---------------------------------- | --- |
| H1  | import 组件 / composable / 工具        | ⬜   |
| H2  | `defineOptions`（name、inheritAttrs） | ⬜   |


#### 与 Figma 概念对照（摘要）


| Figma（详见 §11）               | Flow Panel 应对方式                         |
| --------------------------- | --------------------------------------- |
| Navigate to frame           | 单组件 SFC 内通常不建模；→ emit / 路由由父级处理         |
| Open / Close / Swap overlay | state 显隐 + 条件渲染 / 对话框组件                 |
| Change to（变体）               | props / state → variant 或 class         |
| Set variable                | 组件内 **state / prop**（非 Design Token 面板） |
| 组件属性 Boolean / Text / Swap  | → props、slot、子组件替换                      |
| After delay / 鼠标触发器         | handler / 动作链 + `@event`                |


**维护：** Vue 侧进度 → [FEATURES.md §十九](./FEATURES.md#十九交互逻辑能力清单)。

---

## 十一、Figma 组件交互参考清单

> **用途：** 罗列 Figma Design 中与 **组件（Component）** 相关的交互能力，供 Flow Panel 对照、取舍、映射到 Vue。  
> **背景：** Figma 的首要目的是 **画 UI 样式**（比例、数值、视觉），组件是为 **高复用** 在作图流程中演化出的能力；与组件化开发思想契合，但相对真实代码是 **简化过的**——落地到 `.vue` 时会有不少差异，仍有许多可取之处。  
> **来源：** [Figma Help Center — Components](https://help.figma.com/hc/en-us/articles/5579474826519-Explore-component-properties)、[Interactive components](https://help.figma.com/hc/en-us/articles/360061175334-Create-interactive-components-with-variants)、[Prototype triggers](https://help.figma.com/hc/en-us/articles/360040035834-Prototype-triggers)、[Prototype actions](https://help.figma.com/hc/en-us/articles/360040035874-Prototype-actions)、[Multiple actions and conditionals](https://help.figma.com/hc/en-us/articles/15253220891799-Multiple-actions-and-conditionals)（截至 2025）。  
> **说明：** 本节是 **参考清单**，不是 Flow Panel 要实现的功能列表；实现映射见 [§10.8](./PROJECT.md#108-交互逻辑能力清单vue--flow-panel)。  
> **表格列：** 最右列 **Flow 取舍** 留空，供自行标注是否借鉴、如何映射、为何与 Figma 不同等。

### 11.1 三份「交互」清单的关系


| 文档章节        | 范围                             | 例子                                | Flow 取舍 |
| ----------- | ------------------------------ | --------------------------------- | ------- |
| **§七**      | 画板 **编辑手势**（像 Figma 设计工具操作）    | 选中、拖拽、八向缩放                        |         |
| **§十一（本章）** | Figma **组件 + 原型** 能力           | Change to、Boolean 属性、Open overlay |         |
| **§10.8**   | Flow Panel **Vue 逻辑** 要可视化覆盖的项 | defineProps、动作链、emit              |         |


### 11.2 组件结构与属性（Component anatomy）

#### 11.2.1 组件基础


| #   | 能力                     | 说明              | Flow 取舍                                                                                                                                                   |
| --- | ---------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | Main component（主组件）    | 组件定义源，改主组件同步到实例 | 在项目中其实应该是组件引入、实例化、重新实例化的过程，所以应该不用做                                                                                                                        |
| C2  | Component instance（实例） | 放置在设计稿中的组件副本    | 对应我们项目中导出的 vue 组件文件                                                                                                                                       |
| C3  | Component set（组件集）     | 多变体组成的集合        | 类似于 HTML 中 input 的 type 属性，写 text 就是文本输入框写 button 就是表单按钮，而且组件库代码中一些情况比 figma 的组件变体复杂，比如 icon 是用的 icon 名称编码，还有其他的情况也都没有变体就实现了，在组件库项目中变体被稀释了，没有 figma 中那么聚合 |
| C4  | Detach instance        | 实例脱离组件定义        | 这个在组件库项目中应该不允许，虽然很麻烦，也能做到，但是一般都不做，因为破坏了规范                                                                                                                 |
| C5  | Reset all changes      | 实例恢复为与主组件一致     | 这个是一个 figma 暴露的问题，figma 是图像编辑界面，和我们项目不一样，我们项目基于框架基于代码逻辑，这个功能在我们项目中是自然就有的，不用特意去做                                                                           |
| C6  | Go to main component   | 从实例跳转到主组件编辑     | 这个是可以有的，会有嵌套组件时需要修改的情景                                                                                                                                    |


#### 11.2.2 组件属性类型（Component properties）

可在主组件 / 变体上定义，并在右侧 Properties 面板暴露给实例使用者：


| #   | 属性类型              | 作用                        | 典型用途                            | Flow 取舍                                                                                                                                  |
| --- | ----------------- | ------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | **Variant**       | 在同一 component set 内切换变体维度 | 尺寸、状态、颜色方案（Primary / Secondary） |                                                                                                                                          |
| P2  | **Boolean**       | true/false，通常控制图层显隐       | 按钮是否显示图标、是否显示徽章                 | 这个要有，但是我们需求应该更丰富，不像 figma 这么单一                                                                                                           |
| P3  | **Text**          | 可编辑文本字符串                  | 按钮文案、标题、占位符                     |                                                                                                                                          |
| P4  | **Instance swap** | 替换嵌套的子组件实例                | 换图标、换头像、换 trailing 控件           |                                                                                                                                          |
| P5  | **Slot**          | 可放置、编辑、重排内容的灵活区域          | 卡片内容区、列表项自定义区                   | 在 figma 中 slot 是一个容器类型，slot 中的元素是重复的或者是重复一个组件集合的 在我们的项目中是不一样的，slot 在 vue 的文档中是一个直接传值的暴露接口，可以传文本甚至可以传一个布局 在项目中figma 体现的这个功能是根据代码逻辑遍历数据库来的 |


#### 11.2.3 嵌套与暴露


| #   | 能力                                   | 说明                           | Flow 取舍                 |
| --- | ------------------------------------ | ---------------------------- | ----------------------- |
| N1  | Nested instances（嵌套实例）               | 主组件内包含其他组件的 instance         | 我们现在就有，只是嵌套后的很多工作都没做，   |
| N2  | **Expose nested instances**          | 把嵌套实例的属性提升到父实例 Properties 面板 | 应该就是我之前提到的透传            |
| N3  | Preferred values（Instance swap）      | 为 swap 属性指定推荐替换项列表           | 在 figma应该是绑定一个可用的组件集合吧， |
| N4  | Layer overrides                      | 实例上对填充、描边、文本等局部覆写            | 这个没想起来是什么               |
| N5  | Preserve overrides on variant change | 切换变体时尽量保留实例覆写（如图标 swap、文案）   | 这个也是                    |


#### 11.2.4 变体（Variants）


| #   | 能力                 | 说明                                     | Flow 取舍 |
| --- | ------------------ | -------------------------------------- | ------- |
| V1  | Variant properties | 变体维度命名（如 State=Default/Hover/Disabled） |         |
| V2  | Combine variants   | 多维度组合（Size × State × Type）             |         |
| V3  | Variant ↔ 图层结构     | 不同变体可不同图层结构（不仅是样式差）                    |         |


### 11.3 交互式组件（Interactive components）

> 在 **component set 内部** 为变体之间添加原型连接；实例拖入画布后 **自带** 这些交互，无需每屏手工连线。
>
> 感觉上是需要的，但说明很笼统，我脑子里没画面儿


| #   | 能力                                   | 说明                                                | Flow 取舍 |
| --- | ------------------------------------ | ------------------------------------------------- | ------- |
| I1  | Variant interactions                 | 仅在 **同一 component set** 的变体之间建立交互                 |         |
| I2  | Interactions vs Variant interactions | 原型侧栏分两块：普通帧间交互 vs 组件内变体交互                         |         |
| I3  | **Change to**（核心动作）                  | 触发后切换到 component set 内的 **另一变体**                  |         |
| I4  | 实例继承交互                               | 复制 instance 即复制已配置的变体交互                           |         |
| I5  | Nested instance + Change to          | 可对 **嵌套 instance** 使用 Change to，从而切换 **父级** 变体    |         |
| I6  | State memorization                   | 跨 Frame 导航时 **记住** 组件当前变体状态                       |         |
| I7  | Reset component state                | 进入新 Frame 时可 **重置** 组件变体到默认                       |         |
| I8  | 与 Variables 结合                       | 变量绑定到 component property，用 Set variable 驱动变体 / 属性 |         |


**限制（官方现状）：**


| #   | 限制                                                 | 常见变通                       | Flow 取舍 |
| --- | -------------------------------------------------- | -------------------------- | ------- |
| L1  | 原型 **不能** 直接用动作改 Boolean / Text / Instance swap 属性 | 做成变体，或用 Variables + 绑定     |         |
| L2  | Change to **仅** 适用于 component set 内变体              | 非变体状态需额外变体或变量方案            |         |
| L3  | Boolean 转变体会导致变体数量膨胀                               | 优先 Boolean 属性 + 变量，或控制变体维度 |         |


### 11.4 原型触发器（Prototype triggers）

单个 hotspot 可配置触发器；同一对象可有 **多个交互**，各用不同触发器。

> 一个个输入麻烦，我就在这里统一说了，原型触发器部分对应的是 web 中的交互事件，这些都是我们项目需要做的，也是可视化交互中的一部分，要做的是事件逻辑，然后指定是什么事件，之后绑定到一个元素上。


| #   | 触发器                          | 说明                              | Flow 取舍 |
| --- | ---------------------------- | ------------------------------- | ------- |
| T1  | **On click / On tap**        | 单击（桌面）/ 轻触（移动端）                 |         |
| T2  | **While hovering**           | 悬停期间（tooltip、hover 态）           |         |
| T3  | **While pressing**           | 按下并保持；松开回退（适合临时态 / overlay）     |         |
| T4  | **Mouse enter**              | 指针进入 hotspot                    |         |
| T5  | **Mouse leave**              | 指针离开 hotspot                    |         |
| T6  | **Mouse down / Touch press** | 按下瞬间                            |         |
| T7  | **Mouse up / Touch release** | 释放瞬间（常与 down 配对做菜单）             |         |
| T8  | **After delay**              | 延迟后自动触发                         |         |
| T9  | **When video ends**          | 视频播放结束（视频填充对象）                  |         |
| T10 | **When key/gamepad pressed** | 键盘 / 手柄（Prototyping 高级输入，视计划而定） |         |


### 11.5 原型动作（Prototype actions）

> 没察觉出来和我们项目中功能的对应关系


| #   | 动作                                  | 说明                                      | 与组件关系                        | Flow 取舍 |
| --- | ----------------------------------- | --------------------------------------- | ---------------------------- | ------- |
| A1  | **Navigate to**                     | 跳转到另一 Frame（整屏导航）                       | 常用；非组件独有                     |         |
| A2  | **Back**                            | 返回上一屏                                   | 原型历史栈                        |         |
| A3  | **Scroll to**                       | 滚动到 Frame 内某对象（锚点、轮播）                   | 可指向组件内子层                     |         |
| A4  | **Open overlay**                    | 在当前屏 **之上** 打开 Frame（模态、菜单、tooltip）     | 常从按钮 instance 触发             |         |
| A5  | **Close overlay**                   | 关闭当前 overlay                            | dismiss 模态                   |         |
| A6  | **Swap overlay**                    | 用一个 overlay Frame **替换** 当前 overlay     | 保留 overlay 设置                |         |
| A7  | **Open link**                       | 打开外部 URL（新标签）                           | 非组件独有                        |         |
| A8  | **Change to**                       | 切换到 component set 内 **另一变体**            | **交互式组件核心**                  |         |
| A9  | **Set variable**                    | 设置 string / number / boolean / color 变量 | 可驱动绑定该变量的 component property |         |
| A10 | **Set variable mode**               | 切换页面变量模式（如 light/dark）                  | 设计系统主题切换                     |         |
| A11 | **Conditional**                     | if/else 布尔表达式，分支执行不同动作                  | 与 Set variable 等组合           |         |
| A12 | **Play / pause / toggle video**     | 视频播放控制                                  | 视频 layer / 填充                |         |
| A13 | **Mute / unmute video**             | 视频音量                                    | 同上                           |         |
| A14 | **Set to specific time**            | 视频跳转到指定时间戳                              | 同上                           |         |
| A15 | **Jump forward / backward in time** | 视频快进 / 快退 N 秒                           | 同上                           |         |
| A16 | **Lightbox**                        | 内容放大 + 背景压暗（类画廊全屏）                      | 较新的展示型交互                     |         |


### 11.6 多动作、条件与动画

> 同样是一起说，这部分是给组件中元素绑定动画设定条件，也是项目需要的


| #   | 能力                                             | 说明                                         | Flow 取舍 |
| --- | ---------------------------------------------- | ------------------------------------------ | ------- |
| M1  | **Multiple actions**                           | 同一触发器上 **堆叠** 多个动作，按列表顺序执行                 |         |
| M2  | 动作 reorder                                     | 拖拽调整顺序，顺序影响结果                              |         |
| M3  | **Conditional（if/else）**                       | 布尔表达式为真执行 if 动作，否则 else                    |         |
| M4  | Animation（Instant / Animate / Smart animate 等） | Navigate、Scroll to、Overlay、Change to 等可配过渡 |         |
| M5  | Easing & duration                              | 动画曲线与时长                                    |         |
| M6  | State management（Frame 级）                      | 跨 Frame 时组件状态 **记忆 / 重置** 策略               |         |


### 11.7 变量 × 组件（高级原型）


| #   | 能力                             | 说明                                 | Flow 取舍 |
| --- | ------------------------------ | ---------------------------------- | ------- |
| R1  | Variable 绑定 component property | 变体维度、Boolean、Text 等可绑变量            |         |
| R2  | Set variable → 间接改组件表现         | 用变量值驱动 **Change to** 或绑定的 property |         |
| R3  | 跨组件联动                          | 控制组件改变量，反应组件读同一变量切换变体              |         |
| R4  | Variable modes                 | 主题 / 品牌模式切换（Set variable mode）     |         |


### 11.8 实例在原型中的行为摘要

```
Component set（主组件 + 变体）
  ├── Component properties（Boolean / Text / Swap / Variant / Slot）
  ├── Expose nested instances
  └── Variant interactions（Change to，写在 component set 内）
        ↓ 实例化
Instance 拖入 Frame
  ├── 继承 Variant interactions（无需每屏重连）
  ├── 实例覆写（文本、颜色、swap 等）
  └── 仍可附加 Frame 级原型连接（Navigate、Overlay…）
        ↓ 预览
Prototype：触发器 → 动作（Change to / Set variable / Navigate…）
  └── 跨 Frame：State memorization 或 Reset
```

### 11.9 Figma → Vue 映射参考（规划用）


| Figma                        | Vue / Flow Panel 常见映射              | Flow 取舍 |
| ---------------------------- | ---------------------------------- | ------- |
| Variant property             | prop 枚举 / 多组件分支 / class 组合         |         |
| Boolean property             | `boolean` prop 或 `v-if`            |         |
| Text property                | `string` prop 或 slot / 默认文本        |         |
| Instance swap                | 动态组件 `<component :is>` / 条件渲染子组件   |         |
| Slot property                | `<slot>`                           |         |
| Expose nested instances      | 子组件 props 透传、聚合 props 面板           |         |
| Change to                    | state 切换 + 条件渲染 / 换 variant prop   |         |
| Set variable                 | `ref` / `reactive` state           |         |
| Open / Close overlay         | `v-model:visible`、Dialog 组件        |         |
| Navigate to                  | `router.push` / emit 给父级（超出单文件组件时） |         |
| Conditional                  | `if / else`、computed、动作链分支         |         |
| Multiple actions             | 动作链顺序节点                            |         |
| While hovering / Mouse enter | `@mouseenter` / `@mouseleave`      |         |
| After delay                  | `setTimeout` / `watch` + delay     |         |


### 11.10 Figma 对照讨论结论（草案）

> 以下整合 §11 **Flow 取舍** 列的用户标注与后续讨论，**不代表最终产品决策**；实现前可继续修订。用户标注原文保留在各行 **Flow 取舍** 列。

#### 11.10.1 三层映射框架

| 层级 | Figma | Flow Panel |
| --- | --- | --- |
| **定义** | Main component / 组件集 | `.vue` 文件、组件库注册项 |
| **使用** | Instance 放在 Frame 里 | template 中的 `<Component />` |
| **预览 / 原型** | Prototype 连线、Navigate | 交互逻辑模式测行为；**整页路由通常不属于单个 SFC** |

**术语纠正（讨论）：**

- **`.vue` 文件** ≈ 组件**定义**，不是 Figma 的 instance。
- **Instance** ≈ 在父组件 template 中引用该组件的节点。

#### 11.10.2 组件结构与属性 — 结论摘要

| ID | 倾向 | 说明 |
| --- | --- | --- |
| C1 | 不做 Figma 式 Main，做**文件级真相源** | 保存 / 导出即同步，无需实例广播 |
| C2 | 见上术语 | 定义 vs 使用分开描述 |
| C3 | **弱化 Component set**，强化 **props 枚举** | 代码库常用 `variant` / `size` prop，变体维度不必 1:1 复制 Figma |
| C4 | 默认**不允许 detach** | 等价 inline 化破坏规范；若做需警告 |
| C5 | 撤销 / Git + 可选「重置实例 props」 | 整文件级已自然存在；单实例重置可后置 |
| C6 | **要做** | 嵌套库组件时跳转到定义文件 |
| P2 | **要做且更丰富** | Boolean + 表达式 + `v-if` 等 |
| P5 | **区分三类** | Vue `<slot>` ≠ Figma slot 容器 ≠ `v-for` 列表数据 |
| N2 | 聚合嵌套 props + 可选 attrs 透传 | 不只用「透传」一词概括 |
| N4 | 对应 **实例级 props 覆写** | PropsPanel 已在部分覆盖 |
| N5 | 多数情况 Vue 自然保留 | 除非「变体 = 换整段子树」 |

#### 11.10.3 交互式组件（§11.3）

- **核心**：组件**定义内**写好「事件 → 状态 / 变体变化」，实例自带，无需每屏 prototype 连线。
- **Flow 映射**：`ref` / prop + `@event` handler，**不是** Frame 间 Navigate。
- **I6 / I7 跨 Frame 记忆**：偏应用 / 路由级，单组件编辑器 **可弱化或不做**。

#### 11.10.4 触发器（§11.4）— 要做，分优先级

| 优先级 | 内容 |
| --- | --- |
| P0 | `click`、`change` / `input` |
| P1 | `mouseenter` / `leave`、`focus` / `blur` |
| P2 | `mousedown` / `mouseup`、after delay |
| P3 | 视频 / 手柄等 |

**产品主路径：** 指定 **事件类型** → 绑定 **目标元素** → 挂 **方法 / 动作链**（见 §9.3 布局）。

#### 11.10.5 原型动作（§11.5）— 拆成两类

**组件内（单 SFC，交互逻辑模式要做）：**

| Figma | Flow |
| --- | --- |
| Change to | 改 state / prop |
| Set variable | `ref` / reactive 赋值 |
| Conditional | 动作链分支 |
| Open / Close overlay | 本地 `visible` + Dialog |

**应用 / 页面级（多数不进组件 export）：**

| Figma | Flow |
| --- | --- |
| Navigate to / Back | `router` / emit 父级 |
| Set variable mode | 全局样式 / 主题（`/styles`） |
| Scroll to | 容器或页面组件 |
| 视频 A12–A15 | 专用媒体组件时再考虑 |

#### 11.10.6 多动作与动画（§11.6）

- **M1–M3 条件与动作链**：**优先做**。
- **M4–M5 Smart Animate**：不 1:1 复制；用 CSS transition / 组件 motion。
- **M6 跨 Frame 状态**：路由 / store 范畴。

#### 11.10.7 变量 × 组件（§11.7）

- **R4 Variable modes** → 全局 Design Token / 主题，非交互逻辑侧栏。
- **R1–R3** → 组件内 state + 动作链；不受 Figma L1「不能改 Boolean」限制。

#### 11.10.8 尚未标注条目的默认倾向（待确认）

| ID | 草案倾向 |
| --- | --- |
| P1 / V1–V3 | props 表达变体，不做 Figma 组件集 UI |
| P3 Text | 已有 span / props 编辑，对齐 Text property |
| P4 Instance swap | 要做（+ 组件、换库组件） |
| L1–L3 | 代码侧可直接改 props / state，无需 Figma 变通 |
**维护：** 摘要索引见 [FEATURES.md §二十](./FEATURES.md#二十figma-组件交互参考清单)。
