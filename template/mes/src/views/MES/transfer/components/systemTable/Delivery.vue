<!--
 * @Author: 匹诺曹 1164698177@qq.com
 * @Date: 2025-07-09 09:49:13
 * @LastEditors: 匹诺曹 1164698177@qq.com
 * @LastEditTime: 2025-07-09 09:53:18
 * @FilePath: \77_MES-APS\src\views\MES\transfer\components\systemTable\Delivery.vue
 * @Description: 交货信息 - 块
-->
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
    title: '登记日期',
    field: 'DJDATE',
    width: '85',
    align: 'center'
  },
  {
    title: '登记数量',
    field: 'DJQTY',
    width: '',
    align: 'right',
    // summary: true
  },
  {
    title: '交货数量',
    field: 'QTY',
    width: '',
    align: 'right',
    summary: true
  },
  {
    title: '交货人',
    field: 'EMPNO',
    width: '',
    align: 'center'
  },
  {
    title: '交货日期',
    field: 'DTTM',
    width: '85',
    align: 'center'
  },
  {
    title: '收货人',
    field: 'EMPNO',
    width: '',
    align: 'center'
  },
  {
    title: '收货日期',
    field: 'DTTM',
    width: '85',
    align: 'center'
  }
])

// 模拟数据
const mockData = [
  {
    registrationDate: '2024-01-15',
    registrationQuantity: 500,
    deliveryQuantity: 480,
    deliveryPerson: '张三',
    deliveryDate: '2024-01-20',
    receivingPerson: '李四',
    receivingDate: '2024-01-22'
  },
  {
    registrationDate: '2024-01-18',
    registrationQuantity: 600,
    deliveryQuantity: 580,
    deliveryPerson: '王五',
    deliveryDate: '2024-01-25',
    receivingPerson: '赵六',
    receivingDate: '2024-01-27'
  },
  {
    registrationDate: '2024-01-22',
    registrationQuantity: 450,
    deliveryQuantity: 430,
    deliveryPerson: '孙七',
    deliveryDate: '2024-01-28',
    receivingPerson: '周八',
    receivingDate: '2024-01-30'
  }
]

// 将模拟数据赋值给props.data（如果需要的话）
// props.data = mockData

defineExpose(getEditableTableExposeProxy(tableRef))
</script>