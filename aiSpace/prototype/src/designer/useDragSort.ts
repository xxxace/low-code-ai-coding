/**
 * @file useDragSort.ts
 * @description 流式布局内的拖拽排序 Composable
 *
 * 设计：
 * - 不依赖任何外部拖拽库（纯 HTML5 Drag and Drop API）
 * - 与 DesignerEngine 解耦：通过回调通知排序结果
 * - 支持跨容器拖拽（从物料面板拖入 + 容器内排序）
 *
 * 实现原理：
 * 1. 每个字段节点的 drag-handle 触发 dragstart，携带 sourceId
 * 2. 目标节点监听 dragover，计算鼠标位置确定是"前插"还是"后插"
 * 3. dragend 时触发 onSort 回调，引擎根据新顺序更新 x-order
 */

import { ref, type Ref } from 'vue'

// ============================================================
// 类型
// ============================================================

export interface DragSortState {
  /** 正在拖拽的源节点 ID */
  sourceId: string | null
  /** 当前鼠标悬停的目标节点 ID */
  targetId: string | null
  /** 插入位置：before = 插到目标前，after = 插到目标后 */
  insertPosition: 'before' | 'after' | null
}

export interface UseDragSortOptions {
  /** 排序完成的回调 */
  onSort: (sourceId: string, targetId: string, position: 'before' | 'after') => void
  /** 从物料面板拖入的回调 */
  onDropMaterial?: (materialName: string, targetId: string | null, position: 'before' | 'after') => void
}

export interface DragSortHandlers {
  /** 绑定到可拖拽的字段根元素 */
  getItemProps: (nodeId: string) => {
    draggable: boolean
    onDragstart: (e: DragEvent) => void
    onDragover: (e: DragEvent) => void
    onDragleave: (e: DragEvent) => void
    onDrop: (e: DragEvent) => void
    onDragend: (e: DragEvent) => void
  }
  /** 当前拖拽状态（用于渲染指示线） */
  dragState: Ref<DragSortState>
}

// ============================================================
// Composable
// ============================================================

export function useDragSort(options: UseDragSortOptions): DragSortHandlers {
  const dragState = ref<DragSortState>({
    sourceId: null,
    targetId: null,
    insertPosition: null,
  })

  function getItemProps(nodeId: string) {
    return {
      draggable: true,

      onDragstart(e: DragEvent): void {
        dragState.value.sourceId = nodeId
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move'
          // 携带内部拖拽标识
          e.dataTransfer.setData('text/lowcode-node-id', nodeId)
        }
        // 稍微延迟设置拖拽样式，避免截图时的闪烁
        setTimeout(() => {
          dragState.value.sourceId = nodeId
        }, 0)
      },

      onDragover(e: DragEvent): void {
        e.preventDefault()
        const el = e.currentTarget as HTMLElement
        const rect = el.getBoundingClientRect()
        const midY = rect.top + rect.height / 2

        dragState.value.targetId = nodeId
        dragState.value.insertPosition = e.clientY < midY ? 'before' : 'after'

        if (e.dataTransfer) {
          e.dataTransfer.dropEffect = 'move'
        }
      },

      onDragleave(_e: DragEvent): void {
        // 只在离开当前节点（而非进入子节点）时清空
        dragState.value.targetId = null
        dragState.value.insertPosition = null
      },

      onDrop(e: DragEvent): void {
        e.preventDefault()
        e.stopPropagation()

        const sourceNodeId = e.dataTransfer?.getData('text/lowcode-node-id')
        const materialName = e.dataTransfer?.getData('text/lowcode-material-name')

        if (sourceNodeId && sourceNodeId !== nodeId) {
          // 内部节点排序
          const position = dragState.value.insertPosition ?? 'after'
          options.onSort(sourceNodeId, nodeId, position)
        } else if (materialName) {
          // 物料面板拖入
          const position = dragState.value.insertPosition ?? 'after'
          options.onDropMaterial?.(materialName, nodeId, position)
        }

        // 清空状态
        dragState.value = { sourceId: null, targetId: null, insertPosition: null }
      },

      onDragend(_e: DragEvent): void {
        dragState.value = { sourceId: null, targetId: null, insertPosition: null }
      },
    }
  }

  return { getItemProps, dragState }
}
