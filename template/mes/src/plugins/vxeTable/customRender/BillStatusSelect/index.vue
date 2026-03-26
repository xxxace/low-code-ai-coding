<template>
  <BillStatusSelect
    v-if="currRow && currColumn"
    class="no-style-select"
    :status="currRow[currColumn.field]"
  />
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import type { PropType } from 'vue'
import type { VxeGlobalRendererHandles } from 'vxe-pc-ui'
import { VxeTableDefines } from 'vxe-table'
import BillStatusSelect from '@/components/BillStatusSelect/index.vue'

const props = defineProps({
  params: {
    type: Object as PropType<VxeGlobalRendererHandles.RenderTableEditParams>,
    default: () => ({})
  }
})

const currColumn = ref<VxeTableDefines.ColumnInfo>()
const currRow = ref()

const load = () => {
  const { params } = props
  const { row, column } = params
  currRow.value = row
  currColumn.value = column
}

watch(
  () => props.params,
  () => {
    load()
  }
)
</script>

<style lang="scss" scoped>
.no-style-select {
  text-align: inherit;

  :deep(.vxe-input) {
    text-align: inherit;
    background-color: transparent;
    border: unset;

    /* stylelint-disable-next-line selector-class-pattern */
    .vxe-input--wrapper {
      text-align: inherit;
    }

    /* stylelint-disable-next-line selector-class-pattern */
    .vxe-input--inner {
      text-align: inherit;
      background-color: transparent;
    }
  }
}
</style>
