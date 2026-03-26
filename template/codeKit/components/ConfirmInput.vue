<template>
  <div class="option-input" :style="`width:${props.valueWidth}px`">
    <el-input
      type="text"
      :value="labelValue"
      :style="`width:${props.valueWidth}px`"
      :title="labelValue"
      readonly
      @mouseenter="() => (showClear = true)"
      @mouseleave="() => (showClear = false)"
      @dblclick="handleDbclick"
    >
      <template #suffix>
        <span
          v-if="labelValue && showClear"
          class="cursor-pointer flex items-center justify-center"
          @click.stop="handleClear"
        >
          <Icon icon="vi-ep:circle-close" />
        </span>
      </template>
    </el-input>
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
import { ResizeModalInstance } from './ResizeModal/types'

const props = defineProps({
  disabled: Boolean,
  labelValue: [String, Number],
  labelKey: String,
  valueKey: String,
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

const emits = defineEmits(['update:modelValue', 'update:labelValue'])

const modelValue = defineModel<string | number>()

const isLoaded = ref(false)
const showClear = ref(false)
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

const handleClear = () => {
  handleConfirm({})
}

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
