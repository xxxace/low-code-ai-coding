<!-- 
  LowcodeDesigner.vue
  低代码设计器主入口 —— 三栏布局
  
  布局：
  ┌──────────┬───────────────────────────────┬──────────────────┐
  │  物料面板  │  中间画布（Renderer 预览模式）  │   属性面板         │
  │ Palette  │  Canvas（包含拖拽叠加层）       │  Properties      │
  └──────────┴───────────────────────────────┴──────────────────┘
  
  设计原则：
  - 画布复用 Renderer，在其上叠加拖拽交互层
  - 属性面板根据选中节点动态渲染对应的配置面板
  - 键盘快捷键由 useKeyboardShortcuts 统一处理
  - 物料拖拽由 useMaterialDrag 统一处理
-->
<template>
  <div class="lowcode-designer" @keydown="handleKeyDown" tabindex="0">
    <!-- 顶部工具栏 -->
    <div class="lowcode-designer__toolbar">
      <div class="toolbar-left">
        <span class="text-sm font-medium text-gray-700">{{
          currentSchema?.name ?? "未命名表单"
        }}</span>
      </div>

      <div class="toolbar-center flex items-center gap-2">
        <!-- 布局模式切换 -->
        <el-radio-group v-model="layoutMode" size="small">
          <el-radio-button value="flow">流式布局</el-radio-button>
          <el-radio-button value="free">自由布局</el-radio-button>
        </el-radio-group>
      </div>

      <div class="toolbar-right flex items-center gap-2">
        <!-- 撤销/重做 -->
        <el-button-group size="small">
          <el-button
            :disabled="!engine.canUndo.value"
            @click="engine.undo()"
            title="撤销 (Ctrl+Z)"
          >
            <el-icon><RefreshLeft /></el-icon>
          </el-button>
          <el-button
            :disabled="!engine.canRedo.value"
            @click="engine.redo()"
            title="重做 (Ctrl+Y)"
          >
            <el-icon><RefreshRight /></el-icon>
          </el-button>
        </el-button-group>

        <el-button size="small" @click="showPreview = true">预览</el-button>
        <el-button size="small" type="primary" @click="handleExport"
          >导出 Schema</el-button
        >
        <el-button size="small" @click="showCodeDialog = true"
          >生成代码</el-button
        >
      </div>
    </div>

    <!-- 主体区域 -->
    <div class="lowcode-designer__main">
      <!-- 左侧物料面板 -->
      <div class="lowcode-designer__palette">
        <MaterialPalette
          @drag-start="handleMaterialDragStartFromPalette"
          @material-click="handleMaterialClick"
        />
      </div>

      <!-- 中间画布 -->
      <div
        class="lowcode-designer__canvas"
        @dragover.prevent
        @drop="(e) => handleCanvasDrop(e, canvasRef, layoutMode === 'free')"
        @click.self="engine.selectNode(null)"
      >
        <div
          ref="canvasRef"
          class="canvas-container"
          @click.self="engine.selectNode(null)"
        >
          <!-- 空状态提示 -->
          <div v-if="isSchemaEmpty" class="canvas-empty">
            <el-icon class="text-4xl text-gray-300"><Plus /></el-icon>
            <p class="text-gray-400 mt-2">拖拽左侧组件到此处</p>
          </div>

          <!-- Renderer 预览（设计模式下禁用交互） -->
          <div v-else-if="currentSchema" class="canvas-renderer">
            <FormRenderer
              :schema="currentSchema"
              :design-mode="true"
              class="canvas-renderer__preview"
            />

            <template v-if="currentSchema.layoutMode === 'free'">
              <FreeCanvas
                :schema="currentSchema"
                :selected-node-id="engine.selectedNodeId.value"
                :canvas-el="canvasRef"
                @select-node="engine.selectNode($event)"
                @remove-node="engine.removeNode($event)"
                @update-node-position="handleUpdateNodePosition"
                @update-node-size="handleUpdateNodeSize"
              />
            </template>

            <template v-else>
              <DesignOverlay
                :schema="currentSchema"
                :selected-node-id="engine.selectedNodeId.value"
                :canvas-el="canvasRef"
                @select-node="engine.selectNode($event)"
                @remove-node="engine.removeNode($event)"
                @duplicate-node="engine.duplicateNode($event)"
                @move-node="
                  (nodeId, dir) => engine.moveNode(nodeId, dir as 'up' | 'down')
                "
                @reorder-nodes="
                  (fromId, toId) => engine.sortNodes(fromId, toId, 'before')
                "
              />
            </template>
          </div>
        </div>
      </div>

      <!-- 右侧属性面板 -->
      <div class="lowcode-designer__properties">
        <div class="properties-header">
          {{ engine.selectedNodeSchema.value ? "字段属性" : "页面属性" }}
        </div>
        <div class="properties-content">
          <PageProperties
            v-if="!engine.selectedNodeSchema.value && currentSchema"
            :schema="currentSchema"
            @update="handlePagePropsUpdate"
          />

          <FieldProperties
            v-else-if="engine.selectedNodeSchema.value"
            :schema="engine.selectedNodeSchema.value"
            :node-id="engine.selectedNodeId.value!"
            @update="handleFieldPropsUpdate"
          />
        </div>
      </div>
    </div>

    <!-- 预览弹窗 -->
    <el-dialog
      v-model="showPreview"
      title="表单预览"
      width="800px"
      destroy-on-close
    >
      <FormRenderer v-if="currentSchema" :schema="currentSchema" />
    </el-dialog>

    <!-- 代码弹窗 -->
    <el-dialog v-model="showCodeDialog" title="生成代码" width="800px">
      <pre class="code-preview">{{ generatedCode }}</pre>
      <template #footer>
        <el-button @click="copyCode">复制代码</el-button>
        <el-button @click="showCodeDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, provide } from "vue";
import { ElMessage } from "element-plus";
import { RefreshLeft, RefreshRight, Plus } from "@element-plus/icons-vue";
import type { PageSchema, FieldSchema } from "../core/schema";
import { useDesignerEngine } from "./engine/designerEngine";
import { useMaterialDrag } from "./composables/useMaterialDrag";
import { useKeyboardShortcuts } from "./composables/useKeyboardShortcuts";
import FormRenderer from "../renderer/FormRenderer.vue";
import MaterialPalette from "./MaterialPalette.vue";
import DesignOverlay from "./DesignOverlay.vue";
import FreeCanvas from "./FreeCanvas.vue";
import PageProperties from "./PageProperties.vue";
import FieldProperties from "./FieldProperties.vue";
import {
  createDefaultRegistry,
  COMPONENT_REGISTRY_KEY,
} from "../core/registry";

// ============================================================
// Props & Emits
// ============================================================

interface Props {
  initialSchema?: PageSchema;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "export", schema: PageSchema): void;
}>();

// ============================================================
// 设计器引擎 & Composables
// ============================================================

const engine = useDesignerEngine();
provide("designerEngine", engine);

const componentRegistry = createDefaultRegistry();
provide(COMPONENT_REGISTRY_KEY, componentRegistry);

const {
  handleMaterialDragStartFromPalette,
  handleMaterialClick,
  handleCanvasDrop,
} = useMaterialDrag(engine);
const { handleKeyDown } = useKeyboardShortcuts(engine);

// ============================================================
// 状态
// ============================================================

const canvasRef = ref<HTMLElement | null>(null);
const showPreview = ref(false);
const showCodeDialog = ref(false);

const currentSchema = computed(() => engine.schema.value);

const isSchemaEmpty = computed(() => {
  if (!currentSchema.value) return true;
  return Object.keys(currentSchema.value.schema.properties).length === 0;
});

const layoutMode = computed({
  get: () => currentSchema.value?.layoutMode ?? "flow",
  set: (mode) => {
    if (!engine.schema.value) return;
    const newSchema = JSON.parse(JSON.stringify(engine.schema.value));
    newSchema.layoutMode = mode;
    engine.loadSchema(newSchema);
  },
});

const generatedCode = computed(() => engine.generateCode());

// ============================================================
// 生命周期
// ============================================================

if (props.initialSchema) {
  engine.loadSchema(props.initialSchema);
} else {
  engine.loadSchema(engine.createEmptySchema());
}

// ============================================================
// 事件处理
// ============================================================

function handlePagePropsUpdate(updates: Partial<PageSchema>): void {
  if (!engine.schema.value) return;
  if (updates.name !== undefined) engine.schema.value.name = updates.name;
  if (updates.formConfig) {
    Object.assign(engine.schema.value.formConfig, updates.formConfig);
  }
  engine.saveSnapshot();
}

function handleFieldPropsUpdate(
  nodeId: string,
  updates: Partial<FieldSchema>,
): void {
  if (!engine.schema.value) return;
  const newSchema = JSON.parse(JSON.stringify(engine.schema.value));

  function findAndUpdate(properties: Record<string, FieldSchema>): boolean {
    for (const [key, schema] of Object.entries(properties)) {
      if (schema["x-id"] === nodeId) {
        Object.assign(properties[key], updates);
        return true;
      }
      if ("properties" in schema && schema.properties) {
        if (findAndUpdate(schema.properties)) return true;
      }
    }
    return false;
  }

  findAndUpdate(newSchema.schema.properties);
  engine.schema.value = newSchema;
  engine.saveSnapshot();
}

function handleUpdateNodePosition(
  nodeId: string,
  updates: { x: number; y: number },
): void {
  engine.updateNodeFreePosition(nodeId, updates);
}

function handleUpdateNodeSize(
  nodeId: string,
  updates: { width: number; height: number },
): void {
  engine.updateNodeFreeSize(nodeId, updates);
}

function handleExport(): void {
  const schema = engine.exportSchema();
  if (schema) {
    emit("export", schema);
    const blob = new Blob([JSON.stringify(schema, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${schema.name}.schema.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

function copyCode(): void {
  navigator.clipboard.writeText(generatedCode.value);
  ElMessage.success("代码已复制到剪贴板");
}
</script>

<style scoped>
.lowcode-designer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f0f2f5;
  outline: none;
}

.lowcode-designer__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  height: 48px;
  flex-shrink: 0;
}

.lowcode-designer__main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.lowcode-designer__palette {
  width: 200px;
  background: #fff;
  border-right: 1px solid #e8e8e8;
  overflow-y: auto;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.lowcode-designer__canvas {
  flex: 1;
  overflow: auto;
  padding: 16px;
  background: #f0f2f5;
  min-height: 0;
  min-width: 0;
}

.canvas-container {
  min-height: 600px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: visible;
}

.canvas-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  pointer-events: none;
}

.canvas-renderer {
  position: relative;
  width: 100%;
}

.canvas-renderer__preview {
  pointer-events: none;
  width: 100%;
  display: block;
}

.lowcode-designer__properties {
  display: flex;
  flex-direction: column;
  width: 280px;
  background: #fff;
  border-left: 1px solid #e8e8e8;
  overflow-y: auto;
  flex-shrink: 0;
  position: relative;
}

.properties-header {
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #606266;
  border-bottom: 1px solid #f0f0f0;
}

.properties-content {
  flex: 1;
  padding: 12px;
  overflow: auto;
}

.code-preview {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 16px;
  border-radius: 4px;
  overflow: auto;
  font-size: 12px;
  line-height: 1.6;
  max-height: 500px;
}
</style>
