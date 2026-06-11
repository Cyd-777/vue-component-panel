# VisualInteractionDemo API 文档

可视化布局交互组件，通过 `layout` prop 切换两种交互模式。

## 导入

```ts
import VisualInteractionDemo from '@/components/VisualInteractionDemo.vue'
```

## Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `layout` | `'flex' \| 'grid'` | `'flex'` | 交互模式 |

## 用法

### Flex 模式

Flex 模式用于可视化编辑 flex 容器的内边距（padding）、子项间隔（gap）、flex-wrap 以及子项的宽高模式。

```vue
<VisualInteractionDemo layout="flex" />
```

提供的能力：
- **内边距拖拽** — 4 方向蓝色手柄，拖拽或点击输入数值
- **间隔拖拽** — 品红手柄，支持列间隔和行间隔（flex-wrap 开启时）
- **子项 W/H 模式** — 工具栏按钮切换：适应（hug）、填充（fill）、固定（fixed）、最小最大（minmax）
- **flex-wrap 开关** — 控制是否换行

### Grid 模式

Grid 模式用于可视化编辑 CSS Grid 的行列排序、间隔、轨道尺寸。

```vue
<VisualInteractionDemo layout="grid" />
```

提供的能力：
- **选中容器** — 点击 grid 容器激活交互，点击外部取消
- **行列排序** — 顶部/左侧轨道胶囊，拖拽重排列/行顺序
- **轨道复合编辑** — 悬停轨道展开尺寸输入框 + 模式下拉（1fr / Hug / 固定）
- **间隔拖拽** — 品红手柄，与 Flex 模式一致
- **整列/整行高亮** — 拖排序时显示排线高亮

## 内部架构

```
VisualInteractionDemo
├── Shared composables (imported)
│   ├── useMeasureScheduler      — ResizeObserver + raf
│   ├── useValueEditor           — 气泡值编辑
│   └── useGapDrag              — 列/行间隔拖拽（预留）
├── Shared state
│   ├── columnGap / rowGap       — 间隔值
│   ├── hovered/active gap bands — 间隔交互
│   └── dragHud / valueEditor    — 拖拽 HUD + 气泡
├── Flex mode (layout === 'flex')
│   ├── padding 4方向拖拽
│   ├── flex-wrap 切换
│   ├── 子项 W/H 模式
│   └── CSS code preview
└── Grid mode (layout === 'grid')
    ├── 选中/取消选中
    ├── 列/行轨道排序
    ├── 轨道尺寸复合编辑
    └── 排线高亮
```

## 样式依赖

组件通过 `@import` 引入 `visualDrag/visualBand.css`（共享的视觉带样式）。内部 CSS 使用 `vid__` 前缀命名空间，避免与外部冲突。

## 文件结构

```
src/components/
├── VisualInteractionDemo.vue              ← 合并后组件
├── visualDrag/
│   ├── helpers.ts                          ← VisualBand、hitBand 等
│   ├── measureGaps.ts                      ← gap/padding 测量
│   ├── visualBand.css                      ← 视觉带样式
│   ├── composables/
│   │   ├── useMeasureScheduler.ts          ← 测量调度 composable
│   │   ├── useValueEditor.ts               ← 气泡值编辑 composable
│   │   └── useGapDrag.ts                   ← 间隔拖拽 composable（预留）
│   └── ValueEditorBubble.vue               ← 气泡 UI 组件
```

## 废弃

以下文件已删除，请不要继续引用：

- ~~`SpacingDragDemo.vue`~~ — 功能合并到 `VisualInteractionDemo layout="flex"`
- ~~`GridLayoutDemo.vue`~~ — 功能合并到 `VisualInteractionDemo layout="grid"`
