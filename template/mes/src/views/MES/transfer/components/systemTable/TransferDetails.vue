<template>
  <ReportTable ref="tableRef" class="h-full" footer :columns="columns" :data="props.data" :loading="props.loading">
    <template #completionRate="{ row }">
      <el-tag :type="row.completionRate >= 100 ? 'success' : row.completionRate >= 90 ? 'warning' : 'danger'"
        effect="dark" round>
        {{ row.completionRate }}%
      </el-tag>
    </template>
    <template #defectRate="{ row }">
      <el-tag :type="row.defectRate <= 2 ? 'success' : row.defectRate <= 5 ? 'warning' : 'danger'" effect="dark" round>
        {{ row.defectRate }}%
      </el-tag>
    </template>
  </ReportTable>
</template>

<script setup lang="ts">
import ReportTable, { type ReportTableColumn } from '@/components/ReportTable/index.vue'
import { ref, reactive } from 'vue'
import { getEditableTableExposeProxy } from '@/utils'

const props = withDefaults(defineProps<{ data: any[] ,loading:boolean}>(), {
  data: () => []
})

const tableRef = ref<any>()
const columns = reactive<ReportTableColumn[]>([
  {
    title: '尺码',
    field: 'V_SZNAME',
    width: '',
    align: 'center'
  },
  {
    title: '订单数',
    field: 'V_ORDQTY',
    width: '',
    align: 'right',
    summary: true
  },
  {
    title: '发织',
    field: 'V_CUTQTY',
    width: '',
    align: 'right',
    summary: true
  },
  {
    title: '登记数',
    field: 'DJQTY',
    width: '',
    align: 'right',
    summary: true
  },
  {
    title: '移交数',
    field: 'V_MOVEQTY',
    width: '',
    align: 'right',
    summary: true
  },
  {
    title: '对比差',
    field: 'V_DIFFQTY',
    width: '',
    align: 'right',
    summary: true
  }
])

// 模拟数据
const mockData = [
  {
    size: 'M',
    orderCount: 200,
    weavingCount: 195,
    registrationCount: 190,
    transferCount: 185,
    difference: 15
  },
  
  {
    size: 'M',
    orderCount: 200,
    weavingCount: 195,
    registrationCount: 190,
    transferCount: 185,
    difference: 15
  },
  
  {
    size: 'M',
    orderCount: 200,
    weavingCount: 195,
    registrationCount: 190,
    transferCount: 185,
    difference: 15
  },
  
  {
    size: 'M',
    orderCount: 200,
    weavingCount: 195,
    registrationCount: 190,
    transferCount: 185,
    difference: 15
  },
  
]

// 将模拟数据赋值给props.data（如果需要的话）
// props.data = mockData

defineExpose(getEditableTableExposeProxy(tableRef))
</script>