---
name: resize-fix
overview: 修复 CanvasOverlay resize 功能的两大问题：selectedBox 延迟更新 + 释放后宽度缩小
todos:
  - id: fix-handle-mouse-up-order
    content: 修正 useDragInteraction.ts handleMouseUp 中 resize 模式的 emit/clearStyle 顺序
    status: completed
  - id: add-resize-raf-sync
    content: CanvasOverlay.vue 新增 resize RAF 同步逻辑和 liveResizeVersion 状态
    status: completed
  - id: update-selectedbox-key
    content: CanvasOverlay.vue selectedBox 的 :key 加入 liveResizeVersion
    status: completed
    dependencies:
      - add-resize-raf-sync
  - id: cleanup-resize-raf
    content: CanvasOverlay.vue onUnmounted 中清理 resizeSyncFrame
    status: completed
    dependencies:
      - add-resize-raf-sync
---

## 问题背景

CanvasOverlay 的 resize 功能存在两个问题：

1. resize 拖拽时，节点先更新，selectedBox 延迟更新
2. 当 selectedBox 和节点宽度一样时，释放后宽度会缩小

## 问题根因（已确认）

### 问题 1：selectedBox 延迟更新

**根因**：selectedBox 的 `:key` 绑定 `styleVersion`，只有 styleVersion 变化时 div 才会重建并重新调用 `getSelectedStyle()`。resize 期间 mousemove 修改的是节点的 `style.width/height`，但 `styleVersion` 不变，导致 selectedBox 不重新渲染。

**证据**：

- `CanvasOverlay.vue` 第32行：`:key="`selected-${selectedNodeId}-${styleVersion}`"`
- `useDragInteraction.ts` 第221-222行：resize 模式直接修改 DOM，但未触发 Vue 响应式更新

### 问题 2：释放后宽度缩小

**根因**：`useDragInteraction.ts` `handleMouseUp` 中 resize 模式的 emit/clearStyle 顺序与 move 模式相反：

```typescript
// resize 模式（错误）：先 emit 再清空
emit('update-node-size', ...)   // ① Vue 响应式开始
el.style.width = ''              // ② 覆盖了响应式值

// move 模式（正确）：先清空再 emit
el.style.left = ''               // ① 先清空
emit('update-node-position', ...) // ② Vue 响应式接管
```

**后果**：emit 后 el.style.width = '' 会覆盖 Vue 即将设置的响应式 width，导致 el 变成 CSS 默认宽度。

## 修复方案

### 策略

1. **最小改动原则**：只改必须改的，不引入 draggingBox 等额外概念
2. **一致性原则**：resize 模式的 handleMouseUp 顺序与 move 模式保持一致
3. **性能优先**：resize 期间使用 RAF 节流同步 selectedBox，避免每帧都触发 Vue 重新渲染

### 核心改动点

| 改动点 | 文件 | 说明 |
| --- | --- | --- |
| 1. handleMouseUp 顺序修正 | useDragInteraction.ts | resize 模式：先清空 style，再 emit |
| 2. resize RAF 同步 | CanvasOverlay.vue | 监听 isResizingNode 变化，启动/停止 RAF 循环同步 selectedBox |


## 技术方案

### 文件 1: useDragInteraction.ts

修正 `handleMouseUp` 中 resize 模式的执行顺序。

**改动位置**：第260-271行

**当前代码**：

```typescript
} else if (dragState.dragType === 'resize') {
  const el = getNodeElById(dragState.targetNodeId!)
  emit('update-node-size', dragState.targetNodeId!, {  // 错误：先 emit
    width: parseFloat(el?.style.width ?? String(dragState.startWidth)),
    height: parseFloat(el?.style.height ?? String(dragState.startHeight)),
  })
  if (el) {
    el.style.width = ''
    el.style.height = ''
    el.classList.remove('is-dragging')
  }
}
```

**修正后**：

```typescript
} else if (dragState.dragType === 'resize') {
  const el = getNodeElById(dragState.targetNodeId!)
  // 正确处理空字符串：parseFloat('') 返回 NaN，需兜底
  const rawWidth = el?.style.width ?? ''
  const rawHeight = el?.style.height ?? ''
  const finalWidth = rawWidth ? parseFloat(rawWidth) : dragState.startWidth
  const finalHeight = rawHeight ? parseFloat(rawHeight) : dragState.startHeight
  // 先清空内联样式（与 move 模式一致）
  if (el) {
    el.style.width = ''
    el.style.height = ''
    el.classList.remove('is-dragging')
  }
  // 再 emit，让 Vue 响应式接管
  emit('update-node-size', dragState.targetNodeId!, {
    width: finalWidth,
    height: finalHeight,
  })
}
```

### 文件 2: CanvasOverlay.vue

新增 resize 期间的 RAF 同步机制，实时更新 selectedBox。

**新增状态**（第130行附近）：

```typescript
const liveResizeVersion = ref(0)
let resizeSyncFrame: number | null = null

// 是否正在 resize（computed，基于 dragState）
const isResizingNode = computed(() =>
  dragState.isDragging && dragState.dragType === 'resize'
)
```

**新增 watch**（第260行附近，与 `isDraggingNode` watch 并列）：

```typescript
watch(
  () => isResizingNode.value,
  (resizing) => {
    if (resizing) {
      // 开始 resize：启动 RAF 循环同步 selectedBox
      const sync = () => {
        liveResizeVersion.value++
        resizeSyncFrame = requestAnimationFrame(sync)
      }
      resizeSyncFrame = requestAnimationFrame(sync)
    } else {
      // 结束 resize：停止 RAF
      if (resizeSyncFrame !== null) {
        cancelAnimationFrame(resizeSyncFrame)
        resizeSyncFrame = null
      }
    }
  }
)
```

**selectedBox 的 :key 加入 liveResizeVersion**（第32行）：

```
<div
  :key="`selected-${selectedNodeId}-${styleVersion}-${liveResizeVersion}`"
>
```

**cleanup 中清理 resizeSyncFrame**（第337-344行）：

```typescript
onUnmounted(() => {
  if (rafId !== null) { /* ... */ }
  if (resizeSyncFrame !== null) {
    cancelAnimationFrame(resizeSyncFrame)
    resizeSyncFrame = null
  }
  cleanupNodeOverlay()
  cleanupDrag()
})
```

### 性能考量

- RAF 同步比直接监听 mousemove 更高效（与现有 draggingBox 同步机制一致）
- selectedBox 的 div 重建由 `:key` 变化触发，Vue 会复用已有 DOM 节点
- resize 结束时 RAF 停止，不影响 idle 状态性能

### 向后兼容性

- 不改变任何 public API
- 不影响现有 move/sort/drag 功能
- 增量修改，风险可控