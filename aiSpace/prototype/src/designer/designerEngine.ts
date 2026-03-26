/**
 * @file designerEngine.ts
 * @description 设计器引擎
 *
 * 职责：
 * 1. 维护设计时的 Schema 状态
 * 2. 管理选中节点
 * 3. 提供节点的增删改移操作
 * 4. 管理历史记录（撤销/重做）
 */

import { ref, computed } from 'vue'
import type { PageSchema, FieldSchema, ObjectFieldSchema, VoidFieldSchema } from '../types/schema'

// ============================================================
// 历史记录管理器（快照模式）
// ============================================================

export class HistoryManager {
  private snapshots: string[] = []
  private index = -1
  private readonly maxSnapshots: number

  constructor(maxSnapshots = 50) {
    this.maxSnapshots = maxSnapshots
  }

  push(schema: PageSchema): void {
    this.snapshots = this.snapshots.slice(0, this.index + 1)
    this.snapshots.push(JSON.stringify(schema))
    this.index++

    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift()
      this.index--
    }
  }

  undo(): PageSchema | null {
    if (this.index <= 0) return null
    this.index--
    return JSON.parse(this.snapshots[this.index]) as PageSchema
  }

  redo(): PageSchema | null {
    if (this.index >= this.snapshots.length - 1) return null
    this.index++
    return JSON.parse(this.snapshots[this.index]) as PageSchema
  }

  get canUndo(): boolean {
    return this.index > 0
  }

  get canRedo(): boolean {
    return this.index < this.snapshots.length - 1
  }

  clear(): void {
    this.snapshots = []
    this.index = -1
  }
}

// ============================================================
// 设计器引擎
// ============================================================

export function useDesignerEngine() {
  const schema = ref<PageSchema | null>(null)
  const selectedNodeId = ref<string | null>(null)
  const history = new HistoryManager()
  const isDragging = ref(false)
  const dragNodeId = ref<string | null>(null)

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
    }
  }

  function redo(): void {
    const next = history.redo()
    if (next) {
      schema.value = next
    }
  }

  const canUndo = computed(() => history.canUndo)
  const canRedo = computed(() => history.canRedo)

  // ============================================================
  // 节点操作
  // ============================================================

  function generateNodeId(): string {
    return `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  }

  function addNode(parentPath: string, fieldKey: string, fieldSchema: FieldSchema): void {
    if (!schema.value) return

    const newSchema = JSON.parse(JSON.stringify(schema.value)) as PageSchema
    const parentProperties = _getPropertiesByPath(newSchema.schema, parentPath)

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
  }

  function removeNode(nodeId: string): void {
    if (!schema.value) return

    const newSchema = JSON.parse(JSON.stringify(schema.value)) as PageSchema
    const removed = _removeNodeById(newSchema.schema, nodeId)

    if (!removed) {
      console.warn(`[DesignerEngine] 找不到节点 ID: ${nodeId}`)
      return
    }

    if (selectedNodeId.value === nodeId) {
      selectedNodeId.value = null
    }

    schema.value = newSchema
    saveSnapshot()
  }

  function updateNodeProps(nodeId: string, updates: Partial<FieldSchema>): void {
    if (!schema.value) return

    const newSchema = JSON.parse(JSON.stringify(schema.value)) as PageSchema
    const updated = _updateNodeById(newSchema.schema, nodeId, updates)

    if (!updated) {
      console.warn(`[DesignerEngine] 找不到节点 ID: ${nodeId}`)
      return
    }

    schema.value = newSchema
    saveSnapshot()
  }

  function selectNode(nodeId: string | null): void {
    selectedNodeId.value = nodeId
  }

  /**
   * 复制节点（克隆后插入同级末尾）
   */
  function duplicateNode(nodeId: string): void {
    if (!schema.value) return

    const newSchema = JSON.parse(JSON.stringify(schema.value)) as PageSchema
    const duplicated = _duplicateNodeById(newSchema.schema, nodeId)

    if (!duplicated) {
      console.warn(`[DesignerEngine] 找不到节点 ID: ${nodeId}`)
      return
    }

    schema.value = newSchema
    saveSnapshot()
  }

  /**
   * 移动节点（通过调整 x-order 实现上移/下移）
   */
  function moveNode(nodeId: string, direction: 'up' | 'down'): void {
    if (!schema.value) return

    const newSchema = JSON.parse(JSON.stringify(schema.value)) as PageSchema
    const moved = _moveNodeById(newSchema.schema, nodeId, direction)

    if (!moved) {
      console.warn(`[DesignerEngine] 找不到节点 ID: ${nodeId}`)
      return
    }

    schema.value = newSchema
    saveSnapshot()
  }

  /**
   * 拖拽排序：将 sourceId 移动到 targetId 的前/后
   */
  function sortNodes(
    sourceId: string,
    targetId: string,
    position: 'before' | 'after'
  ): void {
    if (!schema.value || sourceId === targetId) return

    const newSchema = JSON.parse(JSON.stringify(schema.value)) as PageSchema
    const sorted = _sortNodesInSchema(newSchema.schema, sourceId, targetId, position)

    if (!sorted) {
      console.warn(`[DesignerEngine] sortNodes: 无法找到节点 ${sourceId} 或 ${targetId}`)
      return
    }

    schema.value = newSchema
    saveSnapshot()
  }

  // ============================================================
  // 当前选中节点的 Schema
  // ============================================================

  const selectedNodeSchema = computed<FieldSchema | null>(() => {
    if (!selectedNodeId.value || !schema.value) return null
    return _findNodeById(schema.value.schema, selectedNodeId.value)
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
  // 私有工具函数
  // ============================================================

  function _getPropertiesByPath(
    rootSchema: ObjectFieldSchema,
    path: string
  ): Record<string, FieldSchema> | null {
    if (!path) return rootSchema.properties ?? null

    const keys = path.split('.')
    let current: any = rootSchema

    for (const key of keys) {
      if (current?.properties?.[key]) {
        current = current.properties[key]
      } else {
        return null
      }
    }

    return current?.properties ?? null
  }

  function _findNodeById(
    schema: ObjectFieldSchema | VoidFieldSchema,
    nodeId: string
  ): FieldSchema | null {
    const properties = 'properties' in schema ? schema.properties : null
    if (!properties) return null

    for (const [, fieldSchema] of Object.entries(properties)) {
      if (fieldSchema['x-id'] === nodeId) return fieldSchema

      if ('properties' in fieldSchema && fieldSchema.properties) {
        const found = _findNodeById(fieldSchema as any, nodeId)
        if (found) return found
      }
    }

    return null
  }

  function _removeNodeById(
    schema: ObjectFieldSchema | VoidFieldSchema,
    nodeId: string
  ): boolean {
    const properties = 'properties' in schema ? schema.properties : null
    if (!properties) return false

    for (const [key, fieldSchema] of Object.entries(properties)) {
      if (fieldSchema['x-id'] === nodeId) {
        delete properties[key]
        return true
      }

      if ('properties' in fieldSchema && fieldSchema.properties) {
        if (_removeNodeById(fieldSchema as any, nodeId)) return true
      }
    }

    return false
  }

  function _updateNodeById(
    schema: ObjectFieldSchema | VoidFieldSchema,
    nodeId: string,
    updates: Partial<FieldSchema>
  ): boolean {
    const properties = 'properties' in schema ? schema.properties : null
    if (!properties) return false

    for (const [, fieldSchema] of Object.entries(properties)) {
      if (fieldSchema['x-id'] === nodeId) {
        Object.assign(fieldSchema, updates)
        return true
      }

      if ('properties' in fieldSchema && fieldSchema.properties) {
        if (_updateNodeById(fieldSchema as any, nodeId, updates)) return true
      }
    }

    return false
  }

  function _duplicateNodeById(
    schema: ObjectFieldSchema | VoidFieldSchema,
    nodeId: string
  ): boolean {
    const properties = 'properties' in schema ? schema.properties : null
    if (!properties) return false

    for (const [key, fieldSchema] of Object.entries(properties)) {
      if (fieldSchema['x-id'] === nodeId) {
        const cloned = JSON.parse(JSON.stringify(fieldSchema)) as FieldSchema
        cloned['x-id'] = generateNodeId()

        const maxOrder = Math.max(
          0,
          ...Object.values(properties).map((f) => f['x-order'] ?? 0)
        )
        cloned['x-order'] = maxOrder + 10

        const newKey = `${key}_copy_${Date.now()}`
        properties[newKey] = cloned
        return true
      }

      if ('properties' in fieldSchema && fieldSchema.properties) {
        if (_duplicateNodeById(fieldSchema as any, nodeId)) return true
      }
    }

    return false
  }

  function _sortNodesInSchema(
    schemaNode: ObjectFieldSchema | VoidFieldSchema,
    sourceId: string,
    targetId: string,
    position: 'before' | 'after'
  ): boolean {
    const properties = 'properties' in schemaNode ? schemaNode.properties : null
    if (!properties) return false

    const keys = Object.keys(properties)
    const sourceIdx = keys.findIndex((k) => properties[k]['x-id'] === sourceId)
    const targetIdx = keys.findIndex((k) => properties[k]['x-id'] === targetId)

    if (sourceIdx !== -1 && targetIdx !== -1) {
      const entries = Object.entries(properties).sort(
        ([, a], [, b]) => (a['x-order'] ?? 0) - (b['x-order'] ?? 0)
      )

      const sourceEntry = entries.splice(
        entries.findIndex(([, f]) => f['x-id'] === sourceId),
        1
      )[0]

      const newTargetIdx = entries.findIndex(([, f]) => f['x-id'] === targetId)
      const insertIdx = position === 'before' ? newTargetIdx : newTargetIdx + 1

      entries.splice(insertIdx, 0, sourceEntry)

      entries.forEach(([, fieldSchema], idx) => {
        fieldSchema['x-order'] = (idx + 1) * 10
      })

      return true
    }

    for (const [, fieldSchema] of Object.entries(properties)) {
      if ('properties' in fieldSchema && fieldSchema.properties) {
        if (_sortNodesInSchema(fieldSchema as any, sourceId, targetId, position)) {
          return true
        }
      }
    }

    return false
  }

  function _moveNodeById(
    schema: ObjectFieldSchema | VoidFieldSchema,
    nodeId: string,
    direction: 'up' | 'down'
  ): boolean {
    const properties = 'properties' in schema ? schema.properties : null
    if (!properties) return false

    const entries = Object.entries(properties).sort(
      ([, a], [, b]) => (a['x-order'] ?? 0) - (b['x-order'] ?? 0)
    )

    const idx = entries.findIndex(([, f]) => f['x-id'] === nodeId)
    if (idx === -1) {
      for (const [, fieldSchema] of Object.entries(properties)) {
        if ('properties' in fieldSchema && fieldSchema.properties) {
          if (_moveNodeById(fieldSchema as any, nodeId, direction)) return true
        }
      }
      return false
    }

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= entries.length) return false

    const currentOrder = entries[idx][1]['x-order'] ?? idx * 10
    const swapOrder = entries[swapIdx][1]['x-order'] ?? swapIdx * 10

    entries[idx][1]['x-order'] = swapOrder
    entries[swapIdx][1]['x-order'] = currentOrder

    return true
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
    updateNodeProps,
    selectNode,
    exportSchema,
    generateCode,
    generateNodeId,
  }
}

export type DesignerEngine = ReturnType<typeof useDesignerEngine>
