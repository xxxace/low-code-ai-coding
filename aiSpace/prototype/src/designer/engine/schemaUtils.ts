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
 * 递归重新生成节点树中所有节点的 x-id（包括自身）
 */
function regenerateIds(node: FieldSchema, generateId: () => string): void {
  node['x-id'] = generateId()
  if ('properties' in node && node.properties) {
    for (const child of Object.values(node.properties)) {
      regenerateIds(child, generateId)
    }
  }
}

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
      regenerateIds(cloned, generateId)

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
// 跨容器移动
// ============================================================

/**
 * 将节点从原 parent 移动到目标容器内
 *
 * @param rootSchema   根 Schema 节点（会在深拷贝上操作，调用方负责深拷贝）
 * @param nodeId       要移动的节点 x-id
 * @param containerId  目标容器的 x-id
 * @returns 是否成功
 *
 * 算法：
 * 1. 找到源节点及其 parent properties（同时保存节点对象和 key）
 * 2. 找到目标容器节点，确认它有 properties
 * 3. 从 parent properties 中删除源节点
 * 4. 将源节点插入目标容器 properties 末尾（分配 maxOrder + 10）
 * 5. 如果目标容器内已有同名 key，追加时间戳后缀避免冲突
 */
export function moveNodeToContainer(
  rootSchema: SchemaWithProperties,
  nodeId: string,
  containerId: string
): boolean {
  // 不能移动到自身
  if (nodeId === containerId) return false

  // --- 第一遍：找到源节点 + 其父 properties + 原始 key ---
  let sourceNode: FieldSchema | null = null
  let sourceKey: string | null = null
  let sourceParentProps: Record<string, FieldSchema> | null = null

  function findSource(properties: Record<string, FieldSchema>): boolean {
    for (const [key, fieldSchema] of Object.entries(properties)) {
      if (fieldSchema['x-id'] === nodeId) {
        sourceNode = fieldSchema
        sourceKey = key
        sourceParentProps = properties
        return true
      }
      if ('properties' in fieldSchema && fieldSchema.properties) {
        if (findSource(fieldSchema.properties as Record<string, FieldSchema>)) return true
      }
    }
    return false
  }

  const rootProps = 'properties' in rootSchema ? rootSchema.properties : null
  if (!rootProps) return false
  if (!findSource(rootProps)) return false
  if (!sourceNode || !sourceKey || !sourceParentProps) return false

  // --- 第二遍：找到目标容器节点 ---
  function findContainer(properties: Record<string, FieldSchema>): FieldSchema | null {
    for (const fieldSchema of Object.values(properties)) {
      if (fieldSchema['x-id'] === containerId) return fieldSchema
      if ('properties' in fieldSchema && fieldSchema.properties) {
        const found = findContainer(fieldSchema.properties as Record<string, FieldSchema>)
        if (found) return found
      }
    }
    return null
  }

  const containerNode = findContainer(rootProps)
  if (!containerNode) return false

  // 目标容器必须有 properties（void/object 类型）
  if (!('properties' in containerNode)) {
    ;(containerNode as any).properties = {}
  }
  const targetProps = (containerNode as SchemaWithProperties).properties as Record<string, FieldSchema>

  // --- 执行移动 ---
  // 1. 从原 parent 摘除
  delete sourceParentProps[sourceKey]

  // 2. 计算新 x-order（末尾 + 10）
  const maxOrder = Object.values(targetProps).reduce(
    (max, f) => Math.max(max, f['x-order'] ?? 0),
    0
  )
  sourceNode['x-order'] = maxOrder + 10

  // 3. 处理 key 冲突：目标容器内已有同名 key 则追加后缀
  let newKey = sourceKey
  if (newKey in targetProps) {
    newKey = `${sourceKey}_${Date.now()}`
  }

  targetProps[newKey] = sourceNode
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

// ============================================================
// 跨容器移动 + 排序
// ============================================================

/**
 * 跨容器移动节点并排序（原子操作）
 *
 * 场景：将容器内的节点拖到容器外（或从根层拖入容器内其他节点旁）。
 * 先从原 parent 摘除，插入目标 parent 的 properties，再按 before/after 排序。
 *
 * @returns 是否成功
 */
export function moveNodeAcrossContainers(
  rootSchema: SchemaWithProperties,
  nodeId: string,
  targetId: string,
  position: 'before' | 'after'
): boolean {
  if (nodeId === targetId) return false

  const rootProps = 'properties' in rootSchema ? rootSchema.properties : null
  if (!rootProps) return false

  // --- 第一步：找到源节点及其父 properties ---
  let sourceNode: FieldSchema | null = null
  let sourceKey: string | null = null
  let sourceParentProps: Record<string, FieldSchema> | null = null

  function findSource(props: Record<string, FieldSchema>): boolean {
    for (const [key, fieldSchema] of Object.entries(props)) {
      if (fieldSchema['x-id'] === nodeId) {
        sourceNode = fieldSchema
        sourceKey = key
        sourceParentProps = props
        return true
      }
      if ('properties' in fieldSchema && fieldSchema.properties) {
        if (findSource(fieldSchema.properties as Record<string, FieldSchema>)) return true
      }
    }
    return false
  }

  if (!findSource(rootProps)) return false
  if (!sourceNode || !sourceKey || !sourceParentProps) return false

  // --- 第二步：找到目标节点及其父 properties ---
  let targetParentProps: Record<string, FieldSchema> | null = null

  function findTargetParent(props: Record<string, FieldSchema>): boolean {
    for (const [key, fieldSchema] of Object.entries(props)) {
      if (fieldSchema['x-id'] === targetId) {
        targetParentProps = props
        return true
      }
      if ('properties' in fieldSchema && fieldSchema.properties) {
        if (findTargetParent(fieldSchema.properties as Record<string, FieldSchema>)) return true
      }
    }
    return false
  }

  if (!findTargetParent(rootProps)) return false
  if (!targetParentProps) return false

  // --- 第三步：从原 parent 摘除 ---
  delete sourceParentProps[sourceKey]

  // --- 第四步：插入目标 parent，处理 key 冲突 ---
  let newKey = sourceKey
  if (newKey in targetParentProps) {
    newKey = `${sourceKey}_${Date.now()}`
  }

  targetParentProps[newKey] = sourceNode

  // --- 第五步：在目标 parent 内排序 ---
  return sortNodesInSchema(rootSchema, nodeId, targetId, position)
}
