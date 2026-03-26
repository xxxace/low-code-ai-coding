<template>
  <ReportTable ref="tableRef" class="h-full" :columns="columns" :data="props.data"> </ReportTable>
</template>

<script setup lang="ts">
import ReportTable, { type ReportTableColumn } from '@/components/ReportTable/index.vue'
import { ref } from 'vue'
import { getEditableTableExposeProxy } from '@/utils'
import { createI18nReactive } from '@/hooks/nameson/useI18nReactive.ts'

const props = withDefaults(defineProps<{ data: any[] }>(), {
  data: () => []
})
const i18nReactive = createI18nReactive('VUE_MES_QT')
const emit = defineEmits(['openOrder'])
const tableRef = ref<any>()
const columns = i18nReactive<ReportTableColumn[]>(({ t }) => {
  return [
    {
      title: t('gvColor_V_CL', '颜色组'),
      field: 'V_CL',
      width: 90,
      align: 'center'
    },
    {
      title: t('gvColor_V_MTCH', '排色'),
      field: 'V_MTCH',
      width: 90,
      align: 'center',
      headerAlign: 'center'
    },
    {
      title: t('gvColor_YRNCNT', '支数'),
      field: 'YRNCNT',
      width: 90,
      align: 'center'
    },
    {
      title: t('gvColor_V_MATNAME', '成份'),
      field: 'V_MATNAME',
      width: 120,
      align: 'left',
      headerAlign: 'center'
    },
    {
      title: t('gvColor_SPECNO', '色号'),
      field: 'SPECNO',
      width: 90,
      align: 'left',
      headerAlign: 'center'
    },
    {
      title: t('gvColor_V_SPECNAME', '色名'),
      field: 'V_SPECNAME',
      width: 90,
      align: 'left',
      headerAlign: 'center'
    },
    {
      title: t('gvColor_STDWT', '用量'),
      field: 'STDWT',
      width: 90,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvColor_V_STDUNIT', '单位'),
      field: 'V_STDUNIT',
      width: 90,
      align: 'center'
    },
    {
      title: t('gvColor_WST', '损耗'),
      field: 'WST',
      width: 90,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvColor_QTY', '件数'),
      field: 'QTY',
      width: 90,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvColor_V_OWNQTY', '总需求量'),
      field: 'V_OWNQTY',
      width: 90,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvColor_REQDTTM', '需求日期'),
      field: 'REQDTTM',
      width: 90,
      align: 'center',
      formatter: 'date'
    },
    {
      title: t('gvColor_YRSQTY', '预留数'),
      field: 'YRSQTY',
      width: 90,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvColor_OSQTY', '发料'),
      field: 'OSQTY',
      width: 90,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvColor_QTRATE', '齐套%'),
      field: 'QTRATE',
      width: 60,
      align: 'right',
      headerAlign: 'center',
      formatter: 'percentage'
    },
    {
      title: t('gvColor_V_SQTY', '欠数'),
      field: 'V_SQTY',
      width: 90,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvColor_WHQTY', '可利用库存'),
      field: 'WHQTY',
      width: 90,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvColor_WHRSQTY', '可借调数'),
      field: 'WHRSQTY',
      width: 90,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvColor_WHORDNO', '可借调批号'),
      field: 'WHORDNO',
      width: 190,
      align: 'left',
      headerAlign: 'center'
    }
  ]
})

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
