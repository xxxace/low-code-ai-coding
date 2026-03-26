# 长期记忆

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
| 包结构 | 4 包 Monorepo（core/renderer/designer/stdform） | 依赖单向，渲染器可独立使用 |

## 编码规范

见 `D:\demo\ai\aiSpace\编码风格总结.md`。关键规范：
- 文件命名：Vue 组件大驼峰，TS 文件小驼峰
- 事件处理函数用 `handle` 前缀
- Ref 变量用 `Ref` 后缀
- Manager 类用 `Manager` 后缀
- 异步：async/await + try-catch
- 禁止使用 var，禁止直接操作 DOM

## 当前进度（2026-03-26，第三阶段完成）

第三阶段已完成（自检雕琢）：
- ✅ model.ts：修复 reactive(Map) 响应式追踪失效 → 改用 reactive(Record)；修复 getAllFields() 返回类型；补充 ArrayField 初始化、setValues、getErrors
- ✅ reactions.ts：添加 CycleDetector 防止循环联动；使用 flush:'post' 避免渲染期副作用；大幅加强沙箱安全（屏蔽 window/document/eval/Function 等危险全局对象）
- ✅ componentRegistry.ts（新建）：ComponentRegistry 类，支持 Widget/Decorator 注册、物料元信息、Vue provide/inject 集成、内置 Element Plus 组件默认注册（共 20+ 组件）
- ✅ FieldRenderer.vue：接入 ComponentRegistry；支持 Select/Checkbox/Radio 的 options 渲染；新增 readPretty 只读展示模式；补充 data-field-id 属性
- ✅ DesignOverlay.vue：重写为 MutationObserver + ResizeObserver DOM 坐标感知叠加层；hover 高亮/选中高亮/操作按钮（上移/下移/复制/删除）/拖拽指示线
- ✅ designerEngine.ts：添加 duplicateNode/moveNode/sortNodes/saveSnapshot（公开）；修复 layoutMode 更新逻辑（不再调用错误的 updateNodeProps）
- ✅ Vite 开发环境：package.json + vite.config.ts + tsconfig.json + index.html + main.ts + App.vue（三标签演示页）
- ✅ useDragSort.ts（新建）：HTML5 DnD 拖拽排序 Composable，无外部依赖

开发服务器：`http://localhost:5173`（在 prototype/ 目录运行 npx vite）
TypeScript 类型检查：零错误

## 工作空间优化（2026-03-26）
执行奥卡姆剃刀清理任务：
- ✅ 清理构建产物：删除 prototype/dist/ 目录
- ✅ 分析目录结构：确认 aiSpace/ 为核心工作区，template/ 为示例代码区
- ✅ 检查冗余文件：未发现明显重复或过时文件
- ✅ 创建优化报告：生成《奥卡姆剃刀清理报告.md》包含5项优化建议
- 关键发现：工作空间结构良好，主要文件为 template/mes/ 中的示例代码

## 第八阶段（2026-03-26）：交互增强与 Bug 修复

- ✅ DesignOverlay：操作栏边界自适应（靠近顶部时显示在字段下方）
- ✅ DesignOverlay：操作栏新增快速列宽按钮（6/8/12/16/24），点击直接更新 x-span
- ✅ DesignOverlay：HTML5 DnD 拖拽排序，拖拽字段交换 x-order，drag-over 黄色指示
- ✅ PageProperties：布局列数快速选择（不限/2列/3列/4列），快速操作提示面板
- ✅ reactions.ts：沙箱修复 —— `eval` 不能作为 strict mode 形参名，改为 `__sandbox_eval__`，修复 `when: '$self.value === true'` 的 SyntaxError

## 第九阶段（2026-03-26）：布局重构 + 操作栏四向边界

- ✅ FlowLayout 重构：`display:grid 24列` → `display:flex flex-wrap`；字段宽度 = `(x-span / columns) * 100%`
- ✅ x-span 语义变更：原来表示 grid 列数（1-24），现在表示「占 columns 总列数中的几列」（默认1）
- ✅ FormRenderer：传 `:columns="formConfig.columns ?? 1"` 给 FlowLayout（修复修改列数无反应的Bug）
- ✅ PageProperties：布局列数改为 1/2/3/4（直接列数）
- ✅ DesignOverlay：`getActionsStyle()` 函数统一四向边界检测，操作栏始终在画布内可见
- ✅ 奥卡姆剃刀：移除操作栏快速列宽按钮（非必要功能）

## 第十阶段（2026-03-26）：columns 响应式根治 + 自定义列数输入

- ✅ `handlePagePropsUpdate` 改为原地修改（`Object.assign(engine.schema.value.formConfig, ...)`），不再深拷贝替换整个 schema 对象，彻底解决 Vue reactive proxy 被新 plain object 覆盖导致响应式失效的问题
- ✅ 布局列数 UI 升级：快捷按钮（1/2/3/4）+ el-input-number 自定义输入框（1-24），共享同一 `form.columns`

## 第十一阶段（2026-03-26）：条件渲染可见性 + Property Setter 体系

### 条件渲染字段设计时不可见问题
- **方案**：`FormRenderer` 新增 `designMode` prop，通过 `provide('designMode', true)` 传给所有子组件
- `FieldRenderer` 注入 `designMode`，当为 true 时强制 `display !== 'none'` 为可见（忽略联动）
- hidden 状态字段在设计模式下显示为半透明 + 黄色虚线边框（提示有隐藏规则）

### Property Setter 体系
- **类型**：在 `WidgetMeta` 里新增 `propSetters?: PropSetterGroup[]`，每个 Setter 有 key/label/setter/options/tip
- **Setter 类型**：text / number / boolean / select / options / code / json
- **组件覆盖**：为全部 16 个注册组件（Input/Textarea/InputNumber/Password/Select/Cascader/TreeSelect/CheckboxGroup/RadioGroup/DatePicker/DateRangePicker/TimePicker/DateTimePicker/Switch/Slider/Rate/ColorPicker/Upload）配置了专属 propSetters
- **新组件**：`PropGroup.vue`（带折叠的属性分组）、`OptionsEditor.vue`（枚举选项编辑器）
- **FieldProperties 重构**：从硬编码改为动态渲染；顶部增加字段类型标识徽章；联动规则增加"结果类型"下拉（visible/hidden/disabled/readOnly/required）

下一步（第四阶段候选）：
- 实现 StdForm 适配层（连接现有 MES 项目的 RelationRegister / useArrayRefManager）
- 编写单元测试（ReactionsEngine、FormModel）
- FreeLayout 的拖拽移动 + 8方向缩放（deskclaw 已调研方案，可直接实现）
- ComponentRegistry 的懒加载支持（代码分割）
