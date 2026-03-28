---
name: fix-absolute-offset
overview: 修复absolute节点坐标偏移问题
todos:
  - id: move-absolute-overlay
    content: 将 AbsoluteNodeOverlay 从 .lowcode-designer__canvas 移到 .canvas-container 内，与 FormRenderer 同级
    status: pending
  - id: remove-canvas-renderer-relative
    content: 移除 .canvas-renderer 的 position:relative
    status: pending
    dependencies:
      - move-absolute-overlay
  - id: remove-xlayout-relative
    content: XLayout.containerStyle 移除 position:relative
    status: pending
    dependencies:
      - remove-canvas-renderer-relative
  - id: fix-field-absolute-style
    content: FieldRenderer absolute 模式：wrapper 加 overflow:hidden + padding:0
    status: pending
    dependencies:
      - remove-xlayout-relative
  - id: verify-offset-fix
    content: 验证偏移问题已修复
    status: pending
    dependencies:
      - fix-field-absolute-style
---

## 问题描述

Absolute 定位节点的渲染层（FieldRenderer wrapper）与操作层（AbsoluteNodeOverlay）坐标不一致，偏移约 20px，且子元素溢出父容器。

## 根因（已确认）

AbsoluteNodeOverlay 的 `inset:0` 贴合 `.lowcode-designer__canvas`（有 padding:16px），而 FieldRenderer 的 absolute 元素以 `XLayout`（有 padding:8px 6px 0）为 containing block。两者坐标原点不一致导致叠加偏移。

## 修复目标

统一定位上下文为 `.canvas-container`，让 FieldRenderer wrapper 与 AbsoluteNodeOverlay item 坐标完全对齐。

## 技术方案

1. **AbsoluteNodeOverlay 移入 canvas-container 内**

- 当前：AbsoluteNodeOverlay 是 `.lowcode-designer__canvas` 的直接子元素
- 修改后：移到 `.canvas-container` 内部，与 FormRenderer 同级
- 效果：`inset:0` 将贴合 `canvas-container`，与 FieldRenderer 共享同一个定位锚点

2. **移除中间层的 position:relative**

- `.canvas-renderer` 去掉 `position: relative`（CSS）
- `XLayout.containerStyle` 去掉 `position: relative`
- 效果：containing block 链上浮到 `canvas-container`

3. **FieldRenderer absolute 模式样式修复**

- wrapper 加 `overflow: hidden`（防止内容溢出）
- wrapper 的 `padding` 改为 0（消除额外边距）
- 内部裸 Widget 保持 `width:100%; height:100%`
- 说明：Element Plus 弹层组件均用 Teleport 渲染到 body，overflow:hidden 不影响弹层

## 修改文件

- `d:\demo\ai\aiSpace\prototype\src\designer\LowcodeDesigner.vue`（AbsoluteNodeOverlay 位置、.canvas-renderer CSS）
- `d:\demo\ai\aiSpace\prototype\src\renderer\XLayout.vue`（containerStyle 去掉 position:relative）
- `d:\demo\ai\aiSpace\prototype\src\renderer\FieldRenderer.vue`（absolute wrapper 样式）