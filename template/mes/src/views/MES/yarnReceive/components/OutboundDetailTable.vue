<template>
  <ReportTable ref="tableRef" class="h-full" footer :columns="columns" :data="props.data"></ReportTable>
</template>

<script setup lang="ts">
import ReportTable, { type ReportTableColumn } from '@/components/ReportTable/index.vue'
import { ref, reactive } from 'vue'
import { getEditableTableExposeProxy } from '@/utils'

const props = withDefaults(defineProps<{ data: any[] }>(), {
  data: () => []
})
const emit = defineEmits(['openOrder'])
const tableRef = ref<any>()
const columns = reactive<ReportTableColumn[]>([
  { type: 'checkbox', width: 40, align: 'center', fixed: 'left' },
  {
    title: '色号',
    field: 'colorNo',
    width: 110,
    align: 'center',
    fixed: 'left'
  },
  {
    title: '色名',
    field: 'colorName',
    width: 180,
    align: 'left',
    headerAlign: 'center'
  },
  {
    title: '缸号',
    field: 'batchNo',
    width: 120,
    align: 'center'
  },
  {
    title: '申领数(磅)',
    field: 'applyQty',
    width: 80,
    align: 'right',
    headerAlign: 'center',
    formatter: 'number',
    summary: true
  },
  {
    title: '出库数(磅)',
    field: 'outQty',
    width: 80,
    align: 'right',
    headerAlign: 'center',
    formatter: 'number',
    summary: true
  },
  {
    title: '收料数(磅)',
    field: 'recvQty',
    width: 80,
    align: 'right',
    headerAlign: 'center',
    formatter: 'number',
    summary: true
  },
  {
    title: '备注',
    field: 'remark',
    width: 90,
    align: 'center'
  },
  {
    title: '收料人',
    field: 'receiver',
    width: 90,
    align: 'center'
  },
  {
    title: '收料日期',
    field: 'recvDate',
    width: 90,
    align: 'center',
    formatter: 'date'
  }
])
defineExpose(getEditableTableExposeProxy(tableRef))
</script>
