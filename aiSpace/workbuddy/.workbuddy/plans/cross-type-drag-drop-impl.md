# 实施计划：实现流式布局节点拖拽到绝对定位容器

## 需求分析

根据 2026-03-28 工作日志，核心需求是：
1. **自由定位容器节点允许拖拽状态的流式布局节点 hover 并且 drop**
2. 流式节点（relative）拖拽到 absolute 容器时，需要 hover 高亮
3. Drop 后按流式排列插入到容器末尾（保持 relative 模式）

## 当前架构状态

### 代码位置

**核心文件**：
- `d:\ai\low-code-ai-coding\aiSpace\prototype\src\designer\DesignOverlay.vue`
  - 当前 flatNodes（第 272-296 行）已经包含所有节点（包括 absolute 容器）
  - 第 284 行添加了 `positionType: schema['x-position-type'] ?? 'relative'` 记录定位类型
- `d:\ai\low-code-ai-coding\aiSpace\prototype\src\designer\AbsoluteNodeOverlay.vue`
  - 只处理 absolute 节点的拖拽移动和缩放
- `d:\ai\low-code-ai-coding\aiSpace\prototype\src\designer\LowcodeDesigner.vue`
  - 同时引入 DesignOverlay 和 AbsoluteNodeOverlay

### 关键代码片段

**DesignOverlay.vue flatNodes 逻辑（第 272-296 行）**：
```javascript
const flatNodes = computed<FlatNode[]>(() => {
  const nodes: FlatNode[] = []

  function walk(properties: Record<string, FieldSchema>, parentId: string) {
    for (const [key, schema] of Object.entries(properties)) {
      // 包含所有节点（包括 absolute 容器），用于流式节点拖拽到容器的交互
      if (schema['x-id']) {
        nodes.push({
          id: schema['x-id'],
          label: schema.title ?? schema['x-component'] ?? '未知',
          isContainer: schema.type === 'void' || schema.type === 'object',
          parentId,
          positionType: schema['x-position-type'] ?? 'relative', // 记录定位类型
        })
      }
      if ('properties' in schema && schema.properties) {
        walk(schema.properties as Record<string, FieldSchema>, schema['x-id'] ?? parentId)
      }
    }
  }

  if (props.schema?.schema?.properties) {
    walk(props.schema.schema.properties, '__root__')
  }
  return nodes
})
```

**DesignOverlay.vue FlatNode 接口（第 264-270 行）**：
```javascript
interface FlatNode {
  id: string
  label: string
  isContainer: boolean
  /** 父节点 x-id，根层节点为 '__root__' */
  parentId: string
}
```

**问题**：FlatNode 接口没有 `positionType` 字段！

## 实施步骤

### Step 1: 修改 FlatNode 接口，添加 positionType 字段

**文件**：`d:\ai\low-code-ai-coding\aiSpace\prototype\src\designer\DesignOverlay.vue`

**修改位置**：第 264-270 行的 FlatNode 接口定义

**修改内容**：
```javascript
interface FlatNode {
  id: string
  label: string
  isContainer: boolean
  /** 父节点 x-id，根层节点为 '__root__' */
  parentId: string
  /** 定位类型：'relative' | 'absolute' */
  positionType: 'relative' | 'absolute'
}
```

### Step 2: 修改 refreshOverlay 函数，过滤掉 absolute 节点（非容器）

**文件**：`d:\ai\low-code-ai-coding\aiSpace\prototype\src\designer\DesignOverlay.vue`

**修改位置**：第 303-341 行的 refreshOverlay 函数

**修改内容**：
在创建 overlayItems 时，过滤掉 absolute 类型的节点（容器除外），因为：
- absolute 容器需要显示（作为拖拽目标）
- absolute 非容器节点不显示（由 AbsoluteNodeOverlay 单独处理）

```javascript
function refreshOverlay(): void {
  if (!props.canvasEl) return
  // 优先使用 overlayRef 的父容器作为坐标参考（更精准）
  const referenceEl = overlayRef.value?.parentElement ?? props.canvasEl

  const canvasRect = referenceEl.getBoundingClientRect()
  const items: OverlayItem[] = []

  for (const node of flatNodes.value) {
    // 过滤掉 absolute 节点（除非是容器），由 AbsoluteNodeOverlay 单独处理
    if (node.positionType === 'absolute' && !node.isContainer) continue

    // 通过 data-field-id 属性查找 DOM 节点
    const el = props.canvasEl.querySelector<HTMLElement>(
      `[data-field-id="${node.id}"]`
    )
    if (!el) continue

    const elRect = el.getBoundingClientRect()

    // 计算相对于 overlay 父容器的坐标（考虑滚动）
    const scrollTop = referenceEl.scrollTop ?? 0
    const scrollLeft = referenceEl.scrollLeft ?? 0
    const relLeft = elRect.left - canvasRect.left + scrollLeft
    const relTop = elRect.top - canvasRect.top + scrollTop

    items.push({
      nodeId: node.id,
      label: node.label,
      isContainer: node.isContainer,
      style: {
        position: 'absolute',
        left: `${relLeft}px`,
        top: `${relTop}px`,
        width: `${elRect.width}px`,
        height: `${elRect.height}px`,
      },
    })
  }

  overlayItems.value = items
}
```

### Step 3: 验证 dragOver 和 drop 逻辑

**文件**：`d:\ai\low-code-ai-coding\aiSpace\prototype\src\designer\DesignOverlay.vue`

**关键逻辑检查**：

1. **handleDragOver（第 496-547 行）**：
   - 第 522 行获取目标节点：`const targetNode = flatNodes.value.find((n) => n.id === nodeId)`
   - 第 523 行判断是否为容器：`const isTargetContainer = targetNode?.isContainer ?? false`
   - 第 526 行判断是否移入容器：`if (isTargetContainer && ratio >= 0.35 && ratio <= 0.65)`

   ✅ **无需修改**：逻辑已经支持识别容器节点（包括 absolute 容器）

2. **handleDrop（第 563-596 行）**：
   - 第 576-578 行处理移入容器：`if (intent === 'into') { emit('move-to-container', fromId, toNodeId) }`

   ✅ **无需修改**：逻辑已经支持将节点移入容器

### Step 4: 测试验证

1. **运行开发服务器**：
   ```bash
   cd d:/ai/low-code-ai-coding/aiSpace/prototype
   npm run dev
   ```

2. **测试场景**：
   - 拖拽一个 relative 节点到 absolute 容器上方
   - 观察 hover 高亮效果（绿色边框）
   - Drop 后检查节点是否正确插入到容器末尾
   - 确认节点的 x-position-type 仍为 'relative'

3. **运行单元测试**：
   ```bash
   cd d:/ai/low-code-ai-coding/aiSpace/prototype
   npx vitest run
   ```

## 预期结果

- ✅ relative 节点可以拖拽到 absolute 容器
- ✅ absolute 容器在拖拽时显示 hover 高亮（绿色边框）
- ✅ relative 节点拖入 absolute 容器后保持 relative 模式
- ✅ 现有功能不受影响（relative 节点之间的拖拽排序、跨容器拖拽、absolute 节点的拖拽移动和缩放）
- ✅ TypeScript 编译零错误
- ✅ 154 个单元测试全部通过

## 潜在风险

1. **absolute 容器的 DOM 查找**：
   - 如果 absolute 容器的 DOM 节点无法通过 `data-field-id` 查找到，refreshOverlay 会跳过该节点
   - 解决方案：确保 VoidContainer 和 FieldRenderer 在渲染时正确设置了 `data-field-id` 属性

2. **拖拽事件冲突**：
   - DesignOverlay 和 AbsoluteNodeOverlay 可能会同时响应同一个节点的拖拽事件
   - 解决方案：DesignOverlay 过滤掉 absolute 非容器节点，AbsoluteNodeOverlay 只处理 absolute 节点

3. **Z-index 层级问题**：
   - DesignOverlay 和 AbsoluteNodeOverlay 的 z-index 设置需要合理，避免遮挡
   - 当前 DesignOverlay 的操作按钮 z-index 为 1000，AbsoluteNodeOverlay 需要更高

## 后续优化

1. **视觉反馈优化**：
   - absolute 容器的 hover 高亮可以与 relative 容器有所区分（比如用不同颜色）
   - 添加拖拽时的半透明效果，更清晰地区分拖拽源和目标

2. **性能优化**：
   - 减少 DOM 查询次数，使用 Map 缓存节点引用
   - 优化 MutationObserver 的配置，减少不必要的刷新

3. **用户体验优化**：
   - 拖拽时显示容器类型的提示文字
   - 添加键盘快捷键（Esc 取消拖拽）
