<template>
  <el-checkbox
    class="yes-no-checkbox"
    v-model="checked"
    v-bind="attrs"
    true-value="Y"
    false-value="N"
    @keypress.enter="handleEnter"
  >
    <span
      class="yes-or-no-checkbox-label"
      :style="`width: ${props.width ? props.width + 'px' : 'auto'}`"
      :title="props.label"
    >
      {{ props.label }}
    </span>
  </el-checkbox>
</template>

<script lang="ts" setup>
import { computed, useAttrs } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    label: string
    width: number
    validator?: (val: string) => boolean
  }>(),
  {
    modelValue: 'N'
  }
)

const emit = defineEmits(['update:modelValue'])
const attrs = useAttrs()

const checked = computed({
  get() {
    return props.modelValue
  },
  set(val) {
    if (props.validator && !props.validator(val)) return
    emit('update:modelValue', val)
  }
})

const handleEnter = () => {
  checked.value = checked.value === 'Y' ? 'N' : 'Y'
}
</script>

<style lang="scss" scoped>
.yes-or-no-checkbox-label {
  display: inline-block;
  overflow: hidden;
  margin-top: 2px;
  color: var(--el-text-color-regular);
}

.yes-no-checkbox {
  margin-right: 14px !important;

  :deep(.el-checkbox) {
    height: 22px !important;
  }
}
</style>
