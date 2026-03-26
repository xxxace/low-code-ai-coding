<template>
  <ResizeModal ref="rmRef" v-bind="attrs" mode="paramsForm" :resize="false" :show-zoom="false">
    <div v-if="isLoaded" class="h-full">
      <FieldItemGroup independent>
        <div class="relative">
          <slot name="search" :onPrint="onPrint" :onReset="onReset" :onClose="onClose"></slot>
        </div>
      </FieldItemGroup>
    </div>
    <div v-else class="flex flex-col h-full" v-loading="true"></div>
  </ResizeModal>
</template>

<script setup lang="ts">
import { useAttrs, ref } from 'vue'
import ResizeModal from '@/components/ResizeModal/index.vue'
import { getResizeModelExposeProxy } from '@/utils'
import FieldItemGroup from '@/components/FieldItemGroup/index.vue'
import type { ResizeModalInstance } from '@/components/ResizeModal/types'
import { RefManager } from '@/hooks/nameson/useRefManager'
import { loadMessageByObjectName } from '@/plugins/vueI18n/lazyLoader'
import { ElMessageBox } from 'element-plus'
import { useStdForm } from '@/components/StdForm/composeble/useStdForm'

export interface DialogPickerProps {
  objectName?: string
  manager: RefManager<any>
}

const props = defineProps<DialogPickerProps>()

const attrs = useAttrs()
const stdForm = useStdForm()

const rmRef = ref<ResizeModalInstance>()

const isLoaded = ref(false)

const onPrint = () => {
  window.open(stdForm.meta.reportUrl)
}
const onReset = () => {
  props.manager && props.manager.reset()
}
const onClose = () => {
  rmRef.value?.close()
}

const open = async (params: any) => {
  props.manager && props.manager.init(params)
  rmRef.value?.open()

  if (!isLoaded.value) {
    await load()
  }
}

const load = async () => {
  if (!props.objectName) {
    isLoaded.value = true
    return
  }
  try {
    await loadMessageByObjectName(props.objectName)
    isLoaded.value = true
  } catch (e: any) {
    ElMessageBox.alert(`获取翻译失败：${e.message || JSON.stringify(e)}`, 'Error', {
      type: 'error'
    })
  }
}

defineExpose(
  getResizeModelExposeProxy(rmRef, {
    open
  })
)
</script>
