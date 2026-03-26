# 低代码设计器 Code Review 问题清单

**审查时间**: 2026-03-26
**审查范围**: `prototype/src/` 全部代码
**审查人**: Aiden (高级开发者)

---

## 问题总览

| 严重程度 | 数量 | 说明 |
|---------|------|------|
| 🔴 P0 - 严重 | 5 | 导致核心功能无法正常使用 |
| 🟠 P1 - 高 | 7 | 影响用户体验或存在潜在风险 |
| 🟡 P2 - 中 | 5 | 代码质量问题或可优化项 |
| 🟢 P3 - 低 | 3 | 建议改进项 |

---

## 🔴 P0 - 严重问题

### 1. Designer.vue 缺少 ComponentRegistry 注入

**文件**: `designer/Designer.vue`

**问题描述**:
- Designer.vue 中未将 ComponentRegistry 通过 provide 传递给子组件
- MaterialPalette、PropertyPanel 等组件依赖 ComponentRegistry，但无法获取
- 导致拖拽物料时无法获取正确的 Widget 元信息

**影响**: 物料面板、属性面板等核心功能失效

**修复方案**:
```typescript
// designer/Designer.vue 顶部添加
import { createDefaultRegistry, COMPONENT_REGISTRY_KEY } from '../types/componentRegistry'

// 在 setup() 中添加
const registry = createDefaultRegistry()
provide(COMPONENT_REGISTRY_KEY, registry)
```

---

### 2. FormRenderer.vue 同样缺少 ComponentRegistry 注入

**文件**: `renderer/FormRenderer.vue`

**问题描述**:
- FormRenderer 作为表单根渲染器，需要将 ComponentRegistry 提供给 FieldRenderer
- 当前代码中未注入，导致 FieldRenderer 无法解析 Widget 组件

**影响**: 表单预览功能完全失效，所有字段无法渲染

**修复方案**:
```typescript
// renderer/FormRenderer.vue 中添加
import { createDefaultRegistry, COMPONENT_REGISTRY_KEY } from '../types/componentRegistry'

// 在 setup() 中添加
const registry = createDefaultRegistry()
provide(COMPONENT_REGISTRY_KEY, registry)
```

---

### 3. Designer.vue 中 schema 不是响应式对象

**文件**: `designer/designerEngine.ts` 第 70 行

**问题描述**:
```typescript
const schema = ref<PageSchema | null>(null)
```
- `loadSchema()` 函数中使用了 `JSON.parse(JSON.stringify(schema.value))` 深拷贝
- 但在 Designer.vue 第 94 行使用了 `v-if="schema"` 判断
- 在 PropertyPanel.vue 第 236 行，watch 了 `selectedSchema` 的变化

**影响**:
- Schema 的变化可能不会触发视图更新
- 历史记录的撤销/重做可能无法正确更新 UI

**修复方案**:
确保 Designer.vue 中的 `schema` 引用是从 designerEngine 中正确获取的响应式对象：
```typescript
// designer/Designer.vue 中
const { schema, selectedNodeId, ... } = useDesignerEngine()
```

---

### 4. FlowLayout.vue 缺少 formModel 依赖检查

**文件**: `renderer/FlowLayout.vue`

**问题描述**:
- 组件直接使用 `props.formModel` 但没有验证它是否存在
- 如果 formModel 为 null/undefined，会导致运行时错误

**影响**: 表单渲染可能报错，导致整个设计器崩溃

**修复方案**:
```vue
<template>
  <div v-if="formModel" class="lowcode-flow-layout" :style="gridStyle">
    <!-- 渲染逻辑 -->
  </div>
  <div v-else class="lowcode-flow-layout--error">
    formModel 未初始化
  </div>
</template>
```

---

### 5. PropertyPanel.vue 中缺少 schema 同步错误处理

**文件**: `designer/PropertyPanel.vue` 第 236-249 行

**问题描述**:
```typescript
watch(
  () => props.selectedSchema,
  (newSchema) => {
    if (newSchema) {
      localSchema.value = JSON.parse(JSON.stringify(newSchema))
      // 提取组件属性
      const props = newSchema['x-component-props'] ?? {}
      componentProps.placeholder = props.placeholder ?? ''
      // ...
    }
  }
)
```
- 当 `selectedSchema` 为 null 时，localSchema 保持初始值（空对象）
- 后续的 `onChange()` 调用会修改这个空对象的属性

**影响**: 选中不同字段时，属性面板可能显示错误的数据，或者修改未生效

**修复方案**:
```typescript
watch(
  () => props.selectedSchema,
  (newSchema) => {
    if (newSchema) {
      localSchema.value = JSON.parse(JSON.stringify(newSchema))
      const cp = newSchema['x-component-props'] ?? {}
      componentProps.placeholder = cp.placeholder ?? ''
      componentProps.disabled = cp.disabled ?? false
      componentProps.readonly = cp.readonly ?? false
    } else {
      localSchema.value = {} as FieldSchema
    }
  },
  { immediate: true, deep: true }
)
```

---

## 🟠 P1 - 高优先级问题

### 6. MaterialPalette.vue 物料定义未使用 ComponentRegistry

**文件**: `designer/MaterialPalette.vue`

**问题描述**:
- MaterialPalette 内置了物料列表 (builtinMaterials)
- ComponentRegistry 中也注册了相同的物料
- 两份数据不同步，可能导致物料面板和实际注册的组件不一致

**影响**: 
- 物料面板显示的物料可能和实际可用的组件不一致
- 拖拽物料到画布后，组件可能无法正确渲染

**修复方案**:
```typescript
// designer/MaterialPalette.vue
const registry = useComponentRegistry()

const filteredCategories = computed(() => {
  const keyword = searchKeyword.value.toLowerCase()
  const metas = registry.getAllWidgetMetas()

  // 按 category 分组
  const grouped: Record<string, WidgetMeta[]> = {}
  for (const meta of metas) {
    if (keyword && !meta.label.toLowerCase().includes(keyword)) continue
    if (!grouped[meta.category]) {
      grouped[meta.category] = []
    }
    grouped[meta.category].push(meta)
  }

  return Object.entries(grouped).map(([name, materials]) => ({
    name,
    label: getCategoryLabel(name),
    materials,
  }))
})

function getCategoryLabel(name: string): string {
  const labels: Record<string, string> = {
    basic: '基础组件',
    container: '容器组件',
    select: '选择组件',
    date: '日期时间',
    advanced: '高级组件',
  }
  return labels[name] ?? name
}
```

---

### 7. FieldRenderer.vue 中 formRendererCtx inject 可能失败

**文件**: `renderer/FieldRenderer.vue` 第 176-178 行

**问题描述**:
```typescript
const formRendererCtx = inject<{
  onFieldChange: (path: string, value: any) => void
}>('formRenderer')
```
- 如果在非 FormRenderer 环境中使用 FieldRenderer，inject 会返回 undefined
- 后续的 `formRendererCtx?.onFieldChange()` 调用不会有任何效果

**影响**: 字段值变化可能不会通知到父组件，联动效果可能失效

**修复方案**:
```typescript
const formRendererCtx = inject<{
  onFieldChange: (path: string, value: any) => void
}>('formRenderer', {
  // 提供默认值
  onFieldChange: () => {},
})
```

---

### 8. Designer.vue 中 previewFormModel 未初始化

**文件**: `designer/Designer.vue` 第 202 行

**问题描述**:
```typescript
const previewFormModel = ref<any>(null)
```
- previewFormModel 始终为 null
- 在预览对话框中，FormRenderer 无法正常工作

**影响**: 预览功能完全失效

**修复方案**:
```typescript
// 在 Designer.vue 中
const previewFormModel = computed(() => {
  if (!schema.value) return null
  const model = createFormModel(schema.value)
  return model
})
```

---

### 9. designerEngine.ts 中 moveNode 逻辑有问题

**文件**: `designer/designerEngine.ts` 第 475-507 行

**问题描述**:
```typescript
function _moveNodeById(
  schema: ObjectFieldSchema | VoidFieldSchema,
  nodeId: string,
  direction: 'up' | 'down'
): boolean {
  const properties = 'properties' in schema ? schema.properties : null
  if (!properties) return false

  const entries = Object.entries(properties).sort(
    ([, a], [, b]) => (a['x-order'] ?? 0) - (b['x-order'] ?? 0)
  )

  const idx = entries.findIndex(([, f]) => f['x-id'] === nodeId)
  if (idx === -1) {
    for (const [, fieldSchema] of Object.entries(properties)) {
      if ('properties' in fieldSchema && fieldSchema.properties) {
        if (_moveNodeById(fieldSchema as any, nodeId, direction)) return true
      }
    }
    return false
  }

  const swapIdx = direction === 'up' ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= entries.length) return false

  const currentOrder = entries[idx][1]['x-order'] ?? idx * 10
  const swapOrder = entries[swapIdx][1]['x-order'] ?? swapIdx * 10

  entries[idx][1]['x-order'] = swapOrder
  entries[swapIdx][1]['x-order'] = currentOrder

  return true
}
```
- `entries` 是排序后的数组，交换 x-order 后需要重新排序 properties
- 但当前代码直接修改了 entries 中的 schema 对象，没有同步回 properties

**影响**: 上移/下移功能可能不生效，或者排序混乱

**修复方案**:
```typescript
function _moveNodeById(
  schema: ObjectFieldSchema | VoidFieldSchema,
  nodeId: string,
  direction: 'up' | 'down'
): boolean {
  const properties = 'properties' in schema ? schema.properties : null
  if (!properties) return false

  // 获取排序后的 entries
  const entries = Object.entries(properties).sort(
    ([, a], [, b]) => (a['x-order'] ?? 0) - (b['x-order'] ?? 0)
  )

  const idx = entries.findIndex(([, f]) => f['x-id'] === nodeId)
  if (idx === -1) {
    // 递归查找
    for (const [, fieldSchema] of Object.entries(properties)) {
      if ('properties' in fieldSchema && fieldSchema.properties) {
        if (_moveNodeById(fieldSchema as any, nodeId, direction)) return true
      }
    }
    return false
  }

  const swapIdx = direction === 'up' ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= entries.length) return false

  // 交换 order 值
  const currentOrder = entries[idx][1]['x-order'] ?? idx * 10
  const swapOrder = entries[swapIdx][1]['x-order'] ?? swapIdx * 10

  entries[idx][1]['x-order'] = swapOrder
  entries[swapIdx][1]['x-order'] = currentOrder

  return true
}
```

---

### 10. DesignOverlay.vue 中 canvasEl 可能未正确设置

**文件**: `designer/DesignOverlay.vue` 第 316-320 行

**问题描述**:
```typescript
watch(
  () => props.canvasEl,
  async (el) => {
    teardownObservers()
    if (el) {
      await nextTick()
      setupObservers()
      refreshOverlay()
    }
  }
)
```
- 当 canvasEl 变化时，会重新设置 observer
- 但 Designer.vue 中没有正确传递 canvasEl 引用

**影响**: 叠加层可能无法正确显示高亮框和操作按钮

**修复方案**:
在 Designer.vue 中为 Canvas 容器添加 ref，并传递给 DesignOverlay：
```vue
<template>
  <div class="designer-canvas" ref="canvasElRef">
    <div v-if="layoutMode === 'flow'" class="canvas-flow">
      <FlowLayout ref="flowCanvasRef" ... />
    </div>
  </div>
  <DesignOverlay v-if="schema" :canvas-el="canvasElRef" ... />
</template>
```

---

### 11. useDragSort.ts 等组合式函数未被使用

**文件**: `designer/useDragSort.ts`, `designer/useFreeDrag.ts`, `designer/useResize.ts`

**问题描述**:
- 这三个 composable 文件已创建，但在 DesignOverlay.vue 中未被使用
- 自由布局的拖拽移动和缩放功能无法使用

**影响**: 自由布局模式的核心交互功能缺失

**修复方案**:
在 DesignOverlay.vue 中集成这些 composable：
```typescript
import { useFreeDrag } from './useFreeDrag'
import { useResize } from './useResize'

const { isDragging, startDrag, stopDrag } = useFreeDrag(...)
const { isResizing, startResize, stopResize } = useResize(...)
```

---

### 12. model.ts 中 _getSchemaByPath 可能在嵌套 object 字段中失效

**文件**: `types/model.ts` 第 480-493 行

**问题描述**:
```typescript
private _getSchemaByPath(path: string): FieldSchema | undefined {
  const keys = path.split('.')
  let current: any = this.schema.schema

  for (const key of keys) {
    if (current?.type === 'object' && current.properties) {
      current = current.properties[key]
    } else {
      return undefined
    }
  }

  return current as FieldSchema | undefined
}
```
- 对于 array 类型字段的 items，如果 items 是 object schema
- 需要通过特殊路径访问，当前实现无法处理

**影响**: 子表单等场景下，字段校验可能无法正确获取 Schema

**修复方案**:
需要在 _getSchemaByPath 中添加对 array items 的处理逻辑（需要扩展 path 语法）

---

## 🟡 P2 - 中等优先级问题

### 13. componentRegistry.ts 中存在语法错误

**文件**: `types/componentRegistry.ts` 第 431 行

**问题描述**:
```typescript
export function setGlobalRegistry(registry: ComponentRegistry): void {
  _globalRegistry = registry
}
```
- 第 432 行有一个不完整的函数定义

**影响**: TypeScript 编译可能报错

**修复方案**:
删除第 432 行或补全代码。

---

### 14. 缺少错误边界处理

**所有 Vue 组件**

**问题描述**:
- 组件中没有统一的错误处理机制
- 某些组件的异步操作（如数据加载）没有 try-catch

**影响**: 
- 运行时错误可能导致整个应用崩溃
- 用户体验差，错误信息不友好

**修复方案**:
1. 添加全局错误处理器
2. 在关键操作处添加 try-catch
3. 使用 ErrorBoundary 组件包裹关键区域

---

### 15. 类型定义存在循环依赖风险

**文件**: `types/schema.ts`

**问题描述**:
- FieldSchema 定义中包含了 ObjectFieldSchema, ArrayFieldSchema 等
- 这些类型又引用了 FieldSchema
- 虽然使用了 type 联合，但复杂的类型嵌套可能导致类型检查缓慢

**影响**: TypeScript 类型检查可能变慢

**修复方案**:
使用接口和类型结合的方式，减少循环依赖。

---

### 16. 缺少单元测试

**所有核心文件**

**问题描述**:
- FormModel、ReactionsEngine、designerEngine 等核心逻辑没有单元测试
- 无法保证修改后的代码质量

**影响**: 
- 重构风险高
- 回归测试困难

**修复方案**:
为核心模块编写单元测试，覆盖率目标 80% 以上。

---

### 17. 性能优化不足

**多个文件**

**问题描述**:
- DesignOverlay.vue 中每次 DOM 变化都会触发 refreshOverlay
- 大量字段时可能存在性能问题
- 没有使用虚拟滚动等优化技术

**影响**: 
- 字段数量多时卡顿
- 内存占用高

**修复方案**:
1. 使用防抖/节流优化 refreshOverlay
2. 考虑虚拟滚动
3. 优化 Schema 遍历逻辑

---

## 🟢 P3 - 低优先级建议

### 18. 注释可以更详细

**所有文件**

**问题描述**:
- 部分复杂的联动逻辑缺少详细注释
- 一些边界情况的说明不够清晰

**修复方案**:
为核心算法和复杂逻辑添加详细注释。

---

### 19. 代码风格不一致

**多个文件**

**问题描述**:
- 某些地方使用箭头函数，某些地方使用普通函数
- 命名风格不完全统一

**修复方案**:
统一使用 ESLint + Prettier 进行代码格式化。

---

### 20. 支持主题定制

**全局**

**问题描述**:
- 颜色值硬编码在组件中
- 不支持亮/暗主题切换

**修复方案**:
抽取 CSS 变量，支持主题切换。

---

## 修复优先级建议

### 第一批（立即修复 - P0）
1. Designer.vue 注入 ComponentRegistry
2. FormRenderer.vue 注入 ComponentRegistry
3. 修复 schema 响应式问题
4. FlowLayout.vue 添加 formModel 依赖检查
5. PropertyPanel.vue 添加 null 检查

### 第二批（核心功能 - P1）
6. MaterialPalette.vue 统一物料数据源
7. FieldRenderer.vue 提供 formRendererCtx 默认值
8. Designer.vue 初始化 previewFormModel
9. 修复 designerEngine.ts 中 moveNode 逻辑
10. DesignOverlay.vue 正确设置 canvasEl
11. 集成拖拽/缩放 composable
12. 修复 model.ts 中 _getSchemaByPath

### 第三批（代码质量 - P2）
13. 修复 componentRegistry.ts 语法错误
14. 添加错误边界处理
15. 优化类型定义
16. 编写单元测试
17. 性能优化

### 第四批（长期改进 - P3）
18. 完善注释
19. 统一代码风格
20. 支持主题定制

---

## 总结

当前 prototype 代码整体架构清晰，设计思路合理，但存在多个严重问题需要修复。核心问题集中在：

1. **依赖注入缺失** - ComponentRegistry 未正确注入到设计器和渲染器中
2. **响应式问题** - Schema 的变化可能不会触发视图更新
3. **功能不完整** - 拖拽、缩放、自由布局等核心交互未实现或未集成

建议按照优先级分批修复，确保每个批次修复后可以运行测试验证。
