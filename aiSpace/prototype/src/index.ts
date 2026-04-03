/**
 * @file index.ts
 * @description 低代码原型统一导出入口
 *
 * 导出层级说明：
 *   core/        → Schema 定义、FormModel、ReactionsEngine、ComponentRegistry
 *   renderer/    → Vue 渲染组件
 *   designer/    → 设计器组件 + 引擎
 *   plugin-api   → 插件契约（纯类型，零运行时）
 */

// ── Schema 类型（含新增的 ContainerNode / I18nString / SchemaNode） ──────
export type {
  // 基础类型
  PageSchema,
  FieldSchema,
  ObjectFieldSchema,
  ArrayFieldSchema,
  VoidFieldSchema,
  ScalarFieldSchema,
  BaseFieldSchema,
  // 布局 & 状态
  FieldType,
  DisplayState,
  PatternState,
  FormConfig,
  // 联动
  Reaction,
  ReactionEffect,
  // 校验
  Validator,
  BuiltinValidator,
  RegexValidator,
  CustomValidator,
  AsyncValidator,
  // 关系字段
  RelationConfig,
  RelationType,
  RelationDisplayMode,
  // 国际化 & 生命周期
  I18nConfig,
  LifeCycles,
  // 新增：多语言字符串
  I18nString,
  LocalizedString,
  // 新增：容器节点 & 联合节点类型
  ContainerNode,
  ContainerVariant,
  SchemaNode,
  // 新增：逃生舱 — 数据源配置
  DataSourceConfig,
} from './core/schema'

// Schema 工具函数
export {
  resolveLocalizedString,
  isContainerNode,
} from './core/schema'

// ── 表单模型 ──────────────────────────────────────────────────────────────
export { FormModel, createFormModel } from './core/model'
export type { FieldState } from './core/model'

// ── 联动引擎 ──────────────────────────────────────────────────────────────
export { ReactionsEngine, createReactionsEngine } from './core/reactions'

// ── 组件注册表 ────────────────────────────────────────────────────────────
export {
  ComponentRegistry,
  createDefaultRegistry,
  useComponentRegistry,
  COMPONENT_REGISTRY_KEY,
} from './core/registry'

export type {
  WidgetMeta,
  WidgetRegistration,
  DecoratorRegistration,
  SetterType,
  PropSetter,
  PropSetterGroup,
  // 新增：函数注册表接口（逃生舱占位）
  FunctionRegistry,
} from './core/registry'

// ── 渲染器（Vue 组件） ────────────────────────────────────────────────────
export { default as FormRenderer } from './renderer/FormRenderer.vue'
export { default as FieldRenderer } from './renderer/FieldRenderer.vue'
export { default as VoidContainer } from './renderer/VoidContainer.vue'

// ── 设计器（Vue 组件） ────────────────────────────────────────────────────
export { default as LowcodeDesigner } from './designer/LowcodeDesigner.vue'
export { default as DesignOverlay } from './designer/DesignOverlay.vue'
export { default as FieldProperties } from './designer/FieldProperties.vue'
export { default as PageProperties } from './designer/PageProperties.vue'

// ── 设计器引擎 ────────────────────────────────────────────────────────────
export { useDesignerEngine } from './designer/engine/designerEngine'
export type { DesignerEngine } from './designer/engine/designerEngine'

export { HistoryManager } from './designer/engine/HistoryManager'

// 新增：Schema 纯函数工具集（可独立单元测试）
export {
  findNodeById,
  removeNodeById,
  updateNodeById,
  duplicateNodeById,
  sortNodesInSchema,
  moveNodeById,
} from './designer/engine/schemaUtils'

// 新增：设计器事件总线
export { designerBus } from './designer/engine/designerBus'
export type { DesignerEvents } from './designer/engine/designerBus'
