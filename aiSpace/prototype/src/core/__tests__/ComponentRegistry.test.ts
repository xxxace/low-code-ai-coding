// @vitest-environment node
/**
 * ComponentRegistry 单元测试
 *
 * 测试组件注册表的 CRUD、分类、链式调用、Decorator、Vue 集成等。
 * 纯类测试，不依赖 Vue 响应式。
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ComponentRegistry, COMPONENT_REGISTRY_KEY } from '../registry/ComponentRegistry'
import type { WidgetMeta } from '../registry/registryTypes'

// 用 defineComponent 的简化替代——node 环境无 Vue 运行时
// ComponentRegistry 本身不调用 component，只需一个占位对象
const FakeComp = {} as any
const FakeCompB = {} as any
const FakeDec = {} as any

// ============================================================
// Widget 注册与查询
// ============================================================

describe('ComponentRegistry', () => {
  let registry: ComponentRegistry

  beforeEach(() => {
    registry = new ComponentRegistry()
  })

  // ---- registerWidget / getWidget ----

  describe('registerWidget / getWidget', () => {
    it('注册并获取 Widget 组件', () => {
      registry.registerWidget('Input', FakeComp, {
        label: '输入框',
        category: 'basic',
        icon: 'Edit',
        defaultSchema: { type: 'string', 'x-component': 'Input' },
      })

      expect(registry.getWidget('Input')).toBe(FakeComp)
    })

    it('未注册的 Widget 返回 null', () => {
      expect(registry.getWidget('NotExist')).toBeNull()
    })

    it('注册同名 Widget 覆盖旧值', () => {
      registry.registerWidget('Input', FakeComp, {
        label: '输入框',
        category: 'basic',
        defaultSchema: { type: 'string', 'x-component': 'Input' },
      })
      registry.registerWidget('Input', FakeCompB, {
        label: '新输入框',
        category: 'advanced',
        defaultSchema: { type: 'string', 'x-component': 'Input' },
      })

      expect(registry.getWidget('Input')).toBe(FakeCompB)
      expect(registry.getWidgetMeta('Input')?.label).toBe('新输入框')
    })
  })

  // ---- getWidgetMeta ----

  describe('getWidgetMeta', () => {
    it('返回完整的 WidgetMeta 信息', () => {
      const meta = {
        label: '输入框',
        category: 'basic',
        icon: 'Edit',
        defaultSchema: { type: 'string', 'x-component': 'Input' },
      } as const
      registry.registerWidget('Input', FakeComp, meta)

      const result = registry.getWidgetMeta('Input')
      expect(result).not.toBeNull()
      expect(result!.name).toBe('Input') // 自动填充 name
      expect(result!.label).toBe('输入框')
      expect(result!.category).toBe('basic')
      expect(result!.icon).toBe('Edit')
    })

    it('未注册的 Widget meta 返回 null', () => {
      expect(registry.getWidgetMeta('NotExist')).toBeNull()
    })

    it('meta 包含 propSetters', () => {
      registry.registerWidget('Select', FakeComp, {
        label: '下拉选择',
        category: 'basic',
        defaultSchema: { type: 'string', 'x-component': 'Select' },
        propSetters: [
          {
            title: '选项配置',
            setters: [
              { key: 'multiple', label: '多选', setter: 'boolean', defaultValue: false },
            ],
          },
        ],
      })

      const result = registry.getWidgetMeta('Select')
      expect(result!.propSetters).toHaveLength(1)
      expect(result!.propSetters![0].title).toBe('选项配置')
      expect(result!.propSetters![0].setters[0].key).toBe('multiple')
    })
  })

  // ---- getAllWidgetMetas ----

  describe('getAllWidgetMetas', () => {
    it('返回所有已注册 Widget 的 meta 数组', () => {
      registry.registerWidget('Input', FakeComp, {
        label: '输入框', category: 'basic', defaultSchema: { type: 'string' },
      })
      registry.registerWidget('Select', FakeComp, {
        label: '下拉', category: 'basic', defaultSchema: { type: 'string' },
      })
      registry.registerWidget('Card', FakeComp, {
        label: '卡片', category: 'container', defaultSchema: { type: 'void' },
      })

      const all = registry.getAllWidgetMetas()
      expect(all).toHaveLength(3)
      expect(all.map(m => m.name)).toEqual(['Input', 'Select', 'Card'])
    })

    it('空注册表返回空数组', () => {
      expect(registry.getAllWidgetMetas()).toEqual([])
    })
  })

  // ---- getWidgetMetasByCategory ----

  describe('getWidgetMetasByCategory', () => {
    it('按 category 分组返回', () => {
      registry.registerWidget('Input', FakeComp, {
        label: '输入框', category: 'basic', defaultSchema: { type: 'string' },
      })
      registry.registerWidget('Select', FakeComp, {
        label: '下拉', category: 'basic', defaultSchema: { type: 'string' },
      })
      registry.registerWidget('Card', FakeComp, {
        label: '卡片', category: 'container', defaultSchema: { type: 'void' },
      })
      registry.registerWidget('Upload', FakeComp, {
        label: '上传', category: 'advanced', defaultSchema: { type: 'string' },
      })

      const grouped = registry.getWidgetMetasByCategory()
      expect(Object.keys(grouped).sort()).toEqual(['advanced', 'basic', 'container'])
      expect(grouped['basic']).toHaveLength(2)
      expect(grouped['container']).toHaveLength(1)
      expect(grouped['advanced']).toHaveLength(1)
    })

    it('空注册表返回空对象', () => {
      expect(registry.getWidgetMetasByCategory()).toEqual({})
    })
  })

  // ---- registerWidgets 批量注册 ----

  describe('registerWidgets', () => {
    it('批量注册多个 Widget', () => {
      registry.registerWidgets([
        { name: 'Input', component: FakeComp, meta: { label: '输入框', category: 'basic', defaultSchema: { type: 'string' } } },
        { name: 'Select', component: FakeCompB, meta: { label: '下拉', category: 'basic', defaultSchema: { type: 'string' } } },
      ])

      expect(registry.getWidget('Input')).toBe(FakeComp)
      expect(registry.getWidget('Select')).toBe(FakeCompB)
      expect(registry.getAllWidgetMetas()).toHaveLength(2)
    })
  })

  // ---- 链式调用 ----

  describe('链式调用', () => {
    it('registerWidget 返回 this，支持链式调用', () => {
      const result = registry
        .registerWidget('Input', FakeComp, {
          label: '输入框', category: 'basic', defaultSchema: { type: 'string' },
        })
        .registerWidget('Select', FakeComp, {
          label: '下拉', category: 'basic', defaultSchema: { type: 'string' },
        })

      expect(result).toBe(registry)
      expect(registry.getAllWidgetMetas()).toHaveLength(2)
    })

    it('registerWidgets 也支持链式调用', () => {
      const result = registry.registerWidgets([
        { name: 'Input', component: FakeComp, meta: { label: '输入框', category: 'basic', defaultSchema: { type: 'string' } } },
      ])

      expect(result).toBe(registry)
    })
  })

  // ---- isContainer ----

  describe('isContainer 标记', () => {
    it('默认 isContainer 为 undefined（falsy）', () => {
      registry.registerWidget('Input', FakeComp, {
        label: '输入框', category: 'basic', defaultSchema: { type: 'string' },
      })
      expect(registry.getWidgetMeta('Input')!.isContainer).toBeUndefined()
    })

    it('显式设置 isContainer: true', () => {
      registry.registerWidget('Card', FakeComp, {
        label: '卡片', category: 'container', defaultSchema: { type: 'void' },
        isContainer: true,
      })
      expect(registry.getWidgetMeta('Card')!.isContainer).toBe(true)
    })
  })

  // ---- Decorator 注册 ----

  describe('Decorator', () => {
    it('注册并获取 Decorator', () => {
      registry.registerDecorator('FormItem', FakeDec)
      expect(registry.getDecorator('FormItem')).toBe(FakeDec)
    })

    it('未注册的 Decorator 返回 null', () => {
      expect(registry.getDecorator('NotExist')).toBeNull()
    })

    it('Decorator 与 Widget 独立存储', () => {
      registry.registerWidget('FormItem', FakeComp, {
        label: '表单项', category: 'decorator', defaultSchema: { type: 'object' },
      })
      registry.registerDecorator('FormItem', FakeDec)

      // Widget 和 Decorator 同名但各自独立
      expect(registry.getWidget('FormItem')).toBe(FakeComp)
      expect(registry.getDecorator('FormItem')).toBe(FakeDec)
    })
  })

  // ---- Vue 插件 ----

  describe('asPlugin', () => {
    it('返回有 install 方法的插件对象', () => {
      const plugin = registry.asPlugin()
      expect(plugin).toHaveProperty('install')
      expect(typeof plugin.install).toBe('function')
    })
  })

  // ---- 注入 Key ----

  describe('COMPONENT_REGISTRY_KEY', () => {
    it('是 Symbol 类型', () => {
      expect(typeof COMPONENT_REGISTRY_KEY).toBe('symbol')
    })
  })

  // ---- 容器组件（void 类型）注册场景 ----

  describe('容器组件注册场景', () => {
    it('Tabs 预置子结构正确注册', () => {
      registry.registerWidget('Tabs', FakeComp, {
        label: '标签页',
        category: 'container',
        icon: 'Menu',
        isContainer: true,
        defaultSchema: {
          type: 'void',
          'x-component': 'Tabs',
          properties: {
            tabPane1: {
              type: 'void',
              'x-component': 'TabPane',
              'x-component-props': { label: '标签一' },
              properties: {},
            },
          },
        },
      })

      const meta = registry.getWidgetMeta('Tabs')!
      expect(meta.isContainer).toBe(true)
      expect(meta.defaultSchema.type).toBe('void')
      expect((meta.defaultSchema as any).properties).toBeDefined()
      expect(Object.keys((meta.defaultSchema as any).properties!)).toContain('tabPane1')
    })

    it('多个容器组件按 category 分组', () => {
      registry.registerWidget('Card', FakeComp, {
        label: '卡片容器', category: 'container', isContainer: true,
        defaultSchema: { type: 'void', 'x-component': 'Card', properties: {} },
      })
      registry.registerWidget('Tabs', FakeComp, {
        label: '标签页', category: 'container', isContainer: true,
        defaultSchema: { type: 'void', 'x-component': 'Tabs', properties: {} },
      })
      registry.registerWidget('Divider', FakeComp, {
        label: '分割线', category: 'container', isContainer: false,
        defaultSchema: { type: 'void', 'x-component': 'Divider' },
      })

      const grouped = registry.getWidgetMetasByCategory()
      expect(grouped['container']).toHaveLength(3)
      const containers = grouped['container']
      expect(containers.filter(c => c.isContainer).length).toBe(2) // Card + Tabs
      expect(containers.find(c => c.name === 'Divider')!.isContainer).toBeFalsy()
    })
  })

  // ---- 边界条件 ----

  describe('边界条件', () => {
    it('name 为空字符串也能注册', () => {
      registry.registerWidget('', FakeComp, {
        label: '空名', category: 'basic', defaultSchema: { type: 'string' },
      })
      expect(registry.getWidget('')).toBe(FakeComp)
      expect(registry.getWidgetMeta('')!.name).toBe('')
    })

    it('大量注册后查询性能正常', () => {
      // 注册 100 个组件
      for (let i = 0; i < 100; i++) {
        registry.registerWidget(`Widget${i}`, FakeComp, {
          label: `组件${i}`,
          category: i < 50 ? 'basic' : 'advanced',
          defaultSchema: { type: 'string' },
        })
      }
      expect(registry.getAllWidgetMetas()).toHaveLength(100)
      const grouped = registry.getWidgetMetasByCategory()
      expect(grouped['basic']).toHaveLength(50)
      expect(grouped['advanced']).toHaveLength(50)
    })
  })
})
