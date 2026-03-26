<!-- 
  VoidContainer.vue
  虚字段容器渲染器 —— 处理 type: 'void' 的节点
  
  虚字段是纯 UI 容器（Card、Tabs、Collapse 等），不参与数据绑定。
  其子字段的数据路径会"穿透"虚字段，直接挂在父节点下（借鉴 Formily VoidField）。
-->
<template>
  <!-- Card 容器 -->
  <el-card
    v-if="componentName === 'Card'"
    v-bind="componentProps"
    class="lowcode-void-card mb-4"
    :class="schema['x-class']"
  >
    <template v-if="componentProps.title" #header>
      <span>{{ componentProps.title }}</span>
    </template>
    <FlowLayout
      v-if="schema.properties"
      :properties="schema.properties"
      :form-model="formModel"
      :path-prefix="pathPrefix"
    />
  </el-card>

  <!-- Tabs 容器 -->
  <el-tabs
    v-else-if="componentName === 'Tabs'"
    v-bind="componentProps"
    class="lowcode-void-tabs"
    :class="schema['x-class']"
  >
    <template v-for="(paneSchema, paneKey) in schema.properties" :key="paneKey">
      <el-tab-pane
        v-if="paneSchema['x-component'] === 'TabPane'"
        :label="paneSchema['x-component-props']?.label ?? String(paneKey)"
        :name="String(paneKey)"
      >
        <FlowLayout
          v-if="paneSchema.properties"
          :properties="paneSchema.properties"
          :form-model="formModel"
          :path-prefix="pathPrefix"
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
  >
    <template v-for="(itemSchema, itemKey) in schema.properties" :key="itemKey">
      <el-collapse-item
        v-if="itemSchema['x-component'] === 'CollapseItem'"
        :title="itemSchema['x-component-props']?.label ?? String(itemKey)"
        :name="String(itemKey)"
      >
        <FlowLayout
          v-if="itemSchema.properties"
          :properties="itemSchema.properties"
          :form-model="formModel"
          :path-prefix="pathPrefix"
        />
      </el-collapse-item>
    </template>
  </el-collapse>

  <!-- Divider 分割线 -->
  <el-divider
    v-else-if="componentName === 'Divider'"
    v-bind="componentProps"
    :class="schema['x-class']"
  >
    {{ componentProps.title }}
  </el-divider>

  <!-- 通用容器（div + FlowLayout 子节点） -->
  <div
    v-else
    class="lowcode-void-container"
    :class="schema['x-class']"
    :style="schema['x-style']"
  >
    <FlowLayout
      v-if="schema.properties"
      :properties="schema.properties"
      :form-model="formModel"
      :path-prefix="pathPrefix"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { VoidFieldSchema } from '../types/schema'
import type { FormModel } from '../types/model'
import FlowLayout from './FlowLayout.vue'

// ============================================================
// Props
// ============================================================

interface Props {
  schema: VoidFieldSchema
  formModel: FormModel | null
  fieldKey: string
  /** 父节点的数据路径前缀（虚字段本身不会改变这个路径） */
  pathPrefix: string
}

const props = defineProps<Props>()

// ============================================================
// 计算属性
// ============================================================

const componentName = computed(() => props.schema['x-component'])

const componentProps = computed(() => props.schema['x-component-props'] ?? {})
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
