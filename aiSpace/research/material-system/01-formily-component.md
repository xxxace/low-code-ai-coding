# Formily 组件装饰器模式研究

> 研究时间：2026-03-26
> 来源：Formily 官方文档 + SUMMARY.md

## 一、核心概念

Formily 采用 **Field + Widget 分离** 模式：

```
┌─────────────────────────────────────────┐
│              Decorator (装饰器)          │
│         FormItem / Card / Layout        │
│         负责：标签、校验反馈、布局        │
├─────────────────────────────────────────┤
│              Component (组件)            │
│         Input / Select / DatePicker     │
│         负责：数据输入、交互逻辑          │
└─────────────────────────────────────────┘
```

## 二、Schema 配置

### 2.1 基本结构

```json
{
  "type": "string",
  "title": "用户名",
  
  // 组件配置
  "x-component": "Input",
  "x-component-props": {
    "placeholder": "请输入",
    "maxLength": 20
  },
  
  // 装饰器配置
  "x-decorator": "FormItem",
  "x-decorator-props": {
    "labelWidth": 100,
    "asterisk": true,
    "feedbackStatus": "error"
  }
}
```

### 2.2 核心属性

| 属性 | 说明 | 示例 |
|------|------|------|
| `x-component` | 组件名称 | `"Input"`, `"Select"` |
| `x-component-props` | 组件属性 | `{ placeholder: "请输入" }` |
| `x-decorator` | 装饰器名称 | `"FormItem"`, `"Card"` |
| `x-decorator-props` | 装饰器属性 | `{ label: "用户名" }` |

## 三、组件注册 API

### 3.1 connect 函数

**用途**：无侵入接入第三方组件库

**签名**：
```typescript
function connect<T extends React.FC>(
  target: T,           // 要接入的组件
  ...mappers: IComponentMapper<T>[]  // 属性映射器
): React.FC
```

**示例**：
```typescript
import { connect, mapProps, mapReadPretty } from '@formily/react'
import { Input } from 'antd'

// 接入 Input 组件
const FormilyInput = connect(
  Input,
  mapProps({
    value: 'value',      // field.value → props.value
    disabled: 'disabled' // field.disabled → props.disabled
  }),
  mapReadPretty(PreviewText)  // 只读模式显示组件
)
```

### 3.2 mapProps 函数

**用途**：将 Field 属性映射到组件属性

**签名**：
```typescript
type IStateMapper<Props> =
  | { [key in keyof Field]?: keyof Props | boolean }
  | ((props: Props, field: GeneralField) => Props)
```

**对象形式**：
```typescript
mapProps({
  value: 'value',       // field.value → props.value
  disabled: true,       // field.disabled → props.disabled（同名）
  readOnly: 'readonly'  // field.readOnly → props.readonly
})
```

**函数形式**：
```typescript
mapProps((props, field) => ({
  ...props,
  value: field.value || '',
  disabled: field.pattern === 'disabled',
  loading: field.validating
}))
```

### 3.3 mapReadPretty 函数

**用途**：指定只读模式的展示组件

```typescript
import { PreviewText } from '@formily/react'

mapReadPretty(PreviewText)
```

## 四、组件注册流程

### 4.1 注册到 SchemaField

```typescript
import { SchemaField } from '@formily/react'

const components = {
  Input: FormilyInput,
  Select: FormilySelect,
  FormItem: FormilyFormItem
}

// 在 SchemaField 中使用
<SchemaField 
  schema={schema} 
  components={components}
/>
```

### 4.2 完整示例

```typescript
// 1. 定义组件
import { connect, mapProps, mapReadPretty } from '@formily/react'
import { Input as AntdInput } from 'antd'

const Input = connect(
  AntdInput,
  mapProps((props, field) => ({
    ...props,
    value: field.value,
    disabled: field.pattern === 'disabled',
    readOnly: field.pattern === 'readOnly',
    placeholder: props.placeholder || field.title
  })),
  mapReadPretty((props) => <span>{props.value}</span>)
)

// 2. 定义装饰器
import { FormItem as AntdFormItem } from '@formily/antd'

const FormItem = connect(
  AntdFormItem,
  mapProps((props, field) => ({
    ...props,
    label: field.title,
    required: field.required,
    extra: field.description,
    validateStatus: field.validateStatus,
    help: field.errors?.join(', ')
  }))
)

// 3. 注册组件
const components = { Input, FormItem }

// 4. 使用
<SchemaField schema={schema} components={components} />
```

## 五、设计器集成

### 5.1 组件元信息

Formily 设计器需要额外的元信息：

```typescript
const InputMeta = {
  // 组件名称
  componentName: 'Input',
  
  // 组件标题
  title: '输入框',
  
  // 组件图标
  icon: 'Input',
  
  // 组件分类
  group: '基础组件',
  
  // 属性配置 Schema
  propsSchema: {
    type: 'object',
    properties: {
      placeholder: {
        type: 'string',
        title: '占位符'
      },
      maxLength: {
        type: 'number',
        title: '最大长度'
      }
    }
  },
  
  // 默认配置
  defaultProps: {
    placeholder: '请输入'
  }
}
```

### 5.2 物料注册

```typescript
import { registerComponent } from '@designable/formily-antd'

registerComponent(Input, InputMeta)
```

## 六、对原型的借鉴

### 6.1 可采用的设计

| Formily 设计 | 原型借鉴 |
|--------------|----------|
| Field + Widget 分离 | `x-component` + `x-decorator` |
| connect/mapProps | `registerComponent(component, mapper)` |
| 属性映射器 | `ComponentMapper` 类型定义 |
| 只读模式 | `mapReadPretty` → `readPretty` 属性 |

### 6.2 原型适配方案

```typescript
// componentRegistry.ts 扩展

interface ComponentMapper {
  // 属性映射
  mapProps?: (props: any, field: FieldState) => any
  
  // 只读组件
  readPretty?: Component
  
  // 设计器元信息
  meta?: ComponentMeta
}

interface ComponentMeta {
  name: string
  title: string
  icon: string
  group: string
  propsSchema: Schema
  defaultProps: Record<string, any>
}

function registerComponent(
  name: string,
  component: Component,
  mapper?: ComponentMapper
): void {
  componentRegistry.set(name, { component, mapper })
}
```

### 6.3 与现有 StdForm 组件集成

```typescript
// RemoteSelect 注册示例
registerComponent('RemoteSelect', RemoteSelect, {
  mapProps: (props, field) => ({
    ...props,
    value: field.value,
    disabled: field.disabled,
    // StdForm 特有：数据加载器
    dataLoader: props.dataLoader || field['x-relation']?.loader
  }),
  meta: {
    name: 'RemoteSelect',
    title: '远程选择器',
    group: '业务组件',
    propsSchema: {
      type: 'object',
      properties: {
        objectName: { type: 'string', title: '对象名' },
        displayField: { type: 'string', title: '显示字段' }
      }
    }
  }
})
```

## 七、优缺点分析

### 优点

1. **无侵入接入**：不修改第三方组件源码
2. **灵活映射**：支持对象和函数两种映射方式
3. **关注点分离**：Decorator 处理 UI，Component 处理数据
4. **设计器友好**：元信息支持可视化配置

### 局限

1. **学习成本**：connect/mapProps 概念需要理解
2. **类型推导**：TypeScript 类型推导不够友好
3. **调试困难**：属性映射链路复杂

## 八、参考链接

- connect API: https://react.formilyjs.org/zh-CN/api/shared/connect
- mapProps API: https://react.formilyjs.org/zh-CN/api/shared/map-props
- 自定义组件: https://formilyjs.org/zh-CN/guide/advanced/custom