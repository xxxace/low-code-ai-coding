<template>
  <ReportTable ref="tableRef" class="h-full" footer :columns="columns" :data="props.data">
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

const props = withDefaults(defineProps<{ data: any[] }>(), {
  data: () => []
})

const tableRef = ref<any>()
const columns = reactive<ReportTableColumn[]>([
  {
    title: '日期',
    field: 'WKDATE',
    width: '95',
    align: 'center'
  },
  {
    title: '加工合约号',
    field: 'PMNO',
    width: '',
    align: 'center'
  },
  {
    title: '生产单号',
    field: 'ORDNO',
    width: '',
    align: 'center'
  },
  {
    title: '款号',
    field: 'STYNO',
    width: '',
    align: 'center'
  },
  {
    title: '工序',
    field: 'JOBNAME',
    width: '',
    align: 'center'
  },
  {
    title: '计划数量',
    field: 'QTY',
    width: '',
    align: 'right',
    summary: false
  },
  {
    title: '完成数据',
    field: 'QTY2',
    width: '',
    align: 'right',
    summary: false
  },
  {
    title: '针种',
    field: 'EQMMOD',
    width: '',
    align: 'center'
  },
  {
    title: '机台号',
    field: 'V_MACHNUM',
    width: '',
    align: 'center'
  },
  {
    title: '片期',
    field: 'KNITDATE',
    width: '',
    align: 'center'
  },
  // {
  //   title: '优先级',
  //   field: 'priority',
  //   width: '',
  //   align: 'center'
  // },
  {
    title: '状态',
    field: 'CNAME',
    width: '',
    align: 'center'
  }
])

// 模拟数据
const mockData = [
  {
    date: '2024-01-15',
    workOrderNo: 'WO20240115001',
    contractNo: 'CT20240115001',
    productionOrderNo: 'PO20240115001',
    styleNo: 'ST001',
    process: '织造',
    colorGroup: '红色组',
    plannedQuantity: 500,
    completedQuantity: 480,
    brandNo: 'BR001',
    needleType: '12针',
    machineNo: 'M001',
    piecePeriod: 'P1',
    priority: '高',
    status: '进行中'
  },
  {
    date: '2024-01-16',
    workOrderNo: 'WO20240116001',
    contractNo: 'CT20240116001',
    productionOrderNo: 'PO20240116001',
    styleNo: 'ST002',
    process: '织造',
    colorGroup: '蓝色组',
    plannedQuantity: 600,
    completedQuantity: 580,
    brandNo: 'BR002',
    needleType: '14针',
    machineNo: 'M002',
    piecePeriod: 'P2',
    priority: '中',
    status: '已完成'
  },
  {
    date: '2024-01-17',
    workOrderNo: 'WO20240117001',
    contractNo: 'CT20240117001',
    productionOrderNo: 'PO20240117001',
    styleNo: 'ST003',
    process: '织造',
    colorGroup: '绿色组',
    plannedQuantity: 450,
    completedQuantity: 430,
    brandNo: 'BR003',
    needleType: '16针',
    machineNo: 'M003',
    piecePeriod: 'P3',
    priority: '低',
    status: '待开始'
  }
]

// 将模拟数据赋值给props.data（如果需要的话）
// props.data = mockData

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
