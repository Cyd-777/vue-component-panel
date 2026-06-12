# vue-componentPanel — Flow 组件库面板

可视化建立与维护项目组件库：全局样式规范、组件清单、组件画板编辑与预览。

**版本：** `0.1.0`（早期预览，远未达 1.0）

详细规划见 [`PROJECT.md`](./PROJECT.md)，功能清单见 [`FEATURES.md`](./FEATURES.md)。  
全局样式规范模块见 [`src/modules/styles-spec/`](./src/modules/styles-spec/README.md)。

## 开发

```bash
npm install
npm run dev
```

## 当前能力（0.1.0）

- 全局样式规范（`/styles`）：色板、尺寸尺度、命名样式、WCAG、设置（组件主题绑定 + 预览）
- 组件库（`/library`）：清单、示例文档 Tab
- 组件画板（`/editor`）：结构编辑、属性面板、交互逻辑原型
- Design Token 注入 TDesign CSS 变量

## 构建

```bash
npm run build
npm run preview
```
