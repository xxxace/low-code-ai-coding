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

## 第十六阶段：XLayout 架构演进（规划中）

详见 `D:\demo\ai\aiSpace\design\FreeLayout-Interaction-Plan.md`。

### 已知 Bug（发现于 2026-03-27 下午，用户截图确认）
1. **Bug1**：流式布局切换到自由布局，内容不渲染 → 根因：FreeLayout 用 `v-if` 过滤无 `x-free-position` 的字段
2. **Bug2**：节点高亮和工具栏样式异常 → 根因：FreeLayout + FreeCanvas 双层 drag/resize 冲突
3. **Bug3**：失焦后无法选中和高亮 → 根因：同 Bug2

### XLayout 架构方案（用户确认方向）
- **核心理念**：用 `x-position-type` 替代 `layoutMode` 全局开关，每个字段独立决定是 flow 还是 free
- **Phase 1**：修 Bug（FreeLayout designMode 禁用 drag/resize，切换布局时补全 x-position-type）
- **Phase 2**：创建 XLayout.vue（统一渲染层，组合 FlowLayout + FreeLayout 渲染逻辑）
- **Phase 3**：属性面板 PositionTypeSetter（flow/free 下拉切换）

### 待实现功能（按优先级）
1. XLayout 架构（第十六阶段）：Phase 1 修 Bug + Phase 2 XLayout + Phase 3 Setter
2. x-relation 关系字段 UI（中）：属性面板无 Setter
3. 其他低优先级项见 FEATURE_CHECKLIST.md

### 已否决/移除项
- GroupRenderer.vue：已否决，由 VoidContainer 替代
- StdForm 适配层：已从规划中移除
- Monorepo 4包→3包（core/renderer/designer）

开发服务器：`http://localhost:5173`（在 prototype/ 目录运行 npx vite）
运行测试：`cd prototype && npx vitest run`
