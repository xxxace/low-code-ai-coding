/**
 * @file componentRegistry.ts
 * @description 组件注册表（物料系统核心）
 *
 * 职责：
 * 1. 管理 Widget 组件（渲染用：Input/Select/DatePicker 等）
 * 2. 管理 Decorator 组件（包装用：FormItem/Card/Tabs 等）
 * 3. 管理物料元信息（设计器用：图标/标签/默认 Schema 等）
 * 4. 提供 Vue inject/provide 机制给子组件注入
 *
 * 设计：
 * - 全局单例 + 局部覆盖（通过 provide 传入不同实例实现局部物料集）
 * - 支持懒加载（Widget 可以是 AsyncComponent）
 * - 与 FieldRenderer 解耦：FieldRenderer 通过 inject 获取 Registry
 */

import { inject, provide, type App, type Component, type InjectionKey } from 'vue'
import type { FieldSchema } from './schema'

// ============================================================
// 类型定义
// ============================================================

/** Widget 元信息（设计器用） */
export interface WidgetMeta {
  /** Widget 名称（对应 x-component） */
  name: string
  /** 显示标签 */
  label: string
  /** 物料分类（如 'basic' / 'container' / 'advanced'） */
  category: string
  /** 图标名（element-plus icon 名称） */
  icon?: string
  /** 默认 Schema（拖入画布时使用） */
  defaultSchema: Partial<FieldSchema>
  /** 是否是容器（可放置子节点） */
  isContainer?: boolean
  /** 容器允许的子节点类型（不限则不填） */
  allowedChildTypes?: string[]
}

/** Widget 注册项 */
export interface WidgetRegistration {
  /** Vue 组件 */
  component: Component
  /** 元信息 */
  meta: WidgetMeta
}

/** Decorator 注册项 */
export interface DecoratorRegistration {
  /** Decorator 名称（对应 x-decorator） */
  name: string
  /** Vue 组件 */
  component: Component
}

// ============================================================
// 注入 Key
// ============================================================

export const COMPONENT_REGISTRY_KEY: InjectionKey<ComponentRegistry> =
  Symbol('ComponentRegistry')

// ============================================================
// ComponentRegistry 类
// ============================================================

export class ComponentRegistry {
  private readonly _widgets = new Map<string, WidgetRegistration>()
  private readonly _decorators = new Map<string, DecoratorRegistration>()

  // ============================================================
  // Widget 注册
  // ============================================================

  /**
   * 注册一个 Widget 组件
   */
  registerWidget(
    name: string,
    component: Component,
    meta: Omit<WidgetMeta, 'name'>
  ): this {
    this._widgets.set(name, {
      component,
      meta: { name, ...meta },
    })
    return this
  }

  /**
   * 批量注册 Widget
   */
  registerWidgets(
    widgets: Array<{ name: string; component: Component; meta: Omit<WidgetMeta, 'name'> }>
  ): this {
    for (const w of widgets) {
      this.registerWidget(w.name, w.component, w.meta)
    }
    return this
  }

  /**
   * 获取 Widget 组件（渲染用）
   */
  getWidget(name: string): Component | null {
    return this._widgets.get(name)?.component ?? null
  }

  /**
   * 获取 Widget 元信息（设计器用）
   */
  getWidgetMeta(name: string): WidgetMeta | null {
    return this._widgets.get(name)?.meta ?? null
  }

  /**
   * 获取所有 Widget 元信息（设计器物料面板用）
   */
  getAllWidgetMetas(): WidgetMeta[] {
    return Array.from(this._widgets.values()).map((r) => r.meta)
  }

  /**
   * 按分类获取 Widget 元信息
   */
  getWidgetMetasByCategory(): Record<string, WidgetMeta[]> {
    const result: Record<string, WidgetMeta[]> = {}
    for (const { meta } of this._widgets.values()) {
      if (!result[meta.category]) {
        result[meta.category] = []
      }
      result[meta.category].push(meta)
    }
    return result
  }

  // ============================================================
  // Decorator 注册
  // ============================================================

  registerDecorator(name: string, component: Component): this {
    this._decorators.set(name, { name, component })
    return this
  }

  getDecorator(name: string): Component | null {
    return this._decorators.get(name)?.component ?? null
  }

  // ============================================================
  // Vue provide/inject 集成
  // ============================================================

  /**
   * 在 Vue 组件树中提供此注册表
   */
  install(provide: (key: InjectionKey<ComponentRegistry>, value: ComponentRegistry) => void): void {
    provide(COMPONENT_REGISTRY_KEY, this)
  }

  /**
   * 作为 Vue 插件安装到 app
   */
  asPlugin(): {
    install: (app: App) => void
  } {
    return {
      install: (app: App) => {
        app.provide(COMPONENT_REGISTRY_KEY, this)
      },
    }
  }
}

// ============================================================
// 获取注入的注册表（在组件内使用）
// ============================================================

export function useComponentRegistry(): ComponentRegistry {
  const registry = inject(COMPONENT_REGISTRY_KEY)
  if (!registry) {
    // 降级：返回一个空的注册表（开发环境警告）
    if (import.meta.env?.DEV) {
      console.warn(
        '[ComponentRegistry] 未找到注入的 ComponentRegistry，请确保已在根组件 provide。\n' +
          '使用 createDefaultRegistry() 创建并在 FormRenderer/LowcodeDesigner 的父组件 provide。'
      )
    }
    return new ComponentRegistry()
  }
  return registry
}

// ============================================================
// 默认注册表（内置 Element Plus 组件）
// ============================================================

import {
  ElInput,
  ElInputNumber,
  ElSelect,
  ElOption,
  ElSwitch,
  ElDatePicker,
  ElTimePicker,
  ElCheckboxGroup,
  ElCheckbox,
  ElRadioGroup,
  ElRadio,
  ElColorPicker,
  ElSlider,
  ElRate,
  ElUpload,
  ElCascader,
  ElTreeSelect,
} from 'element-plus'

/**
 * 创建内置默认注册表（包含常用 Element Plus 组件）
 */
export function createDefaultRegistry(): ComponentRegistry {
  const registry = new ComponentRegistry()

  // ---- 基础输入组件 ----
  registry
    .registerWidget('Input', ElInput, {
      label: '输入框',
      category: 'basic',
      icon: 'EditPen',
      defaultSchema: {
        type: 'string',
        'x-component': 'Input',
        'x-component-props': { placeholder: '请输入' },
      },
    })
    .registerWidget('Textarea', ElInput, {
      label: '多行文本',
      category: 'basic',
      icon: 'Document',
      defaultSchema: {
        type: 'string',
        'x-component': 'Textarea',
        'x-component-props': { type: 'textarea', rows: 3, placeholder: '请输入' },
      },
    })
    .registerWidget('InputNumber', ElInputNumber, {
      label: '数字输入',
      category: 'basic',
      icon: 'Sort',
      defaultSchema: {
        type: 'number',
        'x-component': 'InputNumber',
      },
    })
    .registerWidget('Password', ElInput, {
      label: '密码框',
      category: 'basic',
      icon: 'Lock',
      defaultSchema: {
        type: 'string',
        'x-component': 'Password',
        'x-component-props': { showPassword: true, placeholder: '请输入密码' },
      },
    })

  // ---- 选择类组件 ----
  registry
    .registerWidget('Select', ElSelect, {
      label: '下拉选择',
      category: 'select',
      icon: 'ArrowDown',
      defaultSchema: {
        type: 'string',
        'x-component': 'Select',
        enum: [],
        enumNames: [],
      },
    })
    .registerWidget('Cascader', ElCascader, {
      label: '级联选择',
      category: 'select',
      icon: 'Grid',
      defaultSchema: {
        type: 'array',
        'x-component': 'Cascader',
        'x-component-props': { options: [] },
      },
    })
    .registerWidget('TreeSelect', ElTreeSelect, {
      label: '树形选择',
      category: 'select',
      icon: 'Share',
      defaultSchema: {
        type: 'string',
        'x-component': 'TreeSelect',
        'x-component-props': { data: [], showCheckbox: false },
      },
    })
    .registerWidget('CheckboxGroup', ElCheckboxGroup, {
      label: '多选框组',
      category: 'select',
      icon: 'CircleCheck',
      defaultSchema: {
        type: 'array',
        'x-component': 'CheckboxGroup',
        enum: [],
        enumNames: [],
      },
    })
    .registerWidget('RadioGroup', ElRadioGroup, {
      label: '单选框组',
      category: 'select',
      icon: 'Aim',
      defaultSchema: {
        type: 'string',
        'x-component': 'RadioGroup',
        enum: [],
        enumNames: [],
      },
    })

  // ---- 日期时间 ----
  registry
    .registerWidget('DatePicker', ElDatePicker, {
      label: '日期选择',
      category: 'date',
      icon: 'Calendar',
      defaultSchema: {
        type: 'string',
        'x-component': 'DatePicker',
        'x-component-props': { type: 'date', format: 'YYYY-MM-DD', valueFormat: 'YYYY-MM-DD' },
      },
    })
    .registerWidget('DateRangePicker', ElDatePicker, {
      label: '日期范围',
      category: 'date',
      icon: 'CalendarRange',
      defaultSchema: {
        type: 'array',
        'x-component': 'DateRangePicker',
        'x-component-props': { type: 'daterange', format: 'YYYY-MM-DD', valueFormat: 'YYYY-MM-DD' },
      },
    })
    .registerWidget('TimePicker', ElTimePicker, {
      label: '时间选择',
      category: 'date',
      icon: 'Clock',
      defaultSchema: {
        type: 'string',
        'x-component': 'TimePicker',
        'x-component-props': { format: 'HH:mm:ss' },
      },
    })
    .registerWidget('DateTimePicker', ElDatePicker, {
      label: '日期时间',
      category: 'date',
      icon: 'Timer',
      defaultSchema: {
        type: 'string',
        'x-component': 'DateTimePicker',
        'x-component-props': {
          type: 'datetime',
          format: 'YYYY-MM-DD HH:mm:ss',
          valueFormat: 'YYYY-MM-DD HH:mm:ss',
        },
      },
    })

  // ---- 布尔/评分 ----
  registry
    .registerWidget('Switch', ElSwitch, {
      label: '开关',
      category: 'basic',
      icon: 'Switch',
      defaultSchema: { type: 'boolean', 'x-component': 'Switch' },
    })
    .registerWidget('Slider', ElSlider, {
      label: '滑块',
      category: 'advanced',
      icon: 'Expand',
      defaultSchema: { type: 'number', 'x-component': 'Slider', 'x-component-props': { min: 0, max: 100 } },
    })
    .registerWidget('Rate', ElRate, {
      label: '评分',
      category: 'advanced',
      icon: 'StarFilled',
      defaultSchema: { type: 'number', 'x-component': 'Rate' },
    })
    .registerWidget('ColorPicker', ElColorPicker, {
      label: '颜色选择',
      category: 'advanced',
      icon: 'Brush',
      defaultSchema: { type: 'string', 'x-component': 'ColorPicker' },
    })
    .registerWidget('Upload', ElUpload, {
      label: '文件上传',
      category: 'advanced',
      icon: 'UploadFilled',
      defaultSchema: {
        type: 'array',
        'x-component': 'Upload',
        'x-component-props': { action: '', listType: 'text' },
      },
    })

  return registry
}

// ============================================================
// 全局单例（可选，多数场景使用 provide/inject 即可）
// ============================================================

let _globalRegistry: ComponentRegistry | null = null

/**
 * 获取全局单例注册表（在 Vue 应用外使用时）
 */
export function getGlobalRegistry(): ComponentRegistry {
  if (!_globalRegistry) {
    _globalRegistry = createDefaultRegistry()
  }
  return _globalRegistry
}

/**
 * 设置全局单例注册表
 */
export function setGlobalRegistry(registry: ComponentRegistry): void {
  _globalRegistry = registry
}
