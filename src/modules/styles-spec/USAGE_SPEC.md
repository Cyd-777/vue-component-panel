# 使用规范（Usage Spec）

> Tab：**使用规则**（`/styles` → 侧栏「使用规则」）  
> 模块：`tokens/usageRulesDefs.ts` · `tokens/usageRulesStore.ts` · `views/UsageRulesPanel.vue`

---

## 定位

| 层级 | 回答 | Tab |
|------|------|-----|
| **定义层** | 有什么（token / preset 数值） | 色板 · 间距尺寸 · 字体 · 效果 · 动效 |
| **使用规范** | 什么时候用、区间与禁忌 | **使用规则**（本页） |
| **约束层** | 用得对不对（检测） | 色彩规则 |
| **实例层** | 这一页怎么搭 | 画板 |

画板宣称**高度自定义**；规范页不为 30 个组件堆表单，而是：

- 场景条文（大圆角用于什么、密集区用什么间距）
- 可编辑区间（动效 ms 范围）
- 项目默认槽（字体 / 效果 / 动效 / 圆角档 — 继承自 `themeUsageStore`）
- 组合禁忌（后续接画板 lint）

**设置 Tab（旧）** 保留但标灰，组件 binding 表单路线 deprecated。

---

## 数据

| 存储键 | 内容 |
|--------|------|
| `flow-usage-rules` | 区间、`disabledEffectPresetId` |
| `flow-theme-usage` | 项目默认槽（GlobalThemeUsagePanel） |

语义色、错误色：**仅色板**；禁用视觉：**效果 preset**（默认 `effect-disabled`）。

---

## 动效合规

`auditThemeMotionCompliance()` 读取项目默认槽各 motion preset 的 `EffectConfig.duration`，对照：

- 交互态：`motionInteractionMinMs` – `motionInteractionMaxMs`
- 显隐：`motionLifecycleMinMs` – `motionLifecycleMaxMs`
- hover 硬上限：`motionHoverHardMaxMs`

超出 → 规则页警告；不阻断画板 override。

---

## 相关文档

- [STYLES_SPEC.md](./STYLES_SPEC.md) — 页级闭环（待更新 Tab 列表）
- [COMPONENT_SETTINGS_CATALOG.md](./docs/COMPONENT_SETTINGS_CATALOG.md) — 旧绑定清单（参考）
- [COMPONENT_THEME_ADAPTATION.md](./docs/COMPONENT_THEME_ADAPTATION.md) — Profile 档案（组件 universal 项）
