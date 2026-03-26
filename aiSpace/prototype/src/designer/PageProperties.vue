<!-- 
  PageProperties.vue
  页面级属性编辑面板（简版）
-->
<template>
  <div class="page-properties">
    <el-form label-width="80px" label-position="left" size="small">
      <el-form-item label="表单名称">
        <el-input v-model="form.name" @change="handleChange" />
      </el-form-item>
      <el-form-item label="标签宽度">
        <el-input-number v-model="form.labelWidth" :min="60" :max="300" @change="handleChange" />
      </el-form-item>
      <el-form-item label="标签位置">
        <el-select v-model="form.labelPosition" @change="handleChange">
          <el-option label="右对齐" value="right" />
          <el-option label="左对齐" value="left" />
          <el-option label="顶部" value="top" />
        </el-select>
      </el-form-item>
      <el-form-item label="布局类型">
        <el-select v-model="form.layoutType" @change="handleChange">
          <el-option label="PC" value="PC" />
          <el-option label="Pad" value="Pad" />
          <el-option label="H5" value="H5" />
        </el-select>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { PageSchema } from '../types/schema'

interface Props {
  schema: PageSchema
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update', updates: Partial<PageSchema>): void
}>()

const form = reactive({
  name: props.schema.name,
  labelWidth: props.schema.formConfig.labelWidth ?? 120,
  labelPosition: props.schema.formConfig.labelPosition ?? 'right',
  layoutType: props.schema.formConfig.layoutType ?? 'PC',
})

watch(() => props.schema, (schema) => {
  form.name = schema.name
  form.labelWidth = schema.formConfig.labelWidth ?? 120
  form.labelPosition = schema.formConfig.labelPosition ?? 'right'
  form.layoutType = schema.formConfig.layoutType ?? 'PC'
}, { deep: true })

function handleChange() {
  emit('update', {
    name: form.name,
    formConfig: {
      ...props.schema.formConfig,
      labelWidth: form.labelWidth,
      labelPosition: form.labelPosition,
      layoutType: form.layoutType,
    },
  })
}
</script>
