/**
 * @file designer/composables/useMaterialDrag.ts
 * @description 物料拖拽逻辑 Composable
 *
 * 职责：
 * - 管理从 MaterialPalette 拖拽组件到画布的完整流程
 * - 处理拖拽开始（记录拖拽的物料）、放置（计算坐标 + 创建节点）
 * - 处理点击物料直接插入
 *
 * layoutMode 对新增节点的影响：
 * - 'flow': x-position-type=relative, x-span=1
 * - 'free': x-position-type=absolute, x-position={x,y,width,height}
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
   * @param material 物料元信息
   * @param isFreelayout 是否为自由布局模式（layoutMode === 'free'）
   */
  function handleMaterialClick(material: any, isFreelayout: boolean): void {
    const fieldKey = `field_${Date.now()}`
    const fieldSchema: FieldSchema = {
      ...(material.defaultSchema ?? {}),
      title: material.label,
      'x-id': engine.generateNodeId(),
    }

    // 根据布局模式设置不同的定位属性
    if (isFreelayout) {
      // Free 模式：绝对定位
      fieldSchema['x-position-type'] = 'absolute'
      fieldSchema['x-position'] = { x: 20, y: 20, width: 200, height: 40, zIndex: 1 }
    } else {
      // Flow 模式：流式布局
      fieldSchema['x-position-type'] = 'relative'
      fieldSchema['x-span'] = 1
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
    const fieldSchema: FieldSchema = {
      ...(material.defaultSchema ?? {}),
      title: material.label ?? material.name,
      'x-id': engine.generateNodeId(),
    }

    // 根据布局模式设置不同的定位属性
    if (isFreelayout && canvasRef) {
      // Free 模式：绝对定位，根据鼠标位置计算
      const rect = canvasRef.getBoundingClientRect()
      const x = Math.max(0, e.clientX - rect.left - 60)
      const y = Math.max(0, e.clientY - rect.top - 16)
      fieldSchema['x-position-type'] = 'absolute'
      fieldSchema['x-position'] = { x, y, width: 200, height: 40, zIndex: 1 }
    } else {
      // Flow 模式：流式布局
      fieldSchema['x-position-type'] = 'relative'
      fieldSchema['x-span'] = 1
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
