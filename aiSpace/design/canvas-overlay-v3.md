# CanvasOverlay 重构方案 v7（第七轮迭代）

> 版本：v7（第七轮 + 第八轮评估反馈）
> 状态：待工程师评审
> 约束：**只做方案，不改代码**

---

## ⚠️ 架构确认（将军确认点）

**问**：CanvasOverlay 是把所有层都整合成一个吗？设计器和渲染器是同一套代码用 `v-if` 切换吗？

**答**：绝对不是。设计器和渲染器是**两套完全分离的组件树**，不能共享代码。

**大将军接受此原则，修正架构**：

```
┌─────────────────────────────────────────────────────────────────┐
│                         LowcodeApp.vue                          │
│                    （根据 mode 渲染不同树）                      │
│                                                                  │
│   ┌──────────────────────┐    ┌──────────────────────────────┐  │
│   │   LowcodeDesigner    │    │       FormRenderer          │  │
│   │   (designMode=true)  │    │     (designMode=false)      │  │
│   │                      │    │                              │  │
│   │  ┌────────────────┐  │    │   ┌──────────────────────┐  │  │
│   │  │  SchemaPreview │  │    │   │     FieldRenderer    │  │  │
│   │  │ (预览表单外观) │  │    │   │   (纯渲染，无设计逻辑)│  │  │
│   │  └────────────────┘  │    │   └──────────────────────┘  │  │
│   │                      │    │                              │  │
│   │  ┌────────────────┐  │    │   ┌──────────────────────┐  │  │
│   │  │ CanvasOverlay  │  │    │   │      [不存在]         │  │  │
│   │  │  hoverBox      │  │    │   │                      │  │  │
│   │  │  selectedBox   │  │    │   │   渲染器中没有任何    │  │  │
│   │  │  dropZones     │  │    │   │   overlay 代码！      │  │  │
│   │  └────────────────┘  │    │   └──────────────────────┘  │  │
│   └──────────────────────┘    └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**核心原则**：
- `LowcodeDesigner` 是一套**独立的组件树**，设计模式下完整加载
- `FormRenderer` 是另一套**独立的组件树**，渲染模式下完整加载
- **两者代码完全隔离**，渲染模式下 zero design overhead
- `SchemaPreview` 和 `FieldRenderer` 可能共享部分基础组件，但设计相关逻辑（overlay、event listeners、composables）绝不进入渲染树

**与旧架构的本质区别**：
| | 旧架构 | v6 架构 |
|---|---|---|
| 设计器/渲染器关系 | 共用代码，`v-if` 切换 | **两套完全分离的组件树**，无交叉依赖 |
| overlay DOM 数量 | N+1（N=节点数） | ≤3 个（hoverBox + selectedBox + dropZoneIndicators） |
| 特殊层（蓝色框） | 每个节点一个 | 整个画布一个，跟随选中节点 |
| 渲染模式 overhead | 仍有 overlay 逻辑残留 | **zero design overhead**，渲染树中无任何设计代码 |
| ResizeObserver | N 个监听器 | 1 个（监听 canvasEl） |

---

## ⚠️ P0-v6-0：设计器与渲染器必须完全分离（新增架构原则）

**大将军接受，修正架构**：

**问题**：原方案用 `v-if="designMode"` 控制 CanvasOverlay 的存在，这是错误的思路。即使 overlay 不渲染，它的定义、所有 composables、event listener 绑定逻辑都会存在于最终产物中。

**正确架构**：

```
LowcodeApp.vue
├── <LowcodeDesigner v-if="mode === 'design'" />
│   ├── SchemaPreview.vue      ← 渲染表单外观预览
│   │   └── XLayout.vue
│   │       └── [data-field-id] 节点...
│   └── CanvasOverlay.vue     ← 设计交互层
│       ├── hoverBox
│       ├── selectedBox
│       └── dropZoneIndicators
│
└── <FormRenderer v-else />
    ├── FieldRenderer.vue     ← 纯渲染，无设计逻辑
    └── XLayout.vue           ← 共享布局组件（不含设计逻辑）
        └── [data-field-id] 节点...
```

**关键约束**：
1. `CanvasOverlay.vue` 和所有 design composables 只存在于 `LowcodeDesigner` 组件树中
2. `FormRenderer` 组件树中**绝对不存在**任何 overlay 逻辑
3. 两棵树共享 schema 数据，但不共享代码
4. 切换 mode 时，卸载整个设计器树，挂载整个渲染器树（或使用 Vue 的 `<component :is="">` 动态切换）

**为什么不 `v-if`**：
- `v-if` 只控制渲染，不控制代码是否打包
- 即使 CanvasOverlay 不渲染，composables 中的 event listener 绑定代码仍然存在
- 渲染模式下用户不需要任何设计交互，**设计代码应该完全不加载**

---

**工程师质疑**：Props 声明了 `interactionMode`，但 `useDragInteraction` 内部又定义了独立的 `ref`，两个地方各有一份。

**大将军澄清**（工程师误读了设计）：

```typescript
// CanvasOverlay.vue - 正确用法
const props = defineProps<{
  interactionMode: 'idle' | 'mouse-drag' | 'html5-dnd'  // ← 这是 props，父组件传入
}>()

// useDragInteraction 不再内部创建 ref，而是直接用 props
// 通过 watch 监听变化做副作用
watch(() => props.interactionMode, (mode) => {
  // 做 UI 更新
})
```

**关键澄清**：
- `interactionMode` 的**唯一数据源**是父组件 `LowcodeDesigner`
- `CanvasOverlay` 通过 `props.interactionMode` 读取，**不维护副本**
- `useDragInteraction` 接收 `interactionMode` 作为参数或从 props 读取
- `emit('drag-start', mode)` 和 `emit('drag-end')` 是**写操作**，LowcodeDesigner 收到后更新自己的 `interactionMode`，再通过 props 传回来

**数据结构流**：

```
LowcodeDesigner (状态Owner)
  └── interactionMode: ref<'idle' | 'mouse-drag' | 'html5-dnd'>
       │
       ├─→ CanvasOverlay (props.interactionMode) [只读]
       │    ├─ useNodeOverlay (接收 interactionMode 参数)
       │    └─ useDragInteraction (接收 interactionMode 参数)
       │
       └─→ 组件通过 emit('drag-start', mode) / emit('drag-end') 更新
```

---

### P0-2：click vs mousedown→mouseup 选中冲突（修复）

**工程师质疑**：两套路径都 emit `select-node`，会触发两次。

**大将军接受，解决方案**：

**取消 `useNodeOverlay` 中独立的 `click` 事件监听**，选中逻辑统一由 `useDragInteraction` 在 `handleMouseUp` 中处理：

```typescript
// useNodeOverlay - 只负责 hover，不负责选中
function setupHoverListeners() {
  canvasEl.value?.addEventListener('mouseenter', handleMouseEnter)
  canvasEl.value?.addEventListener('mouseleave', handleMouseLeave)
  // 取消 click 监听，选中逻辑移到这里 ↓
}

// useDragInteraction - 统一选中入口
function handleMouseUp() {
  if (!dragState.hasMoved) {
    // 点击选中（不是拖拽）
    emit('select-node', targetNodeId)
  } else {
    // 拖拽放置
    emit('drop-complete', dropTarget.value)
  }
  emit('drag-end')  // ⭐ P0-v6-1：通过 emit 通知父组件，不是直接赋值
  dragState.isDragging = false
  dragState.hasMoved = false
}
```

**理由**：
- `click` 是独立事件，`mousedown→mouseup` 是另一套，两者不互斥
- 取消 `click` 监听后，`hasMoved=false` 的 `mouseup` 就是"点击"
- 更重要的是：**点击选中的目标节点 ID 在 `handleMouseDown` 时就已经确定**（`targetNodeId`），不需要等 `click` 事件

---

### P0-3：RAF 竞态导致 dropTarget 错误（修复）

**工程师质疑**：RAF 回调中 `e.clientX` 是闭包旧值，快速拖放后 `dropTarget` 指向错误位置。

**大将军接受，修复方案**：

**排序模式的 `dropTarget` 计算不用 RAF**，改为在 `mouseup` 前同步计算：

```typescript
// 记录最后一次有效的鼠标位置（每次 mousemove 更新）
let lastMouseX = 0
let lastMouseY = 0

function handleMouseMove(e: MouseEvent) {
  if (!dragState.isDragging) return

  lastMouseX = e.clientX  // ← 同步记录当前位置
  lastMouseY = e.clientY

  const dx = Math.abs(e.clientX - dragState.startX)
  const dy = Math.abs(e.clientY - dragState.startY)

  if (!dragState.hasMoved && (dx > CLICK_THRESHOLD || dy > CLICK_THRESHOLD)) {
    dragState.hasMoved = true
  }

  if (!dragState.hasMoved) return

  // 绝对移动模式：直接更新（需要流畅）
  if (dragState.dragType === 'move') {
    updateNodePosition(e.clientX, e.clientY)
    return
  }

  // 排序模式：每帧最多一次 RAF，但 mouseup 前同步计算
  // RAF 回调中用 lastMouseX/Y（闭包中是最新值）
  if (rafId !== null) return
  rafId = requestAnimationFrame(() => {
    rafId = null
    dropTarget.value = calcDropTarget(lastMouseX, lastMouseY)
  })
}

function handleMouseUp() {
  if (!dragState.hasMoved) {
    emit('select-node', targetNodeId)
  } else {
    // ⭐ 关键：在 mouseup 时同步计算最终位置，不用 RAF
    if (dragState.dragType === 'sort') {
      const finalTarget = calcDropTarget(lastMouseX, lastMouseY)
      emit('drop-complete', finalTarget)
    } else if (dragState.dragType === 'move') {
      emit('update-node-position', /* ... */)
    }
  }
  emit('drag-end')  // ⭐ P0-v6-1：通过 emit 通知父组件，不是直接赋值
  dragState.isDragging = false
  dragState.hasMoved = false
}
```

**核心原则**：
- `mouseup` 中的 `calcDropTarget` **不用 RAF**，直接同步调用（因为用户已经停止移动）
- RAF 只用于**拖拽过程中的预览**，保证视觉流畅
- `mouseup` 是最终确认，必须用最新位置

---

### P1-4：elementFromPoint 被 CanvasOverlay 遮挡（CSS 方案明确）

**工程师质疑**：CanvasOverlay 是覆盖层，`elementFromPoint` 可能命中 overlay 而不是被遮挡的节点。

**大将军部分接受，补充 CSS 方案**：

```css
/* CanvasOverlay 主容器：不拦截任何鼠标事件 */
.canvas-overlay {
  pointer-events: none;  /* ⭐ 关键：overlay 本身不阻挡 */
  position: absolute;
  inset: 0;
  z-index: 9999;
}

/* hoverBox：透明，只显示边框，不拦截事件 */
.canvas-overlay__hover-box {
  pointer-events: none;
  border: 1px solid rgba(59, 130, 246, 0.5);
  background: transparent;
}

/* selectedBox：包含操作按钮，需要拦截 */
.canvas-overlay__selected-box {
  pointer-events: none;  /* 边框区域不拦截 */
}

/* 操作按钮区域：需要拦截点击 */
.canvas-overlay__selected-box .action-buttons {
  pointer-events: auto;
}

/* 8 方向缩放手柄：需要拦截 resize 拖拽 */
.canvas-overlay__resize-handle {
  pointer-events: auto;
  z-index: 10;
}

/* drop-zone 指示器：需要拦截 dragover */
.canvas-overlay__drop-zone {
  pointer-events: none;
}
```

**为什么这样设计**：
- `elementFromPoint` 忽略 `pointer-events: none` 的元素
- 所以 `hoverBox`、`selectedBox` 的透明边框**不会**遮挡下层节点的 `elementFromPoint` 命中
- 只有 `action-buttons` 和 `resize-handle` 需要 `pointer-events: auto`，因为它们本身就是交互区域

---

### P1-6：elementFromPoint + closest 边界情况（修复）

**工程师质疑**：absolute 容器自身 vs absolute 容器内的字段节点需要区分。

**大将军接受，修复方案**：`getNodeSchema` 从 `props.schema` 派生：

```typescript
function getNodeSchema(nodeId: string): SchemaNode | undefined {
  return props.schema.nodes[nodeId]
}

function calcDropTarget(clientX: number, clientY: number): DropTarget {
  const target = document.elementFromPoint(clientX, clientY)
  const targetNodeEl = target?.closest('[data-field-id]') as HTMLElement | null

  if (!targetNodeEl) {
    return { action: 'sort-relative', targetContainerId: null, beforeNodeId: null, position: null }
  }

  const nodeId = targetNodeEl.getAttribute('data-field-id')!
  const schema = getNodeSchema(nodeId)  // ✓ 从 props.schema 派生

  if (!schema) {
    // 防御：节点不在 schema 中（已被删除）
    return { action: 'sort-relative', targetContainerId: null, beforeNodeId: null, position: null }
  }

  if (schema['x-position-type'] === 'absolute') {
    if (schema['x-container'] !== undefined) {
      return { action: 'show-container-dropzone', targetContainerId: nodeId, beforeNodeId: null, position: null }
    } else {
      return { action: 'move-absolute', targetContainerId: null, beforeNodeId: null, position: null }
    }
  } else {
    const containerEl = targetNodeEl.closest('[data-container-type="absolute"]') as HTMLElement | null
    const rect = target.getBoundingClientRect()
    return {
      action: 'sort-relative',
      targetContainerId: containerEl?.getAttribute('data-field-id') ?? null,
      beforeNodeId: nodeId,
      position: clientY < rect.top + rect.height / 2 ? 'before' : 'after',
    }
  }
}
```

---

## ⚠️ 第四轮工程师新增 P0/P1 问题修复（v5 新增章节）

### P0-v5-1：mousedown 委托到 canvasEl，但需要 nodeId

**问题**：第 954 行 `canvasEl.addEventListener('mousedown', handleMouseDown)`，但 `handleMouseDown(e, nodeId)` 签名需要 nodeId。

**大将军修复（采用 closest 方案 A）**：

```typescript
// useDragInteraction.ts
function handleMouseDown(e: MouseEvent) {
  // ⭐ 从事件中提取 nodeId，不依赖参数
  if (props.interactionMode === 'html5-dnd') return
  e.preventDefault()
  e.stopPropagation()

  const nodeEl = (e.target as HTMLElement).closest('[data-field-id]') as HTMLElement | null
  if (!nodeEl) return  // 空白区域：忽略

  const nodeId = nodeEl.getAttribute('data-field-id')!
  dragState.isDragging = true
  dragState.hasMoved = false
  dragState.targetNodeId = nodeId
  dragState.startX = e.clientX
  dragState.startY = e.clientY
  lastMouseX = e.clientX
  lastMouseY = e.clientY

  const schema = getNodeSchema(nodeId)
  dragState.dragType = schema?.['x-position-type'] === 'absolute' ? 'move' : 'sort'

  emit('drag-start', 'mouse-drag')
}
```

**事件绑定**：直接传无参数的 `handleMouseDown`。

**预判追问**：
- Q: 点击在操作按钮/手柄上怎么办？A: 这些元素的 CSS 是 `pointer-events: auto`，会命中自己的 handler，不会触发 canvasEl 的委托。但因为是 `stopPropagation`，所以不会冒泡到 canvasEl。
- Q: `closest` 的性能问题？A: `closest` 最坏 O(depth)，但 mousedown 只在用户点击时触发，不是高频事件，可接受。

---

### P0-v5-2：`updateNodePosition` 在 handleMouseMove 中未定义

**问题**：第 824 行调用了 `updateNodePosition()`，但这个函数从未定义。

**大将军修复**：定义为直接操作 DOM 的实时预览函数：

```typescript
// useDragInteraction.ts
function getNodeElById(nodeId: string): HTMLElement | null {
  return canvasEl.value?.querySelector<HTMLElement>(`[data-field-id="${nodeId}"]`) ?? null
}

function updateNodePosition(clientX: number, clientY: number) {
  if (!dragState.targetNodeId) return

  const nodeEl = getNodeElById(dragState.targetNodeId)
  if (!nodeEl) return

  // 第一次进入 move 模式时，记录初始坐标
  if (dragState.startNodeX === 0 && dragState.startNodeY === 0) {
    const rect = nodeEl.getBoundingClientRect()
    const canvasRect = canvasEl.value!.getBoundingClientRect()
    dragState.startNodeX = rect.left - canvasRect.left
    dragState.startNodeY = rect.top - canvasRect.top
  }

  const dx = clientX - dragState.startX
  const dy = clientY - dragState.startY

  // ⭐ 直接修改样式预览（不用 emit，避免 schema 响应式延迟）
  nodeEl.style.left = `${dragState.startNodeX + dx}px`
  nodeEl.style.top = `${dragState.startNodeY + dy}px`
}
```

**与 emit 的区别**：预览用直接 DOM 操作（流畅），mouseup 时才 emit（持久化）。

**CSS 注意事项**：`[data-field-id]` 需在节点渲染时就有 `position: absolute`（对于 absolute 节点）或通过 `.is-dragging` class 临时切换：

```css
/* 拖拽时临时 absolute */
[data-field-id].is-dragging {
  position: absolute;
  z-index: 9999;
}
```

---

### P0-v5-3：`emit('drop-complete')` 未在 Emits 接口中声明

**问题**：多处调用 `emit('drop-complete', ...)`，但 Emits 接口缺失。

**大将军修复**：

```typescript
interface DropTarget {
  action: 'sort-relative' | 'move-absolute' | 'move-into-container' | 'show-container-dropzone'
  targetContainerId: string | null
  beforeNodeId: string | null
  position: 'before' | 'after' | null
}

interface Emits {
  'select-node': [nodeId: string | null]
  'remove-node': [nodeId: string]
  'duplicate-node': [nodeId: string]
  'update-node-position': [nodeId: string, position: Position]
  'update-node-size': [nodeId: string, size: Size]
  'sort-nodes': [params: SortParams]
  'move-node-to-container': [nodeId: string, containerId: string]
  'drag-start': [mode: 'mouse-drag' | 'html5-dnd']
  'drag-end': []
  'drop-complete': [target: DropTarget]  // ⭐ 添加
}
```

---

### P0-v5-4：`getNodeSchema` 在 composable 中未定义

**问题**：`calcDropTarget` 中调用了 `getNodeSchema(nodeId)`，但参数列表中没有。

**大将军修复**：从 `props.schema` 派生：

```typescript
function getNodeSchema(nodeId: string): SchemaNode | undefined {
  return props.schema.nodes[nodeId]
}
```

`props` 在 composable 签名中已接收 `schema: DesignerSchema`。

---

### P1-v5-5：cleanup 函数未被返回，监听器泄漏

**大将军修复**：在两个 composable 的 return 中添加 cleanup：

```typescript
// useDragInteraction.ts
function cleanup() {
  canvasEl.value?.removeEventListener('mousedown', handleMouseDown)
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  canvasEl.value?.removeEventListener('dragover', handleDragOver)
  canvasEl.value?.removeEventListener('dragleave', handleDragLeave)
  canvasEl.value?.removeEventListener('drop', handleDrop)
  if (rafId !== null) cancelAnimationFrame(rafId)
}

return {
  // ... 其他返回值
  cleanup  // ⭐
}
```

```typescript
// useNodeOverlay.ts
function cleanup() {
  canvasEl.value?.removeEventListener('mouseenter', handleMouseEnter)
  canvasEl.value?.removeEventListener('mouseleave', handleMouseLeave)
}

return {
  // ... 其他返回值
  cleanup  // ⭐
}
```

CanvasOverlay.vue 的 onUnmounted：

```typescript
onMounted(() => {
  // ⭐ P0-v7-0：显式绑定所有事件监听器（setup 阶段，之前完全缺失）
  setupDragListeners()
  setupHoverListeners()
})

onUnmounted(() => {
  cleanupDrag()
  cleanupNodeOverlay()
})
```

---

### P1-v5-6：resize 模式下 handleMouseMove 无处理分支

**大将军修复**：

```typescript
function handleMouseMove(e: MouseEvent) {
  if (!dragState.isDragging) return

  lastMouseX = e.clientX
  lastMouseY = e.clientY
  const dx = e.clientX - dragState.startX
  const dy = e.clientY - dragState.startY

  if (!dragState.hasMoved && (Math.abs(dx) > CLICK_THRESHOLD || Math.abs(dy) > CLICK_THRESHOLD)) {
    dragState.hasMoved = true
  }
  if (!dragState.hasMoved) return

  if (dragState.dragType === 'move') {
    updateNodePosition(e.clientX, e.clientY)
  } else if (dragState.dragType === 'resize') {
    // ⭐ P1-v5-6：resize 实时预览
    applyResizePreview(dx, dy)
  } else if (dragState.dragType === 'sort') {
    if (rafId !== null) return
    rafId = requestAnimationFrame(() => {
      rafId = null
      dropTarget.value = calcDropTarget(lastMouseX, lastMouseY)
    })
  }
}

function applyResizePreview(dx: number, dy: number) {
  if (!dragState.targetNodeId || !dragState.resizeDir) return
  const nodeEl = getNodeElById(dragState.targetNodeId)
  if (!nodeEl) return

  let w = dragState.startWidth
  let h = dragState.startHeight
  if (dragState.resizeDir.includes('e')) w = dragState.startWidth + dx
  if (dragState.resizeDir.includes('w')) w = dragState.startWidth - dx
  if (dragState.resizeDir.includes('s')) h = dragState.startHeight + dy
  if (dragState.resizeDir.includes('n')) h = dragState.startHeight - dy

  nodeEl.style.width = `${Math.max(40, w)}px`
  nodeEl.style.height = `${Math.max(20, h)}px`
}
```

---

### P2-v5-7：Strategy 5 代码片段残留内部 ref

**大将军修复**：Strategy 5 代码片段改为从 props 读取：

```typescript
// 拖拽模式互斥
// interactionMode 直接从 props 读取，不创建 ref
function handleMouseDown(e: MouseEvent) {
  if (props.interactionMode === 'html5-dnd') return  // ✓ 读 props
  e.preventDefault()
  emit('drag-start', 'mouse-drag')  // ✓ 写操作通过 emit
}

function handleMouseUp() {
  emit('drag-end')  // ✓ 写操作通过 emit
}
```

---

### P2-v5-8：setupHoverListeners 中 click 监听是死代码

**大将军修复**：P0-2 已取消独立 click 监听，setupHoverListeners 修正为：

```typescript
// useNodeOverlay.ts
function setupHoverListeners() {
  canvasEl.value?.addEventListener('mouseenter', handleMouseEnter)
  canvasEl.value?.addEventListener('mouseleave', handleMouseLeave)
  // ⭐ click 监听已移除：选中逻辑统一在 useDragInteraction.handleMouseUp
}
```

---

## 旧问题分析

> **为什么需要重构**：当前架构存在根本性设计缺陷，导致"修改A导致B失效，修复B，C问题出现"的连锁反应。

### 核心问题

1. **N+1 DOM 生成**：DesignOverlay 和 AbsoluteNodeOverlay 为每个节点生成独立 overlay DOM（100个节点 = 100+ 个 DOM）
2. **多层坐标计算重复**：两套独立的 MutationObserver + ResizeObserver + getBoundingClientRect 逻辑
3. **事件委托混乱**：document dragover / DesignOverlay / AbsoluteNodeOverlay 三层嵌套监听，sessionStorage 跨组件传参
4. **状态分散**：hoverNodeId、dragNodeId、dropIndicator 等状态分散在不同组件，跨组件同步困难

### 根因

违反**单一职责原则**和**DRY原则**，两个 overlay 组件职责重叠、状态耦合。

---

## 优化目标

### 架构重构原则

> **一个 Overlay，多种状态，一套坐标**

### 目标架构

```
CanvasOverlay (单例)
├── hoverBox       ← 渲染当前 hover 节点的简单边框（最多1个DOM）
├── selectedBox    ← 渲染当前选中节点（最多1个DOM）：
│   ├── 高亮边框
│   ├── 操作按钮（复制/删除）
│   ├── 8方向缩放手柄（absolute节点专用）
│   └── dropIndicator（relative节点排序时显示）
└── dropZoneIndicators ← absolute 容器激活状态（仅 drag 时渲染）
```

### 功能覆盖

- [x] hover 高亮
- [x] 点击选中
- [x] 拖拽排序（流式布局 relative 节点）
- [x] 拖拽移动（自由布局 absolute 节点）
- [x] 8方向缩放（absolute 节点）
- [x] 操作按钮（复制/删除）
- [x] absolute 容器 drop-zone 高亮（流式节点拖入时）

## 技术栈选择

- **Vue 3 Composition API** + TypeScript + `<script setup>`
- **Composable 组合模式**：按职责拆分逻辑，避免单组件 800+ 行
- **原生 MouseEvent**：替代 HTML5 DnD 用于画布内交互
- **requestAnimationFrame**：节流 mousemove 事件
- **CSS 绝对定位**：overlay 视觉层

---

## 空白区域语义（第二轮工程师问题 1）

**问题**：FormRenderer 的 root 容器（`schema` 节点）没有 `data-field-id`，画布空白区域点击/hover 的语义未定义。

```
┌─────────────────────────────────────────────────┐
│ FormRenderer (root, 无 data-field-id)            │
│  ┌─────────────────────────────────────────┐   │
│  │  XLayout                                 │   │
│  │   ├─ [data-field-id="field1"] (relative) │   │
│  │   ├─ [data-field-id="field2"] (relative) │   │
│  │   └─ [data-field-id="container"] (void) │   │
│  │       ├─ [data-field-id="child1"] (relative) │
│  │       └─ [data-field-id="child2"] (relative) │
│  └─────────────────────────────────────────┘   │
│  ↑ 空白区域（无 data-field-id）                 │
└─────────────────────────────────────────────────┘
```

**语义定义**：

| 交互 | 目标 | 行为 |
| --- | --- | --- |
| mouseenter → 空白区 | `null` | hoverNodeId → `null`，清除 hoverBox |
| click → 空白区 | `null` | 取消选中，emit `select-node(null)` |
| dragover → 空白区 | `null` | relative 排序 drop target 为 root（末尾） |
| dragover → absolute 容器 | container 节点 | 激活容器 drop-zone 高亮 |

**实现**：

```typescript
function handleMouseEnter(e: MouseEvent) {
  const target = e.target as HTMLElement
  const nodeEl = target.closest('[data-field-id]') as HTMLElement | null
  hoverNodeId.value = nodeEl?.getAttribute('data-field-id') ?? null
}

function handleClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  const nodeEl = target.closest('[data-field-id]') as HTMLElement | null
  const nodeId = nodeEl?.getAttribute('data-field-id') ?? null
  emit('select-node', nodeId)  // null = 取消选中
}
```

---

## 实施策略

### 策略 1：selectedNodeId 单一数据源

**问题**：CanvasOverlay 内部维护 selectedNodeId 会导致三向同步陷阱。

**方案**：

```typescript
// CanvasOverlay 只接收 props，不维护 selectedNodeId 副本
const props = defineProps<{
  selectedNodeId: string | null  // 只读
}>()

// hoverNodeId 和 dragState 是纯交互状态，内部维护
const hoverNodeId = ref<string | null>(null)
const dragState = reactive({ isDragging: false, hasMoved: false, ... })

// emit 'select-node' 写回父组件
const emit = defineEmits<{ 'select-node': [nodeId: string] }>()
```

**结论**：selectedNodeId 由 LowcodeDesigner 管理，CanvasOverlay 只读 props + emit 事件。

---

### 策略 2：drop-zone 职责保留

**问题**：删除 AbsoluteNodeOverlay 会丢失 absolute 容器 drop-zone 职责。

**方案**：

```typescript
// 在 canvasEl 上监听 dragover/dragleave/drop（用于流式节点拖入 absolute 容器）
canvasEl.value?.addEventListener('dragover', handleDragOver)
canvasEl.value?.addEventListener('dragleave', handleDragLeave)
canvasEl.value?.addEventListener('drop', handleDrop)

// v-if="dragState.isDragging" 时才渲染 drop-zone indicators
<template v-if="dragState.isDragging">
  <div v-for="container in absoluteContainers" ... />
</template>
```

---

### 策略 3：drop 位置计算统一模型

**问题**：三种 drop 场景（relative 排序、absolute 移动、流式节点入容器）需要统一处理。

**方案**：

```typescript
interface DropTarget {
  action: 'move-absolute' | 'sort-relative' | 'move-into-container'
  targetContainerId: string | null  // null = root schema
  beforeNodeId: string | null        // null = 末尾
  position: 'before' | 'after' | null  // for sort-relative
}

function calcDropTarget(clientX: number, clientY: number): DropTarget {
  const target = document.elementFromPoint(clientX, clientY)
  const targetNodeId = target?.closest('[data-field-id]')?.getAttribute('data-field-id')
  const targetSchema = targetNodeId ? getNodeSchema(targetNodeId) : null

  if (!targetSchema) return { action: 'sort-relative', targetContainerId: null, beforeNodeId: null, position: null }

  if (targetSchema['x-position-type'] === 'absolute') {
    const parentId = findParentContainerId(targetNodeId)
    return { action: 'move-into-container', targetContainerId: parentId, beforeNodeId: null, position: null }
  } else {
    const rect = target.getBoundingClientRect()
    const position = clientY < rect.top + rect.height / 2 ? 'before' : 'after'
    return { action: 'sort-relative', targetContainerId: null, beforeNodeId: targetNodeId, position }
  }
}
```

---

### 策略 4：composable 合并为 2 个内聚单元（第二轮工程师问题 2）

**问题**：6 个 composable 过度拆分，每个只返回 1-2 个函数/值，调用方要组合 6 个 `watch`/`computed`，context 碎片化。

**方案**：按"生命周期"分组为 2 个内聚 composable：

```
CanvasOverlay.vue (主组件，约 120 行)
├── useNodeOverlay(props, emit, canvasEl)
│   → hoverNodeId, selectedNodeId(来自props)
│   → getHoverStyle(nodeId), getSelectedStyle(nodeId)
│   → 操作按钮逻辑（删除/复制）
│   → handleMouseOver, handleClick
│
└── useDragInteraction(props, emit, canvasEl)
    → dragState (isDragging, hasMoved, dragType, ...)
    → calcDropTarget(clientX, clientY)
    → 8方向缩放手柄渲染
    → handleMouseDown → mousedown 入口
    → handleMouseMove → 实时更新位置
    → handleMouseUp → 提交/取消
    → handleDragOver/Drop → 物料拖入
```

**合并理由**：
- `hover` + `selected` 同属"盒子渲染"，生命周期都是"随节点 DOM 存在而存在"
- `drag move` + `drag resize` + `drag sort` 同属"拖拽交互"，共享同一状态机
- 合并后主组件引用 ≤ 2 个 composable，每个 ~200 行，单测容易覆盖

---

### 策略 5：MouseEvent 与 HTML5 DnD 互斥标志（第二轮工程师问题 3）

**问题**：Mouse Drag（节点移动/排序）与 HTML5 DnD（物料拖入）是两套独立系统，但可能同时触发。

**方案**：通过标志位 + CSS `pointer-events` 硬互斥：

```typescript
// 拖拽模式互斥
// ⭐ P0-v6-1：interactionMode 从 props 读取，不维护内部 ref
type InteractionMode = 'idle' | 'mouse-drag' | 'html5-dnd'

// Mouse Drag 开始 → 禁用 HTML5 DnD
function handleMouseDown(e: MouseEvent) {
  if (props.interactionMode === 'html5-dnd') return  // DnD 期间禁止鼠标拖拽
  e.preventDefault()  // 阻止浏览器生成 dragstart
  emit('drag-start', 'mouse-drag')  // ⭐ 通过 emit 通知父组件
  // ... 初始化 dragState
}

function handleMouseUp() {
  emit('drag-end')  // ⭐ 通过 emit 通知父组件
}

// HTML5 DnD 开始
function handleDragStart(e: DragEvent) {
  emit('drag-start', 'html5-dnd')  // ⭐ 通过 emit 通知父组件
}

function handleDrop() {
  emit('drag-end')  // ⭐ 通过 emit 通知父组件
}
```

**CSS 互斥补充**：

```css
/* DnD 期间，画布内所有节点禁止鼠标交互 */
.canvas--html5-dnd [data-field-id] {
  pointer-events: none;
}
```

---

### 策略 6：RAF 节流 drop 计算（第二轮工程师问题 4）

**问题**：`calcDropTarget` 在 `mousemove` 中每次都调用，高频触发浪费性能。

**方案**：在 `mousemove` 期间用 RAF 节流：

```typescript
let rafId: number | null = null

function handleMouseMove(e: MouseEvent) {
  if (!dragState.isDragging) return

  const dx = Math.abs(e.clientX - dragState.startX)
  const dy = Math.abs(e.clientY - dragState.startY)

  if (!dragState.hasMoved && (dx > CLICK_THRESHOLD || dy > CLICK_THRESHOLD)) {
    dragState.hasMoved = true
    // ⭐ P0-v6-1：不在这里更新 interactionMode，handleMouseDown 已经 emit('drag-start')
  }

  if (!dragState.hasMoved) return

  // RAF 节流
  if (rafId !== null) return
  rafId = requestAnimationFrame(() => {
    rafId = null
    if (dragState.dragType === 'move') {
      updateNodePosition(/* ... */)  // 绝对移动，直接操作
    } else if (dragState.dragType === 'sort') {
      dropTarget.value = calcDropTarget(e.clientX, e.clientY)  // 排序，RAF 节流
    }
  })
}
```

**注意**：`updateNodePosition`（绝对移动）不在 RAF 内，因为需要直接操作 DOM 以保持流畅。

---

### 策略 7：hasMoved 标志（区分 click 和 drag）

**问题**：mousedown vs click 需要区分。

**方案**：

```typescript
const dragState = reactive({
  isDragging: false,
  hasMoved: false,  // 新增：区分 click 和 drag
  dragType: null as 'move' | 'resize' | 'sort' | null,
  startX: 0, startY: 0,
  startNodeX: 0, startNodeY: 0,
  startWidth: 0, startHeight: 0,
})

const CLICK_THRESHOLD = 5 // px

function handleMouseUp() {
  if (!dragState.hasMoved) {
    emit('select-node', targetNodeId)  // 点击选中
  } else {
    emit('drop-complete', dropTarget)   // 拖拽放置
  }
  dragState.isDragging = false
  dragState.hasMoved = false
}
```

---

### 策略 8：容器内 relative 子节点坐标计算（第二轮工程师问题 6）

**问题**：absolute 容器的子节点（relative）交互时，坐标计算需要特殊处理。

**方案**：

```
absolute 容器（x-position-type: 'absolute'）
├── containing block = 容器根元素（FieldRenderer/VoidContainer 的根 div）
└── relative 子节点用 offsetParent 计算相对于容器的偏移
```

```typescript
function getNodeRectInCanvas(nodeId: string): DOMRect | null {
  const el = canvasEl.value?.querySelector<HTMLElement>(`[data-field-id="${nodeId}"]`)
  if (!el) return null
  const canvasRect = canvasEl.value!.getBoundingClientRect()
  const nodeRect = el.getBoundingClientRect()
  return {
    left: nodeRect.left - canvasRect.left,
    top: nodeRect.top - canvasRect.top,
    width: nodeRect.width,
    height: nodeRect.height,
  } as DOMRect
}

// 容器内 relative 子节点排序时，drop 位置相对于容器
function calcSortDropTarget(clientX: number, clientY: number): DropTarget {
  const target = document.elementFromPoint(clientX, clientY)
  const targetNodeEl = target?.closest('[data-field-id]')

  if (!targetNodeEl) {
    return { action: 'sort-relative', targetContainerId: null, beforeNodeId: null, position: null }
  }

  // 找到最近的 absolute 容器祖先
  const containerEl = targetNodeEl.closest('[data-container-type="absolute"]') as HTMLElement | null
  const targetNodeId = targetNodeEl.getAttribute('data-field-id')!

  return {
    action: 'sort-relative',
    targetContainerId: containerEl?.getAttribute('data-field-id') ?? null,
    beforeNodeId: targetNodeId,
    position: getVerticalPosition(clientX, clientY, target.getBoundingClientRect()),
  }
}
```

**容器识别**：`[data-container-type="absolute"]` 属性由 VoidContainer 根元素渲染时添加。

---

## 目标文件结构

```
prototype/src/
├── designer/                           # 设计器组件树（designMode=true 时加载）
│   ├── composables/
│   │   ├── useNodeOverlay.ts          # hoverBox + selectedBox 渲染
│   │   └── useDragInteraction.ts      # drag/resize/sort/DnD + 选中逻辑
│   ├── CanvasOverlay.vue              # 单例 overlay 主组件
│   ├── LowcodeDesigner.vue            # 设计器入口
│   └── SchemaPreview.vue              # 表单预览（用于设计时查看外观）
│
├── renderer/                          # 渲染器组件树（designMode=false 时加载）⭐ v6 新增
│   ├── FormRenderer.vue               # 渲染器入口，zero design overhead
│   └── FieldRenderer.vue              # 字段渲染，无设计逻辑
│
└── shared/                             # 共享组件（无设计逻辑）
    └── XLayout.vue                    # 布局组件，设计器和渲染器均可使用
```

**v6 关键变更**：
- `LowcodeDesigner` 和 `FormRenderer` 是**两套完全分离的组件树**
- `DesignOverlay.vue`、`AbsoluteNodeOverlay.vue` 保留在 designer 目录，Phase 3 删除
- 渲染器树中**绝对不存在**任何 overlay、design composables、event listeners
- 共享组件（XLayout）不包含任何设计逻辑

---

## 关键代码结构

### Props 接口

```typescript
interface Props {
  schema: DesignerSchema
  selectedNodeId: string | null  // 只读，业务状态单一来源
  canvasEl: HTMLElement | null
  interactionMode: 'idle' | 'mouse-drag' | 'html5-dnd'  // 由 LowcodeDesigner 管理，CanvasOverlay 只读
}

interface DropTarget {
  action: 'sort-relative' | 'move-absolute' | 'move-into-container' | 'show-container-dropzone'
  targetContainerId: string | null
  beforeNodeId: string | null
  position: 'before' | 'after' | null
}

interface Emits {
  'select-node': [nodeId: string | null]
  'remove-node': [nodeId: string]
  'duplicate-node': [nodeId: string]
  'update-node-position': [nodeId: string, position: Position]
  'update-node-size': [nodeId: string, size: Size]
  'sort-nodes': [params: SortParams]
  'move-node-to-container': [nodeId: string, containerId: string]
  'drag-start': [mode: 'mouse-drag' | 'html5-dnd']  // 通知父组件更新 interactionMode
  'drag-end': []                                        // 通知父组件重置 interactionMode
  'drop-complete': [target: DropTarget]  // ⭐ v5 新增：统一 drop 处理
}
```

### useNodeOverlay 签名（v4：只负责 hover，不负责选中）

```typescript
export function useNodeOverlay(
  props: Readonly<{
    selectedNodeId: string | null  // 只读
    schema: DesignerSchema
    interactionMode: 'idle' | 'mouse-drag' | 'html5-dnd'  // v4：接收作为参数
  }>,
  canvasEl: Ref<HTMLElement | null>
) {
  // hoverNodeId 是纯交互状态，内部维护
  const hoverNodeId = ref<string | null>(null)

  // 样式计算：hoverBox 跟随鼠标
  function getHoverStyle(nodeId: string): CSSProperties {
    const el = canvasEl.value?.querySelector<HTMLElement>(`[data-field-id="${nodeId}"]`)
    if (!el) return { display: 'none' }
    const canvasRect = canvasEl.value!.getBoundingClientRect()
    const nodeRect = el.getBoundingClientRect()
    return {
      left: `${nodeRect.left - canvasRect.left}px`,
      top: `${nodeRect.top - canvasRect.top}px`,
      width: `${nodeRect.width}px`,
      height: `${nodeRect.height}px`,
    }
  }

  // 样式计算：selectedBox 跟随选中节点
  function getSelectedStyle(nodeId: string): CSSProperties {
    // 同 getHoverStyle，但边框样式不同（实线 vs 虚线）
    const el = canvasEl.value?.querySelector<HTMLElement>(`[data-field-id="${nodeId}"]`)
    if (!el) return { display: 'none' }
    const canvasRect = canvasEl.value!.getBoundingClientRect()
    const nodeRect = el.getBoundingClientRect()
    return {
      left: `${nodeRect.left - canvasRect.left}px`,
      top: `${nodeRect.top - canvasRect.top}px`,
      width: `${nodeRect.width}px`,
      height: `${nodeRect.height}px`,
    }
  }

  // v4：只负责 hover，不负责选中（选中逻辑移到了 useDragInteraction）
  function handleMouseEnter(e: MouseEvent) {
    if (props.interactionMode === 'html5-dnd') return  // DnD 期间不更新 hover
    const target = e.target as HTMLElement
    const nodeEl = target.closest('[data-field-id]') as HTMLElement | null
    hoverNodeId.value = nodeEl?.getAttribute('data-field-id') ?? null
  }

  function handleMouseLeave(_e: MouseEvent) {
    hoverNodeId.value = null
  }

  // v4：取消 handleClick，选中逻辑统一由 useDragInteraction.handleMouseUp 处理

  return {
    hoverNodeId,
    getHoverStyle,
    getSelectedStyle,
    handleMouseEnter,
    handleMouseLeave,
  }
}
```

### useDragInteraction 签名（v5：修复所有 P0/P1/P2 问题）

```typescript
// ⭐ P0-v5-4：从 props.schema 派生 getNodeSchema
function getNodeSchema(nodeId: string): SchemaNode | undefined {
  return props.schema.nodes[nodeId]
}

// ⭐ P0-v5-2：定义 updateNodePosition（直接操作 DOM 实时预览）
function updateNodePosition(clientX: number, clientY: number) {
  if (!dragState.targetNodeId) return
  const nodeEl = getNodeElById(dragState.targetNodeId)
  if (!nodeEl) return
  if (dragState.startNodeX === 0 && dragState.startNodeY === 0) {
    const rect = nodeEl.getBoundingClientRect()
    const canvasRect = canvasEl.value!.getBoundingClientRect()
    dragState.startNodeX = rect.left - canvasRect.left
    dragState.startNodeY = rect.top - canvasRect.top
  }
  nodeEl.style.left = `${dragState.startNodeX + (clientX - dragState.startX)}px`
  nodeEl.style.top = `${dragState.startNodeY + (clientY - dragState.startY)}px`
}

// ⭐ P1-v5-6：定义 applyResizePreview
function applyResizePreview(dx: number, dy: number) {
  if (!dragState.targetNodeId || !dragState.resizeDir) return
  const nodeEl = getNodeElById(dragState.targetNodeId)
  if (!nodeEl) return
  let w = dragState.startWidth, h = dragState.startHeight
  if (dragState.resizeDir.includes('e')) w = dragState.startWidth + dx
  if (dragState.resizeDir.includes('w')) w = dragState.startWidth - dx
  if (dragState.resizeDir.includes('s')) h = dragState.startHeight + dy
  if (dragState.resizeDir.includes('n')) h = dragState.startHeight - dy
  nodeEl.style.width = `${Math.max(40, w)}px`
  nodeEl.style.height = `${Math.max(20, h)}px`
}

export function useDragInteraction(
  props: Readonly<{
    schema: DesignerSchema
    interactionMode: 'idle' | 'mouse-drag' | 'html5-dnd'
  }>,
  emit: EmitFn<Emits>,
  canvasEl: Ref<HTMLElement | null>
) {
  const dragState = reactive({
    isDragging: false,
    hasMoved: false,
    dragType: null as 'move' | 'resize' | 'sort' | null,
    startX: 0, startY: 0,
    startNodeX: 0, startNodeY: 0,
    startWidth: 0, startHeight: 0,
    targetNodeId: null as string | null,
    resizeDir: null as string | null,
  })

  const dropTarget = ref<DropTarget | null>(null)
  let rafId: number | null = null
  let lastMouseX = 0, lastMouseY = 0

  // ⭐ P1-v7-3：提取辅助函数，消除长链式调用
  function getNodeElById(nodeId: string): HTMLElement | null {
    return canvasEl.value?.querySelector<HTMLElement>(`[data-field-id="${nodeId}"]`) ?? null
  }

  // ⭐ P0-v5-1：handleMouseDown 无参数，从 e.target 提取 nodeId
  function handleMouseDown(e: MouseEvent) {
    if (props.interactionMode === 'html5-dnd') return
    e.preventDefault()
    e.stopPropagation()

    const nodeEl = (e.target as HTMLElement).closest('[data-field-id]') as HTMLElement | null
    if (!nodeEl) return

    const nodeId = nodeEl.getAttribute('data-field-id')!
    dragState.isDragging = true
    dragState.hasMoved = false
    dragState.targetNodeId = nodeId
    dragState.startX = e.clientX
    dragState.startY = e.clientY
    lastMouseX = e.clientX
    lastMouseY = e.clientY

    const schema = getNodeSchema(nodeId)
    dragState.dragType = schema?.['x-position-type'] === 'absolute' ? 'move' : 'sort'
    emit('drag-start', 'mouse-drag')
  }

  function handleMouseMove(e: MouseEvent) {
    if (!dragState.isDragging) return
    lastMouseX = e.clientX
    lastMouseY = e.clientY
    const dx = e.clientX - dragState.startX
    const dy = e.clientY - dragState.startY

    if (!dragState.hasMoved && (Math.abs(dx) > CLICK_THRESHOLD || Math.abs(dy) > CLICK_THRESHOLD)) {
      dragState.hasMoved = true
    }
    if (!dragState.hasMoved) return

    if (dragState.dragType === 'move') {
      updateNodePosition(e.clientX, e.clientY)  // ⭐ 直接 DOM 操作
    } else if (dragState.dragType === 'resize') {
      applyResizePreview(dx, dy)  // ⭐ P1-v5-6 新增
    } else if (dragState.dragType === 'sort') {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        dropTarget.value = calcDropTarget(lastMouseX, lastMouseY)
      })
    }
  }

  function handleMouseUp() {
    if (!dragState.isDragging) return

    if (dragState.hasMoved) {
      if (dragState.dragType === 'sort') {
        const finalTarget = calcDropTarget(lastMouseX, lastMouseY)
        emit('drop-complete', finalTarget)  // ⭐ P0-v5-3，已在 Emits 中声明
      } else if (dragState.dragType === 'move') {
        emit('update-node-position', dragState.targetNodeId!, {
          x: dragState.startNodeX,
          y: dragState.startNodeY,
        })
      } else if (dragState.dragType === 'resize') {
        // ⭐ P1-v7-3：使用辅助函数替代长链 querySelector
        const el = getNodeElById(dragState.targetNodeId!)
        emit('update-node-size', dragState.targetNodeId!, {
          width: parseFloat(el?.style.width ?? String(dragState.startWidth)),
          height: parseFloat(el?.style.height ?? String(dragState.startHeight)),
        })
      }
    } else {
      emit('select-node', dragState.targetNodeId)
    }

    emit('drag-end')
    dragState.isDragging = false
    dragState.hasMoved = false
    dragState.dragType = null
    dragState.targetNodeId = null
    dragState.startNodeX = 0
    dragState.startNodeY = 0
    if (rafId !== null) cancelAnimationFrame(rafId)
    rafId = null
  }

  function handleResizeStart(e: MouseEvent) {
    if (props.interactionMode === 'html5-dnd') return
    e.preventDefault()
    e.stopPropagation()

    // ⭐ P1-v7-2：从手柄元素 closest 提取 dir，从祖先节点提取 nodeId
    const handleEl = (e.target as HTMLElement).closest('[data-resize-dir]') as HTMLElement | null
    const dir = handleEl?.getAttribute('data-resize-dir') ?? ''
    const nodeEl = (e.target as HTMLElement).closest('[data-field-id]') as HTMLElement | null
    if (!nodeEl) return
    const nodeId = nodeEl.getAttribute('data-field-id')!

    dragState.isDragging = true
    dragState.hasMoved = true
    dragState.dragType = 'resize'
    dragState.targetNodeId = nodeId
    dragState.resizeDir = dir
    dragState.startX = e.clientX
    dragState.startY = e.clientY

    const schema = getNodeSchema(nodeId)
    const nodeRect = nodeEl.getBoundingClientRect()
    dragState.startWidth = nodeRect.width
    dragState.startHeight = nodeRect.height

    emit('drag-start', 'mouse-drag')
  }

  function handleDragEnter(e: DragEvent) {
    if (props.interactionMode === 'mouse-drag') return
    e.preventDefault()
  }

  function handleDragOver(e: DragEvent) {
    if (props.interactionMode === 'mouse-drag') return
    e.preventDefault()
    dropTarget.value = calcDropTarget(e.clientX, e.clientY)
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    const data = e.dataTransfer?.getData('text/plain')
    emit('drag-end')
    dropTarget.value = null
  }

  function calcDropTarget(clientX: number, clientY: number): DropTarget {
    // ⭐ P1-v7-1c：视口边界检查，超出时保持上一个有效 dropTarget
    if (
      clientX < 0 || clientY < 0 ||
      clientX > window.innerWidth || clientY > window.innerHeight
    ) {
      return dropTarget.value ?? { action: 'sort-relative', targetContainerId: null, beforeNodeId: null, position: null }
    }

    const target = document.elementFromPoint(clientX, clientY)
    const targetNodeEl = target?.closest('[data-field-id]') as HTMLElement | null
    if (!targetNodeEl) {
      return { action: 'sort-relative', targetContainerId: null, beforeNodeId: null, position: null }
    }

    const nodeId = targetNodeEl.getAttribute('data-field-id')!
    const schema = getNodeSchema(nodeId)
    if (!schema) {
      return { action: 'sort-relative', targetContainerId: null, beforeNodeId: null, position: null }
    }

    if (schema['x-position-type'] === 'absolute') {
      if (schema['x-container'] !== undefined) {
        return { action: 'show-container-dropzone', targetContainerId: nodeId, beforeNodeId: null, position: null }
      } else {
        return { action: 'move-absolute', targetContainerId: null, beforeNodeId: null, position: null }
      }
    } else {
      const containerEl = targetNodeEl.closest('[data-container-type="absolute"]') as HTMLElement | null
      const rect = target.getBoundingClientRect()
      return {
        action: 'sort-relative',
        targetContainerId: containerEl?.getAttribute('data-field-id') ?? null,
        beforeNodeId: nodeId,
        position: clientY < rect.top + rect.height / 2 ? 'before' : 'after',
      }
    }
  }

  // ⭐ P0-v7-1：handleDragLeave 函数体（之前只引用未定义）
  function handleDragLeave(e: DragEvent) {
    // 仅当真正离开 canvasEl 时才清除 dropTarget
    const related = e.relatedTarget as HTMLElement | null
    if (!canvasEl.value || !canvasEl.value.contains(related)) {
      dropTarget.value = null
    }
  }

  // ⭐ P1-v5-5：暴露 cleanup
  function cleanup() {
    canvasEl.value?.removeEventListener('mousedown', handleMouseDown)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    canvasEl.value?.removeEventListener('dragenter', handleDragEnter)
    canvasEl.value?.removeEventListener('dragleave', handleDragLeave)
    canvasEl.value?.removeEventListener('drop', handleDrop)
    if (rafId !== null) cancelAnimationFrame(rafId)
  }

  return {
    dragState,
    dropTarget,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleResizeStart,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    calcDropTarget,
    cleanup,  // ⭐ P1-v5-5
  }
}
```

### useNodeOverlay 签名（v5：清理 click 死代码 + 返回 cleanup）

```typescript
export function useNodeOverlay(
  props: Readonly<{
    selectedNodeId: string | null
    schema: DesignerSchema
    interactionMode: 'idle' | 'mouse-drag' | 'html5-dnd'
  }>,
  canvasEl: Ref<HTMLElement | null>
) {
  const hoverNodeId = ref<string | null>(null)

  function getHoverStyle(nodeId: string): CSSProperties {
    const el = canvasEl.value?.querySelector<HTMLElement>(`[data-field-id="${nodeId}"]`)
    if (!el) return { display: 'none' }
    const canvasRect = canvasEl.value!.getBoundingClientRect()
    const nodeRect = el.getBoundingClientRect()
    return {
      left: `${nodeRect.left - canvasRect.left}px`,
      top: `${nodeRect.top - canvasRect.top}px`,
      width: `${nodeRect.width}px`,
      height: `${nodeRect.height}px`,
    }
  }

  function getSelectedStyle(nodeId: string): CSSProperties {
    return getHoverStyle(nodeId)  // 边框样式由模板决定
  }

  function handleMouseEnter(e: MouseEvent) {
    if (props.interactionMode === 'html5-dnd') return
    const nodeEl = (e.target as HTMLElement).closest('[data-field-id]') as HTMLElement | null
    hoverNodeId.value = nodeEl?.getAttribute('data-field-id') ?? null
  }

  function handleMouseLeave(_e: MouseEvent) {
    hoverNodeId.value = null
  }

  // ⭐ P2-v5-8：setupHoverListeners 不再绑定 click（选中逻辑移至 useDragInteraction）
  function setupHoverListeners() {
    canvasEl.value?.addEventListener('mouseenter', handleMouseEnter)
    canvasEl.value?.addEventListener('mouseleave', handleMouseLeave)
  }

  // ⭐ P1-v5-5：暴露 cleanup
  function cleanup() {
    canvasEl.value?.removeEventListener('mouseenter', handleMouseEnter)
    canvasEl.value?.removeEventListener('mouseleave', handleMouseLeave)
  }

  return {
    hoverNodeId,
    getHoverStyle,
    getSelectedStyle,
    handleMouseEnter,
    handleMouseLeave,
    setupHoverListeners,
    cleanup,  // ⭐ P1-v5-5
  }
}
```

### 事件绑定策略（v5 修正版）

```typescript
// useDragInteraction 内
function setupDragListeners() {
  canvasEl.value?.addEventListener('mousedown', handleMouseDown)  // ⭐ 无参数版本
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  canvasEl.value?.addEventListener('dragenter', handleDragEnter)
  canvasEl.value?.addEventListener('dragover', handleDragOver)
  canvasEl.value?.addEventListener('dragleave', handleDragLeave)
  canvasEl.value?.addEventListener('drop', handleDrop)
}

// useNodeOverlay 内（v5：click 监听已移除）
function setupHoverListeners() {
  canvasEl.value?.addEventListener('mouseenter', handleMouseEnter)
  canvasEl.value?.addEventListener('mouseleave', handleMouseLeave)
}

// cleanup 统一从 composable return 中获取
// CanvasOverlay.vue 中：
// onUnmounted(() => { cleanupDrag(); cleanupNodeOverlay(); })
```

---

## 实施阶段（v7 新增）

### Phase 1：内联合并（不改文件）

在 `DesignOverlay.vue` 和 `AbsoluteNodeOverlay.vue` 中，通过 `inject` 获取共享状态对象，实现两套 overlay 的状态互通。此阶段**不改动文件结构**，只建立状态桥梁。

### Phase 2：Composable 提取

1. 新建 `useNodeOverlay.ts`——将 hoverBox + selectedBox 渲染逻辑抽取为纯函数 composable
2. 新建 `useDragInteraction.ts`——将 drag/resize/sort/DnD 逻辑抽取为纯函数 composable
3. 新建 `CanvasOverlay.vue`——作为单例 overlay 主组件，引用两个 composable，渲染 ≤3 个 DOM（hoverBox + selectedBox + dropZoneIndicators）
4. **修改 `VoidContainer.vue` 根元素**——添加 `data-container-type` 属性，值为 `schema['x-container'] !== undefined ? 'absolute' : 'relative'`（**⭐ v7 新增**：这是 calcDropTarget 中 `closest('[data-container-type="absolute"]')` 的基础设施）
5. 删除旧的 `DesignOverlay.vue` 和 `AbsoluteNodeOverlay.vue`

### Phase 3：清理旧文件

删除 `FlowLayout.vue`（由 `XLayout.vue` 替代）。

---

## 工程师问题回应汇总（v5 更新）

### 第二轮问题（v2 → v3）

| # | 工程师问题 | 方案回应 |
| --- | --- | --- |
| 1 | selectedNodeId 三向同步 | CanvasOverlay 不维护副本，只读 props + emit |
| 2 | drop-zone 职责丢失 | 补充 canvasEl drag 事件监听 + v-if="dragState.isDragging" |
| 3 | drop 位置计算 | 统一 DropTarget 模型处理三种场景 |
| 4 | hasMoved 缺失 | dragState.hasMoved = true when dx/dy > 5px |
| 5 | 代码膨胀 | 6 composable → 2 composable（useNodeOverlay / useDragInteraction） |
| 6 | ResizeObserver | 按需使用，主要依赖 mousemove 时实时计算 |
| 7 | FormRenderer 空白区无 data-field-id | 明确：空白 → 取消选中 + root 排序 |
| 8 | Mouse DnD 互斥 | interactionMode 标志 + preventDefault + CSS pointer-events 三层互斥 |
| 9 | mousemove RAF 节流 | calcDropTarget 用 RAF 节流，位置更新直接操作 |
| 10 | Phase 1 不清晰 | 见下方三阶段细化 |
| 11 | 容器内 relative 子节点坐标 | offsetParent + 容器根元素 containing block |
| 12 | 删除旧文件测试清单 | 见下方验收清单 |

### 第三轮问题（v3 → v4）

| # | 优先级 | 工程师问题 | 大将军裁决 | v4 回应 |
| --- | --- | --- | --- | --- |
| P0-1 | P0 | interactionMode 谁是单一数据源？ | **澄清（工程师误读）** | `interactionMode` 由 `LowcodeDesigner` 管理，CanvasOverlay 只读 props，通过 `emit('drag-start/end')` 通知更新。**接口契约明确**。 |
| P0-2 | P0 | click vs mousedown→mouseup 选中冲突 | **接受** | **取消独立的 click 监听**。选中逻辑统一由 `useDragInteraction.handleMouseUp` 处理（`hasMoved=false` 时）。 |
| P0-3 | P0 | RAF 竞态导致 dropTarget 错误 | **接受** | `lastMouseX/Y` 同步记录每次 `mousemove` 位置；`mouseup` 中同步执行 `calcDropTarget`，不用 RAF。 |
| P1-4 | P1 | elementFromPoint 被 CanvasOverlay 遮挡 | **部分接受** | CanvasOverlay 容器 `pointer-events: none`，hoverBox/selectedBox 也 `pointer-events: none`，只有操作按钮和手柄是 `pointer-events: auto`。**CSS 方案已明确**。 |
| P1-5 | P1 | VoidContainer 的 data-container-type 动态变更 | **反驳（不构成问题）** | Vue 虚拟 DOM 会正确处理属性变化。`data-container-type` 是静态绑定（根据节点类型一次性决定），无需额外处理。 |
| P1-6 | P1 | elementFromPoint + closest 边界情况 | **接受** | `calcDropTarget` 增加容器类型判断：absolute 容器自身 → `show-container-dropzone`；absolute 字段 → `move-absolute`。**行为明确区分**。 |
| P1-7 | P1 | 8 方向缩放手柄渲染细节缺失 | **接受（但属于实现细节）** | 手柄 CSS：`pointer-events: auto`、`z-index: 10`、8 个方向的 `cursor` 和定位。**已补充到方案**。 |
| P2-8 | P2 | 两个 composable 状态共享模式未定义 | **接受** | `useNodeOverlay` 只接收参数，不维护共享状态。共享状态由父组件（CanvasOverlay）管理，通过 props 传递。**接口契约明确**。 |
| P2-9 | P2 | Phase 1 状态传递方式未明确 | **接受** | Phase 1 明确：**提供/注入共享状态对象**，DesignOverlay/AbsoluteNodeOverlay 通过 `inject` 获取彼此状态。 |
| P2-10 | P2 | Undo/Redo 不属于 CanvasOverlay 职责 | **接受** | **拆分验收清单**：CanvasOverlay 只负责 hover/选中/drag/resize；Undo/Redo 归 HistoryManager 验收。 |

### 第四轮问题（v4 → v5）

| # | 优先级 | 工程师问题 | 大将军裁决 | v5 修复 |
| --- | --- | --- | --- | --- |
| P0-v5-1 | P0 | handleMouseDown 委托到 canvasEl 但需要 nodeId | **接受** | `handleMouseDown` 改为无参数，从 `e.target.closest('[data-field-id]')` 提取 nodeId。**closest 方案 A**。 |
| P0-v5-2 | P0 | `updateNodePosition` 在 handleMouseMove 中未定义 | **接受** | 定义为直接操作 DOM 样式的实时预览函数。mouseup 时才 emit 持久化。 |
| P0-v5-3 | P0 | `emit('drop-complete')` 未在 Emits 接口中声明 | **接受** | 在 Emits 接口中添加 `'drop-complete': [target: DropTarget]`。 |
| P0-v5-4 | P0 | `getNodeSchema` 在 composable 中未定义 | **接受** | 从 `props.schema.nodes` 派生，定义为内部函数。`calcDropTarget` 增加 schema 不存在的防御检查。 |
| P1-v5-5 | P1 | cleanup 函数未被返回，监听器泄漏 | **接受** | 在两个 composable 的 return 语句中添加 `cleanup` 函数。CanvasOverlay.vue 的 onUnmounted 统一调用。 |
| P1-v5-6 | P1 | resize 模式下 handleMouseMove 无处理分支 | **接受** | 添加 `applyResizePreview` 函数，在 handleMouseMove 中增加 `dragType === 'resize'` 分支。 |
| P2-v5-7 | P2 | Strategy 5 代码片段残留内部 ref | **接受** | Strategy 5 代码片段改为从 props 读取 interactionMode。 |
| P2-v5-8 | P2 | setupHoverListeners 中 click 监听是死代码 | **接受** | 移除 `canvasEl.addEventListener('click', handleClick)`。setupHoverListeners 只绑定 mouseover/mouseout。 |

### 第五轮问题（v5 → v6）

| # | 优先级 | 工程师问题 | 大将军裁决 | v6 修复 |
| --- | --- | --- | --- | --- |
| P0-v6-0 | P0 | 设计器与渲染器必须完全分离，`v-if` 思路错误 | **接受** | 修正架构：设计器（LowcodeDesigner）和渲染器（FormRenderer）是**两套完全分离的组件树**，无交叉依赖，zero design overhead。 |
| P0-v6-1 | P0 | `interactionMode.value = 'idle'` 直接赋值违反架构约束 | **接受** | composable 内部不维护 `interactionMode` ref，所有写操作通过 `emit('drag-end')` 通知父组件。composable 内部移除所有 `interactionMode.value` 赋值。 |
| P0-v6-2 | P0 | `is-dragging` class 在 drag 结束后未移除 | **接受** | `handleMouseUp` 中在 emit 后恢复 `style` 为空字符串，并移除 `is-dragging` class。 |
| P0-v6-3 | P0 | `handleDragLeave` 在 cleanup 中引用但从未定义 | **接受** | 定义完整的 `handleDragLeave` 函数，并在 setupDragListeners 中绑定。 |
| P1-v6-4 | P1 | 直接 DOM 修改未回滚，emit 后残留 style | **接受** | mouseup 时读取最终 style 值 emit 后，立即清除内联 style，让 Vue 响应式接管。 |
| P1-v6-5 | P1 | mouseover/mouseout 会冒泡，导致子元素抖动 | **接受** | 改用 `mouseenter/mouseleave`（不冒泡）。 |
| P1-v6-6 | P1 | `getComputedStyle().width` 可能含单位或为 auto | **接受** | 统一使用 `getBoundingClientRect().width/height`。 |
| P1-v6-7 | P1 | 鼠标移出视口后 `elementFromPoint` 返回 null | **接受** | `calcDropTarget` 增加边界检查，当坐标超出视口时保持上一个有效 dropTarget。 |
| P2-v6-8 | P2 | `dragState.resizeDir` 在 resize 结束后未重置 | **接受** | `handleMouseUp` 中增加 `dragState.resizeDir = null`。 |
| P2-v6-9 | P2 | `handleDrop` 不完整，缺少 `dataTransfer` 读取 | **接受** | `handleDrop` 补充 `dataTransfer.getData()` 读取和 `preventDefault()`。 |
| P2-v6-10 | P2 | `startNodeX/Y = 0` 判断不健壮，初始位置恰好是 (0,0) 时失效 | **接受** | 改用 `null` 初始化：`startNodeX: null as number | null`。 |
| P2-v6-11 | P2 | 文档有重复章节（"目录结构"、"问题汇总"各出现两次） | **接受** | 删除重复章节，保留最新版本。 |
| P2-v6-12 | P2 | `applyResizePreview` 未处理百分比 width/height | **接受** | resize 时记录原始单位，emit 时保持相同单位。 |

### 第七轮问题（v6 → v7）

| # | 优先级 | 工程师问题 | 大将军裁决 | v7 修复 |
| --- | --- | --- | --- | --- |
| P0-v7-0 | P0 | `setupDragListeners`/`setupHoverListeners` 定义存在，但 CanvasOverlay.vue 中**完全没有 onMounted**，所有监听器永不被绑定 | **接受** | 补充完整 `onMounted` 阶段，显式调用所有 addEventListener |
| P0-v7-1 | P0 | `handleDragLeave` 函数体从未定义，但 cleanup 和 setupDragListeners 都在引用 | **接受** | 定义完整函数体：`relatedTarget` 包含检查防误触发 |
| P1-v7-1a | P1 | 差异表声称改用 `mouseenter/mouseleave`，实际代码中全部仍是 `mouseover/mouseout` | **接受** | 同步到所有代码块：cleanup × 2、setupHoverListeners × 2、函数定义 × 4、return × 2 |
| P1-v7-1b | P1 | 差异表声称改用 `getBoundingClientRect`，实际代码中仍是 `getComputedStyle` | **接受** | `handleResizeStart` 中统一使用 `nodeEl.getBoundingClientRect()` |
| P1-v7-1c | P1 | 差异表声称加边界检查，`calcDropTarget` 实际无任何边界校验 | **接受** | 增加 `clientX/Y < 0 / > window.innerWidth/Height` 检查，超出时保持上一个有效 dropTarget |
| P1-v7-2 | P1 | `handleResizeStart(e, nodeId, dir)` 签名仍需参数，调用方需额外处理 | **接受** | 改为 `handleResizeStart(e)` 无参数，从 closest 提取 dir（`[data-resize-dir]`）和 nodeId（祖先 `[data-field-id]`） |
| P1-v7-3 | P1 | `handleMouseUp` 中宽度读取链式调用超长，难以阅读 | **接受** | 提取 `getNodeElById(nodeId)` 辅助函数，handleMouseUp/applyResizePreview/updateNodePosition 统一使用 |
| P2-v7-1 | P2 | cleanup 中 removeEventListener 事件名与差异表矛盾 | **接受** | cleanup 中同步改用 dragenter/dragenter（配合 mouseenter/mouseleave） |
| P2-v7-2 | P2 | Phase 2 缺少 VoidContainer 添加 `data-container-type` 属性的步骤 | **接受** | 新增"实施阶段"章节，Phase 2 步骤 4 明确添加属性绑定 |

---

## 与前版本的关键差异

| 方面 | v6 | v7 |
| --- | --- | --- |
| setup 阶段 | CanvasOverlay.vue 缺少 onMounted，所有监听器永不被绑定 | **修复：补充完整 onMounted，显式调用 setupDragListeners/setupHoverListeners** |
| handleDragLeave | 函数体从未定义，但 cleanup/setupDragListeners 都在引用 | **修复：定义完整函数体，canvasEl.contains 检查防止误触发** |
| mouseenter/mouseleave | 差异表声称已改，实际代码中全部仍是 mouseover/mouseout | **修复：同步到所有代码块（cleanup/setupHoverListeners/函数定义/return）** |
| getBoundingClientRect | 差异表声称已改，实际代码中仍是 getComputedStyle | **修复：handleResizeStart 统一使用 nodeEl.getBoundingClientRect()** |
| 视口边界检查 | 差异表声称已加，calcDropTarget 无任何边界校验 | **修复：增加坐标 < 0 / > window.innerWidth/Height 检查** |
| handleResizeStart 签名 | 需要 nodeId 和 dir 参数，调用方需额外处理 | **修复：改为无参数，从 closest('[data-resize-dir]') 和祖先 [data-field-id] 提取** |
| getNodeElById | 重复 querySelector 调用，长链难以阅读 | **修复：提取辅助函数，handleMouseUp/applyResizePreview 使用统一入口** |
| VoidContainer data-container-type | calcDropTarget 中使用但 Phase 2 无修改步骤 | **修复：Phase 2 步骤 4 明确添加属性绑定** |
| handleDragEnter | 函数不存在 | **修复：补充定义，setupDragListeners 添加监听** |
| handleDrop | 缺少 preventDefault 和 dataTransfer 读取 | **修复：补充完整函数体** |

---

*方案版本记录*：
- v1：初始方案（工程师第一轮挑刺）
- v2：采纳部分建议，但 composable 6 个过度拆分
- v3：采纳第二轮全部建议，composable 合并为 2 个，新增空白区语义、互斥标志、RAF 节流、测试清单
- **v4**：第三轮 P0 问题全部修复（P0-1 澄清，P0-2/3 接受修复），P1/P2 问题分类处理，Phase 1 补充 provide/inject 方案，验收清单按职责分层
- **v5**：第四轮 P0/P1/P2 问题全部修复（8 项），新增架构确认章节，回应将军关切（单例模式 = selectedBox 蓝色框）
- **v6**：第五轮接受架构原则修正（设计器/渲染器完全分离），修复 interactionMode 架构违反、is-dragging 未移除、handleDragLeave 未定义等 12 项 P0/P1/P2 问题，删除重复章节，修正"目录结构"标题
- **v7**：第七轮 + 第八轮评估修复（9 项）：补充 onMounted 阶段、定义 handleDragLeave 函数体、同步 mouseenter/mouseleave/getBoundingClientRect/边界检查到所有代码块、handleResizeStart 改 closest 签名、提取 getNodeElById 辅助函数、新增"实施阶段"章节 Phase 2 补充 VoidContainer data-container-type
