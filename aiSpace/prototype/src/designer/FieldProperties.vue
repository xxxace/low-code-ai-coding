<!-- 
  FieldProperties.vue
  字段属性面板 —— Schema 驱动的动态 Setter 架构

  结构：
  1. 通用属性（所有字段通用）：标签、描述、占位文本、默认值、占列数
  2. 显示 & 状态（所有字段通用）：display / pattern / 必填
  3. 组件专属属性（从 ComponentRegistry.getWidgetMeta 的 propSetters 读取）
  4. 联动规则
  5. 校验规则

  Setter 类型：
  - text     → el-input
  - number   → el-input-number
  - boolean  → el-switch
  - select   → el-select（固定枚举）
  - options  → 选项列表编辑器（label/value 数组，写入 enum/enumNames）
  - code     → el-input type=textarea（单行表达式）
  - json     → el-input type=textarea（多行 JSON）
-->
<template>
  <div class="field-properties">
    <!-- 字段类型标识 -->
    <div class="field-type-badge">
      <span class="field-type-badge__name">{{
        widgetMeta?.label ?? schema["x-component"] ?? "未知组件"
      }}</span>
      <span class="field-type-badge__component">{{
        schema["x-component"]
      }}</span>
    </div>

    <!-- ① 基础属性（通用） -->
    <PropGroup title="基础属性">
      <el-form label-width="72px" label-position="left" size="small">
        <el-form-item label="字段标签">
          <el-input v-model="form.title" @change="emitUpdate" />
        </el-form-item>
        <el-form-item label="字段描述">
          <el-input v-model="form.description" @change="emitUpdate" />
        </el-form-item>
        <el-form-item label="值类型">
          <el-select
            v-model="form.type"
            @change="emitUpdate"
            style="width: 100%"
          >
            <el-option label="字符串 (string)" value="string" />
            <el-option label="数字 (number)" value="number" />
            <el-option label="布尔 (boolean)" value="boolean" />
            <el-option label="数组 (array)" value="array" />
            <el-option label="对象 (object)" value="object" />
            <el-option label="整数 (integer)" value="integer" />
          </el-select>
          <div class="prop-hint">决定表单提交时该字段的值类型</div>
        </el-form-item>
        <el-form-item label="占位文本" v-if="hasPlaceholder">
          <el-input v-model="form.placeholder" @change="emitUpdate" />
        </el-form-item>
        <el-form-item label="默认值">
          <el-input v-model="form.defaultValue" @change="emitUpdate" />
        </el-form-item>
        <el-form-item label="占列数">
          <el-slider
            v-model="form.span"
            :step="1"
            :min="1"
            :max="24"
            show-stops
            @change="emitUpdate"
          />
          <div class="prop-hint">占页面布局列数中的几列</div>
        </el-form-item>
      </el-form>
    </PropGroup>

    <!-- ② 显示 & 状态（通用） -->
    <PropGroup title="状态设置">
      <el-form label-width="72px" label-position="left" size="small">
        <el-form-item label="显示状态">
          <el-select
            v-model="form.display"
            @change="emitUpdate"
            style="width: 100%"
          >
            <el-option label="显示" value="visible" />
            <el-option label="隐藏（保留值）" value="hidden" />
            <el-option label="不渲染" value="none" />
          </el-select>
        </el-form-item>
        <el-form-item label="交互模式">
          <el-select
            v-model="form.pattern"
            @change="emitUpdate"
            style="width: 100%"
          >
            <el-option label="可编辑" value="editable" />
            <el-option label="禁用" value="disabled" />
            <el-option label="只读" value="readOnly" />
            <el-option label="阅读态" value="readPretty" />
          </el-select>
        </el-form-item>
        <el-form-item label="必填">
          <el-switch v-model="form.required" @change="emitUpdate" />
        </el-form-item>
      </el-form>
    </PropGroup>

    <!-- ③ 组件专属属性（由 propSetters 动态驱动） -->
    <template v-for="group in propSetterGroups" :key="group.title">
      <PropGroup :title="group.title">
        <el-form label-width="80px" label-position="left" size="small">
          <template v-for="setter in group.setters" :key="setter.key">
            <!-- options setter：选项编辑器 -->
            <el-form-item
              v-if="setter.setter === 'options'"
              :label="setter.label"
            >
              <OptionsEditor
                :model-value="currentOptions"
                @update:model-value="handleOptionsChange"
              />
            </el-form-item>

            <!-- text / code setter -->
            <el-form-item
              v-else-if="setter.setter === 'text' || setter.setter === 'code'"
              :label="setter.label"
            >
              <el-input
                v-model="componentPropsForm[setter.key]"
                :placeholder="setter.defaultValue?.toString() ?? ''"
                @change="emitUpdate"
              />
              <div v-if="setter.tip" class="prop-hint">{{ setter.tip }}</div>
            </el-form-item>

            <!-- json setter -->
            <el-form-item
              v-else-if="setter.setter === 'json'"
              :label="setter.label"
            >
              <el-input
                v-model="componentPropsForm[setter.key]"
                type="textarea"
                :rows="3"
                placeholder='[{"label":"选项1","value":"1"}]'
                @change="emitUpdate"
              />
              <div v-if="setter.tip" class="prop-hint">{{ setter.tip }}</div>
            </el-form-item>

            <!-- number setter -->
            <el-form-item
              v-else-if="setter.setter === 'number'"
              :label="setter.label"
            >
              <el-input-number
                v-model="componentPropsForm[setter.key]"
                :placeholder="setter.defaultValue?.toString()"
                style="width: 100%"
                @change="emitUpdate"
              />
              <div v-if="setter.tip" class="prop-hint">{{ setter.tip }}</div>
            </el-form-item>

            <!-- boolean setter -->
            <el-form-item
              v-else-if="setter.setter === 'boolean'"
              :label="setter.label"
            >
              <el-switch
                v-model="componentPropsForm[setter.key]"
                @change="emitUpdate"
              />
              <span v-if="setter.tip" class="prop-hint ml-2">{{
                setter.tip
              }}</span>
            </el-form-item>

            <!-- select setter -->
            <el-form-item
              v-else-if="setter.setter === 'select'"
              :label="setter.label"
            >
              <el-select
                v-model="componentPropsForm[setter.key]"
                style="width: 100%"
                @change="emitUpdate"
              >
                <el-option
                  v-for="opt in setter.options ?? []"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
              <div v-if="setter.tip" class="prop-hint">{{ setter.tip }}</div>
            </el-form-item>
          </template>
        </el-form>
      </PropGroup>
    </template>

    <!-- ④ 联动规则（摘要 + 弹窗编辑） -->
    <PropGroup title="联动规则">
      <!-- 摘要行 -->
      <div class="reaction-summary">
        <span class="reaction-summary__count">
          <template v-if="form.reactions.length === 0">暂无规则</template>
          <template v-else>共 {{ form.reactions.length }} 条规则</template>
        </span>
        <el-button size="small" type="primary" text @click="openReactionDialog">
          {{ form.reactions.length === 0 ? "+ 添加" : "编辑" }}
        </el-button>
      </div>
      <!-- 规则摘要卡片（只读展示，每条一行） -->
      <div
        v-for="(r, idx) in form.reactions"
        :key="idx"
        class="reaction-chip"
        :class="{ 'reaction-chip--disabled': r.enabled === false }"
      >
        <span class="reaction-chip__when">{{ r.when || "始终" }}</span>
        <span class="reaction-chip__arrow">→</span>
        <span class="reaction-chip__fulfill">{{
          reactionFulfillLabel(r)
        }}</span>
      </div>
    </PropGroup>

    <!-- 联动规则编辑弹窗 -->
    <ReactionEditorDialog
      v-model="reactionDialogVisible"
      :reactions="form.reactions"
      @confirm="handleReactionConfirm"
    />

    <!-- ⑤ 校验规则 -->
    <PropGroup title="校验规则">
      <el-form label-width="72px" label-position="left" size="small">
        <el-form-item label="最小长度">
          <el-input-number
            v-model="form.minLength"
            :min="0"
            @change="emitUpdate"
          />
        </el-form-item>
        <el-form-item label="最大长度">
          <el-input-number
            v-model="form.maxLength"
            :min="0"
            @change="emitUpdate"
          />
        </el-form-item>
      </el-form>
    </PropGroup>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch, inject } from "vue";
import type { FieldSchema, Reaction } from "../types/schema";
import {
  COMPONENT_REGISTRY_KEY,
  type ComponentRegistry,
  type PropSetterGroup,
} from "../types/componentRegistry";
import PropGroup from "./PropGroup.vue";
import OptionsEditor from "./OptionsEditor.vue";
import ReactionEditorDialog from "./ReactionEditorDialog.vue";

// ============================================================
// Props & Emits
// ============================================================

interface Props {
  schema: FieldSchema;
  nodeId: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "update", nodeId: string, updates: Partial<FieldSchema>): void;
}>();

// ============================================================
// 注入 Registry，读取 propSetters
// ============================================================

const registry = inject<ComponentRegistry>(COMPONENT_REGISTRY_KEY);

const widgetMeta = computed(() => {
  const component = props.schema["x-component"];
  if (!component || !registry) return null;
  return registry.getWidgetMeta(component);
});

const propSetterGroups = computed<PropSetterGroup[]>(() => {
  return widgetMeta.value?.propSetters ?? [];
});

// ============================================================
// 通用属性 form
// ============================================================

const form = reactive({
  title: props.schema.title ?? "",
  description: props.schema.description ?? "",
  type: props.schema.type ?? "string",
  placeholder: props.schema["x-component-props"]?.placeholder ?? "",
  defaultValue:
    props.schema.default != null ? String(props.schema.default) : "",
  span: props.schema["x-span"] ?? 1,
  display: props.schema["x-display"] ?? "visible",
  pattern: props.schema["x-pattern"] ?? "editable",
  required: props.schema.required === true,
  minLength: props.schema.minLength ?? (null as number | null),
  maxLength: props.schema.maxLength ?? (null as number | null),
  reactions: (props.schema["x-reactions"] ?? []) as Reaction[],
});

// ============================================================
// 组件专属属性 form（动态，对应 x-component-props 里的 key）
// ============================================================

const componentPropsForm = reactive<Record<string, any>>({
  ...(props.schema["x-component-props"] ?? {}),
});

// ============================================================
// 选项编辑（Select / CheckboxGroup / RadioGroup 的 enum/enumNames）
// ============================================================

interface OptionItem {
  label: string;
  value: string;
}

const currentOptions = computed<OptionItem[]>(() => {
  const enumVals = (props.schema.enum ?? []) as any[];
  const enumNames = (props.schema.enumNames ?? []) as string[];
  return enumVals.map((v, i) => ({
    value: String(v),
    label: enumNames[i] ?? String(v),
  }));
});

function handleOptionsChange(options: OptionItem[]) {
  emit("update", props.nodeId, {
    enum: options.map((o) => o.value),
    enumNames: options.map((o) => o.label),
  });
}

// ============================================================
// 联动规则 —— 弹窗模式
// ============================================================

const reactionDialogVisible = ref(false);

function openReactionDialog() {
  reactionDialogVisible.value = true;
}

function handleReactionConfirm(reactions: Reaction[]) {
  form.reactions = reactions;
  emitUpdate();
}

/** 规则摘要文字（只读展示用） */
function reactionFulfillLabel(r: Reaction): string {
  if (r.enabled === false) return "（已禁用）";
  const state = r.fulfill?.state ?? {};
  if ("visible" in state) return state.visible ? "显示" : "隐藏";
  if ("disabled" in state) return state.disabled ? "禁用字段" : "恢复可编辑";
  if ("required" in state) return state.required ? "必填" : "取消必填";
  return "—";
}

// ============================================================
// 是否有占位文本的组件
// ============================================================

const hasPlaceholder = computed(() => {
  const comp = props.schema["x-component"] ?? "";
  return [
    "Input",
    "Textarea",
    "Password",
    "Select",
    "DatePicker",
    "DateRangePicker",
    "TimePicker",
    "DateTimePicker",
    "Cascader",
    "TreeSelect",
    "InputNumber",
  ].includes(comp);
});

// ============================================================
// 监听 schema 变化（切换选中节点时刷新面板）
// ============================================================

watch(
  () => props.schema,
  (schema) => {
    form.title = schema.title ?? "";
    form.description = schema.description ?? "";
    form.type = schema.type ?? "string";
    form.placeholder = schema["x-component-props"]?.placeholder ?? "";
    form.defaultValue = schema.default != null ? String(schema.default) : "";
    form.span = schema["x-span"] ?? 1;
    form.display = schema["x-display"] ?? "visible";
    form.pattern = schema["x-pattern"] ?? "editable";
    form.required = schema.required === true;
    form.reactions = (schema["x-reactions"] ?? []) as Reaction[];
    form.minLength = schema.minLength ?? null;
    form.maxLength = schema.maxLength ?? null;

    // 同步 componentPropsForm
    const cp = schema["x-component-props"] ?? {};
    for (const key of Object.keys(componentPropsForm)) {
      delete componentPropsForm[key];
    }
    Object.assign(componentPropsForm, cp);
  },
  { deep: true },
);

// ============================================================
// emit update
// ============================================================

function emitUpdate() {
  // 合并 componentPropsForm，排除 __options__（由 OptionsEditor 单独处理）
  const mergedComponentProps: Record<string, any> = {};
  for (const [k, v] of Object.entries(componentPropsForm)) {
    if (k === "__options__") continue;
    if (v !== null && v !== undefined && v !== "") {
      mergedComponentProps[k] = v;
    }
  }
  // 保留 placeholder 来源：优先 componentPropsForm.placeholder，其次 form.placeholder
  if (form.placeholder) mergedComponentProps.placeholder = form.placeholder;

  const updates = {
    title: form.title,
    description: form.description,
    type: form.type as FieldSchema["type"],
    default: form.defaultValue || undefined,
    "x-span": form.span,
    "x-display": form.display,
    "x-pattern": form.pattern,
    required: form.required,
    "x-reactions": form.reactions,
    "x-component-props": {
      ...(props.schema["x-component-props"] ?? {}),
      ...mergedComponentProps,
    },
  } as Partial<FieldSchema>;

  if (form.minLength !== null) updates.minLength = form.minLength;
  if (form.maxLength !== null) updates.maxLength = form.maxLength;

  emit("update", props.nodeId, updates);
}
</script>

<style scoped>
.field-properties {
  padding-bottom: 16px;
}

/* 字段类型标识徽章 */
.field-type-badge {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  background: #ecf5ff;
  border: 1px solid #b3d8ff;
  border-radius: 4px;
  margin-bottom: 8px;
}

.field-type-badge__name {
  font-size: 13px;
  font-weight: 500;
  color: #409eff;
}

.field-type-badge__component {
  font-size: 10px;
  color: #909399;
  font-family: monospace;
}

/* 属性提示 */
.prop-hint {
  font-size: 10px;
  color: #909399;
  margin-top: 2px;
  line-height: 1.4;
}

.ml-2 {
  margin-left: 8px;
}

/* 联动规则摘要区 */
.reaction-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2px 6px;
}

.reaction-summary__count {
  font-size: 12px;
  color: #909399;
}

.reaction-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 4px 8px;
  margin-bottom: 4px;
  font-size: 11px;
  overflow: hidden;
}

.reaction-chip__when {
  color: #606266;
  font-family: monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 120px;
}

.reaction-chip__arrow {
  color: #909399;
  flex-shrink: 0;
}

.reaction-chip__fulfill {
  color: #409eff;
  font-weight: 500;
  flex-shrink: 0;
}

/* 禁用状态的规则摘要卡片：半透明 + 灰色字 */
.reaction-chip--disabled {
  opacity: 0.45;
}

.reaction-chip--disabled .reaction-chip__fulfill {
  color: #909399;
}

.text-xs {
  font-size: 12px;
}

.text-gray-400 {
  color: #c0c4cc;
}

.text-gray-500 {
  color: #909399;
}

.px-2 {
  padding-left: 8px;
  padding-right: 8px;
}

.pb-2 {
  padding-bottom: 8px;
}
</style>
