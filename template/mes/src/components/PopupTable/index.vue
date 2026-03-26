<template>
  <vxe-modal
    class="vxe-table--ignore-clear"
    v-model="modelVisible"
    :title="title"
    width="800"
    show-footer
  >
    <template v-if="slots.header" #header>
      <slot name="header"></slot>
    </template>
    <template #default>
      <Table v-model:x-grid-ref="xGridRef" v-bind="attrs" @cell-dblclick="handleConfirm" />
    </template>
    <template #footer>
      <vxe-button class="vxe-table--ignore-clear" @click="cancelEvent">取消</vxe-button>
      <vxe-button class="vxe-table--ignore-clear" status="primary" @click="confirmEvent"
        >确定</vxe-button
      >
    </template>
  </vxe-modal>
</template>

<script setup>
import { ref, computed, useAttrs, useSlots } from 'vue'
import { VxeUI } from 'vxe-table'
import Table from './components/Table.vue'

const props = defineProps({
  title: String,
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'confirm'])

const slots = useSlots()

const attrs = useAttrs()

const xGridRef = ref(null)

const modelVisible = computed({
  get() {
    return props.visible
  },
  set(val) {
    emit('update:visible', val)
  }
})

const cancelEvent = () => {
  modelVisible.value = false
}

const confirmEvent = () => {
  const items =
    attrs.multiple === false
      ? xGridRef.value.getRadioRecord()
      : xGridRef.value.getCheckboxRecords(true)
  if ((items instanceof Array && items.length === 0) || !items) {
    VxeUI.modal.alert({
      content: '请选择数据',
      status: 'warning'
    })
    return
  }

  handleConfirm(items)
}

const handleConfirm = (res) => {
  modelVisible.value = false
  xGridRef.value.clearAll()
  emit('confirm', res)
}
</script>
