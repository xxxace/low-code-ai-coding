<template>
  <ReportTable ref="tableRef" class="h-full" footer :columns="columns" :data="props.data">
    <template #STFGNAME="{ row }">
      <el-tag :type="row.STFGNAME === '已完成' ? 'success' : 'primary'" effect="dark" round
        >{{ row.STFGNAME }}
      </el-tag>
    </template>
  </ReportTable>
</template>

<script setup lang="ts">
import ReportTable, { type ReportTableColumn } from '@/components/ReportTable/index.vue'
import { ref, reactive } from 'vue'
import { getEditableTableExposeProxy } from '@/utils'

const props = withDefaults(defineProps<{ data: any[] }>(), {
  data: () => []
})
const emit = defineEmits(['openOrder'])
const tableRef = ref<any>()
const columns = reactive<ReportTableColumn[]>([
  {
    title: '物料编码',
    field: 'V_MATNO',
    width: 90,
    align: 'center'
  },
  {
    title: '物料名称',
    field: 'V_MATNAME',
    width: 400,
    align: 'left',
    headerAlign: 'center'
  },
  {
    title: '色号',
    field: 'V_SPECNO',
    width: 90,
    align: 'center'
  },
  {
    title: '色名',
    field: 'V_CNAME',
    width: 90,
    align: 'center'
  },
  {
    title: '缸号',
    field: 'V_VAT',
    width: 90,
    align: 'center'
  },
  {
    title: '收料数',
    field: 'V_INQTY',
    width: 90,
    align: 'right',
    headerAlign: 'center',
    formatter: 'number',
    summary: true
  },
  {
    title: '需求数',
    field: 'QTY',
    width: 90,
    align: 'right',
    headerAlign: 'center',
    formatter: 'number',
    summary: true
  },
  {
    title: '发料数',
    field: 'OSQTY',
    width: 90,
    align: 'right',
    headerAlign: 'center',
    formatter: 'number',
    summary: true
  },
  {
    title: '耗用数',
    field: 'WST',
    width: 90,
    align: 'right',
    headerAlign: 'center',
    formatter: 'number',
    summary: true
  },
  {
    title: '剩余数',
    field: 'V_OTQTY',
    width: 90,
    align: 'right',
    headerAlign: 'center',
    formatter: 'number',
    summary: true
  },
  {
    title: '消耗比例%',
    field: 'V_PST',
    width: 90,
    align: 'right',
    headerAlign: 'center',
    formatter: 'percentage'
  }
])

const handleDetailClick = (row: any) => {
  emit('openOrder', row)
}

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
