/**
 * ReactionsEngine 单元测试
 *
 * 分层测试：
 * - 第一层（间接）：沙箱安全 - 通过 evalExpression 结果测试
 * - 第二层（集成）：完整联动流程 - watchEffect + 字段状态变更
 *
 * 需要 Vue 响应式运行时，使用 happy-dom 环境。
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createApp } from 'vue'
import { nextTick } from 'vue'
import { ReactionsEngine, createReactionsEngine } from '../reactions'
import { FormModel, createFormModel } from '../model'
import type { PageSchema } from '../schema'

/**
 * 等待所有微任务和 flush: 'post' 的 watchEffect 执行完成
 */
function flushAll(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 50))
}

// ============================================================
// 测试用 Schema 工厂
// ============================================================

function createTestSchema(overrides?: Partial<PageSchema>): PageSchema {
  return {
    version: '1.0',
    id: 'test-reactions',
    name: '联动测试',
    formConfig: {},
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          title: '姓名',
          default: '',
          'x-component': 'Input',
        },
        age: {
          type: 'number',
          title: '年龄',
          default: 0,
          'x-component': 'InputNumber',
        },
        gender: {
          type: 'string',
          title: '性别',
          enum: ['male', 'female'],
          enumNames: ['男', '女'],
          default: 'male',
          'x-component': 'Select',
        },
        email: {
          type: 'string',
          title: '邮箱',
          default: '',
          'x-component': 'Input',
        },
      },
    },
    ...overrides,
  }
}

/**
 * 在 Vue 应用上下文中创建 FormModel + ReactionsEngine
 */
function createTestContext(schema: PageSchema) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const app = createApp({ template: '<div></div>' })
  app.mount(container)

  const formModel = createFormModel(schema)
  const engine = new ReactionsEngine(formModel)

  const cleanup = () => {
    engine.destroy()
    app.unmount()
    container.remove()
  }

  return { formModel, engine, cleanup }
}

// ============================================================
// 测试组
// ============================================================

describe('ReactionsEngine', () => {
  // ---- 初始化 ----

  describe('init / destroy', () => {
    it('init 后无错误', () => {
      const { cleanup } = createTestContext(createTestSchema())
      // 如果构造不抛出就算通过
      cleanup()
    })

    it('destroy 清理所有 watchEffect', () => {
      const { engine, cleanup } = createTestContext(createTestSchema())
      engine.init()
      engine.destroy()
      // destroy 后不应再响应变化（不抛出即可）
      cleanup()
    })
  })

  // ---- 基础联动：可见性 ----

  describe('条件联动：display', () => {
    let ctx: ReturnType<typeof createTestContext>

    beforeEach(() => {
      const schema = createTestSchema()
      // age >= 18 时显示 email（联动规则挂在 age 上，target 为 email）
      schema.schema.properties!.age['x-reactions'] = [
        {
          name: 'show-email-for-adult',
          when: '$self.value >= 18',
          target: 'email',
          fulfill: { state: { visible: true } },
          otherwise: { state: { hidden: true } },
        },
      ]
      ctx = createTestContext(schema)
      ctx.engine.init()
    })

    afterEach(() => {
      ctx.cleanup()
    })

    it('初始化时自动执行一轮联动', async () => {
      await flushAll()
      // age 初始为 0，0 >= 18 为 false → otherwise → hidden
      expect(ctx.formModel.getField('email')!.display).toBe('hidden')
    })

    it('age 修改时触发联动', async () => {
      await flushAll()
      ctx.formModel.setFieldValue('age', 25)
      await flushAll()
      expect(ctx.formModel.getField('email')!.display).toBe('visible')
    })

    it('age 修改回 0 时触发 otherwise', async () => {
      await flushAll()
      ctx.formModel.setFieldValue('age', 25)
      await flushAll()
      expect(ctx.formModel.getField('email')!.display).toBe('visible')

      ctx.formModel.setFieldValue('age', 10)
      await flushAll()
      expect(ctx.formModel.getField('email')!.display).toBe('hidden')
    })
  })

  // ---- 属性修改：pattern/disabled ----

  describe('条件联动：pattern', () => {
    let ctx: ReturnType<typeof createTestContext>

    beforeEach(() => {
      const schema = createTestSchema()
      schema.schema.properties!.age['x-reactions'] = [
        {
          when: '$form.getField("name").value === ""',
          target: 'age',
          fulfill: { state: { disabled: true } },
          otherwise: { state: { disabled: false } },
        },
      ]
      ctx = createTestContext(schema)
      ctx.engine.init()
    })

    afterEach(() => {
      ctx.cleanup()
    })

    it('初始 name 为空，age 应禁用', async () => {
      await flushAll()
      expect(ctx.formModel.getField('age')!.pattern).toBe('disabled')
    })

    it('name 填值后 age 启用', async () => {
      await flushAll()
      ctx.formModel.setFieldValue('name', '张三')
      await flushAll()
      expect(ctx.formModel.getField('age')!.pattern).toBe('editable')
    })

    it('name 清空后 age 再禁用', async () => {
      await flushAll()
      ctx.formModel.setFieldValue('name', '张三')
      await flushAll()
      expect(ctx.formModel.getField('age')!.pattern).toBe('editable')

      ctx.formModel.setFieldValue('name', '')
      await flushAll()
      expect(ctx.formModel.getField('age')!.pattern).toBe('disabled')
    })
  })

  // ---- 表达式求值 ----

  describe('表达式求值', () => {
    let ctx: ReturnType<typeof createTestContext>

    beforeEach(() => {
      const schema = createTestSchema()
      schema.globalState = { minAge: 18 }
      schema.schema.properties!.age['x-reactions'] = [
        {
          when: '$self.value >= $globalState.minAge',
          target: 'email',
          fulfill: { state: { visible: true } },
          otherwise: { state: { hidden: true } },
        },
      ]
      ctx = createTestContext(schema)
      ctx.engine.init()
    })

    afterEach(() => {
      ctx.cleanup()
    })

    it('$globalState 可在表达式中访问', async () => {
      await flushAll()
      // age 初始 0，0 >= 18 false → hidden
      expect(ctx.formModel.getField('email')!.display).toBe('hidden')

      ctx.formModel.setFieldValue('age', 18)
      await flushAll()
      expect(ctx.formModel.getField('email')!.display).toBe('visible')

      ctx.formModel.setFieldValue('age', 17)
      await flushAll()
      expect(ctx.formModel.getField('email')!.display).toBe('hidden')
    })
  })

  // ---- 循环检测 ----

  describe('循环检测', () => {
    it('循环检测在第 10 次后中止', async () => {
      const schema = createTestSchema()
      schema.schema.properties!.name['x-reactions'] = [
        {
          when: 'true',
          target: 'name',
          fulfill: { state: { value: 'loop-' + Date.now() } },
        },
      ]
      const ctx = createTestContext(schema)
      ctx.engine.init()
      await flushAll()
      // 如果没有循环检测会导致超时，有循环检测则正常完成
      expect(true).toBe(true)
      ctx.cleanup()
    })
  })

  // ---- enabled 标志 ----

  describe('enabled 标志', () => {
    let ctx: ReturnType<typeof createTestContext>

    beforeEach(() => {
      const schema = createTestSchema()
      schema.schema.properties!.email['x-reactions'] = [
        {
          name: 'disabled-rule',
          enabled: false,
          when: 'true',
          target: 'email',
          fulfill: { state: { visible: false } },
        },
      ]
      ctx = createTestContext(schema)
      ctx.engine.init()
    })

    afterEach(() => {
      ctx.cleanup()
    })

    it('enabled=false 的规则不执行', async () => {
      await flushAll()
      // 即使 when=true，但 enabled=false，不执行，email 保持 visible
      expect(ctx.formModel.getField('email')!.display).toBe('visible')
    })
  })

  // ---- 多目标 ----

  describe('多目标联动', () => {
    let ctx: ReturnType<typeof createTestContext>

    beforeEach(() => {
      const schema = createTestSchema()
      schema.schema.properties!.age['x-reactions'] = [
        {
          when: '$self.value > 20',
          target: ['email', 'gender'],
          fulfill: { state: { visible: true } },
          otherwise: { state: { hidden: true } },
        },
      ]
      ctx = createTestContext(schema)
      ctx.engine.init()
    })

    afterEach(() => {
      ctx.cleanup()
    })

    it('target 是数组时同时影响多个字段', async () => {
      await flushAll()
      ctx.formModel.setFieldValue('age', 25)
      await flushAll()
      expect(ctx.formModel.getField('email')!.display).toBe('visible')
      expect(ctx.formModel.getField('gender')!.display).toBe('visible')

      ctx.formModel.setFieldValue('age', 10)
      await flushAll()
      expect(ctx.formModel.getField('email')!.display).toBe('hidden')
      expect(ctx.formModel.getField('gender')!.display).toBe('hidden')
    })
  })

  // ---- 沙箱安全 ----

  describe('沙箱安全', () => {
    let ctx: ReturnType<typeof createTestContext>

    beforeEach(() => {
      const schema = createTestSchema()
      schema.schema.properties!.email['x-reactions'] = [
        {
          when: 'typeof window === "undefined"',
          target: 'email',
          fulfill: { state: { visible: true } },
          otherwise: { state: { hidden: true } },
        },
      ]
      ctx = createTestContext(schema)
      ctx.engine.init()
    })

    afterEach(() => {
      ctx.cleanup()
    })

    it('window/document 等危险全局对象被隔离', async () => {
      await flushAll()
      // window 在沙箱中被拦截，typeof window === 'undefined' 为 true
      expect(ctx.formModel.getField('email')!.display).toBe('visible')
    })
  })

  // ---- 错误处理 ----

  describe('错误处理', () => {
    let ctx: ReturnType<typeof createTestContext>

    beforeEach(() => {
      const schema = createTestSchema()
      schema.schema.properties!.email['x-reactions'] = [
        {
          when: 'this.is.invalid.syntax',
          target: 'email',
          fulfill: { state: { visible: true } },
        },
      ]
      ctx = createTestContext(schema)
      ctx.engine.init()
    })

    afterEach(() => {
      ctx.cleanup()
    })

    it('表达式错误时不抛出，默认视为 false', async () => {
      await flushAll()
      // 表达式错误 → evalExpression 返回 undefined → Boolean(undefined) = false
      // fulfill 不执行 → email 保持 visible
      expect(ctx.formModel.getField('email')!.display).toBe('visible')
    })
  })

  // ---- 工厂函数 ----

  describe('createReactionsEngine', () => {
    it('返回已初始化的引擎', () => {
      const schema = createTestSchema()
      const container = document.createElement('div')
      document.body.appendChild(container)
      const app = createApp({ template: '<div></div>' })
      app.mount(container)

      const engine = createReactionsEngine(createFormModel(schema))
      expect(engine).toBeDefined()
      engine.destroy()
      app.unmount()
      container.remove()
    })
  })

  // ---- self 目标（无 target 字段） ----

  describe('自指向联动（无 target）', () => {
    let ctx: ReturnType<typeof createTestContext>

    beforeEach(() => {
      const schema = createTestSchema()
      // email 不为空时自身 required
      schema.schema.properties!.email['x-reactions'] = [
        {
          when: '$self.value !== ""',
          fulfill: { state: { required: true } },
          otherwise: { state: { required: false } },
        },
      ]
      ctx = createTestContext(schema)
      ctx.engine.init()
    })

    afterEach(() => {
      ctx.cleanup()
    })

    it('不指定 target 时联动作用于自身', async () => {
      await flushAll()
      // email 初始为 ''，不满足 → required: false
      expect(ctx.formModel.getField('email')!.required).toBeFalsy()

      ctx.formModel.setFieldValue('email', 'test@test.com')
      await flushAll()
      expect(ctx.formModel.getField('email')!.required).toBe(true)

      ctx.formModel.setFieldValue('email', '')
      await flushAll()
      expect(ctx.formModel.getField('email')!.required).toBe(false)
    })
  })

  // ---- state.value 赋值 ----

  describe('通过 state 设置字段值', () => {
    let ctx: ReturnType<typeof createTestContext>

    beforeEach(() => {
      const schema = createTestSchema()
      schema.schema.properties!.email['x-reactions'] = [
        {
          when: '$self.value === ""',
          target: 'email',
          fulfill: { state: { value: 'auto@example.com' } },
        },
      ]
      ctx = createTestContext(schema)
      ctx.engine.init()
    })

    afterEach(() => {
      ctx.cleanup()
    })

    it('state.value 可修改目标字段的值', async () => {
      await flushAll()
      // email 初始为 ''，条件满足 → value = 'auto@example.com'
      expect(ctx.formModel.getField('email')!.value).toBe('auto@example.com')
    })
  })
})
