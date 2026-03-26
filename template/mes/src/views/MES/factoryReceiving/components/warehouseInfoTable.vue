<template>
  <ReportTable ref="tableRef" class="h-full" footer :columns="columns" :data="props.data" />
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
    title: '仓库',
    field: 'STKNAME',
    width: 90,
    align: 'center',
    fixed: 'left'
  },
  {
    title: '仓位',
    field: 'SPNAME',
    width: 150,
    align: 'left',
    headerAlign: 'center',
    fixed: 'left'
  },
  {
    title: '收料数',
    field: 'INQTY',
    width: 90,
    align: 'right',
    formatter: ['number', 2],
    summary: true
  },
  {
    title: '领用数',
    field: 'OUTQTY',
    width: 90,
    align: 'right',
    formatter: ['number', 2],
    summary: true
  },
  {
    title: '结余数',
    field: 'QTY',
    width: 90,
    align: 'right',
    formatter: ['number', 2],
    summary: true
  }
])

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
