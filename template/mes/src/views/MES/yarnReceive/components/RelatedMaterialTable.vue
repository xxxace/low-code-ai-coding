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
    title: '领料单',
    field: 'reqNo',
    width: 130,
    align: 'center',
    fixed: 'left'
  },
  {
    title: '加工合约',
    field: 'contract',
    width: 120,
    align: 'center'
  },
  {
    title: '领料日期',
    field: 'reqDate',
    width: 90,
    align: 'center',
    formatter: 'date'
  },
  {
    title: '领料数(磅)',
    field: 'reqQty',
    width: 80,
    align: 'right',
    headerAlign: 'center',
    formatter: 'number'
  }
])
defineExpose(getEditableTableExposeProxy(tableRef))
</script>
