<!-- 
  FormRenderer.vue
  表单根渲染器 —— 解析 PageSchema，初始化 FormModel 和 ReactionsEngine，
  然后通过 XLayout 统一渲染（每个节点根据 x-position-type 决定 relative 或 absolute 定位）
-->
<template>
  <div
    class="lowcode-renderer"
    :class="`lowcode-renderer--${formConfig.layoutType ?? 'PC'}`.toLowerCase()"
    :style="cssVariables"
  >
    <el-form
      v-if="formModel"
      ref="elFormRef"
      :model="formModel.values"
      :label-width="formConfig.labelWidth ? `${formConfig.labelWidth}px` : 'auto'"
      :label-position="formConfig.labelPosition ?? 'top'"
      :size="formConfig.size ?? 'default'"
      :disabled="formModel.disabled"
      style="width: 100%"
    >
      <!-- 统一布局（XLayout） -->
      <!-- 每个节点根据 x-position-type 决定定位方式 -->
      <!-- relative → 流式排列，absolute → 自由定位 -->
      <XLayout
        :properties="schema.schema.properties"
        :form-model="formModelForTemplate"
        :path-prefix="''"
        :columns="formConfig.columns ?? 1"
      />
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, provide, onMounted, onUnmounted, watch } from 'vue'
import type { PageSchema } from '../types/schema'
import { createFormModel, type FormModel } from '../types/model'
import { createReactionsEngine, type ReactionsEngine } from '../types/reactions'
import { useComponentRegistry, COMPONENT_REGISTRY_KEY } from '../types/componentRegistry'
import { DESIGN_MODE_KEY, SELECTED_NODE_ID_KEY } from '../core/injectionKeys'
import XLayout from './XLayout.vue'

// ============================================================
// Props & Emits
// ============================================================

interface Props {
  /** 表单 Schema */
  schema: PageSchema
  /** 外部传入的初始值（覆盖 Schema 中的 default） */
  initialValues?: Record<string, any>
  /** 只读模式（覆盖 schema.formConfig.readOnly） */
  readOnly?: boolean
  /** 禁用模式（覆盖 schema.formConfig.disabled） */
  disabled?: boolean
  /**
   * 设计模式：
   * - 强制所有字段显示（忽略联动的 display:none）
   * - 禁止字段交互（pointer-events 由外层 CSS 控制）
   */
  designMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  readOnly: false,
  disabled: false,
  designMode: false,
})

const emit = defineEmits<{
  (e: 'submit', values: Record<string, any>): void
  (e: 'change', path: string, value: any): void
  (e: 'validate-error', errors: Record<string, string[]>): void
}>()

// ============================================================
// 状态
// ============================================================

const elFormRef = ref()
const formModel = ref<FormModel | null>(null)
let reactionsEngine: ReactionsEngine | null = null

// 模板中传递 ref 给子组件 prop 时，vue-tsc 推断为 UnwrapRef<FormModel | null>
// 提供一个计算属性作为类型"锚点"，让模板传递时类型匹配
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formModelForTemplate = computed<FormModel | null>(() => formModel.value as FormModel | null)

const formConfig = computed(() => props.schema.formConfig)

const cssVariables = computed(() => {
  return {}
  // 可在这里注入 CSS 变量，如 --lowcode-label-width
})

// ============================================================
// 初始化
// ============================================================

function initForm() {
  // 销毁旧的引擎
  if (reactionsEngine) {
    reactionsEngine.destroy()
  }

  // 创建表单模型
  const model = createFormModel(props.schema)

  // 注入外部初始值
  if (props.initialValues) {
    for (const [path, value] of Object.entries(props.initialValues)) {
      model.setFieldValue(path, value)
    }
  }

  // 同步 readOnly / disabled
  if (props.readOnly) model.readOnly.value = true
  if (props.disabled) model.disabled.value = true

  formModel.value = model

  // 创建联动引擎
  reactionsEngine = createReactionsEngine(model)

  // 触发 onFormCreated 生命周期
  execLifeCycleHook('onFormCreated')
}

// ============================================================
// 生命周期 Hooks 执行
// ============================================================

function execLifeCycleHook(hook: keyof NonNullable<PageSchema['lifeCycles']>) {
  const expression = props.schema.lifeCycles?.[hook]
  if (!expression || !formModel.value) return

  const context = {
    $form: formModel.value,
    $values: formModel.value.values,
  }

  try {
    const keys = Object.keys(context)
    const values = Object.values(context)
    // eslint-disable-next-line no-new-func
    const fn = new Function(...keys, `"use strict"; return (async () => { ${expression} })()`)
    fn(...values)
  } catch (e) {
    console.error(`[FormRenderer] 生命周期钩子执行失败 (${hook}):`, e)
  }
}

// ============================================================
// 对外暴露的方法（供父组件通过 ref 调用）
// ============================================================

async function validate(): Promise<boolean> {
  const valid = await formModel.value?.validate()
  if (!valid) {
    const errors = formModel.value?.getErrors() ?? {}
    emit('validate-error', errors)
  }
  return valid ?? false
}

async function submit(): Promise<void> {
  const valid = await validate()
  if (!valid) return

  const values = formModel.value?.getSubmitValues() ?? {}
  await execLifeCycleHook('onFormSubmit')
  emit('submit', values)
}

function reset(): void {
  formModel.value?.reset()
}

function getValues(): Record<string, any> {
  return formModel.value?.getSubmitValues() ?? {}
}

function setFieldValue(path: string, value: any): void {
  formModel.value?.setFieldValue(path, value)
}

defineExpose({ validate, submit, reset, getValues, setFieldValue })

// ============================================================
// Provide（给子组件注入 formModel 和 ComponentRegistry）
// ============================================================

provide('formModel', formModel)
provide('formRenderer', {
  onFieldChange: (path: string, value: any) => {
    emit('change', path, value)
    execLifeCycleHook('onFormDataChange')
  },
})
// 设计模式标识，供 FieldRenderer 等子组件注入使用
provide(DESIGN_MODE_KEY, computed(() => props.designMode))
// 预览模式下，selectedNodeId 始终为 null，防止 inject 穿透到设计器画布的 XLayout
// 设计模式下，XLayout 会覆盖这个 provide，提供真实的 selectedNodeId
provide(SELECTED_NODE_ID_KEY, ref(null))

// 注入 ComponentRegistry（从父组件获取或创建默认的）
const componentRegistry = useComponentRegistry()
provide(COMPONENT_REGISTRY_KEY, componentRegistry)

// ============================================================
// 生命周期
// ============================================================

// 初始化表单
initForm()

// 监听 schema 变化，重新初始化表单
// 优化：去掉 deep: true，用 __meta__.updatedAt 快速判断是否有结构性变化
watch(
  () => props.schema,
  (newSchema, oldSchema) => {
    if (!newSchema) return
    // 快速路径：id 变化（如 loadSchema 切换）直接重建
    if (!oldSchema || newSchema.id !== oldSchema.id) {
      initForm()
      return
    }
    // updated 时间戳变化 → 可能有结构性改动，做全量对比
    if (newSchema.__meta__?.updatedAt !== oldSchema.__meta__?.updatedAt) {
      initForm()
    }
  },
  { immediate: false }
)

onMounted(() => {
  execLifeCycleHook('onFormMounted')
})

onUnmounted(() => {
  reactionsEngine?.destroy()
  execLifeCycleHook('onFormUnmounted')
})
</script>

<style scoped>
.lowcode-renderer {
  width: 100%;
  min-width: 0;
  display: block;
}

.lowcode-renderer :deep(.el-form) {
  width: 100%;
  box-sizing: border-box;
}

.lowcode-renderer--free {
  position: relative;
  overflow: visible;
}
</style>
