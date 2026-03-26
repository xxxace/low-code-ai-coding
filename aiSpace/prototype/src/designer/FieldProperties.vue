<!-- 
  FieldProperties.vue
  字段级属性编辑面板（简版）
  
  根据字段的 x-component 类型，展示对应的属性配置项。
  完整版本需要：
  1. 各 Widget 注册时携带自己的属性描述（materialProps）
  2. 属性面板根据 materialProps 动态渲染表单项
-->
<template>
  <div class="field-properties">
    <!-- 基础属性 -->
    <div class="prop-group">
      <div class="prop-group__title">基础属性</div>
      <el-form label-width="72px" label-position="left" size="small">
        <el-form-item label="字段标签">
          <el-input v-model="form.title" @change="emitUpdate" />
        </el-form-item>
        <el-form-item label="字段描述">
          <el-input v-model="form.description" @change="emitUpdate" />
        </el-form-item>
        <el-form-item label="占位文本">
          <el-input v-model="form.placeholder" @change="emitUpdate" />
        </el-form-item>
        <el-form-item label="默认值">
          <el-input v-model="form.defaultValue" @change="emitUpdate" />
        </el-form-item>
        <el-form-item label="列宽（1-24）">
          <el-input-number v-model="form.span" :min="1" :max="24" @change="emitUpdate" />
        </el-form-item>
      </el-form>
    </div>

    <!-- 显示属性 -->
    <div class="prop-group">
      <div class="prop-group__title">显示属性</div>
      <el-form label-width="72px" label-position="left" size="small">
        <el-form-item label="显示状态">
          <el-select v-model="form.display" @change="emitUpdate">
            <el-option label="显示" value="visible" />
            <el-option label="隐藏（保留值）" value="hidden" />
            <el-option label="不渲染" value="none" />
          </el-select>
        </el-form-item>
        <el-form-item label="交互模式">
          <el-select v-model="form.pattern" @change="emitUpdate">
            <el-option label="可编辑" value="editable" />
            <el-option label="禁用" value="disabled" />
            <el-option label="只读" value="readOnly" />
            <el-option label="阅读态" value="readPretty" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否必填">
          <el-switch v-model="form.required" @change="emitUpdate" />
        </el-form-item>
      </el-form>
    </div>

    <!-- 联动配置（简化版） -->
    <div class="prop-group">
      <div class="prop-group__title">联动规则</div>
      <div v-if="form.reactions.length === 0" class="text-gray-400 text-xs px-2 pb-2">
        暂无联动规则
      </div>
      <div v-for="(reaction, idx) in form.reactions" :key="idx" class="reaction-item">
        <div class="reaction-item__header">
          <span class="text-xs text-gray-500">规则 {{ idx + 1 }}</span>
          <el-button size="small" text type="danger" @click="removeReaction(idx)">
            删除
          </el-button>
        </div>
        <el-form label-width="56px" label-position="left" size="small">
          <el-form-item label="条件">
            <el-input v-model="reaction.when" placeholder="如：$deps[0] === 'A'" @change="emitUpdate" />
          </el-form-item>
          <el-form-item label="依赖">
            <el-input v-model="reactionDepsInput[idx]" placeholder="字段路径，逗号分隔" @change="updateReactionDeps(idx, $event)" />
          </el-form-item>
        </el-form>
      </div>
      <el-button size="small" class="mt-2 w-full" @click="addReaction">
        + 添加联动规则
      </el-button>
    </div>

    <!-- 校验规则（简化版） -->
    <div class="prop-group">
      <div class="prop-group__title">校验规则</div>
      <el-form label-width="72px" label-position="left" size="small">
        <el-form-item label="必填">
          <el-switch v-model="form.required" @change="emitUpdate" />
        </el-form-item>
        <el-form-item label="最小长度">
          <el-input-number v-model="form.minLength" :min="0" @change="emitUpdate" />
        </el-form-item>
        <el-form-item label="最大长度">
          <el-input-number v-model="form.maxLength" :min="0" @change="emitUpdate" />
        </el-form-item>
      </el-form>
    </div>

    <!-- i18n 配置 -->
    <div class="prop-group">
      <div class="prop-group__title">国际化</div>
      <el-form label-width="72px" label-position="left" size="small">
        <el-form-item label="标签 key">
          <el-input v-model="form.i18nTitle" placeholder="如：form.field.name" @change="emitUpdate" />
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { FieldSchema, Reaction } from '../types/schema'

interface Props {
  schema: FieldSchema
  nodeId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update', nodeId: string, updates: Partial<FieldSchema>): void
}>()

// ============================================================
// 表单状态
// ============================================================

const form = reactive({
  title: props.schema.title ?? '',
  description: props.schema.description ?? '',
  placeholder: props.schema['x-component-props']?.placeholder ?? '',
  defaultValue: props.schema.default ?? '',
  span: props.schema['x-span'] ?? 12,
  display: props.schema['x-display'] ?? 'visible',
  pattern: props.schema['x-pattern'] ?? 'editable',
  required: false,
  minLength: props.schema.minLength ?? null,
  maxLength: props.schema.maxLength ?? null,
  reactions: (props.schema['x-reactions'] ?? []) as Reaction[],
  i18nTitle: props.schema['x-i18n']?.title ?? '',
})

const reactionDepsInput = ref<string[]>(
  form.reactions.map((r) => r.dependencies?.join(', ') ?? '')
)

// 监听 schema 变化（切换选中节点时刷新面板）
watch(
  () => props.schema,
  (schema) => {
    form.title = schema.title ?? ''
    form.description = schema.description ?? ''
    form.placeholder = schema['x-component-props']?.placeholder ?? ''
    form.defaultValue = schema.default ?? ''
    form.span = schema['x-span'] ?? 12
    form.display = schema['x-display'] ?? 'visible'
    form.pattern = schema['x-pattern'] ?? 'editable'
    form.reactions = (schema['x-reactions'] ?? []) as Reaction[]
    form.i18nTitle = schema['x-i18n']?.title ?? ''
    reactionDepsInput.value = form.reactions.map((r) => r.dependencies?.join(', ') ?? '')
  },
  { deep: true }
)

// ============================================================
// 更新处理
// ============================================================

function emitUpdate() {
  const updates: Partial<FieldSchema> = {
    title: form.title,
    description: form.description,
    default: form.defaultValue,
    'x-span': form.span,
    'x-display': form.display,
    'x-pattern': form.pattern,
    'x-reactions': form.reactions,
    'x-component-props': {
      ...(props.schema['x-component-props'] ?? {}),
      placeholder: form.placeholder,
    },
  }

  if (form.i18nTitle) {
    updates['x-i18n'] = { ...props.schema['x-i18n'], title: form.i18nTitle }
  }

  if (form.minLength !== null) updates.minLength = form.minLength
  if (form.maxLength !== null) updates.maxLength = form.maxLength

  emit('update', props.nodeId, updates)
}

function addReaction() {
  form.reactions.push({ dependencies: [], when: '', fulfill: { state: { visible: true } } })
  reactionDepsInput.value.push('')
  emitUpdate()
}

function removeReaction(idx: number) {
  form.reactions.splice(idx, 1)
  reactionDepsInput.value.splice(idx, 1)
  emitUpdate()
}

function updateReactionDeps(idx: number, value: string) {
  form.reactions[idx].dependencies = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  emitUpdate()
}
</script>

<style scoped>
.field-properties {
  padding-bottom: 16px;
}

.prop-group {
  margin-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 8px;
}

.prop-group__title {
  font-size: 12px;
  font-weight: 500;
  color: #409eff;
  padding: 8px 0 4px;
  letter-spacing: 0.5px;
}

.reaction-item {
  background: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 8px;
}

.reaction-item__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
</style>
