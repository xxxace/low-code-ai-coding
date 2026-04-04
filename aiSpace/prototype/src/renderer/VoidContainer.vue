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
  <!-- 外层 wrapper：承载定位样式和操作按钮 -->
  <div
    ref="voidWrapperRef"
    class="void-wrapper"
    :class="[
      selectedClass,
      designMode ? 'design-mode' : '',
      isDragOver ? 'void-wrapper--drag-over' : ''
    ]"
    :style="wrapperStyle"
    :data-field-id="schema['x-id']"
    :data-container-type="schema['x-container'] !== undefined ? 'absolute' : 'relative'"
    @click="handleClick"
    @dragover.prevent="handleDragOver"
    @dragleave="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <!-- 操作按钮（流式布局）由 DesignOverlay 叠加层统一处理，不在此处渲染 -->
    <!-- absolute 容器由 AbsoluteNodeOverlay 处理 -->

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
    >
      <template
        v-for="(paneSchema, paneKey) in schema?.properties"
        :key="paneKey"
      >
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

    <!-- Collapse 容器（隐藏默认展开箭头） -->
    <el-collapse
      v-else-if="componentName === 'Collapse'"
      v-bind="componentProps"
      class="lowcode-void-collapse mb-4"
      :class="schema['x-class']"
      :style="{ '--el-collapse-header-font-size': '14px' }"
    >
      <template
        v-for="(itemSchema, itemKey) in schema?.properties"
        :key="itemKey"
      >
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
      :style="schema['x-style']"
    >
      {{ componentProps.title }}
    </el-divider>

    <!-- 通用容器 -->
    <div v-else class="lowcode-void-container" :class="schema['x-class']">
      <XLayout
        v-if="schema.properties"
        :properties="schema.properties"
        :form-model="formModel"
        :path-prefix="pathPrefix"
        :columns="props.columns ?? 1"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  inject,
  onBeforeUnmount,
  onMounted,
  nextTick,
  ref,
  type CSSProperties,
} from "vue";
// element-plus 组件由模板直接使用（Auto Import），此处无需显式 import
import type { VoidFieldSchema, FieldSchema } from "../core/schema";
import type { FormModel } from "../core/model";
import { injectDesignMode, injectSelectedNodeId, injectDesignerEngine } from "../core/injectionKeys";
import XLayout from "./XLayout.vue";

// ============================================================
// Props
// ============================================================

interface Props {
  schema: VoidFieldSchema;
  formModel: FormModel | null;
  fieldKey: string;
  /** 父节点的数据路径前缀（虚字段本身不会改变这个路径） */
  pathPrefix: string;
  /** 布局列数，透传给子 XLayout */
  columns?: number;
  /**
   * XLayout 传入的节点定位样式
   * - position: relative（默认）→ 容器建立定位上下文
   * - position: absolute → 容器自由定位
   */
  nodeStyle?: CSSProperties;
  /** 点击节点事件（设计器模式选中） */
  onNodeClick?: (nodeId: string) => void;
}

const props = withDefaults(defineProps<Props>(), {
  nodeStyle: () => ({}),
});

// ============================================================
// DOM Ref
// ============================================================

const voidWrapperRef = ref<HTMLDivElement | null>(null);

// ============================================================
// 注入设计器引擎（类型安全）
// ============================================================

const designerEngine = injectDesignerEngine(null);

/** 设计模式（ComputedRef<boolean>，模板中自动解包） */
const designMode = injectDesignMode(false);

/** 当前选中的节点 ID（由 XLayout 注入，类型安全） */
const selectedNodeId = injectSelectedNodeId(null);

/** 节点是否被选中 */
const isSelected = computed(() => {
  return designMode && props.schema["x-id"] === selectedNodeId.value;
});

/** 是否为 absolute 自由定位模式 */
const isAbsoluteMode = computed(
  () => props.schema["x-position-type"] === "absolute",
);

/** 选中高亮类名 */
const selectedClass = computed(() =>
  isSelected.value && !isAbsoluteMode.value ? "void-container--selected" : "",
);

/**
 * Wrapper 样式：承载定位和选中状态
 *
 * absolute 模式下：从 nodeStyle 中剔除 height，让内容自然撑开 wrapper，
 * 由 syncContainerSize 持续将 DOM 真实高度回写到 schema['x-position'].height。
 * 如果保留 height CSS 属性，wrapper 高度被锁死，ResizeObserver 无法感知内容变化。
 *
 * relative 模式下：透传全部 nodeStyle，CSS 语义不变。
 */
const wrapperStyle = computed((): CSSProperties => {
  if (isAbsoluteMode.value) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { height, ...rest } = props.nodeStyle as CSSProperties & {
      height?: unknown;
    };
    return rest as CSSProperties;
  }
  return { ...props.nodeStyle };
});

// ============================================================
// 计算属性
// ============================================================

const componentName = computed(() => props.schema["x-component"]);

const componentProps = computed(() => props.schema["x-component-props"] ?? {});

// ============================================================
// 自动尺寸同步（仅 absolute 模式 + 设计模式）
// ============================================================

/**
 * 将 wrapper DOM 的真实尺寸同步到 schema['x-position']
 * 供 AbsoluteNodeOverlay 读取，保证操作框与容器对齐
 */
function syncContainerSize(): void {
  // 守卫1：非设计模式 或 非 absolute 模式时跳过（ResizeObserver 异步回调时条件可能已变）
  if (!designMode.value || !isAbsoluteMode.value) return;
  if (!voidWrapperRef.value || !designerEngine) return;
  const nodeId = props.schema["x-id"];
  if (!nodeId) return;
  const rect = voidWrapperRef.value.getBoundingClientRect();
  // 守卫2：容器不可见时（如 Tabs 非激活页，display:none）getBoundingClientRect 返回全零，跳过
  if (rect.width === 0 && rect.height === 0) return;
  const currentWidth = props.schema["x-position"]?.width ?? 200;
  const currentHeight = props.schema["x-position"]?.height ?? 40;
  if (
    Math.abs(rect.width - currentWidth) > 1 ||
    Math.abs(rect.height - currentHeight) > 1
  ) {
    designerEngine.updateNodeSize(nodeId, {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    });
  }
}

// 防抖定时器 和 ResizeObserver 引用（实例级，每个 VoidContainer 独立持有）
const resizeTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const resizeObserver = ref<ResizeObserver | null>(null)

onMounted(async () => {
  if (!designMode.value || !isAbsoluteMode.value) return;
  await nextTick();
  // 首次精准同步（同 FieldRenderer 模式）
  syncContainerSize();
  // 注册 ResizeObserver，监听 Tabs 切换 / Collapse 展开等动态内容变化
  if (voidWrapperRef.value) {
    resizeObserver.value = new ResizeObserver(() => {
      if (resizeTimer.value) clearTimeout(resizeTimer.value);
      // 防抖 200ms：确保 el-collapse 展开动画（约 300ms）结束后再读高度
      resizeTimer.value = setTimeout(syncContainerSize, 200);
    });
    resizeObserver.value.observe(voidWrapperRef.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver.value?.disconnect();
  resizeObserver.value = null;
  if (resizeTimer.value) {
    clearTimeout(resizeTimer.value);
    resizeTimer.value = null;
  }
});

// ============================================================
// 事件处理
// ============================================================

function handleClick(): void {
  const nodeId = props.schema["x-id"];
  if (!nodeId) return;
  if (props.onNodeClick) {
    props.onNodeClick(nodeId);
  } else if (designerEngine) {
    designerEngine.selectNode(nodeId);
  }
}

// ============================================================
// 拖拽处理（流式布局容器）
// ============================================================

/** 拖拽进入容器（用于显示 drop 状态） */
const isDragOver = ref(false);
let dragEnterCounter = 0; // 解决 dragenter/dragleave 冒泡问题

function handleDragOver(e: DragEvent): void {
  if (!designMode.value || isAbsoluteMode.value) return;
  // 只处理从物料面板拖入的新节点（没有 nodeId）
  const dataTransfer = e.dataTransfer;
  if (!dataTransfer) return;
  // 检查是否是拖拽新物料
  const raw = dataTransfer.getData('material');
  if (raw) {
    dragEnterCounter++;
    isDragOver.value = true;
  }
}

function handleDragLeave(): void {
  dragEnterCounter--;
  if (dragEnterCounter <= 0) {
    dragEnterCounter = 0;
    isDragOver.value = false;
  }
}

/** 接收拖拽的节点 */
function handleDrop(e: DragEvent): void {
  isDragOver.value = false;
  dragEnterCounter = 0;

  // 只处理流式布局容器
  if (!designMode.value || isAbsoluteMode.value || !designerEngine) return;

  const dataTransfer = e.dataTransfer;
  if (!dataTransfer) return;

  const nodeId = props.schema["x-id"];
  if (!nodeId) return;

  // 情况1：从物料面板拖入新节点
  const raw = dataTransfer.getData('material');
  if (raw) {
    try {
      const material = JSON.parse(raw);
      const fieldKey = `field_${Date.now()}`;
      const fieldSchema: FieldSchema = {
        type: 'string',
        ...(material.defaultSchema ?? {}),
        title: material.label ?? material.name,
        'x-id': designerEngine.generateNodeId(),
        'x-position-type': 'relative',
        'x-span': 1,
      };
      // 添加为容器子节点
      designerEngine.addNode(nodeId, fieldKey, fieldSchema);
    } catch {
      /* ignore */
    }
    return;
  }

  // 情况2：拖拽已有节点进入容器
  const fromId = dataTransfer.getData('node-id');
  if (fromId && fromId !== nodeId) {
    designerEngine.moveNodeToContainer(fromId, nodeId);
  }
}
</script>

<style scoped>
/** Wrapper 容器 */
.void-wrapper {
  position: relative;
  min-width: 0;
}

.void-wrapper.design-mode {
  cursor: pointer;
}

/** 设计模式下，hover 高亮（未选中时）- 只在 design-mode class 下生效 */
.void-wrapper.design-mode:hover {
  outline: 1px dashed #409eff;
  outline-offset: 2px;
}

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

/** 设计模式下，选中容器的蓝色边框高亮 */
.void-container--selected {
  outline: 2px solid #409eff;
  outline-offset: 2px;
  background: rgba(64, 158, 255, 0.05);
}

/** 拖拽进入容器时的视觉反馈 */
.void-wrapper--drag-over {
  outline: 2px dashed #67c23a;
  outline-offset: 2px;
  background: rgba(103, 194, 58, 0.1);
}

/** 隐藏 CollapseItem 的展开箭头（设计模式下不需要） */
.lowcode-void-collapse :deep(.el-collapse-item__arrow) {
  display: none;
}

/** 隐藏 Tabs 的可滚动箭头（设计模式下不需要） */
.lowcode-void-tabs :deep(.el-tabs__nav-next),
.lowcode-void-tabs :deep(.el-tabs__nav-prev) {
  display: none !important;
}
</style>
