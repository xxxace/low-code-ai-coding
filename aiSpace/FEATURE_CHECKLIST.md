# 低代码设计器功能清单

> 最后更新：2026-04-04
> 用途：跨会话功能进度档案，每次 session 开始前可直接读取此文件获知全貌

---

## 一、已完成（✅ 可用）

### 核心架构（core/）

| 模块 | 说明 |
|---|---|
| `schema.ts` | JSON Schema draft-07 + x-* 扩展；支持 I18nString、ContainerNode、SchemaNode、DataSourceConfig；Reaction 含 name/remark/enabled；`x-position-type: 'relative' \| 'absolute'`；`x-position: {x,y,width,height,zIndex}` |
| `model.ts` | FormModel，reactive(Record) 响应式；嵌套字段、ArrayField 初始化、setValues、getErrors、getAllFields |
| `reactions.ts` | ReactionsEngine，watchEffect 联动引擎；CycleDetector 防死循环；flush:'post'；沙箱屏蔽危险全局；enabled===false 时跳过规则 |
| `registry/ComponentRegistry.ts` | Widget/Decorator 注册；WidgetMeta 物料元信息；provide/inject 集成 |
| `registry/defaultRegistry.ts` | 内置 Element Plus 20+ 组件默认注册（Input/Select/Checkbox/Radio/DatePicker 等）；容器组件（Card/Tabs/Collapse/Divider）注册 |
| `injectionKeys.ts` | DESIGN_MODE_KEY / SELECTED_NODE_ID_KEY / DESIGNER_ENGINE_KEY / FORM_RENDERER_KEY（InjectionKey 强类型） |

### 渲染层（renderer/）

| 模块 | 说明 |
|---|---|
| `XLayout.vue` | 统一布局渲染器，替代 FlowLayout + FreeLayout；relative 节点走 flex-wrap 流式排列；absolute 节点走绝对定位（x/y/width/height） |
| `FieldRenderer.vue` | 接入 ComponentRegistry；Select/Checkbox/Radio options 渲染；readPretty 只读模式；designMode 强制可见；隐藏字段半透明+黄虚线；widgetStyle 统一两套 widget style |
| `VoidContainer.vue` | void 容器渲染器（Card/Tabs/Collapse/Divider）；data-field-id 属性 + 选中高亮；子节点递归渲染 |
| `FormRenderer.vue` | 根渲染器，初始化 FormModel + ReactionsEngine；provide 关键 inject key |

### 设计器 UI（designer/）

| 模块 | 说明 |
|---|---|
| `DesignOverlay.vue` | MutationObserver+ResizeObserver DOM 坐标感知叠加层；hover 高亮/选中高亮；操作按钮（上移/下移/复制/删除）；四向边界自适应；HTML5 DnD 拖拽排序；跨容器拖拽；**流式节点拖入 absolute 容器**（intent=into，绿框高亮） |
| `AbsoluteNodeOverlay.vue` | absolute 节点的拖拽移动 + 8方向缩放；与 DesignOverlay 职责分离 |
| `HistoryManager.ts` | JSON 快照 undo/redo；indexRef 响应式副本 |
| `designerEngine.ts` | 精简 ~300 行；委托 schemaUtils 纯函数；duplicateNode/moveNode/sortNodes/moveNodeToContainer/moveNodeAcrossContainers/updateNodeProps/saveSnapshot |
| `schemaUtils.ts` | 9 个纯函数（含 findSourceNode 共享函数），可独立单元测试 |
| `designerBus.ts` | mitt 事件总线，DesignerEvents 类型已定义 |
| `composables/useMaterialDrag.ts` | 物料拖入画布 Composable |
| `composables/useKeyboardShortcuts.ts` | 键盘快捷键（Delete 删除，Ctrl+Z/Y undo/redo） |
| `FieldProperties.vue` | 动态 Setter 渲染（PropGroup.vue + OptionsEditor.vue）；字段类型徽章；值类型下拉；联动规则摘要模式 + 弹窗入口 |
| `ReactionEditorDialog.vue` | 三区布局；when 字符串直接编辑；enabled toggle；效果类型（显示/隐藏/禁用/必填/取消必填） |
| `PageProperties.vue` | 列数快捷按钮（1/2/3/4）+ el-input-number（1-24）；原地 Object.assign 修改 |
| `LowcodeDesigner.vue` | 三栏布局；工具栏（流式/自由切换、undo/redo、预览、导入/导出）；预览弹窗；Schema 导入 validateImportedSchema |

### 工程质量

| 项目 | 说明 |
|---|---|
| 架构分层 | core → renderer → designer 单向依赖，零循环引用 |
| types/ 垫片层 | 4 个文件均为 re-export from core/，20+ 引用文件无需改动 |
| TypeScript | vue-tsc --noEmit 零错误 ✅ |
| 单元测试 | Vitest 149/149 全通过（schemaUtils 41 / HistoryManager 16 / ComponentRegistry 24 / FormModel 52 / ReactionsEngine 16）✅ |
| 开发服务器 | `npx vite`（prototype/ 目录），端口 5173 |

---

## 二、已设计/占位，未正式实现（🔧 骨架在，功能缺）

| 功能 | 现状 | 备注 |
|---|---|---|
| FunctionRegistry 逃生舱 | 接口类型已占位（用户写 setup 函数） | 无实际运行时 |
| designerBus 消费方 | mitt 实例已建、事件类型已定义 | 目前无任何消费方 |
| 插件加载/注册运行时 | plugin-api.d.ts 类型契约已写 | 无加载机制 |
| PropSetters 体系（code/json setter） | text/number/boolean/select/options 已用 | code/json 类型 setter 编辑器组件未实现 |

---

## 三、规划中，未开始（📋 待实现）

| 功能 | 说明 | 优先级 |
|---|---|---|
| PositionTypeSetter 属性面板 | 字段定位类型切换（relative↔absolute），切换时自动生成/清理 x-position | 🔴 高 |
| 批量切换工具栏 | 工具栏「一键全部转流式/全部转自由」按钮 | 🟡 中 |
| x-relation 关系字段 UI | Schema 有 x-relation，属性面板无对应 Setter | 🟡 中 |
| 数据源配置 UI | DataSourceConfig 类型已定义，无设计器界面 | 🟢 低 |
| ComponentRegistry 懒加载 | 大项目按需加载物料（代码分割），目前全量注册 | 🟢 低 |
| 移动端/响应式 breakpoint | 当前布局针对 PC，无 breakpoint 配置 | 🟢 低 |
| Monorepo 拆包 | 设计决策 3 包（core/renderer/designer），目前仍单包 | 🟢 低 |

---

## 四、已否决/已归档

| 项目 | 状态 |
|---|---|
| GroupRenderer.vue | 否决，VoidContainer 替代 |
| StdForm 适配层（4包→3包） | 已移除 |
| FlowLayout.vue | 已删除，XLayout 替代 |
| FreeLayout.vue / FreeCanvas.vue / Designer.vue / PropertyPanel.vue | 已删除（XLayout 演进时清理） |
| layoutMode 全局开关 | 已移除，改为 x-position-type per-node |
| x-free-position | 已移除，改为 x-position |
| AllFieldTypes 类型 | 已删除（死代码） |
| getGlobalRegistry / setGlobalRegistry | 已删除（全局单例反模式） |

---

## 五、已知问题记录（🐛）

| 问题 | 状态 |
|---|---|
| reactive(Map) 响应式追踪失效 | ✅ 已修复（改用 reactive(Record)） |
| class getter 不被 Vue 追踪（undo/redo 按钮不更新） | ✅ 已修复（indexRef 响应式副本） |
| columns 修改无反应（深拷贝覆盖 proxy） | ✅ 已修复（原地 Object.assign） |
| reactions.ts 沙箱 eval SyntaxError | ✅ 已修复（改名 __sandbox_eval__） |
| 条件渲染字段在设计时不可见 | ✅ 已修复（designMode provide/inject） |
| 条件渲染首屏状态不正确 | ✅ 已修复（ReactionsEngine.init() 立即执行一轮） |
| undo/redo 条件渲染预览缺 otherwise | ✅ 已修复（updateReactionFulfill 自动补充反向状态） |
| 复制容器节点时子节点 x-id 未重新生成 | ✅ 已修复（regenerateIds 递归函数） |
| 内嵌节点跨容器拖拽释放后不生效 | ✅ 已修复（moveNodeAcrossContainers 原子操作） |
| designMode.value 缺少 .value（B-02/B-03） | ✅ 已修复（FieldRenderer/VoidContainer） |
| FieldProperties emitUpdate falsy 过滤 bug | ✅ 已修复 |
| schemaUtils.ts 两步断言类型错误 | ✅ 已修复（as unknown as Record<...>） |

---

## 六、关键技术决策（ADR 摘要）

| 决策 | 结论 |
|---|---|
| 响应式系统 | Vue 3 原生 reactive/watchEffect |
| Schema 基础 | JSON Schema draft-07 + x-* 扩展 |
| 布局模式 | `x-position-type: 'relative'\|'absolute'` per-node；XLayout 统一渲染；layoutMode 已彻底移除 |
| 关系字段 | x-relation 扩展，对接 RelationRegister |
| 历史记录 | JSON 快照模式（snapshots[] + index） |
| 包结构 | 3 包 Monorepo（core/renderer/designer）——规划，未拆；stdform 适配层已移除 |
| 架构分层 | core → renderer → designer 单向依赖 |
| InjectionKey | 强类型 InjectionKey 替代字符串（FORM_RENDERER_KEY 等） |
| 键盘删除 | 仅 Delete（不含 Backspace，避免编辑输入框误触发） |

---

## 七、目录结构速查（当前真实）

```
prototype/src/
  core/
    schema.ts
    model.ts
    reactions.ts
    injectionKeys.ts
    registry/
      registryTypes.ts
      ComponentRegistry.ts
      defaultRegistry.ts
      index.ts
    __tests__/
      ComponentRegistry.test.ts
      FormModel.test.ts
      ReactionsEngine.test.ts
      smoke.test.ts
  designer/
    engine/
      schemaUtils.ts
      HistoryManager.ts
      designerEngine.ts
      designerBus.ts
      __tests__/
        schemaUtils.test.ts
        HistoryManager.test.ts
    composables/
      useMaterialDrag.ts
      useKeyboardShortcuts.ts
    LowcodeDesigner.vue
    DesignOverlay.vue
    AbsoluteNodeOverlay.vue
    FieldProperties.vue
    PageProperties.vue
    ReactionEditorDialog.vue
    PropGroup.vue
    OptionsEditor.vue
    MaterialPalette.vue
  renderer/
    XLayout.vue          ← 统一布局（替代 FlowLayout + FreeLayout）
    FieldRenderer.vue
    VoidContainer.vue
    FormRenderer.vue
  types/              ← 垫片层，全部 re-export from core/
  test/
    setup.ts
  index.ts
  plugin-api.d.ts
```

---

*此文件由奥卡姆剃刀大将军维护，每阶段完成后更新。最后更新：2026-04-04*
