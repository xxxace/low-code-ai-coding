/**
 * @file designer/composables/useMaterialDrag.ts
 * @description 物料拖拽逻辑 Composable
 *
 * 职责：
 * - 管理从 MaterialPalette 拖拽组件到画布的完整流程
 * - 处理拖拽开始（记录拖拽的物料）、放置（计算坐标 + 创建节点）
 * - 处理点击物料直接插入
 */

import { ref } from 'vue'
import type { DesignerEngine } from '../engine/designerEngine'
import type { FieldSchema } from '../../core/schema'

export function useMaterialDrag(engine: DesignerEngine) {
  /** 当前正在拖拽的物料元信息 */
  const draggingMaterial = ref<any | null>(null)

  /**
   * 物料面板 drag-start 事件处理
   * MaterialPalette 触发此事件时传入物料元信息
   */
  function handleMaterialDragStartFromPalette(material: any, _event: DragEvent): void {
    draggingMaterial.value = material
  }

  /**
   * 点击物料直接添加到画布末尾
   */
  function handleMaterialClick(material: any): void {
    const fieldKey = `field_${Date.now()}`
    const fieldSchema: FieldSchema = {
      ...(material.defaultSchema ?? {}),
      title: material.label,
      'x-id': engine.generateNodeId(),
      'x-span': 1,
    }
    engine.addNode('', fieldKey, fieldSchema)
  }

  /**
   * 画布 drop 事件处理
   * 支持拖拽 + DataTransfer 两种来源
   */
  function handleCanvasDrop(
    e: DragEvent,
    canvasRef: HTMLElement | null,
    isFreelayout: boolean
  ): void {
    e.preventDefault()

    let material = draggingMaterial.value
    if (!material && e.dataTransfer) {
      const raw = e.dataTransfer.getData('material')
      if (raw) {
        try {
          material = JSON.parse(raw)
        } catch {
          /* ignore */
        }
      }
    }
    if (!material) return

    const fieldKey = `field_${Date.now()}`

    let freePosition: Record<string, any> | undefined
    if (isFreelayout && canvasRef) {
      const rect = canvasRef.getBoundingClientRect()
      const x = Math.max(0, e.clientX - rect.left - 60)
      const y = Math.max(0, e.clientY - rect.top - 16)
      freePosition = { x, y, width: 200, height: 40, zIndex: 1 }
    }

    const fieldSchema: FieldSchema = {
      ...(material.defaultSchema ?? {}),
      title: material.label ?? material.name,
      'x-id': engine.generateNodeId(),
      'x-span': isFreelayout ? 24 : 1,
      ...(freePosition ? { 'x-free-position': freePosition } : {}),
    }

    engine.addNode('', fieldKey, fieldSchema)
    draggingMaterial.value = null
  }

  return {
    draggingMaterial,
    handleMaterialDragStartFromPalette,
    handleMaterialClick,
    handleCanvasDrop,
  }
}
