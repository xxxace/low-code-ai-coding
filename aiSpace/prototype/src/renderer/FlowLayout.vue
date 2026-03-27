<!-- 
  FlowLayout.vue
  流式布局渲染器 —— 使用 CSS flex-wrap 行内布局
  
  设计思路：
  - 容器：display:flex + flex-wrap:wrap，每行自然换行
  - 字段宽度 = (x-span / columns) * 100%，其中 columns 由 formConfig 传入
  - 比 grid 24列方案更直观：直接用百分比，不依赖列定义
  - 字段内部用 padding 隔开，不用 gap（避免宽度计算复杂）
  
  x-span 含义：在 columns 总列数中占几列（类似 el-col :span）
  示例：columns=3，x-span=1 → 33.33%；x-span=2 → 66.67%；x-span=3 → 100%
-->
<template>
  <div class="lowcode-flow-layout" :style="containerStyle">
    <template v-for="(fieldSchema, fieldKey) in sortedProperties" :key="fieldSchema['x-id'] ?? fieldKey">
      <!-- 包装层：负责宽度和 padding -->
      <div class="lowcode-flow-layout__cell" :style="cellStyle(fieldSchema['x-span'])">
        <!-- void 字段：纯 UI 容器，递归渲染子节点 -->
        <VoidContainer
          v-if="fieldSchema.type === 'void'"
          :schema="fieldSchema"
          :form-model="formModel"
          :field-key="String(fieldKey)"
          :path-prefix="pathPrefix"
          :columns="columns"
        />

        <!-- 普通字段：渲染 FormItem + Widget -->
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
  /** 模板传入时为 FormModel 实例或 null（ref 在模板中自动解包） */
  formModel?: FormModel | null
  pathPrefix: string
  /**
   * 布局总列数，由 formConfig.columns 透传
   * 默认 1（每行1列，字段独占一行）
   * 常见值：1（单列）/ 2 / 3 / 4
   */
  columns?: number
}

const props = withDefaults(defineProps<Props>(), {
  formModel: null,
  columns: 1,
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

const containerStyle = computed(() => ({
  display: 'flex',
  flexWrap: 'wrap' as const,
  // 负外边距抵消 cell 的 padding，使整体对齐
  margin: '0 -6px',
}))

// ============================================================
// 工具函数
// ============================================================

function buildPath(prefix: string, key: string): string {
  return prefix ? `${prefix}.${key}` : key
}

/**
 * 根据 x-span 计算 cell 宽度百分比
 * x-span 为占据的列数（1 ~ columns）
 * 未设置时默认占 1 列
 */
function cellStyle(xSpan?: number | string): Record<string, string> {
  const cols = props.columns
  // x-span: 占几列，默认1列（即 100% / columns）
  const span = Math.min(Math.max(Number(xSpan ?? 1), 1), cols)
  const pct = (span / cols) * 100
  return {
    width: `${pct}%`,
    padding: '0 6px',
    boxSizing: 'border-box',
    // 保证宽度不被 flex 拉伸/压缩
    flexShrink: '0',
    flexGrow: '0',
  }
}
</script>

<style scoped>
.lowcode-flow-layout {
  width: 100%;
  min-width: 0;
  padding: 8px 6px 0;
  box-sizing: border-box;
}

.lowcode-flow-layout__cell {
  /* 每个字段的外部容器，宽度由 style 动态决定 */
  min-width: 0;
}
</style>
