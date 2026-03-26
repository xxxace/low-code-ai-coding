/**
 * @file useFreeDrag.ts
 * @description 自由布局拖拽 Hook
 *
 * 核心功能：
 * 1. 拖拽移动（mousedown → mousemove → mouseup）
 * 2. 吸附对齐（可选）
 * 3. 多选拖拽（可选）
 *
 * 设计原则：
 * - 纯 DOM 实现，无第三方依赖
 * - 与 Vue 3 响应式天然集成
 * - 支持吸附阈值配置
 */

import { ref, reactive, onUnmounted, type Ref } from 'vue'
import type { FreePosition } from '../types/schema'

// ============================================================
// 类型定义
// ============================================================

export interface DragOptions {
  /** 吸附阈值（px），0 表示禁用吸附 */
  snapThreshold?: number
  /** 网格大小（px），用于网格吸附 */
  gridSize?: number
  /** 是否限制在容器内 */
  boundToContainer?: boolean
  /** 拖拽开始回调 */
  onDragStart?: (id: string, position: FreePosition) => void
  /** 拖拽中回调 */
  onDrag?: (id: string, position: FreePosition, delta: { dx: number; dy: number }) => void
  /** 拖拽结束回调 */
  onDragEnd?: (id: string, position: FreePosition) => void
}

export interface DragState {
  isDragging: boolean
  dragId: string | null
  startX: number
  startY: number
  startPosition: FreePosition | null
}

// ============================================================
// 拖拽 Hook
// ============================================================

export function useFreeDrag(options: DragOptions = {}) {
  const {
    snapThreshold = 5,
    gridSize = 10,
    boundToContainer = false,
    onDragStart,
    onDrag,
    onDragEnd,
  } = options

  // 拖拽状态
  const state = reactive<DragState>({
    isDragging: false,
    dragId: null,
    startX: 0,
    startY: 0,
    startPosition: null,
  })

  // 容器引用
  const containerRef: Ref<HTMLElement | null> = ref(null)

  // 其他组件位置（用于吸附检测）
  const otherPositions: Ref<Map<string, FreePosition>> = ref(new Map())

  // 吸附线（用于 UI 显示）
  const snapLines = reactive<{
    horizontal: { y: number; start: number; end: number }[]
    vertical: { x: number; start: number; end: number }[]
  }>({
    horizontal: [],
    vertical: [],
  })

  // ============================================================
  // 拖拽事件处理
  // ============================================================

  /**
   * 开始拖拽
   * @param e 鼠标事件
   * @param id 组件 ID
   * @param position 当前位置
   */
  const startDrag = (e: MouseEvent, id: string, position: FreePosition) => {
    e.preventDefault()
    e.stopPropagation()

    state.isDragging = true
    state.dragId = id
    state.startX = e.clientX
    state.startY = e.clientY
    state.startPosition = { ...position }

    // 添加全局事件监听
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    // 触发回调
    onDragStart?.(id, position)
  }

  /**
   * 鼠标移动
   */
  const handleMouseMove = (e: MouseEvent) => {
    if (!state.isDragging || !state.startPosition || !state.dragId) return

    const dx = e.clientX - state.startX
    const dy = e.clientY - state.startY

    let newX = state.startPosition.x + dx
    let newY = state.startPosition.y + dy

    // 网格吸附
    if (gridSize > 0) {
      newX = Math.round(newX / gridSize) * gridSize
      newY = Math.round(newY / gridSize) * gridSize
    }

    // 组件吸附检测
    if (snapThreshold > 0) {
      const snapResult = checkSnap(
        { ...state.startPosition, x: newX, y: newY },
        state.dragId
      )
      if (snapResult.x !== null) newX = snapResult.x
      if (snapResult.y !== null) newY = snapResult.y

      // 更新吸附线
      snapLines.horizontal = snapResult.lines.horizontal
      snapLines.vertical = snapResult.lines.vertical
    } else {
      snapLines.horizontal = []
      snapLines.vertical = []
    }

    // 容器边界限制
    if (boundToContainer && containerRef.value) {
      const containerRect = containerRef.value.getBoundingClientRect()
      newX = Math.max(0, Math.min(newX, containerRect.width - state.startPosition.width))
      newY = Math.max(0, Math.min(newY, containerRect.height - state.startPosition.height))
    }

    const newPosition: FreePosition = {
      ...state.startPosition,
      x: newX,
      y: newY,
    }

    onDrag?.(state.dragId, newPosition, { dx, dy })
  }

  /**
   * 鼠标释放
   */
  const handleMouseUp = () => {
    if (state.dragId && state.startPosition) {
      onDragEnd?.(state.dragId, state.startPosition)
    }

    // 重置状态
    state.isDragging = false
    state.dragId = null
    state.startPosition = null
    snapLines.horizontal = []
    snapLines.vertical = []

    // 移除全局事件监听
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  // ============================================================
  // 吸附检测
  // ============================================================

  interface SnapResult {
    x: number | null
    y: number | null
    lines: {
      horizontal: { y: number; start: number; end: number }[]
      vertical: { x: number; start: number; end: number }[]
    }
  }

  const checkSnap = (current: FreePosition, excludeId: string): SnapResult => {
    const result: SnapResult = {
      x: null,
      y: null,
      lines: { horizontal: [], vertical: [] },
    }

    const currentLeft = current.x
    const currentRight = current.x + current.width
    const currentTop = current.y
    const currentBottom = current.y + current.height
    const currentCenterX = current.x + current.width / 2
    const currentCenterY = current.y + current.height / 2

    otherPositions.value.forEach((other, id) => {
      if (id === excludeId) return

      const otherLeft = other.x
      const otherRight = other.x + other.width
      const otherTop = other.y
      const otherBottom = other.y + other.height
      const otherCenterX = other.x + other.width / 2
      const otherCenterY = other.y + other.height / 2

      // ===== X 方向吸附 =====

      // 左边对齐
      if (Math.abs(currentLeft - otherLeft) < snapThreshold) {
        result.x = otherLeft
        result.lines.vertical.push({
          x: otherLeft,
          start: Math.min(currentTop, otherTop),
          end: Math.max(currentBottom, otherBottom),
        })
      }
      // 右边对齐
      else if (Math.abs(currentRight - otherRight) < snapThreshold) {
        result.x = otherRight - current.width
        result.lines.vertical.push({
          x: otherRight,
          start: Math.min(currentTop, otherTop),
          end: Math.max(currentBottom, otherBottom),
        })
      }
      // 左对右
      else if (Math.abs(currentLeft - otherRight) < snapThreshold) {
        result.x = otherRight
        result.lines.vertical.push({
          x: otherRight,
          start: Math.min(currentTop, otherTop),
          end: Math.max(currentBottom, otherBottom),
        })
      }
      // 右对左
      else if (Math.abs(currentRight - otherLeft) < snapThreshold) {
        result.x = otherLeft - current.width
        result.lines.vertical.push({
          x: otherLeft,
          start: Math.min(currentTop, otherTop),
          end: Math.max(currentBottom, otherBottom),
        })
      }
      // 中心线对齐
      else if (Math.abs(currentCenterX - otherCenterX) < snapThreshold) {
        result.x = otherCenterX - current.width / 2
        result.lines.vertical.push({
          x: otherCenterX,
          start: Math.min(currentTop, otherTop),
          end: Math.max(currentBottom, otherBottom),
        })
      }

      // ===== Y 方向吸附 =====

      // 顶边对齐
      if (Math.abs(currentTop - otherTop) < snapThreshold) {
        result.y = otherTop
        result.lines.horizontal.push({
          y: otherTop,
          start: Math.min(currentLeft, otherLeft),
          end: Math.max(currentRight, otherRight),
        })
      }
      // 底边对齐
      else if (Math.abs(currentBottom - otherBottom) < snapThreshold) {
        result.y = otherBottom - current.height
        result.lines.horizontal.push({
          y: otherBottom,
          start: Math.min(currentLeft, otherLeft),
          end: Math.max(currentRight, otherRight),
        })
      }
      // 顶对底
      else if (Math.abs(currentTop - otherBottom) < snapThreshold) {
        result.y = otherBottom
        result.lines.horizontal.push({
          y: otherBottom,
          start: Math.min(currentLeft, otherLeft),
          end: Math.max(currentRight, otherRight),
        })
      }
      // 底对顶
      else if (Math.abs(currentBottom - otherTop) < snapThreshold) {
        result.y = otherTop - current.height
        result.lines.horizontal.push({
          y: otherTop,
          start: Math.min(currentLeft, otherLeft),
          end: Math.max(currentRight, otherRight),
        })
      }
      // 中心线对齐
      else if (Math.abs(currentCenterY - otherCenterY) < snapThreshold) {
        result.y = otherCenterY - current.height / 2
        result.lines.horizontal.push({
          y: otherCenterY,
          start: Math.min(currentLeft, otherLeft),
          end: Math.max(currentRight, otherRight),
        })
      }
    })

    return result
  }

  // ============================================================
  // 更新其他组件位置（用于吸附检测）
  // ============================================================

  const updateOtherPositions = (positions: Map<string, FreePosition>) => {
    otherPositions.value = positions
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
    snapLines,
    containerRef,

    // 方法
    startDrag,
    updateOtherPositions,
  }
}