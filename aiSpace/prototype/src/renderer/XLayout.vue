<!--
  XLayout.vue
  统一布局渲染器 —— 参考 CSS position 模型

  核心理念：
  - 每个节点独立决定自己的定位类型（x-position-type: relative | absolute）
  - 容器默认 position: relative，成为内部 absolute 子节点的定位上下文
  - 支持任意嵌套：你中有我、我中有我

  定位语义：
  - relative（默认）：正常文档流排列，父容器决定定位上下文
  - absolute：相对于最近 position: relative 祖先定位，支持拖拽移动和缩放

  渲染策略：
  - 不分区，统一渲染所有节点
  - 定位样式直接透传给 VoidContainer / FieldRenderer 根元素
  - 不使用 wrapper div 承载定位，避免破坏 containing block
-->
<template>
  <div class="x-layout" :style="containerStyle">
    <!--
      按 x-order 排序，统一渲染所有节点
      定位样式直接传给子组件根元素，不包 wrapper
    -->
    <template v-for="(fieldSchema, fieldKey) in sortedProperties" :key="fieldSchema['x-id'] ?? fieldKey">
      <!--
        容器类型（void）：VoidContainer 根元素直接承载 position 样式
        - 容器默认 position: relative，建立内部 absolute 子节点的定位上下文
        - 容器设为 absolute 时，其 absolute 子节点相对于画布定位
      -->
      <VoidContainer
        v-if="fieldSchema.type === 'void'"
        :schema="fieldSchema"
        :form-model="formModel"
        :field-key="String(fieldKey)"
        :path-prefix="pathPrefix"
        :columns="columns"
        :node-style="getNodeStyle(fieldSchema)"
        @node-click="handleNodeClick"
      />

      <!-- 普通字段：FieldRenderer 根元素直接承载 position 样式 -->
      <FieldRenderer
        v-else
        :schema="fieldSchema"
        :form-model="formModel"
        :path="buildPath(pathPrefix, String(fieldKey))"
        :node-style="getNodeStyle(fieldSchema)"
        :on-node-click="handleNodeClick"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, type CSSProperties } from 'vue'
import type { FieldSchema } from '../core/schema'
import type { FormModel } from '../core/model'
import FieldRenderer from './FieldRenderer.vue'
import VoidContainer from './VoidContainer.vue'

// ============================================================
// Props
// ============================================================

interface Props {
  properties: Record<string, FieldSchema>
  /** 模板传入时为 FormModel 实例或 null */
  formModel?: FormModel | null
  pathPrefix: string
  /**
   * 布局总列数（由 formConfig.columns 透传）
   * 仅影响 relative 节点的默认列宽计算
   */
  columns?: number
}

const props = withDefaults(defineProps<Props>(), {
  formModel: null,
  columns: 1,
})

// ============================================================
// 注入设计器引擎
// ============================================================

const designerEngine: any = inject('designerEngine', null)

// ============================================================
// 计算属性
// ============================================================

/** 按 x-order 排序 */
const sortedProperties = computed(() => {
  const entries = Object.entries(props.properties)
  entries.sort(([, a], [, b]) => {
    const orderA = a['x-order'] ?? 0
    const orderB = b['x-order'] ?? 0
    return orderA - orderB
  })
  return Object.fromEntries(entries)
})

const containerStyle = computed(() => ({
  position: 'relative' as const, // 建立定位上下文
  width: '100%',
  minHeight: '100%',
}))

// ============================================================
// 工具函数
// ============================================================

function buildPath(prefix: string, key: string): string {
  return prefix ? `${prefix}.${key}` : key
}

/**
 * 判断节点是否为绝对定位
 */
function isAbsolute(field: FieldSchema): boolean {
  return field['x-position-type'] === 'absolute'
}

/**
 * 获取节点的定位样式
 *
 * 核心规则：
 * - x-position-type === 'absolute' → position: absolute + x/y/width/height
 * - 否则 → 空对象（由 flex 布局自然排列，不强制 position: relative）
 *
 * 注意：不包 wrapper，样式直接传给 VoidContainer / FieldRenderer 根元素
 */
function getNodeStyle(field: FieldSchema): CSSProperties {
  if (isAbsolute(field)) {
    const pos = field['x-position']
    return {
      position: 'absolute',
      left: `${pos?.x ?? 0}px`,
      top: `${pos?.y ?? 0}px`,
      width: `${pos?.width ?? 200}px`,
      height: `${pos?.height ?? 40}px`,
      zIndex: pos?.zIndex ?? 1,
      boxSizing: 'border-box',
    }
  }

  // relative 节点：返回空对象，不强制 position
  // - 如果节点在容器内，由容器建立定位上下文
  // - 如果节点在画布顶层，由 XLayout 建立定位上下文
  // - 宽度跟随 x-span（如果设置了的话）
  if (field['x-span']) {
    const span = Math.min(Math.max(Number(field['x-span']), 1), props.columns)
    const pct = (span / props.columns) * 100
    return {
      width: `${pct}%`,
      boxSizing: 'border-box' as const,
    }
  }

  return {}
}

/**
 * 节点点击事件（设计器模式选中节点）
 */
function handleNodeClick(nodeId: string): void {
  if (!nodeId) return
  if (designerEngine) {
    designerEngine.selectNode(nodeId)
  }
}
</script>

<style scoped>
.x-layout {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  min-width: 0;
  padding: 8px 6px 0;
  box-sizing: border-box;
}
</style>
