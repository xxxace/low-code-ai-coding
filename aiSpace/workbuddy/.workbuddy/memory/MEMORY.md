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
| 布局 | 双布局（flow + free）统一在一套 Schema | 避免维护两套格式，按 layoutMode 切换 |
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

## 当前进度（2026-03-27，第十五阶段完成 + Bug 修复）

**已完成全部功能（15 个阶段）**，详见 `FEATURE_CHECKLIST.md`。

核心能力：
- core/ 全部模块（schema/model/reactions/registry）
- renderer/（FieldRenderer/FlowLayout/FreeLayout/VoidContainer）
- designer/ 全部 UI 组件 + engine + composables
- 容器组件（Card/Tabs/Collapse/Divider）物料注册 + 设计器交互
- 跨容器拖拽（容器内↔容器外，原子操作 moveNodeAcrossContainers）
- 单元测试 152 个全部通过（schemaUtils 43 / HistoryManager 16 / ComponentRegistry 24 / FormModel 52 / ReactionsEngine 17）
- TypeScript 零错误，Vite 构建成功

**StdForm 适配层已从规划中移除**（用户要求）。
**Monorepo 包结构从 4 包调整为 3 包**（core/renderer/designer，移除 stdform）。

开发服务器：`http://localhost:5173`（在 prototype/ 目录运行 npx vite）
运行测试：`cd prototype && npx vitest run`
