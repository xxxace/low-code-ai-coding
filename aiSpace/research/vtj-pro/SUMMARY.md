# VTJ.PRO 研究总结

> 研究时间：2026-03-25
> 官网：https://vtj.pro
> GitHub：https://github.com/vtj-cloud/vtj
> 当前版本：v0.12.47

## 一、项目定位

**VTJ.PRO** 是面向专业开发者的 AI 驱动型 Vue3 低代码平台，核心理念是 **"低代码不低能力"**。

### 与其他低代码平台的区别

| 特性 | VTJ.PRO | 传统低代码 |
|------|---------|-----------|
| 目标用户 | 专业开发者 | 业务人员 |
| 代码质量 | 源码级，可二次开发 | 黑盒产物 |
| 集成方式 | 非侵入式，可渐进集成 | 全量替换 |
| 灵活性 | 完全可定制 | 受限于平台能力 |

---

## 二、核心架构

### 2.1 分层架构

```
┌─────────────────────────────────────────┐
│            设计器 (@vtj/designer)         │
├─────────────────────────────────────────┤
│            渲染器 (@vtj/renderer)         │
├─────────────────────────────────────────┤
│            核心层 (@vtj/core)             │
├─────────────────────────────────────────┤
│  解析器(@vtj/parser) │ 代码生成(@vtj/coder) │
└─────────────────────────────────────────┘
```

### 2.2 三大核心组件

1. **Engine（引擎）**：设计时环境的中央协调器
   - 项目管理：协调 ProjectModel 和文件操作
   - 模拟器控制：管理 iframe 沙箱环境
   - 资源管理：物料加载和组件注册
   - 事件协调：响应式更新和状态持久化

2. **Provider（服务提供者）**：运行时服务管理
   - 设计模式：完整可视化编辑能力
   - 运行时模式：生产环境优化执行
   - 原始模式：直接执行 Vue 组件

3. **Simulator（模拟器）**：隔离预览环境
   - 创建独立 iframe 环境
   - 组件注册表管理
   - API 层模拟

---

## 三、DSL Schema 设计

### 3.1 BlockSchema（块模式）

```typescript
interface BlockSchema {
  id?: string;           // 唯一标识
  name: string;          // 组件名
  locked?: boolean;      // 锁定状态
  
  // Vue 组件核心
  state?: BlockState;    // 响应式状态
  props?: BlockProp[];   // 定义属性参数
  emits?: BlockEmit[];   // 定义事件
  slots?: BlockSlot[];   // 定义插槽
  
  // 逻辑层
  computed?: Record<string, JSFunction>;  // 计算属性
  methods?: Record<string, JSFunction>;    // 自定义方法
  watch?: BlockWatch[];                     // 侦听器
  lifeCycles?: Record<string, JSFunction>; // 生命周期
  
  // 视图层
  nodes?: NodeSchema[];  // 节点树（组件结构）
  css?: string;          // 样式
  
  // 数据层
  dataSources?: Record<string, DataSourceSchema>;  // 数据源
  inject?: BlockInject[];  // 依赖注入
  
  // 元数据
  __VERSION__?: string;     // 版本
  __TEMPLATE_ID__?: string; // 模板ID
  transform?: Record<string, string>; // babel 转换缓存
}
```

### 3.2 NodeSchema（节点模式）

```typescript
interface NodeSchema {
  id?: string;           // 节点标识
  name: string;          // 节点名称（组件名）
  from?: NodeFrom;      // 来源（Schema/UrlSchema/Plugin）
  
  // 状态控制
  locked?: boolean;      // 锁定
  invisible?: boolean;   // 不可见
  
  // 属性与事件
  props?: NodeProps;     // 组件属性
  events?: NodeEvents;   // 绑定事件
  directives?: NodeDirective[]; // 内置指令(v-if/v-for等)
  
  // 层级结构
  children?: NodeChildren;  // 子组件
  slot?: string | NodeSlot; // 放置在父组件的插槽
}
```

### 3.3 MaterialDescription（物料描述）

```typescript
interface MaterialDescription {
  name: string;          // 组件名称
  alias?: string;        // 组件别名
  parent?: string;       // 父组件名（如 Button.Group）
  package?: string;      // 所属包名
  
  // 展示信息
  label?: string;        // 中文名称
  icon?: string;         // 预览图标
  doc?: string;          // 文档URL
  categoryId?: string | number; // 分类ID
  hidden?: boolean;      // 是否隐藏
  
  // 组件能力
  props?: MaterialProp[];   // 支持的属性
  events?: MaterialEvent[]; // 支持的事件
  slots?: MaterialSlot[];   // 支持的插槽
  
  // 嵌套规则
  parentIncludes?: boolean | string[]; // 可放置的父组件
  childIncludes?: boolean | string[];  // 可包含的子组件
  
  // 初始片段
  snippet?: Partial<NodeSchema>; // 拖入时的初始结构
  
  // 来源
  from?: NodeFrom;       // 组件来源
  id?: string;           // Block ID（如果是自定义组件）
}
```

---

## 四、双向代码转换

### 4.1 转换流程

```
Vue SFC ──┬──→ @vtj/parser ──→ BlockSchema ──→ 设计器编辑
          │                                        │
          │                                        ↓
          │                              可视化修改 BlockSchema
          │                                        │
          │                                        ↓
          └──← @vtj/coder ←── BlockSchema ←─── 应用更改
```

### 4.2 关键能力

- **Vue SFC → DSL**：解析 `<template>`, `<script>`, `<style>` 为 BlockSchema
- **DSL → Vue SFC**：根据 BlockSchema 生成完整 Vue 项目结构
- **AI 集成**：`Engine.applyAI()` 支持 AI 生成的 DSL 集成

---

## 五、多平台支持

| 平台 | 包名 | 目标环境 | 核心依赖 |
|------|------|----------|----------|
| Web | @vtj/web | 桌面 Web 应用 | element-plus, @vtj/core, @vtj/renderer |
| 设计器 | @vtj/pro | 可视化设计平台 | @vtj/renderer, @vtj/local, @vtj/materials |
| H5 | @vtj/h5 | 移动端 Web 应用 | vant, @vtj/core, @vtj/renderer |
| UniApp | @vtj/uni-app | 跨平台应用 | @dcloudio/uni-app, @vtj/uni, @vtj/renderer |

---

## 六、对 StdForm 的借鉴意义

### 6.1 架构借鉴

| VTJ.PRO 设计 | StdForm 可借鉴 |
|--------------|----------------|
| Engine + Provider + Simulator 分层 | 分离设计器与渲染器 |
| BlockSchema + NodeSchema 结构 | 表单配置 Schema 设计 |
| MaterialDescription 物料系统 | 字段组件注册机制 |
| 双向代码转换 | 配置 ↔ 代码双向生成 |

### 6.2 Schema 设计参考

VTJ.PRO 的 BlockSchema 结构非常适合 StdForm 的表单配置：

```typescript
// StdForm 可采用的类似结构
interface StdFormSchema {
  id: string;                    // 表单ID
  name: string;                  // 表单名称
  
  // 字段定义（类似 NodeSchema）
  fields: FormFieldSchema[];     
  
  // 状态与逻辑
  state: Record<string, any>;    // 表单状态
  computed: Record<string, JSFunction>; // 计算字段
  watch: FormWatch[];            // 字段联动
  
  // 数据源
  dataSources?: DataSourceSchema[]; // API 配置
  
  // 生命周期
  lifeCycles?: LifeCycleHooks;   // 表单生命周期
}
```

### 6.3 关键差异

| 维度 | VTJ.PRO | StdForm 需求 |
|------|---------|--------------|
| 定位 | 通用低代码平台 | 表单专用系统 |
| 复杂度 | 完整组件树 | 字段级配置 |
| 关系处理 | 父子嵌套 | 1对多、多对多关系 |
| 数据流 | 单向 + 事件 | 双向绑定 + 校验 |

---

## 七、优缺点分析

### 优点

1. **架构清晰**：Engine/Provider/Simulator 三层分离
2. **双向转换**：DSL 与 Vue SFC 无缝互转
3. **多平台**：一套 DSL 生成 Web/H5/UniApp 三端
4. **非侵入**：可渐进式集成到现有项目
5. **AI 增强**：支持自然语言生成组件

### 局限

1. **学习曲线**：概念较多，需要时间理解
2. **文档分散**：部分 API 文档不够详细
3. **社区规模**：相对小众，社区资源有限
4. **表单专精**：通用平台，非表单专用方案

---

## 八、后续研究建议

1. **源码分析**：克隆仓库，深入分析 @vtj/core 和 @vtj/renderer
2. **实践验证**：创建 Demo 项目，验证表单场景适配度
3. **物料系统**：研究如何自定义表单字段物料
4. **关系处理**：分析 1对多、多对多关系的实现方式

---

## 九、参考链接

- 官网：https://vtj.pro
- 文档：https://vtj.pro/guide/
- Wiki：https://vtj.pro/wiki/
- API：https://vtj.pro/typedoc/modules.html
- GitHub：https://github.com/vtj-cloud/vtj
- Gitee：https://gitee.com/newgateway/vtj