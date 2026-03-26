<template>
  <ReportTable ref="tableRef" class="h-full" footer :columns="columns" :data="props.data">
    <template #STFGNAME="{ row }">
      <el-tag :type="row.STFGNAME === '已完成' ? 'success' : 'primary'" effect="dark" round disable-transitions
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
    title: '工序编码',
    field: 'JOBNO',
    width: 80,
    align: 'center'
  },
  {
    title: '工序名称',
    field: 'CNAME',
    width: 80,
    align: 'center'
  },
  {
    title: '工厂',
    field: 'FTYNAME',
    width: 140,
    align: 'center'
  },
  {
    title: '产线',
    field: 'WCNAME',
    width: 90,
    align: 'center'
  },
  {
    title: '批号',
    field: 'ORDNO',
    width: 120,
    align: 'center'
  },
  {
    title: '加工合约',
    field: 'PMNO',
    width: 140,
    align: 'center'
  },
  {
    title: '颜色',
    field: 'CLNAME',
    width: 100,
    align: 'center'
  },
  {
    title: '状态',
    field: 'STFGNAME',
    width: 80,
    align: 'center',
    slots: { default: 'STFGNAME' }
  },
  {
    title: '总件数',
    field: 'PMQTY',
    width: 70,
    align: 'right',
    formatter: 'number',
    summary: true
  },
  {
    title: '持单数',
    field: 'CD_QTY',
    width: 70,
    align: 'right',
    formatter: 'number',
    summary: true
  },
  {
    title: '待产数',
    field: 'DC_QTY',
    width: 70,
    align: 'right',
    formatter: 'number',
    summary: true
  },
  {
    title: '生产中',
    field: 'ZC_QTY',
    width: 70,
    align: 'right',
    formatter: 'number',
    summary: true
  },
  {
    title: '已完成',
    field: 'ZC_QTY',
    width: 70,
    align: 'right',
    formatter: 'number',
    summary: true
  },
  {
    title: '估计总工时\n(小时)',
    field: 'STD_WKHRS',
    width: 80,
    align: 'right',
    formatter: 'number',
    summary: true
  },
  {
    title: '完成工时\n(小时)',
    field: 'WKHRS',
    width: 80,
    align: 'right',
    formatter: 'number',
    summary: true
  },
  {
    title: '在制品累计停留时间\n(小时)',
    field: 'PRD_WKHRS',
    width: 130,
    align: 'right',
    summary: true
  },
  {
    title: '标准效率%',
    field: 'STD_PCT',
    width: 80,
    align: 'right',
    formatter: 'percentage'
  },
  {
    title: '实际效率%',
    field: 'ACT_PCT',
    width: 80,
    align: 'right',
    formatter: 'percentage'
  }
])

const handleDetailClick = (row: any) => {
  emit('openOrder', row)
}

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
