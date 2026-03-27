<!--
  VoidContainer.vue
  虚字段容器渲染器 —— 处理 type: 'void' 的节点

  虚字段是纯 UI 容器（Card、Tabs、Collapse 等），不参与数据绑定。
  其子字段的数据路径会"穿透"虚字段，直接挂在父节点下（借鉴 Formily VoidField）。

  定位逻辑由 XLayout 统一管理，通过 nodeStyle prop 传入。
  - position: relative（默认）→ 容器建立定位上下文，内部 absolute 子节点相对于此容器定位
  - position: absolute → 容器本身自由定位，其 absolute 子节点相对于画布定位
-->
<template>
  <el-card
    v-if="componentName === 'Card'"
    v-bind="componentProps"
    class="lowcode-void-card mb-4"
    :class="schema['x-class']"
    :data-field-id="schema['x-id']"
    :style="mergedStyle"
    @click="handleClick"
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
    :style="mergedStyle"
    @click="handleClick"
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
    :style="mergedStyle"
    @click="handleClick"
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

  <!-- Divider 分割线（不支持子节点，只应用基础样式） -->
  <el-divider
    v-else-if="componentName === 'Divider'"
    v-bind="componentProps"
    :class="schema['x-class']"
    :data-field-id="schema['x-id']"
    :style="schema['x-style']"
    @click="handleClick"
  >
    {{ componentProps.title }}
  </el-divider>

  <!-- 通用容器（div + XLayout 子节点） -->
  <div
    v-else
    class="lowcode-void-container"
    :class="schema['x-class']"
    :style="mergedStyle"
    :data-field-id="schema['x-id']"
    @click="handleClick"
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
import { computed, inject, type CSSProperties } from 'vue'
import type { VoidFieldSchema } from '../types/schema'
import type { FormModel } from '../core/model'
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
  /**
   * XLayout 传入的节点定位样式
   * - position: relative（默认）→ 容器建立定位上下文
   * - position: absolute → 容器自由定位
   */
  nodeStyle?: CSSProperties
  /** 点击节点事件（设计器模式选中） */
  onNodeClick?: (nodeId: string) => void
}

const props = withDefaults(defineProps<Props>(), {
  nodeStyle: () => ({}),
})

// ============================================================
// 注入设计器引擎
// ============================================================

const designerEngine: any = inject('designerEngine', null)

// ============================================================
// 计算属性
// ============================================================

const componentName = computed(() => props.schema['x-component'])

const componentProps = computed(() => props.schema['x-component-props'] ?? {})

/**
 * 合并样式：nodeStyle（定位）+ schema['x-style']（用户自定义）
 * nodeStyle 由 XLayout 根据 x-position-type 计算，优先级最高
 */
const mergedStyle = computed((): CSSProperties => {
  return {
    ...props.nodeStyle,
    ...(props.schema['x-style'] ?? {}),
  }
})

// ============================================================
// 事件处理
// ============================================================

function handleClick(): void {
  const nodeId = props.schema['x-id']
  if (!nodeId) return
  if (props.onNodeClick) {
    props.onNodeClick(nodeId)
  } else if (designerEngine) {
    designerEngine.selectNode(nodeId)
  }
}
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
