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
      class="lowcode-field-wrapper"
      :class="[fieldWrapperClass, designMode && fieldState?.display === 'hidden' ? 'lowcode-field-wrapper--design-hidden' : '']"
      :data-field-path="path"
      :data-field-id="schema['x-id']"
    >
      <!-- ① FormItem 装饰器 -->
      <el-form-item
        v-if="decorator === 'FormItem'"
        :label="fieldLabel"
        :prop="path"
        :required="isRequired"
        :rules="elFormRules"
        :label-width="decoratorProps.labelWidth ? `${decoratorProps.labelWidth}px` : undefined"
        :class="formItemClass"
      >
        <!-- 自定义 Label（带 tooltip） -->
        <template v-if="decoratorProps.tooltip" #label>
          <span>{{ fieldLabel }}</span>
          <el-tooltip :content="decoratorProps.tooltip" placement="top">
            <el-icon class="ml-1 cursor-help" style="color:#c0c4cc"><QuestionFilled /></el-icon>
          </el-tooltip>
        </template>

        <!-- readPretty 模式：只显示文本 -->
        <template v-if="isReadPretty">
          <span class="lowcode-field__read-pretty">{{ prettyValue }}</span>
        </template>

        <!-- 正常渲染 Widget -->
        <template v-else>
          <!-- Select 系列：需要注入 options -->
          <el-select
            v-if="schema['x-component'] === 'Select'"
            v-model="fieldValue"
            :disabled="isDisabled"
            :placeholder="placeholder"
            :loading="fieldState?.loading"
            v-bind="mergedComponentProps"
            style="width: 100%"
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
            >{{ opt.label }}</el-checkbox>
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
            >{{ opt.label }}</el-radio>
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
            style="width: 100%"
          />

          <!-- 未注册的 Widget 降级处理 -->
          <span v-else class="lowcode-field__unregistered">
            [未注册组件: {{ schema['x-component'] ?? '(无)' }}]
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
    </div>
  </template>
</template>

<script setup lang="ts">
import { computed, inject, type Ref } from 'vue'
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
} from 'element-plus'
import { QuestionFilled } from '@element-plus/icons-vue'
import type { FieldSchema } from '../types/schema'
import type { FormModel } from '../types/model'
import {
  useComponentRegistry,
  COMPONENT_REGISTRY_KEY,
} from '../types/componentRegistry'

// ============================================================
// Props
// ============================================================

interface Props {
  schema: FieldSchema
  formModel: FormModel | null
  path: string
}

const props = defineProps<Props>()

// ============================================================
// 注入：ComponentRegistry 和 FormRenderer 上下文
// ============================================================

const registry = useComponentRegistry()

const formRendererCtx = inject<{
  onFieldChange: (path: string, value: any) => void
}>('formRenderer')

/** 设计模式：强制所有字段可见，忽略联动 display 状态 */
const designMode = inject<boolean>('designMode', false)

// ============================================================
// 字段状态（响应式）
// ============================================================

const fieldState = computed(() => props.formModel?.getField(props.path))

// ============================================================
// 显示相关计算属性
// ============================================================

const fieldLabel = computed(() => {
  return fieldState.value?.title ?? props.schema.title ?? props.path
})

const placeholder = computed(() => {
  const cp = props.schema['x-component-props'] ?? {}
  const type = props.schema['x-component']
  if (cp.placeholder) return cp.placeholder
  if (type === 'Select' || type === 'DatePicker' || type === 'TimePicker') {
    return `请选择${fieldLabel.value}`
  }
  return `请输入${fieldLabel.value}`
})

const decorator = computed(() => props.schema['x-decorator'] ?? 'FormItem')

const decoratorProps = computed(() => props.schema['x-decorator-props'] ?? {})

const formItemClass = computed(() => {
  const classes: string[] = []
  if (decoratorProps.value.asterisk === false) classes.push('no-asterisk')
  return classes
})

const fieldWrapperClass = computed(() => {
  const classes: string[] = ['lowcode-field']
  if (props.schema['x-class']) classes.push(props.schema['x-class'])
  return classes
})

const isRequired = computed(() => {
  return (
    decoratorProps.value.required ??
    props.schema.required === true ??
    false
  )
})

const isDisabled = computed(() => {
  if (props.formModel?.disabled.value) return true
  return fieldState.value?.pattern === 'disabled'
})

const isReadOnly = computed(() => {
  if (props.formModel?.readOnly.value) return true
  const pattern = fieldState.value?.pattern
  return pattern === 'readOnly' || pattern === 'readPretty'
})

/** readPretty：只读展示模式（不渲染 Input，渲染纯文本） */
const isReadPretty = computed(() => {
  if (props.formModel?.readOnly.value) return false // 全局只读仍用 disabled
  return fieldState.value?.pattern === 'readPretty'
})

/** readPretty 下展示的文本 */
const prettyValue = computed(() => {
  const value = fieldState.value?.value
  if (value === null || value === undefined || value === '') return '--'

  // 如果有 dataSource，找到对应的 label
  const ds = fieldState.value?.dataSource ?? []
  if (ds.length > 0) {
    if (Array.isArray(value)) {
      return value
        .map((v) => ds.find((opt) => opt.value === v)?.label ?? v)
        .join('，')
    }
    const opt = ds.find((o) => o.value === value)
    if (opt) return opt.label
  }

  if (Array.isArray(value)) return value.join('，')
  return String(value)
})

// ============================================================
// Widget 相关
// ============================================================

const widgetComponent = computed(() => {
  const componentName = props.schema['x-component']
  if (!componentName) return null
  return registry.getWidget(componentName) ?? null
})

const mergedComponentProps = computed(() => {
  const schemaProps = props.schema['x-component-props'] ?? {}
  const runtimeProps = fieldState.value?.componentProps ?? {}
  const merged = { ...schemaProps, ...runtimeProps }

  // 对 Textarea 注入 type
  if (props.schema['x-component'] === 'Textarea') {
    merged.type = 'textarea'
  }
  // Password 注入 show-password
  if (props.schema['x-component'] === 'Password') {
    merged.showPassword = merged.showPassword ?? true
    merged.type = 'password'
  }

  return merged
})

// ============================================================
// 字段值（双向绑定）
// ============================================================

const fieldValue = computed({
  get() {
    const val = fieldState.value?.value
    // array 类型默认值为 []，避免 undefined 传入组件报错
    if (props.schema.type === 'array' && (val === null || val === undefined)) {
      return []
    }
    return val ?? null
  },
  set(newValue: any) {
    props.formModel?.setFieldValue(props.path, newValue)
    formRendererCtx?.onFieldChange(props.path, newValue)
  },
})

// ============================================================
// el-form 校验规则适配（交由 el-form 的原生校验机制）
// ============================================================

const elFormRules = computed(() => {
  const validators = props.schema['x-validator']
  if (!validators?.length) return []

  return validators.map((v: any) => {
    if ('type' in v && v.type === 'required') {
      return {
        required: true,
        message: v.message ?? '此字段为必填项',
        trigger: v.trigger ?? ['change', 'blur'],
      }
    }
    if ('pattern' in v) {
      return {
        pattern: new RegExp(v.pattern),
        message: v.message ?? '格式不正确',
        trigger: v.trigger ?? 'blur',
      }
    }
    if ('type' in v && v.type === 'email') {
      return {
        type: 'email',
        message: v.message ?? '邮箱格式不正确',
        trigger: v.trigger ?? 'blur',
      }
    }
    if ('type' in v && (v.type === 'minLength' || v.type === 'maxLength')) {
      return {
        [v.type === 'minLength' ? 'min' : 'max']: v.value,
        message: v.message,
        trigger: 'blur',
      }
    }
    return { message: v.message, trigger: 'blur' }
  })
})
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

.lowcode-field__extra {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}
</style>
