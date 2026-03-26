# Vue 3 低代码设计器 — 架构设计文档

> 版本：v1.0.0  
> 创建时间：2026-03-26  
> 作者：AI Research Agent  
> 状态：草稿

---

## 一、设计理念

本架构的核心理念是 **"融合而非搬运"**：取各调研项目之精华，规避其不足，结合现有 StdForm 体系，设计一套真正适合 MES 业务场景的低代码解决方案。

### 1.1 精华提取矩阵

| 借鉴来源 | 取其精华 | 去其糟粕 |
|---------|---------|---------|
| **VTJ.PRO** | Engine/Provider/Simulator 三层分离、DSL ↔ SFC 双向转换、物料描述系统 | 过于复杂的沙箱机制、多平台重量级设计 |
| **Formily** | x-reactions 声明式联动、VoidField 虚节点容器、O(1) 精确渲染思路 | 陡峭的学习曲线、脱离 Vue 响应式的自研 reactive |
| **VForm3** | 设计器+渲染器分离架构、三端布局切换、生命周期钩子 | 封闭的 Pro 付费生态、弱联动能力 |
| **vue-json-schema-form** | Field+Widget 职责分离、ajv 校验、ui-schema 分层 | 无联动系统、无关系字段支持 |
| **form-generator** | 代码生成思路、设计时 Schema 结构清晰 | Vue 2 限制、无运行时动态渲染 |
| **visual-drag-demo** | 快照撤销/重做、拖拽吸附算法、自由布局原理 | 仅用于教学、非生产级 |

### 1.2 本方案独创设计

| 能力 | 说明 |
|------|------|
| **RelationField** | 内置 1对多、多对多关系字段，与 StdForm 的 RelationRegister 对接 |
| **双布局模式** | Flex/Grid 流式布局 + 绝对定位自由布局，同一 Schema 可切换 |
| **i18n 深度集成** | Schema 中直接存储 i18n key，运行时通过 useNsI18n 动态切换 |
| **渐进增强** | 现有 StdForm 代码可逐步迁移，无需一次性重写 |

---

## 二、整体架构

### 2.1 分层架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        设计时（Design Time）                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  Designer（设计器）                        │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │    │
│  │  │  物料面板  │  │  画布区域  │  │  属性面板  │             │    │
│  │  │ (Palette)│  │ (Canvas) │  │  (Props) │             │    │
│  │  └──────────┘  └──────────┘  └──────────┘             │    │
│  │              DesignerEngine（设计器引擎）                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                            │ DSL Schema                          │
│                            ↕ 双向转换                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  Renderer（渲染器）                        │    │
│  │  ┌────────────────────────────────────────────────────┐ │    │
│  │  │         SchemaInterpreter（Schema 解析器）            │ │    │
│  │  └────────────────────────────────────────────────────┘ │    │
│  │  ┌──────────────────┐  ┌──────────────────────────────┐ │    │
│  │  │  LayoutResolver   │  │   ReactionsEngine（联动引擎）  │ │    │
│  │  │  (布局解析器)      │  │                              │ │    │
│  │  └──────────────────┘  └──────────────────────────────┘ │    │
│  │  ┌──────────────────────────────────────────────────────┐│    │
│  │  │           FieldRenderer（字段渲染器）                  ││    │
│  │  └──────────────────────────────────────────────────────┘│    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                             │
┌─────────────────────────────────────────────────────────────────┐
│                         运行时（Runtime）                          │
│  ┌──────────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Core（核心层）   │  │ StdForm 适配层 │  │  i18n 集成层      │   │
│  │  - FormModel     │  │  - useStdForm │  │  - useNsI18n     │   │
│  │  - FieldModel    │  │  - Relations  │  │  - 动态语言切换   │   │
│  │  - Validators    │  │  - RefManager │  │                  │   │
│  └──────────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 包结构设计

```
@company/lowcode-core       # 核心层：Schema类型、模型、联动、校验
@company/lowcode-renderer   # 渲染器：纯运行时渲染，无设计器依赖
@company/lowcode-designer   # 设计器：可视化编辑，依赖渲染器
@company/lowcode-stdform    # StdForm适配：对接现有useStdForm体系
```

依赖关系（单向）：
```
lowcode-designer → lowcode-renderer → lowcode-core
lowcode-stdform  → lowcode-renderer → lowcode-core
```

---

## 三、核心模块详解

### 3.1 Core（核心层）

核心层是整个系统的基础，**不依赖任何 UI 框架**（但允许依赖 Vue 响应式）。

#### 3.1.1 Schema 类型系统

```
PageSchema               # 页面级 Schema（包含布局和字段）
├── LayoutSchema         # 布局容器 Schema
│   ├── FlexLayoutSchema # Flex 流式布局
│   ├── GridLayoutSchema # Grid 栅格布局
│   └── FreeLayoutSchema # 自由定位布局
└── FieldSchema          # 字段 Schema
    ├── BaseFieldSchema  # 基础字段
    ├── ContainerSchema  # 容器字段（Tabs/Card/Collapse）
    ├── RelationSchema   # 关系字段（1对多/多对多）
    └── VoidFieldSchema  # 虚字段（纯布局容器）
```

详见 `DSL_SCHEMA.md`。

#### 3.1.2 FormModel（表单模型）

基于 Vue 3 `reactive` 实现，不引入额外的响应式库：

```typescript
interface FormModel {
  // 字段状态
  fields: Map<string, FieldState>
  
  // 表单值
  values: Record<string, any>
  
  // 校验状态
  errors: Map<string, string[]>
  
  // 方法
  getField(path: string): FieldState
  setFieldValue(path: string, value: any): void
  setFieldState(path: string, state: Partial<FieldState>): void
  validate(): Promise<boolean>
  reset(): void
  submit(): Promise<void>
}
```

#### 3.1.3 ReactionsEngine（联动引擎）

受 Formily 的 x-reactions 启发，但直接利用 Vue 3 的 `watchEffect` 实现，无需自研响应式：

```
ReactionsEngine
├── 解析 x-reactions 声明
├── 建立依赖图（dependency graph）
├── 监听字段变化（watchEffect）
└── 执行联动动作（fulfill / otherwise）
```

联动执行流程：
```
字段值变化
    │
    ↓
依赖收集（收集哪些 reactions 依赖该字段）
    │
    ↓
表达式求值（沙箱求值 when 条件）
    │
    ↓
状态更新（visible / disabled / value / options）
    │
    ↓
触发 Vue 响应式更新（精确更新受影响字段）
```

### 3.2 Renderer（渲染器）

渲染器完全独立，可在**无设计器依赖**的情况下工作，用于生产环境动态渲染表单。

#### 3.2.1 渲染器核心流程

```
PageSchema
    │
    ↓ SchemaInterpreter 解析
    │
    ├── 根据 layoutMode 选择布局策略
    │   ├── 流式布局 → FlexGridLayout
    │   └── 自由布局 → FreePositionLayout
    │
    ├── 实例化 FormModel（初始化状态、注册字段）
    │
    ├── 启动 ReactionsEngine（建立联动监听）
    │
    └── 递归渲染字段节点
        ├── VoidField → 纯容器，不注册数据路径
        ├── RelationField → 对接 useArrayRefManager
        └── BaseField → 根据 x-component 动态组件渲染
```

#### 3.2.2 FieldRenderer 设计

参考 vue-json-schema-form 的 **Field + Widget 分离**：

```
FieldRenderer（字段渲染器）
├── FormItemDecorator（表单项装饰器 = x-decorator）
│   └── 提供 label、required、error、tooltip
└── WidgetComponent（输入组件 = x-component）
    └── 实际的 Element Plus 组件
```

- `x-decorator` 决定"外壳"（FormItem 怎么显示）
- `x-component` 决定"内核"（用什么输入控件）

#### 3.2.3 组件注册机制

```typescript
// 物料注册（借鉴 VTJ.PRO 的 MaterialDescription）
const registry = createComponentRegistry()

registry.register('Input', {
  component: ElInput,          // 实际 Vue 组件
  designer: InputDesigner,     // 设计器配置面板（仅设计器包含）
  defaultProps: { clearable: true },
  snippet: { ... }             // 拖入时的初始 Schema 片段
})
```

### 3.3 Designer（设计器）

设计器是一个独立可运行的 Vue 应用，也可以嵌入现有系统。

#### 3.3.1 设计器三栏布局

```
┌──────────────┬───────────────────────────────┬──────────────────┐
│              │          工具栏                  │                  │
│   物料面板    ├───────────────────────────────┤   属性面板         │
│  (Palette)   │         设计画布               │   (Properties)   │
│              │  ┌─────────────────────────┐  │                  │
│  - 基础组件   │  │    Renderer 预览模式      │  │  - 字段属性       │
│  - 容器组件   │  │  （拖拽叠加在其上方）      │  │  - 样式设置       │
│  - 表单组件   │  └─────────────────────────┘  │  - 联动配置       │
│  - 业务组件   │                               │  - 校验规则       │
│              │   自由布局时：绝对定位画布      │  - 事件绑定       │
└──────────────┴───────────────────────────────┴──────────────────┘
```

#### 3.3.2 DesignerEngine（设计器引擎）

借鉴 VTJ.PRO 的 Engine 概念，但简化为表单场景：

```typescript
interface DesignerEngine {
  // Schema 管理
  schema: Ref<PageSchema>
  selectedNode: Ref<string | null>
  
  // 历史记录（快照模式，来自 visual-drag-demo）
  history: HistoryManager
  
  // 方法
  selectNode(id: string): void
  addNode(parentId: string, schema: FieldSchema): void
  removeNode(id: string): void
  moveNode(id: string, targetId: string, position: 'before' | 'after' | 'inside'): void
  updateNodeProps(id: string, props: Partial<FieldSchema>): void
  
  // DSL ↔ SFC 转换
  exportSchema(): PageSchema
  importSchema(schema: PageSchema): void
  generateCode(): string   // 生成 Vue SFC 代码
}
```

#### 3.3.3 拖拽系统

- **流式布局**：使用 `vuedraggable` (基于 SortableJS)，字段间排序插入
- **自由布局**：自研 mousedown/mousemove/mouseup 坐标计算（来自 visual-drag-demo 原理）
- **辅助线吸附**：阈值检测算法（5px 吸附阈值）

#### 3.3.4 属性面板

属性面板按 Schema 字段分组呈现：

```
属性面板
├── 基础属性（label, field, defaultValue）
├── 显示属性（x-display, x-pattern）
├── 组件属性（x-component-props 动态渲染）
├── 联动配置（x-reactions 可视化编辑器）
├── 校验规则（x-validator 规则列表）
└── 关系字段（x-relation 配置，仅关系字段显示）
```

---

## 四、双布局模式设计

### 4.1 布局切换机制

```typescript
type LayoutMode = 'flow' | 'free'

interface PageSchema {
  layoutMode: LayoutMode   // 页面级布局模式
  // ...
}
```

同一份 Schema，渲染器根据 `layoutMode` 选择不同的渲染策略：

| 模式 | 适用场景 | 底层实现 |
|------|---------|---------|
| `flow` | 标准表单、数据录入 | Flex / CSS Grid，支持响应式 |
| `free` | 大屏可视化、报表设计、WinForm 风格 | `position: absolute`，`top/left/width/height` |

### 4.2 流式布局（Flow Layout）

借鉴 VForm3 + form-generator 的栅格思路，使用 **CSS Grid 24列栅格**：

```
┌──────────────────────────────────────────┐
│  span:12           │  span:12            │
│  ┌──────────────┐  │  ┌───────────────┐  │
│  │  字段A        │  │  │  字段B         │  │
│  └──────────────┘  │  └───────────────┘  │
├──────────────────────────────────────────┤
│  span:24                                 │
│  ┌──────────────────────────────────────┐│
│  │  子表单（关系字段）                    ││
│  └──────────────────────────────────────┘│
└──────────────────────────────────────────┘
```

### 4.3 自由布局（Free Layout）

每个组件维护绝对坐标：

```typescript
interface FreePositionProps {
  x: number      // left
  y: number      // top  
  width: number
  height: number
  zIndex?: number
  rotate?: number
}
```

设计器中支持：
- 拖拽移动
- 8方向缩放手柄
- 多选框选
- 对齐辅助线
- 网格吸附

### 4.4 混合布局

容器组件可嵌套不同的布局模式：

```json
{
  "type": "container",
  "x-component": "Card",
  "layoutMode": "free",
  "children": [...]
}
```

---

## 五、数据流设计

### 5.1 表单数据流

```
用户输入
    │
    ↓
FieldWidget.onChange(value)
    │
    ↓
FormModel.setFieldValue(path, value)
    │
    ├──→ 更新 values（响应式）
    ├──→ 触发校验（异步）
    └──→ 通知 ReactionsEngine（依赖该路径的联动）
              │
              ↓
         联动执行（更新其他字段状态）
```

### 5.2 关系字段数据流

关系字段（1对多/多对多）需要对接 StdForm 的 RelationRegister：

```
RelationField Schema
    │
    ↓ 渲染时
    │
useArrayRefManager（现有 StdForm）
    │
    ├── 子表格数据列表
    ├── 增删改查操作
    └── 关联键自动注入
```

### 5.3 状态同步

设计器模式下，Schema 变更 → 渲染器实时预览：

```
DesignerEngine.schema（ref）
    │
    ↓ watch（deep）
    │
Renderer 重新解析 Schema
    │
    ↓
Vue 差异更新（仅变更节点重渲染）
```

---

## 六、扩展机制

### 6.1 自定义组件扩展

任何人可以注册自定义物料：

```typescript
import { defineWidget } from '@company/lowcode-core'

// 定义物料
export const MyCustomWidget = defineWidget({
  name: 'MyCustomWidget',
  label: '我的自定义组件',
  category: 'business',
  
  // 运行时组件
  component: MyComponent,
  
  // 设计器配置面板（可选）
  designerConfig: {
    props: [
      { name: 'label', type: 'string', label: '标签' },
      { name: 'api', type: 'string', label: '接口地址' }
    ]
  },
  
  // 默认 Schema 片段
  defaultSchema: {
    'x-component': 'MyCustomWidget',
    'x-component-props': { label: '自定义组件' }
  }
})

// 注册
registry.register(MyCustomWidget)
```

### 6.2 自定义校验器扩展

```typescript
registry.registerValidator('businessRule', async (value, rule, field) => {
  const result = await checkBusinessRule(value, rule.params)
  return result.valid ? undefined : result.message
})
```

### 6.3 自定义布局扩展

```typescript
registry.registerLayout('custom-layout', {
  renderer: CustomLayoutRenderer,
  designer: CustomLayoutDesigner
})
```

### 6.4 插件系统

```typescript
const myPlugin: LowcodePlugin = {
  name: 'my-plugin',
  install(app, options) {
    // 注册组件、布局、校验器
    app.registry.register(...)
    app.hooks.on('schema:change', handler)
  }
}
```

---

## 七、与 StdForm 的集成方案

### 7.1 集成层级

```
现有 StdForm 代码
      ↕
lowcode-stdform 适配层  
      ↕
lowcode-renderer 渲染器
```

### 7.2 适配层负责

| 任务 | 说明 |
|------|------|
| 表单状态桥接 | 将 `FormModel` 桥接到 `useStdForm` |
| 关系字段适配 | 将 `RelationField` 对接 `useArrayRefManager` |
| i18n 适配 | 将 Schema 中的 i18n key 连接到 `useNsI18n` |
| 数据加载器 | 将 Schema 的 `dataSource` 对接现有 API 封装 |
| 生命周期 | 将 Schema 的 `onFormMounted` 等钩子与 StdForm 生命周期对接 |

### 7.3 渐进迁移策略

```
阶段一：并行运行
  - 现有表单：继续使用 StdForm 代码写法
  - 新表单：使用低代码 Schema 定义

阶段二：Schema 优先
  - 新功能开发默认使用 Schema 描述
  - 设计器协助生成 Schema

阶段三：可视化主导
  - 大部分表单通过设计器维护
  - 特殊逻辑用 Schema 的函数扩展点处理
```

---

## 八、性能设计

### 8.1 精确渲染

参考 Formily 的 O(1) 更新思路，利用 Vue 3 `watchEffect` 实现：

- 每个 FieldWidget 只订阅**自身路径**的状态
- 字段 A 的值变化 → 只触发依赖字段 A 的联动，不全量重渲染
- 使用 `shallowRef` + `triggerRef` 控制粒度

### 8.2 大表单优化

- 虚拟滚动：字段数量 > 50 时启用（参考 `@vueuse/core` 的 `useVirtualList`）
- 懒渲染：Tab/Collapse 内的字段按需渲染
- 防抖校验：输入校验 300ms 防抖

### 8.3 设计器性能

- Schema 快照采用 **JSON.stringify 增量存储**（来自 visual-drag-demo 的快照思路）
- 画布渲染与属性面板更新**解耦**，避免属性编辑导致全量重渲染
- 物料图标懒加载

---

## 九、目录结构（规划）

```
packages/
├── core/                          # @company/lowcode-core
│   ├── src/
│   │   ├── types/                # Schema 类型定义
│   │   │   ├── schema.ts         # 核心 Schema 接口
│   │   │   ├── field.ts          # 字段类型
│   │   │   ├── layout.ts         # 布局类型
│   │   │   └── reactions.ts      # 联动类型
│   │   ├── model/                # 表单模型
│   │   │   ├── FormModel.ts
│   │   │   └── FieldModel.ts
│   │   ├── reactions/            # 联动引擎
│   │   │   ├── ReactionsEngine.ts
│   │   │   └── ExpressionEvaluator.ts
│   │   ├── validators/           # 校验系统
│   │   │   ├── builtinValidators.ts
│   │   │   └── ValidatorRegistry.ts
│   │   └── registry/             # 组件注册
│   │       └── ComponentRegistry.ts
│   └── package.json
│
├── renderer/                      # @company/lowcode-renderer
│   ├── src/
│   │   ├── components/
│   │   │   ├── FieldRenderer.vue  # 字段渲染器
│   │   │   ├── LayoutRenderer.vue # 布局渲染器
│   │   │   └── FormRenderer.vue   # 表单根渲染器
│   │   ├── widgets/               # 内置 Widget 组件
│   │   │   ├── InputWidget.vue
│   │   │   ├── SelectWidget.vue
│   │   │   └── ...
│   │   ├── layouts/               # 内置布局组件
│   │   │   ├── FlowLayout.vue
│   │   │   └── FreeLayout.vue
│   │   └── index.ts
│   └── package.json
│
├── designer/                      # @company/lowcode-designer
│   ├── src/
│   │   ├── components/
│   │   │   ├── Palette.vue        # 物料面板
│   │   │   ├── Canvas.vue         # 设计画布
│   │   │   └── Properties.vue     # 属性面板
│   │   ├── engine/
│   │   │   ├── DesignerEngine.ts
│   │   │   └── HistoryManager.ts
│   │   ├── drag/                  # 拖拽系统
│   │   │   ├── DragHandler.ts
│   │   │   └── SnapGuide.ts
│   │   └── LowcodeDesigner.vue    # 主入口组件
│   └── package.json
│
└── stdform/                       # @company/lowcode-stdform
    ├── src/
    │   ├── adapters/
    │   │   ├── StdFormAdapter.ts  # useStdForm 适配
    │   │   └── RelationAdapter.ts # 关系字段适配
    │   └── index.ts
    └── package.json
```

---

## 十、里程碑规划

### Milestone 1：核心层（M1）
- [ ] Schema 类型定义完成
- [ ] FormModel 基础实现
- [ ] 简单联动引擎（支持 visible/disabled）
- [ ] 基础 Renderer（Input/Select/Button）

### Milestone 2：完整渲染器（M2）
- [ ] 所有基础 Widget 完成
- [ ] 容器组件（Tabs/Card/Collapse）
- [ ] 双布局模式
- [ ] 完整联动引擎（value/options 联动）
- [ ] ajv 校验集成

### Milestone 3：设计器（M3）
- [ ] 基础设计器框架（三栏布局）
- [ ] 流式布局拖拽
- [ ] 属性面板
- [ ] 撤销/重做

### Milestone 4：自由布局设计器（M4）
- [ ] 自由布局画布
- [ ] 坐标拖拽 + 缩放手柄
- [ ] 吸附辅助线

### Milestone 5：StdForm 集成（M5）
- [ ] 适配层完成
- [ ] 关系字段适配
- [ ] i18n 集成
- [ ] 迁移测试

---

## 附录：决策记录

### ADR-001：不引入 @formily/reactive

**决策**：使用 Vue 3 原生 `reactive/watchEffect`，而非 Formily 的自研响应式库。  
**原因**：
1. Vue 3 的 `reactive` 已经足够高效，无需额外学习成本
2. @formily/reactive 是为 React 设计的，在 Vue 中引入会有两套响应式系统
3. 减少包体积，避免依赖冲突  
**权衡**：可能在极端大表单场景（500+字段）性能稍弱，但 MES 业务场景中此类表单极少。

### ADR-002：Schema 以 JSON Schema 为基础，使用 x-* 扩展

**决策**：采用 JSON Schema draft-07 为基础，以 `x-` 前缀扩展 UI 和业务能力。  
**原因**：
1. 标准化，后端可以使用 ajv 等工具验证 Schema 正确性
2. 与 Formily 生态部分兼容，降低学习成本
3. 业务扩展（关系字段、i18n）通过 `x-relation`、`x-i18n` 等前缀区分

### ADR-003：双布局模式统一在一套 Schema 中

**决策**：通过 `layoutMode` 字段和节点的 `freePosition` 属性，在同一 Schema 中同时支持两种布局。  
**原因**：  
1. 避免维护两套不兼容的 Schema 格式
2. 允许在同一页面中混合使用（容器级别切换）
3. 渐进增强：默认流式布局，大屏场景追加 `freePosition`
