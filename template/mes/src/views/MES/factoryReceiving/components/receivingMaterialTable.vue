<template>
  <ReportTable ref="tableRef" class="h-full" footer :columns="columns" :data="props.data">
  </ReportTable>
</template>

<script setup lang="ts">
import ReportTable, { type ReportTableColumn } from '@/components/ReportTable/index.vue'
import { ref, reactive } from 'vue'
import { getEditableTableExposeProxy } from '@/utils'

const props = withDefaults(defineProps<{ data: any[] }>(), {
  data: () => []
})

const tableRef = ref<any>()
const columns = reactive<ReportTableColumn[]>([
  {
    title: '批号',
    field: 'ORDNO',
    width: 110,
    align: 'left',
    fixed: 'left'
  },
  {
    title: '款号',
    field: 'STYNO',
    width: 90,
    align: 'left',
    fixed: 'left'
  },
  {
    title: '毛料编码',
    field: 'MATNO',
    width: 90,
    align: 'left',
    fixed: 'left'
  },
  {
    title: '毛料名称',
    field: 'MATNAME',
    width: 150,
    align: 'left'
  },
  {
    title: '色号',
    field: 'SPECNO',
    width: 90,
    align: 'left'
  },
  {
    title: '色名',
    field: 'SPECNAME',
    width: 120,
    align: 'left'
  },
  {
    title: '缸号',
    field: 'VAT',
    width: 120,
    align: 'left'
  },
  {
    title: '仓库',
    field: 'STKNAME',
    width: 90,
    align: 'center'
  },
  {
    title: '仓位',
    field: 'STKPLCNAME',
    width: 150,
    align: 'left',
    headerAlign: 'center'
  },
  {
    title: '收料数',
    field: 'INQTY',
    width: 90,
    align: 'right',
    formatter: 'number',
    summary: true
  },
  {
    title: '领用数',
    field: 'OUTQTY',
    width: 90,
    align: 'right',
    formatter: 'number',
    summary: true
  },
  {
    title: '结余数',
    field: 'STKQTY',
    width: 90,
    align: 'right',
    formatter: 'number',
    summary: true
  }
])

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
