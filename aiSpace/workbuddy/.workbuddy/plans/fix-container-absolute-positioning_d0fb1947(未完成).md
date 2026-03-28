---
name: fix-container-absolute-positioning
overview: 修复容器节点自由定位模式下的坐标偏移问题，通过移除 VoidContainer.vue 中强制覆盖 position 属性的代码，使容器节点能够正确响应 nodeStyle 中的 absolute 定位设置。
todos:
  - id: modify-wrapper-style
    content: 修改 VoidContainer.vue wrapperStyle 计算属性，移除强制覆盖 position 的代码
    status: pending
  - id: update-xlayout-comment
    content: 更新 XLayout.vue 第 138 行注释，消除"不强制"误导
    status: pending
  - id: verify-unit-tests
    content: 运行单元测试验证 154 个测试全部通过
    status: pending
    dependencies:
      - modify-wrapper-style
      - update-xlayout-comment
  - id: visual-verification
    content: 在设计器中测试容器节点的自由定位和流式布局切换
    status: pending
    dependencies:
      - verify-unit-tests
---

## 产品概述

修复低代码设计器中容器节点在自由定位模式下的坐标偏移问题。当用户将容器节点（Card、Tabs、Collapse 等）设置为自由定位（x-position-type: 'absolute'）时，AbsoluteNodeOverlay 的蓝色操作框位置正常，但 VoidContainer 的实际渲染位置（void-wrapper）严重错位，两者相距可达半个屏幕。

## 核心需求

- 移除 VoidContainer.vue 中强制覆盖 position 属性的代码，使容器节点能够响应 nodeStyle 中的 absolute 定位设置
- 确保 AbsoluteNodeOverlay 的操作框与 VoidContainer 的实际渲染位置完全重合
- 保持流式布局（x-position-type: 'relative'）的默认行为不变
- 确保 154 个单元测试继续全部通过
- 操作按钮（.design-actions）在两种定位模式下都能正常显示

## Tech Stack

- 前端框架：Vue 3（Composition API）
- 语言：TypeScript
- 构建工具：Vite
- 样式：Scoped CSS
- 测试框架：Vitest
- 组件库：Element Plus

## Tech Architecture

### 系统架构

修复遵循现有的 XLayout 架构（第十六阶段架构演进）：

- XLayout 通过 nodeStyle prop 透传定位样式给子组件
- VoidContainer 和 FieldRenderer 接收并应用 nodeStyle
- AbsoluteNodeOverlay 读取 schema 中的 x-position 坐标，在同一 containing block 上渲染操作框

修复后，定位链路完全对齐：

```mermaid
graph TD
    A[schema.x-position-type === 'absolute'] --> B[XLayout.getNodeStyle]
    B --> C[返回 {position: 'absolute', left, top, width, height}]
    C --> D[VoidContainer.wrapperStyle]
    D --> E[应用 {position: 'absolute', left, top, width, height}]
    E --> F[void-wrapper 渲染在指定位置]
    C --> G[AbsoluteNodeOverlay.itemStyle]
    G --> H[读取相同坐标]
    H --> I[absolute-overlay__item 渲染在相同位置]
```

### Module Division

- **渲染层模块**：VoidContainer.vue 容器组件，接收并应用 nodeStyle 定位样式
- **布局层模块**：XLayout.vue 统一渲染层，根据 x-position-type 计算节点样式
- **操作层模块**：AbsoluteNodeOverlay.vue 渲染自由定位操作框

### Data Flow

用户设置容器节点为 absolute → schema.x-position-type 更新 → XLayout.getNodeStyle 返回 absolute 样式 → VoidContainer.wrapperStyle 应用样式 → void-wrapper 定位到指定坐标 → AbsoluteNodeOverlay 操作框重合渲染

## Implementation Details

### Core Directory Structure

```
d:/demo/ai/aiSpace/prototype/src/renderer/
└── VoidContainer.vue  # [MODIFY] 容器组件，移除 wrapperStyle 中强制覆盖 position 的代码

d:/demo/ai/aiSpace/prototype/src/renderer/
└── XLayout.vue  # [MODIFY] 更新第 138 行注释，消除"不强制"误导
```

### 关键代码结构

**修改点 1：wrapperStyle 计算属性（第 190-195 行）**

```typescript
// 修改前
const wrapperStyle = computed((): CSSProperties => {
  return {
    ...props.nodeStyle,
    position: 'relative',  // ⚠️ 删除此行
  }
})

// 修改后
const wrapperStyle = computed((): CSSProperties => {
  return {
    ...props.nodeStyle,
  }
})
```

**修改点 2：XLayout.vue 注释（第 138 行）**

```javascript
// 修改前
// - 否则 → 空对象（由 flex 布局自然排列，不强制 position: relative）

// 修改后
// - 否则 → 空对象（CSS 默认值 position: relative 生效）
```

**不变点：CSS 样式（第 236-239 行）**

```css
.void-wrapper {
  position: relative;  /* 保留作为默认值 */
  min-width: 0;
}
```

### 设计验证

- **流式布局验证**：nodeStyle 未提供 position 或 position 为 relative/undefined 时，使用 CSS 默认的 `position: relative`，保持原有流式布局行为
- **自由定位验证**：nodeStyle 提供 `{ position: 'absolute', left: '100px', top: '100px' }` 时，通过展开运算符覆盖默认值，void-wrapper 应用 absolute 定位
- **操作按钮验证**：`.design-actions` 使用 `position: absolute` + `top: -32px` + `right: 0`，无论父节点是 relative 还是 absolute，都相对于 void-wrapper 定位，不受影响
- **z-index 验证**：`.design-actions` 未设置 z-index，在视觉验证中需观察是否被其他 absolute 节点遮挡

### Implementation Notes

- **性能**：仅移除一行 JavaScript 代码，无额外计算或 DOM 操作，零性能开销
- **可靠性**：遵循 Vue 样式优先级规则（内联样式 > CSS），确保 nodeStyle 始终生效
- **向后兼容**：nodeStyle 未提供 position 时，自动降级为 CSS 默认的 `position: relative`
- **测试覆盖**：当前 154 个单元测试未覆盖 VoidContainer 的 absolute 定位场景，修复后需运行所有测试确保无回归
- **视觉验证**：重点验证容器节点设置为 absolute 后，操作框与容器重合，操作按钮显示正常无遮挡

# Agent Extensions

本任务不需要使用任何 agent extensions。