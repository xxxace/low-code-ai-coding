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
      title: t('gvAvailableInventory_STKNAME', '仓库'),
      field: 'STKNAME',
      width: 100,
      align: 'center'
    },
    {
      title: t('gvAvailableInventory_VAT', '缸号'),
      field: 'VAT',
      width: 100,
      align: 'center'
    },
    {
      title: t('gvAvailableInventory_SPECNO', '色号'),
      field: 'SPECNO',
      width: 100,
      align: 'left'
    },
    {
      title: t('gvAvailableInventory_QTY', '库存'),
      field: 'QTY',
      width: 90,
      align: 'right',
      headerAlign: 'center',
      formatter: 'number'
    },
    {
      title: t('gvAvailableInventory_CORPNAME', '归属公司'),
      field: 'CORPNAME',
      width: 140,
      align: 'left',
      headerAlign: 'center'
    },
    {
      title: t('gvAvailableInventory_V_ISIMPORT', '进口'),
      field: 'V_ISIMPORT',
      width: 60,
      align: 'center'
    },
    {
      title: t('gvAvailableInventory_ORDNO', '批号'),
      field: 'ORDNO',
      width: 100,
      align: 'center'
    },
    {
      title: t('gvAvailableInventory_WHDATE', '入库日期'),
      field: 'WHDATE',
      width: 90,
      align: 'center',
      formatter: 'date'
    },
    {
      title: t('gvAvailableInventory_MSCBILLRMK', '入库备注'),
      field: 'MSCBILLRMK',
      minWidth: 140,
      align: 'left',
      headerAlign: 'center'
    }
  ]
})

const handleDetailClick = (row: any) => {
  emit('openOrder', row)
}

defineExpose(getEditableTableExposeProxy(tableRef))
</script>
