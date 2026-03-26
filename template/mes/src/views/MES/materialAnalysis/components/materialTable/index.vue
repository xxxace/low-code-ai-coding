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
      title: t('gvWoolPurchaseEntry_PONO', '采购合同'),
      field: 'PONO',
      width: 100,
      align: 'center',
      fixed: 'left'
    },
    {
      title: t('gvWoolPurchaseEntry_QTY', '采购数量'),
      field: 'QTY',
      width: 90,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number',
      fixed: 'left'
    },
    {
      title: t('gvWoolPurchaseEntry_V_ORDNO', '申购批号'),
      field: 'V_ORDNO',
      width: 160,
      headerAlign: 'center'
    },
    {
      title: t('gvWoolPurchaseEntry_DELYDATE', '合同交期'),
      field: 'DELYDATE',
      width: 80,
      align: 'center',
      headerAlign: 'center',
      formatter: 'date'
    },
    {
      title: t('gvWoolPurchaseEntry_DELYDATE2', '供应商复期'),
      field: 'DELYDATE2',
      width: 80,
      align: 'center',
      headerAlign: 'center',
      formatter: 'date'
    },
    {
      title: t('gvWoolPurchaseEntry_V_WQTY', '交货数量'),
      field: 'V_WQTY',
      width: 90,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvWoolPurchaseEntry_V_QSQTY', '欠数'),
      field: 'V_QSQTY',
      width: 90,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number',
      className: ({ row, column }) => {
        if (row[column.field] < 0) {
          return 'red-text'
        }
        return ''
      }
    },
    {
      title: t('gvWoolPurchaseEntry_V_QSQTY', '交货进度%'),
      field: 'V_QSQTY',
      width: 90,
      align: 'right',
      headerAlign: 'center',
      formatter: 'percentage'
    },
    {
      title: t('gvWoolPurchaseEntry_RMK', '备注'),
      field: 'RMK',
      minWidth: 90,
      align: 'left',
      headerAlign: 'center'
    }
  ]
})

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
