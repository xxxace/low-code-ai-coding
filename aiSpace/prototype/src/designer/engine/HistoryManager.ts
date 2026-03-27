/**
 * @file designer/engine/HistoryManager.ts
 * @description 设计器历史记录管理器（快照模式）
 *
 * 职责：管理 Schema 的 undo/redo 历史记录。
 *
 * 设计：
 * - 使用 JSON 快照序列化存储，简单可靠
 * - indexRef 是 index 的响应式副本，让 Vue computed 能追踪变化
 *   （普通 class getter 不是响应式，computed 追踪不到，按钮永远 disabled）
 */

import { ref, type Ref } from 'vue'
import type { PageSchema } from '../../core/schema'

export class HistoryManager {
  private snapshots: string[] = []
  private index = -1
  private readonly maxSnapshots: number

  /**
   * 响应式 index 副本
   * 解决：class getter 不被 Vue 追踪 → canUndo/canRedo 的 computed 用这个订阅
   */
  readonly indexRef: Ref<number>

  constructor(maxSnapshots = 50) {
    this.maxSnapshots = maxSnapshots
    this.indexRef = ref(-1)
  }

  push(schema: PageSchema): void {
    // 截断 redo 分支
    this.snapshots = this.snapshots.slice(0, this.index + 1)
    this.snapshots.push(JSON.stringify(schema))
    this.index++
    this.indexRef.value = this.index

    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift()
      this.index--
      this.indexRef.value = this.index
    }
  }

  undo(): PageSchema | null {
    if (this.index <= 0) return null
    this.index--
    this.indexRef.value = this.index
    return JSON.parse(this.snapshots[this.index]) as PageSchema
  }

  redo(): PageSchema | null {
    if (this.index >= this.snapshots.length - 1) return null
    this.index++
    this.indexRef.value = this.index
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
    this.indexRef.value = -1
  }
}
