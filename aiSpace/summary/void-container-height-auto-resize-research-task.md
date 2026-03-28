# VoidContainer 高度自适应调研任务

## 背景

### 项目概述
为某 MES（制造执行系统）项目开发 Vue 3 低代码设计器，命名为 StdForm 低代码扩展。

### 技术栈
- Vue 3 + TypeScript + Element Plus + Pinia
- 自研 XLayout 架构（基于 CSS position 模型）
- Schema 驱动的布局系统

### 当前阶段
第十六阶段：XLayout 架构演进（已进入高级特性开发）

---

## 问题陈述

### 核心问题
**VoidContainer（容器组件）在自由定位模式下，高度无法自动适应内容。**

### 技术背景
我们的 XLayout 架构基于 CSS position 模型：
- **流式布局节点**：`x-position-type: 'relative'` → 正常流式排列（由 FlowLayout 控制顺序）
- **自由布局节点**：`x-position-type: 'absolute'` → 自由定位（x/y/width/height 通过 schema 控制）

容器组件（Card、Tabs、Collapse、Divider）统一通过 VoidContainer 渲染，它需要：
1. 建立 CSS containing block（`position: relative`）
2. 提供内容槽位（slot）
3. 在设计器模式下提供交互（选中高亮、拖拽支持）

### 具体表现
当容器组件在自由定位模式（`x-position-type: 'absolute'`）下时：
- 容器的高度固定为 schema 中的 `height` 值
- 如果内容超出高度，不会自动撑开容器
- 需要手动调整容器高度，体验不佳

### 业务场景
MES 表单中常见需求：
- 标签页（Tabs）内放入多个表单字段，高度应自动适应内容
- 折叠面板（Collapse）展开/收起时，容器高度应动态变化
- 卡片（Card）内放入动态表单项，高度应随内容增减

---

## 现有实现

### VoidContainer.vue 关键代码
```vue
<template>
  <div
    :class="['void-container', { 'void-container--selected': isSelected }]"
    :style="nodeStyle"
    :data-field-id="nodeId"
    @click="handleClick"
  >
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
// nodeStyle 由 XLayout 透传，包含定位样式（position/left/top/width/height）
const nodeStyle = computed(() => props.nodeStyle || {})
</script>
```

### FieldRenderer.vue 高度自适应机制（已实现）
FieldRenderer 在自由定位模式下，通过以下机制实现高度自适应：
```typescript
// 第331-354行：尺寸检测逻辑
onMounted(async () => {
  if (node.value.xPositionType === 'absolute') {
    await nextTick()
    const element = fieldWrapperRef.value
    if (element) {
      const rect = element.getBoundingClientRect()
      engine.value.updateNodeFreeSize(node.value.id, {
        width: rect.width,
        height: rect.height
      })
    }
  }
})
```

**关键点**：
- 检测节点渲染后的实际尺寸（包括内容撑开的高度）
- 通过 `updateNodeFreeSize` 同步到 schema
- 触发 AbsoluteNodeOverlay 响应式更新操作框

---

## 业界调研（前端平台）

### 1. Retool
- **高度同步**：ResizeObserver 实时监听容器尺寸变化
- **拖拽交互**：DOM 事件冒泡 + `data-*` 属性识别目标
- **选中反馈**：Overlay 蓝色边框（统一操作层）
- **优势**：实时性好，体验流畅
- **劣势**：性能开销大，实现复杂度高

### 2. 阿里云宜搭
- **高度同步**：失焦或切换节点时同步（延迟模式）
- **拖拽交互**：Schema 驱动，区分流式布局/自由布局
- **选中反馈**：Overlay 蓝色边框
- **优势**：性能好，实现简单
- **劣势**：实时性稍差

### 3. 腾讯云微搭
- **高度同步**：混合模式（onMounted + 失焦）+ 防抖
- **拖拽交互**：Schema 驱动 + 防抖优化
- **选中反馈**：Overlay 蓝色边框
- **优势**：平衡实时性和性能
- **劣势**：实现复杂度中等

### 4. Formily
- **高度同步**：通过 Formily 的响应式系统自动同步
- **拖拽交互**：Schema 驱动
- **选中反馈**：无操作层，仅属性面板编辑
- **优势**：高度自动化
- **劣势**：不符合我们的架构（不依赖 Formily）

---

## 业界调研（桌面平台）

### 1. WinForms（.NET）
- **高度自适应**：`AutoSize` 属性（父容器自动撑开）
- **拖拽交互**：`Anchor` / `Dock` 机制
- **选中反馈**：属性面板高亮
- **优势**：原生支持，性能优
- **劣势**：Windows 平台专属

### 2. Unity 编辑器
- **高度自适应**：`LayoutGroup` + `Content Size Fitter` 组件
- **拖拽交互**：Transform 父子关系
- **选中反馈**：Inspector 高亮
- **优势**：工业化标准，灵活度高
- **劣势**：游戏引擎场景，不直接适用

### 3. Qt Designer
- **高度自适应**：布局管理器（QVBoxLayout、QHBoxLayout）
- **拖拽交互**：父容器统一处理 drop
- **选中反馈**：选中框高亮
- **优势**：跨平台桌面应用标准
- **劣势**：C++ 生态，实现机制不同

---

## 核心共性规律

### 1. 高度自适应策略
| 平台 | 实现方式 | 特点 |
|------|---------|------|
| Web（实时） | ResizeObserver | 体验好，性能开销大 |
| Web（延迟） | onMounted + 失焦兜底 | 平衡性能和体验 |
| 桌面 | AutoSize / LayoutGroup | 原生支持，性能优 |

**共同点**：使用标志位防止循环更新

### 2. 拖拽交互模式
| 平台 | 识别方式 | 容器支持 |
|------|---------|---------|
| Web（Retool） | DOM 事件冒泡 + data-* 属性 | 不区分定位类型 |
| Web（宜搭） | Schema 遍历 + 定位类型判断 | 流式/自由分类处理 |
| 桌面（Unity） | Transform 父子关系 | 父容器统一处理 drop |
| 桌面（WinForms） | Anchor/Dock 机制 | 父容器自动调整子节点位置 |

**共同点**：容器统一支持 drop，不区分定位类型

### 3. 选中反馈
| 平台 | 实现方式 |
|------|---------|
| 所有平台 | 统一用操作层（Overlay / Inspector）显示选中状态 |

---

## 待解决的核心问题

### 问题 1：VoidContainer 高度自适应
**目标**：容器在自由定位模式下，高度能自动适应内容撑开。

**现状**：
- FieldRenderer 已实现高度自适应（onMounted + nextTick 尺寸检测）
- VoidContainer 需要类似机制

**技术难点**：
- 容器内容可能是动态的（如 Tabs 切换、Collapse 展开/收起）
- 需要在内容变化时触发高度同步
- 需要避免循环更新（尺寸检测 → schema 更新 → 触发新的尺寸检测）

### 问题 2：CSS 定位语义一致性
**目标**：不破坏 CSS position 模型的语义，确保 absolute 节点的定位行为符合预期。

**现状**：
- absolute 节点的高度由 schema 控制
- 通过事件驱动同步高度到 schema

**技术难点**：
- 如果让内容撑开容器高度，是否需要覆盖 schema 中的 height？
- 如何保证拖拽调整高度和内容撑开高度的行为一致？

### 问题 3：性能与实时性平衡
**目标**：在保证用户体验的前提下，避免频繁更新导致的性能问题。

**现状**：
- FieldRenderer 仅在 onMounted 时检测尺寸
- 如果容器内容动态变化（如 Tabs 切换），如何触发重新检测？

**技术难点**：
- 实时性 vs 性能的权衡
- 如何避免过度渲染（如 ResizeObserver 触发高频更新）

---

## 已有思路

### 方案A：ResizeObserver 实时监听
```typescript
onMounted(() => {
  if (node.value.xPositionType === 'absolute') {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        engine.value.updateNodeFreeSize(node.value.id, { width, height })
      }
    })
    resizeObserver.observe(containerRef.value)
  }
})
```

**优势**：
- ✅ 实时性好，任何内容变化都能立即响应
- ✅ 代码简洁，符合 Web 标准

**劣势**：
- ❌ 性能开销大，ResizeObserver 会触发高频更新
- ❌ 可能导致循环更新（内容变化 → 尺寸变化 → schema 更新 → 重新渲染）
- ❌ 需要防抖优化，增加复杂度

### 方案B：失焦/切换时同步（阿里云宜搭模式）
```typescript
// 1. 在 onMounted 时检测一次（初始化）
onMounted(async () => {
  if (node.value.xPositionType === 'absolute') {
    await nextTick()
    syncContainerSize()
  }
})

// 2. 在失焦或切换节点时检测
const handleBlur = () => {
  if (node.value.xPositionType === 'absolute') {
    syncContainerSize()
  }
}

const syncContainerSize = () => {
  const element = containerRef.value
  if (element) {
    const rect = element.getBoundingClientRect()
    engine.value.updateNodeFreeSize(node.value.id, {
      width: rect.width,
      height: rect.height
    })
  }
}
```

**优势**：
- ✅ 性能好，避免高频更新
- ✅ 实现简单，改动范围小
- ✅ 完全复用 FieldRenderer 的实现模式

**劣势**：
- ❌ 实时性稍差，需要在失焦/切换时才能同步
- ❌ 动态内容变化（如 Tabs 切换）可能不会立即触发同步

---

## 调研目标

### 核心目标
给出一个**完整可行**的 VoidContainer 高度自适应方案，包括：

1. **技术选型**：选择合适的高度同步策略（ResizeObserver / onMounted + 失焦 / 混合模式）
2. **实现细节**：具体代码实现，包括事件监听、尺寸检测、schema 同步
3. **性能优化**：如何避免循环更新，如何平衡实时性和性能
4. **兼容性**：如何保持 CSS 定位语义一致性，如何支持动态内容变化
5. **测试验证**：如何验证方案的正确性和稳定性

### 可选调研方向
如果需要，可以进一步调研：
- 其他低代码平台的具体实现细节（如 Retool 的 ResizeObserver 使用方式）
- 桌面平台的布局管理器如何处理动态内容（如 Qt 的 QVBoxLayout）
- 工业软件的容器自适应模式（如 CAD 软件的图层容器）

---

## 预期交付物

### 1. 调研报告
- 业界方案对比分析（表格形式）
- 技术选型理由（第一性原理推导）
- 实现细节（伪代码或关键代码片段）
- 性能优化策略
- 兼容性分析

### 2. 可行性评估
- 每种方案的实现难度（1-5星）
- 每种方案的性能影响（1-5星）
- 每种方案的风险点
- 推荐方案（明确选择）

### 3. 实施计划（如果需要）
- 改动范围（涉及的文件和代码行数）
- 实施步骤（分阶段计划）
- 测试验证方法
- 回滚方案

---

## 技术约束

### 1. 架构约束
- 必须基于 XLayout 架构（CSS position 模型）
- 必须通过 Schema 驱动布局
- 必须保持 VoidContainer 的定位上下文（position: relative）

### 2. 性能约束
- 不能引入显著的性能下降（154 个单元测试必须在 3 秒内完成）
- 不能导致内存泄漏（如 ResizeObserver 必须在 onBeforeUnmount 时取消监听）

### 3. 兼容性约束
- 不能破坏现有功能（流式布局节点行为必须完全不变）
- 不能引入新的测试失败（154 个单元测试必须全部通过）
- TypeScript 零错误，Vite 构建成功

---

## 重要信息

### 当前代码位置
- VoidContainer.vue：`D:\demo\ai\aiSpace\prototype\src\renderer\VoidContainer.vue`
- FieldRenderer.vue：`D:\demo\ai\aiSpace\prototype\src\renderer\FieldRenderer.vue`
- XLayout.vue：`D:\demo\ai\aiSpace\prototype\src\renderer\XLayout.vue`
- DesignOverlay.vue：`D:\demo\ai\aiSpace\prototype\src\designer\DesignOverlay.vue`
- AbsoluteNodeOverlay.vue：`D:\demo\ai\aiSpace\prototype\src\designer\AbsoluteNodeOverlay.vue`

### 测试命令
```bash
cd D:\demo\ai\aiSpace\prototype
npx vitest run
```

### 开发服务器
```bash
cd D:\demo\ai\aiSpace\prototype
npx vite
# 访问 http://localhost:5173
```

### 编码规范
详见：`D:\demo\ai\aiSpace\编码风格总结.md`

关键规范：
- 文件命名：Vue 组件大驼峰，TS 文件小驼峰
- 事件处理函数用 `handle` 前缀
- Ref 变量用 `Ref` 后缀
- Manager 类用 `Manager` 后缀
- 异步：async/await + try-catch
- 禁止使用 var，禁止直接操作 DOM

---

## 项目背景补充

### StdForm 基础设施
项目已有完善的 StdForm 基础设施，包括：
- Schema 管理（`core/schema.ts`）
- 模型管理（`core/model.ts`）
- 响应式系统（`core/reactions.ts`）
- 物料注册（`core/registry.ts`）
- 渲染层（`renderer/`）
- 设计器（`designer/`）

### 第十六阶段目标
详见：`D:\demo\ai\aiSpace\design\FreeLayout-Interaction-Plan.md`

核心目标：
- 实现 XLayout 架构（CSS position 模型）
- 支持混合布局模式（流式布局 + 自由定位）
- 提供流畅的拖拽交互体验

### 已完成功能
详见：`D:\demo\ai\aiSpace\FEATURE_CHECKLIST.md`

核心能力：
- core/ 全部模块（schema/model/reactions/registry）
- renderer/（FieldRenderer/FlowLayout/FreeLayout/VoidContainer/XLayout）
- designer/ 全部 UI 组件 + engine + composables
- 容器组件（Card/Tabs/Collapse/Divider）物料注册 + 设计器交互
- 跨容器拖拽（容器内↔容器外，原子操作 moveNodeAcrossContainers）
- 预览功能（el-dialog 弹窗）
- 导出 Schema（handleExport JSON 下载）
- 导入 Schema（validateImportedSchema 校验 + ElMessageBox 覆盖确认 + engine.loadSchema）
- 单元测试 154 个全部通过
- TypeScript 零错误，Vite 构建成功

---

## 研究方法建议

### 1. 第一性原理分析
从 CSS position 模型的语义出发：
- absolute 元素的定位基准是什么？（containing block）
- 容器高度由什么决定？（内容撑开 vs 固定高度）
- 如何在保持 CSS 语义的前提下实现高度自适应？

### 2. 奥卡姆剃刀原则
选择最简单可行的方案：
- 复用现有模式（FieldRenderer 的实现）
- 最小化改动范围
- 避免过度工程化

### 3. 对比分析法
通过表格对比不同方案的优劣：
- 技术复杂度
- 性能影响
- 实时性
- 兼容性
- 风险点

### 4. 实证验证
通过代码实验验证方案：
- 在 VoidContainer.vue 中实现原型
- 通过开发服务器验证视觉效果
- 通过单元测试验证功能正确性

---

## 预期成果形式

### 最终报告结构
```markdown
# VoidContainer 高度自适应方案报告

## 一、调研总结
### 1.1 业界方案对比
### 1.2 核心共性规律
### 1.3 技术选型

## 二、方案设计
### 2.1 核心思路
### 2.2 实现细节
### 2.3 性能优化
### 2.4 兼容性分析

## 三、可行性评估
### 3.1 技术可行性
### 3.2 性能影响
### 3.3 风险评估

## 四、实施计划
### 4.1 改动范围
### 4.2 实施步骤
### 4.3 测试验证

## 五、总结
### 5.1 推荐方案
### 5.2 预期效果
```

### 报告要求
- **数据驱动**：使用具体数据支持结论（如性能测试数据）
- **结构清晰**：逻辑层次分明，便于理解
- **可执行**：明确推荐方案和实施步骤
- **专业性**：体现第一性原理和奥卡姆剃刀的思维方式

---

## 其他注意事项

### 1. 沟通风格
- 直接、务实、有主见
- 不废话，直击问题本质
- 对代码和设计有审美，不做将就的东西

### 2. 研究风格
- 研究学家模式，自主展开工作
- 不照搬开源方案，融合各方案精华自研
- 遇到不确定的再问，不卡顿

### 3. 代码质量
- 遵循编码规范（见 `编码风格总结.md`）
- TypeScript 零错误，Vite 构建成功
- 154 个单元测试全部通过

---

## 联系方式

如有问题，请与 Aiden 联系：
- 角色：奥卡姆剃刀大将军
- 技能：苏格拉底式提问、第一性原理、奥卡姆剃刀
- 目标：给出一个简洁、高效、可行的方案

---

**祝调研顺利！**
