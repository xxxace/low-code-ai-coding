<!-- 
  FlowLayout.vue
  流式布局渲染器 —— 使用 CSS Grid 24 列栅格系统
  递归渲染字段节点，支持 void 容器和普通字段
-->
<template>
  <div
    class="lowcode-flow-layout"
    :style="gridStyle"
  >
    <template v-for="(fieldSchema, fieldKey) in sortedProperties" :key="fieldSchema['x-id'] ?? fieldKey">
      <!-- void 字段：纯 UI 容器，递归渲染子节点 -->
      <VoidContainer
        v-if="fieldSchema.type === 'void'"
        :schema="fieldSchema"
        :form-model="formModel"
        :field-key="String(fieldKey)"
        :path-prefix="pathPrefix"
        :style="spanStyle(fieldSchema['x-span'] ?? 24)"
      />

      <!-- 普通字段：渲染 FormItem + Widget -->
      <FieldRenderer
        v-else
        :schema="fieldSchema"
        :form-model="formModel"
        :path="buildPath(pathPrefix, String(fieldKey))"
        :style="spanStyle(fieldSchema['x-span'] ?? 24)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FormModel } from '../types/model'
import type { FieldSchema } from '../types/schema'
import FieldRenderer from './FieldRenderer.vue'
import VoidContainer from './VoidContainer.vue'

// ============================================================
// Props
// ============================================================

interface Props {
  properties: Record<string, FieldSchema>
  formModel: FormModel
  pathPrefix: string
  /** 父容器列数（默认 24，全宽） */
  parentColumns?: number
}

const props = withDefaults(defineProps<Props>(), {
  parentColumns: 24,
})

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

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${props.parentColumns}, 1fr)`,
  gap: '16px 16px',
}))

// ============================================================
// 工具函数
// ============================================================

function buildPath(prefix: string, key: string): string {
  return prefix ? `${prefix}.${key}` : key
}

/** 根据 span 计算 grid-column 样式 */
function spanStyle(span: number): Record<string, string> {
  const clampedSpan = Math.min(Math.max(span, 1), props.parentColumns)
  return {
    gridColumn: `span ${clampedSpan}`,
  }
}
</script>

<style scoped>
.lowcode-flow-layout {
  width: 100%;
  padding: 16px;
}
</style>
