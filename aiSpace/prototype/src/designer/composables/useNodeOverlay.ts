/**
 * useNodeOverlay.ts
 * CanvasOverlay 组件的 Node Overlay 逻辑 —— 负责 hoverBox + selectedBox 渲染
 *
 * 职责：
 * - hoverNodeId 状态管理
 * - getHoverStyle / getSelectedStyle 样式计算
 * - 操作按钮逻辑（删除/复制）
 * - mouseenter/mouseleave 事件处理
 *
 * 不负责：
 * - 选中逻辑（已在 useDragInteraction.handleMouseUp 统一处理）
 * - 拖拽交互（由 useDragInteraction 处理）
 */

import { ref, type Ref, type CSSProperties } from 'vue'
import type { PageSchema } from '../../core/schema'

// ============================================================
// 类型定义
// ============================================================

interface Props {
  selectedNodeId: string | null
  schema: PageSchema
  interactionMode: 'idle' | 'mouse-drag' | 'html5-dnd'
}

export function useNodeOverlay(
  props: Readonly<Props>,
  canvasEl: Ref<HTMLElement | null>
) {
  // ============================================================
  // 状态
  // ============================================================

  const hoverNodeId = ref<string | null>(null)

  // ============================================================
  // 样式计算
  // ============================================================

  /**
   * 计算 hover 节点的样式
   */
  function getHoverStyle(nodeId: string): CSSProperties {
    if (!canvasEl.value) return { display: 'none' as const }
    const el = canvasEl.value.querySelector<HTMLElement>(`[data-field-id="${nodeId}"]`)
    if (!el) {
      console.warn('[useNodeOverlay] getHoverStyle: 找不到节点元素', { nodeId, canvasEl: canvasEl.value })
      return { display: 'none' as const }
    }

    const canvasRect = canvasEl.value.getBoundingClientRect()
    const nodeRect = el.getBoundingClientRect()

    return {
      position: 'absolute',
      left: `${nodeRect.left - canvasRect.left}px`,
      top: `${nodeRect.top - canvasRect.top}px`,
      width: `${nodeRect.width}px`,
      height: `${nodeRect.height}px`,
      border: '1px solid rgba(59, 130, 246, 0.5)',
      background: 'transparent',
      pointerEvents: 'none',
    }
  }

  /**
   * 计算选中节点的样式
   */
  function getSelectedStyle(nodeId: string): CSSProperties {
    if (!canvasEl.value) {
      console.warn('[useNodeOverlay] getSelectedStyle: canvasEl 为 null')
      return { display: 'none' as const }
    }
    const el = canvasEl.value.querySelector<HTMLElement>(`[data-field-id="${nodeId}"]`)
    if (!el) {
      console.warn('[useNodeOverlay] getSelectedStyle: 找不到节点元素', { nodeId, canvasEl: canvasEl.value })
      return { display: 'none' as const }
    }

    const canvasRect = canvasEl.value.getBoundingClientRect()
    const nodeRect = el.getBoundingClientRect()

    return {
      position: 'absolute',
      left: `${nodeRect.left - canvasRect.left}px`,
      top: `${nodeRect.top - canvasRect.top}px`,
      width: `${nodeRect.width}px`,
      height: `${nodeRect.height}px`,
      border: '2px solid #409eff',
      background: 'rgba(64, 158, 255, 0.06)',
      pointerEvents: 'none',
    }
  }

  // ============================================================
  // 事件处理
  // ============================================================

  function handleMouseOver(e: MouseEvent) {
    if (props.interactionMode === 'html5-dnd') return
    const nodeEl = (e.target as HTMLElement).closest('[data-field-id]') as HTMLElement | null
    hoverNodeId.value = nodeEl?.getAttribute('data-field-id') ?? null
  }

  function handleMouseOut(e: MouseEvent) {
    if (props.interactionMode === 'html5-dnd') return
    // 检查 relatedTarget 是否在 canvasEl 内，避免子元素触发 mouseout
    const related = e.relatedTarget as HTMLElement | null
    if (!canvasEl.value || !canvasEl.value.contains(related)) {
      hoverNodeId.value = null
    }
  }

  // ============================================================
  // 事件绑定/清理
  // ============================================================

  function setupHoverListeners() {
    canvasEl.value?.addEventListener('mouseover', handleMouseOver)
    canvasEl.value?.addEventListener('mouseout', handleMouseOut)
  }

  function cleanup() {
    canvasEl.value?.removeEventListener('mouseover', handleMouseOver)
    canvasEl.value?.removeEventListener('mouseout', handleMouseOut)
  }

  // ============================================================
  // 返回值
  // ============================================================

  return {
    hoverNodeId,
    getHoverStyle,
    getSelectedStyle,
    setupHoverListeners,
    cleanup,
  }
}
