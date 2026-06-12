# 组件主题方法论 — 全组件适配性核对

> 对照当前方法论（§〇 变量驱动 + 按钮统一项 + 语义色 + 形态配方）能否覆盖设置 Tab 中的**全部组件**。  
> 结论先行：**凡样式走 TDesign / 项目全局 CSS 变量的组件均可适配**；差异在于「语义色块」用哪套**绑定档案**，不是换一套方法论。

---

## 一、方法论（所有组件共用）

```
定义层（色板 / 字体格式 / 尺寸尺度 / 效果 / 动效 Tab）
    ↓ 产出全局 CSS 变量与命名预设
设置层（按组件类型）
    ├─ 组件统一项：该组件引用的圆角 / 边框 / 效果 / 动效 / 字体 — 对该组件全部形态与状态生效
    ├─ 语义/状态色：只绑组件会读的色板变量（角色数因组件而异）
    └─ 形态/变体：组件内配方组合同一批变量 — 设置层 zero 项
```

| 原则 | 全组件是否成立 |
|------|----------------|
| 用了才能设 | ✅ TDesign 组件均消费 `--td-*` |
| 设了全形态生效 | ✅ 只要 variant 读同一变量（Button 描边/幽灵等） |
| 形态不单独开设置区 | ✅ 前提：variant 不引入**新的**独立变量；仅组合方式不同 |
| 不按实例绑 | ✅ 与组件无关 |

**不适配范围（刻意排除）：**

| 对象 | 原因 |
|------|------|
| 画板 `LayoutContainer` / 手搭节点 | 走画板属性面板 + token 引用，不是「设置 Tab 组件绑定」 |
| 纯 inline 样式、未接变量的自定义组件 | 需先改代码接入变量，再出现设置项 |
| **Typography 文本** | 不属于「组件绑定」；只用字体格式固定清单 |

---

## 二、绑定档案（Profile）— 不是每个组件都要五语义色

Button 的「五语义 + 四形态」只是 **Profile A**。其他组件换档案，**不换方法论**。

| 档案 | 适用组件 | 设置层「色」块 | 组件统一项 |
|------|----------|----------------|------------|
| **A 多语义** | Button、Tag、Alert、Badge | N 种 theme × 主色/hover/light 等角色 | 圆角、边框、效果、动效、字体×尺寸 |
| **B 表单态** | Input、Select、InputNumber、Textarea | 默认 / 聚焦 / 禁用 / **错误**（各 2～3 个变量） | 圆角、边框、效果、动效、字体×尺寸 |
| **C 双态** | Switch、Checkbox、Radio | 开/关（+ 禁用）轨道与拇指色 | 圆角、动效、标签字体 |
| **D 容器面** | Card、Dialog 面板 | 背景、边框、分隔（单套或浅/深两档） | 圆角、效果、标题/正文字体预设引用 |
| **E 文本链** | Link、Breadcrumb 链接 | 默认 / 悬停 / 访问过（3 色变量） | 链接字体预设、动效 |
| **F 极简** | Loading、Skeleton、Progress、Avatar | 1～3 个色变量 | 动效或尺寸 token，常无圆角/边框 |

---

## 三、逐组件核对

### 设置 Tab 已登记组件

| 组件 | 档案 | 能否适配 | 说明 |
|------|------|----------|------|
| **Button** | A | ✅ 已建模 | 统一项覆盖填充/描边/虚线/文字钮；见 `BUTTON_THEME_MODEL.md` |
| **Input** | B | ✅ | TDesign 用 `--td-bg-color-specialcomponent`、`--td-component-border`、`--td-error-color` 等；无五语义 |
| **Select** | B | ✅ | 同 Input + 下拉层可复用 Card/Popup 的 D 档案变量 |
| **Checkbox / Radio** | C | ✅ | 选中色走 brand；未选走 border/bg 组件变量 |
| **Switch** | C | ✅ | 轨道 `--td-bg-color-secondarycomponent`、选中 brand；圆角 `--td-radius-round` |
| **Tag** | A（精简） | ✅ | theme + light/outline variant = 配方；比 Button 少交互态 |
| **Card** | D | ✅ | 背景、边框、圆角、阴影；标题/正文引用字体预设非再绑一套字号 |
| **Alert** | A | ✅ | 四语义 × 背景 focus 色 + 图标/文字色；只读色板已有变量 |
| **Link** | E | ✅ | `--td-brand-color`、`--td-text-color-link` 等；无填充形态问题 |

### 预览中已展示、待登记组件

| 组件 | 档案 | 能否适配 | 说明 |
|------|------|----------|------|
| **Typography** | — | ⏭ 不绑 | 字体格式清单即可；设置 Tab 无独立 Typography 区 |
| **Form 其它**（Slider、Rate） | B/C 混合 | ✅ | Slider 轨道+填充色；Rate 图标色走语义 star |
| **Badge** | A 精简 | ✅ | 依附 Button/Tag 色变量 |
| **Pagination** | 继承 A | ✅ | 页码钮读 Button 同一批变量，不单独建档案 |
| **Breadcrumb** | E + 正文 | ✅ | 链接受 Link；普通项用正文 token |
| **Loading / Skeleton** | F | ✅ | 仅 spinner/占位色 + 可选动效 |
| **Progress** | F | ✅ | 轨道 + 进度条色（可绑 brand） |
| **Avatar** | F | ✅ | 背景灰阶 + 尺寸 comp-size |

### 常见但未进预览的 TDesign 组件（扩展时）

| 组件 | 档案 | 能否适配 | 风险 |
|------|------|----------|------|
| Table | B+D | ✅ | 行 hover、表头、边框多变量；统一项仍一组，色按「表格局」角色 |
| Menu / Tabs | A+E | ✅ | 选中/未选类似 Tag/Button |
| Message / Notification | A | ✅ | 同 Alert |
| Dialog / Drawer | D | ✅ | 同 Card + 遮罩色走全局 bg |
| DatePicker / Cascader | B+D | ✅ | 输入框 + 浮层面 |
| Upload | B | ✅ | 拖拽区边框/背景 |
| Image | F | ✅ | 占位、圆角 |
| Divider | F | ✅ | 仅 `--td-component-border` |
| Space | — | ⏭ | 布局间距，走尺寸尺度，无组件色绑定 |

---

## 四、与 Button 方法论的对照（你关心的点）

| 问题 | 全组件答案 |
|------|------------|
| 描边/幽灵要单独设置吗？ | **仅当该组件 variant 引入额外变量时才要**；TDesign Button/Tag 不引入 → 统一项 + 语义色即可 |
| 五语义是否通用？ | **否**；Input 用「默认/错误/禁用」，Switch 用「开/关」；仍是「只绑会读的变量」 |
| 交互态要网格吗？ | **否**；优先色板 `-hover/-active/-focus`，或组件级 0～3 条规则 |
| 字体要每个状态绑吗？ | 仅当组件**真的**为某状态读了不同 font 变量；多数只有尺寸分档 |

---

## 五、当前 gaps（方法论成立，实现未齐）

| Gap | 类型 | 处理 |
|-----|------|------|
| 右侧面板仍是 Button 旧结构（语义×交互×三色网格） | 实现 | 按 `BUTTON_THEME_MODEL` 收敛字段 |
| 仅 Button 有 `componentThemeBindingStore` | 实现 | 按 Profile B～F 加 schema，共用 store 形状 |
| 未从 TDesign CSS 自动反推设置项清单 | 工具 | 每组件一版「消费变量表」→ 生成面板 |
| 画板组件不走设置 Tab | 边界 | 保持分离，文档写清 |
| Typography 无组件绑定点 | 边界 | 符合「字体格式不绑」原则 |

---

## 六、总结

| 结论 | |
|------|--|
| **方法论可适配所有走全局变量的 UI 组件** | ✅ |
| **不需要为每种 variant 开设置** | ✅ 已验证 Button / Tag / Alert 等 |
| **需要按组件换「绑定档案」** | ✅ 不是人人五语义 |
| **不能适配的** | 未接变量的自定义件、纯布局 token（Space）、纯字体层级（Typography） |

下一步建议：为 **Input（Profile B）** 做第二范本，验证「非五语义」面板是否同样简洁；并建 `buttonConsumedVars.ts` 一类清单，从 TDesign 样式反推字段。
