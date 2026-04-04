# [已归档] Step 5: Schema 迁移方案 — layoutMode → x-position-type

> ⚠️ **已归档 — 2026-04-04。**
> 此迁移方案已于 **2026-03-29 执行完毕**。
>
> **归档原因：** 迁移已完成，方案内容已过时。
> **参考价值：** 中等。记录了 `layoutMode → x-position-type` 的迁移思路，未来如有类似迁移可参考。

---

## 归档内容摘要

此文档原描述了从 `layoutMode` 迁移到 `x-position-type` 的完整方案。

### 迁移前后对比

| 项目 | 迁移前 | 迁移后 |
|------|--------|--------|
| 布局标识字段 | `layoutMode: 'free' \| 'flow'` | `x-position-type: 'relative' \| 'absolute'` |
| 渲染组件 | FlowLayout.vue + FreeLayout.vue | XLayout.vue（单一组件）|
| 容器组件 | FreeCanvas.vue | VoidContainer.vue |
| 设计器入口 | Designer.vue | LowcodeDesigner.vue |

### 已执行完毕

- ✅ `layoutMode` 完全移除
- ✅ `x-position-type` 成为唯一布局标识
- ✅ FlowLayout.vue / FreeLayout.vue / FreeCanvas.vue / Designer.vue / PropertyPanel.vue 均已删除
- ✅ XLayout.vue + AbsoluteNodeOverlay.vue 已替代上述组件

### 迁移涉及的核心概念

```
x-position-type: 'relative'（默认）
  → 正常流式排列（Flex column）
  → 适用场景：表单主区域、普通字段

x-position-type: 'absolute'
  → 自由定位（position: absolute + x/y/width/height）
  → 适用场景：浮动工具栏、装饰性容器、自由布局字段
  → 容器内子节点仍可为 relative，形成局部流式上下文
```

---

## 相关文档

- 当前架构：`d:\ai\low-code-ai-coding\aiSpace\design\ARCHITECTURE.md`
- 进度清单：`d:\ai\low-code-ai-coding\aiSpace\FEATURE_CHECKLIST.md`
