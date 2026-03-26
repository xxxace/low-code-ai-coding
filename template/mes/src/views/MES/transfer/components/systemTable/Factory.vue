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
    title: '交货工厂',
    field: 'V_CTRPTYNAME',
    width: '',
    align: 'center'
  },
  {
    title: '发织数',
    field: 'CUTQTY',
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
    title: '交货数',
    field: 'MOVEQTY',
    width: '',
    align: 'right',
    summary: true
  },
  {
    title: '收货工厂',
    field: 'V_CLNTNAME',
    width: '',
    align: 'center'
  },
  {
    title: '收货数',
    field: 'RNQTY',
    width: '',
    align: 'right',
    summary: true
  }
])

// 模拟数据
const mockData = [
  {
    deliveryFactory: '工厂A',
    weavingCount: 150,
    registrationCount: 145,
    deliveryCount: 140,
    receivingFactory: '工厂B',
    receivingCount: 135
  },
  {
    deliveryFactory: '工厂C',
    weavingCount: 200,
    registrationCount: 195,
    deliveryCount: 190,
    receivingFactory: '工厂D',
    receivingCount: 185
  },
  {
    deliveryFactory: '工厂E',
    weavingCount: 180,
    registrationCount: 175,
    deliveryCount: 170,
    receivingFactory: '工厂F',
    receivingCount: 165
  }
]

// 将模拟数据赋值给props.data（如果需要的话）
// props.data = mockData

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
