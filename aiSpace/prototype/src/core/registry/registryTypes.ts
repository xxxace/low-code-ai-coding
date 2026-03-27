/**
 * @file core/registry/registryTypes.ts
 * @description 组件注册表相关纯类型定义
 *
 * 包含：SetterType / PropSetter / PropSetterGroup / WidgetMeta 等
 * 这些是纯类型，无运行时依赖，可安全 tree-shaking。
 */

import type { Component } from 'vue'
import type { FieldSchema } from '../schema'

// ============================================================
// Property Setter 类型系统
// ============================================================

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
  /** setter='select' 时的选项列表 */
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
  component: Component
  meta: WidgetMeta
}

/** Decorator 注册项 */
export interface DecoratorRegistration {
  name: string
  component: Component
}

// ============================================================
// 函数注册表接口（预留：用于联动沙箱的自定义函数）
// ============================================================

/**
 * 用户自定义函数注册表（逃生舱：运行用户自己写的函数）
 * 与 ComponentRegistry 设计对称，均使用注册表模式
 * TODO: 实现类在后续阶段加，当前只定义接口契约
 */
export interface FunctionRegistry {
  register(name: string, fn: (...args: unknown[]) => unknown): void
  get(name: string): ((...args: unknown[]) => unknown) | undefined
  has(name: string): boolean
  list(): string[]
}
