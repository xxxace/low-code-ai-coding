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

    <!-- selectedBox（选中高亮 + 操作按钮 + 8 方向缩放手柄，非 dragging 时显示） -->
    <div
      v-if="selectedNodeId && !isDraggingNode"
      :key="`selected-${selectedNodeId}-${styleVersion}-${liveResizeVersion}`"
      class="canvas-overlay__selected-box"
      :style="getSelectedStyle(selectedNodeId)"
    >
      <!-- 操作按钮 -->
      <div
        class="action-buttons"
        :class="`action-buttons--${getToolbarPlacement(selectedNodeId)}`"
        :style="getToolbarAlignStyle(selectedNodeId)"
      >
        <span class="label">{{ getNodeLabel(selectedNodeId) }}</span>
        <!-- 上移/下移按钮（仅 relative 节点显示） -->
        <button v-if="!isSelectedNodeAbsolute" @click.stop="handleMoveNode('up')" title="上移">↑</button>
        <button v-if="!isSelectedNodeAbsolute" @click.stop="handleMoveNode('down')" title="下移">↓</button>
        <button @click.stop="$emit('duplicate-node', selectedNodeId)">
          <slot name="duplicate-icon">复制</slot>
        </button>
        <button class="danger" @click.stop="$emit('remove-node', selectedNodeId)">
          <slot name="delete-icon">删除</slot>
        </button>
      </div>

      <!-- 8 方向缩放手柄（仅 absolute 节点） -->
      <template v-if="isSelectedNodeAbsolute">
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

    <!-- draggingBox（absolute 节点拖拽时显示，跟随节点实时移动） -->
    <div
      v-if="isDraggingNode"
      ref="draggingBoxRef"
      class="canvas-overlay__dragging-box"
    />

    <!-- dropZoneIndicators（所有容器高亮，仅 drag 时渲染） -->
    <template v-if="dragState.isDragging">
      <div
        v-for="container in allContainers"
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
import { ref, computed, onMounted, onUnmounted, watch, toRef, type Ref, nextTick } from 'vue'
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
  'move-node': [nodeId: string, direction: 'up' | 'down']  // 新增：上移/下移
  'drag-start': [mode: 'mouse-drag' | 'html5-dnd']
  'drag-end': []
  'drop-complete': [target: any]
}

const emit = defineEmits<Emits>()

// ============================================================
// 状态
// ============================================================

const overlayRef = ref<HTMLElement | null>(null)
const draggingBoxRef = ref<HTMLElement | null>(null)

// ============================================================
// resize RAF 同步（fix: selectedBox 实时跟随 resize）
// ============================================================

const liveResizeVersion = ref(0)
let resizeSyncFrame: number | null = null

/** 是否正在 resize（用于 RAF 同步） */
const isResizingNode = computed(() =>
  dragState.isDragging && dragState.dragType === 'resize'
)

// ============================================================
// 辅助函数
// ============================================================

/**
 * 按 x-id 查找节点
 */
function getNodeById(nodeId: string): SchemaNode | null {
  return findNodeById(props.schema.schema, nodeId)
}

/**
 * 判断节点是否为 absolute 定位（新刺 6：改为 computed）
 */
const isSelectedNodeAbsolute = computed(() =>
  props.selectedNodeId ? isAbsoluteNode(props.selectedNodeId) : false
)

// ============================================================
// Composables
// ============================================================

const {
  hoverNodeId,
  getHoverStyle,
  getSelectedStyle,
  setupHoverListeners,
  cleanup: cleanupNodeOverlay,
} = useNodeOverlay(props, toRef(() => props.canvasEl), overlayRef)

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
} = useDragInteraction(
  props,
  emit,
  toRef(() => props.canvasEl),
  toRef(() => props.selectedNodeId)
)

// ============================================================
// 计算属性
// ============================================================

// 容器节点列表（包含所有容器：absolute 和 relative，表现一致）
const allContainers = computed<SchemaNode[]>(() => {
  const containers: SchemaNode[] = []

  function walk(properties: Record<string, SchemaNode>) {
    for (const node of Object.values(properties)) {
      // 所有容器节点（type=void）都显示 drop zone，排除自身
      if (
        node.type === 'void' &&
        (node as any)['x-id'] !== dragState.targetNodeId
      ) {
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

// ============================================================
// draggingBox RAF 同步（fix-1：解决 absolute 节点拖拽时 selectbox 不跟随的问题）
// ============================================================

/** 是否正在拖拽 absolute 节点（move 类型） */
const isDraggingNode = computed(() =>
  dragState.isDragging && dragState.dragType === 'move'
)

let rafId: number | null = null

function syncDraggingBox() {
  // 先调度下一帧：保证 guard return 后动画不终止；ref 还没 mounted 时 RAF 也会继续运行直到元素出现
  if (isDraggingNode.value) {
    rafId = requestAnimationFrame(syncDraggingBox)
  }

  if (!draggingBoxRef.value || !overlayRef.value || !props.canvasEl) {
    return
  }
  const nodeEl = props.canvasEl.querySelector<HTMLElement>(
    `[data-field-id="${dragState.targetNodeId}"]`
  )
  if (!nodeEl) {
    return
  }
  const nodeRect = nodeEl.getBoundingClientRect()
  const overlayRect = overlayRef.value.getBoundingClientRect()

  draggingBoxRef.value.style.left = `${nodeRect.left - overlayRect.left}px`
  draggingBoxRef.value.style.top = `${nodeRect.top - overlayRect.top}px`
  draggingBoxRef.value.style.width = `${nodeRect.width}px`
  draggingBoxRef.value.style.height = `${nodeRect.height}px`
}

watch(
  () => isDraggingNode.value,
  (dragging) => {
    if (dragging) {
      // 开始拖拽：立即同步一次，然后启动 RAF 循环
      rafId = requestAnimationFrame(syncDraggingBox)
    } else {
      // 结束拖拽：停止 RAF
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    }
  }
)

// ============================================================
// resize RAF 同步（fix: selectedBox 实时跟随 resize）
// ============================================================

watch(
  () => isResizingNode.value,
  (resizing) => {
    if (resizing) {
      // 开始 resize：启动 RAF 循环同步 selectedBox
      const sync = () => {
        liveResizeVersion.value++
        resizeSyncFrame = requestAnimationFrame(sync)
      }
      resizeSyncFrame = requestAnimationFrame(sync)
    } else {
      // 结束 resize：停止 RAF
      if (resizeSyncFrame !== null) {
        cancelAnimationFrame(resizeSyncFrame)
        resizeSyncFrame = null
      }
    }
  }
)

const dropIndicatorStyle = computed(() => {
  if (!dropTarget.value || dropTarget.value.action !== 'sort-relative') {
    return null
  }

  const { beforeNodeId, position } = dropTarget.value
  if (!beforeNodeId) return null

  if (!overlayRef.value || !props.canvasEl) return null
  const el = props.canvasEl.querySelector<HTMLElement>(`[data-field-id="${beforeNodeId}"]`)
  if (!el) return null

  // 坐标参考基点改为 overlayRef（新刺 2）
  const overlayRect = overlayRef.value.getBoundingClientRect()
  const nodeRect = el.getBoundingClientRect()

  const top = position === 'before'
    ? nodeRect.top - overlayRect.top - 2
    : nodeRect.bottom - overlayRect.top + 1

  return {
    position: 'absolute',
    left: `${nodeRect.left - overlayRect.left}px`,
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
  if (!node) return '未知'
  // 优先读 title（字段标签），再读 x-decorator-props.label，
  // 最后读 x-component 但映射成中文友好名，避免显示英文组件名
  const title = (node as any).title
  if (title) return title
  const decoratorLabel = (node as any)?.['x-decorator-props']?.label
  if (decoratorLabel) return decoratorLabel
  const componentName = (node as any)?.['x-component'] as string | undefined
  // 简单映射常见组件名到中文
  const componentLabelMap: Record<string, string> = {
    Input: '输入框',
    Select: '下拉选择',
    DatePicker: '日期选择',
    TimePicker: '时间选择',
    Switch: '开关',
    Checkbox: '多选框',
    Radio: '单选框',
    InputNumber: '数字输入',
    Upload: '上传',
    Rate: '评分',
    Slider: '滑块',
    ColorPicker: '颜色选择',
    Cascader: '级联选择',
    TreeSelect: '树形选择',
    CardContainer: '卡片容器',
    TabsContainer: '标签页容器',
    CollapseContainer: '折叠面板',
    Divider: '分割线',
  }
  if (componentName && componentLabelMap[componentName]) {
    return componentLabelMap[componentName]
  }
  return componentName ?? '未知'
}

/**
 * 计算 toolbar 的定位方向和水平对齐方式
 * - 垂直：节点距 overlay 顶部不足 36px 时翻转到节点内部
 * - 水平：通过 CSS `right: 0` 默认右对齐，超出左边界时改为左对齐（由 getToolbarAlignStyle 处理）
 */
function getToolbarPlacement(nodeId: string): 'above' | 'inside' {
  if (!overlayRef.value || !props.canvasEl) return 'above'
  const el = props.canvasEl.querySelector<HTMLElement>(`[data-field-id="${nodeId}"]`)
  if (!el) return 'above'
  const overlayRect = overlayRef.value.getBoundingClientRect()
  const nodeRect = el.getBoundingClientRect()
  const spaceAbove = nodeRect.top - overlayRect.top
  return spaceAbove < 36 ? 'inside' : 'above'
}

/**
 * 计算 toolbar 水平对齐方式
 * 默认右对齐（right: 0），当 toolbar 超出 overlay 左边界时切换为左对齐（left: 0）
 */
function getToolbarAlignStyle(nodeId: string): Record<string, string> {
  if (!overlayRef.value || !props.canvasEl) return {}
  const el = props.canvasEl.querySelector<HTMLElement>(`[data-field-id="${nodeId}"]`)
  if (!el) return {}

  const overlayRect = overlayRef.value.getBoundingClientRect()
  const nodeRect = el.getBoundingClientRect()

  // 找到已渲染的 toolbar DOM 元素来获取其实际宽度
  const toolbarEl = overlayRef.value.querySelector<HTMLElement>('.action-buttons')
  if (!toolbarEl) return {}

  const toolbarWidth = toolbarEl.offsetWidth
  // toolbar 用 right: 0 定位时，左边缘位置
  const toolbarLeftEdge = nodeRect.left - overlayRect.left + nodeRect.width - toolbarWidth
  // toolbar 超出 overlay 左边界
  if (toolbarLeftEdge < 0) {
    return { left: '0', right: 'auto' }
  }
  return {}
}

function getContainerStyle(container: SchemaNode) {
  const nodeId = (container as any)['x-id']
  if (!overlayRef.value || !props.canvasEl) return { display: 'none' }
  const el = props.canvasEl.querySelector<HTMLElement>(`[data-field-id="${nodeId}"]`)
  if (!el) return { display: 'none' }

  // 坐标参考基点改为 overlayRef（新刺 2）
  const overlayRect = overlayRef.value.getBoundingClientRect()
  const nodeRect = el.getBoundingClientRect()

  return {
    position: 'absolute',
    left: `${nodeRect.left - overlayRect.left}px`,
    top: `${nodeRect.top - overlayRect.top}px`,
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
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  if (resizeSyncFrame !== null) {
    cancelAnimationFrame(resizeSyncFrame)
    resizeSyncFrame = null
  }
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

// ============================================================
// 监听选中节点变化，强制重新计算 selectedBox 位置（fix: 排序/拖拽后位置不更新）
// ============================================================

// ============================================================
// 辅助函数
// ============================================================

/**
 * 处理节点上移/下移按钮点击
 * 在 emit 事件后刷新 selectedBox 位置
 */
function handleMoveNode(direction: 'up' | 'down') {
  if (!props.selectedNodeId) return
  emit('move-node', props.selectedNodeId, direction)
  // 延迟刷新，等待父组件更新 schema 和 DOM
  nextTick(() => {
    refreshSelectedBox()
  })
}

watch(
  () => props.selectedNodeId,
  async () => {
    // 等待 DOM 更新完成后再重新计算位置
    await nextTick()
    // 修复问题2：使用 setTimeout(0) 确保 FormRenderer 已渲染新节点
    // nextTick() 只等待当前 microtask 队列，setTimeout(0) 在下一帧之后执行
    // 这样可以确保 FormRenderer 有足够时间渲染新节点到 DOM
    setTimeout(() => {
      if (props.selectedNodeId) {
        getSelectedStyle(props.selectedNodeId)
      }
    }, 0)
  }
)

// ============================================================
// 样式版本计数器（fix: 强制重新计算 selectedBox 样式）
// ============================================================

const styleVersion = ref(0)

// ============================================================
// 监听 schema 变化，强制重新计算 selectedBox 位置（fix: 节点位置变化后更新）
// ============================================================

watch(
  () => props.schema,
  async () => {
    await nextTick()
    // 递增版本号，触发样式重新计算
    styleVersion.value++
    // 修复问题1：强制 allContainers computed 重新执行
    // 因为 props.schema 是快照而非响应式引用，
    // 需要显式触发依赖 schema 的 computed 更新
    void allContainers.value
  },
  { deep: true }
)

// 提供给子组件使用的刷新方法
function refreshSelectedBox() {
  styleVersion.value++
}
</script>

<style scoped>
/* CanvasOverlay 主容器：不拦截任何鼠标事件 */
.canvas-overlay {
  pointer-events: none;
  position: absolute;
  inset: 0;
  z-index: 9999;
  overflow: visible;  /* 允许 toolbar 溢出画布边界显示 */
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

/* draggingBox：absolute 节点拖拽时跟随节点移动的实时遮罩（fix-1） */
.canvas-overlay__dragging-box {
  pointer-events: none;
  position: absolute;
  border: 2px solid #409eff;
  background: rgba(64, 158, 255, 0.08);
  box-sizing: border-box;
}

/* 操作按钮区域：需要拦截点击 */
/* 紧贴 selectedBox 顶部边缘，右对齐，无间距 */
.action-buttons {
  pointer-events: auto;
  display: inline-flex;          /* 宽度由内容决定 */
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: #409eff;
  border-radius: 0;             /* 方形，与 selectedBox 边框贴合 */
  position: absolute;
  right: 0;                     /* 右对齐 selectedBox 右边缘 */
  white-space: nowrap;
  box-shadow: none;
  z-index: 20;
}

/* 默认：toolbar 在节点上方，紧贴 selectedBox 顶边 */
.action-buttons--above {
  top: -26px;
}

/* 翻转：节点靠近画布顶边时，toolbar 显示在节点内部顶部，紧贴顶边 */
.action-buttons--inside {
  top: 0;
}

.label {
  font-size: 11px;
  font-weight: 500;
  color: #fff;
  margin-right: 2px;
  max-width: 120px;              /* 超长 label 截断，不让 toolbar 撑太宽 */
  overflow: hidden;
  text-overflow: ellipsis;
}

.action-buttons button {
  border: none;
  background: transparent;
  color: #fff;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 2px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  font-size: 13px;
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
  border: 2px solid #67c23a;
  background: rgba(103, 194, 58, 0.08);
  box-shadow: inset 0 0 8px rgba(103, 194, 58, 0.15);
}

/* drop 指示线 */
.drop-indicator {
  pointer-events: none;
  z-index: 10000;
}
</style>
