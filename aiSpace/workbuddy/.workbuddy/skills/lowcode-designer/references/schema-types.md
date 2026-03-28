# Schema 类型完整参考

> 源文件：`prototype/src/core/schema.ts`
> 同步日期：2026-03-28

## PageSchema（顶层）

```typescript
interface PageSchema {
  version: string           // "1.0"，破坏性变更时递增
  id: string
  name: string
  layoutMode: 'flow' | 'free'   // 只影响新增节点默认类型，不影响已有节点
  formConfig: FormConfig
  schema: ObjectFieldSchema     // 根节点
  cssCode?: string
  lifeCycles?: LifeCycles
  globalState?: Record<string, any>
  __meta__?: { createdAt: string; updatedAt: string; createdBy?: string }
}
```

## FormConfig

```typescript
interface FormConfig {
  labelWidth?: number
  labelPosition?: 'left' | 'right' | 'top'
  size?: 'large' | 'default' | 'small'
  layoutType?: 'PC' | 'Pad' | 'H5'
  columns?: number       // 流式布局默认列数
  disabled?: boolean
  readOnly?: boolean
  setupCode?: string     // TODO: 表单级自定义 JS（逃生舱）
}
```

## FieldSchema 联合类型

```typescript
type FieldSchema =
  | ScalarFieldSchema    // string/number/boolean/integer/null
  | ObjectFieldSchema    // type: 'object'，有 properties
  | ArrayFieldSchema     // type: 'array'，有 items + x-relation
  | VoidFieldSchema      // type: 'void'，纯 UI 容器
```

## BaseFieldSchema（所有字段共有）

```typescript
interface BaseFieldSchema {
  type: FieldType
  title?: string
  description?: string
  enum?: any[]
  enumNames?: string[]
  default?: any

  // 校验
  required?: boolean
  minLength?: number; maxLength?: number
  minimum?: number; maximum?: number
  pattern?: string; format?: string

  // x-* 扩展
  'x-component'?: string
  'x-component-props'?: Record<string, any>
  'x-decorator'?: string
  'x-decorator-props'?: { labelWidth?: number; required?: boolean; ... }
  'x-display'?: 'visible' | 'hidden' | 'none'
  'x-pattern'?: 'editable' | 'disabled' | 'readOnly' | 'readPretty'
  'x-reactions'?: Reaction[]
  'x-validator'?: Validator[]
  'x-i18n'?: I18nConfig
  'x-span'?: number              // 流式布局列宽（1-24）
  'x-order'?: number             // 排序权重
  'x-free-position'?: FreePosition   // 旧字段，保留兼容
  'x-position-type'?: 'relative' | 'absolute'   // XLayout 定位类型
  'x-position'?: { x?: number; y?: number; width?: number; height?: number; zIndex?: number }
  'x-class'?: string
  'x-style'?: Record<string, string>
  'x-id'?: string                // 设计器生成的唯一 ID
  'x-datasource'?: DataSourceConfig   // TODO
}
```

## Reaction 联动规则

```typescript
interface Reaction {
  name?: string           // 规则名（UI 识别用）
  remark?: string         // 备注
  enabled?: boolean       // 默认 true
  dependencies?: string[] // 依赖字段路径，$deps[n] 对应第 n 个
  when?: string           // 条件表达式（沙箱求值，不填=始终执行 fulfill）
  fulfill?: ReactionEffect
  otherwise?: ReactionEffect
  target?: string | string[]   // 主动联动目标（不填=作用自身）
}

interface ReactionEffect {
  state?: {
    visible?: boolean
    disabled?: boolean
    readOnly?: boolean
    required?: boolean
    loading?: boolean
    value?: any          // 支持表达式字符串
    dataSource?: any[]
    title?: string
    description?: string
  }
  props?: Record<string, any>
  run?: string           // 副作用表达式
}

// 沙箱内置变量：$self $form $deps $values $field
```

## RelationConfig（关系字段）

```typescript
interface RelationConfig {
  type: 'one-to-many' | 'many-to-many'
  target: string             // 子表/关联表标识
  foreignKey: string         // 外键字段名
  throughTable?: string      // 中间表（多对多）
  targetSchema?: ObjectFieldSchema
  displayMode?: 'table' | 'form' | 'dialog'
  allowAdd?: boolean
  allowDelete?: boolean
  allowSort?: boolean
  initialFilter?: Record<string, any>
}
```

## FreePosition（旧，保留兼容）

```typescript
interface FreePosition {
  x: number; y: number; width: number; height: number
  zIndex?: number; rotate?: number; locked?: boolean
}
```

## x-position（新，XLayout 使用）

```typescript
// 内联在 BaseFieldSchema
'x-position'?: {
  x?: number; y?: number; width?: number; height?: number; zIndex?: number
}
```

## ContainerNode（预留，VoidFieldSchema 已覆盖主要需求）

```typescript
interface ContainerNode {
  type: 'container'
  variant?: 'group' | 'tab' | 'collapse' | 'card'
  title?: LocalizedString
  'x-id'?: string
  'x-order'?: number
  collapsed?: boolean
  columns?: number
  children: Array<FieldSchema | ContainerNode>
}
```

## 内置 Widget 速查（defaultRegistry）

| Widget 名 | 组件 | category |
|---|---|---|
| Input | el-input | basic |
| Textarea | el-input (textarea) | basic |
| InputNumber | el-input-number | basic |
| Select | el-select | basic |
| MultiSelect | el-select (multiple) | basic |
| Radio | el-radio-group | basic |
| Checkbox | el-checkbox-group | basic |
| Switch | el-switch | basic |
| DatePicker | el-date-picker | basic |
| DateRangePicker | el-date-picker (daterange) | basic |
| TimePicker | el-time-picker | basic |
| Rate | el-rate | basic |
| Slider | el-slider | basic |
| Upload | el-upload | basic |
| ColorPicker | el-color-picker | basic |
| Cascader | el-cascader | basic |
| TreeSelect | el-tree-select | basic |
| Transfer | el-transfer | basic |
| Card | el-card (void) | container |
| Tabs | el-tabs (void) | container |
| Collapse | el-collapse (void) | container |
| Divider | el-divider (void) | container |
