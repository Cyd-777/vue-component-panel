# AI 元提示词 — Flow Panel 组件库开发接口

> 给 AI 辅助开发用的**固定上下文块**。  
> 用法：在新对话或任务开头粘贴 **§0 基础包** + 对应 **§任务包**；实现组件时同时 `@` 该组件 `API.md`。

---

## 0. 基础包（几乎每次都要带）

```text
【项目】Flow Panel — Vue 3 + TS 可视化组件库平台。最终产物是 .vue 组件文件 + registry，不是 TDesign 封装层。

【Bootstrap】TDesign 仅作参考与过渡脚手架（/styles 预览）。新组件必须是 Flow* 自家实现，样式读 CSS 变量，不 import tdesign 组件样式。

【样式四层】
L0 定义层 styles-spec：色板/尺寸/字体·效果·动效预设 → --td-* / --flow-* 注入 :root
L1 绑定层 设置 Tab：组件类型 themeId → 引用哪些 token/preset（新建库时清点一次）
L2 组件层 Flow*.vue：只读 --flow-{component}-* 别名变量；variant 用 CSS 配方，不增颜色变量
L3 实例层 画板 LayoutContainer/span：属性面板 token 下拉，不替代 L0–L1

【铁律】
1. 用了才能设 — 设置项 ↔ 组件 CSS 实际引用的变量一一对应
2. 能只用 CSS 变量实现的必须用变量，写进 API.md §样式 CSS 变量（STYLING_IMPLEMENTATION.md）
3. 变量不够的封装成代码片段，写进 API.md §样式代码片段；片段内关键参数必须可设置（var 或 props）
4. 禁止 props 传 hex；禁止 per-variant 颜色变量；禁止 5×3×3 交互态绑色网格
5. 对齐传统组件 API（theme/variant/size/disabled/slots/emits）
6. 变更顺序：API.md（变量+片段）→ 组件 CSS/片段 → binding → 设置 UI

【文档索引】
- 样式实现原则：src/modules/styles-spec/docs/STYLING_IMPLEMENTATION.md
- 变量体系：src/modules/styles-spec/docs/CSS_VARIABLE_SYSTEM.md
- 30 组件设置清单：src/modules/styles-spec/docs/COMPONENT_SETTINGS_CATALOG.md
- API 文档规范：src/modules/styles-spec/docs/COMPONENT_API_DOC_SPEC.md
- Button 变量范本：src/modules/components/button/API.md
- Bootstrap 说明：src/modules/styles-spec/STYLES_SPEC.md §二
```

---

## 1. 新建基础组件

```text
【任务】新建 Flow{Component} 基础组件

【输入】
- themeId: {如 input}
- profile: {A|B|C|D|E|F}（见 COMPONENT_THEME_ADAPTATION.md）
- TDesign 参考: {TInput 等}
- settingsCatalog 行号: COMPONENT_SETTINGS_CATALOG §4.1

【输出】
1. src/modules/components/{name}/Flow{Name}.vue — script setup + 仅 var() 样式
2. src/modules/components/{name}/API.md — 按 COMPONENT_API_DOC_SPEC.md，§样式 CSS 变量 必须完整
3. src/modules/components/{name}/index.ts — export + registry meta
4. 如需：{name}.binding.ts 默认值与 API.md「默认引用」列一致

【自检】
- [ ] API.md 每个 ● 设置项都有变量行
- [ ] CSS 无硬编码色值
- [ ] variant 只在「形态配方」节描述，无新变量
- [ ] Props 与 TDesign 同类组件对齐
```

---

## 2. 只补 / 改 CSS 变量

```text
【任务】调整 Flow{Component} 样式变量

【必须先读】src/modules/components/{name}/API.md

【规则】
- 只增删改 API.md 已声明或即将声明的 --flow-{component}-* 变量
- 新变量必须同步更新 API.md 表格（变量名/类型/fallback/设置项/binding 键）
- 若影响设置 Tab，同步 componentThemeBindingDefs / store
- 不直接改 --td-* 在组件内；--td-* 仅出现在 fallback 链

【输出】API.md diff + Flow{Name}.vue style diff + binding diff（如有）
```

---

## 3. 写组件 API 文档（无实现）

```text
【任务】仅为 {Component} 编写 API.md（设计稿）

【参照】
- COMPONENT_API_DOC_SPEC.md 固定结构
- COMPONENT_SETTINGS_CATALOG 该组件 ●/○/—
- 同 profile 已有组件（Button → Profile A 范本）

【必须包含】
- 元信息表（themeId, profile, registry.tag）
- Props/Emits/Slots 传统 API 表
- §样式 CSS 变量：统一项 + profile 对应章节 + 形态配方 + 预设引用
- §禁止事项

【不要】写未在变量表出现的样式 props（如 backgroundColor: string）
```

---

## 4. 设置 Tab / binding 对接

```text
【任务】为 themeId={id} 接 componentThemeBindingStore + 设置面板

【必须先读】
- src/modules/components/{name}/API.md §binding 键 列
- componentThemeBindingDefs.ts 现有 Button 形状

【规则】
- 面板字段 = API.md 中 binding 键，不多不少
- inject 生成 --flow-{component}-*，不覆盖全局 --td-brand-color（避免误伤其他组件）
- Profile A：块 A 统一项 + 块 B 语义色；形态/交互零设置项

【输出】applyComponentThemeBindings() 规则 + UsageSpecSettingsPanel 字段 + API.md 无需改 binding 键列（除非设计变更）
```

---

## 5. 替换 TDesign 预览

```text
【任务】在 /styles 设置 Tab 将 {Component} 预览从 t-* 换为 Flow*

【范围】
- UsageSpecPanel / *SpecPreview.vue / ButtonSpecMatrix 等
- 保持示例矩阵与 TDesign 文档一致（语义×variant×size）

【规则】
- 预览仍消费同一套 L0 token（改色板应即时生效）
- 替换后删除该文件对 tdesign 该组件的 import
- 更新 COMPONENT_SETTINGS_CATALOG §六 实现状态

【不要】改 TDesign 全局 import 除非所有 30 项已替换
```

---

## 6. 画板属性面板（实例层 L3）

```text
【任务】画板节点样式 — 与库组件无关

【区分】
- Flow* 库组件：主题来自 L1 binding，画板只改 props（theme/size），不改组件内部变量名
- LayoutContainer / span：PropsPanel token 下拉，引用 styles-spec publicApi

【不要】为 FlowButton 实例单独绑 semanticColors grid
```

---

## 7. Code Review 清单（AI 审查用）

```text
审查 Flow* 组件 PR，对照 API.md：

1. 每个 style 属性是否都来自 API.md 变量表？
2. 是否有 #hex / rgb 字面量（允许 transparent/none）？
3. variant 是否仅配方，无新 --flow-*-outline-* 变量？
4. API.md §元信息 themeId 是否与 COMPONENT_SETTINGS_CATALOG 一致？
5. 是否误 import tdesign-vue-next 组件？
6. binding 默认值是否与 API.md fallback 一致？
7. 交互态是否走色板 -hover/-active，而非 props？

输出：通过 / 问题列表（文件:行）
```

---

## 8. 一句话任务模板

| 场景 | 提示词 |
|------|--------|
| 做 Button | `§0 + §1，themeId=button，参照 button/API.md 实现 FlowButton.vue` |
| 只写 Input 文档 | `§0 + §3，themeId=input，profile B，先 API.md 不写 vue` |
| 改变量 | `§0 + §2，只改 FlowInput 的 focus 边框变量，先读 API.md` |
| 接设置面板 | `§0 + §4，themeId=button，接 binding inject` |
| 换预览 | `§0 + §5，Tag 预览 t-tag → FlowTag` |

---

## 9. 与 Cursor 配合（可选）

1. **Rules**：将 §0 基础包精简后写入 `.cursor/rules/flow-components.mdc`（alwaysApply 或 globs: `**/components/**`）。  
2. **@ 文件**：实现时 `@API.md` + `@COMPONENT_API_DOC_SPEC.md` + `@CSS_VARIABLE_SYSTEM.md`。  
3. **Skill**：复杂组件可建 `SKILL.md` 链到本文件 §1。

---

## 10. 相关文档

- [COMPONENT_API_DOC_SPEC.md](./COMPONENT_API_DOC_SPEC.md)
- [CSS_VARIABLE_SYSTEM.md](./CSS_VARIABLE_SYSTEM.md)
- [COMPONENT_SETTINGS_CATALOG.md](./COMPONENT_SETTINGS_CATALOG.md)
- [components/button/API.md](../../components/button/API.md)
