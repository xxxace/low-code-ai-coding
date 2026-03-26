# DSL Schema 规范

> 版本：v1.0.0  
> 创建时间：2026-03-26  
> 作者：AI Research Agent  

---

## 一、设计原则

本 Schema 规范遵循以下原则：

1. **基于标准**：以 JSON Schema draft-07 为基础，保持后端友好和工具链兼容性
2. **x-* 扩展**：UI 配置、联动、关系等特性通过 `x-` 前缀属性扩展（借鉴 Formily）
3. **双布局支持**：同一 Schema 可在流式/自由两种布局模式下渲染
4. **i18n 就近原则**：i18n key 存储在 Schema 中，靠近其使用位置
5. **可序列化**：Schema 必须是纯 JSON，不含函数引用（函数通过字符串表达式表示）

---

## 二、顶层 PageSchema

```typescript
interface PageSchema {
  /** Schema 版本，用于升级迁移 */
  version: '1.0'
  
  /** 页面 ID（唯一标识） */
  id: string
  
  /** 页面名称 */
  name: string
  
  /** 布局模式：flow = 流式布局（Flex/Grid）| free = 自由定位布局 */
  layoutMode: 'flow' | 'free'
  
  /** 页面级配置 */
  formConfig: FormConfig
  
  /** 字段/容器节点树（类似 JSON Schema 的 properties） */
  schema: ObjectFieldSchema
  
  /** 全局样式（可注入 CSS 变量或 class） */
  cssCode?: string
  
  /** 生命周期钩子（字符串表达式，在沙箱中执行） */
  lifeCycles?: LifeCycles
  
  /** 全局状态（类似 Vue 的 data） */
  globalState?: Record<string, any>
  
  /** 元数据（保留字段，供平台使用） */
  __meta__?: {
    createdAt: string
    updatedAt: string
    createdBy: string
  }
}
```

### FormConfig 表单全局配置

```typescript
interface FormConfig {
  /** 标签宽度（px）*/
  labelWidth?: number
  
  /** 标签位置 */
  labelPosition?: 'left' | 'right' | 'top'
  
  /** 表单尺寸 */
  size?: 'large' | 'default' | 'small'
  
  /** 布局类型（响应式设备类型） */
  layoutType?: 'PC' | 'Pad' | 'H5'
  
  /** 流式布局：默认列数（使用 CSS Grid 24 列栅格） */
  columns?: number
  
  /** 禁用整个表单 */
  disabled?: boolean
  
  /** 只读模式 */
  readOnly?: boolean
}
```

---

## 三、字段 Schema（FieldSchema）

所有字段 Schema 继承自标准 JSON Schema，扩展以下字段。

### 3.1 基础字段（BaseFieldSchema）

```typescript
interface BaseFieldSchema {
  // ===== JSON Schema 标准字段 =====
  
  /** 字段类型 */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null' | 'void'
  
  /** 字段标题（可使用 i18n key，见 x-i18n） */
  title?: string
  
  /** 字段描述（tooltip 文本） */
  description?: string
  
  /** 枚举值（配合 Select/Radio 等） */
  enum?: any[]
  
  /** 枚举显示标签 */
  enumNames?: string[]
  
  /** 默认值 */
  default?: any
  
  // ===== JSON Schema 校验字段 =====
  minLength?: number
  maxLength?: number
  minimum?: number
  maximum?: number
  pattern?: string
  format?: string
  
  // ===== x-* UI 扩展字段 =====
  
  /**
   * 渲染的 Widget 组件名
   * 内置：Input | Textarea | InputNumber | Select | MultiSelect |
   *       Radio | Checkbox | DatePicker | TimePicker | DateRangePicker |
   *       Switch | Slider | Rate | Upload | RichEditor |
   *       RemoteSelect | DialogPicker | OptionInput
   */
  'x-component'?: string
  
  /** Widget 组件的 props（直接透传到组件） */
  'x-component-props'?: Record<string, any>
  
  /**
   * 表单项装饰器（外壳）
   * 内置：FormItem（默认）| Card | VoidWrapper（无装饰）
   */
  'x-decorator'?: string
  
  /** 装饰器 props */
  'x-decorator-props'?: {
    labelWidth?: number
    required?: boolean
    asterisk?: boolean
    tooltip?: string
    extra?: string
    [key: string]: any
  }
  
  /**
   * 显示状态
   * visible = 正常显示（占位）
   * hidden = 隐藏但保留值（不渲染，保留 DOM 空间）
   * none = 完全不渲染（不占位）
   */
  'x-display'?: 'visible' | 'hidden' | 'none'
  
  /**
   * 交互模式
   * editable = 可编辑（默认）
   * disabled = 禁用
   * readOnly = 只读
   * readPretty = 阅读态（格式化展示值）
   */
  'x-pattern'?: 'editable' | 'disabled' | 'readOnly' | 'readPretty'
  
  /** 联动规则（见第四章） */
  'x-reactions'?: Reaction[]
  
  /** 校验规则（扩展 JSON Schema 的 x-validator） */
  'x-validator'?: Validator[]
  
  /** i18n 配置（见第五章） */
  'x-i18n'?: I18nConfig
  
  /** 字段排序（流式布局） */
  'x-order'?: number
  
  /** 流式布局的列宽（基于 24 列栅格，默认 24 = 全宽） */
  'x-span'?: number
  
  /** 自由布局的位置（仅 layoutMode = 'free' 时生效） */
  'x-free-position'?: FreePosition
  
  /** 自定义 CSS class */
  'x-class'?: string
  
  /** 内联样式 */
  'x-style'?: Record<string, string>
  
  /** 字段 ID（唯一标识，设计器生成） */
  'x-id'?: string
}
```

### 3.2 对象字段（ObjectFieldSchema）

```typescript
interface ObjectFieldSchema extends BaseFieldSchema {
  type: 'object'
  
  /** 子字段（键为字段名，值为 FieldSchema） */
  properties: Record<string, FieldSchema>
  
  /** 必填字段列表（JSON Schema 标准） */
  required?: string[]
}
```

### 3.3 数组字段（ArrayFieldSchema）

```typescript
interface ArrayFieldSchema extends BaseFieldSchema {
  type: 'array'
  
  /** 数组项的 Schema */
  items: FieldSchema | FieldSchema[]
  
  /** 最少项数 */
  minItems?: number
  
  /** 最多项数 */
  maxItems?: number
}
```

### 3.4 虚字段（VoidFieldSchema）

虚字段不参与数据绑定，仅用于布局和 UI 容器（借鉴 Formily 的 VoidField）：

```typescript
interface VoidFieldSchema extends BaseFieldSchema {
  type: 'void'
  
  /**
   * 容器组件
   * 内置：Card | Tabs | TabPane | Collapse | CollapseItem |
   *       Grid | Flex | Divider | Space
   */
  'x-component': string
  
  /** 子节点 */
  properties?: Record<string, FieldSchema>
}
```

**关键特性**：虚字段的子字段数据路径会"穿透"虚字段，直接挂在父节点下。例如：

```
formData: {
  username: "张三",    // Card.name 的 path（跳过 Card 虚字段）
  age: 25            // Card.age 的 path
}
// Card 虚字段本身不产生任何键值
```

### 3.5 关系字段（RelationFieldSchema）

这是本方案的**独创扩展**，用于处理 MES 场景中的 1对多、多对多关系：

```typescript
interface RelationFieldSchema extends BaseFieldSchema {
  type: 'array'
  
  /**
   * 关系类型
   * one-to-many = 子表单（一个父记录 → 多个子记录）
   * many-to-many = 关联表（多个主记录 ↔ 多个关联记录）
   */
  'x-relation': {
    type: 'one-to-many' | 'many-to-many'
    
    /** 子表的表名/模型名（对接后端） */
    target: string
    
    /** 外键字段名（子表指向父表的字段） */
    foreignKey: string
    
    /** 多对多时，中间表名（可选） */
    throughTable?: string
    
    /**
     * 子表的 Schema（复用相同的 FieldSchema 规范）
     * 用于渲染子表单或子表格的列
     */
    targetSchema?: ObjectFieldSchema
    
    /**
     * 渲染模式
     * table = 子表格（默认，列表形式）
     * form = 子表单（展开编辑）
     * dialog = 弹窗表单
     */
    displayMode?: 'table' | 'form' | 'dialog'
    
    /** 允许新增子记录 */
    allowAdd?: boolean
    
    /** 允许删除子记录 */
    allowDelete?: boolean
    
    /** 允许排序 */
    allowSort?: boolean
  }
}
```

---

## 四、联动 Schema（Reactions）

### 4.1 Reaction 基础结构

借鉴 Formily 的 x-reactions，但用 Vue 3 watchEffect 实现：

```typescript
interface Reaction {
  /**
   * 依赖的字段路径列表
   * 支持点路径：'user.name'
   * 支持数组路径：'items[0].price'
   * 支持通配符：'items[*].price'
   */
  dependencies?: string[]
  
  /**
   * 触发条件表达式（字符串，在沙箱中求值）
   * 内置变量：
   *   $self    = 当前字段的 FieldState
   *   $form    = 整个表单的 FormModel
   *   $deps    = dependencies 对应的值数组（顺序对应）
   *   $values  = 整个表单的当前值对象
   */
  when?: string
  
  /** 当 when 为 true 时执行 */
  fulfill?: ReactionEffect
  
  /** 当 when 为 false 时执行 */
  otherwise?: ReactionEffect
  
  /**
   * 主动联动：将效果作用到哪些字段
   * 不填 = 被动联动（效果作用到当前字段自身）
   * 填写 = 主动联动（当前字段变化时影响目标字段）
   */
  target?: string | string[]
}
```

### 4.2 ReactionEffect 联动效果

```typescript
interface ReactionEffect {
  /** 修改字段状态 */
  state?: {
    visible?: boolean
    disabled?: boolean
    readOnly?: boolean
    required?: boolean
    loading?: boolean
    value?: any           // 设置值（可用表达式：'$deps[0] + $deps[1]'）
    dataSource?: any[]    // 设置下拉选项
    title?: string        // 修改标签
    description?: string  // 修改说明
  }
  
  /** 修改 x-component-props（精细控制组件参数） */
  props?: Record<string, any>
  
  /**
   * 触发副作用（字符串表达式）
   * 可用于：调用 API 加载数据、触发其他业务逻辑
   * 示例：'$form.loadOptions("cityField", $deps[0])'
   */
  run?: string
}
```

### 4.3 联动示例

#### 示例1：显隐联动（被动）

字段 B 在字段 A 的值为 "show" 时显示：

```json
{
  "fieldB": {
    "type": "string",
    "title": "字段B",
    "x-component": "Input",
    "x-reactions": [
      {
        "dependencies": ["fieldA"],
        "when": "$deps[0] === 'show'",
        "fulfill": {
          "state": { "visible": true }
        },
        "otherwise": {
          "state": { "visible": false }
        }
      }
    ]
  }
}
```

#### 示例2：值联动（主动）

字段 price 变化时，自动计算 totalAmount：

```json
{
  "price": {
    "type": "number",
    "title": "单价",
    "x-component": "InputNumber",
    "x-reactions": [
      {
        "target": "totalAmount",
        "fulfill": {
          "state": {
            "value": "$values.price * $values.quantity"
          }
        }
      }
    ]
  },
  "quantity": {
    "type": "number",
    "title": "数量",
    "x-component": "InputNumber",
    "x-reactions": [
      {
        "target": "totalAmount",
        "fulfill": {
          "state": {
            "value": "$values.price * $values.quantity"
          }
        }
      }
    ]
  },
  "totalAmount": {
    "type": "number",
    "title": "合计金额",
    "x-component": "InputNumber",
    "x-pattern": "readOnly"
  }
}
```

#### 示例3：级联选项（主动联动 + API 加载）

省份变化时，重新加载城市选项：

```json
{
  "province": {
    "type": "string",
    "title": "省份",
    "x-component": "Select",
    "x-component-props": { "placeholder": "请选择省份" },
    "x-reactions": [
      {
        "target": "city",
        "fulfill": {
          "state": {
            "value": null,
            "dataSource": []
          },
          "run": "$form.loadRemoteOptions('city', '/api/cities?province=' + $self.value)"
        }
      }
    ]
  },
  "city": {
    "type": "string",
    "title": "城市",
    "x-component": "Select",
    "x-component-props": { "placeholder": "请先选择省份" }
  }
}
```

#### 示例4：多字段依赖（多对多联动）

```json
{
  "status": {
    "type": "string",
    "title": "状态",
    "x-component": "Select",
    "x-reactions": [
      {
        "dependencies": ["type", "priority"],
        "when": "$deps[0] === 'urgent' && $deps[1] > 3",
        "fulfill": {
          "state": {
            "value": "pending",
            "disabled": true
          }
        }
      }
    ]
  }
}
```

---

## 五、校验 Schema（Validators）

### 5.1 Validator 结构

```typescript
type Validator = BuiltinValidator | CustomValidator | RegexValidator | AsyncValidator

interface BuiltinValidator {
  /** 内置规则名 */
  type: 'required' | 'min' | 'max' | 'email' | 'url' | 'phone' | 'idCard'
  
  /** 错误提示（支持 i18n key） */
  message?: string
  
  /** 触发时机（默认 change + blur） */
  trigger?: 'change' | 'blur' | 'submit'
}

interface RegexValidator {
  /** 正则表达式字符串 */
  pattern: string
  message: string
}

interface CustomValidator {
  /** 自定义校验器名（需先注册） */
  validator: string
  
  /** 传给校验器的参数 */
  params?: Record<string, any>
  
  message?: string
}

interface AsyncValidator {
  /** 异步校验器名（需先注册，返回 Promise） */
  asyncValidator: string
  params?: Record<string, any>
  message?: string
}
```

### 5.2 x-validator 示例

```json
{
  "email": {
    "type": "string",
    "title": "邮箱",
    "x-component": "Input",
    "x-validator": [
      { "type": "required", "message": "邮箱不能为空" },
      { "type": "email", "message": "邮箱格式不正确" }
    ]
  },
  "phone": {
    "type": "string",
    "title": "手机号",
    "x-validator": [
      { "pattern": "^1[3-9]\\d{9}$", "message": "手机号格式不正确" }
    ]
  },
  "orderNo": {
    "type": "string",
    "title": "订单号",
    "x-validator": [
      { "type": "required", "message": "订单号不能为空" },
      { "asyncValidator": "uniqueOrderNo", "message": "订单号已存在" }
    ]
  }
}
```

---

## 六、国际化 Schema（i18n）

### 6.1 I18nConfig 结构

```typescript
interface I18nConfig {
  /** title 的 i18n key（覆盖 title 字段的显示文本） */
  title?: string
  
  /** description 的 i18n key */
  description?: string
  
  /** placeholder 的 i18n key */
  placeholder?: string
  
  /** 校验错误信息的 i18n keys（按 validator 类型映射） */
  messages?: Record<string, string>
  
  /** enum 选项的 i18n keys（与 enum 数组长度对应） */
  enumLabels?: string[]
}
```

### 6.2 i18n 示例

```json
{
  "status": {
    "type": "string",
    "title": "状态",
    "x-component": "Select",
    "enum": ["ACTIVE", "INACTIVE", "PENDING"],
    "enumNames": ["激活", "停用", "待审"],
    "x-i18n": {
      "title": "field.status.label",
      "enumLabels": [
        "field.status.active",
        "field.status.inactive", 
        "field.status.pending"
      ],
      "messages": {
        "required": "field.status.required"
      }
    }
  }
}
```

运行时通过 `useNsI18n` 解析：

```typescript
// 渲染时
const { t } = useNsI18n()
const label = field['x-i18n']?.title ? t(field['x-i18n'].title, field.title) : field.title
```

---

## 七、布局 Schema

### 7.1 流式布局容器

```json
{
  "basicInfo": {
    "type": "void",
    "x-component": "Card",
    "x-component-props": {
      "title": "基本信息",
      "collapsible": true
    },
    "x-decorator": "FormItem",
    "x-span": 24,
    "properties": {
      "ordNo": {
        "type": "string",
        "title": "单号",
        "x-component": "Input",
        "x-span": 12
      },
      "ordDate": {
        "type": "string",
        "title": "下单日期",
        "x-component": "DatePicker",
        "x-span": 12
      }
    }
  }
}
```

### 7.2 自由布局（free 模式）

```json
{
  "title": {
    "type": "string",
    "x-component": "Text",
    "x-component-props": {
      "content": "大屏标题"
    },
    "x-free-position": {
      "x": 0,
      "y": 0,
      "width": 1920,
      "height": 80,
      "zIndex": 1
    }
  },
  "chart1": {
    "type": "void",
    "x-component": "BarChart",
    "x-free-position": {
      "x": 0,
      "y": 100,
      "width": 640,
      "height": 400,
      "zIndex": 1
    }
  }
}
```

### 7.3 FreePosition 结构

```typescript
interface FreePosition {
  x: number        // left（px）
  y: number        // top（px）
  width: number    // width（px）
  height: number   // height（px）
  zIndex?: number  // z-index（默认 1）
  rotate?: number  // 旋转角度（°，默认 0）
  locked?: boolean // 是否锁定（设计器中不可拖拽）
}
```

---

## 八、完整 PageSchema 示例

以下是一个完整的 MES 询价单表单 Schema：

```json
{
  "version": "1.0",
  "id": "inquiry-order-form",
  "name": "询价单",
  "layoutMode": "flow",
  "formConfig": {
    "labelWidth": 120,
    "labelPosition": "right",
    "layoutType": "PC"
  },
  "schema": {
    "type": "object",
    "properties": {
      "headerCard": {
        "type": "void",
        "x-component": "Card",
        "x-component-props": { "title": "单据信息" },
        "x-span": 24,
        "properties": {
          "PLNNO": {
            "type": "string",
            "title": "询价单号",
            "x-component": "Input",
            "x-component-props": { "disabled": true },
            "x-span": 8,
            "x-i18n": { "title": "form.inquiry.plnno" }
          },
          "CLNT": {
            "type": "string",
            "title": "客户",
            "x-component": "DialogPicker",
            "x-component-props": {
              "placeholder": "请选择客户",
              "dialogConfig": { "title": "选择客户", "api": "/api/clients" }
            },
            "x-span": 8,
            "x-validator": [
              { "type": "required", "message": "客户不能为空" }
            ]
          },
          "STATUS": {
            "type": "string",
            "title": "单据状态",
            "x-component": "Select",
            "enum": ["1", "2", "3"],
            "enumNames": ["草稿", "待审", "已审"],
            "x-span": 8,
            "x-pattern": "readOnly"
          },
          "BEGFR": {
            "type": "string",
            "title": "需求日期起",
            "x-component": "DatePicker",
            "x-span": 8
          },
          "ENDTO": {
            "type": "string",
            "title": "需求日期止",
            "x-component": "DatePicker",
            "x-span": 8,
            "x-reactions": [
              {
                "dependencies": ["BEGFR"],
                "when": "$deps[0] && $self.value && $self.value < $deps[0]",
                "fulfill": {
                  "state": {},
                  "run": "$form.setError('ENDTO', '结束日期不能早于开始日期')"
                }
              }
            ]
          },
          "REMARK": {
            "type": "string",
            "title": "备注",
            "x-component": "Textarea",
            "x-component-props": { "rows": 3 },
            "x-span": 24
          }
        }
      },
      "detailsTab": {
        "type": "void",
        "x-component": "Tabs",
        "x-span": 24,
        "properties": {
          "orderItems": {
            "type": "void",
            "x-component": "TabPane",
            "x-component-props": { "label": "询价明细" },
            "properties": {
              "items": {
                "type": "array",
                "title": "明细列表",
                "x-component": "SubFormTable",
                "x-relation": {
                  "type": "one-to-many",
                  "target": "INQUIRY_ITEMS",
                  "foreignKey": "PLNSEQ",
                  "displayMode": "table",
                  "allowAdd": true,
                  "allowDelete": true,
                  "targetSchema": {
                    "type": "object",
                    "properties": {
                      "MATID": {
                        "type": "string",
                        "title": "物料编号",
                        "x-component": "Input"
                      },
                      "QTY": {
                        "type": "number",
                        "title": "数量",
                        "x-component": "InputNumber",
                        "x-validator": [
                          { "type": "required", "message": "数量不能为空" },
                          { "type": "min", "message": "数量必须大于0" }
                        ]
                      },
                      "UNIT": {
                        "type": "string",
                        "title": "单位",
                        "x-component": "Select"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "lifeCycles": {
    "onFormMounted": "await $form.loadOptions('CLNT', '/api/clients')",
    "onFormSubmit": "await $form.save('/api/inquiry-orders')"
  }
}
```

---

## 九、生命周期 Schema

```typescript
interface LifeCycles {
  /** 表单 Schema 解析完成，字段模型创建后触发 */
  onFormCreated?: string
  
  /** 表单挂载到 DOM 后触发（等价于 onMounted） */
  onFormMounted?: string
  
  /** 表单数据提交前触发（可返回 false 阻止提交） */
  onFormSubmit?: string
  
  /** 任意字段值变化时触发 */
  onFormDataChange?: string
  
  /** 表单验证失败时触发 */
  onFormValidateFailed?: string
  
  /** 表单卸载时触发 */
  onFormUnmounted?: string
}
```

生命周期表达式中可用变量：

| 变量 | 类型 | 说明 |
|------|------|------|
| `$form` | FormModel | 整个表单模型 |
| `$values` | object | 当前表单值 |
| `$field` | FieldModel | 当前字段（onFormDataChange） |
| `$router` | Router | Vue Router 实例 |
| `$message` | ElMessage | Element Plus message |

---

## 十、Schema 版本迁移

Schema 包含 `version` 字段，当格式变更时需要迁移：

```typescript
// SchemaVersionMigrator
const migrations = {
  '1.0→1.1': (schema: PageSchema) => {
    // 示例：将旧版 x-rules 重命名为 x-validator
    walkSchema(schema, (field) => {
      if (field['x-rules']) {
        field['x-validator'] = field['x-rules']
        delete field['x-rules']
      }
    })
    schema.version = '1.1'
    return schema
  }
}
```

---

## 附录：Schema 字段速查表

### 基础属性

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | ✅ | 字段类型 |
| `title` | string | - | 标签文本 |
| `description` | string | - | 描述/tooltip |
| `default` | any | - | 默认值 |

### x-* 扩展属性

| 字段 | 类型 | 说明 |
|------|------|------|
| `x-component` | string | Widget 组件名 |
| `x-component-props` | object | Widget 组件 props |
| `x-decorator` | string | 装饰器组件名（默认 FormItem） |
| `x-decorator-props` | object | 装饰器 props |
| `x-display` | visible/hidden/none | 显示状态 |
| `x-pattern` | editable/disabled/readOnly/readPretty | 交互模式 |
| `x-reactions` | Reaction[] | 联动规则 |
| `x-validator` | Validator[] | 校验规则 |
| `x-i18n` | I18nConfig | 国际化配置 |
| `x-span` | number | 流式布局列宽（1-24） |
| `x-free-position` | FreePosition | 自由布局位置 |
| `x-order` | number | 排序权重 |
| `x-id` | string | 节点唯一 ID |
| `x-class` | string | CSS class |
| `x-style` | object | 内联样式 |
| `x-relation` | RelationConfig | 关系字段配置 |
