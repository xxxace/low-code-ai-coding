<!-- 
  VoidContainer.vue
  虚字段容器渲染器 —— 处理 type: 'void' 的节点
  
  虚字段是纯 UI 容器（Card、Tabs、Collapse 等），不参与数据绑定。
  其子字段的数据路径会"穿透"虚字段，直接挂在父节点下（借鉴 Formily VoidField）。
-->
<template>
  <el-card
    v-if="componentName === 'Card'"
    v-bind="componentProps"
    class="lowcode-void-card mb-4"
    :class="schema['x-class']"
    :data-field-id="schema['x-id']"
    :style="containerStyle"
  >
    <template v-if="componentProps.title" #header>
      <span>{{ componentProps.title }}</span>
    </template>
    <XLayout
      v-if="schema?.properties"
      :properties="schema.properties"
      :form-model="formModel"
      :path-prefix="pathPrefix"
      :columns="props.columns ?? 1"
    />
  </el-card>

  <!-- Tabs 容器 -->
  <el-tabs
    v-else-if="componentName === 'Tabs'"
    v-bind="componentProps"
    class="lowcode-void-tabs"
    :class="schema['x-class']"
    :data-field-id="schema['x-id']"
    :style="containerStyle"
  >
    <template v-for="(paneSchema, paneKey) in schema?.properties" :key="paneKey">
      <el-tab-pane
        v-if="paneSchema['x-component'] === 'TabPane'"
        :label="paneSchema['x-component-props']?.label ?? String(paneKey)"
        :name="String(paneKey)"
      >
        <XLayout
          v-if="(paneSchema as any).properties"
          :properties="(paneSchema as any).properties"
          :form-model="formModel"
          :path-prefix="pathPrefix"
          :columns="props.columns ?? 1"
        />
      </el-tab-pane>
    </template>
  </el-tabs>

  <!-- Collapse 容器 -->
  <el-collapse
    v-else-if="componentName === 'Collapse'"
    v-bind="componentProps"
    class="lowcode-void-collapse mb-4"
    :class="schema['x-class']"
    :data-field-id="schema['x-id']"
    :style="containerStyle"
  >
    <template v-for="(itemSchema, itemKey) in schema?.properties" :key="itemKey">
      <el-collapse-item
        v-if="itemSchema['x-component'] === 'CollapseItem'"
        :title="itemSchema['x-component-props']?.label ?? String(itemKey)"
        :name="String(itemKey)"
      >
        <XLayout
          v-if="(itemSchema as any).properties"
          :properties="(itemSchema as any).properties"
          :form-model="formModel"
          :path-prefix="pathPrefix"
          :columns="props.columns ?? 1"
        />
      </el-collapse-item>
    </template>
  </el-collapse>

  <!-- Divider 分割线 -->
  <el-divider
    v-else-if="componentName === 'Divider'"
    v-bind="componentProps"
    :class="schema['x-class']"
    :data-field-id="schema['x-id']"
  >
    {{ componentProps.title }}
  </el-divider>

  <!-- 通用容器（div + XLayout 子节点） -->
  <div
    v-else
    class="lowcode-void-container"
    :class="schema['x-class']"
    :style="{ ...containerStyle, ...schema['x-style'] }"
    :data-field-id="schema['x-id']"
  >
    <XLayout
      v-if="schema.properties"
      :properties="schema.properties"
      :form-model="formModel"
      :path-prefix="pathPrefix"
      :columns="props.columns ?? 1"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import type { VoidFieldSchema } from '../types/schema'
import type { FormModel } from '../types/model'
import XLayout from './XLayout.vue'

// ============================================================
// Props
// ============================================================

interface Props {
  schema: VoidFieldSchema
  formModel: FormModel | null
  fieldKey: string
  /** 父节点的数据路径前缀（虚字段本身不会改变这个路径） */
  pathPrefix: string
  /** 布局列数，透传给子 XLayout */
  columns?: number
}

const props = defineProps<Props>()

// ============================================================
// 计算属性
// ============================================================

const componentName = computed(() => props.schema['x-component'])

const componentProps = computed(() => props.schema['x-component-props'] ?? {})

/**
 * 容器根元素的定位样式
 *
 * 关键：容器默认 position: relative，建立内部 absolute 子节点的定位上下文。
 * 如果容器本身是 absolute，则其 absolute 子节点相对于画布（而非容器）定位。
 */
const containerStyle = computed((): CSSProperties => {
  const base: CSSProperties = {}

  if (props.schema['x-position-type'] === 'absolute') {
    const pos = props.schema['x-position']
    Object.assign(base, {
      position: 'absolute',
      left: `${pos?.x ?? 0}px`,
      top: `${pos?.y ?? 0}px`,
      width: `${pos?.width ?? 400}px`,
      height: `${pos?.height ?? 200}px`,
      boxSizing: 'border-box',
    })
  } else {
    // relative（默认）：建立定位上下文，供 absolute 子节点定位
    Object.assign(base, { position: 'relative' as const })
  }

  return base
})
</script>

<style scoped>
.lowcode-void-card :deep(.el-card__body) {
  padding: 12px;
  min-width: 0;
}

.lowcode-void-tabs :deep(.el-tabs__content) {
  padding: 16px 0 0;
}

.lowcode-void-container {
  min-width: 0;
}
</style>
