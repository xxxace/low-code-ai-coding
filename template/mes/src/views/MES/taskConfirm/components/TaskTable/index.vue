<template>
  <ReportTable ref="tableRef" class="h-full" :columns="columns" :data="props.data"> </ReportTable>
</template>

<script setup lang="ts">
import ReportTable, { type ReportTableColumn } from '@/components/ReportTable/index.vue'
import { ref } from 'vue'
import { getEditableTableExposeProxy } from '@/utils'
import { createI18nReactive } from '@/hooks/nameson/useI18nReactive'

const props = withDefaults(defineProps<{ data: any[] }>(), {
  data: () => []
})

const i18nReactive = createI18nReactive('VUE_MES_PSTASK')
const tableRef = ref<any>()
const columns = i18nReactive<ReportTableColumn[]>(({ t }) => {
  return [
    { type: 'checkbox', width: 40, align: 'center', fixed: 'left' },
    {
      title: t('gvTask_TSKNO', '计划号'),
      field: 'TSKNO',
      width: 70,
      align: 'center',
      fixed: 'left'
    },
    {
      title: t('gvTask_PRI', '系统优先级'),
      field: 'PRI',
      width: 78,
      align: 'center',
      fixed: 'left'
    },
    {
      title: t('gvTask_PRIREV', '优先级'),
      field: 'PRIREV',
      width: 60,
      align: 'center',
      fixed: 'left'
    },
    {
      title: t('gvTask_YRWEEK', '计划周期'),
      field: 'YRWEEK',
      width: 70,
      align: 'center',
      fixed: 'left'
    },
    {
      title: t('gvTask_STYNO', '款号'),
      field: 'STYNO',
      width: 80,
      align: 'center',
      fixed: 'left'
    },
    {
      title: t('gvTask_PMNO', '合约号'),
      field: 'PMNO',
      width: 110,
      align: 'center',
      fixed: 'left'
    },
    {
      title: t('gvTask_JOBNAME', '工序'),
      field: 'JOBNAME',
      width: 80,
      align: 'center',
      fixed: 'left'
    },
    {
      title: t('gvTask_WCNAME', '产线'),
      field: 'WCNAME',
      width: 90,
      align: 'center'
    },
    {
      title: t('gvTask_TEAMNAME', '线长/带班长'),
      field: 'TEAMNAME',
      width: 90,
      align: 'center'
    },
    {
      title: t('gvTask_PCT', '负荷'),
      field: 'PCT',
      width: 60,
      align: 'center',
      formatter: 'percentage'
    },
    {
      title: t('gvTask_PCT', '齐毛率'),
      field: 'PCT2',
      width: 60,
      align: 'center'
    },
    {
      title: t('gvTask_PCT', 'SOP'),
      field: 'PCT3',
      width: 90,
      align: 'center'
    },
    {
      title: t('gvTask_PCT', '负荷'),
      field: 'PCT',
      width: 60,
      align: 'center',
      formatter: 'percentage'
    },
    {
      title: t('gvTask_QTY', '计划数量'),
      field: 'QTY',
      width: 80,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvTask_WIPQTY', '累计收货'),
      field: 'WIPQTY',
      width: 80,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvTask_PRD_PCT', '生产进度'),
      field: 'PRD_PCT',
      width: 70,
      align: 'right',
      headerAlign: 'center',
      formatter: 'percentage'
    },
    {
      title: t('gvTask_PSQTY_W', '本周目标'),
      field: 'PSQTY_W',
      width: 80,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvTask_WIPQTY_W', '本周完工'),
      field: 'WIPQTY_W',
      width: 70,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvTask_ACT_PCT', '实际生产速度分钟/件'),
      field: 'ACT_PCT',
      width: 90,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvTask_STD_PCT', '标准生产速度分钟/件'),
      field: 'STD_PCT',
      width: 90,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvTask_WKNUM', '机台/人数'),
      field: 'WKNUM',
      width: 70,
      align: 'right',
      headerAlign: 'center'
    },
    {
      title: t('gvTask_WKNUM_STR', '机台号'),
      field: 'WKNUM_STR',
      width: 70,
      align: 'center'
    },
    {
      title: t('gvTask_MIN_WKDATE', '计划开工日期'),
      field: 'MIN_WKDATE',
      width: 90,
      align: 'center',
      formatter: 'date'
    },
    {
      title: t('gvTask_MAX_WKDATE', '计划完工日期'),
      field: 'MAX_WKDATE',
      width: 90,
      align: 'center',
      formatter: 'date'
    },
    {
      title: t('gvTask_STFGNAME', '状态'),
      field: 'STFGNAME',
      width: 60,
      align: 'center'
    },
    {
      title: t('gvTask_RMK', '备注'),
      field: 'RMK',
      width: 180,
      align: 'left',
      headerAlign: 'center'
    }
  ]
})

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
