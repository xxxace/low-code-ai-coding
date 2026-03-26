# VTJ.PRO BlockSchema 物料研究

> 研究时间：2026-03-26
> 来源：VTJ.PRO Wiki + API 文档 + SUMMARY.md

## 一、核心概念

VTJ.PRO 采用 **MaterialDescription（物料描述）** 模式：

```
┌─────────────────────────────────────────┐
│          MaterialDescription             │
│                                         │
│  name: 组件名称                          │
│  label: 中文标题                         │
│  props: 属性定义                         │
│  events: 事件定义                        │
│  slots: 插槽定义                         │
│  snippet: 初始片段                       │
└─────────────────────────────────────────┘
```

## 二、MaterialDescription 接口

### 2.1 完整定义

```typescript
interface MaterialDescription {
  // 基本信息
  name: string;          // 组件名称（必需）
  alias?: string;        // 组件别名
  parent?: string;       // 父组件名（如 Button.Group）
  package?: string;      // 所属包名
  
  // 展示信息
  label?: string;        // 中文名称
  icon?: string;         // 预览图标
  doc?: string;          // 文档URL
  categoryId?: string | number;  // 分类ID
  hidden?: boolean;      // 是否隐藏
  
  // 组件能力
  props?: MaterialProp[];    // 支持的属性
  events?: MaterialEvent[];  // 支持的事件
  slots?: MaterialSlot[];    // 支持的插槽
  
  // 嵌套规则
  parentIncludes?: boolean | string[];  // 可放置的父组件
  childIncludes?: boolean | string[];   // 可包含的子组件
  
  // 初始片段
  snippet?: Partial<NodeSchema>;  // 拖入时的初始结构
  
  // 来源
  from?: NodeFrom;       // 组件来源
  id?: string;           // Block ID（如果是自定义组件）
}
```

### 2.2 属性定义

```typescript
interface MaterialProp {
  name: string;          // 属性名
  label?: string;        // 属性标签
  type?: string;         // 属性类型
  defaultValue?: any;    // 默认值
  setter?: MaterialSetter;  // 属性设置器
  description?: string;  // 属性描述
}

interface MaterialSetter {
  componentName: string;  // 设置器组件名
  props?: Record<string, any>;  // 设置器属性
}
```

### 2.3 事件定义

```typescript
interface MaterialEvent {
  name: string;          // 事件名
  label?: string;        // 事件标签
  description?: string;  // 事件描述
  params?: MaterialProp[];  // 事件参数
}
```

### 2.4 插槽定义

```typescript
interface MaterialSlot {
  name: string;          // 插槽名
  label?: string;        // 插槽标签
  description?: string;  // 插槽描述
  params?: MaterialProp[];  // 作用域插槽参数
}
```

## 三、物料注册流程

### 3.1 内置物料

VTJ.PRO 提供内置物料常量：

```typescript
// 内置组件名称
BUILT_IN_COMPONENTS = ['ElButton', 'ElInput', 'ElSelect', ...]

// 内置物料描述
BUILT_IN_MATERIALS: MaterialDescription[]

// 内置库名称映射
BUILT_IN_LIBRARAY_MAP: Record<string, string>
```

### 3.2 自定义物料注册

```typescript
// 创建物料描述
const MyComponentMaterial: MaterialDescription = {
  name: 'MyComponent',
  label: '我的组件',
  icon: 'my-component',
  categoryId: 'custom',
  
  props: [
    {
      name: 'value',
      label: '值',
      type: 'string',
      setter: { componentName: 'InputSetter' }
    },
    {
      name: 'disabled',
      label: '禁用',
      type: 'boolean',
      defaultValue: false,
      setter: { componentName: 'SwitchSetter' }
    }
  ],
  
  events: [
    { name: 'change', label: '值变化' },
    { name: 'focus', label: '获得焦点' }
  ],
  
  slots: [
    { name: 'default', label: '默认插槽' },
    { name: 'prefix', label: '前缀插槽' }
  ],
  
  snippet: {
    name: 'MyComponent',
    props: { value: '', disabled: false }
  }
}

// 注册到引擎
engine.assets.registerMaterial(MyComponentMaterial)
```

## 四、NodeSchema 与物料关联

### 4.1 节点来源（NodeFrom）

```typescript
type NodeFrom = 
  | NodeFromSchema    // 来自 Schema 定义
  | NodeFromUrlSchema // 来自 URL 加载
  | NodeFromPlugin    // 来自插件

interface NodeFromSchema {
  type: 'schema'
  schema: BlockSchema
}

interface NodeFromUrlSchema {
  type: 'url'
  url: string
}

interface NodeFromPlugin {
  type: 'plugin'
  plugin: BlockPlugin
}
```

### 4.2 节点使用物料

```typescript
const node: NodeSchema = {
  id: 'node-1',
  name: 'MyComponent',  // 对应 MaterialDescription.name
  from: {
    type: 'schema',
    schema: myComponentBlockSchema
  },
  props: {
    value: 'hello',
    disabled: false
  },
  events: {
    onChange: 'handleValueChange'
  }
}
```

## 五、设计器集成

### 5.1 物料面板

```typescript
// 物料分类
interface MaterialCategory {
  id: string | number
  name: string
  label: string
  icon?: string
  children?: MaterialCategory[]
}

// 物料面板渲染
<MaterialPalette 
  categories={categories}
  materials={materials}
  onDragStart={handleDragStart}
/>
```

### 5.2 属性面板

```typescript
// 根据选中节点的物料描述动态生成
<PropertyPanel node={selectedNode}>
  {material.props.map(prop => (
    <PropertyItem 
      key={prop.name}
      prop={prop}
      value={node.props[prop.name]}
      onChange={handlePropChange}
    />
  ))}
</PropertyPanel>
```

## 六、与 Formily 的对比

| 维度 | VTJ.PRO | Formily |
|------|---------|---------|
| 物料定义 | MaterialDescription | connect + mapProps |
| 属性配置 | props 数组 + setter | x-component-props |
| 设计器支持 | 内置完整支持 | 需要 designable |
| 嵌套规则 | parentIncludes/childIncludes | 无 |
| 初始片段 | snippet | 无 |

## 七、对原型的借鉴

### 7.1 可采用的设计

| VTJ.PRO 设计 | 原型借鉴 |
|--------------|----------|
| MaterialDescription 接口 | 组件元信息定义 |
| props + setter 模式 | 属性配置面板生成 |
| snippet 初始片段 | 拖入时默认配置 |
| 嵌套规则 | 组件放置约束 |

### 7.2 原型适配方案

```typescript
// componentRegistry.ts 扩展

interface ComponentMeta {
  // 基本信息
  name: string
  title: string
  icon: string
  group: string
  
  // 属性定义
  props: PropDefinition[]
  
  // 事件定义
  events?: EventDefinition[]
  
  // 初始片段
  snippet?: Partial<FieldSchema>
  
  // 嵌套规则
  parentIncludes?: string[]
  childIncludes?: string[]
}

interface PropDefinition {
  name: string
  title: string
  type: 'string' | 'number' | 'boolean' | 'select' | 'object'
  defaultValue?: any
  setter?: string  // 'input' | 'switch' | 'select' | 'code'
  options?: { label: string; value: any }[]  // select 类型的选项
}

// 注册示例
const InputMeta: ComponentMeta = {
  name: 'Input',
  title: '输入框',
  icon: 'edit',
  group: '基础组件',
  
  props: [
    { name: 'placeholder', title: '占位符', type: 'string', setter: 'input' },
    { name: 'disabled', title: '禁用', type: 'boolean', defaultValue: false, setter: 'switch' },
    { name: 'maxLength', title: '最大长度', type: 'number', setter: 'input' }
  ],
  
  events: [
    { name: 'change', title: '值变化' },
    { name: 'focus', title: '获得焦点' },
    { name: 'blur', title: '失去焦点' }
  ],
  
  snippet: {
    type: 'string',
    'x-component': 'Input',
    'x-component-props': {
      placeholder: '请输入'
    }
  }
}
```

## 八、优缺点分析

### 优点

1. **结构清晰**：MaterialDescription 接口定义完整
2. **设计器友好**：props + setter 自动生成属性面板
3. **嵌套控制**：parentIncludes/childIncludes 约束组件放置
4. **初始片段**：snippet 定义拖入时的默认配置

### 局限

1. **复杂度高**：概念较多，学习成本
2. **文档分散**：API 文档不够详细
3. **类型依赖**：需要理解 NodeSchema、BlockSchema 等多个类型

## 九、参考链接

- Wiki: https://vtj.pro/wiki/
- Core API: https://vtj.pro/typedoc/core/README.html
- MaterialDescription: https://vtj.pro/typedoc/core/interfaces/MaterialDescription.html