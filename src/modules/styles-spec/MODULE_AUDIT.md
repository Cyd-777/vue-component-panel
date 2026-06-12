# styles-spec 模块代码检查

检查日期：2026-06-07

## 1. 封装边界

| 检查项 | 结果 |
|--------|------|
| 视图与 token 均在 `modules/styles-spec/` 内 | ✅ |
| 应用入口仅 `initStylesSpecModule()` + 路由懒加载 | ✅ |
| 画板仅通过 `publicApi.ts` 引用主题 | ✅ |
| 模块内不 import 画板 / 组件库视图 | ✅ |
| `StyleEditorPanel` 不依赖 editor 业务逻辑 | ✅（仅用共享 `ScrubInput`） |

## 2. 对外依赖（允许）

| 依赖 | 用途 |
|------|------|
| `tdesign-vue-next` | 使用规范预览组件 |
| `vue` | 框架 |
| `src/components/ScrubInput.vue` | 通用数值输入（无业务） |

## 3. 被依赖方（消费 publicApi）

| 消费方 | 导入 |
|--------|------|
| `PropsPanel.vue` | `getTokenValue`, `getPresetsByCategory`, `getStylePresetById`, `resolveColorForPicker` |
| `motionStyleSpec.ts` | `MOTION_*_OPTIONS` 再导出给画板动效伪类 |

## 4. 数据流

```
tokens/*  →  bootstrap init  →  :root CSS 变量 + .flow-style-*
themeUsageStore  →  使用规范预览
publicApi  →  画板属性面板只读消费
```

## 5. 待改进（非阻塞）

- [ ] 规范数据仍为 localStorage，未合并为单文件 `design-spec.json`
- [ ] `publicApi` 可再收窄，避免导出 `designTokenState` 响应式对象
- [ ] 画板 `tokenBindLogic` 中 token 列表与模块 defs 未自动生成，存在重复维护

## 6. 验证命令

```bash
npm run build
npx vue-tsc -b
```
