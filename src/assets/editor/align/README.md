# 九宫格对齐图标 — 手动导出说明

从 Figma 导出 SVG 后，**直接覆盖本目录下同名文件**即可，无需改代码。

## 文件命名（必须一致）

共 **18 个**文件：

### 平时显示（仅圆点）— 对应节点 [404:134](https://www.figma.com/design/anusHmRhqVdaZAzEwhAPbb/flowNode-%E9%A1%B9%E7%9B%AE%E5%BA%93?node-id=404-134) 风格

| 文件名 | 含义 |
|--------|------|
| `dot-start-start.svg` | 左上 |
| `dot-center-start.svg` | 上 |
| `dot-end-start.svg` | 右上 |
| `dot-start-center.svg` | 左 |
| `dot-center-center.svg` | 居中 |
| `dot-end-center.svg` | 右 |
| `dot-start-end.svg` | 左下 |
| `dot-center-end.svg` | 下 |
| `dot-end-end.svg` | 右下 |

### 悬停显示（三根柱）— Figma `模式=` 组件集，共 9 个源文件 → 9 个 `mode-*.svg`

| 本地文件 | Figma 源 | 何时使用 |
|----------|----------|----------|
| `mode-vertical-start.svg` 等 | `模式=垂直方向, 对齐方向=在/中/右` | **默认**：默认布局、flex 纵向、grid 等 |
| `mode-horizontal-start.svg` 等 | `模式=水平方向, 对齐方向=上/中/下` | flex **横向**且未换行（按**行** y 选图） |
| `mode-wrap-start.svg` 等 | `模式=自动换行, 对齐方向=在/中/右` | flex **开启换行**（按**列** x 选图） |

同一列（或行）内九格悬停共用同一张柱图；**圆点位置**仍由 `dot-{x}-{y}.svg` 表示具体格子。

## Figma 导出建议

1. 在组件集 **405:21** 里逐个变体选中 → 右键 **Copy/Paste as** → **Copy as SVG**，或 Export 为 SVG。
2. 点态九格若共用一个组件，也按上表拆成 9 个文件（圆点位置不同）。
3. 导出设置尽量保留 **描边为矢量**；填充/描边用 **`currentColor`** 最佳（见下）。
4. 三根柱（`mode-*.svg`）为 **10×10** viewBox，面板固定 **16×16 px**；圆点格为 24 viewBox。

## 让颜色跟面板一致（推荐）

打开 SVG，把固定色改成 `currentColor`，例如：

```svg
stroke="currentColor"
fill="currentColor"
```

这样未选中为灰色、选中为品牌色、悬停为深色，由面板 CSS 控制。

## 放好后

保存文件 → 刷新编辑器（或重启 `npm run dev`）→ 布局 → **对齐** 九宫格即生效。

## 从 Downloads 批量同步

若图标在本地文件夹（如 Figma 批量导出）：

```bash
node scripts/sync-user-figma-icons.mjs "/path/to/导出文件夹"
```

已映射：`Property 1=默认|flex|grid` → `layout/`；`方向=*` → `spacing/`；`模式=*` → `align/mode-*.svg`（九宫格悬停）。

## 若 Figma 变体名是中文

可把变体与文件名对应记在 `figma-export-map.json`（可选），例如：

```json
{
  "hover-start-start": "对齐=左上",
  "hover-center-center": "对齐=居中"
}
```

仅作备忘，程序只认上面的英文文件名。
