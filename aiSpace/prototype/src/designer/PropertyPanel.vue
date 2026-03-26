/**
 * @file PropertyPanel.vue
 * @description 属性面板组件
 *
 * 功能：
 * 1. 显示选中节点的属性
 * 2. 支持编辑字段属性
 * 3. 支持编辑联动规则
 * 4. 支持编辑校验规则
 */

<template>
  <div class="property-panel">
    <!-- 未选中提示 -->
    <div v-if="!selectedSchema" class="property-panel__empty">
      <el-empty description="请选择一个组件" :image-size="80" />
    </div>

    <!-- 属性编辑 -->
    <template v-else>
      <!-- 基础属性 -->
      <el-collapse v-model="activeSections">
        <el-collapse-item title="基础属性" name="basic">
          <el-form label-width="80px" size="small">
            <el-form-item label="字段名">
              <el-input v-model="localSchema.title" @change="onChange('title')" />
            </el-form-item>
            <el-form-item label="字段类型">
              <el-select v-model="localSchema.type" @change="onChange('type')">
                <el-option label="字符串" value="string" />
                <el-option label="数字" value="number" />
                <el-option label="布尔" value="boolean" />
                <el-option label="数组" value="array" />
                <el-option label="对象" value="object" />
              </el-select>
            </el-form-item>
            <el-form-item label="组件">
              <el-select v-model="localSchema['x-component']" @change="onChange('x-component')">
                <el-option label="输入框" value="Input" />
                <el-option label="文本域" value="Textarea" />
                <el-option label="数字输入" value="InputNumber" />
                <el-option label="下拉选择" value="Select" />
                <el-option label="日期选择" value="DatePicker" />
                <el-option label="开关" value="Switch" />
              </el-select>
            </el-form-item>
            <el-form-item label="默认值">
              <el-input v-model="localSchema.default" @change="onChange('default')" />
            </el-form-item>
          </el-form>
        </el-collapse-item>

        <!-- 布局属性（自由布局时显示） -->
        <el-collapse-item v-if="localSchema['x-free-position']" title="布局属性" name="layout">
          <el-form label-width="80px" size="small">
            <el-form-item label="X 坐标">
              <el-input-number
                v-model="localSchema['x-free-position'].x"
                :min="0"
                @change="onChange('x-free-position')"
              />
            </el-form-item>
            <el-form-item label="Y 坐标">
              <el-input-number
                v-model="localSchema['x-free-position'].y"
                :min="0"
                @change="onChange('x-free-position')"
              />
            </el-form-item>
            <el-form-item label="宽度">
              <el-input-number
                v-model="localSchema['x-free-position'].width"
                :min="20"
                @change="onChange('x-free-position')"
              />
            </el-form-item>
            <el-form-item label="高度">
              <el-input-number
                v-model="localSchema['x-free-position'].height"
                :min="20"
                @change="onChange('x-free-position')"
              />
            </el-form-item>
            <el-form-item label="层级">
              <el-input-number
                v-model="localSchema['x-free-position'].zIndex"
                :min="1"
                @change="onChange('x-free-position')"
              />
            </el-form-item>
            <el-form-item label="锁定">
              <el-switch
                v-model="localSchema['x-free-position'].locked"
                @change="onChange('x-free-position')"
              />
            </el-form-item>
          </el-form>
        </el-collapse-item>

        <!-- 组件属性 -->
        <el-collapse-item title="组件属性" name="component">
          <el-form label-width="80px" size="small">
            <el-form-item label="占位符">
              <el-input
                v-model="componentProps.placeholder"
                @change="onComponentPropsChange"
              />
            </el-form-item>
            <el-form-item label="禁用">
              <el-switch
                v-model="componentProps.disabled"
                @change="onComponentPropsChange"
              />
            </el-form-item>
            <el-form-item label="只读">
              <el-switch
                v-model="componentProps.readonly"
                @change="onComponentPropsChange"
              />
            </el-form-item>
          </el-form>
        </el-collapse-item>

        <!-- 校验规则 -->
        <el-collapse-item title="校验规则" name="validator">
          <div class="validator-list">
            <div
              v-for="(validator, index) in validators"
              :key="index"
              class="validator-item"
            >
              <el-tag size="small">{{ getValidatorLabel(validator) }}</el-tag>
              <el-button
                type="danger"
                size="small"
                link
                @click="removeValidator(index)"
              >
                删除
              </el-button>
            </div>
            <el-button size="small" @click="addValidator">
              + 添加规则
            </el-button>
          </div>
        </el-collapse-item>

        <!-- 联动规则 -->
        <el-collapse-item title="联动规则" name="reactions">
          <div class="reactions-list">
            <div
              v-for="(reaction, index) in reactions"
              :key="index"
              class="reaction-item"
            >
              <div class="reaction-header">
                <span>联动 {{ index + 1 }}</span>
                <el-button
                  type="danger"
                  size="small"
                  link
                  @click="removeReaction(index)"
                >
                  删除
                </el-button>
              </div>
              <el-form label-width="60px" size="small">
                <el-form-item label="依赖">
                  <el-input
                    v-model="reaction.dependencies"
                    placeholder="字段路径，逗号分隔"
                  />
                </el-form-item>
                <el-form-item label="条件">
                  <el-input
                    v-model="reaction.when"
                    placeholder="$deps[0] === 'value'"
                  />
                </el-form-item>
              </el-form>
            </div>
            <el-button size="small" @click="addReaction">
              + 添加联动
            </el-button>
          </div>
        </el-collapse-item>
      </el-collapse>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import type { FieldSchema, Validator, Reaction } from '../types/schema'

// ============================================================
// Props & Emits
// ============================================================

interface Props {
  selectedSchema: FieldSchema | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update', path: string, value: any): void
}>()

// ============================================================
// 状态
// ============================================================

const activeSections = ref(['basic', 'layout', 'component', 'validator', 'reactions'])

// 本地 Schema 副本（用于编辑）
const localSchema = ref<FieldSchema>({} as FieldSchema)

// 组件属性（从 x-component-props 提取）
const componentProps = reactive({
  placeholder: '',
  disabled: false,
  readonly: false,
})

// 校验规则
const validators = computed(() => localSchema.value['x-validator'] ?? [])

// 联动规则
const reactions = computed(() => localSchema.value['x-reactions'] ?? [])

// ============================================================
// 监听选中变化
// ============================================================

watch(
  () => props.selectedSchema,
  (newSchema) => {
    if (newSchema) {
      localSchema.value = JSON.parse(JSON.stringify(newSchema))
      // 提取组件属性
      const props = newSchema['x-component-props'] ?? {}
      componentProps.placeholder = props.placeholder ?? ''
      componentProps.disabled = props.disabled ?? false
      componentProps.readonly = props.readonly ?? false
    }
  },
  { immediate: true, deep: true }
)

// ============================================================
// 事件处理
// ============================================================

const onChange = (path: string) => {
  emit('update', path, localSchema.value[path])
}

const onComponentPropsChange = () => {
  localSchema.value['x-component-props'] = {
    ...localSchema.value['x-component-props'],
    ...componentProps,
  }
  emit('update', 'x-component-props', localSchema.value['x-component-props'])
}

// 校验规则
const getValidatorLabel = (validator: Validator): string => {
  if ('type' in validator) return validator.type
  if ('pattern' in validator) return '正则'
  if ('validator' in validator) return validator.validator
  if ('asyncValidator' in validator) return `异步:${validator.asyncValidator}`
  return '未知'
}

const addValidator = () => {
  if (!localSchema.value['x-validator']) {
    localSchema.value['x-validator'] = []
  }
  localSchema.value['x-validator'].push({ type: 'required', message: '此字段为必填项' })
  emit('update', 'x-validator', localSchema.value['x-validator'])
}

const removeValidator = (index: number) => {
  localSchema.value['x-validator']?.splice(index, 1)
  emit('update', 'x-validator', localSchema.value['x-validator'])
}

// 联动规则
const addReaction = () => {
  if (!localSchema.value['x-reactions']) {
    localSchema.value['x-reactions'] = []
  }
  localSchema.value['x-reactions'].push({
    dependencies: [],
    when: '',
    fulfill: { state: {} },
  })
  emit('update', 'x-reactions', localSchema.value['x-reactions'])
}

const removeReaction = (index: number) => {
  localSchema.value['x-reactions']?.splice(index, 1)
  emit('update', 'x-reactions', localSchema.value['x-reactions'])
}
</script>

<style scoped>
.property-panel {
  height: 100%;
  background-color: #fff;
  border-left: 1px solid #e8e8e8;
  overflow-y: auto;
}

.property-panel__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.property-panel :deep(.el-collapse-item__header) {
  background-color: #fafafa;
  padding: 0 12px;
  font-weight: 500;
}

.property-panel :deep(.el-collapse-item__content) {
  padding: 12px;
}

.validator-list,
.reactions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.validator-item,
.reaction-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  background-color: #fafafa;
  border-radius: 4px;
}

.reaction-item {
  flex-direction: column;
  align-items: stretch;
}

.reaction-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-weight: 500;
}
</style>