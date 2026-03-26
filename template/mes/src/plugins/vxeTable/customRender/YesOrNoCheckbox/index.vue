<template>
  <YesOrNoCheckbox v-if="currRow && currColumn" v-model="currRow[currColumn.field]" />
</template>

<script lang="ts" setup>
import { PropType, ref, watch } from 'vue'
import { VxeGlobalRendererHandles } from 'vxe-pc-ui'
import { VxeTableDefines } from 'vxe-table'
import YesOrNoCheckbox from '@/components/YesOrNoCheckbox/index.vue'

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
  },
  { immediate: true }
)
</script>
