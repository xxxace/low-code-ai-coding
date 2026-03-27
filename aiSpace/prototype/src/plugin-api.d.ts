/**
 * @file plugin-api.d.ts
 * @description 设计器插件 API 类型契约
 *
 * 本文件是纯类型声明，零运行时代价。
 * 它定义了未来插件系统可以做什么，约束内部设计不能堵死这些扩展点。
 *
 * 当前版本：接口已定义，实现待后续阶段完成。
 * 实现路径依赖：designerBus（事件总线）已就绪，可以开始接入。
 *
 * 使用示例（未来插件开发者视角）：
 * ```ts
 * import type { DesignerPlugin } from '@company/lowcode-designer/plugin-api'
 *
 * const myPlugin: DesignerPlugin = {
 *   name: 'my-plugin',
 *   setup(api) {
 *     api.onFieldSelected(({ fieldId }) => {
 *       console.log('选中字段：', fieldId)
 *     })
 *     api.registerComponent({
 *       name: 'MapPicker',
 *       label: '地图选点',
 *       category: 'advanced',
 *       // ...
 *     })
 *   }
 * }
 * ```
 */

import type { PageSchema, FieldSchema, ContainerNode } from './core/schema'
import type { WidgetMeta } from './core/registry'

// ============================================================
// 插件接口
// ============================================================

/** 设计器插件定义 */
export interface DesignerPlugin {
  /** 插件唯一名称（用于去重和调试） */
  name: string
  /** 插件版本（可选） */
  version?: string
  /** 插件初始化函数，通过 api 注册监听器和扩展 */
  setup(api: PluginAPI): void | Promise<void>
}

// ============================================================
// 插件 API
// ============================================================

/** 插件可以调用的 API（由设计器核心提供） */
export interface PluginAPI {
  // ---- 事件监听 ----

  /** 监听字段被选中 */
  onFieldSelected(cb: (payload: { fieldId: string }) => void): () => void
  /** 监听字段取消选中 */
  onFieldDeselected(cb: () => void): () => void
  /** 监听 Schema 变化 */
  onSchemaChanged(cb: (payload: { schema: PageSchema }) => void): () => void
  /** 监听节点添加 */
  onNodeAdded(cb: (payload: { node: FieldSchema | ContainerNode; parentPath: string }) => void): () => void
  /** 监听节点删除 */
  onNodeRemoved(cb: (payload: { fieldId: string }) => void): () => void

  // ---- 扩展注册 ----

  /**
   * 注册自定义组件（Widget）
   * 注册后自动出现在物料面板对应分类下
   */
  registerComponent(meta: WidgetMeta): void

  // ---- TODO: 以下 API 待后续阶段实现 ----

  /**
   * 注册自定义 Setter 编辑器
   * TODO: 实现后可在属性面板使用自定义控件
   */
  // registerSetter(name: string, component: Component): void

  /**
   * 注册右键菜单命令
   * TODO: 实现后可在节点右键菜单加自定义操作
   */
  // registerCommand(name: string, handler: () => void): void

  /**
   * 在属性面板添加自定义 Tab
   * TODO: 实现后可以在字段属性面板加额外配置区
   */
  // addPropertyPanelTab(config: PanelTabConfig): void
}
