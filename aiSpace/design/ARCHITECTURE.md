# Vue 3 低代码设计器 — 架构设计文档

> 版本：v2.0（更新于 2026-04-04）
> 原始创建：2026-03-26
> 状态：与代码同步

---

## 一、设计理念

**融合而非搬运**：取各调研项目之精华，结合 MES 业务场景，设计一套适合实际生产的低代码解决方案。

| 借鉴来源 | 取其精华 |
|---------|---------|
| **Formily** | x-reactions 声明式联动、VoidField 虚节点容器 |
| **VForm3** | 设计器+渲染器分离架构 |
| **vue-json-schema-form** | Field+Widget 职责分离 |
| **visual-drag-demo** | 快照撤销/重做、自由布局坐标计算原理 |

---

## 二、整体架构

### 2.1 分层架构（当前实现）

```
designer/          ← 设计器层（LowcodeDesigner + DesignOverlay + AbsoluteNodeOverlay + 属性面板）
    ↓ 依赖
renderer/          ← 渲染层（XLayout + FieldRenderer + VoidContainer + FormRenderer）
    ↓ 依赖
core/              ← 核心层（Schema 类型 + FormModel + ReactionsEngine + ComponentRegistry）
```

**单向依赖，零循环引用。**

### 2.2 目录结构（当前真实）

```
prototype/src/
  core/
    schema.ts          # JSON Schema draft-07 + x-* 扩展
    model.ts           # FormModel（reactive(Record)）
    reactions.ts       # ReactionsEngine（watchEffect 联动）
    injectionKeys.ts   # 强类型 InjectionKey 集中定义
    registry/          # ComponentRegistry + defaultRegistry（20+ EP 组件）
  renderer/
    XLayout.vue        # 统一布局渲染器（relative 流式 + absolute 自由定位）
    FieldRenderer.vue  # Field + Widget 分离渲染
    VoidContainer.vue  # Card/Tabs/Collapse/Divider 容器渲染
    FormRenderer.vue   # 根渲染器，初始化 FormModel
  designer/
    engine/
      designerEngine.ts    # 设计器引擎（节点操作 + 历史快照）
      schemaUtils.ts       # 9 个纯函数（可独立单测）
      HistoryManager.ts    # JSON 快照 undo/redo
      designerBus.ts       # mitt 事件总线
    composables/
      useMaterialDrag.ts       # 物料拖入画布
      useKeyboardShortcuts.ts  # 键盘快捷键
    LowcodeDesigner.vue      # 主入口，三栏布局
    DesignOverlay.vue        # DOM 坐标感知叠加层（hover/select/DnD）
    AbsoluteNodeOverlay.vue  # absolute 节点拖拽移动 + 8方向缩放
    FieldProperties.vue      # 字段属性面板
    PageProperties.vue       # 页面属性面板（列数等）
    ReactionEditorDialog.vue # 联动规则编辑弹窗
    MaterialPalette.vue      # 物料面板
  types/             # 垫片层（re-export from core/）
  index.ts           # 公共导出
  plugin-api.d.ts    # 插件 API 类型契约
```

---

## 三、核心模块设计

### 3.1 Schema 设计

基于 JSON Schema draft-07，以 `x-` 前缀扩展 UI 和布局能力：

```typescript
interface FieldSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'void' | ...
  title?: string
  'x-id': string              // 节点唯一标识
  'x-component': string       // 对应注册的 Widget 名
  'x-component-props'?: {}    // 组件 props
  'x-decorator'?: string      // 外壳装饰器（FormItem）
  'x-position-type'?: 'relative' | 'absolute'  // 布局类型（默认 relative）
  'x-position'?: { x, y, width, height, zIndex }  // absolute 时的坐标
  'x-span'?: number           // relative 时的列宽（1~columns）
  'x-reactions'?: Reaction[]  // 联动规则
  'x-order'?: number          // 排序权重
  properties?: Record<string, FieldSchema>  // 容器子节点
}
```

### 3.2 XLayout 布局模式

每个节点独立决定自己的布局类型，XLayout 统一渲染两种：

| `x-position-type` | 渲染方式 | 类比 CSS |
|---|---|---|
| `'relative'`（默认） | flex-wrap 流式排列，x-span 控制宽度 | `position: relative` |
| `'absolute'` | `position: absolute`，x-position 控制坐标 | `position: absolute` |

容器默认 `position: relative`，建立内部 absolute 子节点的定位上下文。

### 3.3 DesignOverlay + AbsoluteNodeOverlay 职责分离

| 组件 | 职责 |
|---|---|
| `DesignOverlay` | 所有节点的 hover 高亮、选中、relative 节点拖拽排序、跨容器拖拽、流式节点拖入 absolute 容器 |
| `AbsoluteNodeOverlay` | absolute 节点的拖拽移动 + 8方向缩放（不参与排序） |

两者通过 `isContainer + positionType` 标记区分处理范围，不重叠。

### 3.4 ReactionsEngine（联动引擎）

利用 Vue 3 `watchEffect` 实现，无需自研响应式：

```
字段值变化 → watchEffect 触发 → 沙箱求值 when 条件 → 更新目标字段状态（visible/disabled/value/options）
```

沙箱屏蔽危险全局（eval/Function/window/document 等），CycleDetector 防死循环。

---

## 四、关键技术决策

| 决策 | 结论 | 原因 |
|---|---|---|
| 响应式系统 | Vue 3 原生 reactive/watchEffect | 无需两套响应式，减少包体积 |
| 布局模式 | x-position-type per-node（已废弃 layoutMode 全局开关） | 节点独立决定，混合布局自然支持 |
| 布局渲染器 | XLayout 统一（已废弃 FlowLayout + FreeLayout 分离） | 消除职责冲突 Bug |
| InjectionKey | 强类型 InjectionKey（已废弃字符串 key） | 编译期类型安全 |
| 历史记录 | JSON 快照（snapshots[] + index） | 简单可靠，MES 表单体积可控 |
| 纯函数分离 | schemaUtils.ts 9 个纯函数 | 可独立单元测试，engine 委托调用 |
| 键盘删除 | 仅 Delete，不含 Backspace | 避免输入框内误触发 |

---

## 五、废弃/已移除项

以下内容已完全从代码库中移除，文档中提及仅供历史参考：

- `FlowLayout.vue` — 由 XLayout 替代
- `FreeLayout.vue` — 由 XLayout 替代  
- `FreeCanvas.vue` — 由 AbsoluteNodeOverlay 替代
- `Designer.vue` — 由 LowcodeDesigner 替代
- `PropertyPanel.vue` — 由 FieldProperties 替代
- `layoutMode: 'flow' | 'free'` — 由 `x-position-type` 替代
- `x-free-position` — 由 `x-position` 替代
- `getGlobalRegistry / setGlobalRegistry` — 全局单例反模式
- StdForm 适配层（4包设计）— 已移除，维持 3 包规划
- `AllFieldTypes` 类型 — 死代码

---

*此文件由奥卡姆剃刀大将军维护，最后更新：2026-04-04*
