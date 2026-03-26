<template>
  <vxe-modal
    :className="`resize-modal vxe-table--ignore-clear ${props.noOverflow ? 'no-overflow-modal' : ''}`"
    ref="modalRef"
    size="mini"
    show-zoom
    :show-minimize="false"
    :lock-view="false"
    :mask="isShowMask"
    :destroy-on-close="true"
    v-bind="modelOptions"
    resize
    @zoom="handleZoom"
  >
    <slot v-if="isLoaded"></slot>
    <template v-if="props.footer && props.mode === 'default'" #footer>
      <slot name="footer"></slot>
    </template>
  </vxe-modal>
</template>

<script lang="ts" setup>
import { ref, useAttrs, computed, nextTick } from 'vue'
import type { VxeModalComponent } from 'vxe-pc-ui'
import { ResizeModalProps } from './types'

const props = withDefaults(defineProps<ResizeModalProps>(), { mode: 'default', footer: false })

const attrs = useAttrs()
const isLoaded = ref(false)
const isShowMask = ref(true)
const modalRef = ref<VxeModalComponent>()
const modelOptions = computed(() => {
  if (props.mode === 'paramsForm') {
    return {
      ...attrs
    }
  }

  const selfOptions: Record<string, any> = {
    showFooter: props.footer
  }

  if (props.mode === 'confirm') {
    selfOptions.showConfirmButton = true
    selfOptions.showCancelButton = true
  }

  if (props.mode === 'alert') {
    selfOptions.showConfirmButton = true
    selfOptions.showCancelButton = false
  }
  console.log(attrs, selfOptions)
  return {
    ...attrs,
    ...selfOptions
  }
})

function clearSelection() {
  if (window.getSelection) {
    // 获取当前的文本选择对象
    const selection = window.getSelection()
    // 清除所有的文本选择范围
    selection && selection.removeAllRanges()
  } else if ((document as any).selection) {
    // 对于 IE，使用 document.selection
    ;(document as any).selection.empty()
  }
}

const onMousedown = (e) => {
  clearSelection()
  e.target.addEventListener('mousemove', onMousemove)
}

const onMouseup = (e) => {
  clearSelection()
  e.target.removeEventListener('mousemove', onMousemove)
}

const onMousemove = () => {
  clearSelection()
}

const addEventListener = () => {
  // if (modalRef.value) {
  //   const modelBox = modalRef.value.getBox()
  //   const resizeEl = modelBox.querySelector('.vxe-modal--resize')
  //   resizeEl.addEventListener('click', (e) => {
  //     resizeEl.dispatchEvent(new Event('mouseup'))
  //   })
  //   // resizeEl.addEventListener('mouseup', (e) => {
  //   //   resizeEl.dispatchEvent(new Event('click'))
  //   // })
  // }
}

const open = () => {
  modalRef.value && modalRef.value.open()
  if (!isLoaded.value) {
    setTimeout(async () => {
      isLoaded.value = true
      await nextTick()
      if (modalRef.value) {
        const modelBox = modalRef.value!.getBox() as HTMLElement
        const left = document.documentElement.clientWidth / 2 - modelBox.clientWidth / 2
        modalRef.value.setPosition(50, left)
      }
    }, 100)
  }
  if (props.mode !== 'paramsForm') {
    setTimeout(() => {
      addEventListener()
    })
  }
}

const close = () => {
  if (modalRef.value) {
    if (props.mode !== 'paramsForm') {
      const modelBox = modalRef.value.getBox()
      const resizeEl = modelBox.querySelector('.vxe-modal--resize')
      resizeEl.removeEventListener('mousedown', onMousedown)
      resizeEl.removeEventListener('mouseup', onMouseup)
    }

    modalRef.value.close()
  }
}

const handleZoom = () => (isShowMask.value = !isShowMask.value)

defineExpose({
  open: open,
  close: close,
  getBox: () => modalRef.value && modalRef.value.getBox()
})
</script>

<style lang="scss">
.vxe-modal--wrapper.type--modal.no-overflow-modal {
  .vxe-modal--body .vxe-modal--content {
    overflow: hidden !important;
  }
}

.vxe-modal--wrapper.is--padding.no-overflow-modal .vxe-modal--body-default {
  padding: 0;
}
</style>
