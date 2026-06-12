# 组件库设置项清单

> 设置 Tab（`/styles` → **设置**）左侧 30 个基础组件的**绑定清点**。  
> 与 [STYLES_SPEC.md](../STYLES_SPEC.md) 定义层、应用层分工一致。

---

## 一、规范从哪来

组件库样式不是「每个按钮各配一套」，而是三层：

```
定义层（色板 / 尺寸尺度 / 字体格式 / 效果 / 动效 Tab）
    ↓ 产出 CSS 变量与命名预设
设置层（本清单 — 组件类型 ↔ 变量 / 预设 的引用关系）
    ↓ 组件样式读变量
组件库（TDesign 基础组件 + 项目封装）
```

| 层级 | 做什么 | 改一处影响 |
|------|--------|------------|
| **定义层** | 维护色值、间距、圆角数值、命名样式 CRUD | 所有引用该 token / 预设的地方 |
| **设置层** | 声明「Button 圆角用哪个 radius token」「Input 错误色引用哪个 `--td-*`」 | 该**组件类型**下全部实例与形态 |
| **组件实现** | TDesign 读 `--td-*`；形态（填充/描边/幽灵）用**配方**组合同一批变量 | 不单独开设置项 |

**核心原则：给对应的变量赋值 → 凡使用该变量的组件一起变。**

---

## 二、什么时候「逐个组件」设置

| 场景 | 是否逐个组件绑 | 说明 |
|------|----------------|------|
| **新建组件库**（首次接入 TDesign + 项目 token） | ✅ **仅此一次** | 用本清单对 30 个基础组件做设置项清点，确认每种组件消费哪些变量 |
| **日常改主题** | ❌ | 改色板 / 尺寸 / 字体 / 效果定义即可；设置层引用关系一般不动 |
| **新增一种基础组件进库** | ✅ 增量 | 只补该组件一行清单 + 右侧面板字段 |
| **画板里某个实例** | ❌ | 走画板属性面板，不走进设置 Tab |

当前实现：**左侧已列出 30 个组件 + 全量示例**；右侧按组件进入，用于对照本清单做绑定（Button 已接 store，其余待实现）。

---

## 三、设置项七大类

所有组件的设置项只从下面七类里选；**用了才能设**。

| 类别 | 设置什么 | 典型来源 | 绑定形式 |
|------|----------|----------|----------|
| **圆角** | 组件外轮廓圆角 | 尺寸尺度 `--td-radius-*` | 引用 radius token 键 |
| **颜色** | 背景 / 文字 / 语义 / 状态色 | 项目色板 `--td-*` | 引用色板变量名 |
| **尺寸** | 高宽、内边距、图标区（非字号） | 尺寸尺度 `--td-size-*`、`--td-comp-size-*` | 引用 size token 或沿用全局 |
| **字体格式** | 字号、行高、字重 | 字体格式 Tab 命名预设 | 引用 preset id（如 `button`、`body`） |
| **交互态样式** | 悬浮 / 按下 / 聚焦 / 禁用 的表现 | 色板 `-hover/-active` + 动效预设 | 优先**色板派生**，不逐格绑色 |
| **效果** | 阴影、表面、模糊等 | 效果 Tab 命名预设 | 引用 effect preset id |
| **边框** | 线宽、线型、边框色 | 效果预设 + `--td-component-border` 等 | 边框效果预设 + 色板变量 |

说明：

- **交互态样式**：第一版以「色板已有 hover/active + 统一动效」为主，不在设置里为每个语义 × 每个状态各绑 background/text/border。
- **边框**与**效果**在 UI 上可合并为「边框效果 / 表面效果」两个预设槽，本清单仍分列以便清点。

---

## 四、按组件的设置项清单（30 项）

图例：**●** 需要绑定 · **○** 可选 / 继承全局 · **—** 不适用（组件不读或走配方）

### 4.1 总表

| # | 组件 | 圆角 | 颜色 | 尺寸 | 字体格式 | 交互态样式 | 效果 | 边框 |
|---|------|:----:|:----:|:----:|:--------:|:----------:|:----:|:----:|
| 01 | Button | ● | ● | ● | ● | ○ | ● | ● |
| 02 | Radio | ○ | ● | ○ | ● | ○ | — | ○ |
| 03 | Checkbox | ○ | ● | ○ | ● | ○ | — | ○ |
| 04 | Input | ● | ● | ● | ● | ○ | ○ | ● |
| 05 | InputNumber | ● | ● | ● | ● | ○ | ○ | ● |
| 06 | Select | ● | ● | ● | ● | ○ | ○ | ● |
| 07 | Cascader | ● | ● | ● | ● | ○ | ○ | ● |
| 08 | Switch | ● | ● | ○ | ○ | ● | — | — |
| 09 | Slider | ○ | ● | ○ | — | ○ | — | — |
| 10 | DatePicker | ● | ● | ● | ● | ○ | ○ | ● |
| 11 | Rate | — | ● | ○ | — | ○ | — | — |
| 12 | Transfer | ○ | ● | ○ | ● | ○ | ○ | ● |
| 13 | Table | ○ | ● | ● | ● | ○ | — | ● |
| 14 | Tag | ● | ● | ● | ● | ○ | ○ | ○ |
| 15 | Progress | ○ | ● | ○ | — | — | — | — |
| 16 | Tree | — | ● | ○ | ● | ○ | — | ○ |
| 17 | Pagination | ○ | ● | ○ | ● | ○ | — | ○ |
| 18 | Badge | ○ | ● | ○ | ○ | — | — | ○ |
| 19 | Alert | ● | ● | ○ | ● | — | ○ | ● |
| 20 | Loading | — | ● | ○ | — | — | — | — |
| 21 | Message | ○ | ● | ○ | ● | — | ○ | ○ |
| 22 | MessageBox | ● | ● | ○ | ● | — | ● | ● |
| 23 | Notification | ● | ● | ○ | ● | — | ○ | ● |
| 24 | Menu | ○ | ● | ○ | ● | ○ | — | ○ |
| 25 | Tabs | ○ | ● | ○ | ● | ○ | — | ○ |
| 26 | Tooltip | ● | ● | ○ | ● | — | ○ | ○ |
| 27 | Popover | ● | ● | ○ | ● | — | ● | ● |
| 28 | Card | ● | ● | ○ | ● | — | ● | ● |
| 29 | Collapse | ○ | ● | ○ | ● | ○ | — | ● |
| 30 | Avatar | ● | ● | ● | ○ | — | — | — |

---

### 4.2 各类别 — 具体设置项（按组件）

#### 圆角

| 组件 | 设置项 | 引用 |
|------|--------|------|
| Button | 组件统一圆角 | `radiusSmall` / `radiusDefault` / … → `--td-radius-*` |
| Input / Select / Cascader / DatePicker / InputNumber | 输入框圆角 | 同上 |
| Tag / Alert / Card / Tooltip / Popover / MessageBox / Notification | 容器圆角 | 同上 |
| Switch | 轨道圆角 | 常为 `radiusRound` 或 `--td-radius-round` |
| Avatar | 头像圆角 | `radiusDefault` 或圆形规则 |

#### 颜色

| 组件组 | 设置项 | 引用示例 |
|--------|--------|----------|
| Button / Tag / Badge / Alert / Message / Notification / Menu / Tabs / Pagination | 语义色 × 主色、衬色、浅底（可选） | `--td-brand-color`、`--td-success-color`、… |
| Input / Select / Cascader / DatePicker / InputNumber / Transfer / Table | 默认 / 聚焦 / 禁用 / 错误 | `--td-bg-color-specialcomponent`、`--td-error-color` |
| Radio / Checkbox / Switch | 选中 / 未选 / 禁用 | brand + component border/bg |
| Slider / Progress / Rate | 轨道、填充、图标 | brand、component bg |
| Tree | 节点选中、hover | brand、container-hover |
| Card / Collapse / Popover / MessageBox | 表面、分隔 | container、component-border |
| Tooltip | 浮层底、文字 | 组件 tooltip token |
| Loading / Avatar | 指示器 / 占位 | brand、gray scale |

#### 尺寸

| 组件 | 设置项 | 引用 |
|------|--------|------|
| Button | 大 / 中 / 小 | `--td-comp-size-*`、padding token |
| Input 系 | 输入框高度 | `--td-comp-size-m` 等 |
| Table | 行高、表头 | table size token |
| Tag / Badge | 紧凑高度 | small comp size |
| Avatar | small / medium / large | `--td-comp-size-*` |

#### 字体格式

| 组件 | 设置项 | 预设示例 |
|------|--------|----------|
| Button | 大 / 中 / 小 按钮字 | `button-lg` / `button` / `button-sm` |
| Input 系 | 输入文字 | `body` / `control` |
| Table | 表头 / 单元格 | `title` / `body` |
| Alert / Card / Message 系 | 标题 / 正文 | `title` / `body` / `caption` |
| Menu / Tabs | 项文字 | `body` / `control` |

#### 交互态样式

| 范围 | 做法 | 设置项数 |
|------|------|----------|
| 全局默认 | 色板 `-hover` / `-active` / `-disabled` | 0（定义层维护） |
| 需要动效过渡的组件 | 引用动效 Tab 预设 | 每组件 1 项「交互动效」 |
| 禁止 | 5 语义 × 3 态 × bg/text/border 网格 | — |

适用动效绑定的组件：Button、Input 系、Switch、Menu、Tabs、Collapse 等（见总表 ○ 行）。

#### 效果

| 组件 | 设置项 | 预设用途 |
|------|--------|----------|
| Button | 表面效果（填充阴影，描边常 none） | `card` / `control` |
| Card / Popover / MessageBox / Notification | 浮层/卡片阴影 | `card` / `popup` |
| Select / Cascader / DatePicker | 下拉层阴影 | `popup` |
| Tag / Alert | 轻阴影或无 | `control` |

#### 边框

| 组件 | 设置项 | 引用 |
|------|--------|------|
| Button | 边框效果（线宽等） | 效果预设 + 语义主色（描边/虚线） |
| Input 系 | 默认边框 / 聚焦边框 / 错误边框 | `--td-component-border`、`--td-brand-color`、`--td-error-color` |
| Card / Collapse / Table / Transfer | 外框、分隔线 | `--td-component-border` |
| Alert / Notification | 语义边框 | 语义色 light / focus |

---

## 五、与设置 Tab UI 的对应

| UI 区域 | 本清单 |
|---------|--------|
| 左侧 30 组件 + 示例 | §四 总表 — 预览是否覆盖该组件全部形态 |
| 右侧「编辑 »」 | 打开该组件 §4.2 具体项 |
| 未选组件 | 说明：绑定的是**组件类型**，不是左侧某一实例 |
| Button（已实现） | 圆角 + 效果 + 动效 + 字体 + 语义色（主/衬/浅底） |
| 其余 29 项 | 结构预览 + store 待实现，字段以 §4.2 为准 |

---

## 六、实现状态

| 能力 | 状态 |
|------|------|
| 30 组件左侧示例 | ✅ |
| 设置项清单（本文档） | ✅ |
| Button 绑定 store | ✅ |
| 其余组件 store + 变量注入 | ⬜ |
| 改变量后 TDesign 组件实时联动 | ⬜ |

---

## 七、相关文档

- [STYLES_SPEC.md](../STYLES_SPEC.md) — Tab 职责与闭环
- [BUTTON_THEME_MODEL.md](./BUTTON_THEME_MODEL.md) — Button 颜色/形态/交互最少项（范本）
- [COMPONENT_THEME_ADAPTATION.md](./COMPONENT_THEME_ADAPTATION.md) — Profile A～F 与扩展组件

**代码索引：** `tokens/componentThemeBindingDefs.ts`（组件注册表）· `tokens/componentThemeBindingProfiles.ts`（Profile 映射）
