# 现有 StdForm 组件适配方案

> 研究时间：2026-03-26
> 来源：template/mes 项目源码分析

## 一、现有组件架构

### 1.1 核心组件

```
StdForm 架构
├── StdFormStore         # 状态管理（Pinia 风格）
├── RelationRegister     # 关系注册器（树形结构）
├── FieldItem            # 字段包装器（标签 + 插槽）
├── FieldItemGroup       # 字段组（搜索区域）
├── EditableTable        # 可编辑表格（VxeTable 封装）
├── DialogPicker         # 弹窗选择器
└── componentMap         # 组件映射表
```

### 1.2 状态管理

```typescript
// StdFormStore 核心类型
interface StdFormStore {
  // 标识
  readonly id: string
  
  // 状态
  loading: boolean
  readonly: boolean
  actionType: StdFormAction  // 'Add' | 'Edit' | 'Readonly'
  orderStatus: OrderStatus
  initialized: boolean
  
  // 元信息
  meta: {
    objectName: string
    objectId: number
    objectType: string
    ISADD: 'Y' | 'N'
    ISAUD: 'Y' | 'N'
    ISDEL: 'Y' | 'N'
    ISUPD: 'Y' | 'N'
  }
  
  // 工具栏
  toolbar: ToolbarVisibleMap
  
  // 关系注册器
  relationRegister: RelationRegister
  
  // 生命周期钩子
  init: EventHookTrigger
  submit: EventHookTrigger
  reset: EventHookTrigger
  delete: EventHookTrigger
  changeStatus: EventHookTrigger
}
```

### 1.3 关系注册器

```typescript
// RelationRegister 管理主从表关系
class RelationRegister {
  relations: StdFormRelation[]  // 所有关系
  root: RelationTree | null     // 关系树
  
  // 注册关系
  register(relation: StdFormRelation): void
  
  // 查找节点
  findNode(validator): RelationTree | null
  
  // 获取主键
  getPrimaryKey(relation): ColumnDef
  
  // 级联删除
  async tableRowRemove(ref, rows): Promise<void>
}

// 关系定义
interface StdFormRelation<T> {
  id: string
  parentId?: string
  manager: RefManager<T> | RefManagerArray<T>
  table: TableDefinition
  sqlQuery: SqlQuery
}
```

## 二、组件映射机制

### 2.1 componentMap

```typescript
// 现有映射表
const componentMap = {
  // 基础输入
  Input: ElInput,
  InputNumber: ElInputNumber,
  InputPassword: InputPassword,
  Autocomplete: ElAutocomplete,
  
  // 选择类
  Select: ElSelect,
  SelectV2: ElSelectV2,
  Cascader: ElCascader,
  TreeSelect: ElTreeSelect,
  RadioGroup: ElRadioGroup,
  CheckboxGroup: ElCheckboxGroup,
  
  // 日期时间
  DatePicker: ElDatePicker,
  TimePicker: ElTimePicker,
  TimeSelect: ElTimeSelect,
  
  // 其他
  Switch: ElSwitch,
  Slider: ElSlider,
  Rate: ElRate,
  ColorPicker: ElColorPicker,
  Upload: ElUpload,
  JsonEditor: JsonEditor,
  IconPicker: IconPicker
}
```

### 2.2 使用方式

```vue
<template>
  <component
    :is="componentMap[componentName]"
    v-model="modelValue"
    v-bind="componentProps"
  />
</template>

<script setup>
import { componentMap } from './helper/componentMap'

const props = defineProps({
  componentName: String,
  modelValue: any,
  componentProps: Object
})
</script>
```

## 三、FieldItem 包装器

### 3.1 组件结构

```vue
<template>
  <div class="field-item">
    <!-- 标签 -->
    <I18nLabel
      :label="label"
      :width="width"
      :required="required"
    />
    <!-- 内容插槽 -->
    <slot></slot>
  </div>
</template>
```

### 3.2 特性

1. **标签国际化**：通过 `I18nLabel` 自动翻译
2. **禁用继承**：从 StdForm 注入 disabled 状态
3. **必填标记**：自动显示红色星号
4. **布局模式**：支持 horizontal / vertical

## 四、业务组件示例

### 4.1 DialogPicker

```vue
<template>
  <ResizeModal>
    <!-- 搜索区 -->
    <FieldItemGroup>
      <slot name="search" />
    </FieldItemGroup>
    
    <!-- 表格 -->
    <EditableTable
      :columns="columns"
      :data="data"
    />
  </ResizeModal>
</template>

<script setup>
interface DialogPickerProps {
  objectName?: string
  manager: RefManager<any>
  columns: any[]
  sql: string | (() => string)
  multi?: boolean
}
</script>
```

### 4.2 RemoteSelect

```typescript
// 使用 useNsSearchData 获取远程数据
const { request } = useNsSearchData('Customer')

const loadData = async (keyword) => {
  const result = await request({ keyword })
  options.value = result.data
}
```

## 五、与原型 ComponentRegistry 的映射

### 5.1 对应关系

| 现有机制 | 原型设计 | 适配方案 |
|----------|----------|----------|
| componentMap | ComponentRegistry._widgets | 迁移到 Registry |
| FieldItem | Decorator (FormItem) | 注册为 Decorator |
| DialogPicker | 自定义 Widget | 注册为 Widget |
| RelationRegister | 无对应 | 保持独立 |
| StdFormStore | FormModel | 需要桥接 |

### 5.2 适配策略

```typescript
// 1. 创建 StdForm 专用 Registry
export function createStdFormRegistry(): ComponentRegistry {
  const registry = new ComponentRegistry()
  
  // 注册基础组件（复用现有 componentMap）
  registry.registerWidget('Input', ElInput, {
    label: '输入框',
    category: 'basic',
    icon: 'EditPen',
    defaultSchema: {
      type: 'string',
      'x-component': 'Input'
    }
  })
  
  // 注册业务组件
  registry.registerWidget('DialogPicker', DialogPicker, {
    label: '弹窗选择器',
    category: 'advanced',
    icon: 'Search',
    defaultSchema: {
      type: 'string',
      'x-component': 'DialogPicker',
      'x-component-props': {
        objectName: '',
        multi: false
      }
    }
  })
  
  // 注册 Decorator
  registry.registerDecorator('FormItem', FieldItem)
  
  return registry
}

// 2. StdForm 适配器
export function useStdFormAdapter(stdForm: StdFormStore) {
  // 桥接 StdForm 状态到 FormModel
  const formModel = useFormModel({
    initialValues: stdForm.data,
    readonly: computed(() => stdForm.readonly)
  })
  
  // 同步状态
  watch(() => stdForm.actionType, (action) => {
    formModel.readonly.value = action === 'Readonly'
  })
  
  return formModel
}
```

## 六、迁移路径

### 6.1 第一阶段：组件注册

1. 创建 `createStdFormRegistry()`
2. 迁移 `componentMap` 到 Registry
3. 注册 `FieldItem` 为 Decorator

### 6.2 第二阶段：Schema 定义

```typescript
// 现有表单配置
const formConfig = {
  fields: [
    { name: 'username', label: '用户名', component: 'Input' }
  ]
}

// 转换为 Schema
const schema: PageSchema = {
  type: 'object',
  properties: {
    username: {
      type: 'string',
      title: '用户名',
      'x-component': 'Input',
      'x-decorator': 'FormItem'
    }
  }
}
```

### 6.3 第三阶段：渲染器集成

```vue
<template>
  <FormRenderer :schema="schema" :registry="registry" />
</template>
```

## 七、兼容性考虑

### 7.1 保持兼容

1. **RelationRegister**：保持独立，不纳入 Schema
2. **StdFormStore**：继续用于状态管理
3. **生命周期钩子**：通过 FormModel 事件桥接

### 7.2 渐进迁移

```typescript
// 混合模式：Schema + RelationRegister
const schema: PageSchema = {
  type: 'object',
  properties: {
    // 主表字段
    customerId: {
      type: 'string',
      'x-component': 'DialogPicker',
      'x-component-props': {
        objectName: 'Customer'
      }
    }
  }
}

// 关系表通过 RelationRegister 管理
relationRegister.register({
  id: 'orderItems',
  parentId: 'main',
  manager: itemsManager,
  table: itemsTableDef
})
```

## 八、建议的适配方案

### 8.1 元信息扩展

```typescript
// 扩展 WidgetMeta 支持业务组件
interface StdFormWidgetMeta extends WidgetMeta {
  // 业务属性
  objectName?: string      // 关联对象名
  sqlQuery?: string        // 数据查询 SQL
  relationId?: string      // 关系 ID
  
  // 权限控制
  permission?: {
    add: boolean
    edit: boolean
    delete: boolean
  }
}
```

### 8.2 属性面板适配

```typescript
// DialogPicker 属性配置
const DialogPickerMeta: StdFormWidgetMeta = {
  name: 'DialogPicker',
  label: '弹窗选择器',
  category: 'advanced',
  icon: 'Search',
  
  // 属性定义（用于设计器属性面板）
  props: [
    { name: 'objectName', label: '对象名', type: 'string', setter: 'input' },
    { name: 'multi', label: '多选', type: 'boolean', setter: 'switch' },
    { name: 'columns', label: '列配置', type: 'array', setter: 'code' }
  ],
  
  defaultSchema: {
    type: 'string',
    'x-component': 'DialogPicker',
    'x-component-props': {
      objectName: '',
      multi: false,
      columns: []
    }
  }
}
```

## 九、参考文件

- `template/mes/src/components/StdForm/` - StdForm 核心实现
- `template/mes/src/components/FieldItem/index.vue` - 字段包装器
- `template/mes/src/components/Form/src/helper/componentMap.ts` - 组件映射
- `template/mes/src/hooks/nameson/useRefManager.ts` - 状态管理
- `template/mes/src/components/StdForm/utils/relation.ts` - 关系注册器