/**
 * @file core/schema.ts
 * @description 低代码 DSL Schema 核心类型定义
 *
 * 设计原则：
 * - 基于 JSON Schema draft-07 标准
 * - 以 x-* 前缀扩展 UI 和业务能力（借鉴 Formily）
 * - 支持 flow（流式）和 free（自由定位）双布局模式
 *
 * 扩展点（已预留，待实现）：
 * - ContainerNode：容器/分组节点，支持无限嵌套布局
 * - I18nString：多语言标签支持
 * - x-datasource：动态接口数据源
 * - setupCode：表单级自定义 JS 逻辑（逃生舱）
 */

// ============================================================
// 基础类型
// ============================================================

export type LayoutMode = 'flow' | 'free'

export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'integer'
  | 'object'
  | 'array'
  | 'null'
  | 'void' // 虚字段（纯 UI 容器，借鉴 Formily VoidField）

export type DisplayState = 'visible' | 'hidden' | 'none'

export type PatternState = 'editable' | 'disabled' | 'readOnly' | 'readPretty'

// ============================================================
// i18n 支持（预留扩展）
// ============================================================

/**
 * 多语言字符串（逐步替代 string 的 label/title 字段）
 * 当前版本：label 仍接受 string，I18nString 作为未来迁移路径
 */
export interface I18nString {
  zh: string
  en?: string
  [locale: string]: string | undefined
}

/** label/title 字段的联合类型，兼容字符串和多语言对象 */
export type LocalizedString = string | I18nString

/** 从 LocalizedString 获取当前语言的字符串（运行时工具函数） */
export function resolveLocalizedString(val: LocalizedString, locale = 'zh'): string {
  if (typeof val === 'string') return val
  return val[locale] ?? val['zh'] ?? ''
}

// ============================================================
// 自由布局位置信息
// ============================================================

export interface FreePosition {
  /** 距左边距（px） */
  x: number
  /** 距顶边距（px） */
  y: number
  /** 宽度（px） */
  width: number
  /** 高度（px） */
  height: number
  /** 层级（默认 1） */
  zIndex?: number
  /** 旋转角度（°，默认 0） */
  rotate?: number
  /** 是否在设计器中锁定（不可拖拽） */
  locked?: boolean
}

// ============================================================
// i18n 配置（字段级 i18n key 映射）
// ============================================================

export interface I18nConfig {
  /** 标签文本的 i18n key（覆盖 title） */
  title?: string
  /** 描述文本的 i18n key（覆盖 description） */
  description?: string
  /** placeholder 的 i18n key */
  placeholder?: string
  /** 校验错误信息的 i18n keys */
  messages?: Record<string, string>
  /** 枚举选项显示文本的 i18n keys（与 enumNames 对应） */
  enumLabels?: string[]
}

// ============================================================
// 校验器类型
// ============================================================

export interface BuiltinValidator {
  type:
    | 'required'
    | 'email'
    | 'url'
    | 'phone'
    | 'idCard'
    | 'min'
    | 'max'
    | 'minLength'
    | 'maxLength'
  message?: string
  trigger?: 'change' | 'blur' | 'submit'
  /** 用于 min/max/minLength/maxLength 的具体值 */
  value?: number
}

export interface RegexValidator {
  pattern: string
  message: string
  trigger?: 'change' | 'blur' | 'submit'
}

export interface CustomValidator {
  /** 已注册的自定义校验器名（见 FunctionRegistry） */
  validator: string
  params?: Record<string, any>
  message?: string
}

export interface AsyncValidator {
  /** 已注册的异步校验器名（返回 Promise<string | undefined>） */
  asyncValidator: string
  params?: Record<string, any>
  message?: string
}

export type Validator =
  | BuiltinValidator
  | RegexValidator
  | CustomValidator
  | AsyncValidator

// ============================================================
// 动态数据源（预留扩展，TODO: 待实现）
// ============================================================

/**
 * 动态接口数据源配置
 * 用于 Select / Cascader / TreeSelect 等组件的选项来源
 * 当前版本：字段已预留，渲染器暂未处理
 */
export interface DataSourceConfig {
  /** 数据源类型 */
  type: 'api' | 'static' | 'relation'
  /** API 地址（type='api' 时使用） */
  url?: string
  /** HTTP 方法（默认 GET） */
  method?: 'GET' | 'POST'
  /** 请求参数（支持表达式，如 '$values.deptId'） */
  params?: Record<string, any>
  /** 响应数据路径（如 'data.list'） */
  dataPath?: string
  /** label 字段名（默认 'label'） */
  labelField?: string
  /** value 字段名（默认 'value'） */
  valueField?: string
  /** 关联 RelationRegister 中的配置 key（type='relation' 时使用） */
  relationKey?: string
}

// ============================================================
// 联动（Reactions）类型
// ============================================================

export interface ReactionEffect {
  /**
   * 修改字段状态
   * value 支持表达式字符串（在沙箱中求值）
   */
  state?: {
    visible?: boolean
    disabled?: boolean
    readOnly?: boolean
    required?: boolean
    loading?: boolean
    /** 设置字段值（支持表达式，如 '$deps[0] * $deps[1]'） */
    value?: any
    /** 设置下拉选项 */
    dataSource?: any[]
    title?: string
    description?: string
  }
  /** 修改 x-component-props（精细控制组件参数） */
  props?: Record<string, any>
  /**
   * 副作用表达式（在沙箱中执行）
   * 可用变量：$form、$field、$deps、$values、$self
   */
  run?: string
}

export interface Reaction {
  /**
   * 规则名称（设计器 UI 专用，便于识别多条规则）
   */
  name?: string
  /**
   * 备注/注释（设计器 UI 专用，记录规则用途）
   */
  remark?: string
  /**
   * 规则是否启用（默认 true）
   * false = 引擎跳过此规则，规则数据保留
   */
  enabled?: boolean
  /**
   * 依赖字段路径列表（点路径，如 'user.name'）
   * $deps[n] 对应 dependencies[n] 的当前值
   */
  dependencies?: string[]
  /**
   * 条件表达式（字符串，在沙箱中求值）
   * 内置变量：$self, $form, $deps, $values
   * 不填 = 始终执行 fulfill
   */
  when?: string
  /** when 为 true 时执行 */
  fulfill?: ReactionEffect
  /** when 为 false 时执行 */
  otherwise?: ReactionEffect
  /**
   * 主动联动目标：将效果作用到指定字段
   * 不填 = 被动联动（效果作用到当前字段自身）
   */
  target?: string | string[]
}

// ============================================================
// 关系字段配置（独创：支持 StdForm 的 1对多/多对多）
// ============================================================

export type RelationType = 'one-to-many' | 'many-to-many'

export type RelationDisplayMode = 'table' | 'form' | 'dialog'

export interface RelationConfig {
  /** 关系类型 */
  type: RelationType
  /** 子表/关联表的目标表名或模型标识 */
  target: string
  /** 外键字段名（子表指向父表的字段） */
  foreignKey: string
  /** 多对多场景下的中间表名（可选） */
  throughTable?: string
  /** 子表字段 Schema */
  targetSchema?: ObjectFieldSchema
  /** 渲染模式（默认 table） */
  displayMode?: RelationDisplayMode
  /** 允许新增 */
  allowAdd?: boolean
  /** 允许删除 */
  allowDelete?: boolean
  /** 允许排序 */
  allowSort?: boolean
  /** 初始加载时的查询条件（支持表达式） */
  initialFilter?: Record<string, any>
}

// ============================================================
// FieldSchema 基础接口
// ============================================================

export interface BaseFieldSchema {
  // ---- JSON Schema 标准属性 ----
  type: FieldType
  title?: string
  description?: string
  enum?: any[]
  enumNames?: string[]
  default?: any

  // ---- JSON Schema 校验属性 ----
  required?: boolean
  minLength?: number
  maxLength?: number
  minimum?: number
  maximum?: number
  pattern?: string
  format?: string

  // ---- x-* UI 扩展属性 ----

  /** Widget 组件名（见组件注册表） */
  'x-component'?: string
  /** Widget 组件的 Props */
  'x-component-props'?: Record<string, any>
  /** 表单项装饰器组件名（默认 FormItem） */
  'x-decorator'?: string
  /** 装饰器 Props */
  'x-decorator-props'?: {
    labelWidth?: number
    required?: boolean
    asterisk?: boolean
    tooltip?: string
    extra?: string
    [key: string]: any
  }
  /** 显示状态 */
  'x-display'?: DisplayState
  /** 交互模式 */
  'x-pattern'?: PatternState
  /** 联动规则 */
  'x-reactions'?: Reaction[]
  /** 校验规则（扩展 JSON Schema 的标准校验） */
  'x-validator'?: Validator[]
  /** i18n 配置 */
  'x-i18n'?: I18nConfig
  /** 流式布局的列宽（1-24，默认 24 = 全宽） */
  'x-span'?: number
  /** 字段排序权重（流式布局用） */
  'x-order'?: number
  /** 自由布局的位置信息 */
  'x-free-position'?: FreePosition
  /** 自定义 CSS class */
  'x-class'?: string
  /** 内联样式 */
  'x-style'?: Record<string, string>
  /** 节点唯一 ID（由设计器生成） */
  'x-id'?: string
  /**
   * 动态数据源配置（TODO: 待渲染器实现）
   * 配置后 options/enum 将从接口动态获取，覆盖静态 enum
   */
  'x-datasource'?: DataSourceConfig
}

// ============================================================
// 具体 Schema 类型
// ============================================================

/** 对象字段（也用作页面根 Schema） */
export interface ObjectFieldSchema extends Omit<BaseFieldSchema, 'required'> {
  type: 'object'
  properties: Record<string, FieldSchema>
  /** JSON Schema required: 必填属性名列表 */
  required?: string[]
}

/** 数组字段 */
export interface ArrayFieldSchema extends BaseFieldSchema {
  type: 'array'
  items: FieldSchema | FieldSchema[]
  minItems?: number
  maxItems?: number
  /** 关系字段配置（当 x-component 为 SubFormTable 等时使用） */
  'x-relation'?: RelationConfig
}

/** 虚字段（纯 UI 容器，不参与数据绑定） */
export interface VoidFieldSchema extends BaseFieldSchema {
  type: 'void'
  'x-component': string
  properties?: Record<string, FieldSchema>
}

/** 标量字段（string / number / boolean / integer / null） */
export interface ScalarFieldSchema extends BaseFieldSchema {
  type: 'string' | 'number' | 'boolean' | 'integer' | 'null'
}

/** 联合字段类型 */
export type FieldSchema =
  | ScalarFieldSchema
  | ObjectFieldSchema
  | ArrayFieldSchema
  | VoidFieldSchema

/** 所有合法的字段 type 值（用于 UI 下拉等场景） */
export type AllFieldTypes = FieldSchema['type'] | 'void'

// ============================================================
// 容器节点（预留扩展，TODO: GroupRenderer.vue 待实现）
// ============================================================

/**
 * 容器节点类型
 * 支持将字段分组（Group / Tab / Collapse 等），实现无限嵌套布局
 *
 * 当前版本：类型已定义，FieldRenderer 已加占位分支，GroupRenderer 待后续实现
 */
export type ContainerVariant = 'group' | 'tab' | 'collapse' | 'card'

export interface ContainerNode {
  /** 标识为容器节点（区别于 FieldSchema） */
  type: 'container'
  /** 容器样式（默认 'group'） */
  variant?: ContainerVariant
  /** 容器标题 */
  title?: LocalizedString
  /** 节点唯一 ID（由设计器生成） */
  'x-id'?: string
  /** 字段排序权重 */
  'x-order'?: number
  /** 是否默认折叠（variant='collapse' 时有效） */
  collapsed?: boolean
  /** 容器内部列数（覆盖父级 columns） */
  columns?: number
  /** 子节点列表（可嵌套） */
  children: Array<FieldSchema | ContainerNode>
}

/** Schema 树节点（字段或容器） */
export type SchemaNode = FieldSchema | ContainerNode

/** 判断节点是否为容器节点 */
export function isContainerNode(node: SchemaNode): node is ContainerNode {
  return (node as ContainerNode).type === 'container'
}

// ============================================================
// 生命周期 Schema
// ============================================================

export interface LifeCycles {
  /** 表单字段模型创建完成后（等价于 created） */
  onFormCreated?: string
  /** 表单挂载到 DOM 后（等价于 onMounted） */
  onFormMounted?: string
  /** 表单提交前（可在沙箱中 return false 阻止） */
  onFormSubmit?: string
  /** 任意字段值变化时 */
  onFormDataChange?: string
  /** 校验失败时 */
  onFormValidateFailed?: string
  /** 表单卸载时 */
  onFormUnmounted?: string
}

// ============================================================
// 表单全局配置
// ============================================================

export interface FormConfig {
  labelWidth?: number
  labelPosition?: 'left' | 'right' | 'top'
  size?: 'large' | 'default' | 'small'
  layoutType?: 'PC' | 'Pad' | 'H5'
  /** 流式布局默认列数 */
  columns?: number
  disabled?: boolean
  readOnly?: boolean
  /**
   * 表单级自定义 JS 代码块（逃生舱，TODO: 待实现）
   * 可在此定义全局变量、生命周期钩子、工具函数等
   * 相当于 Vue setup() 的扩展，在沙箱中执行
   */
  setupCode?: string
}

// ============================================================
// 顶层 PageSchema
// ============================================================

export interface PageSchema {
  /**
   * Schema 格式版本（用于未来迁移）
   * 当前版本 "1.0"，每次破坏性变更时递增
   */
  version: string
  id: string
  name: string
  layoutMode: LayoutMode
  formConfig: FormConfig
  /** 字段/容器节点树（根必须是 ObjectFieldSchema） */
  schema: ObjectFieldSchema
  cssCode?: string
  lifeCycles?: LifeCycles
  /** 表单级别的全局变量（可在联动表达式中通过 $globalState 访问） */
  globalState?: Record<string, any>
  __meta__?: {
    createdAt: string
    updatedAt: string
    createdBy?: string
  }
}
