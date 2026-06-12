# styles-spec — 全局样式规范模块

独立功能模块，路由 `/styles`。与组件库、画板**无页面耦合**。

## 边界

| 方向 | 约定 |
|------|------|
| **模块内** | `views/` UI、`tokens/` 状态与 CSS 注入 |
| **对外** | 仅 `index.ts` · `publicApi.ts` |
| **消费方** | 画板属性面板等通过 `publicApi` 读取 token / 命名样式 |

## 启动

```ts
import { initStylesSpecModule } from './modules/styles-spec'
initStylesSpecModule()
```

## 文档

- 功能框架：[STYLES_SPEC.md](./STYLES_SPEC.md)（含 §二 Bootstrap 与 TDesign）
- 模块代码检查：[MODULE_AUDIT.md](./MODULE_AUDIT.md)
- Button 绑定模型：[docs/BUTTON_THEME_MODEL.md](./docs/BUTTON_THEME_MODEL.md)
- **组件设置项清单**：[docs/COMPONENT_SETTINGS_CATALOG.md](./docs/COMPONENT_SETTINGS_CATALOG.md)
- **CSS 变量体系（对齐 TDesign）**：[docs/CSS_VARIABLE_SYSTEM.md](./docs/CSS_VARIABLE_SYSTEM.md)
- **组件 API 文档规范**：[docs/COMPONENT_API_DOC_SPEC.md](./docs/COMPONENT_API_DOC_SPEC.md)
- **样式实现原则**：[docs/STYLING_IMPLEMENTATION.md](./docs/STYLING_IMPLEMENTATION.md)
- **AI 元提示词**：[docs/AI_META_PROMPT.md](./docs/AI_META_PROMPT.md)
- 全组件适配核对：[docs/COMPONENT_THEME_ADAPTATION.md](./docs/COMPONENT_THEME_ADAPTATION.md)

## 目录

```
styles-spec/
├── bootstrap.ts      # initStylesSpecModule
├── index.ts          # 模块入口
├── publicApi.ts      # 对外 API（画板引用）
├── tokens/           # 主题数据与注入
└── views/            # 规范页 UI
```
