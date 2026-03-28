---
name: fix-void-container-absolute-position
overview: 修复 VoidContainer 容器节点无法响应自由定位（absolute）的问题，消除与 AbsoluteNodeOverlay 的坐标系统错位。
design:
  architecture:
    framework: react
    component: mui
todos:
  - id: modify-wrapper-style
    content: 修改 VoidContainer.vue wrapperStyle 计算属性，移除强制覆盖 position 的代码
    status: pending
  - id: verify-unit-tests
    content: 运行单元测试验证 154 个测试全部通过
    status: pending
    dependencies:
      - modify-wrapper-style
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

## 技术栈

- 前端框架：Vue 3（Composition API）
- 语言：TypeScript
- 构建工具：Vite
- 样式：Scoped CSS
- 测试框架：Vitest

## 技术方案

### 实现方法

采用**移除强制覆盖**的修复策略，使 nodeStyle 中的 position 属性生效。

### 关键技术决策

1. **不修改 CSS 默认定位**：保持 `.void-wrapper` 的 `position: relative` 作为默认值（当 nodeStyle 未提供或 nodeStyle.position 为 undefined 时）
2. **通过展开运算符优先级覆盖**：`...props.nodeStyle` 会覆盖默认 CSS 中的 position，实现动态定位切换
3. **保持操作按钮定位基准不变**：`.design-actions` 使用 `position: absolute`，在 void-wrapper 内部定位，无论父节点是 relative 还是 absolute 都能正常显示

### 性能与可靠性

- **性能**：仅移除一行 JavaScript 代码，无额外计算或 DOM 操作，零性能开销
- **可靠性**：遵循 Vue 样式优先级规则（内联样式 > CSS），确保 nodeStyle 始终生效
- **向后兼容**：nodeStyle 未提供 position 时，自动降级为 CSS 默认的 `position: relative`

## 实现细节

### 核心目录结构

```
d:/demo/ai/aiSpace/prototype/src/renderer/VoidContainer.vue
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

## 架构设计

修复遵循现有的 XLayout 架构（第十六阶段架构演进）：

- XLayout 通过 nodeStyle prop 透传定位样式给子组件
- VoidContainer 和 FieldRenderer 接收并应用 nodeStyle
- AbsoluteNodeOverlay 读取 schema 中的 x-position 坐标，在同一 containing block 上渲染操作框

修复后，定位链路完全对齐：

```
schema.x-position-type === 'absolute'
  ↓
XLayout.getNodeStyle() 返回 { position: 'absolute', left, top, width, height }
  ↓
VoidContainer.wrapperStyle 应用 { position: 'absolute', left, top, width, height }
  ↓
void-wrapper 渲染在指定位置
  ↓
AbsoluteNodeOverlay.itemStyle 读取相同坐标
  ↓
absolute-overlay__item 渲染在相同位置
```

## 目录结构

```
d:/demo/ai/aiSpace/prototype/src/renderer/
└── VoidContainer.vue  # [MODIFY] 容器组件，移除 wrapperStyle 中强制覆盖 position 的代码
```

## 关键代码结构

**NodeStyle 接口定义（来自 CSSProperties）**

```typescript
interface NodeStyle extends CSSProperties {
  position?: 'relative' | 'absolute' | 'fixed' | 'sticky'
  left?: string | number
  top?: string | number
  width?: string | number
  height?: string | number
  zIndex?: number
}
```

**wrapperStyle 修复后**

```typescript
const wrapperStyle = computed((): CSSProperties => {
  return {
    ...props.nodeStyle,  // 优先级高于 CSS 默认值
  }
})
```

本次修复不涉及 UI 设计变更，仅修复容器节点定位逻辑，无需新增或修改用户界面。