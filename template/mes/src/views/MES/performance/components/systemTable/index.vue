<template>
  <ReportTable
    ref="tableRef"
    class="h-full"
    footer
    :columns="columns"
    :data="props.data"
    :loading="props.loading"
  >
    <template #JDPV="{ row }">
      <el-tag
        :type="
          row.completionRate >= 100 ? 'success' : row.completionRate >= 90 ? 'warning' : 'danger'
        "
        effect="dark"
        round
      >
        {{ row.HRS >= row.ATT_HRS ? '100' : '0' }}%
      </el-tag>
    </template>
    <template #WCPV="{ row }">
      <el-tag
        :type="row.defectRate <= 2 ? 'success' : row.defectRate <= 5 ? 'warning' : 'danger'"
        effect="dark"
        round
      >
        {{ (row.RQTY / row.BZQTY).toFixed(4) * 100 }}%
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
  { field: 'CORPNONAME', title: '公司', width: '', align: 'center' },
  { field: 'DEPTNAME', title: '部门', width: '', align: 'center' },
  { field: 'EMPNO', title: '职员工号', width: '', align: 'center' },
  { field: 'STAFFNAME', title: '职员姓名', width: '', align: 'center' },
  { field: 'DEPTNAME', title: '职位', width: '', align: 'center' },
  { field: 'ATT_HRS', title: '标准工时(H)', width: '', align: 'right' },
  { field: 'HRS', title: '实际工时(H)', width: '', align: 'right' },
  { field: 'BZQTY', title: '标准产能', width: '', align: 'right' },
  { field: 'RQTY', title: '实际产能', width: '', align: 'right' },
  { field: 'JDPV', title: '嫁动率', width: '', align: 'right' },
  { field: 'WCPV', title: '达成率', width: '', align: 'right' }
])

// 模拟数据
const mockData = [
  {
    company: '华夏集团',
    department: '注塑一部',
    productionLine: 'A线',
    supervisor: '王强',
    employeeId: '10001',
    employeeName: '李明',
    position: '操作工',
    standardHours: 8,
    actualHours: 7.5,
    standardCapacity: 1000,
    actualCapacity: 950,
    utilizationRate: '93%',
    achievementRate: '95%'
  },
  {
    company: '华夏集团',
    department: '注塑二部',
    productionLine: 'B线',
    supervisor: '赵敏',
    employeeId: '10002',
    employeeName: '王芳',
    position: '检验员',
    standardHours: 8,
    actualHours: 8,
    standardCapacity: 1200,
    actualCapacity: 1180,
    utilizationRate: '100%',
    achievementRate: '98%'
  },
  {
    company: '华夏集团',
    department: '注塑三部',
    productionLine: 'C线',
    supervisor: '孙伟',
    employeeId: '10003',
    employeeName: '张伟',
    position: '班长',
    standardHours: 8,
    actualHours: 7.8,
    standardCapacity: 1100,
    actualCapacity: 1050,
    utilizationRate: '97%',
    achievementRate: '95%'
  }
]

// 将模拟数据赋值给props.data（如果需要的话）
// props.data = mockData

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
