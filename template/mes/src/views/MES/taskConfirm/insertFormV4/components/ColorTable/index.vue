<template>
  <EditableTable
    ref="tableRef"
    class="h-full"
    footer
    :columns="columns"
    :menuItem="menuItem"
    :data="props.data"
  >
  </EditableTable>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { getEditableTableExposeProxy } from '@/utils'
import type { VxeGridPropTypes } from 'vxe-table'
import { PSTASKCL_DTO } from '$types/views/MES/insertOrder.ts'

const props = withDefaults(defineProps<{ data: any[] }>(), {
  data: () => []
})
const tableRef = ref<any>()
const menuItem = ['removeRow']
const columns = reactive<VxeGridPropTypes.Column<PSTASKCL_DTO>[]>([
  { title: '序号', field: 'CLSEQ', width: '50px', fixed: 'left', align: 'center' },
  {
    title: '颜色名称',
    field: 'CLNAME',
    width: 160,
    align: 'center',
    fixed: 'left'
  },
  {
    title: '数量',
    field: 'QTY',
    width: 90,
    align: 'right',
    headerAlign: 'center',
    editRender: { name: 'NSNumberInput' },
    summary: true
  },
  {
    title: '牌号始',
    field: 'FRNUM',
    width: 90,
    align: 'center'
  },
  {
    title: '牌号止',
    field: 'TONUM',
    width: 90,
    align: 'center'
  },
  {
    title: '牌数',
    field: 'TKTQTY',
    width: 90,
    align: 'center',
    summary: true
  }
])

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
