<!--
  AbsoluteNodeOverlay.vue
  Absolute 节点交互层 —— 负责 absolute 定位节点的拖拽移动 + 8 方向缩放

  职责：
  1. 监听 x-position-type === 'absolute' 的节点
  2. 对选中节点叠加拖拽和缩放手柄
  3. 拖拽节点时，实时更新 schema.x-position.x 和 .y
  4. 拖拽缩放手柄时，实时更新 schema.x-position.width 和 .height
  5. 拖拽结束时保存历史快照
-->
<template>
  <div ref="overlayRef" class="absolute-overlay">
    <!-- absolute 容器节点的 drop 接收区域（非选中状态也显示，用于接收流式节点的 drop） -->
    <template v-for="container in absoluteContainerNodes" :key="container['x-id']">
      <div
        v-if="container['x-id'] !== selectedNodeId && getContainerStyle(container)"
        class="absolute-overlay__drop-zone"
        :class="{ 'absolute-overlay__drop-zone--active': dragOverContainerId === container['x-id'] }"
        :style="getContainerStyle(container)"
        @dragover.prevent="handleContainerDragOver(container['x-id']!, $event)"
        @dragleave="handleContainerDragLeave(container['x-id']!)"
        @drop.prevent="handleContainerDrop(container['x-id']!, $event)"
        @click.stop="handleContainerClick(container['x-id']!)"
      />
    </template>

    <!-- absolute 容器内的 relative 子节点 overlay（支持点击选中、拖拽排序） -->
    <template v-for="child in relativeChildrenInContainers" :key="child['x-id']">
      <div
        v-if="child['x-id'] !== selectedNodeId && getRelativeChildStyle(child)"
        class="absolute-overlay__relative-item"
        :class="{ 'absolute-overlay__relative-item--selected': child['x-id'] === selectedNodeId }"
        :style="getRelativeChildStyle(child)!"
        @click.stop="handleRelativeChildClick(child['x-id']!)"
        @dragover.prevent="handleRelativeChildDragOver(child['x-id']!, $event)"
        @dragleave="handleRelativeChildDragLeave(child['x-id']!)"
        @drop.stop="handleRelativeChildDrop(child['x-id']!)"
      />
    </template>

    <!-- 选中节点的操作层 -->
    <template v-if="selectedNodeSchema">
      <div
        class="absolute-overlay__item"
        :class="{
          'absolute-overlay__item--dragging': isDragging || isResizing,
          'absolute-overlay__item--container': selectedNodeSchema!.type === 'void' || selectedNodeSchema!.type === 'object'
        }"
        :style="itemStyle"
        @mousedown.stop="handleItemMouseDown"
        @click.stop="handleItemClick(selectedNodeSchema!['x-id']!)"
      >
        <!-- 8 个缩放手柄（选中时显示） -->
        <!-- 北（上中） -->
        <div
          v-if="!isResizing"
          class="resize-handle resize-handle--n"
          @mousedown.stop="handleResizeStart('n', $event)"
        />

        <!-- 南（下中） -->
        <div
          v-if="!isResizing"
          class="resize-handle resize-handle--s"
          @mousedown.stop="handleResizeStart('s', $event)"
        />

        <!-- 西（左中） -->
        <div
          v-if="!isResizing"
          class="resize-handle resize-handle--w"
          @mousedown.stop="handleResizeStart('w', $event)"
        />

        <!-- 东（右中） -->
        <div
          v-if="!isResizing"
          class="resize-handle resize-handle--e"
          @mousedown.stop="handleResizeStart('e', $event)"
        />

        <!-- 西北（左上角） -->
        <div
          v-if="!isResizing"
          class="resize-handle resize-handle--nw"
          @mousedown.stop="handleResizeStart('nw', $event)"
        />

        <!-- 东北（右上角） -->
        <div
          v-if="!isResizing"
          class="resize-handle resize-handle--ne"
          @mousedown.stop="handleResizeStart('ne', $event)"
        />

        <!-- 西南（左下角） -->
        <div
          v-if="!isResizing"
          class="resize-handle resize-handle--sw"
          @mousedown.stop="handleResizeStart('sw', $event)"
        />

        <!-- 东南（右下角） -->
        <div
          v-if="!isResizing"
          class="resize-handle resize-handle--se"
          @mousedown.stop="handleResizeStart('se', $event)"
        />

        <!-- 操作按钮 -->
        <div class="absolute-overlay__actions">
          <span class="absolute-overlay__label">{{ selectedNodeSchema.title ?? 'absolute 节点' }}</span>

          <el-tooltip content="复制" placement="top">
            <button
              class="absolute-overlay__action-btn"
              @click.stop="$emit('duplicate-node', selectedNodeSchema!['x-id']!)"
            >
              <el-icon><CopyDocument /></el-icon>
            </button>
          </el-tooltip>

          <el-tooltip content="删除" placement="top">
            <button
              class="absolute-overlay__action-btn absolute-overlay__action-btn--danger"
              @click.stop="$emit('remove-node', selectedNodeSchema!['x-id']!)"
            >
              <el-icon><Delete /></el-icon>
            </button>
          </el-tooltip>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watchEffect } from 'vue'
import { CopyDocument, Delete } from '@element-plus/icons-vue'
import type { PageSchema, FieldSchema } from '../core/schema'

// ============================================================
// Props & Emits
// ============================================================

interface Props {
  schema: PageSchema
  selectedNodeId: string | null
  /** 画布 DOM 容器（用于计算相对坐标） */
  canvasEl: HTMLElement | null
}

/** overlay 的直接父容器（即 scroll container，position: relative） */
function getScrollContainer(): HTMLElement | null {
  return overlayRef.value?.parentElement ?? null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'select-node', id: string): void
  (e: 'remove-node', id: string): void
  (e: 'duplicate-node', id: string): void
  (e: 'update-node-position', nodeId: string, updates: { x: number; y: number }): void
  (e: 'update-node-size', nodeId: string, updates: { width: number; height: number }): void
  (e: 'move-to-container', nodeId: string, containerId: string): void
  (e: 'save-snapshot'): void
  (e: 'reorder-nodes', fromId: string, toId: string, position: 'before' | 'after'): void
}>()

// ============================================================
// 状态
// ============================================================

const overlayRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const isResizing = ref(false)
const resizeDirection = ref<string | null>(null)
/** RAF 节流标记，确保每帧最多处理一次 mousemove */
let rafPending = false

/** 当前 dragover 的 absolute 容器节点 ID */
const dragOverContainerId = ref<string | null>(null)
/** 当前正在拖拽的节点 ID（来自其他 overlay 的 dragstart） */
const draggingNodeId = ref<string | null>(null)

// 拖拽/缩放的起始鼠标位置
const startMouseX = ref(0)
const startMouseY = ref(0)

// 节点的初始位置和尺寸
const initialX = ref(0)
const initialY = ref(0)
const initialWidth = ref(0)
const initialHeight = ref(0)

// 实时 DOM 位置（用于拖拽时持续更新 overlay）
const liveNodeRect = ref<{ left: number; top: number; width: number; height: number } | null>(null)

// ============================================================
// 计算属性
// ============================================================

const selectedNodeSchema = computed<FieldSchema | null>(() => {
  if (!props.selectedNodeId) return null
  const node = findNodeSchemaById(props.selectedNodeId)
  // 只处理 Free 布局节点（x-position-type === 'absolute'）
  if (!node || node['x-position-type'] !== 'absolute') return null
  return node
})

/** 获取所有 absolute 容器节点（用于接收流式节点的 drop） */
const absoluteContainerNodes = computed<FieldSchema[]>(() => {
  const containers: FieldSchema[] = []

  function walk(properties: Record<string, FieldSchema>): void {
    for (const [, schema] of Object.entries(properties)) {
      // 收集所有 absolute 容器节点（包括选中和非选中的）
      if (schema['x-position-type'] === 'absolute') {
        const isContainer = schema.type === 'void' || schema.type === 'object'
        if (isContainer) {
          containers.push(schema)
        }
      }
      if ('properties' in schema && schema.properties) {
        walk(schema.properties as Record<string, FieldSchema>)
      }
    }
  }

  if (props.schema?.schema?.properties) {
    walk(props.schema.schema.properties)
  }
  return containers
})

/** 获取 absolute 容器内部的所有 relative 子节点（用于渲染 overlay 支持点击选中、拖拽排序） */
const relativeChildrenInContainers = computed<FieldSchema[]>(() => {
  const children: FieldSchema[] = []

  function walk(properties: Record<string, FieldSchema>): void {
    for (const [, schema] of Object.entries(properties)) {
      // 收集 absolute 容器内部的 relative 节点
      if (schema['x-position-type'] !== 'absolute' && schema['x-id']) {
        children.push(schema)
      }
      if ('properties' in schema && schema.properties) {
        walk(schema.properties as Record<string, FieldSchema>)
      }
    }
  }

  if (props.schema?.schema?.properties) {
    walk(props.schema.schema.properties)
  }
  return children
})

function findNodeSchemaById(nodeId: string): FieldSchema | null {
  function walk(properties: Record<string, FieldSchema>): FieldSchema | null {
    for (const [, schema] of Object.entries(properties)) {
      if (schema['x-id'] === nodeId) return schema
      if ('properties' in schema && schema.properties) {
        const found = walk(schema.properties as Record<string, FieldSchema>)
        if (found) return found
      }
    }
    return null
  }
  return props.schema?.schema?.properties ? walk(props.schema.schema.properties) : null
}

/** 计算 absolute 容器节点的样式（用于渲染 drop 接收区域） */
function getContainerStyle(container: FieldSchema): Record<string, string | number> | null {
  const pos = container['x-position']
  if (!pos) return null

  const nodeId = container['x-id']
  if (!nodeId) return null

  const scrollContainer = getScrollContainer()
  if (!props.canvasEl || !scrollContainer) return null

  // 优先取 DOM 实测位置
  const el = props.canvasEl.querySelector<HTMLElement>(`[data-field-id="${nodeId}"]`)
  if (el) {
    const scRect = scrollContainer.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    return {
      left: `${elRect.left - scRect.left}px`,
      top: `${elRect.top - scRect.top}px`,
      width: `${elRect.width}px`,
      height: `${elRect.height}px`,
    }
  }

  // 降级：使用 schema 值
  return {
    left: `${pos.x ?? 0}px`,
    top: `${pos.y ?? 0}px`,
    width: `${pos.width ?? 200}px`,
    height: `${pos.height ?? 100}px`,
  }
}

/** 计算 relative 子节点的 overlay 样式 */
function getRelativeChildStyle(node: FieldSchema): Record<string, string | number> | null {
  const nodeId = node['x-id']
  if (!nodeId || !props.canvasEl) return null

  const scrollContainer = getScrollContainer()
  if (!scrollContainer) return null

  const el = props.canvasEl.querySelector<HTMLElement>(`[data-field-id="${nodeId}"]`)
  if (!el) return null

  const scRect = scrollContainer.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()

  return {
    left: `${elRect.left - scRect.left}px`,
    top: `${elRect.top - scRect.top}px`,
    width: `${elRect.width}px`,
    height: `${elRect.height}px`,
  }
}

const itemStyle = computed(() => {
  const pos = selectedNodeSchema.value?.['x-position']
  if (!pos) {
    return { display: 'none' }
  }

  const nodeId = selectedNodeSchema.value!['x-id']
  const scrollContainer = getScrollContainer()

  // 优先使用实时 DOM 位置（拖拽时持续更新）
  if (liveNodeRect.value && scrollContainer) {
    const scRect = scrollContainer.getBoundingClientRect()
    return {
      position: 'absolute' as const,
      left: `${liveNodeRect.value.left - scRect.left}px`,
      top: `${liveNodeRect.value.top - scRect.top}px`,
      width: `${liveNodeRect.value.width}px`,
      height: `${liveNodeRect.value.height}px`,
      pointerEvents: 'auto' as const,
      cursor: isResizing.value ? getResizeCursor() : 'move',
      zIndex: pos.zIndex ?? 1,
    }
  }

  // 降级：直接用 scroll container 作为坐标基准
  if (props.canvasEl && nodeId && scrollContainer) {
    const scRect = scrollContainer.getBoundingClientRect()
    const el = props.canvasEl.querySelector<HTMLElement>(`[data-field-id="${nodeId}"]`)
    if (el) {
      const elRect = el.getBoundingClientRect()
      return {
        position: 'absolute' as const,
        left: `${elRect.left - scRect.left}px`,
        top: `${elRect.top - scRect.top}px`,
        width: `${elRect.width}px`,
        height: `${elRect.height}px`,
        pointerEvents: 'auto' as const,
        cursor: isResizing.value ? getResizeCursor() : 'move',
        zIndex: pos.zIndex ?? 1,
      }
    }
  }

  // 最终降级：使用 schema 值
  return {
    position: 'absolute' as const,
    left: `${pos.x ?? 0}px`,
    top: `${pos.y ?? 0}px`,
    width: `${pos.width ?? 200}px`,
    height: `${pos.height ?? 40}px`,
    pointerEvents: 'auto' as const,
    cursor: isResizing.value ? getResizeCursor() : 'move',
    zIndex: pos.zIndex ?? 1,
  }
})

// ============================================================
// 拖拽时实时更新 overlay 位置
// ============================================================

/** 拖拽/缩放期间持续跟踪节点 DOM 位置 */
let trackRafId: number | null = null

function startTrackingPosition(): void {
  if (trackRafId) return // 已经在跟踪中

  const nodeId = selectedNodeSchema.value?.['x-id']
  if (!nodeId || !props.canvasEl) return

  function trackPosition(): void {
    if (!isDragging.value && !isResizing.value) {
      trackRafId = null
      liveNodeRect.value = null
      return
    }

    const el = props.canvasEl!.querySelector<HTMLElement>(`[data-field-id="${nodeId}"]`)
    if (el) {
      const rect = el.getBoundingClientRect()
      liveNodeRect.value = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      }
    }

    trackRafId = requestAnimationFrame(trackPosition)
  }

  trackRafId = requestAnimationFrame(trackPosition)
}

function stopTrackingPosition(): void {
  if (trackRafId) {
    cancelAnimationFrame(trackRafId)
    trackRafId = null
  }
  liveNodeRect.value = null
}

function getResizeCursor(): string {
  const dir = resizeDirection.value
  switch (dir) {
    case 'n': case 's': return 'ns-resize'
    case 'e': case 'w': return 'ew-resize'
    case 'nw': case 'se': return 'nwse-resize'
    case 'ne': case 'sw': return 'nesw-resize'
    default: return 'default'
  }
}

// ============================================================
// 事件处理
// ============================================================

function handleItemClick(nodeId: string): void {
  emit('select-node', nodeId)
}

function handleContainerClick(nodeId: string): void {
  emit('select-node', nodeId)
}

/** 处理 relative 子节点的点击选中 */
function handleRelativeChildClick(nodeId: string): void {
  emit('select-node', nodeId)
}

/** 处理 relative 子节点的 dragover（用于拖拽排序） */
function handleRelativeChildDragOver(nodeId: string, e: DragEvent): void {
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move'
  }
  // 可以在这里添加排序指示线的逻辑
}

/** 处理 relative 子节点的 dragleave */
function handleRelativeChildDragLeave(nodeId: string): void {
  // 清理排序指示线
}

/** 处理 relative 子节点的 drop（用于拖拽排序） */
function handleRelativeChildDrop(targetId: string): void {
  // 获取拖拽的节点 ID
  let fromId = draggingNodeId.value
  if (!fromId) {
    fromId = sessionStorage.getItem('dragging-node-id')
  }

  if (!fromId || fromId === targetId) {
    draggingNodeId.value = null
    sessionStorage.removeItem('dragging-node-id')
    return
  }

  // 发射排序事件到父组件
  emit('reorder-nodes', fromId, targetId, 'before')

  draggingNodeId.value = null
  sessionStorage.removeItem('dragging-node-id')
}

function handleContainerDragOver(containerId: string, e: DragEvent): void {
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move'
  }
  dragOverContainerId.value = containerId
}

function handleContainerDragLeave(containerId: string): void {
  if (dragOverContainerId.value === containerId) {
    dragOverContainerId.value = null
  }
}

function handleContainerDrop(containerId: string, e?: DragEvent): void {
  // 优先从 draggingNodeId 获取，如果没有则尝试从 dataTransfer 或 sessionStorage 获取
  let fromId = draggingNodeId.value
  if (!fromId && e?.dataTransfer) {
    fromId = e.dataTransfer.getData('text/plain')
  }
  if (!fromId) {
    fromId = sessionStorage.getItem('dragging-node-id')
  }

  if (!fromId || fromId === containerId) {
    dragOverContainerId.value = null
    draggingNodeId.value = null
    sessionStorage.removeItem('dragging-node-id')
    return
  }

  // 将流式节点移动到 absolute 容器中
  emit('move-to-container', fromId, containerId)

  dragOverContainerId.value = null
  draggingNodeId.value = null
  sessionStorage.removeItem('dragging-node-id')
}

function handleItemMouseDown(e: MouseEvent): void {
  if (isResizing.value) return

  const node = selectedNodeSchema.value
  const pos = node?.['x-position']
  if (!pos) return

  isDragging.value = true
  startMouseX.value = e.clientX
  startMouseY.value = e.clientY

  // 直接使用 schema 的 x-position 值（与 processMove 输出坐标系一致）
  // 避免 DOM 测量引入的坐标系偏差（当画布有滚动时 elRect 和 clientX 坐标系不一致）
  initialX.value = pos.x ?? 0
  initialY.value = pos.y ?? 0

  // 立即设置 liveNodeRect，使 overlay 在拖拽开始瞬间就显示在正确位置
  const nodeId = node!['x-id']
  const scrollContainer = getScrollContainer()
  if (props.canvasEl && nodeId && scrollContainer) {
    const el = props.canvasEl.querySelector<HTMLElement>(`[data-field-id="${nodeId}"]`)
    if (el) {
      const elRect = el.getBoundingClientRect()
      liveNodeRect.value = {
        left: elRect.left,
        top: elRect.top,
        width: elRect.width,
        height: elRect.height,
      }
    }
  }

  // 开始跟踪位置
  startTrackingPosition()

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)

  e.preventDefault()
  e.stopPropagation()
}

function handleResizeStart(direction: string, e: MouseEvent): void {
  const node = selectedNodeSchema.value
  const pos = node?.['x-position']
  if (!pos) return

  isResizing.value = true
  resizeDirection.value = direction
  startMouseX.value = e.clientX
  startMouseY.value = e.clientY

  // 直接使用 schema 的 x-position 值作为初始位置
  initialX.value = pos.x ?? 0
  initialY.value = pos.y ?? 0
  initialWidth.value = pos.width ?? 200
  initialHeight.value = pos.height ?? 40

  // 立即设置 liveNodeRect，使 overlay 在缩放开始瞬间就显示在正确位置
  const nodeId = node!['x-id']
  const scrollContainer = getScrollContainer()
  if (props.canvasEl && nodeId && scrollContainer) {
    const el = props.canvasEl.querySelector<HTMLElement>(`[data-field-id="${nodeId}"]`)
    if (el) {
      const elRect = el.getBoundingClientRect()
      liveNodeRect.value = {
        left: elRect.left,
        top: elRect.top,
        width: elRect.width,
        height: elRect.height,
      }
    }
  }

  // 开始跟踪位置
  startTrackingPosition()

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)

  e.preventDefault()
  e.stopPropagation()
}

function handleMouseMove(e: MouseEvent): void {
  if (!isDragging.value && !isResizing.value) return

  // RAF 节流：每帧最多处理一次，避免高频 mousemove 导致卡顿
  if (rafPending) return
  rafPending = true
  requestAnimationFrame(() => {
    rafPending = false
    processMove(e)
  })
}

/** 实际处理拖拽/缩放逻辑（由 RAF 调度，每帧最多执行一次） */
function processMove(e: MouseEvent): void {
  const deltaX = e.clientX - startMouseX.value
  const deltaY = e.clientY - startMouseY.value

  if (isDragging.value) {
    // 取整避免浮点数小数位过多
    const newX = Math.round(Math.max(0, initialX.value + deltaX))
    const newY = Math.round(Math.max(0, initialY.value + deltaY))

    if (props.selectedNodeId) {
      emit('update-node-position', props.selectedNodeId, { x: newX, y: newY })
    }
  } else if (isResizing.value && resizeDirection.value) {
    let { width, height, x, y } = {
      width: initialWidth.value,
      height: initialHeight.value,
      x: initialX.value,
      y: initialY.value,
    }

    const dir = resizeDirection.value

    if (dir.includes('n')) {
      const newY = Math.max(0, initialY.value + deltaY)
      const newHeight = initialHeight.value - deltaY
      if (newHeight > 20) {
        y = newY
        height = newHeight
      }
    }

    if (dir.includes('s')) {
      const newHeight = Math.max(20, initialHeight.value + deltaY)
      height = newHeight
    }

    if (dir.includes('w')) {
      const newX = Math.max(0, initialX.value + deltaX)
      const newWidth = initialWidth.value - deltaX
      if (newWidth > 20) {
        x = newX
        width = newWidth
      }
    }

    if (dir.includes('e')) {
      const newWidth = Math.max(20, initialWidth.value + deltaX)
      width = newWidth
    }

    if (props.selectedNodeId) {
      emit('update-node-position', props.selectedNodeId, { x, y })
      emit('update-node-size', props.selectedNodeId, { width, height })
    }
  }
}

function handleMouseUp(): void {
  isDragging.value = false
  isResizing.value = false
  resizeDirection.value = null
  rafPending = false

  // 停止跟踪位置
  stopTrackingPosition()

  emit('save-snapshot')

  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  document.removeEventListener('dragstart', handleDocumentDragStart)
  document.removeEventListener('dragend', handleDocumentDragEnd)
  document.removeEventListener('dragover', handleDocumentDragOver)
  document.removeEventListener('drop', handleDocumentDrop)
})

onMounted(() => {
  // 监听文档级的 dragstart/dragend 事件，获取正在拖拽的节点 ID
  document.addEventListener('dragstart', handleDocumentDragStart)
  document.addEventListener('dragend', handleDocumentDragEnd)
  // 监听文档级 dragover/drop，用于检测拖拽到 absolute 容器上方
  // （因为移除了 drop-zone 的 pointer-events，不能依赖事件冒泡）
  document.addEventListener('dragover', handleDocumentDragOver)
  document.addEventListener('drop', handleDocumentDrop)
})

/** 监听文档级 dragstart，获取正在拖拽的节点 ID */
function handleDocumentDragStart(e: DragEvent): void {
  // 从 dataTransfer 中获取节点 ID（DesignOverlay 在 dragstart 时设置的）
  // 同时尝试从 sessionStorage 获取（DesignOverlay 会在这里存储）
  let nodeId: string | undefined = e.dataTransfer?.getData('text/plain')
  if (!nodeId) {
    // 尝试从 sessionStorage 获取
    const stored = sessionStorage.getItem('dragging-node-id')
    nodeId = stored ?? undefined
  }
  if (nodeId) {
    draggingNodeId.value = nodeId
    sessionStorage.setItem('dragging-node-id', nodeId)
  }
}

/** 监听文档级 dragend，清理拖拽状态 */
function handleDocumentDragEnd(): void {
  draggingNodeId.value = null
  dragOverContainerId.value = null
  sessionStorage.removeItem('dragging-node-id')
}

/**
 * 监听文档级 dragover，通过坐标计算检测鼠标是否在 absolute 容器上方
 * 不依赖 pointer-events，避免拦截 DesignOverlay 的点击事件
 */
function handleDocumentDragOver(e: DragEvent): void {
  if (!draggingNodeId.value) return

  // 遍历所有 absolute 容器，检查鼠标坐标是否在容器内
  for (const container of absoluteContainerNodes.value) {
    const rect = getContainerBoundingRect(container)
    if (!rect) continue

    if (
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom
    ) {
      // 鼠标在容器内，更新 dragOverContainerId
      if (dragOverContainerId.value !== container['x-id']) {
        dragOverContainerId.value = container['x-id']
      }
      e.preventDefault()
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'move'
      }
      return
    }
  }

  // 鼠标不在任何 absolute 容器内，清除高亮
  if (dragOverContainerId.value !== null) {
    dragOverContainerId.value = null
  }
}

/**
 * 监听文档级 drop，通过坐标计算检测释放位置是否为 absolute 容器
 * 不依赖 pointer-events，避免拦截 DesignOverlay 的 drop 事件
 */
function handleDocumentDrop(e: DragEvent): void {
  if (!draggingNodeId.value) return

  // 遍历所有 absolute 容器，检查鼠标坐标是否在容器内
  for (const container of absoluteContainerNodes.value) {
    const rect = getContainerBoundingRect(container)
    if (!rect) continue

    if (
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom
    ) {
      // 鼠标在容器内，触发移动到容器
      e.preventDefault()
      emit('move-to-container', draggingNodeId.value, container['x-id']!)
      draggingNodeId.value = null
      dragOverContainerId.value = null
      sessionStorage.removeItem('dragging-node-id')
      return
    }
  }

  // 鼠标不在任何 absolute 容器内，清除状态（让 DesignOverlay 处理）
  draggingNodeId.value = null
  dragOverContainerId.value = null
  sessionStorage.removeItem('dragging-node-id')
}

/**
 * 获取 absolute 容器的实时 bounding rect（viewport 坐标）
 * 优先从 DOM 获取，降级使用 schema 值
 */
function getContainerBoundingRect(container: FieldSchema): DOMRect | null {
  const nodeId = container['x-id']
  if (!nodeId || !props.canvasEl) return null

  const el = props.canvasEl.querySelector<HTMLElement>(`[data-field-id="${nodeId}"]`)
  if (el) {
    return el.getBoundingClientRect()
  }

  // 降级：使用 schema 值 + scroll container 位置计算
  const pos = container['x-position']
  const scrollContainer = getScrollContainer()
  if (!scrollContainer || !pos) return null
  const scRect = scrollContainer.getBoundingClientRect()
  return new DOMRectReadOnly(
    scRect.left + (pos.x ?? 0),
    scRect.top + (pos.y ?? 0),
    pos.width ?? 200,
    pos.height ?? 100
  )
}
</script>

<style scoped>
.absolute-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: visible;
  z-index: 1000; /* 确保高于 canvas 和 DesignOverlay */
}

.absolute-overlay__item {
  position: absolute;
  border: 2px solid #409eff;
  background: rgba(64, 158, 255, 0.05);
  /* 对于容器节点，让内部子节点可以穿透接收事件 */
  pointer-events: none;
}

/* 容器节点特殊处理：只让边框区域可交互 */
.absolute-overlay__item--container {
  background: transparent;
  border-color: #409eff;
}

/* 确保操作按钮和缩放手柄可以接收事件 */
.absolute-overlay__item .absolute-overlay__actions,
.absolute-overlay__item .resize-handle {
  pointer-events: auto;
}

/* absolute 容器节点的 drop 接收区域 */
/* 注意：不设置 pointer-events:auto，让点击事件穿透到 DesignOverlay */
/* dragover/dragleave/drop 事件通过 document 级别监听处理（见 handleDocumentDrop） */
.absolute-overlay__drop-zone {
  position: absolute;
  box-sizing: border-box;
  /* pointer-events: none（默认），让点击穿透 */
  cursor: pointer;
  /* 默认透明，hover 时显示 */
  background: transparent;
  border: 1px dashed transparent;
  transition: border-color 0.15s, background 0.15s;
}

.absolute-overlay__drop-zone--active {
  border-color: #67c23a;
  background: rgba(103, 194, 58, 0.1);
}

/* absolute 容器内的 relative 子节点 overlay */
/* 注意：不设置 pointer-events:auto，让点击穿透到 DesignOverlay */
/* dragover/dragleave/drop 事件通过 document 级别监听处理 */
.absolute-overlay__relative-item {
  position: absolute;
  box-sizing: border-box;
  /* pointer-events: none（默认），让点击穿透 */
  cursor: pointer;
  border: 1px dashed transparent;
  transition: border-color 0.15s, background 0.15s;
  z-index: 500; /* 低于 absolute 容器 (1000)，高于普通 DesignOverlay (900) */
}

/* relative 子节点选中状态 */
.absolute-overlay__relative-item--selected {
  border-color: #409eff;
  background: rgba(64, 158, 255, 0.1);
}

/* 缩放手柄 */
.resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #409eff;
  border: 1px solid #fff;
  border-radius: 2px;
  z-index: 1001;
  transition: background 0.15s;
}

.resize-handle:hover {
  background: #66b1ff;
  transform: scale(1.2);
}

/* 拖拽/缩放期间禁用所有 transition，避免重绘卡顿 */
.absolute-overlay__item--dragging .resize-handle {
  transition: none !important;
}

.resize-handle--n {
  top: -5px;
  left: 50%;
  transform: translateX(-50%);
  cursor: n-resize;
}

.resize-handle--s {
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  cursor: s-resize;
}

.resize-handle--w {
  left: -5px;
  top: 50%;
  transform: translateY(-50%);
  cursor: w-resize;
}

.resize-handle--e {
  right: -5px;
  top: 50%;
  transform: translateY(-50%);
  cursor: e-resize;
}

.resize-handle--nw {
  top: -5px;
  left: -5px;
  cursor: nw-resize;
}

.resize-handle--ne {
  top: -5px;
  right: -5px;
  cursor: ne-resize;
}

.resize-handle--sw {
  bottom: -5px;
  left: -5px;
  cursor: sw-resize;
}

.resize-handle--se {
  bottom: -5px;
  right: -5px;
  cursor: se-resize;
}

/* 操作按钮 */
.absolute-overlay__actions {
  position: absolute;
  top: -32px;
  right: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  background: #409eff;
  border-radius: 4px;
  padding: 4px;
  white-space: nowrap;
}

.absolute-overlay__label {
  font-size: 12px;
  color: #fff;
  margin-right: 6px;
  line-height: 1;
}

.absolute-overlay__action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: #fff;
  cursor: pointer;
  border-radius: 2px;
  padding: 0;
  transition: background 0.15s;
}

/* 拖拽期间禁用操作按钮 transition */
.absolute-overlay__item--dragging .absolute-overlay__action-btn {
  transition: none !important;
}

.absolute-overlay__action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.absolute-overlay__action-btn--danger:hover {
  background: #f56c6c;
}
</style>
