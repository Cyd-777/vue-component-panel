# Sortable drag (live insertion preview)

实现 **Sortable DnD with live insertion preview**，算法参考开源 [@dnd-kit/sortable](https://github.com/clauderic/dnd-kit)（MIT）：

| 模块 | 对应 dnd-kit 概念 |
|------|-------------------|
| `collision.ts` | `closestCenter` + 指针过半轴 → `overIndex` |
| `strategy.ts` | `verticalListSortingStrategy` / `horizontalListSortingStrategy` |
| `snapshot.ts` | 拖动开始时冻结 `ClientRect`，避免 `transform` 反馈漂移 |
| `computeDrop.ts` | 插入索引 + 兄弟 `translate` + gap 占位 |

未引入 npm 依赖：场景为嵌套树 + 自定义画布，与 React 版 `DndContext` 集成成本高于移植核心算法。

## 使用

由 `useNodeDrag` → `computeDropIndicator` 自动调用；无需在组件里单独引用。
