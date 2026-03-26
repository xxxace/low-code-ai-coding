<template>
  <ResizeModal ref="modelRef" v-bind="attrs" show-footer>
    <slot></slot>
    <template #footer>
      <vxe-button size="small" @click="onCancel">取消</vxe-button>
      <vxe-button status="primary" size="small" @click="onConfirm">确定</vxe-button>
    </template>
  </ResizeModal>
</template>
<script setup lang="ts">
import { ref, useAttrs } from 'vue'
import ResizeModal from '@/components/ResizeModal/index.vue'
import { setupParentScope } from '@/hooks/nameson/useParentScope'

const attrs = useAttrs()
const emits = defineEmits(['cancel', 'confirm'])

const parentScope = setupParentScope('modelPicker')

const modelRef = ref<InstanceType<typeof ResizeModal>>()

const onCancel = () => {
  modelRef.value!.close()
  emits('cancel')
}

const onConfirm = () => {
  const result = parentScope.invoke('getResult')
  console.log(result)
  if (result && result.length) {
    onCancel()
    emits('confirm', result)
  }
}

parentScope.registry('confirm', (result) => {
  onCancel()
  emits('confirm', result)
})

defineExpose({
  open: () => modelRef.value?.open(),
  close: () => modelRef.value?.close()
})
</script>
