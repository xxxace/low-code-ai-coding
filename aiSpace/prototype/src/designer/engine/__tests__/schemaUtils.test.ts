/**
 * @file designer/engine/__tests__/schemaUtils.test.ts
 * @description schemaUtils 纯函数集合的单元测试
 *
 * 策略：
 * - @vitest-environment node：纯函数不需要 DOM
 * - 每个函数覆盖：正常路径、边界条件、嵌套场景、错误输入
 */

// @vitest-environment node

import { describe, it, expect, beforeEach } from 'vitest'
import {
  findNodeById,
  getPropertiesByPath,
  removeNodeById,
  updateNodeById,
  duplicateNodeById,
  sortNodesInSchema,
  moveNodeById,
  moveNodeToContainer,
  updateNodeFreePositionById,
  updateNodeFreeSizeById,
} from '../schemaUtils'
import type { ObjectFieldSchema, VoidFieldSchema, FieldSchema } from '../../../core/schema'

// ============================================================
// 测试用 Schema 工厂
// ============================================================

function createRootSchema(): ObjectFieldSchema {
  return {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        title: '姓名',
        'x-id': 'node-1',
        'x-order': 10,
      },
      age: {
        type: 'number',
        title: '年龄',
        'x-id': 'node-2',
        'x-order': 20,
      },
      // 嵌套容器
      addressCard: {
        type: 'void',
        'x-component': 'Card',
        'x-id': 'node-3',
        'x-order': 30,
        properties: {
          city: {
            type: 'string',
            title: '城市',
            'x-id': 'node-3-1',
            'x-order': 10,
          },
          street: {
            type: 'string',
            title: '街道',
            'x-id': 'node-3-2',
            'x-order': 20,
          },
        },
      },
    },
  }
}

let root: ObjectFieldSchema

beforeEach(() => {
  root = createRootSchema()
})

// ============================================================
// findNodeById
// ============================================================

describe('findNodeById', () => {
  it('查找根级节点', () => {
    const found = findNodeById(root, 'node-1')
    expect(found).not.toBeNull()
    expect(found!.title).toBe('姓名')
  })

  it('查找嵌套节点', () => {
    const found = findNodeById(root, 'node-3-1')
    expect(found).not.toBeNull()
    expect(found!.title).toBe('城市')
  })

  it('查找不存在的 ID 返回 null', () => {
    expect(findNodeById(root, 'nonexistent')).toBeNull()
  })

  it('查找 void 容器节点', () => {
    const found = findNodeById(root, 'node-3') as VoidFieldSchema
    expect(found).not.toBeNull()
    expect(found!.type).toBe('void')
    expect(found!['x-component']).toBe('Card')
  })

  it('空 properties 不报错', () => {
    const empty = { type: 'object' as const, properties: {} }
    expect(findNodeById(empty, 'anything')).toBeNull()
  })

  it('无 properties 的节点不报错', () => {
    const noProps = { type: 'string' as const, 'x-id': 'alone' } as FieldSchema
    expect(findNodeById(noProps as any, 'alone')).toBeNull()
  })
})

// ============================================================
// getPropertiesByPath
// ============================================================

describe('getPropertiesByPath', () => {
  it('空路径返回根 properties', () => {
    const props = getPropertiesByPath(root, '')
    expect(props).not.toBeNull()
    expect(Object.keys(props!).sort()).toEqual(['addressCard', 'age', 'name'])
  })

  it('单层路径', () => {
    // 注意：addressCard 是 void 字段，有 properties
    const props = getPropertiesByPath(root, 'addressCard')
    expect(props).not.toBeNull()
    expect(Object.keys(props!).sort()).toEqual(['city', 'street'])
  })

  it('无效路径返回 null', () => {
    expect(getPropertiesByPath(root, 'nonexistent')).toBeNull()
    expect(getPropertiesByPath(root, 'name.nonexistent')).toBeNull()
  })

  it('没有 properties 的字段路径返回 null', () => {
    // name 是 string 字段，没有 properties
    const props = getPropertiesByPath(root, 'name')
    expect(props).toBeNull()
  })
})

// ============================================================
// removeNodeById
// ============================================================

describe('removeNodeById', () => {
  it('删除根级节点', () => {
    const result = removeNodeById(root, 'node-1')
    expect(result).toBe(true)
    expect(root.properties!['name']).toBeUndefined()
    expect(root.properties!['age']).toBeDefined()
  })

  it('删除嵌套节点', () => {
    const result = removeNodeById(root, 'node-3-1')
    expect(result).toBe(true)
    const card = root.properties!['addressCard'] as VoidFieldSchema
    expect(card.properties!['city']).toBeUndefined()
    expect(card.properties!['street']).toBeDefined()
  })

  it('删除不存在的 ID 返回 false', () => {
    expect(removeNodeById(root, 'nonexistent')).toBe(false)
  })

  it('删除后其他节点不受影响', () => {
    removeNodeById(root, 'node-2')
    expect(findNodeById(root, 'node-1')).not.toBeNull()
    expect(findNodeById(root, 'node-3')).not.toBeNull()
    expect(findNodeById(root, 'node-3-1')).not.toBeNull()
  })
})

// ============================================================
// updateNodeById
// ============================================================

describe('updateNodeById', () => {
  it('更新根级节点属性', () => {
    const result = updateNodeById(root, 'node-1', { title: '名字', 'x-span': 2 })
    expect(result).toBe(true)
    const node = findNodeById(root, 'node-1')!
    expect(node.title).toBe('名字')
    expect(node['x-span']).toBe(2)
  })

  it('更新嵌套节点', () => {
    const result = updateNodeById(root, 'node-3-1', { title: '所在城市' })
    expect(result).toBe(true)
    expect(findNodeById(root, 'node-3-1')!.title).toBe('所在城市')
  })

  it('浅合并不覆盖未指定的属性', () => {
    updateNodeById(root, 'node-1', { title: '新标题' })
    const node = findNodeById(root, 'node-1')!
    expect(node.type).toBe('string')
    expect(node['x-id']).toBe('node-1')
    expect(node['x-order']).toBe(10)
  })

  it('更新不存在的 ID 返回 false', () => {
    expect(updateNodeById(root, 'nonexistent', { title: 'x' })).toBe(false)
  })
})

// ============================================================
// duplicateNodeById
// ============================================================

describe('duplicateNodeById', () => {
  it('复制根级节点', () => {
    const idCounter = { v: 100 }
    const result = duplicateNodeById(root, 'node-1', () => `gen-${idCounter.v++}`)
    expect(result).toBe(true)

    // 原节点仍存在
    expect(findNodeById(root, 'node-1')).not.toBeNull()

    // 新节点存在且有新 ID
    const allKeys = Object.keys(root.properties!)
    expect(allKeys.some(k => k.includes('_copy_'))).toBe(true)

    // 新节点 x-order 大于原节点
    const newEntry = Object.entries(root.properties!).find(([k]) => k.includes('_copy_'))
    expect(newEntry).toBeDefined()
    expect(newEntry![1]['x-order']).toBeGreaterThan(30) // 大于 addressCard 的 30
  })

  it('复制嵌套节点', () => {
    const result = duplicateNodeById(root, 'node-3-1', () => 'new-id')
    expect(result).toBe(true)

    const card = root.properties!['addressCard'] as VoidFieldSchema
    const allKeys = Object.keys(card.properties!)
    expect(allKeys.some(k => k.includes('_copy_'))).toBe(true)
  })

  it('复制不存在的 ID 返回 false', () => {
    expect(duplicateNodeById(root, 'nonexistent', () => 'x')).toBe(false)
  })

  it('复制 void 容器（含子节点完整克隆）', () => {
    let idCounter = 0
    const result = duplicateNodeById(root, 'node-3', () => `new-id-${++idCounter}`)
    expect(result).toBe(true)

    const newCard = Object.entries(root.properties!)
      .find(([k]) => k.includes('_copy_'))![1] as VoidFieldSchema

    expect(newCard.type).toBe('void')
    expect(newCard['x-component']).toBe('Card')
    expect(newCard['x-id']).toBe('new-id-1')
    expect(Object.keys(newCard.properties!).sort()).toEqual(['city', 'street'])
    // 子节点 ID 应被递归重新生成（与原节点不同）
    expect(newCard.properties!['city']['x-id']).not.toBe('node-3-1')
    expect(newCard.properties!['city']['x-id']).toBeTruthy() // 非空字符串
    // 子节点 ID 之间也应唯一
    expect(newCard.properties!['city']['x-id']).not.toBe(newCard.properties!['street']['x-id'])
  })
})

// ============================================================
// sortNodesInSchema
// ============================================================

describe('sortNodesInSchema', () => {
  it('将节点移动到目标节点之后', () => {
    const result = sortNodesInSchema(root, 'node-1', 'node-2', 'after')
    expect(result).toBe(true)

    const entries = Object.entries(root.properties!)
      .sort(([, a], [, b]) => (a['x-order'] ?? 0) - (b['x-order'] ?? 0))
    const ids = entries.map(([, f]) => f['x-id'])
    expect(ids).toEqual(['node-2', 'node-1', 'node-3'])
  })

  it('将节点移动到目标节点之前', () => {
    const result = sortNodesInSchema(root, 'node-2', 'node-1', 'before')
    expect(result).toBe(true)

    const entries = Object.entries(root.properties!)
      .sort(([, a], [, b]) => (a['x-order'] ?? 0) - (b['x-order'] ?? 0))
    const ids = entries.map(([, f]) => f['x-id'])
    expect(ids).toEqual(['node-2', 'node-1', 'node-3'])
  })

  it('排序后 x-order 重新按 10 递增分配', () => {
    sortNodesInSchema(root, 'node-1', 'node-2', 'after')
    const entries = Object.entries(root.properties!)
      .sort(([, a], [, b]) => (a['x-order'] ?? 0) - (b['x-order'] ?? 0))
    const orders = entries.map(([, f]) => f['x-order'])
    expect(orders).toEqual([10, 20, 30])
  })

  it('同级嵌套排序', () => {
    const result = sortNodesInSchema(root, 'node-3-1', 'node-3-2', 'after')
    expect(result).toBe(true)

    const card = root.properties!['addressCard'] as VoidFieldSchema
    const entries = Object.entries(card.properties!)
      .sort(([, a], [, b]) => (a['x-order'] ?? 0) - (b['x-order'] ?? 0))
    const ids = entries.map(([, f]) => f['x-id'])
    expect(ids).toEqual(['node-3-2', 'node-3-1'])
  })

  it('不存在的节点返回 false', () => {
    expect(sortNodesInSchema(root, 'node-1', 'nonexistent', 'after')).toBe(false)
    expect(sortNodesInSchema(root, 'nonexistent', 'node-1', 'after')).toBe(false)
  })
})

// ============================================================
// moveNodeById
// ============================================================

describe('moveNodeById', () => {
  it('上移节点', () => {
    const result = moveNodeById(root, 'node-2', 'up')
    expect(result).toBe(true)

    // age 的 x-order 应该小于 name 的
    const name = root.properties!['name']
    const age = root.properties!['age']
    expect(age['x-order']!).toBeLessThan(name['x-order']!)
  })

  it('下移节点', () => {
    const result = moveNodeById(root, 'node-1', 'down')
    expect(result).toBe(true)

    const name = root.properties!['name']
    const age = root.properties!['age']
    expect(name['x-order']!).toBeGreaterThan(age['x-order']!)
  })

  it('已经在最前面，上移返回 false', () => {
    expect(moveNodeById(root, 'node-1', 'up')).toBe(false)
  })

  it('已经在最后面，下移返回 false', () => {
    expect(moveNodeById(root, 'node-3', 'down')).toBe(false)
  })

  it('不存在的节点返回 false', () => {
    expect(moveNodeById(root, 'nonexistent', 'up')).toBe(false)
  })

  it('嵌套节点上移', () => {
    const result = moveNodeById(root, 'node-3-2', 'up')
    expect(result).toBe(true)

    const card = root.properties!['addressCard'] as VoidFieldSchema
    const street = card.properties!['street']
    const city = card.properties!['city']
    expect(street['x-order']!).toBeLessThan(city['x-order']!)
  })
})

// ============================================================
// moveNodeToContainer
// ============================================================

describe('moveNodeToContainer', () => {
  it('将节点移入 void 容器', () => {
    const result = moveNodeToContainer(root, 'node-1', 'node-3')
    expect(result).toBe(true)

    // 原位置已移除
    expect(root.properties!['name']).toBeUndefined()
    // 容器内新增
    const card = root.properties!['addressCard'] as VoidFieldSchema
    expect(card.properties!['name']).toBeDefined()
    expect(card.properties!['name']['x-id']).toBe('node-1')
  })

  it('移动到自身返回 false', () => {
    expect(moveNodeToContainer(root, 'node-3', 'node-3')).toBe(false)
  })

  it('移动不存在的节点返回 false', () => {
    expect(moveNodeToContainer(root, 'nonexistent', 'node-3')).toBe(false)
  })

  it('目标容器不存在返回 false', () => {
    expect(moveNodeToContainer(root, 'node-1', 'nonexistent')).toBe(false)
  })

  it('移动后 x-order 大于容器内已有节点', () => {
    moveNodeToContainer(root, 'node-1', 'node-3')
    const card = root.properties!['addressCard'] as VoidFieldSchema
    const nameOrder = card.properties!['name']['x-order']!
    const cityOrder = card.properties!['city']['x-order']!
    const streetOrder = card.properties!['street']['x-order']!
    expect(nameOrder).toBeGreaterThan(Math.max(cityOrder, streetOrder))
  })
})

// ============================================================
// updateNodeFreePositionById
// ============================================================

describe('updateNodeFreePositionById', () => {
  it('更新自由布局位置', () => {
    const schema: ObjectFieldSchema = {
      type: 'object',
      properties: {
        field1: {
          type: 'string',
          'x-id': 'free-1',
          'x-free-position': { x: 10, y: 20, width: 200, height: 40 },
        },
      },
    }

    const result = updateNodeFreePositionById(schema.properties!, 'free-1', { x: 100, y: 200 })
    expect(result).toBe(true)
    expect(schema.properties!['field1']['x-free-position']!.x).toBe(100)
    expect(schema.properties!['field1']['x-free-position']!.y).toBe(200)
    // width/height 不变
    expect(schema.properties!['field1']['x-free-position']!.width).toBe(200)
  })

  it('节点没有 x-free-position 时不报错但位置不更新', () => {
    const schema: ObjectFieldSchema = {
      type: 'object',
      properties: {
        field1: {
          type: 'string',
          'x-id': 'no-pos',
        },
      },
    }

    const result = updateNodeFreePositionById(schema.properties!, 'no-pos', { x: 100, y: 200 })
    expect(result).toBe(true) // 节点找到了，但没有 free-position，不操作
  })

  it('不存在的节点返回 false', () => {
    expect(updateNodeFreePositionById({}, 'nonexistent', { x: 0, y: 0 })).toBe(false)
  })
})

// ============================================================
// updateNodeFreeSizeById
// ============================================================

describe('updateNodeFreeSizeById', () => {
  it('更新自由布局宽高', () => {
    const schema: ObjectFieldSchema = {
      type: 'object',
      properties: {
        field1: {
          type: 'string',
          'x-id': 'free-1',
          'x-free-position': { x: 10, y: 20, width: 200, height: 40 },
        },
      },
    }

    const result = updateNodeFreeSizeById(schema.properties!, 'free-1', { width: 300, height: 60 })
    expect(result).toBe(true)
    expect(schema.properties!['field1']['x-free-position']!.width).toBe(300)
    expect(schema.properties!['field1']['x-free-position']!.height).toBe(60)
    // x/y 不变
    expect(schema.properties!['field1']['x-free-position']!.x).toBe(10)
  })

  it('不存在的节点返回 false', () => {
    expect(updateNodeFreeSizeById({}, 'nonexistent', { width: 0, height: 0 })).toBe(false)
  })
})
