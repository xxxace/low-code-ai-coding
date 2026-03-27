/**
 * @file core/registry/defaultRegistry.ts
 * @description 内置默认组件注册表（包含常用 Element Plus 组件）
 *
 * 包含 20+ 个 Element Plus 组件的注册配置，
 * 以及每个组件的属性设置器（PropSetters）定义。
 *
 * 此文件与 ComponentRegistry 类分离，原因：
 * - 减少核心注册表类的体积，使其可独立测试
 * - 便于应用按需替换或扩展默认注册表
 * - 便于代码分割（core class 可独立加载，默认组件按需加载）
 */

import {
  ElInput,
  ElInputNumber,
  ElSelect,
  ElSwitch,
  ElDatePicker,
  ElTimePicker,
  ElCheckboxGroup,
  ElRadioGroup,
  ElColorPicker,
  ElSlider,
  ElRate,
  ElUpload,
  ElCascader,
  ElTreeSelect,
} from 'element-plus'
import { defineComponent, type Component } from 'vue'
import { ComponentRegistry } from './ComponentRegistry'

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
            { key: 'prefixIcon', label: '前缀图标', setter: 'text', tip: 'Element Plus 图标名，如 Search' },
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
            { key: 'autosize', label: '自适应高度', setter: 'boolean', defaultValue: false, tip: '开启后高度随内容自动增长' },
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
            { key: '__options__', label: '选项列表', setter: 'options', tip: '编辑下拉选项，写入 enum/enumNames' },
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

  // ---- 容器组件 ----
  // 注意：void 容器在 FlowLayout 中被拦截，交给 VoidContainer.vue 渲染，
  // 不会走 registry.getWidget() 路径，因此 component 参数传空占位即可。
  const voidPlaceholder = defineComponent(() => null) as unknown as Component

  registry
    .registerWidget('Card', voidPlaceholder, {
      label: '卡片容器',
      category: 'container',
      icon: 'Postcard',
      isContainer: true,
      defaultSchema: {
        type: 'void',
        'x-component': 'Card',
        'x-component-props': { title: '' },
        properties: {},
      },
      propSetters: [
        {
          title: '卡片设置',
          setters: [
            { key: 'title', label: '标题', setter: 'text', tip: '留空则不显示标题栏' },
            { key: 'shadow', label: '阴影', setter: 'select', defaultValue: '',
              options: [
                { label: '默认', value: '' },
                { label: '始终', value: 'always' },
                { label: '悬停', value: 'hover' },
                { label: '无', value: 'never' },
              ],
            },
          ],
        },
      ],
    })
    .registerWidget('Tabs', voidPlaceholder, {
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
          tabPane2: {
            type: 'void',
            'x-component': 'TabPane',
            'x-component-props': { label: '标签二' },
            properties: {},
          },
        },
      },
      propSetters: [
        {
          title: '标签页设置',
          setters: [
            { key: 'type', label: '样式', setter: 'select', defaultValue: '',
              options: [
                { label: '默认（线型）', value: '' },
                { label: '卡片', value: 'card' },
                { label: '边框卡片', value: 'border-card' },
              ],
            },
            { key: 'stretch', label: '标签撑满', setter: 'boolean', defaultValue: false },
          ],
        },
      ],
    })
    .registerWidget('Collapse', voidPlaceholder, {
      label: '折叠面板',
      category: 'container',
      icon: 'Fold',
      isContainer: true,
      defaultSchema: {
        type: 'void',
        'x-component': 'Collapse',
        properties: {
          collapseItem1: {
            type: 'void',
            'x-component': 'CollapseItem',
            'x-component-props': { label: '面板一' },
            properties: {},
          },
          collapseItem2: {
            type: 'void',
            'x-component': 'CollapseItem',
            'x-component-props': { label: '面板二' },
            properties: {},
          },
        },
      },
      propSetters: [
        {
          title: '折叠面板设置',
          setters: [
            { key: 'accordion', label: '手风琴模式', setter: 'boolean', defaultValue: false, tip: '同时只能展开一个面板' },
          ],
        },
      ],
    })
    .registerWidget('Divider', voidPlaceholder, {
      label: '分割线',
      category: 'container',
      icon: 'Minus',
      isContainer: false,
      defaultSchema: {
        type: 'void',
        'x-component': 'Divider',
        'x-component-props': {},
      },
      propSetters: [
        {
          title: '分割线设置',
          setters: [
            { key: 'title', label: '标题文本', setter: 'text', tip: '留空则为纯分割线' },
            {
              key: 'contentPosition', label: '文本位置', setter: 'select', defaultValue: 'center',
              options: [
                { label: '居中', value: 'center' },
                { label: '左侧', value: 'left' },
                { label: '右侧', value: 'right' },
              ],
            },
            {
              key: 'borderStyle', label: '线型', setter: 'select', defaultValue: 'solid',
              options: [
                { label: '实线', value: 'solid' },
                { label: '虚线', value: 'dashed' },
                { label: '点线', value: 'dotted' },
              ],
            },
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

export function getGlobalRegistry(): ComponentRegistry {
  if (!_globalRegistry) {
    _globalRegistry = createDefaultRegistry()
  }
  return _globalRegistry
}

export function setGlobalRegistry(registry: ComponentRegistry): void {
  _globalRegistry = registry
}
