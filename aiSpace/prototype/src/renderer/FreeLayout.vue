<!--
  FreeLayout.vue
  自由定位布局渲染器 —— 绝对坐标布局，支持拖拽和缩放

  运行时渲染功能：
  - 渲染所有带 x-free-position 的字段节点
  - 支持 void 容器和普通字段的递归渲染
  - 选中节点时显示 8 个缩放手柄（nw, n, ne, e, se, s, sw, w）

  交互功能：
  - 点击节点选中
  - 拖拽节点移动位置（更新 x-free-position.x 和 .y）
  - 拖拽缩放手柄调整尺寸（更新 x-free-position.width 和 .height）
-->
<template>
  <div
    ref="containerRef"
    class="lowcode-free-layout"
    :style="containerStyle"
    @click.self="handleContainerClick"
  >
    <template v-for="(fieldSchema, fieldKey) in properties" :key="fieldSchema['x-id'] ?? fieldKey">
      <div
        v-if="fieldSchema['x-free-position']"
        class="lowcode-free-node"
        :class="{ 'lowcode-free-node--selected': fieldSchema['x-id'] === selectedNodeId }"
        :style="nodeStyle(fieldSchema['x-free-position']!)"
        :data-field-id="fieldSchema['x-id']"
        @mousedown="handleNodeMouseDown(fieldSchema['x-id']!, $event)"
      >
        <!-- 选中时显示 8 个缩放手柄 -->
        <template v-if="fieldSchema['x-id'] === selectedNodeId">
          <div
            class="resize-handle resize-handle--nw"
            @mousedown.stop="handleResizeStart(fieldSchema['x-id']!, 'nw', $event)"
          ></div>
          <div
            class="resize-handle resize-handle--n"
            @mousedown.stop="handleResizeStart(fieldSchema['x-id']!, 'n', $event)"
          ></div>
          <div
            class="resize-handle resize-handle--ne"
            @mousedown.stop="handleResizeStart(fieldSchema['x-id']!, 'ne', $event)"
          ></div>
          <div
            class="resize-handle resize-handle--e"
            @mousedown.stop="handleResizeStart(fieldSchema['x-id']!, 'e', $event)"
          ></div>
          <div
            class="resize-handle resize-handle--se"
            @mousedown.stop="handleResizeStart(fieldSchema['x-id']!, 'se', $event)"
          ></div>
          <div
            class="resize-handle resize-handle--s"
            @mousedown.stop="handleResizeStart(fieldSchema['x-id']!, 's', $event)"
          ></div>
          <div
            class="resize-handle resize-handle--sw"
            @mousedown.stop="handleResizeStart(fieldSchema['x-id']!, 'sw', $event)"
          ></div>
          <div
            class="resize-handle resize-handle--w"
            @mousedown.stop="handleResizeStart(fieldSchema['x-id']!, 'w', $event)"
          ></div>
        </template>

        <!-- 虚字段容器 -->
        <VoidContainer
          v-if="fieldSchema.type === 'void'"
          :schema="fieldSchema"
          :form-model="formModel"
          :field-key="String(fieldKey)"
          :path-prefix="''"
        />
        <!-- 普通字段 -->
        <FieldRenderer
          v-else
          :schema="fieldSchema"
          :form-model="formModel"
          :path="String(fieldKey)"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, onUnmounted, type CSSProperties } from 'vue'
import type { FieldSchema, FreePosition } from '../types/schema'
import type { FormModel } from '../types/model'
import FieldRenderer from './FieldRenderer.vue'
import VoidContainer from './VoidContainer.vue'

// ============================================================
// Props & Emits
// ============================================================

interface Props {
  properties: Record<string, FieldSchema>
  formModel: FormModel
  /** 画布基准宽度（默认 1920，用于等比缩放） */
  baseWidth?: number
  /** 画布基准高度（默认 1080） */
  baseHeight?: number
}

const props = withDefaults(defineProps<Props>(), {
  baseWidth: 1920,
  baseHeight: 1080,
})

const emit = defineEmits<{
  'select-node': (id: string) => void
  'update-node-position': (id: string, position: Partial<FreePosition>) => void
  'update-node-size': (id: string, position: Partial<FreePosition>) => void
}>()

// 注入设计器引擎
const designerEngine: any = inject('designerEngine')
const selectedNodeId = computed(() => designerEngine?.selectedNodeId?.value ?? null)

// ============================================================
// 状态
// ============================================================

const containerRef = ref<HTMLElement | null>(null)

// 拖拽状态
const draggingNodeId = ref<string | null>(null)
const resizingNodeId = ref<string | null>(null)
const resizeDirection = ref<string | null>(null)

// 拖拽初始位置
const dragStartX = ref(0)
const dragStartY = ref(0)
const initialPosition = ref<FreePosition | null>(null)

// 缩放初始状态
const resizeStartX = ref(0)
const resizeStartY = ref(0)
const initialSize = ref<{ width: number; height: number; x: number; y: number } | null>(null)

// ============================================================
// 计算属性
// ============================================================

const containerStyle = computed(() => ({
  position: 'relative' as const,
  width: `${props.baseWidth}px`,
  height: `${props.baseHeight}px`,
  overflow: 'auto',
}))

// ============================================================
// 工具函数
// ============================================================

function nodeStyle(pos: FreePosition): CSSProperties {
  return {
    position: 'absolute',
    left: `${pos.x}px`,
    top: `${pos.y}px`,
    width: `${pos.width}px`,
    height: `${pos.height}px`,
    zIndex: pos.zIndex ?? 1,
    transform: pos.rotate ? `rotate(${pos.rotate}deg)` : undefined,
    pointerEvents: pos.locked ? 'none' : 'auto',
  }
}

// ============================================================
// 事件处理
// ============================================================

function handleContainerClick(): void {
  emit('select-node', '')
}

function handleNodeMouseDown(nodeId: string, e: MouseEvent): void {
  if (e.button !== 0) return // 只响应左键
  e.preventDefault()
  e.stopPropagation()

  emit('select-node', nodeId)

  const node = properties[nodeId]
  if (!node || !node['x-free-position']) return

  draggingNodeId.value = nodeId
  dragStartX.value = e.clientX
  dragStartY.value = e.clientY
  initialPosition.value = { ...node['x-free-position']! }

  document.addEventListener('mousemove', handleNodeMouseMove)
  document.addEventListener('mouseup', handleNodeMouseUp)
}

function handleNodeMouseMove(e: MouseEvent): void {
  if (!draggingNodeId.value || !initialPosition.value) return

  const deltaX = e.clientX - dragStartX.value
  const deltaY = e.clientY - dragStartY.value

  const newPosition = {
    x: Math.max(0, initialPosition.value.x + deltaX),
    y: Math.max(0, initialPosition.value.y + deltaY),
    width: initialPosition.value.width,
    height: initialPosition.value.height,
  }

  emit('update-node-position', draggingNodeId.value, newPosition)
}

function handleNodeMouseUp(): void {
  if (!draggingNodeId.value) return

  draggingNodeId.value = null
  initialPosition.value = null

  document.removeEventListener('mousemove', handleNodeMouseMove)
  document.removeEventListener('mouseup', handleNodeMouseUp)
}

function handleResizeStart(nodeId: string, direction: string, e: MouseEvent): void {
  e.preventDefault()
  e.stopPropagation()

  const node = properties[nodeId]
  if (!node || !node['x-free-position']) return

  resizingNodeId.value = nodeId
  resizeDirection.value = direction
  resizeStartX.value = e.clientX
  resizeStartY.value = e.clientY
  initialSize.value = {
    width: node['x-free-position']!.width,
    height: node['x-free-position']!.height,
    x: node['x-free-position']!.x,
    y: node['x-free-position']!.y,
  }

  document.addEventListener('mousemove', handleResizeMouseMove)
  document.addEventListener('mouseup', handleResizeMouseUp)
}

function handleResizeMouseMove(e: MouseEvent): void {
  if (!resizingNodeId.value || !initialSize.value || !resizeDirection.value) return

  const deltaX = e.clientX - resizeStartX.value
  const deltaY = e.clientY - resizeStartY.value
  const dir = resizeDirection.value

  let newSize = {
    width: initialSize.value.width,
    height: initialSize.value.height,
    x: initialSize.value.x,
    y: initialSize.value.y,
  }

  // 根据方向计算新的尺寸和位置
  if (dir.includes('e')) {
    newSize.width = Math.max(50, initialSize.value.width + deltaX)
  }
  if (dir.includes('w')) {
    const newWidth = Math.max(50, initialSize.value.width - deltaX)
    newSize.width = newWidth
    newSize.x = initialSize.value.x + initialSize.value.width - newWidth
  }
  if (dir.includes('s')) {
    newSize.height = Math.max(30, initialSize.value.height + deltaY)
  }
  if (dir.includes('n')) {
    const newHeight = Math.max(30, initialSize.value.height - deltaY)
    newSize.height = newHeight
    newSize.y = initialSize.value.y + initialSize.value.height - newHeight
  }

  emit('update-node-size', resizingNodeId.value, newSize)
}

function handleResizeMouseUp(): void {
  if (!resizingNodeId.value) return

  resizingNodeId.value = null
  resizeDirection.value = null
  initialSize.value = null

  document.removeEventListener('mousemove', handleResizeMouseMove)
  document.removeEventListener('mouseup', handleResizeMouseUp)
}

// 清理事件监听器
onUnmounted(() => {
  document.removeEventListener('mousemove', handleNodeMouseMove)
  document.removeEventListener('mouseup', handleNodeMouseUp)
  document.removeEventListener('mousemove', handleResizeMouseMove)
  document.removeEventListener('mouseup', handleResizeMouseUp)
})
</script>

<style scoped>
.lowcode-free-layout {
  background-color: #f5f5f5;
  min-height: 600px;
  width: 100%;
  height: 100%;
  overflow: auto;
  position: relative;
}

.lowcode-free-node {
  box-sizing: border-box;
  position: absolute;
  cursor: move;
  transition: box-shadow 0.15s;
}

.lowcode-free-node:hover {
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.lowcode-free-node--selected {
  box-shadow: 0 0 0 2px #409eff;
}

/* 8个缩放手柄 */
.resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #fff;
  border: 1px solid #409eff;
  border-radius: 50%;
  z-index: 10;
}

.resize-handle--nw { top: -4px; left: -4px; cursor: nw-resize; }
.resize-handle--n  { top: -4px; left: 50%; transform: translateX(-50%); cursor: n-resize; }
.resize-handle--ne { top: -4px; right: -4px; cursor: ne-resize; }
.resize-handle--e  { top: 50%; right: -4px; transform: translateY(-50%); cursor: e-resize; }
.resize-handle--se { bottom: -4px; right: -4px; cursor: se-resize; }
.resize-handle--s  { bottom: -4px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
.resize-handle--sw { bottom: -4px; left: -4px; cursor: sw-resize; }
.resize-handle--w  { top: 50%; left: -4px; transform: translateY(-50%); cursor: w-resize; }
</style>
