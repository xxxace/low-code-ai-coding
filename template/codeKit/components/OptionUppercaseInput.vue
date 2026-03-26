<template>
  <div class="option-input" :style="`width:${props.labelWidth + props.valueWidth}px`">
    <UppercaseInput
      v-model="modelValue"
      class="cursor-pointer"
      :style="`width:${props.labelWidth}px`"
      :clearable="true"
      :title="modelValue"
      spellcheck="false"
      @dblclick="handleDbclick"
      @keyup.enter="handleEnter"
    />
    <el-input
      :value="labelValue"
      :style="`width:${props.valueWidth}px`"
      readonly
      :title="labelValue"
    />
  </div>

  <component
    v-if="isLoaded"
    :is="props.dialogCompoent"
    ref="dialogRef"
    v-bind="attrs"
    @confirm="handleConfirm"
  />
</template>

<script setup lang="ts">
import { ref, useAttrs, nextTick, watch } from 'vue'
import { ElInput } from 'element-plus'
import { ResizeModalInstance } from './ResizeModal/types'
import UppercaseInput from './UppercaseInput/index.vue'

const props = defineProps({
  disabled: Boolean,
  labelValue: [String, Number],
  labelKey: String,
  valueKey: String,
  labelWidth: {
    type: Number,
    default: 100
  },
  valueWidth: {
    type: Number,
    default: 200
  },
  dialogCompoent: Object
})
defineOptions({
  inheritAttrs: false
})
const attrs = useAttrs()

const emits = defineEmits(['update:modelValue', 'update:labelValue', 'enter'])

const modelValue = defineModel<string | number>()

const isLoaded = ref(false)
const dialogRef = ref<ResizeModalInstance>()

const handleDbclick = async () => {
  if (props.disabled) return
  if (isLoaded.value === false) {
    isLoaded.value = true
    await nextTick()
  }
  dialogRef.value?.open()
}

const handleConfirm = (item) => {
  emits('update:modelValue', item[props.valueKey || 'CODE'] || undefined)
  emits('update:labelValue', item[props.labelKey || 'CNAME'] || undefined)
}

const handleEnter = (e) => emits('enter', e)

watch(modelValue, (val) => {
  !val && emits('update:labelValue', val)
})
</script>

<style lang="less" scoped>
.option-input {
  display: inline-flex;

  .cursor-pointer {
    :deep(.el-input__inner) {
      cursor: pointer;
    }
  }

  :deep(.el-input__inner) {
    font-size: 14px;
  }
}
</style>
