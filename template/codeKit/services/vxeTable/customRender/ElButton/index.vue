<template>
  <el-button v-if="currRow && currColumn" v-bind="attrs">{{ currRow[currColumn.field] }}</el-button>
</template>

<script lang="ts" setup>
import { PropType, ref, watch } from 'vue'
import { VxeGlobalRendererHandles } from 'vxe-pc-ui'
import { VxeTableDefines } from 'vxe-table'

const props = defineProps({
  options: {
    type: Object as PropType<VxeGlobalRendererHandles.RenderDefaultOptions>,
    default: () => ({})
  },
  params: {
    type: Object as PropType<VxeGlobalRendererHandles.RenderTableEditParams>,
    default: () => ({})
  }
})

const currColumn = ref<VxeTableDefines.ColumnInfo>()
const currRow = ref()
const attrs = ref()

const load = () => {
  const { params, options } = props
  const { row, column } = params
  currRow.value = row
  currColumn.value = column
  attrs.value = options.attrs
}

watch(
  () => props.params,
  () => {
    load()
  },
  { immediate: true }
)
</script>
