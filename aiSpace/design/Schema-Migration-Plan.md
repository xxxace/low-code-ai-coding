# Step 5: Schema 迁移方案 — layoutMode → x-position-type

> **Goal**: 消除 `layoutMode` 全局开关和 `x-free-position` 旧版字段，统一到 `x-position-type` + `x-position` 新架构。

## 架构变更说明

**旧架构**（layoutMode 全局开关）：
```
layoutMode: 'flow' | 'free'  ← 全局开关，影响所有新增节点
x-free-position: {x, y, width, height}  ← 旧版自由定位字段
```

**新架构**（节点独立决定）：
```
x-position-type: 'relative' | 'absolute'  ← 每个节点独立决定
x-position: {x, y, width, height, zIndex}  ← 新版自由定位字段
```

**关键变化**：
- `LowcodeDesigner.vue` 的工具栏"流式/自由"切换 → 改写 `currentSchema['x-position-type']`（影响新增节点的默认值）
- `Designer.vue`（旧组件）+ `FreeLayout.vue` + `FreeCanvas.vue` + `PropertyPanel.vue` → 删除（已废弃）
- `core/schema.ts` → 删除 `LayoutMode` 类型 + `FreePosition` 类型 + `layoutMode` 默认值
- `DesignOverlay.vue` 的 `isFreeLayout` → 改为判断 `schema['x-position-type'] === 'absolute'`

---

## 关键发现

**LowcodeDesigner.vue 的属性面板**：用的是 `FieldProperties.vue` + `PageProperties.vue`，**没有引用** `PropertyPanel.vue`。

**Designer.vue（废弃）引用的文件**：完全是死代码。
- `PropertyPanel.vue` → 仅有 Designer.vue 引用 → **一起删除**
- `FreeCanvas.vue` → 仅有 Designer.vue 引用 → **一起删除**

**结论**：`PropertyPanel.vue` 的 `x-free-position` 面板是旧版遗留，当前 `FieldProperties.vue` 已有 `x-position`（新版）属性编辑，删除不影响任何功能。

---

## 文件变更总览

### 删除（4 个文件，全为废弃代码）

| 文件 | 理由 |
|------|------|
| `renderer/FreeLayout.vue` | 旧 Free 布局渲染器，XLayout 已替代 |
| `designer/FreeCanvas.vue` | 旧 Free 交互层，AbsoluteNodeOverlay 已替代 |
| `designer/Designer.vue` | 旧设计器主入口，LowcodeDesigner 已替代 |
| `designer/PropertyPanel.vue` | 旧属性面板，仅被 Designer.vue 引用；FieldProperties.vue 已替代 |

### 修改（10 个文件）

| 文件 | 变更 |
|------|------|
| `core/schema.ts` | 删除 LayoutMode / FreePosition 类型；删除 layoutMode 默认值 |
| `index.ts` | 删除 LayoutMode / FreeLayout 导出 |
| `designer/LowcodeDesigner.vue` | 工具栏切换改写 `schema['x-position-type']`；删除旧 layoutMode computed |
| `designer/DesignOverlay.vue` | `isFreeLayout` 改读 `schema['x-position-type']` |
| `designer/engine/designerEngine.ts` | 删除 layoutMode 默认值 |
| `designer/engine/schemaUtils.ts` | 删除 `updateNodeFreePosition` / `updateNodeFreeSize` 函数 |
| `designer/composables/useMaterialDrag.ts` | 更新注释 |
| `core/__tests__/FormModel.test.ts` | 删除 fixture 中的 layoutMode |
| `core/__tests__/ReactionsEngine.test.ts` | 删除 fixture 中的 layoutMode |
| `designer/engine/__tests__/HistoryManager.test.ts` | 删除 fixture 中的 layoutMode |
| `App.vue` | 删除 schema fixture 中的 layoutMode |

---

## 详细步骤

### Task 1: 删除废弃文件

**Step 1: 删除 4 个废弃文件**
```
renderer/FreeLayout.vue
designer/FreeCanvas.vue
designer/Designer.vue
designer/PropertyPanel.vue
```

---

### Task 2: 修改 LowcodeDesigner.vue

**文件**: `designer/LowcodeDesigner.vue`

**变更 1**：删除 `layoutMode` computed（第 252-260 行），替换为 `pagePositionType`

**删除**：
```typescript
const layoutMode = computed({
  get: () => currentSchema.value?.layoutMode ?? "flow",
  set: (mode) => {
    if (!engine.schema.value) return;
    const newSchema = JSON.parse(JSON.stringify(engine.schema.value));
    newSchema.layoutMode = mode;
    engine.loadSchema(newSchema);
  },
});
```

**替换为**：
```typescript
// 页面级布局模式，影响新增节点的默认定位类型
const pagePositionType = computed({
  get: () => (currentSchema.value?.['x-position-type'] as 'relative' | 'absolute') ?? 'relative',
  set: (type: 'relative' | 'absolute') => {
    if (!engine.schema.value) return;
    engine.updatePageProps({ 'x-position-type': type });
  },
});
```

**变更 2**：模板绑定（工具栏第 29 行）
```html
<!-- 修改前 -->
<el-radio-group v-model="layoutMode" size="small">

<!-- 修改后 -->
<el-radio-group v-model="pagePositionType" size="small">
```

**变更 3**：物料点击参数（第 71 行）
```typescript
// 修改前
@material-click="(m) => handleMaterialClick(m, layoutMode === 'free')"

// 修改后
@material-click="(m) => handleMaterialClick(m, pagePositionType === 'absolute')"
```

**变更 4**：Drop 参数（第 79 行）
```typescript
// 修改前
@drop="(e) => handleCanvasDrop(e, canvasRef, layoutMode === 'free')"

// 修改后
@drop="(e) => handleCanvasDrop(e, canvasRef, pagePositionType === 'absolute')"
```

**变更 5**：删除 import（第 189 行附近）
```typescript
// 删除
import type { LayoutMode } from '../types/schema'
```

---

### Task 3: 修改 DesignOverlay.vue

**文件**: `designer/DesignOverlay.vue`

**变更**：第 467-469 行的 `isFreeLayout` 改读 `x-position-type`

**修改前**：
```typescript
const isFreeLayout = computed(() => {
  return props.schema?.layoutMode === 'free'
})
```

**修改后**：
```typescript
const isFreeLayout = computed(() => {
  return (props.schema?.['x-position-type'] as string) === 'absolute'
})
```

---

### Task 4: 修改 core/schema.ts

**文件**: `core/schema.ts`

**变更 1**：删除 `LayoutMode` 类型定义
```typescript
export type LayoutMode = 'flow' | 'free'  // 删除此行
```

**变更 2**：删除 `FreePosition` 类型定义（整段）
```typescript
export interface FreePosition {
  x: number
  y: number
  width: number
  height: number
  zIndex?: number
  locked?: boolean
  rotate?: number
}
// 删除此块
```

**变更 3**：删除 `FieldSchema` 中的 `x-free-position` 字段
```typescript
'x-free-position'?: FreePosition  // 删除此行
```

**变更 4**：删除 PageSchema 中的 `layoutMode` 默认值
```typescript
layoutMode: LayoutMode  // 删除此行
```

---

### Task 5: 修改 index.ts

**文件**: `index.ts`

**删除 export**：
```typescript
LayoutMode,  // 删除
export { default as FreeLayout } from './renderer/FreeLayout.vue'  // 删除
```

---

### Task 6: 修改 designerEngine.ts

**文件**: `designer/engine/designerEngine.ts`

**删除 `createEmptySchema` 中的 `layoutMode` 默认值**：
```typescript
layoutMode: 'flow',  // 删除此行
```

**确认是否有 `updatePageProps` 方法**，如果没有则添加：
```typescript
function updatePageProps(updates: Partial<PageSchema>): void {
  if (!schema.value) return
  Object.assign(schema.value, updates)
  saveSnapshot()
}
```

---

### Task 7: 修改 schemaUtils.ts

**文件**: `designer/engine/schemaUtils.ts`

**删除 `updateNodeFreePosition` 函数**（约第 373-390 行）
**删除 `updateNodeFreeSize` 函数**（约第 397-415 行）

---

### Task 8: 修改 useMaterialDrag.ts

**文件**: `designer/composables/useMaterialDrag.ts`

**更新注释**（第 10-12 行）：
```typescript
// 修改前
// layoutMode 对新增节点的影响：
// - 'flow': x-position-type=relative, x-span=1
// - 'free': x-position-type=absolute, x-position={x,y,width,height}

// 修改后
// pagePositionType 对新增节点的影响：
// - 'relative'（flow）: x-position-type=relative, x-span=1
// - 'absolute'（free）: x-position-type=absolute, x-position={x,y,width,height}
```

---

### Task 9: 修改测试文件（4 个）

**`core/__tests__/FormModel.test.ts`**（约第 21 行）：
```typescript
// 删除 layoutMode: 'flow',
```

**`core/__tests__/ReactionsEngine.test.ts`**（约第 34 行）：
```typescript
// 删除 layoutMode: 'flow',
```

**`designer/engine/__tests__/HistoryManager.test.ts`**（约第 17 行）：
```typescript
// 删除 layoutMode: 'flow',
```

**`App.vue`**（约第 105 行）：
```typescript
// 删除 layoutMode: "flow",
```

---

## 验证步骤

1. `npx vue-tsc --noEmit` → 零错误
2. `npx vitest run` → 154 测试（可能有 2-3 个因 fixture 变更报错，同步修改）
3. `npx vite` → 开发服务器正常启动
4. **手动验证**：
   - 工具栏"流式/自由"切换正常
   - 新增节点时类型正确（flow 模式新增 relative 节点，free 模式新增 absolute 节点）
   - 预览模式下无 layoutMode 相关错误
   - 删除/复制节点正常
   - 拖拽排序正常

---

## 风险与回滚

| 风险 | 缓解 |
|------|------|
| 删除了 PropertyPanel.vue 但有未知引用 | 确认搜索结果：仅 Designer.vue 引用；LowcodeDesigner 用的是 FieldProperties |
| 测试 fixture 删除后测试失败 | 逐个文件修改，不要批量删除 |
| designerEngine 缺少 updatePageProps | 先检查现有方法，如无则添加 |

**回滚**：`git checkout <commit>` 即可恢复所有文件。
