---
name: cross-type-drag-drop-complete
overview: 完成流式布局节点拖拽到绝对定位容器的跨类型拖拽功能，同时排查画板和属性面板的可操作性 BUG
todos:
  - id: fix-flatnode-interface
    content: 修复 FlatNode 接口，添加 positionType 字段定义
    status: completed
  - id: modify-refresh-overlay
    content: 修改 refreshOverlay 函数，过滤 absolute 非容器节点，保留 absolute 容器
    status: completed
    dependencies:
      - fix-flatnode-interface
  - id: verify-drag-handlers
    content: 验证 handleDragOver 和 handleDrop 逻辑是否支持 absolute 容器
    status: completed
    dependencies:
      - modify-refresh-overlay
  - id: test-cross-type-drag
    content: 测试验证：流式节点拖入 absolute 容器，hover 高亮和 drop 效果
    status: completed
    dependencies:
      - verify-drag-handlers
  - id: test-existing-features
    content: 回归测试：验证 relative 节点拖拽、absolute 节点交互不受影响
    status: completed
    dependencies:
      - test-cross-type-drag
---

## 用户需求

**核心任务**：

1. **画板 + 属性面板可操作性和 BUG 修复**

- 解决 DesignOverlay 和 AbsoluteNodeOverlay 之间的交互冲突
- 确保 absolute 容器在拖拽时能正确响应

2. **跨类型拖拽：流式节点拖入 absolute 容器**

- 流式布局节点（relative）可以拖拽到 absolute 定位的容器上
- 拖拽时容器显示 hover 高亮（绿色边框）
- Drop 后节点以 relative 模式插入到容器末尾
- 容器相当于子画板，内部仍保持流式布局

**预期效果**：

- 用户拖拽 relative 节点经过 absolute 容器时，容器显示绿色高亮边框
- Drop 后节点以流式排列插入容器内部
- 现有功能不受影响

## 技术背景

- 架构：XLayout 统一渲染（relative/absolute 混合）+ 双 Overlay 交互层
- DesignOverlay：处理流式布局交互（hover/选中/拖拽排序/move-to-container）
- AbsoluteNodeOverlay：处理 absolute 节点拖拽移动和缩放
- 容器（VoidContainer）渲染时带有 `data-field-id` 属性

## 技术栈

- **前端框架**：Vue 3 Composition API + TypeScript
- **UI 库**：Element Plus
- **拖拽实现**：HTML5 Drag and Drop API + MouseEvent
- **构建工具**：Vite

## 实现方案

### 核心策略

采用**最小改动原则**，复用现有拖拽逻辑：

1. **扩展 FlatNode 接口**：添加 `positionType` 字段记录节点定位类型
2. **修改 refreshOverlay**：过滤 absolute 非容器节点（由 AbsoluteNodeOverlay 处理），保留 absolute 容器（作为拖拽目标）
3. **复用现有 handleDragOver/handleDrop**：逻辑已支持容器识别，只需确保 absolute 容器能被找到

### 关键技术决策

| 决策点 | 选择 | 理由 |
| --- | --- | --- |
| absolute 容器处理 | 在 flatNodes 中保留，作为拖拽目标 | 复用现有容器拖拽逻辑 |
| absolute 非容器节点 | 过滤掉，由 AbsoluteNodeOverlay 处理 | 避免职责冲突 |
| Drop 后节点定位类型 | 保持 relative | 容器内部仍流式排列 |


### 性能考虑

- flatNodes 使用 computed，自动缓存
- 拖拽事件由 HTML5 DnD 原生触发，性能开销小
- 不新增 Observer，避免内存泄漏

## 目录结构

```
d:\ai\low-code-ai-coding\aiSpace\prototype\src\designer\
├── DesignOverlay.vue  # [MODIFY] 扩展 FlatNode 接口 + 修改 refreshOverlay 过滤逻辑
```

## Agent Extensions

### Skill

- **brainstorming**: 在创意工作前使用，探讨用户意图和设计方向
- **drag-drop-interaction**: 实现拖拽交互时使用，包括自由布局节点拖拽、8方向缩放等
- **systematic-debugging**: 遇到 BUG 时使用，用于系统化调试和修复