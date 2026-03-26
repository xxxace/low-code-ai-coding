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

<script setup lang="ts">
import ReportTable, { type ReportTableColumn } from '@/components/ReportTable/index.vue'
import { ref, reactive } from 'vue'
import { getEditableTableExposeProxy } from '@/utils'

const props = withDefaults(defineProps<{ data: any[]; loading: boolean }>(), {
  data: () => []
})

const tableRef = ref<any>()
const columns = reactive<ReportTableColumn[]>([
  {
    title: '移交程序',
    field: 'JOBNAME',
    width: '',
    align: 'center'
  },
  {
    title: '批号',
    field: 'ORDNO',
    width: '',
    align: 'center'
  },
  {
    title: '订单数',
    field: 'V_SUMORDQTY',
    width: '',
    align: 'right',
    summary: true
  },
  {
    title: '发织数',
    field: 'V_SUMCUTQTY',
    width: '',
    align: 'right',
    summary: true
  },
  {
    title: '登记数',
    field: 'V_TRQTY',
    width: '',
    align: 'right',
    summary: true
  },
  {
    title: '移交数',
    field: 'V_SUMMOVEQTY',
    width: '',
    align: 'right',
    summary: true
  }
])

// 模拟数据
const mockData = []

// 将模拟数据赋值给props.data（如果需要的话）
// props.data = mockData

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
