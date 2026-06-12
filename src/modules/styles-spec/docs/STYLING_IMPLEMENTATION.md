# 样式实现原则 — 变量优先 · 片段兜底

> Flow 自家组件（`Flow*`）的样式实现规则。  
> TDesign 过渡期不受此约束；替换为 `Flow*` 后必须遵守。

---

## 一、总原则

```
能只用 CSS 变量实现的 → 用 CSS 变量
必须用其它方式实现的 → 封装成代码片段，且关键参数可设置
```

**文档要求：** 变量进 API.md §样式 CSS 变量；片段进 API.md §样式代码片段。  
不允许「文档未声明的可调样式」。

---

## 二、分层决策

```
                    样式需求
                       │
           ┌───────────▼───────────┐
           │ 能否仅用 CSS 属性     │
           │ + var(--flow-*-*) ？  │
           └───────────┬───────────┘
                 是 │      │ 否
                    ▼      ▼
              CSS 变量   代码片段
              API §变量   API §片段
              binding    参数表 + 变量/props
```

| 路径 | 适用 | 可调方式 |
|------|------|----------|
| **CSS 变量** | 颜色、圆角、尺寸、字号、shadow、border 宽型色、transition 参数 | 设置 Tab binding → `--flow-{comp}-*` |
| **代码片段** | variant 配方、伪类规则、@keyframes、复合 selector、少量 JS 动效 | 片段内**关键参数**仍接变量或 props |

---

## 三、什么必须用 CSS 变量

以下**禁止**写死主题值（hex、固定 ms 等），必须 `var(--flow-{comp}-*, fallback)`：

| 类别 | 示例变量 |
|------|----------|
| 颜色 / 语义 / 状态 | `--flow-button-main`、hover 读色板 `-hover` |
| 圆角 / 尺寸 / 内边距 | `--flow-button-radius`、`--flow-button-height-medium` |
| 字体 | `--flow-button-font-medium` 或 preset class |
| 阴影 / 滤镜 / 透明度 | `--flow-button-shadow` |
| 边框 | `--flow-button-border-width`、`-style`、色 |
| 过渡 | `--flow-button-motion`（`transition` 整句或分拆 duration/easing 变量） |

详见 [CSS_VARIABLE_SYSTEM.md](./CSS_VARIABLE_SYSTEM.md)、[COMPONENT_API_DOC_SPEC.md](./COMPONENT_API_DOC_SPEC.md)。

---

## 四、什么封装成代码片段

**片段** = 可复用、有名字、在 API.md 中登记的 CSS / TS 块；不是随意散落在组件里的魔法数。

| 类型 | 典型场景 | 片段形式 | 关键参数（必须可设） |
|------|----------|----------|----------------------|
| **形态配方** | filled / outline / dashed / text | CSS 选择器块 `.flow-btn--variant-outline { … }` | 只引用变量，不新颜色；variant 由 props 切换 class |
| **交互伪类** | `:hover` / `:active` / `:focus-visible` | CSS 规则块 | 颜色走变量；focus 环 `--flow-*-focus-ring` |
| **keyframes** | Loading 旋转、Tree 展开 | `@keyframes` + `animation` 规则 | `duration`、`easing` → `--flow-*-animation-duration` 等 |
| **复合结构样式** | 描边虚线、icon+文字间距 | CSS 片段 | 间距可 `--flow-*-icon-gap`；dashed 的 `border-style` 可固定为片段常量 |
| **JS 动效** | 数字滚动、拖拽反馈 | composable / 小组件 | duration、easing 函数名 → props 或 `--flow-*` |

### 片段存放

```
src/modules/components/_shared/snippets/
├── variant-recipes/          # 可选：跨组件共用
├── motion-keyframes.css
└── README.md                 # 片段索引

src/modules/components/{name}/
├── snippets.css              # 该组件专用片段
└── API.md                    # §样式代码片段 登记
```

组件内 `@import './snippets.css'` 或 `<style>` 内联均可，**必须在 API.md 列出**。

---

## 五、代码片段文档格式（API.md 必含节）

```markdown
## 样式代码片段（非纯变量实现）

| 片段 ID | 类型 | 用途 | 关键参数 | 参数来源 | 设置项 |
|---------|------|------|----------|----------|--------|
| `variant-outline` | recipe | 描边钮透明底 | main, light | `--flow-button-main` 等 | — |
| `state-hover-filled` | pseudo | 填充 hover | semantic hover | `--td-*-hover` | 交互态 |
| `spin-loading` | keyframes | loading 图标 | duration | `--flow-button-spin-duration` | 交互态 |
```

| 列 | 说明 |
|----|------|
| **片段 ID** | 代码内注释或文件名可对应 |
| **关键参数** | 主题应能调的项 |
| **参数来源** | `var(--…)` · `prop` · `常量（须说明为何不可主题化）` |
| **设置项** | 七大类或 `—` |

**规则：** 片段里出现的每一个「关键参数」必须在 §样式 CSS 变量 或 Props 表中有定义；禁止片段内裸 `#0052d9` / `200ms`。

---

## 六、与设置 Tab 的关系

| 实现方式 | 设置 Tab |
|----------|----------|
| CSS 变量 | binding 选 token / preset → 注入 `--flow-{comp}-*` |
| 片段 + 变量参数 | 只绑片段引用的那些变量（如 spin duration） |
| 片段 + props | 一般**不进**设置 Tab；实例在画板改 props（如 `loading`） |
| 纯常量片段 | 仅当设计确认不可主题化，API.md 写「常量」及原因 |

---

## 七、自检清单

- [ ] 每个 color / length / shadow / transition 是否都先进变量表？
- [ ] 剩余 CSS 是否都登记为「代码片段」？
- [ ] 每个片段的「关键参数」是否都可设置（变量或 props）？
- [ ] 是否无未文档化的硬编码主题值？

---

## 八、相关文档

- [COMPONENT_API_DOC_SPEC.md](./COMPONENT_API_DOC_SPEC.md)
- [AI_META_PROMPT.md](./AI_META_PROMPT.md)
- [components/button/API.md](../../components/button/API.md)
