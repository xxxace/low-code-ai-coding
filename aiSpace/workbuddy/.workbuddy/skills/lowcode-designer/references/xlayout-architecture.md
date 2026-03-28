# XLayout 架构参考

> 更新日期：2026-03-28
> 对应设计文档：`design/FreeLayout-Interaction-Plan.md`

## 核心理念

XLayout 采用 CSS position 类比模型，每个节点独立决定定位类型。

| x-position-type | 渲染行为 | 类比 CSS |
|---|---|---|
| `'relative'`（默认） | FlowLayout 流式排列，x-span 控制宽度 | `position: relative` |
| `'absolute'` | absolute 定位，x/y/width/height 精确定位 | `position: absolute` |

## 渲染流水线

```
XLayout.vue
  ├── 遍历 schema.properties（所有字段，不区分类型）
  ├── 对每个字段调用 getNodeStyle(node) 生成定位样式
  │     relative → { position: 'relative', width: `${span/cols*100}%` }
  │     absolute → { position: 'absolute', left: x, top: y, width, height }
  ├── 通过 :style 透传给 FieldRenderer / VoidContainer 根元素
  └── FieldRenderer / VoidContainer 根元素直接应用定位样式（无 wrapper）
```

## Containing Block 语义

- XLayout 根元素：`position: relative`（建立 containing block）
- VoidContainer 根元素：`position: relative`（为内部 absolute 子节点建立 containing block）
- absolute 节点的 FieldRenderer：`overflow: hidden; padding: 0`（必须）

## 交互层分工

| 交互层 | 处理对象 | 职责 |
|---|---|---|
| DesignOverlay | x-position-type === 'relative' 的节点 | hover 高亮、选中、操作按钮、拖拽排序 |
| AbsoluteNodeOverlay | x-position-type === 'absolute' 的节点 | 拖拽移动（x/y）、8 向缩放（width/height）、选中高亮 |

**关键：两个 overlay 各司其职，不重叠处理。**

## designMode provide/inject

```typescript
// XLayout.vue 必须 provide
provide('designMode', props.designMode)

// FieldRenderer.vue / VoidContainer.vue
const designMode = inject('designMode', false)
```

`designMode` 控制：
- 隐藏字段半透明可见（设计器专用）
- hover 边框样式（`.design-mode` class）
- 操作按钮显示

## 尺寸自动同步（absolute 节点）

absolute 节点渲染后实际尺寸可能与 schema 预设不同：

1. **FieldRenderer.vue**（标量/对象字段）：
   - `onMounted + nextTick` 检测根元素实际尺寸
   - 调用 `updateNodeFreeSize(fieldId, width, height)`
   - 触发 schema 更新 → AbsoluteNodeOverlay 响应式刷新

2. **VoidContainer.vue**（容器字段）：
   - `onMounted` 首次同步
   - `ResizeObserver` 200ms 防抖追踪动态变化
   - `wrapperStyle` 在 absolute 模式下剔除 height CSS（否则 ResizeObserver 空转）

## layoutMode 语义（简化）

`layoutMode` 只影响新增节点的默认 x-position-type：
- `'flow'` → 新增节点默认 `x-position-type: 'relative'`
- `'free'` → 新增节点默认 `x-position-type: 'absolute'`

已有节点不受影响。

## 已完成的实施步骤

| Step | 内容 | 状态 |
|---|---|---|
| Step 0 | 移除 FieldRenderer wrapper div，修复 containing block | ✅ |
| Step 1 | 创建 XLayout.vue + VoidContainer 改造 | ✅ |
| Step 2 | FormRenderer 使用 XLayout，移除 FreeCanvas/DesignOverlay 旧架构 | ✅ |
| Step 3 | AbsoluteNodeOverlay 统一交互层 | ✅ |
| Step 4 | 批量切换工具栏 + PositionTypeSetter 属性面板 | ⏳ 待实现 |
| Step 5 | 旧 Schema 迁移（layoutMode → x-position-type） | ⏳ 待实现 |

## 坐标系注意事项

**问题历史（已修复）**：AbsoluteNodeOverlay 的 `inset:0` 贴合 `.lowcode-designer__canvas`（有 `padding:16px`），导致坐标原点与 XLayout 不一致。

**修复方案**：
1. AbsoluteNodeOverlay 移入 `canvas-container` 内
2. 去掉 `canvas-renderer` 的 `position: relative`
3. 去掉 XLayout 的 `position: relative`（由外层容器负责）
4. FieldRenderer absolute 模式加 `overflow: hidden; padding: 0`

**结论**：AbsoluteNodeOverlay 和 XLayout 必须共享同一个 containing block。
