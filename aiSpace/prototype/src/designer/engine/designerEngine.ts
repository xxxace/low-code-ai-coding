/**
 * @file designer/engine/designerEngine.ts
 * @description 设计器引擎（精简版）
 *
 * 职责：
 * 1. 维护设计时的 Schema 状态（ref<PageSchema>）
 * 2. 管理选中节点 / 拖拽状态
 * 3. 提供节点增删改移操作（委托给 schemaUtils）
 * 4. 管理历史记录（委托给 HistoryManager）
 * 5. 操作完成后 emit 设计器事件（designerBus）
 *
 * 依赖：
 * - schemaUtils：Schema 树的纯函数操作
 * - HistoryManager：快照式历史记录
 * - designerBus：事件总线（供插件/扩展监听）
 */

import { ref, computed } from 'vue'
import type { PageSchema, FieldSchema } from '../../core/schema'
import {
  findNodeById,
  getPropertiesByPath,
  removeNodeById,
  updateNodeById,
  duplicateNodeById,
  moveNodeById,
  sortNodesInSchema,
  moveNodeToContainer as moveNodeToContainerUtil,
  updateNodeFreePositionById,
  updateNodeFreeSizeById,
  updateNodePositionById,
  updateNodeSizeById,
  moveNodeAcrossContainers as moveNodeAcrossContainersUtil,
} from './schemaUtils'
import { HistoryManager } from './HistoryManager'
import { designerBus } from './designerBus'

export function useDesignerEngine() {
  const schema = ref<PageSchema | null>(null)
  const selectedNodeId = ref<string | null>(null)
  const isDragging = ref(false)
  const dragNodeId = ref<string | null>(null)
  const history = new HistoryManager()

  // ============================================================
  // 初始化
  // ============================================================

  function loadSchema(newSchema: PageSchema): void {
    schema.value = JSON.parse(JSON.stringify(newSchema))
    history.clear()
    history.push(schema.value!)
    selectedNodeId.value = null
  }

  function createEmptySchema(name = '新表单'): PageSchema {
    return {
      version: '1.0',
      id: `form-${Date.now()}`,
      name,
      layoutMode: 'flow',
      formConfig: {
        labelWidth: 120,
        labelPosition: 'right',
        layoutType: 'PC',
      },
      schema: {
        type: 'object',
        properties: {},
      },
      __meta__: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }
  }

  // ============================================================
  // 历史操作
  // ============================================================

  function saveSnapshot(): void {
    if (schema.value) {
      history.push(JSON.parse(JSON.stringify(schema.value)))
    }
  }

  function undo(): void {
    const prev = history.undo()
    if (prev) {
      schema.value = prev
      designerBus.emit('schema:changed', { schema: prev })
    }
  }

  function redo(): void {
    const next = history.redo()
    if (next) {
      schema.value = next
      designerBus.emit('schema:changed', { schema: next })
    }
  }

  // canUndo/canRedo 依赖响应式 indexRef，确保按钮状态实时更新
  const canUndo = computed(() => {
    void history.indexRef.value
    return history.canUndo
  })
  const canRedo = computed(() => {
    void history.indexRef.value
    return history.canRedo
  })

  // ============================================================
  // 节点操作
  // ============================================================

  function generateNodeId(): string {
    return `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  }

  function addNode(parentPath: string, fieldKey: string, fieldSchema: FieldSchema): void {
    if (!schema.value) return

    const newSchema = JSON.parse(JSON.stringify(schema.value)) as PageSchema
    const parentProperties = getPropertiesByPath(newSchema.schema, parentPath)

    if (!parentProperties) {
      console.error(`[DesignerEngine] 找不到父节点路径: ${parentPath}`)
      return
    }

    fieldSchema['x-id'] = generateNodeId()
    const maxOrder = Math.max(
      0,
      ...Object.values(parentProperties).map((f) => f['x-order'] ?? 0)
    )
    fieldSchema['x-order'] = maxOrder + 10
    parentProperties[fieldKey] = fieldSchema

    if (newSchema.__meta__) {
      newSchema.__meta__.updatedAt = new Date().toISOString()
    }

    schema.value = newSchema
    saveSnapshot()
    selectedNodeId.value = fieldSchema['x-id']!
    designerBus.emit('node:added', { node: fieldSchema, parentPath })
    designerBus.emit('schema:changed', { schema: newSchema })
  }

  function removeNode(nodeId: string): void {
    if (!schema.value) return

    const newSchema = JSON.parse(JSON.stringify(schema.value)) as PageSchema
    const removed = removeNodeById(newSchema.schema, nodeId)

    if (!removed) {
      console.warn(`[DesignerEngine] 找不到节点 ID: ${nodeId}`)
      return
    }

    if (selectedNodeId.value === nodeId) {
      selectedNodeId.value = null
    }

    schema.value = newSchema
    saveSnapshot()
    designerBus.emit('node:removed', { fieldId: nodeId })
    designerBus.emit('schema:changed', { schema: newSchema })
  }

  function updateNodeProps(nodeId: string, updates: Partial<FieldSchema>): void {
    if (!schema.value) return

    const newSchema = JSON.parse(JSON.stringify(schema.value)) as PageSchema
    const updated = updateNodeById(newSchema.schema, nodeId, updates)

    if (!updated) {
      console.warn(`[DesignerEngine] 找不到节点 ID: ${nodeId}`)
      return
    }

    schema.value = newSchema
    saveSnapshot()
    designerBus.emit('node:updated', { fieldId: nodeId })
    designerBus.emit('schema:changed', { schema: newSchema })
  }

  function selectNode(nodeId: string | null): void {
    selectedNodeId.value = nodeId
    if (nodeId) {
      designerBus.emit('field:selected', { fieldId: nodeId })
    } else {
      designerBus.emit('field:deselected', undefined)
    }
  }

  function duplicateNode(nodeId: string): void {
    if (!schema.value) return

    const newSchema = JSON.parse(JSON.stringify(schema.value)) as PageSchema
    const duplicated = duplicateNodeById(newSchema.schema, nodeId, generateNodeId)

    if (!duplicated) {
      console.warn(`[DesignerEngine] 找不到节点 ID: ${nodeId}`)
      return
    }

    schema.value = newSchema
    saveSnapshot()
    designerBus.emit('schema:changed', { schema: newSchema })
  }

  function moveNode(nodeId: string, direction: 'up' | 'down'): void {
    if (!schema.value) return

    const newSchema = JSON.parse(JSON.stringify(schema.value)) as PageSchema
    const moved = moveNodeById(newSchema.schema, nodeId, direction)

    if (!moved) {
      console.warn(`[DesignerEngine] 找不到节点 ID: ${nodeId}`)
      return
    }

    schema.value = newSchema
    saveSnapshot()
    designerBus.emit('schema:changed', { schema: newSchema })
  }

  function sortNodes(
    sourceId: string,
    targetId: string,
    position: 'before' | 'after'
  ): void {
    if (!schema.value || sourceId === targetId) return

    const newSchema = JSON.parse(JSON.stringify(schema.value)) as PageSchema
    const sorted = sortNodesInSchema(newSchema.schema, sourceId, targetId, position)

    if (!sorted) {
      console.warn(`[DesignerEngine] sortNodes: 无法找到节点 ${sourceId} 或 ${targetId}`)
      return
    }

    schema.value = newSchema
    saveSnapshot()
    designerBus.emit('schema:changed', { schema: newSchema })
  }

  function moveNodeToContainer(nodeId: string, containerId: string): void {
    if (!schema.value || nodeId === containerId) return

    const newSchema = JSON.parse(JSON.stringify(schema.value)) as PageSchema
    const moved = moveNodeToContainerUtil(newSchema.schema, nodeId, containerId)

    if (!moved) {
      console.warn(`[DesignerEngine] moveNodeToContainer: 无法将节点 ${nodeId} 移入容器 ${containerId}`)
      return
    }

    schema.value = newSchema
    saveSnapshot()
    designerBus.emit('schema:changed', { schema: newSchema })
  }

  /**
   * 跨容器移动节点并排序（原子操作）
   * 用于拖拽时从容器内拖到容器外（或反向）
   */
  function moveNodeAcrossContainers(
    nodeId: string,
    targetId: string,
    position: 'before' | 'after'
  ): void {
    if (!schema.value || nodeId === targetId) return

    const newSchema = JSON.parse(JSON.stringify(schema.value)) as PageSchema
    const moved = moveNodeAcrossContainersUtil(newSchema.schema, nodeId, targetId, position)

    if (!moved) {
      console.warn(
        `[DesignerEngine] moveNodeAcrossContainers: 无法将节点 ${nodeId} 移动到 ${targetId} ${position}`
      )
      return
    }

    schema.value = newSchema
    saveSnapshot()
    designerBus.emit('schema:changed', { schema: newSchema })
  }

  function updateNodeFreePosition(
    nodeId: string,
    position: { x: number; y: number }
  ): void {
    if (!schema.value) return
    // 直接操作 reactive schema，跳过深拷贝（ResizeObserver 回调用）
    updateNodeFreePositionById(schema.value.schema.properties, nodeId, position)
  }

  function updateNodeFreeSize(
    nodeId: string,
    size: { width: number; height: number }
  ): void {
    if (!schema.value) return
    // 直接操作 reactive schema，跳过深拷贝（ResizeObserver 回调用）
    updateNodeFreeSizeById(schema.value.schema.properties, nodeId, size)
  }

  /**
   * 更新 absolute 定位节点的 x/y 位置（XLayout 架构）
   * 注意：不记录快照，由 AbsoluteNodeOverlay 组件控制何时保存
   * 优化：直接原地修改 schema，跳过深拷贝（拖拽高频调用）
   */
  function updateNodePosition(
    nodeId: string,
    position: { x: number; y: number }
  ): void {
    if (!schema.value) return
    // 直接操作 reactive schema，Vue 深层代理自动追踪变更
    updateNodePositionById(schema.value.schema.properties, nodeId, position)
  }

  /**
   * 更新 absolute 定位节点的宽高（XLayout 架构）
   * 注意：不记录快照，由 AbsoluteNodeOverlay 组件控制何时保存
   * 优化：直接原地修改 schema，跳过深拷贝（拖拽高频调用）
   */
  function updateNodeSize(
    nodeId: string,
    size: { width: number; height: number }
  ): void {
    if (!schema.value) return
    // 直接操作 reactive schema，Vue 深层代理自动追踪变更
    updateNodeSizeById(schema.value.schema.properties, nodeId, size)
  }

  /**
   * 保存 absolute 节点拖拽/缩放的快照（拖拽结束时调用）
   */
  function saveNodePositionSnapshot(): void {
    if (!schema.value) return
    saveSnapshot()
  }

  // ============================================================
  // 当前选中节点的 Schema
  // ============================================================

  const selectedNodeSchema = computed<FieldSchema | null>(() => {
    if (!selectedNodeId.value || !schema.value) return null
    return findNodeById(schema.value.schema, selectedNodeId.value)
  })

  // ============================================================
  // 导出 / 代码生成
  // ============================================================

  function exportSchema(): PageSchema | null {
    return schema.value ? JSON.parse(JSON.stringify(schema.value)) : null
  }

  function generateCode(): string {
    if (!schema.value) return ''

    const schemaJson = JSON.stringify(schema.value, null, 2)

    return `<template>
  <FormRenderer
    :schema="formSchema"
    @submit="handleSubmit"
  />
</template>

<script setup lang="ts">
import { FormRenderer } from '@company/lowcode-renderer'
import type { PageSchema } from '@company/lowcode-core'

const formSchema: PageSchema = ${schemaJson}

const handleSubmit = (values: Record<string, any>) => {
  console.log('提交数据：', values)
}
<\/script>
`
  }

  // ============================================================
  // 返回
  // ============================================================

  return {
    schema,
    selectedNodeId,
    selectedNodeSchema,
    isDragging,
    dragNodeId,
    canUndo,
    canRedo,

    loadSchema,
    createEmptySchema,
    undo,
    redo,
    saveSnapshot,
    addNode,
    removeNode,
    duplicateNode,
    moveNode,
    sortNodes,
    moveNodeToContainer,
    moveNodeAcrossContainers,
    updateNodeProps,
    updateNodeFreePosition,
    updateNodeFreeSize,
    updateNodePosition,
    updateNodeSize,
    saveNodePositionSnapshot,
    selectNode,
    exportSchema,
    generateCode,
    generateNodeId,
  }
}

export type DesignerEngine = ReturnType<typeof useDesignerEngine>

// 重新导出 HistoryManager 供有需要的组件直接使用
export { HistoryManager } from './HistoryManager'
