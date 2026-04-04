<!-- 
  DesignOverlay.vue
  设计器画布叠加层 —— DOM 坐标感知的选中高亮 + 操作按钮
  
  实现策略：
  1. 通过 MutationObserver + ResizeObserver 监听画布内 DOM 变化
  2. 对每个带 data-field-id 的节点，计算相对于画布容器的坐标
  3. 在叠加层上以 position:absolute 绘制高亮框和操作按钮
  4. hover / click 交互直接绑定在叠加层

  定位上下文：
  - 本组件放在滚动容器内（非 canvas-container 内），避免被 overflow 裁切
  - overlay inset:0 撑满滚动容器，坐标基于滚动容器的 padding-box
  - 坐标计算使用 viewport 基准（getBoundingClientRect 差值），不受滚动影响
  - 无需减去 scrollLeft/scrollTop（overlay 和 canvas-container 在同一坐标系下）
-->
<template>
  <!-- 非设计模式下不渲染叠加层 -->
  <div
    v-if="designMode"
    ref="overlayRef"
    class="design-overlay"
    @mouseleave="handleMouseLeave"
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
          'design-overlay__item--dragging': dragNodeId === item.nodeId,
          'design-overlay__item--drag-over': dragOverNodeId === item.nodeId && dragNodeId !== item.nodeId && dropIntent !== 'into',
          'design-overlay__item--drag-into': dragOverNodeId === item.nodeId && dragNodeId !== item.nodeId && dropIntent === 'into',
        }"
        :style="item.style"
        :draggable="!isFreeLayout"
        @mouseenter.stop="handleItemHover(item.nodeId)"
        @click.stop="handleItemClick(item.nodeId)"
        @dragstart.stop="handleDragStart(item.nodeId, $event)"
        @dragend.stop="handleDragEnd"
        @dragover.prevent="handleDragOver(item.nodeId, $event)"
        @dragleave.stop="handleDragLeave(item.nodeId, $event)"
        @drop.stop="handleDrop(item.nodeId)"
      >
        <!-- 操作按钮（选中时显示）—— 所有流式布局节点（relative）和 absolute 非容器节点 -->
        <!-- absolute 容器节点由 AbsoluteNodeOverlay 单独处理，避免双层显示 -->
        <div
          v-if="item.nodeId === selectedNodeId && !(item.positionType === 'absolute' && item.isContainer)"
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
      :style="{
        ...dropIndicator.style,
        position: 'absolute',
        height: '4px',
        background: '#409eff',
        borderRadius: '2px',
        pointerEvents: 'none',
        zIndex: '950',
        boxShadow: '0 0 4px rgba(64, 158, 255, 0.6)',
      }"
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
import type { PageSchema, FieldSchema } from '../core/schema'

// ============================================================
// Props & Emits
// ============================================================

interface Props {
  schema: PageSchema
  selectedNodeId: string | null
  /** 画布 DOM 容器（用于计算相对坐标） */
  canvasEl: HTMLElement | null
  /** 是否处于设计模式 */
  designMode?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'select-node', id: string): void
  (e: 'remove-node', id: string): void
  (e: 'duplicate-node', id: string): void
  (e: 'move-node', id: string, direction: 'up' | 'down'): void
  (e: 'reorder-nodes', fromId: string, toId: string, position: 'before' | 'after'): void
  (e: 'move-to-container', nodeId: string, containerId: string): void
  (e: 'move-across-containers', nodeId: string, targetId: string, position: 'before' | 'after'): void
  /** 拖拽指示线状态变化事件（用于同步到父组件的 drop-indicator DOM） */
  (e: 'drop-indicator-change', indicator: { style: CSSProperties } | null): void
}>()


// ============================================================
// 操作栏四向边界感知
// ============================================================

/** 设计常量 */
const DESIGN_CONSTANTS = {
  /** 操作栏估算宽度（字段名 + 按钮组） */
  ACTIONS_W: 160,
  /** 操作栏估算高度 */
  ACTIONS_H: 30,
  /** 拖入容器判定阈值（鼠标落入容器中部 30% 区域时判定为移入） */
  DROP_INTO_THRESHOLD_LOW: 0.35,
  DROP_INTO_THRESHOLD_HIGH: 0.65,
} as const

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
  const canvasW = props.canvasEl?.offsetWidth ?? 0

  const itemLeft = parseFloat(item.style.left as string) || 0
  const itemTop = parseFloat(item.style.top as string) || 0
  const itemW = parseFloat(item.style.width as string) || 0

  // ---- 垂直方向 ----
  const showBelow = itemTop < DESIGN_CONSTANTS.ACTIONS_H
  const verticalStyle: CSSProperties = showBelow
    ? { top: '100%', bottom: 'auto', marginTop: '2px', marginBottom: '0' }
    : { bottom: '100%', top: 'auto', marginBottom: '2px', marginTop: '0' }

  // ---- 水平方向 ----
  const rightEdge = itemLeft + itemW
  let horizontalStyle: CSSProperties

  if (itemLeft < 0 || rightEdge < DESIGN_CONSTANTS.ACTIONS_W) {
    horizontalStyle = { left: '0', right: 'auto' }
  } else if (canvasW > 0 && rightEdge > canvasW) {
    horizontalStyle = { right: '0', left: 'auto' }
  } else {
    horizontalStyle = { right: '0', left: 'auto' }
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

// 拖拽排序指示线状态（通过 expose 提供给父组件 LowcodeDesigner）
const dropIndicator = ref<{ style: CSSProperties } | null>(null)

// overlayItems: 每个字段节点对应的 DOM 坐标信息
interface OverlayItem {
  nodeId: string
  label: string
  isContainer: boolean
  positionType: 'relative' | 'absolute'
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
  /** 父节点 x-id，根层节点为 '__root__' */
  parentId: string
  /** 定位类型：'relative' | 'absolute' */
  positionType: 'relative' | 'absolute'
}

const flatNodes = computed<FlatNode[]>(() => {
  const nodes: FlatNode[] = []

  function walk(properties: Record<string, FieldSchema>, parentId: string) {
    for (const [key, schema] of Object.entries(properties)) {
      // 包含所有节点（包括 absolute 容器），用于流式节点拖拽到容器的交互
      if (schema['x-id']) {
        nodes.push({
          id: schema['x-id'],
          label: schema.title ?? schema['x-component'] ?? '未知',
          isContainer: schema.type === 'void' || schema.type === 'object',
          parentId,
          positionType: schema['x-position-type'] ?? 'relative', // 新增：记录定位类型
        })
      }
      if ('properties' in schema && schema.properties) {
        walk(schema.properties as Record<string, FieldSchema>, schema['x-id'] ?? parentId)
      }
    }
  }

  if (props.schema?.schema?.properties) {
    walk(props.schema.schema.properties, '__root__')
  }
  return nodes
})

// ============================================================
// 核心：DOM 坐标计算 + 防抖
// ============================================================

/** 防抖刷新：MutationObserver / ResizeObserver 高频回调时，合并到单帧 */
function debouncedRefreshOverlay(): void {
  if (refreshTimerRef.value) clearTimeout(refreshTimerRef.value)
  refreshTimerRef.value = setTimeout(() => {
    refreshTimerRef.value = null
    refreshOverlay()
  }, 16) // ~60fps，与 RAF 对齐
}

/**
 * 检查节点是否位于被选中的 absolute 容器内部
 * 如果是，则该节点不应由 DesignOverlay 渲染 overlay（避免事件拦截）
 */
function isInsideSelectedAbsoluteContainer(nodeId: string): boolean {
  if (!props.selectedNodeId) return false

  // 找到当前选中的节点
  const selectedNode = flatNodes.value.find(n => n.id === props.selectedNodeId)
  if (!selectedNode) return false

  // 只有当选中的是 absolute 容器时，才需要过滤其内部子节点
  if (selectedNode.positionType !== 'absolute' || !selectedNode.isContainer) {
    return false
  }

  // 检查目标节点是否在被选中的容器内部（parentId 链路上）
  let currentNode = flatNodes.value.find(n => n.id === nodeId)
  while (currentNode) {
    if (currentNode.parentId === props.selectedNodeId) {
      return true
    }
    // 继续向上查找
    currentNode = flatNodes.value.find(n => n.id === currentNode?.parentId)
  }
  return false
}

function refreshOverlay(): void {
  console.log('[DesignOverlay] refreshOverlay called', {
    hasCanvasEl: !!props.canvasEl,
    flatNodesCount: flatNodes.value.length,
    selectedNodeId: props.selectedNodeId
  })
  
  if (!props.canvasEl) {
    console.log('[DesignOverlay] refreshOverlay: canvasEl is null, skipping')
    return
  }

  // 【诊断】打印 flatNodes 的前几个节点
  console.log('[DesignOverlay] flatNodes sample:', flatNodes.value.slice(0, 5).map(n => ({
    id: n.id,
    positionType: n.positionType,
    parentId: n.parentId
  })))

  // overlay 现在是 scroll container 的直接子节点，与 canvas-container 同级
  // 使用 scroll container 作为坐标基准
  const referenceEl = overlayRef.value?.parentElement ?? props.canvasEl
  const canvasRect = referenceEl.getBoundingClientRect()
  const items: OverlayItem[] = []
  const totalNodes = flatNodes.value.length

  for (const node of flatNodes.value) {
    // 完全过滤所有 absolute 节点（包括容器和非容器）
    // - 由 AbsoluteNodeOverlay 单独处理 absolute 节点的交互
    // - DesignOverlay 只处理 relative 节点的拖拽排序
    if (node.positionType === 'absolute') {
      console.log('[DesignOverlay] skip absolute node:', node.id)
      continue
    }

    // 过滤掉位于被选中的 absolute 容器内部的 relative 节点
    // 这些节点的事件应由 AbsoluteNodeOverlay 统一处理，避免 DesignOverlay 的 overlay 拦截事件
    if (isInsideSelectedAbsoluteContainer(node.id)) {
      console.log('[DesignOverlay] skip inside container:', node.id)
      continue
    }

    // 通过 data-field-id 属性查找 DOM 节点
    const el = props.canvasEl.querySelector<HTMLElement>(
      `[data-field-id="${node.id}"]`
    )
    if (!el) {
      console.log('[DesignOverlay] DOM not found for:', node.id)
      continue
    }

    const elRect = el.getBoundingClientRect()

    // 计算相对于 scroll container（overlay 的父元素）的坐标
    // 使用 viewport 基准差值，overlay 和 canvas-container 在同一坐标系下
    // 无需减去 scrollLeft/scrollTop（因为 overlay 是 scroll container 的子节点）
    const relLeft = elRect.left - canvasRect.left
    const relTop = elRect.top - canvasRect.top

    items.push({
      nodeId: node.id,
      label: node.label,
      isContainer: node.isContainer,
      positionType: node.positionType,
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

  // 【诊断】打印最终结果
  console.log('[DesignOverlay] overlayItems generated:', {
    count: items.length,
    items: items.slice(0, 3).map(i => ({ nodeId: i.nodeId, label: i.label }))
  })

}

// ============================================================
// 监听 DOM 变化（MutationObserver）
// ============================================================

// Observer 引用（ref 管理，确保生命周期安全）
const mutationObserverRef = ref<MutationObserver | null>(null)
const resizeObserverRef = ref<ResizeObserver | null>(null)
// 定时器引用（用于清理 setTimeout）
const mountedTimerRef = ref<ReturnType<typeof setTimeout> | null>(null)
const schemaWatchTimerRef = ref<ReturnType<typeof setTimeout> | null>(null)
const refreshTimerRef = ref<ReturnType<typeof setTimeout> | null>(null)

function setupObservers(): void {
  if (!props.canvasEl) return

  // 先断开旧 Observer（防止 canvasEl watcher 重复调用时泄漏）
  teardownObservers()

  // 监听 DOM 结构变化（新增/删除节点）—— 走防抖，避免连续 DOM 变更触发多次刷新
  mutationObserverRef.value = new MutationObserver((mutations) => {
    // 过滤掉与 overlay 无关的变化（如样式变化、属性变化）
    const hasMeaningfulChanges = mutations.some(m => {
      // 只关心子节点增删，且不是 overlay 自身的变化
      if (m.type !== 'childList') return false
      // 检查变化的节点是否来自 overlay 内部
      const target = m.target as HTMLElement
      if (target.closest('.design-overlay')) return false
      return true
    })
    if (hasMeaningfulChanges) {
      debouncedRefreshOverlay()
    }
  })
  mutationObserverRef.value.observe(props.canvasEl, {
    childList: true,
    subtree: true,
    attributes: false,
  })

  // 监听容器大小变化
  resizeObserverRef.value = new ResizeObserver(() => {
    debouncedRefreshOverlay()
  })
  resizeObserverRef.value.observe(props.canvasEl)
}

function teardownObservers(): void {
  mutationObserverRef.value?.disconnect()
  mutationObserverRef.value = null
  resizeObserverRef.value?.disconnect()
  resizeObserverRef.value = null
}

// ============================================================
// 生命周期
// ============================================================

onMounted(async () => {
  await nextTick()
  // 额外延迟一个宏任务，确保 canvas 内 FormRenderer 的 DOM 完全渲染完成
  mountedTimerRef.value = setTimeout(() => {
    mountedTimerRef.value = null
    setupObservers()
    refreshOverlay()
    
    // 【诊断】检查 DOM 渲染情况
    console.log('[DesignOverlay] onMounted diagnostic:', {
      overlayRefExists: !!overlayRef.value,
      overlayItemsCount: overlayItems.value.length,
      domChildrenCount: overlayRef.value?.children.length ?? 0,
      domItemsCount: overlayRef.value?.querySelectorAll('.design-overlay__item').length ?? 0
    })
  }, 50)
})

// 监听 schema 变化，刷新 overlay（用 __meta__.updatedAt 快速判断）
watch(
  () => [props.schema.__meta__?.updatedAt, props.schema.id] as const,
  async () => {
    await nextTick()
    // 额外等待一个宏任务，确保 FormRenderer 内的 el-form 渲染完成
    if (schemaWatchTimerRef.value) clearTimeout(schemaWatchTimerRef.value)
    schemaWatchTimerRef.value = setTimeout(() => {
      schemaWatchTimerRef.value = null
      refreshOverlay()
    }, 20)
  },
)

onUnmounted(() => {
  teardownObservers()
  if (mountedTimerRef.value) {
    clearTimeout(mountedTimerRef.value)
    mountedTimerRef.value = null
  }
  if (schemaWatchTimerRef.value) {
    clearTimeout(schemaWatchTimerRef.value)
    schemaWatchTimerRef.value = null
  }
  if (refreshTimerRef.value) {
    clearTimeout(refreshTimerRef.value)
    refreshTimerRef.value = null
  }
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

// 监听选中节点变化，刷新 overlay（用于过滤选中 absolute 容器内部的 relative 节点）
watch(
  () => props.selectedNodeId,
  async () => {
    await nextTick()
    refreshOverlay()
  },
  { immediate: true } // 立即执行一次，确保组件挂载时就刷新
)

// ============================================================
// 事件处理
// ============================================================

function handleItemHover(nodeId: string): void {
  // 【诊断】检查 overlay 元素的 DOM 结构
  console.log('[DesignOverlay] handleItemHover triggered!', {
    nodeId,
    overlayItemsCount: overlayItems.value.length,
    hoveredValueBefore: hoveredNodeId.value,
    // 检查当前渲染的 DOM 数量
    domItemsCount: overlayRef.value?.querySelectorAll('.design-overlay__item').length ?? 0
  })
  hoveredNodeId.value = nodeId
}

function handleMouseLeave(): void {
  hoveredNodeId.value = null
}

function handleItemClick(nodeId: string): void {
  console.log(`[DesignOverlay] handleItemClick: nodeId=${nodeId}`)
  emit('select-node', nodeId)
}

// 判断是否为自由布局模式（x-position-type === 'absolute' 时为自由布局）
const isFreeLayout = computed(() => {
  return props.schema?.['x-position-type'] === 'absolute'
})

// ============================================================
// 流式布局：拖拽排序（HTML5 DnD）
// ============================================================

const dragNodeId = ref<string | null>(null)
const dragOverNodeId = ref<string | null>(null)
/** 当前 drop 的位置意图：before/after（同层排序）或 into（移入容器） */
const dropIntent = ref<'before' | 'after' | 'into' | null>(null)
/** 防抖清除标志：handleDragOver 设置后短暂为 true，防止 handleDocumentDragOver 立即覆盖 */
const dropIndicatorProtected = ref(false)
/** 上一个保护 timeout 的 id，用于清除 */
let dropIndicatorProtectedTimer: ReturnType<typeof setTimeout> | null = null

function handleDragStart(nodeId: string, e: DragEvent): void {
  if (isFreeLayout.value) return
  dragNodeId.value = nodeId
  emit('select-node', nodeId)
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', nodeId)
  }

  // 同时存储到 sessionStorage，确保 AbsoluteNodeOverlay 能获取到（事件顺序问题）
  sessionStorage.setItem('dragging-node-id', nodeId)

  // 添加文档级事件监听，用于检测拖拽到 absolute 节点或空白画布区域
  document.addEventListener('dragover', handleDocumentDragOver)
  document.addEventListener('drop', handleDocumentDrop)
}

function handleDragEnd(): void {
  dragNodeId.value = null
  dragOverNodeId.value = null
  dropIntent.value = null
  dropIndicator.value = null
  dropIndicatorProtected.value = false

  // 清理 sessionStorage
  sessionStorage.removeItem('dragging-node-id')

  // 清理文档级事件监听
  document.removeEventListener('dragover', handleDocumentDragOver)
  document.removeEventListener('drop', handleDocumentDrop)
}

function handleDragOver(nodeId: string, e: DragEvent): void {
  if (isFreeLayout.value) return
  if (nodeId === dragNodeId.value) return
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'

  dragOverNodeId.value = nodeId

  // 设置防抖保护：handleDocumentDragOver 在 100ms 内不清除 dropIndicator
  if (dropIndicatorProtectedTimer !== null) {
    clearTimeout(dropIndicatorProtectedTimer)
    dropIndicatorProtectedTimer = null
  }
  dropIndicatorProtected.value = true
  dropIndicatorProtectedTimer = setTimeout(() => {
    dropIndicatorProtected.value = false
    dropIndicatorProtectedTimer = null
  }, 100)

  // 找到当前 target 的 overlay item，计算鼠标在其中的相对位置
  const targetItem = overlayItems.value.find((i) => i.nodeId === nodeId)
  if (!targetItem) return

  const itemTop = parseFloat(targetItem.style.top as string) || 0
  const itemHeight = parseFloat(targetItem.style.height as string) || 0
  const itemLeft = parseFloat(targetItem.style.left as string) || 0
  const itemWidth = parseFloat(targetItem.style.width as string) || 0

  // 统一坐标参考系：使用 overlay 的父容器（滚动容器）的 rect
  const referenceRect = overlayRef.value?.parentElement?.getBoundingClientRect()
  if (!referenceRect) return
  const relY = e.clientY - referenceRect.top

  // 鼠标在 item 中的相对比例（0 ~ 1）
  const ratio = itemHeight > 0 ? (relY - itemTop) / itemHeight : 0.5

  // 目标是容器 + 鼠标落在中间 35%~65% → 移入容器
  const targetNode = flatNodes.value.find((n) => n.id === nodeId)
  const isTargetContainer = targetNode?.isContainer ?? false

  let intent: 'before' | 'after' | 'into'
  if (isTargetContainer && ratio >= DESIGN_CONSTANTS.DROP_INTO_THRESHOLD_LOW && ratio <= DESIGN_CONSTANTS.DROP_INTO_THRESHOLD_HIGH) {
    intent = 'into'
  } else {
    intent = ratio < 0.5 ? 'before' : 'after'
  }
  dropIntent.value = intent

  // 更新指示线（'into' 时不显示横线，改由 CSS class 绿框表示）
  if (intent === 'into') {
    dropIndicator.value = null
  } else {
    // before → 指示线在 item 顶边；after → 在底边
    const indicatorTop = intent === 'before' ? itemTop - 1 : itemTop + itemHeight - 1
    dropIndicator.value = {
      style: {
        left: `${itemLeft}px`,
        top: `${indicatorTop}px`,
        width: `${itemWidth}px`,
      },
    }
  }
}

function handleDragLeave(nodeId: string, e: DragEvent): void {
  // relatedTarget 是鼠标移入的新元素
  // 若新元素仍在当前 overlay-item 内部（子元素触发的 dragleave），忽略它
  const related = e.relatedTarget as Node | null
  const currentItem = (e.currentTarget as HTMLElement | null)
  if (currentItem && related && currentItem.contains(related)) return

  if (dragOverNodeId.value === nodeId) {
    dragOverNodeId.value = null
    dropIntent.value = null
    dropIndicator.value = null
  }
}

/**
 * 文档级 dragover 处理 —— 用于检测拖拽到 absolute 非容器节点或空白画布区域
 * 对于 absolute 容器节点，让 AbsoluteNodeOverlay 处理
 */
function handleDocumentDragOver(e: DragEvent): void {
  if (!dragNodeId.value) return
  if (isFreeLayout.value) return

  // 【核心修复】当 dropIndicatorProtected=true 时，不执行任何清除逻辑
  // item-level handleDragOver 刚设置完 dropIndicator，100ms 内 document dragover 不覆盖
  if (dropIndicatorProtected.value) {
    return
  }

  // 检查鼠标下的元素
  const target = document.elementFromPoint(e.clientX, e.clientY)
  if (!target) {
    // 鼠标不在任何元素上，清除 hover 状态
    if (dragOverNodeId.value) {
      dragOverNodeId.value = null
      dropIntent.value = null
      dropIndicator.value = null
    }
    return
  }

  // 检查是否在 canvas 区域内
  const canvasField = target.closest('[data-field-id]')
  if (!canvasField) {
    // 鼠标不在任何字段上，可能是空白区域
    if (dragOverNodeId.value) {
      dragOverNodeId.value = null
      dropIntent.value = null
      dropIndicator.value = null
    }
    return
  }

  // 检查是否是 absolute 非容器节点
  const fieldId = canvasField.getAttribute('data-field-id')

  if (fieldId) {
    const node = flatNodes.value.find(n => n.id === fieldId)
    if (node?.positionType === 'absolute' && !node.isContainer) {
      // absolute 非容器节点，清除 hover 状态
      if (dragOverNodeId.value) {
        dragOverNodeId.value = null
        dropIntent.value = null
        dropIndicator.value = null
      }
      // 不 return，让 AbsoluteNodeOverlay 的 drop zone 可以接收事件
    }
    // absolute 容器节点：不执行任何操作，让 AbsoluteNodeOverlay 处理
  }
}

/**
 * 文档级 drop 处理 —— 用于处理在 absolute 非容器节点或空白区域释放的情况
 * 对于 absolute 容器节点，让 AbsoluteNodeOverlay 处理
 */
function handleDocumentDrop(e: DragEvent): void {
  if (!dragNodeId.value) return
  if (isFreeLayout.value) return

  // 检查鼠标下的元素
  const target = document.elementFromPoint(e.clientX, e.clientY)
  if (!target) {
    // 在空白区域释放，清除状态
    dragNodeId.value = null
    dragOverNodeId.value = null
    dropIntent.value = null
    dropIndicator.value = null
    return
  }

  // 检查是否在 canvas 区域内
  const canvasField = target.closest('[data-field-id]')
  if (!canvasField) {
    // 在空白区域释放，清除状态
    dragNodeId.value = null
    dragOverNodeId.value = null
    dropIntent.value = null
    dropIndicator.value = null
    return
  }

  // 检查是否是 absolute 非容器节点
  const fieldId = canvasField.getAttribute('data-field-id')
  if (fieldId) {
    const node = flatNodes.value.find(n => n.id === fieldId)
    if (node?.positionType === 'absolute' && !node.isContainer) {
      // absolute 非容器节点，清除状态（不允许放置）
      dragNodeId.value = null
      dragOverNodeId.value = null
      dropIntent.value = null
      dropIndicator.value = null
      return
    }
    // absolute 容器节点：不执行任何操作，让 AbsoluteNodeOverlay 处理
  }
}

function handleDrop(toNodeId: string): void {
  if (isFreeLayout.value) return
  const fromId = dragNodeId.value
  if (!fromId || fromId === toNodeId) {
    dragNodeId.value = null
    dragOverNodeId.value = null
    dropIntent.value = null
    dropIndicator.value = null
    return
  }

  const intent = dropIntent.value

  if (intent === 'into') {
    // 移入容器
    emit('move-to-container', fromId, toNodeId)
  } else {
    // 同层排序：判断 source 和 target 是否同层
    const sourceNode = flatNodes.value.find((n) => n.id === fromId)
    const targetNode = flatNodes.value.find((n) => n.id === toNodeId)

    if (sourceNode && targetNode && sourceNode.parentId !== targetNode.parentId) {
      // 跨层：使用 move-across-containers 一次性完成移出+排序
      emit('move-across-containers', fromId, toNodeId, intent ?? 'before')
    } else {
      emit('reorder-nodes', fromId, toNodeId, intent ?? 'before')
    }
  }

  dragNodeId.value = null
  dragOverNodeId.value = null
  dropIntent.value = null
  dropIndicator.value = null
}

// ============================================================
// 对外暴露
// ============================================================

defineExpose({
  refresh: refreshOverlay,
  dropIndicator,
})

// 监听 dropIndicator 变化，同步到父组件
watch(dropIndicator, (val) => {
  emit('drop-indicator-change', val ? { style: val.style } : null)
})
</script>

<style scoped>
.design-overlay {
  position: absolute;
  inset: 0;
  /* 禁用 pointer-events，让 absolute 节点可以正常交互 */
  /* drag 事件不依赖 pointer-events，会正常冒泡到 overlay items */
  pointer-events: none;
  overflow: visible;
  z-index: 1001; /* 必须高于 AbsoluteNodeOverlay (1000)，使其层叠上下文在 AbsoluteNodeOverlay 之上 */
}

.design-overlay__item {
  position: absolute;
  pointer-events: auto;
  cursor: pointer;
  box-sizing: border-box;
  border: 1px dashed transparent;
  border-radius: 2px;
  transition: border-color 0.15s;
  z-index: 1002; /* 相对于 DesignOverlay 容器的层叠上下文（z-index 1001），确保覆盖 absolute 容器内的子元素 */
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

/* 拖拽放置指示线 */
.design-overlay__drop-indicator {
  position: absolute;
  height: 3px;
  background: #409eff;
  border-radius: 1.5px;
  pointer-events: none;
  z-index: 950; /* 高于普通 overlay items (901)，低于绝对容器 overlay */
  /* 小圆点 */
  &::before {
    content: '';
    position: absolute;
    left: -4px;
    top: -3px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #409eff;
  }
}

/* 容器类型 hover 时用蓝绿色区分 */
.design-overlay__item--container.design-overlay__item--hovered {
  border-color: #67c23a;
  background: rgba(103, 194, 58, 0.04);
}

/* 拖拽排序：drop 目标高亮（before/after） */
.design-overlay__item--drag-over {
  border: 2px dashed #f59e0b !important;
  background: rgba(245, 158, 11, 0.08) !important;
}

/* 拖入容器：绿色边框 */
.design-overlay__item--drag-into {
  border: 2px dashed #67c23a !important;
  background: rgba(103, 194, 58, 0.10) !important;
}

/* 正在被拖拽的节点：半透明 + 虚线边框 + 禁用 transition */
.design-overlay__item--dragging {
  opacity: 0.4;
  border: 2px dashed #909399 !important;
  cursor: grabbing !important;
  transition: none !important;
}

/* 任意节点正在被拖拽时，全局禁用所有 overlay item 的 transition */
.design-overlay:has(.design-overlay__item--dragging) .design-overlay__item {
  transition: none !important;
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

/* 拖拽放置指示线样式已移至 LowcodeDesigner.vue */
</style>
