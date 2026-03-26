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
import { useComponentRegistry, type WidgetMeta } from '../types/componentRegistry'
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

// ============================================================
// 状态
// ============================================================

const searchKeyword = ref('')
const activeCategories = ref(['basic', 'container', 'business'])

// 从 ComponentRegistry 获取物料元信息
const registry = useComponentRegistry()

// ============================================================
// 计算属性
// ============================================================

// 从 ComponentRegistry 构建分类列表
const filteredCategories = computed(() => {
  const metas = registry.getAllWidgetMetas()

  // 按 category 分组
  const grouped: Record<string, WidgetMeta[]> = {}
  for (const meta of metas) {
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      if (!meta.label.toLowerCase().includes(keyword) && !meta.name.toLowerCase().includes(keyword)) {
        continue
      }
    }

    if (!grouped[meta.category]) {
      grouped[meta.category] = []
    }
    grouped[meta.category].push(meta)
  }

  // 转换为数组格式
  return Object.entries(grouped)
    .map(([name, metas]) => ({
      name,
      label: getCategoryLabel(name),
      materials: metas.map(m => ({
        name: m.name,
        icon: undefined,
        label: m.label,
        category: m.category,
        defaultSchema: {
          type: m.defaultSchema.type ?? 'string',
          title: m.label,
          'x-component': m.name,
        } as Partial<FieldSchema>,
      })),
    }))
    .filter(cat => cat.materials.length > 0)
})

function getCategoryLabel(name: string): string {
  const labels: Record<string, string> = {
    basic: '基础组件',
    container: '容器组件',
    select: '选择组件',
    date: '日期时间',
    advanced: '高级组件',
    business: '业务组件',
  }
  return labels[name] ?? name
}

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