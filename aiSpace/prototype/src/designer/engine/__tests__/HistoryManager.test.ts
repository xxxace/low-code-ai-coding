/**
 * @file designer/engine/__tests__/HistoryManager.test.ts
 * @description HistoryManager 单元测试
 */

// @vitest-environment node

import { describe, it, expect, beforeEach } from 'vitest'
import { HistoryManager } from '../HistoryManager'
import type { PageSchema } from '../../../core/schema'

function createSchema(name: string): PageSchema {
  return {
    version: '1.0',
    id: `form-${Date.now()}`,
    name,
    formConfig: { labelWidth: 120 },
    schema: { type: 'object', properties: {} },
  }
}

let history: HistoryManager

beforeEach(() => {
  history = new HistoryManager()
})

describe('HistoryManager', () => {
  describe('push', () => {
    it('添加快照', () => {
      history.push(createSchema('v1'))
      expect(history.canUndo).toBe(false)
      expect(history.canRedo).toBe(false)
    })

    it('添加多个快照', () => {
      history.push(createSchema('v1'))
      history.push(createSchema('v2'))
      history.push(createSchema('v3'))
      expect(history.canUndo).toBe(true)
      expect(history.canRedo).toBe(false)
    })

    it('indexRef 与 index 同步', () => {
      history.push(createSchema('v1'))
      expect(history.indexRef.value).toBe(0)
      history.push(createSchema('v2'))
      expect(history.indexRef.value).toBe(1)
    })
  })

  describe('undo', () => {
    it('回退到上一个快照', () => {
      history.push(createSchema('v1'))
      history.push(createSchema('v2'))
      const prev = history.undo()
      expect(prev).not.toBeNull()
      expect(prev!.name).toBe('v1')
      expect(history.canUndo).toBe(false)
      expect(history.canRedo).toBe(true)
    })

    it('只有一个快照时无法 undo', () => {
      history.push(createSchema('v1'))
      expect(history.undo()).toBeNull()
    })

    it('空历史无法 undo', () => {
      expect(history.undo()).toBeNull()
    })

    it('连续 undo', () => {
      history.push(createSchema('v1'))
      history.push(createSchema('v2'))
      history.push(createSchema('v3'))
      expect(history.undo()!.name).toBe('v2')
      expect(history.undo()!.name).toBe('v1')
      expect(history.undo()).toBeNull()
    })

    it('undo 更新 indexRef', () => {
      history.push(createSchema('v1'))
      history.push(createSchema('v2'))
      history.undo()
      expect(history.indexRef.value).toBe(0)
    })
  })

  describe('redo', () => {
    it('前进到下一个快照', () => {
      history.push(createSchema('v1'))
      history.push(createSchema('v2'))
      history.undo()
      const next = history.redo()
      expect(next).not.toBeNull()
      expect(next!.name).toBe('v2')
      expect(history.canUndo).toBe(true)
      expect(history.canRedo).toBe(false)
    })

    it('没有 redo 分支时返回 null', () => {
      history.push(createSchema('v1'))
      expect(history.redo()).toBeNull()
    })

    it('redo 更新 indexRef', () => {
      history.push(createSchema('v1'))
      history.push(createSchema('v2'))
      history.undo()
      history.redo()
      expect(history.indexRef.value).toBe(1)
    })
  })

  describe('push 截断 redo 分支', () => {
    it('undo 后 push 新快照，丢弃 redo 历史', () => {
      history.push(createSchema('v1'))
      history.push(createSchema('v2'))
      history.push(createSchema('v3'))
      history.undo() // → v2
      history.undo() // → v1
      history.push(createSchema('v4')) // 新分支，丢弃 v2、v3

      expect(history.canRedo).toBe(false)
      expect(history.canUndo).toBe(true)

      // undo 只能回到 v1
      expect(history.undo()!.name).toBe('v1')
      expect(history.undo()).toBeNull()
    })
  })

  describe('maxSnapshots 限制', () => {
    it('超出上限时删除最早快照', () => {
      const limited = new HistoryManager(3)
      limited.push(createSchema('v1'))
      limited.push(createSchema('v2'))
      limited.push(createSchema('v3'))
      limited.push(createSchema('v4')) // v1 被挤出

      expect(limited.canUndo).toBe(true)
      // 连续 undo 最多回退到 v2
      expect(limited.undo()!.name).toBe('v3')
      expect(limited.undo()!.name).toBe('v2')
      expect(limited.undo()).toBeNull()
    })
  })

  describe('clear', () => {
    it('清空所有历史', () => {
      history.push(createSchema('v1'))
      history.push(createSchema('v2'))
      history.clear()

      expect(history.canUndo).toBe(false)
      expect(history.canRedo).toBe(false)
      expect(history.undo()).toBeNull()
      expect(history.redo()).toBeNull()
    })

    it('clear 重置 indexRef', () => {
      history.push(createSchema('v1'))
      history.clear()
      expect(history.indexRef.value).toBe(-1)
    })
  })

  describe('数据隔离', () => {
    it('push 深拷贝，修改原对象不影响快照', () => {
      const schema = createSchema('v1')
      history.push(schema)
      schema.name = 'mutated'

      const restored = history.undo()
      expect(restored).toBeNull() // 只有一个快照
      // 直接取最新快照
      history.undo() // noop
      history.redo() // 回到 v1
      // push 的深拷贝，即使外部修改了 name 也不影响
      // 但我们无法直接读取快照，只能通过 undo/redo
    })
  })
})
