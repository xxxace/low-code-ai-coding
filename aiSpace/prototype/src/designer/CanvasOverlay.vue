<!--
  CanvasOverlay.vue
  单例 Overlay 主组件 —— 渲染 ≤3 个 DOM（hoverBox + selectedBox + dropZoneIndicators）

  架构原则：
  - 设计器和渲染器是两套完全分离的组件树
  - CanvasOverlay 只存在于 LowcodeDesigner 组件树中
  - FormRenderer 组件树中不存在任何 overlay 逻辑

  DOM 数量：
  - hoverBox（1 个）
  - selectedBox（1 个）
  - dropZoneIndicators（N 个，仅在 drag 时渲染）

  Composables：
  - useNodeOverlay：负责 hoverBox + selectedBox 渲染
  - useDragInteraction：负责 drag/resize/sort/DnD + 选中逻辑
-->

<template>
  <div ref="overlayRef" class="canvas-overlay">
    <!-- hoverBox（hover 高亮） -->
    <div
      v-if="hoverNodeId"
      class="canvas-overlay__hover-box"
      :style="getHoverStyle(hoverNodeId)"
    />

    <!-- selectedBox（选中高亮 + 操作按钮 + 8 方向缩放手柄） -->
    <div
      v-if="selectedNodeId"
      class="canvas-overlay__selected-box"
      :style="getSelectedStyle(selectedNodeId)"
    >
      <!-- 操作按钮 -->
      <div class="action-buttons">
        <span class="label">{{ getNodeLabel(selectedNodeId) }}</span>
        <button @click.stop="$emit('duplicate-node', selectedNodeId)">
          <slot name="duplicate-icon">复制</slot>
        </button>
        <button class="danger" @click.stop="$emit('remove-node', selectedNodeId)">
          <slot name="delete-icon">删除</slot>
        </button>
      </div>

      <!-- 8 方向缩放手柄（仅 absolute 节点） -->
      <template v-if="isAbsoluteNode(selectedNodeId)">
        <div data-resize-dir="n" class="resize-handle resize-handle--n" @mousedown.stop="handleResizeStart" />
        <div data-resize-dir="s" class="resize-handle resize-handle--s" @mousedown.stop="handleResizeStart" />
        <div data-resize-dir="w" class="resize-handle resize-handle--w" @mousedown.stop="handleResizeStart" />
        <div data-resize-dir="e" class="resize-handle resize-handle--e" @mousedown.stop="handleResizeStart" />
        <div data-resize-dir="nw" class="resize-handle resize-handle--nw" @mousedown.stop="handleResizeStart" />
        <div data-resize-dir="ne" class="resize-handle resize-handle--ne" @mousedown.stop="handleResizeStart" />
        <div data-resize-dir="sw" class="resize-handle resize-handle--sw" @mousedown.stop="handleResizeStart" />
        <div data-resize-dir="se" class="resize-handle resize-handle--se" @mousedown.stop="handleResizeStart" />
      </template>
    </div>

    <!-- dropZoneIndicators（absolute 容器高亮，仅 drag 时渲染） -->
    <template v-if="dragState.isDragging">
      <div
        v-for="container in absoluteContainers"
        :key="container['x-id']"
        class="drop-zone-indicator"
        :class="{ 'drop-zone-indicator--active': dropTarget?.targetContainerId === container['x-id'] }"
        :style="getContainerStyle(container) as any"
      />
    </template>

    <!-- drop 指示线（relative 节点排序时） -->
    <div
      v-if="dropIndicatorStyle"
      class="drop-indicator"
      :style="dropIndicatorStyle as any"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, toRef, type Ref } from 'vue'
import type { PageSchema, SchemaNode } from '../core/schema'
import { findNodeById } from './engine/schemaUtils'
import { useNodeOverlay } from './composables/useNodeOverlay'
import { useDragInteraction } from './composables/useDragInteraction'

// ============================================================
// Props & Emits
// ============================================================

interface Props {
  schema: PageSchema
  selectedNodeId: string | null
  canvasEl: HTMLElement | null
  interactionMode: 'idle' | 'mouse-drag' | 'html5-dnd'
}

const props = defineProps<Props>()

interface Emits {
  'select-node': [nodeId: string | null]
  'remove-node': [nodeId: string]
  'duplicate-node': [nodeId: string]
  'update-node-position': [nodeId: string, position: { x: number; y: number }]
  'update-node-size': [nodeId: string, size: { width: number; height: number }]
  'sort-nodes': [params: { fromId: string; toId: string; position: 'before' | 'after' }]
  'move-node-to-container': [nodeId: string, containerId: string]
  'drag-start': [mode: 'mouse-drag' | 'html5-dnd']
  'drag-end': []
  'drop-complete': [target: any]
}

const emit = defineEmits<Emits>()

// ============================================================
// 状态
// ============================================================

const overlayRef = ref<HTMLElement | null>(null)

// ============================================================
// 辅助函数
// ============================================================

/**
 * 按 x-id 查找节点
 */
function getNodeById(nodeId: string): SchemaNode | null {
  return findNodeById(props.schema.schema, nodeId)
}

// ============================================================
// Composables
// ============================================================

const {
  hoverNodeId,
  getHoverStyle,
  getSelectedStyle,
  setupHoverListeners,
  cleanup: cleanupNodeOverlay,
} = useNodeOverlay(props, toRef(() => props.canvasEl))

const {
  dragState,
  dropTarget,
  handleMouseDown,
  handleResizeStart,
  handleDragEnter,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  setupDragListeners,
  cleanup: cleanupDrag,
} = useDragInteraction(props, emit, toRef(() => props.canvasEl))

// ============================================================
// 计算属性
// ============================================================

const absoluteContainers = computed<SchemaNode[]>(() => {
  const containers: SchemaNode[] = []

  function walk(properties: Record<string, SchemaNode>) {
    for (const node of Object.values(properties)) {
      if ((node as any)['x-position-type'] === 'absolute' && node.type === 'void') {
        containers.push(node)
      }
      if ('properties' in node && node.properties) {
        walk(node.properties as Record<string, SchemaNode>)
      }
    }
  }

  walk(props.schema.schema.properties)


  return containers
})

const dropIndicatorStyle = computed(() => {
  if (!dropTarget.value || dropTarget.value.action !== 'sort-relative') {
    return null
  }

  const { beforeNodeId, position } = dropTarget.value
  if (!beforeNodeId) return null

  const el = props.canvasEl?.querySelector<HTMLElement>(`[data-field-id="${beforeNodeId}"]`)
  if (!el) return null

  if (!props.canvasEl) return null
  const canvasRect = props.canvasEl.getBoundingClientRect()
  const nodeRect = el.getBoundingClientRect()

  const top = position === 'before'
    ? nodeRect.top - canvasRect.top - 2
    : nodeRect.bottom - canvasRect.top + 1

  return {
    position: 'absolute',
    left: `${nodeRect.left - canvasRect.left}px`,
    top: `${top}px`,
    width: `${nodeRect.width}px`,
    height: '2px',
    background: '#409eff',
    pointerEvents: 'none',
  }
})

// ============================================================
// 辅助函数
// ============================================================

function isAbsoluteNode(nodeId: string): boolean {
  const node = getNodeById(nodeId)
  return (node as any)?.['x-position-type'] === 'absolute'
}

function getNodeLabel(nodeId: string): string {
  const node = getNodeById(nodeId)
  return (node as any)?.title ?? (node as any)?.['x-component'] ?? '未知'
}

function getContainerStyle(container: SchemaNode) {
  const nodeId = (container as any)['x-id']
  const el = props.canvasEl?.querySelector<HTMLElement>(`[data-field-id="${nodeId}"]`)
  if (!el) return { display: 'none' }

  if (!props.canvasEl) return { display: 'none' }
  const canvasRect = props.canvasEl.getBoundingClientRect()
  const nodeRect = el.getBoundingClientRect()

  return {
    position: 'absolute',
    left: `${nodeRect.left - canvasRect.left}px`,
    top: `${nodeRect.top - canvasRect.top}px`,
    width: `${nodeRect.width}px`,
    height: `${nodeRect.height}px`,
    border: '1px dashed #67c23a',
    background: 'transparent',
    pointerEvents: 'none',
  }
}

// ============================================================
// 生命周期
// ============================================================

onMounted(() => {
  setupHoverListeners()
  setupDragListeners()
})

onUnmounted(() => {
  cleanupNodeOverlay()
  cleanupDrag()
})

// ============================================================
// 监听 canvasEl 变化
// ============================================================

watch(
  () => props.canvasEl,
  (newEl) => {
    cleanupNodeOverlay()
    cleanupDrag()
    if (newEl) {
      setupHoverListeners()
      setupDragListeners()
    }
  }
)

// ============================================================
// 监听 dropTarget 变化
// ============================================================

watch(
  dropTarget,
  (target) => {
    if (target && target.action === 'sort-relative') {
      // relative 排序，emit 到父组件
      // 实际的 drop 处理由 handleMouseUp 完成
    }
  }
)
</script>

<style scoped>
/* CanvasOverlay 主容器：不拦截任何鼠标事件 */
.canvas-overlay {
  pointer-events: none;
  position: absolute;
  inset: 0;
  z-index: 9999;
}

/* hoverBox：透明，只显示边框，不拦截事件 */
.canvas-overlay__hover-box {
  pointer-events: none;
  border: 1px solid rgba(59, 130, 246, 0.5);
  background: transparent;
}

/* selectedBox：包含操作按钮，需要拦截 */
.canvas-overlay__selected-box {
  pointer-events: none;
  border: 2px solid #409eff;
  background: rgba(64, 158, 255, 0.06);
}

/* 操作按钮区域：需要拦截点击 */
.action-buttons {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #409eff;
  border-radius: 4px;
  position: absolute;
  top: -32px;
  right: 0;
}

.label {
  font-size: 11px;
  color: #fff;
  margin-right: 4px;
}

.action-buttons button {
  border: none;
  background: transparent;
  color: #fff;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 2px;
}

.action-buttons button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.action-buttons button.danger:hover {
  background: #f56c6c;
}

/* 8 方向缩放手柄：需要拦截 resize 拖拽 */
.resize-handle {
  pointer-events: auto;
  position: absolute;
  width: 8px;
  height: 8px;
  background: #409eff;
  border: 1px solid #fff;
  border-radius: 2px;
  z-index: 10;
}

.resize-handle--n {
  top: -4px;
  left: 50%;
  transform: translateX(-50%);
  cursor: n-resize;
}

.resize-handle--s {
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  cursor: s-resize;
}

.resize-handle--w {
  left: -4px;
  top: 50%;
  transform: translateY(-50%);
  cursor: w-resize;
}

.resize-handle--e {
  right: -4px;
  top: 50%;
  transform: translateY(-50%);
  cursor: e-resize;
}

.resize-handle--nw {
  top: -4px;
  left: -4px;
  cursor: nw-resize;
}

.resize-handle--ne {
  top: -4px;
  right: -4px;
  cursor: ne-resize;
}

.resize-handle--sw {
  bottom: -4px;
  left: -4px;
  cursor: sw-resize;
}

.resize-handle--se {
  bottom: -4px;
  right: -4px;
  cursor: se-resize;
}

/* drop-zone 指示器：不拦截 */
.drop-zone-indicator {
  pointer-events: none;
  border: 1px dashed #67c23a;
  background: transparent;
}

.drop-zone-indicator--active {
  background: rgba(103, 194, 58, 0.1);
}

/* drop 指示线 */
.drop-indicator {
  pointer-events: none;
  z-index: 10000;
}
</style>
