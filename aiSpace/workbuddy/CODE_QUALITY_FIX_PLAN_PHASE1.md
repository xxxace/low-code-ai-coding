# Phase 1 代码质检修复工作计划

**目标：** 修复质检报告中的 9 项 P0/P1 问题（21 项 P2 分 3 批附带处理）  
**原则：** 文件聚类减少上下文切换；每轮完成后跑 vitest + vue-tsc 验证；不在中途引入新问题  
**文件范围：**

```
prototype/src/designer/
├── LowcodeDesigner.vue
├── CanvasOverlay.vue
├── FieldProperties.vue
├── useDragInteraction.ts
└── useMaterialDrag.ts
```

---

## 批次说明

| 批次 | 内容 | 优先级 | 涉及文件 |
|---|---|---|---|
| **Batch 1** | 核心功能正确性（P0 + 关联 Bug） | P0/P1 | LowcodeDesigner.vue, useDragInteraction.ts |
| **Batch 2** | P1 收尾 + 关联健壮性 | P1 | CanvasOverlay.vue, useMaterialDrag.ts, FieldProperties.vue |
| **Batch 3A | 死代码/无用代码清理 | P2 | CanvasOverlay.vue, LowcodeDesigner.vue |
| **Batch 3B | 类型安全 + 硬编码 | P2 | FieldProperties.vue, useDragInteraction.ts |
| **Batch 3C | 边界健壮性 | P2 | useDragInteraction.ts |

---

## Batch 1 — 核心功能正确性

### 文件依赖关系

```
LowcodeDesigner.vue (B-02)
       ↓（B-04 guard 改后，才修 R-01，否则冲突）
useDragInteraction.ts (B-01, B-04, A-02)
       ↓（无依赖）
```

**验证点：** 每修改完一个文件 → `npx vue-tsc --noEmit` → 无错误才继续

---

### Task 1: B-02 — 页面布局切换产生历史快照（P0）

**文件：** `prototype/src/designer/LowcodeDesigner.vue`

**现状（第 265-271 行）：**
```typescript
set: (type) => {
  if (!engine.schema.value) return;
  engine.schema.value['x-position-type'] = type as 'relative' | 'absolute';
  // ← 没有调用 saveSnapshot()
},
```

**🔴 修正（经大将军核实）：**
原计划写 `engine.history.saveSnapshot('...')` 是**致命错误**——`history` 是 designerEngine 内部闭包变量，**不对外暴露**。`saveSnapshot()` 是直接在 engine 上暴露的方法，且不接受参数。

**操作：**
在 `engine.schema.value['x-position-type'] = ...` 之后，添加一行：
```typescript
engine.saveSnapshot();  // ← 直接调用，不带参数；不接受 description 参数
```

**验证：**
- [ ] `npx vue-tsc --noEmit` → 0 errors

---

### Task 2: B-01 — DnD `data` 变量消费（useDragInteraction.ts）

**文件：** `prototype/src/designer/composables/useDragInteraction.ts`，第 380-389 行

**现状：** `const data = e.dataTransfer?.getData('text/plain')` 声明后从未使用

**操作：** 在 `handleDrop` 函数中，将 DnD 分支的 payload 读取改为：

```typescript
// 原有分支判断：if (action === 'sort-relative' || action === 'move-absolute') { ... }
// 在该分支内，找到 const data = e.dataTransfer?.getData('text/plain') 这一行
// 改为：
const data = e.dataTransfer?.getData('material')
```

⚠️ **注意：** `material` 是 `useMaterialDrag.ts` 中 `setData('material', ...)` 的 key，不是 `'text/plain'`。这个不一致是 B-01 的核心问题——改为正确的 key 即可消费物料数据。

**验证：**
- [ ] `npx vue-tsc --noEmit` → 0 errors

---

### Task 3: B-04 — guard 条件修复（useDragInteraction.ts）

**文件：** `prototype/src/designer/composables/useDragInteraction.ts`，第 193-196 行

**现状：**
```typescript
if (!isAbsolute && nodeId !== selectedNodeId.value && !isDirectClick) {
  e.stopPropagation()
  return
}
```

**问题分析：**
点击已选中的流式节点内部子元素时，`!isDirectClick = true`，导致 `nodeId !== selectedNodeId` 的条件下条件为 `F`，意外启动 sort 拖拽。`selectedNodeId` 不应该干扰"是否启动拖拽"的判断。

**操作：** 改为：
```typescript
if (!isAbsolute && !isDirectClick) {
  e.stopPropagation()
  return
}
```

✅ **大将军核实说明：** 此修改引入的是**标准 UX 模式**（Figma/Sketch 等工具均如此：第一次点击选中，第二次点击才进入编辑/拖拽），无需额外 UX 说明。absolute 节点不受影响（`!isAbsolute = false`），保持原有行为。

**验证：**
- [ ] `npx vue-tsc --noEmit` → 0 errors

---

### Task 4: A-02 — emit 类型安全化（useDragInteraction.ts）

**文件：** `prototype/src/designer/composables/useDragInteraction.ts`

**现状：** `emit: (event: any, ...args: any[]) => void`

**🔴 修正（经大将军核实）：**
原计划的"方案 A"（`DragEmits['emit'] extends ...`）会编译失败，因为 `DragEmits` 接口中没有 key 叫 `'emit'`。方案 B（`Parameters<DragEmits[K]>`）**可行**。

**操作步骤：**

1. **定义 DragEmits 接口**（在 `useDragInteraction.ts` 顶部，与其他类型放一起）：
```typescript
export interface DragEmits {
  'select-node': (nodeId: string) => void
  'field-drop': (data: { containerId: string; afterNodeId: string | null; schema: FieldSchema }) => void
  'field-drop-complete': (data: { action: DropAction; dropNodeId: string; targetId: string | null; targetContainerId?: string }) => void
  'container-node-selected': (nodeId: string) => void
}
```

2. **修改 emit 参数类型（方案 B — 推荐）：**
```typescript
// 原来的 emit 参数声明
emit: (event: any, ...args: any[]) => void
// 改为：
emit: <K extends keyof DragEmits>(...args: Parameters<DragEmits[K]>): void
```

调用时 `emit('select-node', nodeId)` 会自动类型检查。

**验证：**
- [ ] `npx vue-tsc --noEmit` → 0 errors

---

### Batch 1 节点验证

执行完 Task 1-4 后，运行：

```bash
cd d:/ai/low-code-ai-coding/aiSpace/prototype && npx vue-tsc --noEmit && npx vitest run
```

预期：TypeScript 0 errors + vitest 全通过。

---

## Batch 2 — P1 收尾 + 关联健壮性

**前置条件：** Batch 1 全部通过

### Task 5: R-03 + S-03 — 默认值 falsy 过滤 + 类型转换（FieldProperties.vue）

**文件：** `prototype/src/designer/FieldProperties.vue`

这两个是**同一个问题的两面**，一起修复效率最高：
- R-03：`default: form.defaultValue || undefined` 用 `||` 错误地过滤了 falsy 值
- S-03：`form.defaultValue` 始终是字符串，写入 schema 时无类型转换

**操作：** 找到 `emitUpdate` 函数（报告说在第 500-505 行附近），将默认值处理改为：

```typescript
// 替换原来：
default: form.defaultValue || undefined

// 改为（两行都要改，参考 R-03 和 S-03 的描述找准位置）：
default: form.defaultValue !== '' && form.defaultValue !== undefined
  ? (form.type === 'number' || form.type === 'boolean'
      ? (form.type === 'number' ? Number(form.defaultValue) : form.defaultValue === 'true')
      : form.defaultValue)
  : undefined
```

✅ **已确认（经大将军核实）：** `form.type` 在 FieldProperties.vue 第 489 行有明确赋值 `form.type = schema.type ?? "string"`，来源可靠，直接使用无需额外确认。

**核心原则：** `0`、`false`、`'0'`、`'false'` 不应被清空，用显式空字符串判断代替 `||`。

**验证：**
- [ ] `npx vue-tsc --noEmit` → 0 errors

---

### Task 6: R-08 — canvasEl 切换时监听器泄漏（CanvasOverlay.vue）

**文件：** `prototype/src/designer/CanvasOverlay.vue`，第 465-475 行

**现状：**
```typescript
watch(
  () => props.canvasEl,
  (newEl) => {
    cleanupNodeOverlay()      // cleanup 从 canvasEl.value 移除，但此时已是新值
    cleanupDrag()            // 旧值监听器无法被清理
    if (newEl) { ... }
  }
)
```

**操作：** 保存旧值引用后再清理：

```typescript
watch(
  () => props.canvasEl,
  (newEl, oldEl) => {
    if (oldEl) {
      // 对旧 canvasEl 做 cleanup
      cleanupNodeOverlay()   // 将这些函数改为接受 el 参数版本，或
      cleanupDrag()          // 先拿到当前引用的 canvasEl 再切换
    }
    canvasEl.value = newEl   // 更新 ref（如果有 canvasEl ref 的话）
    if (newEl) { ... }
  }
)
```

⚠️ **注意：**
- 需要先读代码确认 `cleanupNodeOverlay` 和 `cleanupDrag` 是否接受参数，以及 `canvasEl` 是否是一个 ref
- 如果这两个 cleanup 函数是从 `useNodeOverlay` / `useDragInteraction` 返回的，需要先读这两个函数确认签名
- 如果无法改成接受参数，需要另辟蹊径（如在 `onUnmounted` 中记录所有 canvasEl 并清理，或用 WeakMap）

**验证：**
- [ ] `npx vue-tsc --noEmit` → 0 errors

---

### Task 7: S-05 — resize RAF 每帧重建 DOM（CanvasOverlay.vue）

**文件：** `prototype/src/designer/CanvasOverlay.vue`

**现状：** RAF 循环中 `liveResizeVersion.value++`，selectedBox 的 `:key` 每帧变化，每帧重建 8 个 resize handle。

**🔴 修正（经大将军核实）：**
原计划写 `selectedBox.value.style.left = ...`——但 `selectedBox` **不是 HTMLElement ref**，模板中的 selectedBox div（`class="canvas-overlay__selected-box"`）**没有 `ref=` 绑定**。需要先加 ref。

**操作（两步骤）：**

**Step 1：** 给 selectedBox div 加 ref 绑定（模板第 30 行附近）：
```vue
<!-- 原来：-->
<div
  v-if="selectedNodeId && !isDraggingNode"
  :key="`selected-${selectedNodeId}-${styleVersion}-${liveResizeVersion}`"

<!-- 改为：-->
<div
  ref="selectedBoxRef"
  v-if="selectedNodeId && !isDraggingNode"
  :key="`selected-${selectedNodeId}-${styleVersion}`"  <!-- 移除 liveResizeVersion -->
```

**Step 2：** 在 script 中声明 ref（第 135 行附近，与 `draggingBoxRef` 并列）：
```typescript
const selectedBoxRef = ref<HTMLElement | null>(null)
```

**Step 3：** 修改 RAF 循环（找到 `liveResizeVersion.value++` 的位置，在 `setupResizeListeners` 回调内）：
```typescript
// 删除 liveResizeVersion.value++
// 改为直接操作 DOM：
if (selectedBoxRef.value) {
  selectedBoxRef.value.style.left = `${currentX.value}px`
  selectedBoxRef.value.style.top = `${currentY.value}px`
  selectedBoxRef.value.style.width = `${currentWidth.value}px`
  selectedBoxRef.value.style.height = `${currentHeight.value}px`
}
```

⚠️ **注意：**
- 模板中的 `:key` 也要同步移除 `liveResizeVersion`，否则 key 仍然每帧变化，DOM 重建不停止
- resize 结束后 selectedBox 由 Vue reactive 接管（通过 `getSelectedStyle`），RAF 循环只负责 resize 期间的实时同步

**验证：**
- [ ] `npx vue-tsc --noEmit` → 0 errors

---

### Task 8: R-04 — absolute 节点拖入不考虑 canvas scroll offset（useMaterialDrag.ts）

**文件：** `prototype/src/designer/composables/useMaterialDrag.ts`，第 96-98 行

**现状：** `getBoundingClientRect()` 返回视口坐标，若画布容器有滚动，拖入节点位置会偏移。

**⚠️ 高度不确定（经大将军核实）：**
此问题需要先验证。`getBoundingClientRect()` 每次都返回**当前**相对于视口的坐标，`clientX - rect.left` 本身就是当前时刻的正确局部坐标。scroll offset 的影响已隐含在 rect 的返回值中。

**但如果 canvasRef（.canvas-container）本身在父容器内滚动（不是自身 overflow，而是父容器 .lowcode-designer__canvas 滚动），则 rect 仍会随滚动改变，此时不需要加 scroll offset。**

原计划的 `+ scrollLeft` 方向也可能不对。

**操作（先验证再决定）：**

**Step 1（必须）：** 在浏览器里测试：
1. 打开一个有大量字段的 schema
2. 滚动画布（往下滑）
3. 从物料面板拖入一个新字段到画布可见区域
4. 观察 drop 位置是否偏移

**Step 2（根据 Step 1 结果）：**

**如果确实偏移：** 说明 canvasRef 的 rect 没有随滚动正确更新，此时修复方向是：从有滚动条的父容器获取 scroll offset，然后用**减去**（不是加上）scroll offset：
```typescript
const parent = canvasRef.parentElement  // .lowcode-designer__canvas
const scrollLeft = parent?.scrollLeft ?? 0
const scrollTop = parent?.scrollTop ?? 0
const x = Math.round(Math.max(0, e.clientX - rect.left - 60 - scrollLeft))
const y = Math.round(Math.max(0, e.clientY - rect.top - 16 - scrollTop))
```

**如果验证后不偏移：** 说明原代码本身是对的，无需修改。

**验证：**
- [ ] 浏览器验证通过（或确认原代码正确）
- [ ] `npx vue-tsc --noEmit` → 0 errors（如果有改动）

---

### Batch 2 节点验证

```bash
cd d:/ai/low-code-ai-coding/aiSpace/prototype && npx vue-tsc --noEmit && npx vitest run
```

预期：TypeScript 0 errors + vitest 全通过。

---

## Batch 3 — P2 分批清理

### Batch 3A — 死代码/无用代码清理

**前置条件：** Batch 1 + Batch 2 全部通过

| # | 操作 | 文件 | 行 |
|---|---|---|---|
| B-07 | 删除空 watch | CanvasOverlay.vue | 481-489 |
| S-04 | 删除 `void allContainers.value` | CanvasOverlay.vue | ~547 |
| A-04 | 删除 `handleMoveAcrossContainers` 函数声明 | LowcodeDesigner.vue | |
| A-05 | 删除/注释 `setTimeout` 中无效的 `getSelectedStyle` 调用 | CanvasOverlay.vue | 512-526 |
| S-07 | 删除 `'show-container-dropzone'` 死分支 | LowcodeDesigner.vue | `handleDropComplete` 中 |
| A-06 | 移除 `calcDropTarget` 从 return 对象暴露 | useDragInteraction.ts | return 对象 |

⚠️ **注意：**
- A-04 删除函数后，确认没有其他地方引用 `handleMoveAcrossContainers`（如模板中、事件绑定中）
- S-07 在 `handleDropComplete` 中找到包含 `'show-container-dropzone'` 的分支，删除该分支

**验证：** `npx vue-tsc --noEmit` → 0 errors

---

### Batch 3B — 类型安全 + 硬编码优化

**前置条件：** Batch 1 + Batch 2 全部通过

| # | 操作 | 文件 | 说明 |
|---|---|---|---|
| A-03 | hasPlaceholder 改为从 registry 获取 | FieldProperties.vue | `widgetMeta` 中读 `hasPlaceholder` |
| R-09 | 删除 `generateSchemaId` 重复实现 | LowcodeDesigner.vue | 改用 `engine.generateNodeId()` |

⚠️ **注意：**
- A-03：需要先读 `ComponentRegistry` 的 `widgetMeta` 类型，确认 `hasPlaceholder` 字段是否存在以及类型。如果字段不存在，需在 registry 定义中添加，而不是在 FieldProperties 里硬编码白名单。
- R-09：确认 `engine.generateNodeId` 的签名与 `generateSchemaId` 完全兼容后再替换。

**验证：** `npx vue-tsc --noEmit` → 0 errors

---

### Batch 3C — 边界健壮性

**前置条件：** Batch 1 + Batch 2 全部通过

| # | 操作 | 文件 | 说明 |
|---|---|---|---|
| R-01 | 视口边界用 `clientWidth/clientHeight` | useDragInteraction.ts | `window.innerWidth` → `document.documentElement.clientWidth` |
| R-02 | finalWidth/finalHeight 加上 `Math.max(40, w)` 约束 | useDragInteraction.ts | `handleMouseUp` 中 |
| R-05 | 导入警告加 UI 提示（可选，console 保留） | LowcodeDesigner.vue | 低优先级，可跳过 |
| R-06 | `URL.revokeObjectURL` 移到 `a.addEventListener('load', ...)` 内 | LowcodeDesigner.vue | 低优先级 |
| R-07 | `handleMouseUp` 竞争状态：加 `isProcessing` 标志 | useDragInteraction.ts | 低优先级，理论风险 |
| B-05 | `componentPropsForm` 同步用 `structuredClone` 断引用 | FieldProperties.vue | 深层复制避免引用穿透 |
| S-02 | `absolute→relative` 时清除 `x-position` | FieldProperties.vue | `handlePositionTypeChange` 中 |

⚠️ **注意：**
- R-01：注意是 `document.documentElement.clientWidth`（不含滚动条），不是 `window.innerWidth`
- B-05：`structuredClone` 是浏览器内置 API，Vue 3 兼容，无 polyfill 依赖
- S-02：在 `handlePositionTypeChange` 中，切换到 relative 时删除 `schema['x-position']`

**验证：** `npx vue-tsc --noEmit` → 0 errors

---

## 附录：不在此计划范围的事项

以下问题超出本次范围，建议后续评估：

1. **z-index 层叠关系**（附录第 2 条）：`canvas-overlay` 与 `FormRenderer` 的层叠上下文关系，需要 isolation 评估
2. **HistoryManager 容量限制**（附录第 3 条）：最大快照数量限制未确认
3. **跨容器 sort 正确性**（附录第 1 条）：`moveNodeAcrossContainers` 后 `sortNodesInSchema` 的正确性需要测试用例
4. **S-08（rafId 命名不一致）**：Phase 3 CanvasOverlay 重构时统一处理
5. **A-01（CanvasOverlay 代码结构）**：Phase 3 重构时整理注释顺序

---

## 执行顺序

```
Batch 1 → [验证] → Batch 2 → [验证] → Batch 3A → [验证] → Batch 3B → [验证] → Batch 3C → [验证]
```

每轮验证命令：
```bash
cd d:/ai/low-code-ai-coding/aiSpace/prototype && npx vue-tsc --noEmit && npx vitest run
```

---

*计划版本：v1.1 | 2026-04-12 | 经大将军逐条核实修正 v1.0 后生成 | 修正：Task 1 方法名、Task 4 emit写法、Task 5 确认、Task 7 selectedBox ref、Task 8 先验证*
