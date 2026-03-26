/**
 * @file index.ts
 * @description 低代码原型统一导出入口
 */

// ---- 类型定义 ----
export type {
  PageSchema,
  FieldSchema,
  ObjectFieldSchema,
  ArrayFieldSchema,
  VoidFieldSchema,
  ScalarFieldSchema,
  BaseFieldSchema,
  LayoutMode,
  FieldType,
  DisplayState,
  PatternState,
  FreePosition,
  FormConfig,
  Reaction,
  ReactionEffect,
  Validator,
  BuiltinValidator,
  RegexValidator,
  CustomValidator,
  AsyncValidator,
  RelationConfig,
  RelationType,
  RelationDisplayMode,
  I18nConfig,
  LifeCycles,
} from './types/schema'

// ---- 表单模型 ----
export { FormModel, createFormModel } from './types/model'
export type { FieldState } from './types/model'

// ---- 联动引擎 ----
export { ReactionsEngine, createReactionsEngine } from './types/reactions'

// ---- 组件注册表 ----
export {
  ComponentRegistry,
  createDefaultRegistry,
  getGlobalRegistry,
  setGlobalRegistry,
  useComponentRegistry,
  COMPONENT_REGISTRY_KEY,
} from './types/componentRegistry'
export type {
  WidgetMeta,
  WidgetRegistration,
  DecoratorRegistration,
} from './types/componentRegistry'

// ---- 渲染器（Vue 组件） ----
export { default as FormRenderer } from './renderer/FormRenderer.vue'
export { default as FlowLayout } from './renderer/FlowLayout.vue'
export { default as FreeLayout } from './renderer/FreeLayout.vue'
export { default as FieldRenderer } from './renderer/FieldRenderer.vue'
export { default as VoidContainer } from './renderer/VoidContainer.vue'

// ---- 设计器（Vue 组件） ----
export { default as LowcodeDesigner } from './designer/LowcodeDesigner.vue'
export { default as DesignOverlay } from './designer/DesignOverlay.vue'
export { default as FieldProperties } from './designer/FieldProperties.vue'
export { default as PageProperties } from './designer/PageProperties.vue'

// ---- 设计器引擎 ----
export { useDesignerEngine, HistoryManager } from './designer/designerEngine'
export type { DesignerEngine } from './designer/designerEngine'
