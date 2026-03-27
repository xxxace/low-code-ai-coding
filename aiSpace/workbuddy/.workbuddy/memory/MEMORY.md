# 长期记忆

## 功能清单档案

- **完整功能进度清单**：`D:\demo\ai\aiSpace\FEATURE_CHECKLIST.md`（已完成/骨架在/待实现/已知问题/ADR/目录结构，session 开始时可直接读取）

## 工作空间信息

- 工作空间：`D:\demo\ai\aiSpace\workbuddy`
- 共享 AI 工作目录：`D:\demo\ai\aiSpace`（由本 agent 与 deskclaw agent 共同使用）

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
| 布局模式 | `x-position-type: 'flow' \| 'free'` + XLayout 统一渲染 | 取代 layoutMode 全局开关，每个字段独立决定定位类型，FlowLayout + FreeLayout 和谐共存 |
| 关系字段 | x-relation 扩展，对接 RelationRegister | MES 业务特有需求，已有 StdForm 基础设施 |
| 历史记录 | JSON 快照模式（snapshots[] + index） | 简单可靠，visual-drag-demo 验证过 |
| 包结构 | 3 包 Monorepo（core/renderer/designer） | StdForm 已移除规划 |

## 编码规范

见 `D:\demo\ai\aiSpace\编码风格总结.md`。关键规范：
- 文件命名：Vue 组件大驼峰，TS 文件小驼峰
- 事件处理函数用 `handle` 前缀
- Ref 变量用 `Ref` 后缀
- Manager 类用 `Manager` 后缀
- 异步：async/await + try-catch
- 禁止使用 var，禁止直接操作 DOM

## 当前进度（2026-03-27，第十五阶段完成 + Bug 修复 + 导入完成）

**已完成全部功能（15 个阶段）**，详见 `FEATURE_CHECKLIST.md`。

核心能力：
- core/ 全部模块（schema/model/reactions/registry）
- renderer/（FieldRenderer/FlowLayout/FreeLayout/VoidContainer）
- designer/ 全部 UI 组件 + engine + composables
- 容器组件（Card/Tabs/Collapse/Divider）物料注册 + 设计器交互
- 跨容器拖拽（容器内↔容器外，原子操作 moveNodeAcrossContainers）
- 预览功能（el-dialog 弹窗）
- 导出 Schema（handleExport JSON 下载）
- 导入 Schema（validateImportedSchema 校验 + ElMessageBox 覆盖确认 + engine.loadSchema）
- 单元测试 154 个全部通过（2026-03-27 下午）
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
| Step 0 | 移除 wrapper div，修复 containing block 语义 | ✅ 已完成（8b05669） |
| Step 1 | 创建 XLayout.vue + VoidContainer 改造 | ✅ 已完成（e3ab15d） |
| Step 2 | FormRenderer 使用 XLayout，移除 FreeCanvas/DesignOverlay | ✅ 已完成（e3ab15d） |
| Step 3 | AbsoluteNodeOverlay 统一交互层 | ⏳ 待实现 |
| Step 4 | 批量切换工具栏 + PositionTypeSetter | ⏳ 待实现 |
| Step 5 | 旧 Schema 迁移（layoutMode → x-position-type） | ⏳ 待实现 |

### Step 0 关键决策
- **定位样式透传**：XLayout 的 getNodeStyle() 通过 `nodeStyle` prop 透传给 VoidContainer/FieldRenderer 根元素
- **不包 wrapper**：定位逻辑直接在根元素上，保留 CSS containing block 语义
- **父元素约束**：absolute 节点拖拽只改坐标，禁止切换父容器（CSS 天然语义）
- **第三方组件**：VoidContainer 根元素即为 containing block，slot 容器不影响

### 关键文件
- `renderer/XLayout.vue`（新建，统一渲染层）
- `renderer/VoidContainer.vue`（改造，容器建立定位上下文）
- `renderer/FormRenderer.vue`（改造，使用 XLayout 替代条件渲染）
- `core/schema.ts`（新增 x-position-type 和 x-position 类型）

### 待实现功能（按优先级）
1. Step 3: AbsoluteNodeOverlay 统一交互层（高优）
2. Step 4: PositionTypeSetter 属性面板（高优）
3. Step 5: 旧 Schema 迁移（layoutMode → x-position-type）
4. x-relation 关系字段 UI（中）
5. 其他低优先级项见 FEATURE_CHECKLIST.md

### 已否决/移除项
- GroupRenderer.vue：已否决，由 VoidContainer 替代
- StdForm 适配层：已从规划中移除
- Monorepo 4包→3包（core/renderer/designer）

开发服务器：`http://localhost:5173`（在 prototype/ 目录运行 npx vite）
运行测试：`cd prototype && npx vitest run`
