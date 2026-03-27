/**
 * @file designer/engine/designerBus.ts
 * @description 设计器内部事件总线
 *
 * 职责：在设计器各模块之间传递事件，解耦跨层级通信。
 *
 * 设计：
 * - 使用 mitt（200字节，零依赖）实现
 * - DesignerEvents 定义全部事件类型契约（对未来插件 API 的地基）
 * - 设计器操作（selectNode/addNode/removeNode 等）完成后 emit 对应事件
 *   插件体系日后可通过 designerBus.on() 监听这些事件
 *
 * 使用示例：
 * ```ts
 * import { designerBus } from './designerBus'
 * designerBus.on('field:selected', ({ fieldId }) => { ... })
 * designerBus.emit('schema:changed', { schema })
 * ```
 */

import mitt from 'mitt'
import type { PageSchema, FieldSchema, ContainerNode } from '../../core/schema'

// ============================================================
// 事件类型定义
// ============================================================

export type DesignerEvents = {
  /** 字段被选中（单击） */
  'field:selected': { fieldId: string }
  /** 字段取消选中 */
  'field:deselected': undefined
  /** Schema 整体发生变化（任意增删改后触发） */
  'schema:changed': { schema: PageSchema }
  /** 新节点被添加 */
  'node:added': { node: FieldSchema | ContainerNode; parentPath: string }
  /** 节点被删除 */
  'node:removed': { fieldId: string }
  /** 节点属性被更新 */
  'node:updated': { fieldId: string }
}

// ============================================================
// 全局单例事件总线
// ============================================================

export const designerBus = mitt<DesignerEvents>()
