# 长期记忆

## 工作空间信息

- 工作空间（workbuddy agent）：`d:\demo\ai\aiSpace\workbuddy`
- 共享 AI 工作目录：`d:\ai\low-code-ai-coding\aiSpace`（由本 agent 与 deskclaw agent 共同使用）
- 原型代码路径：`d:\ai\low-code-ai-coding\aiSpace\prototype\src\`
- 注意：旧路径 `D:\demo\ai\aiSpace` 已不存在，请使用上述路径

## 项目背景

为某 MES（制造执行系统）项目开发 Vue 3 低代码设计器，命名 StdForm 低代码扩展。
技术栈：Vue 3 + TypeScript + Element Plus + Pinia。

## 重要文件索引

- 功能进度清单：`D:\demo\ai\aiSpace\FEATURE_CHECKLIST.md`
- 编码规范：`D:\demo\ai\aiSpace\编码风格总结.md`
- 设计文档：`D:\demo\ai\aiSpace\design\`
- 任务文件：`D:\demo\ai\aiSpace\NEXT_PROMPT.md`
- 开发服务器：`http://localhost:5173`（在 prototype/ 目录运行 `npx vite`）
- 运行测试：`cd prototype && npx vitest run`

## 编码规范摘要

- 文件命名：Vue 组件大驼峰，TS 文件小驼峰
- 事件处理函数用 `handle` 前缀，Ref 变量用 `Ref` 后缀，Manager 类用 `Manager` 后缀
- 异步：async/await + try-catch；禁止 var；禁止直接操作 DOM

## 重要技术决策（ADR）

| 决策 | 结论 |
|------|------|
| 响应式系统 | Vue 3 原生 reactive/watchEffect |
| Schema 基础 | JSON Schema draft-07 + x-* 扩展 |
| 布局模式 | `x-position-type: 'relative'|'absolute'` + XLayout 统一渲染（layoutMode 已移除） |
| 关系字段 | x-relation 扩展，对接 RelationRegister |
| 历史记录 | JSON 快照模式（snapshots[] + index） |
| 包结构 | 3 包（core/renderer/designer），StdForm 适配层已移除 |

## 当前进度（截至 2026-03-30）

**第十六阶段 XLayout 架构演进**：Step 0~5 全部完成 ✅

最新 commit：`25f76da` - 修复 absolute 容器节点 overlay 高度不同步问题

commit 时间线：`e3ab15d` → `8b05669` → `2c96f0c` → `78eec2a` → `1a2aa9d` → `9480014` → `232b0aa` → `7aec6f3` → `63bb1f0` → `25f76da`

核心已完成能力：
- core/ 全模块（schema/model/reactions/registry）
- renderer/（FieldRenderer/FlowLayout/VoidContainer/XLayout）
- designer/ 全 UI 组件 + engine + composables
- 容器组件（Card/Tabs/Collapse/Divider）物料注册 + 设计器交互
- 跨容器拖拽（moveNodeAcrossContainers 原子操作）
- 预览、导出 Schema、导入 Schema（含校验+确认）
- XLayout 统一渲染器 + AbsoluteNodeOverlay（拖拽/缩放）
- Flow/Free 双层交互：DesignOverlay（流式）+ AbsoluteNodeOverlay（绝对）
- VoidContainer 高度自适应（ResizeObserver）
- 代码质检 4 Batch（18 个问题）+ vue-tsc 13 错误全修复
- 单元测试：当前基线 149 个（Step 5 迁移后），TypeScript 零错误

**2026-03-30 类型错误修复**：
- `PageSchema` 接口添加 `'x-position-type'` 属性（修复 DesignOverlay.vue 和 LowcodeDesigner.vue 的类型错误）
- `FormRenderer.vue` 将 `provide(SELECTED_NODE_ID_KEY, ref(null))` 改为 `computed(() => null)` 以匹配 `ComputedRef<string | null>` 类型
- `VoidContainer.vue` 将 `fieldSchema` 类型从 `Record<string, unknown>` 改为 `FieldSchema` 并添加必需的 `type` 字段
- 类型检查：`vue-tsc --noEmit` 零错误 ✅
- 单元测试：149 个全部通过 ✅

## 待实现功能（优先级排序）

1. Step 4：批量切换工具栏 + PositionTypeSetter 属性面板（高优，下一步）
2. x-relation 关系字段 UI（中）
3. 其他低优先级项见 FEATURE_CHECKLIST.md

## 已否决/移除项

- GroupRenderer.vue：由 VoidContainer 替代
- StdForm 适配层：已移除
- Monorepo 4包→3包

## XLayout 架构核心设计

- `x-position-type: 'relative'`（默认）→ 正常流式排列
- `x-position-type: 'absolute'` → 自由定位（x/y/width/height）
- 容器默认 position: relative，建立内部 absolute 子节点的定位上下文
- InjectionKey：DESIGN_MODE_KEY / SELECTED_NODE_ID_KEY / DESIGNER_ENGINE_KEY（in core/injectionKeys.ts）

## Superpowers 升级完成（2026-03-30）

从 `D:\github\superpowers` 评估引入 4 个 skills，已安装至 `d:\demo\ai\aiSpace\.workbuddy\skills\`：

1. `systematic-debugging` ✅ 已安装
   - 核心原则：根因驱动调试，禁止猜测性修复
   - 铁律：未完成 Phase 1（根因调查）不能提出修复方案
   - 适用：所有技术问题（测试失败、bug、构建失败等）
   - 关键流程：4 阶段（根因调查 → 模式分析 → 假设测试 → 实现修复）

2. `verification-before-completion` ✅ 已安装
   - 核心原则：证据先于断言
   - 铁律：未运行验证命令不能声称完成
   - 适用：任何成功/完成声明之前
   - 关键流程：IDENTIFY（识别验证命令）→ RUN（执行）→ READ（读输出）→ VERIFY（确认）

3. `brainstorming` ✅ 已安装（轻量裁剪版）
   - 触发条件：**仅当新功能没有对应设计文档时**
   - 流程：1 个澄清问题 + 2-3 个方案选项 → 用户确认 → 开始编码
   - 不触发：已有设计文档的功能、FEATURE_CHECKLIST 中已规划的功能
   - 与完整版区别：无需写完整设计文档，无需保存到 `docs/superpowers/specs/`

4. `task-quality-standards` ✅ 已创建（项目专属）
   - 来源：合并 `writing-plans` 和 `subagent-driven-development` 精华
   - 移除：git worktrees 依赖、parallel session、superpowers 特定 subagent 类型
   - 核心原则：
     - 任务粒度：每个任务 2-5 分钟
     - No Placeholders：每步必须包含完整信息（无 TBD/TODO）
     - 完成前验证：证据先于声明
     - 两阶段 review（委托 subagent 时）：spec 合规性 → 代码质量
     - Self-review checklist（完整性、质量、验证）

**不引入（10 个）：**
- `dispatching-parallel-agents`（无多 agent 环境）
- `test-driven-development`（与项目测试补充型风格冲突）
- `using-git-worktrees`（项目不使用 worktrees）
- `finishing-a-development-branch`（依赖 worktrees）
- `writing-skills`（给 skill 作者用，不适用业务代码）
- `receiving-code-review`、`requesting-code-review`（功能单薄）
- `hooks`（Claude Code 专属，不适用当前平台）
- `subagent-driven-development`（仅提取精华，已合并到 task-quality-standards）

**安装路径：** `d:\demo\ai\aiSpace\.workbuddy\skills\{skill-name}\SKILL.md`

## 其他记录

- 键盘删除快捷键：仅 Delete（不含 Backspace，避免编辑输入框时误触发）
- deskclaw 调研文档：`D:\demo\ai\aiSpace\summary\void-container-height-auto-resize-research-task.md`
