# FreeLayout 完整交互整合计划

## 背景

FEATURE_CHECKLIST.md 中 FreeLayout 完整交互（拖拽移动 + 8方向缩放）标记为中优先级。deskclaw 已调研方案可直接实现。

## 当前代码问题分析

### 问题诊断：双层职责冲突

FreeCanvas（交互层）和 FreeLayout（渲染层）各有一套 drag/resize 逻辑，互相干扰：

| 文件 | 职责 | 问题 |
|---|---|---|
| FreeCanvas.vue | overlay-item 叠加层 + drag/resize + emit schema 更新 | 已有完整交互逻辑 |
| FreeLayout.vue | 渲染节点 + drag/resize + emit schema 更新 | 与 FreeCanvas 重复，且导致 re-render |

**冲突根因**：FreeLayout 在 designMode 时仍处理 drag/resize，同时 FreeCanvas 也在处理。FreeLayout emit 会触发 schema 更新 → FreeLayout re-render → 覆盖 FreeCanvas 的 DOM 操作。

## 整合方案

### 职责划分

| 组件 | 职责 |
|---|---|
| **FreeCanvas** | 唯一交互层：overlay-item + drag/resize + ResizeObserver 追踪实际 DOM |
| **FreeLayout** | 纯渲染层：designMode 时禁用 drag/resize，只渲染节点 |

### 整合步骤

### 步骤 1：FreeLayout 禁用设计器内的 drag/resize

在 FreeLayout 中注入 `designerEngine`，检测到时跳过交互逻辑：

```ts
const designerEngine: any = inject('designerEngine', null)
const isDesignMode = computed(() => !!designerEngine)

// designMode 时直接 return，不处理 drag/resize
function handleNodeMouseDown(nodeId: string, e: MouseEvent): void {
  if (isDesignMode.value) return
  // ...原有交互逻辑
}
```

同时设计模式时：
- `.lowcode-free-node` 的 `cursor: move` 移除（FreeCanvas overlay-item 处理）
- `.resize-handle` 移除（FreeCanvas overlay-item 处理）
- 直接在根 div 上加 `pointer-events: none`（FreeCanvas 的 overlay-item 覆盖层处理交互）

### 步骤 2：FreeCanvas 用 ResizeObserver 追踪实际 DOM 位置

```ts
onMounted(() => {
  if (!props.canvasEl) return

  // 观察 canvasEl 下所有带 data-field-id 的节点
  const observer = new ResizeObserver((entries) => {
    entries.forEach(entry => {
      const nodeId = (entry.target as HTMLElement).dataset.fieldId
      if (!nodeId || nodeId !== props.selectedNodeId) return

      // 同步 overlay-item 位置到实际 DOM 位置
      const rect = entry.target.getBoundingClientRect()
      const canvasRect = props.canvasEl.getBoundingClientRect()
      
      // 仅当拖拽/缩放结束时触发同步
      // 拖拽中只更新 DOM，mouseup 时才更新 schema
    })
  })

  // 观察当前选中节点
  watch(selectedNodeId, (newId) => {
    // 取消旧节点观察，开始新节点观察
  }, { immediate: true })
})
```

### 步骤 3：拖拽期间禁用 schema 响应式更新

mouseDown 时标记 `isDragging.value = true`，此期间 `emit('update-node-position')` 用 debounce（100ms）。

mouseUp 时立即 emit 最终位置，同步到 schema，触发 re-render → ResizeObserver 同步。

### 步骤 4：LowcodeDesigner.vue

- `handleUpdateNodePosition` / `handleUpdateNodeSize` 添加 saveSnapshot（drag 结束后保存快照）
- 拖拽开始时 `engine.saveSnapshot()`，结束时 history 自动记录

## 预期效果

- 拖拽流畅：drag 期间 FreeLayout 不 re-render，overlay-item 跟随鼠标
- 缩放精准：8 个手柄完整可用
- 代码简洁：交互逻辑只在 FreeCanvas 一处
- 无重复代码：FreeLayout 保留渲染逻辑，移除交互逻辑

## 验证计划

1. 切换到自由布局，拖拽 Input 组件，验证位置正确更新
2. 选中节点，拖拽 8 个缩放手柄，验证宽高正确更新
3. Ctrl+Z 撤销，验证位置/尺寸回退
4. 导入之前导出的 Schema，验证位置/尺寸正确恢复
