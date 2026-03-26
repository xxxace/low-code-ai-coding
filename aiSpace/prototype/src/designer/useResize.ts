/**
 * @file useResize.ts
 * @description 8方向缩放手柄 Hook
 *
 * 缩放方向：
 *   nw --- n --- ne
 *   |            |
 *   w     e
 *   |            |
 *   sw --- s --- se
 *
 * 核心功能：
 * 1. 8方向拖拽缩放
 * 2. 保持宽高比（可选）
 * 3. 最小/最大尺寸限制
 */

import { ref, reactive, onUnmounted, computed } from 'vue'
import type { FreePosition } from '../types/schema'

// ============================================================
// 类型定义
// ============================================================

export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se'

export interface ResizeOptions {
  /** 最小宽度 */
  minWidth?: number
  /** 最小高度 */
  minHeight?: number
  /** 最大宽度 */
  maxWidth?: number
  /** 最大高度 */
  maxHeight?: number
  /** 是否保持宽高比 */
  keepRatio?: boolean
  /** 缩放开始回调 */
  onResizeStart?: (id: string, position: FreePosition) => void
  /** 缩放中回调 */
  onResize?: (id: string, position: FreePosition, direction: ResizeDirection) => void
  /** 缩放结束回调 */
  onResizeEnd?: (id: string, position: FreePosition) => void
}

export interface ResizeState {
  isResizing: boolean
  resizeId: string | null
  direction: ResizeDirection | null
  startX: number
  startY: number
  startPosition: FreePosition | null
}

// ============================================================
// 缩放 Hook
// ============================================================

export function useResize(options: ResizeOptions = {}) {
  const {
    minWidth = 20,
    minHeight = 20,
    maxWidth = Infinity,
    maxHeight = Infinity,
    keepRatio = false,
    onResizeStart,
    onResize,
    onResizeEnd,
  } = options

  // 缩放状态
  const state = reactive<ResizeState>({
    isResizing: false,
    resizeId: null,
    direction: null,
    startX: 0,
    startY: 0,
    startPosition: null,
  })

  // 手柄位置（用于渲染 8 个缩放手柄）
  const handlePositions = computed(() => {
    if (!state.startPosition) return null

    const { x, y, width, height } = state.startPosition
    const cx = x + width / 2
    const cy = y + height / 2

    return {
      n: { x: cx, y: y },
      s: { x: cx, y: y + height },
      e: { x: x + width, y: cy },
      w: { x: x, y: cy },
      nw: { x: x, y: y },
      ne: { x: x + width, y: y },
      sw: { x: x, y: y + height },
      se: { x: x + width, y: y + height },
    }
  })

  // ============================================================
  // 缩放事件处理
  // ============================================================

  /**
   * 开始缩放
   */
  const startResize = (
    e: MouseEvent,
    id: string,
    position: FreePosition,
    direction: ResizeDirection
  ) => {
    e.preventDefault()
    e.stopPropagation()

    state.isResizing = true
    state.resizeId = id
    state.direction = direction
    state.startX = e.clientX
    state.startY = e.clientY
    state.startPosition = { ...position }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    onResizeStart?.(id, position)
  }

  /**
   * 鼠标移动
   */
  const handleMouseMove = (e: MouseEvent) => {
    if (!state.isResizing || !state.startPosition || !state.resizeId || !state.direction) return

    const dx = e.clientX - state.startX
    const dy = e.clientY - state.startY

    const newPosition = calculateNewPosition(
      state.startPosition,
      state.direction,
      dx,
      dy,
      keepRatio
    )

    // 应用尺寸限制
    newPosition.width = Math.max(minWidth, Math.min(maxWidth, newPosition.width))
    newPosition.height = Math.max(minHeight, Math.min(maxHeight, newPosition.height))

    onResize?.(state.resizeId, newPosition, state.direction)
  }

  /**
   * 鼠标释放
   */
  const handleMouseUp = () => {
    if (state.resizeId && state.startPosition) {
      onResizeEnd?.(state.resizeId, state.startPosition)
    }

    state.isResizing = false
    state.resizeId = null
    state.direction = null
    state.startPosition = null

    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  // ============================================================
  // 位置计算
  // ============================================================

  const calculateNewPosition = (
    original: FreePosition,
    direction: ResizeDirection,
    dx: number,
    dy: number,
    ratio: boolean
  ): FreePosition => {
    let { x, y, width, height } = original
    const originalRatio = original.width / original.height

    // 根据方向计算新尺寸
    switch (direction) {
      case 'e':
        width = original.width + dx
        break
      case 'w':
        width = original.width - dx
        x = original.x + dx
        break
      case 's':
        height = original.height + dy
        break
      case 'n':
        height = original.height - dy
        y = original.y + dy
        break
      case 'se':
        width = original.width + dx
        height = original.height + dy
        break
      case 'sw':
        width = original.width - dx
        height = original.height + dy
        x = original.x + dx
        break
      case 'ne':
        width = original.width + dx
        height = original.height - dy
        y = original.y + dy
        break
      case 'nw':
        width = original.width - dx
        height = original.height - dy
        x = original.x + dx
        y = original.y + dy
        break
    }

    // 保持宽高比
    if (ratio) {
      const newRatio = width / height
      if (newRatio > originalRatio) {
        // 宽度主导
        height = width / originalRatio
        if (direction.includes('n')) {
          y = original.y + original.height - height
        }
      } else {
        // 高度主导
        width = height * originalRatio
        if (direction.includes('w')) {
          x = original.x + original.width - width
        }
      }
    }

    return {
      ...original,
      x,
      y,
      width,
      height,
    }
  }

  // ============================================================
  // 手柄样式（用于渲染）
  // ============================================================

  const getHandleStyle = (direction: ResizeDirection): Record<string, string> => {
    const cursorMap: Record<ResizeDirection, string> = {
      n: 'ns-resize',
      s: 'ns-resize',
      e: 'ew-resize',
      w: 'ew-resize',
      nw: 'nwse-resize',
      se: 'nwse-resize',
      ne: 'nesw-resize',
      sw: 'nesw-resize',
    }

    return {
      position: 'absolute',
      width: '8px',
      height: '8px',
      backgroundColor: '#fff',
      border: '1px solid #1890ff',
      borderRadius: '2px',
      cursor: cursorMap[direction],
      zIndex: '10',
    }
  }

  // ============================================================
  // 清理
  // ============================================================

  onUnmounted(() => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  })

  // ============================================================
  // 返回
  // ============================================================

  return {
    // 状态
    state,
    handlePositions,

    // 方法
    startResize,
    getHandleStyle,
  }
}