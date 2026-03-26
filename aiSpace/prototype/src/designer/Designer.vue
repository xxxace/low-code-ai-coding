/**
 * @file Designer.vue
 * @description 低代码设计器主组件
 *
 * 架构：
 * ┌──────────────┬───────────────────────────────┬──────────────────┐
 * │   物料面板    │           画布区域              │    属性面板       │
 * │  (Palette)   │          (Canvas)              │  (Properties)    │
 * │              │                               │                  │
 * │  - 基础组件   │    [Flow / Free 布局切换]       │  - 字段属性       │
 * │  - 容器组件   │                               │  - 样式设置       │
 * │  - 业务组件   │                               │  - 联动配置       │
 * │              │                               │  - 校验规则       │
 * └──────────────┴───────────────────────────────┴──────────────────┘
 */

<template>
  <div class="lowcode-designer">
    <!-- 工具栏 -->
    <div class="designer-toolbar">
      <div class="toolbar-left">
        <el-button-group>
          <el-button
            :type="layoutMode === 'flow' ? 'primary' : 'default'"
            size="small"
            @click="setLayoutMode('flow')"
          >
            流式布局
          </el-button>
          <el-button
            :type="layoutMode === 'free' ? 'primary' : 'default'"
            size="small"
            @click="setLayoutMode('free')"
          >
            自由布局
          </el-button>
        </el-button-group>

        <el-divider direction="vertical" />

        <el-button-group>
          <el-button size="small" :disabled="!canUndo" @click="undo">
            <el-icon><Back /></el-icon>
            撤销
          </el-button>
          <el-button size="small" :disabled="!canRedo" @click="redo">
            <el-icon><Right /></el-icon>
            重做
          </el-button>
        </el-button-group>
      </div>

      <div class="toolbar-center">
        <span class="schema-name">{{ schema?.name ?? '未命名表单' }}</span>
      </div>

      <div class="toolbar-right">
        <el-button size="small" @click="preview">
          <el-icon><View /></el-icon>
          预览
        </el-button>
        <el-button size="small" @click="exportJSON">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
        <el-button type="primary" size="small" @click="generateCode">
          <el-icon><Document /></el-icon>
          生成代码
        </el-button>
      </div>
    </div>

    <!-- 三栏布局 -->
    <div class="designer-body">
      <!-- 物料面板 -->
      <div class="designer-palette" :style="{ width: `${paletteWidth}px` }">
        <MaterialPalette
          @drag-start="onMaterialDragStart"
          @material-click="onMaterialClick"
        />
      </div>

      <!-- 画布区域 -->
      <div
        class="designer-canvas"
        @dragover.prevent
        @drop="onCanvasDrop"
      >
        <!-- 流式布局画布 -->
        <div v-if="layoutMode === 'flow'" class="canvas-flow">
          <FlowLayout
            v-if="schema"
            :properties="schema.schema.properties"
            :form-model="previewFormModel"
            path-prefix=""
          />
          <div v-else class="canvas-empty">
            <el-empty description="拖拽左侧组件到此处" />
          </div>
        </div>

        <!-- 自由布局画布 -->
        <FreeCanvas
          v-else
          :nodes="schema?.schema.properties ?? {}"
          :width="1920"
          :height="1080"
          :selected-node-id="selectedNodeId"
          @update:selected-node-id="selectNode"
          @update:position="updateNodePosition"
          @node-select="onNodeSelect"
        >
          <template #node="{ nodeSchema }">
            <div class="free-node-content">
              {{ nodeSchema.title ?? '未命名' }}
            </div>
          </template>
        </FreeCanvas>
      </div>

      <!-- 属性面板 -->
      <div class="designer-properties" :style="{ width: `${propertiesWidth}px` }">
        <PropertyPanel
          :selected-schema="selectedNodeSchema"
          @update="updateNodeProp"
        />
      </div>
    </div>

    <!-- 预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      title="表单预览"
      width="800px"
      destroy-on-close
    >
      <FormRenderer
        v-if="previewVisible && schema"
        :schema="schema"
        @submit="onPreviewSubmit"
      />
    </el-dialog>

    <!-- 代码预览对话框 -->
    <el-dialog
      v-model="codeVisible"
      title="生成的代码"
      width="800px"
    >
      <el-input
        v-model="generatedCode"
        type="textarea"
        :rows="20"
        readonly
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, provide } from 'vue'
import { Back, Right, View, Download, Document } from '@element-plus/icons-vue'
import MaterialPalette from './MaterialPalette.vue'
import PropertyPanel from './PropertyPanel.vue'
import FreeCanvas from './FreeCanvas.vue'
import FlowLayout from '../renderer/FlowLayout.vue'
import FormRenderer from '../renderer/FormRenderer.vue'
import { useDesignerEngine } from './designerEngine'
import { createDefaultRegistry, COMPONENT_REGISTRY_KEY } from '../types/componentRegistry'
import type { FieldSchema, FreePosition, LayoutMode } from '../types/schema'

// ============================================================
// 设计器引擎
// ============================================================

const {
  schema,
  selectedNodeId,
  selectedNodeSchema,
  canUndo,
  canRedo,
  loadSchema,
  createEmptySchema,
  undo,
  redo,
  addNode,
  updateNodeProps,
  selectNode,
  exportSchema,
  generateCode: engineGenerateCode,
} = useDesignerEngine()

// ============================================================
// 状态
// ============================================================

const layoutMode = ref<LayoutMode>('flow')
const paletteWidth = ref(240)
const propertiesWidth = ref(320)
const previewVisible = ref(false)
const codeVisible = ref(false)
const generatedCode = ref('')
const previewFormModel = ref<any>(null)

// 拖拽中的物料
const draggingMaterial = ref<any>(null)

// ============================================================
// 布局切换
// ============================================================

const setLayoutMode = (mode: LayoutMode) => {
  layoutMode.value = mode
  if (schema.value) {
    schema.value.layoutMode = mode
  }
}

// ============================================================
// 物料事件
// ============================================================

const onMaterialDragStart = (material: any, event: DragEvent) => {
  draggingMaterial.value = material
}

const onMaterialClick = (material: any) => {
  // 点击物料时添加到画布
  if (!schema.value) {
    loadSchema(createEmptySchema())
  }

  const fieldKey = `field_${Date.now()}`
  addNode('', fieldKey, material.defaultSchema as FieldSchema)
}

// ============================================================
// 画布事件
// ============================================================

const onCanvasDrop = (event: DragEvent) => {
  if (!draggingMaterial.value) return

  if (!schema.value) {
    loadSchema(createEmptySchema())
  }

  const material = draggingMaterial.value
  const fieldKey = `field_${Date.now()}`

  // 自由布局时添加坐标
  if (layoutMode.value === 'free') {
    const rect = (event.target as HTMLElement).getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    material.defaultSchema['x-free-position'] = {
      x,
      y,
      width: 200,
      height: 40,
      zIndex: 1,
    }
  }

  addNode('', fieldKey, material.defaultSchema as FieldSchema)
  draggingMaterial.value = null
}

const onNodeSelect = (nodeId: string, schema: FieldSchema) => {
  selectNode(nodeId)
}

const updateNodePosition = (nodeId: string, position: FreePosition) => {
  updateNodeProps(nodeId, { 'x-free-position': position })
}

const updateNodeProp = (path: string, value: any) => {
  if (!selectedNodeId.value) return
  updateNodeProps(selectedNodeId.value, { [path]: value })
}

// ============================================================
// 工具栏操作
// ============================================================

const preview = () => {
  previewVisible.value = true
}

const onPreviewSubmit = (values: Record<string, any>) => {
  console.log('预览提交:', values)
  previewVisible.value = false
}

const exportJSON = () => {
  const exported = exportSchema()
  if (!exported) return

  const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${exported.name}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const generateCode = () => {
  generatedCode.value = engineGenerateCode()
  codeVisible.value = true
}

// ============================================================
// 初始化
// ============================================================

// ============================================================
// 初始化
// ============================================================

// 创建并注入 ComponentRegistry
const componentRegistry = createDefaultRegistry()
provide(COMPONENT_REGISTRY_KEY, componentRegistry)

// 创建默认空 Schema
loadSchema(createEmptySchema('新表单'))
</script>

<style scoped>
.lowcode-designer {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f0f2f5;
}

.designer-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  background-color: #fff;
  border-bottom: 1px solid #e8e8e8;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.schema-name {
  font-weight: 500;
  color: #333;
}

.designer-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.designer-palette {
  flex-shrink: 0;
}

.designer-canvas {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.canvas-flow {
  min-height: 100%;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.canvas-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
}

.designer-properties {
  flex-shrink: 0;
}

.free-node-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  border-radius: 4px;
  font-size: 14px;
  color: #666;
}
</style>