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
    title: '物料编码',
    field: 'MATNO',
    width: '',
    align: 'center'
  },
  {
    title: '物料名称',
    field: 'MATNAME',
    width: '',
    align: 'center'
  },
  {
    title: '色号',
    field: 'SPECNO',
    width: '',
    align: 'center'
  },
  {
    title: '色名',
    field: 'SPECNAME',
    width: '',
    align: 'center'
  },
  {
    title: '缸号',
    field: 'VAT',
    width: '',
    align: 'center'
  },
  {
    title: '需要料数(磅)',
    field: 'QTY',
    width: '',
    align: 'right',
    summary: false
  },
  {
    title: '收料数(磅)',
    field: 'V_RMQTY',
    width: '',
    align: 'right',
    summary: false
  },
  {
    title: '发料人',
    field: 'V_OSUSER',
    width: '',
    align: 'center'
  },
  {
    title: '发料日期',
    field: 'V_OSDT',
    width: '',
    align: 'center'
  },
  {
    title: '收料日期',
    field: 'V_RMDT',
    width: '',
    align: 'center'
  }
])

// 模拟数据
const mockData = [
  {
    materialCode: 'MT001',
    materialName: '棉纱',
    colorCode: 'C001',
    colorName: '红色',
    vatNo: 'V001',
    requiredWeight: 500,
    receivedWeight: 480,
    issuer: '张三',
    issueDate: '2024-01-15',
    receiveDate: '2024-01-16'
  },
  {
    materialCode: 'MT002',
    materialName: '涤纶丝',
    colorCode: 'C002',
    colorName: '蓝色',
    vatNo: 'V002',
    requiredWeight: 600,
    receivedWeight: 580,
    issuer: '李四',
    issueDate: '2024-01-18',
    receiveDate: '2024-01-19'
  },
  {
    materialCode: 'MT003',
    materialName: '尼龙线',
    colorCode: 'C003',
    colorName: '绿色',
    vatNo: 'V003',
    requiredWeight: 450,
    receivedWeight: 430,
    issuer: '王五',
    issueDate: '2024-01-20',
    receiveDate: '2024-01-21'
  }
]

// 将模拟数据赋值给props.data（如果需要的话）
// props.data = mockData

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
