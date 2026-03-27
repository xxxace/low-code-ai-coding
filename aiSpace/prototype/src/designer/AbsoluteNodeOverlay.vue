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
    <!-- 选中节点的操作层 -->
    <template v-if="selectedNodeSchema">
      <div
        class="absolute-overlay__item"
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
import { ref, computed, onUnmounted } from 'vue'
import { CopyDocument, Delete } from '@element-plus/icons-vue'
import type { PageSchema, FieldSchema } from '../types/schema'

// ============================================================
// Props & Emits
// ============================================================

interface Props {
  schema: PageSchema
  selectedNodeId: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'select-node', id: string): void
  (e: 'remove-node', id: string): void
  (e: 'duplicate-node', id: string): void
  (e: 'update-node-position', nodeId: string, updates: { x: number; y: number }): void
  (e: 'update-node-size', nodeId: string, updates: { width: number; height: number }): void
  (e: 'save-snapshot'): void
}>()

// ============================================================
// 状态
// ============================================================

const overlayRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const isResizing = ref(false)
const resizeDirection = ref<string | null>(null)

// 拖拽/缩放的起始鼠标位置
const startMouseX = ref(0)
const startMouseY = ref(0)

// 节点的初始位置和尺寸
const initialX = ref(0)
const initialY = ref(0)
const initialWidth = ref(0)
const initialHeight = ref(0)

// ============================================================
// 计算属性
// ============================================================

const selectedNodeSchema = computed<FieldSchema | null>(() => {
  if (!props.selectedNodeId) return null
  return findNodeSchemaById(props.selectedNodeId)
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

const itemStyle = computed(() => {
  if (!selectedNodeSchema.value?.['x-position']) {
    return { display: 'none' }
  }

  const pos = selectedNodeSchema.value['x-position']
  return {
    position: 'absolute',
    left: `${pos.x ?? 0}px`,
    top: `${pos.y ?? 0}px`,
    width: `${pos.width ?? 200}px`,
    height: `${pos.height ?? 40}px`,
    pointerEvents: 'auto',
    cursor: isResizing.value ? getResizeCursor() : 'move',
    zIndex: pos.zIndex ?? 1,
  }
})

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

function handleItemMouseDown(e: MouseEvent): void {
  if (isResizing.value) return

  const pos = selectedNodeSchema.value?.['x-position']
  if (!pos) return

  isDragging.value = true
  startMouseX.value = e.clientX
  startMouseY.value = e.clientY
  initialX.value = pos.x ?? 0
  initialY.value = pos.y ?? 0

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)

  e.preventDefault()
  e.stopPropagation()
}

function handleResizeStart(direction: string, e: MouseEvent): void {
  const pos = selectedNodeSchema.value?.['x-position']
  if (!pos) return

  isResizing.value = true
  resizeDirection.value = direction
  startMouseX.value = e.clientX
  startMouseY.value = e.clientY
  initialX.value = pos.x ?? 0
  initialY.value = pos.y ?? 0
  initialWidth.value = pos.width ?? 200
  initialHeight.value = pos.height ?? 40

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)

  e.preventDefault()
  e.stopPropagation()
}

function handleMouseMove(e: MouseEvent): void {
  if (!isDragging.value && !isResizing.value) return

  const deltaX = e.clientX - startMouseX.value
  const deltaY = e.clientY - startMouseY.value

  if (isDragging.value) {
    const newX = Math.max(0, initialX.value + deltaX)
    const newY = Math.max(0, initialY.value + deltaY)

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

  emit('save-snapshot')

  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})
</script>

<style scoped>
.absolute-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.absolute-overlay__item {
  position: absolute;
  border: 2px solid #409eff;
  background: rgba(64, 158, 255, 0.05);
  box-sizing: border-box;
  pointer-events: auto;
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

.absolute-overlay__action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.absolute-overlay__action-btn--danger:hover {
  background: #f56c6c;
}
</style>
