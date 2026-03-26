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
  { title: '批号', field: 'ORDNO', align: 'center', width: '' },
  { title: '加工合约', field: 'PMNO', align: 'center', width: '130' },
  { title: '款号', field: 'styleNo', align: 'center', width: '' },
  { title: '客户', field: 'CLNTNAME', align: 'center', width: '' },
  { title: '工序', field: 'JOBNAME', align: 'center', width: '70' },
  { title: '针种', field: 'EQMMOD', align: 'center', width: '' },
  { title: '产线', field: 'WCNAME', align: 'center', width: '' },
  { title: '负荷', field: 'RLOAD', align: 'center', width: '' },
  { title: '片期', field: 'PDATE', align: 'center', width: '' },
  { title: '计划开始时间', field: 'MIN_WKDATE', align: 'center', width: '100' },
  { title: '计划完成时间', field: 'MAN_WKDATE', align: 'center', width: '100' },
  { title: '计划数(件)', field: 'QTY', align: 'right', width: '' },
  { title: '完工数(件)', field: 'WIP_QTY', align: 'right', width: '' }
])

// 模拟数据
const mockData = []

// 将模拟数据赋值给props.data（如果需要的话）
// props.data = mockData

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
