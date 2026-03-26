<!--
  OptionsEditor.vue
  选项列表编辑器（用于 Select / RadioGroup / CheckboxGroup 的枚举选项）
  
  每行：label（显示名）+ value（选项值）+ 删除
  底部：添加选项按钮
-->
<template>
  <div class="options-editor">
    <!-- 表头 -->
    <div class="options-editor__header">
      <span class="options-editor__col-label">显示名</span>
      <span class="options-editor__col-value">选项值</span>
      <span class="options-editor__col-action"></span>
    </div>

    <!-- 选项列表 -->
    <div
      v-for="(opt, idx) in localOptions"
      :key="idx"
      class="options-editor__row"
    >
      <el-input
        v-model="opt.label"
        size="small"
        placeholder="显示名"
        class="options-editor__input"
        @change="emitChange"
      />
      <el-input
        v-model="opt.value"
        size="small"
        placeholder="值"
        class="options-editor__input"
        @change="emitChange"
      />
      <el-button
        size="small"
        text
        type="danger"
        class="options-editor__del"
        @click="removeOption(idx)"
      >
        <el-icon><Delete /></el-icon>
      </el-button>
    </div>

    <!-- 空状态 -->
    <div v-if="localOptions.length === 0" class="options-editor__empty">
      暂无选项
    </div>

    <!-- 添加按钮 -->
    <el-button
      size="small"
      class="options-editor__add"
      @click="addOption"
    >
      + 添加选项
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Delete } from '@element-plus/icons-vue'

interface OptionItem {
  label: string
  value: string
}

interface Props {
  modelValue: OptionItem[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: OptionItem[]): void
}>()

const localOptions = ref<OptionItem[]>(props.modelValue.map((o) => ({ ...o })))

watch(
  () => props.modelValue,
  (val) => {
    localOptions.value = val.map((o) => ({ ...o }))
  },
  { deep: true }
)

function emitChange() {
  emit('update:modelValue', localOptions.value.map((o) => ({ ...o })))
}

function addOption() {
  const idx = localOptions.value.length + 1
  localOptions.value.push({ label: `选项${idx}`, value: String(idx) })
  emitChange()
}

function removeOption(idx: number) {
  localOptions.value.splice(idx, 1)
  emitChange()
}
</script>

<style scoped>
.options-editor {
  width: 100%;
}

.options-editor__header {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 0 4px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 4px;
}

.options-editor__col-label,
.options-editor__col-value {
  flex: 1;
  font-size: 10px;
  color: #909399;
  text-align: center;
}

.options-editor__col-action {
  width: 24px;
}

.options-editor__row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

.options-editor__input {
  flex: 1;
  min-width: 0;
}

.options-editor__del {
  flex-shrink: 0;
  padding: 0;
  width: 24px;
  height: 24px;
}

.options-editor__empty {
  font-size: 11px;
  color: #c0c4cc;
  text-align: center;
  padding: 8px 0;
}

.options-editor__add {
  width: 100%;
  margin-top: 4px;
}
</style>
