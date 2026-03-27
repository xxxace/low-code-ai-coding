<!--
  XLayout.vue
  统一布局渲染器 —— 参考 CSS position 模型

  核心理念：
  - 每个节点独立决定自己的定位类型（x-position-type: relative | absolute）
  - 容器默认 position: relative，成为内部 absolute 子节点的定位上下文
  - 支持任意嵌套：你中有我、我中有你

  position-type 语义：
  - relative（默认）：正常文档流排列，父容器决定定位上下文
  - absolute：相对于最近 position: relative 祖先定位，支持拖拽移动和缩放

  渲染策略：
  - 不分区（flow/free 两个渲染区），统一渲染所有节点
  - absolute 节点渲染为 position: absolute
  - relative 节点渲染为 position: relative（默认）
-->
<template>
  <div class="x-layout" :style="containerStyle">
    <!--
      按 x-order 排序，统一渲染所有节点
      每个节点自己决定 position-type：
      - absolute → position: absolute + x/y/width/height
      - relative → position: relative（正常流式排列）
    -->
    <template v-for="(fieldSchema, fieldKey) in sortedProperties" :key="fieldSchema['x-id'] ?? fieldKey">
      <!-- 节点包装层：决定定位方式 -->
      <div
        class="x-layout__node"
        :style="getNodeStyle(fieldSchema)"
        :data-field-id="fieldSchema['x-id']"
        @click.self="handleNodeClick(fieldSchema['x-id'])"
      >
        <!--
          容器类型（void）：递归渲染子节点
          父容器是 relative，子节点可以是 relative 或 absolute
          如果子节点是 absolute，相对于父容器定位
        -->
        <VoidContainer
          v-if="fieldSchema.type === 'void'"
          :schema="fieldSchema"
          :form-model="formModel"
          :field-key="String(fieldKey)"
          :path-prefix="pathPrefix"
          :columns="columns"
        />

        <!-- 普通字段 -->
        <FieldRenderer
          v-else
          :schema="fieldSchema"
          :form-model="formModel"
          :path="buildPath(pathPrefix, String(fieldKey))"
        />
      </div>
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
// 注入设计器引擎（用于识别设计模式）
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
 * - 否则 → position: relative（默认流式排列）
 *
 * 容器（void）也适用此规则：
 * - 容器默认 relative，建立内部 absolute 子节点的定位上下文
 * - 容器设为 absolute 时，其 absolute 子节点相对于画布定位
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

  // relative（默认）：正常流式排列
  // 宽度跟随 x-span（如果设置了的话）
  if (field['x-span']) {
    const span = Math.min(Math.max(Number(field['x-span']), 1), props.columns)
    const pct = (span / props.columns) * 100
    return {
      position: 'relative' as const,
      width: `${pct}%`,
      boxSizing: 'border-box' as const,
      padding: '0 6px',
      minWidth: '0',
    }
  }

  return {
    position: 'relative' as const,
    width: '100%',
    boxSizing: 'border-box' as const,
    padding: '0 6px',
  }
}

/**
 * 点击节点：选中
 * 仅在设计器模式下生效
 */
function handleNodeClick(nodeId: string | undefined): void {
  if (!nodeId || !designerEngine) return
  designerEngine.selectNode(nodeId)
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

.x-layout__node {
  /* 每个节点的外部容器
     - absolute 节点：不受 flex 布局影响，由 left/top/width/height 定位
     - relative 节点：由 flex 布局决定排列，宽度跟随 x-span */
  min-width: 0;
}
</style>
