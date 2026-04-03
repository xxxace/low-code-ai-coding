<!-- 
  FieldRenderer.vue
  字段渲染器 —— Field + Widget 分离架构（借鉴 vue-json-schema-form）
  
  职责：
  1. 从 FormModel 读取字段运行时状态（display, pattern, errors 等）
  2. 渲染 Decorator（FormItem 外壳）
  3. 在 Decorator 内通过 ComponentRegistry 动态解析 Widget 组件
  4. 将值变化通知 FormModel

  修复（2026-03-26）：
  - 接入 ComponentRegistry（通过 inject），不再硬编码 Widget 注册表
  - Select / CheckboxGroup / RadioGroup 的 options 渲染支持
  - readPretty 模式（只读显示态）单独渲染文本
-->
<template>
  <!-- display = none：完全不渲染（设计模式下忽略此状态，强制可见）-->
  <template v-if="designMode || fieldState?.display !== 'none'">
    <!-- display = hidden：占位但不显示（设计模式下改为虚显，有占位但半透明） -->
    <div
      v-show="designMode || fieldState?.display !== 'hidden'"
      ref="fieldWrapperRef"
      class="lowcode-field-wrapper"
      :style="nodeStyle"
      :class="[
        fieldWrapperClass,
        designMode ? 'design-mode' : '',
        isAbsoluteMode ? 'lowcode-field-wrapper--absolute' : '',
        designMode && fieldState?.display === 'hidden'
          ? 'lowcode-field-wrapper--design-hidden'
          : '',
        designMode && isSelected ? 'lowcode-field-wrapper--selected' : '',
      ]"
      :data-field-path="path"
      :data-field-id="schema['x-id']"
      @click="handleWrapperClick"
    >
      <!--
        操作按钮（流式布局）由 DesignOverlay 叠加层统一处理，不在此处渲染。
        绝对定位节点由 AbsoluteNodeOverlay 处理。
      -->

      <!--
        绝对定位模式：跳过 FormItem 外壳，直接渲染裸 Widget
        原因：el-form-item（label + input）高度约 70px，但 x-position.height 通常为 40px
             若继续使用 FormItem，内容会溢出操作层框体，导致两者视觉分离
             Free/Absolute 布局语义上不需要 label 包裹，用户通过位置/尺寸精确控制
      -->
      <template v-if="isAbsoluteMode">
        <!-- WidgetContent（absolute 模式：无 FormItem 外壳） -->
        <el-select
          v-if="schema['x-component'] === 'Select'"
          v-model="fieldValue"
          :disabled="isDisabled"
          :placeholder="placeholder"
          :loading="fieldState?.loading"
          v-bind="mergedComponentProps"
          :style="widgetStyle"
        >
          <el-option
            v-for="opt in fieldState?.dataSource ?? []"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>

        <el-checkbox-group
          v-else-if="schema['x-component'] === 'CheckboxGroup'"
          v-model="fieldValue"
          :disabled="isDisabled"
          v-bind="mergedComponentProps"
        >
          <el-checkbox
            v-for="opt in fieldState?.dataSource ?? []"
            :key="opt.value"
            :label="opt.value"
            >{{ opt.label }}</el-checkbox
          >
        </el-checkbox-group>

        <el-radio-group
          v-else-if="schema['x-component'] === 'RadioGroup'"
          v-model="fieldValue"
          :disabled="isDisabled"
          v-bind="mergedComponentProps"
        >
          <el-radio
            v-for="opt in fieldState?.dataSource ?? []"
            :key="opt.value"
            :label="opt.value"
            >{{ opt.label }}</el-radio
          >
        </el-radio-group>

        <component
          v-else-if="widgetComponent"
          :is="widgetComponent"
          v-model="fieldValue"
          :disabled="isDisabled"
          :readonly="isReadOnly"
          :placeholder="placeholder"
          v-bind="mergedComponentProps"
          :style="widgetStyle"
        />

        <span v-else class="lowcode-field__unregistered">
          [未注册组件: {{ schema["x-component"] ?? "(无)" }}]
        </span>
      </template>

      <!-- 流式布局模式：正常渲染 FormItem 外壳 -->
      <template v-else>
        <!-- ① FormItem 装饰器 -->
        <el-form-item
          v-if="decorator === 'FormItem'"
          :label="fieldLabel"
          :prop="path"
          :required="isRequired"
          :rules="elFormRules"
          :label-width="
            decoratorProps.labelWidth
              ? `${decoratorProps.labelWidth}px`
              : undefined
          "
          :class="formItemClass"
        >
          <!-- 自定义 Label（带 tooltip） -->
          <template v-if="decoratorProps.tooltip" #label>
            <span>{{ fieldLabel }}</span>
            <el-tooltip :content="decoratorProps.tooltip" placement="top">
              <el-icon class="ml-1 cursor-help" style="color: #c0c4cc"
                ><QuestionFilled
              /></el-icon>
            </el-tooltip>
          </template>

          <!-- readPretty 模式：只显示文本 -->
          <template v-if="isReadPretty">
            <span class="lowcode-field__read-pretty">{{ prettyValue }}</span>
          </template>

          <!-- 正常渲染 Widget（widgetStyle 统一 absolute/flow 两种宽高） -->
          <template v-else>
            <!-- Select 系列：需要注入 options -->
            <el-select
              v-if="schema['x-component'] === 'Select'"
              v-model="fieldValue"
              :disabled="isDisabled"
              :placeholder="placeholder"
              :loading="fieldState?.loading"
              v-bind="mergedComponentProps"
              :style="widgetStyle"
            >
              <el-option
                v-for="opt in fieldState?.dataSource ?? []"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>

            <!-- CheckboxGroup -->
            <el-checkbox-group
              v-else-if="schema['x-component'] === 'CheckboxGroup'"
              v-model="fieldValue"
              :disabled="isDisabled"
              v-bind="mergedComponentProps"
            >
              <el-checkbox
                v-for="opt in fieldState?.dataSource ?? []"
                :key="opt.value"
                :label="opt.value"
                >{{ opt.label }}</el-checkbox
              >
            </el-checkbox-group>

            <!-- RadioGroup -->
            <el-radio-group
              v-else-if="schema['x-component'] === 'RadioGroup'"
              v-model="fieldValue"
              :disabled="isDisabled"
              v-bind="mergedComponentProps"
            >
              <el-radio
                v-for="opt in fieldState?.dataSource ?? []"
                :key="opt.value"
                :label="opt.value"
                >{{ opt.label }}</el-radio
              >
            </el-radio-group>

            <!-- 通用 Widget（通过 ComponentRegistry 解析） -->
            <component
              v-else-if="widgetComponent"
              :is="widgetComponent"
              v-model="fieldValue"
              :disabled="isDisabled"
              :readonly="isReadOnly"
              :placeholder="placeholder"
              v-bind="mergedComponentProps"
              :style="widgetStyle"
            />

            <!-- 未注册的 Widget 降级处理 -->
            <span v-else class="lowcode-field__unregistered">
              [未注册组件: {{ schema["x-component"] ?? "(无)" }}]
            </span>
          </template>

          <!-- 额外说明文本 -->
          <div
            v-if="decoratorProps.extra && fieldState?.display !== 'hidden'"
            class="lowcode-field__extra"
          >
            {{ decoratorProps.extra }}
          </div>
        </el-form-item>

        <!-- ② 无装饰器（void 容器或自定义 decorator） -->
        <component
          v-else-if="decorator !== 'FormItem' && widgetComponent"
          :is="widgetComponent"
          v-model="fieldValue"
          :disabled="isDisabled"
          v-bind="mergedComponentProps"
        />
      </template>
    </div>
  </template>
</template>

<script setup lang="ts">
import {
  computed,
  inject,
  ref,
  onMounted,
  nextTick,
  type CSSProperties,
} from "vue";
import {
  ElSelect,
  ElOption,
  ElCheckboxGroup,
  ElCheckbox,
  ElRadioGroup,
  ElRadio,
  ElTooltip,
  ElIcon,
  ElFormItem,
  type FormItemRule,
} from "element-plus";
import { QuestionFilled } from "@element-plus/icons-vue";
import type { FieldSchema } from "../core/schema";
import type { FormModel } from "../core/model";
import { useComponentRegistry, COMPONENT_REGISTRY_KEY } from "../core/registry";
import {
  injectDesignMode,
  injectSelectedNodeId,
  injectDesignerEngine,
  FORM_RENDERER_KEY,
} from "../core/injectionKeys";

// ============================================================
// Props
// ============================================================

interface Props {
  schema: FieldSchema;
  formModel: FormModel | null;
  path: string;
  /**
   * XLayout 传入的节点定位样式
   * - absolute 节点：{ position: absolute, left, top, width, height, zIndex }
   * - relative 节点：空对象或不传
   */
  nodeStyle?: CSSProperties;
  /** 点击节点事件（设计器模式选中节点） */
  onNodeClick?: (nodeId: string) => void;
}

const props = withDefaults(defineProps<Props>(), {
  nodeStyle: () => ({}),
});

// ============================================================
// 注入：ComponentRegistry 和 FormRenderer 上下文
// ============================================================

const registry = useComponentRegistry();

const formRendererCtx = inject(FORM_RENDERER_KEY, null);

/** 设计模式：强制所有字段可见，忽略联动 display 状态（ComputedRef<boolean>，模板中自动解包） */
const designMode = injectDesignMode(false);

/** 设计器引擎（用于触发节点选中，类型安全） */
const designerEngine = injectDesignerEngine(null);

/** 根元素引用（用于检测实际渲染尺寸） */
const fieldWrapperRef = ref<HTMLElement | null>(null);

/** 尺寸是否已自动适配过（防止重复更新） */
const sizeAutoFitted = ref(false);

/** 当前节点是否为绝对定位模式 */
const isAbsoluteMode = computed(() => {
  return props.schema["x-position-type"] === "absolute";
});

/**
 * 自由布局节点：渲染完成后自动适配操作框尺寸
 * 拖拽添加节点时预设尺寸为 200x40，但实际 Widget 渲染后尺寸可能不同
 * 检测真实尺寸并反馈给操作框，使其与 Widget 样式一致
 */
onMounted(() => {
  // 只在设计模式 + 绝对定位 + 未适配过时执行
  if (!designMode.value || !isAbsoluteMode.value || sizeAutoFitted.value)
    return;
  if (!fieldWrapperRef.value || !designerEngine) return;

  const nodeId = props.schema["x-id"];
  if (!nodeId) return;

  nextTick(() => {
    if (!fieldWrapperRef.value) return;
    const rect = fieldWrapperRef.value.getBoundingClientRect();
    const currentWidth = props.schema["x-position"]?.width ?? 200;
    const currentHeight = props.schema["x-position"]?.height ?? 40;

    // 只有尺寸差异大于 1px 才更新
    if (
      Math.abs(rect.width - currentWidth) > 1 ||
      Math.abs(rect.height - currentHeight) > 1
    ) {
      designerEngine.updateNodeSize(nodeId, {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
    }
    sizeAutoFitted.value = true;
  });
});

/** 当前选中的节点 ID（由 XLayout 注入，类型安全） */
const selectedNodeId = injectSelectedNodeId(null);

/** 节点是否被选中 */
const isSelected = computed(() => {
  return designMode && props.schema["x-id"] === selectedNodeId.value;
});

/** 节点点击事件（设计器模式） */
function handleWrapperClick(): void {
  const nodeId = props.schema["x-id"];
  if (!nodeId) return;
  // 优先用传入的 onNodeClick，否则尝试用注入的 designerEngine
  if (props.onNodeClick) {
    props.onNodeClick(nodeId);
  } else if (designerEngine) {
    designerEngine.selectNode(nodeId);
  }
}

// ============================================================
// 字段状态（响应式）
// ============================================================

const fieldState = computed(() => props.formModel?.getField(props.path));

// ============================================================
// 显示相关计算属性
// ============================================================

const fieldLabel = computed(() => {
  return fieldState.value?.title ?? props.schema.title ?? props.path;
});

const placeholder = computed(() => {
  const cp = props.schema["x-component-props"] ?? {};
  const type = props.schema["x-component"];
  if (cp.placeholder) return cp.placeholder;
  if (type === "Select" || type === "DatePicker" || type === "TimePicker") {
    return `请选择${fieldLabel.value}`;
  }
  return `请输入${fieldLabel.value}`;
});

const decorator = computed(() => props.schema["x-decorator"] ?? "FormItem");

const decoratorProps = computed(() => props.schema["x-decorator-props"] ?? {});

const formItemClass = computed(() => {
  const classes: string[] = [];
  if (decoratorProps.value.asterisk === false) classes.push("no-asterisk");
  return classes;
});

const fieldWrapperClass = computed(() => {
  const classes: string[] = ["lowcode-field"];
  if (props.schema["x-class"]) classes.push(props.schema["x-class"]);
  return classes;
});

const isRequired = computed(() => {
  return (
    decoratorProps.value.required || props.schema.required === true || false
  );
});

const isDisabled = computed(() => {
  if (props.formModel?.disabled.value) return true;
  return fieldState.value?.pattern === "disabled";
});

const isReadOnly = computed(() => {
  if (props.formModel?.readOnly.value) return true;
  const pattern = fieldState.value?.pattern;
  return pattern === "readOnly" || pattern === "readPretty";
});

/** readPretty：只读展示模式（不渲染 Input，渲染纯文本） */
const isReadPretty = computed(() => {
  if (props.formModel?.readOnly.value) return false; // 全局只读仍用 disabled
  return fieldState.value?.pattern === "readPretty";
});

/** readPretty 下展示的文本 */
const prettyValue = computed(() => {
  const value = fieldState.value?.value;
  if (value === null || value === undefined || value === "") return "--";

  // 如果有 dataSource，找到对应的 label
  const ds = fieldState.value?.dataSource ?? [];
  if (ds.length > 0) {
    if (Array.isArray(value)) {
      return value
        .map((v) => ds.find((opt) => opt.value === v)?.label ?? v)
        .join("，");
    }
    const opt = ds.find((o) => o.value === value);
    if (opt) return opt.label;
  }

  if (Array.isArray(value)) return value.join("，");
  return String(value);
});

// ============================================================
// Widget 相关
// ============================================================

const widgetComponent = computed(() => {
  const componentName = props.schema["x-component"];
  if (!componentName) return null;
  return registry.getWidget(componentName) ?? null;
});

const mergedComponentProps = computed(() => {
  const schemaProps = props.schema["x-component-props"] ?? {};
  const runtimeProps = fieldState.value?.componentProps ?? {};
  const merged = { ...schemaProps, ...runtimeProps };

  // 对 Textarea 注入 type
  if (props.schema["x-component"] === "Textarea") {
    merged.type = "textarea";
  }
  // Password 注入 show-password
  if (props.schema["x-component"] === "Password") {
    merged.showPassword = merged.showPassword ?? true;
    merged.type = "password";
  }

  return merged;
});

/**
 * Widget 宽高样式
 * absolute 模式：fill 父容器（width+height 100%）
 * flow 模式：仅限宽（width 100%，高度由内容决定）
 */
const widgetStyle = computed<CSSProperties>(() =>
  isAbsoluteMode.value ? { width: "100%", height: "100%" } : { width: "100%" },
);

// ============================================================
// 字段值（双向绑定）
// ============================================================

const fieldValue = computed({
  get() {
    const val = fieldState.value?.value;
    // array 类型默认值为 []，避免 undefined 传入组件报错
    if (props.schema.type === "array" && (val === null || val === undefined)) {
      return [];
    }
    return val ?? null;
  },
  set(newValue: any) {
    props.formModel?.setFieldValue(props.path, newValue);
    formRendererCtx?.onFieldChange(props.path, newValue);
  },
});

// ============================================================
// el-form 校验规则适配（交由 el-form 的原生校验机制）
// ============================================================

const elFormRules = computed<FormItemRule[]>(() => {
  const validators = props.schema["x-validator"];
  if (!validators?.length) return [];

  return validators.map((v: any) => {
    if ("type" in v && v.type === "required") {
      return {
        required: true,
        message: v.message ?? "此字段为必填项",
        trigger: v.trigger ?? ["change", "blur"],
      };
    }
    if ("pattern" in v) {
      return {
        pattern: new RegExp(v.pattern),
        message: v.message ?? "格式不正确",
        trigger: v.trigger ?? "blur",
      };
    }
    if ("type" in v && v.type === "email") {
      return {
        type: "email",
        message: v.message ?? "邮箱格式不正确",
        trigger: v.trigger ?? "blur",
      };
    }
    if ("type" in v && (v.type === "minLength" || v.type === "maxLength")) {
      return {
        [v.type === "minLength" ? "min" : "max"]: v.value,
        message: v.message,
        trigger: "blur",
      };
    }
    return { message: v.message, trigger: "blur" };
  });
});
</script>

<style scoped>
.lowcode-field {
  width: 100%;
  min-width: 0;
}

.lowcode-field-wrapper {
  box-sizing: border-box;
  padding: 0 6px;
  min-width: 0;
  width: 100%;
}

.lowcode-field-wrapper :deep(.el-form-item) {
  width: 100%;
  min-width: 0;
  margin-bottom: 18px;
}

.lowcode-field-wrapper :deep(.el-form-item__content) {
  width: 100%;
  min-width: 0;
}

.lowcode-field-wrapper :deep(.el-input),
.lowcode-field-wrapper :deep(.el-input-number),
.lowcode-field-wrapper :deep(.el-select),
.lowcode-field-wrapper :deep(.el-date-editor),
.lowcode-field-wrapper :deep(.el-textarea) {
  width: 100% !important;
}

.lowcode-field__read-pretty {
  color: #303133;
  line-height: 1.6;
}

.lowcode-field__unregistered {
  color: #c0c4cc;
  font-size: 12px;
}

/** 设计模式下，display:hidden 的字段显示为半透明（提示设计者此字段有隐藏规则） */
.lowcode-field-wrapper--design-hidden {
  opacity: 0.4;
  outline: 1px dashed #faad14;
  outline-offset: -1px;
}

/** 绝对定位节点：去掉 padding，防止溢出；overflow:hidden 兜底，Element Plus 弹层不受影响 */
.lowcode-field-wrapper--absolute {
  padding: 0 !important;
  overflow: hidden;
}

/** 设计模式下，选中节点的蓝色边框高亮 */
.lowcode-field-wrapper--selected {
  outline: 2px solid #409eff;
  outline-offset: -2px;
  background: rgba(64, 158, 255, 0.05);
}

/** 设计模式下，hover 高亮（未选中时）- 只在 design-mode class 下生效 */
.lowcode-field-wrapper.design-mode:hover {
  outline: 1px dashed #409eff;
  outline-offset: -1px;
}

.lowcode-field__extra {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

/** ContainerNode 占位（GroupRenderer 实现后替换） */
.lowcode-container-placeholder {
  width: 100%;
  min-height: 32px;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  padding: 4px;
  box-sizing: border-box;
}
</style>
