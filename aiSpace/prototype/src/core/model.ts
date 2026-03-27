/**
 * @file core/model.ts
 * @description 表单模型和字段状态管理
 *
 * 职责：
 * - 维护所有字段的运行时状态（值、显示状态、错误等）
 * - 提供字段增删改查接口给联动引擎调用
 * - 处理表单级别的提交/校验/重置
 *
 * 设计决策：
 * - 使用 Vue 3 原生 reactive/ref，不引入额外响应式库
 * - FieldState 是运行时状态，与 Schema 中的 x-display 等初始值分离
 * - FormModel 是表单的"大脑"，联动引擎通过它修改字段状态
 */

import { reactive, ref, computed, type ComputedRef } from 'vue'
import type {
  FieldSchema,
  PageSchema,
  PatternState,
  DisplayState,
  Validator,
  ObjectFieldSchema,
  ArrayFieldSchema,
} from './schema'

// ============================================================
// 字段运行时状态
// ============================================================

export interface FieldState {
  /** 字段路径（对象路径，如 'user.address.city'） */
  path: string
  /** 字段绝对地址（含 void 字段，用于 DOM 定位） */
  address: string
  /** 当前值 */
  value: any
  /** 初始值（用于 reset） */
  initialValue: any
  /** 下拉选项/枚举选项 */
  dataSource: Array<{ label: string; value: any }>
  /** 显示状态 */
  display: DisplayState
  /** 交互模式 */
  pattern: PatternState
  /** 加载中（如异步选项加载） */
  loading: boolean
  /** 是否被用户修改过 */
  modified: boolean
  /** 校验错误信息列表 */
  errors: string[]
  /** 警告信息列表 */
  warnings: string[]
  /** 标签文本（可被联动覆盖） */
  title: string
  /** 描述文本（可被联动覆盖） */
  description: string
  /** 组件 Props（可被联动覆盖） */
  componentProps: Record<string, any>
}

// ============================================================
// FormModel：表单状态中枢
// ============================================================

export class FormModel {
  /**
   * 所有字段状态（path → FieldState）
   *
   * 使用 reactive 普通对象代替 reactive(Map)：
   * Vue 3 对 Map.set() 的追踪不如对象属性稳定，
   * 普通对象的属性访问可以被 reactive 完整代理。
   */
  private readonly _fields = reactive<Record<string, FieldState>>({})

  /** 表单数据值树（路径 → 值，嵌套结构） */
  readonly values = reactive<Record<string, any>>({})

  /** 表单提交状态 */
  readonly submitting = ref(false)

  /** 表单校验中状态 */
  readonly validating = ref(false)

  /** Schema 引用（只读） */
  readonly schema: PageSchema

  /** 是否整体禁用 */
  readonly disabled = ref(false)

  /** 是否整体只读 */
  readonly readOnly = ref(false)

  constructor(schema: PageSchema) {
    this.schema = schema
    this._initFromSchema(schema.schema.properties)

    if (schema.formConfig.disabled) {
      this.disabled.value = true
    }
    if (schema.formConfig.readOnly) {
      this.readOnly.value = true
    }
  }

  // ============================================================
  // 初始化
  // ============================================================

  private _initFromSchema(
    properties: Record<string, FieldSchema>,
    pathPrefix = '',
    addressPrefix = ''
  ): void {
    for (const [key, fieldSchema] of Object.entries(properties)) {
      const address = addressPrefix ? `${addressPrefix}.${key}` : key

      if (fieldSchema.type === 'void') {
        const voidSchema = fieldSchema as { properties?: Record<string, FieldSchema> }
        if (voidSchema.properties) {
          this._initFromSchema(voidSchema.properties, pathPrefix, address)
        }
        continue
      }

      const path = pathPrefix ? `${pathPrefix}.${key}` : key

      const dataSource = this._buildDataSource(fieldSchema)
      const initialValue = fieldSchema.default ?? (fieldSchema.type === 'array' ? [] : null)

      const state: FieldState = reactive({
        path,
        address,
        value: initialValue,
        initialValue,
        dataSource,
        display: (fieldSchema['x-display'] as DisplayState) ?? 'visible',
        pattern: (fieldSchema['x-pattern'] as PatternState) ?? 'editable',
        loading: false,
        modified: false,
        errors: [],
        warnings: [],
        title: fieldSchema.title ?? key,
        description: fieldSchema.description ?? '',
        componentProps: { ...(fieldSchema['x-component-props'] ?? {}) },
      })

      this._fields[path] = state
      this._setValueByPath(this.values, path, initialValue)

      if (fieldSchema.type === 'object' && (fieldSchema as ObjectFieldSchema).properties) {
        this._initFromSchema((fieldSchema as ObjectFieldSchema).properties, path, address)
      }

      if (
        fieldSchema.type === 'array' &&
        (fieldSchema as ArrayFieldSchema).items &&
        !Array.isArray((fieldSchema as ArrayFieldSchema).items)
      ) {
        // array 中的子 schema 仅用于渲染，不在此初始化独立字段
      }
    }
  }

  private _buildDataSource(
    fieldSchema: FieldSchema
  ): Array<{ label: string; value: any }> {
    if (!fieldSchema.enum) return []

    return fieldSchema.enum.map((val, idx) => ({
      label: fieldSchema.enumNames?.[idx] ?? String(val),
      value: val,
    }))
  }

  // ============================================================
  // 字段访问
  // ============================================================

  getField(path: string): FieldState | undefined {
    return this._fields[path]
  }

  getAllFields(): FieldState[] {
    return Object.values(this._fields)
  }

  getAllPaths(): string[] {
    return Object.keys(this._fields)
  }

  // ============================================================
  // 字段值操作
  // ============================================================

  setFieldValue(path: string, value: any): void {
    const field = this._fields[path]
    if (!field) return

    field.value = value
    field.modified = true
    field.errors = []
    this._setValueByPath(this.values, path, value)
  }

  getFieldValue(path: string): any {
    return this._getValueByPath(this.values, path)
  }

  setValues(values: Record<string, any>, pathPrefix = ''): void {
    for (const [key, value] of Object.entries(values)) {
      const path = pathPrefix ? `${pathPrefix}.${key}` : key

      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        this.setValues(value, path)
      } else {
        this.setFieldValue(path, value)
      }
    }
  }

  // ============================================================
  // 字段状态操作（联动引擎调用）
  // ============================================================

  setFieldState(path: string, state: Partial<Omit<FieldState, 'path' | 'address'>>): void {
    const field = this._fields[path]
    if (!field) return

    Object.assign(field, state)

    if ('value' in state) {
      this._setValueByPath(this.values, path, state.value)
    }
  }

  setFieldError(path: string, errors: string[]): void {
    const field = this._fields[path]
    if (field) {
      field.errors = errors
    }
  }

  clearFieldError(path: string): void {
    this.setFieldError(path, [])
  }

  clearAllErrors(): void {
    for (const field of Object.values(this._fields)) {
      field.errors = []
    }
  }

  // ============================================================
  // 计算属性：表单整体状态
  // ============================================================

  readonly hasErrors: ComputedRef<boolean> = computed(() => {
    for (const field of Object.values(this._fields)) {
      if (field.errors.length > 0) return true
    }
    return false
  })

  readonly dirtyFields: ComputedRef<string[]> = computed(() => {
    return Object.values(this._fields)
      .filter((field) => field.modified)
      .map((field) => field.path)
  })

  // ============================================================
  // 校验
  // ============================================================

  async validate(paths?: string[]): Promise<boolean> {
    this.validating.value = true
    let valid = true

    const fieldsToValidate = paths
      ? paths
          .map((p) => this._fields[p])
          .filter((f): f is FieldState => Boolean(f))
      : Object.values(this._fields)

    await Promise.all(
      fieldsToValidate.map(async (field) => {
        const errors = await this._validateField(field)
        field.errors = errors
        if (errors.length > 0) valid = false
      })
    )

    this.validating.value = false
    return valid
  }

  getErrors(): Record<string, string[]> {
    const errors: Record<string, string[]> = {}
    for (const field of Object.values(this._fields)) {
      if (field.errors.length > 0) {
        errors[field.path] = [...field.errors]
      }
    }
    return errors
  }

  private async _validateField(field: FieldState): Promise<string[]> {
    if (field.display === 'none' || field.display === 'hidden') return []
    if (field.pattern !== 'editable') return []

    const schema = this._getSchemaByPath(field.path)
    if (!schema || !schema['x-validator']) return []

    const errors: string[] = []
    const validators = schema['x-validator'] as Validator[]

    for (const validator of validators) {
      const error = await this._runValidator(validator, field.value, field)
      if (error) errors.push(error)
    }

    return errors
  }

  private async _runValidator(
    validator: Validator,
    value: any,
    _field: FieldState
  ): Promise<string | undefined> {
    if ('type' in validator) {
      switch (validator.type) {
        case 'required': {
          const isEmpty =
            value === null ||
            value === undefined ||
            value === '' ||
            (Array.isArray(value) && value.length === 0)
          if (isEmpty) return validator.message ?? '此字段为必填项'
          break
        }
        case 'email':
          if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return validator.message ?? '邮箱格式不正确'
          }
          break
        case 'url':
          if (value && !/^https?:\/\/.+/.test(value)) {
            return validator.message ?? 'URL 格式不正确'
          }
          break
        case 'phone':
          if (value && !/^1[3-9]\d{9}$/.test(String(value))) {
            return validator.message ?? '手机号格式不正确'
          }
          break
        case 'idCard':
          if (value && !/^\d{17}[\dxX]$/.test(String(value))) {
            return validator.message ?? '身份证号格式不正确'
          }
          break
        case 'minLength':
          if (value !== null && value !== undefined && String(value).length < (validator.value ?? 0)) {
            return validator.message ?? `最少 ${validator.value} 个字符`
          }
          break
        case 'maxLength':
          if (value !== null && value !== undefined && String(value).length > (validator.value ?? Infinity)) {
            return validator.message ?? `最多 ${validator.value} 个字符`
          }
          break
        case 'min':
          if (typeof value === 'number' && value < (validator.value ?? -Infinity)) {
            return validator.message ?? `不能小于 ${validator.value}`
          }
          break
        case 'max':
          if (typeof value === 'number' && value > (validator.value ?? Infinity)) {
            return validator.message ?? `不能大于 ${validator.value}`
          }
          break
      }
    } else if ('pattern' in validator) {
      if (value !== null && value !== undefined && value !== '') {
        const regex = new RegExp(validator.pattern)
        if (!regex.test(String(value))) {
          return validator.message ?? '格式不正确'
        }
      }
    }
    // CustomValidator 和 AsyncValidator 需要外部通过 FunctionRegistry 注册
    return undefined
  }

  // ============================================================
  // 重置
  // ============================================================

  reset(): void {
    for (const field of Object.values(this._fields)) {
      field.value = field.initialValue
      field.modified = false
      field.errors = []
      field.warnings = []
      this._setValueByPath(this.values, field.path, field.initialValue)
    }
  }

  // ============================================================
  // 获取提交数据（仅返回 editable 且可见的字段）
  // ============================================================

  getSubmitValues(): Record<string, any> {
    const result: Record<string, any> = {}
    for (const field of Object.values(this._fields)) {
      if (field.display !== 'none' && field.pattern === 'editable') {
        this._setValueByPath(result, field.path, field.value)
      }
    }
    return result
  }

  // ============================================================
  // 工具方法
  // ============================================================

  private _setValueByPath(obj: Record<string, any>, path: string, value: any): void {
    const keys = path.split('.')
    let current = obj
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!(key in current) || current[key] === null || typeof current[key] !== 'object') {
        current[key] = {}
      }
      current = current[key]
    }
    current[keys[keys.length - 1]] = value
  }

  private _getValueByPath(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce<any>((acc, key) => acc?.[key], obj)
  }

  private _getSchemaByPath(path: string): FieldSchema | undefined {
    const keys = path.split('.')
    let current: any = this.schema.schema

    for (const key of keys) {
      if (current?.type === 'object' && current.properties) {
        current = current.properties[key]
      } else {
        return undefined
      }
    }

    return current as FieldSchema | undefined
  }
}

// ============================================================
// 工厂函数
// ============================================================

export function createFormModel(schema: PageSchema): FormModel {
  return new FormModel(schema)
}
