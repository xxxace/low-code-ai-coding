/**
 * useDragInteraction.ts
 * CanvasOverlay 组件的 Drag Interaction 逻辑 —— 负责 drag/resize/sort/DnD + 选中逻辑
 *
 * 职责：
 * - dragState 状态管理（isDragging, hasMoved, dragType, ...）
 * - calcDropTarget 计算（三种 drop 场景：relative 排序、absolute 移动、流式节点入容器）
 * - 8 方向缩放手柄渲染
 * - handleMouseDown / handleMouseMove / handleMouseUp（鼠标拖拽入口）
 * - handleResizeStart（缩放入口）
 * - handleDragEnter / handleDragOver / handleDragLeave / handleDrop（HTML5 DnD 入口）
 *
 * 状态管理：
 * - interactionMode 由 LowcodeDesigner 管理，CanvasOverlay 只读 props
 * - emit('drag-start', 'mouse-drag') 通知父组件进入 mouse-drag 模式
 * - emit('drag-end') 通知父组件退出拖拽模式
 */

import { ref, reactive, type Ref, type CSSProperties } from 'vue'
import type { PageSchema, SchemaNode } from '../../core/schema'
import { findNodeById } from '../engine/schemaUtils'

// ============================================================
// 类型定义
// ============================================================

interface Props {
  schema: PageSchema
  interactionMode: 'idle' | 'mouse-drag' | 'html5-dnd'
}

interface DropTarget {
  action: 'sort-relative' | 'move-absolute' | 'move-into-container' | 'show-container-dropzone'
  targetContainerId: string | null
  beforeNodeId: string | null
  position: 'before' | 'after' | null
}

interface Emits {
  'select-node': [nodeId: string | null]
  'remove-node': [nodeId: string]
  'duplicate-node': [nodeId: string]
  'update-node-position': [nodeId: string, position: Position]
  'update-node-size': [nodeId: string, size: Size]
  'sort-nodes': [params: SortParams]
  'move-node-to-container': [nodeId: string, containerId: string]
  'drag-start': [mode: 'mouse-drag' | 'html5-dnd']
  'drag-end': []
  'drop-complete': [target: DropTarget]
}

interface Position {
  x: number
  y: number
}

interface Size {
  width: number
  height: number
}

interface SortParams {
  fromId: string
  toId: string
  position: 'before' | 'after'
}

const CLICK_THRESHOLD = 5 // px

export function useDragInteraction(
  props: Readonly<Props>,
  emit: (event: any, ...args: any[]) => void,
  canvasEl: Ref<HTMLElement | null>
) {
  // ============================================================
  // 状态
  // ============================================================

  const dragState = reactive({
    isDragging: false,
    hasMoved: false,
    dragType: null as 'move' | 'resize' | 'sort' | null,
    startX: 0,
    startY: 0,
    startNodeX: null as number | null,
    startNodeY: null as number | null,
    startWidth: 0,
    startHeight: 0,
    targetNodeId: null as string | null,
    resizeDir: null as string | null,
  })

  const dropTarget = ref<DropTarget | null>(null)
  let rafId: number | null = null
  let lastMouseX = 0
  let lastMouseY = 0

  // ============================================================
  // 辅助函数
  // ============================================================

  function getNodeSchema(nodeId: string): SchemaNode | null {
    return findNodeById(props.schema.schema, nodeId)
  }

  function getNodeElById(nodeId: string): HTMLElement | null {
    return canvasEl.value?.querySelector<HTMLElement>(`[data-field-id="${nodeId}"]`) ?? null
  }

  function updateNodePosition(clientX: number, clientY: number) {
    if (!dragState.targetNodeId) return
    const nodeEl = getNodeElById(dragState.targetNodeId)
    if (!nodeEl) return

    if (dragState.startNodeX === null || dragState.startNodeY === null) {
      const rect = nodeEl.getBoundingClientRect()
      const canvasRect = canvasEl.value!.getBoundingClientRect()
      dragState.startNodeX = rect.left - canvasRect.left
      dragState.startNodeY = rect.top - canvasRect.top
    }

    const dx = clientX - dragState.startX
    const dy = clientY - dragState.startY

    nodeEl.style.left = `${dragState.startNodeX + dx}px`
    nodeEl.style.top = `${dragState.startNodeY + dy}px`
  }

  function applyResizePreview(dx: number, dy: number) {
    if (!dragState.targetNodeId || !dragState.resizeDir) return
    const nodeEl = getNodeElById(dragState.targetNodeId)
    if (!nodeEl) return

    let w = dragState.startWidth
    let h = dragState.startHeight

    if (dragState.resizeDir.includes('e')) w = dragState.startWidth + dx
    if (dragState.resizeDir.includes('w')) w = dragState.startWidth - dx
    if (dragState.resizeDir.includes('s')) h = dragState.startHeight + dy
    if (dragState.resizeDir.includes('n')) h = dragState.startHeight - dy

    nodeEl.style.width = `${Math.max(40, w)}px`
    nodeEl.style.height = `${Math.max(20, h)}px`
  }

  // ============================================================
  // 事件处理：Mouse Drag
  // ============================================================

  function handleMouseDown(e: MouseEvent) {
    if (props.interactionMode === 'html5-dnd') return
    e.preventDefault()
    e.stopPropagation()

    const nodeEl = (e.target as HTMLElement).closest('[data-field-id]') as HTMLElement | null
    if (!nodeEl) return

    const nodeId = nodeEl.getAttribute('data-field-id')!
    dragState.isDragging = true
    dragState.hasMoved = false
    dragState.targetNodeId = nodeId
    dragState.startX = e.clientX
    dragState.startY = e.clientY
    lastMouseX = e.clientX
    lastMouseY = e.clientY

    const schema = getNodeSchema(nodeId)
    dragState.dragType = (schema as any)?.['x-position-type'] === 'absolute' ? 'move' : 'sort'

    emit('drag-start', 'mouse-drag')
  }

  function handleMouseMove(e: MouseEvent) {
    if (!dragState.isDragging) return

    lastMouseX = e.clientX
    lastMouseY = e.clientY
    const dx = e.clientX - dragState.startX
    const dy = e.clientY - dragState.startY

    if (!dragState.hasMoved && (Math.abs(dx) > CLICK_THRESHOLD || Math.abs(dy) > CLICK_THRESHOLD)) {
      dragState.hasMoved = true
    }
    if (!dragState.hasMoved) return

    if (dragState.dragType === 'move') {
      updateNodePosition(e.clientX, e.clientY)
    } else if (dragState.dragType === 'resize') {
      applyResizePreview(dx, dy)
    } else if (dragState.dragType === 'sort') {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        dropTarget.value = calcDropTarget(lastMouseX, lastMouseY)
      })
    }
  }

  function handleMouseUp() {
    if (!dragState.isDragging) return

    if (dragState.hasMoved) {
      if (dragState.dragType === 'sort') {
        const finalTarget = calcDropTarget(lastMouseX, lastMouseY)
        emit('drop-complete', finalTarget)
      } else if (dragState.dragType === 'move') {
        emit('update-node-position', dragState.targetNodeId!, {
          x: dragState.startNodeX ?? 0,
          y: dragState.startNodeY ?? 0,
        })
        // 清除内联 style，让 Vue 响应式接管
        const el = getNodeElById(dragState.targetNodeId!)
        if (el) {
          el.style.left = ''
          el.style.top = ''
          el.classList.remove('is-dragging')
        }
      } else if (dragState.dragType === 'resize') {
        const el = getNodeElById(dragState.targetNodeId!)
        emit('update-node-size', dragState.targetNodeId!, {
          width: parseFloat(el?.style.width ?? String(dragState.startWidth)),
          height: parseFloat(el?.style.height ?? String(dragState.startHeight)),
        })
        if (el) {
          el.style.width = ''
          el.style.height = ''
          el.classList.remove('is-dragging')
        }
      }
    } else {
      // 点击选中
      emit('select-node', dragState.targetNodeId)
    }

    emit('drag-end')
    dragState.isDragging = false
    dragState.hasMoved = false
    dragState.dragType = null
    dragState.targetNodeId = null
    dragState.startNodeX = null
    dragState.startNodeY = null
    dragState.resizeDir = null
    if (rafId !== null) cancelAnimationFrame(rafId)
    rafId = null
  }

  // ============================================================
  // 事件处理：Resize
  // ============================================================

  function handleResizeStart(e: MouseEvent) {
    if (props.interactionMode === 'html5-dnd') return
    e.preventDefault()
    e.stopPropagation()

    const handleEl = (e.target as HTMLElement).closest('[data-resize-dir]') as HTMLElement | null
    const dir = handleEl?.getAttribute('data-resize-dir') ?? ''
    const nodeEl = (e.target as HTMLElement).closest('[data-field-id]') as HTMLElement | null
    if (!nodeEl) return

    const nodeId = nodeEl.getAttribute('data-field-id')!

    dragState.isDragging = true
    dragState.hasMoved = true
    dragState.dragType = 'resize'
    dragState.targetNodeId = nodeId
    dragState.resizeDir = dir
    dragState.startX = e.clientX
    dragState.startY = e.clientY

    const schema = getNodeSchema(nodeId)
    const nodeRect = nodeEl.getBoundingClientRect()
    dragState.startWidth = nodeRect.width
    dragState.startHeight = nodeRect.height

    emit('drag-start', 'mouse-drag')
  }

  // ============================================================
  // 事件处理：HTML5 DnD（物料拖入）
  // ============================================================

  function handleDragEnter(e: DragEvent) {
    if (props.interactionMode === 'mouse-drag') return
    e.preventDefault()
  }

  function handleDragOver(e: DragEvent) {
    if (props.interactionMode === 'mouse-drag') return
    e.preventDefault()
    dropTarget.value = calcDropTarget(e.clientX, e.clientY)
  }

  function handleDragLeave(e: DragEvent) {
    // 仅当真正离开 canvasEl 时才清除 dropTarget
    const related = e.relatedTarget as HTMLElement | null
    if (!canvasEl.value || !canvasEl.value.contains(related)) {
      dropTarget.value = null
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    const data = e.dataTransfer?.getData('text/plain')
    emit('drag-end')
    dropTarget.value = null
  }

  // ============================================================
  // Drop Target 计算（核心逻辑）
  // ============================================================

  function calcDropTarget(clientX: number, clientY: number): DropTarget {
    // 视口边界检查
    if (
      clientX < 0 ||
      clientY < 0 ||
      clientX > window.innerWidth ||
      clientY > window.innerHeight
    ) {
      return (
        dropTarget.value ?? {
          action: 'sort-relative',
          targetContainerId: null,
          beforeNodeId: null,
          position: null,
        }
      )
    }

    const target = document.elementFromPoint(clientX, clientY)
    const targetNodeEl = target?.closest('[data-field-id]') as HTMLElement | null

    if (!targetNodeEl) {
      return {
        action: 'sort-relative',
        targetContainerId: null,
        beforeNodeId: null,
        position: null,
      }
    }

    const nodeId = targetNodeEl.getAttribute('data-field-id')!
    const schema = getNodeSchema(nodeId)

    if (!schema) {
      return {
        action: 'sort-relative',
        targetContainerId: null,
        beforeNodeId: null,
        position: null,
      }
    }

    if ((schema as any)['x-position-type'] === 'absolute') {
      if ((schema as any)['x-container'] !== undefined) {
        return {
          action: 'show-container-dropzone',
          targetContainerId: nodeId,
          beforeNodeId: null,
          position: null,
        }
      } else {
        return {
          action: 'move-absolute',
          targetContainerId: null,
          beforeNodeId: null,
          position: null,
        }
      }
    } else {
      const containerEl = targetNodeEl.closest('[data-container-type="absolute"]') as HTMLElement | null
      const rect = targetNodeEl.getBoundingClientRect()
      return {
        action: 'sort-relative',
        targetContainerId: containerEl?.getAttribute('data-field-id') ?? null,
        beforeNodeId: nodeId,
        position: clientY < rect.top + rect.height / 2 ? 'before' : 'after',
      }
    }
  }

  // ============================================================
  // 事件绑定/清理
  // ============================================================

  function setupDragListeners() {
    canvasEl.value?.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    canvasEl.value?.addEventListener('dragenter', handleDragEnter)
    canvasEl.value?.addEventListener('dragover', handleDragOver)
    canvasEl.value?.addEventListener('dragleave', handleDragLeave)
    canvasEl.value?.addEventListener('drop', handleDrop)
  }

  function cleanup() {
    canvasEl.value?.removeEventListener('mousedown', handleMouseDown)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    canvasEl.value?.removeEventListener('dragenter', handleDragEnter)
    canvasEl.value?.removeEventListener('dragleave', handleDragLeave)
    canvasEl.value?.removeEventListener('drop', handleDrop)
    if (rafId !== null) cancelAnimationFrame(rafId)
  }

  // ============================================================
  // 返回值
  // ============================================================

  return {
    dragState,
    dropTarget,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleResizeStart,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    calcDropTarget,
    setupDragListeners,
    cleanup,
  }
}
