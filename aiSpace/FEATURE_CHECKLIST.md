# 低代码设计器功能清单

> 最后更新：2026-03-27
> 用途：跨会话功能进度档案，每次 session 开始前可直接读取此文件获知全貌

---

## 一、已完成（✅ 可用）

### 核心架构（core/）

| 模块 | 说明 |
|---|---|
| `schema.ts` | JSON Schema draft-07 + x-* 扩展；支持 I18nString、ContainerNode、SchemaNode、DataSourceConfig；Reaction 含 name/remark/enabled |
| `model.ts` | FormModel，reactive(Record) 响应式；嵌套字段、ArrayField 初始化、setValues、getErrors、getAllFields |
| `reactions.ts` | ReactionsEngine，watchEffect 联动引擎；CycleDetector 防死循环；flush:'post'；沙箱屏蔽危险全局（eval/Function/window/document 等）；enabled===false 时跳过规则 |
| `registry/ComponentRegistry.ts` | Widget/Decorator 注册；WidgetMeta 物料元信息；provide/inject 集成 |
| `registry/defaultRegistry.ts` | 内置 Element Plus 20+ 组件默认注册（Input/Select/Checkbox/Radio/DatePicker 等） |

### 渲染层（renderer/）

| 模块 | 说明 |
|---|---|
| `FieldRenderer.vue` | 接入 ComponentRegistry；Select/Checkbox/Radio options 渲染；readPretty 只读模式；designMode 强制可见；隐藏字段半透明+黄虚线；ContainerNode 占位分支（type='container'） |
| `FlowLayout` | display:flex + flex-wrap；字段宽度 = (x-span / columns) × 100%；支持 1~24 列 |
| `FreeLayout` | 自由定位组件（left/top/width/height），画布已有 |

### 设计器 UI（designer/）

| 模块 | 说明 |
|---|---|
| `DesignOverlay.vue` | MutationObserver+ResizeObserver DOM 坐标感知叠加层；hover 高亮/选中高亮；操作按钮（上移/下移/复制/删除）；四向边界自适应；HTML5 DnD 拖拽排序（x-order） |
| `HistoryManager.ts` | JSON 快照 undo/redo；indexRef 响应式副本（解决 class getter 不被 Vue 追踪） |
| `designerEngine.ts` | 精简 ~280 行；委托 schemaUtils 8 个纯函数；duplicateNode/moveNode/sortNodes/saveSnapshot |
| `schemaUtils.ts` | 8 个纯函数，可独立单元测试 |
| `designerBus.ts` | mitt 事件总线，DesignerEvents 类型已定义 |
| `composables/useMaterialDrag.ts` | 物料拖入画布 Composable |
| `composables/useKeyboardShortcuts.ts` | 键盘快捷键 Composable |
| `FieldProperties.vue` | 动态 Setter 渲染（PropGroup.vue + OptionsEditor.vue）；字段类型徽章；值类型下拉；联动规则摘要模式 + 弹窗入口 |
| `ReactionEditorDialog.vue` | 三区布局（顶栏搜索/新增 · 左侧规则列表 · 右侧详情编辑）；when 字符串直接编辑；enabled toggle；效果类型（显示/隐藏/禁用字段/必填/取消必填） |
| `PageProperties.vue` | 列数快捷按钮（1/2/3/4）+ el-input-number（1-24）；原地 Object.assign 修改（响应式无丢失） |
| `PropGroup.vue` | 带折叠的属性分组组件 |
| `OptionsEditor.vue` | 枚举选项编辑器（给 Select/Radio/Checkbox 用） |

### 工程质量

| 项目 | 说明 |
|---|---|
| 架构分层 | core → renderer → designer 单向依赖，零循环引用 |
| types/ 垫片层 | 4 个文件均为 re-export，20 个引用文件无需改动 |
| plugin-api.d.ts | 插件 API 类型契约（零运行时代价） |
| TypeScript | tsc --noEmit 零错误 |
| Vite 构建 | vite build 成功（1663 模块，无报错） |
| 开发服务器 | `npx vite`（prototype/ 目录），端口 5173 |

---

## 二、已设计/已占位，未正式实现（🔧 骨架在，功能缺）

| 功能 | 现状 | 备注 |
|---|---|---|
| ContainerNode / GroupRenderer.vue | Schema 类型已定义，FieldRenderer 有分支，GroupRenderer.vue 未建 | 嵌套渲染未实现 |
| FreeLayout 拖拽移动 + 8方向缩放 | FreeCanvas/FreeLayout 组件存在，deskclaw 已调研方案 | 交互逻辑未实现 |
| FunctionRegistry 逃生舱 | 接口类型已占位（用户写 setup 函数） | 无实际运行时 |
| designerBus 消费方 | mitt 实例已建、事件类型已定义 | 目前无任何消费方 |
| 插件加载/注册运行时 | plugin-api.d.ts 类型契约已写 | 无加载机制 |
| PropSetters 体系（code/json setter） | WidgetMeta.propSetters 已定义，text/number/boolean/select/options 已用 | code/json 类型 setter 的编辑器组件未实现 |

---

## 三、规划中，未开始（📋 待实现）

| 功能 | 说明 | 优先级 |
|---|---|---|
| StdForm 适配层 | 对接 MES 项目 RelationRegister / useArrayRefManager，生产接入最后一环 | 高 |
| 单元测试 | ReactionsEngine、FormModel、schemaUtils 均可独立测试，测试代码零行 | 高 |
| GroupRenderer.vue | ContainerNode 正式渲染，支持嵌套字段 | 中 |
| FreeLayout 完整交互 | 拖拽移动 + 8方向缩放（deskclaw 已调研方案可直接实现） | 中 |
| 预览模式 | 设计器内切换"运行预览"，目前无模式切换按钮 | 中 |
| 导出/导入 Schema | Schema JSON 文件导出与导入 | 中 |
| x-relation 关系字段 UI | Schema 有 x-relation，属性面板无对应 Setter | 中 |
| 数据源配置 UI | DataSourceConfig 类型已定义，无设计器界面 | 低 |
| ComponentRegistry 懒加载 | 大项目按需加载物料（代码分割），目前全量注册 | 低 |
| 移动端/响应式 breakpoint | 当前布局针对 PC，无 breakpoint 配置 | 低 |
| Monorepo 拆包 | 设计决策 4 包（core/renderer/designer/stdform），目前仍单包 | 低 |

---

## 四、已知问题记录（🐛）

| 问题 | 状态 |
|---|---|
| reactive(Map) 响应式追踪失效 | ✅ 已修复（改用 reactive(Record)） |
| class getter 不被 Vue 追踪（undo/redo 按钮不更新） | ✅ 已修复（indexRef 响应式副本） |
| columns 修改无反应（深拷贝覆盖 proxy） | ✅ 已修复（原地 Object.assign） |
| reactions.ts 沙箱 eval 不能作为 strict mode 形参名 SyntaxError | ✅ 已修复（改名 __sandbox_eval__） |
| 条件渲染字段在设计时不可见 | ✅ 已修复（designMode provide/inject） |
| 条件渲染首屏状态不正确 | ✅ 已修复（ReactionsEngine.init() 立即执行一轮） |
| undo/redo 条件渲染预览缺 otherwise | ✅ 已修复（updateReactionFulfill 自动补充反向状态） |

---

## 五、关键技术决策（ADR 摘要）

| 决策 | 结论 |
|---|---|
| 响应式系统 | Vue 3 原生 reactive/watchEffect（不引入第三方响应式） |
| Schema 基础 | JSON Schema draft-07 + x-* 扩展 |
| 布局 | 双布局（flow + free）统一一套 Schema，按 layoutMode 切换 |
| 关系字段 | x-relation 扩展对接 RelationRegister |
| 历史记录 | JSON 快照模式（snapshots[] + index） |
| 包结构 | 4 包 Monorepo（core/renderer/designer/stdform）——规划，未拆 |
| 架构分层 | core → renderer → designer 单向依赖 |
| 垫片兼容 | types/ 4 文件 re-export，零破坏性变更 |

---

## 六、目录结构速查

```
prototype/src/
  core/
    schema.ts
    model.ts
    reactions.ts
    registry/
      registryTypes.ts
      ComponentRegistry.ts
      defaultRegistry.ts
      index.ts
  designer/
    engine/
      schemaUtils.ts
      HistoryManager.ts
      designerEngine.ts
      designerBus.ts
    composables/
      useMaterialDrag.ts
      useKeyboardShortcuts.ts
    Designer.vue
    LowcodeDesigner.vue
    DesignOverlay.vue
    FieldProperties.vue
    PageProperties.vue
    ReactionEditorDialog.vue
    PropGroup.vue
    OptionsEditor.vue
  renderer/
    FieldRenderer.vue
    FlowLayout.vue
    FreeLayout.vue
  types/              ← 垫片层，全部 re-export from core/
  index.ts
  plugin-api.d.ts
```

---

*此文件由 AI agent (Aiden) 维护，每阶段完成后更新。*
