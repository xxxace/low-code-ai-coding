/**
 * @file designer/engine/schemaUtils.ts
 * @description Schema 树操作纯函数集合
 *
 * 职责：对 ObjectFieldSchema / VoidFieldSchema 树进行增删改查排序。
 *
 * 设计原则：
 * - 全部为纯函数（无副作用，无 Vue 响应式依赖）
 * - 操作的是深拷贝后的 Schema，不修改原始对象
 * - 可独立进行单元测试
 */

import type { FieldSchema, ObjectFieldSchema, VoidFieldSchema } from '../../core/schema'

/** 具有 properties 的 Schema 节点 */
type SchemaWithProperties = ObjectFieldSchema | VoidFieldSchema

// ============================================================
// 查找
// ============================================================

/**
 * 按 x-id 查找节点（深度优先）
 * @returns 找到的节点，未找到返回 null
 */
export function findNodeById(
  schema: SchemaWithProperties,
  nodeId: string
): FieldSchema | null {
  const properties = 'properties' in schema ? schema.properties : null
  if (!properties) return null

  for (const fieldSchema of Object.values(properties)) {
    if (fieldSchema['x-id'] === nodeId) return fieldSchema

    if ('properties' in fieldSchema && fieldSchema.properties) {
      const found = findNodeById(fieldSchema as SchemaWithProperties, nodeId)
      if (found) return found
    }
  }

  return null
}

/**
 * 按路径字符串获取 properties 对象
 * @param path 空字符串表示根 properties
 */
export function getPropertiesByPath(
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

// ============================================================
// 删除
// ============================================================

/**
 * 按 x-id 删除节点（深度优先）
 * @returns 是否找到并删除
 */
export function removeNodeById(
  schema: SchemaWithProperties,
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
      if (removeNodeById(fieldSchema as SchemaWithProperties, nodeId)) return true
    }
  }

  return false
}

// ============================================================
// 更新
// ============================================================

/**
 * 按 x-id 更新节点属性（浅合并）
 * @returns 是否找到并更新
 */
export function updateNodeById(
  schema: SchemaWithProperties,
  nodeId: string,
  updates: Partial<FieldSchema>
): boolean {
  const properties = 'properties' in schema ? schema.properties : null
  if (!properties) return false

  for (const fieldSchema of Object.values(properties)) {
    if (fieldSchema['x-id'] === nodeId) {
      Object.assign(fieldSchema, updates)
      return true
    }

    if ('properties' in fieldSchema && fieldSchema.properties) {
      if (updateNodeById(fieldSchema as SchemaWithProperties, nodeId, updates)) return true
    }
  }

  return false
}

// ============================================================
// 复制
// ============================================================

/**
 * 按 x-id 复制节点（克隆后插入同级末尾）
 * @param generateId ID 生成器（由 caller 注入，避免依赖外部状态）
 * @returns 是否找到并复制
 */
export function duplicateNodeById(
  schema: SchemaWithProperties,
  nodeId: string,
  generateId: () => string
): boolean {
  const properties = 'properties' in schema ? schema.properties : null
  if (!properties) return false

  for (const [key, fieldSchema] of Object.entries(properties)) {
    if (fieldSchema['x-id'] === nodeId) {
      const cloned = JSON.parse(JSON.stringify(fieldSchema)) as FieldSchema
      cloned['x-id'] = generateId()

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
      if (duplicateNodeById(fieldSchema as SchemaWithProperties, nodeId, generateId)) return true
    }
  }

  return false
}

// ============================================================
// 排序
// ============================================================

/**
 * 拖拽排序：将 sourceId 节点移动到 targetId 节点的前/后
 * 通过重新分配 x-order 值实现（不改变 key 名）
 * @returns 是否找到并排序
 */
export function sortNodesInSchema(
  schemaNode: SchemaWithProperties,
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

  // 递归查找子节点
  for (const fieldSchema of Object.values(properties)) {
    if ('properties' in fieldSchema && fieldSchema.properties) {
      if (sortNodesInSchema(fieldSchema as SchemaWithProperties, sourceId, targetId, position)) {
        return true
      }
    }
  }

  return false
}

/**
 * 上移/下移节点（通过交换 x-order 实现）
 * @returns 是否找到并移动
 */
export function moveNodeById(
  schema: SchemaWithProperties,
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
    for (const fieldSchema of Object.values(properties)) {
      if ('properties' in fieldSchema && fieldSchema.properties) {
        if (moveNodeById(fieldSchema as SchemaWithProperties, nodeId, direction)) return true
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
// 位置更新（自由布局专用）
// ============================================================

/**
 * 更新自由布局节点的 x/y 位置
 */
export function updateNodeFreePositionById(
  properties: Record<string, FieldSchema>,
  nodeId: string,
  position: { x: number; y: number }
): boolean {
  for (const fieldSchema of Object.values(properties)) {
    if (fieldSchema['x-id'] === nodeId) {
      if (fieldSchema['x-free-position']) {
        fieldSchema['x-free-position'].x = position.x
        fieldSchema['x-free-position'].y = position.y
      }
      return true
    }
    if ('properties' in fieldSchema && fieldSchema.properties) {
      if (updateNodeFreePositionById(fieldSchema.properties, nodeId, position)) return true
    }
  }
  return false
}

/**
 * 更新自由布局节点的宽高
 */
export function updateNodeFreeSizeById(
  properties: Record<string, FieldSchema>,
  nodeId: string,
  size: { width: number; height: number }
): boolean {
  for (const fieldSchema of Object.values(properties)) {
    if (fieldSchema['x-id'] === nodeId) {
      if (fieldSchema['x-free-position']) {
        fieldSchema['x-free-position'].width = size.width
        fieldSchema['x-free-position'].height = size.height
      }
      return true
    }
    if ('properties' in fieldSchema && fieldSchema.properties) {
      if (updateNodeFreeSizeById(fieldSchema.properties, nodeId, size)) return true
    }
  }
  return false
}
