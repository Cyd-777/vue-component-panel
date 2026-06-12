# 组件 API 文档规范 — 样式 CSS 变量必含

> 每个**库组件**（`Flow*` / registry 注册项）必须有一份 API 文档。  
> **样式实现：** 能只用 CSS 变量的 → [STYLING_IMPLEMENTATION.md](./STYLING_IMPLEMENTATION.md) §变量；  
> 其余 → **代码片段**，关键参数可设置，并写入 API.md §样式代码片段。

---

## 一、文档放哪

```
src/modules/components/{name}/
├── Flow{Name}.vue
├── index.ts
├── {name}.binding.ts          # 可选：binding 默认值（与文档同步）
└── API.md                     # ← 本文规范
```

过渡期组件仍在 `src/modules/layout-container/` 等路径的，同样补 `API.md`。

全局索引（可选后续）：`src/modules/components/README.md` 链到各 `API.md`。

---

## 二、API.md 固定结构

顺序不可乱，便于人与 AI 扫描。

```markdown
# Flow{Name} API

> themeId: `{componentThemeId}` · profile: `{A|B|C|…}` · 替换: `{TDesignTag 或 —}`

## 元信息（AI 可读）

| 字段 | 值 |
|------|-----|
| component | Flow{Name} |
| themeId | button |
| profile | A |
| registry.tag | FlowButton |
| settingsCatalog | COMPONENT_SETTINGS_CATALOG §4.2 |

## 导入与基本用法

## Props（行为 API）

## Emits / Slots / Expose

## 变体与交互态（传统对齐）

说明 theme / variant / size 等与 TDesign 同类 props 的对应关系。

## 样式 CSS 变量（必含 · 完整清单）

### 统一项（组件级，全 variant / 全 state）

| 变量名 | 类型 | 默认 fallback | 设置项 | 说明 |
|--------|------|---------------|--------|------|

### 语义项（按 theme，仅 Profile A 等多语义组件）

| theme | 变量后缀 | 角色 | 默认引用 `--td-*` |

### 交互态（配方引用，不在设置 Tab 逐格绑）

| 状态 | 使用的变量 | 来源 |

### 形态配方（代码片段 · 零增变量）

filled / outline / ghost … 如何组合统一项 + 语义项。登记在 §样式代码片段。

### 预设引用（非变量名，但影响样式）

| 槽位 | preset 类型 | binding 字段 |

## 样式代码片段（必含 · 非纯变量部分）

| 片段 ID | 类型 | 用途 | 关键参数 | 参数来源 | 设置项 |
|---------|------|------|----------|----------|--------|

类型：`recipe` · `pseudo` · `keyframes` · `structure` · `js-motion`

## 禁止事项

## 相关链接
```

---

## 三、CSS 变量命名约定

### 3.1 组件 scoped 别名（Layer L2）

```
--flow-{kebab-component}-{role}
--flow-{kebab-component}-{role}-{modifier}   # 如 -hover
```

示例：`--flow-button-main`、`--flow-button-radius`、`--flow-button-font-medium`

| 规则 | 说明 |
|------|------|
| **只描述角色，不描述 variant** | ✅ `--flow-button-main` · ❌ `--flow-button-outline-border` |
| **默认值写 fallback 链** | `var(--flow-button-main, var(--td-brand-color))` |
| **设置 Tab 绑 alias，不绑 hex** | binding 改 alias → 文档「默认引用」列更新 |
| **七大类全覆盖** | 文档表格「设置项」列填：圆角 / 颜色 / 尺寸 / 字体 / 交互态 / 效果 / 边框 / — |

### 3.2 与全局 token 关系

| 层 | 变量 | 文档写在哪 |
|----|------|------------|
| 全局 | `--td-*`、`--flow-*` | 「默认引用」列 |
| 组件 alias | `--flow-button-*` | 「变量名」列 |
| 预设 | `.flow-style-{id}` | 「预设引用」节 |

**原则：组件 CSS 只读 `--flow-{comp}-*`，不直接写 `#0052d9`。**  
例外须在「禁止事项」显式列出并说明理由。

---

## 四、样式变量表 — 字段定义

每行一个变量（或一个语义角色 × theme 一行）。

| 列 | 必填 | 说明 |
|----|------|------|
| **变量名** | ✅ | 组件内实际使用的 `--flow-*` |
| **类型** | ✅ | `color` · `length` · `shadow` · `font` · `transition` · `border` |
| **默认 fallback** | ✅ | 完整 `var()` 链 |
| **设置项** | ✅ | 七大类之一，或 `—`（配方/继承） |
| **binding 键** | ⬜ | 对应 `componentThemeBindingStore` 字段 |
| **说明** | ✅ |  consumed by 哪些 selector / variant |

**完整性检查：**  
`COMPONENT_SETTINGS_CATALOG` 该组件为 ● 的格子，在 API.md 中必须有对应变量行；为 — 的格子写「不适用」并指向配方节。

---

## 五、与设置 Tab / binding 同步

1. 先写 **API.md 变量清单**（设计稿）  
2. 实现 **Flow*.vue** 只使用清单中的变量  
3. **binding 默认值** 与文档「默认引用」一致  
4. **UsageSpecSettingsPanel** 字段与「binding 键」列一致  

变更顺序：**API.md → 组件 CSS → binding → 设置 UI**。  
禁止只在 CSS 里加变量却不更新 API.md。

---

## 六、Profile 与文档章节

| Profile | 文档必含章节 |
|---------|--------------|
| **A 多语义** | 统一项 + 语义项 × N theme + 形态配方 |
| **B 表单态** | 统一项 + default/focus/error/disabled 变量 |
| **C 双态** | on/off/disabled |
| **D 容器** | surface / border / shadow |
| **E 链接** | link / hover |
| **F 极简** | 1～2 个颜色变量 |

见 [COMPONENT_THEME_ADAPTATION.md](./COMPONENT_THEME_ADAPTATION.md)。

---

## 七、示例

首份完整示例：[components/button/API.md](../components/button/API.md)

---

## 八、相关文档

- [STYLING_IMPLEMENTATION.md](./STYLING_IMPLEMENTATION.md) — **变量优先 · 片段兜底**
- [CSS_VARIABLE_SYSTEM.md](./CSS_VARIABLE_SYSTEM.md)
- [COMPONENT_SETTINGS_CATALOG.md](./COMPONENT_SETTINGS_CATALOG.md)
- [AI_META_PROMPT.md](./AI_META_PROMPT.md)
