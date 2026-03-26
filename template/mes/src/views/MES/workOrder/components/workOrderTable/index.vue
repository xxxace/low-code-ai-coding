<template>
  <ReportTable ref="tableRef" class="h-full" footer :columns="columns" :data="props.data" :loading="props.loading">
    <template #PSNO="{ row }">
      <el-button v-if="row.PSNO" size="small" type="primary" link @click="handleDetailClick">
        <span style="border-bottom: 1px solid">{{ row.PSNO }}</span>
      </el-button>
    </template>
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

const props = withDefaults(defineProps<{ data: any[],loading:boolean }>(), {
  data: () => [],
  loading:false
})
const emit = defineEmits(['openOrder'])
const tableRef = ref<any>()
const columns = reactive<ReportTableColumn[]>([
  { type: 'checkbox', width: 40, align: 'center', fixed: 'left' },
  {
    title: '计划号',
    field: 'TSKNO',
    width: 70,
    align: 'center',
    fixed: 'left'
  },
  {
    title: '排产日期',
    field: 'WKDATE',
    width: 83,
    align: 'center',
    fixed: 'left',
    formatter: 'date'
  },
  {
    title: '签收人',
    field: 'STAFF',
    width: 60,
    align: 'center',
    fixed: 'left'
  },
  {
    title: '签收日期',
    field: 'PSDT',
    width: 80,
    align: 'center',
    fixed: 'left',
    formatter: 'date'
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
    title: '部门',
    field: 'V_JOBNAME',
    width: 60,
    align: 'center',
    fixed: 'left'
  },
  {
    title: '车间',
    field: 'V_WCNAME',
    width: 180,
    align: 'left',
    headerAlign: 'center',
    fixed: 'left'
  },
  {
    title: '线长',
    field: 'WCBOOS',
    width: 60,
    align: 'center'
  },
  {
    title: '负荷',
    field: 'BLK_SPG',
    width: 60,
    align: 'center',
    formatter: 'percentage'
  },
  {
    title: '颜色组',
    field: 'V_CLCNAME',
    width: 80,
    align: 'center'
  },
  {
    title: '牌号范围',
    field: 'BRAND_RANGE',
    width: 80,
    align: 'center'
  },
  {
    title: '机台/人数',
    field: 'MACFPNUM',
    width: 70,
    align: 'right',
    headerAlign: 'center',
    formatter: 'number',
    summary: true
  },
  {
    title: '机台号',
    field: 'MACNUM',
    width: 90,
    align: 'center'
  },
  {
    title: '今日目标数',
    field: 'QTY',
    width: 80,
    align: 'right',
    headerAlign: 'center',
    formatter: 'number',
    summary: true
  },
  {
    title: '今日完工',
    field: 'V_TDOVQTY',
    width: 80,
    align: 'right',
    headerAlign: 'center',
    formatter: 'number',
    summary: true
  },
  {
    title: '今日完成\n进度%',
    field: 'V_TDOVPAQTY',
    width: 70,
    align: 'center',
    formatter: 'percentage'
  },
  {
    title: '持单数',
    field: 'V_NEQTY',
    width: 80,
    align: 'right',
    headerAlign: 'center',
    formatter: 'number',
    summary: true
  },
  {
    title: '累积完工',
    field: 'V_ALLOVQTY',
    width: 80,
    align: 'right',
    headerAlign: 'center',
    formatter: 'number',
    summary: true
  },
  {
    title: '总完成\n进度%',
    field: 'V_ALLOVPAQTY',
    width: 60,
    align: 'center',
    formatter: 'percentage'
  },
  {
    title: '生产\n效率%',
    field: 'V_PDEY',
    width: 60,
    align: 'center',
    formatter: 'percentage'
  },
  {
    title: '标准\n效率%',
    field: 'V_STDEY',
    width: 60,
    align: 'center',
    formatter: 'percentage'
  },
  {
    title: '消耗比例%',
    field: 'V_LOSRATIO',
    width: 60,
    align: 'center',
    formatter: 'percentage'
  },
  {
    title: '良品率%',
    field: 'V_OKRATIO',
    width: 60,
    align: 'center',
    formatter: 'percentage'
  },
  {
    title: '返工数量',
    field: 'V_REWORKQTY',
    width: 70,
    align: 'center',
    formatter: 'number'
  },
  {
    title: 'SOP',
    field: 'SOP',
    width: 80,
    align: 'center'
  },
  {
    title: '状态',
    field: 'V_STFGNAME',
    width: 70,
    align: 'center'
  }
])

const handleDetailClick = (row: any) => {
  emit('openOrder', row)
}

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
