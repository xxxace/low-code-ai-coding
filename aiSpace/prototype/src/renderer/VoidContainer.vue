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
    :class="[selectedClass, designMode ? 'design-mode' : '']"
    :style="wrapperStyle"
    :data-field-id="schema['x-id']"
    @click="handleClick"
  >
    <!-- 操作按钮（选中时显示） -->
    <el-tooltip
      v-if="designMode && isSelected"
      content="复制节点"
      placement="top"
    >
      <div class="design-actions">
        <span class="design-actions__label">{{
          schema["x-component-props"]?.title ?? componentName
        }}</span>
        <button
          class="design-actions__btn"
          title="复制"
          @click.stop="handleDuplicate"
        >
          <el-icon><CopyDocument /></el-icon>
        </button>
        <button
          class="design-actions__btn design-actions__btn--danger"
          title="删除"
          @click.stop="handleRemove"
        >
          <el-icon><Delete /></el-icon>
        </button>
      </div>
    </el-tooltip>
    <!-- Hover 时显示物料名称（未选中时） -->
    <el-tooltip
      v-else-if="designMode"
      :content="schema['x-component-props']?.title ?? componentName"
      placement="top"
    >
      <div class="design-hover-placeholder" />
    </el-tooltip>

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
import { ElTooltip } from "element-plus";
import { Delete, CopyDocument } from "@element-plus/icons-vue";
import type { VoidFieldSchema } from "../types/schema";
import type { FormModel } from "../core/model";
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
// 注入设计器引擎
// ============================================================

const designerEngine: any = inject("designerEngine", null);

/** 设计模式 */
const designMode = inject<boolean>("designMode", false);

/** 当前选中的节点 ID（由 XLayout 注入） */
const selectedNodeId = inject<{ value: string | null }>("selectedNodeId", {
  value: null,
});

/** 节点是否被选中 */
const isSelected = computed(() => {
  return designMode && props.schema["x-id"] === selectedNodeId?.value;
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
  if (!designMode || !isAbsoluteMode.value) return;
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
    designerEngine.updateNodeFreeSize(nodeId, {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    });
  }
}

// 防抖定时器 和 ResizeObserver 引用（模块级，onBeforeUnmount 统一清理）
let resizeTimer: ReturnType<typeof setTimeout> | null = null;
let resizeObserver: ResizeObserver | null = null;

onMounted(async () => {
  if (!designMode || !isAbsoluteMode.value) return;
  await nextTick();
  // 首次精准同步（同 FieldRenderer 模式）
  syncContainerSize();
  // 注册 ResizeObserver，监听 Tabs 切换 / Collapse 展开等动态内容变化
  if (voidWrapperRef.value) {
    resizeObserver = new ResizeObserver(() => {
      if (resizeTimer) clearTimeout(resizeTimer);
      // 防抖 200ms：确保 el-collapse 展开动画（约 300ms）结束后再读高度
      resizeTimer = setTimeout(syncContainerSize, 200);
    });
    resizeObserver.observe(voidWrapperRef.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  if (resizeTimer) {
    clearTimeout(resizeTimer);
    resizeTimer = null;
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

/** 复制节点 */
function handleDuplicate(): void {
  const nodeId = props.schema["x-id"];
  if (!nodeId || !designerEngine) return;
  designerEngine.duplicateNode(nodeId);
}

/** 删除节点 */
function handleRemove(): void {
  const nodeId = props.schema["x-id"];
  if (!nodeId || !designerEngine) return;
  designerEngine.removeNode(nodeId);
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

/** 操作按钮容器 */
.design-actions {
  display: none;
  position: absolute;
  top: -32px;
  right: 0;
  align-items: center;
  gap: 2px;
  background: #409eff;
  border-radius: 3px;
  padding: 3px 6px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
  z-index: 1000;
}

.void-container--selected .design-actions {
  display: flex;
}

/** Hover 时的占位元素（用于触发 tooltip） */
.design-hover-placeholder {
  position: absolute;
  top: -20px;
  right: 0;
  height: 20px;
  width: 1px;
  pointer-events: auto;
  cursor: pointer;
}

.design-actions__label {
  font-size: 11px;
  color: #fff;
  margin-right: 4px;
  line-height: 1;
}

.design-actions__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: #fff;
  cursor: pointer;
  border-radius: 2px;
  padding: 0;
  transition: background 0.15s;
}

.design-actions__btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.design-actions__btn--danger:hover {
  background: #f56c6c;
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
