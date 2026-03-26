<!--
 * @Author: 匹诺曹 1164698177@qq.com
 * @Date: 2025-07-08 14:41:40
 * @LastEditors: 匹诺曹 1164698177@qq.com
 * @LastEditTime: 2025-07-08 14:56:55
 * @FilePath: \77_MES-APS\src\views\MES\quality\components\SystemReportTable.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <ReportTable
    ref="tableRef"
    class="h-full"
    footer
    :columns="columns"
    :data="props.data"
    :loading="props.loading"
  >
    <template #completionRate="{ row }">
      <el-tag
        :type="
          row.completionRate >= 100 ? 'success' : row.completionRate >= 90 ? 'warning' : 'danger'
        "
        effect="dark"
        round
      >
        {{ row.completionRate }}%
      </el-tag>
    </template>
    <template #defectRate="{ row }">
      <el-tag
        :type="row.defectRate <= 2 ? 'success' : row.defectRate <= 5 ? 'warning' : 'danger'"
        effect="dark"
        round
      >
        {{ row.defectRate }}%
      </el-tag>
    </template>
  </ReportTable>
</template>

<script setup lang="tsx">
import ReportTable, { type ReportTableColumn } from '@/components/ReportTable/index.vue'
import { ref, reactive } from 'vue'
import { getEditableTableExposeProxy } from '@/utils'

const props = withDefaults(defineProps<{ data: any[]; loading: boolean }>(), {
  data: () => []
})

const tableRef = ref<any>()
const columns = reactive<ReportTableColumn[]>([
  { title: '部门', field: 'deptName', width: '', align: 'center', fixed: 'left' },
  { title: '线别', field: 'lineName', width: '', align: 'center' },
  { title: '日期', field: 'date', width: '', align: 'center' },
  { title: '班别', field: 'shift', width: '', align: 'center' },
  { title: '料件编码', field: 'materialCode', width: '', align: 'center' },
  { title: '品名', field: 'productName', width: '', align: 'center' },
  { title: '完工数量', field: 'completionQty', width: '', align: 'right' },
  { title: '不良数量', field: 'defectQty', width: '', align: 'right' },
  { title: '不良率', field: 'defectRate', width: '', align: 'right' },
  { title: '最大异常', field: 'maxAbnormal', width: '', align: 'center' },
  { title: '不良数量', field: 'defectQty2', width: '', align: 'right' },
  { title: '占比', field: 'percent', width: '', align: 'right' }
])

const mockData = [
  {
    deptName: '注塑事业部',
    lineName: '注塑二部',
    date: '2024-06-01',
    shift: '白班',
    materialCode: 'AHWOC17032AA',
    productName: '黄河US下盖',
    completionQty: 30000,
    defectQty: 15,
    defectRate: 1.5,
    maxAbnormal: '黑点',
    defectQty2: 15,
    percent: '10%'
  }
]

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
