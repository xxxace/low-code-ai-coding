# 长期记忆

## 功能清单档案

- **完整功能进度清单**：`D:\demo\ai\aiSpace\FEATURE_CHECKLIST.md`（已完成/骨架在/待实现/已知问题/ADR/目录结构，session 开始时可直接读取）

## 工作空间信息

- 工作空间：`D:\demo\ai\aiSpace\workbuddy` → 已迁移至 `d:\ai\low-code-ai-coding\aiSpace\workbuddy`
- 共享 AI 工作目录：`d:\ai\low-code-ai-coding\aiSpace`（由本 agent 与 deskclaw agent 共同使用）
- 原型代码路径：`d:\ai\low-code-ai-coding\aiSpace\prototype\src\`（注意：旧路径 `D:\demo\ai\aiSpace` 已不存在）

## 项目背景

为某 MES（制造执行系统）项目开发 Vue 3 低代码设计器，命名为 StdForm 低代码扩展。

现有技术栈：Vue 3 + TypeScript + Element Plus + Pinia，编码风格见 `D:\demo\ai\aiSpace\编码风格总结.md`。

## 项目约定

- 所有设计文档写入 `D:\demo\ai\aiSpace\design\`
- 所有原型代码写入 `D:\demo\ai\aiSpace\prototype\src\`
- 研究成果位于 `D:\demo\ai\aiSpace\research\`（由 deskclaw agent 完成）
- 任务文件：`D:\demo\ai\aiSpace\NEXT_PROMPT.md`

## 重要技术决策（ADR）

| 决策 | 结论 | 理由 |
|------|------|------|
| 响应式系统 | 使用 Vue 3 原生 reactive/watchEffect | 避免两套响应式系统，减少学习成本 |
| Schema 基础 | JSON Schema draft-07 + x-* 扩展 | 标准化，后端友好，与 Formily 部分兼容 |
| 布局模式 | `x-position-type: 'relative' \| 'absolute'` + XLayout 统一渲染 | 取代 layoutMode 全局开关，每个字段独立决定定位类型；Step 5 迁移完成，layoutMode 已移除 |
| 关系字段 | x-relation 扩展，对接 RelationRegister | MES 业务特有需求，已有 StdForm 基础设施 |
| 历史记录 | JSON 快照模式（snapshots[] + index） | 简单可靠，visual-drag-demo 验证过 |
| 包结构 | 3 包 Monorepo（core/renderer/designer） | StdForm 已移除规划 |

## 2026-03-28 BUG 修复记录

### 问题1：absolute 容器双层操作框
- 文件：`renderer/VoidContainer.vue`
- 修复：absolute 模式下隐藏 VoidContainer 的 design-actions（第24行添加 `&& !isAbsoluteMode`）
- 理由：AbsoluteNodeOverlay 已处理 absolute 节点的操作框，避免重复

### 问题2：属性面板节点切换误更新
- 文件：`designer/FieldProperties.vue`
- 修复：添加 `currentNodeId` 跟踪 form 同步状态，emitUpdate 前检查同步性
- 理由：watch 回调异步执行，可能在用户触发 @change 时 form 还未同步到新节点

### 问题3：AbsoluteNodeOverlay 层级低于 DesignOverlay
- **问题描述**：`absolute-overlay`的层级不够`design-overlay`高，导致自由定位节点被拖拽到流式布局上方后，鼠标永远无法再拖拽或者操作`absolute-overlay__item`
- **根因分析**：
  - `DesignOverlay`：`.design-overlay`（z-index: 100），`.design-overlay__item`（z-index: 101）
  - `AbsoluteNodeOverlay`：`.absolute-overlay`（无 z-index），`.absolute-overlay__item`（无 z-index），`.resize-handle`（z-index: 1001）
  - 当绝对定位节点覆盖流式节点时，`.design-overlay__item`（z-index: 101）拦截鼠标事件
- **修复方案**：
  - 文件：`designer/AbsoluteNodeOverlay.vue`
  - 修改：为 `.absolute-overlay` 添加 `z-index: 200`，为 `.absolute-overlay__item` 添加 `z-index: 201`
  - 结果：确保 AbsoluteNodeOverlay 层级始终高于 DesignOverlay
- **验证**：154 个单元测试全部通过，TypeScript 零错误，开发服务器正常

## 编码规范

见 `D:\demo\ai\aiSpace\编码风格总结.md`。关键规范：
- 文件命名：Vue 组件大驼峰，TS 文件小驼峰
- 事件处理函数用 `handle` 前缀
- Ref 变量用 `Ref` 后缀
- Manager 类用 `Manager` 后缀
- 异步：async/await + try-catch
- 禁止使用 var，禁止直接操作 DOM

## 当前进度（2026-03-29，Step 5 完成）

**第十六阶段 XLayout 架构演进**：Step 0~5 全部完成 ✅

**已完成全部功能（15 个阶段）**，详见 `FEATURE_CHECKLIST.md`。

核心能力：
- core/ 全部模块（schema/model/reactions/registry）
- renderer/（FieldRenderer/FlowLayout/VoidContainer/XLayout）
- designer/ 全部 UI 组件 + engine + composables
- 容器组件（Card/Tabs/Collapse/Divider）物料注册 + 设计器交互
- 跨容器拖拽（容器内↔容器外，原子操作 moveNodeAcrossContainers）
- 预览功能（el-dialog 弹窗）
- 导出 Schema（handleExport JSON 下载）
- 导入 Schema（validateImportedSchema 校验 + ElMessageBox 覆盖确认 + engine.loadSchema）
- 单元测试 154 个全部通过
- TypeScript 零错误，Vite 构建成功

## 第十六阶段：XLayout 架构演进（进行中）

详见 `D:\demo\ai\aiSpace\design\FreeLayout-Interaction-Plan.md`。

### XLayout 架构方案（用户确认）

**核心理念**：CSS position 模型，每个节点独立决定定位类型。
- `x-position-type: 'relative'`（默认）→ 正常流式排列
- `x-position-type: 'absolute'` → 自由定位（x/y/width/height）
- 容器默认 position: relative，建立内部 absolute 子节点的定位上下文
- 支持：你中有我、我中有我（卡片内自由节点、绝对容器内相对节点等）

### 实施进度

| 步骤 | 内容 | 状态 |
|---|---|---|
| Step 0 | 移除 wrapper div，修复 containing block 语义 | ✅ `8b05669` |
| Step 1 | 创建 XLayout.vue + VoidContainer 改造 | ✅ `e3ab15d` |
| Step 2 | FormRenderer 使用 XLayout，移除 FreeCanvas/DesignOverlay | ✅ `e3ab15d` |
| Step 3 | AbsoluteNodeOverlay 统一交互层 | ✅ `2c96f0c` |
| 3.1 | Flow/Free 交互分离架构重构 + 属性面板定位类型选择器 | ✅ `78eec2a` |
| 3.2 | 双层交互系统集成 + 坐标偏移修复 + VoidContainer 高度自适应 | ✅ `1a2aa9d` |
| 3.3 | absolute 容器 overlay 叠加问题修复 | ✅ `9480014` |
| Step 4 | 批量切换工具栏 + PositionTypeSetter | ⏳ 下一步 |
| Step 5 | 旧 Schema 迁移（layoutMode → x-position-type） | ✅ 2026-03-29 |
| Step 5 | 旧 Schema 迁移（layoutMode → x-position-type） | ✅ 2026-03-29 完成（删除4文件，修改10文件，149测试通过） |

### Step 0 关键决策
- **定位样式透传**：XLayout 的 getNodeStyle() 通过 `nodeStyle` prop 透传给 VoidContainer/FieldRenderer 根元素
- **不包 wrapper**：定位逻辑直接在根元素上，保留 CSS containing block 语义
- **父元素约束**：absolute 节点拖拽只改坐标，禁止切换父容器（CSS 天然语义）
- **第三方组件**：VoidContainer 根元素即为 containing block，slot 容器不影响

### 交互架构重构（2026-03-27）

**Flow 布局节点**（x-position-type: relative）：
- 在 XLayout/FlowLayout 内部直接交互
- 选中高亮：FieldRenderer/VoidContainer 注入 selectedNodeId，添加蓝色边框
- Hover 高亮：虚线边框（未选中时）
- 操作按钮：选中时显示复制/删除按钮
- 属性面板可调整定位类型

**Flow 布局交互修复（2026-03-27 晚上）**：
- 问题：DesignOverlay.vue 未被集成到 Flow 布局，导致 hover 效果和操作按钮丢失
- 修复：为 FieldRenderer.vue 和 VoidContainer.vue 添加 hover 高亮样式和操作按钮
- VoidContainer.vue：添加外层 wrapper（`.void-wrapper`）承载定位和操作按钮

**Flow 布局交互修复 v2（2026-03-27 晚）**：
- 问题1：标题出现 `>` 符号 → 修复：CSS 隐藏 `.el-collapse-item__arrow`
- 问题2：工具栏不存在 → 修复：添加 el-tooltip wrapper 确保 z-index
- 问题3：hover 无物料名称提示 → 修复：添加 el-tooltip content="复制节点"

**Flow 布局交互修复 v3（2026-03-27 夜）**：
- 问题：XLayout 改造后，hover 和操作按钮失效
- 根因 1：XLayout.vue 未 provide `designMode` 注入，导致子组件无法识别设计模式（已修复）
- 根因 2（主要问题）：LowcodeDesigner 只使用了 AbsoluteNodeOverlay，没有集成 DesignOverlay
  - AbsoluteNodeOverlay 只处理 x-position-type === 'absolute' 的节点
  - 流式布局（relative）节点完全没有交互层
- 修复：
  1. 在 LowcodeDesigner.vue 中同时引入 DesignOverlay（处理流式布局）和 AbsoluteNodeOverlay（处理自由布局）
  2. 添加事件处理函数：handleMoveNode、handleReorderNodes、handleMoveToContainer、handleMoveAcrossContainers
  3. XLayout.vue 添加 designMode 注入（兼容渲染层交互）
  4. FieldRenderer.vue / VoidContainer.vue 添加 hover tooltip
  5. 隐藏 Tabs 滚动箭头

**Flow 布局交互修复 v4（2026-03-27 夜）**：
- 问题1：预览模式下 hover 出现边框
  - 修复：给 FieldRenderer/VoidContainer 添加 `design-mode` class，CSS hover 样式依赖于该 class
- 问题2：绝对定位元素操作栏异常
  - 根因：DesignOverlay 处理了所有节点，包括 absolute 节点
  - 修复：DesignOverlay 过滤掉 `x-position-type === 'absolute'` 的节点，由 AbsoluteNodeOverlay 单独处理

**自由布局节点尺寸同步（2026-03-28）**：
- 问题：拖拽添加节点时预设尺寸为 200x40，但实际 Widget 渲染后尺寸不同，导致操作框与 Widget 不一致
- 修复：在 FieldRenderer.vue 添加 onMounted + nextTick 尺寸检测逻辑
- 触发流程：FieldRenderer 渲染 → onMounted + nextTick → 检测尺寸 → updateNodeFreeSize → schema 更新 → AbsoluteNodeOverlay 响应式更新操作框
- 验证：154 个单元测试全部通过，TypeScript 零错误，Vite 构建成功

**VoidContainer 高度自适应（2026-03-28 上午）**：
- 问题：VoidContainer 在 absolute 模式下高度固定为 schema 值，内容撑开不自动更新
- 方案：混合模式（onMounted 首次同步 + ResizeObserver 200ms 防抖追踪动态变化）
- 关键：wrapperStyle 在 absolute 模式下必须剔除 height CSS，否则 wrapper 高度被锁死，ResizeObserver 空转
- schema 的 x-position.height 从"CSS 控制值"变为"记录值"，由 syncContainerSize 持续写入
- 验证：154 个单元测试全部通过，TypeScript 零错误，Vite 构建成功

**Free 布局节点**（x-position-type: absolute）：
- AbsoluteNodeOverlay 特殊处理
- 选中：蓝色边框 + 操作按钮
- 拖拽移动 x/y 坐标
- 8 向缩放 width/height

**layoutMode**：
- 只影响新增节点的默认类型
- 'flow' → x-position-type: relative, x-span: 1
- 'free' → x-position-type: absolute, x-position: {x,y,width,height}

**属性面板新增**：
- 定位类型选择器（流式布局 / 自由定位）
- Free 模式下显示位置 X/Y、宽度、高度输入框

### 关键文件
- `renderer/XLayout.vue`（新建，统一渲染层）
- `renderer/VoidContainer.vue`（改造，容器建立定位上下文）
- `renderer/FormRenderer.vue`（改造，使用 XLayout 替代条件渲染）
- `core/schema.ts`（新增 x-position-type 和 x-position 类型）

### 待实现功能（按优先级）
1. Step 4: 批量切换工具栏 + PositionTypeSetter 属性面板（高优，下一步）
3. x-relation 关系字段 UI（中）
4. 其他低优先级项见 FEATURE_CHECKLIST.md

### 已否决/移除项
- GroupRenderer.vue：已否决，由 VoidContainer 替代
- StdForm 适配层：已从规划中移除
- Monorepo 4包→3包（core/renderer/designer）

### 代码质检 + 类型修复（2026-03-28 晚）

4 个 Batch 累计修复 18 个代码质量问题（P0×4 + P1×4 + P2×5 + P3×5），13 个 vue-tsc 类型错误。

**质检关键修复**：
- P0：拖拽 rAF 节流、VoidContainer Observer 实例隔离、拖拽期间禁用 transition
- P1：validate 异常安全、FormRenderer watch 优化（updatedAt 时间戳替代 deep watch）、InjectionKey 统一（DESIGN_MODE_KEY / SELECTED_NODE_ID_KEY / DESIGNER_ENGINE_KEY）、schema 原地修改替代 JSON 深拷贝
- P2：Observer 生命周期修复（ref 管理 + teardown 再重建）、refreshOverlay 16ms 防抖
- P3：4 处 `any` 消除、dead code 清理、DESIGN_CONSTANTS 魔法数字提取

**类型修复**：
- `FieldState` 添加 `required?: boolean`，`ReactionEffect.state` 添加 `hidden?: boolean`（运行时已支持但类型遗漏）
- `defineComponent(() => null)` → `defineComponent(() => () => null)`
- CSS 字面量类型 `as const`、联合类型 `as any` 绕过

**新增文件**：`core/injectionKeys.ts`（DESIGN_MODE_KEY / SELECTED_NODE_ID_KEY / DESIGNER_ENGINE_KEY）

vue-tsc 零错误，154 测试全通过，Vite 构建成功。

### 未提交变更（2026-03-28）

上述质检和类型修复尚未 git commit（14 个 modified + 2 个 untracked 文件）。

### 第十六阶段进度（2026-03-29）

Step 5 Schema 迁移完成（2026-03-29 17:18）

commit 时间线：`e3ab15d` → `8b05669` → `2c96f0c` → `78eec2a` → `1a2aa9d` → `9480014` → `232b0aa` → `7aec6f3` → `63bb1f0` → `25f76da`

**最新 commit**：`25f76da` - 修复 absolute 容器节点 overlay 高度不同步问题

已完成的核心工作：
- XLayout 统一渲染器（替代条件渲染分支）
- AbsoluteNodeOverlay：拖拽移动 + 8 向缩放
- Flow/Free 双层交互分离架构：DesignOverlay（流式）+ AbsoluteNodeOverlay（绝对）
- 坐标偏移修复：overlay 移入 canvas-container，对齐 containing block
- VoidContainer 高度自适应：ResizeObserver 监听动态变化
- absolute 容器 overlay 叠加修复：选中态由 AbsoluteNodeOverlay 处理，hover/drop 由 DesignOverlay 处理
- 属性面板新增：定位类型选择器 + Free 模式位置/尺寸输入框
- 代码质检 4 Batch + vue-tsc 13 错误修复（未提交）

开发服务器：`http://localhost:5173`（在 prototype/ 目录运行 npx vite）
运行测试：`cd prototype && npx vitest run`
