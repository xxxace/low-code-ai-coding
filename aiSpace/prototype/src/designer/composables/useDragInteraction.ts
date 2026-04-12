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

import { ref, reactive, type Ref, type CSSProperties, nextTick } from 'vue'
import type { PageSchema, SchemaNode } from '../../core/schema'
import { findNodeById } from '../engine/schemaUtils'

// ============================================================
// 类型定义
// ============================================================

interface Props {
  schema: PageSchema
  interactionMode: 'idle' | 'mouse-drag' | 'html5-dnd'
  selectedNodeId: string | null  // 用于 handleResizeStart（新刺 B）
}

interface DropTarget {
  sourceNodeId: string | null  // 新增：拖拽源节点 ID（用于排序）
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
  canvasEl: Ref<HTMLElement | null>,
  selectedNodeId: Ref<string | null>  // 用于 handleResizeStart（新刺 B）
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
    sourceNodeId: null as string | null,  // 新增：拖拽源节点 ID
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

  /**
   * 同步容器的 drag-over 状态到 DOM 属性
   * 让 VoidContainer 能够通过 CSS 属性 [data-drag-over] 显示引导层
   */
  function syncContainerDragOverState(target: DropTarget | null): void {
    if (!canvasEl.value) return

    // 获取所有容器元素
    const containerEls = canvasEl.value.querySelectorAll<HTMLElement>('[data-container-type]')

    for (const el of containerEls) {
      const containerId = el.getAttribute('data-field-id')
      const isActive = containerId && target?.targetContainerId === containerId
      el.setAttribute('data-drag-over', isActive ? 'true' : 'false')
    }
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

    const nodeEl = (e.target as HTMLElement).closest('[data-field-id]') as HTMLElement | null
    if (!nodeEl) return

    const nodeId = nodeEl.getAttribute('data-field-id')!
    const schema = getNodeSchema(nodeId)
    const isAbsolute = (schema as any)?.['x-position-type'] === 'absolute'

    // fix-3: 检查点击目标是否直接是 nodeEl 本身（而非其子元素）
    // 如果 e.target 是 nodeEl 的子元素，说明点击的是容器内部的节点，
    // 应该让事件冒泡到子节点的 click handler
    // fix-4: 对于 absolute 节点，放宽判断条件——只要点击在节点范围内就允许拖拽
    // 因为 absolute 节点的 overlay 和目标节点是同一个 DOM 元素
    const isDirectClick = e.target === nodeEl || 
                          (e.target as HTMLElement).parentElement === nodeEl ||
                          nodeEl.contains(e.target as Node)

    // fix: 如果点击的是流式布局节点（非 absolute），且不是当前选中的节点，
    // 或者点击的是容器内部的子节点（非直接点击容器本身），
    // 则只触发选中，不启动拖拽，让 click 事件正常传递到子组件
    // fix-4: absolute 节点放宽判断，允许点击子元素也启动拖拽
    if (!isAbsolute && nodeId !== selectedNodeId.value && !isDirectClick) {
      // 不阻止事件，让 FieldRenderer/VoidContainer 的 @click 处理选中
      return
    }

    // 对于 absolute 节点直接点击，或已选中的流式节点，启动拖拽模式
    e.preventDefault()
    e.stopPropagation()

    dragState.isDragging = true
    dragState.hasMoved = false
    dragState.targetNodeId = nodeId
    dragState.sourceNodeId = nodeId  // 记录源节点 ID（新刺 3）
    dragState.startX = e.clientX
    dragState.startY = e.clientY
    lastMouseX = e.clientX
    lastMouseY = e.clientY

    dragState.dragType = isAbsolute ? 'move' : 'sort'

    // fix-2: 立即清除 dropTarget，避免上一次拖拽的残留状态导致 drop zone 错误显示
    dropTarget.value = null

    // fix-3: 立即更新 selectedNodeId，让 draggingBox 与被拖拽节点同步
    emit('select-node', nodeId)

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
        // 同步更新容器的 drag-over 状态（通过 DOM 属性，让 VoidContainer 显示引导层）
        syncContainerDragOverState(dropTarget.value)
      })
    }
  }

  async function handleMouseUp() {
    if (!dragState.isDragging) return

    if (dragState.hasMoved) {
      if (dragState.dragType === 'sort') {
        const finalTarget = calcDropTarget(lastMouseX, lastMouseY)
        emit('drop-complete', finalTarget)

        // 同步清空 dropTarget（避免指示器残留，新刺 C 更正）
        dropTarget.value = null
      } else if (dragState.dragType === 'move') {
        // 计算最终坐标：初始位置 + 偏移量（修复 4）
        const dx = lastMouseX - dragState.startX
        const dy = lastMouseY - dragState.startY
        // 先清除内联 style，让 Vue 响应式接管
        const el = getNodeElById(dragState.targetNodeId!)
        if (el) {
          el.style.left = ''
          el.style.top = ''
          el.classList.remove('is-dragging')
        }
        // 再 emit 更新，确保 Vue 能正确计算新位置
        emit('update-node-position', dragState.targetNodeId!, {
          x: Math.round((dragState.startNodeX ?? 0) + dx),
          y: Math.round((dragState.startNodeY ?? 0) + dy),
        })
        // 等待 Vue 完成 DOM 更新
        await nextTick()
      } else if (dragState.dragType === 'resize') {
        const el = getNodeElById(dragState.targetNodeId!)
        // 正确处理空字符串：parseFloat('') 返回 NaN，需兜底
        const rawWidth = el?.style.width ?? ''
        const rawHeight = el?.style.height ?? ''
        const finalWidth = rawWidth ? parseFloat(rawWidth) : dragState.startWidth
        const finalHeight = rawHeight ? parseFloat(rawHeight) : dragState.startHeight
        // 先清空内联样式（与 move 模式一致）
        if (el) {
          el.style.width = ''
          el.style.height = ''
          el.classList.remove('is-dragging')
        }
        // 再 emit，让 Vue 响应式接管
        emit('update-node-size', dragState.targetNodeId!, {
          width: finalWidth,
          height: finalHeight,
        })
      }
    } else {
      // 点击选中
      emit('select-node', dragState.targetNodeId)
    }

    // 清空容器的 drag-over 视觉状态
    syncContainerDragOverState(null)

    emit('drag-end')
    dragState.isDragging = false
    dragState.hasMoved = false
    dragState.dragType = null
    dragState.targetNodeId = null
    dragState.sourceNodeId = null  // 重置 sourceNodeId
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

    // 新增（新刺 B）：直接使用 selectedNodeId，不依赖 closest 查找
    const handleEl = (e.target as HTMLElement).closest('[data-resize-dir]') as HTMLElement | null
    const dir = handleEl?.getAttribute('data-resize-dir') ?? ''
    const nodeId = selectedNodeId.value
    if (!nodeId) return

    const nodeEl = getNodeElById(nodeId)
    if (!nodeEl) return

    dragState.isDragging = true
    dragState.hasMoved = true
    dragState.dragType = 'resize'
    dragState.targetNodeId = nodeId
    dragState.resizeDir = dir
    dragState.startX = e.clientX
    dragState.startY = e.clientY

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
    // html5-dnd 模式：设置 isDragging 以显示 drop zone 指示器
    dragState.isDragging = true
    dragState.dragType = 'sort' // 复用 sort 类型
  }

  function handleDragOver(e: DragEvent) {
    if (props.interactionMode === 'mouse-drag') return
    e.preventDefault()
    dropTarget.value = calcDropTarget(e.clientX, e.clientY)
  }

  function handleDragLeave(e: DragEvent) {
    // 仅当真正离开 canvasEl 时才清除 dropTarget 和 isDragging
    const related = e.relatedTarget as HTMLElement | null
    if (!canvasEl.value || !canvasEl.value.contains(related)) {
      dropTarget.value = null
      // html5-dnd 模式：离开 canvas 时重置拖拽状态
      dragState.isDragging = false
      dragState.dragType = null
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    const data = e.dataTransfer?.getData('text/plain')
    emit('drag-end')
    dropTarget.value = null
    // 重置拖拽状态
    dragState.isDragging = false
    dragState.dragType = null
    dragState.sourceNodeId = null
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
          sourceNodeId: dragState.sourceNodeId,  // 保留现有 sourceNodeId
          action: 'sort-relative',
          targetContainerId: null,
          beforeNodeId: null,
          position: null,
        }
      )
    }

    const target = document.elementFromPoint(clientX, clientY)

    // 新增（新刺 A）：跳过 overlay 自己的元素（避免被按钮/handle遮挡）
    let targetNodeEl: HTMLElement | null = null
    if (target?.closest('.canvas-overlay')) {
      // 向上递归找非 overlay 的祖先
      let parent = target.parentElement
      while (parent) {
        if (!parent.classList.contains('canvas-overlay')) {
          break
        }
        parent = parent.parentElement
      }
      targetNodeEl = parent?.closest('[data-field-id]') as HTMLElement | null
    } else {
      targetNodeEl = target?.closest('[data-field-id]') as HTMLElement | null
    }

    if (!targetNodeEl) {
      return {
        sourceNodeId: dragState.sourceNodeId,
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
        sourceNodeId: dragState.sourceNodeId,
        action: 'sort-relative',
        targetContainerId: null,
        beforeNodeId: null,
        position: null,
      }
    }

    // fix-3：先判断是否是 absolute 容器，再判断是否是可移动的 absolute 节点
    // 容器：type === 'void' && x-position-type === 'absolute'
    // 可移动节点：x-position-type === 'absolute' && 非容器
    if ((schema as any)['x-position-type'] === 'absolute') {
      // absolute 节点可能是容器（type=void）也可能是普通节点
      if (schema.type === 'void') {
        // absolute 容器：检查源节点是否已经在该容器内
        const sourceId = dragState.sourceNodeId
        if (sourceId) {
          const sourceEl = getNodeElById(sourceId)
          const targetContainerEl = getNodeElById(nodeId)
          const isAlreadyInside =
            sourceEl?.closest('[data-container-type="absolute"]') ===
            targetContainerEl

          if (isAlreadyInside) {
            // 源节点已在容器内 → 仅移动位置，不迁移容器
            return {
              sourceNodeId: dragState.sourceNodeId,
              action: 'move-absolute',
              targetContainerId: null,
              beforeNodeId: null,
              position: null,
            }
          }
        }
        // 源节点不在容器内 → 支持拖入容器
        return {
          sourceNodeId: dragState.sourceNodeId,
          action: 'move-into-container',
          targetContainerId: nodeId,
          beforeNodeId: null,
          position: null,
        }
      } else {
        // 普通 absolute 节点：允许移动位置
        return {
          sourceNodeId: dragState.sourceNodeId,
          action: 'move-absolute',
          targetContainerId: null,
          beforeNodeId: null,
          position: null,
        }
      }
    } else {
      const targetSchema = getNodeSchema(nodeId)
      const rect = targetNodeEl.getBoundingClientRect()
      const position = clientY < rect.top + rect.height / 2 ? 'before' : 'after'

      if (targetSchema?.type === 'void') {
        // 目标是 relative 容器节点 → 三区域判断
        // 上边缘 20% → 与容器兄弟排序（before）
        // 下边缘 20% → 与容器兄弟排序（after）
        // 中间 60% → 拖入添加为子节点
        const topThreshold = rect.top + rect.height * 0.2
        const bottomThreshold = rect.top + rect.height * 0.8

        if (clientY < topThreshold) {
          // 上边缘 → 排序 before
          return {
            sourceNodeId: dragState.sourceNodeId,
            action: 'sort-relative',
            targetContainerId: null,
            beforeNodeId: nodeId,
            position: 'before',
          }
        } else if (clientY > bottomThreshold) {
          // 下边缘 → 排序 after
          return {
            sourceNodeId: dragState.sourceNodeId,
            action: 'sort-relative',
            targetContainerId: null,
            beforeNodeId: nodeId,
            position: 'after',
          }
        } else {
          // 中间 → 拖入添加为子节点
          return {
            sourceNodeId: dragState.sourceNodeId,
            action: 'move-into-container',
            targetContainerId: nodeId,
            beforeNodeId: null,
            position: null,
          }
        }
      }

      // 普通节点 → 排序
      return {
        sourceNodeId: dragState.sourceNodeId,
        action: 'sort-relative',
        targetContainerId: null,
        beforeNodeId: nodeId,
        position,
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
