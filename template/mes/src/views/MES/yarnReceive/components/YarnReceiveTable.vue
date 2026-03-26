<template>
  <ReportTable ref="tableRef" class="h-full" :columns="columns" :data="props.data"></ReportTable>
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
    title: '出库单',
    field: 'orderNo',
    width: 130,
    align: 'center',
    fixed: 'left'
  },
  {
    title: '单类',
    field: 'type',
    width: 100,
    align: 'center',
    fixed: 'left'
  },
  {
    title: '工厂',
    field: 'factory',
    width: 120,
    align: 'center',
    fixed: 'left'
  },
  {
    title: '部门',
    field: 'dept',
    width: 120,
    align: 'center',
    fixed: 'left'
  },
  {
    title: '产线',
    field: 'line',
    width: 80,
    align: 'center',
    fixed: 'left'
  },
  {
    title: '出库日期',
    field: 'outDate',
    width: 100,
    align: 'center',
    formatter: 'date'
  },
  {
    title: '出库数(磅)',
    field: 'outQty',
    width: 90,
    align: 'right',
    headerAlign: 'center',
    formatter: 'number'
  },
  {
    title: '收料数(磅)',
    field: 'recvQty',
    width: 90,
    align: 'right',
    headerAlign: 'center',
    formatter: 'number'
  },
  {
    title: '状态',
    field: 'status',
    width: 80,
    align: 'center'
  },
  {
    title: '备注',
    field: 'remark',
    width: 280,
    align: 'left',
    headerAlign: 'center'
  }
])
defineExpose(getEditableTableExposeProxy(tableRef))
</script>
