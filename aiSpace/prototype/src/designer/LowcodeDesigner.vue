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
        <el-button size="small" @click="triggerImportFile">导入 Schema</el-button>
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
          @material-click="(m) => handleMaterialClick(m, layoutMode === 'free')"
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
          </div>

          <!-- Absolute 节点交互层（处理自由布局节点的拖拽缩放） -->
          <AbsoluteNodeOverlay
            v-if="currentSchema"
            :schema="currentSchema"
            :selected-node-id="engine.selectedNodeId.value"
            @select-node="engine.selectNode"
            @remove-node="handleRemoveNode"
            @duplicate-node="handleDuplicateNode"
            @update-node-position="handleUpdateNodePosition"
            @update-node-size="handleUpdateNodeSize"
            @save-snapshot="engine.saveNodePositionSnapshot"
          />

          <!-- 流式布局交互层（处理 hover 高亮、点击选中、拖拽排序、上下移动） -->
          <DesignOverlay
            v-if="currentSchema"
            :schema="currentSchema"
            :selected-node-id="engine.selectedNodeId.value"
            :canvas-el="canvasRef"
            @select-node="engine.selectNode"
            @remove-node="handleRemoveNode"
            @duplicate-node="handleDuplicateNode"
            @move-node="handleMoveNode"
            @reorder-nodes="handleReorderNodes"
            @move-to-container="handleMoveToContainer"
            @move-across-containers="handleMoveAcrossContainers"
          />
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

    <!-- 隐藏的文件上传 input -->
    <input
      ref="importFileInputRef"
      type="file"
      accept=".json,application/json"
      class="hidden"
      @change="handleFileSelected"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, provide } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { RefreshLeft, RefreshRight, Plus } from "@element-plus/icons-vue";
import type { PageSchema, FieldSchema } from "../core/schema";
import { useDesignerEngine } from "./engine/designerEngine";
import { useMaterialDrag } from "./composables/useMaterialDrag";
import { useKeyboardShortcuts } from "./composables/useKeyboardShortcuts";
import FormRenderer from "../renderer/FormRenderer.vue";
import MaterialPalette from "./MaterialPalette.vue";
import PageProperties from "./PageProperties.vue";
import FieldProperties from "./FieldProperties.vue";
import AbsoluteNodeOverlay from "./AbsoluteNodeOverlay.vue";
import DesignOverlay from "./DesignOverlay.vue";
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
const importFileInputRef = ref<HTMLInputElement | null>(null);

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
  engine.updateNodePosition(nodeId, updates);
}

function handleUpdateNodeSize(
  nodeId: string,
  updates: { width: number; height: number },
): void {
  engine.updateNodeSize(nodeId, updates);
}

function handleRemoveNode(nodeId: string): void {
  engine.removeNode(nodeId);
}

function handleDuplicateNode(nodeId: string): void {
  engine.duplicateNode(nodeId);
}

function handleMoveNode(nodeId: string, direction: 'up' | 'down'): void {
  engine.moveNode(nodeId, direction);
}

function handleReorderNodes(
  fromId: string,
  toId: string,
  position: 'before' | 'after'
): void {
  engine.sortNodes(fromId, toId, position);
}

function handleMoveToContainer(nodeId: string, containerId: string): void {
  engine.moveNodeToContainer(nodeId, containerId);
}

function handleMoveAcrossContainers(
  nodeId: string,
  targetId: string,
  position: 'before' | 'after'
): void {
  engine.moveNodeAcrossContainers(nodeId, targetId, position);
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

// ============================================================
// 导入 Schema
// ============================================================

/**
 * 导入校验结果
 */
interface ValidationResult {
  /** 是否通过致命校验 */
  valid: boolean;
  /** 致命错误消息（校验失败时） */
  error?: string;
  /** 警告消息列表（非致命，可补全的字段缺失） */
  warnings: string[];
  /** 校验通过后可直接使用的 schema */
  schema?: PageSchema;
}

/**
 * 校验导入的 Schema 结构
 * - 致命错误：JSON 解析失败、version 缺失、schema.type !== 'object'
 * - 警告：缺少 id、__meta__（可补全，不阻断）
 */
function validateImportedSchema(raw: unknown): ValidationResult {
  // 1. 类型检查
  if (!raw || typeof raw !== 'object') {
    return { valid: false, error: '文件格式错误，请选择有效的 JSON 文件', warnings: [] };
  }

  const obj = raw as Record<string, unknown>;

  // 2. 致命校验
  if (!obj.version) {
    return { valid: false, error: 'Schema 缺少 version 字段，无法识别版本', warnings: [] };
  }

  if (!obj.schema || typeof obj.schema !== 'object') {
    return { valid: false, error: 'Schema 结构不完整，缺少 schema 字段', warnings: [] };
  }

  const schema = obj.schema as Record<string, unknown>;
  if (schema.type !== 'object') {
    return { valid: false, error: 'Schema 的根类型必须是 object', warnings: [] };
  }

  if (!schema.properties || typeof schema.properties !== 'object') {
    return { valid: false, error: 'Schema 缺少 properties 字段', warnings: [] };
  }

  // 3. 警告检测（可补全的字段缺失）
  const warnings: string[] = [];
  if (!obj.id) {
    warnings.push('缺少 id 字段，将自动生成');
  }
  if (!obj.__meta__) {
    warnings.push('缺少 __meta__ 元信息，将使用默认值');
  }

  return {
    valid: true,
    warnings,
    schema: raw as PageSchema,
  };
}

/**
 * 触发文件选择器
 */
function triggerImportFile(): void {
  importFileInputRef.value?.click();
}

/**
 * 处理文件选择
 */
function handleFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  // 重置 input，允许重复选择同一文件
  input.value = '';

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      if (!content.trim()) {
        ElMessage.warning('文件内容为空');
        return;
      }

      const parsed = JSON.parse(content);
      const validation = validateImportedSchema(parsed);

      if (!validation.valid) {
        ElMessage.error(validation.error);
        return;
      }

      // 自动补全缺失字段
      const schema = validation.schema!;
      if (!schema.id) {
        schema.id = generateSchemaId();
      }
      if (!schema.__meta__) {
        schema.__meta__ = {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      } else {
        schema.__meta__.updatedAt = new Date().toISOString();
      }

      // 警告提示
      if (validation.warnings.length > 0) {
        console.warn('[Import] Warnings:', validation.warnings.join('; '));
      }

      // 确认覆盖
      if (!isSchemaEmpty.value) {
        ElMessageBox.confirm(
          '当前画布已有内容，导入将覆盖现有设计。是否继续？',
          '确认导入',
          { confirmButtonText: '导入', cancelButtonText: '取消', type: 'warning' }
        )
          .then(() => doImport(schema))
          .catch(() => {});
      } else {
        doImport(schema);
      }
    } catch {
      ElMessage.error('文件格式错误，请选择有效的 JSON 文件');
    }
  };

  reader.readAsText(file);
}

/**
 * 执行导入
 */
function doImport(schema: PageSchema): void {
  engine.loadSchema(schema);
  ElMessage.success('Schema 导入成功');
}

/**
 * 生成简短 ID
 */
function generateSchemaId(): string {
  return `schema_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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
  position: relative; /* 让 AbsoluteNodeOverlay 有正确的定位上下文 */
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
  width: 100%;
}

.canvas-renderer__preview {
  width: 100%;
  display: block;
}

/* designMode 下禁止表单交互（通过 CSS 选择器） */
.canvas-renderer__preview :deep(.el-input__wrapper),
.canvas-renderer__preview :deep(.el-textarea__inner),
.canvas-renderer__preview :deep(.el-select__wrapper),
.canvas-renderer__preview :deep(.el-input-number),
.canvas-renderer__preview :deep(.el-date-editor),
.canvas-renderer__preview :deep(.el-checkbox__input),
.canvas-renderer__preview :deep(.el-radio__input) {
  pointer-events: none;
  cursor: default;
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
  overflow-y: auto;
  overflow-x: hidden;
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

/* 隐藏文件上传 input */
.hidden {
  display: none;
}
</style>
