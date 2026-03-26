<template>
  <ReportTable ref="tableRef" class="h-full" :columns="columns" :data="props.data"></ReportTable>
</template>

<script setup lang="ts">
import ReportTable, { type ReportTableColumn } from '@/components/ReportTable/index.vue'
import { ref } from 'vue'
import { getEditableTableExposeProxy } from '@/utils'
import { createI18nReactive } from '@/hooks/nameson/useI18nReactive'

const props = withDefaults(defineProps<{ data: any[] }>(), {
  data: () => []
})

const i18nReactive = createI18nReactive('VUE_MES_QT')
const emit = defineEmits(['openOrder'])
const tableRef = ref<any>()
const columns = i18nReactive<ReportTableColumn[]>(({ t }) => {
  return [
    // { type: 'checkbox', width: 40, align: 'center', fixed: 'left' },
    {
      title: t('gvRedinessEntry_ORDNO', '批号'),
      field: 'ORDNO',
      width: 100,
      align: 'center',
      fixed: 'left'
    },
    {
      title: t('gvRedinessEntry_STYNO', '款式'),
      field: 'STYNO',
      width: 100,
      align: 'center',
      fixed: 'left'
    },
    {
      title: t('gvRedinessEntry_V_ORIGIN', '产地'),
      field: 'V_ORIGIN',
      width: 60,
      align: 'center'
    },
    {
      title: t('gvRedinessEntry_V_CLNT', '客户'),
      field: 'V_CLNT',
      minWidth: 100,
      align: 'left',
      headerAlign: 'center'
    },
    {
      title: t('gvRedinessEntry_V_CLNTFTYNO', '工厂'),
      field: 'V_CLNTFTYNO',
      width: 100,
      align: 'left',
      headerAlign: 'center'
    },
    {
      title: t('gvRedinessEntry_V_STKOG', '仓库'),
      field: 'V_STKOG',
      width: 90,
      align: 'center'
    },
    {
      title: t('gvRedinessEntry_V_CLNTDTTO', '货期'),
      field: 'V_CLNTDTTO',
      width: 90,
      align: 'center',
      formatter: 'date'
    },
    {
      title: t('gvRedinessEntry_QTY', '数量'),
      field: 'QTY',
      width: 80,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvRedinessEntry_V_PRI', '排产优先级'),
      field: 'V_PRI',
      width: 90,
      align: 'center'
    },
    {
      title: t('gvRedinessEntry_V_PQTY', '排产数'),
      field: 'V_PQTY',
      width: 80,
      align: 'center',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvRedinessEntry_V_QT1', '齐套率1'),
      field: 'V_QT1',
      width: 80,
      align: 'center',
      headerAlign: 'center',
      formatter: 'percentage'
    },
    {
      title: t('gvRedinessEntry_V_QT2', '齐套率2'),
      field: 'V_QT2',
      width: 80,
      align: 'center',
      headerAlign: 'center',
      formatter: 'percentage'
    },
    {
      title: t('gvRedinessEntry_V_QT3', '估计排产数'),
      field: 'V_QT3',
      width: 80,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvRedinessEntry_V_QT4', '已排产数'),
      field: 'V_QT4',
      width: 80,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    }
  ]
})

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
