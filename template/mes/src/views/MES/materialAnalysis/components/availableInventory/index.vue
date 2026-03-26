<template>
  <ReportTable ref="tableRef" class="h-full" :columns="columns" :data="props.data"></ReportTable>
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
      title: t('gvWoolInventoryEntry_VAT', '缸号'),
      field: 'VAT',
      width: 100,
      align: 'center',
      fixed: 'left'
    },
    {
      title: t('gvWoolInventoryEntry_WHNO', '入库单号'),
      field: 'WHNO',
      width: 100,
      align: 'center',
      fixed: 'left'
    },
    {
      title: t('gvWoolInventoryEntry_WHDATE', '入库日期'),
      field: 'WHDATE',
      width: 80,
      align: 'center',
      formatter: 'date',
      fixed: 'left'
    },
    {
      title: t('gvWoolInventoryEntry_QTY', '入库数量'),
      field: 'QTY',
      width: 90,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number',
      fixed: 'left'
    },
    {
      title: t('gvWoolInventoryEntry_RMK', '入库备注'),
      field: 'RMK',
      width: 90,
      align: 'left',
      headerAlign: 'center'
    },
    {
      title: t('gvWoolInventoryEntry_FIRST_RSQTY', '预留'),
      field: 'FIRST_RSQTY',
      width: 90,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvWoolInventoryEntry_V_PLQTY', '发料'),
      field: 'V_PLQTY',
      width: 90,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvWoolInventoryEntry_V_PO_ORDNO', '领料批号'),
      field: 'V_PO_ORDNO',
      minWidth: 100,
      headerAlign: 'center'
    }
  ]
})

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
