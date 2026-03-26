<!-- 
  DesignOverlay.vue
  设计器画布叠加层 —— DOM 坐标感知的选中高亮 + 操作按钮
  
  实现策略：
  1. 通过 MutationObserver + ResizeObserver 监听画布内 DOM 变化
  2. 对每个带 data-field-id 的节点，计算相对于画布容器的坐标
  3. 在叠加层上以 position:absolute 绘制高亮框和操作按钮
  4. hover / click 交互直接绑定在叠加层

  为什么不用全透明遮罩方案？
  - 原因：全透明遮罩会拦截所有事件，嵌套容器的点击无法穿透
  - 本方案每个 overlay-item 的 pointer-events 独立控制
-->
<template>
  <div
    ref="overlayRef"
    class="design-overlay"
    @mouseleave="handleMouseLeave"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
  >
    <!-- 每个字段节点的叠加框 -->
    <template v-for="item in overlayItems" :key="item.nodeId">
      <div
        class="design-overlay__item"
        :class="{
          'design-overlay__item--selected': item.nodeId === selectedNodeId,
          'design-overlay__item--hovered': item.nodeId === hoveredNodeId && item.nodeId !== selectedNodeId,
          'design-overlay__item--container': item.isContainer,
          'design-overlay__item--draggable': isFreeLayout && item.nodeId === selectedNodeId,
          'design-overlay__item--drag-over': dragOverNodeId === item.nodeId && dragNodeId !== item.nodeId,
        }"
        :style="item.style"
        :draggable="!isFreeLayout"
        @mouseenter.stop="handleItemHover(item.nodeId)"
        @click.stop="handleItemClick(item.nodeId)"
        @mousedown.stop="handleItemMouseDown(item.nodeId, $event)"
        @dragstart.stop="handleDragStart(item.nodeId, $event)"
        @dragend.stop="handleDragEnd"
        @dragover.prevent.stop="handleDragOver(item.nodeId, $event)"
        @dragleave.stop="handleDragLeave(item.nodeId)"
        @drop.stop="handleDrop(item.nodeId)"
      >
        <!-- 自由布局：8个缩放手柄（仅选中时显示） -->
        <template v-if="isFreeLayout && item.nodeId === selectedNodeId">
          <!-- 上中 -->
          <div class="resize-handle resize-handle--n" @mousedown.stop="handleResizeStart(item.nodeId, 'n', $event)"></div>
          <!-- 下中 -->
          <div class="resize-handle resize-handle--s" @mousedown.stop="handleResizeStart(item.nodeId, 's', $event)"></div>
          <!-- 左中 -->
          <div class="resize-handle resize-handle--w" @mousedown.stop="handleResizeStart(item.nodeId, 'w', $event)"></div>
          <!-- 右中 -->
          <div class="resize-handle resize-handle--e" @mousedown.stop="handleResizeStart(item.nodeId, 'e', $event)"></div>
          <!-- 左上 -->
          <div class="resize-handle resize-handle--nw" @mousedown.stop="handleResizeStart(item.nodeId, 'nw', $event)"></div>
          <!-- 右上 -->
          <div class="resize-handle resize-handle--ne" @mousedown.stop="handleResizeStart(item.nodeId, 'ne', $event)"></div>
          <!-- 左下 -->
          <div class="resize-handle resize-handle--sw" @mousedown.stop="handleResizeStart(item.nodeId, 'sw', $event)"></div>
          <!-- 右下 -->
          <div class="resize-handle resize-handle--se" @mousedown.stop="handleResizeStart(item.nodeId, 'se', $event)"></div>
        </template>

        <!-- 操作按钮（选中时显示）—— 四向边界感知，始终显示在画布内 -->
        <div
          v-if="item.nodeId === selectedNodeId"
          class="design-overlay__actions"
          :style="getActionsStyle(item)"
        >
          <!-- 节点类型标签 -->
          <span class="design-overlay__label">{{ item.label }}</span>

          <!-- 流式布局：上移下移按钮 -->
          <template v-if="!isFreeLayout">
            <el-tooltip content="上移" placement="top" :show-after="500">
              <button
                class="design-overlay__action-btn"
                @click.stop="$emit('move-node', item.nodeId, 'up')"
              >
                <el-icon><ArrowUp /></el-icon>
              </button>
            </el-tooltip>

            <el-tooltip content="下移" placement="top" :show-after="500">
              <button
                class="design-overlay__action-btn"
                @click.stop="$emit('move-node', item.nodeId, 'down')"
              >
                <el-icon><ArrowDown /></el-icon>
              </button>
            </el-tooltip>
          </template>

          <!-- 复制 -->
          <el-tooltip content="复制" placement="top" :show-after="500">
            <button
              class="design-overlay__action-btn"
              @click.stop="$emit('duplicate-node', item.nodeId)"
            >
              <el-icon><CopyDocument /></el-icon>
            </button>
          </el-tooltip>

          <!-- 删除 -->
          <el-tooltip content="删除" placement="top" :show-after="500">
            <button
              class="design-overlay__action-btn design-overlay__action-btn--danger"
              @click.stop="$emit('remove-node', item.nodeId)"
            >
              <el-icon><Delete /></el-icon>
            </button>
          </el-tooltip>
        </div>

        <!-- hover 时显示简单标签 -->
        <div
          v-else-if="item.nodeId === hoveredNodeId"
          class="design-overlay__hover-label"
        >
          {{ item.label }}
        </div>
      </div>
    </template>

    <!-- 拖拽放置指示线 -->
    <div
      v-if="dropIndicator"
      class="design-overlay__drop-indicator"
      :style="dropIndicator.style"
    />
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  onMounted,
  onUnmounted,
  nextTick,
  type CSSProperties,
} from 'vue'
import { ArrowUp, ArrowDown, Delete, CopyDocument } from '@element-plus/icons-vue'
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
  (e: 'move-node', id: string, direction: 'up' | 'down'): void
  (e: 'update-node-position', nodeId: string, updates: { x: number; y: number }): void
  (e: 'update-node-size', nodeId: string, updates: { width: number; height: number }): void
  (e: 'reorder-nodes', fromId: string, toId: string): void
}>()

// ============================================================
// 操作栏四向边界感知
// ============================================================

/**
 * 计算操作栏的 position style，使其始终在画布可见区域内
 *
 * 策略：
 * - 默认贴字段顶边上方（top: -32px）
 * - 顶部不足时贴字段底边下方
 * - 水平方向：默认右对齐（right: 0），若右侧空间不足则改左对齐（left: 0）
 *   若字段太靠左导致操作栏溢出左侧，则用 left: 0 保证不超出画布左边
 */
function getActionsStyle(item: OverlayItem): CSSProperties {
  // 操作栏估算宽度（字段名 + 4个按钮）
  const ACTIONS_W = 160
  const ACTIONS_H = 30

  const canvasW = props.canvasEl?.offsetWidth ?? 0
  const canvasH = props.canvasEl?.offsetHeight ?? 0

  const itemLeft = parseFloat(item.style.left as string) || 0
  const itemTop = parseFloat(item.style.top as string) || 0
  const itemW = parseFloat(item.style.width as string) || 0

  // ---- 垂直方向 ----
  // 字段顶部到画布顶部不足 ACTIONS_H，则放到下方
  const showBelow = itemTop < ACTIONS_H
  const verticalStyle: CSSProperties = showBelow
    ? { top: '100%', bottom: 'auto', marginTop: '2px', marginBottom: '0' }
    : { bottom: '100%', top: 'auto', marginBottom: '2px', marginTop: '0' }

  // ---- 水平方向 ----
  // 字段右边缘在画布内，优先右对齐（right: 0 相对字段右侧）
  // 但如果字段自身宽度不够 ACTIONS_W（字段太窄或太靠左），
  // 就检查字段左边缘 + ACTIONS_W 是否超出画布右边缘
  const rightEdge = itemLeft + itemW
  let horizontalStyle: CSSProperties

  if (itemLeft < 0) {
    // 字段左边超出画布左侧（极端情况），贴左边
    horizontalStyle = { left: '0', right: 'auto' }
  } else if (rightEdge < ACTIONS_W) {
    // 字段太靠左，如果右对齐操作栏会溢出左侧，改左对齐
    horizontalStyle = { left: '0', right: 'auto' }
  } else if (canvasW > 0 && rightEdge > canvasW) {
    // 字段超出画布右侧，贴右边
    horizontalStyle = { right: '0', left: 'auto' }
  } else {
    // 正常情况：操作栏右对齐字段右边缘
    // 检查左溢出：字段右边缘 - ACTIONS_W < 0，说明会溢出左侧
    if (rightEdge - ACTIONS_W < 0) {
      horizontalStyle = { left: '0', right: 'auto' }
    } else {
      horizontalStyle = { right: '0', left: 'auto' }
    }
  }

  return {
    position: 'absolute',
    ...verticalStyle,
    ...horizontalStyle,
    zIndex: 1000,
  }
}

// ============================================================
// 状态
// ============================================================

const overlayRef = ref<HTMLElement | null>(null)
const hoveredNodeId = ref<string | null>(null)
const dropIndicator = ref<{ style: CSSProperties } | null>(null)

// overlayItems: 每个字段节点对应的 DOM 坐标信息
interface OverlayItem {
  nodeId: string
  label: string
  isContainer: boolean
  style: CSSProperties
}

const overlayItems = ref<OverlayItem[]>([])

// ============================================================
// 扁平化 Schema 节点（用于 DOM 查找）
// ============================================================

interface FlatNode {
  id: string
  label: string
  isContainer: boolean
}

const flatNodes = computed<FlatNode[]>(() => {
  const nodes: FlatNode[] = []

  function walk(properties: Record<string, FieldSchema>) {
    for (const [, schema] of Object.entries(properties)) {
      if (schema['x-id']) {
        nodes.push({
          id: schema['x-id'],
          label: schema.title ?? schema['x-component'] ?? '未知',
          isContainer: schema.type === 'void' || schema.type === 'object',
        })
      }
      if ('properties' in schema && schema.properties) {
        walk(schema.properties as Record<string, FieldSchema>)
      }
    }
  }

  if (props.schema?.schema?.properties) {
    walk(props.schema.schema.properties)
  }
  return nodes
})

// ============================================================
// 核心：DOM 坐标计算
// ============================================================

function refreshOverlay(): void {
  if (!props.canvasEl) return
  // 优先使用 overlayRef 的父容器作为坐标参考（更精准）
  const referenceEl = overlayRef.value?.parentElement ?? props.canvasEl

  const canvasRect = referenceEl.getBoundingClientRect()
  const items: OverlayItem[] = []

  for (const node of flatNodes.value) {
    // 通过 data-field-id 属性查找 DOM 节点
    const el = props.canvasEl.querySelector<HTMLElement>(
      `[data-field-id="${node.id}"]`
    )
    if (!el) continue

    const elRect = el.getBoundingClientRect()

    // 计算相对于 overlay 父容器的坐标（考虑滚动）
    const scrollTop = referenceEl.scrollTop ?? 0
    const scrollLeft = referenceEl.scrollLeft ?? 0
    const relLeft = elRect.left - canvasRect.left + scrollLeft
    const relTop = elRect.top - canvasRect.top + scrollTop

    items.push({
      nodeId: node.id,
      label: node.label,
      isContainer: node.isContainer,
      style: {
        position: 'absolute',
        left: `${relLeft}px`,
        top: `${relTop}px`,
        width: `${elRect.width}px`,
        height: `${elRect.height}px`,
      },
    })
  }

  overlayItems.value = items
}

// ============================================================
// 监听 DOM 变化（MutationObserver）
// ============================================================

let mutationObserver: MutationObserver | null = null
let resizeObserver: ResizeObserver | null = null

function setupObservers(): void {
  if (!props.canvasEl) return

  // 监听 DOM 结构变化（新增/删除节点）
  mutationObserver = new MutationObserver(() => {
    nextTick(refreshOverlay)
  })
  mutationObserver.observe(props.canvasEl, {
    childList: true,
    subtree: true,
    attributes: false,
  })

  // 监听容器大小变化
  resizeObserver = new ResizeObserver(() => {
    refreshOverlay()
  })
  resizeObserver.observe(props.canvasEl)
}

function teardownObservers(): void {
  mutationObserver?.disconnect()
  mutationObserver = null
  resizeObserver?.disconnect()
  resizeObserver = null
}

// ============================================================
// 生命周期
// ============================================================

onMounted(async () => {
  await nextTick()
  // 额外延迟一个宏任务，确保 canvas 内 FormRenderer 的 DOM 完全渲染完成
  setTimeout(() => {
    setupObservers()
    refreshOverlay()
  }, 50)
})

// 监听 schema 变化，刷新 overlay（只保留一个 watch）
watch(
  () => props.schema,
  async () => {
    await nextTick()
    // 额外等待一个宏任务，确保 FormRenderer 内的 el-form 渲染完成
    setTimeout(() => {
      refreshOverlay()
    }, 20)
  },
  { deep: true }
)

onUnmounted(() => {
  teardownObservers()
})

// canvasEl 变化时重新设置监听
watch(
  () => props.canvasEl,
  async (el) => {
    teardownObservers()
    if (el) {
      await nextTick()
      setupObservers()
      refreshOverlay()
    }
  }
)

// ============================================================
// 事件处理
// ============================================================

function handleItemHover(nodeId: string): void {
  hoveredNodeId.value = nodeId
}

function handleMouseLeave(): void {
  hoveredNodeId.value = null
}

function handleItemClick(nodeId: string): void {
  emit('select-node', nodeId)
}

// 判断是否为自由布局模式
const isFreeLayout = computed(() => {
  return props.schema?.layoutMode === 'free'
})

// ============================================================
// 自由布局：拖拽和缩放（基础框架，实际逻辑在 FreeCanvas 中实现）
// ============================================================

// 拖拽状态
const draggingNodeId = ref<string | null>(null)
const resizingNodeId = ref<string | null>(null)
const resizingDirection = ref<string | null>(null)

function handleItemMouseDown(nodeId: string, e: MouseEvent): void {
  // 自由布局模式下，拖拽由 FreeCanvas 组件处理
  // 流式布局模式下，此组件不处理拖拽
  e.preventDefault()
}

function handleMouseMove(e: MouseEvent): void {
  // 自由布局模式下，拖拽由 FreeCanvas 组件处理
  // 此组件仅用于流式布局模式
}

function handleMouseUp(e: MouseEvent): void {
  // 清理拖拽/缩放状态
  draggingNodeId.value = null
  resizingNodeId.value = null
  resizingDirection.value = null
}

// ============================================================
// 流式布局：拖拽排序（HTML5 DnD）
// ============================================================

const dragNodeId = ref<string | null>(null)
const dragOverNodeId = ref<string | null>(null)

function handleDragStart(nodeId: string, e: DragEvent): void {
  if (isFreeLayout.value) return
  dragNodeId.value = nodeId
  emit('select-node', nodeId)
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', nodeId)
  }
}

function handleDragEnd(): void {
  dragNodeId.value = null
  dragOverNodeId.value = null
}

function handleDragOver(nodeId: string, e: DragEvent): void {
  if (isFreeLayout.value) return
  if (nodeId === dragNodeId.value) return
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  dragOverNodeId.value = nodeId
}

function handleDragLeave(nodeId: string): void {
  if (dragOverNodeId.value === nodeId) {
    dragOverNodeId.value = null
  }
}

function handleDrop(toNodeId: string): void {
  if (isFreeLayout.value) return
  if (!dragNodeId.value || dragNodeId.value === toNodeId) {
    dragNodeId.value = null
    dragOverNodeId.value = null
    return
  }
  emit('reorder-nodes', dragNodeId.value, toNodeId)
  dragNodeId.value = null
  dragOverNodeId.value = null
}

function handleResizeStart(nodeId: string, direction: string, e: MouseEvent): void {
  // 自由布局模式下，缩放由 FreeCanvas 组件处理
  // 此组件仅用于流式布局模式
  e.preventDefault()
  e.stopPropagation()
}

// ============================================================
// 对外暴露
// ============================================================

defineExpose({
  refresh: refreshOverlay,
})
</script>

<style scoped>
.design-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: visible;
}

.design-overlay__item {
  position: absolute;
  pointer-events: auto;
  cursor: pointer;
  box-sizing: border-box;
  border: 1px dashed transparent;
  border-radius: 2px;
  transition: border-color 0.15s;
}

/* hover 状态 */
.design-overlay__item--hovered {
  border-color: #409eff;
  background: rgba(64, 158, 255, 0.04);
}

/* 选中状态 */
.design-overlay__item--selected {
  border: 2px solid #409eff !important;
  background: rgba(64, 158, 255, 0.06);
}

/* 容器类型 hover 时用蓝绿色区分 */
.design-overlay__item--container.design-overlay__item--hovered {
  border-color: #67c23a;
  background: rgba(103, 194, 58, 0.04);
}

/* 拖拽排序：drop 目标高亮 */
.design-overlay__item--drag-over {
  border: 2px dashed #f59e0b !important;
  background: rgba(245, 158, 11, 0.08) !important;
}

/* 操作按钮区 —— 位置完全由 JS getActionsStyle() 动态控制 */
.design-overlay__actions {
  display: flex;
  align-items: center;
  gap: 2px;
  background: #409eff;
  border-radius: 3px;
  padding: 3px 6px;
  white-space: nowrap;
  pointer-events: auto;
  box-shadow: 0 2px 8px rgba(0,0,0,0.18);
}

.design-overlay__label {
  font-size: 11px;
  color: #fff;
  margin-right: 4px;
  line-height: 1;
}

.design-overlay__action-btn {
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

.design-overlay__action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.design-overlay__action-btn--danger:hover {
  background: #f56c6c;
}

/* hover 时的简单标签 */
.design-overlay__hover-label {
  position: absolute;
  top: -22px;
  left: 0;
  font-size: 11px;
  color: #fff;
  background: rgba(64, 158, 255, 0.85);
  padding: 2px 6px;
  border-radius: 2px 2px 0 0;
  pointer-events: none;
  white-space: nowrap;
}

/* 拖拽放置指示线 */
.design-overlay__drop-indicator {
  position: absolute;
  height: 2px;
  background: #409eff;
  border-radius: 1px;
  pointer-events: none;
  z-index: 200;
}

.design-overlay__drop-indicator::before {
  content: '';
  position: absolute;
  left: -4px;
  top: -3px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #409eff;
}
</style>
