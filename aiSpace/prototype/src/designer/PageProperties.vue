<!-- 
  PageProperties.vue
  页面级属性编辑面板
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
          <el-option label="顶部" value="top" />
          <el-option label="右对齐" value="right" />
          <el-option label="左对齐" value="left" />
        </el-select>
      </el-form-item>
      <el-form-item label="布局列数">
        <div class="columns-row">
          <!-- 快捷选项 -->
          <el-radio-group v-model="form.columns" size="small" @change="handleChange">
            <el-radio-button :value="1">1</el-radio-button>
            <el-radio-button :value="2">2</el-radio-button>
            <el-radio-button :value="3">3</el-radio-button>
            <el-radio-button :value="4">4</el-radio-button>
          </el-radio-group>
          <!-- 自定义列数输入 -->
          <el-input-number
            v-model="form.columns"
            :min="1"
            :max="24"
            :controls="false"
            size="small"
            class="columns-custom-input"
            @change="handleChange"
          />
        </div>
        <div class="columns-hint">当前 {{ form.columns }} 列，字段宽度 = x-span / {{ form.columns }}</div>
      </el-form-item>
      <el-form-item label="布局类型">
        <el-select v-model="form.layoutType" @change="handleChange">
          <el-option label="PC" value="PC" />
          <el-option label="Pad" value="Pad" />
          <el-option label="H5" value="H5" />
        </el-select>
      </el-form-item>
    </el-form>

    <!-- 快速操作提示 -->
    <div class="page-tips">
      <div class="page-tips__title">快速操作</div>
      <div class="page-tips__list">
        <div class="page-tips__item">点击字段 → 右侧面板调整 x-span（占列数）</div>
        <div class="page-tips__item">拖拽字段可排序</div>
        <div class="page-tips__item">Delete 键删除选中字段</div>
        <div class="page-tips__item">Ctrl+Z / Ctrl+Y 撤销重做</div>
      </div>
    </div>
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
  labelWidth: props.schema.formConfig.labelWidth ?? 100,
  labelPosition: props.schema.formConfig.labelPosition ?? 'top',
  layoutType: props.schema.formConfig.layoutType ?? 'PC',
  columns: props.schema.formConfig.columns ?? 1,
})

watch(() => props.schema, (schema) => {
  form.name = schema.name
  form.labelWidth = schema.formConfig.labelWidth ?? 100
  form.labelPosition = schema.formConfig.labelPosition ?? 'top'
  form.layoutType = schema.formConfig.layoutType ?? 'PC'
  form.columns = schema.formConfig.columns ?? 1
}, { deep: true })

function handleChange() {
  emit('update', {
    name: form.name,
    formConfig: {
      ...props.schema.formConfig,
      labelWidth: form.labelWidth,
      labelPosition: form.labelPosition,
      layoutType: form.layoutType,
      columns: form.columns,
    },
  })
}
</script>

<style scoped>
.page-properties {
  padding-bottom: 16px;
}

.columns-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.columns-custom-input {
  width: 56px;
}

.columns-hint {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}

.page-tips {
  margin-top: 16px;
  padding: 10px 12px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 4px;
}

.page-tips__title {
  font-size: 12px;
  font-weight: 500;
  color: #0369a1;
  margin-bottom: 6px;
}

.page-tips__list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.page-tips__item {
  font-size: 11px;
  color: #0369a1;
  padding-left: 8px;
  position: relative;
}

.page-tips__item::before {
  content: '·';
  position: absolute;
  left: 0;
}
</style>
