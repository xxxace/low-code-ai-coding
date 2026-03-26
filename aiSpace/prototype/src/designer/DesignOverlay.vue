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
        }"
        :style="item.style"
        @mouseenter.stop="handleItemHover(item.nodeId)"
        @click.stop="handleItemClick(item.nodeId)"
        @mousedown.stop="handleItemMouseDown(item.nodeId, $event)"
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

        <!-- 操作按钮（选中时显示） -->
        <div v-if="item.nodeId === selectedNodeId" class="design-overlay__actions">
          <!-- 节点类型标签 -->
          <span class="design-overlay__label">{{ item.label }}</span>

          <!-- 流式布局：上移下移按钮 -->
          <template v-if="!isFreeLayout">
            <!-- 上移 -->
            <el-tooltip content="上移" placement="top" :show-after="500">
              <button
                class="design-overlay__action-btn"
                @click.stop="$emit('move-node', item.nodeId, 'up')"
              >
                <el-icon><ArrowUp /></el-icon>
              </button>
            </el-tooltip>

            <!-- 下移 -->
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
}>()

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

  const canvasRect = props.canvasEl.getBoundingClientRect()
  const items: OverlayItem[] = []

  for (const node of flatNodes.value) {
    // 通过 data-field-id 属性查找 DOM 节点
    const el = props.canvasEl.querySelector<HTMLElement>(
      `[data-field-id="${node.id}"]`
    )
    if (!el) continue

    const elRect = el.getBoundingClientRect()

    // 计算相对于画布的坐标（考虑画布滚动）
    const relLeft = elRect.left - canvasRect.left + props.canvasEl.scrollLeft
    const relTop = elRect.top - canvasRect.top + props.canvasEl.scrollTop

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
  setupObservers()
  refreshOverlay()
})

onUnmounted(() => {
  teardownObservers()
})

// Schema 变化时刷新覆盖层
watch(
  () => props.schema,
  async () => {
    await nextTick()
    refreshOverlay()
  },
  { deep: true }
)

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
  overflow: hidden;
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

/* 操作按钮区（选中时悬浮在上方） */
.design-overlay__actions {
  position: absolute;
  top: -30px;
  right: 0;
  display: flex;
  align-items: center;
  gap: 2px;
  background: #409eff;
  border-radius: 3px 3px 0 0;
  padding: 3px 6px;
  white-space: nowrap;
  z-index: 100;
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
