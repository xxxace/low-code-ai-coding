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
        style="color: #fff"
        round
      >
        <span>{{ row.completionRate }}%</span>
      </el-tag>
      <!-- <span v-else>--</span> -->
    </template>
    <template #defectRate="{ row }">
      <el-tag
        :type="row.defectRate <= 2 ? 'success' : row.defectRate <= 5 ? 'warning' : 'danger'"
        effect="dark"
        style="color: #fff"
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

const props = withDefaults(
  defineProps<{
    data: any[]
    loading: true
  }>(),
  {
    data: () => []
  }
)

const tableRef = ref<any>()
const columns = reactive<ReportTableColumn[]>([
  { type: 'checkbox', width: 40, align: 'center', fixed: 'left' },
  {
    title: '加工合约',
    field: 'PMNO',
    width: 120,
    align: 'center',
    fixed: 'left'
  },
  {
    title: '批号',
    field: 'ORDNO',
    width: 90,
    align: 'center',
    fixed: 'left'
  },
  {
    title: '款号',
    field: 'STYNO',
    width: 90,
    align: 'center',
    fixed: 'left'
  },
  {
    title: '工厂',
    field: 'V_FTYNAME',
    width: 125,
    align: 'center',
    fixed: 'left'
  },
  {
    title: '部门',
    field: 'V_DEPTNAME',
    width: 75,
    align: 'center',
    fixed: 'left'
  },
  {
    title: '工序',
    field: 'JOBNAME',
    width: 50,
    align: 'center',
    fixed: 'left'
  },
  {
    title: '产线',
    field: 'WCNAME',
    width: 100,
    align: 'left',
    fixed: 'left'
  },
  {
    title: '排产日期',
    field: 'WKDATE',
    width: 90,
    align: 'right',
    fixed: 'left'
  },
  {
    title: '设备工时（H）',
    field: 'EQM_HRS',
    width: 100,
    headerAlign: 'center',
    formatter: 'number'
  },
  {
    title: '异常工时(H)',
    field: 'EQMERR_HRS',
    width: 90,
    align: 'right',
    headerAlign: 'center',
    formatter: 'number'
  },
  {
    title: '标准人数',
    field: 'PEQTY',
    width: 80,
    align: 'right',
    headerAlign: 'center',
    formatter: 'number'
  },
  {
    title: '标准工时(H)',
    field: 'STD_HRS',
    width: 90,
    align: 'right',
    headerAlign: 'center',
    formatter: 'number'
  },
  {
    title: '实际工时(H)',
    field: 'WIP_WKHRS',
    width: 90,
    align: 'right',
    headerAlign: 'center',
    formatter: 'number'
  },
  {
    title: '标准产出',
    field: 'QTY',
    width: 80,
    align: 'right',
    headerAlign: 'center',
    formatter: 'number',
    summary: true
  },
  {
    title: '实际产出',
    field: 'WIP_QTY',
    width: 80,
    align: 'right',
    headerAlign: 'center',
    formatter: 'number',
    summary: true
  },
  {
    title: '达成率',
    field: 'PCT1',
    width: 80,
    align: 'center',
    slots: { default: 'completionRate' }
  },
  {
    title: '不良数量',
    field: 'WIP_BADQTY',
    width: 80,
    align: 'right',
    headerAlign: 'center',
    formatter: 'number'
  },
  {
    title: '不良率',
    field: 'PCT2',
    width: 80,
    align: 'center',
    slots: { default: 'defectRate' }
  }
])

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
