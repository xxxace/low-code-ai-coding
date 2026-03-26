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

// ---- Property Setter 类型系统 ----

/**
 * Setter 类型枚举
 * 决定属性面板里这个属性用什么编辑控件渲染
 */
export type SetterType =
  | 'text'        // 文本输入（string）
  | 'number'      // 数字输入（number）
  | 'boolean'     // 开关（true/false）
  | 'select'      // 下拉选择（固定枚举）
  | 'options'     // 可编辑的选项列表（label/value 数组，用于 Select/Radio/Checkbox）
  | 'code'        // 代码/表达式输入（单行 textarea）
  | 'json'        // JSON 编辑（多行 textarea）

/** 单个属性的 Setter 描述 */
export interface PropSetter {
  /** 对应写入 x-component-props 里的 key（如 'placeholder'、'rows'、'multiple'） */
  key: string
  /** 属性面板显示的标签 */
  label: string
  /** Setter 类型 */
  setter: SetterType
  /** 默认值（新建字段时使用） */
  defaultValue?: any
  /**
   * setter='select' 时的选项列表
   * setter='boolean' 时可不填
   */
  options?: Array<{ label: string; value: any }>
  /** 提示说明（显示在属性右侧） */
  tip?: string
}

/** 属性分组（对应属性面板里的一个折叠区） */
export interface PropSetterGroup {
  /** 分组标题（如「输入设置」「外观」「高级」） */
  title: string
  /** 该分组下的属性列表 */
  setters: PropSetter[]
}

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
  /**
   * 属性设置器分组（用于属性面板动态渲染）
   * 不填时只显示通用属性
   */
  propSetters?: PropSetterGroup[]
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
      propSetters: [
        {
          title: '输入设置',
          setters: [
            { key: 'placeholder', label: '占位文本', setter: 'text', defaultValue: '请输入' },
            { key: 'maxlength', label: '最大字符数', setter: 'number' },
            { key: 'minlength', label: '最小字符数', setter: 'number' },
            { key: 'clearable', label: '可清空', setter: 'boolean', defaultValue: false },
            { key: 'showWordLimit', label: '字数统计', setter: 'boolean', defaultValue: false },
            {
              key: 'prefixIcon', label: '前缀图标', setter: 'text',
              tip: 'Element Plus 图标名，如 Search',
            },
          ],
        },
      ],
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
      propSetters: [
        {
          title: '输入设置',
          setters: [
            { key: 'placeholder', label: '占位文本', setter: 'text', defaultValue: '请输入' },
            { key: 'rows', label: '行数', setter: 'number', defaultValue: 3 },
            { key: 'maxlength', label: '最大字符数', setter: 'number' },
            { key: 'showWordLimit', label: '字数统计', setter: 'boolean', defaultValue: false },
            {
              key: 'autosize', label: '自适应高度', setter: 'boolean', defaultValue: false,
              tip: '开启后高度随内容自动增长',
            },
          ],
        },
      ],
    })
    .registerWidget('InputNumber', ElInputNumber, {
      label: '数字输入',
      category: 'basic',
      icon: 'Sort',
      defaultSchema: {
        type: 'number',
        'x-component': 'InputNumber',
      },
      propSetters: [
        {
          title: '数值设置',
          setters: [
            { key: 'min', label: '最小值', setter: 'number' },
            { key: 'max', label: '最大值', setter: 'number' },
            { key: 'step', label: '步长', setter: 'number', defaultValue: 1 },
            { key: 'precision', label: '精度（小数位）', setter: 'number', defaultValue: 0 },
            {
              key: 'controlsPosition', label: '按钮位置', setter: 'select', defaultValue: '',
              options: [
                { label: '两侧（默认）', value: '' },
                { label: '右侧', value: 'right' },
              ],
            },
            { key: 'placeholder', label: '占位文本', setter: 'text' },
          ],
        },
      ],
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
      propSetters: [
        {
          title: '输入设置',
          setters: [
            { key: 'placeholder', label: '占位文本', setter: 'text', defaultValue: '请输入密码' },
            { key: 'showPassword', label: '显示切换按钮', setter: 'boolean', defaultValue: true },
          ],
        },
      ],
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
      propSetters: [
        {
          title: '选项设置',
          setters: [
            {
              key: '__options__', label: '选项列表', setter: 'options',
              tip: '编辑下拉选项，写入 enum/enumNames',
            },
          ],
        },
        {
          title: '交互设置',
          setters: [
            { key: 'placeholder', label: '占位文本', setter: 'text', defaultValue: '请选择' },
            { key: 'multiple', label: '多选', setter: 'boolean', defaultValue: false },
            { key: 'clearable', label: '可清空', setter: 'boolean', defaultValue: false },
            { key: 'filterable', label: '可搜索', setter: 'boolean', defaultValue: false },
            { key: 'allowCreate', label: '允许创建', setter: 'boolean', defaultValue: false, tip: '需配合 filterable' },
          ],
        },
      ],
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
      propSetters: [
        {
          title: '交互设置',
          setters: [
            { key: 'placeholder', label: '占位文本', setter: 'text', defaultValue: '请选择' },
            { key: 'clearable', label: '可清空', setter: 'boolean', defaultValue: false },
            { key: 'filterable', label: '可搜索', setter: 'boolean', defaultValue: false },
            { key: 'showAllLevels', label: '显示完整路径', setter: 'boolean', defaultValue: true },
            { key: 'options', label: '选项数据（JSON）', setter: 'json', tip: '树形结构，每项需有 label/value/children' },
          ],
        },
      ],
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
      propSetters: [
        {
          title: '交互设置',
          setters: [
            { key: 'placeholder', label: '占位文本', setter: 'text', defaultValue: '请选择' },
            { key: 'multiple', label: '多选', setter: 'boolean', defaultValue: false },
            { key: 'showCheckbox', label: '显示复选框', setter: 'boolean', defaultValue: false },
            { key: 'clearable', label: '可清空', setter: 'boolean', defaultValue: false },
            { key: 'filterable', label: '可搜索', setter: 'boolean', defaultValue: false },
            { key: 'data', label: '树数据（JSON）', setter: 'json', tip: '每项需有 label/value，可嵌套 children' },
          ],
        },
      ],
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
      propSetters: [
        {
          title: '选项设置',
          setters: [
            { key: '__options__', label: '选项列表', setter: 'options' },
          ],
        },
        {
          title: '外观设置',
          setters: [
            {
              key: 'size', label: '尺寸', setter: 'select', defaultValue: 'default',
              options: [
                { label: '大', value: 'large' },
                { label: '默认', value: 'default' },
                { label: '小', value: 'small' },
              ],
            },
          ],
        },
      ],
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
      propSetters: [
        {
          title: '选项设置',
          setters: [
            { key: '__options__', label: '选项列表', setter: 'options' },
          ],
        },
        {
          title: '外观设置',
          setters: [
            {
              key: 'size', label: '尺寸', setter: 'select', defaultValue: 'default',
              options: [
                { label: '大', value: 'large' },
                { label: '默认', value: 'default' },
                { label: '小', value: 'small' },
              ],
            },
          ],
        },
      ],
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
      propSetters: [
        {
          title: '日期设置',
          setters: [
            {
              key: 'type', label: '选择类型', setter: 'select', defaultValue: 'date',
              options: [
                { label: '日期', value: 'date' },
                { label: '周', value: 'week' },
                { label: '月', value: 'month' },
                { label: '年', value: 'year' },
              ],
            },
            { key: 'format', label: '显示格式', setter: 'text', defaultValue: 'YYYY-MM-DD' },
            { key: 'valueFormat', label: '值格式', setter: 'text', defaultValue: 'YYYY-MM-DD' },
            { key: 'placeholder', label: '占位文本', setter: 'text', defaultValue: '请选择日期' },
            { key: 'clearable', label: '可清空', setter: 'boolean', defaultValue: true },
          ],
        },
      ],
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
      propSetters: [
        {
          title: '日期设置',
          setters: [
            { key: 'format', label: '显示格式', setter: 'text', defaultValue: 'YYYY-MM-DD' },
            { key: 'valueFormat', label: '值格式', setter: 'text', defaultValue: 'YYYY-MM-DD' },
            { key: 'startPlaceholder', label: '开始占位', setter: 'text', defaultValue: '开始日期' },
            { key: 'endPlaceholder', label: '结束占位', setter: 'text', defaultValue: '结束日期' },
            { key: 'clearable', label: '可清空', setter: 'boolean', defaultValue: true },
          ],
        },
      ],
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
      propSetters: [
        {
          title: '时间设置',
          setters: [
            { key: 'format', label: '格式', setter: 'text', defaultValue: 'HH:mm:ss' },
            { key: 'placeholder', label: '占位文本', setter: 'text', defaultValue: '请选择时间' },
            { key: 'clearable', label: '可清空', setter: 'boolean', defaultValue: true },
          ],
        },
      ],
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
      propSetters: [
        {
          title: '日期时间设置',
          setters: [
            { key: 'format', label: '显示格式', setter: 'text', defaultValue: 'YYYY-MM-DD HH:mm:ss' },
            { key: 'valueFormat', label: '值格式', setter: 'text', defaultValue: 'YYYY-MM-DD HH:mm:ss' },
            { key: 'placeholder', label: '占位文本', setter: 'text', defaultValue: '请选择日期时间' },
            { key: 'clearable', label: '可清空', setter: 'boolean', defaultValue: true },
          ],
        },
      ],
    })

  // ---- 布尔/评分 ----
  registry
    .registerWidget('Switch', ElSwitch, {
      label: '开关',
      category: 'basic',
      icon: 'Switch',
      defaultSchema: { type: 'boolean', 'x-component': 'Switch' },
      propSetters: [
        {
          title: '开关设置',
          setters: [
            { key: 'activeText', label: '开启文字', setter: 'text' },
            { key: 'inactiveText', label: '关闭文字', setter: 'text' },
            { key: 'activeValue', label: '开启值', setter: 'text', tip: '默认为 true' },
            { key: 'inactiveValue', label: '关闭值', setter: 'text', tip: '默认为 false' },
            {
              key: 'size', label: '尺寸', setter: 'select', defaultValue: 'default',
              options: [
                { label: '大', value: 'large' },
                { label: '默认', value: 'default' },
                { label: '小', value: 'small' },
              ],
            },
          ],
        },
      ],
    })
    .registerWidget('Slider', ElSlider, {
      label: '滑块',
      category: 'advanced',
      icon: 'Expand',
      defaultSchema: { type: 'number', 'x-component': 'Slider', 'x-component-props': { min: 0, max: 100 } },
      propSetters: [
        {
          title: '滑块设置',
          setters: [
            { key: 'min', label: '最小值', setter: 'number', defaultValue: 0 },
            { key: 'max', label: '最大值', setter: 'number', defaultValue: 100 },
            { key: 'step', label: '步长', setter: 'number', defaultValue: 1 },
            { key: 'showInput', label: '显示输入框', setter: 'boolean', defaultValue: false },
            { key: 'showStops', label: '显示断点', setter: 'boolean', defaultValue: false },
            { key: 'range', label: '范围选择', setter: 'boolean', defaultValue: false },
            { key: 'vertical', label: '竖向模式', setter: 'boolean', defaultValue: false },
          ],
        },
      ],
    })
    .registerWidget('Rate', ElRate, {
      label: '评分',
      category: 'advanced',
      icon: 'StarFilled',
      defaultSchema: { type: 'number', 'x-component': 'Rate' },
      propSetters: [
        {
          title: '评分设置',
          setters: [
            { key: 'max', label: '最大分值', setter: 'number', defaultValue: 5 },
            { key: 'allowHalf', label: '允许半星', setter: 'boolean', defaultValue: false },
            { key: 'showText', label: '显示辅助文字', setter: 'boolean', defaultValue: false },
            { key: 'showScore', label: '显示分数', setter: 'boolean', defaultValue: false },
            { key: 'clearable', label: '点击清空', setter: 'boolean', defaultValue: false },
          ],
        },
      ],
    })
    .registerWidget('ColorPicker', ElColorPicker, {
      label: '颜色选择',
      category: 'advanced',
      icon: 'Brush',
      defaultSchema: { type: 'string', 'x-component': 'ColorPicker' },
      propSetters: [
        {
          title: '颜色设置',
          setters: [
            { key: 'showAlpha', label: '显示透明度', setter: 'boolean', defaultValue: false },
            {
              key: 'colorFormat', label: '颜色格式', setter: 'select', defaultValue: 'hex',
              options: [
                { label: 'hex', value: 'hex' },
                { label: 'rgb', value: 'rgb' },
                { label: 'hsl', value: 'hsl' },
                { label: 'hsv', value: 'hsv' },
              ],
            },
          ],
        },
      ],
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
      propSetters: [
        {
          title: '上传设置',
          setters: [
            { key: 'action', label: '上传地址', setter: 'text', tip: 'HTTP POST 地址' },
            {
              key: 'listType', label: '文件列表样式', setter: 'select', defaultValue: 'text',
              options: [
                { label: '文字列表', value: 'text' },
                { label: '图片列表', value: 'picture' },
                { label: '卡片', value: 'picture-card' },
              ],
            },
            { key: 'accept', label: '允许类型', setter: 'text', tip: 'MIME 类型，如 image/*,.pdf' },
            { key: 'multiple', label: '多文件上传', setter: 'boolean', defaultValue: false },
            { key: 'limit', label: '文件数量上限', setter: 'number' },
            { key: 'drag', label: '拖拽上传', setter: 'boolean', defaultValue: false },
          ],
        },
      ],
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
