<!--
  FreeCanvas.vue
  自由布局画布交互层 —— 负责拖拽移动 + 8 方向缩放
  
  职责：
  1. 监听选中节点的 DOM 元素，叠加拖拽和缩放手柄
  2. 拖拽节点位置时，更新 schema.x-free-position.x 和 .y
  3. 拖拽缩放手柄时，更新 schema.x-free-position.width 和 .height
-->
<template>
  <div
    class="free-canvas-overlay"
    :style="overlayStyle"
  >
    <!-- 选中节点的操作层 -->
    <template v-if="selectedNodeSchema">
      <div
        ref="overlayItemRef"
        class="free-canvas__overlay-item"
        :class="{ 'free-canvas__overlay-item--selected': true }"
        :style="itemStyle"
        @mousedown.stop="handleItemMouseDown"
      >
        <!-- 8 个缩放手柄（选中时显示） -->
        <!-- 北（上中） -->
        <div
          v-if="!isResizing"
          class="resize-handle resize-handle--n"
          @mousedown.stop="handleResizeStart('n', $event)"
        ></div>
        
        <!-- 南（下中） -->
        <div
          v-if="!isResizing"
          class="resize-handle resize-handle--s"
          @mousedown.stop="handleResizeStart('s', $event)"
        ></div>
        
        <!-- 西（左中） -->
        <div
          v-if="!isResizing"
          class="resize-handle resize-handle--w"
          @mousedown.stop="handleResizeStart('w', $event)"
        ></div>
        
        <!-- 东（右中） -->
        <div
          v-if="!isResizing"
          class="resize-handle resize-handle--e"
          @mousedown.stop="handleResizeStart('e', $event)"
        ></div>
        
        <!-- 西北（左上角） -->
        <div
          v-if="!isResizing"
          class="resize-handle resize-handle--nw"
          @mousedown.stop="handleResizeStart('nw', $event)"
        ></div>
        
        <!-- 东北（右上角） -->
        <div
          v-if="!isResizing"
          class="resize-handle resize-handle--ne"
          @mousedown.stop="handleResizeStart('ne', $event)"
        ></div>
        
        <!-- 西南（左下角） -->
        <div
          v-if="!isResizing"
          class="resize-handle resize-handle--sw"
          @mousedown.stop="handleResizeStart('sw', $event)"
        ></div>
        
        <!-- 东南（右下角） -->
        <div
          v-if="!isResizing"
          class="resize-handle resize-handle--se"
          @mousedown.stop="handleResizeStart('se', $event)"
        ></div>

        <!-- 操作按钮 -->
        <div class="free-canvas__actions">
          <span class="free-canvas__label">{{ selectedNodeSchema.title }}</span>
          
          <el-tooltip content="复制" placement="top">
            <button
              class="free-canvas__action-btn"
              @click.stop="$emit('duplicate-node', selectedNodeId)"
            >
              <el-icon><CopyDocument /></el-icon>
            </button>
          </el-tooltip>
          
          <el-tooltip content="删除" placement="top">
            <button
              class="free-canvas__action-btn free-canvas__action-btn--danger"
              @click.stop="$emit('remove-node', selectedNodeId)"
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
import { ref, computed, watch, onMounted, onUnmounted, type CSSProperties } from 'vue'
import { CopyDocument, Delete } from '@element-plus/icons-vue'
import type { PageSchema, FieldSchema } from '../types/schema'

// ============================================================
// Props & Emits
// ============================================================

interface Props {
  schema: PageSchema
  selectedNodeId: string | null
  /** 画布 DOM 容器（用于计算相对坐标） */
  canvasEl: HTMLElement | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'select-node', id: string): void
  (e: 'remove-node', id: string): void
  (e: 'duplicate-node', id: string): void
  (e: 'update-node-position', nodeId: string, updates: { x: number; y: number }): void
  (e: 'update-node-size', nodeId: string, updates: { width: number; height: number }): void
}>()

// ============================================================
// 状态
// ============================================================

const overlayItemRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const isResizing = ref(false)
const resizeDirection = ref<string | null>(null)

// 拖拽/缩放的起始位置
const startX = ref(0)
const startY = ref(0)

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
  
  // 查找对应的节点 schema
  function findNode(properties: Record<string, FieldSchema>): FieldSchema | null {
    for (const [, schema] of Object.entries(properties)) {
      if (schema['x-id'] === props.selectedNodeId) {
        return schema
      }
      if ('properties' in schema && schema.properties) {
        const found = findNode(schema.properties as Record<string, FieldSchema>)
        if (found) return found
      }
    }
    return null
  }
  
  if (props.schema?.schema?.properties) {
    return findNode(props.schema.schema.properties)
  }
  return null
})

const overlayStyle = computed<CSSProperties>(() => ({
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  overflow: 'hidden',
}))

const itemStyle = computed<CSSProperties>(() => {
  if (!selectedNodeSchema.value?.['x-free-position']) {
    return { display: 'none' }
  }
  
  const pos = selectedNodeSchema.value['x-free-position']
  return {
    position: 'absolute',
    left: `${pos.x}px`,
    top: `${pos.y}px`,
    width: `${pos.width}px`,
    height: `${pos.height}px`,
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
// 事件处理：拖拽位置
// ============================================================

function handleItemMouseDown(e: MouseEvent): void {
  if (isResizing.value) return
  
  const pos = selectedNodeSchema.value?.['x-free-position']
  if (!pos) return
  
  isDragging.value = true
  startX.value = e.clientX
  startY.value = e.clientY
  initialX.value = pos.x
  initialY.value = pos.y
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  
  e.preventDefault()
}

// ============================================================
// 事件处理：缩放
// ============================================================

function handleResizeStart(direction: string, e: MouseEvent): void {
  const pos = selectedNodeSchema.value?.['x-free-position']
  if (!pos) return
  
  isResizing.value = true
  resizeDirection.value = direction
  startX.value = e.clientX
  startY.value = e.clientY
  initialX.value = pos.x
  initialY.value = pos.y
  initialWidth.value = pos.width
  initialHeight.value = pos.height
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  
  e.preventDefault()
  e.stopPropagation()
}

function handleMouseMove(e: MouseEvent): void {
  if (!isDragging.value && !isResizing.value) return
  
  const deltaX = e.clientX - startX.value
  const deltaY = e.clientY - startY.value
  
  if (isDragging.value) {
    // 拖拽位置
    const newX = Math.max(0, initialX.value + deltaX)
    const newY = Math.max(0, initialY.value + deltaY)
    
    // 实时更新节点样式（通过直接修改 DOM）
    if (overlayItemRef.value) {
      overlayItemRef.value.style.left = `${newX}px`
      overlayItemRef.value.style.top = `${newY}px`
    }
    
    // 持久化到 schema
    if (props.selectedNodeId) {
      emit('update-node-position', props.selectedNodeId, { x: newX, y: newY })
    }
  } else if (isResizing.value && resizeDirection.value) {
    // 缩放尺寸
    let { width, height, x, y } = {
      width: initialWidth.value,
      height: initialHeight.value,
      x: initialX.value,
      y: initialY.value,
    }
    
    const dir = resizeDirection.value
    
    // 处理北方向（改变 y 和 height）
    if (dir.includes('n')) {
      const newY = Math.max(0, initialY.value + deltaY)
      const newHeight = initialHeight.value - deltaY
      if (newHeight > 20) {
        y = newY
        height = newHeight
      }
    }
    
    // 处理南方向（改变 height）
    if (dir.includes('s')) {
      const newHeight = Math.max(20, initialHeight.value + deltaY)
      height = newHeight
    }
    
    // 处理西方向（改变 x 和 width）
    if (dir.includes('w')) {
      const newX = Math.max(0, initialX.value + deltaX)
      const newWidth = initialWidth.value - deltaX
      if (newWidth > 20) {
        x = newX
        width = newWidth
      }
    }
    
    // 处理东方向（改变 width）
    if (dir.includes('e')) {
      const newWidth = Math.max(20, initialWidth.value + deltaX)
      width = newWidth
    }

    // 实时更新节点样式
    if (overlayItemRef.value) {
      overlayItemRef.value.style.left = `${x}px`
      overlayItemRef.value.style.top = `${y}px`
      overlayItemRef.value.style.width = `${width}px`
      overlayItemRef.value.style.height = `${height}px`
    }

    // 持久化到 schema
    if (props.selectedNodeId) {
      // 同时更新位置和大小
      emit('update-node-position', props.selectedNodeId, { x, y })
      emit('update-node-size', props.selectedNodeId, { width, height })
    }
  }
}

function handleMouseUp(): void {
  isDragging.value = false
  isResizing.value = false
  resizeDirection.value = null
  
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

// ============================================================
// 生命周期
// ============================================================

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})
</script>

<style scoped>
.free-canvas-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.free-canvas__overlay-item {
  position: absolute;
  border: 2px solid #409eff;
  background: rgba(64, 158, 255, 0.05);
  box-sizing: border-box;
}

.free-canvas__overlay-item--selected {
  z-index: 1000;
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
.free-canvas__actions {
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

.free-canvas__label {
  font-size: 12px;
  color: #fff;
  margin-right: 6px;
  line-height: 1;
}

.free-canvas__action-btn {
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

.free-canvas__action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.free-canvas__action-btn--danger:hover {
  background: #f56c6c;
}
</style>
