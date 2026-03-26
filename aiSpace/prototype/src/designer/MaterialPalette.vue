/**
 * @file MaterialPalette.vue
 * @description 物料面板组件
 *
 * 功能：
 * 1. 展示可拖拽的组件列表
 * 2. 按分类组织组件
 * 3. 支持搜索过滤
 */

<template>
  <div class="material-palette">
    <!-- 搜索框 -->
    <div class="palette-search">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索组件"
        :prefix-icon="Search"
        clearable
        size="small"
      />
    </div>

    <!-- 组件分类列表 -->
    <el-collapse v-model="activeCategories" class="palette-collapse">
      <el-collapse-item
        v-for="category in filteredCategories"
        :key="category.name"
        :title="category.label"
        :name="category.name"
      >
        <div class="material-grid">
          <div
            v-for="material in category.materials"
            :key="material.name"
            class="material-item"
            draggable="true"
            @dragstart="onDragStart($event, material)"
            @click="onMaterialClick(material)"
          >
            <div class="material-icon">
              <component :is="material.icon" v-if="material.icon" />
              <span v-else class="material-icon__text">{{ material.label.charAt(0) }}</span>
            </div>
            <div class="material-label">{{ material.label }}</div>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { useComponentRegistry } from '../types/componentRegistry'
import type { FieldSchema } from '../types/schema'

// ============================================================
// 物料定义
// ============================================================

interface Material {
  name: string
  label: string
  icon?: any
  category: string
  defaultSchema: Partial<FieldSchema>
}

interface MaterialCategory {
  name: string
  label: string
  materials: Material[]
}

// 内置物料
const builtinMaterials: Material[] = [
  // 基础组件
  {
    name: 'Input',
    label: '输入框',
    category: 'basic',
    defaultSchema: {
      type: 'string',
      title: '输入框',
      'x-component': 'Input',
      'x-component-props': { placeholder: '请输入' },
    },
  },
  {
    name: 'Textarea',
    label: '文本域',
    category: 'basic',
    defaultSchema: {
      type: 'string',
      title: '文本域',
      'x-component': 'Textarea',
      'x-component-props': { rows: 4 },
    },
  },
  {
    name: 'InputNumber',
    label: '数字输入',
    category: 'basic',
    defaultSchema: {
      type: 'number',
      title: '数字',
      'x-component': 'InputNumber',
    },
  },
  {
    name: 'Select',
    label: '下拉选择',
    category: 'basic',
    defaultSchema: {
      type: 'string',
      title: '下拉选择',
      'x-component': 'Select',
      enum: ['选项1', '选项2', '选项3'],
    },
  },
  {
    name: 'DatePicker',
    label: '日期选择',
    category: 'basic',
    defaultSchema: {
      type: 'string',
      title: '日期',
      'x-component': 'DatePicker',
    },
  },
  {
    name: 'Switch',
    label: '开关',
    category: 'basic',
    defaultSchema: {
      type: 'boolean',
      title: '开关',
      'x-component': 'Switch',
    },
  },

  // 容器组件
  {
    name: 'Card',
    label: '卡片容器',
    category: 'container',
    defaultSchema: {
      type: 'void',
      title: '卡片',
      'x-component': 'Card',
      'x-component-props': { title: '卡片标题' },
      properties: {},
    },
  },
  {
    name: 'Tabs',
    label: '标签页',
    category: 'container',
    defaultSchema: {
      type: 'void',
      'x-component': 'Tabs',
      properties: {
        tab1: {
          type: 'void',
          'x-component': 'TabPane',
          'x-component-props': { label: '标签1' },
          properties: {},
        },
        tab2: {
          type: 'void',
          'x-component': 'TabPane',
          'x-component-props': { label: '标签2' },
          properties: {},
        },
      },
    },
  },
  {
    name: 'Collapse',
    label: '折叠面板',
    category: 'container',
    defaultSchema: {
      type: 'void',
      'x-component': 'Collapse',
      properties: {},
    },
  },
  {
    name: 'Divider',
    label: '分割线',
    category: 'container',
    defaultSchema: {
      type: 'void',
      'x-component': 'Divider',
    },
  },

  // 业务组件
  {
    name: 'RemoteSelect',
    label: '远程选择',
    category: 'business',
    defaultSchema: {
      type: 'string',
      title: '远程选择',
      'x-component': 'RemoteSelect',
    },
  },
  {
    name: 'DialogPicker',
    label: '弹窗选择',
    category: 'business',
    defaultSchema: {
      type: 'string',
      title: '弹窗选择',
      'x-component': 'DialogPicker',
    },
  },
  {
    name: 'SubFormTable',
    label: '子表格',
    category: 'business',
    defaultSchema: {
      type: 'array',
      title: '子表格',
      'x-component': 'SubFormTable',
      'x-relation': {
        type: 'one-to-many',
        target: 'sub_table',
        foreignKey: 'parent_id',
      },
    },
  },
]

// 分类定义
const categories: MaterialCategory[] = [
  { name: 'basic', label: '基础组件', materials: builtinMaterials.filter(m => m.category === 'basic') },
  { name: 'container', label: '容器组件', materials: builtinMaterials.filter(m => m.category === 'container') },
  { name: 'business', label: '业务组件', materials: builtinMaterials.filter(m => m.category === 'business') },
]

// ============================================================
// 状态
// ============================================================

const searchKeyword = ref('')
const activeCategories = ref(['basic', 'container', 'business'])

// ============================================================
// 计算属性
// ============================================================

const filteredCategories = computed(() => {
  if (!searchKeyword.value) return categories

  const keyword = searchKeyword.value.toLowerCase()
  return categories
    .map(cat => ({
      ...cat,
      materials: cat.materials.filter(
        m => m.label.toLowerCase().includes(keyword) || m.name.toLowerCase().includes(keyword)
      ),
    }))
    .filter(cat => cat.materials.length > 0)
})

// ============================================================
// 事件处理
// ============================================================

const emit = defineEmits<{
  (e: 'drag-start', material: Material, event: DragEvent): void
  (e: 'material-click', material: Material): void
}>()

const onDragStart = (e: DragEvent, material: Material) => {
  e.dataTransfer?.setData('material', JSON.stringify(material))
  emit('drag-start', material, e)
}

const onMaterialClick = (material: Material) => {
  emit('material-click', material)
}
</script>

<style scoped>
.material-palette {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-right: 1px solid #e8e8e8;
}

.palette-search {
  padding: 12px;
  border-bottom: 1px solid #e8e8e8;
}

.palette-collapse {
  flex: 1;
  overflow-y: auto;
  border: none;
}

.palette-collapse :deep(.el-collapse-item__header) {
  background-color: #fafafa;
  padding: 0 12px;
  font-weight: 500;
}

.material-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 8px;
}

.material-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  cursor: grab;
  transition: all 0.2s;
}

.material-item:hover {
  border-color: #1890ff;
  background-color: #f0f7ff;
}

.material-item:active {
  cursor: grabbing;
}

.material-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 4px;
  font-size: 14px;
  color: #666;
}

.material-icon__text {
  font-size: 16px;
  font-weight: 600;
}

.material-label {
  font-size: 12px;
  color: #666;
  text-align: center;
}
</style>