/**
 * FormModel 单元测试
 *
 * 测试表单模型的核心功能：初始化、字段读写、状态管理、校验、重置、提交数据。
 * 需要 Vue 响应式运行时，使用 happy-dom 环境。
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { FormModel } from '../model'
import type { PageSchema } from '../schema'

// ============================================================
// 测试用 Schema 工厂
// ============================================================

function createTestSchema(overrides?: Partial<PageSchema>): PageSchema {
  return {
    version: '1.0',
    id: 'test-form',
    name: '测试表单',
    formConfig: { columns: 2 },
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          title: '姓名',
          default: '',
          'x-component': 'Input',
          'x-component-props': { placeholder: '请输入姓名' },
          'x-validator': [{ type: 'required', message: '姓名不能为空' }],
        },
        age: {
          type: 'number',
          title: '年龄',
          default: 0,
          'x-component': 'InputNumber',
          'x-validator': [
            { type: 'min', value: 0, message: '年龄不能为负' },
            { type: 'max', value: 150, message: '年龄不合法' },
          ],
        },
        email: {
          type: 'string',
          title: '邮箱',
          default: '',
          'x-component': 'Input',
          'x-validator': [{ type: 'email' }],
        },
        gender: {
          type: 'string',
          title: '性别',
          enum: ['male', 'female'],
          enumNames: ['男', '女'],
          default: 'male',
          'x-component': 'Select',
        },
        hidden: {
          type: 'string',
          title: '隐藏字段',
          default: 'secret',
          'x-display': 'none',
          'x-component': 'Input',
        },
        readOnly: {
          type: 'string',
          title: '只读字段',
          default: 'fixed',
          'x-pattern': 'readOnly',
          'x-component': 'Input',
          'x-validator': [{ type: 'required' }],
        },
      },
    },
    ...overrides,
  }
}

// ============================================================
// 初始化
// ============================================================

describe('FormModel', () => {
  let model: FormModel

  beforeEach(() => {
    model = new FormModel(createTestSchema())
  })

  // ---- 初始化 ----

  describe('初始化', () => {
    it('从 Schema 正确初始化所有字段', () => {
      const paths = model.getAllPaths()
      expect(paths).toContain('name')
      expect(paths).toContain('age')
      expect(paths).toContain('email')
      expect(paths).toContain('gender')
      expect(paths).toContain('hidden')
      expect(paths).toContain('readOnly')
    })

    it('字段的 title 来自 Schema', () => {
      expect(model.getField('name')!.title).toBe('姓名')
      expect(model.getField('age')!.title).toBe('年龄')
    })

    it('字段的 value 等于 Schema 的 default', () => {
      expect(model.getField('name')!.value).toBe('')
      expect(model.getField('age')!.value).toBe(0)
      expect(model.getField('gender')!.value).toBe('male')
    })

    it('字段的 initialValue 等于 default', () => {
      expect(model.getField('name')!.initialValue).toBe('')
      expect(model.getField('age')!.initialValue).toBe(0)
    })

    it('enum 字段正确构建 dataSource', () => {
      const gender = model.getField('gender')!
      expect(gender.dataSource).toEqual([
        { label: '男', value: 'male' },
        { label: '女', value: 'female' },
      ])
    })

    it('无 enum 的字段 dataSource 为空数组', () => {
      expect(model.getField('name')!.dataSource).toEqual([])
    })

    it('x-display 初始化 display 状态', () => {
      expect(model.getField('hidden')!.display).toBe('none')
      expect(model.getField('name')!.display).toBe('visible')
    })

    it('x-pattern 初始化 pattern 状态', () => {
      expect(model.getField('readOnly')!.pattern).toBe('readOnly')
      expect(model.getField('name')!.pattern).toBe('editable')
    })

    it('componentProps 包含 x-component-props', () => {
      const nameField = model.getField('name')!
      expect(nameField.componentProps.placeholder).toBe('请输入姓名')
    })

    it('初始状态：所有字段未修改、无错误、非加载', () => {
      for (const field of model.getAllFields()) {
        expect(field.modified).toBe(false)
        expect(field.errors).toEqual([])
        expect(field.loading).toBe(false)
      }
    })

    it('void 类型字段不创建 FieldState', () => {
      const schemaWithVoid = createTestSchema()
      schemaWithVoid.schema.properties = {
        ...schemaWithVoid.schema.properties,
        card: {
          type: 'void',
          'x-component': 'Card',
          properties: {
            innerField: {
              type: 'string',
              title: '内部字段',
              default: 'hello',
            },
          },
        } as any,
      }
      const voidModel = new FormModel(schemaWithVoid)
      expect(voidModel.getField('card')).toBeUndefined()
      // void 字段跳过 path 注册，但内部子字段的 path 仍是顶层 key
      // （void 不贡献 pathPrefix，只用 addressPrefix 定位）
      expect(voidModel.getField('innerField')).toBeDefined()
      expect(voidModel.getField('innerField')!.value).toBe('hello')
      // address 是 card.innerField
      expect(voidModel.getField('innerField')!.address).toBe('card.innerField')
    })

    it('values 树正确初始化', () => {
      expect(model.values.name).toBe('')
      expect(model.values.age).toBe(0)
      expect(model.values.gender).toBe('male')
    })
  })

  // ---- formConfig 初始化 ----

  describe('formConfig', () => {
    it('disabled=true 时模型禁用', () => {
      const m = new FormModel(createTestSchema({ formConfig: { disabled: true } }))
      expect(m.disabled.value).toBe(true)
    })

    it('readOnly=true 时模型只读', () => {
      const m = new FormModel(createTestSchema({ formConfig: { readOnly: true } }))
      expect(m.readOnly.value).toBe(true)
    })

    it('默认不禁用不只读', () => {
      expect(model.disabled.value).toBe(false)
      expect(model.readOnly.value).toBe(false)
    })
  })

  // ---- 字段值操作 ----

  describe('setFieldValue / getFieldValue', () => {
    it('设置字段值', () => {
      model.setFieldValue('name', '张三')
      expect(model.getField('name')!.value).toBe('张三')
      expect(model.values.name).toBe('张三')
    })

    it('设置值后标记为 modified', () => {
      model.setFieldValue('name', '张三')
      expect(model.getField('name')!.modified).toBe(true)
    })

    it('设置值后清空错误', () => {
      model.getField('name')!.errors = ['之前有错误']
      model.setFieldValue('name', '张三')
      expect(model.getField('name')!.errors).toEqual([])
    })

    it('设置不存在的字段路径，静默忽略', () => {
      model.setFieldValue('nonexistent', 'value')
      // 不应该抛出
    })

    it('获取字段值', () => {
      model.setFieldValue('age', 25)
      expect(model.getFieldValue('age')).toBe(25)
    })

    it('获取不存在的字段返回 undefined', () => {
      expect(model.getFieldValue('nonexistent')).toBeUndefined()
    })
  })

  // ---- setValues 批量设置 ----

  describe('setValues', () => {
    it('批量设置扁平字段', () => {
      model.setValues({ name: '张三', age: 25, email: 'test@test.com' })
      expect(model.getFieldValue('name')).toBe('张三')
      expect(model.getFieldValue('age')).toBe(25)
      expect(model.getFieldValue('email')).toBe('test@test.com')
    })

    it('批量设置嵌套对象', () => {
      // 需要一个有 object 类型字段的 schema
      const nestedSchema = createTestSchema()
      nestedSchema.schema.properties = {
        user: {
          type: 'object',
          title: '用户',
          properties: {
            firstName: { type: 'string', title: '名', default: '' },
            lastName: { type: 'string', title: '姓', default: '' },
          },
        },
      }
      const m = new FormModel(nestedSchema)
      // setValues 递归处理嵌套对象：{ user: { firstName, lastName } }
      m.setValues({ user: { firstName: '三', lastName: '张' } })
      expect(m.getFieldValue('user.firstName')).toBe('三')
      expect(m.getFieldValue('user.lastName')).toBe('张')
    })
  })

  // ---- setFieldState ----

  describe('setFieldState', () => {
    it('更新字段状态', () => {
      model.setFieldState('name', { display: 'hidden', pattern: 'disabled' })
      const field = model.getField('name')!
      expect(field.display).toBe('hidden')
      expect(field.pattern).toBe('disabled')
    })

    it('通过 setFieldState 修改值', () => {
      model.setFieldState('name', { value: '新值' })
      expect(model.getField('name')!.value).toBe('新值')
      expect(model.values.name).toBe('新值')
    })

    it('修改不存在的字段路径，静默忽略', () => {
      model.setFieldState('nonexistent', { value: 'x' })
      // 不应该抛出
    })
  })

  // ---- 错误管理 ----

  describe('错误管理', () => {
    it('setFieldError 设置错误', () => {
      model.setFieldError('name', ['姓名不能为空'])
      expect(model.getField('name')!.errors).toEqual(['姓名不能为空'])
    })

    it('clearFieldError 清空错误', () => {
      model.setFieldError('name', ['错误'])
      model.clearFieldError('name')
      expect(model.getField('name')!.errors).toEqual([])
    })

    it('clearAllErrors 清空所有错误', () => {
      model.setFieldError('name', ['错误1'])
      model.setFieldError('age', ['错误2'])
      model.clearAllErrors()
      expect(model.getField('name')!.errors).toEqual([])
      expect(model.getField('age')!.errors).toEqual([])
    })

    it('hasErrors 计算属性', () => {
      expect(model.hasErrors.value).toBe(false)
      model.setFieldError('name', ['有错误'])
      expect(model.hasErrors.value).toBe(true)
      model.clearAllErrors()
      expect(model.hasErrors.value).toBe(false)
    })

    it('getErrors 返回有错误的字段', () => {
      model.setFieldError('name', ['错误A'])
      model.setFieldError('age', ['错误B'])
      const errors = model.getErrors()
      expect(Object.keys(errors)).toContain('name')
      expect(Object.keys(errors)).toContain('age')
      expect(errors['name']).toEqual(['错误A'])
    })

    it('getErrors 不包含无错误的字段', () => {
      model.setFieldError('name', ['错误'])
      const errors = model.getErrors()
      expect(Object.keys(errors)).not.toContain('age')
    })
  })

  // ---- dirtyFields ----

  describe('dirtyFields', () => {
    it('修改后出现在 dirtyFields 中', () => {
      model.setFieldValue('name', '张三')
      expect(model.dirtyFields.value).toContain('name')
    })

    it('未修改的不在 dirtyFields 中', () => {
      expect(model.dirtyFields.value).not.toContain('name')
    })
  })

  // ---- 校验 ----

  describe('validate', () => {
    it('required 校验：空值返回错误', async () => {
      model.setFieldValue('name', '')
      const valid = await model.validate()
      expect(valid).toBe(false)
      expect(model.getField('name')!.errors).toContain('姓名不能为空')
    })

    it('required 校验：有值通过', async () => {
      model.setFieldValue('name', '张三')
      const valid = await model.validate()
      expect(model.getField('name')!.errors).toEqual([])
    })

    it('min/max 数值校验', async () => {
      model.setFieldValue('age', -1)
      const valid = await model.validate()
      expect(valid).toBe(false)
      expect(model.getField('age')!.errors[0]).toContain('不能为负')

      model.setFieldValue('age', 25)
      const valid2 = await model.validate(['age'])
      expect(valid2).toBe(true)
      expect(model.getField('age')!.errors).toEqual([])
    })

    it('email 格式校验', async () => {
      model.setFieldValue('email', 'not-an-email')
      const valid = await model.validate(['email'])
      expect(valid).toBe(false)
      expect(model.getField('email')!.errors[0]).toContain('邮箱')

      model.setFieldValue('email', 'test@test.com')
      const valid2 = await model.validate(['email'])
      expect(valid2).toBe(true)
    })

    it('hidden 字段不参与校验', async () => {
      // hidden 字段 display=none，不校验
      const valid = await model.validate(['hidden'])
      expect(valid).toBe(true)
    })

    it('readOnly 字段不参与校验', async () => {
      // readOnly 字段 pattern=readOnly，不校验
      const valid = await model.validate(['readOnly'])
      expect(valid).toBe(true)
    })

    it('校验指定路径', async () => {
      model.setFieldValue('name', '')
      model.setFieldValue('age', -1)
      const valid = await model.validate(['name'])
      expect(valid).toBe(false)
      // age 不在校验范围
      expect(model.getField('age')!.errors).toEqual([])
    })

    it('validating 状态正确切换', async () => {
      expect(model.validating.value).toBe(false)
      const promise = model.validate()
      expect(model.validating.value).toBe(true)
      await promise
      expect(model.validating.value).toBe(false)
    })

    it('regex 校验器', async () => {
      const regexSchema = createTestSchema()
      regexSchema.schema.properties = {
        code: {
          type: 'string',
          title: '编码',
          default: '',
          'x-component': 'Input',
          'x-validator': [{ pattern: '^[A-Z]{3}$', message: '必须为3个大写字母' }],
        },
      }
      const m = new FormModel(regexSchema)
      m.setFieldValue('code', 'abc')
      const valid = await m.validate()
      expect(valid).toBe(false)

      m.setFieldValue('code', 'ABC')
      const valid2 = await m.validate()
      expect(valid2).toBe(true)
    })
  })

  // ---- 重置 ----

  describe('reset', () => {
    it('重置所有字段到初始值', () => {
      model.setFieldValue('name', '张三')
      model.setFieldValue('age', 25)
      model.reset()

      expect(model.getField('name')!.value).toBe('')
      expect(model.getField('age')!.value).toBe(0)
    })

    it('重置后 modified 变为 false', () => {
      model.setFieldValue('name', '张三')
      expect(model.getField('name')!.modified).toBe(true)
      model.reset()
      expect(model.getField('name')!.modified).toBe(false)
    })

    it('重置后清空错误', () => {
      model.setFieldError('name', ['错误'])
      model.reset()
      expect(model.getField('name')!.errors).toEqual([])
    })

    it('重置后清空警告', () => {
      model.getField('name')!.warnings = ['警告']
      model.reset()
      expect(model.getField('name')!.warnings).toEqual([])
    })

    it('重置后 values 树同步更新', () => {
      model.setFieldValue('name', '张三')
      model.reset()
      expect(model.values.name).toBe('')
    })
  })

  // ---- getSubmitValues ----

  describe('getSubmitValues', () => {
    it('返回 editable 且 visible 的字段', () => {
      model.setFieldValue('name', '张三')
      const submit = model.getSubmitValues()
      expect(submit.name).toBe('张三')
      expect(submit.age).toBe(0)
    })

    it('排除 display=none 的字段', () => {
      const submit = model.getSubmitValues()
      // hidden 字段 display=none
      expect('hidden' in submit).toBe(false)
    })

    it('排除 pattern!=editable 的字段', () => {
      const submit = model.getSubmitValues()
      // readOnly 字段 pattern=readOnly
      expect('readOnly' in submit).toBe(false)
    })
  })

  // ---- 工厂函数 ----

  describe('createFormModel', () => {
    it('导入正确', async () => {
      const { createFormModel } = await import('../model')
      const m = createFormModel(createTestSchema())
      expect(m).toBeInstanceOf(FormModel)
      expect(m.getAllPaths().length).toBeGreaterThan(0)
    })
  })
})
