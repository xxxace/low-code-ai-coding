<template>
  <div class="base-form-body p-2">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import {formContextKey} from 'element-plus'
import {computed, provide, reactive} from 'vue'
import {StdFormAction} from './types/store'
import {useStdForm} from './composeble/useStdForm'

const stdForm = useStdForm()
const isReadOnly = computed(() => {
  return stdForm.actionType === StdFormAction.RADEONLY
})
provide(formContextKey, reactive({disabled: isReadOnly}) as any)
</script>

<style lang="scss">
.base-form-body {
  flex: 1 0 0;
}

.el-input.is-disabled .el-input__inner,
.el-textarea.is-disabled .el-textarea__inner {
  color: #020202;
  -webkit-text-fill-color: #020202;
}

.vxe-input .vxe-input--inner[disabled] {
  color: #020202;
  background-color: var(--el-fill-color-light);
}
</style>
